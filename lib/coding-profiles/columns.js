// Column mapping and normalisation for the scraping bot's coding-profile export.
//
// The bot's header is not a contract: the 2026-10-15 capture ships `gfg_total_progarms`
// (sic) and 13 of its 39 columns are completely empty, so a future run may rename,
// reorder, add or drop columns. Everything here is therefore keyed by header NAME
// (never position), tolerant about case/underscores/spacing, and explicit about the
// difference between "zero" and "not captured" — a distinction that must survive all
// the way into the UI, because a blank gfg_score is not a score of nought.

/** LeetCode's "unranked" sentinel. 267 of 308 rows carried it in the first capture. */
export const LC_RANK_SENTINEL = 5000001;

/**
 * canonical field -> accepted header spellings. First match wins. Spellings are
 * compared after normalisation (lowercase, non-alphanumerics stripped), so
 * `gfg_total_progarms`, `GFG Total Progarms` and `gfgtotalprogarms` all match.
 */
const FIELD_ALIASES = {
    rollNo: ['roll_no', 'rollno', 'roll number', 'usn_number', 'usn'],

    lcProfile: ['lc_profile', 'leetcode_profile', 'leetcode'],
    hrProfile: ['hr_profile', 'hackerrank_profile', 'hackerrank'],
    ccProfile: ['cc_profile', 'codechef_profile', 'codechef'],
    gfgProfile: ['gfg_profile', 'geeksforgeeks_profile', 'geeksforgeeks'],

    hrC: ['hr_c'],
    hrCpp: ['hr_cpp', 'hr_c++'],
    hrJava: ['hr_java'],
    hrPython: ['hr_python'],
    hrProblemSolving: ['hr_problem_solving', 'hr_problemsolving'],
    hrSql: ['hr_sql'],
    hrBadges: ['hr_badges'],
    hrTotalStars: ['hr_total_stars', 'hr_stars'],
    hrCertificationCount: ['hr_certification_count', 'hr_certifications_count'],
    hrCertifications: ['hr_certifications'],

    easy: ['easy', 'lc_easy'],
    medium: ['medium', 'lc_medium'],
    hard: ['hard', 'lc_hard'],
    lcTotal: ['total', 'lc_total'],
    lcRank: ['rank', 'lc_rank'],
    lcContestGlobalRank: ['lc_contest_global_rank'],
    lcContestCount: ['lc_contest_count'],
    lcContestRating: ['lc_contest_rating'],

    gfgSchool: ['gfg_school'],
    gfgBasic: ['gfg_basic'],
    gfgEasy: ['gfg_easy'],
    gfgMedium: ['gfg_medium'],
    gfgHard: ['gfg_hard'],
    // The source header is misspelled "progarms" — keep the typo as an accepted
    // spelling alongside the correct one so either survives a bot fix.
    gfgPrograms: ['gfg_total_progarms', 'gfg_total_programs', 'gfg_programs'],
    gfgScore: ['gfg_score'],
    gfgContestCount: ['gfg_contest_count'],
    gfgContestGlobalRank: ['gfg_contest_global_rank'],
    gfgRating: ['gfg_rating'],
    gfgStarRating: ['gfg_star_rating'],

    ccRating: ['cc_rating'],
    ccStarRating: ['cc_star_rating'],
    ccContestCount: ['cc_contest_count'],
    ccProblems: ['cc_total_problems', 'cc_problems']
};

/** Fields without which a capture is not usable at all. */
const REQUIRED_FIELDS = ['rollNo'];

/**
 * Fields the scorer reads. If one of these vanishes from a future export the upload
 * is still accepted, but as an explicit warning — a missing column silently scoring
 * as zero is the failure mode this guards against.
 */
const SCORED_FIELDS = [
    'easy', 'medium', 'hard', 'lcTotal',
    'hrC', 'hrCpp', 'hrJava', 'hrPython', 'hrProblemSolving', 'hrSql',
    'hrTotalStars', 'hrCertificationCount',
    'gfgPrograms', 'gfgScore',
    'ccProblems'
];

/** Numeric fields — everything not in here stays a trimmed string. */
const NUMERIC_FIELDS = new Set([
    'hrC', 'hrCpp', 'hrJava', 'hrPython', 'hrProblemSolving', 'hrSql',
    'hrBadges', 'hrTotalStars', 'hrCertificationCount',
    'easy', 'medium', 'hard', 'lcTotal', 'lcRank',
    'lcContestGlobalRank', 'lcContestCount', 'lcContestRating',
    'gfgSchool', 'gfgBasic', 'gfgEasy', 'gfgMedium', 'gfgHard',
    'gfgPrograms', 'gfgScore', 'gfgContestCount', 'gfgContestGlobalRank',
    'gfgRating', 'gfgStarRating',
    'ccRating', 'ccStarRating', 'ccContestCount', 'ccProblems'
]);

const normaliseHeader = (h) => String(h ?? '').toLowerCase().replace(/[^a-z0-9+]/g, '');

const ALIAS_LOOKUP = (() => {
    const map = new Map();
    for (const [field, aliases] of Object.entries(FIELD_ALIASES)) {
        for (const alias of aliases) {
            const key = normaliseHeader(alias);
            // First alias registered wins, so rollNo keeps Roll_No over USN_Number.
            if (!map.has(key)) map.set(key, field);
        }
    }
    return map;
})();

/** Upper-cased, whitespace-stripped roll number — the join key on both sides. */
export function rollKeyOf(roll) {
    return String(roll ?? '').replace(/\s+/g, '').toUpperCase();
}

/**
 * Maps a raw header row to canonical field names.
 * @returns {{byField:Object<string,number>, unknown:string[], missingRequired:string[], missingScored:string[]}}
 */
export function mapHeaders(headerRow) {
    const byField = {};
    const unknown = [];

    headerRow.forEach((raw, index) => {
        const header = String(raw ?? '').trim();
        if (!header) return;
        const field = ALIAS_LOOKUP.get(normaliseHeader(header));
        if (!field) {
            unknown.push(header);
            return;
        }
        // A duplicated header (Roll_No and USN_Number are identical in practice)
        // keeps its first column rather than silently taking the last.
        if (byField[field] === undefined) byField[field] = index;
    });

    return {
        byField,
        unknown,
        missingRequired: REQUIRED_FIELDS.filter((f) => byField[f] === undefined),
        missingScored: SCORED_FIELDS.filter((f) => byField[f] === undefined)
    };
}

/**
 * Normalises one data row into metrics.
 *
 * Blank stays `null`, never 0. This is the single most important rule in the file:
 * `gfg_score` is blank for 1 student and 0 for 269 others, and the UI must be able
 * to say "not captured" for the first and "nothing solved yet" for the rest.
 */
export function normaliseRow(cells, byField) {
    const metrics = {};
    const profiles = {};

    for (const [field, index] of Object.entries(byField)) {
        const raw = cells[index];
        const value = typeof raw === 'string' ? raw.trim() : raw;

        if (field === 'rollNo') continue;

        if (field.endsWith('Profile')) {
            profiles[field.replace(/Profile$/, '')] = value ? String(value) : null;
            continue;
        }

        if (value === '' || value === null || value === undefined) {
            metrics[field] = null;
            continue;
        }

        if (NUMERIC_FIELDS.has(field)) {
            const n = Number(value);
            metrics[field] = Number.isFinite(n) ? n : null;
        } else {
            metrics[field] = String(value);
        }
    }

    // The sentinel is not a rank of five million — it means LeetCode has not ranked
    // this account. Collapsed here so nothing downstream has to know the magic number.
    if (metrics.lcRank !== null && metrics.lcRank !== undefined && metrics.lcRank >= LC_RANK_SENTINEL) {
        metrics.lcRank = null;
    }

    return { metrics, profiles };
}

/** A profile URL that points at the site but not at a user page (e.g. /settings/). */
export function isSuspectProfile(url, platform) {
    if (!url) return false;
    const u = String(url).toLowerCase();
    const userPathByPlatform = {
        lc: ['/u/', '/profile/'],
        hr: ['/profile/', '/hackerrank.com/'],
        cc: ['/users/'],
        gfg: ['/user/', '/profile/']
    };
    const needles = userPathByPlatform[platform];
    if (!needles) return false;
    return !needles.some((needle) => u.includes(needle));
}

/**
 * Per-column coverage over the whole capture. Drives two things:
 *   1. the UI's field-availability map — blocks for 100%-empty columns are not
 *      rendered at all today, and light up on their own when the bot starts
 *      returning them;
 *   2. the regression guard at upload time (see lib/coding-profiles/ingest.js).
 */
export function computeCoverage(rows) {
    const coverage = {};
    const fields = new Set();
    rows.forEach((r) => Object.keys(r.metrics || {}).forEach((f) => fields.add(f)));

    for (const field of fields) {
        let filled = 0;
        let nonzero = 0;
        for (const row of rows) {
            const v = row.metrics?.[field];
            if (v === null || v === undefined || v === '') continue;
            filled += 1;
            if (typeof v === 'number' ? v !== 0 : String(v).length > 0) nonzero += 1;
        }
        coverage[field] = { filled, nonzero, total: rows.length };
    }
    return coverage;
}

/** True when a field has at least one non-zero value — i.e. worth rendering. */
export function hasSignal(coverage, field) {
    const c = coverage?.[field];
    return Boolean(c && c.nonzero > 0);
}

export { SCORED_FIELDS, NUMERIC_FIELDS };
