'use client';

import { motion, useReducedMotion } from 'framer-motion';
import { CodingFigure } from './avatar-sprite';
import PlatformLogo from './platform-logo';
import { IconCrown } from './coding-icons';
import { PLATFORMS, formatNumber } from './coding-theme';
import { BOARDS } from '../../../../lib/coding-profiles/boards';

// "Top Performers" — the dark panel with the three podium cards.
//
// Each card is a two-zone stage rather than a centred contact card: the facts sit on
// the left, and the student's figure stands BEHIND the card on the right — head and
// shoulders rising above the top edge, torso clipped by the card's bottom. The rank
// seal sits on the top-left corner where the eye lands first.
//
// The five boards come from the overview API already resolved (`boards[key]` is
// that board's top three for the current scope), so the panel never needs the
// cohort. See lib/coding-profiles/boards.js for why the platform boards rank raw
// activity rather than points.
//
// Framing is driven by `mode`. With one capture this is a baseline — most of the
// cohort created their accounts days before the scrape — so the subtitle says so.
// It becomes a plain leaderboard automatically once a second capture exists.

export { BOARDS };

const RANK_WORDS = ['First', 'Second', 'Third'];

export default function Podium({ boards, scopeLabel, mode = 'baseline', board, onBoard, onSelect }) {
    const reduce = useReducedMotion();
    const active = BOARDS.find((b) => b.key === board) || BOARDS[0];
    const top = boards?.[active.key] || [];

    const headline = (s) => (active.key === 'overall' ? s.score : Number(s.metrics?.[active.metric]) || 0);

    return (
        <section className="cp-top" aria-labelledby="cp-top-title">
            <header className="cp-top__head">
                <div>
                    <h2 id="cp-top-title" className="cp-top__title">
                        Top Performers
                    </h2>
                    <p className="cp-top__lede">
                        {mode === 'baseline'
                            ? `Strongest profiles at launch in ${scopeLabel} — the real story starts with the next capture`
                            : `Most problems solved in ${scopeLabel}`}
                    </p>
                </div>

                <div className="cp-top__tabs" role="tablist" aria-label="Leaderboard">
                    {BOARDS.map((b) => (
                        <button
                            key={b.key}
                            type="button"
                            role="tab"
                            aria-selected={b.key === active.key}
                            className={`cp-top__tab${b.key === active.key ? ' is-active' : ''}`}
                            onClick={() => onBoard?.(b.key)}
                        >
                            {b.key !== 'overall' && <PlatformLogo platform={b.key} size="xs" />}
                            {b.label}
                        </button>
                    ))}
                </div>
            </header>

            {!top.length ? (
                <p className="cp-top__empty">
                    Nobody in {scopeLabel} has recorded {active.key === 'overall' ? 'any activity' : `${active.label} activity`}{' '}
                    in this capture yet.
                </p>
            ) : (
                // DOM order stays 1-2-3 so reading and tab order match the ranking;
                // CSS `order` puts #1 in the centre on desktop.
                <ol className="cp-top__podium">
                    {top.map((student, index) => (
                        <motion.li
                            key={`${active.key}-${student.rollKey}`}
                            className={`cp-pcard-slot cp-pcard-slot--${index + 1}`}
                            initial={reduce ? false : { opacity: 0, y: 22 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={
                                reduce ? { duration: 0 } : { type: 'spring', stiffness: 230, damping: 26, delay: 0.07 * index }
                            }
                        >
                            <button
                                type="button"
                                className={`cp-pcard cp-pcard--${index + 1}`}
                                onClick={() => onSelect?.(student)}
                                aria-label={`${RANK_WORDS[index]} place on the ${active.label} board, ${student.name}, ${formatNumber(headline(student))} ${active.unit}. Open full analytics.`}
                            >
                                {index === 0 && (
                                    <span className="cp-pcard__crown" aria-hidden="true">
                                        <IconCrown width="24" height="24" />
                                    </span>
                                )}
                                <span className="cp-pcard__seal" aria-hidden="true">
                                    {index + 1}
                                </span>

                                <span className="cp-pcard__body">
                                    {/* Rank is stated in words as well as colour and size, so it
                                        survives colour-blindness and the monochrome print path. */}
                                    <span className="cp-pcard__rank-word">{RANK_WORDS[index]} place</span>
                                    <span className="cp-pcard__name" title={student.name}>
                                        {student.name}
                                    </span>
                                    <span className="cp-pcard__meta">
                                        {student.rollNo} · {student.branch} · {student.batch}
                                    </span>

                                    <span className="cp-pcard__score">
                                        <span className="cp-pcard__score-value">{formatNumber(headline(student))}</span>
                                        <span className="cp-pcard__score-label">
                                            {active.unit}
                                            {typeof student.delta === 'number' && student.delta !== 0 && active.key === 'overall' && (
                                                <span className={`cp-delta cp-delta--${student.delta > 0 ? 'up' : 'down'}`}>
                                                    {student.delta > 0 ? '▲' : '▼'} {Math.abs(student.delta)}
                                                </span>
                                            )}
                                        </span>
                                    </span>

                                    {/* The four counts that add up to the total — the card shows
                                        its own arithmetic, which pre-empts "why am I below him". */}
                                    <span className="cp-pcard__tiles" aria-hidden="true">
                                        {PLATFORMS.map((p, i) => (
                                            <span key={p.key} className="cp-pcard__tile" style={{ '--cp-bob-delay': `${i * 0.35}s` }}>
                                                <PlatformLogo platform={p} size="md" className="cp-plogo--bob" />
                                                <span className="cp-pcard__tile-value">
                                                    {Number(student.metrics?.[p.metricKey]) || 0}
                                                </span>
                                            </span>
                                        ))}
                                    </span>
                                    <span className="cp-sr-only">
                                        {PLATFORMS.map((p) => `${p.name}: ${Number(student.metrics?.[p.metricKey]) || 0} ${p.unit}. `).join('')}
                                    </span>
                                    <span className="cp-pcard__tiles-note">solved by platform · HackerRank in stars</span>
                                </span>

                                {/* The figure stands behind the card's right edge. Above the fold,
                                    so it loads eagerly — it is one of two shared files anyway. */}
                                <span className="cp-pcard__stage" aria-hidden="true">
                                    <CodingFigure
                                        gender={student.gender}
                                        rollKey={student.rollKey}
                                        name={student.name}
                                        eager
                                    />
                                </span>
                            </button>
                        </motion.li>
                    ))}
                </ol>
            )}
        </section>
    );
}
