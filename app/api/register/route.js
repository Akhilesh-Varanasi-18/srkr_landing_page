import { NextResponse } from 'next/server';
import crypto from 'crypto';
import { getRegistrationsCollection } from '../../../lib/mongodb';
import { validateRegistration, normalizeRoll, PROGRAM_BY_KEY } from '../../../lib/registration-schema';
import { prefillFor } from '../../../lib/registration-eligibility';

// Registrations must hit the database on every request — never cache or prerender.
export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

const MAX_BODY_BYTES = 4096;

const buildRegistrationId = () => `TM-SRKR-${100000 + crypto.randomInt(900000)}`;

/** Maps a MongoDB duplicate-key error onto the field the student needs to fix. */
function duplicateFieldFrom(error) {
    // The unique indexes are compound ({ programCode, rollNumber } etc.) — the
    // student-facing field is whichever key is not the program.
    const key = error?.keyPattern ? Object.keys(error.keyPattern).find((k) => k !== 'programCode') : null;
    if (key === 'rollNumber') return { field: 'rollNumber', message: 'This roll number is already registered' };
    if (key === 'collegeEmail') return { field: 'collegeEmail', message: 'This email ID is already registered' };
    return null;
}

// What a roster-gated student actually types. Anything else in the body is
// ignored for those intakes — the rest of the record comes from the server.
const GATED_INPUTS = ['cgpa', 'activeBacklogs', 'timeSlot'];

export async function POST(request) {
    // 1. Parse defensively — a malformed or oversized body must not reach the driver.
    let payload;
    try {
        const raw = await request.text();
        if (raw.length > MAX_BODY_BYTES) {
            return NextResponse.json({ success: false, message: 'Request body too large.' }, { status: 413 });
        }
        payload = JSON.parse(raw);
    } catch {
        return NextResponse.json({ success: false, message: 'Invalid request format.' }, { status: 400 });
    }

    if (!payload || typeof payload !== 'object' || Array.isArray(payload)) {
        return NextResponse.json({ success: false, message: 'Invalid request format.' }, { status: 400 });
    }

    // 2. Roster-gated intakes (Moon Coder): the browser sends only the roll number
    //    the student picked plus the three things only they know (CGPA, backlogs,
    //    time slot). Name, contact details, branch, gender, residence and laptop
    //    are read from their SkillUp Coder registration here, so nothing in the
    //    request can alter them — and the roll must be on the shortlist.
    const program = PROGRAM_BY_KEY[typeof payload.programKey === 'string' ? payload.programKey : ''] || null;
    const gated = Boolean(program?.open && program.eligibility === 'skillup-roster');
    let identity = null;
    let candidate = payload;

    if (gated) {
        const rollKey = normalizeRoll(payload.rollNumber);
        if (!rollKey) {
            return NextResponse.json(
                { success: false, message: 'Please pick yourself from the SkillUp Coder shortlist first.', errors: { rollNumber: 'Pick your roll number from the shortlist' } },
                { status: 422 }
            );
        }
        try {
            identity = await prefillFor(rollKey, program.key);
        } catch (error) {
            console.error('[register] eligibility lookup failed:', error);
            return NextResponse.json(
                { success: false, message: 'We could not verify your eligibility right now. Please try again in a moment.' },
                { status: 503 }
            );
        }
        if (!identity) {
            return NextResponse.json(
                {
                    success: false,
                    message: `${program.programName} registrations are open only for the SkillUp Coder shortlist.`,
                    errors: { rollNumber: 'This roll number is not on the SkillUp Coder shortlist' }
                },
                { status: 403 }
            );
        }
        if (identity.alreadyRegistered) {
            return NextResponse.json(
                { success: false, message: `You have already registered for ${program.programName}.`, errors: { rollNumber: 'This roll number is already registered' } },
                { status: 409 }
            );
        }
        candidate = {
            ...identity.student,
            programKey: program.key,
            ...Object.fromEntries(GATED_INPUTS.map((field) => [field, payload[field]]))
        };
    }

    // 3. Authoritative validation. The client runs the same rules for instant
    //    feedback, but this is the check that actually gates the write. The
    //    program (and therefore the passout year, code and track) is derived
    //    server-side from the key, so a tampered request can't register itself
    //    into a program it didn't earn.
    const { values, errors, program: validated } = validateRegistration(candidate);
    if (Object.keys(errors).length > 0) {
        // For a gated intake, an error on a field the student never typed means
        // their SkillUp record is incomplete — say so instead of pointing at a
        // field that is not on the screen.
        const hidden = gated ? Object.keys(errors).filter((k) => !GATED_INPUTS.includes(k)) : [];
        return NextResponse.json(
            {
                success: false,
                message: hidden.length
                    ? `Some details from your SkillUp Coder registration could not be used (${hidden.join(', ')}). Please contact the ToriiMinds team.`
                    : 'Please correct the highlighted fields.',
                errors
            },
            { status: 422 }
        );
    }

    let collection;
    try {
        collection = await getRegistrationsCollection();
    } catch (error) {
        console.error('[register] database connection failed:', error);
        return NextResponse.json(
            { success: false, message: 'We could not reach the registration server. Please try again in a moment.' },
            { status: 503 }
        );
    }

    // 4. Friendly pre-check for duplicates WITHIN this program. The compound
    //    unique indexes are the real guarantee (this lookup can race), but it
    //    lets us name both fields at once.
    try {
        const existing = await collection.findOne(
            { programCode: validated.code, $or: [{ rollNumber: values.rollNumber }, { collegeEmail: values.collegeEmail }] },
            { projection: { rollNumber: 1, collegeEmail: 1 } }
        );
        if (existing) {
            const duplicateErrors = {};
            if (existing.rollNumber === values.rollNumber) {
                duplicateErrors.rollNumber = 'This roll number is already registered';
            }
            if (existing.collegeEmail === values.collegeEmail) {
                duplicateErrors.collegeEmail = 'This email ID is already registered';
            }
            return NextResponse.json(
                { success: false, message: `You have already registered for ${validated.programName}.`, errors: duplicateErrors },
                { status: 409 }
            );
        }
    } catch (error) {
        console.error('[register] duplicate lookup failed:', error);
        return NextResponse.json(
            { success: false, message: 'Something went wrong while checking your details. Please try again.' },
            { status: 500 }
        );
    }

    // 5. Build the record. Academic fields are stored as numbers (they feed the
    //    dashboard's CGPA bands and backlog split); the time slot keeps its label
    //    and key; the pre-fill block records where the details came from.
    const { cgpa, activeBacklogs, timeSlot, timeSlotKey, ...studentValues } = values;
    const document = {
        ...studentValues,
        ...(validated.academics ? { cgpa, activeBacklogs } : {}),
        ...(validated.timeSlots ? { timeSlot, timeSlotKey } : {}),
        ...(identity ? { batch: identity.student.batch, prefill: { source: 'skillup-roster', rollKey: identity.rollKey, editedFields: [] } } : {}),
        programName: validated.programName,
        programCode: validated.code,
        programTrack: validated.badge,
        yearLabel: validated.yearLabel,
        status: 'registered',
        source: 'srkr-landing-page',
        createdAt: new Date(),
        updatedAt: new Date()
    };

    // Insert, retrying only on a registrationId collision so a random-ID clash
    // never surfaces to the student as an error.
    for (let attempt = 0; attempt < 5; attempt += 1) {
        const registrationId = buildRegistrationId();
        try {
            await collection.insertOne({ registrationId, ...document });
            return NextResponse.json(
                {
                    success: true,
                    message: 'Registration successful.',
                    registrationId,
                    programKey: validated.key,
                    programName: validated.programName,
                    programCode: validated.code,
                    // Echoed so the success screen can show what was saved for a
                    // gated intake, where the browser never held these values.
                    saved: {
                        fullName: values.fullName,
                        rollNumber: values.rollNumber,
                        branch: values.branch,
                        gender: values.gender,
                        residenceType: values.residenceType,
                        hasLaptop: values.hasLaptop,
                        batch: identity?.student.batch || null,
                        timeSlot: timeSlot || null
                    }
                },
                { status: 201 }
            );
        } catch (error) {
            if (error?.code === 11000) {
                const duplicate = duplicateFieldFrom(error);
                if (duplicate) {
                    // Lost the race against a concurrent identical submission.
                    return NextResponse.json(
                        {
                            success: false,
                            message: `You have already registered for ${validated.programName}.`,
                            errors: { [duplicate.field]: duplicate.message }
                        },
                        { status: 409 }
                    );
                }
                continue; // registrationId collision — generate a fresh one.
            }
            console.error('[register] insert failed:', error);
            return NextResponse.json(
                { success: false, message: 'We could not save your registration. Please try again.' },
                { status: 500 }
            );
        }
    }

    console.error('[register] exhausted registrationId attempts');
    return NextResponse.json(
        { success: false, message: 'We could not generate a registration ID. Please try again.' },
        { status: 500 }
    );
}

/** Lightweight health check: confirms the API and the database are both reachable. */
export async function GET() {
    try {
        const collection = await getRegistrationsCollection();
        const count = await collection.countDocuments();
        return NextResponse.json({ success: true, database: 'connected', registrations: count });
    } catch (error) {
        console.error('[register] health check failed:', error);
        return NextResponse.json({ success: false, database: 'unreachable' }, { status: 503 });
    }
}
