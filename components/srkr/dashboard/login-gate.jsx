'use client';

import { useState } from 'react';
import { IconLock } from './dashboard-icons';

export default function LoginGate({ onSuccess, notConfigured }) {
    const [passcode, setPasscode] = useState('');
    const [error, setError] = useState('');
    const [busy, setBusy] = useState(false);

    async function submit(e) {
        e.preventDefault();
        if (!passcode || busy) return;
        setBusy(true);
        setError('');
        try {
            const res = await fetch('/api/dashboard/login', {
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
                <h1>Analytics Dashboard</h1>
                <p>Registrations analytics for ToriiMinds × SRKR</p>

                {notConfigured ? (
                    <p className="dash-login-error" style={{ textAlign: 'center' }}>
                        Access is not configured. Set <b>DASHBOARD_PASSCODE</b> in <b>.env.local</b> and restart the server.
                    </p>
                ) : (
                    <form onSubmit={submit}>
                        <label htmlFor="dash-pass">Passcode</label>
                        <input
                            id="dash-pass"
                            type="password"
                            value={passcode}
                            onChange={(e) => setPasscode(e.target.value)}
                            placeholder="Enter dashboard passcode"
                            autoFocus
                            autoComplete="current-password"
                        />
                        <p className="dash-login-error">{error}</p>
                        <button type="submit" className="dash-btn dash-btn--primary" disabled={busy}>
                            <IconLock /> {busy ? 'Verifying…' : 'Unlock dashboard'}
                        </button>
                    </form>
                )}
            </div>
        </div>
    );
}
