// Resolves "which students, which captures" for a request — one program, or every
// program at once — so the overview and students routes share a single answer.
//
// ONE PROGRAM: its roster, its current capture and (for a period) the capture pair
// that bounds the period. Exactly what the routes did before.
//
// ALL PROGRAMS: each program is loaded the same way, then stitched into one cohort:
//   • every student's `batch` becomes their PROGRAM NAME, so the batch-aware code
//     (scope pills, per-group ranks, the analytics cards) groups by program instead;
//   • roll keys are prefixed with the program code, because a student can be on two
//     programs' rosters (SkillUp and Moon Coder) and the UI keys cards on rollKey;
//   • "data as of" is the newest capture across programs; the period is empty only
//     when NO program captured inside it.

import { ALL_PROGRAMS, allProgramsScope } from './programs';
import { listPrograms, getProgram } from './program-store';
import { getRoster, getCurrentSnapshot, listSnapshots } from './store';
import { loadPeriodSnapshots } from './load-cohort';
import { describePeriod } from './period';

const historyEntry = (h, programName = null) => ({
    id: String(h._id),
    capturedAt: h.capturedAt,
    uploadedAt: h.uploadedAt,
    filename: h.filename,
    rowCount: h.rowCount,
    isCurrent: Boolean(h.isCurrent),
    ...(programName ? { programName } : {})
});

async function loadOne(program, period) {
    const [roster, latest, history, loaded] = await Promise.all([
        getRoster(program.code),
        getCurrentSnapshot(program.code),
        listSnapshots(program.code),
        loadPeriodSnapshots(program.code, period)
    ]);
    return { program, roster, latest, history, ...loaded };
}

const prefixRows = (rows, code) => (rows || []).map((r) => ({ ...r, rollKey: `${code}:${r.rollKey}` }));

/** Sums per-field coverage across captures so the analytics view sees "any data". */
function mergeCoverage(captures) {
    const out = {};
    for (const snapshot of captures) {
        for (const [field, c] of Object.entries(snapshot?.coverage || {})) {
            if (!out[field]) out[field] = { total: 0, nonzero: 0 };
            out[field].total += c.total || 0;
            out[field].nonzero += c.nonzero || 0;
        }
    }
    return out;
}

/**
 * @returns {Promise<object>} one of
 *   { state: 'unknown' }
 *   { state: 'no-roster' | 'no-snapshot' | 'ready', program, roster, latest, history,
 *     snapshot, previous, info, group: 'batch' | 'program' }
 */
export async function loadScope(codeParam, period) {
    if (codeParam === ALL_PROGRAMS) {
        const programs = await listPrograms();
        const parts = await Promise.all(programs.map((p) => loadOne(p, period)));
        const withRoster = parts.filter((p) => p.roster.length);
        const scope = allProgramsScope(withRoster.map((p) => p.program));
        const history = parts
            .flatMap((p) => p.history.map((h) => historyEntry(h, p.program.name)))
            .sort((a, b) => new Date(b.capturedAt) - new Date(a.capturedAt));

        if (!withRoster.length) {
            return { state: 'no-roster', program: scope, roster: [], latest: null, history: [], group: 'program', programs };
        }

        const roster = withRoster.flatMap((p) =>
            p.roster.map((s) => ({
                ...s,
                rollKey: `${p.program.code}:${s.rollKey}`,
                batch: p.program.name,
                programCode: p.program.code,
                programName: p.program.name,
                ownBatch: s.batch
            }))
        );

        const captured = withRoster.filter((p) => p.latest);
        if (!captured.length) {
            return { state: 'no-snapshot', program: scope, roster, latest: null, history: [], group: 'program', programs };
        }

        const newest = captured.reduce((a, p) => (!a || new Date(p.latest.capturedAt) > new Date(a.capturedAt) ? p.latest : a), null);
        const latest = {
            _id: `all:${String(newest._id)}`,
            capturedAt: newest.capturedAt,
            uploadedAt: newest.uploadedAt,
            filename: `${captured.length} program capture${captured.length === 1 ? '' : 's'}`,
            rowCount: captured.reduce((n, p) => n + (p.latest.rowCount || 0), 0),
            coverage: mergeCoverage(captured.map((p) => p.latest)),
            scoreVersion: newest.scoreVersion,
            unmatched: []
        };

        const ends = withRoster.filter((p) => p.snapshot);
        const snapshot = ends.length
            ? { rows: ends.flatMap((p) => prefixRows(p.snapshot.rows, p.program.code)), capturedAt: latest.capturedAt }
            : null;
        const starts = withRoster.filter((p) => p.previous);
        const previous = starts.length
            ? {
                  _id: `all:prev`,
                  rows: starts.flatMap((p) => prefixRows(p.previous.rows, p.program.code)),
                  capturedAt: starts.reduce(
                      (a, p) => (!a || new Date(p.previous.capturedAt) > new Date(a) ? p.previous.capturedAt : a),
                      null
                  ),
                  filename: `${starts.length} earlier capture${starts.length === 1 ? '' : 's'}`
              }
            : null;

        const info = period
            ? {
                  from: period.from,
                  to: period.to,
                  label: describePeriod(period),
                  caption: `${ends.length} of ${captured.length} programs captured inside this period`,
                  startCapturedAt: previous?.capturedAt || null,
                  endCapturedAt: snapshot?.capturedAt || null,
                  empty: !ends.length
              }
            : null;

        return { state: 'ready', program: scope, roster, latest, history, snapshot, previous, info, group: 'program', programs };
    }

    const program = await getProgram(codeParam);
    if (!program) return { state: 'unknown' };
    const part = await loadOne(program, period);
    const history = part.history.map((h) => historyEntry(h));
    if (!part.roster.length) return { state: 'no-roster', program, roster: [], latest: null, history: [], group: 'batch' };
    if (!part.latest) return { state: 'no-snapshot', program, roster: part.roster, latest: null, history: [], group: 'batch' };
    return {
        state: 'ready',
        program,
        roster: part.roster,
        latest: part.latest,
        history,
        snapshot: part.snapshot,
        previous: part.previous,
        info: part.info,
        group: 'batch'
    };
}
