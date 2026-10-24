'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { useAdmin } from './admin-context';
import Segmented from '../dashboard/coding/segmented';
import KpiTiles from '../dashboard/dashboard-kpis';
import RecentTable from '../dashboard/recent-table';
import {
    RegistrationsTrend,
    GenderDonut,
    ProgramDonut,
    BranchBar,
    ResidenceSplit,
    LaptopSplit,
    AdmissionSplit,
    LaptopByProgram,
    BranchYearStacked,
    MoonUptake,
    CgpaBands,
    BacklogSplit
} from '../dashboard/dashboard-charts';
import { RANGES, RANGE_LABELS, formatDateTime } from '../dashboard/dashboard-theme';
import { IconDownload, IconRefresh, IconAlert } from '../dashboard/dashboard-icons';
import { IconPeople } from '../dashboard/coding/coding-icons';
import { REGISTRATION_PROGRAMS } from '../../../lib/registration-schema';

// Registrations analytics, one program at a time or all of them together.
//
// The program and the range live in the URL (?program=&range=), so a refresh or a
// shared link lands on the same figures. Every chart, the KPI tiles, the records
// table and the Excel export all follow the same two selections.
//
// Fetching is one request per selection, cached by `program|range`:
//   • a selection seen before paints from the cache at once and refreshes quietly;
//   • a new one keeps the current report on screen — dimmed, with a progress line
//     in the sticky bar — until its payload lands, then the whole report swaps in
//     one go. The layout is derived from the payload, never from the pill, so the
//     figures and the charts always describe the same program;
//   • selecting again aborts the request in flight, so a slow reply can never
//     overwrite a newer selection;
//   • once a payload lands, the other programs for that range are fetched in the
//     background, one at a time while the browser is idle, so the next click is
//     instant.

const AUTO_REFRESH_MS = 30000;
const PREFETCH_GAP_MS = 350;
const ALL = 'all';
const RANGE_KEYS = new Set(RANGES.map((r) => r.key));
const PROGRAM_KEYS = new Set(REGISTRATION_PROGRAMS.map((p) => p.key));

// The selector before the first payload: every program, no counts yet.
const CATALOGUE = REGISTRATION_PROGRAMS.map((p) => ({
    key: p.key,
    name: p.programName,
    code: p.code,
    open: p.open,
    passoutYear: p.passoutYear,
    yearLabel: p.yearLabel,
    badge: p.badge,
    total: undefined
}));

const keyOf = (program, range) => `${program}|${range}`;
const num = (v) => Number(v || 0).toLocaleString('en-IN');

function readUrl() {
    if (typeof window === 'undefined') return { program: ALL, range: 'all', download: false };
    const q = new URLSearchParams(window.location.search);
    const p = q.get('program');
    const r = q.get('range');
    return {
        program: PROGRAM_KEYS.has(p) ? p : ALL,
        range: RANGE_KEYS.has(r) ? r : 'all',
        download: q.get('download') === '1'
    };
}

export default function RegistrationsAnalytics() {
    const { unauthorized } = useAdmin();
    const [data, setData] = useState(null);
    const [error, setError] = useState('');
    const [program, setProgram] = useState(ALL);
    const [range, setRange] = useState('all');
    const [urlReady, setUrlReady] = useState(false);
    const [loading, setLoading] = useState(false);
    const [refreshing, setRefreshing] = useState(false);
    const [downloading, setDownloading] = useState(false);
    const [autoRefresh, setAutoRefresh] = useState(false);
    const selectionRef = useRef({ program, range });
    selectionRef.current = { program, range };
    const requestRef = useRef(0);
    const abortRef = useRef(null);
    const cacheRef = useRef(new Map());
    const pendingDownload = useRef(false);

    // One GET per (program, range). Whatever triggered it, the payload is cached.
    const fetchStats = useCallback(
        async (p, r, signal) => {
            const res = await fetch(`/api/admin/registrations/stats?range=${r}&program=${p}`, { cache: 'no-store', signal });
            if (res.status === 401) {
                unauthorized();
                return null;
            }
            const json = await res.json();
            if (!res.ok || !json.success) throw new Error(json.message || 'Failed to load analytics.');
            cacheRef.current.set(keyOf(p, r), json);
            return json;
        },
        [unauthorized]
    );

    const loadStats = useCallback(
        async ({ silent = false } = {}) => {
            const { program: p, range: r } = selectionRef.current;
            abortRef.current?.abort();
            const controller = new AbortController();
            abortRef.current = controller;
            const request = ++requestRef.current;

            const cached = cacheRef.current.get(keyOf(p, r));
            if (cached) {
                // Paint what we already have; the request below brings it up to date.
                setData(cached);
                setLoading(false);
                setRefreshing(true);
            } else if (silent) {
                setRefreshing(true);
            } else {
                setLoading(true);
            }
            setError('');

            try {
                const json = await fetchStats(p, r, controller.signal);
                if (!json || request !== requestRef.current) return;
                setData(json);
            } catch (e) {
                if (e?.name === 'AbortError') return; // superseded by a newer selection
                if (request === requestRef.current) setError(e.message || 'Something went wrong.');
            } finally {
                if (request === requestRef.current) {
                    setLoading(false);
                    setRefreshing(false);
                }
            }
        },
        [fetchStats]
    );

    const handleDownload = useCallback(async () => {
        const { program: p, range: r } = selectionRef.current;
        setDownloading(true);
        try {
            const res = await fetch(`/api/admin/registrations/export?range=${r}&program=${p}`, { cache: 'no-store' });
            if (res.status === 401) {
                unauthorized();
                return;
            }
            if (!res.ok) throw new Error('Export failed');
            const blob = await res.blob();
            const disposition = res.headers.get('Content-Disposition') || '';
            const match = /filename="?([^"]+)"?/.exec(disposition);
            const filename = match ? match[1] : `SRKR_Registrations_${p}_${r}.xlsx`;
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = filename;
            document.body.appendChild(a);
            a.click();
            a.remove();
            URL.revokeObjectURL(url);
        } catch {
            setError('Could not generate the Excel report. Please try again.');
        } finally {
            setDownloading(false);
        }
    }, [unauthorized]);

    // Initial selection from the URL; `?download=1` (from the landing card) fires
    // the export once the first payload has landed, then drops out of the URL.
    useEffect(() => {
        const initial = readUrl();
        setProgram(initial.program);
        setRange(initial.range);
        pendingDownload.current = initial.download;
        setUrlReady(true);
    }, []);

    useEffect(() => {
        if (!urlReady) return;
        loadStats();
    }, [urlReady, program, range, loadStats]);

    // Nothing in flight may outlive the page.
    useEffect(() => () => abortRef.current?.abort(), []);

    useEffect(() => {
        if (!urlReady || typeof window === 'undefined') return;
        const url = new URL(window.location.href);
        if (program === ALL) url.searchParams.delete('program');
        else url.searchParams.set('program', program);
        if (range === 'all') url.searchParams.delete('range');
        else url.searchParams.set('range', range);
        url.searchParams.delete('download');
        window.history.replaceState(null, '', url);
    }, [program, range, urlReady]);

    useEffect(() => {
        if (data && pendingDownload.current) {
            pendingDownload.current = false;
            handleDownload();
        }
    }, [data, handleDownload]);

    // Warm the cache for the other programs in this range, one request at a time,
    // once the browser is idle. Runs again whenever a payload lands (cancelling the
    // previous sweep) and skips whatever is already cached.
    useEffect(() => {
        if (!data || typeof window === 'undefined') return undefined;
        const r = data.range;
        const wanted = [ALL, ...CATALOGUE.map((p) => p.key)].filter((p) => !cacheRef.current.has(keyOf(p, r)));
        if (!wanted.length) return undefined;

        let cancelled = false;
        const controller = new AbortController();
        const sweep = async () => {
            for (const p of wanted) {
                if (cancelled || document.visibilityState === 'hidden') return;
                if (cacheRef.current.has(keyOf(p, r))) continue;
                try {
                    await fetchStats(p, r, controller.signal);
                } catch {
                    return; // a struggling server is not worth hammering
                }
                await new Promise((resolve) => setTimeout(resolve, PREFETCH_GAP_MS));
            }
        };
        const useIdle = typeof window.requestIdleCallback === 'function';
        const handle = useIdle ? window.requestIdleCallback(sweep, { timeout: 1500 }) : window.setTimeout(sweep, 600);
        return () => {
            cancelled = true;
            controller.abort();
            if (useIdle) window.cancelIdleCallback(handle);
            else window.clearTimeout(handle);
        };
    }, [data, fetchStats]);

    // Auto-refresh.
    useEffect(() => {
        if (!autoRefresh) return undefined;
        const id = setInterval(() => loadStats({ silent: true }), AUTO_REFRESH_MS);
        return () => clearInterval(id);
    }, [autoRefresh, loadStats]);

    const programs = data?.programs || CATALOGUE;
    const grandTotal = data?.grandTotal ?? 0;
    const rangeLabel = RANGE_LABELS[range] || 'All time';
    const selectedName = program === ALL ? 'All programs' : programs.find((p) => p.key === program)?.name || 'Program';

    // Everything below the sticky bar describes the payload on screen, not the
    // pill — while a new selection loads, the old report stays intact (and dimmed).
    const shown = data?.program || ALL;
    const current = shown === ALL ? null : programs.find((p) => p.key === shown) || null;
    const shownRangeLabel = RANGE_LABELS[data?.range] || 'All time';
    const stale = loading && Boolean(data);
    const showMoon = Boolean(data?.moonCoder) && (shown === ALL || shown === 'mooncoder');
    const showAdmission = shown === ALL || shown === 'bamboo';
    const single = shown !== ALL;

    const programOptions = [
        { key: ALL, label: 'All programs', count: data ? grandTotal : undefined },
        ...programs.map((p) => ({ key: p.key, label: p.name, count: p.total, title: `${p.yearLabel} · ${p.open ? 'open' : 'closed'}` }))
    ];
    const rangeOptions = RANGES.map((r) => ({ key: r.key, label: r.label, title: RANGE_LABELS[r.key] }));

    return (
        <>
            <header className="cp-topbar">
                <div className="cp-topbar__brand">
                    <img
                        className="cp-topbar__logo"
                        src="/assets/images/srkr/project-images/torii-dark-text.svg"
                        alt="ToriiMinds"
                        width="500"
                        height="240"
                    />
                    <div className="cp-topbar__titles">
                        <h1 className="cp-topbar__title">Registrations Analytics</h1>
                        <p className="cp-topbar__sub">
                            {selectedName} · {rangeLabel}
                            {data ? ` · updated ${formatDateTime(data.generatedAt)}` : ''}
                        </p>
                    </div>
                </div>

                <div className="cp-topbar__actions">
                    <button
                        type="button"
                        className={`dash-toggle ${autoRefresh ? 'is-on' : ''}`}
                        onClick={() => setAutoRefresh((v) => !v)}
                        role="switch"
                        aria-checked={autoRefresh}
                        title="Auto-refresh every 30 seconds"
                    >
                        <span className="dash-toggle-label">Auto refresh</span>
                        <span className="dash-switch"><span className="dash-switch-knob" /></span>
                    </button>
                    <button
                        type="button"
                        className={`cp-btn cp-btn--ghost cp-btn--compact${refreshing ? ' is-spinning' : ''}`}
                        onClick={() => loadStats({ silent: true })}
                        disabled={refreshing || loading}
                        aria-label="Refresh"
                    >
                        <IconRefresh /> <span className="cp-btn__text">{refreshing ? 'Refreshing…' : 'Refresh'}</span>
                    </button>
                    <button
                        type="button"
                        className="cp-btn cp-btn--primary cp-btn--compact"
                        onClick={handleDownload}
                        disabled={downloading || !data}
                        aria-label="Download Excel"
                    >
                        <IconDownload /> <span className="cp-btn__text">{downloading ? 'Preparing…' : 'Download Excel'}</span>
                    </button>
                </div>
            </header>

            {/* Program · range. Sticky, so the selection stays in reach; the progress
                line along its bottom edge runs while a payload is on its way. */}
            <div className={`cp-scope ad-scope${loading || refreshing ? ' is-loading' : ''}`} role="group" aria-label="Program and range">
                <span className="cp-scope__label">
                    <IconPeople aria-hidden="true" /> Program
                </span>
                <Segmented id="ad-program" tone="brand" label="Program" value={program} onChange={setProgram} options={programOptions} />
                <div className="cp-scope__tools">
                    <Segmented id="ad-range" size="sm" label="Range" value={range} onChange={setRange} options={rangeOptions} />
                </div>
                <span className="cp-scope__note" aria-live="polite">
                    {stale
                        ? `Loading ${selectedName} · ${rangeLabel.toLowerCase()}…`
                        : data
                          ? `${num(data.kpis.total)} registration${data.kpis.total === 1 ? '' : 's'} · ${shownRangeLabel.toLowerCase()} · every chart, the records and the Excel follow this selection`
                          : 'Loading…'}
                </span>
            </div>

            {error && (
                <div className="dash-card" style={{ borderColor: 'rgba(239,68,68,0.35)', display: 'flex', alignItems: 'center', gap: 12 }}>
                    <span style={{ color: 'var(--srkr-danger)' }}><IconAlert /></span>
                    <span style={{ color: 'var(--srkr-danger)', fontWeight: 500, fontSize: 13.5 }}>{error}</span>
                </div>
            )}

            {loading && !data ? (
                <LoadingSkeleton />
            ) : data ? (
                // Keyed by selection: a new program or range mounts a fresh report (charts
                // animate in from zero) instead of morphing one dataset into another; a
                // refresh of the same selection updates in place.
                <div key={keyOf(shown, data.range)} className={`ad-report${stale ? ' is-stale' : ''}`} aria-busy={stale}>
                    {current && <ProgramCard program={current} data={data} grandTotal={grandTotal} />}

                    <KpiTiles
                        kpis={data.kpis}
                        range={data.range}
                        programCount={single ? 1 : data.byProgram.length}
                        branchCount={data.byBranch.length}
                    />

                    {showMoon && (
                        <>
                            <div className="dash-section-head">
                                <h2>{data.moonCoder.programName} intake</h2>
                                {data.moonCoder.open && <span className="dash-section-tag">Registrations open</span>}
                            </div>
                            <div className="dash-grid">
                                <MoonUptake data={data.moonCoder} span={4} />
                                <CgpaBands data={data.byCgpaBand || []} academics={data.academics} span={4} />
                                <BacklogSplit data={data.byBacklogs || []} span={4} />
                            </div>
                        </>
                    )}

                    <div className="dash-section-head"><h2>Trends & distribution</h2></div>
                    <div className="dash-grid">
                        <RegistrationsTrend data={data.timeSeries} span={8} />
                        <GenderDonut data={data.byGender} span={4} />
                        {single ? (
                            <>
                                <BranchBar data={data.byBranch} span={12} />
                                <ResidenceSplit data={data.byResidence} span={showAdmission ? 4 : 6} />
                                <LaptopSplit data={data.byLaptop || []} span={showAdmission ? 4 : 6} />
                                {showAdmission && <AdmissionSplit data={data.byAdmission || []} span={4} />}
                            </>
                        ) : (
                            <>
                                <BranchBar data={data.byBranch} span={7} />
                                <ProgramDonut data={data.byProgram} />
                                <ResidenceSplit data={data.byResidence} span={6} />
                                <LaptopSplit data={data.byLaptop || []} span={6} />
                                <LaptopByProgram data={data.laptopByProgram || []} span={6} />
                                <AdmissionSplit data={data.byAdmission || []} span={6} />
                                <BranchYearStacked branchByYear={data.branchByYear} byBranch={data.byBranch} />
                            </>
                        )}
                    </div>

                    <div className="dash-section-head"><h2>Registration records</h2></div>
                    <div className="dash-grid">
                        <RecentTable rows={data.recent} />
                    </div>
                </div>
            ) : null}
        </>
    );
}

/** The selected program at a glance: what it is, whether it is open, and its share. */
function ProgramCard({ program, data, grandTotal }) {
    const share = grandTotal ? Math.round((program.total / grandTotal) * 100) : 0;
    return (
        <section className="ad-progcard" aria-label={`${program.name} summary`}>
            <div className="ad-progcard__main">
                <p className="ad-progcard__eyebrow">
                    {program.code} · {program.yearLabel}
                </p>
                <h2 className="ad-progcard__title">{program.name}</h2>
                <p className="ad-progcard__badge">{program.badge}</p>
            </div>
            <dl className="ad-progcard__facts">
                <div>
                    <dt>Registrations</dt>
                    <dd>{num(program.total)}</dd>
                </div>
                <div>
                    <dt>Share of all</dt>
                    <dd>{share}%</dd>
                </div>
                <div>
                    <dt>In this range</dt>
                    <dd>{num(data.kpis.total)}</dd>
                </div>
                <div>
                    <dt>Intake</dt>
                    <dd>
                        <span className={`cp-chip ${program.open ? 'cp-chip--green' : 'cp-chip--slate'}`}>
                            {program.open ? 'Open now' : 'Closed'}
                        </span>
                    </dd>
                </div>
            </dl>
        </section>
    );
}

function LoadingSkeleton() {
    return (
        <div>
            <div className="dash-kpis">
                {[0, 1, 2, 3].map((i) => <div key={i} className="dash-skeleton" style={{ height: 128 }} />)}
            </div>
            <div className="dash-grid" style={{ marginTop: 30 }}>
                <div className="dash-skeleton dash-card--8" style={{ height: 340 }} />
                <div className="dash-skeleton dash-card--4" style={{ height: 340 }} />
                <div className="dash-skeleton dash-card--7" style={{ height: 300 }} />
                <div className="dash-skeleton dash-card--5" style={{ height: 300 }} />
            </div>
        </div>
    );
}
