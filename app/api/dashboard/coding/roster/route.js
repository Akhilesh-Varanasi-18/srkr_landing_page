import { NextResponse } from 'next/server';
import { isAuthenticated } from '../../../../../lib/dashboard-auth';
import { getProgram } from '../../../../../lib/coding-profiles/programs';
import { parseRoster } from '../../../../../lib/coding-profiles/ingest';
import { getRoster, replaceRoster, recordAudit } from '../../../../../lib/coding-profiles/store';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';
export const maxDuration = 30;

const MAX_BYTES = 4 * 1024 * 1024;

/**
 * Upload the batch allocation workbook.
 *
 * This is the half of the picture the bot never provides. The capture carries roll
 * numbers and metrics; batch, name, gender and branch live only here. Uploaded rarely
 * — when allocations change — and deliberately kept as its own lifecycle so that
 * re-uploading it re-buckets every historical snapshot without touching snapshot data.
 *
 * Mobile numbers and email addresses present in the sheet are parsed past and never
 * stored: this dashboard never displays them, and keeping them out of a second store
 * is the cheapest way to honour the project's rule about student exports.
 */
export async function POST(request) {
    if (!isAuthenticated(request)) {
        return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });
    }

    const origin = request.headers.get('origin');
    if (origin && new URL(origin).host !== request.headers.get('host')) {
        return NextResponse.json({ success: false, message: 'Bad origin.' }, { status: 403 });
    }

    const dryRun = request.nextUrl.searchParams.get('dryRun') === '1';
    const prune = request.nextUrl.searchParams.get('prune') === '1';

    let form;
    try {
        form = await request.formData();
    } catch {
        return NextResponse.json({ success: false, message: 'Expected a file upload.' }, { status: 400 });
    }

    const file = form.get('file');
    const program = getProgram(String(form.get('program') || ''));

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
    if (!/\.xlsx?$/i.test(file.name || '')) {
        return NextResponse.json(
            { success: false, message: 'The batch allocation roster must be an .xlsx workbook.' },
            { status: 415 }
        );
    }

    const buffer = Buffer.from(await file.arrayBuffer());

    let parsed;
    try {
        parsed = await parseRoster(buffer, { preferredSheet: program.rosterSheet });
    } catch (error) {
        return NextResponse.json({ success: false, message: error.message }, { status: 422 });
    }

    let existing;
    try {
        existing = await getRoster(program.code);
    } catch (error) {
        console.error('[coding/roster] database unreachable:', error);
        return NextResponse.json({ success: false, message: 'Database unreachable.' }, { status: 503 });
    }

    const existingByKey = new Map(existing.map((s) => [s.rollKey, s]));
    const incomingKeys = new Set(parsed.students.map((s) => s.rollKey));

    const added = parsed.students.filter((s) => !existingByKey.has(s.rollKey));
    const removed = existing.filter((s) => !incomingKeys.has(s.rollKey));
    const batchChanges = parsed.students
        .filter((s) => {
            const before = existingByKey.get(s.rollKey);
            return before && before.batch !== s.batch;
        })
        .map((s) => ({
            rollNo: s.rollNo,
            name: s.name,
            from: existingByKey.get(s.rollKey).batch,
            to: s.batch
        }));

    const byBatch = {};
    for (const student of parsed.students) {
        byBatch[student.batch || 'Unassigned'] = (byBatch[student.batch || 'Unassigned'] || 0) + 1;
    }

    const warnings = [];
    const unknownBatches = Object.keys(byBatch).filter(
        (b) => b !== 'Unassigned' && !program.batches.includes(b)
    );
    if (unknownBatches.length) {
        warnings.push({
            code: 'unknown_batch',
            message: `Batch label(s) not in this program's configuration: ${unknownBatches.join(', ')}. Students in them will not appear under any batch filter.`
        });
    }
    if (byBatch.Unassigned) {
        warnings.push({
            code: 'no_batch',
            message: `${byBatch.Unassigned} student(s) have no batch value.`
        });
    }
    const missingGender = parsed.students.filter((s) => !s.gender).length;
    if (missingGender) {
        warnings.push({
            code: 'no_gender',
            message: `${missingGender} student(s) have no gender value; they get the neutral avatar.`
        });
    }
    if (removed.length && !prune) {
        warnings.push({
            code: 'orphans',
            message: `${removed.length} student(s) currently on the roster are absent from this workbook. They are kept unless you choose to remove them.`,
            detail: removed.slice(0, 12).map((s) => `${s.rollNo} (${s.name})`)
        });
    }

    const preview = {
        sheetName: parsed.sheetName,
        parsed: parsed.students.length,
        existing: existing.length,
        added: added.length,
        removed: removed.length,
        batchChanges,
        byBatch,
        warnings,
        blankRows: parsed.blankRows,
        sample: parsed.students.slice(0, 5).map((s) => ({
            rollNo: s.rollNo,
            name: s.name,
            batch: s.batch,
            branch: s.branch,
            gender: s.gender
        }))
    };

    if (dryRun) {
        return NextResponse.json({ success: true, dryRun: true, preview });
    }

    try {
        const result = await replaceRoster(program.code, parsed.students, { prune });
        await recordAudit({
            programCode: program.code,
            action: 'roster.replace',
            filename: file.name,
            sheetName: parsed.sheetName,
            parsed: parsed.students.length,
            added: added.length,
            removedKept: prune ? 0 : removed.length,
            pruned: result.pruned,
            batchChanges
        });
        return NextResponse.json({ success: true, result, preview });
    } catch (error) {
        console.error('[coding/roster] save failed:', error);
        return NextResponse.json({ success: false, message: 'Could not save the roster.' }, { status: 500 });
    }
}
