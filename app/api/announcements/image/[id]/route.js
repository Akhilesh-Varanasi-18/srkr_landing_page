import { NextResponse } from 'next/server';
import { ObjectId } from 'mongodb';
import { getAnnouncementsCollection } from '../../../../../lib/mongodb';

// Public — serves the announcement's stored image bytes directly from Mongo.
export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export async function GET(request, { params }) {
    let id;
    try { id = new ObjectId(params.id); } catch { return new NextResponse('Not found', { status: 404 }); }

    try {
        const collection = await getAnnouncementsCollection();
        const doc = await collection.findOne({ _id: id }, { projection: { imageData: 1, imageContentType: 1 } });
        if (!doc?.imageData) return new NextResponse('Not found', { status: 404 });

        return new NextResponse(doc.imageData.buffer ?? doc.imageData, {
            status: 200,
            headers: {
                'Content-Type': doc.imageContentType || 'image/jpeg',
                // Immutable — a new announcement gets a new _id/new URL, so this
                // exact URL's bytes never change and can cache hard.
                'Cache-Control': 'public, max-age=31536000, immutable'
            }
        });
    } catch (error) {
        console.error('[announcements/image] failed:', error);
        return new NextResponse('Server error', { status: 500 });
    }
}
