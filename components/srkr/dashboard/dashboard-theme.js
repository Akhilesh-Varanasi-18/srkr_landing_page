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
    sky: '#39C0FA',
    ink: '#0F172A',
    muted: '#64748B',
    border: '#E2E8F0'
};

// Passout year → the program it maps to (mirrors PASSOUT_YEAR_PROGRAM_MAP).
export const PROGRAM_COLORS = {
    'Bamboo Coder': BRAND.primary,
    'SkillUp Coder': BRAND.secondary,
    'AI Ready Engineers': BRAND.tertiary
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

// A ranked sequential coral→amber ramp for the branch bar chart.
export const BRANCH_RAMP = ['#E2544C', '#E85F45', '#ED7236', '#F08B39', '#F2A63B', '#F0B65A', '#EEC77C', '#E9D29A', '#DCD3B4', '#CBD5E1'];

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
