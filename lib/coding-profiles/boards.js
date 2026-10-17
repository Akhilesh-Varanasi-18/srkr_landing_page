// The podium's five boards, shared by the overview API and the podium component so
// the server can hand the client exactly the three cards it will draw — without
// shipping the whole cohort for the client to pick them out of.
//
// "Overall" ranks by the plain total — LeetCode solved + CodeChef problems +
// HackerRank stars + GeeksforGeeks programs; each platform board ranks by that one
// count. No weights, no caps: the number on a card is the number on the profile.

export const BOARDS = [
    { key: 'overall', label: 'Overall', unit: 'total solved' },
    { key: 'lc', label: 'LeetCode', metric: 'lcTotal', unit: 'problems solved' },
    { key: 'cc', label: 'CodeChef', metric: 'ccProblems', unit: 'problems' },
    { key: 'gfg', label: 'GFG', metric: 'gfgPrograms', unit: 'programs' },
    { key: 'hr', label: 'HackerRank', metric: 'hrTotalStars', unit: 'stars' }
];

/**
 * Top three for a board over an already-scoped population (rows carry `rank` for
 * that scope). Returns [] when nobody has activity on it.
 */
export function topThreeFor(students, boardKey) {
    const board = BOARDS.find((b) => b.key === boardKey) || BOARDS[0];
    if (board.key === 'overall') {
        return students
            .filter((s) => s.rank !== null && s.rank !== undefined)
            .sort((a, b) => a.rank - b.rank)
            .slice(0, 3);
    }
    const value = (s) => Number(s.metrics?.[board.metric]) || 0;
    return students
        .filter((s) => s.dataCaptured && value(s) > 0)
        .sort(
            (a, b) =>
                value(b) - value(a) ||
                (b.score ?? 0) - (a.score ?? 0) ||
                String(a.rollKey).localeCompare(String(b.rollKey))
        )
        .slice(0, 3);
}

/** Every board's top three, keyed by board. */
export function podiumFor(students) {
    return Object.fromEntries(BOARDS.map((b) => [b.key, topThreeFor(students, b.key)]));
}
