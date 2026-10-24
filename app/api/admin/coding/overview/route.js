import { NextResponse } from 'next/server';
import { isAuthenticated } from '../../../../../lib/dashboard-auth';
import { resolveBatch, ALL_BATCHES } from '../../../../../lib/coding-profiles/programs';
import { loadScope } from '../../../../../lib/coding-profiles/load-scope';
import { summarise } from '../../../../../lib/coding-profiles/score';
import { buildCohort, scopeStudents, batchCounts } from '../../../../../lib/coding-profiles/cohort';
import { podiumFor } from '../../../../../lib/coding-profiles/boards';
import { parsePeriod } from '../../../../../lib/coding-profiles/period';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

/**
 * Everything the leaderboard needs for one scope (all students, or one batch) and
 * one period (all time, or ?from=YYYY-MM-DD&to=YYYY-MM-DD) — except the student
 * cards, which /students pages on demand.
 *
 * ?program= is a program code, or `all` for every program ranked together (there
 * the "batches" are the programs — see load-scope.js). The podium, the KPI figures
 * and the per-group summaries are computed over the FULL population here, so the
 * client can page the directory ten at a time and every rank and count on screen
 * still describes the whole cohort.
 */
export async function GET(request) {
    if (!isAuthenticated(request)) {
        return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });
    }

    const params = request.nextUrl.searchParams;
    const period = parsePeriod(params.get('from'), params.get('to'));

    let loaded;
    try {
        loaded = await loadScope(params.get('program'), period);
    } catch (error) {
        console.error('[coding/overview] database unreachable:', error);
        return NextResponse.json({ success: false, message: 'Database unreachable.' }, { status: 503 });
    }

    if (loaded.state === 'unknown') {
        return NextResponse.json({ success: false, message: 'Unknown program.' }, { status: 404 });
    }

    const { program, roster, latest, history, group } = loaded;
    const batch = resolveBatch(program, params.get('batch'));

    if (loaded.state === 'no-roster') {
        return NextResponse.json({
            success: true,
            program,
            group,
            state: 'no-roster',
            message: 'Upload the batch allocation workbook to get started.',
            history: []
        });
    }

    if (loaded.state === 'no-snapshot') {
        // Roster but no capture yet: the admin can still see the batches loaded
        // correctly before the first bot export arrives.
        return NextResponse.json({
            success: true,
            program,
            group,
            state: 'no-snapshot',
            message: 'Upload a coding-profile export to see analytics.',
            snapshot: null,
            scope: batch,
            total: roster.length,
            batches: batchCounts(roster, program),
            history: []
        });
    }

    const { snapshot, previous, info } = loaded;
    const students = buildCohort({ program, roster, snapshot, previous, period });
    const scoped = scopeStudents(students, batch);

    const batchSummaries = Object.fromEntries(
        program.batches.map((label) => [label, summarise(students.filter((s) => s.batch === label))])
    );

    return NextResponse.json({
        success: true,
        program,
        group,
        state: 'ready',
        // The LATEST capture, whatever the period: it is what "Data as of" means
        // and where field coverage comes from.
        snapshot: {
            id: String(latest._id),
            capturedAt: latest.capturedAt,
            uploadedAt: latest.uploadedAt,
            filename: latest.filename,
            rowCount: latest.rowCount,
            coverage: latest.coverage,
            scoreVersion: latest.scoreVersion,
            unmatchedCount: (latest.unmatched || []).length
        },
        previousSnapshot: previous
            ? { id: String(previous._id), capturedAt: previous.capturedAt, filename: previous.filename }
            : null,
        // all time with one capture is a BASELINE; with two it is PROGRESS; a date
        // period is its own framing — the numbers are what happened inside it.
        mode: period ? 'period' : previous ? 'progress' : 'baseline',
        period: info,
        scope: batch,
        total: students.length,
        scopedTotal: scoped.length,
        summary: summarise(scoped),
        cohortSummary: batch === ALL_BATCHES ? null : summarise(students),
        batchSummaries,
        podium: podiumFor(scoped),
        batches: batchCounts(roster, program, students),
        history,
        unmatched: (latest.unmatched || []).map((u) => ({ rollNo: u.rollNo, rollKey: u.rollKey }))
    });
}
