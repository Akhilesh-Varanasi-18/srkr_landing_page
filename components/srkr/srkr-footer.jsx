'use client';
import React from 'react';

const SrkrFooter = () => {
  const scrollToTop = (e) => {
    e.preventDefault();
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const navLinks = [
    { label: 'Who We Are', href: '#who-we-are' },
    { label: 'Programs', href: '#programs' },
    { label: 'Courses', href: '#courses' },
    { label: 'Team', href: '#team' },
  ];

  return (
    <footer className="srkr-footer">
      <div className="srkr-footer-container">
        {/* Main Header / Top Row */}
        <div className="srkr-footer-main">
          {/* Brand & Tagline */}
          <div className="srkr-footer-brand">
            <a href="https://toriiminds.com/" target="_blank" rel="noopener noreferrer" className="srkr-footer-logo-link">
              <img 
                src="/assets/images/srkr/project-images/torii-dark-text.svg" 
                alt="Torii" 
                className="srkr-footer-logo"
              />
            </a>
            <p className="srkr-footer-tagline">
              Empowering engineers through hands-on industry tracks and modern tech curriculum.
            </p>
          </div>

          {/* Contact Badges */}
          <div className="srkr-footer-contacts">
            <a href="tel:+919972658909" className="srkr-footer-contact-item">
              <span className="srkr-footer-icon-bubble">
                <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z" />
                </svg>
              </span>
              <span className="srkr-footer-contact-text">
                <small>Call Us</small>
                <strong>+91 99726 58909</strong>
              </span>
            </a>

            <a href="mailto:support@toriiminds.com" className="srkr-footer-contact-item">
              <span className="srkr-footer-icon-bubble">
                <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <rect width="20" height="16" x="2" y="4" rx="2" />
                  <path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7" />
                </svg>
              </span>
              <span className="srkr-footer-contact-text">
                <small>Email Us</small>
                <strong>support@toriiminds.com</strong>
              </span>
            </a>

            <a href="https://toriiminds.com/" target="_blank" rel="noopener noreferrer" className="srkr-footer-contact-item">
              <span className="srkr-footer-icon-bubble">
                <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="12" cy="12" r="10" />
                  <path d="M12 2a14.5 14.5 0 0 0 0 20 14.5 14.5 0 0 0 0-20" />
                  <path d="M2 12h20" />
                </svg>
              </span>
              <span className="srkr-footer-contact-text">
                <small>Visit Us</small>
                <strong>toriiminds.com</strong>
              </span>
            </a>
          </div>

          {/* Social Media Links */}
          <div className="srkr-footer-socials">
            <span className="srkr-footer-socials-label">Connect With Us</span>
            <div className="srkr-footer-social-icons">
              {/* LinkedIn */}
              <a 
                href="https://www.linkedin.com/company/toriiminds/posts/" 
                target="_blank" 
                rel="noopener noreferrer" 
                className="srkr-social-btn linkedin"
                aria-label="ToriiMinds LinkedIn"
              >
                <svg viewBox="0 0 24 24" width="15" height="15" fill="currentColor">
                  <path d="M19 3a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h14m-.5 15.5v-5.3a3.26 3.26 0 0 0-3.26-3.26c-.85 0-1.84.52-2.28 1.3v-1.11h-2.79v8.37h2.79v-4.93c0-.77.62-1.4 1.39-1.4a1.4 1.4 0 0 1 1.4 1.4v4.93h2.75M6.46 10.9v8.37H9.2V10.9H6.46M7.83 6.64a1.5 1.5 0 0 0-1.5 1.5 1.5 1.5 0 0 0 1.5 1.5 1.5 1.5 0 0 0 1.5-1.5 1.5 1.5 0 0 0-1.5-1.5Z" />
                </svg>
              </a>

              {/* Instagram */}
              <a 
                href="https://www.instagram.com/toriiminds/" 
                target="_blank" 
                rel="noopener noreferrer" 
                className="srkr-social-btn instagram"
                aria-label="ToriiMinds Instagram"
              >
                <svg viewBox="0 0 24 24" width="15" height="15" fill="currentColor">
                  <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z" />
                </svg>
              </a>

              {/* YouTube */}
              <a 
                href="https://www.youtube.com/@toriiminds" 
                target="_blank" 
                rel="noopener noreferrer" 
                className="srkr-social-btn youtube"
                aria-label="ToriiMinds YouTube"
              >
                <svg viewBox="0 0 24 24" width="15" height="15" fill="currentColor">
                  <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z" />
                </svg>
              </a>

              {/* Website */}
              <a 
                href="https://toriiminds.com/" 
                target="_blank" 
                rel="noopener noreferrer" 
                className="srkr-social-btn web"
                aria-label="ToriiMinds Website"
              >
                <svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="12" cy="12" r="10" />
                  <line x1="2" x2="22" y1="12" y2="12" />
                  <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" />
                </svg>
              </a>
            </div>
          </div>
        </div>

        {/* Bottom Sub-Bar */}
        <div className="srkr-footer-bottom-bar">
          <div className="srkr-footer-copyright">
            Copyright © 2026{' '}
            <a href="https://toriiminds.com/" target="_blank" rel="noopener noreferrer">
              Torii
            </a>
            . All Rights Reserved.
          </div>

          <div className="srkr-footer-nav-links">
            {navLinks.map((link) => (
              <a
                key={link.href}
                href={link.href}
                onClick={(e) => {
                  e.preventDefault();
                  document.querySelector(link.href)?.scrollIntoView({ behavior: 'smooth' });
                }}
              >
                {link.label}
              </a>
            ))}
            <button type="button" onClick={scrollToTop} className="srkr-footer-back-to-top">
              Back to Top ↑
            </button>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default SrkrFooter;
