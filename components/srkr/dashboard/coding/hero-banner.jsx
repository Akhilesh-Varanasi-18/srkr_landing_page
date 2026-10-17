'use client';

import { useMemo } from 'react';
import HeroIllustration from './hero-illustration';
import { formatDate } from './coding-theme';

// The warm hero band under the top bar. Text left, animated scene right.
//
// On a phone the scene cannot sit to the right, and a full-width illustration above
// the copy would push the KPIs and the podium below the fold — so it drops under the
// text at a capped width, and below 480px it is hidden entirely. The page's job is
// the numbers; the illustration is the welcome mat, not the floor.
//
// On paper the hero doubles as the report's title block, so it states what the
// report covers — the scope bar that chose it does not print.

export default function HeroBanner({ program, scopeLabel, scopeCount, snapshot }) {
    const generated = useMemo(() => formatDate(new Date().toISOString()), []);

    return (
        <section className="cp-hero" aria-labelledby="cp-hero-heading">
            <div className="cp-hero__copy">
                <p className="cp-hero__eyebrow">Coding profiles · Internal</p>
                <h2 id="cp-hero-heading" className="cp-hero__title">
                    {program.name}
                </h2>
                <p className="cp-hero__tag">Track. Learn. Grow.</p>
                <p className="cp-hero__body">{program.tagline}.</p>
                <p className="cp-hero__print">
                    Leaderboard report · <strong>{scopeLabel}</strong> · {scopeCount} students · data captured{' '}
                    {formatDate(snapshot?.capturedAt)} · generated {generated}
                </p>
            </div>
            <div className="cp-hero__art" aria-hidden="true">
                <HeroIllustration />
            </div>
            <span className="cp-hero__blob cp-hero__blob--1" aria-hidden="true" />
            <span className="cp-hero__blob cp-hero__blob--2" aria-hidden="true" />
        </section>
    );
}
