'use client';

import { useEffect, useMemo, useState } from 'react';
import { useReducedMotion } from 'framer-motion';
import { ResponsiveContainer, BarChart, Bar, Cell, XAxis, YAxis, Tooltip, LabelList } from 'recharts';
import Segmented from './segmented';
import PlatformLogo from './platform-logo';
import { IconTrophy, IconPeople, IconChart, IconMoon, IconPulse, IconChevronRight } from './coding-icons';
import { BRAND, PLATFORMS, formatNumber, formatDate, shortBatch } from './coding-theme';
import { ALL_BATCHES } from '../../../../lib/coding-profiles/programs';
import { useMedia } from './hooks';

// Analytics, in the order a programme lead reads it: who leads overall, who leads
// each batch, who leads each platform — then the two numbers to act on: who is
// inactive and who has not submitted anything yet. Every card carries its own
// filters, and none of them touches the leaderboard's scope.
//
// The leaderboard pages its directory from the server, so this view fetches the
// whole cohort itself — once per capture, cached across visits — because top-N
// and the counts need everyone.
//
// Bars for the top three take the three brand colours in rank order; everyone
// behind them shares one pale amber, so the podium reads at a glance. Every value
// label is --srkr-heading ink — the amber fill is 2:1 on white and never carries text.

const TOP_N = [
    { key: 5, label: 'Top 5' },
    { key: 10, label: 'Top 10' },
    { key: 15, label: 'Top 15' }
];
const RANK_FILL = [BRAND.primary, BRAND.secondary, BRAND.tertiary];
const FIELD_FILL = 'rgba(242, 166, 59, 0.3)'; // --srkr-tertiary @ 30% — the field behind the podium three
const CURSOR = { fill: 'rgba(15, 23, 42, 0.04)' }; // --srkr-heading @ 4% hover band
const ROW_H = 34;

const n = (v) => (Number.isFinite(Number(v)) ? Number(v) : 0);
const pct = (part, whole) => (whole ? Math.round((100 * part) / whole) : 0);
const measuredOf = (list) => list.filter((s) => s.dataCaptured);
const inBatch = (list, batch) => (!batch || batch === ALL_BATCHES ? list : list.filter((s) => s.batch === batch));
const scopeName = (batch) => (!batch || batch === ALL_BATCHES ? 'all students' : batch);

// Mirrors platformsTouched in lib/coding-profiles/score.js, split per platform.
const ACTIVITY = {
    lc: { keys: ['lcTotal'], test: (m) => n(m.lcTotal) > 0 },
    cc: { keys: ['ccProblems'], test: (m) => n(m.ccProblems) > 0 },
    hr: { keys: ['hrTotalStars', 'hrBadges'], test: (m) => n(m.hrTotalStars) > 0 || n(m.hrBadges) > 0 },
    gfg: { keys: ['gfgPrograms', 'gfgScore'], test: (m) => n(m.gfgPrograms) > 0 || n(m.gfgScore) > 0 }
};

/** A field has signal if the snapshot's coverage says so; without coverage, if any row is non-zero. */
function hasSignal(coverage, students, keys) {
    return keys.some((key) => {
        const c = coverage?.[key];
        if (c && typeof c.nonzero === 'number') return c.nonzero > 0;
        return students.some((s) => n(s.metrics?.[key]) > 0);
    });
}

// `short` gives "B1"-style labels for the narrow number cards, with the full name
// on hover.
const batchOptions = (batches, withAll, short = false) => [
    ...(withAll ? [{ key: ALL_BATCHES, label: 'All' }] : []),
    ...batches.map((b) => ({ key: b.label, label: short ? shortBatch(b.label) : b.label, title: short ? b.label : undefined }))
];

/** Chart row: what the bar, the tick and the tooltip all read from. */
const rowOf = (s, rank, value) => ({
    rollKey: s.rollKey,
    rollNo: s.rollNo,
    name: s.name || s.rollNo,
    batch: s.batch,
    branch: s.branch,
    metrics: s.metrics,
    student: s,
    rank,
    value,
    valueLabel: formatNumber(value)
});

// ── Data ────────────────────────────────────────────────────────────────────

// One cohort per capture, kept across view switches so coming back to Analytics
// never refetches 300 records. A new snapshot id means a new upload, and a fresh key.
let cohortCache = { key: null, students: null };

function useCohort(programCode, snapshotId, period) {
    const key = `${programCode}:${snapshotId || 'none'}:${period ? `${period.from}..${period.to}` : 'all'}`;
    const cached = cohortCache.key === key ? cohortCache.students : null;
    const [students, setStudents] = useState(cached);
    const [error, setError] = useState('');

    useEffect(() => {
        if (cohortCache.key === key && cohortCache.students) {
            setStudents(cohortCache.students);
            return undefined;
        }
        let live = true;
        setStudents(null);
        setError('');
        const qs = new URLSearchParams({ program: programCode, batch: 'all', limit: 'all', ...(period ? { from: period.from, to: period.to } : {}) });
        fetch(`/api/admin/coding/students?${qs}`, { cache: 'no-store' })
            .then(async (res) => {
                const json = await res.json().catch(() => ({}));
                if (!res.ok || !json.success) throw new Error(json.message || 'Could not load the cohort.');
                return json.students || [];
            })
            .then((list) => {
                cohortCache = { key, students: list };
                if (live) setStudents(list);
            })
            .catch((e) => {
                if (live) setError(e.message || 'Could not load the cohort.');
            });
        return () => {
            live = false;
        };
        // `key` already encodes the period.
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [key, programCode]);

    return { students, error };
}

export default function AnalyticsView({
    program, batches = [], coverage, mode = 'baseline', previousSnapshot, snapshotId, period = null, periodInfo = null, groupLabel = 'Batch',
    onSelect, onInspect
}) {
    const reduce = useReducedMotion();
    const narrow = useMedia('(max-width: 560px)');
    const { students, error } = useCohort(program.code, snapshotId, period);
    const measured = useMemo(() => measuredOf(students || []), [students]);
    const chart = { narrow, reduce, onSelect };
    const periodLabel = periodInfo?.label || null;

    if (error) {
        return (
            <div className="cp-an-empty">
                <h3>Analytics could not be loaded</h3>
                <p>{error}</p>
            </div>
        );
    }
    if (!students) return <div className="cp-boot">Loading the cohort…</div>;
    if (!measured.length) {
        return (
            <div className="cp-an-empty">
                <h3>No captured profiles{periodLabel ? ` in ${periodLabel}` : ' yet'}</h3>
                <p>Charts need at least one scraped row. Upload a capture to see who leads.</p>
            </div>
        );
    }

    return (
        <section className="cp-an" aria-label={`${program?.name || 'Program'} analytics${periodLabel ? ` for ${periodLabel}` : ''}`}>
            <div className="cp-an-grid">
                <TopOverall students={students} measured={measured} chart={chart} periodLabel={periodLabel} />
                <TopByBatch students={students} batches={batches} chart={chart} periodLabel={periodLabel} groupLabel={groupLabel} />
                <TopByPlatform students={students} batches={batches} coverage={coverage} chart={chart} periodLabel={periodLabel} groupLabel={groupLabel} />
                <InactiveCard
                    students={students}
                    batches={batches}
                    groupLabel={groupLabel}
                    mode={mode}
                    previousAt={previousSnapshot?.capturedAt}
                    periodInfo={periodInfo}
                    onInspect={onInspect}
                />
                <NoSubmissionsCard students={students} batches={batches} coverage={coverage} periodLabel={periodLabel} onInspect={onInspect} groupLabel={groupLabel} />
            </div>
        </section>
    );
}

// ── Building blocks ─────────────────────────────────────────────────────────

function Card({ title, sub, icon: Icon, filters, span = 'half', ariaLabel, children }) {
    return (
        <section className={`cp-an-card cp-an-card--${span}`} aria-label={ariaLabel || title}>
            <header className="cp-an-card__head">
                <div className="cp-an-card__titles">
                    <span className="cp-an-card__icon" aria-hidden="true">
                        <Icon />
                    </span>
                    <div className="cp-an-card__text">
                        <h3 className="cp-an-card__title">{title}</h3>
                        <p className="cp-an-card__sub">{sub}</p>
                    </div>
                </div>
                {filters && <div className="cp-an-filters">{filters}</div>}
            </header>
            {children}
        </section>
    );
}

// Approximate glyph widths at the tick's 12.5px: capitals and digits run about
// 8.6px, lower-case 7px, spaces and punctuation 3.6px. Roster names are often all
// caps, so a character count alone over-fills the axis by a third.
const glyphWidth = (ch) => (/[A-Z0-9]/.test(ch) ? 8.6 : /[a-z]/.test(ch) ? 7 : 3.6);

/** Truncates a name to a pixel budget, ending in an ellipsis. */
function fitName(name, budget) {
    let width = 0;
    for (let i = 0; i < name.length; i += 1) {
        width += glyphWidth(name[i]);
        if (width > budget) return `${name.slice(0, Math.max(1, i - 1)).trimEnd()}…`;
    }
    return name;
}

/** "#4  G T S Purnima" — rank in muted ink, name in heading ink, fitted to the axis. */
function NameTick({ x, y, payload, byKey, budget }) {
    const row = byKey.get(payload?.value);
    if (!row) return null;
    const name = fitName(row.name, budget);
    return (
        <text x={x} y={y} dy={4} textAnchor="end" fontSize={12.5} fontWeight={600} fill={BRAND.heading}>
            <tspan fill={BRAND.muted} fontSize={11} fontWeight={800}>{`#${row.rank}  `}</tspan>
            <tspan>{name}</tspan>
        </text>
    );
}

function ContenderTip({ active, payload, unit }) {
    if (!active || !payload?.length) return null;
    const r = payload[0].payload || {};
    return (
        <div className="cp-an-tooltip">
            <div className="cp-an-tooltip__title">
                #{r.rank} {r.name}
            </div>
            <div className="cp-an-tooltip__meta">
                {r.rollNo} · {r.branch} · {r.batch}
            </div>
            <div className="cp-an-tooltip__row cp-an-tooltip__row--lead">
                <span>{unit}</span>
                <b>{formatNumber(r.value)}</b>
            </div>
            {PLATFORMS.map((p) => (
                <div className="cp-an-tooltip__row" key={p.key}>
                    <PlatformLogo platform={p} size="xs" />
                    <span>{p.name}</span>
                    <b>{formatNumber(n(r.metrics?.[p.metricKey]))}</b>
                </div>
            ))}
            <div className="cp-an-tooltip__hint">Click to open the profile</div>
        </div>
    );
}

/**
 * One horizontal bar per student, best at the top. The bars are clickable; the
 * list after the chart is their keyboard twin and only becomes visible when tabbed
 * into, so it never duplicates the chart for sighted mouse users.
 */
function ContenderChart({ rows, unit, chart }) {
    const { narrow, reduce, onSelect } = chart;
    const byKey = useMemo(() => new Map(rows.map((r) => [r.rollKey, r])), [rows]);
    // The axis holds "#10  " (about 34px) plus the name; the name's pixel budget is
    // what is left after that and a little breathing room.
    const axisWidth = narrow ? 122 : 196;
    const budget = axisWidth - 34 - 8;
    const height = rows.length * ROW_H + 12;
    // Headroom past the longest bar so its end label never clips at the card edge.
    const ceiling = Math.max(1, Math.ceil((rows[0]?.value || 1) * 1.2));

    return (
        <>
            <div className="cp-an-chart cp-an-chart--click">
                <ResponsiveContainer width="100%" height={height}>
                    <BarChart data={rows} layout="vertical" margin={{ top: 4, right: 52, left: 0, bottom: 4 }} barCategoryGap="26%">
                        <XAxis type="number" hide domain={[0, ceiling]} />
                        <YAxis
                            type="category"
                            dataKey="rollKey"
                            width={axisWidth}
                            tickLine={false}
                            axisLine={false}
                            interval={0}
                            tick={<NameTick byKey={byKey} budget={budget} />}
                        />
                        <Tooltip cursor={CURSOR} content={<ContenderTip unit={unit} />} />
                        <Bar
                            dataKey="value"
                            radius={[0, 6, 6, 0]}
                            maxBarSize={22}
                            isAnimationActive={!reduce}
                            onClick={(_, index) => onSelect?.(rows[index]?.student)}
                        >
                            {rows.map((r, i) => (
                                <Cell key={r.rollKey} fill={i < 3 ? RANK_FILL[i] : FIELD_FILL} />
                            ))}
                            <LabelList dataKey="valueLabel" position="right" fontSize={12} fontWeight={700} fill={BRAND.heading} />
                        </Bar>
                    </BarChart>
                </ResponsiveContainer>
            </div>
            <ul className="cp-an-keylist" aria-label="Open a student's profile">
                {rows.map((r) => (
                    <li key={r.rollKey}>
                        <button type="button" className="cp-an-key" onClick={() => onSelect?.(r.student)}>
                            #{r.rank} {r.name}
                            <span>{r.valueLabel}</span>
                        </button>
                    </li>
                ))}
            </ul>
        </>
    );
}

function Nobody({ children }) {
    return <p className="cp-an-nothing">{children}</p>;
}

// ── Top contenders ──────────────────────────────────────────────────────────

function TopOverall({ students, measured, chart, periodLabel }) {
    const [limit, setLimit] = useState(10);
    // The API returns students in overall rank order.
    const rows = useMemo(
        () => students.filter((s) => s.overallRank !== null && s.overallRank !== undefined).slice(0, limit).map((s) => rowOf(s, s.overallRank, s.score)),
        [students, limit]
    );
    const leader = rows[0];
    const active = measured.filter((s) => n(s.platformsTouched) > 0).length;
    const inPeriod = periodLabel ? ` in ${periodLabel}` : '';

    return (
        <Card
            title="Top contenders · overall"
            icon={IconTrophy}
            sub={
                leader
                    ? `By total solved${inPeriod} across all ${formatNumber(active)} active students. ${leader.name} leads with ${leader.valueLabel}.`
                    : `By total solved${inPeriod} across the whole cohort.`
            }
            filters={<Segmented id="an-overall-n" size="sm" label="How many" value={limit} onChange={setLimit} options={TOP_N} />}
        >
            {rows.length ? <ContenderChart rows={rows} unit="Total solved" chart={chart} /> : <Nobody>Nobody has recorded any activity yet.</Nobody>}
        </Card>
    );
}

function TopByBatch({ students, batches, chart, periodLabel, groupLabel = 'Batch' }) {
    const [batch, setBatch] = useState(batches[0]?.label || ALL_BATCHES);
    const [limit, setLimit] = useState(10);
    const rows = useMemo(
        () =>
            students
                .filter((s) => s.batch === batch && s.batchRank !== null && s.batchRank !== undefined)
                .slice(0, limit)
                .map((s) => rowOf(s, s.batchRank, s.score)),
        [students, batch, limit]
    );
    const leader = rows[0];
    const inPeriod = periodLabel ? ` in ${periodLabel}` : '';

    return (
        <Card
            title={`Top contenders · by ${groupLabel.toLowerCase()}`}
            icon={IconPeople}
            sub={
                leader
                    ? `Total solved${inPeriod}, ranked within ${batch} only. ${leader.name} leads the ${groupLabel.toLowerCase()} with ${leader.valueLabel}.`
                    : `Total solved${inPeriod}, ranked within ${batch} only.`
            }
            filters={
                <>
                    <Segmented id="an-batch-pick" size="sm" label={groupLabel} value={batch} onChange={setBatch} options={batchOptions(batches, false)} />
                    <Segmented id="an-batch-n" size="sm" label="How many" value={limit} onChange={setLimit} options={TOP_N} />
                </>
            }
        >
            {rows.length ? <ContenderChart rows={rows} unit="Total solved" chart={chart} /> : <Nobody>Nobody in {batch} has recorded any activity yet.</Nobody>}
        </Card>
    );
}

function TopByPlatform({ students, batches, coverage, chart, periodLabel, groupLabel = 'Batch' }) {
    const platforms = useMemo(
        () => PLATFORMS.filter((p) => hasSignal(coverage, students, ACTIVITY[p.key].keys)),
        [coverage, students]
    );
    const [platformKey, setPlatformKey] = useState(platforms[0]?.key || 'lc');
    const [batch, setBatch] = useState(ALL_BATCHES);
    const [limit, setLimit] = useState(10);
    const platform = platforms.find((p) => p.key === platformKey) || platforms[0] || PLATFORMS[0];

    // Raw activity on that platform, uncapped — what a student recognises from their
    // own profile page. Competition ranking: equal counts share a rank.
    const rows = useMemo(() => {
        const value = (s) => n(s.metrics?.[platform.metricKey]);
        const ranked = measuredOf(inBatch(students, batch))
            .filter((s) => value(s) > 0)
            .sort((a, b) => value(b) - value(a) || (b.score ?? 0) - (a.score ?? 0) || String(a.rollKey).localeCompare(String(b.rollKey)))
            .slice(0, limit);
        let lastValue = null;
        let lastRank = 0;
        return ranked.map((s, i) => {
            const v = value(s);
            const rank = v === lastValue ? lastRank : i + 1;
            lastValue = v;
            lastRank = rank;
            return rowOf(s, rank, v);
        });
    }, [students, batch, limit, platform]);
    const leader = rows[0];

    return (
        <Card
            title="Top contenders · by platform"
            icon={IconChart}
            sub={
                leader
                    ? `${platform.name} ${platform.unit} in ${scopeName(batch)}${periodLabel ? ` during ${periodLabel}` : ''}. ${leader.name} leads with ${leader.valueLabel}.`
                    : `${platform.name} ${platform.unit} in ${scopeName(batch)}${periodLabel ? ` during ${periodLabel}` : ''}.`
            }
            filters={
                <>
                    <Segmented
                        id="an-platform-pick"
                        size="sm"
                        label="Platform"
                        value={platform.key}
                        onChange={setPlatformKey}
                        options={platforms.map((p) => ({ key: p.key, label: p.name, icon: <PlatformLogo platform={p} size="xs" /> }))}
                    />
                    <Segmented id="an-platform-batch" size="sm" label={groupLabel} value={batch} onChange={setBatch} options={batchOptions(batches, true)} />
                    <Segmented id="an-platform-n" size="sm" label="How many" value={limit} onChange={setLimit} options={TOP_N} />
                </>
            }
        >
            {rows.length ? (
                <ContenderChart rows={rows} unit={`${platform.name} ${platform.unit}`} chart={chart} />
            ) : (
                <Nobody>
                    Nobody in {scopeName(batch)} has {platform.name} activity yet.
                </Nobody>
            )}
        </Card>
    );
}

// ── The two numbers to act on ───────────────────────────────────────────────

/**
 * Inactive. With one capture the only inactivity signal is "nothing on any
 * platform"; from the second capture on it becomes the stronger "no score movement
 * since the previous capture", which is what a weekly check actually wants.
 */
function InactiveCard({ students, batches, mode, previousAt, periodInfo, onInspect, groupLabel = 'Batch' }) {
    const [batch, setBatch] = useState(ALL_BATCHES);
    const progress = mode === 'progress';
    const inPeriod = Boolean(periodInfo);
    // Under a period every count is already "what was added inside it", so no
    // activity on any platform IS no progress in the period.
    const isInactive = progress
        ? (s) => s.previousScore !== null && s.previousScore !== undefined && s.delta === 0
        : (s) => !n(s.platformsTouched);

    const perBatch = batches.map((b) => {
        const m = measuredOf(students.filter((s) => s.batch === b.label));
        return { label: b.label, count: m.filter(isInactive).length, measured: m.length };
    });
    const scope = measuredOf(inBatch(students, batch));
    const count = scope.filter(isInactive).length;
    const share = pct(count, scope.length);
    const firstTimers = progress ? scope.filter((s) => s.previousScore === null || s.previousScore === undefined).length : 0;
    const tallest = Math.max(1, ...perBatch.map((b) => b.count));
    const summaryText = perBatch.map((b) => `${b.label} ${b.count} of ${b.measured}`).join(', ');

    return (
        <Card
            title={inPeriod ? 'No progress' : 'Inactive'}
            icon={IconMoon}
            span="third"
            ariaLabel={`${inPeriod ? 'No progress' : 'Inactive'}: ${count} of ${scope.length} measured in ${scopeName(batch)}. By batch: ${summaryText}.`}
            sub={
                inPeriod
                    ? `Nothing solved on any platform in ${periodInfo.label}.`
                    : progress
                      ? `Nothing new solved since the previous capture (${formatDate(previousAt)}).`
                      : 'Profile captured, but nothing on any of the four platforms yet.'
            }
            filters={<Segmented id="an-inactive-batch" size="sm" label={groupLabel} value={batch} onChange={setBatch} options={batchOptions(batches, true, true)} />}
        >
            <div className="cp-an-num">
                <div className="cp-an-ring" style={{ '--cp-share': `${share}%` }} aria-hidden="true">
                    <span>{share}%</span>
                </div>
                <div className="cp-an-num__body">
                    <strong className="cp-an-num__value">{formatNumber(count)}</strong>
                    <span className="cp-an-num__of">
                        of {formatNumber(scope.length)} measured in {scopeName(batch)}
                    </span>
                </div>
            </div>

            <ol className="cp-an-minibars" aria-hidden="true">
                {perBatch.map((b) => (
                    <li key={b.label} className={`cp-an-minibar${batch === b.label ? ' is-active' : ''}`}>
                        <button type="button" tabIndex={-1} onClick={() => setBatch(batch === b.label ? ALL_BATCHES : b.label)}>
                            <span className="cp-an-minibar__value">{b.count}</span>
                            <span className="cp-an-minibar__track">
                                <span className="cp-an-minibar__fill" style={{ height: `${Math.max(4, Math.round((100 * b.count) / tallest))}%` }} />
                            </span>
                            <span className="cp-an-minibar__label">{shortBatch(b.label)}</span>
                        </button>
                    </li>
                ))}
            </ol>

            <p className="cp-an-card__foot">
                {inPeriod
                    ? periodInfo.caption
                    : progress
                      ? firstTimers > 0
                          ? `${firstTimers} captured for the first time this run and not counted.`
                          : 'Students captured for the first time this run are not counted.'
                      : 'From the second capture on, this tracks who made no progress between captures.'}
            </p>
            <button type="button" className="cp-an-link" onClick={() => onInspect?.(batch, progress ? 'stalled' : 'quiet')}>
                See who in the leaderboard
                <IconChevronRight aria-hidden="true" />
            </button>
        </Card>
    );
}

/** No submissions yet — overall, and then where the gaps are, platform by platform. */
function NoSubmissionsCard({ students, batches, coverage, periodLabel, onInspect, groupLabel = 'Batch' }) {
    const [batch, setBatch] = useState(ALL_BATCHES);
    const scope = measuredOf(inBatch(students, batch));
    const none = scope.filter((s) => !n(s.platformsTouched)).length;
    const rows = PLATFORMS.filter((p) => hasSignal(coverage, students, ACTIVITY[p.key].keys)).map((p) => {
        const count = scope.filter((s) => !ACTIVITY[p.key].test(s.metrics || {})).length;
        return { ...p, count, share: pct(count, scope.length) };
    });
    const summaryText = rows.map((p) => `${p.name} ${p.count} (${p.share}%)`).join(', ');

    return (
        <Card
            title={periodLabel ? `No submissions in ${periodLabel}` : 'No submissions yet'}
            icon={IconPulse}
            span="third"
            ariaLabel={`No submissions in ${scopeName(batch)}${periodLabel ? ` during ${periodLabel}` : ''}: ${none} of ${scope.length} have nothing on any platform. By platform: ${summaryText}.`}
            sub={
                periodLabel
                    ? `Who solved nothing on each platform during ${periodLabel}. A student counts on every platform they left untouched.`
                    : 'Who has not solved anything on each platform. A student counts on every platform they have left untouched.'
            }
            filters={<Segmented id="an-nosub-batch" size="sm" label={groupLabel} value={batch} onChange={setBatch} options={batchOptions(batches, true, true)} />}
        >
            <div className="cp-an-num cp-an-num--inline">
                <strong className="cp-an-num__value">{formatNumber(none)}</strong>
                <span className="cp-an-num__of">
                    have nothing on any platform · {pct(none, scope.length)}% of {formatNumber(scope.length)} measured in {scopeName(batch)}
                </span>
            </div>

            <ul className="cp-an-gaps" aria-hidden="true">
                {rows.map((p) => (
                    <li key={p.key} className="cp-an-gap" style={{ '--cp-gap-accent': p.accent }}>
                        <span className="cp-an-gap__name">
                            <PlatformLogo platform={p} size="xs" />
                            {p.name}
                        </span>
                        <span className="cp-an-gap__track">
                            <span className="cp-an-gap__fill" style={{ width: `${Math.max(1, p.share)}%` }} />
                        </span>
                        <span className="cp-an-gap__value">
                            {formatNumber(p.count)} <small>· {p.share}%</small>
                        </span>
                    </li>
                ))}
            </ul>

            <button type="button" className="cp-an-link" onClick={() => onInspect?.(batch, 'quiet')}>
                See who in the leaderboard
                <IconChevronRight aria-hidden="true" />
            </button>
        </Card>
    );
}
