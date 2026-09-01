// Single source of truth for registration data: option lists, the passout-year →
// program mapping, and the validation rules. Imported by BOTH the client modal and
// the /api/register route so the two can never drift apart. The server always
// re-runs validateRegistration() — client-side checks are only a UX convenience.

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

export const GENDER_VALUES = ['Male', 'Female'];
export const RESIDENCE_VALUES = ['Hosteler', 'Day Scholar'];
export const LAPTOP_VALUES = ['Yes', 'No'];
export const CRT_FEE_VALUES = ['Yes', 'No'];
export const PASSOUT_YEARS = ['2030', '2029', '2028'];

export const PASSOUT_YEAR_PROGRAM_MAP = {
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

export const FIELD_LIMITS = {
    fullName: 60,
    rollNumber: 15,
    collegeEmail: 120,
    mobileNumber: 10
};

// Letters plus the punctuation that legitimately appears in Indian names
// (D'Souza, Sai Kumar, A. Ramesh). Digits and symbols are rejected.
const NAME_PATTERN = /^[A-Za-z][A-Za-z\s.'-]*$/;
const ROLL_PATTERN = /^[A-Z0-9]+$/;
// Deliberately stricter than the browser's type=email: requires a dotted TLD.
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[A-Za-z]{2,}$/;
// Indian mobile numbers are 10 digits starting 6-9.
const MOBILE_PATTERN = /^[6-9]\d{9}$/;

const asString = (value) => (typeof value === 'string' ? value : '');

/** Strips +91 / 0 prefixes, spaces, dashes and brackets so paste-from-contacts works. */
export const normalizeMobile = (raw) => {
    const digits = asString(raw).replace(/[^\d]/g, '');
    if (digits.length === 12 && digits.startsWith('91')) return digits.slice(2);
    if (digits.length === 11 && digits.startsWith('0')) return digits.slice(1);
    return digits;
};

/**
 * Normalizes and validates one registration payload.
 * Returns { values, errors } — `values` is the cleaned record, `errors` is a
 * field → message map that is empty when the payload is valid.
 */
export function validateRegistration(raw = {}) {
    const values = {
        fullName: asString(raw.fullName).trim().replace(/\s+/g, ' '),
        rollNumber: asString(raw.rollNumber).trim().toUpperCase().replace(/\s+/g, ''),
        collegeEmail: asString(raw.collegeEmail).trim().toLowerCase(),
        mobileNumber: normalizeMobile(raw.mobileNumber),
        branch: asString(raw.branch).trim(),
        gender: asString(raw.gender).trim(),
        residenceType: asString(raw.residenceType).trim(),
        hasLaptop: asString(raw.hasLaptop).trim(),
        paidCrtFee: asString(raw.paidCrtFee).trim(),
        passoutYear: asString(raw.passoutYear).trim()
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

    if (!values.paidCrtFee) {
        errors.paidCrtFee = 'Please let us know if you have paid the CRT training fee';
    } else if (!CRT_FEE_VALUES.includes(values.paidCrtFee)) {
        errors.paidCrtFee = 'Please select a valid option';
    }

    if (!values.passoutYear) {
        errors.passoutYear = 'Please select your passout year';
    } else if (!PASSOUT_YEARS.includes(values.passoutYear)) {
        errors.passoutYear = 'Please select a valid passout year';
    }

    return { values, errors };
}
