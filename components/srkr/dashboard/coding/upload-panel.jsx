'use client';

import { useCallback, useRef, useState } from 'react';
import { formatDateTime } from './coding-theme';

// Upload, in two phases, for both files.
//
// WHY A PREVIEW STEP AT ALL: on this dataset a half-broken scraper run is visually
// indistinguishable from a correct one. Forty students legitimately score zero and
// thirteen columns are legitimately empty, so if the CodeChef scraper dies and
// returns 308 zeros, nothing on the finished page looks wrong. There is no eyeball
// check available — only the parsed comparison against the previous capture. So
// nothing is committed until the admin has seen the numbers.
//
// The two files have genuinely different lifecycles and are kept apart deliberately:
// the roster carries batch/name/gender and changes rarely; the capture carries
// metrics and arrives every bot run. The bot's export will never contain a batch.

const TABS = [
    { key: 'capture', label: 'Coding profiles', hint: 'The bot export (.csv or .xlsx)' },
    { key: 'roster', label: 'Batch roster', hint: 'Batch allocation workbook (.xlsx)' }
];

/** The tabbed forms on their own, inside the upload modal. */
export function UploadForms({ program, onCommitted }) {
    const [tab, setTab] = useState('capture');

    return (
        <div className="cp-uploadforms">
            <div className="cp-tabs" role="tablist">
                {TABS.map((t) => (
                    <button
                        key={t.key}
                        type="button"
                        role="tab"
                        aria-selected={tab === t.key}
                        className={`cp-tabs__tab${tab === t.key ? ' is-active' : ''}`}
                        onClick={() => setTab(t.key)}
                    >
                        <span>{t.label}</span>
                        <small>{t.hint}</small>
                    </button>
                ))}
            </div>

            {tab === 'capture' ? (
                <CaptureUpload program={program} onCommitted={onCommitted} />
            ) : (
                <RosterUpload program={program} onCommitted={onCommitted} />
            )}
        </div>
    );
}

export default function UploadPanel({ program, history, onClose, onCommitted }) {
    return (
        <div className="cp-modal" role="dialog" aria-modal="true" aria-labelledby="cp-upload-title">
            <div className="cp-modal__scrim" onClick={onClose} />
            <div className="cp-modal__panel">
                <header className="cp-modal__head">
                    <h2 id="cp-upload-title">Upload data · {program.name}</h2>
                    <button type="button" className="cp-modal__close" onClick={onClose} aria-label="Close">
                        ×
                    </button>
                </header>
                <UploadForms program={program} onCommitted={onCommitted} />
                {history?.length > 0 && (
                    <div className="cp-modal__history">
                        <SnapshotHistory history={history} />
                    </div>
                )}
            </div>
        </div>
    );
}

/** Shared two-phase form. `endpoint` differs; the dry-run → confirm dance does not. */
function useTwoPhaseUpload(endpoint, program, onCommitted) {
    const [file, setFile] = useState(null);
    const [preview, setPreview] = useState(null);
    const [busy, setBusy] = useState(false);
    const [error, setError] = useState('');
    const [done, setDone] = useState(null);
    const [extra, setExtra] = useState({});

    const send = useCallback(
        async ({ dryRun, params = {} }) => {
            if (!file) return null;
            setBusy(true);
            setError('');
            const query = new URLSearchParams({ ...(dryRun ? { dryRun: '1' } : {}), ...params });
            const body = new FormData();
            body.append('file', file);
            body.append('program', program.code);

            try {
                const res = await fetch(`${endpoint}?${query}`, { method: 'POST', body });
                const json = await res.json().catch(() => ({}));
                if (!res.ok || !json.success) {
                    setError(json.message || 'That upload could not be processed.');
                    if (json.preview) setPreview(json.preview);
                    return null;
                }
                return json;
            } catch (e) {
                setError(e.message || 'Network error.');
                return null;
            } finally {
                setBusy(false);
            }
        },
        [endpoint, file, program.code]
    );

    const check = useCallback(async () => {
        const json = await send({ dryRun: true });
        if (json) setPreview(json.preview);
    }, [send]);

    const commit = useCallback(
        async (params) => {
            const json = await send({ dryRun: false, params });
            if (json) {
                setDone(json);
                onCommitted?.();
            }
        },
        [send, onCommitted]
    );

    const reset = useCallback(() => {
        setFile(null);
        setPreview(null);
        setError('');
        setDone(null);
        setExtra({});
    }, []);

    return { file, setFile, preview, busy, error, done, extra, setExtra, check, commit, reset };
}

function FileField({ accept, file, onPick, disabled }) {
    const ref = useRef(null);
    return (
        <div className="cp-filefield">
            <input
                ref={ref}
                type="file"
                accept={accept}
                disabled={disabled}
                onChange={(e) => onPick(e.target.files?.[0] || null)}
            />
            <button type="button" className="cp-btn cp-btn--ghost" onClick={() => ref.current?.click()} disabled={disabled}>
                Choose file
            </button>
            <span className="cp-filefield__name">{file ? file.name : 'No file selected'}</span>
        </div>
    );
}

export function CaptureUpload({ program, onCommitted }) {
    const u = useTwoPhaseUpload('/api/admin/coding/upload', program, onCommitted);

    if (u.done) {
        return (
            <Success
                title="Snapshot is live"
                lines={[`${u.done.preview.matched} students matched and counted.`]}
                onAgain={u.reset}
            />
        );
    }

    return (
        <div className="cp-upload">
            <FileField accept=".csv,.xlsx,.xls" file={u.file} onPick={u.setFile} disabled={u.busy} />

            {u.error && <p className="cp-alert cp-alert--error">{u.error}</p>}

            {!u.preview ? (
                <button
                    type="button"
                    className="cp-btn cp-btn--primary"
                    disabled={!u.file || u.busy}
                    onClick={u.check}
                >
                    {u.busy ? 'Checking…' : 'Check this file'}
                </button>
            ) : (
                <>
                    <div className="cp-preview">
                        <div className="cp-preview__grid">
                            <PreviewStat label="Rows parsed" value={u.preview.rowsParsed} />
                            <PreviewStat label="Matched to roster" value={u.preview.matched} />
                            <PreviewStat
                                label="Not captured"
                                value={u.preview.notCaptured}
                                tone={u.preview.notCaptured ? 'warn' : null}
                            />
                            <PreviewStat
                                label="Unknown roll numbers"
                                value={u.preview.unknown}
                                tone={u.preview.unknown ? 'warn' : null}
                            />
                        </div>

                        {u.preview.topThree?.length > 0 && (
                            <p className="cp-preview__top">
                                Top three after this capture:{' '}
                                {u.preview.topThree.map((s, i) => (
                                    <span key={s.rollNo}>
                                        {i > 0 && ' · '}
                                        <strong>{s.name}</strong> ({s.score})
                                    </span>
                                ))}
                            </p>
                        )}

                        {u.preview.newlyPopulated?.length > 0 && (
                            <p className="cp-alert cp-alert--good">
                                {u.preview.newlyPopulated.length} column(s) gained data for the first time:{' '}
                                {u.preview.newlyPopulated.join(', ')}. New panels will appear automatically.
                            </p>
                        )}

                        {u.preview.blockers?.map((b) => (
                            <p key={b.code} className="cp-alert cp-alert--error">
                                <strong>Blocked:</strong> {b.message}
                            </p>
                        ))}

                        {u.preview.warnings?.map((w) => (
                            <details key={w.code} className="cp-alert cp-alert--warn">
                                <summary>{w.message}</summary>
                                {w.detail && <p className="cp-alert__detail">{w.detail.join(', ')}</p>}
                            </details>
                        ))}

                        {u.preview.notes?.map((n) => (
                            <p key={n.code} className="cp-alert cp-alert--info">
                                {n.message}
                            </p>
                        ))}
                    </div>

                    <div className="cp-upload__actions">
                        <button type="button" className="cp-btn cp-btn--ghost" onClick={u.reset}>
                            Cancel
                        </button>
                        {u.preview.blockers?.length ? (
                            // A blocked commit stays possible, but only as a deliberate
                            // override — the admin has read why it was stopped.
                            <button
                                type="button"
                                className="cp-btn cp-btn--danger"
                                disabled={u.busy}
                                onClick={() => u.commit({ force: '1' })}
                            >
                                Commit anyway
                            </button>
                        ) : (
                            <button
                                type="button"
                                className="cp-btn cp-btn--primary"
                                disabled={u.busy}
                                onClick={() => u.commit()}
                            >
                                {u.busy ? 'Saving…' : 'Make this the live snapshot'}
                            </button>
                        )}
                    </div>
                </>
            )}
        </div>
    );
}

export function RosterUpload({ program, onCommitted }) {
    const u = useTwoPhaseUpload('/api/admin/coding/roster', program, onCommitted);
    const [prune, setPrune] = useState(false);

    if (u.done) {
        return (
            <Success
                title="Roster updated"
                lines={[
                    `${u.done.result.total} students on the roster.`,
                    u.done.result.pruned ? `${u.done.result.pruned} removed.` : null
                ].filter(Boolean)}
                onAgain={u.reset}
            />
        );
    }

    return (
        <div className="cp-upload">
            <p className="cp-upload__lede">
                The bot export has no batch column and never will. This workbook is where batch, name, gender and
                branch come from — re-uploading it re-buckets every past capture without touching the captures
                themselves.
            </p>

            <FileField accept=".xlsx,.xls" file={u.file} onPick={u.setFile} disabled={u.busy} />

            {u.error && <p className="cp-alert cp-alert--error">{u.error}</p>}

            {!u.preview ? (
                <button
                    type="button"
                    className="cp-btn cp-btn--primary"
                    disabled={!u.file || u.busy}
                    onClick={u.check}
                >
                    {u.busy ? 'Checking…' : 'Check this workbook'}
                </button>
            ) : (
                <>
                    <div className="cp-preview">
                        <p className="cp-preview__sheet">
                            Read from sheet <strong>{u.preview.sheetName}</strong>
                        </p>
                        <div className="cp-preview__grid">
                            <PreviewStat label="Students" value={u.preview.parsed} />
                            <PreviewStat label="Currently stored" value={u.preview.existing} />
                            <PreviewStat label="New" value={u.preview.added} tone={u.preview.added ? 'good' : null} />
                            <PreviewStat
                                label="Missing from file"
                                value={u.preview.removed}
                                tone={u.preview.removed ? 'warn' : null}
                            />
                        </div>

                        <p className="cp-preview__batches">
                            {Object.entries(u.preview.byBatch).map(([batch, n]) => (
                                <span key={batch} className="cp-chip cp-chip--slate">
                                    {batch}: {n}
                                </span>
                            ))}
                        </p>

                        {u.preview.batchChanges?.length > 0 && (
                            <details className="cp-alert cp-alert--info" open>
                                <summary>
                                    {u.preview.batchChanges.length} student(s) change batch
                                </summary>
                                <ul className="cp-alert__list">
                                    {u.preview.batchChanges.slice(0, 12).map((c) => (
                                        <li key={c.rollNo}>
                                            {c.name} ({c.rollNo}): {c.from} → <strong>{c.to}</strong>
                                        </li>
                                    ))}
                                </ul>
                            </details>
                        )}

                        {u.preview.warnings?.map((w) => (
                            <details key={w.code} className="cp-alert cp-alert--warn">
                                <summary>{w.message}</summary>
                                {w.detail && <p className="cp-alert__detail">{w.detail.join(', ')}</p>}
                            </details>
                        ))}

                        {u.preview.removed > 0 && (
                            <label className="cp-check">
                                <input
                                    type="checkbox"
                                    checked={prune}
                                    onChange={(e) => setPrune(e.target.checked)}
                                />
                                Also remove the {u.preview.removed} student(s) absent from this workbook
                            </label>
                        )}
                    </div>

                    <div className="cp-upload__actions">
                        <button type="button" className="cp-btn cp-btn--ghost" onClick={u.reset}>
                            Cancel
                        </button>
                        <button
                            type="button"
                            className="cp-btn cp-btn--primary"
                            disabled={u.busy}
                            onClick={() => u.commit(prune ? { prune: '1' } : {})}
                        >
                            {u.busy ? 'Saving…' : 'Save roster'}
                        </button>
                    </div>
                </>
            )}
        </div>
    );
}

function PreviewStat({ label, value, tone }) {
    return (
        <span className={`cp-pstat${tone ? ` cp-pstat--${tone}` : ''}`}>
            <span className="cp-pstat__value">{value}</span>
            <span className="cp-pstat__label">{label}</span>
        </span>
    );
}

function Success({ title, lines, onAgain }) {
    return (
        <div className="cp-upload cp-upload--done">
            <p className="cp-alert cp-alert--good">
                <strong>{title}.</strong> {lines.join(' ')}
            </p>
            <button type="button" className="cp-btn cp-btn--ghost" onClick={onAgain}>
                Upload another file
            </button>
        </div>
    );
}

export function SnapshotHistory({ history }) {
    if (!history?.length) return null;
    return (
        <details className="cp-history">
            <summary>{history.length} capture(s) on record</summary>
            <ul>
                {history.map((h) => (
                    <li key={h.id}>
                        <span>{h.filename}</span>
                        <span>{formatDateTime(h.uploadedAt)}</span>
                        {h.isCurrent && <span className="cp-chip cp-chip--green">live</span>}
                    </li>
                ))}
            </ul>
        </details>
    );
}
