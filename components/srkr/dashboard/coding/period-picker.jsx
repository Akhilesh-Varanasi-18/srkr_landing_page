'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { IconCalendar } from '../dashboard-icons';
import { IconChevronLeft, IconChevronRight } from './coding-icons';
import {
    MONTHS_LONG, describePeriod, presetPeriod, todayIso, yearRange, monthRange, weeksOfMonth,
    isIsoDate, parsePeriod, fmtDay, fromIso, isoDate
} from '../../../../lib/coding-profiles/period';

// The period control: a glass pill showing the current period, and a popover with
// quick picks, then Year / Month / Week / Custom. One control serves both the
// leaderboard and analytics; the value is {from, to} or null for all time.
//
// Captures on record are listed at the foot, because a period only has numbers
// when a capture falls inside it — picking one of those dates is the surest way
// to see "what changed since the previous capture".

const QUICK = [
    { key: 'all', label: 'All time' },
    { key: 'week', label: 'This week' },
    { key: 'month', label: 'This month' },
    { key: 'year', label: 'This year' },
    { key: '7d', label: 'Last 7 days' },
    { key: '30d', label: 'Last 30 days' }
];

const TABS = [
    { key: 'quick', label: 'Quick' },
    { key: 'year', label: 'Year' },
    { key: 'month', label: 'Month' },
    { key: 'week', label: 'Week' },
    { key: 'custom', label: 'Custom' }
];

const same = (a, b) => Boolean(a && b && a.from === b.from && a.to === b.to);

export default function PeriodPicker({ value, onChange, captures = [], compact = false }) {
    const [open, setOpen] = useState(false);
    const [tab, setTab] = useState('quick');
    const today = todayIso();
    const thisYear = Number(today.slice(0, 4));
    const thisMonth = Number(today.slice(5, 7));
    const [year, setYear] = useState(thisYear);
    const [month, setMonth] = useState(thisMonth);
    const [custom, setCustom] = useState({ from: value?.from || '', to: value?.to || '' });
    const rootRef = useRef(null);
    const buttonRef = useRef(null);

    // Capture dates as 'YYYY-MM-DD', newest first, de-duplicated.
    const captureDays = useMemo(
        () => [...new Set(captures.map((c) => isoDate(new Date(c))).filter(isIsoDate))].sort().reverse(),
        [captures]
    );
    const years = useMemo(() => {
        const first = Math.min(thisYear - 1, ...captureDays.map((d) => Number(d.slice(0, 4))));
        const list = [];
        for (let y = thisYear; y >= first; y -= 1) list.push(y);
        return list;
    }, [captureDays, thisYear]);

    useEffect(() => {
        if (!open) return undefined;
        setCustom({ from: value?.from || '', to: value?.to || '' });
        const onDoc = (e) => {
            if (!rootRef.current?.contains(e.target)) setOpen(false);
        };
        // Capture phase, so Escape closes this popover and never reaches the profile
        // panel's own Escape handler behind it.
        const onKey = (e) => {
            if (e.key === 'Escape') {
                e.stopPropagation();
                setOpen(false);
                buttonRef.current?.focus();
            }
        };
        document.addEventListener('mousedown', onDoc);
        document.addEventListener('keydown', onKey, true);
        return () => {
            document.removeEventListener('mousedown', onDoc);
            document.removeEventListener('keydown', onKey, true);
        };
    }, [open, value]);

    const pick = (period) => {
        onChange(period);
        setOpen(false);
        buttonRef.current?.focus();
    };

    const stepMonth = (delta) => {
        let m = month + delta;
        let y = year;
        if (m < 1) {
            m = 12;
            y -= 1;
        } else if (m > 12) {
            m = 1;
            y += 1;
        }
        setMonth(m);
        setYear(y);
    };

    const customValid = isIsoDate(custom.from) && isIsoDate(custom.to);
    const label = describePeriod(value);

    return (
        <div className={`cp-period${open ? ' is-open' : ''}`} ref={rootRef}>
            <button
                ref={buttonRef}
                type="button"
                className={`cp-period__btn${value ? ' has-value' : ''}`}
                onClick={() => setOpen((v) => !v)}
                aria-haspopup="dialog"
                aria-expanded={open}
                title="Choose the period the numbers cover"
            >
                <IconCalendar aria-hidden="true" />
                {!compact && <span className="cp-period__eyebrow">Period</span>}
                <span className="cp-period__value">{label}</span>
                <span className="cp-period__chev" aria-hidden="true">
                    <IconChevronRight />
                </span>
            </button>

            {open && (
                <div className="cp-period__pop" role="dialog" aria-label="Choose a period">
                    <div className="cp-period__tabs" role="tablist">
                        {TABS.map((t) => (
                            <button
                                key={t.key}
                                type="button"
                                role="tab"
                                aria-selected={tab === t.key}
                                className={`cp-period__tab${tab === t.key ? ' is-active' : ''}`}
                                onClick={() => setTab(t.key)}
                            >
                                {t.label}
                            </button>
                        ))}
                    </div>

                    {tab === 'quick' && (
                        <div className="cp-period__grid cp-period__grid--quick">
                            {QUICK.map((q) => {
                                const period = q.key === 'all' ? null : presetPeriod(q.key, today);
                                const active = q.key === 'all' ? !value : same(period, value);
                                return (
                                    <button
                                        key={q.key}
                                        type="button"
                                        className={`cp-period__opt${active ? ' is-active' : ''}`}
                                        aria-pressed={active}
                                        onClick={() => pick(period)}
                                    >
                                        <strong>{q.label}</strong>
                                        <span>{period ? describePeriod(period) : 'Every capture to date'}</span>
                                    </button>
                                );
                            })}
                        </div>
                    )}

                    {tab === 'year' && (
                        <div className="cp-period__grid cp-period__grid--years">
                            {years.map((y) => {
                                const period = yearRange(y);
                                return (
                                    <button
                                        key={y}
                                        type="button"
                                        className={`cp-period__opt cp-period__opt--center${same(period, value) ? ' is-active' : ''}`}
                                        aria-pressed={same(period, value)}
                                        onClick={() => pick(period)}
                                    >
                                        <strong>{y}</strong>
                                    </button>
                                );
                            })}
                        </div>
                    )}

                    {tab === 'month' && (
                        <>
                            <div className="cp-period__stepper">
                                <button type="button" onClick={() => setYear((y) => y - 1)} aria-label="Previous year">
                                    <IconChevronLeft />
                                </button>
                                <strong>{year}</strong>
                                <button type="button" onClick={() => setYear((y) => y + 1)} aria-label="Next year" disabled={year >= thisYear}>
                                    <IconChevronRight />
                                </button>
                            </div>
                            <div className="cp-period__grid cp-period__grid--months">
                                {MONTHS_LONG.map((name, i) => {
                                    const period = monthRange(year, i + 1);
                                    const future = period.from > today;
                                    return (
                                        <button
                                            key={name}
                                            type="button"
                                            className={`cp-period__opt cp-period__opt--center${same(period, value) ? ' is-active' : ''}`}
                                            aria-pressed={same(period, value)}
                                            disabled={future}
                                            onClick={() => pick(period)}
                                        >
                                            <strong>{name.slice(0, 3)}</strong>
                                        </button>
                                    );
                                })}
                            </div>
                        </>
                    )}

                    {tab === 'week' && (
                        <>
                            <div className="cp-period__stepper">
                                <button type="button" onClick={() => stepMonth(-1)} aria-label="Previous month">
                                    <IconChevronLeft />
                                </button>
                                <strong>
                                    {MONTHS_LONG[month - 1]} {year}
                                </strong>
                                <button
                                    type="button"
                                    onClick={() => stepMonth(1)}
                                    aria-label="Next month"
                                    disabled={year > thisYear || (year === thisYear && month >= thisMonth)}
                                >
                                    <IconChevronRight />
                                </button>
                            </div>
                            <div className="cp-period__grid cp-period__grid--weeks">
                                {weeksOfMonth(year, month).map((w) => {
                                    const future = w.from > today;
                                    const hasCapture = captureDays.some((d) => d >= w.from && d <= w.to);
                                    return (
                                        <button
                                            key={w.from}
                                            type="button"
                                            className={`cp-period__opt${same(w, value) ? ' is-active' : ''}`}
                                            aria-pressed={same(w, value)}
                                            disabled={future}
                                            onClick={() => pick(w)}
                                        >
                                            <strong>{describePeriod(w).replace('Week of ', '')}</strong>
                                            <span>{hasCapture ? 'has a capture' : 'no capture'}</span>
                                        </button>
                                    );
                                })}
                            </div>
                        </>
                    )}

                    {tab === 'custom' && (
                        <div className="cp-period__custom">
                            <label>
                                <span>From</span>
                                <input type="date" value={custom.from} max={today} onChange={(e) => setCustom((c) => ({ ...c, from: e.target.value }))} />
                            </label>
                            <label>
                                <span>To</span>
                                <input type="date" value={custom.to} max={today} onChange={(e) => setCustom((c) => ({ ...c, to: e.target.value }))} />
                            </label>
                            <button
                                type="button"
                                className="cp-btn cp-btn--primary"
                                disabled={!customValid}
                                onClick={() => pick(parsePeriod(custom.from, custom.to))}
                            >
                                Apply
                            </button>
                        </div>
                    )}

                    <div className="cp-period__foot">
                        <span className="cp-period__foot-label">Captures on record</span>
                        <div className="cp-period__captures">
                            {captureDays.length ? (
                                captureDays.map((d) => {
                                    const period = { from: d, to: d };
                                    return (
                                        <button
                                            key={d}
                                            type="button"
                                            className={`cp-period__capture${same(period, value) ? ' is-active' : ''}`}
                                            aria-pressed={same(period, value)}
                                            title="This capture only: what changed since the one before it"
                                            onClick={() => pick(period)}
                                        >
                                            {fmtDay(fromIso(d))}
                                        </button>
                                    );
                                })
                            ) : (
                                <span className="cp-period__none">None yet</span>
                            )}
                        </div>
                        <p className="cp-period__hint">
                            A period shows what was added between the last capture before it and the last capture inside it.
                        </p>
                    </div>
                </div>
            )}
        </div>
    );
}
