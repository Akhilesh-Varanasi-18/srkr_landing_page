'use client';

import { motion, useReducedMotion } from 'framer-motion';

/**
 * A segmented control: one active option, and the highlight SLIDES between
 * options instead of snapping. `id` namespaces the shared-layout animation so two
 * controls on one page never trade highlights.
 *
 * Options: { key, label, count?, title?, icon? }. `tone="brand"` paints the active
 * pill coral (the leaderboard scope); the default is a white pill on a tinted track.
 */
export default function Segmented({ id, value, options, onChange, label, size = 'md', tone = 'light', className = '' }) {
    const reduce = useReducedMotion();

    return (
        <div className={`cp-seg cp-seg--${size} cp-seg--${tone} ${className}`.trim()} role="group" aria-label={label}>
            {options.map((option) => {
                const active = option.key === value;
                return (
                    <button
                        key={option.key}
                        type="button"
                        className={`cp-seg__btn${active ? ' is-active' : ''}`}
                        aria-pressed={active}
                        title={option.title}
                        onClick={() => onChange(option.key)}
                    >
                        {active &&
                            (reduce ? (
                                <span className="cp-seg__pill" aria-hidden="true" />
                            ) : (
                                <motion.span
                                    layoutId={`${id}-pill`}
                                    className="cp-seg__pill"
                                    transition={{ type: 'spring', stiffness: 460, damping: 38 }}
                                    aria-hidden="true"
                                />
                            ))}
                        {option.icon && <span className="cp-seg__icon">{option.icon}</span>}
                        <span className="cp-seg__text">{option.label}</span>
                        {option.count !== undefined && <span className="cp-seg__count">{option.count}</span>}
                    </button>
                );
            })}
        </div>
    );
}
