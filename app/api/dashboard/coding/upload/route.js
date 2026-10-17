import { NextResponse } from 'next/server';
import { isAuthenticated } from '../../../../../lib/dashboard-auth';
import { getProgram } from '../../../../../lib/coding-profiles/programs';
import { parseCapture, buildSnapshot } from '../../../../../lib/coding-profiles/ingest';
import {
    getRoster,
    getCurrentSnapshot,
    commitSnapshot,
    recordAudit,
    collections
} from '../../../../../lib/coding-profiles/store';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';
export const maxDuration = 30;

/**
 * Vercel rejects bodies over ~4.5 MB at the edge before a handler ever runs, so a
 * guard above that figure would never fire. 4 MB sits just under it; the real export
 * is 84 KB, so this only ever catches someone uploading the wrong kind of file.
 */
const MAX_BYTES = 4 * 1024 * 1024;

/**
 * Reads the capture date out of the bot's filename
 * (Coding_Profiles_Final_2026-10-15.csv). Falls back to "now" — the date only drives
 * the "data as of" chip and snapshot ordering, so a missing one is not fatal, but a
 * wrong one would silently mis-order history.
 */
function capturedAtFromFilename(filename) {
    const match = /(\d{4})-(\d{2})-(\d{2})/.exec(filename || '');
    if (!match) return { capturedAt: new Date(), inferred: false };
    const [, y, m, d] = match;
    const parsed = new Date(Date.UTC(Number(y), Number(m) - 1, Number(d), 12));
    return Number.isNaN(parsed.getTime())
        ? { capturedAt: new Date(), inferred: false }
        : { capturedAt: parsed, inferred: true };
}

/**
 * Upload a coding-profile capture.
 *
 * `?dryRun=1` parses, joins, scores and returns the preview WITHOUT persisting
 * anything. The admin reviews it and posts again to commit. The two-phase gate is not
 * ceremony: on this dataset a half-broken scraper is visually indistinguishable from
 * the truth — 40 students legitimately score zero and 13 columns are legitimately
 * empty — so there is no eyeball check, only the regression guard.
 */
export async function POST(request) {
    if (!isAuthenticated(request)) {
        return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });
    }

    // Cheap CSRF guard: a mutation must come from this site, not a page that merely
    // happens to carry the cookie.
    const origin = request.headers.get('origin');
    if (origin && new URL(origin).host !== request.headers.get('host')) {
        return NextResponse.json({ success: false, message: 'Bad origin.' }, { status: 403 });
    }

    const dryRun = request.nextUrl.searchParams.get('dryRun') === '1';
    const force = request.nextUrl.searchParams.get('force') === '1';

    let form;
    try {
        form = await request.formData();
    } catch {
        return NextResponse.json({ success: false, message: 'Expected a file upload.' }, { status: 400 });
    }

    const file = form.get('file');
    const programCode = String(form.get('program') || '');
    const program = getProgram(programCode);

    if (!program?.available) {
        return NextResponse.json({ success: false, message: 'Unknown or inactive program.' }, { status: 404 });
    }
    if (!file || typeof file.arrayBuffer !== 'function') {
        return NextResponse.json({ success: false, message: 'No file received.' }, { status: 400 });
    }
    if (file.size > MAX_BYTES) {
        return NextResponse.json(
            { success: false, message: `That file is ${(file.size / 1048576).toFixed(1)} MB. The limit is 4 MB.` },
            { status: 413 }
        );
    }

    const filename = file.name || 'capture.csv';
    if (!/\.(csv|xlsx?)$/i.test(filename)) {
        return NextResponse.json(
            { success: false, message: 'Expected a .csv or .xlsx file.' },
            { status: 415 }
        );
    }

    const buffer = Buffer.from(await file.arrayBuffer());

    let roster;
    let current;
    try {
        [roster, current] = await Promise.all([getRoster(program.code), getCurrentSnapshot(program.code)]);
    } catch (error) {
        console.error('[coding/upload] database unreachable:', error);
        return NextResponse.json({ success: false, message: 'Database unreachable.' }, { status: 503 });
    }

    if (!roster.length) {
        return NextResponse.json(
            {
                success: false,
                code: 'no_roster',
                message:
                    'No roster loaded for this program yet. Upload the batch allocation workbook first — the capture has no batch information of its own.'
            },
            { status: 409 }
        );
    }

    let capture;
    try {
        capture = await parseCapture(buffer, filename);
    } catch (error) {
        return NextResponse.json({ success: false, message: error.message }, { status: 422 });
    }

    // Byte-identical re-upload: report when it was first taken rather than quietly
    // stacking a duplicate snapshot.
    if (current?.sha256 === capture.sha256) {
        return NextResponse.json(
            {
                success: false,
                code: 'duplicate',
                message: `This exact file is already the live snapshot (uploaded ${new Date(current.uploadedAt).toLocaleString('en-IN')}).`
            },
            { status: 409 }
        );
    }

    const { capturedAt, inferred } = capturedAtFromFilename(filename);
    const { snapshot, preview } = buildSnapshot({
        capture,
        roster,
        program,
        capturedAt,
        previous: current
    });

    const notes = [];
    if (!inferred) {
        notes.push({
            code: 'no_date',
            message: `No date in the filename, so this is dated today. Rename it like Coding_Profiles_Final_${new Date().toISOString().slice(0, 10)}.csv to record the real capture date.`
        });
    }
    if (current && capturedAt < new Date(current.capturedAt)) {
        preview.blockers.push({
            code: 'older_capture',
            message: `This capture (${capturedAt.toDateString()}) is older than the live snapshot (${new Date(current.capturedAt).toDateString()}). Committing it would move the dashboard backwards.`
        });
    }

    const report = { ...preview, notes, sha256: capture.sha256 };

    if (dryRun) {
        return NextResponse.json({ success: true, dryRun: true, preview: report });
    }

    if (report.blockers.length && !force) {
        return NextResponse.json(
            { success: false, code: 'blocked', message: 'This upload was blocked.', preview: report },
            { status: 409 }
        );
    }

    try {
        const committed = await commitSnapshot(program.code, snapshot);
        await recordAudit({
            programCode: program.code,
            action: 'snapshot.commit',
            filename,
            sha256: capture.sha256,
            capturedAt,
            rowCount: capture.rows.length,
            matched: report.matched,
            forced: Boolean(report.blockers.length && force),
            blockers: report.blockers.map((b) => b.code)
        });
        return NextResponse.json({
            success: true,
            snapshotId: String(committed._id),
            preview: report
        });
    } catch (error) {
        // The unique {programCode, sha256} index is the backstop for a double-submit
        // that slipped past the isCurrent check above.
        if (error?.code === 11000) {
            return NextResponse.json(
                { success: false, code: 'duplicate', message: 'This file has already been uploaded.' },
                { status: 409 }
            );
        }
        console.error('[coding/upload] commit failed:', error);
        return NextResponse.json({ success: false, message: 'Could not save the snapshot.' }, { status: 500 });
    }
}

/** Upload history, for the panel that lists past captures and offers rollback. */
export async function GET(request) {
    if (!isAuthenticated(request)) {
        return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });
    }
    const program = getProgram(request.nextUrl.searchParams.get('program'));
    if (!program) {
        return NextResponse.json({ success: false, message: 'Unknown program.' }, { status: 404 });
    }
    try {
        const { snapshots } = await collections();
        const history = await snapshots
            .find({ programCode: program.code }, { projection: { rows: 0, unmatched: 0, coverage: 0 } })
            .sort({ capturedAt: -1 })
            .limit(20)
            .toArray();
        return NextResponse.json({
            success: true,
            history: history.map((h) => ({
                id: String(h._id),
                capturedAt: h.capturedAt,
                uploadedAt: h.uploadedAt,
                filename: h.filename,
                rowCount: h.rowCount,
                isCurrent: Boolean(h.isCurrent),
                summary: h.summary
            }))
        });
    } catch (error) {
        console.error('[coding/upload] history failed:', error);
        return NextResponse.json({ success: false, message: 'Database unreachable.' }, { status: 503 });
    }
}
