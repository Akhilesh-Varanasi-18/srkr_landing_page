// The cohort: roster joined to the live capture, ranked overall and within each
// batch — and the scoping, filtering and paging that both API routes apply to it.
//
// Rank is NOT taken from the stored snapshot. Rank depends on the population being
// ranked, and the batch scope changes that population — so rank is computed per
// request over the selected set. That is what makes "3rd in Batch 2" meaningful
// rather than just "63rd overall, who happens to be in Batch 2".
//
// The directory is paged on the server so the client only downloads the cards it
// is about to draw. The podium, the KPI figures and the analytics are computed here
// from the full population, so paging the list never changes a rank or a count.

import { rankStudents, scoreStudent } from './score';
import { topThreeFor } from './boards';
import { ALL_BATCHES } from './programs';
import { diffMetrics } from './period';

export const PAGE_SIZES = [10, 50, 100, 500];
export const DEFAULT_PAGE_SIZE = 50;

const SORT_METRIC = { lc: 'lcTotal', cc: 'ccProblems', hr: 'hrTotalStars', gfg: 'gfgPrograms' };
export const SORT_KEYS = ['score', 'lc', 'cc', 'hr', 'gfg', 'name'];
export const STATUS_KEYS = ['all', 'active', 'top10', 'quiet', 'stalled', 'uncaptured'];

const hasPrevious = (s) => s.previousScore !== null && s.previousScore !== undefined;

/**
 * Joins roster -> capture and ranks twice: once over the whole cohort (the stable
 * "overall" badge) and once within each batch. The roster drives the list, so a
 * student the bot never saw still appears (as "no data captured") rather than
 * silently vanishing. Without a snapshot every student is simply uncaptured.
 *
 * ALL TIME (`period` absent): `snapshot` is the latest capture and `previous` the
 * one before it; every number is the cumulative total, and `delta` is the movement
 * since the previous capture.
 *
 * A PERIOD: `snapshot` is the last capture inside the period and `previous` the
 * last capture before it. Every count becomes what was added BETWEEN the two
 * (see period.js), the total is the sum of those, and ranks follow. A student with
 * no capture before the period counts from zero and is flagged `newInPeriod`;
 * `allTimeScore` keeps the cumulative figure for context.
 */
export function buildCohort({ program, roster, snapshot, previous, period = null }) {
    const rowsByKey = new Map((snapshot?.rows || []).map((r) => [r.rollKey, r]));
    const previousByKey = new Map((previous?.rows || []).map((r) => [r.rollKey, r]));

    // Totals are recomputed from the stored metrics on every read rather than taken
    // from the snapshot, so a change to how the total is counted applies to every
    // capture ever uploaded — including the previous one the delta is measured against.
    const joined = roster.map((person) => {
        const row = rowsByKey.get(person.rollKey);
        const before = previousByKey.get(person.rollKey);
        const captured = Boolean(row?.dataCaptured);
        const hadBefore = Boolean(before?.dataCaptured);
        const endMetrics = row?.metrics || {};
        const metrics = period && captured && hadBefore ? diffMetrics(endMetrics, before.metrics || {}) : endMetrics;
        const scored = captured ? scoreStudent(metrics) : null;
        const scoredBefore = !period && hadBefore ? scoreStudent(before.metrics || {}) : null;
        const score = scored ? scored.score : null;
        const previousScore = scoredBefore ? scoredBefore.score : null;

        return {
            rollKey: person.rollKey,
            rollNo: person.rollNo,
            name: person.name,
            batch: person.batch,
            gender: person.gender,
            branch: person.branch,
            dataCaptured: captured,
            metrics,
            profiles: row?.profiles || {},
            score,
            parts: scored?.parts || null,
            activePlatforms: scored?.activePlatforms || 0,
            platformsTouched: scored?.platformsTouched || 0,
            previousScore,
            delta: score !== null && previousScore !== null ? score - previousScore : null,
            ...(period
                ? {
                      allTimeScore: captured ? scoreStudent(endMetrics).score : null,
                      newInPeriod: captured && !hadBefore
                  }
                : {})
        };
    });

    const overall = rankStudents(joined);
    const byBatch = new Map();
    for (const batch of program.batches) {
        rankStudents(joined.filter((s) => s.batch === batch)).forEach((s) => {
            byBatch.set(s.rollKey, { rank: s.rank, tier: s.tier });
        });
    }

    return overall.map((student) => ({
        ...student,
        overallRank: student.rank ?? null,
        overallTier: student.tier ?? 'not_captured',
        batchRank: byBatch.get(student.rollKey)?.rank ?? null,
        batchTier: byBatch.get(student.rollKey)?.tier ?? 'not_captured'
    }));
}

/**
 * Narrows to a scope and gives every row the rank and tier that belong to THAT
 * scope, so "#3" on a card always means "third among the people on this page's
 * leaderboard". Order is preserved: the overall order is also the batch order,
 * because both use the same comparator.
 */
export function scopeStudents(students, batch) {
    const all = !batch || batch === ALL_BATCHES;
    const rows = all ? students : students.filter((s) => s.batch === batch);
    return rows.map((s) => ({
        ...s,
        rank: all ? s.overallRank : s.batchRank,
        tier: all ? s.overallTier : s.batchTier
    }));
}

/** The directory's filters and sorts, over an already-scoped list. */
export function filterStudents(rows, { status = 'all', q = '', sort = 'score', excludePodium = false } = {}) {
    let out = rows;

    if (status === 'active') out = out.filter((s) => s.dataCaptured && s.platformsTouched > 0);
    else if (status === 'top10') out = out.filter((s) => s.tier === 'podium' || s.tier === 'top10');
    else if (status === 'quiet') out = out.filter((s) => s.dataCaptured && !s.platformsTouched);
    else if (status === 'stalled') out = out.filter((s) => s.dataCaptured && hasPrevious(s) && s.delta === 0);
    else if (status === 'uncaptured') out = out.filter((s) => !s.dataCaptured);

    const needle = String(q || '').trim().toLowerCase();
    if (needle) {
        out = out.filter(
            (s) =>
                String(s.name || '').toLowerCase().includes(needle) ||
                String(s.rollNo || '').toLowerCase().includes(needle) ||
                String(s.branch || '').toLowerCase().includes(needle)
        );
    }

    if (sort === 'name') {
        out = [...out].sort((a, b) => String(a.name || '').localeCompare(String(b.name || '')));
    } else if (SORT_METRIC[sort]) {
        const field = SORT_METRIC[sort];
        out = [...out].sort((a, b) => (Number(b.metrics?.[field]) || 0) - (Number(a.metrics?.[field]) || 0));
    }
    // 'score' keeps the ranked order.

    // The podium three are listed separately on the leaderboard, so with nothing
    // narrowing the list the cards start at #4 — "top three, then the rest".
    const plain = status === 'all' && !needle && sort === 'score';
    if (excludePodium && plain) {
        const podium = new Set(topThreeFor(rows, 'overall').map((s) => s.rollKey));
        out = out.filter((s) => !podium.has(s.rollKey));
    }

    return out;
}

/** Clamps a requested page size to the sizes the UI offers, or 'all'. */
export function resolveLimit(raw) {
    if (raw === 'all') return 'all';
    const n = Number(raw);
    return PAGE_SIZES.includes(n) ? n : DEFAULT_PAGE_SIZE;
}

/** One page of rows plus the figures the pager needs. `limit: 'all'` returns everything. */
export function paginate(rows, rawPage, limit) {
    const total = rows.length;
    if (limit === 'all') return { total, page: 1, pages: 1, limit: 'all', rows };
    const pages = Math.max(1, Math.ceil(total / limit));
    const page = Math.min(Math.max(1, Number(rawPage) || 1), pages);
    const start = (page - 1) * limit;
    return { total, page, pages, limit, rows: rows.slice(start, start + limit) };
}

/** Roster size and captured count per batch, for the scope control. */
export function batchCounts(roster, program, students = null) {
    return program.batches.map((batch) => ({
        label: batch,
        total: roster.filter((p) => p.batch === batch).length,
        captured: students ? students.filter((s) => s.batch === batch && s.dataCaptured).length : 0
    }));
}
