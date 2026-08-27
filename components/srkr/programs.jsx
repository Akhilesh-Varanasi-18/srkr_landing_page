'use client'
import React, { useState, useEffect } from 'react';
import Slider from 'react-slick';
import programsData from './programs-data';
import ProgramDetailModal from './program-detail-modal';

// Custom Prev Arrow for Slick Carousel
function PrevArrow(props) {
    const { className, style, onClick } = props;
    return (
        <button
            type="button"
            className="srkr-slick-arrow srkr-slick-prev"
            style={{ ...style }}
            onClick={onClick}
            aria-label="Previous Program"
        >
            <svg viewBox="0 0 24 24" width="28" height="28" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M15 18l-6-6 6-6" />
            </svg>
        </button>
    );
}

// Custom Next Arrow for Slick Carousel
function NextArrow(props) {
    const { className, style, onClick } = props;
    return (
        <button
            type="button"
            className="srkr-slick-arrow srkr-slick-next"
            style={{ ...style }}
            onClick={onClick}
            aria-label="Next Program"
        >
            <svg viewBox="0 0 24 24" width="28" height="28" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M9 6l6 6-6 6" />
            </svg>
        </button>
    );
}

// Resolve how many cards to show for a given viewport width.
// 1 card on phones, 2 on tablets, 3 on desktop.
const getSlidesToShow = (width) => {
    if (width <= 767) return 1;
    if (width <= 1199) return 2;
    return 3;
};

const Programs = () => {
    const [selectedProgram, setSelectedProgram] = useState(null);
    const [isModalOpen, setIsModalOpen] = useState(false);
    // Drive slidesToShow from the real viewport width ourselves.
    // react-slick's built-in `responsive` only reacts to matchMedia *change*
    // events and never checks the initial match on mount, so on a direct
    // mobile page load it stays stuck on the desktop default (3 cards).
    // SSR-safe: start at desktop default, then correct on mount (no hydration mismatch).
    const [slidesToShow, setSlidesToShow] = useState(3);

    useEffect(() => {
        const updateSlides = () => setSlidesToShow(getSlidesToShow(window.innerWidth));
        updateSlides(); // run immediately on mount — this is the piece slick misses
        window.addEventListener('resize', updateSlides);
        return () => window.removeEventListener('resize', updateSlides);
    }, []);

    const handleOpenProgram = (program) => {
        setSelectedProgram(program);
        setIsModalOpen(true);
    };

    const handleCloseProgram = () => {
        setIsModalOpen(false);
        setSelectedProgram(null);
    };

    // Slick Carousel settings — slidesToShow is computed above, not via `responsive`.
    const sliderSettings = {
        dots: false,
        infinite: true,
        speed: 500,
        slidesToShow,
        slidesToScroll: 1,
        autoplay: true,
        autoplaySpeed: 4500,
        pauseOnHover: true,
        pauseOnFocus: true,
        swipe: true,
        swipeToSlide: true,
        touchThreshold: 12,
        arrows: true,
        prevArrow: <PrevArrow />,
        nextArrow: <NextArrow />,
    };

    return (
        <section id="programs" className="srkr-programs">
            <div className="srkr-programs-container">
                {/* Section Header */}
                <div className="srkr-section-title" data-sal="slide-up" data-sal-delay="100" data-sal-duration="800">
                    <h2>Programs We <span>Offer</span></h2>
                    <p>
                        Comprehensive engineering curriculums tailored from foundational coding in first year 
                        to advanced competitive programming and modern AI-powered systems.
                    </p>
                </div>

                {/* 5-Card Slick Carousel */}
                <div className="srkr-programs-carousel-wrapper">
                    {/* key={slidesToShow} forces a clean remount when the breakpoint
                        changes so react-slick re-measures the track from scratch —
                        without it, slick keeps the stale SSR (3-up) slide width and
                        overflows the viewport on mobile. */}
                    <Slider key={slidesToShow} {...sliderSettings}>
                        {programsData.map((program) => (
                            <div key={program.id} className="srkr-program-slide-item">
                                <div className={`srkr-program-card ${program.id}`}>
                                    {/* Full-width Top Logo Banner */}
                                    <div className="srkr-program-banner-wrapper">
                                        <img 
                                            src={program.banner} 
                                            alt={`${program.name} Banner`} 
                                            className="srkr-program-banner-img"
                                        />
                                        <span className="srkr-program-year-pill">{program.year}</span>
                                    </div>

                                    {/* Card Content Body */}
                                    <div className="srkr-program-card-body">
                                        {program.tagline && (
                                            <span className="srkr-program-tagline">{program.tagline}</span>
                                        )}
                                        <p className="srkr-program-desc">{program.description}</p>

                                        {/* Action Button */}
                                        <div className="srkr-program-card-footer">
                                            <button
                                                type="button"
                                                className="srkr-program-btn"
                                                onClick={() => handleOpenProgram(program)}
                                            >
                                                Explore Syllabus <span>→</span>
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </Slider>
                </div>
            </div>

            {/* In-depth Program & Syllabus Modal */}
            <ProgramDetailModal
                program={selectedProgram}
                isOpen={isModalOpen}
                onClose={handleCloseProgram}
            />
        </section>
    );
};

export default Programs;
