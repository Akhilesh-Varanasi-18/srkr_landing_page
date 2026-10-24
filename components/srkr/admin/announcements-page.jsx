'use client';

import { useEffect, useState } from 'react';
import AnnouncementManager from '../dashboard/announcement-manager';

// The announcements module as a page: the same create/history manager that used to
// open as a modal from the dashboard, laid into the admin shell. `?tab=history`
// (from the landing card) opens straight onto the published list.

export default function AnnouncementsPage() {
    const [initialTab, setInitialTab] = useState('create');

    useEffect(() => {
        const tab = new URLSearchParams(window.location.search).get('tab');
        if (tab === 'history' || tab === 'create') setInitialTab(tab);
    }, []);

    return (
        <>
            <header className="cp-topbar">
                <div className="cp-topbar__brand">
                    <img
                        className="cp-topbar__logo"
                        src="/assets/images/srkr/project-images/torii-dark-text.svg"
                        alt="ToriiMinds"
                        width="500"
                        height="240"
                    />
                    <div className="cp-topbar__titles">
                        <h1 className="cp-topbar__title">Announcements</h1>
                        <p className="cp-topbar__sub">
                            The pop-up every visitor sees on the home page · one live at a time, older ones kept as history
                        </p>
                    </div>
                </div>
            </header>

            {/* Keyed on the tab so a deep link remounts the manager on the right tab. */}
            <AnnouncementManager key={initialTab} embedded initialTab={initialTab} />
        </>
    );
}
