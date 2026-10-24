'use client';

import { useLayoutEffect, useRef, useState } from 'react';
import { IconLock, IconEye, IconEyeOff } from './dashboard-icons';

export default function LoginGate({ onSuccess, notConfigured }) {
    const [passcode, setPasscode] = useState('');
    const [error, setError] = useState('');
    const [busy, setBusy] = useState(false);
    const [reveal, setReveal] = useState(false);
    const inputRef = useRef(null);
    const caretRef = useRef(null);

    // Switching a field between password and text resets its caret in some
    // browsers; put it back where it was so typing just carries on.
    useLayoutEffect(() => {
        const input = inputRef.current;
        if (!input || caretRef.current === null) return;
        const at = caretRef.current;
        caretRef.current = null;
        try {
            input.setSelectionRange(at, at);
        } catch {
            /* a browser that will not position the caret in a password field */
        }
    }, [reveal]);

    const toggleReveal = () => {
        const input = inputRef.current;
        caretRef.current = input ? input.selectionEnd ?? passcode.length : passcode.length;
        setReveal((v) => !v);
    };

    async function submit(e) {
        e.preventDefault();
        if (!passcode || busy) return;
        setBusy(true);
        setError('');
        try {
            const res = await fetch('/api/admin/login', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ passcode })
            });
            const data = await res.json().catch(() => ({}));
            if (res.ok && data.success) {
                onSuccess();
            } else {
                setError(data.message || 'Incorrect passcode.');
            }
        } catch {
            setError('Network error. Please try again.');
        } finally {
            setBusy(false);
        }
    }

    return (
        <div className="dash-login">
            <div className="dash-login-card">
                <div className="dash-brand-mark">TM</div>
                <h1>Admin Panel</h1>
                <p>ToriiMinds × SRKR · analytics, coding profiles and announcements</p>

                {notConfigured ? (
                    <p className="dash-login-error" style={{ textAlign: 'center' }}>
                        Access is not configured. Set <b>DASHBOARD_PASSCODE</b> in <b>.env.local</b> and restart the server.
                    </p>
                ) : (
                    <form onSubmit={submit}>
                        <label htmlFor="dash-pass">Passcode</label>
                        <div className="dash-pass">
                            <input
                                ref={inputRef}
                                id="dash-pass"
                                type={reveal ? 'text' : 'password'}
                                value={passcode}
                                onChange={(e) => setPasscode(e.target.value)}
                                placeholder="Enter dashboard passcode"
                                autoFocus
                                autoComplete="current-password"
                                autoCapitalize="off"
                                autoCorrect="off"
                                spellCheck={false}
                            />
                            {/* mousedown is swallowed so the click never takes focus off
                                the field — the toggle is still reachable with Tab. */}
                            <button
                                type="button"
                                className={`dash-pass__toggle${reveal ? ' is-on' : ''}`}
                                onMouseDown={(e) => e.preventDefault()}
                                onClick={toggleReveal}
                                aria-label={reveal ? 'Hide passcode' : 'Show passcode'}
                                aria-pressed={reveal}
                                title={reveal ? 'Hide passcode' : 'Show passcode'}
                            >
                                {reveal ? <IconEyeOff /> : <IconEye />}
                            </button>
                        </div>
                        <p className="dash-login-error">{error}</p>
                        <button type="submit" className="dash-btn dash-btn--primary" disabled={busy}>
                            <IconLock /> {busy ? 'Verifying…' : 'Unlock admin panel'}
                        </button>
                    </form>
                )}
            </div>
        </div>
    );
}
