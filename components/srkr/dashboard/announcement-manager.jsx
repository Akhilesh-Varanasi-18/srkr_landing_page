'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { PASSOUT_YEARS, PASSOUT_YEAR_PROGRAM_MAP } from '../../../lib/registration-schema';
import {
    IconMegaphone,
    IconUpload,
    IconTrash,
    IconCheckCircle,
    IconClose,
    IconAlert
} from './dashboard-icons';
import { formatDateTime } from './dashboard-theme';

// Every passout year the program tracks is a valid "exclusively for" tier —
// derived from the same map the registration form uses, so the dropdown can
// never drift out of sync with what students actually register under.
const TIER_OPTIONS = PASSOUT_YEARS.map((y) => ({
    value: `${y} Passouts`,
    year: y,
    program: PASSOUT_YEAR_PROGRAM_MAP[y]?.programName || ''
}));

const MAX_BYTES = 8 * 1024 * 1024;

// A poster that reads well on a laptop gets letterboxed down to something
// unreadable on a phone, so an announcement carries two artworks at two aspect
// ratios. Each slot ships its own download template cut to that exact ratio.
const POSTER_SLOTS = [
    {
        key: 'web',
        field: 'image',
        tab: 'Web & Tablet',
        label: 'Web & Tablet Poster',
        required: true,
        ratio: '2:3',
        dims: '1080 × 1620px',
        blurb: 'Shown on laptops and tablets.',
        template: '/assets/images/srkr/project-images/announcements/poster-template-web.png',
        downloadAs: 'SRKR-announcement-template-web-1080x1620.png'
    },
    {
        key: 'mobile',
        field: 'mobileImage',
        tab: 'Mobile',
        label: 'Mobile Poster',
        required: false,
        ratio: '4:5',
        dims: '1080 × 1350px',
        blurb: 'Optional — phones fall back to the web poster if you skip this.',
        template: '/assets/images/srkr/project-images/announcements/poster-template-mobile.png',
        downloadAs: 'SRKR-announcement-template-mobile-1080x1350.png'
    }
];

const IconDownloadTemplate = () => (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" /><polyline points="7 10 12 15 17 10" /><line x1="12" y1="15" x2="12" y2="3" />
    </svg>
);
const IconMonitor = () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <rect x="2" y="3" width="20" height="14" rx="2" /><path d="M8 21h8M12 17v4" />
    </svg>
);
const IconPhone = () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <rect x="6" y="2" width="12" height="20" rx="2.5" /><path d="M11 18.5h2" />
    </svg>
);
const SLOT_ICONS = { web: IconMonitor, mobile: IconPhone };

/** Build the URL for a stored poster. The mobile one can be swapped in place,
 *  so it carries a version token to defeat the immutable image cache. */
function posterUrl(ann, variant) {
    const base = `/api/announcements/image/${ann._id}`;
    if (variant !== 'mobile') return base;
    const v = ann.mobileVersion || Date.parse(ann.updatedAt || ann.createdAt) || 0;
    return `${base}?variant=mobile&v=${v}`;
}

export default function AnnouncementManager({ isOpen, onClose }) {
    const [tab, setTab] = useState('create'); // 'create' | 'history'
    const [posterTab, setPosterTab] = useState('web'); // which poster slot is being edited

    // One entry per poster slot: { file, previewUrl }.
    const [posters, setPosters] = useState({ web: null, mobile: null });
    const [mobileEnabled, setMobileEnabled] = useState(true);

    const [tier, setTier] = useState('');
    const [title, setTitle] = useState('');
    const [note, setNote] = useState('');
    const [dragOver, setDragOver] = useState(false);
    const [errors, setErrors] = useState({});
    const [submitting, setSubmitting] = useState(false);
    const [banner, setBanner] = useState(null); // { type: 'success'|'error', text }

    const [history, setHistory] = useState([]);
    const [loadingHistory, setLoadingHistory] = useState(false);
    const [busyId, setBusyId] = useState(null);
    const [pendingMobileId, setPendingMobileId] = useState(null);

    const fileInputRef = useRef(null);
    const historyFileRef = useRef(null);
    // Previews are object URLs; keeping them in a ref lets the unmount cleanup
    // revoke whatever is live without re-running on every preview change.
    const previewsRef = useRef({ web: '', mobile: '' });

    const activeSlot = useMemo(() => POSTER_SLOTS.find((s) => s.key === posterTab), [posterTab]);

    const loadHistory = useCallback(async () => {
        setLoadingHistory(true);
        try {
            const res = await fetch('/api/dashboard/announcements', { cache: 'no-store' });
            const json = await res.json();
            if (json.success) setHistory(json.announcements || []);
        } catch { /* silent — history is secondary to the create flow */ }
        setLoadingHistory(false);
    }, []);

    const resetPosters = useCallback(() => {
        Object.values(previewsRef.current).forEach((url) => { if (url) URL.revokeObjectURL(url); });
        previewsRef.current = { web: '', mobile: '' };
        setPosters({ web: null, mobile: null });
        if (fileInputRef.current) fileInputRef.current.value = '';
    }, []);

    useEffect(() => {
        if (!isOpen) return;
        setBanner(null);
        loadHistory();
    }, [isOpen, loadHistory]);

    // Reset the create form fully whenever the panel closes.
    useEffect(() => {
        if (isOpen) return;
        resetPosters();
        setTier(''); setTitle(''); setNote(''); setErrors({});
        setTab('create'); setPosterTab('web'); setMobileEnabled(true);
    }, [isOpen, resetPosters]);

    // Revoke any outstanding object URLs when the component itself goes away.
    useEffect(() => () => {
        Object.values(previewsRef.current).forEach((url) => { if (url) URL.revokeObjectURL(url); });
    }, []);

    useEffect(() => {
        const onKey = (e) => { if (e.key === 'Escape' && isOpen) onClose(); };
        window.addEventListener('keydown', onKey);
        return () => window.removeEventListener('keydown', onKey);
    }, [isOpen, onClose]);

    if (!isOpen) return null;

    /** Validate + stage one file into the given poster slot. */
    const applyFile = (slotKey, f) => {
        const slot = POSTER_SLOTS.find((s) => s.key === slotKey);
        if (!f || !slot) return false;
        if (!/^image\//.test(f.type)) {
            setErrors((p) => ({ ...p, [slot.field]: 'Please choose an image file (JPG, PNG or WEBP).' }));
            return false;
        }
        if (f.size > MAX_BYTES) {
            setErrors((p) => ({ ...p, [slot.field]: 'Image is too large — please keep it under 8MB.' }));
            return false;
        }
        setErrors((p) => ({ ...p, [slot.field]: undefined }));
        const url = URL.createObjectURL(f);
        if (previewsRef.current[slotKey]) URL.revokeObjectURL(previewsRef.current[slotKey]);
        previewsRef.current[slotKey] = url;
        setPosters((p) => ({ ...p, [slotKey]: { file: f, previewUrl: url } }));
        if (slotKey === 'mobile') setMobileEnabled(true);
        return true;
    };

    const clearSlot = (slotKey) => {
        if (previewsRef.current[slotKey]) URL.revokeObjectURL(previewsRef.current[slotKey]);
        previewsRef.current[slotKey] = '';
        setPosters((p) => ({ ...p, [slotKey]: null }));
        if (fileInputRef.current) fileInputRef.current.value = '';
    };

    const handleDrop = (e) => {
        e.preventDefault(); setDragOver(false);
        applyFile(posterTab, e.dataTransfer.files?.[0]);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (submitting) return;

        const nextErrors = {};
        if (!posters.web) nextErrors.image = 'Please upload the web & tablet poster.';
        if (!tier) nextErrors.exclusiveFor = 'Please select which passout-year batch this is for.';
        if (Object.keys(nextErrors).length) {
            setErrors(nextErrors);
            // Surface the offending slot — an error on a hidden tab is invisible.
            if (nextErrors.image) setPosterTab('web');
            return;
        }

        setSubmitting(true); setBanner(null);
        try {
            const fd = new FormData();
            fd.append('image', posters.web.file);
            if (posters.mobile) {
                fd.append('mobileImage', posters.mobile.file);
                fd.append('mobileEnabled', mobileEnabled ? 'true' : 'false');
            }
            fd.append('exclusiveFor', tier);
            if (title.trim()) fd.append('title', title.trim());
            if (note.trim()) fd.append('note', note.trim());

            const res = await fetch('/api/dashboard/announcements', { method: 'POST', body: fd });
            const json = await res.json().catch(() => null);

            if (!res.ok || !json?.success) {
                if (json?.errors) {
                    setErrors(json.errors);
                    if (json.errors.image) setPosterTab('web');
                    else if (json.errors.mobileImage) setPosterTab('mobile');
                }
                setBanner({ type: 'error', text: json?.message || 'Could not publish the announcement.' });
                return;
            }

            setBanner({
                type: 'success',
                text: posters.mobile
                    ? 'Announcement is live — phones get the mobile poster, laptops and tablets get the web one.'
                    : 'Announcement is live for every visitor. Add a mobile poster any time from History.'
            });
            resetPosters(); setTier(''); setTitle(''); setNote('');
            setPosterTab('web'); setMobileEnabled(true);
            loadHistory();
        } catch {
            setBanner({ type: 'error', text: 'Network error — please check your connection and try again.' });
        } finally {
            setSubmitting(false);
        }
    };

    const runAction = async (id, action) => {
        if (action === 'delete' && !window.confirm('Permanently delete this announcement? This cannot be undone.')) return;
        if (action === 'remove-mobile' && !window.confirm('Remove the mobile poster? Phones will fall back to the web & tablet poster.')) return;

        setBusyId(id);
        try {
            if (action === 'delete') {
                await fetch(`/api/dashboard/announcements/${id}`, { method: 'DELETE' });
            } else {
                await fetch(`/api/dashboard/announcements/${id}`, {
                    method: 'PATCH',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ action })
                });
            }
            await loadHistory();
        } finally {
            setBusyId(null);
        }
    };

    /** Attach or replace the mobile poster on an already-published announcement. */
    const uploadMobileFor = async (id, f) => {
        if (!f) return;
        if (!/^image\//.test(f.type) || f.size > MAX_BYTES) {
            setBanner({ type: 'error', text: 'Please choose an image file (JPG, PNG or WEBP) under 8MB.' });
            return;
        }
        setBusyId(id);
        try {
            const fd = new FormData();
            fd.append('mobileImage', f);
            const res = await fetch(`/api/dashboard/announcements/${id}`, { method: 'PATCH', body: fd });
            const json = await res.json().catch(() => null);
            if (!res.ok || !json?.success) {
                setBanner({ type: 'error', text: json?.message || 'Could not save the mobile poster.' });
            }
            await loadHistory();
        } catch {
            setBanner({ type: 'error', text: 'Network error — please try again.' });
        } finally {
            setBusyId(null);
        }
    };

    const pickMobileFor = (id) => {
        setPendingMobileId(id);
        if (historyFileRef.current) {
            historyFileRef.current.value = '';
            historyFileRef.current.click();
        }
    };

    const current = posters[posterTab];
    const slotError = errors[activeSlot.field];

    return (
        <div className="ann-mgr-overlay" onClick={onClose}>
            <div className="ann-mgr-panel" role="dialog" aria-modal="true" aria-label="Manage announcements" onClick={(e) => e.stopPropagation()}>
                <div className="ann-mgr-head">
                    <div className="ann-mgr-head-title">
                        <span className="ann-mgr-head-icon"><IconMegaphone /></span>
                        <div>
                            <h3>Announcements</h3>
                            <p>Create what students see the moment they visit — no code push needed.</p>
                        </div>
                    </div>
                    <button type="button" className="ann-mgr-close" onClick={onClose} aria-label="Close"><IconClose /></button>
                </div>

                <div className="ann-mgr-tabs" role="tablist">
                    <button type="button" role="tab" aria-selected={tab === 'create'} className={tab === 'create' ? 'is-active' : ''} onClick={() => setTab('create')}>New Announcement</button>
                    <button type="button" role="tab" aria-selected={tab === 'history'} className={tab === 'history' ? 'is-active' : ''} onClick={() => setTab('history')}>
                        History{history.length > 0 ? ` (${history.length})` : ''}
                    </button>
                </div>

                <div className="ann-mgr-body">
                    {tab === 'create' ? (
                        <form className="ann-form" onSubmit={handleSubmit} noValidate>
                            {banner && (
                                <div className={`ann-form-banner ${banner.type}`} role="status">
                                    {banner.type === 'success' ? <IconCheckCircle /> : <IconAlert />}
                                    <span>{banner.text}</span>
                                </div>
                            )}

                            <div className="ann-form-grid">
                                {/* Poster uploads — one tab per screen size, each with its
                                    own correctly-proportioned download template. */}
                                <div className="ann-field ann-poster-field">
                                    <label className="ann-poster-heading">Announcement Posters <span className="req">*</span></label>

                                    <div className="ann-poster-tabs" role="tablist" aria-label="Poster size">
                                        {POSTER_SLOTS.map((slot) => {
                                            const Ic = SLOT_ICONS[slot.key];
                                            const filled = Boolean(posters[slot.key]);
                                            const hasError = Boolean(errors[slot.field]);
                                            return (
                                                <button
                                                    key={slot.key}
                                                    type="button"
                                                    role="tab"
                                                    aria-selected={posterTab === slot.key}
                                                    className={`ann-poster-tab ${posterTab === slot.key ? 'is-active' : ''} ${hasError ? 'has-error' : ''}`}
                                                    onClick={() => setPosterTab(slot.key)}
                                                >
                                                    <span className="ann-poster-tab-ic"><Ic /></span>
                                                    <span className="ann-poster-tab-txt">
                                                        <strong>{slot.tab}</strong>
                                                        <small>{slot.ratio} · {slot.required ? 'Required' : 'Optional'}</small>
                                                    </span>
                                                    {/* The ✓ is the only thing in the third column, and only
                                                        once a file is staged — otherwise the label has the
                                                        whole tab to itself and never wraps. */}
                                                    {filled && <span className="ann-poster-tab-state"><IconCheckCircle /></span>}
                                                </button>
                                            );
                                        })}
                                    </div>

                                    <div className="ann-field-label-row">
                                        <label htmlFor="ann-poster-input">
                                            {activeSlot.label} {activeSlot.required ? <span className="req">*</span> : <span className="ann-optional">(optional)</span>}
                                        </label>
                                        <a href={activeSlot.template} download={activeSlot.downloadAs} className="ann-template-link">
                                            <IconDownloadTemplate /> {activeSlot.ratio} Template
                                        </a>
                                    </div>

                                    <div
                                        className={`ann-dropzone is-${activeSlot.key} ${dragOver ? 'is-drag' : ''} ${slotError ? 'has-error' : ''} ${current ? 'has-image' : ''}`}
                                        onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
                                        onDragLeave={() => setDragOver(false)}
                                        onDrop={handleDrop}
                                        onClick={() => !current && fileInputRef.current?.click()}
                                    >
                                        {/* One input, reused by whichever tab is open — its value is
                                            cleared on every open so re-picking the same file still fires. */}
                                        <input
                                            id="ann-poster-input"
                                            ref={fileInputRef} type="file" accept="image/*" hidden
                                            onChange={(e) => applyFile(posterTab, e.target.files?.[0])}
                                        />
                                        {current ? (
                                            <>
                                                <img src={current.previewUrl} alt={`${activeSlot.label} preview`} className="ann-dropzone-preview" />
                                                <button type="button" className="ann-dropzone-remove" onClick={(e) => { e.stopPropagation(); clearSlot(posterTab); }} aria-label={`Remove ${activeSlot.label}`}>
                                                    <IconTrash />
                                                </button>
                                            </>
                                        ) : (
                                            <div className="ann-dropzone-empty">
                                                <span className="ann-dropzone-ic"><IconUpload /></span>
                                                <strong>Drop an image, or click to browse</strong>
                                                <span>{activeSlot.dims} ({activeSlot.ratio}) · JPG, PNG or WEBP · up to 8MB</span>
                                            </div>
                                        )}
                                    </div>

                                    <span className="ann-poster-blurb">{activeSlot.blurb}</span>
                                    {slotError && <span className="ann-error">{slotError}</span>}

                                    {activeSlot.key === 'mobile' && posters.mobile && (
                                        <label className="ann-switch-row">
                                            <button
                                                type="button" role="switch" aria-checked={mobileEnabled}
                                                className={`ann-switch ${mobileEnabled ? 'is-on' : ''}`}
                                                onClick={() => setMobileEnabled((v) => !v)}
                                            >
                                                <span />
                                            </button>
                                            <span>{mobileEnabled ? 'Phones will see this mobile poster' : 'Saved but off — phones will see the web poster'}</span>
                                        </label>
                                    )}
                                </div>

                                {/* Right column — tier + optional text */}
                                <div className="ann-field-stack">
                                    <div className="ann-field">
                                        <label>Exclusively For <span className="req">*</span></label>
                                        <div className="ann-tier-grid">
                                            {TIER_OPTIONS.map((t) => (
                                                <button
                                                    key={t.value}
                                                    type="button"
                                                    className={`ann-tier-chip ${tier === t.value ? 'is-active' : ''}`}
                                                    onClick={() => { setTier(t.value); setErrors((p) => ({ ...p, exclusiveFor: undefined })); }}
                                                >
                                                    <strong>{t.year} Passouts</strong>
                                                    {t.program && <span>{t.program}</span>}
                                                </button>
                                            ))}
                                        </div>
                                        {errors.exclusiveFor && <span className="ann-error">{errors.exclusiveFor}</span>}
                                    </div>

                                    <div className="ann-field">
                                        <label htmlFor="ann-title">Title <span className="ann-optional">(optional)</span></label>
                                        <input id="ann-title" type="text" maxLength={80} placeholder="e.g. Round 2 Offline Assessment"
                                            value={title} onChange={(e) => setTitle(e.target.value)} />
                                    </div>

                                    <div className="ann-field">
                                        <label htmlFor="ann-note">Note <span className="ann-optional">(optional)</span></label>
                                        <textarea id="ann-note" rows={3} maxLength={220} placeholder="A short line shown alongside the image on mobile…"
                                            value={note} onChange={(e) => setNote(e.target.value)} />
                                    </div>
                                </div>
                            </div>

                            <div className="ann-form-footer">
                                <span className="ann-form-hint">Publishing deactivates whatever announcement is currently live — it stays saved in History.</span>
                                <button type="submit" className="dash-btn dash-btn--primary" disabled={submitting}>
                                    {submitting ? 'Publishing…' : 'Publish Announcement'}
                                </button>
                            </div>
                        </form>
                    ) : (
                        <div className="ann-history">
                            {banner && tab === 'history' && (
                                <div className={`ann-form-banner ${banner.type}`} role="status">
                                    {banner.type === 'success' ? <IconCheckCircle /> : <IconAlert />}
                                    <span>{banner.text}</span>
                                </div>
                            )}

                            {loadingHistory ? (
                                <div className="ann-history-empty">Loading…</div>
                            ) : history.length === 0 ? (
                                <div className="ann-history-empty">No announcements yet — create your first one.</div>
                            ) : (
                                history.map((a) => {
                                    const hasMobile = Boolean(a.hasMobile);
                                    const mobileOn = hasMobile && a.mobileEnabled !== false;
                                    const busy = busyId === a._id;
                                    return (
                                        <div key={a._id} className={`ann-history-card ${a.isActive ? 'is-live' : ''}`}>
                                            <div className="ann-history-main">
                                                <div className="ann-history-thumbs">
                                                    <span className="ann-history-thumb-wrap" title="Web & tablet poster">
                                                        <img src={posterUrl(a, 'web')} alt="" className="ann-history-thumb" />
                                                        <em className="ann-history-thumb-tag"><IconMonitor /></em>
                                                    </span>
                                                    {hasMobile && (
                                                        <span className={`ann-history-thumb-wrap ${mobileOn ? '' : 'is-off'}`} title={mobileOn ? 'Mobile poster — live on phones' : 'Mobile poster — currently off'}>
                                                            <img src={posterUrl(a, 'mobile')} alt="" className="ann-history-thumb" />
                                                            <em className="ann-history-thumb-tag"><IconPhone /></em>
                                                        </span>
                                                    )}
                                                </div>

                                                <div className="ann-history-info">
                                                    <div className="ann-history-top">
                                                        <span className="ann-history-tier">{a.exclusiveFor}</span>
                                                        {a.isActive && <span className="ann-history-live"><IconCheckCircle /> Live</span>}
                                                    </div>
                                                    {a.title && <strong className="ann-history-title">{a.title}</strong>}
                                                    <span className="ann-history-date">{formatDateTime(a.createdAt)}</span>
                                                </div>

                                                <div className="ann-history-actions">
                                                    {a.isActive ? (
                                                        <button type="button" className="dash-btn" disabled={busy} onClick={() => runAction(a._id, 'deactivate')}>
                                                            Take Down
                                                        </button>
                                                    ) : (
                                                        <button type="button" className="dash-btn" disabled={busy} onClick={() => runAction(a._id, 'activate')}>
                                                            Reactivate
                                                        </button>
                                                    )}
                                                    <button type="button" className="dash-btn dash-btn--ghost ann-history-delete" disabled={busy} onClick={() => runAction(a._id, 'delete')} aria-label="Delete">
                                                        <IconTrash />
                                                    </button>
                                                </div>
                                            </div>

                                            {/* Mobile-poster strip — upload, swap on/off, replace or remove,
                                                independently of whether the announcement itself is live. */}
                                            <div className="ann-history-mobile">
                                                <span className="ann-history-mobile-label"><IconPhone /> Mobile poster</span>
                                                {hasMobile ? (
                                                    <>
                                                        <button
                                                            type="button" role="switch" aria-checked={mobileOn} disabled={busy}
                                                            className={`ann-switch ${mobileOn ? 'is-on' : ''}`}
                                                            onClick={() => runAction(a._id, mobileOn ? 'disable-mobile' : 'enable-mobile')}
                                                            aria-label={mobileOn ? 'Turn the mobile poster off' : 'Turn the mobile poster on'}
                                                        >
                                                            <span />
                                                        </button>
                                                        <span className="ann-history-mobile-state">
                                                            {mobileOn ? 'On — phones see this poster' : 'Off — phones see the web poster'}
                                                        </span>
                                                        <span className="ann-history-mobile-links">
                                                            <button type="button" className="ann-link-btn" disabled={busy} onClick={() => pickMobileFor(a._id)}>Replace</button>
                                                            <button type="button" className="ann-link-btn is-danger" disabled={busy} onClick={() => runAction(a._id, 'remove-mobile')}>Remove</button>
                                                        </span>
                                                    </>
                                                ) : (
                                                    <>
                                                        <span className="ann-history-mobile-state">Not uploaded — phones see the web poster</span>
                                                        <span className="ann-history-mobile-links">
                                                            <button type="button" className="ann-link-btn" disabled={busy} onClick={() => pickMobileFor(a._id)}>Upload 4:5 poster</button>
                                                        </span>
                                                    </>
                                                )}
                                            </div>
                                        </div>
                                    );
                                })
                            )}

                            {/* Shared picker for the per-card mobile poster uploads. */}
                            <input
                                ref={historyFileRef} type="file" accept="image/*" hidden
                                onChange={(e) => {
                                    const f = e.target.files?.[0];
                                    if (pendingMobileId) uploadMobileFor(pendingMobileId, f);
                                    setPendingMobileId(null);
                                }}
                            />
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
