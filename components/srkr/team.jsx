'use client'
import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion';
import teamData from './team-data';

// Renders a role string in the uppercase pill while preserving the exact casing
// of specific brand terms (e.g. "DevOps") that must not be flattened to all-caps.
const CASE_EXACT_TERMS = ['DevOps'];
function RoleText({ role }) {
    const parts = role.split(new RegExp(`(${CASE_EXACT_TERMS.join('|')})`, 'g'));
    return parts.map((part, i) =>
        CASE_EXACT_TERMS.includes(part)
            ? <span key={i} className="srkr-tt-exact">{part}</span>
            : <React.Fragment key={i}>{part}</React.Fragment>
    );
}

const Team = () => {
    const [currentIndex, setCurrentIndex] = useState(0);
    const [direction, setDirection] = useState(1);
    const [isPaused, setIsPaused] = useState(false);
    const reduceMotion = useReducedMotion();

    const activeMember = teamData[currentIndex];

    const goToNext = useCallback(() => {
        setDirection(1);
        setCurrentIndex((prev) => (prev + 1) % teamData.length);
    }, []);

    const goToPrev = useCallback(() => {
        setDirection(-1);
        setCurrentIndex((prev) => (prev - 1 + teamData.length) % teamData.length);
    }, []);

    const selectMember = (index) => {
        setDirection(index > currentIndex ? 1 : -1);
        setCurrentIndex(index);
    };

    // Auto-advance every 5 seconds if not paused
    useEffect(() => {
        if (isPaused) return undefined;
        const timer = setInterval(() => {
            goToNext();
        }, 5000);
        return () => clearInterval(timer);
    }, [isPaused, goToNext]);

    return (
        <section id="team" className="srkr-team">
            <div className="srkr-team-container">
                {/* Section Title */}
                <div className="srkr-section-title" data-sal="slide-up" data-sal-delay="100" data-sal-duration="800">
                    <h2>Meet the <span>Team</span></h2>
                    <p>
                        Passionate educators and industry practitioners shaping the next generation of engineers 
                        through hands-on mentorship, enterprise platforms, and competitive coding mastery.
                    </p>
                </div>

                {/* Main Spotlight Showcase */}
                <div 
                    className="srkr-team-spotlight-wrapper"
                    onMouseEnter={() => setIsPaused(true)}
                    onMouseLeave={() => setIsPaused(false)}
                    onFocus={() => setIsPaused(true)}
                    onBlur={() => setIsPaused(false)}
                >
                    <div className="srkr-team-spotlight-card">
                        {/* LEFT COLUMN: Cutout Image with Ambient Glow */}
                        <div className="srkr-team-left-visual">
                            {/* Glowing radial ambient backdrop */}
                            <div 
                                className="srkr-team-aura-glow"
                                style={{ background: activeMember.accentColor }}
                                aria-hidden="true"
                            />

                            <div className="srkr-team-image-stage">
                                <AnimatePresence mode="wait" initial={false}>
                                    <motion.div
                                        key={activeMember.id}
                                        className="srkr-team-photo-container"
                                        initial={reduceMotion ? false : { opacity: 0, scale: 0.94, x: direction * -30 }}
                                        animate={{ opacity: 1, scale: 1, x: 0 }}
                                        exit={reduceMotion ? undefined : { opacity: 0, scale: 0.96, x: direction * 30 }}
                                        transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
                                    >
                                        <img 
                                            src={activeMember.photo} 
                                            alt={activeMember.name} 
                                            className="srkr-team-cutout-img"
                                        />
                                    </motion.div>
                                </AnimatePresence>
                            </div>
                        </div>

                        {/* RIGHT COLUMN: Trainer Profile, Highlights & Skill Points */}
                        <div className="srkr-team-right-info">
                            <AnimatePresence mode="wait" initial={false}>
                                <motion.div
                                    key={activeMember.id}
                                    className="srkr-team-info-content"
                                    style={{
                                        '--member-accent': activeMember.accentColor,
                                        '--member-accent-bg': activeMember.accentBg,
                                    }}
                                    initial={reduceMotion ? false : { opacity: 0, y: 18 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    exit={reduceMotion ? undefined : { opacity: 0, y: -18 }}
                                    transition={{ duration: 0.45, ease: [0.16, 1, 0.3, 1] }}
                                >
                                    {/* Name, Role & LinkedIn */}
                                    <div className="srkr-team-identity">
                                        <div className="srkr-team-identity-text">
                                            <h3 className="srkr-team-member-name">{activeMember.name}</h3>
                                            <span className="srkr-team-role-pill"><RoleText role={activeMember.role} /></span>
                                        </div>

                                        <div className="srkr-team-links">
                                            {activeMember.linkedin && (
                                                <a
                                                    href={activeMember.linkedin}
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    className="srkr-team-linkedin-btn"
                                                    aria-label={`Connect with ${activeMember.name} on LinkedIn`}
                                                    title={`${activeMember.name} on LinkedIn`}
                                                >
                                                    <svg viewBox="0 0 24 24" width="19" height="19" fill="currentColor" aria-hidden="true">
                                                        <path d="M19 3a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h14m-.5 15.5v-5.3a3.26 3.26 0 0 0-3.26-3.26c-.85 0-1.84.52-2.28 1.3v-1.11h-2.79v8.37h2.79v-4.93c0-.77.62-1.4 1.39-1.4a1.4 1.4 0 0 1 1.4 1.4v4.93h2.75M6.46 10.9v8.37H9.2V10.9H6.46M7.83 6.64a1.5 1.5 0 0 0-1.5 1.5 1.5 1.5 0 0 0 1.5 1.5 1.5 1.5 0 0 0 1.5-1.5 1.5 1.5 0 0 0-1.5-1.5Z" />
                                                    </svg>
                                                </a>
                                            )}

                                            {activeMember.portfolio && (
                                                <a
                                                    href={activeMember.portfolio}
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    className="srkr-team-portfolio-btn"
                                                    aria-label={`Open ${activeMember.name}'s digital portfolio`}
                                                    title={`${activeMember.name} — Digital Portfolio`}
                                                >
                                                    <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                                                        <circle cx="12" cy="12" r="9" />
                                                        <path d="M3.6 9h16.8M3.6 15h16.8" />
                                                        <path d="M12 3a15 15 0 0 1 0 18M12 3a15 15 0 0 0 0 18" />
                                                    </svg>
                                                    <span>Portfolio</span>
                                                    <svg className="srkr-team-portfolio-arrow" viewBox="0 0 24 24" width="13" height="13" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                                                        <path d="M7 17 17 7M8 7h9v9" />
                                                    </svg>
                                                </a>
                                            )}
                                        </div>
                                    </div>

                                    {/* Tagline */}
                                    <p className="srkr-team-member-tagline">{activeMember.tagline}</p>

                                    {/* Skill Highlights */}
                                    <div className="srkr-team-highlights-box">
                                        <span className="srkr-team-highlights-label">
                                            <svg viewBox="0 0 24 24" width="13" height="13" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                                                <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
                                            </svg>
                                            Key Highlights
                                        </span>
                                        <ul className="srkr-team-points-list">
                                            {activeMember.highlights.map((point, pIdx) => (
                                                <li key={pIdx}>
                                                    <span className="srkr-team-check-icon">
                                                        <svg viewBox="0 0 16 16" width="12" height="12" fill="none" stroke="currentColor" strokeWidth="2.6">
                                                            <polyline points="3 8 6.5 11.5 13 4" />
                                                        </svg>
                                                    </span>
                                                    <span>{point}</span>
                                                </li>
                                            ))}
                                        </ul>
                                    </div>

                                    {/* Skills / Tech Tags */}
                                    {activeMember.tags && (
                                        <div className="srkr-team-tags-row">
                                            {activeMember.tags.map((tag, tIdx) => (
                                                <span key={tIdx} className="srkr-team-tag-pill">
                                                    {tag}
                                                </span>
                                            ))}
                                        </div>
                                    )}
                                </motion.div>
                            </AnimatePresence>

                            {/* BOTTOM CONTROLS & AVATAR THUMBNAIL SELECTOR */}
                            <div className="srkr-team-bottom-controls">
                                {/* Thumbnail Avatars */}
                                <div className="srkr-team-avatars-nav" role="tablist" aria-label="Team members">
                                    {teamData.map((member, idx) => (
                                        <button
                                            key={member.id}
                                            type="button"
                                            role="tab"
                                            aria-selected={idx === currentIndex}
                                            className={`srkr-team-avatar-thumb-btn ${idx === currentIndex ? 'active' : ''}`}
                                            onClick={() => selectMember(idx)}
                                            title={member.name}
                                        >
                                            <img src={member.photo} alt={member.name} />
                                            <span className="srkr-team-avatar-thumb-label">{member.name}</span>
                                        </button>
                                    ))}
                                </div>

                                {/* Arrow Navigation Buttons */}
                                <div className="srkr-team-nav-arrows">
                                    <button 
                                        type="button" 
                                        className="srkr-team-arrow-btn"
                                        onClick={goToPrev}
                                        aria-label="Previous trainer"
                                    >
                                        ‹
                                    </button>
                                    <span className="srkr-team-counter">
                                        0{currentIndex + 1} <small>/ 0{teamData.length}</small>
                                    </span>
                                    <button 
                                        type="button" 
                                        className="srkr-team-arrow-btn"
                                        onClick={goToNext}
                                        aria-label="Next trainer"
                                    >
                                        ›
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </section>
    );
};

export default Team;
