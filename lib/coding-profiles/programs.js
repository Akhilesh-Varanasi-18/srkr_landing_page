// The programs the coding-profiles dashboard can report on.
//
// A constant rather than a collection: a program is a deployment fact, not data an
// admin edits, and keeping it in code means the batch list, the roster sheet name and
// the metric model stay reviewable in a diff.
//
// Bamboo Coder's progress data will NOT look like coding-platform profiles (it is a
// 9-module C syllabus), so it is listed here as `available: false` rather than being
// forced through a metric model that does not fit. When it lands it gets its own
// `kind`, and the shell/filters/podium primitives are reused around a different body.

export const PROGRAMS = [
    {
        code: 'skillup-coder',
        name: 'SkillUp Coder',
        kind: 'coding-profiles',
        college: 'SRKR',
        passoutYear: 2029,
        yearLabel: '2nd Year',
        tagline: 'Competitive programming across LeetCode, HackerRank, CodeChef and GeeksforGeeks',
        // Batch labels exactly as they appear in the roster workbook's Batch column.
        batches: ['Batch 1', 'Batch 2', 'Batch 3', 'Batch 4'],
        rosterSheet: 'SKL_2029_Batch',
        available: true
    },
    {
        code: 'bamboo-coder',
        name: 'Bamboo Coder',
        kind: 'syllabus-progress',
        college: 'SRKR',
        passoutYear: 2030,
        yearLabel: '1st Year',
        tagline: 'Foundational C programming — 9-module syllabus',
        batches: [],
        rosterSheet: null,
        available: false,
        unavailableReason: 'Progress tracking for the C syllabus is not wired up yet.'
    },
    {
        code: 'ai-ready-engineers',
        name: 'AI Ready Engineers',
        kind: 'syllabus-progress',
        college: 'SRKR',
        passoutYear: 2028,
        yearLabel: '3rd Year',
        tagline: 'Applied AI engineering track',
        batches: [],
        rosterSheet: null,
        available: false,
        unavailableReason: 'This program has not started reporting yet.'
    }
];

export const ALL_BATCHES = 'all';

export function getProgram(code) {
    return PROGRAMS.find((p) => p.code === code) || null;
}

export function availablePrograms() {
    return PROGRAMS.filter((p) => p.available);
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
