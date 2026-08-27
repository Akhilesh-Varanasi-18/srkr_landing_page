'use client'
import React, { useState, useEffect } from 'react';
import SrkrHeader from './srkr-header';
import WhoWeAre from './who-we-are';
import Programs from './programs';
import Courses from './courses';
import Team from './team';
import SrkrFooter from './srkr-footer';
import RegistrationModal from './registration-modal';

const SrkrMain = () => {
    const [isRegisterOpen, setIsRegisterOpen] = useState(false);

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

    const handleOpenRegister = () => setIsRegisterOpen(true);
    const handleCloseRegister = () => setIsRegisterOpen(false);

    return (
        <div className="srkr-landing">
            <SrkrHeader onOpenRegister={handleOpenRegister} />
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
        </div>
    );
};

export default SrkrMain;
