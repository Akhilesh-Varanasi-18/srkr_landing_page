'use client'
import React, { useState, useEffect, useRef } from 'react';
import {
    BRANCH_GROUPS,
    REGISTRATION_PROGRAMS,
    PROGRAM_BY_KEY,
    DEFAULT_PROGRAM_KEY,
    PREFILLABLE_FIELDS,
    FIELD_LIMITS,
    validateRegistration
} from '../../lib/registration-schema';
import { WHATSAPP_COMMUNITY_URL } from '../../lib/site-config';

// Shared props for the clean line-icon set
const ico = { viewBox: '0 0 24 24', fill: 'none', stroke: 'currentColor', strokeWidth: 1.9, strokeLinecap: 'round', strokeLinejoin: 'round' };

// The WhatsApp glyph, used by both join buttons on the success screen.
const WhatsAppGlyph = ({ size = 18 }) => (
    <svg viewBox="0 0 24 24" fill="currentColor" width={size} height={size} aria-hidden="true">
        <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
    </svg>
);

const GENDER_OPTIONS = [
    {
        value: 'Male', label: 'Male',
        icon: (<svg {...ico}><circle cx="10" cy="14" r="5" /><path d="M15 9l5-5m0 0h-4m4 0v4" /></svg>)
    },
    {
        value: 'Female', label: 'Female',
        icon: (<svg {...ico}><circle cx="12" cy="8" r="5" /><path d="M12 13v8M9 18h6" /></svg>)
    }
];

const RESIDENCE_OPTIONS = [
    {
        value: 'Hosteler', label: 'Hosteler',
        icon: (<svg {...ico}><path d="M3 21h18M6 21V4h12v17M9.5 8h.01M14.5 8h.01M9.5 12h.01M14.5 12h.01M11 21v-4h2v4" /></svg>)
    },
    {
        value: 'Day Scholar', label: 'Day Scholar',
        icon: (<svg {...ico}><path d="M3 10.5 12 3l9 7.5M5 9.5V21h14V9.5M10 21v-6h4v6" /></svg>)
    }
];

const LAPTOP_OPTIONS = [
    {
        value: 'Yes', label: 'Yes, I have',
        icon: (<svg {...ico}><rect x="3" y="4" width="18" height="12" rx="1.6" /><path d="M2 20h20" /><path d="M9.5 10l2 2 3.5-3.5" /></svg>)
    },
    {
        value: 'No', label: 'No, I don’t',
        icon: (<svg {...ico}><rect x="3" y="4" width="18" height="12" rx="1.6" /><path d="M2 20h20" /><path d="M10 8l4 4M14 8l-4 4" /></svg>)
    }
];

// CRT enrolment question retired per management — options kept (commented) so the
// whole field can be restored in one place if it's ever needed again.
// const CRT_FEE_OPTIONS = [
//     { value: 'Yes', label: 'Yes, enrolled', icon: (<svg {...ico}><circle cx="12" cy="12" r="9" /><path d="M9 12l2 2 4-4" /></svg>) },
//     { value: 'No', label: 'Not yet', icon: (<svg {...ico}><circle cx="12" cy="12" r="9" /><path d="M12 8v4M12 16h.01" /></svg>) }
// ];

const EMPTY_FORM = {
    fullName: '',
    rollNumber: '',
    collegeEmail: '',
    mobileNumber: '',
    branch: '',
    gender: '',
    residenceType: '',
    hasLaptop: '',
    // paidCrtFee: '', // CRT enrolment retired
    programKey: DEFAULT_PROGRAM_KEY,
    cgpa: '',
    activeBacklogs: ''
};

const initialsOf = (name) =>
    String(name || '')
        .split(/\s+/)
        .filter(Boolean)
        .slice(0, 2)
        .map((w) => w[0].toUpperCase())
        .join('') || '?';

const sameValue = (a, b) => String(a ?? '').trim().toLowerCase() === String(b ?? '').trim().toLowerCase();

const formatDay = (iso) => {
    if (!iso) return '';
    const d = new Date(iso);
    return Number.isNaN(d.getTime()) ? '' : d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
};

// Wraps the first occurrence of the typed text in <mark> so a student can see why
// a suggestion matched (a partial roll number, a middle name, …).
const Highlight = ({ text, query }) => {
    const source = String(text || '');
    const q = String(query || '').trim();
    if (!q) return source;
    const at = source.toLowerCase().indexOf(q.toLowerCase());
    if (at < 0) return source;
    return (
        <>
            {source.slice(0, at)}
            <mark>{source.slice(at, at + q.length)}</mark>
            {source.slice(at + q.length)}
        </>
    );
};

// Custom, theme-styled branch dropdown. A native <select> can't be styled (its
// option list is browser-chrome) and picks its own open direction — this renders a
// branded popover listbox with grouped options instead. Closes on outside-click,
// Escape, or selection.
const BranchSelect = ({ groups, value, onChange, error }) => {
    const [open, setOpen] = useState(false);
    const wrapRef = useRef(null);

    useEffect(() => {
        if (!open) return undefined;
        const onDocClick = (e) => {
            if (wrapRef.current && !wrapRef.current.contains(e.target)) setOpen(false);
        };
        const onKey = (e) => { if (e.key === 'Escape') setOpen(false); };
        document.addEventListener('mousedown', onDocClick);
        document.addEventListener('keydown', onKey);
        return () => {
            document.removeEventListener('mousedown', onDocClick);
            document.removeEventListener('keydown', onKey);
        };
    }, [open]);

    return (
        <div ref={wrapRef} className={`srkr-reg-select ${open ? 'is-open' : ''} ${error ? 'has-error' : ''}`}>
            <button
                type="button"
                className="srkr-reg-select-trigger"
                onClick={() => setOpen((o) => !o)}
                aria-haspopup="listbox"
                aria-expanded={open}
            >
                <span className="srkr-reg-select-icon">
                    <svg {...ico}><path d="M3 21h18M5 21V6l7-3 7 3v15" /><path d="M9 9h.01M9 13h.01M15 9h.01M15 13h.01M10 21v-4h4v4" /></svg>
                </span>
                <span className={`srkr-reg-select-value ${value ? '' : 'is-placeholder'}`}>
                    {value || 'Select your branch...'}
                </span>
                <svg className="srkr-reg-select-chevron" viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M6 9l6 6 6-6" />
                </svg>
            </button>

            {open && (
                <div className="srkr-reg-select-menu" role="listbox" aria-label="Engineering branch">
                    {groups.map((group) => (
                        <div className="srkr-reg-select-group" key={group.label}>
                            <div className="srkr-reg-select-group-label">{group.label}</div>
                            {group.options.map((opt) => {
                                const selected = value === opt;
                                return (
                                    <button
                                        type="button"
                                        key={opt}
                                        role="option"
                                        aria-selected={selected}
                                        className={`srkr-reg-select-option ${selected ? 'is-selected' : ''}`}
                                        onClick={() => { onChange(opt); setOpen(false); }}
                                    >
                                        <span>{opt}</span>
                                        {selected && (
                                            <svg viewBox="0 0 16 16" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round">
                                                <polyline points="3 8 6.5 11.5 13 4" />
                                            </svg>
                                        )}
                                    </button>
                                );
                            })}
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};

// Step 1 of a roster-gated intake: a type-ahead over the shortlist. Suggestions
// show name · roll · branch · batch only; picking one fetches the full pre-fill
// record and hands it up through onPick.
const SEARCH_DEBOUNCE_MS = 220;
const MIN_QUERY = 2;

const ShortlistFinder = ({ programKey, onPick }) => {
    const [query, setQuery] = useState('');
    const [matches, setMatches] = useState([]);
    const [status, setStatus] = useState('idle'); // idle | short | loading | ready | empty | error
    const [open, setOpen] = useState(false);
    const [active, setActive] = useState(-1);
    const [picking, setPicking] = useState('');
    const [pickError, setPickError] = useState('');
    const wrapRef = useRef(null);
    const inputRef = useRef(null);
    const requestSeq = useRef(0);

    // Debounced search — only the latest request may update the list.
    useEffect(() => {
        const q = query.trim();
        if (q.length < MIN_QUERY) {
            requestSeq.current += 1;
            setMatches([]);
            setOpen(false);
            setStatus(q ? 'short' : 'idle');
            return undefined;
        }
        setStatus('loading');
        const id = ++requestSeq.current;
        const timer = setTimeout(async () => {
            try {
                const res = await fetch(
                    `/api/register/lookup?program=${encodeURIComponent(programKey)}&q=${encodeURIComponent(q)}`,
                    { cache: 'no-store' }
                );
                const json = await res.json().catch(() => null);
                if (id !== requestSeq.current) return;
                if (!res.ok || !json?.success) {
                    setMatches([]);
                    setOpen(false);
                    setStatus('error');
                    return;
                }
                setMatches(json.matches);
                setActive(json.matches.length ? 0 : -1);
                setOpen(json.matches.length > 0);
                setStatus(json.matches.length ? 'ready' : 'empty');
            } catch {
                if (id === requestSeq.current) {
                    setMatches([]);
                    setOpen(false);
                    setStatus('error');
                }
            }
        }, SEARCH_DEBOUNCE_MS);
        return () => clearTimeout(timer);
    }, [query, programKey]);

    useEffect(() => {
        if (!open) return undefined;
        const onDocClick = (e) => {
            if (wrapRef.current && !wrapRef.current.contains(e.target)) setOpen(false);
        };
        document.addEventListener('mousedown', onDocClick);
        return () => document.removeEventListener('mousedown', onDocClick);
    }, [open]);

    const pick = async (match) => {
        if (picking) return;
        setPicking(match.rollNo);
        setPickError('');
        setOpen(false);
        try {
            const res = await fetch(
                `/api/register/lookup?program=${encodeURIComponent(programKey)}&roll=${encodeURIComponent(match.rollNo)}`,
                { cache: 'no-store' }
            );
            const json = await res.json().catch(() => null);
            if (!res.ok || !json?.success) {
                setPickError(json?.message || 'We could not load your details. Please try again.');
                return;
            }
            onPick(json);
        } catch {
            setPickError('Network error — please check your connection and try again.');
        } finally {
            setPicking('');
        }
    };

    const onKeyDown = (e) => {
        if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
            if (!matches.length) return;
            e.preventDefault();
            setOpen(true);
            setActive((i) => {
                const n = matches.length;
                return e.key === 'ArrowDown' ? (i + 1) % n : (i - 1 + n) % n;
            });
        } else if (e.key === 'Enter') {
            if (open && active >= 0 && matches[active]) {
                e.preventDefault();
                pick(matches[active]);
            } else {
                e.preventDefault(); // never submits the (not yet unlocked) form
            }
        } else if (e.key === 'Escape') {
            if (open) {
                e.stopPropagation();
                setOpen(false);
            }
        }
    };

    const hints = {
        idle: 'Start typing — your name or roll number will appear below. Pick it and every detail from your SkillUp Coder registration fills in automatically.',
        short: 'Keep typing — at least two characters.',
        loading: 'Searching the shortlist…',
        ready: `${matches.length} match${matches.length === 1 ? '' : 'es'} — pick yourself to auto-fill the form.`,
        empty: 'No match in the shortlist. Try your full roll number, or check the spelling of your name.',
        error: 'We could not search the shortlist right now. Please try again in a moment.'
    };

    return (
        <div className="srkr-reg-finder">
            <div className="srkr-reg-step-head">
                <span className="srkr-reg-step-no">1</span>
                <div>
                    <strong>Find yourself in the SkillUp Coder shortlist</strong>
                    <p>Registrations are open only for the shortlisted students. Search by roll number or name.</p>
                </div>
            </div>

            <div ref={wrapRef} className={`srkr-reg-finder-box ${open ? 'is-open' : ''}`}>
                <div className="srkr-reg-input-wrap">
                    <span className="srkr-reg-input-icon">
                        <svg {...ico}><circle cx="11" cy="11" r="7" /><path d="m20 20-3.5-3.5" /></svg>
                    </span>
                    <input
                        ref={inputRef}
                        type="text"
                        id="shortlistQuery"
                        value={query}
                        onChange={(e) => { setQuery(e.target.value); setPickError(''); }}
                        onFocus={() => { if (matches.length) setOpen(true); }}
                        onKeyDown={onKeyDown}
                        placeholder="Type your roll number or name…"
                        autoComplete="off"
                        autoCapitalize="characters"
                        spellCheck={false}
                        maxLength={60}
                        role="combobox"
                        aria-label="Search the SkillUp Coder shortlist by roll number or name"
                        aria-autocomplete="list"
                        aria-expanded={open}
                        aria-controls="srkr-reg-suggest"
                        aria-activedescendant={open && active >= 0 ? `srkr-reg-suggest-${active}` : undefined}
                        autoFocus
                    />
                    {(status === 'loading' || picking) && <span className="srkr-reg-finder-spinner" aria-hidden="true" />}
                </div>

                <p className={`srkr-reg-finder-hint is-${status}`} aria-live="polite">
                    {status === 'idle' && (
                        <svg {...ico} width="14" height="14" aria-hidden="true"><path d="M12 2a7 7 0 0 0-4 12.7V17h8v-2.3A7 7 0 0 0 12 2Z" /><path d="M9 21h6" /></svg>
                    )}
                    <span>{picking ? 'Loading your details…' : hints[status]}</span>
                </p>

                {open && matches.length > 0 && (
                    <ul id="srkr-reg-suggest" className="srkr-reg-suggest" role="listbox" aria-label="Matching students">
                        {matches.map((m, i) => (
                            <li
                                key={m.rollNo}
                                id={`srkr-reg-suggest-${i}`}
                                role="option"
                                aria-selected={i === active}
                                className={`srkr-reg-suggest-item ${i === active ? 'is-active' : ''}`}
                                onMouseEnter={() => setActive(i)}
                                onMouseDown={(e) => e.preventDefault()}
                                onClick={() => pick(m)}
                            >
                                <span className="srkr-reg-suggest-avatar" aria-hidden="true">{initialsOf(m.name)}</span>
                                <span className="srkr-reg-suggest-main">
                                    <strong><Highlight text={m.name} query={query} /></strong>
                                    <small>
                                        <Highlight text={m.rollNo} query={query.replace(/\s+/g, '')} />
                                        {m.branch ? ` · ${m.branch}` : ''}
                                        {m.batch ? ` · ${m.batch}` : ''}
                                    </small>
                                </span>
                                <svg className="srkr-reg-suggest-go" viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                                    <path d="M5 12h14M13 6l6 6-6 6" />
                                </svg>
                            </li>
                        ))}
                    </ul>
                )}
            </div>

            {pickError && (
                <div className="srkr-reg-alert" role="alert">
                    <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <circle cx="12" cy="12" r="9" /><path d="M12 8v4M12 16h.01" />
                    </svg>
                    <span>{pickError}</span>
                </div>
            )}
        </div>
    );
};

const RegistrationModal = ({ isOpen, onClose, initialProgramKey }) => {
    const [formData, setFormData] = useState(EMPTY_FORM);
    const [errors, setErrors] = useState({});
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isSuccess, setIsSuccess] = useState(false);
    const [regId, setRegId] = useState('');
    const [submitError, setSubmitError] = useState('');
    // Which closed program the user just tried to pick, for the notice.
    const [closedNotice, setClosedNotice] = useState('');
    // The shortlisted student the form was pre-filled for (roster-gated intakes).
    const [identity, setIdentity] = useState(null);

    // Start on the program the caller asked for (the card's "Registrations Open"
    // button) whenever the modal opens; otherwise the first open intake.
    useEffect(() => {
        if (!isOpen) return;
        const key = initialProgramKey && PROGRAM_BY_KEY[initialProgramKey] ? initialProgramKey : DEFAULT_PROGRAM_KEY;
        setFormData((prev) => ({ ...prev, programKey: key }));
    }, [isOpen, initialProgramKey]);

    // Reset transient state when the modal closes. The submitted values are
    // cleared too, so reopening starts a fresh registration rather than showing
    // the previous student's details.
    useEffect(() => {
        if (!isOpen) {
            setIsSuccess(false);
            setErrors({});
            setIsSubmitting(false);
            setSubmitError('');
            setRegId('');
            setClosedNotice('');
            setIdentity(null);
            setFormData(EMPTY_FORM);
        }
    }, [isOpen]);

    if (!isOpen) return null;

    const program = PROGRAM_BY_KEY[formData.programKey] || PROGRAM_BY_KEY[DEFAULT_PROGRAM_KEY];
    const gated = program.eligibility === 'skillup-roster';
    // A gated intake shows only the finder until the student picks themselves.
    const unlocked = !gated || Boolean(identity);
    const blocked = Boolean(identity?.alreadyRegistered);
    const isEdited = (field) => Boolean(identity) && !sameValue(formData[field], identity.snapshot[field]);

    const handleChange = (e) => {
        const { name, value } = e.target;
        // Keep numeric fields honest at the keyboard: the phone field is digits
        // only so the +91 prefix stays accurate; CGPA allows one decimal point;
        // backlogs is a small whole number.
        let nextValue = value;
        if (name === 'mobileNumber') {
            nextValue = value.replace(/[^\d]/g, '').slice(0, 10);
        } else if (name === 'cgpa') {
            const [whole = '', ...rest] = value.replace(/[^\d.]/g, '').split('.');
            nextValue = (rest.length ? `${whole}.${rest.join('')}` : whole).slice(0, FIELD_LIMITS.cgpa);
        } else if (name === 'activeBacklogs') {
            nextValue = value.replace(/[^\d]/g, '').slice(0, FIELD_LIMITS.activeBacklogs);
        }
        setFormData(prev => ({ ...prev, [name]: nextValue }));
        if (errors[name]) setErrors(prev => ({ ...prev, [name]: '' }));
        if (submitError) setSubmitError('');
    };

    const selectValue = (name, value) => {
        setFormData(prev => ({ ...prev, [name]: value }));
        if (errors[name]) setErrors(prev => ({ ...prev, [name]: '' }));
        if (submitError) setSubmitError('');
    };

    // Step 1 done: copy the student's SkillUp details into the form and remember
    // the originals so edits can be reported with the submission.
    const handlePick = (result) => {
        const snapshot = {};
        PREFILLABLE_FIELDS.forEach((field) => { snapshot[field] = result.student[field] || ''; });
        setIdentity({
            rollKey: result.rollKey,
            batch: result.student.batch || '',
            snapshot,
            alreadyRegistered: Boolean(result.alreadyRegistered),
            registeredAt: result.registeredAt || null
        });
        setFormData((prev) => ({ ...prev, ...snapshot, cgpa: '', activeBacklogs: '' }));
        setErrors({});
        setSubmitError('');
    };

    const handleResetIdentity = () => {
        setIdentity(null);
        setErrors({});
        setSubmitError('');
        setFormData((prev) => ({ ...EMPTY_FORM, programKey: prev.programKey }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (isSubmitting || blocked) return;

        // Same rules the API enforces — this is purely for instant feedback.
        const { values, errors: validationErrors } = validateRegistration(formData);
        if (Object.keys(validationErrors).length > 0) {
            setErrors(validationErrors);
            setSubmitError('');
            return;
        }

        setErrors({});
        setSubmitError('');
        setIsSubmitting(true);

        const body = { ...values };
        if (identity) {
            body.prefill = {
                rollKey: identity.rollKey,
                editedFields: PREFILLABLE_FIELDS.filter((field) => !sameValue(values[field], identity.snapshot[field]))
            };
        }

        try {
            const response = await fetch('/api/register', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(body)
            });

            let result = null;
            try {
                result = await response.json();
            } catch {
                result = null;
            }

            if (!response.ok || !result?.success) {
                // Field-level problems (invalid or already registered) go back onto
                // the inputs; anything else becomes a single banner message.
                if (result?.errors && Object.keys(result.errors).length > 0) {
                    setErrors(result.errors);
                    setSubmitError(result.message || 'Please correct the highlighted fields.');
                } else {
                    setSubmitError(result?.message || 'Registration failed. Please try again.');
                }
                return;
            }

            setRegId(result.registrationId);
            setIsSuccess(true);
        } catch (error) {
            setSubmitError('Network error — please check your connection and try again.');
        } finally {
            setIsSubmitting(false);
        }
    };

    const renderSegment = (name, options) => (
        <div className={`srkr-reg-segment ${errors[name] ? 'has-error' : ''}`} role="radiogroup">
            {options.map((opt) => (
                <button
                    key={opt.value}
                    type="button"
                    role="radio"
                    aria-checked={formData[name] === opt.value}
                    className={formData[name] === opt.value ? 'active' : ''}
                    onClick={() => selectValue(name, opt.value)}
                >
                    {opt.icon}
                    <span>{opt.label}</span>
                </button>
            ))}
        </div>
    );

    // "edited" tag next to a label once a pre-filled value has been changed.
    const editedTag = (field) => (isEdited(field) ? <span className="srkr-reg-edited-tag">edited</span> : null);

    return (
        <div className="srkr-reg-modal-overlay" onClick={(e) => e.stopPropagation()}>
            <div
                className="srkr-reg-modal-container"
                role="dialog"
                aria-modal="true"
                aria-labelledby="srkr-reg-title"
                onClick={(e) => e.stopPropagation()}
            >
                <button
                    type="button"
                    className="srkr-reg-modal-close"
                    onClick={onClose}
                    aria-label="Close registration modal"
                >
                    <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round">
                        <path d="M18 6 6 18M6 6l12 12" />
                    </svg>
                </button>

                {!isSuccess ? (
                    <>
                        {/* Header */}
                        <div className="srkr-reg-modal-header">
                            <div className="srkr-reg-header-badge">
                                <svg viewBox="0 0 24 24" width="12" height="12" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                    <path d="M22 10 12 5 2 10l10 5 10-5Z" />
                                    <path d="M6 12v5c0 1 2.7 2.5 6 2.5s6-1.5 6-2.5v-5" />
                                </svg>
                                <span>SRKR × ToriiMinds Student Portal</span>
                            </div>
                            <h2 id="srkr-reg-title">Register for <span>{program.open ? program.programName : 'Torii Programs'}</span></h2>
                            {program.open && <p>{program.audience}{gated ? ' · SkillUp Coder shortlist only' : ''}</p>}
                        </div>

                        {/* Step 1 (roster-gated intakes): find yourself in the shortlist */}
                        {gated && !identity && (
                            <ShortlistFinder programKey={program.key} onPick={handlePick} />
                        )}

                        {gated && identity && (
                            <div className="srkr-reg-picked" role="status">
                                <span className="srkr-reg-picked-avatar" aria-hidden="true">{initialsOf(formData.fullName || identity.snapshot.fullName)}</span>
                                <div className="srkr-reg-picked-main">
                                    <strong>{identity.snapshot.fullName}</strong>
                                    <small>
                                        {identity.snapshot.rollNumber}
                                        {identity.batch ? ` · ${identity.batch}` : ''}
                                        {' · '}
                                        <span className="srkr-reg-picked-ok">
                                            <svg viewBox="0 0 24 24" width="11" height="11" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><polyline points="20 6 9 17 4 12" /></svg>
                                            Shortlisted
                                        </span>
                                    </small>
                                </div>
                                <button type="button" className="srkr-reg-picked-reset" onClick={handleResetIdentity}>
                                    Not you? Search again
                                </button>
                            </div>
                        )}

                        {gated && !identity && (
                            <div className="srkr-reg-locked" aria-live="polite">
                                <svg {...ico} width="18" height="18" aria-hidden="true"><rect x="4" y="10" width="16" height="10" rx="2" /><path d="M8 10V7a4 4 0 0 1 8 0v3" /></svg>
                                <div>
                                    <strong>Your form is ready to auto-fill.</strong>
                                    <span>Pick yourself above and your name, roll number, email, mobile, branch and the rest fill in from your SkillUp registration. You only add your CGPA and active backlogs.</span>
                                </div>
                            </div>
                        )}

                        {blocked && (
                            <div className="srkr-reg-already" role="alert">
                                <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                                    <circle cx="12" cy="12" r="9" /><path d="m9 12 2 2 4-4" />
                                </svg>
                                <div>
                                    <strong>Already registered for {program.programName}</strong>
                                    <span>
                                        This roll number completed its {program.programName} registration
                                        {identity.registeredAt ? ` on ${formatDay(identity.registeredAt)}` : ''}. Nothing more to do — see you in class!
                                        If this wasn’t you, please reach out to the ToriiMinds team.
                                    </span>
                                </div>
                            </div>
                        )}

                        {/* Form — for gated intakes, only after step 1 */}
                        {unlocked && !blocked && (
                        <form onSubmit={handleSubmit} className="srkr-reg-form" noValidate>
                            {identity && (
                                <div className="srkr-reg-prefill-banner" role="status">
                                    <span className="srkr-reg-step-no is-done" aria-hidden="true">2</span>
                                    <div>
                                        <strong>Details filled from your SkillUp Coder registration</strong>
                                        <span>Check them below and edit anything that has changed — edits are saved with your {program.programName} registration. Then add your overall CGPA and active backlogs to confirm.</span>
                                    </div>
                                </div>
                            )}

                            {/* Row 1: Full Name & Roll Number */}
                            <div className="srkr-reg-row-2">
                                <div className="srkr-reg-field">
                                    <label htmlFor="fullName">Student Full Name <span className="required">*</span>{editedTag('fullName')}</label>
                                    <div className="srkr-reg-input-wrap">
                                        <span className="srkr-reg-input-icon">
                                            <svg {...ico}><path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2" /><circle cx="12" cy="7" r="4" /></svg>
                                        </span>
                                        <input
                                            type="text" id="fullName" name="fullName"
                                            placeholder="Enter your full name"
                                            value={formData.fullName} onChange={handleChange}
                                            className={errors.fullName ? 'has-error' : ''}
                                            maxLength={FIELD_LIMITS.fullName}
                                            autoComplete="name"
                                            aria-invalid={errors.fullName ? 'true' : 'false'}
                                        />
                                    </div>
                                    {errors.fullName && <span className="srkr-reg-error">{errors.fullName}</span>}
                                </div>

                                <div className="srkr-reg-field">
                                    <label htmlFor="rollNumber">Roll Number / Reg. ID <span className="required">*</span>{editedTag('rollNumber')}</label>
                                    <div className="srkr-reg-input-wrap">
                                        <span className="srkr-reg-input-icon">
                                            <svg {...ico}><rect x="3" y="4" width="18" height="16" rx="2" /><circle cx="9" cy="10" r="2" /><path d="M15 9h3M15 13h3M7 16h10" /></svg>
                                        </span>
                                        <input
                                            type="text" id="rollNumber" name="rollNumber"
                                            placeholder="Enter roll number"
                                            value={formData.rollNumber} onChange={handleChange}
                                            className={errors.rollNumber ? 'has-error' : ''}
                                            maxLength={FIELD_LIMITS.rollNumber}
                                            autoComplete="off"
                                            aria-invalid={errors.rollNumber ? 'true' : 'false'}
                                        />
                                    </div>
                                    {errors.rollNumber && <span className="srkr-reg-error">{errors.rollNumber}</span>}
                                </div>
                            </div>

                            {/* Row 2: College Email & Mobile Number */}
                            <div className="srkr-reg-row-2">
                                <div className="srkr-reg-field">
                                    <label htmlFor="collegeEmail">College / Institutional Email ID <span className="required">*</span>{editedTag('collegeEmail')}</label>
                                    <div className="srkr-reg-input-wrap">
                                        <span className="srkr-reg-input-icon">
                                            <svg {...ico}><rect x="3" y="5" width="18" height="14" rx="2" /><path d="m3 7 9 6 9-6" /></svg>
                                        </span>
                                        <input
                                            type="email" id="collegeEmail" name="collegeEmail"
                                            placeholder="Enter college email ID"
                                            value={formData.collegeEmail} onChange={handleChange}
                                            className={errors.collegeEmail ? 'has-error' : ''}
                                            maxLength={FIELD_LIMITS.collegeEmail}
                                            autoComplete="email"
                                            aria-invalid={errors.collegeEmail ? 'true' : 'false'}
                                        />
                                    </div>
                                    {errors.collegeEmail && <span className="srkr-reg-error">{errors.collegeEmail}</span>}
                                </div>

                                <div className="srkr-reg-field">
                                    <label htmlFor="mobileNumber">WhatsApp / Mobile Number <span className="required">*</span>{editedTag('mobileNumber')}</label>
                                    <div className="srkr-reg-input-wrap has-prefix">
                                        <span className="srkr-reg-input-prefix">+91</span>
                                        <input
                                            type="tel" id="mobileNumber" name="mobileNumber"
                                            placeholder="9876543210"
                                            value={formData.mobileNumber} onChange={handleChange}
                                            className={errors.mobileNumber ? 'has-error' : ''}
                                            maxLength={FIELD_LIMITS.mobileNumber}
                                            inputMode="numeric"
                                            autoComplete="tel-national"
                                            aria-invalid={errors.mobileNumber ? 'true' : 'false'}
                                        />
                                    </div>
                                    {errors.mobileNumber && <span className="srkr-reg-error">{errors.mobileNumber}</span>}
                                </div>
                            </div>

                            {/* Row 3: Branch */}
                            <div className="srkr-reg-field">
                                <label>Engineering Branch / Department <span className="required">*</span>{editedTag('branch')}</label>
                                <BranchSelect
                                    groups={BRANCH_GROUPS}
                                    value={formData.branch}
                                    onChange={(v) => selectValue('branch', v)}
                                    error={errors.branch}
                                />
                                {errors.branch && <span className="srkr-reg-error">{errors.branch}</span>}
                            </div>

                            {/* Row 4: Gender & Residence Type */}
                            <div className="srkr-reg-row-2">
                                <div className="srkr-reg-field">
                                    <label>Gender <span className="required">*</span>{editedTag('gender')}</label>
                                    {renderSegment('gender', GENDER_OPTIONS)}
                                    {errors.gender && <span className="srkr-reg-error">{errors.gender}</span>}
                                </div>

                                <div className="srkr-reg-field">
                                    <label>Residence <span className="required">*</span>{editedTag('residenceType')}</label>
                                    {renderSegment('residenceType', RESIDENCE_OPTIONS)}
                                    {errors.residenceType && <span className="srkr-reg-error">{errors.residenceType}</span>}
                                </div>
                            </div>

                            {/* Row 5: Laptop availability (CRT enrolment question retired) */}
                            <div className="srkr-reg-field">
                                <label>
                                    Do you have a Laptop? <span className="required">*</span>{editedTag('hasLaptop')}
                                </label>
                                {renderSegment('hasLaptop', LAPTOP_OPTIONS)}
                                {errors.hasLaptop && <span className="srkr-reg-error">{errors.hasLaptop}</span>}
                            </div>

                            {/* Row 6: Program */}
                            <div className="srkr-reg-field">
                                <label>
                                    Program <span className="required">*</span>
                                    <small className="srkr-reg-hint"> (Only open intakes can be selected)</small>
                                </label>
                                <div className="srkr-reg-year-grid">
                                    {REGISTRATION_PROGRAMS.map((p) => {
                                        const isClosed = !p.open;
                                        const isSelected = !isClosed && formData.programKey === p.key;
                                        return (
                                            <button
                                                key={p.key}
                                                type="button"
                                                className={`srkr-reg-year-card ${isSelected ? 'active' : ''} ${isClosed ? 'is-closed' : ''}`}
                                                style={isSelected ? { '--year-accent': p.color } : undefined}
                                                aria-disabled={isClosed}
                                                aria-pressed={isSelected}
                                                onClick={() => {
                                                    if (isClosed) { setClosedNotice(p.key); return; }
                                                    setClosedNotice('');
                                                    selectValue('programKey', p.key);
                                                }}
                                            >
                                                {isClosed
                                                    ? <span className="srkr-reg-year-closed-tag">Closed</span>
                                                    : <span className="srkr-reg-year-open-tag">Open</span>}
                                                <div className="srkr-reg-year-radio">
                                                    <span className={`srkr-radio-dot ${isSelected ? 'checked' : ''}`} />
                                                    <strong>{p.programName}</strong>
                                                </div>
                                                <span className="srkr-reg-year-mapped" style={{ color: isClosed ? undefined : p.color }}>
                                                    {p.audience}
                                                </span>
                                            </button>
                                        );
                                    })}
                                </div>
                                {closedNotice && PROGRAM_BY_KEY[closedNotice] && (
                                    <div className="srkr-reg-closed-notice" role="status" aria-live="polite">
                                        <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                                            <rect x="4" y="10" width="16" height="10" rx="2" />
                                            <path d="M8 10V7a4 4 0 0 1 8 0v3" />
                                        </svg>
                                        <span>
                                            Registrations for <strong>{PROGRAM_BY_KEY[closedNotice].programName}</strong>
                                            {' '}({PROGRAM_BY_KEY[closedNotice].yearLabel}) are now closed.
                                        </span>
                                    </div>
                                )}
                                {errors.programKey && <span className="srkr-reg-error">{errors.programKey}</span>}
                            </div>

                            {/* Row 7: Academic details — mandatory for programs that collect them */}
                            {program.academics && (
                                <div className="srkr-reg-field srkr-reg-academics">
                                    <label>
                                        Academic Details <span className="required">*</span>
                                        <small className="srkr-reg-hint"> (Both fields are mandatory)</small>
                                    </label>
                                    <div className="srkr-reg-row-2">
                                        <div className="srkr-reg-field">
                                            <label htmlFor="cgpa">Overall CGPA <span className="required">*</span></label>
                                            <div className="srkr-reg-input-wrap">
                                                <span className="srkr-reg-input-icon">
                                                    <svg {...ico}><path d="M22 10 12 5 2 10l10 5 10-5Z" /><path d="M6 12v5c0 1 2.7 2.5 6 2.5s6-1.5 6-2.5v-5" /></svg>
                                                </span>
                                                <input
                                                    type="text" id="cgpa" name="cgpa"
                                                    placeholder="e.g. 8.25 (out of 10)"
                                                    value={formData.cgpa} onChange={handleChange}
                                                    className={errors.cgpa ? 'has-error' : ''}
                                                    maxLength={FIELD_LIMITS.cgpa}
                                                    inputMode="decimal"
                                                    autoComplete="off"
                                                    aria-invalid={errors.cgpa ? 'true' : 'false'}
                                                />
                                            </div>
                                            {errors.cgpa && <span className="srkr-reg-error">{errors.cgpa}</span>}
                                        </div>

                                        <div className="srkr-reg-field">
                                            <label htmlFor="activeBacklogs">
                                                Number of active backlogs <span className="required">*</span>
                                                <small className="srkr-reg-hint"> (0 if none)</small>
                                            </label>
                                            <div className="srkr-reg-input-wrap">
                                                <span className="srkr-reg-input-icon">
                                                    <svg {...ico}><path d="M9 11.5 11 13.5l4-4" /><rect x="4" y="4" width="16" height="16" rx="2" /></svg>
                                                </span>
                                                <input
                                                    type="text" id="activeBacklogs" name="activeBacklogs"
                                                    placeholder="0"
                                                    value={formData.activeBacklogs} onChange={handleChange}
                                                    className={errors.activeBacklogs ? 'has-error' : ''}
                                                    maxLength={FIELD_LIMITS.activeBacklogs}
                                                    inputMode="numeric"
                                                    autoComplete="off"
                                                    aria-invalid={errors.activeBacklogs ? 'true' : 'false'}
                                                />
                                            </div>
                                            {errors.activeBacklogs && <span className="srkr-reg-error">{errors.activeBacklogs}</span>}
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* Mapped program live preview */}
                            <div
                                className="srkr-reg-program-preview"
                                style={{ backgroundColor: program.bgColor, borderColor: program.borderColor }}
                            >
                                <div className="srkr-reg-program-preview-header">
                                    <div className="srkr-reg-program-icon-box" style={{ color: program.color }}>
                                        <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round">
                                            <path d="M22 10 12 5 2 10l10 5 10-5Z" />
                                            <path d="M6 12v5c0 1 2.7 2.5 6 2.5s6-1.5 6-2.5v-5" />
                                            <path d="M22 10v6" />
                                        </svg>
                                    </div>
                                    <div className="srkr-reg-program-details">
                                        <div className="srkr-reg-program-tags">
                                            <span className="srkr-reg-tag-badge" style={{ color: program.color }}>{program.badge}</span>
                                            <span className="srkr-reg-tag-year">{program.yearLabel}</span>
                                        </div>
                                        <h4 className="srkr-reg-program-title">
                                            Assigned Program: <strong style={{ color: program.color }}>{program.programName}</strong>
                                        </h4>
                                    </div>
                                </div>
                                <p className="srkr-reg-program-desc">{program.description}</p>
                            </div>

                            {/* Server / network failure message */}
                            {submitError && (
                                <div className="srkr-reg-alert" role="alert">
                                    <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                        <circle cx="12" cy="12" r="9" /><path d="M12 8v4M12 16h.01" />
                                    </svg>
                                    <span>{submitError}</span>
                                </div>
                            )}

                            {/* Submit */}
                            <div className="srkr-reg-submit-wrap">
                                <button type="submit" className="srkr-reg-submit-btn" disabled={isSubmitting}>
                                    {isSubmitting ? (
                                        <>
                                            <span className="srkr-reg-spinner" />
                                            <span>Processing Registration...</span>
                                        </>
                                    ) : (
                                        <>
                                            <span>{identity ? 'Confirm Registration' : 'Complete Registration'}</span>
                                            <svg viewBox="0 0 24 24" width="17" height="17" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                                                <path d="M5 12h14M13 6l6 6-6 6" />
                                            </svg>
                                        </>
                                    )}
                                </button>
                                {identity && (
                                    <span className="srkr-reg-terms-text">
                                        Confirming saves the details exactly as shown above to your {program.programName} registration.
                                    </span>
                                )}
                            </div>
                        </form>
                        )}
                    </>
                ) : (
                    /* SUCCESS STATE */
                    <div className="srkr-reg-success-card">
                        <div className="srkr-reg-success-icon-wrap">
                            <svg className="srkr-reg-success-icon" viewBox="0 0 24 24" width="34" height="34" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                                <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
                                <path d="m9 11 3 3L22 4" />
                            </svg>
                        </div>

                        <h3>Registration Confirmed!</h3>
                        <p className="srkr-reg-success-sub">
                            Welcome aboard, <strong>{formData.fullName}</strong>! You have been successfully registered for the <strong>{program.programName}</strong> track at SRKR.
                        </p>

                        <div className="srkr-reg-id-box">
                            <small>Your Registration ID</small>
                            <strong>{regId}</strong>
                        </div>

                        {/* The program's own group is the one step left, so it sits right
                            under the ID — the loudest thing on the card. */}
                        {program.whatsappGroup && (
                            <div className="srkr-reg-group-cta" role="region" aria-labelledby="srkr-reg-group-title">
                                <p id="srkr-reg-group-title" className="srkr-reg-group-cta__title">One last step</p>
                                <p className="srkr-reg-group-cta__text">
                                    Please join the <strong>{program.whatsappGroup.name}</strong> — the schedule, materials and every
                                    announcement for this track are shared there.
                                </p>
                                <a
                                    href={program.whatsappGroup.url}
                                    target="_blank" rel="noopener noreferrer"
                                    className="srkr-reg-group-cta__btn"
                                >
                                    <WhatsAppGlyph size={20} />
                                    <span>Join {program.whatsappGroup.name}</span>
                                    <svg className="srkr-reg-group-cta__arrow" {...ico} width="18" height="18" aria-hidden="true">
                                        <path d="M5 12h14" />
                                        <path d="m13 6 6 6-6 6" />
                                    </svg>
                                </a>
                            </div>
                        )}

                        <div className="srkr-reg-success-details">
                            <div className="srkr-reg-success-row"><span>Roll Number</span><strong>{formData.rollNumber.toUpperCase()}</strong></div>
                            <div className="srkr-reg-success-row"><span>Branch</span><strong>{formData.branch}</strong></div>
                            <div className="srkr-reg-success-row"><span>Gender</span><strong>{formData.gender}</strong></div>
                            <div className="srkr-reg-success-row"><span>Residence</span><strong>{formData.residenceType}</strong></div>
                            <div className="srkr-reg-success-row"><span>Has Laptop</span><strong>{formData.hasLaptop}</strong></div>
                            {program.academics && <div className="srkr-reg-success-row"><span>Overall CGPA</span><strong>{formData.cgpa}</strong></div>}
                            {program.academics && <div className="srkr-reg-success-row"><span>Active Backlogs</span><strong>{formData.activeBacklogs}</strong></div>}
                            {identity?.batch && <div className="srkr-reg-success-row"><span>SkillUp Batch</span><strong>{identity.batch}</strong></div>}
                            <div className="srkr-reg-success-row"><span>Passout Year</span><strong>{program.passoutYear}</strong></div>
                            <div className="srkr-reg-success-row"><span>Assigned Program</span><strong>{program.programName}</strong></div>
                        </div>

                        <div className="srkr-reg-success-actions">
                            {/* Secondary once a program group is shown above; the main action otherwise. */}
                            <a
                                href={WHATSAPP_COMMUNITY_URL}
                                target="_blank" rel="noopener noreferrer"
                                className={`srkr-btn-whatsapp-join${program.whatsappGroup ? ' srkr-btn-whatsapp-join--ghost' : ''}`}
                            >
                                <WhatsAppGlyph size={18} />
                                <span>Join Official WhatsApp Community</span>
                            </a>

                            <button type="button" className="srkr-btn-done" onClick={onClose}>Done</button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default RegistrationModal;
