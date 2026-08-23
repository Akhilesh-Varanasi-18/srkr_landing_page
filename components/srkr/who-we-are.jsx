 'use client';
import React, { useEffect, useState } from 'react';
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion';

const gallerySlides = [
	['CEO_sir.JPG', 'Visionary Leadership', 'Guided by industry leaders shaping future-ready talent.'],
	['placements.png', 'Winners Ways', 'Students placed across top product and service companies.'],
	['MOU.JPG', 'Strategic Partnerships', 'Industry tie-ups that open real opportunities for students.'],
	['certifications.JPG', 'Global Certifications', 'Credentials that help students stand out with confidence.'],
	['Industrial_meets.jpg', 'Industry Connect', 'Expert meets, workshops and hackathons brought to campus.'],
	['torii_team.JPG', 'Our Team', 'Mentors powering the transformation from classroom to career.'],
].map(([file, title, caption]) => ({ image: `/assets/images/srkr/project-images/about_torii/${file}`, title, caption }));

export default function WhoWeAre() {
	const [activeSlide, setActiveSlide] = useState(0);
	const [isPaused, setIsPaused] = useState(false);
	const reduceMotion = useReducedMotion();

	useEffect(() => {
		if (isPaused || reduceMotion) return undefined;
		const timer = window.setInterval(() => setActiveSlide((current) => (current + 1) % gallerySlides.length), 3500);
		return () => window.clearInterval(timer);
	}, [isPaused, reduceMotion]);

	const getOffset = (index) => {
		let offset = index - activeSlide;
		if (offset > gallerySlides.length / 2) offset -= gallerySlides.length;
		if (offset < -gallerySlides.length / 2) offset += gallerySlides.length;
		return offset;
	};

	const moveSlide = (direction) => {
		setActiveSlide((current) => (current + direction + gallerySlides.length) % gallerySlides.length);
	};

	return (
		<section id="who-we-are" className="srkr-hero">
			<div className="srkr-hero-container">
				<div className="srkr-hero-content">
					<img className="srkr-stepin-logo" src="/assets/images/srkr/project-images/about_torii/stepin_rotate_light.gif" alt="Step In" />
					<h1>Your Gateway to<br /><span>Tech Excellence</span></h1>
					<p>ToriiMinds is a comprehensive tech education platform designed to transform engineering students into industry-ready professionals. Through our structured programs, we bridge the gap between academic learning and real-world skills, empowering students from first year through graduation with coding, AI, and career-readiness training.</p>
					<div className="srkr-hero-cta">
						<a href="#programs" className="srkr-btn-primary">Explore Programs →</a>
						<a href="#contact" className="srkr-btn-outline">Get in Touch</a>
					</div>
				</div>
				<div className="srkr-hero-visual" onMouseEnter={() => setIsPaused(true)} onMouseLeave={() => setIsPaused(false)} onFocus={() => setIsPaused(true)} onBlur={(event) => { if (!event.currentTarget.contains(event.relatedTarget)) setIsPaused(false); }}>
					<div className="srkr-gallery-heading" aria-live="polite"><AnimatePresence mode="wait" initial={false}><motion.strong key={gallerySlides[activeSlide].title} initial={reduceMotion ? false : { opacity: 0, y: 34, scale: 0.82 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={reduceMotion ? undefined : { opacity: 0, y: -12 }} transition={reduceMotion ? { duration: 0 } : { type: 'spring', stiffness: 280, damping: 16 }}>{gallerySlides[activeSlide].title}</motion.strong></AnimatePresence></div>
					<div className="srkr-gallery-stage-wrapper">
						<div className="srkr-gallery-stage">
							{gallerySlides.map((slide, index) => { const offset = getOffset(index); const distance = Math.abs(offset); const visible = distance <= 2; return <motion.button type="button" key={slide.image} className={`srkr-gallery-card ${index === activeSlide ? 'is-active' : ''}`} aria-label={`Show ${slide.title}`} onClick={() => setActiveSlide(index)} initial={false} animate={reduceMotion ? { opacity: index === activeSlide ? 1 : 0, x: 0, z: 0, rotateY: 0, scale: index === activeSlide ? 1 : 0.9 } : { opacity: visible ? 1 - distance * 0.22 : 0, x: `${offset * 39}%`, z: -distance * 125, rotateY: offset * -38, scale: 1 - distance * 0.1 }} transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }} style={{ zIndex: 10 - distance, pointerEvents: visible ? 'auto' : 'none' }}><img src={slide.image} alt={slide.title} /><span className="srkr-gallery-scrim" /><span className="srkr-gallery-description"><small>TORII MINDS</small><strong>{slide.title}</strong><span>{slide.caption}</span></span></motion.button>; })}
						</div>
						<div className="srkr-gallery-arrows">
							<button type="button" className="srkr-gallery-arrow srkr-gallery-arrow-prev" aria-label="Previous gallery image" onClick={(e) => { e.stopPropagation(); moveSlide(-1); }}>‹</button>
							<button type="button" className="srkr-gallery-arrow srkr-gallery-arrow-next" aria-label="Next gallery image" onClick={(e) => { e.stopPropagation(); moveSlide(1); }}>›</button>
						</div>
					</div>
					<div className="srkr-gallery-dots" role="tablist" aria-label="Gallery slides">{gallerySlides.map((slide, index) => <button type="button" role="tab" key={slide.image} className={index === activeSlide ? 'is-active' : ''} aria-label={`Show ${slide.title}`} aria-selected={index === activeSlide} onClick={() => setActiveSlide(index)} />)}</div>
				</div>
			</div>
		</section>
	);
}
