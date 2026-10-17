import { NextResponse } from 'next/server';
import { isAuthenticated } from '../../../../../lib/dashboard-auth';
import { getProgram, availablePrograms, resolveBatch } from '../../../../../lib/coding-profiles/programs';
import { getRoster, getCurrentSnapshot, getPreviousSnapshot } from '../../../../../lib/coding-profiles/store';
import {
    buildCohort,
    scopeStudents,
    filterStudents,
    paginate,
    resolveLimit,
    SORT_KEYS,
    STATUS_KEYS
} from '../../../../../lib/coding-profiles/cohort';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

/**
 * One page of the directory.
 *
 *   ?program=  &batch=all|Batch 2  &page=1  &limit=10|50|100|500|all
 *   &sort=score|lc|cc|hr|gfg|name  &status=all|active|top10|quiet|stalled|uncaptured
 *   &q=<search>  &excludePodium=1
 *
 * Ranks are computed over the whole scope before paging, so page 3 of 7 carries
 * the same "#112" the student would have on a single long list. `limit=all` is for
 * the two consumers that genuinely need everyone: the printed report and the
 * analytics charts.
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
    const sort = SORT_KEYS.includes(params.get('sort')) ? params.get('sort') : 'score';
    const status = STATUS_KEYS.includes(params.get('status')) ? params.get('status') : 'all';
    const q = String(params.get('q') || '').slice(0, 80);
    const limit = resolveLimit(params.get('limit'));
    const excludePodium = params.get('excludePodium') === '1';

    let roster;
    let snapshot;
    try {
        [roster, snapshot] = await Promise.all([getRoster(program.code), getCurrentSnapshot(program.code)]);
    } catch (error) {
        console.error('[coding/students] database unreachable:', error);
        return NextResponse.json({ success: false, message: 'Database unreachable.' }, { status: 503 });
    }

    const previous = snapshot ? await getPreviousSnapshot(program.code, snapshot.capturedAt).catch(() => null) : null;
    const students = buildCohort({ program, roster, snapshot, previous });
    const scoped = scopeStudents(students, batch);
    const filtered = filterStudents(scoped, { status, q, sort, excludePodium });
    const page = paginate(filtered, params.get('page'), limit);

    return NextResponse.json({
        success: true,
        scope: batch,
        sort,
        status,
        q,
        total: page.total,
        page: page.page,
        pages: page.pages,
        limit: page.limit,
        students: page.rows
    });
}
