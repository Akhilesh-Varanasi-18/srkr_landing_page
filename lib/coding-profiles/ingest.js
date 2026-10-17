// Parsing and validation for the two files an admin can upload:
//   * the bot's coding-profile export (.csv or .xlsx) — metrics, no batch
//   * the batch allocation workbook (.xlsx)            — identity + batch
//
// Everything here is pure with respect to the database: it parses, joins against a
// roster passed in, scores, and returns a report. The caller decides whether to
// commit. That is what makes `?dryRun=1` a one-line difference rather than a draft
// record lifecycle.

import crypto from 'crypto';
import ExcelJS from 'exceljs';
import {
    mapHeaders,
    normaliseRow,
    rollKeyOf,
    computeCoverage,
    isSuspectProfile
} from './columns';
import { scoreStudent, rankStudents, summarise, SCORE_VERSION } from './score';

/** A capture whose join rate falls below this is almost certainly the wrong file. */
const MIN_JOIN_RATE = 0.5;

/** Roster rows missing a name/roll above this rate means uncached formula cells. */
const MAX_ROSTER_BLANK_RATE = 0.05;

export const sha256 = (buffer) => crypto.createHash('sha256').update(buffer).digest('hex');

// ───────────────────────────────────────────────────────────── CSV

/**
 * Minimal RFC-4180 CSV splitter. The bot's export contains quoted fields with commas
 * (`"Java (Basic), Problem Solving (Basic)"`), so a naive split on ',' corrupts the
 * certifications column and shifts every field after it.
 */
export function parseCsv(text) {
    const rows = [];
    let row = [];
    let field = '';
    let inQuotes = false;

    for (let i = 0; i < text.length; i += 1) {
        const char = text[i];

        if (inQuotes) {
            if (char === '"') {
                if (text[i + 1] === '"') {
                    field += '"';
                    i += 1;
                } else {
                    inQuotes = false;
                }
            } else {
                field += char;
            }
            continue;
        }

        if (char === '"') {
            inQuotes = true;
        } else if (char === ',') {
            row.push(field);
            field = '';
        } else if (char === '\n') {
            row.push(field);
            rows.push(row);
            row = [];
            field = '';
        } else if (char !== '\r') {
            field += char;
        }
    }

    if (field !== '' || row.length) {
        row.push(field);
        rows.push(row);
    }

    // Trailing blank lines produce a single empty cell — drop those.
    return rows.filter((r) => r.some((cell) => String(cell).trim() !== ''));
}

// ───────────────────────────────────────────────────────────── XLSX

/** exceljs cell -> primitive. Formula cells expose their cached value as `.result`. */
function cellValue(value) {
    if (value === null || value === undefined) return '';
    if (typeof value === 'object') {
        if (value.result !== undefined) return value.result;
        if (value.text !== undefined) return value.text;
        if (value.richText) return value.richText.map((t) => t.text).join('');
        if (value.hyperlink) return value.hyperlink;
        return '';
    }
    return value;
}

async function readWorkbook(buffer) {
    const workbook = new ExcelJS.Workbook();
    await workbook.xlsx.load(buffer);
    return workbook;
}

/** Worksheet -> array of cell arrays, 0-indexed (exceljs rows/cols are 1-indexed). */
function sheetToRows(sheet) {
    const rows = [];
    sheet.eachRow({ includeEmpty: false }, (row) => {
        const values = Array.isArray(row.values) ? row.values.slice(1) : [];
        rows.push(values.map(cellValue));
    });
    return rows;
}

/**
 * Finds the header row. The bot's export has it first, but a workbook that has been
 * through Excel usually carries a title banner and a blank line above it.
 */
function findHeaderRow(rows) {
    for (let i = 0; i < Math.min(rows.length, 12); i += 1) {
        const { byField } = mapHeaders(rows[i].map((c) => String(c ?? '')));
        if (byField.rollNo !== undefined && Object.keys(byField).length >= 3) return i;
    }
    return -1;
}

// ───────────────────────────────────────────────── profile capture parsing

/**
 * Parses the bot's export into normalised, scored rows.
 * @param {Buffer} buffer
 * @param {string} filename
 */
export async function parseCapture(buffer, filename) {
    const isExcel = /\.xlsx?$/i.test(filename);
    let rows;

    if (isExcel) {
        const workbook = await readWorkbook(buffer);
        const sheet = workbook.worksheets[0];
        if (!sheet) throw new Error('That workbook has no sheets.');
        rows = sheetToRows(sheet);
    } else {
        rows = parseCsv(buffer.toString('utf8').replace(/^﻿/, ''));
    }

    if (!rows.length) throw new Error('That file is empty.');

    const headerIndex = findHeaderRow(rows);
    if (headerIndex === -1) {
        throw new Error(
            'No recognisable header row. Expected a Roll_No column alongside the platform columns — check this is the coding-profile export and not the batch allocation workbook.'
        );
    }

    const header = rows[headerIndex].map((c) => String(c ?? '').trim());
    const mapping = mapHeaders(header);

    if (mapping.missingRequired.length) {
        throw new Error(`Required column missing: ${mapping.missingRequired.join(', ')}.`);
    }

    const parsed = [];
    const duplicates = [];
    const seen = new Set();

    for (let i = headerIndex + 1; i < rows.length; i += 1) {
        const cells = rows[i];
        const rollRaw = cells[mapping.byField.rollNo];
        const rollKey = rollKeyOf(rollRaw);
        if (!rollKey) continue;

        if (seen.has(rollKey)) {
            duplicates.push(rollKey);
            continue;
        }
        seen.add(rollKey);

        const { metrics, profiles } = normaliseRow(cells, mapping.byField);
        parsed.push({ rollKey, rollNo: String(rollRaw).trim(), metrics, profiles });
    }

    if (!parsed.length) throw new Error('No data rows found under the header.');

    const coverage = computeCoverage(parsed);

    // Flag profile links that point at the platform but not at a user page — the
    // first capture carried one `leetcode.com/settings/` URL.
    const suspectProfiles = [];
    for (const row of parsed) {
        for (const [platform, url] of Object.entries(row.profiles || {})) {
            if (isSuspectProfile(url, platform)) {
                suspectProfiles.push({ rollKey: row.rollKey, platform, url });
            }
        }
    }

    return {
        filename,
        sha256: sha256(buffer),
        rows: parsed,
        header,
        coverage,
        unknownColumns: mapping.unknown,
        missingScoredColumns: mapping.missingScored,
        duplicates,
        suspectProfiles
    };
}

// ───────────────────────────────────────────────────────── roster parsing

const ROSTER_FIELDS = {
    batch: ['batch'],
    rollNo: ['roll no', 'rollno', 'roll_no', 'roll number'],
    name: ['name', 'student name'],
    mobile: ['mobile', 'phone', 'mobile number'],
    email: ['email', 'email address'],
    gender: ['gender'],
    branch: ['branch', 'department', 'dept'],
    residence: ['residence', 'residence type'],
    laptop: ['laptop', 'has laptop']
};

const normalise = (h) => String(h ?? '').toLowerCase().replace(/[^a-z0-9]/g, '');

const ROSTER_LOOKUP = (() => {
    const map = new Map();
    for (const [field, aliases] of Object.entries(ROSTER_FIELDS)) {
        for (const alias of aliases) if (!map.has(normalise(alias))) map.set(normalise(alias), field);
    }
    return map;
})();

/**
 * Parses the batch allocation workbook.
 *
 * The combined sheet's cells are FORMULAS pointing at the per-batch sheets, and
 * exceljs can only return their cached results. If the workbook is ever regenerated
 * by LibreOffice, a Google Sheets export, or exceljs itself, those caches are absent
 * and every row parses as blank — which looks downstream exactly like "the admin
 * uploaded the wrong file". The blank-rate guard below turns that into a message the
 * admin can act on instead.
 */
export async function parseRoster(buffer, { preferredSheet = null } = {}) {
    const workbook = await readWorkbook(buffer);

    const candidates = preferredSheet
        ? [workbook.getWorksheet(preferredSheet), ...workbook.worksheets].filter(Boolean)
        : workbook.worksheets;

    for (const sheet of candidates) {
        const rows = sheetToRows(sheet);
        let headerIndex = -1;
        let byField = null;

        for (let i = 0; i < Math.min(rows.length, 12); i += 1) {
            const mapped = {};
            rows[i].forEach((raw, index) => {
                const field = ROSTER_LOOKUP.get(normalise(raw));
                if (field && mapped[field] === undefined) mapped[field] = index;
            });
            if (mapped.rollNo !== undefined && mapped.batch !== undefined && mapped.name !== undefined) {
                headerIndex = i;
                byField = mapped;
                break;
            }
        }

        if (headerIndex === -1) continue;

        const students = [];
        let blank = 0;

        for (let i = headerIndex + 1; i < rows.length; i += 1) {
            const cells = rows[i];
            const rollKey = rollKeyOf(cells[byField.rollNo]);
            const name = String(cellValue(cells[byField.name]) ?? '').trim();

            if (!rollKey || !name) {
                // Only count a row as blank if it looked like it was meant to hold data.
                if (cells.some((c) => String(c ?? '').trim() !== '')) blank += 1;
                continue;
            }

            const text = (field) =>
                byField[field] === undefined ? null : String(cellValue(cells[byField[field]]) ?? '').trim() || null;

            students.push({
                rollKey,
                rollNo: String(cells[byField.rollNo]).trim(),
                name,
                batch: text('batch'),
                gender: text('gender'),
                branch: text('branch'),
                residence: text('residence'),
                laptop: text('laptop')
                // Mobile and email are deliberately NOT stored. They sit in the source
                // workbook, they are never shown on this dashboard, and keeping them
                // out of a second store is the cheapest way to honour the project's
                // "student exports never leave the local machine" rule.
            });
        }

        const considered = students.length + blank;
        if (considered && blank / considered > MAX_ROSTER_BLANK_RATE) {
            throw new Error(
                `${blank} of ${considered} rows in "${sheet.name}" have no name or roll number. This workbook has no cached formula values — open it in Excel, re-save it, then upload again.`
            );
        }

        if (students.length) return { sheetName: sheet.name, students, blankRows: blank };
    }

    throw new Error(
        'No sheet with Batch, Roll No and Name columns was found. Check this is the batch allocation workbook.'
    );
}

// ─────────────────────────────────────────────────────── join + validation

/**
 * Joins a parsed capture onto the roster, scores every student, and produces the
 * report the preview screen renders and the commit path stores.
 *
 * Every roster student gets a row, including the 9 with no capture — a mentor has to
 * be able to see that someone has no scraped data at all, which is a different fact
 * from scoring zero.
 */
export function buildSnapshot({ capture, roster, program, capturedAt, previous = null }) {
    const rosterByKey = new Map(roster.map((s) => [s.rollKey, s]));
    const captureByKey = new Map(capture.rows.map((r) => [r.rollKey, r]));

    const matched = [];
    const unknown = [];

    for (const row of capture.rows) {
        if (rosterByKey.has(row.rollKey)) matched.push(row);
        else unknown.push(row);
    }

    const previousByKey = new Map(
        (previous?.rows || []).map((r) => [r.rollKey, r])
    );

    const students = roster.map((person) => {
        const row = captureByKey.get(person.rollKey);
        if (!row) {
            return {
                rollKey: person.rollKey,
                rollNo: person.rollNo,
                dataCaptured: false,
                metrics: {},
                profiles: {},
                score: null,
                parts: null,
                caps: null,
                activePlatforms: 0,
                platformsTouched: 0,
                previousScore: previousByKey.get(person.rollKey)?.score ?? null
            };
        }

        const scored = scoreStudent(row.metrics);
        return {
            rollKey: person.rollKey,
            rollNo: row.rollNo,
            dataCaptured: true,
            metrics: row.metrics,
            profiles: row.profiles,
            score: scored.score,
            parts: scored.parts,
            caps: scored.caps,
            activePlatforms: scored.activePlatforms,
            platformsTouched: scored.platformsTouched,
            previousScore: previousByKey.get(person.rollKey)?.score ?? null
        };
    });

    const ranked = rankStudents(students);
    const summary = summarise(ranked);

    const joinRate = capture.rows.length ? matched.length / capture.rows.length : 0;

    // ── Guards. Warnings inform; blockers stop a commit unless explicitly forced.
    const warnings = [];
    const blockers = [];

    if (joinRate < MIN_JOIN_RATE) {
        blockers.push({
            code: 'join_rate',
            message: `Only ${matched.length} of ${capture.rows.length} rows matched a roster student (${Math.round(joinRate * 100)}%). This usually means the wrong file, or a roster that needs re-uploading.`
        });
    }

    if (capture.duplicates.length) {
        warnings.push({
            code: 'duplicates',
            message: `${capture.duplicates.length} duplicate roll number(s) in the file; the first row of each was kept.`,
            detail: capture.duplicates.slice(0, 10)
        });
    }

    if (unknown.length) {
        warnings.push({
            code: 'unknown_rolls',
            message: `${unknown.length} roll number(s) in the file are not on the roster. They are stored but excluded from the leaderboard until the roster is updated.`,
            detail: unknown.slice(0, 10).map((r) => r.rollNo)
        });
    }

    const notCaptured = roster.filter((p) => !captureByKey.has(p.rollKey));
    if (notCaptured.length) {
        warnings.push({
            code: 'not_captured',
            message: `${notCaptured.length} roster student(s) have no row in this capture. They appear as "no data captured" rather than scoring zero.`,
            detail: notCaptured.slice(0, 12).map((p) => p.rollNo)
        });
    }

    if (capture.missingScoredColumns.length) {
        warnings.push({
            code: 'missing_columns',
            message: `${capture.missingScoredColumns.length} scored column(s) are absent from this file and will count as zero.`,
            detail: capture.missingScoredColumns
        });
    }

    if (capture.unknownColumns.length) {
        warnings.push({
            code: 'unknown_columns',
            message: `${capture.unknownColumns.length} column(s) were not recognised and are ignored.`,
            detail: capture.unknownColumns
        });
    }

    if (capture.suspectProfiles.length) {
        warnings.push({
            code: 'suspect_profiles',
            message: `${capture.suspectProfiles.length} profile link(s) do not point at a user page.`,
            detail: capture.suspectProfiles.slice(0, 8).map((s) => `${s.rollKey}: ${s.platform}`)
        });
    }

    // ── Column regression guard: the highest-value check here. A column that carried
    // real data last time and is now entirely zero means the bot broke for that
    // platform — and on this dataset that is visually indistinguishable from the
    // truth, because 40 students legitimately score zero and 13 columns are
    // legitimately empty. There is no eyeball check; only this comparison catches it.
    if (previous?.coverage) {
        const regressed = [];
        for (const [field, now] of Object.entries(capture.coverage)) {
            const before = previous.coverage[field];
            if (!before || !before.total) continue;
            const wasPopulated = before.nonzero / before.total >= 0.5;
            if (wasPopulated && now.nonzero === 0) {
                regressed.push({ field, was: before.nonzero, now: 0 });
            }
        }
        if (regressed.length) {
            blockers.push({
                code: 'column_regression',
                message: `${regressed.length} column(s) carried data in the previous capture and are now entirely zero: ${regressed.map((r) => r.field).join(', ')}. This usually means the scraper failed for that platform.`,
                detail: regressed
            });
        }
    }

    // ── Newly populated columns — the good news half of the same comparison.
    const newlyPopulated = [];
    if (previous?.coverage) {
        for (const [field, now] of Object.entries(capture.coverage)) {
            const before = previous.coverage[field];
            if (now.nonzero > 0 && (!before || before.nonzero === 0)) newlyPopulated.push(field);
        }
    }

    return {
        snapshot: {
            capturedAt,
            filename: capture.filename,
            sha256: capture.sha256,
            scoreVersion: SCORE_VERSION,
            rowCount: capture.rows.length,
            coverage: capture.coverage,
            columnsSeen: capture.header,
            summary: { ...summary, scores: undefined, matched: matched.length, unknown: unknown.length },
            rows: ranked.map(({ previousScore, rank, tier, ...row }) => row),
            unmatched: unknown.map((r) => ({ rollKey: r.rollKey, rollNo: r.rollNo, metrics: r.metrics }))
        },
        preview: {
            filename: capture.filename,
            capturedAt,
            rowsParsed: capture.rows.length,
            rosterSize: roster.length,
            matched: matched.length,
            unknown: unknown.length,
            notCaptured: notCaptured.length,
            joinRate,
            summary,
            newlyPopulated,
            warnings,
            blockers,
            topThree: ranked
                .filter((s) => s.rank !== null)
                .slice(0, 3)
                .map((s) => ({
                    rollNo: s.rollNo,
                    name: rosterByKey.get(s.rollKey)?.name || s.rollNo,
                    score: s.score
                }))
        },
        ranked
    };
}
