'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import LoginGate from '../../components/srkr/dashboard/login-gate';
import KpiTiles from '../../components/srkr/dashboard/dashboard-kpis';
import RecentTable from '../../components/srkr/dashboard/recent-table';
import {
    RegistrationsTrend,
    GenderDonut,
    ProgramDonut,
    BranchBar,
    ResidenceSplit,
    BranchYearStacked
} from '../../components/srkr/dashboard/dashboard-charts';
import { RANGES, formatDateTime } from '../../components/srkr/dashboard/dashboard-theme';
import { IconDownload, IconRefresh, IconLogout, IconAlert } from '../../components/srkr/dashboard/dashboard-icons';

const AUTO_REFRESH_MS = 30000;

export default function DashboardPage() {
    const [phase, setPhase] = useState('checking'); // checking | login | ready
    const [notConfigured, setNotConfigured] = useState(false);
    const [data, setData] = useState(null);
    const [error, setError] = useState('');
    const [range, setRange] = useState('all');
    const [loading, setLoading] = useState(false);
    const [refreshing, setRefreshing] = useState(false);
    const [downloading, setDownloading] = useState(false);
    const [autoRefresh, setAutoRefresh] = useState(false);
    const rangeRef = useRef(range);
    rangeRef.current = range;

    const loadStats = useCallback(async (r, { silent = false } = {}) => {
        if (silent) setRefreshing(true); else setLoading(true);
        setError('');
        try {
            const res = await fetch(`/api/registrations/stats?range=${r}`, { cache: 'no-store' });
            if (res.status === 401) {
                setPhase('login');
                return;
            }
            const json = await res.json();
            if (!res.ok || !json.success) throw new Error(json.message || 'Failed to load analytics.');
            setData(json);
            setPhase('ready');
        } catch (e) {
            setError(e.message || 'Something went wrong.');
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    }, []);

    // Initial auth check.
    useEffect(() => {
        (async () => {
            try {
                const res = await fetch('/api/dashboard/login', { cache: 'no-store' });
                const json = await res.json().catch(() => ({}));
                if (!json.configured) {
                    setNotConfigured(true);
                    setPhase('login');
                } else if (json.authenticated) {
                    loadStats(rangeRef.current);
                } else {
                    setPhase('login');
                }
            } catch {
                setPhase('login');
            }
        })();
    }, [loadStats]);

    // Auto-refresh.
    useEffect(() => {
        if (phase !== 'ready' || !autoRefresh) return undefined;
        const id = setInterval(() => loadStats(rangeRef.current, { silent: true }), AUTO_REFRESH_MS);
        return () => clearInterval(id);
    }, [phase, autoRefresh, loadStats]);

    const handleRange = (r) => {
        setRange(r);
        loadStats(r);
    };

    const handleDownload = async () => {
        setDownloading(true);
        try {
            const res = await fetch(`/api/registrations/export?range=${range}`, { cache: 'no-store' });
            if (!res.ok) throw new Error('Export failed');
            const blob = await res.blob();
            const disposition = res.headers.get('Content-Disposition') || '';
            const match = /filename="?([^"]+)"?/.exec(disposition);
            const filename = match ? match[1] : `SRKR_Registrations_${range}.xlsx`;
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
    };

    const handleLogout = async () => {
        await fetch('/api/dashboard/login', { method: 'DELETE' }).catch(() => {});
        setData(null);
        setPhase('login');
    };

    if (phase === 'checking') {
        return <div className="dash-login"><div className="dash-login-card"><div className="dash-brand-mark">TM</div><p style={{ margin: 0 }}>Loading…</p></div></div>;
    }

    if (phase === 'login') {
        return <LoginGate notConfigured={notConfigured} onSuccess={() => loadStats(rangeRef.current)} />;
    }

    return (
        <div className="dash">
            <header className="dash-topbar">
                <div className="dash-topbar-row">
                    <div className="dash-brand">
                        <div className="dash-brand-mark">TM</div>
                        <div>
                            <h1>Registrations Analytics</h1>
                            <div className="dash-brand-sub">
                                <span className="dash-live-dot" />
                                {data ? `Updated ${formatDateTime(data.generatedAt)}` : 'ToriiMinds × SRKR'}
                            </div>
                        </div>
                    </div>

                    <div className="dash-topbar-actions">
                        <div className="dash-range">
                            {RANGES.map((r) => (
                                <button
                                    key={r.key}
                                    className={range === r.key ? 'is-active' : ''}
                                    onClick={() => handleRange(r.key)}
                                >
                                    {r.label}
                                </button>
                            ))}
                        </div>
                        <button
                            type="button"
                            className={`dash-toggle ${autoRefresh ? 'is-on' : ''}`}
                            onClick={() => setAutoRefresh((v) => !v)}
                            role="switch"
                            aria-checked={autoRefresh}
                            title="Auto-refresh every 30 seconds"
                        >
                            <span className="dash-toggle-label">Auto Refresh</span>
                            <span className="dash-switch"><span className="dash-switch-knob" /></span>
                        </button>
                        <button className={`dash-btn ${refreshing ? 'is-spinning' : ''}`} onClick={() => loadStats(range, { silent: true })} disabled={refreshing}>
                            <IconRefresh /> Refresh
                        </button>
                        <button className="dash-btn dash-btn--primary" onClick={handleDownload} disabled={downloading || !data}>
                            <IconDownload /> {downloading ? 'Preparing…' : 'Download Excel'}
                        </button>
                        <button className="dash-btn dash-btn--ghost" onClick={handleLogout} title="Log out">
                            <IconLogout />
                        </button>
                    </div>
                </div>
            </header>

            <div className="dash-inner">
                {error && (
                    <div className="dash-card" style={{ marginTop: 20, borderColor: 'rgba(239,68,68,0.35)', display: 'flex', alignItems: 'center', gap: 12 }}>
                        <span style={{ color: 'var(--srkr-danger)' }}><IconAlert /></span>
                        <span style={{ color: 'var(--srkr-danger)', fontWeight: 500, fontSize: 13.5 }}>{error}</span>
                    </div>
                )}

                {loading && !data ? (
                    <LoadingSkeleton />
                ) : data ? (
                    <>
                        <KpiTiles
                            kpis={data.kpis}
                            range={data.range}
                            programCount={data.byProgram.length}
                            branchCount={data.byBranch.length}
                        />

                        <div className="dash-section-head"><h2>Trends & distribution</h2></div>
                        <div className="dash-grid">
                            <RegistrationsTrend data={data.timeSeries} />
                            <GenderDonut data={data.byGender} />
                            <BranchBar data={data.byBranch} />
                            <ProgramDonut data={data.byProgram} />
                            <ResidenceSplit data={data.byResidence} />
                            <BranchYearStacked branchByYear={data.branchByYear} byBranch={data.byBranch} />
                        </div>

                        <div className="dash-section-head"><h2>Registration records</h2></div>
                        <div className="dash-grid">
                            <RecentTable rows={data.recent} />
                        </div>
                    </>
                ) : null}
            </div>
        </div>
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
