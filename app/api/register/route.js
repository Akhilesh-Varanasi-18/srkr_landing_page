import { NextResponse } from 'next/server';
import crypto from 'crypto';
import { getRegistrationsCollection } from '../../../lib/mongodb';
import { validateRegistration, PASSOUT_YEAR_PROGRAM_MAP } from '../../../lib/registration-schema';

// Registrations must hit the database on every request — never cache or prerender.
export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

const MAX_BODY_BYTES = 4096;

const buildRegistrationId = () => `TM-SRKR-${100000 + crypto.randomInt(900000)}`;

/** Maps a MongoDB duplicate-key error onto the field the student needs to fix. */
function duplicateFieldFrom(error) {
    const key = error?.keyPattern ? Object.keys(error.keyPattern)[0] : null;
    if (key === 'rollNumber') return { field: 'rollNumber', message: 'This roll number is already registered' };
    if (key === 'collegeEmail') return { field: 'collegeEmail', message: 'This email ID is already registered' };
    return null;
}

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

    // 2. Authoritative validation. The client runs the same rules for instant
    //    feedback, but this is the check that actually gates the write.
    const { values, errors } = validateRegistration(payload);
    if (Object.keys(errors).length > 0) {
        return NextResponse.json(
            { success: false, message: 'Please correct the highlighted fields.', errors },
            { status: 422 }
        );
    }

    // 3. Derive the program server-side. The client sends only passoutYear, so a
    //    tampered request can't register itself into a program it didn't earn.
    const program = PASSOUT_YEAR_PROGRAM_MAP[values.passoutYear];

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

    // 4. Friendly pre-check for duplicates. The unique indexes are the real
    //    guarantee (this lookup can race), but it lets us name both fields at once.
    try {
        const existing = await collection.findOne(
            { $or: [{ rollNumber: values.rollNumber }, { collegeEmail: values.collegeEmail }] },
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
                { success: false, message: 'You have already registered.', errors: duplicateErrors },
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

    // 5. Insert, retrying only on a registrationId collision so a random-ID clash
    //    never surfaces to the student as an error.
    const document = {
        ...values,
        programName: program.programName,
        programCode: program.code,
        programTrack: program.badge,
        yearLabel: program.yearLabel,
        status: 'registered',
        source: 'srkr-landing-page',
        createdAt: new Date(),
        updatedAt: new Date()
    };

    for (let attempt = 0; attempt < 5; attempt += 1) {
        const registrationId = buildRegistrationId();
        try {
            await collection.insertOne({ registrationId, ...document });
            return NextResponse.json(
                {
                    success: true,
                    message: 'Registration successful.',
                    registrationId,
                    programName: program.programName,
                    programCode: program.code
                },
                { status: 201 }
            );
        } catch (error) {
            if (error?.code === 11000) {
                const duplicate = duplicateFieldFrom(error);
                if (duplicate) {
                    // Lost the race against a concurrent identical submission.
                    return NextResponse.json(
                        { success: false, message: 'You have already registered.', errors: { [duplicate.field]: duplicate.message } },
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
