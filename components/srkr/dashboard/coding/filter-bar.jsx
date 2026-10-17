'use client';

import { IconSearch } from '../dashboard-icons';

export const SORTS = [
    { key: 'score', label: 'Total solved' },
    { key: 'lc', label: 'LeetCode' },
    { key: 'cc', label: 'CodeChef' },
    { key: 'hr', label: 'HackerRank' },
    { key: 'gfg', label: 'GeeksforGeeks' },
    { key: 'name', label: 'Name' }
];

export const STATUSES = [
    { key: 'all', label: 'All status' },
    { key: 'active', label: 'Active' },
    { key: 'top10', label: 'Top 10' },
    { key: 'quiet', label: 'Not started' },
    // Only meaningful once a second capture exists — hidden in baseline mode.
    { key: 'stalled', label: 'No progress since last capture', progressOnly: true },
    { key: 'uncaptured', label: 'No profile captured' }
];

/**
 * Search · sort · status for the directory. The batch is NOT here: scope lives in
 * the scope bar above the KPIs, because it changes the ranking and the report, not
 * just which cards are listed.
 */
export default function FilterBar({ query, onQuery, sort, onSort, status, onStatus, mode = 'baseline' }) {
    const statuses = STATUSES.filter((s) => !s.progressOnly || mode === 'progress');

    return (
        <div className="cp-filters" role="search">
            <label className="cp-filters__search">
                <span className="cp-sr-only">Search students</span>
                <IconSearch aria-hidden="true" />
                <input
                    type="search"
                    placeholder="Search by name, roll number or branch"
                    value={query}
                    onChange={(e) => onQuery(e.target.value)}
                />
            </label>

            <label className="cp-filters__select">
                <span className="cp-sr-only">Sort by</span>
                <select value={sort} onChange={(e) => onSort(e.target.value)}>
                    {SORTS.map((s) => (
                        <option key={s.key} value={s.key}>
                            Sort: {s.label}
                        </option>
                    ))}
                </select>
            </label>

            <label className="cp-filters__select">
                <span className="cp-sr-only">Status</span>
                <select value={status} onChange={(e) => onStatus(e.target.value)}>
                    {statuses.map((s) => (
                        <option key={s.key} value={s.key}>
                            {s.label}
                        </option>
                    ))}
                </select>
            </label>
        </div>
    );
}
