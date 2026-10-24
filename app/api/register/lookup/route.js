import { NextResponse } from 'next/server';
import { DEFAULT_PROGRAM_KEY, PROGRAM_BY_KEY, normalizeRoll } from '../../../../lib/registration-schema';
import { prefillFor, searchEligible } from '../../../../lib/registration-eligibility';

// Type-ahead and pre-fill for roster-gated intakes (Moon Coder).
//
//   GET /api/register/lookup?q=<name or roll>      → up to 8 shortlist matches
//                                                    (name, roll, branch, batch)
//   GET /api/register/lookup?roll=<exact roll>     → name, roll, branch, batch and
//                                                    whether already registered
//
// The pre-fill answer carries the student's college email and mobile number, so
// it is deliberately narrow: only while the intake is open, only for an exact
// roll number that is on the shortlist, and rate-limited per client. The search
// answer never includes contact details.

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

const NO_STORE = { 'Cache-Control': 'no-store' };
const WINDOW_MS = 60 * 1000;
const SEARCH_PER_MINUTE = 90; // a fast typist with a 220 ms debounce is ~40/min
const PREFILL_PER_MINUTE = 20;
const MAX_QUERY = 60;

// Per-instance sliding window. Serverless instances do not share it, which is
// fine — the goal is to stop one client enumerating the list, not perfect quota.
const buckets = new Map();
function allow(key, limit) {
    const now = Date.now();
    let bucket = buckets.get(key);
    if (!bucket || bucket.resetAt <= now) {
        bucket = { n: 0, resetAt: now + WINDOW_MS };
        buckets.set(key, bucket);
    }
    bucket.n += 1;
    if (buckets.size > 5000) {
        for (const [k, v] of buckets) if (v.resetAt <= now) buckets.delete(k);
    }
    return bucket.n <= limit;
}

function clientKey(request) {
    const forwarded = request.headers.get('x-forwarded-for') || '';
    return forwarded.split(',')[0].trim() || request.headers.get('x-real-ip') || 'local';
}

const reply = (body, status = 200) => NextResponse.json(body, { status, headers: NO_STORE });

export async function GET(request) {
    const params = request.nextUrl.searchParams;
    const programKey = params.get('program') || DEFAULT_PROGRAM_KEY;
    const program = PROGRAM_BY_KEY[programKey];

    if (!program || program.eligibility !== 'skillup-roster') {
        return reply({ success: false, message: 'Lookup is not available for this program.' }, 404);
    }
    if (!program.open) {
        return reply({ success: false, message: `Registrations for ${program.programName} are closed.` }, 403);
    }

    const ip = clientKey(request);

    try {
        if (params.has('roll')) {
            if (!allow(`prefill:${ip}`, PREFILL_PER_MINUTE)) {
                return reply({ success: false, message: 'Too many requests — please wait a minute and try again.' }, 429);
            }
            const rollKey = normalizeRoll(params.get('roll'));
            if (rollKey.length < 6 || rollKey.length > 15 || !/^[A-Z0-9]+$/.test(rollKey)) {
                return reply({ success: false, message: 'Enter a valid roll number.' }, 422);
            }
            const result = await prefillFor(rollKey, programKey);
            if (!result) {
                return reply(
                    { success: false, message: 'This roll number is not on the SkillUp Coder shortlist.' },
                    404
                );
            }
            // Only what the form shows. The student never sees or edits contact
            // details here — the registration route reads them server-side — so
            // they are not sent to the browser.
            const { fullName, rollNumber, branch, batch } = result.student;
            return reply({
                success: true,
                rollKey: result.rollKey,
                alreadyRegistered: result.alreadyRegistered,
                registeredAt: result.registeredAt,
                student: { fullName, rollNumber, branch, batch }
            });
        }

        if (!allow(`search:${ip}`, SEARCH_PER_MINUTE)) {
            return reply({ success: false, message: 'Too many requests — please wait a minute and try again.' }, 429);
        }
        const q = (params.get('q') || '').trim().slice(0, MAX_QUERY);
        if (q.length < 2) return reply({ success: true, matches: [] });
        const matches = await searchEligible(q, 8);
        return reply({ success: true, matches });
    } catch (error) {
        console.error('[register/lookup] failed:', error);
        return reply({ success: false, message: 'We could not reach the shortlist right now. Please try again.' }, 503);
    }
}
