'use client'
import React, { useState, useEffect } from 'react';

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
    // view can be 'courses' (course selection grid) or 'syllabus' (module details)
    const [view, setView] = useState(initialView);
    const [selectedCourseIndex, setSelectedCourseIndex] = useState(initialCourseIndex);
    const [openModuleIndex, setOpenModuleIndex] = useState(0);

    // On each open, honor the caller's requested entry point rather than always
    // resetting to the courses grid — that reset was the bug that forced a second
    // click to reach a course's syllabus.
    useEffect(() => {
        if (program && isOpen) {
            setView(initialView);
            setSelectedCourseIndex(initialCourseIndex);
            setOpenModuleIndex(0);
        }
    }, [program, isOpen, initialView, initialCourseIndex]);

    // Handle ESC key to close modal
    useEffect(() => {
        const handleKeyDown = (e) => {
            if (e.key === 'Escape' && isOpen) {
                onClose();
            }
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [isOpen, onClose]);

    if (!isOpen || !program) return null;

    const currentCourse = program.courses[selectedCourseIndex] || program.courses[0];

    const handleSelectCourse = (index) => {
        setSelectedCourseIndex(index);
        setOpenModuleIndex(0);
        setView('syllabus');
    };

    const handleBackToCourses = () => {
        setView('courses');
    };

    const toggleModule = (index) => {
        setOpenModuleIndex(prev => (prev === index ? null : index));
    };

    return (
        <div className="srkr-program-modal-overlay">
            <div 
                className="srkr-program-modal-content"
                role="dialog"
                aria-modal="true"
                onClick={(e) => e.stopPropagation()}
            >
                {/* Modal Top Bar: Clean Breadcrumbs & Close Button */}
                <div className="srkr-pmodal-topbar">
                    <nav className="srkr-pmodal-breadcrumbs" aria-label="Breadcrumb">
                        <button 
                            type="button" 
                            className="srkr-bc-item srkr-bc-btn srkr-bc-root"
                            onClick={onClose}
                            title="Back to Programs Section"
                        >
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
                                <span className="srkr-bc-item is-current">
                                    {currentCourse.title}
                                </span>
                            </>
                        )}
                    </nav>

                    <button 
                        className="srkr-pmodal-close-btn" 
                        onClick={onClose} 
                        aria-label="Close program details modal"
                    >
                        ✕
                    </button>
                </div>

                {/* Modal Header Banner */}
                <div className="srkr-pmodal-header">
                    <div className="srkr-pmodal-header-left">
                        <div className="srkr-pmodal-icon-badge" style={{ background: program.accentBg }}>
                            <span>{program.icon}</span>
                        </div>
                        <div>
                            <div className="srkr-pmodal-tags">
                                <span className="srkr-pmodal-year-tag">{program.year}</span>
                                <span className="srkr-pmodal-track-tag">{program.badge}</span>
                            </div>
                            <h2 className="srkr-pmodal-title">{program.name}</h2>
                            {program.tagline && (
                                <p className="srkr-pmodal-tagline">{program.tagline}</p>
                            )}
                        </div>
                    </div>

                    {view === 'syllabus' && (
                        <button 
                            type="button" 
                            className="srkr-back-to-courses-btn"
                            onClick={handleBackToCourses}
                        >
                            ← {program.courses.length > 1 ? 'Back to Courses' : 'Back to Overview'}
                        </button>
                    )}
                </div>

                {/* Modal Scrollable Body */}
                <div className="srkr-pmodal-body">
                    {/* LEVEL 1: COURSES GRID VIEW */}
                    {view === 'courses' && (
                        <div className="srkr-courses-overview-view">
                            <div className={`srkr-pmodal-courses-cards-grid grid-${Math.min(program.courses.length, 4)}`}>
                                {program.courses.map((course, idx) => (
                                    <div 
                                        key={course.id} 
                                        className="srkr-course-card-interactive"
                                        onClick={() => handleSelectCourse(idx)}
                                    >
                                        <div className="srkr-ccard-top">
                                            <span className="srkr-ccard-code">{course.code}</span>
                                            {course.level && (
                                                <span className="srkr-ccard-level">{course.level}</span>
                                            )}
                                        </div>

                                        <h3 className="srkr-ccard-title">{course.title}</h3>
                                        <p className="srkr-ccard-overview">{course.overview}</p>

                                        <div className="srkr-ccard-meta-row">
                                            <span className="srkr-meta-pill">⏱ {course.duration}</span>
                                            <span className="srkr-meta-pill">📚 {course.modules.length} Modules</span>
                                        </div>

                                        <div className="srkr-ccard-action">
                                            <span className="srkr-ccard-btn">
                                                Explore Syllabus <span>→</span>
                                            </span>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* LEVEL 2: DETAILED SYLLABUS & MODULES VIEW */}
                    {view === 'syllabus' && currentCourse && (
                        <div className="srkr-course-syllabus-view">
                            {/* Switcher bar if multiple courses */}
                            {program.courses.length > 1 && (
                                <div className="srkr-course-quick-tabs">
                                    <span className="srkr-qtabs-label">Switch Course Track:</span>
                                    <div className="srkr-qtabs-list">
                                        {program.courses.map((c, idx) => (
                                            <button
                                                key={c.id}
                                                type="button"
                                                className={`srkr-qtab-btn ${idx === selectedCourseIndex ? 'is-active' : ''}`}
                                                onClick={() => {
                                                    setSelectedCourseIndex(idx);
                                                    setOpenModuleIndex(0);
                                                }}
                                            >
                                                {c.title}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {/* Course Highlights Info Card */}
                            <div className="srkr-course-info-card">
                                <div className="srkr-cinfo-header">
                                    <div>
                                        <span className="srkr-cinfo-code">{currentCourse.code}</span>
                                        <h3>{currentCourse.title}</h3>
                                    </div>
                                    <div className="srkr-cinfo-badges">
                                        <span className="srkr-cinfo-duration">⏱ {currentCourse.duration}</span>
                                        {currentCourse.level && (
                                            <span className="srkr-cinfo-level">🎯 {currentCourse.level}</span>
                                        )}
                                    </div>
                                </div>

                                <p className="srkr-cinfo-overview">{currentCourse.overview}</p>

                                {currentCourse.prerequisites && (
                                    <div className="srkr-cinfo-prereq">
                                        <strong>Prerequisites:</strong> {currentCourse.prerequisites}
                                    </div>
                                )}

                                {currentCourse.outcomes && currentCourse.outcomes.length > 0 && (
                                    <div className="srkr-cinfo-outcomes">
                                        <strong>Key Learning Outcomes:</strong>
                                        <ul>
                                            {currentCourse.outcomes.map((outcome, i) => (
                                                <li key={i}>
                                                    <span className="srkr-check-icon">✓</span>
                                                    {outcome}
                                                </li>
                                            ))}
                                        </ul>
                                    </div>
                                )}
                            </div>

                            {/* Module-by-Module Accordion */}
                            <div className="srkr-syllabus-container">
                                <div className="srkr-syllabus-header">
                                    <div>
                                        <h4>Detailed Syllabus & Modules Roadmap</h4>
                                        <p>Click on any module to view the covered topics</p>
                                    </div>
                                </div>

                                <div className="srkr-syllabus-accordion">
                                    {currentCourse.modules.map((module, mIdx) => {
                                        const isExpanded = openModuleIndex === mIdx;
                                        return (
                                            <div 
                                                key={mIdx} 
                                                className={`srkr-module-accordion-item ${isExpanded ? 'is-open' : ''}`}
                                            >
                                                <button
                                                    type="button"
                                                    className="srkr-module-header-btn"
                                                    onClick={() => toggleModule(mIdx)}
                                                >
                                                    <div className="srkr-module-title-wrap">
                                                        <span className="srkr-module-num-badge">
                                                            {module.moduleNumber}
                                                        </span>
                                                        <span className="srkr-module-title">
                                                            {module.title}
                                                        </span>
                                                    </div>
                                                    <div className="srkr-module-meta-right">
                                                        <span className="srkr-module-hours">{module.duration}</span>
                                                        <span className="srkr-accordion-arrow">
                                                            {isExpanded ? '▲' : '▼'}
                                                        </span>
                                                    </div>
                                                </button>

                                                {isExpanded && (
                                                    <div className="srkr-module-content-body">
                                                        <div className="srkr-module-topics-header">
                                                            <h5>Covered Topics ({module.topics.length}):</h5>
                                                        </div>
                                                        <div className="srkr-module-topics-list-vertical">
                                                            {module.topics.map((topic, tIdx) => (
                                                                <div key={tIdx} className="srkr-topic-bullet-item">
                                                                    <span className="srkr-topic-tick-badge">✓</span>
                                                                    <span className="srkr-topic-title">{topic}</span>
                                                                </div>
                                                            ))}
                                                        </div>
                                                    </div>
                                                )}
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>
                        </div>
                    )}
                </div>

                {/* Modal Footer Actions */}
                <div className="srkr-pmodal-footer">
                    <div></div>
                    <div className="srkr-pmodal-footer-btns">
                        <button type="button" className="srkr-btn-outline" onClick={onClose}>
                            Close
                        </button>
                        <a 
                            href="#contact" 
                            className="srkr-btn-primary"
                            onClick={(e) => {
                                onClose();
                                const el = document.querySelector('#contact');
                                if (el) el.scrollIntoView({ behavior: 'smooth' });
                            }}
                        >
                            Inquire Now →
                        </a>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ProgramDetailModal;
