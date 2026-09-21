'use client'
import React, { useState, useEffect } from 'react';
import SrkrHeader from './srkr-header';
import WhoWeAre from './who-we-are';
import Programs from './programs';
import Courses from './courses';
import Team from './team';
import SrkrFooter from './srkr-footer';
import RegistrationModal from './registration-modal';
import AnnouncementModal from './announcement-modal';
import WhatsAppCommunityModal from './whatsapp-community-modal';

const SrkrMain = () => {
    const [isRegisterOpen, setIsRegisterOpen] = useState(false);
    const [isAnnouncementOpen, setIsAnnouncementOpen] = useState(false);
    const [isWhatsAppOpen, setIsWhatsAppOpen] = useState(false);
    // The live announcement now comes from the admin dashboard, not a hardcoded
    // file — null until it's fetched (or if nothing is currently published).
    const [announcement, setAnnouncement] = useState(null);

    // Always land on the hero on load/refresh. Two things are handled here:
    // 1) Disable the browser's scroll restoration so a refresh doesn't drop the
    //    user back to wherever they were (e.g. the footer/contact section).
    // 2) The Courses section renders full-height on the server and then collapses
    //    on mount, shifting lower sections up — resetting to top avoids the page
    //    settling on the wrong section after that shift.
    useEffect(() => {
        if (typeof window !== 'undefined' && 'scrollRestoration' in window.history) {
            window.history.scrollRestoration = 'manual';
        }
        window.scrollTo(0, 0);
    }, []);

    // Fetch whatever announcement is currently live from the admin dashboard.
    // Auto-open it once per visitor per announcement id — dismissing one stores
    // its id, so refreshes/returns don't nag, but a *new* announcement (a new
    // id) always gets shown even if an older one was already dismissed.
    useEffect(() => {
        let cancelled = false;
        (async () => {
            try {
                const res = await fetch('/api/announcements/active', { cache: 'no-store' });
                const json = await res.json();
                if (cancelled || !json?.announcement) return;
                setAnnouncement(json.announcement);

                let seen = null;
                try { seen = window.localStorage.getItem('srkr_announcement_seen'); } catch { /* private mode */ }
                if (seen !== json.announcement.id) {
                    window.setTimeout(() => { if (!cancelled) setIsAnnouncementOpen(true); }, 600);
                }
            } catch { /* no announcement — fail silently, nothing to show */ }
        })();
        return () => { cancelled = true; };
    }, []);

    const handleOpenRegister = () => setIsRegisterOpen(true);
    const handleCloseRegister = () => setIsRegisterOpen(false);

    const handleOpenAnnouncement = () => setIsAnnouncementOpen(true);
    const handleCloseAnnouncement = () => {
        setIsAnnouncementOpen(false);
        try {
            if (announcement) window.localStorage.setItem('srkr_announcement_seen', announcement.id);
        } catch { /* private mode — it'll just re-open next visit */ }
    };

    const handleOpenWhatsApp = () => setIsWhatsAppOpen(true);
    const handleCloseWhatsApp = () => setIsWhatsAppOpen(false);

    // From the announcement pop-up: dismiss it first, then surface the community
    // chooser so the two modals never stack on top of each other.
    const handleJoinCommunityFromAnnouncement = () => {
        handleCloseAnnouncement();
        setIsWhatsAppOpen(true);
    };

    return (
        <div className="srkr-landing">
            <SrkrHeader
                onOpenRegister={handleOpenRegister}
                onOpenAnnouncements={handleOpenAnnouncement}
                onOpenWhatsApp={handleOpenWhatsApp}
                announcementCount={announcement ? 1 : 0}
            />
            <WhoWeAre onOpenRegister={handleOpenRegister} />
            <Programs onOpenRegister={handleOpenRegister} />
            <Courses onOpenRegister={handleOpenRegister} />
            <Team />
            <div id="contact">
                <SrkrFooter />
            </div>

            {/* Student Registration Modal Pop-up */}
            <RegistrationModal
                isOpen={isRegisterOpen}
                onClose={handleCloseRegister}
            />

            {/* Announcement Pop-up (auto-opens once; reopen via header bell) */}
            <AnnouncementModal
                isOpen={isAnnouncementOpen}
                onClose={handleCloseAnnouncement}
                onJoinCommunity={handleJoinCommunityFromAnnouncement}
                announcement={announcement}
            />

            {/* WhatsApp community chooser (Community + Year-wise Groups tabs) */}
            <WhatsAppCommunityModal
                isOpen={isWhatsAppOpen}
                onClose={handleCloseWhatsApp}
            />
        </div>
    );
};

export default SrkrMain;
