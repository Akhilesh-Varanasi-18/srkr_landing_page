'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { createPortal, flushSync } from 'react-dom';
import dynamic from 'next/dynamic';
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion';
import { useAdmin } from '../../admin/admin-context';
import { IconRefresh, IconUpload } from '../dashboard-icons';
import { IconTrophy, IconChart, IconSparkle } from './coding-icons';
import { AvatarSpriteDefs } from './avatar-sprite';
import HeroBanner from './hero-banner';
import ScopeBar from './scope-bar';
import Segmented from './segmented';
import KpiTiles from './kpi-tiles';
import Podium from './podium';
import PlatformLogo from './platform-logo';
import PeriodEmpty from './period-empty';
import FilterBar, { SORTS } from './filter-bar';
import Directory from './student-grid';
import StudentDetail from './student-detail';
import UploadPanel from './upload-panel';
import ProgramWizard from './program-wizard';
import { ALL_BATCHES, ALL_PROGRAMS } from '../../../../lib/coding-profiles/programs';
import { DEFAULT_PAGE_SIZE } from '../../../../lib/coding-profiles/cohort';
import { parsePeriod, describePeriod } from '../../../../lib/coding-profiles/period';
import { PLATFORMS, formatDate, daysSince, stalenessLevel } from './coding-theme';

// recharts is the single largest dependency on this page and only the Analytics tab
// draws a chart, so that view is loaded on first use rather than shipped with the
// Leaderboard. `ssr: false` also keeps recharts' layout-effect mounting out of the
// server render entirely.
const AnalyticsView = dynamic(() => import('./analytics-view'), {
    ssr: false,
    loading: () => <div className="cp-boot">Loading charts…</div>
});

// The coding-profiles module inside the admin shell.
//
// Three selections every number follows, all in the URL (?program=&view=&from=&to=):
//   • PROGRAM — one program, or "all" (every program's roster ranked together,
//     grouped by program where a single program groups by batch);
//   • VIEW — leaderboard or analytics;
//   • PERIOD — all time, or a date range.
// Scope (all students / one group) sits in the sticky bar with the period and the
// report button. Two requests feed the leaderboard: /overview for everything computed
// over the whole scope, /students for one page of cards.

const VIEWS = [
    { key: 'leaderboard', label: 'Leaderboard', icon: <IconTrophy /> },
    { key: 'analytics', label: 'Analytics', icon: <IconChart /> }
];
const VIEW_KEYS = new Set(VIEWS.map((v) => v.key));
const SEARCH_DEBOUNCE_MS = 300;

const IconPlus = () => (
    <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" aria-hidden="true">
        <path d="M12 5v14M5 12h14" />
    </svg>
);

/** ?program=, ?view=, ?from=&to= and ?new=1 as the page was opened. */
function readUrlState() {
    if (typeof window === 'undefined') return { view: 'leaderboard', period: null, program: null, openNew: false };
    const q = new URLSearchParams(window.location.search);
    const v = q.get('view');
    return {
        view: VIEW_KEYS.has(v) ? v : 'leaderboard',
        period: parsePeriod(q.get('from'), q.get('to')),
        program: q.get('program'),
        openNew: q.get('new') === '1'
    };
}

const EMPTY_ROWS = { students: [], total: 0, page: 1, pages: 1 };
const ALL_PLACEHOLDER = { code: ALL_PROGRAMS, name: 'All programs', college: 'SRKR', yearLabel: 'Every intake', tagline: 'Every student across every program, ranked together' };

export default function CodingClient() {
    const { unauthorized } = useAdmin();
    const [programs, setPrograms] = useState(null); // null until the list has loaded
    const [code, setCodeState] = useState(null); // selected program code, or 'all'
    const [overview, setOverview] = useState(null);
    const [rows, setRows] = useState(EMPTY_ROWS);
    const [rowsLoading, setRowsLoading] = useState(false);
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const [preparing, setPreparing] = useState(false);

    const [view, setViewState] = useState('leaderboard');
    const [period, setPeriodState] = useState(null);
    const [urlReady, setUrlReady] = useState(false);
    const [batch, setBatch] = useState(ALL_BATCHES);
    const [status, setStatus] = useState('all');
    const [sort, setSort] = useState('score');
    const [query, setQuery] = useState('');
    const [debouncedQuery, setDebouncedQuery] = useState('');
    const [page, setPage] = useState(1);
    const [pageSize, setPageSize] = useState(DEFAULT_PAGE_SIZE);
    const [board, setBoard] = useState('overall');
    const [selected, setSelected] = useState(null);
    const [uploadOpen, setUploadOpen] = useState(false);
    const [wizardOpen, setWizardOpen] = useState(false);
    const [removing, setRemoving] = useState(false);
    const [printing, setPrinting] = useState(false);
    const [printRows, setPrintRows] = useState(null);
    const [printQueued, setPrintQueued] = useState(false);
    const [scrollTarget, setScrollTarget] = useState(null);
    const [mounted, setMounted] = useState(false);

    // The control that opened the detail panel, so closing it can hand focus back
    // even when that student's card sits on another directory page; and the record
    // it opened, for students who are not on the current page at all.
    const openerRef = useRef(null);
    const selectedRef = useRef(null);
    // 'first' | 'last': which card to open once the next page has loaded, when
    // arrow keys walk off the end of this one.
    const pendingPickRef = useRef(null);
    const rowsRequestRef = useRef(0);
    const reduce = useReducedMotion();

    // ── Data ────────────────────────────────────────────────────────────────
    const api = useCallback(
        async (path, params) => {
            const qs = new URLSearchParams({
                program: code,
                ...(period ? { from: period.from, to: period.to } : {}),
                ...params
            });
            const res = await fetch(`/api/admin/coding/${path}?${qs}`, { cache: 'no-store' });
            if (res.status === 401) {
                unauthorized();
                return null;
            }
            const json = await res.json().catch(() => ({}));
            if (!res.ok || !json.success) throw new Error(json.message || 'Could not load analytics.');
            return json;
        },
        [code, period, unauthorized]
    );

    const loadPrograms = useCallback(async () => {
        const res = await fetch('/api/admin/coding/programs', { cache: 'no-store' });
        if (res.status === 401) {
            unauthorized();
            return null;
        }
        const json = await res.json().catch(() => ({}));
        if (!res.ok || !json.success) throw new Error(json.message || 'Could not load the programs.');
        setPrograms(json.programs);
        return json.programs;
    }, [unauthorized]);

    const loadOverview = useCallback(async () => {
        if (!code) return;
        setLoading(true);
        setError('');
        try {
            const json = await api('overview', { batch });
            if (json) setOverview(json);
        } catch (e) {
            setError(e.message || 'Something went wrong.');
        } finally {
            setLoading(false);
        }
    }, [api, batch, code]);

    const loadRows = useCallback(async () => {
        if (!code) return;
        const request = ++rowsRequestRef.current;
        setRowsLoading(true);
        try {
            const json = await api('students', {
                batch,
                page,
                limit: pageSize,
                sort,
                status,
                q: debouncedQuery,
                excludePodium: board === 'overall' ? '1' : '0'
            });
            // A slower, older request must never overwrite a newer page.
            if (!json || request !== rowsRequestRef.current) return;
            setRows(json);
            if (pendingPickRef.current && json.students.length) {
                const list = json.students;
                const next = pendingPickRef.current === 'first' ? list[0] : list[list.length - 1];
                selectedRef.current = next;
                setSelected(next.rollKey);
            }
            pendingPickRef.current = null;
        } catch (e) {
            if (request === rowsRequestRef.current) setError(e.message || 'Could not load students.');
        } finally {
            if (request === rowsRequestRef.current) setRowsLoading(false);
        }
    }, [api, batch, page, pageSize, sort, status, debouncedQuery, board, code]);

    const load = useCallback(() => {
        loadOverview();
        loadRows();
    }, [loadOverview, loadRows]);

    // First paint: URL state, then the program list, then whichever program the
    // URL named — else the one program with data, else everything together.
    useEffect(() => {
        setMounted(true);
        const initial = readUrlState();
        setViewState(initial.view);
        setPeriodState(initial.period);
        if (initial.openNew) setWizardOpen(true);
        (async () => {
            try {
                const list = await loadPrograms();
                if (!list) return;
                const wanted = initial.program;
                const valid = wanted === ALL_PROGRAMS || list.some((p) => p.code === wanted);
                const withData = list.filter((p) => p.students > 0);
                setCodeState(
                    valid ? wanted : withData.length === 1 ? withData[0].code : list.length === 1 ? list[0].code : ALL_PROGRAMS
                );
            } catch (e) {
                setError(e.message || 'Could not load the programs.');
                setPrograms([]);
                setCodeState(ALL_PROGRAMS);
            } finally {
                setUrlReady(true);
            }
        })();
    }, [loadPrograms]);

    // The program, the view and the period live in the URL, so a refresh or a shared
    // link lands on the same page with the same numbers — without a router round trip.
    useEffect(() => {
        if (!urlReady || !code || typeof window === 'undefined') return;
        const url = new URL(window.location.href);
        if (code === ALL_PROGRAMS) url.searchParams.delete('program');
        else url.searchParams.set('program', code);
        if (view === 'leaderboard') url.searchParams.delete('view');
        else url.searchParams.set('view', view);
        if (period) {
            url.searchParams.set('from', period.from);
            url.searchParams.set('to', period.to);
        } else {
            url.searchParams.delete('from');
            url.searchParams.delete('to');
        }
        url.searchParams.delete('new');
        window.history.replaceState(null, '', url);
    }, [code, view, period, urlReady]);

    // Scope-level data whenever the program, scope or period changes; the page of
    // cards whenever any listing parameter changes (and only once there is a capture).
    useEffect(() => {
        loadOverview();
    }, [loadOverview]);

    const ready = overview?.state === 'ready';
    const periodEmpty = Boolean(overview?.period?.empty);
    useEffect(() => {
        if (ready && !periodEmpty) loadRows();
    }, [ready, periodEmpty, loadRows]);

    // Typing waits for a pause before it hits the server.
    useEffect(() => {
        const id = setTimeout(() => {
            setDebouncedQuery(query.trim());
            setPage(1);
        }, SEARCH_DEBOUNCE_MS);
        return () => clearTimeout(id);
    }, [query]);

    const setView = useCallback((next) => {
        setViewState(next);
        setSelected(null);
        if (typeof window !== 'undefined') window.scrollTo({ top: 0, behavior: 'auto' });
    }, []);

    // Switching program resets every listing choice — a batch from one program means
    // nothing in another.
    const setCode = useCallback((next) => {
        setCodeState(next);
        setOverview(null);
        setRows(EMPTY_ROWS);
        setBatch(ALL_BATCHES);
        setStatus('all');
        setQuery('');
        setSort('score');
        setBoard('overall');
        setPage(1);
        setSelected(null);
        setError('');
    }, []);

    // Every listing change restarts at page 1.
    const changeBatch = useCallback((next) => {
        setBatch(next);
        setPage(1);
    }, []);
    const changeStatus = useCallback((next) => {
        setStatus(next);
        setPage(1);
    }, []);
    const changeSort = useCallback((next) => {
        setSort(next);
        setPage(1);
    }, []);
    const changePageSize = useCallback((next) => {
        setPageSize(next);
        setPage(1);
    }, []);
    const setPeriod = useCallback((next) => {
        setPeriodState(next);
        setPage(1);
        setSelected(null);
        setRows(EMPTY_ROWS);
    }, []);

    // "Download report" prints what is on screen for the selected scope and period.
    // Leaderboard: hero, KPIs, the overall podium, then EVERY remaining student —
    // the screen only holds one page, so the full list is fetched first, then the
    // board, search and filters are reset and the print fires once the page has had
    // a frame to lay out. Analytics: the charts as they stand.
    const printReport = useCallback(async () => {
        if (view === 'analytics') {
            setPrintQueued(true);
            return;
        }
        setPreparing(true);
        try {
            const json = await api('students', {
                batch,
                limit: 'all',
                sort: 'score',
                status: 'all',
                q: '',
                excludePodium: '1'
            });
            if (!json) return;
            setBoard('overall');
            setStatus('all');
            setQuery('');
            setSort('score');
            setPage(1);
            setPrintRows(json.students);
            setPrintQueued(true);
        } catch (e) {
            setError(e.message || 'Could not prepare the report.');
        } finally {
            setPreparing(false);
        }
    }, [api, batch, view]);

    useEffect(() => {
        if (!printQueued) return undefined;
        if (view === 'leaderboard' && !printRows) return undefined;
        const id = requestAnimationFrame(() => {
            setPrintQueued(false);
            window.print();
        });
        return () => cancelAnimationFrame(id);
    }, [printQueued, view, printRows]);

    // From analytics: "see who" lands on the leaderboard with that group and status
    // applied (same period), scrolled to the directory.
    const inspect = useCallback(
        (nextBatch, nextStatus) => {
            setBatch(nextBatch || ALL_BATCHES);
            setStatus(nextStatus || 'all');
            setQuery('');
            setSort('score');
            setBoard('overall');
            setPage(1);
            setView('leaderboard');
            setScrollTarget('cp-dir-title');
        },
        [setView]
    );

    useEffect(() => {
        if (!scrollTarget || view !== 'leaderboard') return undefined;
        const id = requestAnimationFrame(() => {
            setScrollTarget(null);
            const el = document.getElementById(scrollTarget);
            if (!el) return;
            el.scrollIntoView({ block: 'start', behavior: reduce ? 'auto' : 'smooth' });
            el.focus?.({ preventScroll: true });
        });
        return () => cancelAnimationFrame(id);
    }, [scrollTarget, view, reduce]);

    // Ctrl+P prints whatever page is on screen in full; the report button fetched
    // everyone first. Either way the pager is hidden while printing.
    useEffect(() => {
        // beforeprint is a native, non-discrete event: React 18 would batch this
        // update onto a later task, after the browser has already snapshotted the
        // page for the preview. flushSync commits the full directory first.
        const before = () => flushSync(() => setPrinting(true));
        const after = () => {
            setPrinting(false);
            setPrintRows(null);
        };
        window.addEventListener('beforeprint', before);
        window.addEventListener('afterprint', after);
        return () => {
            window.removeEventListener('beforeprint', before);
            window.removeEventListener('afterprint', after);
        };
    }, []);

    // Changing scope closes the panel: narrowing the batch and widening it again
    // must never bring a stale selection back on its own and steal focus.
    useEffect(() => {
        setSelected(null);
    }, [batch]);

    // A program created in the wizard becomes the selection once it is opened.
    const onWizardFinished = useCallback(
        async (program) => {
            setWizardOpen(false);
            await loadPrograms().catch(() => {});
            setCode(program.code);
        },
        [loadPrograms, setCode]
    );

    // Removing a program that was created by mistake (refused server-side once it
    // holds any data).
    const removeProgram = useCallback(async () => {
        if (!code || code === ALL_PROGRAMS || removing) return;
        const target = programs?.find((p) => p.code === code);
        if (!target || !window.confirm(`Remove "${target.name}"? It holds no roster and no captures.`)) return;
        setRemoving(true);
        try {
            const res = await fetch(`/api/admin/coding/programs/${encodeURIComponent(code)}`, { method: 'DELETE' });
            const json = await res.json().catch(() => ({}));
            if (!res.ok || !json.success) throw new Error(json.message || 'Could not remove the program.');
            await loadPrograms().catch(() => {});
            setCode(ALL_PROGRAMS);
        } catch (e) {
            setError(e.message || 'Could not remove the program.');
        } finally {
            setRemoving(false);
        }
    }, [code, programs, removing, loadPrograms, setCode]);

    // ── Derived ─────────────────────────────────────────────────────────────
    const listed = useMemo(() => printRows || rows.students, [printRows, rows.students]);
    const plainOrder = board === 'overall' && sort === 'score' && status === 'all' && !debouncedQuery;

    // Prev/next walks the visible page so arrow keys move through what is on
    // screen, and crosses to the next or previous page at either end. A student
    // opened from the podium or from an analytics chart may not be on this page —
    // or in this scope — at all, so the record that opened the panel is kept.
    const selectedIndex = listed.findIndex((s) => s.rollKey === selected);
    const selectedStudent = selected
        ? listed[selectedIndex] || (selectedRef.current?.rollKey === selected ? selectedRef.current : null)
        : null;
    const selectedInScope = Boolean(selectedStudent) && (batch === ALL_BATCHES || selectedStudent.batch === batch);
    const batchSummary = selectedStudent?.batch ? overview?.batchSummaries?.[selectedStudent.batch] || null : null;

    // Opening from a control records that control, so Escape can return focus to it
    // even when the student's card sits on another directory page. Prev/next inside
    // the panel deliberately do not overwrite it.
    const select = useCallback((student) => {
        if (!student?.rollKey) return;
        const active = typeof document !== 'undefined' ? document.activeElement : null;
        openerRef.current = active && active !== document.body ? active : null;
        selectedRef.current = student;
        setSelected(student.rollKey);
    }, []);

    const step = useCallback(
        (offset) => {
            const index = selectedIndex + offset;
            if (index >= 0 && index < listed.length) {
                selectedRef.current = listed[index];
                setSelected(listed[index].rollKey);
                return;
            }
            if (printRows) return;
            if (index < 0 && page > 1) {
                pendingPickRef.current = 'last';
                setPage(page - 1);
            } else if (index >= listed.length && page < rows.pages) {
                pendingPickRef.current = 'first';
                setPage(page + 1);
            }
        },
        [listed, selectedIndex, page, rows.pages, printRows]
    );

    // The panel declares aria-modal, which tells assistive tech the page behind it is
    // unreachable; `inert` makes that true for the keyboard and pointer as well. The
    // panel itself is portalled to <body>, outside both, so it stays live. Keyed on
    // open/closed rather than per panel instance: when arrow keys swap students the
    // outgoing instance's cleanup would otherwise lift the inert while the incoming
    // one is already open.
    const detailOpen = Boolean(selectedStudent);
    useEffect(() => {
        if (!detailOpen) return undefined;
        const outside = document.querySelectorAll('.cp-main, .cp-nav');
        outside.forEach((el) => el.setAttribute('inert', ''));
        return () => outside.forEach((el) => el.removeAttribute('inert'));
    }, [detailOpen]);

    const close = useCallback(() => {
        const rollKey = selected;
        const opener = openerRef.current;
        openerRef.current = null;
        setSelected(null);
        requestAnimationFrame(() => {
            // The card for the student they ended on (arrow keys may have moved them),
            // else the control they came from (a podium entry, a chart bar, or a card
            // on another page), else the directory heading — never <body>.
            const card = document.getElementById(`cp-card-${rollKey}`);
            const target =
                card ||
                (opener && document.contains(opener) ? opener : null) ||
                document.getElementById('cp-dir-title');
            target?.focus?.();
        });
    }, [selected]);

    // ── Render ──────────────────────────────────────────────────────────────
    const isAll = code === ALL_PROGRAMS;
    const current = programs?.find((p) => p.code === code) || null;
    const program = overview?.program || current || (isAll ? ALL_PLACEHOLDER : { ...ALL_PLACEHOLDER, name: 'Coding Profiles', tagline: '' });
    const group = overview?.group || (isAll ? 'program' : 'batch');
    const groupLabel = group === 'program' ? 'Program' : 'Batch';
    const scopeLabel = batch === ALL_BATCHES ? 'All students' : batch;
    const scopeLabelLower = batch === ALL_BATCHES ? 'all students' : batch;
    const snapshot = overview?.snapshot || null;
    const stale = stalenessLevel(snapshot?.capturedAt);
    const age = daysSince(snapshot?.capturedAt);
    const batches = overview?.batches || [];
    const summary = overview?.summary || null;
    const periodInfo = overview?.period || null;
    const periodLabel = periodInfo?.label || (period ? describePeriod(period) : null);
    const captures = (overview?.history || []).map((h) => h.capturedAt);
    const sortLabel = SORTS.find((s) => s.key === sort)?.label || 'score';
    const hasPrev = selectedIndex > 0 || (selectedIndex === 0 && !printRows && page > 1);
    const hasNext = selectedIndex >= 0 && (selectedIndex < listed.length - 1 || (!printRows && page < rows.pages));
    const generated = formatDate(new Date().toISOString());
    const totalStudents = (programs || []).reduce((n, p) => n + (p.students || 0), 0);

    const programOptions = [
        { key: ALL_PROGRAMS, label: 'All programs', count: totalStudents },
        ...(programs || []).map((p) => ({
            key: p.code,
            label: p.name,
            count: p.students,
            title: p.capturedAt ? `Captured ${formatDate(p.capturedAt)}` : p.students ? 'No capture yet' : 'No roster yet'
        }))
    ];

    const controlBar = (showScope) => (
        <ScopeBar
            showScope={showScope}
            batch={batch}
            batches={batches}
            total={overview?.total || 0}
            measured={summary?.captured || 0}
            onBatch={changeBatch}
            period={period}
            onPeriod={setPeriod}
            captures={captures}
            caption={periodInfo?.caption || null}
            onReport={printReport}
            reportLabel={preparing ? 'Preparing…' : 'Download report'}
            reportDisabled={preparing || !ready || periodEmpty}
        />
    );

    const detail = (
        <AnimatePresence>
            {selectedStudent && (
                // Keyed independently of the student so it persists across prev/next
                // instead of flashing. Clicking it closes the panel; the page behind is
                // inert while open, so this is also the one thing out there that reacts.
                <motion.div
                    key="cp-detail-scrim"
                    className="cp-detail__scrim"
                    aria-hidden="true"
                    onClick={close}
                    initial={reduce ? false : { opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={reduce ? undefined : { opacity: 0 }}
                    transition={{ duration: reduce ? 0 : 0.2 }}
                />
            )}
            {selectedStudent && (
                <StudentDetail
                    key={selectedStudent.rollKey}
                    student={selectedStudent}
                    coverage={snapshot?.coverage}
                    summary={selectedInScope ? summary : overview?.cohortSummary || summary}
                    batchSummary={batchSummary}
                    periodLabel={periodLabel}
                    onClose={close}
                    onPrev={() => step(-1)}
                    onNext={() => step(1)}
                    hasPrev={hasPrev}
                    hasNext={hasNext}
                />
            )}
        </AnimatePresence>
    );

    return (
        <>
            <AvatarSpriteDefs />

            <header className="cp-topbar">
                <div className="cp-topbar__brand">
                    {/* The "dark text" wordmark: logo-dark.png is the variant FOR dark
                        backgrounds, and on white only its orange gate glyph survives.
                        The rail carries the mark from tablet up, so this one shows on
                        phones and on paper. */}
                    <img
                        className="cp-topbar__logo"
                        src="/assets/images/srkr/project-images/torii-dark-text.svg"
                        alt="ToriiMinds"
                        width="500"
                        height="240"
                    />
                    <div className="cp-topbar__titles">
                        <h1 className="cp-topbar__title">{program.name}</h1>
                        <p className="cp-topbar__sub">
                            {program.college || 'SRKR'}
                            {program.yearLabel ? ` · ${program.yearLabel}` : ''} · Coding profiles
                        </p>
                        <p className="cp-topbar__platforms" aria-label="Platforms tracked">
                            {PLATFORMS.map((p) => (
                                <span key={p.key} className="cp-topbar__platform">
                                    <PlatformLogo platform={p} size="xs" />
                                    {p.name}
                                </span>
                            ))}
                        </p>
                    </div>
                </div>

                <div className="cp-topbar__actions">
                    <Segmented
                        id="cp-view"
                        label="View"
                        value={view}
                        onChange={setView}
                        options={VIEWS.map((v) => ({ key: v.key, label: v.label, icon: v.icon }))}
                        className="cp-topbar__view"
                    />
                    {snapshot && (
                        <span className={`cp-status cp-status--${stale}`} title={snapshot.filename}>
                            <span className="cp-status__dot" aria-hidden="true" />
                            <span className="cp-status__text">
                                Data as of {formatDate(snapshot.capturedAt)}
                                {age !== null && age > 0 && (
                                    <small>
                                        ({age} day{age === 1 ? '' : 's'} ago)
                                    </small>
                                )}
                            </span>
                        </span>
                    )}
                    <button
                        type="button"
                        className="cp-btn cp-btn--ghost cp-btn--compact"
                        onClick={load}
                        disabled={loading || !code}
                        aria-label={loading ? 'Refreshing' : 'Refresh'}
                    >
                        <IconRefresh /> <span className="cp-btn__text">{loading ? 'Refreshing…' : 'Refresh'}</span>
                    </button>
                    <button
                        type="button"
                        className="cp-btn cp-btn--ghost cp-btn--compact"
                        onClick={() => setUploadOpen(true)}
                        disabled={isAll || !current}
                        title={isAll ? 'Pick a program to upload its roster or capture' : undefined}
                        aria-label="Upload data"
                    >
                        <IconUpload /> <span className="cp-btn__text">Upload data</span>
                    </button>
                </div>
            </header>

            {/* Which program: every program together, or one. Creating a program lives
                here too — the admin never needs a developer to add one. */}
            <div className="cp-programs" role="group" aria-label="Program">
                <span className="cp-programs__label">
                    <IconSparkle aria-hidden="true" /> Program
                </span>
                {programs ? (
                    <Segmented id="cp-program" tone="brand" label="Program" value={code || ALL_PROGRAMS} onChange={setCode} options={programOptions} />
                ) : (
                    <span className="cp-programs__loading">Loading programs…</span>
                )}
                <button type="button" className="cp-btn cp-btn--ghost cp-btn--compact cp-programs__new" onClick={() => setWizardOpen(true)}>
                    <IconPlus /> <span className="cp-btn__text">New program</span>
                </button>
            </div>

            {/* The inline alert only accompanies STALE data (a failed Refresh keeps
                the last good payload). With no payload at all the body is an explicit
                error state — never KPI tiles reading 0/0/0 and a podium claiming
                nobody has activity, which would present an outage as a cohort of zero. */}
            {error && overview && <p className="cp-alert cp-alert--error">{error}</p>}

            {!programs || !code ? (
                <div className="cp-boot">Loading…</div>
            ) : programs.length === 0 ? (
                <EmptyState
                    title="No programs yet"
                    body="Create the first program, then load its batch roster and the bot's coding-profile capture. Everything happens from this panel."
                    action="Create a program"
                    onAction={() => setWizardOpen(true)}
                />
            ) : !overview ? (
                loading ? (
                    <div className="cp-boot">Loading…</div>
                ) : (
                    <EmptyState
                        title="Analytics could not be loaded"
                        body={error || 'The overview request did not return any data.'}
                        action="Retry"
                        onAction={load}
                    />
                )
            ) : overview.state === 'no-roster' ? (
                isAll ? (
                    <EmptyState
                        title="No program has a roster yet"
                        body="Pick a program and upload its batch allocation workbook — the bot's export carries roll numbers and metrics but no batch information, so the roster comes first."
                        action="New program"
                        onAction={() => setWizardOpen(true)}
                    />
                ) : (
                    <EmptyState
                        title={`${program.name}: no roster loaded yet`}
                        body="The bot's export carries roll numbers and metrics but no batch information, so the batch allocation workbook has to be loaded first."
                        action="Upload the roster"
                        onAction={() => setUploadOpen(true)}
                        secondary={removing ? 'Removing…' : 'Remove this program'}
                        onSecondary={removeProgram}
                    />
                )
            ) : overview.state === 'no-snapshot' ? (
                <EmptyState
                    title={`${overview.total} students loaded, no capture yet`}
                    body={isAll ? 'No program has a capture yet. Pick one and upload a coding-profile export to see analytics.' : 'Batches look right? Upload a coding-profile export to see analytics.'}
                    action={isAll ? 'Pick a program' : 'Upload a capture'}
                    onAction={isAll ? () => setCode(programs[0].code) : () => setUploadOpen(true)}
                />
            ) : (
                <>
                    {view === 'leaderboard' && (
                        <>
                            <HeroBanner
                                program={program}
                                scopeLabel={scopeLabel}
                                scopeCount={overview.scopedTotal}
                                snapshot={snapshot}
                                periodLabel={periodLabel}
                                periodCaption={periodInfo?.caption || null}
                            />
                            {controlBar(true)}
                            {periodEmpty ? (
                                <PeriodEmpty label={periodLabel} captures={captures} onPick={setPeriod} onReset={() => setPeriod(null)} />
                            ) : (
                                <>
                                    <KpiTiles summary={summary} batches={batches} snapshot={snapshot} periodLabel={periodLabel} groupLabel={groupLabel} />
                                    <Podium
                                        boards={overview.podium}
                                        scopeLabel={scopeLabelLower}
                                        mode={overview.mode}
                                        periodLabel={periodLabel}
                                        board={board}
                                        onBoard={setBoard}
                                        onSelect={select}
                                    />
                                    <FilterBar
                                        query={query}
                                        onQuery={setQuery}
                                        sort={sort}
                                        onSort={changeSort}
                                        status={status}
                                        onStatus={changeStatus}
                                        mode={overview.mode}
                                    />
                                    <Directory
                                        title={plainOrder ? 'Remaining students' : 'Student directory'}
                                        subtitle={
                                            plainOrder
                                                ? `Everyone in ${scopeLabelLower}${periodLabel ? ` for ${periodLabel}` : ''} from #4 onward — the top three are on the podium above`
                                                : `Everyone in ${scopeLabelLower}${periodLabel ? ` for ${periodLabel}` : ''}${debouncedQuery ? ` matching “${debouncedQuery}”` : ''}, sorted by ${sortLabel.toLowerCase()}`
                                        }
                                        students={listed}
                                        total={printRows ? printRows.length : rows.total}
                                        page={rows.page}
                                        pages={rows.pages}
                                        pageSize={pageSize}
                                        onPage={setPage}
                                        onPageSize={changePageSize}
                                        showAll={Boolean(printRows) || printing}
                                        loading={rowsLoading}
                                        periodMode={Boolean(periodLabel)}
                                        onSelect={select}
                                        selectedRollKey={selected}
                                    />
                                </>
                            )}
                        </>
                    )}

                    {view === 'analytics' && (
                        <>
                            <div className="cp-viewhead">
                                <h2 className="cp-viewhead__title">Analytics · {program.name}</h2>
                                <p className="cp-viewhead__sub">
                                    Who leads — overall, {groupLabel.toLowerCase()} by {groupLabel.toLowerCase()}, platform by platform — and who needs a nudge.{' '}
                                    {periodLabel ? `Period: ${periodLabel}.` : `Captured ${formatDate(snapshot?.capturedAt)}.`}
                                </p>
                                <p className="cp-viewhead__print">
                                    Analytics report · {program.name} · <strong>{periodLabel || 'All time'}</strong> ·{' '}
                                    {periodInfo?.caption || `data captured ${formatDate(snapshot?.capturedAt)}`} · generated {generated}
                                </p>
                            </div>
                            {controlBar(false)}
                            {periodEmpty ? (
                                <PeriodEmpty label={periodLabel} captures={captures} onPick={setPeriod} onReset={() => setPeriod(null)} />
                            ) : (
                                <AnalyticsView
                                    program={program}
                                    batches={batches}
                                    coverage={snapshot?.coverage}
                                    mode={overview.mode}
                                    previousSnapshot={overview.previousSnapshot}
                                    snapshotId={snapshot?.id}
                                    period={period}
                                    periodInfo={periodInfo}
                                    groupLabel={groupLabel}
                                    onSelect={select}
                                    onInspect={inspect}
                                />
                            )}
                        </>
                    )}
                </>
            )}

            {/* The detail panel lives outside the (inert) content column. */}
            {mounted ? createPortal(detail, document.body) : null}

            {uploadOpen && current && (
                <UploadPanel
                    program={current}
                    history={overview?.history}
                    onClose={() => setUploadOpen(false)}
                    onCommitted={() => {
                        setUploadOpen(false);
                        loadPrograms().catch(() => {});
                        load();
                    }}
                />
            )}

            {wizardOpen && (
                <ProgramWizard
                    onClose={() => setWizardOpen(false)}
                    onCreated={() => loadPrograms().catch(() => {})}
                    onFinished={onWizardFinished}
                />
            )}
        </>
    );
}

function EmptyState({ title, body, action, onAction, secondary = null, onSecondary = null }) {
    return (
        <div className="cp-emptystate">
            <h2>{title}</h2>
            <p>{body}</p>
            <div className="cp-emptystate__actions">
                <button type="button" className="cp-btn cp-btn--primary" onClick={onAction}>
                    {action}
                </button>
                {secondary && (
                    <button type="button" className="cp-btn cp-btn--ghost" onClick={onSecondary}>
                        {secondary}
                    </button>
                )}
            </div>
        </div>
    );
}
