// Palette and formatting helpers for the coding-profiles dashboard.
//
// Mirrors the CSS tokens in _srkr-theme.scss the same way dashboard-theme.js already
// does — recharts renders SVG from <defs> and needs real hex, not var() references.
//
// CONTRAST RULE, measured against white: --srkr-tertiary #F2A63B is 2.04:1 and
// --srkr-text-secondary #ED9035 is 2.43:1. Both fail the 4.5:1 text floor AND the
// 3:1 non-text floor. So platform hue is DECORATION ONLY — it fills a bar or a ring,
// and the number beside it is always rendered in --srkr-heading ink. Nothing on this
// page is conveyed by hue alone.

export const BRAND = {
    primary: '#E2544C',
    primaryHover: '#BD3933',
    secondary: '#ED7236',
    tertiary: '#F2A63B',
    amber: '#ED9035',
    heading: '#0F172A',
    body: '#334155',
    muted: '#64748B',
    border: '#E2E8F0',
    bgSection: '#F8FAFC',
    coralTint: '#FFF3EF',
    warmTint: '#FFF7EB',
    blue: '#5866EB',
    sky: '#39C0FA',
    pink: '#F92596',
    purple: '#8E56FF',
    success: '#10B981',
    warning: '#F59E0B',
    danger: '#EF4444'
};

/**
 * The four platforms, in the fixed order they appear everywhere: card rail, detail
 * view, report table. Fixed order matters more than it sounds — GeeksforGeeks is
 * empty for 270 of 308 students, so a layout that collapsed empty platforms would
 * produce 305 ragged cards. A fixed four-slot rail instead gives a scannable column
 * of hollow rings.
 *
 * `accent` fills bars and rings only. `logo` is the badge drawn wherever the platform is
 * named. `metricKey` is the count that goes into the total — the number the student
 * sees on their own profile page.
 */
export const PLATFORMS = [
    {
        key: 'lc',
        logo: '/assets/images/srkr/platforms/lc.webp',
        name: 'LeetCode',
        short: 'LC',
        accent: BRAND.secondary,
        profileKey: 'lc',
        metricKey: 'lcTotal',
        unit: 'solved',
        note: 'Problems solved, split by the difficulty LeetCode assigns.'
    },
    {
        key: 'cc',
        logo: '/assets/images/srkr/platforms/cc.webp',
        name: 'CodeChef',
        short: 'CC',
        accent: BRAND.primary,
        profileKey: 'cc',
        metricKey: 'ccProblems',
        unit: 'problems',
        note: 'Problems solved, including practice and learning-module problems, as CodeChef counts them.'
    },
    {
        key: 'hr',
        logo: '/assets/images/srkr/platforms/hr.webp',
        name: 'HackerRank',
        short: 'HR',
        accent: BRAND.blue,
        profileKey: 'hr',
        metricKey: 'hrTotalStars',
        unit: 'stars',
        note: 'Stars earned across the six language tracks; badges and certifications alongside.'
    },
    {
        key: 'gfg',
        logo: '/assets/images/srkr/platforms/gfg.webp',
        name: 'GeeksforGeeks',
        short: 'GFG',
        accent: BRAND.purple,
        profileKey: 'gfg',
        metricKey: 'gfgPrograms',
        unit: 'programs',
        note: "Programs solved, with GeeksforGeeks' own score shown when it reports one."
    }
];

export const PLATFORM_BY_KEY = Object.fromEntries(PLATFORMS.map((p) => [p.key, p]));

/**
 * Podium metals, expressed in brand tokens rather than literal gold/silver/bronze.
 * `ink` is always the dark heading colour: white on the amber stop measures 2.04:1
 * and white on the copper 2.97:1, so light text on these fills is not an option.
 * Rank is additionally carried by size, ring weight and a numeral — never by metal
 * alone, which would make the podium unreadable to a colour-blind viewer and in the
 * monochrome print path.
 */
export const MEDALS = [
    {
        rank: 1,
        label: 'Gold',
        fill: 'linear-gradient(145deg, #F2A63B 0%, #ED9035 55%, #E2544C 100%)',
        ring: 'rgba(242, 166, 59, 0.45)',
        glow: '0 18px 52px rgba(237, 144, 53, 0.34)',
        ink: BRAND.heading
    },
    {
        rank: 2,
        label: 'Silver',
        fill: 'linear-gradient(145deg, #E2E8F0 0%, #CBD5E1 60%, #94A3B8 100%)',
        ring: 'rgba(148, 163, 184, 0.42)',
        glow: '0 14px 40px rgba(100, 116, 139, 0.22)',
        ink: BRAND.heading
    },
    {
        rank: 3,
        label: 'Bronze',
        fill: 'linear-gradient(145deg, #ED7236 0%, #E2544C 60%, #BD3933 100%)',
        ring: 'rgba(226, 84, 76, 0.42)',
        glow: '0 14px 40px rgba(226, 84, 76, 0.26)',
        ink: BRAND.heading
    }
];

export const TIER_STYLE = {
    podium: { label: 'Podium', tone: 'gold' },
    top10: { label: 'Top 10', tone: 'coral' },
    active: { label: 'Active', tone: 'green' },
    starting: { label: 'Getting started', tone: 'slate' },
    not_started: { label: 'Not started yet', tone: 'ghost' },
    not_captured: { label: 'No profile captured', tone: 'ghost' }
};

/**
 * Micro-bar fill for a platform count.
 *
 * Log-scaled with a floor: linear would render 1 solve and 0 solves as visually
 * identical against a cohort maximum of 191, which is precisely the student the page
 * most needs to encourage. The 0.18 floor guarantees a first solve is visible, and
 * `overflow` flags a value past the reference so 191 and 67 don't both read as "full".
 */
export function barFill(value, reference) {
    const v = Number(value) || 0;
    if (v <= 0) return { fill: 0, overflow: false };
    const ref = Math.max(1, Number(reference) || 1);
    const ratio = Math.log1p(v) / Math.log1p(ref);
    return { fill: Math.min(1, 0.18 + 0.82 * Math.min(1, ratio)), overflow: v > ref };
}

/** Reference ceilings for the micro-bars — the cohort's realistic upper band. */
export const BAR_REFERENCE = { lc: 60, cc: 60, hr: 8, gfg: 20 };

export const formatNumber = (value) =>
    value === null || value === undefined ? '—' : Number(value).toLocaleString('en-IN');

/** Totals are shown as an em-dash when absent — never as a zero we did not measure. */
export const formatScore = (value) => (value === null || value === undefined ? '—' : String(value));

export function formatDate(value) {
    if (!value) return '—';
    const d = new Date(value);
    if (Number.isNaN(d.getTime())) return '—';
    return d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
}

export function formatDateTime(value) {
    if (!value) return '—';
    const d = new Date(value);
    if (Number.isNaN(d.getTime())) return '—';
    return d.toLocaleString('en-IN', {
        day: 'numeric',
        month: 'short',
        hour: '2-digit',
        minute: '2-digit',
        hour12: true
    });
}

/** Whole days between a capture and now — drives the staleness chip. */
export function daysSince(value) {
    if (!value) return null;
    const then = new Date(value);
    if (Number.isNaN(then.getTime())) return null;
    return Math.floor((Date.now() - then.getTime()) / 86400000);
}

/**
 * Staleness escalation. Assumes a roughly weekly bot run: a fortnight is worth a
 * nudge, a month means the page is no longer describing the present.
 */
export function stalenessLevel(capturedAt) {
    const days = daysSince(capturedAt);
    if (days === null) return 'unknown';
    if (days >= 30) return 'stale';
    if (days >= 14) return 'ageing';
    return 'fresh';
}

/** Initials for the avatar monogram. Handles "I.Tanuja" and "G T S PURNIMA". */
export function initialsOf(name) {
    const parts = String(name || '')
        .replace(/[^A-Za-z\s.]/g, ' ')
        .split(/[\s.]+/)
        .filter(Boolean);
    if (!parts.length) return '?';
    if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

const hashOf = (value, seed) => {
    const key = String(value || '');
    let hash = seed;
    for (let i = 0; i < key.length; i += 1) hash = (hash * 31 + key.charCodeAt(i)) >>> 0;
    return hash;
};

/** Stable per-student backdrop colour, so a card's avatar never changes between loads. */
export function avatarVariant(rollKey) {
    return hashOf(rollKey, 0) % 4;
}

/**
 * Which of the four characters in the student's gender set to draw. Seeded
 * differently from the colour so the two vary independently — otherwise every blue
 * avatar in the grid would also be the same face.
 */
export function avatarStyle(rollKey) {
    return hashOf(rollKey, 2166136261) % 4;
}

/** 'Batch 2' -> 'B2', for the compact meta line on a card. */
export const shortBatch = (batch) => String(batch || '').replace(/^Batch\s+/i, 'B');

export function genderKey(gender) {
    const g = String(gender || '').trim().toLowerCase();
    if (g.startsWith('m')) return 'male';
    if (g.startsWith('f')) return 'female';
    return 'neutral';
}
