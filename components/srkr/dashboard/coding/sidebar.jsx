'use client';

import { useEffect } from 'react';
import { motion, useReducedMotion } from 'framer-motion';
import { IconTrophy, IconChart, IconChevronLeft } from './coding-icons';
import { IconLogout } from '../dashboard-icons';

// The navigation rail: a floating frosted-glass panel with two destinations.
//
// Three shapes from one markup:
//   • desktop (≥1024px) — a rail beside the content that collapses to icon tiles
//     and expands to icon + label; the choice is remembered;
//   • tablet (768–1023px) — the icon rail, and expanding it lays the full rail OVER
//     the content behind a scrim instead of pushing the page about;
//   • phone (<768px) — a floating glass tab bar at the bottom of the screen, so both
//     destinations stay one thumb-tap away.
// The highlight behind the active item is a shared-layout element, so it glides
// from one destination to the other rather than blinking.

export const VIEWS = [
    { key: 'leaderboard', label: 'Leaderboard', hint: 'Podium and every student', Icon: IconTrophy },
    { key: 'analytics', label: 'Analytics', hint: 'Who leads, who is quiet', Icon: IconChart }
];

export default function Sidebar({ view, onChange, onSignOut, expanded, onToggle, overlay }) {
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

    const pick = (key) => {
        onChange(key);
        if (overlay) onToggle(false);
    };

    const pill = reduce ? (
        <span className="cp-nav__pill" aria-hidden="true" />
    ) : (
        <motion.span
            layoutId="cp-nav-pill"
            className="cp-nav__pill"
            transition={{ type: 'spring', stiffness: 380, damping: 34 }}
            aria-hidden="true"
        />
    );

    return (
        <>
            {overlay && expanded && <div className="cp-nav__scrim" onClick={() => onToggle(false)} aria-hidden="true" />}

            <nav className={`cp-nav${expanded ? ' is-open' : ' is-closed'}`} aria-label="Dashboard sections">
                <div className="cp-nav__head">
                    <a className="cp-nav__brand" href="/" aria-label="ToriiMinds home">
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
                    </a>
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
                    {VIEWS.map(({ key, label, hint, Icon }) => {
                        const active = view === key;
                        return (
                            <li key={key} className="cp-nav__li" data-tip={label}>
                                <motion.button
                                    type="button"
                                    className={`cp-nav__item${active ? ' is-active' : ''}`}
                                    onClick={() => pick(key)}
                                    aria-current={active ? 'page' : undefined}
                                    whileTap={reduce ? undefined : { scale: 0.97 }}
                                >
                                    {active && pill}
                                    {/* The blurred glow is a sibling of the tile, behind it —
                                        a child could never paint beneath its parent's background. */}
                                    <span className="cp-nav__glow" aria-hidden="true" />
                                    <span className="cp-nav__icon" aria-hidden="true">
                                        <Icon />
                                    </span>
                                    <span className="cp-nav__text">
                                        <span className="cp-nav__label">{label}</span>
                                        <span className="cp-nav__hint">{hint}</span>
                                    </span>
                                </motion.button>
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
                                <span className="cp-nav__label">Sign out</span>
                                <span className="cp-nav__hint">End this session</span>
                            </span>
                        </button>
                    </div>
                </div>
            </nav>
        </>
    );
}
