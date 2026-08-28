'use client'
import React, { useState, useEffect, useRef } from 'react';
import { WHATSAPP_COMMUNITY_URL } from '../../lib/site-config';

const navItems = [
    { label: 'Who We Are', href: '#who-we-are' },
    { label: 'Programs', href: '#programs' },
    { label: 'Courses', href: '#courses' },
    { label: 'Our Team', href: '#team' },
    { label: 'Contact Us', href: '#contact' },
];

const SrkrHeader = ({ onOpenRegister }) => {
    const [isScrolled, setIsScrolled] = useState(false);
    const [mobileOpen, setMobileOpen] = useState(false);
    const [activeSection, setActiveSection] = useState('');
    const isAutoScrolling = useRef(false);
    const scrollUnlockTimer = useRef(null);

    useEffect(() => {
        const handleScroll = () => {
            setIsScrolled(window.scrollY > 50);

            if (isAutoScrolling.current) return;

            // Detect active section
            const sections = navItems.map(item => item.href.substring(1));
            for (let i = sections.length - 1; i >= 0; i--) {
                const el = document.getElementById(sections[i]);
                if (el && el.getBoundingClientRect().top <= 150) {
                    setActiveSection(sections[i]);
                    break;
                }
            }
        };

        handleScroll();
        window.addEventListener('scroll', handleScroll);
        window.addEventListener('scrollend', handleScroll);
        return () => {
            window.removeEventListener('scroll', handleScroll);
            window.removeEventListener('scrollend', handleScroll);
            window.clearTimeout(scrollUnlockTimer.current);
        };
    }, []);

    const handleNavClick = (e, href) => {
        e.preventDefault();
        setMobileOpen(false);
        setActiveSection(href.substring(1));
        const el = document.querySelector(href);
        if (el) {
            isAutoScrolling.current = true;
            window.clearTimeout(scrollUnlockTimer.current);
            const offset = 72; // header height
            const top = el.getBoundingClientRect().top + window.scrollY - offset;
            window.scrollTo({ top, behavior: 'smooth' });
            scrollUnlockTimer.current = window.setTimeout(() => {
                isAutoScrolling.current = false;
            }, 1200);
        }
    };

    return (
        <>
            <header className="srkr-header" style={isScrolled ? { boxShadow: 'var(--srkr-shadow-hover)' } : {}}>
                <div className="srkr-header-container">
                    <div className="srkr-collab-brand" aria-label="ToriiMinds and SRKR Engineering College collaboration">
                        <a href="/" className="srkr-brand-logo srkr-brand-logo-torii">
                            <img src="/assets/images/srkr/project-images/logo-white.png" alt="ToriiMinds" />
                        </a>
                        <span className="srkr-brand-separator" aria-hidden="true">X</span>
                        <div className="srkr-brand-logo srkr-brand-logo-college">
                            <img src="/assets/images/srkr/project-images/srkr_logo.jpeg" alt="S.R.K.R. Engineering College" />
                        </div>
                    </div>

                    <ul className="srkr-nav">
                        {navItems.map((item) => (
                            <li key={item.href}>
                                <a
                                    href={item.href}
                                    className={activeSection === item.href.substring(1) ? 'active' : ''}
                                    onClick={(e) => handleNavClick(e, item.href)}
                                >
                                    {item.label}
                                </a>
                            </li>
                        ))}
                    </ul>

                    {/* Stays visible in the header at every breakpoint — never
                        collapses into the hamburger menu. */}
                    <div className="srkr-header-actions">
                        <a
                            href={WHATSAPP_COMMUNITY_URL}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="srkr-btn-whatsapp"
                            aria-label="Join Official WhatsApp Community"
                        >
                            <svg viewBox="0 0 24 24" fill="currentColor">
                                <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
                            </svg>
                            <span>Join Community</span>
                        </a>
                        <button 
                            type="button" 
                            className="srkr-btn-login"
                            onClick={() => onOpenRegister && onOpenRegister()}
                        >
                            Register
                        </button>
                    </div>

                    <button
                        className={`srkr-mobile-toggle ${mobileOpen ? 'open' : ''}`}
                        onClick={() => setMobileOpen(!mobileOpen)}
                        aria-label="Toggle menu"
                    >
                        <span></span>
                        <span></span>
                        <span></span>
                    </button>
                </div>
            </header>

            <div className={`srkr-mobile-nav ${mobileOpen ? 'open' : ''}`}>
                <ul>
                    {/* Section links only — Register and Join Community live
                        permanently in the header, so duplicating them here would
                        give the same action two places to live. */}
                    {navItems.map((item) => (
                        <li key={item.href}>
                            <a href={item.href} onClick={(e) => handleNavClick(e, item.href)}>
                                {item.label}
                            </a>
                        </li>
                    ))}
                </ul>
            </div>

            <div className="srkr-header-spacer"></div>
        </>
    );
};

export default SrkrHeader;
