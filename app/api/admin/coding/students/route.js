import { NextResponse } from 'next/server';
import { isAuthenticated } from '../../../../../lib/dashboard-auth';
import { resolveBatch } from '../../../../../lib/coding-profiles/programs';
import { loadScope } from '../../../../../lib/coding-profiles/load-scope';
import {
    buildCohort,
    scopeStudents,
    filterStudents,
    paginate,
    resolveLimit,
    SORT_KEYS,
    STATUS_KEYS
} from '../../../../../lib/coding-profiles/cohort';
import { parsePeriod } from '../../../../../lib/coding-profiles/period';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

/**
 * One page of the directory.
 *
 *   ?program=<code>|all  &batch=all|Batch 2  &page=1  &limit=10|50|100|500|all
 *   &sort=score|lc|cc|hr|gfg|name  &status=all|active|top10|quiet|stalled|uncaptured
 *   &q=<search>  &excludePodium=1  &from=YYYY-MM-DD&to=YYYY-MM-DD
 *
 * Ranks are computed over the whole scope before paging, so page 3 of 7 carries
 * the same "#112" the student would have on a single long list. `limit=all` is for
 * the two consumers that genuinely need everyone: the printed report and the
 * analytics charts. With a period that has no capture inside it, the list is empty.
 */
export async function GET(request) {
    if (!isAuthenticated(request)) {
        return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });
    }

    const params = request.nextUrl.searchParams;
    const sort = SORT_KEYS.includes(params.get('sort')) ? params.get('sort') : 'score';
    const status = STATUS_KEYS.includes(params.get('status')) ? params.get('status') : 'all';
    const q = String(params.get('q') || '').slice(0, 80);
    const limit = resolveLimit(params.get('limit'));
    const excludePodium = params.get('excludePodium') === '1';
    const period = parsePeriod(params.get('from'), params.get('to'));

    let loaded;
    try {
        loaded = await loadScope(params.get('program'), period);
    } catch (error) {
        console.error('[coding/students] database unreachable:', error);
        return NextResponse.json({ success: false, message: 'Database unreachable.' }, { status: 503 });
    }

    if (loaded.state === 'unknown') {
        return NextResponse.json({ success: false, message: 'Unknown program.' }, { status: 404 });
    }

    const { program, roster } = loaded;
    const batch = resolveBatch(program, params.get('batch'));
    const empty = { success: true, scope: batch, sort, status, q, period: loaded.info || null, total: 0, page: 1, pages: 1, limit, students: [] };

    if (loaded.state !== 'ready' || loaded.info?.empty) {
        return NextResponse.json(empty);
    }

    const students = buildCohort({ program, roster, snapshot: loaded.snapshot, previous: loaded.previous, period });
    const scoped = scopeStudents(students, batch);
    const filtered = filterStudents(scoped, { status, q, sort, excludePodium });
    const page = paginate(filtered, params.get('page'), limit);

    return NextResponse.json({
        success: true,
        scope: batch,
        sort,
        status,
        q,
        period: loaded.info,
        total: page.total,
        page: page.page,
        pages: page.pages,
        limit: page.limit,
        students: page.rows
    });
}
