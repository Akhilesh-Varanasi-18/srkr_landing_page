'use client'
import React, { useState, useRef, useEffect, useCallback } from 'react';
import programsData from './programs-data';
import ProgramDetailModal from './program-detail-modal';

// Distinct course items linked to programs with rich highlights
const coursesList = [
    {
        id: 'skillup-dsa',
        programId: 'skillup',
        code: 'SKL-201',
        title: 'Data Structures & Algorithms (DSA)',
        category: 'dsa',
        categoryLabel: 'Core DSA',
        programName: 'SkillUp Coder',
        programYear: '2nd Year',
        duration: '80 Hours',
        modulesCount: '11 Modules',
        accentColor: 'var(--srkr-secondary)',
        accentGradient: 'linear-gradient(135deg, var(--srkr-tertiary) 0%, var(--srkr-secondary) 100%)',
        accentBg: 'var(--srkr-bg-warm-tint)',
        icon: (
            <svg viewBox="0 0 24 24" width="28" height="28" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="5" r="3" />
                <circle cx="5" cy="19" r="3" />
                <circle cx="19" cy="19" r="3" />
                <line x1="12" y1="8" x2="5" y2="16" />
                <line x1="12" y1="8" x2="19" y2="16" />
            </svg>
        ),
        description: 'Comprehensive core DSA curriculum covering Big-O analysis, linear structures, trees, heaps, graphs, and dynamic programming.',
        highlights: [
            'Tree traversals, BST operations & LCA',
            'BFS/DFS graphs & 1D dynamic programming'
        ],
        tags: ['Arrays & Matrices', 'Linked Lists', 'Trees & BST', 'Graphs', 'Dynamic Programming'],
        courseIndex: 0,
    },
    {
        id: 'skillup-problem-solving',
        programId: 'skillup',
        code: 'SKL-202',
        title: 'Applied Problem Solving & Contest Prep',
        category: 'dsa',
        categoryLabel: 'Problem Solving',
        programName: 'SkillUp Coder',
        programYear: '2nd Year',
        duration: '50 Hours',
        modulesCount: '4 Modules',
        accentColor: 'var(--srkr-primary)',
        accentGradient: 'linear-gradient(135deg, var(--srkr-secondary) 0%, var(--srkr-primary) 100%)',
        accentBg: 'var(--srkr-bg-coral-tint)',
        icon: (
            <svg viewBox="0 0 24 24" width="28" height="28" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
            </svg>
        ),
        description: 'Targeted bootcamp focusing on pattern recognition, edge-case optimization, sliding window, and timed online assessments.',
        highlights: [
            '2-minute algorithmic pattern recognition',
            'Timed 90-minute mock OA assessments'
        ],
        tags: ['Two Pointers', 'Sliding Window', 'Binary Search on Answer', 'Bitmasking', 'Mock OAs'],
        courseIndex: 1,
    },
    {
        id: 'aiready-fullstack',
        programId: 'aiready',
        code: 'AIR-301',
        title: 'Full Stack Development + AI Integration',
        category: 'dev',
        categoryLabel: 'Full Stack',
        programName: 'AI Ready Program',
        programYear: '3rd Year',
        duration: '70 Hours',
        modulesCount: '8 Modules',
        accentColor: 'var(--srkr-primary)',
        accentGradient: 'var(--srkr-gradient-primary)',
        accentBg: 'var(--srkr-bg-coral-tint)',
        icon: (
            <svg viewBox="0 0 24 24" width="28" height="28" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="16 18 22 12 16 6" />
                <polyline points="8 6 2 12 8 18" />
                <line x1="14" y1="4" x2="10" y2="20" />
            </svg>
        ),
        description: 'End-to-end modern web engineering with HTML5, CSS3, JavaScript, React.js, Node.js, Express, MongoDB, and Generative AI APIs.',
        highlights: [
            'Full-stack MERN with JWT authentication',
            'Streaming AI chatbots & Docker deployments'
        ],
        tags: ['React.js', 'Node.js & Express', 'MongoDB Atlas', 'Gemini / Claude AI', 'Docker CI/CD'],
        courseIndex: 0,
    },
    {
        id: 'aiready-flutter',
        programId: 'aiready',
        code: 'AIR-302',
        title: 'Google Flutter + AI Integration',
        category: 'dev',
        categoryLabel: 'Mobile App',
        programName: 'AI Ready Program',
        programYear: '3rd Year',
        duration: '60 Hours',
        modulesCount: '8 Modules',
        accentColor: 'var(--srkr-secondary)',
        accentGradient: 'linear-gradient(135deg, var(--srkr-tertiary) 0%, var(--srkr-secondary) 100%)',
        accentBg: 'var(--srkr-bg-warm-tint)',
        icon: (
            <svg viewBox="0 0 24 24" width="28" height="28" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                <rect x="5" y="2" width="14" height="20" rx="2" ry="2" />
                <line x1="12" y1="18" x2="12.01" y2="18" />
            </svg>
        ),
        description: 'Cross-platform mobile app development with Dart, Material Design, Provider state management, Firebase, and AI Chatbots.',
        highlights: [
            'Android & iOS apps from single Dart codebase',
            'Play Store & App Store production publishing'
        ],
        tags: ['Dart OOP', 'Flutter SDK', 'Provider', 'Firebase Auth', 'Play & App Store'],
        courseIndex: 1,
    },
    {
        id: 'aiready-cloud-devops',
        programId: 'aiready',
        code: 'AIR-303',
        title: 'AWS Cloud and Devops + AI Integration',
        category: 'cloud',
        categoryLabel: 'Cloud & DevOps',
        programName: 'AI Ready Program',
        programYear: '3rd Year',
        duration: '134 Hours',
        modulesCount: '6 Modules',
        accentColor: 'var(--srkr-tertiary)',
        accentGradient: 'linear-gradient(135deg, var(--srkr-secondary) 0%, var(--srkr-tertiary) 100%)',
        accentBg: 'var(--srkr-bg-warm-offwhite)',
        icon: (
            <svg viewBox="0 0 24 24" width="28" height="28" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M18 10h-1.26A8 8 0 1 0 9 20h9a5 5 0 0 0 0-10z" />
            </svg>
        ),
        description: 'Hands-on enterprise cloud training covering Networking, Linux, AWS Services, Docker, Kubernetes EKS, Terraform, and Amazon Bedrock.',
        highlights: [
            'Kubernetes (EKS), Terraform & CI/CD automation',
            'GenAI on AWS (Bedrock, AgentCore, Q Developer)'
        ],
        tags: ['AWS Core (EC2/S3/VPC)', 'Docker & EKS', 'Terraform IaC', 'Amazon Bedrock AI', 'AWS Cert Prep'],
        courseIndex: 2,
    },
    {
        id: 'aiready-servicenow',
        programId: 'aiready',
        code: 'AIR-304',
        title: 'ServiceNow Platform Engineering',
        category: 'cloud',
        categoryLabel: 'Platform Eng',
        programName: 'AI Ready Program',
        programYear: '3rd Year',
        duration: '80 Hours',
        modulesCount: '15 Modules',
        accentColor: 'var(--srkr-primary)',
        accentGradient: 'linear-gradient(135deg, var(--srkr-secondary) 0%, var(--srkr-primary) 100%)',
        accentBg: 'var(--srkr-bg-coral-tint)',
        icon: (
            <svg viewBox="0 0 24 24" width="28" height="28" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="3" />
                <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z" />
            </svg>
        ),
        description: 'Enterprise IT automation, GlideRecord scripting, Flow Designer, IntegrationHub, Now Assist AI, and CSA / CAD certification prep.',
        highlights: [
            'GlideRecord & client-server script includes',
            'CSA & CAD certification checkpoint prep'
        ],
        tags: ['Now Platform', 'GlideRecord Scripting', 'Flow Designer', 'Now Assist AI', 'CSA & CAD Prep'],
        courseIndex: 3,
    },
    {
        id: 'bamboo-c',
        programId: 'bamboo',
        code: 'BMB-101',
        title: 'C Programming & Logic Building',
        category: 'core',
        categoryLabel: 'Foundation',
        programName: 'Bamboo Coder',
        programYear: '1st Year',
        duration: '60 Hours',
        modulesCount: '5 Modules',
        accentColor: 'var(--srkr-primary)',
        accentGradient: 'linear-gradient(135deg, var(--srkr-secondary) 0%, var(--srkr-primary) 100%)',
        accentBg: 'var(--srkr-bg-coral-tint)',
        icon: (
            <svg viewBox="0 0 24 24" width="28" height="28" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                <rect x="4" y="4" width="16" height="16" rx="2" />
                <rect x="9" y="9" width="6" height="6" />
                <line x1="9" y1="1" x2="9" y2="4" />
                <line x1="15" y1="1" x2="15" y2="4" />
                <line x1="9" y1="20" x2="9" y2="23" />
                <line x1="15" y1="20" x2="15" y2="23" />
                <line x1="20" y1="9" x2="23" y2="9" />
                <line x1="20" y1="14" x2="23" y2="14" />
                <line x1="1" y1="9" x2="4" y2="9" />
                <line x1="1" y1="14" x2="4" y2="14" />
            </svg>
        ),
        description: 'Master computer science fundamentals, memory models, pointer arithmetic, structures, file handling, and modular console programs.',
        highlights: [
            'Pointer arithmetic & dynamic memory management',
            'Console mini-project & modular C architecture'
        ],
        tags: ['C Fundamentals', 'Pointer Arithmetic', 'Dynamic Memory', 'Structures & Files', 'Modular Design'],
        courseIndex: 0,
    },
    {
        id: 'owl-cp-dsa',
        programId: 'owlcoder',
        code: 'OWL-401',
        title: 'Advanced Competitive Programming & DSA',
        category: 'dsa',
        categoryLabel: 'Expert CP',
        programName: 'Owl Coder',
        programYear: 'Exclusive 2028 Batch',
        duration: '8 Weeks',
        modulesCount: '21 Modules',
        accentColor: 'var(--srkr-primary)',
        accentGradient: 'var(--srkr-gradient-primary)',
        accentBg: 'var(--srkr-bg-coral-tint)',
        icon: (
            <svg viewBox="0 0 24 24" width="28" height="28" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                <polygon points="12 2 2 7 12 12 22 7 12 2" />
                <polyline points="2 17 12 22 22 17" />
                <polyline points="2 12 12 17 22 12" />
            </svg>
        ),
        description: 'Elite competitive programming track covering advanced trees, graphs, Tries, segment trees, DP with bitmasks, and number theory.',
        highlights: [
            'Segment Trees, Fenwick Trees & Tries',
            'String algorithms (KMP, Z-Algo) & Bitmask DP'
        ],
        tags: ['Advanced Graphs', 'Segment Trees', 'Tries & Bitmask DP', 'String Algorithms', 'Number Theory'],
        courseIndex: 0,
    },
    {
        id: 'moon-dsa-ready',
        programId: 'mooncoder',
        code: 'MOON-101',
        title: 'Core Problem Solving & DSA Readiness',
        category: 'dsa',
        categoryLabel: 'DSA Ready',
        programName: 'Moon Coder',
        programYear: 'Exclusive 2029 Batch',
        duration: '8 Weeks',
        modulesCount: '15 Modules',
        accentColor: 'var(--srkr-secondary)',
        accentGradient: 'linear-gradient(135deg, var(--srkr-tertiary) 0%, var(--srkr-secondary) 100%)',
        accentBg: 'var(--srkr-bg-warm-tint)',
        icon: (
            <svg viewBox="0 0 24 24" width="28" height="28" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
            </svg>
        ),
        description: 'Structured 15-module problem-solving curriculum from fundamentals through arrays, strings, recursion, hashing, and backtracking.',
        highlights: [
            'Array math, matrices & palindrome patterns',
            'Recursion state trees & basic backtracking'
        ],
        tags: ['Array Math', 'Strings & Palindromes', 'Recursion Stacks', 'HashMaps & HashSets', 'Backtracking'],
        courseIndex: 0,
    }
];

// How many cards to reveal before "View More" kicks in, per viewport.
// Desktop shows everything (no collapse); mobile/tablet collapse with a
// fixed-height internal scroller.
const getLayout = (width) => {
    if (width <= 767) return { count: 3, collapsible: true };   // mobile: 1 col × 3
    if (width <= 1199) return { count: 4, collapsible: true };  // tablet: 2 cols × 2 rows
    return { count: coursesList.length, collapsible: false };   // desktop: show all
};

const Courses = () => {
    const [selectedProgram, setSelectedProgram] = useState(null);
    const [modalCourseIndex, setModalCourseIndex] = useState(0);
    const [isModalOpen, setIsModalOpen] = useState(false);

    // Reveal a sliver of the next card when expanded so it's obvious the list
    // now scrolls (a pure scrollbar isn't a strong enough cue on touch).
    const PEEK_PX = 92;

    // View More / View Less state
    const [expanded, setExpanded] = useState(false);
    const [visibleCount, setVisibleCount] = useState(coursesList.length);
    const [collapsible, setCollapsible] = useState(false);
    const [collapsedHeight, setCollapsedHeight] = useState(null);
    const [atBottom, setAtBottom] = useState(false);
    const gridRef = useRef(null);

    // Track viewport → decide how many cards show before collapsing.
    useEffect(() => {
        const apply = () => {
            const { count, collapsible: c } = getLayout(window.innerWidth);
            setVisibleCount(count);
            setCollapsible(c);
            if (!c) setExpanded(false); // desktop is always fully expanded
        };
        apply();
        window.addEventListener('resize', apply);
        return () => window.removeEventListener('resize', apply);
    }, []);

    // Measure the exact pixel height of the first `visibleCount` cards. The grid
    // locks to this height so "View More" scrolls the remaining cards inside it
    // instead of growing the section. offsetTop/offsetHeight are layout-based
    // (scroll-independent), and the grid is position:relative so it's the offset
    // parent. Re-runs via ResizeObserver whenever the grid's width changes.
    useEffect(() => {
        const grid = gridRef.current;
        if (!grid) return;
        const measure = () => {
            const cards = grid.querySelectorAll('.srkr-course-card');
            if (!cards.length) return;
            if (visibleCount >= cards.length) { setCollapsedHeight(null); return; }
            const nth = cards[visibleCount - 1];
            const h = nth.offsetTop + nth.offsetHeight;
            setCollapsedHeight(prev => (prev == null || Math.abs(prev - h) > 1 ? h : prev));
        };
        measure();
        const ro = new ResizeObserver(measure);
        ro.observe(grid);
        return () => ro.disconnect();
    }, [visibleCount]);

    const toggleExpand = useCallback(() => {
        setExpanded(prev => {
            const next = !prev;
            if (gridRef.current) gridRef.current.scrollTop = 0; // start at the top of the scroller
            setAtBottom(false);
            return next;
        });
    }, []);

    const handleGridScroll = useCallback((e) => {
        const el = e.currentTarget;
        setAtBottom(el.scrollTop + el.clientHeight >= el.scrollHeight - 4);
    }, []);

    // Collapsed: exactly N cards. Expanded: N cards + a peek of the next card as
    // a scroll affordance (height only nudges by PEEK_PX, it doesn't grow to fit
    // all cards — the rest live inside the scroller).
    const gridStyle = (collapsible && collapsedHeight != null)
        ? {
            maxHeight: `${expanded ? collapsedHeight + PEEK_PX : collapsedHeight}px`,
            overflowY: expanded ? 'auto' : 'hidden',
        }
        : undefined;

    const remaining = coursesList.length - visibleCount;

    const handleOpenSyllabus = (course) => {
        const foundProgram = programsData.find(p => p.id === course.programId);
        if (foundProgram) {
            setSelectedProgram(foundProgram);
            setModalCourseIndex(course.courseIndex);
            setIsModalOpen(true);
        }
    };

    const handleCloseModal = () => {
        setIsModalOpen(false);
        setSelectedProgram(null);
    };

    return (
        <>
            <section id="courses" className="srkr-courses">
                {/* Subtle Ambient Glow Blobs */}
                <div className="srkr-courses-glow-blob srkr-courses-glow-1" aria-hidden="true" />
                <div className="srkr-courses-glow-blob srkr-courses-glow-2" aria-hidden="true" />

                <div className="srkr-courses-container">
                    {/* Section Header */}
                    <div className="srkr-section-title" data-sal="slide-up" data-sal-delay="100" data-sal-duration="800">
                        <h2>Courses We <span>Offer</span></h2>
                        <p>
                            From foundational programming and algorithmic mastery to enterprise full-stack development, 
                            mobile engineering, cloud architecture, and automation.
                        </p>
                    </div>

                    {/* Courses Grid — collapses to a fixed-height scroller on mobile/tablet */}
                    <div className="srkr-courses-grid-shell">
                    <div
                        className={`srkr-courses-grid ${collapsible ? 'is-collapsible' : ''} ${expanded ? 'is-expanded' : ''}`}
                        ref={gridRef}
                        style={gridStyle}
                        onScroll={collapsible ? handleGridScroll : undefined}
                    >
                        {coursesList.map((course, idx) => (
                            <div
                                key={course.id}
                                className="srkr-course-card"
                                data-sal="slide-up"
                                data-sal-delay={`${80 + (idx % 3) * 60}`}
                                data-sal-duration="650"
                                style={{
                                    '--card-accent': course.accentColor,
                                    '--card-accent-bg': course.accentBg,
                                    '--card-gradient': course.accentGradient,
                                }}
                            >
                                {/* Top Header Bar */}
                                <div className="srkr-course-card-top">
                                    <span className="srkr-course-code-badge">{course.code}</span>
                                    <span 
                                        className="srkr-course-category-pill"
                                        style={{ color: course.accentColor, background: course.accentBg }}
                                    >
                                        {course.categoryLabel}
                                    </span>
                                </div>

                                {/* Icon + Title Area */}
                                <div className="srkr-course-card-head">
                                    <div 
                                        className="srkr-course-icon-wrapper"
                                        style={{ background: course.accentGradient }}
                                    >
                                        {course.icon}
                                    </div>
                                    <div className="srkr-course-head-text">
                                        <span className="srkr-course-program-link">
                                            {course.programName} • {course.programYear}
                                        </span>
                                        <h3 className="srkr-course-title">{course.title}</h3>
                                    </div>
                                </div>

                                {/* Description */}
                                <p className="srkr-course-desc">{course.description}</p>

                                {/* Highlights */}
                                {course.highlights && (
                                    <ul className="srkr-course-highlights-list">
                                        {course.highlights.map((item, hIdx) => (
                                            <li key={hIdx}>
                                                <svg viewBox="0 0 16 16" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2.5">
                                                    <polyline points="3 8 6.5 11.5 13 4" />
                                                </svg>
                                                <span>{item}</span>
                                            </li>
                                        ))}
                                    </ul>
                                )}

                                {/* Tech Tags */}
                                <div className="srkr-course-tags">
                                    {course.tags.map((tag, tIdx) => (
                                        <span key={tIdx} className="srkr-course-tag-item">
                                            {tag}
                                        </span>
                                    ))}
                                </div>

                                {/* Card Bottom Bar */}
                                <div className="srkr-course-card-footer">
                                    <div className="srkr-course-meta">
                                        <span className="srkr-course-meta-pill">
                                            <svg viewBox="0 0 24 24" width="13" height="13" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                                <circle cx="12" cy="12" r="9" />
                                                <path d="M12 7v5l3 2" />
                                            </svg>
                                            {course.duration}
                                        </span>
                                        <span className="srkr-course-meta-pill">
                                            <svg viewBox="0 0 24 24" width="13" height="13" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                                <path d="M12 2 2 7l10 5 10-5-10-5Z" />
                                                <path d="m2 17 10 5 10-5" />
                                                <path d="m2 12 10 5 10-5" />
                                            </svg>
                                            {course.modulesCount}
                                        </span>
                                    </div>
                                    <button 
                                        type="button" 
                                        className="srkr-course-explore-btn"
                                        onClick={() => handleOpenSyllabus(course)}
                                    >
                                        Explore Syllabus <span>→</span>
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                        {/* Bottom fade cue — signals more cards below; hides at the end */}
                        {collapsible && expanded && !atBottom && (
                            <div className="srkr-courses-scroll-fade" aria-hidden="true" />
                        )}
                    </div>

                    {/* View More / View Less toggle (mobile & tablet only) */}
                    {collapsible && (
                        <div className="srkr-courses-viewmore-wrap">
                            <button
                                type="button"
                                className="srkr-courses-viewmore-btn"
                                onClick={toggleExpand}
                                aria-expanded={expanded}
                            >
                                <span>{expanded ? 'View Less' : `View More${remaining > 0 ? ` (${remaining})` : ''}`}</span>
                                <svg
                                    className={`srkr-viewmore-chevron ${expanded ? 'is-up' : ''}`}
                                    viewBox="0 0 24 24" width="18" height="18"
                                    fill="none" stroke="currentColor" strokeWidth="2.4"
                                    strokeLinecap="round" strokeLinejoin="round"
                                >
                                    <path d="M6 9l6 6 6-6" />
                                </svg>
                            </button>
                        </div>
                    )}
                </div>
            </section>

            {/* Reusable Program/Course Detail Modal */}
            <ProgramDetailModal
                program={selectedProgram}
                isOpen={isModalOpen}
                onClose={handleCloseModal}
                initialCourseIndex={modalCourseIndex}
                initialView="syllabus"
            />
        </>
    );
};

export default Courses;