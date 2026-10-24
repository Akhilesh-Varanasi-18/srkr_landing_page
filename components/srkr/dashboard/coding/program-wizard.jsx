'use client';

import { useEffect, useState } from 'react';
import { RosterUpload, CaptureUpload } from './upload-panel';
import { YEAR_LABELS } from '../../../../lib/coding-profiles/programs';

// "New program", in three steps, from the admin panel — no developer needed:
//   1. name it            → the program exists and gets its own tab;
//   2. load the roster    → batch allocation workbook (who is in it, which batch);
//   3. load a capture     → the bot's coding-profile export (the numbers).
// Steps 2 and 3 can be skipped and done later from the program's Upload button;
// the program simply shows its "upload the roster" state until then.

const STEPS = [
    { key: 'about', label: 'About', hint: 'Name the program' },
    { key: 'roster', label: 'Roster', hint: 'Batch workbook' },
    { key: 'capture', label: 'Capture', hint: 'Coding profiles' },
    { key: 'done', label: 'Done', hint: 'Open it' }
];

export default function ProgramWizard({ onClose, onCreated, onFinished }) {
    const [step, setStep] = useState(0);
    const [form, setForm] = useState({ name: '', yearLabel: '', passoutYear: '', tagline: '' });
    const [errors, setErrors] = useState({});
    const [busy, setBusy] = useState(false);
    const [error, setError] = useState('');
    const [program, setProgram] = useState(null);
    const [rosterDone, setRosterDone] = useState(false);
    const [captureDone, setCaptureDone] = useState(false);

    useEffect(() => {
        const onKey = (e) => {
            if (e.key === 'Escape') onClose();
        };
        window.addEventListener('keydown', onKey);
        return () => window.removeEventListener('keydown', onKey);
    }, [onClose]);

    const change = (e) => {
        const { name, value } = e.target;
        setForm((f) => ({ ...f, [name]: name === 'passoutYear' ? value.replace(/[^\d]/g, '').slice(0, 4) : value }));
        if (errors[name]) setErrors((er) => ({ ...er, [name]: '' }));
        if (error) setError('');
    };

    const create = async (e) => {
        e.preventDefault();
        if (busy) return;
        setBusy(true);
        setError('');
        try {
            const res = await fetch('/api/admin/coding/programs', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(form)
            });
            const json = await res.json().catch(() => ({}));
            if (!res.ok || !json.success) {
                if (json.errors) setErrors(json.errors);
                setError(json.message || 'Could not create the program.');
                return;
            }
            setProgram(json.program);
            onCreated?.(json.program);
            setStep(1);
        } catch {
            setError('Network error — please try again.');
        } finally {
            setBusy(false);
        }
    };

    const titleFor = ['New program', `${program?.name || 'Program'} · batch roster`, `${program?.name || 'Program'} · first capture`, 'All set'][step];

    return (
        <div className="cp-modal" role="dialog" aria-modal="true" aria-labelledby="cp-wizard-title">
            <div className="cp-modal__scrim" onClick={onClose} />
            <div className="cp-modal__panel cp-wizard">
                <header className="cp-modal__head">
                    <h2 id="cp-wizard-title">{titleFor}</h2>
                    <button type="button" className="cp-modal__close" onClick={onClose} aria-label="Close">
                        ×
                    </button>
                </header>

                <ol className="cp-wizard__steps" aria-label="Steps">
                    {STEPS.map((s, i) => (
                        <li
                            key={s.key}
                            className={`cp-wizard__step${i === step ? ' is-active' : ''}${i < step ? ' is-done' : ''}`}
                            aria-current={i === step ? 'step' : undefined}
                        >
                            <span className="cp-wizard__no" aria-hidden="true">{i < step ? '✓' : i + 1}</span>
                            <span className="cp-wizard__text">
                                <span className="cp-wizard__label">{s.label}</span>
                                <span className="cp-wizard__hint">{s.hint}</span>
                            </span>
                        </li>
                    ))}
                </ol>

                {step === 0 && (
                    <form className="cp-wizard__body" onSubmit={create} noValidate>
                        <p className="cp-upload__lede">
                            A program gets its own tab, its own roster and its own captures. The name is all that is needed
                            now — the batches come from the roster workbook you upload next.
                        </p>

                        <div className="cp-field">
                            <label htmlFor="pw-name">Program name <span className="cp-field__req">*</span></label>
                            <input
                                id="pw-name"
                                name="name"
                                type="text"
                                value={form.name}
                                onChange={change}
                                placeholder="e.g. Moon Coder"
                                maxLength={60}
                                autoFocus
                                className={errors.name ? 'has-error' : ''}
                                aria-invalid={errors.name ? 'true' : 'false'}
                            />
                            {errors.name && <span className="cp-field__error">{errors.name}</span>}
                        </div>

                        <div className="cp-field__row">
                            <div className="cp-field">
                                <label htmlFor="pw-year">Year <small>(optional)</small></label>
                                <select id="pw-year" name="yearLabel" value={form.yearLabel} onChange={change}>
                                    <option value="">Not set</option>
                                    {YEAR_LABELS.map((y) => (
                                        <option key={y} value={y}>{y}</option>
                                    ))}
                                </select>
                                {errors.yearLabel && <span className="cp-field__error">{errors.yearLabel}</span>}
                            </div>
                            <div className="cp-field">
                                <label htmlFor="pw-passout">Passout year <small>(optional)</small></label>
                                <input
                                    id="pw-passout"
                                    name="passoutYear"
                                    type="text"
                                    inputMode="numeric"
                                    value={form.passoutYear}
                                    onChange={change}
                                    placeholder="e.g. 2029"
                                    className={errors.passoutYear ? 'has-error' : ''}
                                />
                                {errors.passoutYear && <span className="cp-field__error">{errors.passoutYear}</span>}
                            </div>
                        </div>

                        <div className="cp-field">
                            <label htmlFor="pw-tagline">Tagline <small>(optional)</small></label>
                            <input
                                id="pw-tagline"
                                name="tagline"
                                type="text"
                                value={form.tagline}
                                onChange={change}
                                placeholder="One line shown on the program's hero"
                                maxLength={140}
                                className={errors.tagline ? 'has-error' : ''}
                            />
                            {errors.tagline && <span className="cp-field__error">{errors.tagline}</span>}
                        </div>

                        {error && <p className="cp-alert cp-alert--error">{error}</p>}

                        <div className="cp-upload__actions">
                            <button type="button" className="cp-btn cp-btn--ghost" onClick={onClose}>
                                Cancel
                            </button>
                            <button type="submit" className="cp-btn cp-btn--primary" disabled={busy || !form.name.trim()}>
                                {busy ? 'Creating…' : 'Create program'}
                            </button>
                        </div>
                    </form>
                )}

                {step === 1 && program && (
                    <div className="cp-wizard__body">
                        <RosterUpload program={program} onCommitted={() => setRosterDone(true)} />
                        <div className="cp-wizard__nav">
                            <button type="button" className="cp-btn cp-btn--ghost" onClick={() => setStep(2)}>
                                {rosterDone ? 'Next: capture' : 'Skip for now'}
                            </button>
                            {rosterDone && (
                                <button type="button" className="cp-btn cp-btn--primary" onClick={() => setStep(2)}>
                                    Continue
                                </button>
                            )}
                        </div>
                    </div>
                )}

                {step === 2 && program && (
                    <div className="cp-wizard__body">
                        {!rosterDone && (
                            <p className="cp-alert cp-alert--info">
                                The capture joins onto the roster, so without a roster this upload will be refused. You can
                                skip ahead and load both later from the program&apos;s Upload button.
                            </p>
                        )}
                        <CaptureUpload program={program} onCommitted={() => setCaptureDone(true)} />
                        <div className="cp-wizard__nav">
                            <button type="button" className="cp-btn cp-btn--ghost" onClick={() => setStep(3)}>
                                {captureDone ? 'Next' : 'Skip for now'}
                            </button>
                            {captureDone && (
                                <button type="button" className="cp-btn cp-btn--primary" onClick={() => setStep(3)}>
                                    Continue
                                </button>
                            )}
                        </div>
                    </div>
                )}

                {step === 3 && program && (
                    <div className="cp-wizard__body cp-wizard__done">
                        <p className="cp-alert cp-alert--good">
                            <strong>{program.name} is ready.</strong> It has its own tab and counts in “All programs”.
                        </p>
                        <ul className="cp-wizard__summary">
                            <li>
                                <span>Program</span>
                                <strong>{program.name}</strong>
                            </li>
                            <li>
                                <span>Batch roster</span>
                                <strong>{rosterDone ? 'Loaded' : 'Not yet — upload it from the program'}</strong>
                            </li>
                            <li>
                                <span>Coding-profile capture</span>
                                <strong>{captureDone ? 'Live' : 'Not yet — upload it from the program'}</strong>
                            </li>
                        </ul>
                        <div className="cp-upload__actions">
                            <button type="button" className="cp-btn cp-btn--primary" onClick={() => onFinished?.(program)}>
                                Open {program.name}
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
