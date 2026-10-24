// MongoDB access for the coding-profiles dashboard.
//
// Three collections, deliberately:
//
//   srkr_coding_roster     identity + BATCH. The bot's export never contains batch
//                          information, so this is the permanent join table.
//   srkr_coding_snapshots  one immutable document per upload, with the student rows
//                          EMBEDDED. The whole capture is ~84 KB of CSV and ~500 KB
//                          of documents, nowhere near the 16 MB document ceiling, so
//                          a separate per-student collection would buy nothing but a
//                          second thing to keep consistent.
//   srkr_coding_audit      who uploaded what, when, and what it replaced.
//
// Batch is NEVER copied onto snapshot rows. Joining 317 rows against a 317-document
// roster in Node is sub-millisecond, and keeping batch in exactly one place means a
// roster correction (there was already one mid-program batch swap in this project)
// retroactively fixes every historical snapshot with zero writes to snapshot data.

import { MongoClient } from 'mongodb';

const DB_NAME = process.env.MONGODB_DB || 'srkr';

export const ROSTER_COLLECTION = 'srkr_coding_roster';
export const SNAPSHOTS_COLLECTION = 'srkr_coding_snapshots';
export const AUDIT_COLLECTION = 'srkr_coding_audit';
// The program catalogue itself — one document per program the admin panel created
// (see program-store.js). Kept beside the data it scopes.
export const PROGRAMS_COLLECTION = 'srkr_coding_programs';

const options = { maxPoolSize: 10, serverSelectionTimeoutMS: 15000, retryWrites: true };

// Same global-cache pattern as lib/mongodb.js — Vercel runs each route in a
// short-lived function and dev hot-reloads modules, either of which would otherwise
// open a fresh pool per invocation and exhaust the Atlas connection limit.
let cached = globalThis.__srkrCoding;
if (!cached) cached = globalThis.__srkrCoding = { clientPromise: null, indexesReady: null };
// Index layout v2 (adds the programs collection) — a renamed cache slot makes a
// hot-reloaded dev server build it instead of reusing the old resolved promise.
if (cached.indexesReady && !cached.indexesV2) { cached.indexesReady = null; cached.indexesV2 = true; }

function getClientPromise() {
    const uri = process.env.MONGODB_URI;
    if (!uri) {
        throw new Error(
            'MONGODB_URI is not set. Add it to .env.local locally and to the Vercel project environment variables.'
        );
    }
    if (!cached.clientPromise) {
        cached.clientPromise = new MongoClient(uri, options).connect().catch((error) => {
            cached.clientPromise = null;
            throw error;
        });
    }
    return cached.clientPromise;
}

async function db() {
    const client = await getClientPromise();
    return client.db(DB_NAME);
}

async function ensureIndexes(database) {
    if (!cached.indexesReady) {
        cached.indexesReady = Promise.all([
            database
                .collection(ROSTER_COLLECTION)
                .createIndex({ programCode: 1, rollKey: 1 }, { unique: true, name: 'uniq_program_roll' }),
            database
                .collection(ROSTER_COLLECTION)
                .createIndex({ programCode: 1, batch: 1 }, { name: 'idx_program_batch' }),
            database
                .collection(SNAPSHOTS_COLLECTION)
                .createIndex({ programCode: 1, isCurrent: 1 }, { name: 'idx_program_current' }),
            database
                .collection(SNAPSHOTS_COLLECTION)
                .createIndex({ programCode: 1, capturedAt: -1 }, { name: 'idx_program_captured' }),
            // Re-uploading a byte-identical file is caught here rather than silently
            // creating a duplicate snapshot.
            database
                .collection(SNAPSHOTS_COLLECTION)
                .createIndex({ programCode: 1, sha256: 1 }, { unique: true, name: 'uniq_program_sha' }),
            database
                .collection(AUDIT_COLLECTION)
                .createIndex({ programCode: 1, at: -1 }, { name: 'idx_program_at' }),
            database
                .collection(PROGRAMS_COLLECTION)
                .createIndex({ code: 1 }, { unique: true, name: 'uniq_code' })
        ]).catch((error) => {
            cached.indexesReady = null;
            throw error;
        });
    }
    await cached.indexesReady;
}

export async function collections() {
    const database = await db();
    await ensureIndexes(database);
    return {
        roster: database.collection(ROSTER_COLLECTION),
        snapshots: database.collection(SNAPSHOTS_COLLECTION),
        audit: database.collection(AUDIT_COLLECTION),
        programs: database.collection(PROGRAMS_COLLECTION)
    };
}

/** Every roster student for a program, in roll order. */
export async function getRoster(programCode) {
    const { roster } = await collections();
    return roster.find({ programCode }).sort({ rollKey: 1 }).toArray();
}

/**
 * Replaces the roster for a program. Upsert-per-student rather than drop-and-insert
 * so that a re-upload which accidentally omits students does not wipe them — removals
 * are reported back to the admin and applied only when `prune` is set.
 */
export async function replaceRoster(programCode, students, { prune = false } = {}) {
    const { roster } = await collections();
    const now = new Date();

    const operations = students.map((student) => ({
        updateOne: {
            filter: { programCode, rollKey: student.rollKey },
            update: { $set: { ...student, programCode, updatedAt: now } },
            upsert: true
        }
    }));

    const result = operations.length ? await roster.bulkWrite(operations, { ordered: false }) : null;

    const incomingKeys = new Set(students.map((s) => s.rollKey));
    const existing = await roster.find({ programCode }, { projection: { rollKey: 1 } }).toArray();
    const orphans = existing.map((d) => d.rollKey).filter((k) => !incomingKeys.has(k));

    if (prune && orphans.length) {
        await roster.deleteMany({ programCode, rollKey: { $in: orphans } });
    }

    return {
        upserted: result?.upsertedCount ?? 0,
        modified: result?.modifiedCount ?? 0,
        total: students.length,
        orphans,
        pruned: prune ? orphans.length : 0
    };
}

/** The snapshot currently powering the dashboard, or null before the first upload. */
export async function getCurrentSnapshot(programCode) {
    const { snapshots } = await collections();
    return snapshots.findOne({ programCode, isCurrent: true });
}

/**
 * Snapshot metadata without the embedded rows — for the "captured on" chip, the
 * upload history list and delta lookups.
 */
export async function listSnapshots(programCode, limit = 12) {
    const { snapshots } = await collections();
    return snapshots
        .find({ programCode }, { projection: { rows: 0, unmatched: 0 } })
        .sort({ capturedAt: -1 })
        .limit(limit)
        .toArray();
}

/** The snapshot immediately before `capturedAt` — the baseline for deltas. */
export async function getPreviousSnapshot(programCode, capturedAt) {
    const { snapshots } = await collections();
    return snapshots
        .find({ programCode, capturedAt: { $lt: capturedAt } })
        .sort({ capturedAt: -1 })
        .limit(1)
        .next();
}

/** The latest snapshot captured inside [from, to] — the end of a date period. */
export async function getSnapshotWithin(programCode, fromDate, toDate) {
    const { snapshots } = await collections();
    return snapshots
        .find({ programCode, capturedAt: { $gte: fromDate, $lte: toDate } })
        .sort({ capturedAt: -1 })
        .limit(1)
        .next();
}

/**
 * Commits a parsed capture as the new current snapshot.
 * Appends — never overwrites. The first capture is the T0 baseline every future
 * delta is measured against, so losing it would be unrecoverable.
 */
export async function commitSnapshot(programCode, snapshot) {
    const { snapshots } = await collections();
    await snapshots.updateMany({ programCode, isCurrent: true }, { $set: { isCurrent: false } });
    const doc = { ...snapshot, programCode, isCurrent: true, uploadedAt: new Date() };
    const { insertedId } = await snapshots.insertOne(doc);
    return { ...doc, _id: insertedId };
}

/** Makes an earlier snapshot current again (rollback after a bad upload). */
export async function activateSnapshot(programCode, id) {
    const { snapshots } = await collections();
    const target = await snapshots.findOne({ _id: id, programCode }, { projection: { rows: 0 } });
    if (!target) return null;
    await snapshots.updateMany({ programCode, isCurrent: true }, { $set: { isCurrent: false } });
    await snapshots.updateOne({ _id: id }, { $set: { isCurrent: true } });
    return target;
}

/** Permanently removes a snapshot. Used to undo a mistaken upload. */
export async function deleteSnapshot(programCode, id) {
    const { snapshots } = await collections();
    const doc = await snapshots.findOne({ _id: id, programCode }, { projection: { rows: 0 } });
    if (!doc) return null;
    await snapshots.deleteOne({ _id: id });
    if (doc.isCurrent) {
        // Promote the most recent survivor so the dashboard never ends up with no
        // current snapshot while history still exists.
        const next = await snapshots
            .find({ programCode })
            .sort({ capturedAt: -1 })
            .limit(1)
            .next();
        if (next) await snapshots.updateOne({ _id: next._id }, { $set: { isCurrent: true } });
    }
    return doc;
}

export async function recordAudit(entry) {
    const { audit } = await collections();
    await audit.insertOne({ ...entry, at: new Date() });
}

export async function listAudit(programCode, limit = 20) {
    const { audit } = await collections();
    return audit.find({ programCode }).sort({ at: -1 }).limit(limit).toArray();
}
