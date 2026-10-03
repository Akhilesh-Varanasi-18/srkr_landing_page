import { NextResponse } from 'next/server';
import sharp from 'sharp';
import { getAnnouncementsCollection } from '../../../../lib/mongodb';
import { isAuthenticated } from '../../../../lib/dashboard-auth';
import { PASSOUT_YEAR_PROGRAM_MAP } from '../../../../lib/registration-schema';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

const MAX_UPLOAD_BYTES = 8 * 1024 * 1024; // 8MB raw upload cap
const VALID_TIERS = Object.keys(PASSOUT_YEAR_PROGRAM_MAP).map((y) => `${y} Passouts`);

/** Validate one uploaded poster. Returns an error string, or null when fine.
 *  `required: false` lets the mobile poster be skipped entirely. */
function validatePoster(file, { required, label }) {
    const missing = !file || typeof file === 'string' || !file.size;
    if (missing) return required ? `Please upload the ${label} poster.` : null;
    if (file.size > MAX_UPLOAD_BYTES) return `The ${label} poster is too large — please keep it under 8MB.`;
    if (!/^image\//.test(file.type || '')) return `The ${label} poster must be an image file (JPG, PNG or WEBP).`;
    return null;
}

/** Recompress to keep documents small and consistent — long edge capped at
 *  1600px, JPEG q82. Poster-style announcements don't need more. */
async function processPoster(file) {
    const rawBuffer = Buffer.from(await file.arrayBuffer());
    return sharp(rawBuffer)
        .resize({ width: 1600, height: 1600, fit: 'inside', withoutEnlargement: true })
        .jpeg({ quality: 82 })
        .toBuffer();
}

/** List every announcement (newest first) — admin history view. Image bytes are
 *  never included here; the list only needs a small thumbnail-ready flag. */
export async function GET(request) {
    if (!isAuthenticated(request)) {
        return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });
    }
    try {
        const collection = await getAnnouncementsCollection();
        const docs = await collection
            .find({}, { projection: { imageData: 0, mobileImageData: 0 } })
            .sort({ createdAt: -1 })
            .toArray();
        // `hasMobile` is derived server-side so the history list never has to
        // guess from a field it deliberately doesn't download.
        return NextResponse.json({ success: true, announcements: docs });
    } catch (error) {
        console.error('[dashboard/announcements] list failed:', error);
        return NextResponse.json({ success: false, message: 'Could not load announcements.' }, { status: 500 });
    }
}

/** Create a new announcement. The web/tablet poster + exclusiveFor tier are
 *  mandatory; a separate mobile poster (4:5) is optional and, when present, is
 *  what phones get served instead of the wider web artwork. Creating an
 *  announcement deactivates whatever was previously live — only one is ever
 *  shown to visitors at a time, but older ones stay as history. */
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
    const mobileFile = form.get('mobileImage');
    const exclusiveFor = String(form.get('exclusiveFor') || '').trim();
    const title = String(form.get('title') || '').trim();
    const note = String(form.get('note') || '').trim();
    // Only meaningful when a mobile poster is actually attached.
    const mobileEnabled = String(form.get('mobileEnabled') ?? 'true') !== 'false';

    const errors = {};
    const imageError = validatePoster(file, { required: true, label: 'web & tablet' });
    if (imageError) errors.image = imageError;
    const mobileError = validatePoster(mobileFile, { required: false, label: 'mobile' });
    if (mobileError) errors.mobileImage = mobileError;

    if (!exclusiveFor) {
        errors.exclusiveFor = 'Please select which passout-year batch this announcement is for.';
    } else if (!VALID_TIERS.includes(exclusiveFor)) {
        errors.exclusiveFor = 'Please select a valid passout-year batch.';
    }
    if (Object.keys(errors).length > 0) {
        return NextResponse.json({ success: false, message: 'Please correct the highlighted fields.', errors }, { status: 422 });
    }

    const hasMobileUpload = mobileFile && typeof mobileFile !== 'string' && mobileFile.size > 0;

    let imageBuffer, mobileBuffer = null;
    try {
        imageBuffer = await processPoster(file);
        if (hasMobileUpload) mobileBuffer = await processPoster(mobileFile);
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
            imageContentType: 'image/jpeg',
            mobileImageData: mobileBuffer,
            mobileImageContentType: mobileBuffer ? 'image/jpeg' : null,
            hasMobile: Boolean(mobileBuffer),
            // With no mobile poster there is nothing to switch on, so the flag
            // stays false and phones fall back to the web/tablet artwork.
            mobileEnabled: Boolean(mobileBuffer) && mobileEnabled,
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
