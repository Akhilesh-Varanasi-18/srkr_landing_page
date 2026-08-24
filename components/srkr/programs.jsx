'use client'
import React, { useState } from 'react';
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

const Programs = () => {
    const [selectedProgram, setSelectedProgram] = useState(null);
    const [isModalOpen, setIsModalOpen] = useState(false);

    const handleOpenProgram = (program) => {
        setSelectedProgram(program);
        setIsModalOpen(true);
    };

    const handleCloseProgram = () => {
        setIsModalOpen(false);
        setSelectedProgram(null);
    };

    // Slick Carousel settings
    const sliderSettings = {
        dots: false,
        infinite: true,
        speed: 500,
        slidesToShow: 3,
        slidesToScroll: 1,
        autoplay: true,
        autoplaySpeed: 4000,
        pauseOnHover: true,
        pauseOnFocus: true,
        swipe: true,
        swipeToSlide: true,
        touchThreshold: 10,
        prevArrow: <PrevArrow />,
        nextArrow: <NextArrow />,
        responsive: [
            {
                breakpoint: 1199,
                settings: {
                    slidesToShow: 2,
                    slidesToScroll: 1,
                }
            },
            {
                breakpoint: 850,
                settings: {
                    slidesToShow: 1,
                    slidesToScroll: 1,
                    arrows: true,
                }
            },
            {
                breakpoint: 600,
                settings: {
                    slidesToShow: 1,
                    slidesToScroll: 1,
                    arrows: false,
                }
            }
        ]
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
                    <Slider {...sliderSettings}>
                        {programsData.map((program) => (
                            <div key={program.id} className="srkr-program-slide-item">
                                <div className={`srkr-program-card ${program.id}`}>
                                    {/* Card Top / Header */}
                                    <div className="srkr-program-card-header">
                                        <div 
                                            className="srkr-program-icon" 
                                            style={{ background: program.accentBg }}
                                        >
                                            {program.icon}
                                        </div>
                                        <span className="srkr-program-year">{program.year}</span>
                                    </div>

                                    {/* Card Content */}
                                    <h3 className="srkr-program-name">{program.name}</h3>
                                    <span className="srkr-program-tagline">{program.tagline}</span>
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
