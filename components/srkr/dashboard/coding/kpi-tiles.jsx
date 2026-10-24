'use client';

import { IconPeople, IconPulse, IconMoon, IconClock } from './coding-icons';
import { formatDate, daysSince } from './coding-theme';

// The four headline numbers under the hero, read straight off the scope summary
// the overview API computed over the FULL population — so paging the directory ten
// at a time never changes a figure here.
//
// "Active" is counted over MEASURED students, not the roster: 9 students have no
// scraped row at all and cannot be called either active or inactive. The tile says
// which denominator it used, every time, so 274/308 and 274/317 are never confused.
// Under a date period "active" means "solved something inside the period".

export default function KpiTiles({ summary, batches, snapshot, periodLabel = null, groupLabel = 'Batch' }) {
    const measured = summary?.captured || 0;
    const started = summary?.started || 0;
    const notStarted = summary?.notStarted || 0;
    const total = summary?.total || 0;
    const pct = (n, d) => (d ? Math.round((n / d) * 1000) / 10 : 0);
    const age = daysSince(snapshot?.capturedAt);
    const inPeriod = periodLabel ? ` in ${periodLabel}` : '';

    const tiles = [
        {
            key: 'total',
            label: 'Total Students',
            value: total,
            sub: `${groupLabel === 'Batch' ? 'Batches' : `${groupLabel}s`}: ${batches.length}${summary?.notCaptured ? ` · ${summary.notCaptured} not captured` : ''}`,
            tone: 'coral',
            Icon: IconPeople,
            fill: total ? measured / total : 0
        },
        {
            key: 'active',
            label: periodLabel ? 'Active in period' : 'Active Students',
            value: started,
            sub: `${pct(started, measured)}% of ${measured} measured solved something${inPeriod}`,
            tone: 'green',
            Icon: IconPulse,
            fill: measured ? started / measured : 0
        },
        {
            key: 'quiet',
            label: periodLabel ? 'No progress' : 'Not Started',
            value: notStarted,
            sub: `${pct(notStarted, measured)}% of measured${periodLabel ? ` added nothing${inPeriod}` : ''}`,
            tone: 'warn',
            Icon: IconMoon,
            fill: measured ? notStarted / measured : 0
        },
        {
            key: 'synced',
            label: 'Last Synced',
            value: snapshot ? formatDate(snapshot.capturedAt) : '—',
            sub:
                age === null
                    ? 'No capture yet'
                    : age === 0
                      ? 'Captured today'
                      : `${age} day${age === 1 ? '' : 's'} ago`,
            tone: 'blue',
            Icon: IconClock,
            fill: null,
            isDate: true
        }
    ];

    return (
        <section className="cp-kpis" aria-label="Cohort summary">
            {tiles.map(({ key, label, value, sub, tone, Icon, fill, isDate }) => (
                <div key={key} className={`cp-kpi cp-kpi--${tone}`}>
                    <span className="cp-kpi__icon" aria-hidden="true">
                        <Icon />
                    </span>
                    <div className="cp-kpi__body">
                        <span className="cp-kpi__label">{label}</span>
                        <span className={`cp-kpi__value${isDate ? ' cp-kpi__value--date' : ''}`}>{value}</span>
                        <span className="cp-kpi__sub">{sub}</span>
                    </div>
                    {fill !== null && (
                        <span className="cp-kpi__track" aria-hidden="true">
                            <span className="cp-kpi__fill" style={{ transform: `scaleX(${Math.min(1, fill)})` }} />
                        </span>
                    )}
                </div>
            ))}
        </section>
    );
}
