'use client'
import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion';
import { WHATSAPP_COMMUNITY_URL, WHATSAPP_YEAR_GROUPS } from '../../lib/site-config';

// Compact pop-up that opens when a visitor clicks "Join Community". Two tabs:
//   1) Community      → the single official WhatsApp community (all updates)
//   2) Year-wise Groups → batch-specific groups (1st year, 2nd year, …)
// Clicking the blurred backdrop, the ✕, or pressing Esc dismisses it.
const WhatsAppIcon = ({ size = 18 }) => (
    <svg viewBox="0 0 24 24" width={size} height={size} fill="currentColor" aria-hidden="true">
        <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
    </svg>
);

const WhatsAppCommunityModal = ({ isOpen, onClose }) => {
    const reduceMotion = useReducedMotion();
    const [tab, setTab] = useState('community');

    // Esc to close + lock body scroll while the pop-up is open.
    useEffect(() => {
        if (!isOpen) return undefined;
        setTab('community'); // always land on the Community tab on open
        const onKey = (e) => { if (e.key === 'Escape') onClose(); };
        document.addEventListener('keydown', onKey);
        const prevOverflow = document.body.style.overflow;
        document.body.style.overflow = 'hidden';
        return () => {
            document.removeEventListener('keydown', onKey);
            document.body.style.overflow = prevOverflow;
        };
    }, [isOpen, onClose]);

    return (
        <AnimatePresence>
            {isOpen && (
                <motion.div
                    className="srkr-wa-overlay"
                    onClick={onClose}
                    role="dialog"
                    aria-modal="true"
                    aria-label="Join our WhatsApp community"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.24, ease: 'easeOut' }}
                >
                    <motion.div
                        className="srkr-wa-dialog"
                        onClick={(e) => e.stopPropagation()}
                        initial={reduceMotion ? { opacity: 0 } : { opacity: 0, scale: 0.94, y: 20 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={reduceMotion ? { opacity: 0 } : { opacity: 0, scale: 0.96, y: 12 }}
                        transition={{ duration: 0.36, ease: [0.16, 1, 0.3, 1] }}
                    >
                        <button
                            type="button"
                            className="srkr-wa-close"
                            onClick={onClose}
                            aria-label="Close"
                        >
                            <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round">
                                <path d="M18 6 6 18M6 6l12 12" />
                            </svg>
                        </button>

                        {/* Header */}
                        <div className="srkr-wa-head">
                            <span className="srkr-wa-head-icon"><WhatsAppIcon size={22} /></span>
                            <div>
                                <h3 className="srkr-wa-title">Join our WhatsApp Community</h3>
                                <p className="srkr-wa-subtitle">Announcements, results & peer discussions — all in one place.</p>
                            </div>
                        </div>

                        {/* Tabs */}
                        <div className="srkr-wa-tabs" role="tablist" aria-label="WhatsApp groups">
                            <button
                                type="button"
                                role="tab"
                                aria-selected={tab === 'community'}
                                className={`srkr-wa-tab ${tab === 'community' ? 'is-active' : ''}`}
                                onClick={() => setTab('community')}
                            >
                                Community
                            </button>
                            <button
                                type="button"
                                role="tab"
                                aria-selected={tab === 'years'}
                                className={`srkr-wa-tab ${tab === 'years' ? 'is-active' : ''}`}
                                onClick={() => setTab('years')}
                            >
                                Year-wise Groups
                            </button>
                        </div>

                        {/* Panels */}
                        <div className="srkr-wa-body">
                            {tab === 'community' ? (
                                <div className="srkr-wa-panel" role="tabpanel">
                                    <p className="srkr-wa-panel-text">
                                        The official community for all program-wide updates — exam
                                        schedules, results and important notices reach you here first.
                                    </p>
                                    <a
                                        href={WHATSAPP_COMMUNITY_URL}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="srkr-wa-cta"
                                    >
                                        <WhatsAppIcon size={18} />
                                        <span>Join Community</span>
                                    </a>
                                </div>
                            ) : (
                                <div className="srkr-wa-panel" role="tabpanel">
                                    <p className="srkr-wa-panel-text">
                                        Prefer batch-specific updates? Join your year&apos;s group below.
                                    </p>
                                    <div className="srkr-wa-groups">
                                        {WHATSAPP_YEAR_GROUPS.map((g) => {
                                            const ready = g.url && g.url !== '#';
                                            return ready ? (
                                                <a
                                                    key={g.id}
                                                    href={g.url}
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    className="srkr-wa-group"
                                                >
                                                    <span className="srkr-wa-group-icon"><WhatsAppIcon size={18} /></span>
                                                    <span className="srkr-wa-group-text">
                                                        <strong>{g.label}</strong>
                                                        <small>{g.year} · Tap to join</small>
                                                    </span>
                                                    <svg className="srkr-wa-group-arrow" viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                                                        <path d="M5 12h14M13 6l6 6-6 6" />
                                                    </svg>
                                                </a>
                                            ) : (
                                                <div key={g.id} className="srkr-wa-group is-disabled" aria-disabled="true">
                                                    <span className="srkr-wa-group-icon"><WhatsAppIcon size={18} /></span>
                                                    <span className="srkr-wa-group-text">
                                                        <strong>{g.label}</strong>
                                                        <small>{g.year} · Link coming soon</small>
                                                    </span>
                                                </div>
                                            );
                                        })}
                                    </div>
                                </div>
                            )}
                        </div>
                    </motion.div>
                </motion.div>
            )}
        </AnimatePresence>
    );
};

export default WhatsAppCommunityModal;
