'use client'
import React from 'react';
import SrkrHeader from './srkr-header';
import WhoWeAre from './who-we-are';
import Programs from './programs';
import Certifications from './certifications';
import Team from './team';
import SrkrFooter from './srkr-footer';

const SrkrMain = () => {
    return (
        <div className="srkr-landing">
            <SrkrHeader />
            <WhoWeAre />
            <Programs />
            <Certifications />
            <Team />
            <div id="contact">
                <SrkrFooter />
            </div>
        </div>
    );
};

export default SrkrMain;
