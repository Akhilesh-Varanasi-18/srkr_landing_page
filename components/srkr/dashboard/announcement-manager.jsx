'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { PASSOUT_YEARS, PASSOUT_YEAR_PROGRAM_MAP } from '../../../lib/registration-schema';
import {
    IconMegaphone,
    IconUpload,
    IconImage,
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

const IconDownloadTemplate = () => (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" /><polyline points="7 10 12 15 17 10" /><line x1="12" y1="15" x2="12" y2="3" />
    </svg>
);

export default function AnnouncementManager({ isOpen, onClose }) {
    const [tab, setTab] = useState('create'); // 'create' | 'history'
    const [file, setFile] = useState(null);
    const [previewUrl, setPreviewUrl] = useState('');
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

    const fileInputRef = useRef(null);

    const loadHistory = useCallback(async () => {
        setLoadingHistory(true);
        try {
            const res = await fetch('/api/dashboard/announcements', { cache: 'no-store' });
            const json = await res.json();
            if (json.success) setHistory(json.announcements || []);
        } catch { /* silent — history is secondary to the create flow */ }
        setLoadingHistory(false);
    }, []);

    useEffect(() => {
        if (!isOpen) return;
        setBanner(null);
        loadHistory();
    }, [isOpen, loadHistory]);

    // Reset the create form fully whenever the panel closes.
    useEffect(() => {
        if (isOpen) return;
        setFile(null);
        setPreviewUrl((prev) => { if (prev) URL.revokeObjectURL(prev); return ''; });
        setTier(''); setTitle(''); setNote(''); setErrors({}); setTab('create');
    }, [isOpen]);

    useEffect(() => {
        const onKey = (e) => { if (e.key === 'Escape' && isOpen) onClose(); };
        window.addEventListener('keydown', onKey);
        return () => window.removeEventListener('keydown', onKey);
    }, [isOpen, onClose]);

    if (!isOpen) return null;

    const applyFile = (f) => {
        if (!f) return;
        if (!/^image\//.test(f.type)) { setErrors((p) => ({ ...p, image: 'Please choose an image file (JPG, PNG or WEBP).' })); return; }
        if (f.size > MAX_BYTES) { setErrors((p) => ({ ...p, image: 'Image is too large — please keep it under 8MB.' })); return; }
        setErrors((p) => ({ ...p, image: undefined }));
        setFile(f);
        setPreviewUrl((prev) => { if (prev) URL.revokeObjectURL(prev); return URL.createObjectURL(f); });
    };

    const handleDrop = (e) => {
        e.preventDefault(); setDragOver(false);
        applyFile(e.dataTransfer.files?.[0]);
    };

    const clearImage = () => {
        setFile(null);
        setPreviewUrl((prev) => { if (prev) URL.revokeObjectURL(prev); return ''; });
        if (fileInputRef.current) fileInputRef.current.value = '';
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (submitting) return;

        const nextErrors = {};
        if (!file) nextErrors.image = 'Please upload an announcement image.';
        if (!tier) nextErrors.exclusiveFor = 'Please select which passout-year batch this is for.';
        if (Object.keys(nextErrors).length) { setErrors(nextErrors); return; }

        setSubmitting(true); setBanner(null);
        try {
            const fd = new FormData();
            fd.append('image', file);
            fd.append('exclusiveFor', tier);
            if (title.trim()) fd.append('title', title.trim());
            if (note.trim()) fd.append('note', note.trim());

            const res = await fetch('/api/dashboard/announcements', { method: 'POST', body: fd });
            const json = await res.json().catch(() => null);

            if (!res.ok || !json?.success) {
                if (json?.errors) setErrors(json.errors);
                setBanner({ type: 'error', text: json?.message || 'Could not publish the announcement.' });
                return;
            }

            setBanner({ type: 'success', text: 'Announcement is now live for every visitor.' });
            clearImage(); setTier(''); setTitle(''); setNote('');
            loadHistory();
        } catch {
            setBanner({ type: 'error', text: 'Network error — please check your connection and try again.' });
        } finally {
            setSubmitting(false);
        }
    };

    const runAction = async (id, action) => {
        setBusyId(id);
        try {
            if (action === 'delete') {
                if (!window.confirm('Permanently delete this announcement? This cannot be undone.')) { setBusyId(null); return; }
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
                                {/* Image upload — mandatory */}
                                <div className="ann-field">
                                    <div className="ann-field-label-row">
                                        <label>Announcement Image <span className="req">*</span></label>
                                        <a href="/assets/images/srkr/project-images/announcements/poster-template.png" download className="ann-template-link">
                                            <IconDownloadTemplate /> Download Poster Template
                                        </a>
                                    </div>
                                    <div
                                        className={`ann-dropzone ${dragOver ? 'is-drag' : ''} ${errors.image ? 'has-error' : ''} ${previewUrl ? 'has-image' : ''}`}
                                        onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
                                        onDragLeave={() => setDragOver(false)}
                                        onDrop={handleDrop}
                                        onClick={() => !previewUrl && fileInputRef.current?.click()}
                                    >
                                        <input
                                            ref={fileInputRef} type="file" accept="image/*" hidden
                                            onChange={(e) => applyFile(e.target.files?.[0])}
                                        />
                                        {previewUrl ? (
                                            <>
                                                <img src={previewUrl} alt="Announcement preview" className="ann-dropzone-preview" />
                                                <button type="button" className="ann-dropzone-remove" onClick={(e) => { e.stopPropagation(); clearImage(); }} aria-label="Remove image">
                                                    <IconTrash />
                                                </button>
                                            </>
                                        ) : (
                                            <div className="ann-dropzone-empty">
                                                <span className="ann-dropzone-ic"><IconUpload /></span>
                                                <strong>Drop an image, or click to browse</strong>
                                                <span>Best fit: 1080×1620px (2:3 portrait) · JPG, PNG or WEBP · up to 8MB</span>
                                            </div>
                                        )}
                                    </div>
                                    {errors.image && <span className="ann-error">{errors.image}</span>}
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
                            {loadingHistory ? (
                                <div className="ann-history-empty">Loading…</div>
                            ) : history.length === 0 ? (
                                <div className="ann-history-empty">No announcements yet — create your first one.</div>
                            ) : (
                                history.map((a) => (
                                    <div key={a._id} className={`ann-history-card ${a.isActive ? 'is-live' : ''}`}>
                                        <img src={`/api/announcements/image/${a._id}`} alt="" className="ann-history-thumb" />
                                        <div className="ann-history-info">
                                            <div className="ann-history-top">
                                                <span className="ann-history-tier">{a.exclusiveFor}</span>
                                                {a.isActive && <span className="ann-history-live"><IconCheckCircle /> Live</span>}
                                            </div>
                                            {a.title && <strong className="ann-history-title">{a.title}</strong>}
                                            <span className="ann-history-date">{formatDateTime(a.createdAt)}</span>
                                        </div>
                                        <div className="ann-history-actions">
                                            {!a.isActive && (
                                                <button type="button" className="dash-btn" disabled={busyId === a._id} onClick={() => runAction(a._id, 'activate')}>
                                                    Reactivate
                                                </button>
                                            )}
                                            {a.isActive && (
                                                <button type="button" className="dash-btn" disabled={busyId === a._id} onClick={() => runAction(a._id, 'deactivate')}>
                                                    Take Down
                                                </button>
                                            )}
                                            <button type="button" className="dash-btn dash-btn--ghost ann-history-delete" disabled={busyId === a._id} onClick={() => runAction(a._id, 'delete')} aria-label="Delete">
                                                <IconTrash />
                                            </button>
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
