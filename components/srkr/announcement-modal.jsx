'use client'
import React, { useEffect } from 'react';
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion';

// Announcement pop-up. Laptop/tablet show the poster as-is (spotlight); phones
// get a readable hybrid — a cropped poster banner + the details as native text.
// Clicking the blurred backdrop, the ✕, or pressing Esc dismisses it.
const AnnouncementModal = ({ isOpen, onClose, onJoinCommunity, announcement }) => {
    const reduceMotion = useReducedMotion();

    // Esc to close + lock body scroll while the pop-up is open.
    useEffect(() => {
        if (!isOpen) return undefined;
        const onKey = (e) => { if (e.key === 'Escape') onClose(); };
        document.addEventListener('keydown', onKey);
        const prevOverflow = document.body.style.overflow;
        document.body.style.overflow = 'hidden';
        return () => {
            document.removeEventListener('keydown', onKey);
            document.body.style.overflow = prevOverflow;
        };
    }, [isOpen, onClose]);

    if (!announcement) return null;
    const a = announcement;

    return (
        <AnimatePresence>
            {isOpen && (
                <motion.div
                    className="srkr-ann-overlay"
                    onClick={onClose}
                    role="dialog"
                    aria-modal="true"
                    aria-label={[a.program, a.title].filter(Boolean).join(' announcement: ') || 'Announcement'}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.28, ease: 'easeOut' }}
                >
                    <motion.div
                        className="srkr-ann-dialog"
                        onClick={(e) => e.stopPropagation()}
                        initial={reduceMotion ? { opacity: 0 } : { opacity: 0, scale: 0.92, y: 24 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={reduceMotion ? { opacity: 0 } : { opacity: 0, scale: 0.95, y: 16 }}
                        transition={{ duration: 0.42, ease: [0.16, 1, 0.3, 1] }}
                    >
                        {a.exclusiveFor && (
                            <div className="srkr-ann-ribbon" role="note">
                                <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                                    <path d="M22 10 12 5 2 10l10 5 10-5Z" />
                                    <path d="M6 12v5c0 1 2.5 2.5 6 2.5s6-1.5 6-2.5v-5" />
                                    <path d="M22 10v5.5" />
                                </svg>
                                <span>Exclusive for <strong>{a.exclusiveFor}</strong></span>
                            </div>
                        )}

                        <button
                            type="button"
                            className="srkr-ann-close"
                            onClick={onClose}
                            aria-label="Close announcement"
                        >
                            <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round">
                                <path d="M18 6 6 18M6 6l12 12" />
                            </svg>
                        </button>

                        {/* Scrollable middle: poster + optional text. Wrapping both together
                            (rather than letting the dialog itself scroll) keeps the close
                            button fixed and means a tall poster on a short phone screen
                            scrolls smoothly instead of getting clipped. */}
                        <div className="srkr-ann-scroll">
                            {/* The poster itself — shown FULL and uncropped at every breakpoint.
                                Admin-uploaded posters vary in aspect ratio, so a fixed crop tuned
                                to one design would cut off content on another; "contain" is the
                                one treatment that's safe for any poster. */}
                            <div className="srkr-ann-poster">
                                <img src={a.image} alt={a.alt || a.title || 'Announcement'} />
                            </div>

                            {/* Optional readable text below the poster — only renders if the
                                announcement actually has any of these fields set. */}
                            {(a.program || a.badge || a.title || a.tagline || a.note || (a.topics?.length > 0) || (a.meta?.length > 0)) && (
                                <div className="srkr-ann-textblock">
                                {(a.program || a.badge) && (
                                    <span className="srkr-ann-eyebrow">
                                        <span className="srkr-ann-eyebrow-dot" />
                                        {[a.program, a.badge].filter(Boolean).join(' · ')}
                                    </span>
                                )}
                                {a.title && <h3 className="srkr-ann-title">{a.title}</h3>}
                                {a.tagline && <p className="srkr-ann-tagline">{a.tagline}</p>}

                                {a.topics && a.topics.length > 0 && (
                                    <>
                                        <span className="srkr-ann-section-label">Exam covers {a.topics.length} topics</span>
                                        <div className="srkr-ann-topics">
                                            {a.topics.map((t, i) => (
                                                <span key={i} className="srkr-ann-topic-chip">
                                                    <span className="srkr-ann-topic-num">{String(i + 1).padStart(2, '0')}</span>
                                                    {t}
                                                </span>
                                            ))}
                                        </div>
                                    </>
                                )}

                                {a.meta && a.meta.length > 0 && (
                                    <div className="srkr-ann-meta">
                                        {a.meta.map((m, i) => (
                                            <div key={i} className="srkr-ann-meta-item">
                                                <span className="srkr-ann-meta-label">{m.label}</span>
                                                <strong className="srkr-ann-meta-value">{m.value}</strong>
                                            </div>
                                        ))}
                                    </div>
                                )}

                                {a.note && <p className="srkr-ann-note">{a.note}</p>}
                                </div>
                            )}
                        </div>

                        {/* Shared action row */}
                        <div className="srkr-ann-actions">
                            <button
                                type="button"
                                className="srkr-ann-btn-primary"
                                onClick={() => (onJoinCommunity ? onJoinCommunity() : onClose())}
                            >
                                <svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor" aria-hidden="true">
                                    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
                                </svg>
                                <span>Join Community for Updates</span>
                            </button>
                            <button type="button" className="srkr-ann-btn-ghost" onClick={onClose}>
                                Got it
                            </button>
                        </div>
                    </motion.div>
                </motion.div>
            )}
        </AnimatePresence>
    );
};

export default AnnouncementModal;
