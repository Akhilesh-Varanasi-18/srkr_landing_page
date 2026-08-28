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

/**
 * Returns the registrations collection, ensuring the uniqueness indexes exist.
 * Index creation is idempotent and cached, so it costs one round trip per
 * cold start rather than one per request.
 */
export async function getRegistrationsCollection() {
    const client = await getClientPromise();
    const collection = client.db(DB_NAME).collection(COLLECTION_NAME);

    if (!cached.indexesReady) {
        cached.indexesReady = Promise.all([
            collection.createIndex({ rollNumber: 1 }, { unique: true, name: 'uniq_rollNumber' }),
            collection.createIndex({ collegeEmail: 1 }, { unique: true, name: 'uniq_collegeEmail' }),
            collection.createIndex({ registrationId: 1 }, { unique: true, name: 'uniq_registrationId' }),
            collection.createIndex({ createdAt: -1 }, { name: 'idx_createdAt' })
        ]).catch((error) => {
            // Don't poison the cache — a failed index build should be retried on
            // the next request rather than permanently rejected.
            cached.indexesReady = null;
            throw error;
        });
    }
    await cached.indexesReady;

    return collection;
}

export { DB_NAME, COLLECTION_NAME };
