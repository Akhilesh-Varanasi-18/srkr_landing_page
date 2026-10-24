'use client';

import { useEffect } from 'react';
import Link from 'next/link';
import { motion, useReducedMotion } from 'framer-motion';
import { IconTrophy, IconChart, IconChevronLeft } from '../dashboard/coding/coding-icons';
import { IconHome, IconMegaphone, IconLogout } from '../dashboard/dashboard-icons';

// The admin panel's navigation rail: a floating frosted-glass panel listing the
// modules. Same three shapes from one markup as the coding-profiles rail it grew
// out of:
//   • desktop (≥1024px) — a rail beside the content that collapses to icon tiles
//     and expands to icon + label; the choice is remembered;
//   • tablet (768–1023px) — the icon rail, and expanding it lays the full rail OVER
//     the content behind a scrim instead of pushing the page about;
//   • phone (<768px) — a floating glass tab bar at the bottom of the screen.
// The highlight behind the active module is a shared-layout element, so it glides
// from one module to the next rather than blinking.

export const MODULES = [
    { key: 'home', href: '/admin', label: 'Overview', short: 'Home', hint: 'Every module at a glance', Icon: IconHome, exact: true },
    { key: 'analytics', href: '/admin/analytics', label: 'Analytics', short: 'Analytics', hint: 'Registrations by program', Icon: IconChart },
    { key: 'coding', href: '/admin/coding-profiles', label: 'Coding Profiles', short: 'Coding', hint: 'Leaderboards & captures', Icon: IconTrophy },
    { key: 'announcements', href: '/admin/announcements', label: 'Announcements', short: 'Announce', hint: 'The home-page pop-up', Icon: IconMegaphone }
];

/** Which module a pathname belongs to. */
export function activeModule(pathname) {
    const path = String(pathname || '').replace(/\/+$/, '') || '/';
    const match = MODULES.find((m) => (m.exact ? path === m.href : path === m.href || path.startsWith(`${m.href}/`)));
    return match ? match.key : 'home';
}

export default function AdminRail({ active, onSignOut, expanded, onToggle, overlay }) {
    const reduce = useReducedMotion();

    // The tablet drawer closes on Escape like any overlay.
    useEffect(() => {
        if (!overlay || !expanded) return undefined;
        const onKey = (e) => {
            if (e.key === 'Escape') onToggle(false);
        };
        window.addEventListener('keydown', onKey);
        return () => window.removeEventListener('keydown', onKey);
    }, [overlay, expanded, onToggle]);

    const pill = reduce ? (
        <span className="cp-nav__pill" aria-hidden="true" />
    ) : (
        <motion.span
            layoutId="admin-nav-pill"
            className="cp-nav__pill"
            transition={{ type: 'spring', stiffness: 380, damping: 34 }}
            aria-hidden="true"
        />
    );

    return (
        <>
            {overlay && expanded && <div className="cp-nav__scrim" onClick={() => onToggle(false)} aria-hidden="true" />}

            <nav className={`cp-nav cp-nav--admin${expanded ? ' is-open' : ' is-closed'}`} aria-label="Admin modules">
                <div className="cp-nav__head">
                    <Link className="cp-nav__brand" href="/admin" aria-label="Admin panel home">
                        <img
                            className="cp-nav__mark"
                            src="/assets/images/srkr/project-images/torii-mark.svg"
                            alt=""
                            width="114"
                            height="108"
                        />
                        <img
                            className="cp-nav__wordmark"
                            src="/assets/images/srkr/project-images/torii-dark-text.svg"
                            alt=""
                            width="500"
                            height="240"
                        />
                    </Link>
                    <button
                        type="button"
                        className="cp-nav__toggle"
                        onClick={() => onToggle(!expanded)}
                        aria-expanded={expanded}
                        aria-label={expanded ? 'Collapse navigation' : 'Expand navigation'}
                    >
                        <IconChevronLeft />
                    </button>
                </div>

                <ul className="cp-nav__list" role="list">
                    {MODULES.map(({ key, href, label, short, hint, Icon }) => {
                        const isActive = active === key;
                        return (
                            <li key={key} className="cp-nav__li" data-tip={label}>
                                <Link
                                    href={href}
                                    className={`cp-nav__item${isActive ? ' is-active' : ''}`}
                                    aria-current={isActive ? 'page' : undefined}
                                    onClick={() => {
                                        if (overlay) onToggle(false);
                                    }}
                                >
                                    {isActive && pill}
                                    {/* The blurred glow is a sibling of the tile, behind it —
                                        a child could never paint beneath its parent's background. */}
                                    <span className="cp-nav__glow" aria-hidden="true" />
                                    <span className="cp-nav__icon" aria-hidden="true">
                                        <Icon />
                                    </span>
                                    <span className="cp-nav__text">
                                        <span className="cp-nav__label">
                                            <span className="cp-nav__label-full">{label}</span>
                                            <span className="cp-nav__label-short">{short}</span>
                                        </span>
                                        <span className="cp-nav__hint">{hint}</span>
                                    </span>
                                </Link>
                            </li>
                        );
                    })}
                </ul>

                <div className="cp-nav__foot">
                    <div className="cp-nav__li" data-tip="Sign out">
                        <button type="button" className="cp-nav__item cp-nav__item--quiet" onClick={onSignOut}>
                            <span className="cp-nav__icon" aria-hidden="true">
                                <IconLogout />
                            </span>
                            <span className="cp-nav__text">
                                <span className="cp-nav__label">
                                    <span className="cp-nav__label-full">Sign out</span>
                                    <span className="cp-nav__label-short">Exit</span>
                                </span>
                                <span className="cp-nav__hint">End this session</span>
                            </span>
                        </button>
                    </div>
                </div>
            </nav>
        </>
    );
}
