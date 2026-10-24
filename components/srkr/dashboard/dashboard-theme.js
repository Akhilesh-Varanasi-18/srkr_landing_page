// Chart palette + label helpers. Hex values mirror the CSS tokens in
// _srkr-theme.scss — Recharts renders SVG gradients from <defs>, which need real
// colors rather than var() references, so the brand hexes are duplicated here.

export const BRAND = {
    primary: '#E2544C',
    primaryHover: '#BD3933',
    secondary: '#ED7236',
    tertiary: '#F2A63B',
    amberSoft: '#ED9035',
    blue: '#5866EB',
    pink: '#F92596',
    purple: '#8E56FF',
    green: '#10B981',
    sky: '#39C0FA',
    ink: '#0F172A',
    muted: '#64748B',
    border: '#E2E8F0'
};

// One colour per program track (mirrors REGISTRATION_PROGRAMS). Moon Coder is
// the 2029 cohort's second intake, so it gets a hue outside the coral→amber ramp
// to stay distinguishable from SkillUp Coder in the same charts.
export const PROGRAM_COLORS = {
    'Bamboo Coder': BRAND.primary,
    'SkillUp Coder': BRAND.secondary,
    'AI Ready Engineers': BRAND.tertiary,
    'Moon Coder': BRAND.purple
};

// Moon Coder academics: CGPA bands run cool→warm with the grade, backlog counts
// go green (clear) → slate (several).
export const CGPA_BAND_ORDER = ['< 6', '6 – 7', '7 – 8', '8 – 9', '9 – 10'];
export const CGPA_BAND_COLORS = {
    '< 6': BRAND.muted,
    '6 – 7': BRAND.tertiary,
    '7 – 8': BRAND.secondary,
    '8 – 9': BRAND.primary,
    '9 – 10': BRAND.purple
};
export const BACKLOG_ORDER = ['None', '1', '2', '3+'];
export const BACKLOG_COLORS = {
    None: BRAND.green,
    1: BRAND.tertiary,
    2: BRAND.secondary,
    '3+': BRAND.primary
};

export const YEAR_COLORS = {
    2030: BRAND.primary,
    2029: BRAND.secondary,
    2028: BRAND.tertiary
};

export const GENDER_COLORS = {
    Male: BRAND.blue,
    Female: BRAND.pink
};

export const RESIDENCE_COLORS = {
    Hosteler: BRAND.secondary,
    'Day Scholar': BRAND.blue
};

export const LAPTOP_COLORS = {
    Yes: BRAND.tertiary,
    No: BRAND.muted
};

// Moon Coder class time slots, in catalogue order (slot 1, slot 2, …).
export const SLOT_COLORS = [BRAND.blue, BRAND.amberSoft, BRAND.purple, BRAND.green];

// CRT enrolment split retired from the dashboard — colours kept for easy restore.
export const CRT_FEE_COLORS = {
    Yes: BRAND.primary,
    No: BRAND.muted
};

// Admission basis (1st-year intake): rank-based vs management-quota students.
export const ADMISSION_COLORS = {
    'Rank-based': BRAND.secondary,
    Management: BRAND.muted
};

// A ranked sequential coral→amber→slate ramp for the branch bar chart. 12 stops —
// one per possible SRKR branch (8 CSE/IT + 4 others) so none share a colour.
export const BRANCH_RAMP = ['#E2544C', '#E7614A', '#EC6F40', '#F0853C', '#F2A63B', '#EEB44E', '#EAC266', '#E4CE82', '#D9D19E', '#C7CDB4', '#B2C3C9', '#94A3B8'];

export const RANGE_LABELS = {
    all: 'All time',
    today: 'Today',
    '7d': 'Last 7 days',
    '30d': 'Last 30 days'
};

export const RANGES = [
    { key: 'all', label: 'All' },
    { key: '30d', label: '30d' },
    { key: '7d', label: '7d' },
    { key: 'today', label: 'Today' }
];

/** Shortens the long BRANCH_OPTIONS labels to the parenthetical code for axes. */
export function shortBranch(name) {
    const m = /\(([^)]+)\)/.exec(name || '');
    return m ? m[1] : name;
}

/** 'Aug 30' style label from a 'YYYY-MM-DD' key. */
export function shortDay(key) {
    const [, m, d] = (key || '').split('-');
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    if (!m || !d) return key;
    return `${months[Number(m) - 1]} ${Number(d)}`;
}

export function formatDateTime(iso) {
    if (!iso) return '—';
    const d = new Date(iso);
    return d.toLocaleString('en-IN', {
        day: '2-digit',
        month: 'short',
        hour: '2-digit',
        minute: '2-digit',
        hour12: true
    });
}

export const pct = (value, total) => (total > 0 ? Math.round((value / total) * 100) : 0);
