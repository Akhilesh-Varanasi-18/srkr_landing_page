'use client';

import CodingAvatar from './avatar-sprite';
import PlatformLogo from './platform-logo';
import Segmented from './segmented';
import { IconChevronRight, IconChevronLeft, IconPeople } from './coding-icons';
import { PLATFORMS, formatNumber, shortBatch } from './coding-theme';
import { PAGE_SIZES } from '../../../../lib/coding-profiles/cohort';

// The student directory: header with the page-size control, card grid, pager at
// the foot. The list arrives from the server one page at a time — ranks, counts and
// the podium are computed over everyone server-side, so paging is only a question
// of how many cards to draw.
//
// Two decisions here come straight from the real distribution:
//
// 1. THE PLATFORM RAIL HAS FOUR FIXED SLOTS, always in the same order. GeeksforGeeks
//    is empty for 270 of 308 students; a rail that collapsed empty platforms would
//    produce 300 differently-shaped cards and nothing would line up down a column.
//
// 2. ZERO IS THE NORMAL CARD, NOT AN ERROR STATE. Most of this cohort opened their
//    accounts days before the capture, so the majority card shows little or nothing.
//    It gets the same card as everyone else — no dimming, no warning colour — and a
//    plain "Not started" chip. The only distinct treatment is "No profile captured",
//    which is a fact about our data collection rather than about the student.

const SIZE_OPTIONS = PAGE_SIZES.map((n) => ({ key: n, label: String(n) }));

function statusOf(student) {
    if (!student.dataCaptured) return { key: 'none', label: 'No profile', tone: 'ghost' };
    if (!student.platformsTouched) return { key: 'quiet', label: 'Not started', tone: 'warn' };
    if (student.tier === 'podium' || student.tier === 'top10') return { key: 'top', label: 'Top 10', tone: 'coral' };
    return { key: 'active', label: 'Active', tone: 'green' };
}

export default function Directory({
    title = 'Student Directory',
    subtitle = 'Complete list of students with their coding profiles and progress',
    students,
    total,
    page,
    pages,
    pageSize,
    onPage,
    onPageSize,
    showAll = false,
    loading = false,
    onSelect,
    selectedRollKey
}) {
    const count = Number.isFinite(total) ? total : students.length;
    const pageCount = Math.max(1, pages || 1);
    const current = Math.min(Math.max(1, page || 1), pageCount);
    const start = showAll ? 1 : (current - 1) * pageSize + 1;
    const end = showAll ? count : Math.min(count, start + students.length - 1);
    const paged = !showAll && count > 0;

    return (
        <section className="cp-dir" aria-labelledby="cp-dir-title">
            <header className="cp-dir__head">
                <span className="cp-dir__icon" aria-hidden="true">
                    <IconPeople width="22" height="22" />
                </span>
                <div className="cp-dir__titles">
                    {/* Focusable so closing the detail panel has somewhere to land when the
                        student's card is on another page and the opener is gone. */}
                    <h2 id="cp-dir-title" className="cp-dir__title" tabIndex={-1}>
                        {title}
                    </h2>
                    <p className="cp-dir__sub">{subtitle}</p>
                </div>

                {!showAll && (
                    <div className="cp-dir__size">
                        <span className="cp-dir__size-label" id="cp-dir-size-label">
                            Show
                        </span>
                        <Segmented id="cp-dir-size" size="sm" label="Entries per page" value={pageSize} onChange={onPageSize} options={SIZE_OPTIONS} />
                        <span className="cp-dir__size-label">entries</span>
                    </div>
                )}
            </header>

            {!students.length ? (
                <p className="cp-dir__empty">{loading ? 'Loading students…' : 'No students match the current filters.'}</p>
            ) : (
                <ul className={`cp-grid${loading ? ' is-loading' : ''}`} role="list" aria-busy={loading}>
                    {students.map((student) => (
                        <StudentCard
                            key={student.rollKey}
                            student={student}
                            onSelect={onSelect}
                            isSelected={student.rollKey === selectedRollKey}
                        />
                    ))}
                </ul>
            )}

            {paged && (
                <footer className="cp-dir__foot">
                    <span className="cp-dir__count" aria-live="polite">
                        Showing <strong>{formatNumber(start)}–{formatNumber(end)}</strong> of {formatNumber(count)} student{count === 1 ? '' : 's'}
                    </span>
                    {pageCount > 1 && (
                        <nav className="cp-dir__pager" aria-label="Directory pages">
                            <button
                                type="button"
                                className="cp-dir__pagebtn"
                                onClick={() => onPage(current - 1)}
                                disabled={current <= 1 || loading}
                                aria-label="Previous page"
                            >
                                <IconChevronLeft />
                            </button>
                            <span className="cp-dir__pagenum">
                                Page {current} / {pageCount}
                            </span>
                            <button
                                type="button"
                                className="cp-dir__pagebtn"
                                onClick={() => onPage(current + 1)}
                                disabled={current >= pageCount || loading}
                                aria-label="Next page"
                            >
                                <IconChevronRight />
                            </button>
                        </nav>
                    )}
                </footer>
            )}
        </section>
    );
}

function StudentCard({ student, onSelect, isSelected }) {
    const status = statusOf(student);
    const uncaptured = !student.dataCaptured;

    return (
        <li className="cp-grid__item">
            <button
                type="button"
                id={`cp-card-${student.rollKey}`}
                className={[
                    'cp-card',
                    uncaptured && 'cp-card--uncaptured',
                    isSelected && 'is-selected'
                ]
                    .filter(Boolean)
                    .join(' ')}
                onClick={() => onSelect?.(student)}
                aria-label={`${student.name}, ${student.rollNo}, ${student.batch}. ${
                    uncaptured
                        ? 'No profile data captured.'
                        : student.rank
                          ? `Rank ${student.rank}, ${student.score} solved in total.`
                          : `${student.score ?? 0} solved in total, not yet ranked.`
                } Open full analytics.`}
            >
                <span className="cp-card__head">
                    <CodingAvatar
                        gender={student.gender}
                        rollKey={student.rollKey}
                        name={student.name}
                        size="sm"
                        monogram={uncaptured}
                    />
                    <span className="cp-card__names">
                        <span className="cp-card__name" title={student.name}>
                            {student.name}
                        </span>
                        <span className="cp-card__meta">
                            {student.rollNo} · {student.branch} · {shortBatch(student.batch)}
                        </span>
                    </span>
                    <span className="cp-card__chev" aria-hidden="true">
                        <IconChevronRight />
                    </span>
                </span>

                <span className="cp-card__mid">
                    <span className={`cp-chip cp-chip--${status.tone}`}>{status.label}</span>
                    <span className="cp-card__score">
                        <span className="cp-card__score-value">
                            {uncaptured || student.score === null ? '—' : formatNumber(student.score)}
                        </span>
                        <span className="cp-card__score-label">
                            {student.rank ? `#${student.rank} · ` : ''}Total solved
                            {typeof student.delta === 'number' && student.delta !== 0 && (
                                <span className={`cp-delta cp-delta--${student.delta > 0 ? 'up' : 'down'}`}>
                                    {student.delta > 0 ? '▲' : '▼'} {Math.abs(student.delta)}
                                </span>
                            )}
                        </span>
                    </span>
                </span>

                {uncaptured ? (
                    <span className="cp-card__notice">No profile data captured in this run — not a count of zero.</span>
                ) : (
                    <>
                        <span className="cp-card__rail" aria-hidden="true">
                            {PLATFORMS.map((p) => {
                                const n = Number(student.metrics?.[p.metricKey]) || 0;
                                return (
                                    <span
                                        key={p.key}
                                        className={`cp-rail-slot${n > 0 ? ' is-active' : ''}`}
                                        style={{ '--cp-slot-accent': p.accent }}
                                        title={`${p.name}: ${n} ${p.unit}`}
                                    >
                                        <PlatformLogo platform={p} size="sm" />
                                        <span className="cp-rail-slot__value">{n}</span>
                                    </span>
                                );
                            })}
                        </span>
                        <span className="cp-sr-only">
                            {PLATFORMS.map((p) => `${p.name}: ${Number(student.metrics?.[p.metricKey]) || 0} ${p.unit}. `).join('')}
                        </span>
                    </>
                )}
            </button>
        </li>
    );
}
