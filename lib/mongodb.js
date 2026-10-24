import { MongoClient } from 'mongodb';

// Vercel runs each API route in a short-lived serverless function, and dev mode
// hot-reloads modules on every edit. Both would open a brand new pool per
// invocation and quickly exhaust the Atlas connection limit, so the client
// promise is cached on globalThis and reused across invocations/reloads.

const DB_NAME = process.env.MONGODB_DB || 'srkr';
const COLLECTION_NAME = process.env.MONGODB_COLLECTION || 'srkr_registrations';

const options = {
    maxPoolSize: 10,
    serverSelectionTimeoutMS: 15000,
    retryWrites: true
};

let cached = globalThis.__srkrMongo;
if (!cached) {
    cached = globalThis.__srkrMongo = { clientPromise: null, indexesReady: null };
}

function getClientPromise() {
    const uri = process.env.MONGODB_URI;
    if (!uri) {
        throw new Error('MONGODB_URI is not set. Add it to .env.local locally and to the Vercel project environment variables.');
    }
    if (!cached.clientPromise) {
        // Note: connect() failures must clear the cache, otherwise a single
        // startup blip would leave every later request stuck on a dead promise.
        cached.clientPromise = new MongoClient(uri, options).connect().catch((error) => {
            cached.clientPromise = null;
            throw error;
        });
    }
    return cached.clientPromise;
}

// Uniqueness used to be global (one roll number / email across every program).
// Moon Coder re-enrols students who already hold a SkillUp Coder record, so the
// constraint is now per program: the same student may appear once per intake.
// The old single-field indexes must go first or the second registration would
// still be rejected.
const LEGACY_INDEXES = ['uniq_rollNumber', 'uniq_collegeEmail'];

async function ensureRegistrationIndexes(collection) {
    // indexes() throws NamespaceNotFound on a brand-new deployment where the
    // collection has not been created yet — treat that as "no indexes".
    const existing = await collection.indexes().catch(() => []);
    const names = new Set(existing.map((index) => index.name));
    for (const name of LEGACY_INDEXES) {
        if (names.has(name)) await collection.dropIndex(name);
    }
    await Promise.all([
        collection.createIndex({ programCode: 1, rollNumber: 1 }, { unique: true, name: 'uniq_program_rollNumber' }),
        collection.createIndex({ programCode: 1, collegeEmail: 1 }, { unique: true, name: 'uniq_program_collegeEmail' }),
        collection.createIndex({ registrationId: 1 }, { unique: true, name: 'uniq_registrationId' }),
        collection.createIndex({ createdAt: -1 }, { name: 'idx_createdAt' }),
        // The admin analytics filter one program and sort/range on createdAt.
        collection.createIndex({ programCode: 1, createdAt: -1 }, { name: 'idx_program_createdAt' })
    ]);
}

/**
 * Returns the registrations collection, ensuring the uniqueness indexes exist.
 * Index creation is idempotent and cached, so it costs one round trip per
 * cold start rather than one per request.
 */
export async function getRegistrationsCollection() {
    const client = await getClientPromise();
    const collection = client.db(DB_NAME).collection(COLLECTION_NAME);

    // Keyed per index-layout version: the cache lives on globalThis and survives
    // dev hot-reloads, so a renamed key is what makes a long-running dev server
    // actually run a new migration instead of reusing the old resolved promise.
    if (!cached.registrationIndexesV3) {
        cached.registrationIndexesV3 = ensureRegistrationIndexes(collection).catch((error) => {
            // Don't poison the cache — a failed index build should be retried on
            // the next request rather than permanently rejected.
            cached.registrationIndexesV3 = null;
            throw error;
        });
    }
    await cached.registrationIndexesV3;

    return collection;
}

const ANNOUNCEMENTS_COLLECTION = 'srkr_announcements';

/**
 * Returns the announcements collection. Images are stored inline as a Buffer
 * field (`imageData`) rather than on disk — Vercel's filesystem is read-only
 * and ephemeral per-deploy, so anything an admin uploads at runtime must live
 * in the database to actually persist and be visible on every instance.
 */
export async function getAnnouncementsCollection() {
    const client = await getClientPromise();
    const collection = client.db(DB_NAME).collection(ANNOUNCEMENTS_COLLECTION);

    if (!cached.announcementIndexesReady) {
        cached.announcementIndexesReady = Promise.all([
            collection.createIndex({ isActive: 1, createdAt: -1 }, { name: 'idx_active_created' }),
            collection.createIndex({ createdAt: -1 }, { name: 'idx_createdAt' })
        ]).catch((error) => {
            cached.announcementIndexesReady = null;
            throw error;
        });
    }
    await cached.announcementIndexesReady;

    return collection;
}

export { DB_NAME, COLLECTION_NAME, ANNOUNCEMENTS_COLLECTION };
