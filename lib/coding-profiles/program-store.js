// The program catalogue for the coding-profiles module, in MongoDB.
//
// A program used to be a constant in code. The admin panel now creates programs
// itself (name → roster → capture), so the catalogue is data: one document per
// program, keyed by a URL-safe code. The SkillUp Coder program that predates this is
// seeded on first read so nothing already uploaded under 'skillup-coder' is orphaned.
//
// Server only — never import from a client component.

import { collections } from './store';
import { publicProgram, slugify, sortBatches, YEAR_LABELS } from './programs';

const SEED = [
    {
        code: 'skillup-coder',
        name: 'SkillUp Coder',
        kind: 'coding-profiles',
        college: 'SRKR',
        passoutYear: 2029,
        yearLabel: '2nd Year',
        tagline: 'Competitive programming across LeetCode, HackerRank, CodeChef and GeeksforGeeks',
        batches: ['Batch 1', 'Batch 2', 'Batch 3', 'Batch 4'],
        rosterSheet: 'SKL_2029_Batch'
    }
];

const NAME_MAX = 60;
const TAGLINE_MAX = 140;

async function seedIfEmpty(programs) {
    const count = await programs.countDocuments();
    if (count > 0) return;
    const now = new Date();
    await programs
        .insertMany(SEED.map((p) => ({ ...p, createdAt: now, updatedAt: now })), { ordered: false })
        .catch((error) => {
            // A concurrent first request may have seeded already.
            if (error?.code !== 11000) throw error;
        });
}

/** Every program, oldest first (the order the tabs show). */
export async function listPrograms() {
    const { programs } = await collections();
    await seedIfEmpty(programs);
    const docs = await programs.find({}).sort({ createdAt: 1 }).toArray();
    return docs.map(publicProgram);
}

export async function getProgram(code) {
    if (!code) return null;
    const { programs } = await collections();
    await seedIfEmpty(programs);
    return publicProgram(await programs.findOne({ code: String(code) }));
}

/**
 * Validates the admin's input for a new program. Returns { values, errors }.
 */
export function validateProgramInput(raw = {}) {
    const values = {
        name: String(raw.name || '').trim().replace(/\s+/g, ' '),
        yearLabel: String(raw.yearLabel || '').trim(),
        passoutYear: raw.passoutYear === '' || raw.passoutYear == null ? null : Number(raw.passoutYear),
        tagline: String(raw.tagline || '').trim().replace(/\s+/g, ' ')
    };
    const errors = {};
    if (!values.name) errors.name = 'Give the program a name';
    else if (values.name.length < 3) errors.name = 'Name must be at least 3 characters';
    else if (values.name.length > NAME_MAX) errors.name = `Name must be under ${NAME_MAX} characters`;
    else if (!slugify(values.name)) errors.name = 'Name needs at least one letter or digit';

    if (values.yearLabel && !YEAR_LABELS.includes(values.yearLabel)) errors.yearLabel = 'Pick a year from the list';

    if (values.passoutYear !== null) {
        const thisYear = new Date().getFullYear();
        if (!Number.isInteger(values.passoutYear) || values.passoutYear < thisYear - 1 || values.passoutYear > thisYear + 6) {
            errors.passoutYear = `Enter a passout year between ${thisYear - 1} and ${thisYear + 6}`;
        }
    }
    if (values.tagline.length > TAGLINE_MAX) errors.tagline = `Keep the tagline under ${TAGLINE_MAX} characters`;
    return { values, errors };
}

/**
 * Creates a program. The code is derived from the name; a clash gets a numeric
 * suffix so two admins naming programs similarly never collide.
 */
export async function createProgram(values) {
    const { programs } = await collections();
    await seedIfEmpty(programs);

    const base = slugify(values.name) || 'program';
    const taken = new Set(
        (await programs.find({ code: { $regex: `^${base}(-\\d+)?$` } }, { projection: { code: 1 } }).toArray()).map(
            (d) => d.code
        )
    );
    const nameTaken = await programs.findOne(
        { name: { $regex: `^${values.name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`, $options: 'i' } },
        { projection: { code: 1 } }
    );
    if (nameTaken) {
        const error = new Error('A program with this name already exists.');
        error.code = 'name_taken';
        throw error;
    }

    let code = base;
    for (let n = 2; taken.has(code); n += 1) code = `${base}-${n}`;

    const now = new Date();
    const doc = {
        code,
        name: values.name,
        kind: 'coding-profiles',
        college: 'SRKR',
        passoutYear: values.passoutYear,
        yearLabel: values.yearLabel || '',
        tagline: values.tagline || '',
        batches: [],
        rosterSheet: null,
        createdAt: now,
        updatedAt: now
    };
    await programs.insertOne(doc);
    return publicProgram(doc);
}

/** Records the batch labels found in the latest roster upload. */
export async function setProgramBatches(code, labels) {
    const { programs } = await collections();
    const batches = sortBatches(labels);
    await programs.updateOne({ code }, { $set: { batches, updatedAt: new Date() } });
    return batches;
}

/**
 * Removes a program that holds no data. Deleting a program with a roster or
 * captures would silently throw away uploads, so that is refused here — the
 * admin empties it first (or simply leaves it).
 */
export async function deleteEmptyProgram(code) {
    const { programs, roster, snapshots } = await collections();
    const [rosterCount, snapshotCount] = await Promise.all([
        roster.countDocuments({ programCode: code }),
        snapshots.countDocuments({ programCode: code })
    ]);
    if (rosterCount || snapshotCount) {
        const error = new Error(
            `${code} still holds ${rosterCount} roster student(s) and ${snapshotCount} capture(s). Remove those first.`
        );
        error.code = 'not_empty';
        throw error;
    }
    const result = await programs.deleteOne({ code });
    return result.deletedCount === 1;
}

/** Roster size and latest capture per program — for tabs, cards and the landing page. */
export async function programStats() {
    const { roster, snapshots } = await collections();
    const [rosterCounts, latest] = await Promise.all([
        roster.aggregate([{ $group: { _id: '$programCode', n: { $sum: 1 } } }]).toArray(),
        snapshots
            .find({ isCurrent: true }, { projection: { programCode: 1, capturedAt: 1, rowCount: 1, summary: 1 } })
            .toArray()
    ]);
    const students = new Map(rosterCounts.map((r) => [r._id, r.n]));
    const captures = new Map(latest.map((s) => [s.programCode, s]));
    return { students, captures };
}
