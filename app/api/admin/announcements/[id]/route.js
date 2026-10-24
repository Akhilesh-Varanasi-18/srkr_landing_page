import { NextResponse } from 'next/server';
import { ObjectId } from 'mongodb';
import sharp from 'sharp';
import { getAnnouncementsCollection } from '../../../../../lib/mongodb';
import { isAuthenticated } from '../../../../../lib/dashboard-auth';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

const MAX_UPLOAD_BYTES = 8 * 1024 * 1024;

function parseId(raw) {
    try { return new ObjectId(raw); } catch { return null; }
}

/** Attach / replace the mobile poster on an existing announcement. Sent as
 *  multipart (field `mobileImage`) rather than JSON because it carries bytes. */
async function handleMobileUpload(request, collection, id) {
    let form;
    try {
        form = await request.formData();
    } catch {
        return NextResponse.json({ success: false, message: 'Invalid upload.' }, { status: 400 });
    }

    const file = form.get('mobileImage');
    if (!file || typeof file === 'string' || !file.size) {
        return NextResponse.json({ success: false, message: 'Please choose a mobile poster image.' }, { status: 422 });
    }
    if (file.size > MAX_UPLOAD_BYTES) {
        return NextResponse.json({ success: false, message: 'The mobile poster is too large — please keep it under 8MB.' }, { status: 422 });
    }
    if (!/^image\//.test(file.type || '')) {
        return NextResponse.json({ success: false, message: 'The mobile poster must be an image file (JPG, PNG or WEBP).' }, { status: 422 });
    }

    let buffer;
    try {
        buffer = await sharp(Buffer.from(await file.arrayBuffer()))
            .resize({ width: 1600, height: 1600, fit: 'inside', withoutEnlargement: true })
            .jpeg({ quality: 82 })
            .toBuffer();
    } catch (error) {
        console.error('[dashboard/announcements/:id] mobile image processing failed:', error);
        return NextResponse.json({ success: false, message: 'Could not process that image. Please try a different file.' }, { status: 400 });
    }

    await collection.updateOne({ _id: id }, {
        $set: {
            mobileImageData: buffer,
            mobileImageContentType: 'image/jpeg',
            hasMobile: true,
            mobileEnabled: true,
            // Bumping this busts the immutable image cache, which is keyed on
            // the announcement id — without it the old poster would stick.
            mobileVersion: Date.now(),
            updatedAt: new Date()
        }
    });
    return NextResponse.json({ success: true });
}

/** Update one announcement. Supported JSON actions:
 *   - activate / deactivate ...... whether visitors see this announcement at all
 *   - enable-mobile / disable-mobile ... whether phones get the dedicated
 *     mobile poster, or fall back to the web/tablet one
 *   - remove-mobile .............. drop the mobile poster entirely
 *  A multipart body instead means "attach/replace the mobile poster". */
export async function PATCH(request, { params }) {
    if (!isAuthenticated(request)) {
        return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });
    }
    const id = parseId(params.id);
    if (!id) return NextResponse.json({ success: false, message: 'Invalid announcement id.' }, { status: 400 });

    let collection;
    try {
        collection = await getAnnouncementsCollection();
    } catch (error) {
        console.error('[dashboard/announcements/:id] database connection failed:', error);
        return NextResponse.json({ success: false, message: 'We could not reach the database. Please try again.' }, { status: 503 });
    }

    try {
        const existing = await collection.findOne({ _id: id }, { projection: { _id: 1, hasMobile: 1 } });
        if (!existing) return NextResponse.json({ success: false, message: 'Announcement not found.' }, { status: 404 });

        if ((request.headers.get('content-type') || '').includes('multipart/form-data')) {
            return await handleMobileUpload(request, collection, id);
        }

        let body = {};
        try { body = await request.json(); } catch { /* no body is fine — default action is activate */ }
        const now = new Date();

        switch (body.action) {
            case 'deactivate':
                await collection.updateOne({ _id: id }, { $set: { isActive: false, updatedAt: now } });
                break;
            case 'enable-mobile':
                if (!existing.hasMobile) {
                    return NextResponse.json({ success: false, message: 'Upload a mobile poster first.' }, { status: 422 });
                }
                await collection.updateOne({ _id: id }, { $set: { mobileEnabled: true, updatedAt: now } });
                break;
            case 'disable-mobile':
                await collection.updateOne({ _id: id }, { $set: { mobileEnabled: false, updatedAt: now } });
                break;
            case 'remove-mobile':
                await collection.updateOne({ _id: id }, {
                    $set: {
                        mobileImageData: null,
                        mobileImageContentType: null,
                        hasMobile: false,
                        mobileEnabled: false,
                        updatedAt: now
                    }
                });
                break;
            default:
                await collection.updateMany({ isActive: true }, { $set: { isActive: false } });
                await collection.updateOne({ _id: id }, { $set: { isActive: true, updatedAt: now } });
        }
        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('[dashboard/announcements/:id] patch failed:', error);
        return NextResponse.json({ success: false, message: 'Could not update the announcement.' }, { status: 500 });
    }
}

/** Permanently delete one announcement (and both of its stored posters). */
export async function DELETE(request, { params }) {
    if (!isAuthenticated(request)) {
        return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });
    }
    const id = parseId(params.id);
    if (!id) return NextResponse.json({ success: false, message: 'Invalid announcement id.' }, { status: 400 });

    try {
        const collection = await getAnnouncementsCollection();
        const result = await collection.deleteOne({ _id: id });
        if (result.deletedCount === 0) {
            return NextResponse.json({ success: false, message: 'Announcement not found.' }, { status: 404 });
        }
        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('[dashboard/announcements/:id] delete failed:', error);
        return NextResponse.json({ success: false, message: 'Could not delete the announcement.' }, { status: 500 });
    }
}
