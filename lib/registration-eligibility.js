// Server-only helpers for roster-gated intakes (Moon Coder).
//
// Moon Coder is open only to the SkillUp Coder shortlist — the 317 students on the
// coding-profiles roster. That roster is the eligibility list, and each student's
// earlier SkillUp registration record is the pre-fill source, so a returning
// student types nothing but their CGPA and backlogs.
//
// Never import this from a client component: it reaches the database.

import { getRoster } from './coding-profiles/store';
import { getRegistrationsCollection } from './mongodb';
import { BRANCH_OPTIONS, branchOptionForCode, normalizeRoll, PROGRAM_BY_KEY } from './registration-schema';

// programCode of the coding-profiles roster that defines who is eligible.
export const ELIGIBILITY_ROSTER = 'skillup-coder';
// programCode of the earlier registration a Moon Coder form is pre-filled from.
export const PREFILL_SOURCE_CODE = 'SKL-200';

// The roster is 317 small documents that change only when an admin re-uploads
// it; a short cache keeps type-ahead lookups off the database.
const ROSTER_TTL_MS = 2 * 60 * 1000;
let rosterCache = globalThis.__srkrEligibility;
if (!rosterCache) rosterCache = globalThis.__srkrEligibility = { at: 0, rows: null, promise: null };

const fold = (value) =>
    String(value || '')
        .toUpperCase()
        .replace(/\s+/g, ' ')
        .trim();

/** "SAI KUMAR" → "Sai Kumar" for roster names that arrived fully upper-cased. */
const titleCase = (value) =>
    String(value || '')
        .toLowerCase()
        .replace(/(^|[\s.'-])([a-z])/g, (m, sep, ch) => sep + ch.toUpperCase())
        .trim();

/** The eligibility list, normalised to what the form and the search need. */
export async function eligibleRoster() {
    const now = Date.now();
    if (rosterCache.rows && now - rosterCache.at < ROSTER_TTL_MS) return rosterCache.rows;
    if (!rosterCache.promise) {
        rosterCache.promise = getRoster(ELIGIBILITY_ROSTER)
            .then((docs) => {
                rosterCache.rows = docs.map((doc) => ({
                    rollKey: normalizeRoll(doc.rollKey || doc.rollNo),
                    rollNo: doc.rollNo || doc.rollKey,
                    name: doc.name || '',
                    batch: doc.batch || '',
                    branch: doc.branch || '',
                    gender: doc.gender || '',
                    laptop: doc.laptop || '',
                    residence: doc.residence || ''
                }));
                rosterCache.at = Date.now();
                return rosterCache.rows;
            })
            .finally(() => {
                rosterCache.promise = null;
            });
    }
    return rosterCache.promise;
}

/** The roster entry for a roll number, or null when the student is not shortlisted. */
export async function eligibleEntry(roll) {
    const rollKey = normalizeRoll(roll);
    if (!rollKey) return null;
    const rows = await eligibleRoster();
    return rows.find((row) => row.rollKey === rollKey) || null;
}

/**
 * Type-ahead over the shortlist. Matches roll-number prefixes first, then names
 * (whole prefix, then every typed word as a word prefix, then anywhere).
 * Returns only what the suggestion list shows — never contact details.
 */
export async function searchEligible(query, limit = 8) {
    const q = fold(query);
    if (q.length < 2) return [];
    const rows = await eligibleRoster();
    const qCompact = q.replace(/[^A-Z0-9]/g, '');
    const qWords = q.split(' ').filter(Boolean);

    const scored = [];
    for (const row of rows) {
        const name = fold(row.name);
        const words = name.split(' ');
        let score = 0;
        if (qCompact && row.rollKey.startsWith(qCompact)) score = 100;
        else if (qCompact && row.rollKey.includes(qCompact)) score = 80;
        else if (name.startsWith(q)) score = 70;
        else if (qWords.length && qWords.every((w) => words.some((word) => word.startsWith(w)))) score = 60;
        else if (name.includes(q)) score = 40;
        if (score) scored.push({ score, row });
    }
    scored.sort((a, b) => b.score - a.score || a.row.name.localeCompare(b.row.name));
    return scored.slice(0, limit).map(({ row }) => ({
        rollNo: row.rollNo,
        name: row.name === row.name.toUpperCase() ? titleCase(row.name) : row.name,
        branch: row.branch,
        batch: row.batch
    }));
}

/**
 * Everything the form can pre-fill for one shortlisted student, joined from the
 * roster (identity, batch) and their SkillUp registration (contact details, the
 * exact option values they chose). The registration record wins where both have
 * a value — it is what the student typed — and the roster fills any gap.
 *
 * Also reports whether this roll number already holds a record for the target
 * program, so the form can say so before the student fills anything in.
 */
export async function prefillFor(roll, programKey) {
    const entry = await eligibleEntry(roll);
    if (!entry) return null;

    const program = PROGRAM_BY_KEY[programKey] || null;
    const collection = await getRegistrationsCollection();
    const [source, existing] = await Promise.all([
        collection.findOne(
            { programCode: PREFILL_SOURCE_CODE, rollNumber: entry.rollKey },
            {
                projection: {
                    _id: 0,
                    fullName: 1,
                    collegeEmail: 1,
                    mobileNumber: 1,
                    branch: 1,
                    gender: 1,
                    residenceType: 1,
                    hasLaptop: 1
                }
            }
        ),
        program
            ? collection.findOne(
                  { programCode: program.code, rollNumber: entry.rollKey },
                  { projection: { _id: 0, registrationId: 1, createdAt: 1 } }
              )
            : null
    ]);

    const branch =
        source?.branch && BRANCH_OPTIONS.includes(source.branch) ? source.branch : branchOptionForCode(entry.branch);

    return {
        rollKey: entry.rollKey,
        student: {
            fullName: source?.fullName || (entry.name === entry.name.toUpperCase() ? titleCase(entry.name) : entry.name),
            rollNumber: entry.rollNo || entry.rollKey,
            collegeEmail: source?.collegeEmail || '',
            mobileNumber: source?.mobileNumber || '',
            branch,
            gender: source?.gender || entry.gender || '',
            residenceType: source?.residenceType || entry.residence || '',
            hasLaptop: source?.hasLaptop || entry.laptop || '',
            batch: entry.batch
        },
        alreadyRegistered: Boolean(existing),
        registeredAt: existing?.createdAt || null
    };
}
