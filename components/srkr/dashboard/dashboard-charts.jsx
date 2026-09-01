'use client';

import { useMemo, useState } from 'react';
import {
    ResponsiveContainer,
    AreaChart,
    Area,
    BarChart,
    Bar,
    PieChart,
    Pie,
    Cell,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    LabelList
} from 'recharts';
import {
    BRAND,
    PROGRAM_COLORS,
    YEAR_COLORS,
    GENDER_COLORS,
    RESIDENCE_COLORS,
    LAPTOP_COLORS,
    CRT_FEE_COLORS,
    BRANCH_RAMP,
    shortBranch,
    shortDay,
    pct
} from './dashboard-theme';

// ── Shared custom tooltip ───────────────────
function ChartTooltip({ active, payload, label, labelFormatter, valueSuffix = '' }) {
    if (!active || !payload || !payload.length) return null;
    return (
        <div className="dash-tooltip">
            {label != null && (
                <div className="dash-tooltip-label">{labelFormatter ? labelFormatter(label) : label}</div>
            )}
            {payload.map((entry, i) => (
                <div className="dash-tooltip-row" key={i}>
                    <span className="dash-tooltip-dot" style={{ background: entry.color || entry.fill }} />
                    <span>{entry.name}:</span>
                    <b>{entry.value}{valueSuffix}</b>
                </div>
            ))}
        </div>
    );
}

// ── 1. Registrations over time ──────────────
export function RegistrationsTrend({ data }) {
    const [mode, setMode] = useState('cumulative');
    const hasData = data && data.length > 0;

    return (
        <div className="dash-card dash-card--8">
            <div className="dash-card-head" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 12, flexWrap: 'wrap' }}>
                <div>
                    <h3 className="dash-card-title">Registrations over time</h3>
                    <p className="dash-card-sub">{mode === 'cumulative' ? 'Cumulative growth to date' : 'New sign-ups per day'}</p>
                </div>
                <div className="dash-range" role="tablist">
                    <button className={mode === 'cumulative' ? 'is-active' : ''} onClick={() => setMode('cumulative')}>Cumulative</button>
                    <button className={mode === 'daily' ? 'is-active' : ''} onClick={() => setMode('daily')}>Daily</button>
                </div>
            </div>
            <div className="dash-card-body">
                {!hasData ? (
                    <EmptyChart label="No registrations in this range yet" />
                ) : mode === 'cumulative' ? (
                    <ResponsiveContainer width="100%" height={300}>
                        <AreaChart data={data} margin={{ top: 10, right: 8, left: -12, bottom: 0 }}>
                            <defs>
                                <linearGradient id="trendFill" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="0%" stopColor={BRAND.primary} stopOpacity={0.32} />
                                    <stop offset="100%" stopColor={BRAND.primary} stopOpacity={0.02} />
                                </linearGradient>
                            </defs>
                            <CartesianGrid strokeDasharray="3 3" vertical={false} />
                            <XAxis dataKey="date" tickFormatter={shortDay} tickLine={false} axisLine={false} minTickGap={24} padding={{ left: 12, right: 12 }} />
                            <YAxis allowDecimals={false} tickLine={false} axisLine={false} width={40} />
                            <Tooltip content={<ChartTooltip labelFormatter={shortDay} />} />
                            <Area type="monotone" dataKey="cumulative" name="Total" stroke={BRAND.primary} strokeWidth={2.5} fill="url(#trendFill)" dot={{ r: 3, fill: BRAND.primary, strokeWidth: 0 }} />
                        </AreaChart>
                    </ResponsiveContainer>
                ) : (
                    <ResponsiveContainer width="100%" height={300}>
                        <BarChart data={data} margin={{ top: 10, right: 8, left: -12, bottom: 0 }}>
                            <defs>
                                <linearGradient id="dailyFill" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="0%" stopColor={BRAND.secondary} stopOpacity={1} />
                                    <stop offset="100%" stopColor={BRAND.secondary} stopOpacity={0.72} />
                                </linearGradient>
                            </defs>
                            <CartesianGrid strokeDasharray="3 3" vertical={false} />
                            <XAxis dataKey="date" tickFormatter={shortDay} tickLine={false} axisLine={false} minTickGap={24} padding={{ left: 24, right: 24 }} />
                            <YAxis allowDecimals={false} tickLine={false} axisLine={false} width={40} />
                            <Tooltip cursor={{ fill: 'rgba(226,84,76,0.06)' }} content={<ChartTooltip labelFormatter={shortDay} />} />
                            <Bar dataKey="count" name="Sign-ups" fill="url(#dailyFill)" radius={[6, 6, 0, 0]} maxBarSize={46} />
                        </BarChart>
                    </ResponsiveContainer>
                )}
            </div>
        </div>
    );
}

// ── 2. Gender donut ─────────────────────────
export function GenderDonut({ data }) {
    const total = data.reduce((s, d) => s + d.value, 0);
    return (
        <div className="dash-card dash-card--4">
            <div className="dash-card-head">
                <h3 className="dash-card-title">Gender split</h3>
                <p className="dash-card-sub">Male vs female registrations</p>
            </div>
            <div className="dash-card-body">
                {total === 0 ? <EmptyChart label="No data yet" /> : (
                    <>
                        <div className="dash-donut-wrap">
                            <ResponsiveContainer width="100%" height={200}>
                                <PieChart>
                                    <Pie data={data} dataKey="value" nameKey="name" innerRadius={62} outerRadius={90} paddingAngle={2} stroke="none" startAngle={90} endAngle={-270}>
                                        {data.map((d) => <Cell key={d.name} fill={GENDER_COLORS[d.name] || BRAND.muted} />)}
                                    </Pie>
                                    <Tooltip content={<ChartTooltip />} />
                                </PieChart>
                            </ResponsiveContainer>
                            <div className="dash-donut-center">
                                <strong>{total}</strong>
                                <span>Students</span>
                            </div>
                        </div>
                        <DonutLegend data={data} colorMap={GENDER_COLORS} total={total} />
                    </>
                )}
            </div>
        </div>
    );
}

// ── 3. Program / passout-year donut ─────────
export function ProgramDonut({ data }) {
    const total = data.reduce((s, d) => s + d.value, 0);
    const sorted = [...data].sort((a, b) => (b.year || 0) - (a.year || 0));
    return (
        <div className="dash-card dash-card--5">
            <div className="dash-card-head">
                <h3 className="dash-card-title">Program tracks</h3>
                <p className="dash-card-sub">Enrolment by passout year → program</p>
            </div>
            <div className="dash-card-body">
                {total === 0 ? <EmptyChart label="No data yet" /> : (
                    <>
                        <div className="dash-donut-wrap">
                            <ResponsiveContainer width="100%" height={200}>
                                <PieChart>
                                    <Pie data={sorted} dataKey="value" nameKey="name" innerRadius={62} outerRadius={90} paddingAngle={2} stroke="none">
                                        {sorted.map((d) => <Cell key={d.name} fill={PROGRAM_COLORS[d.name] || BRAND.muted} />)}
                                    </Pie>
                                    <Tooltip content={<ChartTooltip />} />
                                </PieChart>
                            </ResponsiveContainer>
                            <div className="dash-donut-center">
                                <strong>{total}</strong>
                                <span>Enrolled</span>
                            </div>
                        </div>
                        <div className="dash-legend">
                            {sorted.map((d) => (
                                <div className="dash-legend-item" key={d.name}>
                                    <span className="dash-legend-swatch" style={{ background: PROGRAM_COLORS[d.name] || BRAND.muted }} />
                                    <span>{d.name}</span>
                                    <span className="dash-legend-val">{d.value} · {pct(d.value, total)}%</span>
                                </div>
                            ))}
                        </div>
                    </>
                )}
            </div>
        </div>
    );
}

// ── 4. Branch horizontal bar ────────────────
export function BranchBar({ data }) {
    const sorted = useMemo(() => [...data].sort((a, b) => b.value - a.value), [data]);
    const height = Math.max(220, sorted.length * 38);
    return (
        <div className="dash-card dash-card--7">
            <div className="dash-card-head">
                <h3 className="dash-card-title">Registrations by branch</h3>
                <p className="dash-card-sub">Ranked highest to lowest</p>
            </div>
            <div className="dash-card-body">
                {sorted.length === 0 ? <EmptyChart label="No data yet" /> : (
                    <ResponsiveContainer width="100%" height={height}>
                        <BarChart data={sorted} layout="vertical" margin={{ top: 0, right: 34, left: 8, bottom: 0 }}>
                            <CartesianGrid strokeDasharray="3 3" horizontal={false} />
                            <XAxis type="number" allowDecimals={false} tickLine={false} axisLine={false} />
                            <YAxis type="category" dataKey="name" tickFormatter={shortBranch} tickLine={false} axisLine={false} width={78} />
                            <Tooltip cursor={{ fill: 'rgba(226,84,76,0.06)' }} content={<ChartTooltip />} />
                            <Bar dataKey="value" name="Students" radius={[0, 6, 6, 0]} maxBarSize={30}>
                                {sorted.map((d, i) => <Cell key={d.name} fill={BRANCH_RAMP[Math.min(i, BRANCH_RAMP.length - 1)]} />)}
                                <LabelList dataKey="value" position="right" style={{ fill: BRAND.muted, fontSize: 12, fontWeight: 600 }} />
                            </Bar>
                        </BarChart>
                    </ResponsiveContainer>
                )}
            </div>
        </div>
    );
}

// ── 5. Residence 100% split bar (pure CSS) ──
export function ResidenceSplit({ data }) {
    const total = data.reduce((s, d) => s + d.value, 0);
    const order = ['Hosteler', 'Day Scholar'];
    const rows = order.map((name) => ({ name, value: data.find((d) => d.name === name)?.value || 0 }));
    return (
        <div className="dash-card dash-card--6">
            <div className="dash-card-head">
                <h3 className="dash-card-title">Residence</h3>
                <p className="dash-card-sub">Hostelers vs day scholars</p>
            </div>
            <div className="dash-card-body">
                {total === 0 ? <EmptyChart label="No data yet" /> : (
                    <>
                        <div className="dash-splitbar">
                            {rows.map((r) => r.value > 0 && (
                                <div
                                    key={r.name}
                                    className="dash-splitbar-seg"
                                    style={{ flexGrow: r.value, background: RESIDENCE_COLORS[r.name] }}
                                    title={`${r.name}: ${r.value}`}
                                >
                                    {pct(r.value, total) >= 10 ? `${pct(r.value, total)}%` : ''}
                                </div>
                            ))}
                        </div>
                        <div className="dash-splitbar-labels">
                            <div className="dash-splitbar-label">
                                <strong>{rows[0].value}</strong>
                                <span><span className="dash-legend-swatch" style={{ background: RESIDENCE_COLORS.Hosteler }} /> Hostelers</span>
                            </div>
                            <div className="dash-splitbar-label dash-splitbar-label--right">
                                <strong>{rows[1].value}</strong>
                                <span><span className="dash-legend-swatch" style={{ background: RESIDENCE_COLORS['Day Scholar'] }} /> Day Scholars</span>
                            </div>
                        </div>
                    </>
                )}
            </div>
        </div>
    );
}

// ── 5b. Laptop availability 100% split bar ──
export function LaptopSplit({ data }) {
    const total = data.reduce((s, d) => s + d.value, 0);
    const order = ['Yes', 'No'];
    const rows = order.map((name) => ({ name, value: data.find((d) => d.name === name)?.value || 0 }));
    return (
        <div className="dash-card dash-card--6">
            <div className="dash-card-head">
                <h3 className="dash-card-title">Laptop availability</h3>
                <p className="dash-card-sub">Students with vs without a laptop</p>
            </div>
            <div className="dash-card-body">
                {total === 0 ? <EmptyChart label="No data yet" /> : (
                    <>
                        <div className="dash-splitbar">
                            {rows.map((r) => r.value > 0 && (
                                <div
                                    key={r.name}
                                    className="dash-splitbar-seg"
                                    style={{ flexGrow: r.value, background: LAPTOP_COLORS[r.name] }}
                                    title={`${r.name}: ${r.value}`}
                                >
                                    {pct(r.value, total) >= 10 ? `${pct(r.value, total)}%` : ''}
                                </div>
                            ))}
                        </div>
                        <div className="dash-splitbar-labels">
                            <div className="dash-splitbar-label">
                                <strong>{rows[0].value}</strong>
                                <span><span className="dash-legend-swatch" style={{ background: LAPTOP_COLORS.Yes }} /> Have a laptop</span>
                            </div>
                            <div className="dash-splitbar-label dash-splitbar-label--right">
                                <strong>{rows[1].value}</strong>
                                <span><span className="dash-legend-swatch" style={{ background: LAPTOP_COLORS.No }} /> No laptop</span>
                            </div>
                        </div>
                    </>
                )}
            </div>
        </div>
    );
}

// ── 5c. CRT training fee 100% split bar ──
export function CrtFeeSplit({ data }) {
    const total = data.reduce((s, d) => s + d.value, 0);
    const order = ['Yes', 'No'];
    const rows = order.map((name) => ({ name, value: data.find((d) => d.name === name)?.value || 0 }));
    return (
        <div className="dash-card dash-card--6">
            <div className="dash-card-head">
                <h3 className="dash-card-title">CRT training fee</h3>
                <p className="dash-card-sub">Students who have paid vs not yet</p>
            </div>
            <div className="dash-card-body">
                {total === 0 ? <EmptyChart label="No data yet" /> : (
                    <>
                        <div className="dash-splitbar">
                            {rows.map((r) => r.value > 0 && (
                                <div
                                    key={r.name}
                                    className="dash-splitbar-seg"
                                    style={{ flexGrow: r.value, background: CRT_FEE_COLORS[r.name] }}
                                    title={`${r.name}: ${r.value}`}
                                >
                                    {pct(r.value, total) >= 10 ? `${pct(r.value, total)}%` : ''}
                                </div>
                            ))}
                        </div>
                        <div className="dash-splitbar-labels">
                            <div className="dash-splitbar-label">
                                <strong>{rows[0].value}</strong>
                                <span><span className="dash-legend-swatch" style={{ background: CRT_FEE_COLORS.Yes }} /> Fee paid</span>
                            </div>
                            <div className="dash-splitbar-label dash-splitbar-label--right">
                                <strong>{rows[1].value}</strong>
                                <span><span className="dash-legend-swatch" style={{ background: CRT_FEE_COLORS.No }} /> Not yet</span>
                            </div>
                        </div>
                    </>
                )}
            </div>
        </div>
    );
}

// ── 6. Branch × Year stacked bar ────────────
export function BranchYearStacked({ branchByYear, byBranch }) {
    const { rows, years } = useMemo(() => {
        const order = [...byBranch].sort((a, b) => b.value - a.value).map((b) => b.name);
        const yearsSet = new Set();
        const map = new Map();
        branchByYear.forEach(({ branch, year, value }) => {
            yearsSet.add(String(year));
            if (!map.has(branch)) map.set(branch, { name: branch });
            map.get(branch)[String(year)] = value;
        });
        const sortedYears = [...yearsSet].sort((a, b) => Number(b) - Number(a));
        const rowsOut = order.map((name) => ({ name, ...(map.get(name) || {}) }));
        return { rows: rowsOut, years: sortedYears };
    }, [branchByYear, byBranch]);

    const height = Math.max(220, rows.length * 38);
    return (
        <div className="dash-card dash-card--12">
            <div className="dash-card-head" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 12, flexWrap: 'wrap' }}>
                <div>
                    <h3 className="dash-card-title">Branch × Year mix</h3>
                    <p className="dash-card-sub">How each branch splits across passout years</p>
                </div>
                <div className="dash-legend" style={{ marginTop: 0 }}>
                    {years.map((y) => (
                        <div className="dash-legend-item" key={y}>
                            <span className="dash-legend-swatch" style={{ background: YEAR_COLORS[y] || BRAND.muted }} />
                            <span>{y}</span>
                        </div>
                    ))}
                </div>
            </div>
            <div className="dash-card-body">
                {rows.length === 0 ? <EmptyChart label="No data yet" /> : (
                    <ResponsiveContainer width="100%" height={height}>
                        <BarChart data={rows} layout="vertical" margin={{ top: 0, right: 16, left: 8, bottom: 0 }}>
                            <CartesianGrid strokeDasharray="3 3" horizontal={false} />
                            <XAxis type="number" allowDecimals={false} tickLine={false} axisLine={false} />
                            <YAxis type="category" dataKey="name" tickFormatter={shortBranch} tickLine={false} axisLine={false} width={78} />
                            <Tooltip cursor={{ fill: 'rgba(226,84,76,0.06)' }} content={<ChartTooltip />} />
                            {years.map((y, i) => (
                                <Bar key={y} dataKey={y} name={y} stackId="year" fill={YEAR_COLORS[y] || BRAND.muted}
                                     radius={i === years.length - 1 ? [0, 6, 6, 0] : [0, 0, 0, 0]} maxBarSize={30} />
                            ))}
                        </BarChart>
                    </ResponsiveContainer>
                )}
            </div>
        </div>
    );
}

// ── Small shared bits ───────────────────────
function DonutLegend({ data, colorMap, total }) {
    return (
        <div className="dash-legend">
            {data.map((d) => (
                <div className="dash-legend-item" key={d.name}>
                    <span className="dash-legend-swatch" style={{ background: colorMap[d.name] || BRAND.muted }} />
                    <span>{d.name}</span>
                    <span className="dash-legend-val">{d.value} · {pct(d.value, total)}%</span>
                </div>
            ))}
        </div>
    );
}

function EmptyChart({ label }) {
    return (
        <div style={{ height: 200, display: 'grid', placeItems: 'center', color: BRAND.muted, fontSize: 13 }}>
            {label}
        </div>
    );
}
