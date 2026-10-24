// Date periods for the dashboard: parsing, labelling, presets, and the capture
// arithmetic that gives a period its numbers.
//
// A capture is a cumulative total at one moment — nothing is stamped per problem.
// So "what happened in October" is the DIFFERENCE between two captures: the last
// one inside the period and the last one before it. With no capture before the
// period, everything up to the capture inside it counts (the first capture is the
// programme's baseline). With no capture inside the period there is nothing to show,
// and the UI says so rather than quietly showing the nearest capture.
//
// Pure: no Node, no DOM — imported by the API routes and the client alike. Dates are
// 'YYYY-MM-DD' strings; all arithmetic is in UTC so a period never drifts by a day.

const DAY_MS = 86400000;
const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
export const MONTHS_LONG = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
];

const pad = (n) => String(n).padStart(2, '0');

export const isoDate = (d) => `${d.getUTCFullYear()}-${pad(d.getUTCMonth() + 1)}-${pad(d.getUTCDate())}`;

export function fromIso(s) {
    const [y, m, d] = String(s).split('-').map(Number);
    return new Date(Date.UTC(y, m - 1, d));
}

export function isIsoDate(s) {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(String(s || ''))) return false;
    const d = fromIso(s);
    return !Number.isNaN(d.getTime()) && isoDate(d) === s;
}

/** Validates a from/to pair; reversed pairs are swapped, anything malformed is "no period". */
export function parsePeriod(fromRaw, toRaw) {
    if (!isIsoDate(fromRaw) || !isIsoDate(toRaw)) return null;
    let from = fromRaw;
    let to = toRaw;
    if (from > to) [from, to] = [to, from];
    return { from, to };
}

/** Inclusive instant bounds for a period, for the capture lookups. */
export function periodBounds({ from, to }) {
    return {
        fromDate: new Date(`${from}T00:00:00.000Z`),
        toDate: new Date(`${to}T23:59:59.999Z`)
    };
}

/** The admin's calendar date today (their clock, not UTC). */
export function todayIso(now = new Date()) {
    return `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}`;
}

export const addDays = (iso, n) => isoDate(new Date(fromIso(iso).getTime() + n * DAY_MS));

export const yearRange = (y) => ({ from: `${y}-01-01`, to: `${y}-12-31` });

export function monthRange(y, m) {
    const last = new Date(Date.UTC(y, m, 0)).getUTCDate();
    return { from: `${y}-${pad(m)}-01`, to: `${y}-${pad(m)}-${pad(last)}` };
}

/** Monday to Sunday around a date. */
export function weekRange(iso) {
    const dow = fromIso(iso).getUTCDay(); // 0 = Sunday
    const from = addDays(iso, -((dow + 6) % 7));
    return { from, to: addDays(from, 6) };
}

/** Every Monday–Sunday week that touches a month, in order. */
export function weeksOfMonth(y, m) {
    const { from: first, to: last } = monthRange(y, m);
    const weeks = [];
    let { from } = weekRange(first);
    while (from <= last) {
        weeks.push({ from, to: addDays(from, 6) });
        from = addDays(from, 7);
    }
    return weeks;
}

export function presetPeriod(key, today = todayIso()) {
    const y = Number(today.slice(0, 4));
    const m = Number(today.slice(5, 7));
    switch (key) {
        case 'week':
            return weekRange(today);
        case 'month':
            return monthRange(y, m);
        case 'year':
            return yearRange(y);
        case '7d':
            return { from: addDays(today, -6), to: today };
        case '30d':
            return { from: addDays(today, -29), to: today };
        default:
            return null;
    }
}

export const fmtDay = (d) => `${d.getUTCDate()} ${MONTHS[d.getUTCMonth()]} ${d.getUTCFullYear()}`;

function fmtRange(f, t) {
    const sameYear = f.getUTCFullYear() === t.getUTCFullYear();
    const sameMonth = sameYear && f.getUTCMonth() === t.getUTCMonth();
    if (sameMonth) return `${f.getUTCDate()}–${t.getUTCDate()} ${MONTHS[f.getUTCMonth()]} ${f.getUTCFullYear()}`;
    if (sameYear) return `${f.getUTCDate()} ${MONTHS[f.getUTCMonth()]} – ${t.getUTCDate()} ${MONTHS[t.getUTCMonth()]} ${f.getUTCFullYear()}`;
    return `${fmtDay(f)} – ${fmtDay(t)}`;
}

/** 'All time' · '2026' · 'October 2026' · 'Week of 13–19 Oct 2026' · '1–15 Oct 2026' · '15 Oct 2026'. */
export function describePeriod(period) {
    if (!period) return 'All time';
    const { from, to } = period;
    const f = fromIso(from);
    const t = fromIso(to);
    const y = f.getUTCFullYear();
    if (from === `${y}-01-01` && to === `${y}-12-31`) return String(y);
    const mr = monthRange(y, f.getUTCMonth() + 1);
    if (from === mr.from && to === mr.to) return `${MONTHS_LONG[f.getUTCMonth()]} ${y}`;
    const wr = weekRange(from);
    if (from === wr.from && to === wr.to) return `Week of ${fmtRange(f, t)}`;
    if (from === to) return fmtDay(f);
    return fmtRange(f, t);
}

/** What the period's numbers are measured between. */
export function periodCaption(period, startAt, endAt) {
    if (!period) return null;
    if (!endAt) return 'No capture falls inside this period';
    const end = fmtDay(new Date(endAt));
    if (!startAt) return `Everything up to the first capture, ${end}`;
    return `Progress between the captures of ${fmtDay(new Date(startAt))} and ${end}`;
}

/** The cumulative count columns a period diffs; ratings, ranks and links keep their end-of-period values. */
export const COUNT_DIFF_FIELDS = [
    'lcTotal', 'easy', 'medium', 'hard', 'lcContestCount',
    'ccProblems', 'ccContestCount',
    'hrC', 'hrCpp', 'hrJava', 'hrPython', 'hrProblemSolving', 'hrSql',
    'hrBadges', 'hrTotalStars', 'hrCertificationCount',
    'gfgPrograms', 'gfgScore', 'gfgSchool', 'gfgBasic', 'gfgEasy', 'gfgMedium', 'gfgHard', 'gfgContestCount'
];

/**
 * End-of-period metrics minus start-of-period metrics for every count column. A
 * drop (a platform recount, a reset account) is clamped at zero: it is a data
 * event, not negative progress.
 */
export function diffMetrics(end = {}, start = {}) {
    const out = { ...end };
    for (const field of COUNT_DIFF_FIELDS) {
        const e = Number(end[field]);
        if (!Number.isFinite(e)) continue;
        const s = Number(start[field]);
        out[field] = Math.max(0, e - (Number.isFinite(s) ? s : 0));
    }
    return out;
}
