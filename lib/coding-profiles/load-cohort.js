// The one place both API routes resolve "which captures does this request read".
//
// All time: the current snapshot, with the one before it for deltas.
// A period: the last capture inside the period (its end) and the last capture before
// it (its start). Either may be missing — see period.js for what each case means.

import { getCurrentSnapshot, getPreviousSnapshot, getSnapshotWithin } from './store';
import { periodBounds, describePeriod, periodCaption } from './period';

/**
 * @param {string} programCode
 * @param {{from:string,to:string}|null} period
 * @returns {Promise<{snapshot:object|null, previous:object|null, info:object|null}>}
 *   `info` describes the period for the client (null for all time).
 */
export async function loadPeriodSnapshots(programCode, period) {
    if (!period) {
        const snapshot = await getCurrentSnapshot(programCode);
        const previous = snapshot ? await getPreviousSnapshot(programCode, snapshot.capturedAt).catch(() => null) : null;
        return { snapshot, previous, info: null };
    }

    const { fromDate, toDate } = periodBounds(period);
    const [end, start] = await Promise.all([
        getSnapshotWithin(programCode, fromDate, toDate),
        getPreviousSnapshot(programCode, fromDate).catch(() => null)
    ]);

    return {
        snapshot: end,
        previous: start,
        info: {
            from: period.from,
            to: period.to,
            label: describePeriod(period),
            caption: periodCaption(period, start?.capturedAt, end?.capturedAt),
            startCapturedAt: start?.capturedAt || null,
            endCapturedAt: end?.capturedAt || null,
            empty: !end
        }
    };
}
