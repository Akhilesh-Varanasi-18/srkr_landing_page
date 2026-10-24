'use client';

import { useEffect, useRef } from 'react';
import { motion, useReducedMotion } from 'framer-motion';
import CodingAvatar, { CodingFigure } from './avatar-sprite';
import PlatformLogo from './platform-logo';
import { HR_LANGUAGES } from '../../../../lib/coding-profiles/score';
import { PLATFORMS, PLATFORM_BY_KEY, formatNumber, TIER_STYLE } from './coding-theme';
import { LC_RANK_SENTINEL } from '../../../../lib/coding-profiles/columns';

// One student's full record.
//
// Everything here is a COUNT the student can check against their own profile page:
// problems solved, stars, programs. The total at the top is the plain sum of the
// four platform counts; no weights, no caps.
//
// FIELD-AWARE BY CONSTRUCTION. Thirteen of the export's thirty-nine columns are
// completely empty today (every GeeksforGeeks difficulty split, every contest rating)
// and three more hold a single value. Rather than rendering thirteen empty charts,
// each block asks the capture's coverage map whether its columns carry any signal at
// all, and absent ones are not drawn. When the bot starts returning them, the blocks
// appear on their own with no code change.

// Problem-count milestones: a small ladder gives the sparse platforms a visual and
// turns "2 problems" into "8 to the next milestone".
const MILESTONES = [10, 25, 50, 100, 200, 500, 1000];

const num = (v) => (Number.isFinite(Number(v)) ? Number(v) : 0);

/** "#E2544C" -> "rgba(226, 84, 76, a)" for the tinted header band. */
function tint(hex, alpha) {
    const n = parseInt(String(hex).replace('#', ''), 16);
    if (!Number.isFinite(n)) return `rgba(226, 84, 76, ${alpha})`; // --srkr-primary
    return `rgba(${(n >> 16) & 255}, ${(n >> 8) & 255}, ${n & 255}, ${alpha})`;
}

export default function StudentDetail({
    student,
    coverage,
    summary,
    batchSummary,
    periodLabel = null,
    onClose,
    onPrev,
    onNext,
    hasPrev,
    hasNext
}) {
    const reduce = useReducedMotion();
    const panelRef = useRef(null);

    // Focus moves into the panel on open so keyboard and screen-reader users land in
    // the thing that just appeared; Escape returns them to the card they came from.
    // The dialog container takes focus rather than its first button, so opening it
    // never paints a focus ring on a control nobody has pressed.
    useEffect(() => {
        panelRef.current?.focus({ preventScroll: true });
    }, [student?.rollKey]);

    useEffect(() => {
        const onKeyDown = (event) => {
            if (event.key === 'Escape') {
                event.stopPropagation();
                onClose?.();
                return;
            }

            if (event.key === 'Tab' && panelRef.current) {
                // aria-modal promises that nothing outside the dialog is reachable; loop
                // Tab inside it so the keyboard honours that too (belt and braces for
                // browsers without `inert`, which the parent sets on the page behind).
                const focusables = panelRef.current.querySelectorAll(
                    'a[href], button:not([disabled]), input, select, textarea, [tabindex]:not([tabindex="-1"])'
                );
                if (!focusables.length) return;
                const first = focusables[0];
                const last = focusables[focusables.length - 1];
                const active = document.activeElement;
                if (event.shiftKey && (active === first || active === panelRef.current)) {
                    event.preventDefault();
                    last.focus();
                } else if (!event.shiftKey && active === last) {
                    event.preventDefault();
                    first.focus();
                }
                return;
            }

            if (event.key !== 'ArrowLeft' && event.key !== 'ArrowRight') return;

            // Arrow navigation is a panel affordance: a caret move inside a text field or
            // an option change on a <select> must never swap students.
            const target = event.target;
            const editable =
                target instanceof HTMLElement &&
                (target.isContentEditable || /^(INPUT|SELECT|TEXTAREA)$/.test(target.tagName));
            if (editable || !panelRef.current?.contains(target)) return;

            if (event.key === 'ArrowLeft' && hasPrev) onPrev?.();
            else if (event.key === 'ArrowRight' && hasNext) onNext?.();
        };
        document.addEventListener('keydown', onKeyDown);
        return () => document.removeEventListener('keydown', onKeyDown);
    }, [onClose, onPrev, onNext, hasPrev, hasNext]);

    if (!student) return null;

    const has = (field) => Boolean(coverage?.[field]?.nonzero);
    const metrics = student.metrics || {};
    const notCaptured = !student.dataCaptured;
    const tier = TIER_STYLE[student.tier] || TIER_STYLE.starting;

    return (
        <motion.aside
            ref={panelRef}
            tabIndex={-1}
            className="cp-detail"
            role="dialog"
            aria-modal="true"
            aria-labelledby="cp-detail-name"
            initial={reduce ? false : { opacity: 0, x: 32 }}
            animate={{ opacity: 1, x: 0 }}
            exit={reduce ? undefined : { opacity: 0, x: 32 }}
            transition={reduce ? { duration: 0 } : { type: 'spring', stiffness: 260, damping: 30 }}
        >
            <header className="cp-detail__bar">
                <button type="button" className="cp-detail__close" onClick={onClose}>
                    <span aria-hidden="true">←</span> Back to list
                </button>
                <span className="cp-detail__nav">
                    <button type="button" onClick={onPrev} disabled={!hasPrev} aria-label="Previous student">
                        ↑
                    </button>
                    <button type="button" onClick={onNext} disabled={!hasNext} aria-label="Next student">
                        ↓
                    </button>
                </span>
            </header>

            <div className="cp-detail__body">
                {/* On desktop this sits to the right of the data. On a phone it moves
                    ABOVE the data but shrinks hard, so the analytics the admin actually
                    came for are never pushed below the fold by decoration. */}
                <div className="cp-detail__side">
                    <div className="cp-detail__figure">
                        {notCaptured ? (
                            <CodingAvatar
                                gender={student.gender}
                                rollKey={student.rollKey}
                                name={student.name}
                                size="lg"
                                monogram
                            />
                        ) : (
                            <>
                                {/* Desktop: the full figure standing in the tinted stage, with a
                                    slow float driven by CSS rather than framer-motion, so nothing
                                    keeps animating once the phone/tablet rule hides this node.
                                    Phone/tablet: the compact portrait in the header row instead —
                                    the stylesheet shows one or the other. */}
                                <div className="cp-detail__stage">
                                    <CodingFigure gender={student.gender} rollKey={student.rollKey} name={student.name} />
                                </div>
                                <span className="cp-detail__face">
                                    <CodingAvatar
                                        gender={student.gender}
                                        rollKey={student.rollKey}
                                        name={student.name}
                                        size="lg"
                                    />
                                </span>
                            </>
                        )}
                    </div>

                    <div className="cp-detail__links">
                        {PLATFORMS.map((platform) => {
                            const url = student.profiles?.[platform.profileKey];
                            if (!url) return null;
                            return (
                                <a
                                    key={platform.key}
                                    href={url}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="cp-detail__link"
                                    style={{ '--cp-slot-accent': platform.accent }}
                                >
                                    <PlatformLogo platform={platform} size="sm" />
                                    {platform.name}
                                    <span aria-hidden="true">↗</span>
                                </a>
                            );
                        })}
                    </div>
                </div>

                <div className="cp-detail__main">
                    <div className="cp-detail__hero">
                        <h2 id="cp-detail-name" className="cp-detail__name">
                            {student.name}
                        </h2>
                        <p className="cp-detail__meta">
                            {student.rollNo} · {student.branch} · {student.batch}
                        </p>
                        <div className="cp-detail__badges">
                            <span className={`cp-chip cp-chip--${tier.tone}`}>{tier.label}</span>
                            {student.overallRank && (
                                <span className="cp-chip cp-chip--slate">
                                    #{student.overallRank} overall
                                </span>
                            )}
                            {student.batchRank && (
                                <span className="cp-chip cp-chip--slate">
                                    #{student.batchRank} in {student.batch}
                                </span>
                            )}
                        </div>
                    </div>

                    {notCaptured ? (
                        <div className="cp-empty-block">
                            <h3>No profile data captured</h3>
                            <p>
                                The scraper found no row for {student.rollNo} in this run. That is a gap in our
                                data collection, not a result — this student has not been measured at all.
                            </p>
                            <p className="cp-empty-block__action">
                                Collect their four profile links and include them in the next bot run.
                            </p>
                        </div>
                    ) : (
                        <>
                            <TotalCard student={student} summary={summary} batchSummary={batchSummary} periodLabel={periodLabel} />

                            <div className="cp-pf-grid">
                                {/* ── LeetCode. 186 of 308 students have zero solves, so the
                                    empty state here is the majority state and reads plainly. */}
                                <PlatformCard platform={PLATFORM_BY_KEY.lc} count={metrics.lcTotal} unit="problems solved" wide>
                                    {num(metrics.lcTotal) > 0 ? (
                                        <>
                                            <DifficultySplit
                                                easy={num(metrics.easy)}
                                                medium={num(metrics.medium)}
                                                hard={num(metrics.hard)}
                                            />
                                            <Milestone value={num(metrics.lcTotal)} unit="problems" accent={PLATFORM_BY_KEY.lc.accent} />
                                            <Facts
                                                items={[
                                                    // The global rank column is a sentinel for 267 of 308 rows; only a real one is shown.
                                                    metrics.lcRank !== null && metrics.lcRank !== undefined && num(metrics.lcRank) < LC_RANK_SENTINEL
                                                        ? { label: 'Global rank', value: `#${formatNumber(metrics.lcRank)}` }
                                                        : null,
                                                    has('lcContestRating') && metrics.lcContestRating !== null
                                                        ? { label: 'Contest rating', value: formatNumber(metrics.lcContestRating) }
                                                        : null,
                                                    has('lcContestCount') && num(metrics.lcContestCount) > 0
                                                        ? { label: 'Contests', value: formatNumber(metrics.lcContestCount) }
                                                        : null
                                                ]}
                                            />
                                        </>
                                    ) : (
                                        <Nothing text="No problems solved on LeetCode yet." sub="The first accepted solution starts the difficulty split." />
                                    )}
                                </PlatformCard>

                                {/* ── CodeChef. The densest column of the four. */}
                                <PlatformCard platform={PLATFORM_BY_KEY.cc} count={metrics.ccProblems} unit="problems solved">
                                    {num(metrics.ccProblems) > 0 ? (
                                        <>
                                            <Milestone value={num(metrics.ccProblems)} unit="problems" accent={PLATFORM_BY_KEY.cc.accent} />
                                            {has('ccStarRating') && metrics.ccStarRating !== null && (
                                                <Stars value={num(metrics.ccStarRating)} max={7} label="CodeChef stars" />
                                            )}
                                            <Facts
                                                items={[
                                                    has('ccRating') && metrics.ccRating !== null
                                                        ? { label: 'Rating', value: formatNumber(metrics.ccRating) }
                                                        : null,
                                                    has('ccContestCount') && metrics.ccContestCount !== null
                                                        ? { label: 'Contests', value: formatNumber(metrics.ccContestCount) }
                                                        : null
                                                ]}
                                                fallback="No contest rating yet — practice problems only."
                                            />
                                        </>
                                    ) : (
                                        <Nothing text="No problems solved on CodeChef yet." />
                                    )}
                                </PlatformCard>

                                {/* ── GeeksforGeeks. Only 38 of 308 students have anything here,
                                    and every difficulty-split column is empty in this capture —
                                    so the split is not drawn at all until the bot returns it. */}
                                <PlatformCard platform={PLATFORM_BY_KEY.gfg} count={metrics.gfgPrograms} unit="programs solved">
                                    {num(metrics.gfgPrograms) > 0 || num(metrics.gfgScore) > 0 ? (
                                        <>
                                            <Milestone value={num(metrics.gfgPrograms)} unit="programs" accent={PLATFORM_BY_KEY.gfg.accent} />
                                            {['gfgSchool', 'gfgBasic', 'gfgEasy', 'gfgMedium', 'gfgHard'].some(has) && (
                                                <Tiles
                                                    accent={PLATFORM_BY_KEY.gfg.accent}
                                                    items={['gfgSchool', 'gfgBasic', 'gfgEasy', 'gfgMedium', 'gfgHard']
                                                        .filter(has)
                                                        .map((field) => ({ label: field.replace('gfg', ''), value: num(metrics[field]) }))}
                                                />
                                            )}
                                            <Facts
                                                items={[
                                                    num(metrics.gfgScore) > 0 ? { label: 'GfG score', value: formatNumber(metrics.gfgScore) } : null,
                                                    has('gfgRating') && metrics.gfgRating !== null ? { label: 'Rating', value: formatNumber(metrics.gfgRating) } : null,
                                                    has('gfgContestCount') && num(metrics.gfgContestCount) > 0
                                                        ? { label: 'Contests', value: formatNumber(metrics.gfgContestCount) }
                                                        : null
                                                ]}
                                            />
                                        </>
                                    ) : (
                                        <Nothing text="No programs solved on GeeksforGeeks yet." />
                                    )}
                                </PlatformCard>

                                {/* ── HackerRank: per-language stars. Java has 19 nonzero across
                                    the whole cohort and SQL 6, so most rows are empty tracks —
                                    shown as hollow pips rather than omitted, so the six languages
                                    stay comparable between students. */}
                                <PlatformCard platform={PLATFORM_BY_KEY.hr} count={metrics.hrTotalStars} unit="stars earned" wide>
                                    <div className="cp-langs">
                                        {HR_LANGUAGES.map((lang) => {
                                            const stars = num(metrics[lang.key]);
                                            return (
                                                <div key={lang.key} className={`cp-lang${stars > 0 ? ' is-active' : ''}`}>
                                                    <span className="cp-lang__name">{lang.label}</span>
                                                    <span className="cp-lang__stars" aria-hidden="true">
                                                        {[1, 2, 3, 4, 5].map((n) => (
                                                            <span key={n} className={`cp-pip${n <= stars ? ' is-on' : ''}`} />
                                                        ))}
                                                    </span>
                                                    <span className="cp-lang__count">{stars}</span>
                                                    <span className="cp-sr-only">
                                                        {lang.label}: {stars} of 5 stars.
                                                    </span>
                                                </div>
                                            );
                                        })}
                                    </div>
                                    <Facts
                                        items={[
                                            { label: 'Badges', value: formatNumber(num(metrics.hrBadges)) },
                                            { label: 'Certifications', value: formatNumber(num(metrics.hrCertificationCount)) }
                                        ]}
                                    />
                                    {metrics.hrCertifications && (
                                        <p className="cp-pf__certs">
                                            <strong>Certified:</strong> {metrics.hrCertifications}
                                        </p>
                                    )}
                                </PlatformCard>
                            </div>
                        </>
                    )}
                </div>
            </div>
        </motion.aside>
    );
}

// ── Total ───────────────────────────────────────────────────────────────────

/**
 * The total, how it splits across the four platforms, and where it sits against
 * the batch and the cohort.
 *
 * The benchmark is expressed as "ahead of N students in …" rather than a percentile:
 * with a cohort median around 12 and 34 students on zero, "above average" is nearly
 * meaningless, whereas a plain count of people behind you is both true and legible.
 */
function TotalCard({ student, summary, batchSummary, periodLabel }) {
    const scores = summary?.scores || [];
    const behind = scores.filter((s) => s < student.score).length;
    const counts = PLATFORMS.map((p) => ({ ...p, value: num(student.metrics?.[p.metricKey]) }));
    const total = counts.reduce((t, p) => t + p.value, 0);
    const summaryText = counts.map((p) => `${p.name} ${p.value}`).join(', ');
    const title = periodLabel ? `Solved in ${periodLabel}` : 'Total solved';
    const hasAllTime = periodLabel && student.allTimeScore !== null && student.allTimeScore !== undefined;

    return (
        <section className="cp-prof-total" aria-label={`${title}: ${formatNumber(student.score)}. ${summaryText}`}>
            <div className="cp-prof-total__head">
                <div className="cp-prof-total__figure">
                    <span className="cp-prof-total__value">{formatNumber(student.score)}</span>
                    <span className="cp-prof-total__label">
                        {title}
                        <small>
                            LeetCode + CodeChef + HackerRank stars + GeeksforGeeks
                            {hasAllTime && <> · all-time total {formatNumber(student.allTimeScore)}</>}
                            {student.newInPeriod && <> · first captured in this period, counted from zero</>}
                        </small>
                    </span>
                </div>
                {typeof student.delta === 'number' && (
                    <span className={`cp-delta cp-delta--${student.delta >= 0 ? 'up' : 'down'}`}>
                        {student.delta >= 0 ? '▲' : '▼'} {Math.abs(student.delta)} since last capture
                    </span>
                )}
            </div>

            {/* The composition bar: one segment per platform, in its accent. */}
            <div className="cp-prof-total__bar" aria-hidden="true">
                {total > 0 ? (
                    counts
                        .filter((p) => p.value > 0)
                        .map((p) => (
                            <span
                                key={p.key}
                                className="cp-prof-total__seg"
                                style={{ flexGrow: p.value, background: p.accent }}
                                title={`${p.name}: ${p.value}`}
                            />
                        ))
                ) : (
                    <span className="cp-prof-total__seg cp-prof-total__seg--empty" />
                )}
            </div>

            <div className="cp-prof-total__parts" aria-hidden="true">
                {counts.map((p) => (
                    <div key={p.key} className={`cp-prof-part${p.value > 0 ? ' is-active' : ''}`} style={{ '--cp-part-accent': p.accent }}>
                        <PlatformLogo platform={p} size="sm" />
                        <span className="cp-prof-part__text">
                            <strong className="cp-prof-part__value">{formatNumber(p.value)}</strong>
                            <span className="cp-prof-part__label">{p.name}</span>
                        </span>
                    </div>
                ))}
            </div>

            {student.score > 0 && (
                <p className="cp-prof-total__bench">
                    Ahead of <strong>{behind}</strong> of {summary?.captured ?? 0} measured students
                    {batchSummary ? <> · {student.batch} median is {batchSummary.median}</> : null}
                </p>
            )}
        </section>
    );
}

// ── Platform cards ──────────────────────────────────────────────────────────

/** A platform's card: tinted header band with the badge and the headline count, then its own breakdown. */
function PlatformCard({ platform, count, unit, wide = false, children }) {
    return (
        <section
            className={`cp-pf${wide ? ' cp-pf--wide' : ''}`}
            style={{
                '--cp-pf': platform.accent,
                '--cp-pf-tint': tint(platform.accent, 0.14),
                '--cp-pf-tint-soft': tint(platform.accent, 0.04),
                '--cp-pf-glow': tint(platform.accent, 0.35)
            }}
            aria-label={`${platform.name}: ${formatNumber(count ?? 0)} ${unit}`}
        >
            <header className="cp-pf__head">
                <PlatformLogo platform={platform} size="lg" />
                <h3 className="cp-pf__name">{platform.name}</h3>
                <span className="cp-pf__count">
                    <strong>{formatNumber(count ?? 0)}</strong>
                    <span>{unit}</span>
                </span>
            </header>
            <div className="cp-pf__body">
                {children}
                <p className="cp-pf__note">{platform.note}</p>
            </div>
        </section>
    );
}

/**
 * Easy / Medium / Hard as three tiles under a proportional bar. Direct labelling
 * rather than a legend; the counts are the ones on the student's profile page.
 */
function DifficultySplit({ easy, medium, hard }) {
    const total = easy + medium + hard || 1;
    const rows = [
        { key: 'easy', label: 'Easy', value: easy },
        { key: 'medium', label: 'Medium', value: medium },
        { key: 'hard', label: 'Hard', value: hard }
    ];
    return (
        <div className="cp-diff">
            <div className="cp-diff__bar" aria-hidden="true">
                {rows.map((row) =>
                    row.value > 0 ? (
                        <span
                            key={row.key}
                            className={`cp-diff__seg cp-diff__seg--${row.key}`}
                            style={{ flexBasis: `${(row.value / total) * 100}%` }}
                        />
                    ) : null
                )}
            </div>
            <dl className="cp-diff__tiles">
                {rows.map((row) => (
                    <div key={row.key} className={`cp-diff__tile cp-diff__tile--${row.key}`}>
                        <dt>{row.label}</dt>
                        <dd>
                            <strong>{formatNumber(row.value)}</strong>
                            <span>{Math.round((row.value / total) * 100)}%</span>
                        </dd>
                    </div>
                ))}
            </dl>
        </div>
    );
}

/** Progress to the next problem-count milestone. */
function Milestone({ value, unit, accent }) {
    const next = MILESTONES.find((m) => m > value);
    const previous = [...MILESTONES].reverse().find((m) => m <= value) || 0;
    const span = next ? next - previous : 1;
    const progress = next ? Math.min(1, (value - previous) / span) : 1;
    return (
        <div className="cp-ms" style={{ '--cp-ms-accent': accent }}>
            <div className="cp-ms__row">
                <span className="cp-ms__from">{previous > 0 ? formatNumber(previous) : 'Start'}</span>
                <span className="cp-ms__text">
                    {next ? (
                        <>
                            <strong>{formatNumber(next - value)}</strong> more {unit} to the next milestone
                        </>
                    ) : (
                        <>Past every milestone on the ladder</>
                    )}
                </span>
                <span className="cp-ms__to">{next ? formatNumber(next) : '∞'}</span>
            </div>
            <div className="cp-ms__track" role="progressbar" aria-valuemin={previous} aria-valuemax={next || value} aria-valuenow={value} aria-label={`${formatNumber(value)} ${unit}`}>
                <span className="cp-ms__fill" style={{ width: `${Math.max(2, Math.round(progress * 100))}%` }} />
            </div>
        </div>
    );
}

/** Small labelled facts in a row; renders the fallback line when nothing applies. */
function Facts({ items, fallback }) {
    const list = items.filter(Boolean);
    if (!list.length) return fallback ? <p className="cp-pf__quiet">{fallback}</p> : null;
    return (
        <dl className="cp-facts">
            {list.map((f) => (
                <div key={f.label} className="cp-fact">
                    <dt>{f.label}</dt>
                    <dd>{f.value}</dd>
                </div>
            ))}
        </dl>
    );
}

/** Count tiles with the platform's accent — the GfG difficulty split, once the bot returns it. */
function Tiles({ items, accent }) {
    return (
        <dl className="cp-tiles" style={{ '--cp-tiles-accent': accent }}>
            {items.map((t) => (
                <div key={t.label} className="cp-tiles__tile">
                    <dt>{t.label}</dt>
                    <dd>{formatNumber(t.value)}</dd>
                </div>
            ))}
        </dl>
    );
}

function Stars({ value, max, label }) {
    return (
        <div className="cp-stars" aria-label={`${label}: ${value} of ${max}`}>
            {Array.from({ length: max }, (_, i) => (
                <span key={i} className={`cp-stars__star${i < value ? ' is-on' : ''}`} aria-hidden="true">
                    ★
                </span>
            ))}
            <span className="cp-stars__text">{label}</span>
        </div>
    );
}

function Nothing({ text, sub }) {
    return (
        <div className="cp-pf__nothing">
            <p>{text}</p>
            {sub && <small>{sub}</small>}
        </div>
    );
}
