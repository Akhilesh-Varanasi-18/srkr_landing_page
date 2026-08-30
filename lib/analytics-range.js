// Date-range helpers shared by the stats and export routes so the dashboard's
// filter and the Excel download always slice the data identically.
//
// All day boundaries are computed in IST (+05:30) because that is the audience's
// wall clock — "today" must mean today in Bhimavaram, not today in UTC. On Vercel
// the server runs in UTC, so we do the offset math explicitly rather than trusting
// the machine timezone.

export const IST_TZ = '+05:30';
const IST_OFFSET_MS = 330 * 60 * 1000; // +5h30m

export const RANGE_OPTIONS = ['all', 'today', '7d', '30d'];

/** Midnight (IST) of the calendar day that `date` falls on, as a UTC instant. */
export function startOfISTDay(date) {
    const shifted = new Date(date.getTime() + IST_OFFSET_MS);
    shifted.setUTCHours(0, 0, 0, 0);
    return new Date(shifted.getTime() - IST_OFFSET_MS);
}

/** 'YYYY-MM-DD' for the IST calendar day of `date`. */
export function istDayKey(date) {
    return new Date(date.getTime() + IST_OFFSET_MS).toISOString().slice(0, 10);
}

/** Adds `days` to a UTC instant (used on already-IST-aligned midnights). */
export function addDays(date, days) {
    return new Date(date.getTime() + days * 24 * 60 * 60 * 1000);
}

/**
 * Resolves a range key into { key, start, end }. `start`/`end` are UTC Date
 * instants (or null for an open bound). `now` is injectable for testing.
 */
export function resolveRange(rangeKey, now = new Date()) {
    const key = RANGE_OPTIONS.includes(rangeKey) ? rangeKey : 'all';
    const todayStart = startOfISTDay(now);

    if (key === 'today') return { key, start: todayStart, end: now };
    if (key === '7d') return { key, start: addDays(todayStart, -6), end: now };
    if (key === '30d') return { key, start: addDays(todayStart, -29), end: now };
    return { key, start: null, end: now };
}

/** Mongo `createdAt` filter for a resolved range ({} when unbounded). */
export function rangeMatch({ start, end }) {
    if (!start && !end) return {};
    const createdAt = {};
    if (start) createdAt.$gte = start;
    if (end) createdAt.$lte = end;
    return { createdAt };
}

/**
 * Builds a gap-free daily series between `start` and `end` (IST days), attaching
 * a running cumulative total. `counts` is a Map of dayKey -> count.
 */
export function fillDailySeries(counts, start, end) {
    const series = [];
    let cursor = startOfISTDay(start);
    const last = startOfISTDay(end);
    let cumulative = 0;
    // Guard against a pathological range producing a runaway loop.
    for (let guard = 0; cursor <= last && guard < 1000; guard += 1) {
        const key = istDayKey(cursor);
        const count = counts.get(key) || 0;
        cumulative += count;
        series.push({ date: key, count, cumulative });
        cursor = addDays(cursor, 1);
    }
    return series;
}
