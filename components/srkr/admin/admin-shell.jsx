'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { usePathname } from 'next/navigation';
import LoginGate from '../dashboard/login-gate';
import AdminRail, { activeModule } from './admin-rail';
import { AdminContext } from './admin-context';
import { useMedia } from '../dashboard/coding/hooks';

// The frame every /admin page renders inside: the passcode gate, the ambient
// glass backdrop, the module rail and the content column. Modules only render once
// the session is known to be valid, and any module that meets a 401 mid-way calls
// `unauthorized()` to drop straight back to the gate.

const NAV_PREF = 'cp-nav';

export default function AdminShell({ children }) {
    const pathname = usePathname();
    const [phase, setPhase] = useState('checking'); // checking | login | ready
    const [notConfigured, setNotConfigured] = useState(false);

    // Navigation rail. `navOpen` is the remembered desktop preference; `drawerOpen`
    // is the tablet overlay, which always starts closed. `navReady` holds the width
    // transition off until the stored preference has been applied, so the rail
    // never animates from its default on first paint.
    const [navOpen, setNavOpen] = useState(true);
    const [drawerOpen, setDrawerOpen] = useState(false);
    const [navReady, setNavReady] = useState(false);
    // Must agree with the stylesheet's tablet rule (max-width: 1024px).
    const overlay = useMedia('(max-width: 1024px)');

    useEffect(() => {
        try {
            const stored = window.localStorage.getItem(NAV_PREF);
            if (stored === '0') setNavOpen(false);
        } catch {
            /* storage unavailable — the rail just starts expanded */
        }
        const id = requestAnimationFrame(() => setNavReady(true));
        (async () => {
            try {
                const res = await fetch('/api/admin/login', { cache: 'no-store' });
                const json = await res.json().catch(() => ({}));
                if (!json.configured) {
                    setNotConfigured(true);
                    setPhase('login');
                } else if (json.authenticated) {
                    setPhase('ready');
                } else {
                    setPhase('login');
                }
            } catch {
                setPhase('login');
            }
        })();
        return () => cancelAnimationFrame(id);
    }, []);

    // Moving to another module closes the tablet drawer.
    useEffect(() => {
        setDrawerOpen(false);
    }, [pathname]);

    const toggleNav = useCallback(
        (next) => {
            if (overlay) {
                setDrawerOpen(next);
                return;
            }
            setNavOpen(next);
            try {
                window.localStorage.setItem(NAV_PREF, next ? '1' : '0');
            } catch {
                /* preference simply is not remembered */
            }
        },
        [overlay]
    );

    const signOut = useCallback(async () => {
        await fetch('/api/admin/login', { method: 'DELETE' }).catch(() => {});
        setPhase('login');
    }, []);

    const unauthorized = useCallback(() => setPhase('login'), []);

    const navExpanded = overlay ? drawerOpen : navOpen;
    const context = useMemo(
        () => ({ signOut, unauthorized, navExpanded, overlay }),
        [signOut, unauthorized, navExpanded, overlay]
    );

    if (phase === 'checking') return <div className="cp-boot">Loading…</div>;
    if (phase === 'login') return <LoginGate notConfigured={notConfigured} onSuccess={() => setPhase('ready')} />;

    const shellClass = ['cp-shell', 'cp-shell--admin', navOpen && !overlay && 'cp-shell--nav-open', navReady && 'is-ready']
        .filter(Boolean)
        .join(' ');

    return (
        <AdminContext.Provider value={context}>
            <div className={shellClass}>
                <AdminRail
                    active={activeModule(pathname)}
                    expanded={navExpanded}
                    onToggle={toggleNav}
                    overlay={overlay}
                    onSignOut={signOut}
                />
                <div className="cp-main">{children}</div>
            </div>
        </AdminContext.Provider>
    );
}
