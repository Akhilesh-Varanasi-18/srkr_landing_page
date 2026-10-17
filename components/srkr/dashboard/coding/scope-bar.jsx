'use client';

import Segmented from './segmented';
import { IconPeople } from './coding-icons';
import { ALL_BATCHES } from '../../../../lib/coding-profiles/programs';

// The one control that decides what the leaderboard — and the downloaded report —
// covers: everyone, or one batch. It sits under the hero and stays pinned while
// the directory scrolls, so the scope can change from anywhere on the page.

export default function ScopeBar({ batch, batches, total, measured, onBatch }) {
    const options = [
        { key: ALL_BATCHES, label: 'All students', count: total },
        ...batches.map((b) => ({ key: b.label, label: b.label, count: b.total }))
    ];

    return (
        <div className="cp-scope" role="group" aria-label="Leaderboard scope">
            <span className="cp-scope__label">
                <IconPeople aria-hidden="true" /> Showing
            </span>
            <Segmented id="cp-scope" tone="brand" label="Scope" value={batch} onChange={onBatch} options={options} />
            <span className="cp-scope__note">{measured} measured · ranks and the report follow this selection</span>
        </div>
    );
}
