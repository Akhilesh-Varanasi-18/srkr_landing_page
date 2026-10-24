'use client';

import Segmented from './segmented';
import PeriodPicker from './period-picker';
import { IconPeople } from './coding-icons';
import { IconDownload } from '../dashboard-icons';
import { ALL_BATCHES } from '../../../../lib/coding-profiles/programs';

// The sticky control bar: what the page covers and the one button that exports it.
//
// Leaderboard: scope pills (everyone, or one batch) · period · Download report.
// Analytics:   period · Download report.
// It stays pinned while the page scrolls, so the report button is in reach right
// after a filter is changed — nobody has to scroll back to the top to find it.

export default function ScopeBar({
    batch,
    batches = [],
    total,
    measured,
    onBatch,
    showScope = true,
    period,
    onPeriod,
    captures,
    caption,
    onReport,
    reportLabel = 'Download report',
    reportDisabled = false
}) {
    const options = [
        { key: ALL_BATCHES, label: 'All students', count: total },
        ...batches.map((b) => ({ key: b.label, label: b.label, count: b.total }))
    ];

    return (
        <div className={`cp-scope${showScope ? '' : ' cp-scope--period'}`} role="group" aria-label="Scope, period and report">
            {showScope && (
                <>
                    <span className="cp-scope__label">
                        <IconPeople aria-hidden="true" /> Showing
                    </span>
                    <Segmented id="cp-scope" tone="brand" label="Scope" value={batch} onChange={onBatch} options={options} />
                </>
            )}

            <div className="cp-scope__tools">
                <PeriodPicker value={period} onChange={onPeriod} captures={captures} compact={!showScope} />
                <button type="button" className="cp-btn cp-btn--primary cp-btn--compact cp-scope__report" onClick={onReport} disabled={reportDisabled}>
                    <IconDownload aria-hidden="true" />
                    <span className="cp-btn__text">{reportLabel}</span>
                </button>
            </div>

            <span className="cp-scope__note">
                {caption || `${measured} measured · ranks and the report follow this selection`}
            </span>
        </div>
    );
}
