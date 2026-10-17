'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { flushSync } from 'react-dom';
import dynamic from 'next/dynamic';
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion';
import LoginGate from '../login-gate';
import { IconRefresh, IconDownload, IconUpload } from '../dashboard-icons';
import { AvatarSpriteDefs } from './avatar-sprite';
import Sidebar, { VIEWS } from './sidebar';
import HeroBanner from './hero-banner';
import ScopeBar from './scope-bar';
import KpiTiles from './kpi-tiles';
import Podium from './podium';
import PlatformLogo from './platform-logo';
import FilterBar, { SORTS } from './filter-bar';
import Directory from './student-grid';
import StudentDetail from './student-detail';
import UploadPanel from './upload-panel';
import { useMedia } from './hooks';
import { ALL_BATCHES } from '../../../../lib/coding-profiles/programs';
import { DEFAULT_PAGE_SIZE } from '../../../../lib/coding-profiles/cohort';
import { PLATFORMS, formatDate, daysSince, stalenessLevel } from './coding-theme';

// recharts is the single largest dependency on this page and only the Analytics tab
// draws a chart, so that view is loaded on first use rather than shipped with the
// Leaderboard. `ssr: false` also keeps recharts' layout-effect mounting out of the
// server render entirely.
const AnalyticsView = dynamic(() => import('./analytics-view'), {
    ssr: false,
    loading: () => <div className="cp-boot">Loading charts…</div>
});

// Two requests feed the leaderboard. /overview returns everything computed over the
// WHOLE scope — KPI figures, the five podium boards, per-batch summaries — in a few
// kilobytes; /students returns one page of cards, sized by the entries control. So
// a page of ten never downloads three hundred records, and a rank on a card is
// still its rank among everyone.

const VIEW_KEYS = new Set(VIEWS.map((v) => v.key));
const NAV_PREF = 'cp-nav';
const SEARCH_DEBOUNCE_MS = 300;

/** Read ?view= once on mount; keep it in the URL after that without a router round trip. */
function readViewFromUrl() {
    if (typeof window === 'undefined') return 'leaderboard';
    const v = new URLSearchParams(window.location.search).get('view');
    return VIEW_KEYS.has(v) ? v : 'leaderboard';
}

const EMPTY_ROWS = { students: [], total: 0, page: 1, pages: 1 };

export default function CodingClient({ program }) {
    const [phase, setPhase] = useState('checking'); // checking | login | ready
    const [notConfigured, setNotConfigured] = useState(false);
    const [authed, setAuthed] = useState(false);
    const [overview, setOverview] = useState(null);
    const [rows, setRows] = useState(EMPTY_ROWS);
    const [rowsLoading, setRowsLoading] = useState(false);
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const [preparing, setPreparing] = useState(false);

    const [view, setViewState] = useState('leaderboard');
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
    const [printing, setPrinting] = useState(false);
    const [printRows, setPrintRows] = useState(null);
    const [printQueued, setPrintQueued] = useState(false);
    const [scrollTarget, setScrollTarget] = useState(null);

    // Navigation rail. `navOpen` is the remembered desktop preference; `drawerOpen`
    // is the tablet overlay, which always starts closed. `navReady` holds the width
    // transition off until the stored preference has been applied, so the rail
    // never animates from its default on first paint.
    const [navOpen, setNavOpen] = useState(true);
    const [drawerOpen, setDrawerOpen] = useState(false);
    const [navReady, setNavReady] = useState(false);
    // Must agree with the stylesheet's tablet rule (max-width: 1024px), or at
    // exactly 1024px the rail would be styled as a drawer while the shell still
    // reserved a full desktop column for it.
    const overlay = useMedia('(max-width: 1024px)');

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
            const qs = new URLSearchParams({ program: program.code, ...params });
            const res = await fetch(`/api/dashboard/coding/${path}?${qs}`, { cache: 'no-store' });
            if (res.status === 401) {
                setAuthed(false);
                setPhase('login');
                return null;
            }
            const json = await res.json().catch(() => ({}));
            if (!res.ok || !json.success) throw new Error(json.message || 'Could not load analytics.');
            return json;
        },
        [program.code]
    );

    const loadOverview = useCallback(async () => {
        setLoading(true);
        setError('');
        try {
            const json = await api('overview', { batch });
            if (json) {
                setOverview(json);
                setPhase('ready');
            }
        } catch (e) {
            setError(e.message || 'Something went wrong.');
            setPhase('ready');
        } finally {
            setLoading(false);
        }
    }, [api, batch]);

    const loadRows = useCallback(async () => {
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
    }, [api, batch, page, pageSize, sort, status, debouncedQuery, board]);

    const load = useCallback(() => {
        loadOverview();
        loadRows();
    }, [loadOverview, loadRows]);

    useEffect(() => {
        setViewState(readViewFromUrl());
        try {
            const stored = window.localStorage.getItem(NAV_PREF);
            if (stored === '0') setNavOpen(false);
        } catch {
            /* storage unavailable — the rail just starts expanded */
        }
        const id = requestAnimationFrame(() => setNavReady(true));
        (async () => {
            try {
                const res = await fetch('/api/dashboard/login', { cache: 'no-store' });
                const json = await res.json().catch(() => ({}));
                if (!json.configured) {
                    setNotConfigured(true);
                    setPhase('login');
                } else if (json.authenticated) {
                    setAuthed(true);
                } else {
                    setPhase('login');
                }
            } catch {
                setPhase('login');
            }
        })();
        return () => cancelAnimationFrame(id);
    }, []);

    // Scope-level data whenever the scope changes; the page of cards whenever any
    // listing parameter changes (and only once there is a capture to list).
    useEffect(() => {
        if (authed) loadOverview();
    }, [authed, loadOverview]);

    const ready = overview?.state === 'ready';
    useEffect(() => {
        if (authed && ready) loadRows();
    }, [authed, ready, loadRows]);

    // Typing waits for a pause before it hits the server.
    useEffect(() => {
        const id = setTimeout(() => {
            setDebouncedQuery(query.trim());
            setPage(1);
        }, SEARCH_DEBOUNCE_MS);
        return () => clearTimeout(id);
    }, [query]);

    const onLogin = useCallback(() => {
        setAuthed(true);
    }, []);

    const toggleNav = useCallback(
        (next) => {
            if (overlay) {
                setDrawerOpen(next);
                return;
            }
            setNavOpen(next);
            try {
                window.localStorage.setItem(NAV_PREF, next ? '1' : '0');
            } catch {
                /* preference simply is not remembered */
            }
        },
        [overlay]
    );

    const setView = useCallback((next) => {
        setViewState(next);
        setSelected(null);
        if (typeof window !== 'undefined') {
            const url = new URL(window.location.href);
            if (next === 'leaderboard') url.searchParams.delete('view');
            else url.searchParams.set('view', next);
            window.history.replaceState(null, '', url);
            window.scrollTo({ top: 0, behavior: 'auto' });
        }
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

    // "Download report" prints the canonical leaderboard report for the selected
    // scope — hero, KPIs, the overall podium, then EVERY remaining student. The
    // screen only holds one page, so the full list is fetched first, then the
    // board, search and filters are reset, the leaderboard is shown, and the print
    // fires once it has had a frame to lay out. The scope is the one thing kept,
    // because that IS the report's subject.
    const printReport = useCallback(async () => {
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
            setView('leaderboard');
            setPrintRows(json.students);
            setPrintQueued(true);
        } catch (e) {
            setError(e.message || 'Could not prepare the report.');
        } finally {
            setPreparing(false);
        }
    }, [api, batch, setView]);

    useEffect(() => {
        if (!printQueued || view !== 'leaderboard' || !printRows) return undefined;
        const id = requestAnimationFrame(() => {
            setPrintQueued(false);
            window.print();
        });
        return () => cancelAnimationFrame(id);
    }, [printQueued, view, printRows]);

    // From analytics: "see who" lands on the leaderboard with that batch and status
    // applied, scrolled to the directory.
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

    const signOut = useCallback(async () => {
        await fetch('/api/dashboard/login', { method: 'DELETE' }).catch(() => {});
        setOverview(null);
        setRows(EMPTY_ROWS);
        setAuthed(false);
        setPhase('login');
    }, []);

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
    // unreachable; `inert` makes that true for the keyboard and pointer as well. Done
    // here, keyed on open/closed, rather than per panel instance: when arrow keys swap
    // students the outgoing instance's cleanup would otherwise lift the inert while
    // the incoming one is already open.
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
    if (phase === 'checking') return <div className="cp-boot">Loading…</div>;
    if (phase === 'login') return <LoginGate notConfigured={notConfigured} onSuccess={onLogin} />;

    const scopeLabel = batch === ALL_BATCHES ? 'All students' : batch;
    const scopeLabelLower = batch === ALL_BATCHES ? 'all students' : batch;
    const snapshot = overview?.snapshot || null;
    const stale = stalenessLevel(snapshot?.capturedAt);
    const age = daysSince(snapshot?.capturedAt);
    const batches = overview?.batches || [];
    const summary = overview?.summary || null;
    const sortLabel = SORTS.find((s) => s.key === sort)?.label || 'score';
    const navExpanded = overlay ? drawerOpen : navOpen;
    const hasPrev = selectedIndex > 0 || (selectedIndex === 0 && !printRows && page > 1);
    const hasNext = selectedIndex >= 0 && (selectedIndex < listed.length - 1 || (!printRows && page < rows.pages));

    const shellClass = ['cp-shell', navOpen && !overlay && 'cp-shell--nav-open', navReady && 'is-ready']
        .filter(Boolean)
        .join(' ');

    return (
        <div className={shellClass}>
            <AvatarSpriteDefs />
            <Sidebar
                view={view}
                onChange={setView}
                onSignOut={signOut}
                expanded={navExpanded}
                onToggle={toggleNav}
                overlay={overlay}
            />

            <div className="cp-main">
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
                                {program.college} · {program.yearLabel} · Competitive Programming
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
                            disabled={loading}
                            aria-label={loading ? 'Refreshing' : 'Refresh'}
                        >
                            <IconRefresh /> <span className="cp-btn__text">{loading ? 'Refreshing…' : 'Refresh'}</span>
                        </button>
                        <button
                            type="button"
                            className="cp-btn cp-btn--ghost cp-btn--compact"
                            onClick={() => setUploadOpen(true)}
                            aria-label="Upload data"
                        >
                            <IconUpload /> <span className="cp-btn__text">Upload data</span>
                        </button>
                        <button type="button" className="cp-btn cp-btn--primary" onClick={printReport} disabled={preparing || !ready}>
                            <IconDownload /> {preparing ? 'Preparing…' : 'Download report'}
                        </button>
                    </div>
                </header>

                {/* The inline alert only accompanies STALE data (a failed Refresh keeps
                    the last good payload). With no payload at all the body is an explicit
                    error state — never KPI tiles reading 0/0/0 and a podium claiming
                    nobody has activity, which would present an outage as a cohort of zero. */}
                {error && overview && <p className="cp-alert cp-alert--error">{error}</p>}

                {!overview ? (
                    <EmptyState
                        title="Analytics could not be loaded"
                        body={error || 'The overview request did not return any data.'}
                        action={loading ? 'Retrying…' : 'Retry'}
                        onAction={load}
                    />
                ) : overview.state === 'no-roster' ? (
                    <EmptyState
                        title="No roster loaded yet"
                        body="The bot's export carries roll numbers and metrics but no batch information, so the batch allocation workbook has to be loaded first."
                        action="Upload the roster"
                        onAction={() => setUploadOpen(true)}
                    />
                ) : overview.state === 'no-snapshot' ? (
                    <EmptyState
                        title={`${overview.total} students loaded, no capture yet`}
                        body="Batches look right? Upload a coding-profile export to see analytics."
                        action="Upload a capture"
                        onAction={() => setUploadOpen(true)}
                    />
                ) : (
                    <>
                        {view === 'leaderboard' && (
                            <>
                                <HeroBanner program={program} scopeLabel={scopeLabel} scopeCount={overview.scopedTotal} snapshot={snapshot} />
                                <ScopeBar
                                    batch={batch}
                                    batches={batches}
                                    total={overview.total}
                                    measured={summary?.captured || 0}
                                    onBatch={changeBatch}
                                />
                                <KpiTiles summary={summary} batches={batches} snapshot={snapshot} />
                                <Podium
                                    boards={overview.podium}
                                    scopeLabel={scopeLabelLower}
                                    mode={overview.mode}
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
                                            ? `Everyone in ${scopeLabelLower} from #4 onward — the top three are on the podium above`
                                            : `Everyone in ${scopeLabelLower}${debouncedQuery ? ` matching “${debouncedQuery}”` : ''}, sorted by ${sortLabel.toLowerCase()}`
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
                                    onSelect={select}
                                    selectedRollKey={selected}
                                />
                            </>
                        )}

                        {view === 'analytics' && (
                            <>
                                <div className="cp-viewhead">
                                    <h2 className="cp-viewhead__title">Analytics</h2>
                                    <p className="cp-viewhead__sub">
                                        Who leads — overall, batch by batch, platform by platform — and who needs a nudge. Captured{' '}
                                        {formatDate(snapshot?.capturedAt)}.
                                    </p>
                                </div>
                                <AnalyticsView
                                    program={program}
                                    batches={batches}
                                    coverage={snapshot?.coverage}
                                    mode={overview.mode}
                                    previousSnapshot={overview.previousSnapshot}
                                    snapshotId={snapshot?.id}
                                    onSelect={select}
                                    onInspect={inspect}
                                />
                            </>
                        )}
                    </>
                )}
            </div>

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
                        onClose={close}
                        onPrev={() => step(-1)}
                        onNext={() => step(1)}
                        hasPrev={hasPrev}
                        hasNext={hasNext}
                    />
                )}
            </AnimatePresence>

            {uploadOpen && (
                <UploadPanel
                    program={program}
                    history={overview?.history}
                    onClose={() => setUploadOpen(false)}
                    onCommitted={() => {
                        setUploadOpen(false);
                        load();
                    }}
                />
            )}
        </div>
    );
}

function EmptyState({ title, body, action, onAction }) {
    return (
        <div className="cp-emptystate">
            <h2>{title}</h2>
            <p>{body}</p>
            <button type="button" className="cp-btn cp-btn--primary" onClick={onAction}>
                {action}
            </button>
        </div>
    );
}
