'use client'
import React, { useState, useEffect } from 'react';

const BRANCH_OPTIONS = [
    'Computer Science & Engineering (CSE)',
    'Information Technology (IT)',
    'Computer Science & Business Systems (CSBS)',
    'Artificial Intelligence & Data Science (AI&DS)',
    'Artificial Intelligence & Machine Learning (AIML)',
    'Electronics & Communication Engineering (ECE)',
    'Electrical & Electronics Engineering (EEE)',
    'Mechanical Engineering (MECH)',
    'Civil Engineering (CIVIL)',
    'Other / Emerging Branch'
];

const PASSOUT_YEAR_PROGRAM_MAP = {
    '2030': {
        yearLabel: '1st Year (2026 – 2030)',
        programName: 'Ignite Coder',
        icon: '🔥',
        code: 'IGN-100',
        badge: 'Foundation Track',
        color: 'var(--srkr-primary)',
        bgColor: 'var(--srkr-bg-coral-tint)',
        borderColor: 'rgba(226, 84, 76, 0.3)',
        description: 'Comprehensive C programming, computational problem solving, data flow & modular coding logic.'
    },
    '2029': {
        yearLabel: '2nd Year (2025 – 2029)',
        programName: 'SkillUp Coder',
        icon: '📈',
        code: 'SKL-200',
        badge: 'Core Problem Solving',
        color: 'var(--srkr-secondary)',
        bgColor: 'var(--srkr-bg-warm-tint)',
        borderColor: 'rgba(237, 114, 54, 0.3)',
        description: 'Data Structures, Algorithms, LeetCode patterns, and intermediate coding interview preparation.'
    },
    '2028': {
        yearLabel: '3rd Year (2024 – 2028)',
        programName: 'AI Ready Engineers',
        icon: '🤖',
        code: 'AIR-300',
        badge: 'Industry Specialization',
        color: 'var(--srkr-primary)',
        bgColor: 'var(--srkr-bg-coral-tint)',
        borderColor: 'rgba(226, 84, 76, 0.3)',
        description: 'Full Stack MERN + Generative AI, Flutter Mobile SDK, AWS Cloud & ServiceNow Enterprise Platforms.'
    }
};

const RegistrationModal = ({ isOpen, onClose }) => {
    const [formData, setFormData] = useState({
        fullName: '',
        rollNumber: '',
        collegeEmail: '',
        mobileNumber: '',
        branch: '',
        passoutYear: '2028',
    });

    const [errors, setErrors] = useState({});
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isSuccess, setIsSuccess] = useState(false);
    const [regId, setRegId] = useState('');

    // Reset form state when modal closes
    useEffect(() => {
        if (!isOpen) {
            setIsSuccess(false);
            setErrors({});
            setIsSubmitting(false);
        }
    }, [isOpen]);

    // Handle ESC key (or prevent closing on empty space)
    useEffect(() => {
        const handleKeyDown = (e) => {
            if (e.key === 'Escape' && isOpen) {
                // Keep modal open unless close button is clicked, per user specification
            }
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [isOpen]);

    if (!isOpen) return null;

    const mappedProgram = PASSOUT_YEAR_PROGRAM_MAP[formData.passoutYear] || PASSOUT_YEAR_PROGRAM_MAP['2028'];

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
        if (errors[name]) {
            setErrors(prev => ({ ...prev, [name]: '' }));
        }
    };

    const validateForm = () => {
        const newErrors = {};

        if (!formData.fullName.trim()) {
            newErrors.fullName = 'Please enter your full name';
        }

        if (!formData.rollNumber.trim()) {
            newErrors.rollNumber = 'Please enter your roll number';
        }

        if (!formData.collegeEmail.trim()) {
            newErrors.collegeEmail = 'Please enter your college email ID';
        } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.collegeEmail.trim())) {
            newErrors.collegeEmail = 'Please enter a valid email address';
        }

        if (!formData.mobileNumber.trim()) {
            newErrors.mobileNumber = 'Please enter your mobile number';
        } else if (!/^\d{10}$/.test(formData.mobileNumber.replace(/[\s-+]/g, ''))) {
            newErrors.mobileNumber = 'Please enter a valid 10-digit mobile number';
        }

        if (!formData.branch) {
            newErrors.branch = 'Please select your branch';
        }

        if (!formData.passoutYear) {
            newErrors.passoutYear = 'Please select your passout year';
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        if (!validateForm()) return;

        setIsSubmitting(true);

        // Simulate seamless submission & generate registration reference ID
        setTimeout(() => {
            const randomCode = 'TM-SRKR-' + Math.floor(100000 + Math.random() * 900000);
            setRegId(randomCode);
            setIsSubmitting(false);
            setIsSuccess(true);
        }, 800);
    };

    return (
        <div 
            className="srkr-reg-modal-overlay"
            // Note: Click on backdrop intentionally does NOT close the modal per requirement
            onClick={(e) => e.stopPropagation()}
        >
            <div 
                className="srkr-reg-modal-container"
                role="dialog" 
                aria-modal="true"
                onClick={(e) => e.stopPropagation()}
            >
                {/* Close Button — Modal only closes when clicked */}
                <button 
                    type="button" 
                    className="srkr-reg-modal-close"
                    onClick={onClose}
                    aria-label="Close registration modal"
                >
                    ✕
                </button>

                {!isSuccess ? (
                    <>
                        {/* Header */}
                        <div className="srkr-reg-modal-header">
                            <div className="srkr-reg-header-badge">
                                <span>🎓 SRKR × ToriiMinds Student Portal</span>
                            </div>
                            <h2>Register for <span>Torii Programs</span></h2>
                        </div>

                        {/* Form */}
                        <form onSubmit={handleSubmit} className="srkr-reg-form" noValidate>
                            {/* Row 1: Full Name & Roll Number */}
                            <div className="srkr-reg-row-2">
                                <div className="srkr-reg-field">
                                    <label htmlFor="fullName">
                                        Student Full Name <span className="required">*</span>
                                    </label>
                                    <div className="srkr-reg-input-wrap">
                                        <span className="srkr-reg-input-icon">👤</span>
                                        <input
                                            type="text"
                                            id="fullName"
                                            name="fullName"
                                            placeholder="Enter your full name"
                                            value={formData.fullName}
                                            onChange={handleChange}
                                            className={errors.fullName ? 'has-error' : ''}
                                        />
                                    </div>
                                    {errors.fullName && <span className="srkr-reg-error">{errors.fullName}</span>}
                                </div>

                                <div className="srkr-reg-field">
                                    <label htmlFor="rollNumber">
                                        Roll Number / Reg. ID <span className="required">*</span>
                                    </label>
                                    <div className="srkr-reg-input-wrap">
                                        <span className="srkr-reg-input-icon">🆔</span>
                                        <input
                                            type="text"
                                            id="rollNumber"
                                            name="rollNumber"
                                            placeholder="Enter roll number"
                                            value={formData.rollNumber}
                                            onChange={handleChange}
                                            className={errors.rollNumber ? 'has-error' : ''}
                                        />
                                    </div>
                                    {errors.rollNumber && <span className="srkr-reg-error">{errors.rollNumber}</span>}
                                </div>
                            </div>

                            {/* Row 2: College Email & Mobile Number */}
                            <div className="srkr-reg-row-2">
                                <div className="srkr-reg-field">
                                    <label htmlFor="collegeEmail">
                                        College / Institutional Email ID <span className="required">*</span>
                                    </label>
                                    <div className="srkr-reg-input-wrap">
                                        <span className="srkr-reg-input-icon">✉️</span>
                                        <input
                                            type="email"
                                            id="collegeEmail"
                                            name="collegeEmail"
                                            placeholder="Enter college email ID"
                                            value={formData.collegeEmail}
                                            onChange={handleChange}
                                            className={errors.collegeEmail ? 'has-error' : ''}
                                        />
                                    </div>
                                    {errors.collegeEmail && <span className="srkr-reg-error">{errors.collegeEmail}</span>}
                                </div>

                                <div className="srkr-reg-field">
                                    <label htmlFor="mobileNumber">
                                        WhatsApp / Mobile Number <span className="required">*</span>
                                    </label>
                                    <div className="srkr-reg-input-wrap">
                                        <span className="srkr-reg-input-prefix">+91</span>
                                        <input
                                            type="tel"
                                            id="mobileNumber"
                                            name="mobileNumber"
                                            placeholder="9876543210"
                                            value={formData.mobileNumber}
                                            onChange={handleChange}
                                            className={errors.mobileNumber ? 'has-error' : ''}
                                            maxLength="10"
                                        />
                                    </div>
                                    {errors.mobileNumber && <span className="srkr-reg-error">{errors.mobileNumber}</span>}
                                </div>
                            </div>

                            {/* Row 3: Branch Selection */}
                            <div className="srkr-reg-field">
                                <label htmlFor="branch">
                                    Engineering Branch / Department <span className="required">*</span>
                                </label>
                                <div className="srkr-reg-input-wrap">
                                    <span className="srkr-reg-input-icon">🏛️</span>
                                    <select
                                        id="branch"
                                        name="branch"
                                        value={formData.branch}
                                        onChange={handleChange}
                                        className={errors.branch ? 'has-error' : ''}
                                    >
                                        <option value="">Select your branch...</option>
                                        {BRANCH_OPTIONS.map((b, i) => (
                                            <option key={i} value={b}>{b}</option>
                                        ))}
                                    </select>
                                </div>
                                {errors.branch && <span className="srkr-reg-error">{errors.branch}</span>}
                            </div>

                            {/* Row 4: Passout Year Selection */}
                            <div className="srkr-reg-field">
                                <label>
                                    Passout Year <span className="required">*</span>
                                    <small className="srkr-reg-hint"> (Automatically maps your designated curriculum)</small>
                                </label>
                                <div className="srkr-reg-year-grid">
                                    {['2030', '2029', '2028'].map((year) => {
                                        const isSelected = formData.passoutYear === year;
                                        const yearInfo = PASSOUT_YEAR_PROGRAM_MAP[year];
                                        return (
                                            <button
                                                key={year}
                                                type="button"
                                                className={`srkr-reg-year-card ${isSelected ? 'active' : ''}`}
                                                onClick={() => {
                                                    setFormData(prev => ({ ...prev, passoutYear: year }));
                                                    if (errors.passoutYear) setErrors(prev => ({ ...prev, passoutYear: '' }));
                                                }}
                                            >
                                                <div className="srkr-reg-year-radio">
                                                    <span className={`srkr-radio-dot ${isSelected ? 'checked' : ''}`} />
                                                    <strong>Class of {year}</strong>
                                                </div>
                                                <span className="srkr-reg-year-mapped">
                                                    {yearInfo.icon} {yearInfo.programName}
                                                </span>
                                            </button>
                                        );
                                    })}
                                </div>
                                {errors.passoutYear && <span className="srkr-reg-error">{errors.passoutYear}</span>}
                            </div>

                            {/* MAPPED PROGRAM LIVE PREVIEW CARD */}
                            <div 
                                className="srkr-reg-program-preview"
                                style={{
                                    backgroundColor: mappedProgram.bgColor,
                                    borderColor: mappedProgram.borderColor
                                }}
                            >
                                <div className="srkr-reg-program-preview-header">
                                    <div className="srkr-reg-program-icon-box">
                                        {mappedProgram.icon}
                                    </div>
                                    <div className="srkr-reg-program-details">
                                        <div className="srkr-reg-program-tags">
                                            <span className="srkr-reg-tag-code">{mappedProgram.code}</span>
                                            <span className="srkr-reg-tag-badge">{mappedProgram.badge}</span>
                                            <span className="srkr-reg-tag-year">{mappedProgram.yearLabel}</span>
                                        </div>
                                        <h4 className="srkr-reg-program-title">
                                            Assigned Program: <strong>{mappedProgram.programName}</strong>
                                        </h4>
                                    </div>
                                </div>
                                <p className="srkr-reg-program-desc">
                                    {mappedProgram.description}
                                </p>
                            </div>

                            {/* Form Submit CTA */}
                            <div className="srkr-reg-submit-wrap">
                                <button 
                                    type="submit" 
                                    className="srkr-reg-submit-btn"
                                    disabled={isSubmitting}
                                >
                                    {isSubmitting ? (
                                        <>
                                            <span className="srkr-reg-spinner" />
                                            <span>Processing Registration...</span>
                                        </>
                                    ) : (
                                        <>
                                            <span>Complete Registration →</span>
                                        </>
                                    )}
                                </button>
                            </div>
                        </form>
                    </>
                ) : (
                    /* SUCCESS STATE */
                    <div className="srkr-reg-success-card">
                        <div className="srkr-reg-success-icon-wrap">
                            <span className="srkr-reg-success-icon">🎉</span>
                        </div>

                        <h3>Registration Successful!</h3>
                        <p className="srkr-reg-success-sub">
                            Welcome aboard, <strong>{formData.fullName}</strong>! You have been successfully registered for the <strong>{mappedProgram.programName} ({mappedProgram.code})</strong> track at SRKR.
                        </p>

                        <div className="srkr-reg-id-box">
                            <small>Your Registration ID</small>
                            <strong>{regId}</strong>
                        </div>

                        <div className="srkr-reg-success-details">
                            <div className="srkr-reg-success-row">
                                <span>Roll Number:</span>
                                <strong>{formData.rollNumber}</strong>
                            </div>
                            <div className="srkr-reg-success-row">
                                <span>Branch:</span>
                                <strong>{formData.branch}</strong>
                            </div>
                            <div className="srkr-reg-success-row">
                                <span>Passout Year:</span>
                                <strong>{formData.passoutYear}</strong>
                            </div>
                            <div className="srkr-reg-success-row">
                                <span>Assigned Program:</span>
                                <strong>{mappedProgram.icon} {mappedProgram.programName}</strong>
                            </div>
                        </div>

                        <div className="srkr-reg-success-actions">
                            <a
                                href="https://chat.whatsapp.com/YOUR_INVITE_LINK"
                                target="_blank"
                                rel="noopener noreferrer"
                                className="srkr-btn-whatsapp-join"
                            >
                                <svg viewBox="0 0 24 24" fill="currentColor" width="18" height="18">
                                    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
                                </svg>
                                <span>Join Official WhatsApp Community</span>
                            </a>

                            <button 
                                type="button" 
                                className="srkr-btn-done"
                                onClick={onClose}
                            >
                                Done
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default RegistrationModal;

