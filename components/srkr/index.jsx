'use client'
import React, { useState } from 'react';
import SrkrHeader from './srkr-header';
import WhoWeAre from './who-we-are';
import Programs from './programs';
import Courses from './courses';
import Team from './team';
import SrkrFooter from './srkr-footer';
import RegistrationModal from './registration-modal';

const SrkrMain = () => {
    const [isRegisterOpen, setIsRegisterOpen] = useState(false);

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
