import { NextResponse } from 'next/server';
import { ObjectId } from 'mongodb';
import { getAnnouncementsCollection } from '../../../../../lib/mongodb';

// Public — serves an announcement's stored poster bytes directly from Mongo.
// `?variant=mobile` returns the dedicated 4:5 phone poster; anything else (or
// no mobile poster on file) returns the web/tablet artwork.
export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export async function GET(request, { params }) {
    let id;
    try { id = new ObjectId(params.id); } catch { return new NextResponse('Not found', { status: 404 }); }

    const url = new URL(request.url);
    const wantsMobile = url.searchParams.get('variant') === 'mobile';
    // A cache-busting token the callers append whenever the mobile poster is
    // replaced — its presence is what makes a response safe to cache forever.
    const versioned = url.searchParams.has('v');

    try {
        const collection = await getAnnouncementsCollection();
        const doc = await collection.findOne(
            { _id: id },
            { projection: { imageData: 1, imageContentType: 1, mobileImageData: 1, mobileImageContentType: 1 } }
        );
        if (!doc) return new NextResponse('Not found', { status: 404 });

        // Fall back to the web poster so a phone never ends up with a broken
        // image when only one poster was uploaded.
        const useMobile = wantsMobile && Boolean(doc.mobileImageData);
        const data = useMobile ? doc.mobileImageData : doc.imageData;
        const contentType = (useMobile ? doc.mobileImageContentType : doc.imageContentType) || 'image/jpeg';
        if (!data) return new NextResponse('Not found', { status: 404 });

        return new NextResponse(data.buffer ?? data, {
            status: 200,
            headers: {
                'Content-Type': contentType,
                // The web poster is write-once, so its URL's bytes never change
                // and can cache hard. The mobile poster can be swapped in place,
                // so it only caches hard when the caller pins a version.
                'Cache-Control': wantsMobile && !versioned
                    ? 'public, max-age=60, must-revalidate'
                    : 'public, max-age=31536000, immutable'
            }
        });
    } catch (error) {
        console.error('[announcements/image] failed:', error);
        return new NextResponse('Server error', { status: 500 });
    }
}
