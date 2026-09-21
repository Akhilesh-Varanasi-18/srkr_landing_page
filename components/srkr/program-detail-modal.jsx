'use client'
import React, { useState, useEffect, useRef, useMemo } from 'react';
import { motion, useReducedMotion } from 'framer-motion';

// ── Line-icon set (replaces the old emoji) ──────────────────────────────
const ic = { fill: 'none', stroke: 'currentColor', strokeWidth: 1.9, strokeLinecap: 'round', strokeLinejoin: 'round' };
const IconBook = () => (<svg viewBox="0 0 24 24" width="16" height="16" {...ic}><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" /><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2Z" /></svg>);
const IconTarget = () => (<svg viewBox="0 0 24 24" width="16" height="16" {...ic}><circle cx="12" cy="12" r="9" /><circle cx="12" cy="12" r="5" /><circle cx="12" cy="12" r="1" /></svg>);
const IconRocket = () => (<svg viewBox="0 0 24 24" width="16" height="16" {...ic}><path d="M4.5 16.5c-1.5 1.26-2 5-2 5s3.74-.5 5-2c.71-.84.7-2.13-.09-2.91a2.18 2.18 0 0 0-2.91 0Z" /><path d="m12 15-3-3a22 22 0 0 1 2-3.95A12.88 12.88 0 0 1 22 2c0 2.72-.78 7.5-6 11a22.35 22.35 0 0 1-4 2Z" /><path d="M9 12H4s.55-3.03 2-4c1.62-1.08 5 0 5 0" /><path d="M12 15v5s3.03-.55 4-2c1.08-1.62 0-5 0-5" /></svg>);
const IconMap = () => (<svg viewBox="0 0 24 24" width="16" height="16" {...ic}><path d="M14.106 5.553a2 2 0 0 0 1.788 0l3.659-1.83A1 1 0 0 1 21 4.619v12.764a1 1 0 0 1-.553.894l-4.553 2.277a2 2 0 0 1-1.788 0l-4.212-2.106a2 2 0 0 0-1.788 0l-3.659 1.83A1 1 0 0 1 3 19.381V6.618a1 1 0 0 1 .553-.894l4.553-2.277a2 2 0 0 1 1.788 0Z" /><path d="M9 4v13M15 7v13" /></svg>);
const IconCheck = () => (<svg viewBox="0 0 24 24" width="14" height="14" {...ic} strokeWidth="2.6"><polyline points="20 6 9 17 4 12" /></svg>);
const IconLayers = () => (<svg viewBox="0 0 24 24" width="18" height="18" {...ic}><path d="m12 2 9 5-9 5-9-5 9-5Z" /><path d="m3 12 9 5 9-5M3 17l9 5 9-5" /></svg>);
const IconHash = () => (<svg viewBox="0 0 24 24" width="18" height="18" {...ic}><path d="M4 9h16M4 15h16M10 3 8 21M16 3l-2 18" /></svg>);
const IconGauge = () => (<svg viewBox="0 0 24 24" width="18" height="18" {...ic}><path d="m12 14 4-4" /><path d="M3.34 19a10 10 0 1 1 17.32 0" /></svg>);
const IconArrow = () => (<svg viewBox="0 0 24 24" width="16" height="16" {...ic} strokeWidth="2.2"><path d="M5 12h14M13 6l6 6-6 6" /></svg>);
const IconFlag = () => (<svg viewBox="0 0 24 24" width="18" height="18" {...ic}><path d="M4 15s1-1 4-1 5 2 8 2 4-1 4-1V3s-1 1-4 1-5-2-8-2-4 1-4 1Z" /><path d="M4 22v-7" /></svg>);
const IconSpark = () => (<svg viewBox="0 0 24 24" width="16" height="16" {...ic}><path d="M12 3v3M12 18v3M3 12h3M18 12h3M5.6 5.6l2.1 2.1M16.3 16.3l2.1 2.1M18.4 5.6l-2.1 2.1M7.7 16.3l-2.1 2.1" /></svg>);

// Coding-themed header icon per program (replaces the old emoji), tinted in our
// palette. Falls back to a generic </> for any unmapped program.
const badgeIc = { fill: 'none', stroke: 'currentColor', strokeWidth: 1.85, strokeLinecap: 'round', strokeLinejoin: 'round' };
const PROGRAM_ICONS = {
    // Bamboo Coder — foundation / C on a terminal
    bamboo: { color: 'var(--srkr-primary)', svg: (<svg viewBox="0 0 24 24" width="27" height="27" {...badgeIc}><rect x="2" y="4" width="20" height="16" rx="2" /><path d="m6 9 3 3-3 3" /><path d="M13 15h4" /></svg>) },
    // SkillUp Coder — DSA / problem solving: code brackets
    skillup: { color: 'var(--srkr-secondary)', svg: (<svg viewBox="0 0 24 24" width="27" height="27" {...badgeIc}><polyline points="16 18 22 12 16 6" /><polyline points="8 6 2 12 8 18" /></svg>) },
    // AI Ready — chip / CPU
    aiready: { color: 'var(--srkr-tertiary)', svg: (<svg viewBox="0 0 24 24" width="27" height="27" {...badgeIc}><rect x="4" y="4" width="16" height="16" rx="2" /><rect x="9" y="9" width="6" height="6" /><path d="M9 1v3M15 1v3M9 20v3M15 20v3M20 9h3M20 14h3M1 9h3M1 14h3" /></svg>) },
    // Owl Coder — advanced CP: braces
    owlcoder: { color: 'var(--srkr-primary)', svg: (<svg viewBox="0 0 24 24" width="27" height="27" {...badgeIc}><path d="M8 3H7a2 2 0 0 0-2 2v5a2 2 0 0 1-2 2 2 2 0 0 1 2 2v5a2 2 0 0 0 2 2h1" /><path d="M16 3h1a2 2 0 0 1 2 2v5a2 2 0 0 0 2 2 2 2 0 0 0-2 2v5a2 2 0 0 1-2 2h-1" /></svg>) },
    // Moon Coder — binary
    mooncoder: { color: 'var(--srkr-secondary)', svg: (<svg viewBox="0 0 24 24" width="27" height="27" {...badgeIc}><rect x="14" y="14" width="4" height="6" rx="1" /><rect x="6" y="4" width="4" height="6" rx="1" /><path d="M6 20h4M14 10h4M6 14h2v6M14 4h2v6" /></svg>) },
};

// Detailed-modules layout: 'blend' = rail + chips + watermark (equal heights),
// 'grid' = vibrant chip cards, 'split' = gradient number-rail panels,
// 'timeline' = numbered roadmap spine. Flip this one value to swap the section.
const MODULES_LAYOUT = 'grid';

// Rotating accent per module card (grid layout) — coral → orange → amber.
const MOD_ACCENTS = [
    { accent: 'var(--srkr-primary)', grad: 'linear-gradient(135deg, #E2544C, #ED7236)', tint: 'var(--srkr-bg-coral-tint)' },
    { accent: 'var(--srkr-secondary)', grad: 'linear-gradient(135deg, #ED7236, #F2A63B)', tint: 'var(--srkr-bg-warm-tint)' },
    { accent: 'var(--srkr-tertiary)', grad: 'linear-gradient(135deg, #F2A63B, #E2544C)', tint: 'var(--srkr-bg-warm-offwhite)' },
];

const ProgramDetailModal = ({
    program,
    isOpen,
    onClose,
    // The "Courses We Offer" section opens a specific course straight into its
    // syllabus (initialView='syllabus'); the "Programs We Offer" section omits
    // these and lands on the course-selection grid (the default two-step flow).
    initialView = 'courses',
    initialCourseIndex = 0,
}) => {
    const reduceMotion = useReducedMotion();
    const [view, setView] = useState(initialView);
    const [selectedCourseIndex, setSelectedCourseIndex] = useState(initialCourseIndex);
    const [activeSection, setActiveSection] = useState('overview');

    const bodyRef = useRef(null);
    const sectionRefs = useRef({});

    // Honor the caller's requested entry point on each open.
    useEffect(() => {
        if (program && isOpen) {
            setView(initialView);
            setSelectedCourseIndex(initialCourseIndex);
            setActiveSection('overview');
        }
    }, [program, isOpen, initialView, initialCourseIndex]);

    // Esc to close.
    useEffect(() => {
        const onKey = (e) => { if (e.key === 'Escape' && isOpen) onClose(); };
        window.addEventListener('keydown', onKey);
        return () => window.removeEventListener('keydown', onKey);
    }, [isOpen, onClose]);

    const currentCourse = program?.courses?.[selectedCourseIndex] || program?.courses?.[0];

    // Sticky-rail sections — built from whatever data the course actually has.
    const sections = useMemo(() => {
        if (!currentCourse) return [];
        return [
            { id: 'overview', label: 'Overview', icon: <IconBook /> },
            currentCourse.outcomes?.length ? { id: 'outcomes', label: 'Outcomes', icon: <IconTarget /> } : null,
            currentCourse.journey?.length ? { id: 'journey', label: 'Practice', icon: <IconRocket /> } : null,
            currentCourse.modules?.length ? { id: 'roadmap', label: 'Roadmap', icon: <IconMap /> } : null,
        ].filter(Boolean);
    }, [currentCourse]);

    // Scroll-spy: highlight the section currently under the sticky rail.
    useEffect(() => {
        if (view !== 'syllabus') return undefined;
        const root = bodyRef.current;
        if (!root) return undefined;
        const observer = new IntersectionObserver(
            (entries) => {
                const visible = entries
                    .filter((e) => e.isIntersecting)
                    .sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top);
                if (visible[0]) setActiveSection(visible[0].target.dataset.section);
            },
            { root, rootMargin: '-64px 0px -55% 0px', threshold: 0 }
        );
        sections.forEach((s) => {
            const el = sectionRefs.current[s.id];
            if (el) observer.observe(el);
        });
        return () => observer.disconnect();
    }, [view, sections, selectedCourseIndex]);

    if (!isOpen || !program || !currentCourse) return null;

    const handleSelectCourse = (index) => {
        setSelectedCourseIndex(index);
        setActiveSection('overview');
        setView('syllabus');
        if (bodyRef.current) bodyRef.current.scrollTop = 0;
    };

    const handleBackToCourses = () => setView('courses');

    const scrollToSection = (id) => {
        const el = sectionRefs.current[id];
        const body = bodyRef.current;
        if (!el || !body) return;
        const top = el.getBoundingClientRect().top - body.getBoundingClientRect().top + body.scrollTop - 60;
        body.scrollTo({ top, behavior: reduceMotion ? 'auto' : 'smooth' });
    };

    const totalTopics = currentCourse.modules?.reduce((s, m) => s + (m.topics?.length || 0), 0) || 0;

    // Framer reveal preset — animates as it scrolls into the modal body.
    const reveal = (delay = 0, y = 18) => ({
        initial: reduceMotion ? { opacity: 0 } : { opacity: 0, y },
        whileInView: { opacity: 1, y: 0 },
        viewport: { root: bodyRef, once: true, margin: '0px 0px -8% 0px' },
        transition: { duration: 0.5, delay, ease: [0.16, 1, 0.3, 1] },
    });

    const setRef = (id) => (el) => { sectionRefs.current[id] = el; };

    return (
        <div className="srkr-program-modal-overlay">
            <div
                className="srkr-program-modal-content"
                role="dialog"
                aria-modal="true"
                onClick={(e) => e.stopPropagation()}
            >
                {/* Top bar — breadcrumbs + close */}
                <div className="srkr-pmodal-topbar">
                    <nav className="srkr-pmodal-breadcrumbs" aria-label="Breadcrumb">
                        <button type="button" className="srkr-bc-item srkr-bc-btn srkr-bc-root" onClick={onClose} title="Back to Programs Section">
                            Programs
                        </button>
                        <span className="srkr-bc-separator">/</span>
                        <button
                            type="button"
                            className={`srkr-bc-item srkr-bc-btn ${view === 'courses' ? 'is-current' : ''}`}
                            onClick={handleBackToCourses}
                            disabled={view === 'courses'}
                        >
                            {program.name}
                        </button>
                        {view === 'syllabus' && currentCourse && (
                            <>
                                <span className="srkr-bc-separator">/</span>
                                <span className="srkr-bc-item is-current">{currentCourse.title}</span>
                            </>
                        )}
                    </nav>
                    <button className="srkr-pmodal-close-btn" onClick={onClose} aria-label="Close program details modal">
                        <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round"><path d="M18 6 6 18M6 6l12 12" /></svg>
                    </button>
                </div>

                {/* Header banner */}
                <div className="srkr-pmodal-header">
                    <div className="srkr-pmodal-header-left">
                        <div className="srkr-pmodal-icon-badge" style={{ background: program.accentBg, color: (PROGRAM_ICONS[program.id] || {}).color || 'var(--srkr-primary)' }}>
                            {(PROGRAM_ICONS[program.id] || {}).svg || <span>{program.icon}</span>}
                        </div>
                        <div>
                            <div className="srkr-pmodal-tags">
                                <span className="srkr-pmodal-year-tag">{program.year}</span>
                                <span className="srkr-pmodal-track-tag">{program.badge}</span>
                            </div>
                            <h2 className="srkr-pmodal-title">{program.name}</h2>
                            {program.tagline && <p className="srkr-pmodal-tagline">{program.tagline}</p>}
                        </div>
                    </div>
                    {view === 'syllabus' && (
                        <button type="button" className="srkr-back-to-courses-btn" onClick={handleBackToCourses}>
                            ← {program.courses.length > 1 ? 'Back to Courses' : 'Back to Overview'}
                        </button>
                    )}
                </div>

                {/* Scrollable body */}
                <div className="srkr-pmodal-body" ref={bodyRef}>
                    {/* LEVEL 1 — courses grid */}
                    {view === 'courses' && (
                        <div className="srkr-courses-overview-view">
                            <div className={`srkr-pmodal-courses-cards-grid grid-${Math.min(program.courses.length, 4)}`}>
                                {program.courses.map((course, idx) => (
                                    <div key={course.id} className="srkr-course-card-interactive" onClick={() => handleSelectCourse(idx)}>
                                        <div className="srkr-ccard-top">
                                            <span className="srkr-ccard-code">{course.code}</span>
                                            {course.level && <span className="srkr-ccard-level">{course.level}</span>}
                                        </div>
                                        <h3 className="srkr-ccard-title">{course.title}</h3>
                                        <p className="srkr-ccard-overview">{course.overview}</p>
                                        <div className="srkr-ccard-meta-row">
                                            <span className="srkr-meta-pill"><IconLayers /> {course.modules.length} Modules</span>
                                        </div>
                                        <div className="srkr-ccard-action">
                                            <span className="srkr-ccard-btn">Explore Syllabus <IconArrow /></span>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* LEVEL 2 — redesigned syllabus */}
                    {view === 'syllabus' && currentCourse && (
                        <div className="srkr-syll">
                            {/* Course switcher (multi-course programs) */}
                            {program.courses.length > 1 && (
                                <div className="srkr-course-quick-tabs">
                                    <span className="srkr-qtabs-label">Switch Course Track</span>
                                    <div className="srkr-qtabs-list">
                                        {program.courses.map((c, idx) => (
                                            <button
                                                key={c.id}
                                                type="button"
                                                className={`srkr-qtab-btn ${idx === selectedCourseIndex ? 'is-active' : ''}`}
                                                onClick={() => { setSelectedCourseIndex(idx); setActiveSection('overview'); if (bodyRef.current) bodyRef.current.scrollTop = 0; }}
                                            >
                                                {c.title}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {/* Sticky section rail */}
                            <div className="srkr-syll-rail">
                                {sections.map((s) => (
                                    <button
                                        key={s.id}
                                        type="button"
                                        className={`srkr-syll-rail-btn ${activeSection === s.id ? 'is-active' : ''}`}
                                        onClick={() => scrollToSection(s.id)}
                                    >
                                        {s.icon}<span>{s.label}</span>
                                    </button>
                                ))}
                            </div>

                            {/* ── OVERVIEW ── */}
                            <section className="srkr-syll-section" data-section="overview" ref={setRef('overview')}>
                                <div className="srkr-syll-hero">
                                    <span className="srkr-syll-code-chip">{currentCourse.code}</span>
                                    <h3 className="srkr-syll-hero-title">{currentCourse.title}</h3>
                                    <p className="srkr-syll-hero-lead">{currentCourse.overview}</p>

                                    <div className="srkr-syll-stats">
                                        <div className="srkr-syll-stat">
                                            <span className="srkr-syll-stat-ic"><IconLayers /></span>
                                            <span className="srkr-syll-stat-body"><strong>{currentCourse.modules.length}</strong><span>Modules</span></span>
                                        </div>
                                        <div className="srkr-syll-stat">
                                            <span className="srkr-syll-stat-ic"><IconHash /></span>
                                            <span className="srkr-syll-stat-body"><strong>{totalTopics}</strong><span>Topics</span></span>
                                        </div>
                                        {currentCourse.level && (
                                            <div className="srkr-syll-stat is-text">
                                                <span className="srkr-syll-stat-ic"><IconGauge /></span>
                                                <span className="srkr-syll-stat-body"><strong>{currentCourse.level}</strong><span>Level</span></span>
                                            </div>
                                        )}
                                        {currentCourse.journey?.length > 0 && (
                                            <div className="srkr-syll-stat">
                                                <span className="srkr-syll-stat-ic"><IconRocket /></span>
                                                <span className="srkr-syll-stat-body"><strong>{currentCourse.journey.length}</strong><span>Practice milestones</span></span>
                                            </div>
                                        )}
                                    </div>

                                    {currentCourse.prerequisites && (
                                        <div className="srkr-syll-prereq">
                                            <span className="srkr-syll-prereq-ic"><IconSpark /></span>
                                            <span><strong>Prerequisites:</strong> {currentCourse.prerequisites}</span>
                                        </div>
                                    )}
                                </div>
                            </section>

                            {/* ── OUTCOMES ── */}
                            {currentCourse.outcomes?.length > 0 && (
                                <section className="srkr-syll-section" data-section="outcomes" ref={setRef('outcomes')}>
                                    <SectionHead eyebrow="What you'll gain" title="Key Learning Outcomes" sub="Concrete skills you'll walk away with" icon={<IconTarget />} />
                                    <div className="srkr-outcome-grid">
                                        {currentCourse.outcomes.map((o, i) => (
                                            <motion.div key={i} className="srkr-outcome-card" {...reveal(Math.min(i * 0.05, 0.3))}>
                                                <span className={`srkr-outcome-ic tone-${i % 3}`}><IconCheck /></span>
                                                <p>{o}</p>
                                            </motion.div>
                                        ))}
                                    </div>
                                </section>
                            )}

                            {/* ── PRACTICE JOURNEY PIPELINE ── */}
                            {currentCourse.journey?.length > 0 && (
                                <section className="srkr-syll-section" data-section="journey" ref={setRef('journey')}>
                                    <SectionHead eyebrow="Practice Pipeline" title="Your Journey to Placement-Ready" sub="The platforms & milestones you'll conquer — start the course, finish job-ready" icon={<IconRocket />} />

                                    <div className="srkr-journey">
                                        <span className="srkr-journey-spine" aria-hidden="true" />
                                        <div className="srkr-journey-cap srkr-journey-cap--start"><span className="srkr-journey-cap-dot" />Start here</div>

                                        {currentCourse.journey.map((node, i) => (
                                            <motion.div key={i} className={`srkr-journey-node ${i % 2 === 0 ? 'is-left' : 'is-right'} ${node.destination ? 'is-destination' : ''}`} {...reveal(0, 22)}>
                                                <span className="srkr-journey-pin" aria-hidden="true" />
                                                <div className="srkr-journey-card">
                                                    <div className="srkr-journey-figure">
                                                        <span className="srkr-journey-num">{String(i + 1).padStart(2, '0')}</span>
                                                        <img src={node.image} alt={node.label} loading="lazy" />
                                                    </div>
                                                    <div className="srkr-journey-body">
                                                        <div className="srkr-journey-headline">
                                                            <h4>{node.label}</h4>
                                                            {node.caption && <span className="srkr-journey-caption">{node.caption}</span>}
                                                        </div>
                                                        <div className="srkr-journey-tags">
                                                            {node.tags.map((t, ti) => (
                                                                <span key={ti} className="srkr-journey-tag"><span className="srkr-journey-tag-dot" />{t}</span>
                                                            ))}
                                                        </div>
                                                    </div>
                                                </div>
                                            </motion.div>
                                        ))}

                                        <div className="srkr-journey-cap srkr-journey-cap--end"><IconFlag /> Placement-Ready</div>
                                    </div>
                                </section>
                            )}

                            {/* ── MODULES ROADMAP TIMELINE ── */}
                            {currentCourse.modules?.length > 0 && (
                                <section className="srkr-syll-section" data-section="roadmap" ref={setRef('roadmap')}>
                                    <SectionHead eyebrow="Full curriculum" title="Detailed Modules & Roadmap" sub="Every module and the topics it covers, in learning order" icon={<IconMap />} />

                                    {MODULES_LAYOUT === 'blend' ? (
                                        /* Blend: gradient number rail + filled chips + ghost-number
                                           watermark. Equal heights; the watermark fills the space that
                                           stretching creates so shorter modules never read as empty. */
                                        <div className="srkr-modblend">
                                            {currentCourse.modules.map((module, mIdx) => {
                                                const a = MOD_ACCENTS[mIdx % MOD_ACCENTS.length];
                                                const num = String(mIdx + 1).padStart(2, '0');
                                                return (
                                                    <motion.article
                                                        key={mIdx}
                                                        className="srkr-modblend-card"
                                                        style={{ '--c-grad': a.grad, '--c-accent': a.accent, '--c-tint': a.tint }}
                                                        {...reveal(0, 16)}
                                                    >
                                                        <div className="srkr-modblend-rail">
                                                            <span className="srkr-modblend-num">{num}</span>
                                                            <span className="srkr-modblend-lbl">Module</span>
                                                        </div>
                                                        <div className="srkr-modblend-body">
                                                            <span className="srkr-modblend-watermark" aria-hidden="true">{num}</span>
                                                            <div className="srkr-modblend-content">
                                                                <span className="srkr-modblend-eyebrow">{module.moduleNumber}</span>
                                                                <h4 className="srkr-modblend-title">{module.title}</h4>
                                                                <div className="srkr-modblend-chips">
                                                                    {module.topics.map((topic, tIdx) => (
                                                                        <span key={tIdx} className="srkr-modblend-chip"><span className="srkr-modblend-chip-dot" />{topic}</span>
                                                                    ))}
                                                                </div>
                                                            </div>
                                                        </div>
                                                    </motion.article>
                                                );
                                            })}
                                        </div>
                                    ) : MODULES_LAYOUT === 'split' ? (
                                        /* Split-panel: gradient number rail + content panel */
                                        <div className="srkr-modsplit">
                                            {currentCourse.modules.map((module, mIdx) => {
                                                const a = MOD_ACCENTS[mIdx % MOD_ACCENTS.length];
                                                return (
                                                    <motion.article
                                                        key={mIdx}
                                                        className="srkr-modsplit-card"
                                                        style={{ '--c-grad': a.grad, '--c-accent': a.accent }}
                                                        {...reveal(0, 16)}
                                                    >
                                                        <div className="srkr-modsplit-rail">
                                                            <span className="srkr-modsplit-num">{String(mIdx + 1).padStart(2, '0')}</span>
                                                            <span className="srkr-modsplit-lbl">Module</span>
                                                        </div>
                                                        <div className="srkr-modsplit-body">
                                                            <h4 className="srkr-modsplit-title">{module.title}</h4>
                                                            <div className="srkr-modsplit-chips">
                                                                {module.topics.map((topic, tIdx) => (
                                                                    <span key={tIdx} className="srkr-modsplit-chip">{topic}</span>
                                                                ))}
                                                            </div>
                                                        </div>
                                                    </motion.article>
                                                );
                                            })}
                                        </div>
                                    ) : MODULES_LAYOUT === 'grid' ? (
                                        /* Vibrant chip-card grid */
                                        <div className="srkr-modgrid">
                                            {currentCourse.modules.map((module, mIdx) => {
                                                const a = MOD_ACCENTS[mIdx % MOD_ACCENTS.length];
                                                const isTrack = module.duration && !/\d+\s*(hours?|weeks?)/i.test(module.duration);
                                                return (
                                                    <motion.article
                                                        key={mIdx}
                                                        className="srkr-modcard"
                                                        style={{ '--c-accent': a.accent, '--c-grad': a.grad, '--c-tint': a.tint }}
                                                        {...reveal(0, 16)}
                                                    >
                                                        {isTrack && <span className="srkr-modcard-track">{module.duration}</span>}
                                                        <span className="srkr-modcard-watermark" aria-hidden="true">{String(mIdx + 1).padStart(2, '0')}</span>
                                                        <div className="srkr-modcard-head">
                                                            <span className="srkr-modcard-badge">{String(mIdx + 1).padStart(2, '0')}</span>
                                                            <div className="srkr-modcard-titlewrap">
                                                                <span className="srkr-modcard-eyebrow">{module.moduleNumber}</span>
                                                                <h4 className="srkr-modcard-title">{module.title}</h4>
                                                            </div>
                                                        </div>
                                                        <div className="srkr-modcard-chips">
                                                            {module.topics.map((topic, tIdx) => (
                                                                <span key={tIdx} className="srkr-modcard-chip"><span className="srkr-modcard-chip-dot" />{topic}</span>
                                                            ))}
                                                        </div>
                                                    </motion.article>
                                                );
                                            })}
                                        </div>
                                    ) : (
                                        /* Fallback: numbered roadmap timeline */
                                        <div className="srkr-roadmap">
                                            <span className="srkr-roadmap-spine" aria-hidden="true" />
                                            {currentCourse.modules.map((module, mIdx) => (
                                                <motion.div key={mIdx} className="srkr-roadmap-node" {...reveal(0, 18)}>
                                                    <span className="srkr-roadmap-dot">{mIdx + 1}</span>
                                                    <div className="srkr-roadmap-card">
                                                        <div className="srkr-roadmap-card-head">
                                                            <div>
                                                                <span className="srkr-roadmap-modnum">{module.moduleNumber}</span>
                                                                <h4 className="srkr-roadmap-modtitle">{module.title}</h4>
                                                            </div>
                                                            {module.duration && !/\d+\s*(hours?|weeks?)/i.test(module.duration) && (
                                                                <span className="srkr-roadmap-tracktag">{module.duration}</span>
                                                            )}
                                                        </div>
                                                        <div className="srkr-roadmap-topics">
                                                            {module.topics.map((topic, tIdx) => (
                                                                <span key={tIdx} className="srkr-roadmap-topic"><span className="srkr-roadmap-topic-tick"><IconCheck /></span>{topic}</span>
                                                            ))}
                                                        </div>
                                                    </div>
                                                </motion.div>
                                            ))}
                                        </div>
                                    )}
                                </section>
                            )}
                        </div>
                    )}
                </div>

                {/* Footer */}
                <div className="srkr-pmodal-footer">
                    <div></div>
                    <div className="srkr-pmodal-footer-btns">
                        <button type="button" className="srkr-btn-outline" onClick={onClose}>Close</button>
                        <a
                            href="#contact"
                            className="srkr-btn-primary"
                            onClick={(e) => {
                                onClose();
                                const el = document.querySelector('#contact');
                                if (el) el.scrollIntoView({ behavior: 'smooth' });
                            }}
                        >
                            Inquire Now <IconArrow />
                        </a>
                    </div>
                </div>
            </div>
        </div>
    );
};

// Shared section heading
function SectionHead({ eyebrow, title, sub, icon }) {
    return (
        <div className="srkr-syll-head">
            <span className="srkr-syll-head-ic">{icon}</span>
            <div>
                <span className="srkr-syll-head-eyebrow">{eyebrow}</span>
                <h3 className="srkr-syll-head-title">{title}</h3>
                {sub && <p className="srkr-syll-head-sub">{sub}</p>}
            </div>
        </div>
    );
}

export default ProgramDetailModal;
