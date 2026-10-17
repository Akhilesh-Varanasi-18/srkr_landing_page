import { NextResponse } from 'next/server';
import { isAuthenticated } from '../../../../../lib/dashboard-auth';
import { getProgram, availablePrograms, resolveBatch, ALL_BATCHES } from '../../../../../lib/coding-profiles/programs';
import {
    getRoster,
    getCurrentSnapshot,
    getPreviousSnapshot,
    listSnapshots
} from '../../../../../lib/coding-profiles/store';
import { summarise } from '../../../../../lib/coding-profiles/score';
import { buildCohort, scopeStudents, batchCounts } from '../../../../../lib/coding-profiles/cohort';
import { podiumFor } from '../../../../../lib/coding-profiles/boards';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

/**
 * Everything the leaderboard needs for one scope (all students, or one batch) —
 * except the student cards, which /students pages on demand.
 *
 * The podium, the KPI figures and the per-batch summaries are computed over the
 * FULL population here, so the client can page the directory ten at a time and
 * every rank and count on screen still describes the whole cohort.
 */
export async function GET(request) {
    if (!isAuthenticated(request)) {
        return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });
    }

    const params = request.nextUrl.searchParams;
    const program = getProgram(params.get('program'));

    if (!program) {
        return NextResponse.json(
            { success: false, message: 'Unknown program.', programs: availablePrograms() },
            { status: 404 }
        );
    }
    if (!program.available) {
        return NextResponse.json(
            { success: false, message: program.unavailableReason || 'This program is not reporting yet.' },
            { status: 409 }
        );
    }

    const batch = resolveBatch(program, params.get('batch'));

    let roster;
    let snapshot;
    let history;
    try {
        [roster, snapshot, history] = await Promise.all([
            getRoster(program.code),
            getCurrentSnapshot(program.code),
            listSnapshots(program.code)
        ]);
    } catch (error) {
        console.error('[coding/overview] database unreachable:', error);
        return NextResponse.json({ success: false, message: 'Database unreachable.' }, { status: 503 });
    }

    if (!roster.length) {
        return NextResponse.json({
            success: true,
            program,
            state: 'no-roster',
            message: 'Upload the batch allocation workbook to get started.',
            history: []
        });
    }

    if (!snapshot) {
        // Roster but no capture yet: the admin can still see the batches loaded
        // correctly before the first bot export arrives.
        return NextResponse.json({
            success: true,
            program,
            state: 'no-snapshot',
            message: 'Upload a coding-profile export to see analytics.',
            snapshot: null,
            scope: batch,
            total: roster.length,
            batches: batchCounts(roster, program),
            history: []
        });
    }

    const previous = await getPreviousSnapshot(program.code, snapshot.capturedAt).catch(() => null);
    const students = buildCohort({ program, roster, snapshot, previous });
    const scoped = scopeStudents(students, batch);

    const batchSummaries = Object.fromEntries(
        program.batches.map((label) => [label, summarise(students.filter((s) => s.batch === label))])
    );

    return NextResponse.json({
        success: true,
        program,
        state: 'ready',
        snapshot: {
            id: String(snapshot._id),
            capturedAt: snapshot.capturedAt,
            uploadedAt: snapshot.uploadedAt,
            filename: snapshot.filename,
            rowCount: snapshot.rowCount,
            coverage: snapshot.coverage,
            scoreVersion: snapshot.scoreVersion,
            unmatchedCount: (snapshot.unmatched || []).length
        },
        previousSnapshot: previous
            ? { id: String(previous._id), capturedAt: previous.capturedAt, filename: previous.filename }
            : null,
        // With one capture the page is a BASELINE, not a performance ranking — the
        // cohort created most of these accounts days ago. The UI reads this to pick
        // its framing, and flips to progress-first once a second capture exists.
        mode: previous ? 'progress' : 'baseline',
        scope: batch,
        total: students.length,
        scopedTotal: scoped.length,
        summary: summarise(scoped),
        cohortSummary: batch === ALL_BATCHES ? null : summarise(students),
        batchSummaries,
        podium: podiumFor(scoped),
        batches: batchCounts(roster, program, students),
        history: history.map((h) => ({
            id: String(h._id),
            capturedAt: h.capturedAt,
            uploadedAt: h.uploadedAt,
            filename: h.filename,
            rowCount: h.rowCount,
            isCurrent: Boolean(h.isCurrent)
        })),
        unmatched: (snapshot.unmatched || []).map((u) => ({ rollNo: u.rollNo, rollKey: u.rollKey }))
    });
}
