// Pure helpers shared by the client and the API routes for the coding-profiles
// module. Nothing here touches the database — the program catalogue itself lives in
// MongoDB and is read through ./program-store.js (server only), because an admin
// creates programs from the admin panel now rather than a developer adding one to a
// constant.

export const ALL_BATCHES = 'all';
// The "entire college" scope: every program's roster, ranked together.
export const ALL_PROGRAMS = 'all';

/** 'Moon Coder' -> 'moon-coder'. Codes are URL-safe, lower-case and stable. */
export function slugify(name) {
    return String(name || '')
        .toLowerCase()
        .replace(/&/g, ' and ')
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-+|-+$/g, '')
        .slice(0, 48);
}

/**
 * Resolves a batch query param against a program.
 * Anything unrecognised collapses to "all" rather than erroring — a stale bookmark
 * pointing at "Batch 5" should show the cohort, not a crash.
 */
export function resolveBatch(program, raw) {
    if (!raw || raw === ALL_BATCHES) return ALL_BATCHES;
    const decoded = decodeURIComponent(String(raw)).replace(/-/g, ' ').toLowerCase();
    const match = program?.batches?.find((b) => b.toLowerCase() === decoded);
    return match || ALL_BATCHES;
}

/** 'Batch 1' -> 'batch-1', for URLs. */
export function batchSlug(batch) {
    return batch === ALL_BATCHES ? ALL_BATCHES : String(batch).toLowerCase().replace(/\s+/g, '-');
}

/** Natural order for batch labels: Batch 2 before Batch 10, then anything else alphabetically. */
export function sortBatches(labels) {
    return [...new Set(labels.filter(Boolean))].sort((a, b) =>
        String(a).localeCompare(String(b), undefined, { numeric: true, sensitivity: 'base' })
    );
}

/** The year labels an admin can pick for a new program, by passout year offset. */
export const YEAR_LABELS = ['1st Year', '2nd Year', '3rd Year', '4th Year'];

/**
 * Strips a stored program document down to the fields the client needs. The
 * client never sees Mongo ids or timestamps it has no use for.
 */
export function publicProgram(doc) {
    if (!doc) return null;
    return {
        code: doc.code,
        name: doc.name,
        kind: doc.kind || 'coding-profiles',
        college: doc.college || 'SRKR',
        passoutYear: doc.passoutYear ?? null,
        yearLabel: doc.yearLabel || '',
        tagline: doc.tagline || '',
        batches: Array.isArray(doc.batches) ? doc.batches : [],
        rosterSheet: doc.rosterSheet || null,
        available: true,
        createdAt: doc.createdAt || null
    };
}

/**
 * The synthetic "all programs" scope. Its "batches" are the programs themselves, so
 * every batch-aware feature (scope pills, per-group ranks, the analytics cards) works
 * unchanged — the client just labels the grouping "program" instead of "batch".
 */
export function allProgramsScope(programs) {
    return {
        code: ALL_PROGRAMS,
        name: 'All programs',
        kind: 'coding-profiles',
        college: 'SRKR',
        passoutYear: null,
        yearLabel: 'Every intake',
        tagline: `Every student across ${programs.length} program${programs.length === 1 ? '' : 's'}, ranked together`,
        batches: programs.map((p) => p.name),
        rosterSheet: null,
        available: true,
        group: 'program'
    };
}
