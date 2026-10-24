'use client';

import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { motion, useReducedMotion } from 'framer-motion';
import { useAdmin } from './admin-context';
import { IconTrophy, IconChart, IconArrowLeft, IconExternal } from '../dashboard/coding/coding-icons';
import { IconMegaphone, IconRefresh } from '../dashboard/dashboard-icons';
import { formatDate, formatDateTime } from '../dashboard/coding/coding-theme';

// The landing page: one card per module, each carrying the two or three numbers
// that say whether anything needs attention before the admin opens it.

const num = (v) => (v === null || v === undefined ? '—' : Number(v).toLocaleString('en-IN'));

function greeting() {
    const h = new Date().getHours();
    if (h < 12) return 'Good morning';
    if (h < 17) return 'Good afternoon';
    return 'Good evening';
}

export default function AdminHome() {
    const { unauthorized } = useAdmin();
    const [data, setData] = useState(null);
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(true);
    const reduce = useReducedMotion();

    const load = useCallback(async () => {
        setLoading(true);
        setError('');
        try {
            const res = await fetch('/api/admin/overview', { cache: 'no-store' });
            if (res.status === 401) {
                unauthorized();
                return;
            }
            const json = await res.json().catch(() => ({}));
            if (!res.ok || !json.success) throw new Error(json.message || 'Could not load the overview.');
            setData(json);
        } catch (e) {
            setError(e.message || 'Something went wrong.');
        } finally {
            setLoading(false);
        }
    }, [unauthorized]);

    useEffect(() => {
        load();
    }, [load]);

    const reg = data?.registrations || null;
    const cod = data?.coding || null;
    const ann = data?.announcements || null;
    const intake = reg?.openIntake || null;

    const modules = [
        {
            key: 'analytics',
            href: '/admin/analytics',
            tone: 'coral',
            Icon: IconChart,
            title: 'Analytics',
            blurb: 'Registrations across every Torii program — totals, trends, branches, and the live intake — overall or one program at a time.',
            stats: reg
                ? [
                      { label: 'Registrations', value: num(reg.total) },
                      { label: 'This week', value: num(reg.week), accent: reg.week > 0 },
                      intake
                          ? { label: `${intake.name} intake`, value: intake.eligible ? `${num(intake.registered)} / ${num(intake.eligible)}` : num(intake.registered), live: true }
                          : { label: 'Open intake', value: 'None open' }
                  ]
                : null,
            cta: 'Open analytics',
            secondary: { label: 'Download Excel', href: '/admin/analytics?download=1' }
        },
        {
            key: 'coding',
            href: '/admin/coding-profiles',
            tone: 'amber',
            Icon: IconTrophy,
            title: 'Coding Profiles',
            blurb: 'Leaderboards, podiums and platform analytics for every program on the coding roster. Create a program, load its roster and captures, all from here.',
            stats: cod
                ? [
                      { label: 'Programs', value: num(cod.programCount) },
                      { label: 'Students tracked', value: num(cod.students) },
                      { label: 'Latest capture', value: cod.latestCapture ? formatDate(cod.latestCapture) : 'None yet' }
                  ]
                : null,
            cta: 'Open coding profiles',
            secondary: { label: 'New program', href: '/admin/coding-profiles?new=1' }
        },
        {
            key: 'announcements',
            href: '/admin/announcements',
            tone: 'blue',
            Icon: IconMegaphone,
            title: 'Announcements',
            blurb: 'The pop-up every visitor sees on the home page. Publish a poster, swap the live one, or take it down.',
            stats: ann
                ? [
                      { label: 'Live now', value: ann.live ? ann.live.title || ann.live.exclusiveFor || 'Untitled' : 'Nothing live', live: Boolean(ann.live) },
                      { label: 'Published', value: num(ann.total) },
                      { label: 'Last published', value: ann.live?.createdAt ? formatDate(ann.live.createdAt) : '—' }
                  ]
                : null,
            cta: 'Open announcements',
            secondary: { label: 'Create announcement', href: '/admin/announcements?tab=create' }
        }
    ];

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
                        <h1 className="cp-topbar__title">Admin Panel</h1>
                        <p className="cp-topbar__sub">
                            ToriiMinds × SRKR · internal{data ? ` · updated ${formatDateTime(data.generatedAt)}` : ''}
                        </p>
                    </div>
                </div>
                <div className="cp-topbar__actions">
                    <button
                        type="button"
                        className="cp-btn cp-btn--ghost cp-btn--compact"
                        onClick={load}
                        disabled={loading}
                        aria-label={loading ? 'Refreshing' : 'Refresh'}
                    >
                        <IconRefresh /> <span className="cp-btn__text">{loading ? 'Refreshing…' : 'Refresh'}</span>
                    </button>
                    <a className="cp-btn cp-btn--ghost cp-btn--compact" href="/" target="_blank" rel="noopener noreferrer" aria-label="Open the public site">
                        <IconExternal /> <span className="cp-btn__text">View site</span>
                    </a>
                </div>
            </header>

            <section className="ad-hero" aria-labelledby="ad-hero-title">
                <p className="ad-hero__eyebrow">{greeting()}</p>
                <h2 id="ad-hero-title" className="ad-hero__title">
                    What would you like to work on?
                </h2>
                <p className="ad-hero__sub">
                    Three modules, one place. Registrations, coding profiles and the home-page announcement — no developer needed for
                    the day-to-day.
                </p>
            </section>

            {error && (
                <p className="cp-alert cp-alert--error">
                    {error} <button type="button" className="cp-an-link" onClick={load}>Try again</button>
                </p>
            )}

            <div className="ad-modules">
                {modules.map(({ key, href, tone, Icon, title, blurb, stats, cta, secondary }, index) => (
                    <motion.article
                        key={key}
                        className={`ad-module ad-module--${tone}`}
                        initial={reduce ? false : { opacity: 0, y: 14 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: reduce ? 0 : 0.42, delay: reduce ? 0 : 0.06 * index, ease: [0.22, 0.61, 0.36, 1] }}
                    >
                        <Link href={href} className="ad-module__link" aria-label={`${cta}: ${title}`}>
                            <span className="ad-module__glow" aria-hidden="true" />
                            <span className="ad-module__icon" aria-hidden="true">
                                <Icon />
                            </span>
                            <span className="ad-module__head">
                                <span className="ad-module__title">{title}</span>
                                <span className="ad-module__blurb">{blurb}</span>
                            </span>
                            <dl className="ad-module__stats">
                                {(stats || [null, null, null]).map((s, i) => (
                                    <div key={i} className={`ad-module__stat${s?.live ? ' is-live' : ''}${s?.accent ? ' is-accent' : ''}`}>
                                        {s ? (
                                            <>
                                                <dt>{s.label}</dt>
                                                <dd>
                                                    {s.live && <span className="ad-module__dot" aria-hidden="true" />}
                                                    <span className="ad-module__value">{s.value}</span>
                                                </dd>
                                            </>
                                        ) : (
                                            <>
                                                <dt><span className="ad-skel ad-skel--label" /></dt>
                                                <dd><span className="ad-skel ad-skel--value" /></dd>
                                            </>
                                        )}
                                    </div>
                                ))}
                            </dl>
                            <span className="ad-module__cta">
                                {cta}
                                <span className="ad-module__arrow" aria-hidden="true">
                                    <IconArrowLeft />
                                </span>
                            </span>
                        </Link>
                        {secondary && (
                            <Link href={secondary.href} className="ad-module__secondary">
                                {secondary.label}
                            </Link>
                        )}
                    </motion.article>
                ))}
            </div>
        </>
    );
}
