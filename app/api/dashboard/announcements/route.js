import { NextResponse } from 'next/server';
import sharp from 'sharp';
import { getAnnouncementsCollection } from '../../../../lib/mongodb';
import { isAuthenticated } from '../../../../lib/dashboard-auth';
import { PASSOUT_YEAR_PROGRAM_MAP } from '../../../../lib/registration-schema';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

const MAX_UPLOAD_BYTES = 8 * 1024 * 1024; // 8MB raw upload cap
const VALID_TIERS = Object.keys(PASSOUT_YEAR_PROGRAM_MAP).map((y) => `${y} Passouts`);

/** List every announcement (newest first) — admin history view. Image bytes are
 *  never included here; the list only needs a small thumbnail-ready flag. */
export async function GET(request) {
    if (!isAuthenticated(request)) {
        return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });
    }
    try {
        const collection = await getAnnouncementsCollection();
        const docs = await collection
            .find({}, { projection: { imageData: 0 } })
            .sort({ createdAt: -1 })
            .toArray();
        return NextResponse.json({ success: true, announcements: docs });
    } catch (error) {
        console.error('[dashboard/announcements] list failed:', error);
        return NextResponse.json({ success: false, message: 'Could not load announcements.' }, { status: 500 });
    }
}

/** Create a new announcement. Image + exclusiveFor tier are mandatory. Creating
 *  one deactivates whatever was previously live — only one is ever shown to
 *  visitors at a time, but older ones stay in the collection as history. */
export async function POST(request) {
    if (!isAuthenticated(request)) {
        return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });
    }

    let form;
    try {
        form = await request.formData();
    } catch {
        return NextResponse.json({ success: false, message: 'Invalid form submission.' }, { status: 400 });
    }

    const file = form.get('image');
    const exclusiveFor = String(form.get('exclusiveFor') || '').trim();
    const title = String(form.get('title') || '').trim();
    const note = String(form.get('note') || '').trim();

    const errors = {};
    if (!file || typeof file === 'string' || !file.size) {
        errors.image = 'Please upload an announcement image.';
    } else if (file.size > MAX_UPLOAD_BYTES) {
        errors.image = 'Image is too large — please upload something under 8MB.';
    } else if (!/^image\//.test(file.type || '')) {
        errors.image = 'Please upload an image file (JPG, PNG or WEBP).';
    }
    if (!exclusiveFor) {
        errors.exclusiveFor = 'Please select which passout-year batch this announcement is for.';
    } else if (!VALID_TIERS.includes(exclusiveFor)) {
        errors.exclusiveFor = 'Please select a valid passout-year batch.';
    }
    if (Object.keys(errors).length > 0) {
        return NextResponse.json({ success: false, message: 'Please correct the highlighted fields.', errors }, { status: 422 });
    }

    let imageBuffer, contentType;
    try {
        const rawBuffer = Buffer.from(await file.arrayBuffer());
        // Recompress to keep documents small and consistent — long edge capped
        // at 1600px, JPEG q82. Poster-style announcements don't need more.
        imageBuffer = await sharp(rawBuffer)
            .resize({ width: 1600, height: 1600, fit: 'inside', withoutEnlargement: true })
            .jpeg({ quality: 82 })
            .toBuffer();
        contentType = 'image/jpeg';
    } catch (error) {
        console.error('[dashboard/announcements] image processing failed:', error);
        return NextResponse.json({ success: false, message: 'Could not process that image. Please try a different file.' }, { status: 400 });
    }

    let collection;
    try {
        collection = await getAnnouncementsCollection();
    } catch (error) {
        console.error('[dashboard/announcements] database connection failed:', error);
        return NextResponse.json({ success: false, message: 'We could not reach the database. Please try again.' }, { status: 503 });
    }

    try {
        await collection.updateMany({ isActive: true }, { $set: { isActive: false } });
        const now = new Date();
        const doc = {
            exclusiveFor,
            title: title || null,
            note: note || null,
            imageData: imageBuffer,
            imageContentType: contentType,
            isActive: true,
            createdAt: now,
            updatedAt: now
        };
        const result = await collection.insertOne(doc);
        return NextResponse.json({
            success: true,
            message: 'Announcement published.',
            id: String(result.insertedId)
        }, { status: 201 });
    } catch (error) {
        console.error('[dashboard/announcements] insert failed:', error);
        return NextResponse.json({ success: false, message: 'Could not save the announcement. Please try again.' }, { status: 500 });
    }
}
