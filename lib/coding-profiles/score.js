// The total, ranking and tiers for the coding-profiles dashboard.
//
// THE TOTAL IS A PLAIN SUM OF COUNTS — no weights, no caps, no bonuses:
//
//     total = LeetCode problems solved
//           + CodeChef problems solved
//           + HackerRank stars earned
//           + GeeksforGeeks programs solved
//
// Every number is one the student can read off their own profile page, and the
// four of them add up to the figure on their card. HackerRank reports stars rather
// than a solved count, so stars are what it contributes.
//
// Totals are recomputed from the stored metrics on every read (see cohort.js), so
// this file is the single place the arithmetic lives; a change here applies to
// every capture ever uploaded.

export const SCORE_VERSION = 'count-v1';

/** The four counts that make up the total, in display order. */
export const COUNT_FIELDS = [
    { key: 'lc', field: 'lcTotal' },
    { key: 'cc', field: 'ccProblems' },
    { key: 'hr', field: 'hrTotalStars' },
    { key: 'gfg', field: 'gfgPrograms' }
];

/** The six HackerRank per-language star columns, in display order. */
export const HR_LANGUAGES = [
    { key: 'hrC', label: 'C' },
    { key: 'hrCpp', label: 'C++' },
    { key: 'hrJava', label: 'Java' },
    { key: 'hrPython', label: 'Python' },
    { key: 'hrProblemSolving', label: 'Problem Solving' },
    { key: 'hrSql', label: 'SQL' }
];

/** Kept for callers that describe the model; there is nothing to tune. */
export const SCORE_SPEC = Object.freeze({ version: SCORE_VERSION, fields: COUNT_FIELDS });

/**
 * Tier floor for "active": the 75th percentile of the real distribution of totals
 * (p75 = 30 on the 2026-10-15 capture; p50 = 12, p90 = 60).
 */
export const TIER_ACTIVE_FLOOR = 30;

const num = (value) => {
    if (value === null || value === undefined || value === '') return 0;
    const n = Number(value);
    return Number.isFinite(n) ? n : 0;
};

/**
 * Totals one student's metrics. Pure: no cohort input, no database, no I/O — the
 * same metrics always produce the same total, which is what makes capture-to-
 * capture deltas meaningful.
 *
 * `platformsTouched` counts platforms with ANY activity (a HackerRank badge or a
 * GeeksforGeeks score counts even with no solve), which is what "not started" keys
 * off. `activePlatforms` counts platforms contributing to the total.
 *
 * @param {object} m  normalised metrics (see lib/coding-profiles/columns.js)
 * @returns {{score:number, parts:object, activePlatforms:number, platformsTouched:number}}
 */
export function scoreStudent(m) {
    const metrics = m || {};
    const parts = Object.fromEntries(COUNT_FIELDS.map(({ key, field }) => [key, num(metrics[field])]));
    const score = COUNT_FIELDS.reduce((sum, { key }) => sum + parts[key], 0);

    const touched = [
        parts.lc > 0,
        parts.cc > 0,
        parts.hr > 0 || num(metrics.hrBadges) > 0,
        parts.gfg > 0 || num(metrics.gfgScore) > 0
    ].filter(Boolean).length;

    return {
        score,
        parts,
        activePlatforms: COUNT_FIELDS.filter(({ key }) => parts[key] > 0).length,
        platformsTouched: touched
    };
}

/**
 * Total, stable ordering. Total first, then "harder problems first" — a tie-break a
 * student accepts as an argument — and finally rollKey so the order is total and the
 * grid never reshuffles between renders or between the page and its printed report.
 */
export function compareStudents(a, b) {
    const sa = a.score ?? -1;
    const sb = b.score ?? -1;
    if (sa !== sb) return sb - sa;
    const ma = a.metrics || {};
    const mb = b.metrics || {};
    if (num(mb.hard) !== num(ma.hard)) return num(mb.hard) - num(ma.hard);
    if (num(mb.medium) !== num(ma.medium)) return num(mb.medium) - num(ma.medium);
    if (num(mb.lcTotal) !== num(ma.lcTotal)) return num(mb.lcTotal) - num(ma.lcTotal);
    if ((b.activePlatforms || 0) !== (a.activePlatforms || 0)) {
        return (b.activePlatforms || 0) - (a.activePlatforms || 0);
    }
    return String(a.rollKey || '').localeCompare(String(b.rollKey || ''));
}

/**
 * Assigns ranks and tiers over an already-decided population (all batches, or one
 * batch — the caller decides, which is what makes "rank within batch" possible).
 *
 * Rank *badges* use competition ranking on the total alone (1, 2, 2, 4) so two
 * students on 165 both read "#11", while list ORDER uses the full tie-break chain.
 *
 * Students with no activity at all are deliberately left unranked: showing someone
 * "#212 of 308" for a profile with nothing on it communicates nothing true. The UI
 * tiers them instead. `not_started` keys off platformsTouched, never off the total,
 * so a HackerRank badge with no solves still counts as a start.
 */
export function rankStudents(students) {
    const ordered = [...students].sort(compareStudents);

    let lastScore = null;
    let lastRank = 0;

    return ordered.map((student, index) => {
        const { score } = student;

        if (score === null || score === undefined) {
            return { ...student, rank: null, tier: 'not_captured' };
        }
        if (!student.platformsTouched) {
            return { ...student, rank: null, tier: 'not_started' };
        }

        // Competition ranking: equal totals share a rank, the next distinct total
        // skips to its ordinal position.
        const rank = score === lastScore ? lastRank : index + 1;
        lastScore = score;
        lastRank = rank;

        let tier = 'starting';
        if (rank <= 3) tier = 'podium';
        else if (rank <= 10) tier = 'top10';
        else if (score >= TIER_ACTIVE_FLOOR) tier = 'active';

        return { ...student, rank, tier };
    });
}

export const TIER_LABELS = {
    podium: 'Podium',
    top10: 'Top 10',
    active: 'Active',
    starting: 'Getting started',
    not_started: 'Not started yet',
    not_captured: 'No data captured'
};

/** Cohort shape for the KPI tiles and the benchmark line on the profile panel. */
export function summarise(students) {
    const captured = students.filter((s) => s.score !== null && s.score !== undefined);
    const scores = captured.map((s) => s.score).sort((a, b) => a - b);
    const at = (q) => (scores.length ? scores[Math.min(scores.length - 1, Math.floor(scores.length * q))] : 0);

    return {
        total: students.length,
        captured: captured.length,
        notCaptured: students.length - captured.length,
        zero: captured.filter((s) => s.score === 0).length,
        // Started / not started key off platformsTouched, never off score === 0: a
        // HackerRank badge with no solves is still a start.
        started: captured.filter((s) => (s.platformsTouched || 0) > 0).length,
        notStarted: captured.filter((s) => !(s.platformsTouched || 0)).length,
        active: captured.filter((s) => s.score >= TIER_ACTIVE_FLOOR).length,
        median: at(0.5),
        p75: at(0.75),
        p90: at(0.9),
        max: scores.length ? scores[scores.length - 1] : 0,
        mean: scores.length ? Math.round(scores.reduce((a, b) => a + b, 0) / scores.length) : 0,
        scores
    };
}
