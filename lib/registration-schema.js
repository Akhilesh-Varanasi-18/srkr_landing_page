// Single source of truth for registration data: option lists, the program
// catalogue (which intake is open, what it maps to), and the validation rules.
// Imported by BOTH the client modal and the /api/register route so the two can
// never drift apart. The server always re-runs validateRegistration() —
// client-side checks are only a UX convenience.

import { MOON_CODER_WHATSAPP_URL } from './site-config';

// SRKR B.Tech branches, grouped for the registration dropdown. The Torii programs
// are CSE/IT-first, so those sit in the primary group; the remaining engineering
// branches are offered below for the occasional non-CSE/IT applicant. Each name
// keeps a parenthetical short code that the dashboard axis labels (shortBranch)
// extract. Source: srkrec.ac.in departments (CSE, IT, ECE, EEE, Mechanical, Civil).
export const BRANCH_GROUPS = [
    {
        label: 'Computer Science & IT',
        options: [
            'Computer Science & Engineering (CSE)',
            'Artificial Intelligence & Machine Learning (AIML)',
            'Computer Science & Design (CSD)',
            'CSE - IoT, Cyber Security & Blockchain (CIC)',
            'Information Technology (IT)',
            'Artificial Intelligence & Data Science (AI&DS)',
            'Computer Science & Information Technology (CS&IT)',
            'Computer Science & Business Systems (CSBS)'
        ]
    },
    {
        label: 'Other Engineering Branches',
        options: [
            'Electronics & Communication Engineering (ECE)',
            'Electrical & Electronics Engineering (EEE)',
            'Mechanical Engineering (MECH)',
            'Civil Engineering (CIVIL)'
        ]
    }
];

// Flat list of every valid branch value — the single source the validator and the
// Excel export check against. Derived from the groups so the two never drift.
export const BRANCH_OPTIONS = BRANCH_GROUPS.flatMap((group) => group.options);

/**
 * Resolves a short department code (as the coding-profiles roster stores it:
 * "AIDS", "CSIT", "CSE" …) to the full branch option the form uses. The roster
 * codes drop the ampersand, so "AI&DS" and "AIDS" both resolve.
 */
export function branchOptionForCode(code) {
    const wanted = String(code || '').toUpperCase().replace(/[^A-Z]/g, '');
    if (!wanted) return '';
    return (
        BRANCH_OPTIONS.find((option) => {
            const m = /\(([^)]+)\)/.exec(option);
            return m && m[1].toUpperCase().replace(/[^A-Z]/g, '') === wanted;
        }) || ''
    );
}

export const GENDER_VALUES = ['Male', 'Female'];
export const RESIDENCE_VALUES = ['Hosteler', 'Day Scholar'];
export const LAPTOP_VALUES = ['Yes', 'No'];
// CRT enrolment is no longer collected — field retired per management. Kept here
// (commented) so the whole feature can be restored in one place if needed.
// export const CRT_FEE_VALUES = ['Yes', 'No'];

// ── Program catalogue ───────────────────────────────────────────────────────
//
// Every intake the form has ever offered, in the order the program picker shows
// them. Opening or closing an intake is ONE flag here (`open`) plus the matching
// `registrationsOpen` / `registrationsClosed` flag on the card in
// components/srkr/programs-data.js. The API rejects submissions for a closed
// program, so flipping the flag closes the door server-side too.
//
//   eligibility  'skillup-roster' → only students on the SkillUp Coder coding
//                 roster (the 317 shortlisted) may register; the form makes them
//                 find themselves first and pre-fills from their earlier
//                 SkillUp registration. Anything else (undefined) → open to all.
//   academics     true → Overall CGPA and active-backlog count are mandatory.
//   whatsappGroup { name, url } → the success screen asks the student to join
//                 this program's own WhatsApp group with a highlighted button
//                 (the official community link stays as the secondary action).
//
export const REGISTRATION_PROGRAMS = [
    {
        key: 'mooncoder',
        programName: 'Moon Coder',
        code: 'MOON-200',
        passoutYear: '2029',
        yearLabel: '2nd Year (2025 – 2029)',
        audience: 'Exclusive for 2029 passouts',
        badge: 'Master Problem Solving Track',
        open: true,
        eligibility: 'skillup-roster',
        academics: true,
        whatsappGroup: { name: 'Moon Coder WhatsApp Group', url: MOON_CODER_WHATSAPP_URL },
        color: 'var(--srkr-secondary)',
        bgColor: 'var(--srkr-bg-warm-tint)',
        borderColor: 'rgba(237, 114, 54, 0.3)',
        description:
            'Comprehensive 15-module core problem-solving curriculum — programming fundamentals through Linear Data Structures, Two Pointers and Backtracking — for the SkillUp Coder shortlist.'
    },
    {
        key: 'bamboo',
        programName: 'Bamboo Coder',
        code: 'BMB-100',
        passoutYear: '2030',
        yearLabel: '1st Year (2026 – 2030)',
        audience: '2030 passouts · 1st years',
        badge: 'Foundation Track',
        // 1st-year (2030) intake closed on 2026-10-15 once the post-orientation
        // registrations were complete.
        open: false,
        color: 'var(--srkr-primary)',
        bgColor: 'var(--srkr-bg-coral-tint)',
        borderColor: 'rgba(226, 84, 76, 0.3)',
        description: 'Comprehensive C programming, computational problem solving, data flow & modular coding logic.'
    },
    {
        key: 'skillup',
        programName: 'SkillUp Coder',
        code: 'SKL-200',
        passoutYear: '2029',
        yearLabel: '2nd Year (2025 – 2029)',
        audience: '2029 passouts · 2nd years',
        badge: 'Core Problem Solving',
        open: false,
        color: 'var(--srkr-secondary)',
        bgColor: 'var(--srkr-bg-warm-tint)',
        borderColor: 'rgba(237, 114, 54, 0.3)',
        description: 'Data Structures, Algorithms, LeetCode patterns, and intermediate coding interview preparation.'
    },
    {
        key: 'aiready',
        programName: 'AI Ready Engineers',
        code: 'AIR-300',
        passoutYear: '2028',
        yearLabel: '3rd Year (2024 – 2028)',
        audience: '2028 passouts · 3rd years',
        badge: 'Industry Specialization',
        open: false,
        color: 'var(--srkr-primary)',
        bgColor: 'var(--srkr-bg-coral-tint)',
        borderColor: 'rgba(226, 84, 76, 0.3)',
        description: 'Full Stack MERN + Generative AI, Flutter Mobile SDK, AWS Cloud & ServiceNow Enterprise Platforms.'
    }
];

export const PROGRAM_BY_KEY = Object.fromEntries(REGISTRATION_PROGRAMS.map((p) => [p.key, p]));
export const PROGRAM_BY_CODE = Object.fromEntries(REGISTRATION_PROGRAMS.map((p) => [p.code, p]));
export const OPEN_PROGRAM_KEYS = REGISTRATION_PROGRAMS.filter((p) => p.open).map((p) => p.key);
// What the form starts on: the first open intake, else the first card (closed).
export const DEFAULT_PROGRAM_KEY = OPEN_PROGRAM_KEYS[0] || REGISTRATION_PROGRAMS[0].key;

// ── Passout-year view of the same catalogue (older callers) ────────────────
// The announcements feature and the dashboard still think in passout years, and
// older submissions carried `passoutYear` instead of `programKey`. These are
// derived from the year-based programs above so there is still one source.
const YEAR_PROGRAMS = ['bamboo', 'skillup', 'aiready'].map((key) => PROGRAM_BY_KEY[key]);

export const PASSOUT_YEARS = YEAR_PROGRAMS.map((p) => p.passoutYear);
export const CLOSED_PASSOUT_YEARS = YEAR_PROGRAMS.filter((p) => !p.open).map((p) => p.passoutYear);
export const PASSOUT_YEAR_PROGRAM_MAP = Object.fromEntries(
    YEAR_PROGRAMS.map((p) => [
        p.passoutYear,
        {
            yearLabel: p.yearLabel,
            programName: p.programName,
            code: p.code,
            badge: p.badge,
            color: p.color,
            bgColor: p.bgColor,
            borderColor: p.borderColor,
            description: p.description
        }
    ])
);
const PROGRAM_KEY_BY_YEAR = Object.fromEntries(YEAR_PROGRAMS.map((p) => [p.passoutYear, p.key]));

export const FIELD_LIMITS = {
    fullName: 60,
    rollNumber: 15,
    collegeEmail: 120,
    mobileNumber: 10,
    // "10.00" is the longest sensible CGPA; backlogs are a small whole number.
    cgpa: 5,
    activeBacklogs: 2
};

// Fields a pre-filled form may report as edited by the student. Anything else in
// the client's list is dropped so the stored audit trail only names real fields.
export const PREFILLABLE_FIELDS = [
    'fullName',
    'rollNumber',
    'collegeEmail',
    'mobileNumber',
    'branch',
    'gender',
    'residenceType',
    'hasLaptop'
];

// Letters plus the punctuation that legitimately appears in Indian names
// (D'Souza, Sai Kumar, A. Ramesh). Digits and symbols are rejected.
const NAME_PATTERN = /^[A-Za-z][A-Za-z\s.'-]*$/;
const ROLL_PATTERN = /^[A-Z0-9]+$/;
// Deliberately stricter than the browser's type=email: requires a dotted TLD.
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[A-Za-z]{2,}$/;
// Indian mobile numbers are 10 digits starting 6-9.
const MOBILE_PATTERN = /^[6-9]\d{9}$/;
// Up to two decimals: 8, 8.5, 8.25 — the value range is checked separately.
const CGPA_PATTERN = /^\d{1,2}(\.\d{1,2})?$/;

const asString = (value) => {
    if (typeof value === 'string') return value;
    if (typeof value === 'number' && Number.isFinite(value)) return String(value);
    return '';
};

/** Strips +91 / 0 prefixes, spaces, dashes and brackets so paste-from-contacts works. */
export const normalizeMobile = (raw) => {
    const digits = asString(raw).replace(/[^\d]/g, '');
    if (digits.length === 12 && digits.startsWith('91')) return digits.slice(2);
    if (digits.length === 11 && digits.startsWith('0')) return digits.slice(1);
    return digits;
};

/** Uppercases and strips whitespace — the one way a roll number is ever compared. */
export const normalizeRoll = (raw) => asString(raw).trim().toUpperCase().replace(/\s+/g, '');

/**
 * Cleans the optional pre-fill audit block a pre-filled form sends along:
 * which roster entry it was filled from and which fields the student changed.
 * Returns null when the submission was typed from scratch.
 */
export function sanitizePrefill(raw) {
    if (!raw || typeof raw !== 'object' || Array.isArray(raw)) return null;
    const rollKey = normalizeRoll(raw.rollKey);
    if (!rollKey || !ROLL_PATTERN.test(rollKey)) return null;
    const editedFields = Array.isArray(raw.editedFields)
        ? raw.editedFields.filter((f) => PREFILLABLE_FIELDS.includes(f))
        : [];
    return { source: 'skillup-roster', rollKey, editedFields: [...new Set(editedFields)] };
}

/**
 * Normalizes and validates one registration payload.
 * Returns { values, errors } — `values` is the cleaned record, `errors` is a
 * field → message map that is empty when the payload is valid.
 *
 * `values.cgpa` / `values.activeBacklogs` are numbers (or null when the chosen
 * program does not collect them). `values.passoutYear` is derived from the
 * program so a tampered request cannot pair a program with the wrong year.
 */
export function validateRegistration(raw = {}) {
    const programKey = asString(raw.programKey).trim() || PROGRAM_KEY_BY_YEAR[asString(raw.passoutYear).trim()] || '';
    const program = PROGRAM_BY_KEY[programKey] || null;

    const cgpaText = asString(raw.cgpa).trim();
    const backlogText = asString(raw.activeBacklogs).trim();

    const values = {
        fullName: asString(raw.fullName).trim().replace(/\s+/g, ' '),
        rollNumber: normalizeRoll(raw.rollNumber),
        collegeEmail: asString(raw.collegeEmail).trim().toLowerCase(),
        mobileNumber: normalizeMobile(raw.mobileNumber),
        branch: asString(raw.branch).trim(),
        gender: asString(raw.gender).trim(),
        residenceType: asString(raw.residenceType).trim(),
        hasLaptop: asString(raw.hasLaptop).trim(),
        // paidCrtFee: asString(raw.paidCrtFee).trim(), // CRT enrolment retired
        programKey,
        passoutYear: program ? program.passoutYear : '',
        cgpa: program?.academics && CGPA_PATTERN.test(cgpaText) ? Number(cgpaText) : null,
        activeBacklogs: program?.academics && /^\d{1,2}$/.test(backlogText) ? Number(backlogText) : null
    };

    const errors = {};

    if (!values.fullName) {
        errors.fullName = 'Please enter your full name';
    } else if (values.fullName.length < 3) {
        errors.fullName = 'Name must be at least 3 characters';
    } else if (values.fullName.length > FIELD_LIMITS.fullName) {
        errors.fullName = `Name must be under ${FIELD_LIMITS.fullName} characters`;
    } else if (!NAME_PATTERN.test(values.fullName)) {
        errors.fullName = 'Name can only contain letters, spaces, dots and hyphens';
    }

    if (!values.rollNumber) {
        errors.rollNumber = 'Please enter your roll number';
    } else if (values.rollNumber.length < 6) {
        errors.rollNumber = 'Roll number must be at least 6 characters';
    } else if (values.rollNumber.length > FIELD_LIMITS.rollNumber) {
        errors.rollNumber = `Roll number must be under ${FIELD_LIMITS.rollNumber} characters`;
    } else if (!ROLL_PATTERN.test(values.rollNumber)) {
        errors.rollNumber = 'Roll number can only contain letters and numbers';
    }

    if (!values.collegeEmail) {
        errors.collegeEmail = 'Please enter your college email ID';
    } else if (values.collegeEmail.length > FIELD_LIMITS.collegeEmail) {
        errors.collegeEmail = 'Email address is too long';
    } else if (!EMAIL_PATTERN.test(values.collegeEmail)) {
        errors.collegeEmail = 'Please enter a valid email address';
    }

    if (!values.mobileNumber) {
        errors.mobileNumber = 'Please enter your mobile number';
    } else if (!MOBILE_PATTERN.test(values.mobileNumber)) {
        errors.mobileNumber = 'Enter a valid 10-digit Indian mobile number';
    }

    if (!values.branch) {
        errors.branch = 'Please select your branch';
    } else if (!BRANCH_OPTIONS.includes(values.branch)) {
        errors.branch = 'Please select a valid branch from the list';
    }

    if (!values.gender) {
        errors.gender = 'Please select your gender';
    } else if (!GENDER_VALUES.includes(values.gender)) {
        errors.gender = 'Please select a valid option';
    }

    if (!values.residenceType) {
        errors.residenceType = 'Please select hosteler or day scholar';
    } else if (!RESIDENCE_VALUES.includes(values.residenceType)) {
        errors.residenceType = 'Please select a valid option';
    }

    if (!values.hasLaptop) {
        errors.hasLaptop = 'Please let us know if you have a laptop';
    } else if (!LAPTOP_VALUES.includes(values.hasLaptop)) {
        errors.hasLaptop = 'Please select a valid option';
    }

    // CRT enrolment field retired — validation kept commented for easy restore.
    // if (!values.paidCrtFee) {
    //     errors.paidCrtFee = 'Please let us know if you have enrolled to CRT';
    // } else if (!CRT_FEE_VALUES.includes(values.paidCrtFee)) {
    //     errors.paidCrtFee = 'Please select a valid option';
    // }

    if (!program) {
        errors.programKey = 'Please select a program';
    } else if (!program.open) {
        errors.programKey = `Registrations for ${program.programName} are now closed`;
    }

    // Academic details — mandatory for programs that collect them (Moon Coder).
    if (program?.academics) {
        if (!cgpaText) {
            errors.cgpa = 'Please enter your overall CGPA';
        } else if (!CGPA_PATTERN.test(cgpaText) || Number(cgpaText) > 10) {
            errors.cgpa = 'Enter a CGPA between 0 and 10 (for example 8.25)';
        }

        if (!backlogText) {
            errors.activeBacklogs = 'Enter your active backlogs — 0 if none';
        } else if (!/^\d{1,2}$/.test(backlogText)) {
            errors.activeBacklogs = 'Enter a whole number (0 if none)';
        }
    }

    return { values, errors, program };
}
