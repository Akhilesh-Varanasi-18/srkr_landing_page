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
        programName: 'Bamboo Coder',
        code: 'BMB-100',
        badge: 'Foundation Track',
        color: 'var(--srkr-primary)',
        bgColor: 'var(--srkr-bg-coral-tint)',
        borderColor: 'rgba(226, 84, 76, 0.3)',
        description: 'Comprehensive C programming, computational problem solving, data flow & modular coding logic.'
    },
    '2029': {
        yearLabel: '2nd Year (2025 – 2029)',
        programName: 'SkillUp Coder',
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
        code: 'AIR-300',
        badge: 'Industry Specialization',
        color: 'var(--srkr-primary)',
        bgColor: 'var(--srkr-bg-coral-tint)',
        borderColor: 'rgba(226, 84, 76, 0.3)',
        description: 'Full Stack MERN + Generative AI, Flutter Mobile SDK, AWS Cloud & ServiceNow Enterprise Platforms.'
    }
};

// Shared props for the clean line-icon set
const ico = { viewBox: '0 0 24 24', fill: 'none', stroke: 'currentColor', strokeWidth: 1.9, strokeLinecap: 'round', strokeLinejoin: 'round' };

const GENDER_OPTIONS = [
    {
        value: 'Male', label: 'Male',
        icon: (<svg {...ico}><circle cx="10" cy="14" r="5" /><path d="M15 9l5-5m0 0h-4m4 0v4" /></svg>)
    },
    {
        value: 'Female', label: 'Female',
        icon: (<svg {...ico}><circle cx="12" cy="8" r="5" /><path d="M12 13v8M9 18h6" /></svg>)
    }
];

const RESIDENCE_OPTIONS = [
    {
        value: 'Hosteler', label: 'Hosteler',
        icon: (<svg {...ico}><path d="M3 21h18M6 21V4h12v17M9.5 8h.01M14.5 8h.01M9.5 12h.01M14.5 12h.01M11 21v-4h2v4" /></svg>)
    },
    {
        value: 'Day Scholar', label: 'Day Scholar',
        icon: (<svg {...ico}><path d="M3 10.5 12 3l9 7.5M5 9.5V21h14V9.5M10 21v-6h4v6" /></svg>)
    }
];

const RegistrationModal = ({ isOpen, onClose }) => {
    const [formData, setFormData] = useState({
        fullName: '',
        rollNumber: '',
        collegeEmail: '',
        mobileNumber: '',
        branch: '',
        gender: '',
        residenceType: '',
        passoutYear: '2028',
    });

    const [errors, setErrors] = useState({});
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isSuccess, setIsSuccess] = useState(false);
    const [regId, setRegId] = useState('');

    // Reset transient state when the modal closes
    useEffect(() => {
        if (!isOpen) {
            setIsSuccess(false);
            setErrors({});
            setIsSubmitting(false);
        }
    }, [isOpen]);

    if (!isOpen) return null;

    const mappedProgram = PASSOUT_YEAR_PROGRAM_MAP[formData.passoutYear] || PASSOUT_YEAR_PROGRAM_MAP['2028'];

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
        if (errors[name]) setErrors(prev => ({ ...prev, [name]: '' }));
    };

    const selectValue = (name, value) => {
        setFormData(prev => ({ ...prev, [name]: value }));
        if (errors[name]) setErrors(prev => ({ ...prev, [name]: '' }));
    };

    const validateForm = () => {
        const newErrors = {};
        if (!formData.fullName.trim()) newErrors.fullName = 'Please enter your full name';
        if (!formData.rollNumber.trim()) newErrors.rollNumber = 'Please enter your roll number';
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
        if (!formData.branch) newErrors.branch = 'Please select your branch';
        if (!formData.gender) newErrors.gender = 'Please select your gender';
        if (!formData.residenceType) newErrors.residenceType = 'Please select hosteler or day scholar';
        if (!formData.passoutYear) newErrors.passoutYear = 'Please select your passout year';

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        if (!validateForm()) return;
        setIsSubmitting(true);
        setTimeout(() => {
            const randomCode = 'TM-SRKR-' + Math.floor(100000 + Math.random() * 900000);
            setRegId(randomCode);
            setIsSubmitting(false);
            setIsSuccess(true);
        }, 800);
    };

    const renderSegment = (name, options) => (
        <div className={`srkr-reg-segment ${errors[name] ? 'has-error' : ''}`} role="radiogroup">
            {options.map((opt) => (
                <button
                    key={opt.value}
                    type="button"
                    role="radio"
                    aria-checked={formData[name] === opt.value}
                    className={formData[name] === opt.value ? 'active' : ''}
                    onClick={() => selectValue(name, opt.value)}
                >
                    {opt.icon}
                    <span>{opt.label}</span>
                </button>
            ))}
        </div>
    );

    return (
        <div className="srkr-reg-modal-overlay" onClick={(e) => e.stopPropagation()}>
            <div
                className="srkr-reg-modal-container"
                role="dialog"
                aria-modal="true"
                onClick={(e) => e.stopPropagation()}
            >
                <button
                    type="button"
                    className="srkr-reg-modal-close"
                    onClick={onClose}
                    aria-label="Close registration modal"
                >
                    <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round">
                        <path d="M18 6 6 18M6 6l12 12" />
                    </svg>
                </button>

                {!isSuccess ? (
                    <>
                        {/* Header */}
                        <div className="srkr-reg-modal-header">
                            <div className="srkr-reg-header-badge">
                                <svg viewBox="0 0 24 24" width="12" height="12" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                    <path d="M22 10 12 5 2 10l10 5 10-5Z" />
                                    <path d="M6 12v5c0 1 2.7 2.5 6 2.5s6-1.5 6-2.5v-5" />
                                </svg>
                                <span>SRKR × ToriiMinds Student Portal</span>
                            </div>
                            <h2>Register for <span>Torii Programs</span></h2>
                        </div>

                        {/* Form */}
                        <form onSubmit={handleSubmit} className="srkr-reg-form" noValidate>
                            {/* Row 1: Full Name & Roll Number */}
                            <div className="srkr-reg-row-2">
                                <div className="srkr-reg-field">
                                    <label htmlFor="fullName">Student Full Name <span className="required">*</span></label>
                                    <div className="srkr-reg-input-wrap">
                                        <span className="srkr-reg-input-icon">
                                            <svg {...ico}><path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2" /><circle cx="12" cy="7" r="4" /></svg>
                                        </span>
                                        <input
                                            type="text" id="fullName" name="fullName"
                                            placeholder="Enter your full name"
                                            value={formData.fullName} onChange={handleChange}
                                            className={errors.fullName ? 'has-error' : ''}
                                        />
                                    </div>
                                    {errors.fullName && <span className="srkr-reg-error">{errors.fullName}</span>}
                                </div>

                                <div className="srkr-reg-field">
                                    <label htmlFor="rollNumber">Roll Number / Reg. ID <span className="required">*</span></label>
                                    <div className="srkr-reg-input-wrap">
                                        <span className="srkr-reg-input-icon">
                                            <svg {...ico}><rect x="3" y="4" width="18" height="16" rx="2" /><circle cx="9" cy="10" r="2" /><path d="M15 9h3M15 13h3M7 16h10" /></svg>
                                        </span>
                                        <input
                                            type="text" id="rollNumber" name="rollNumber"
                                            placeholder="Enter roll number"
                                            value={formData.rollNumber} onChange={handleChange}
                                            className={errors.rollNumber ? 'has-error' : ''}
                                        />
                                    </div>
                                    {errors.rollNumber && <span className="srkr-reg-error">{errors.rollNumber}</span>}
                                </div>
                            </div>

                            {/* Row 2: College Email & Mobile Number */}
                            <div className="srkr-reg-row-2">
                                <div className="srkr-reg-field">
                                    <label htmlFor="collegeEmail">College / Institutional Email ID <span className="required">*</span></label>
                                    <div className="srkr-reg-input-wrap">
                                        <span className="srkr-reg-input-icon">
                                            <svg {...ico}><rect x="3" y="5" width="18" height="14" rx="2" /><path d="m3 7 9 6 9-6" /></svg>
                                        </span>
                                        <input
                                            type="email" id="collegeEmail" name="collegeEmail"
                                            placeholder="Enter college email ID"
                                            value={formData.collegeEmail} onChange={handleChange}
                                            className={errors.collegeEmail ? 'has-error' : ''}
                                        />
                                    </div>
                                    {errors.collegeEmail && <span className="srkr-reg-error">{errors.collegeEmail}</span>}
                                </div>

                                <div className="srkr-reg-field">
                                    <label htmlFor="mobileNumber">WhatsApp / Mobile Number <span className="required">*</span></label>
                                    <div className="srkr-reg-input-wrap has-prefix">
                                        <span className="srkr-reg-input-prefix">+91</span>
                                        <input
                                            type="tel" id="mobileNumber" name="mobileNumber"
                                            placeholder="9876543210"
                                            value={formData.mobileNumber} onChange={handleChange}
                                            className={errors.mobileNumber ? 'has-error' : ''}
                                            maxLength="10"
                                        />
                                    </div>
                                    {errors.mobileNumber && <span className="srkr-reg-error">{errors.mobileNumber}</span>}
                                </div>
                            </div>

                            {/* Row 3: Branch */}
                            <div className="srkr-reg-field">
                                <label htmlFor="branch">Engineering Branch / Department <span className="required">*</span></label>
                                <div className="srkr-reg-input-wrap">
                                    <span className="srkr-reg-input-icon">
                                        <svg {...ico}><path d="M3 21h18M5 21V6l7-3 7 3v15" /><path d="M9 9h.01M9 13h.01M15 9h.01M15 13h.01M10 21v-4h4v4" /></svg>
                                    </span>
                                    <select
                                        id="branch" name="branch"
                                        value={formData.branch} onChange={handleChange}
                                        className={errors.branch ? 'has-error' : ''}
                                    >
                                        <option value="">Select your branch...</option>
                                        {BRANCH_OPTIONS.map((b, i) => (<option key={i} value={b}>{b}</option>))}
                                    </select>
                                </div>
                                {errors.branch && <span className="srkr-reg-error">{errors.branch}</span>}
                            </div>

                            {/* Row 4: Gender & Residence Type */}
                            <div className="srkr-reg-row-2">
                                <div className="srkr-reg-field">
                                    <label>Gender <span className="required">*</span></label>
                                    {renderSegment('gender', GENDER_OPTIONS)}
                                    {errors.gender && <span className="srkr-reg-error">{errors.gender}</span>}
                                </div>

                                <div className="srkr-reg-field">
                                    <label>Residence <span className="required">*</span></label>
                                    {renderSegment('residenceType', RESIDENCE_OPTIONS)}
                                    {errors.residenceType && <span className="srkr-reg-error">{errors.residenceType}</span>}
                                </div>
                            </div>

                            {/* Row 5: Passout Year */}
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
                                                style={isSelected ? { '--year-accent': yearInfo.color } : undefined}
                                                onClick={() => selectValue('passoutYear', year)}
                                            >
                                                <div className="srkr-reg-year-radio">
                                                    <span className={`srkr-radio-dot ${isSelected ? 'checked' : ''}`} />
                                                    <strong>Class of {year}</strong>
                                                </div>
                                                <span className="srkr-reg-year-mapped" style={{ color: yearInfo.color }}>
                                                    {yearInfo.programName}
                                                </span>
                                            </button>
                                        );
                                    })}
                                </div>
                                {errors.passoutYear && <span className="srkr-reg-error">{errors.passoutYear}</span>}
                            </div>

                            {/* Mapped program live preview */}
                            <div
                                className="srkr-reg-program-preview"
                                style={{ backgroundColor: mappedProgram.bgColor, borderColor: mappedProgram.borderColor }}
                            >
                                <div className="srkr-reg-program-preview-header">
                                    <div className="srkr-reg-program-icon-box" style={{ color: mappedProgram.color }}>
                                        <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round">
                                            <path d="M22 10 12 5 2 10l10 5 10-5Z" />
                                            <path d="M6 12v5c0 1 2.7 2.5 6 2.5s6-1.5 6-2.5v-5" />
                                            <path d="M22 10v6" />
                                        </svg>
                                    </div>
                                    <div className="srkr-reg-program-details">
                                        <div className="srkr-reg-program-tags">
                                            <span className="srkr-reg-tag-code">{mappedProgram.code}</span>
                                            <span className="srkr-reg-tag-badge" style={{ color: mappedProgram.color }}>{mappedProgram.badge}</span>
                                            <span className="srkr-reg-tag-year">{mappedProgram.yearLabel}</span>
                                        </div>
                                        <h4 className="srkr-reg-program-title">
                                            Assigned Program: <strong style={{ color: mappedProgram.color }}>{mappedProgram.programName}</strong>
                                        </h4>
                                    </div>
                                </div>
                                <p className="srkr-reg-program-desc">{mappedProgram.description}</p>
                            </div>

                            {/* Submit */}
                            <div className="srkr-reg-submit-wrap">
                                <button type="submit" className="srkr-reg-submit-btn" disabled={isSubmitting}>
                                    {isSubmitting ? (
                                        <>
                                            <span className="srkr-reg-spinner" />
                                            <span>Processing Registration...</span>
                                        </>
                                    ) : (
                                        <>
                                            <span>Complete Registration</span>
                                            <svg viewBox="0 0 24 24" width="17" height="17" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                                                <path d="M5 12h14M13 6l6 6-6 6" />
                                            </svg>
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
                            <svg className="srkr-reg-success-icon" viewBox="0 0 24 24" width="34" height="34" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                                <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
                                <path d="m9 11 3 3L22 4" />
                            </svg>
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
                            <div className="srkr-reg-success-row"><span>Roll Number</span><strong>{formData.rollNumber}</strong></div>
                            <div className="srkr-reg-success-row"><span>Branch</span><strong>{formData.branch}</strong></div>
                            <div className="srkr-reg-success-row"><span>Gender</span><strong>{formData.gender}</strong></div>
                            <div className="srkr-reg-success-row"><span>Residence</span><strong>{formData.residenceType}</strong></div>
                            <div className="srkr-reg-success-row"><span>Passout Year</span><strong>{formData.passoutYear}</strong></div>
                            <div className="srkr-reg-success-row"><span>Assigned Program</span><strong>{mappedProgram.programName}</strong></div>
                        </div>

                        <div className="srkr-reg-success-actions">
                            <a
                                href="https://chat.whatsapp.com/YOUR_INVITE_LINK"
                                target="_blank" rel="noopener noreferrer"
                                className="srkr-btn-whatsapp-join"
                            >
                                <svg viewBox="0 0 24 24" fill="currentColor" width="18" height="18">
                                    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
                                </svg>
                                <span>Join Official WhatsApp Community</span>
                            </a>

                            <button type="button" className="srkr-btn-done" onClick={onClose}>Done</button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default RegistrationModal;
