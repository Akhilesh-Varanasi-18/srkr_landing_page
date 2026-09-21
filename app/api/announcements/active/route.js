import { NextResponse } from 'next/server';
import { getAnnouncementsCollection } from '../../../../lib/mongodb';

// Public — the landing page polls this instead of importing a static file, so
// an admin's new announcement goes live to every visitor immediately.
export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export async function GET() {
    try {
        const collection = await getAnnouncementsCollection();
        const doc = await collection.findOne(
            { isActive: true },
            { projection: { imageData: 0 }, sort: { createdAt: -1 } }
        );
        if (!doc) return NextResponse.json({ success: true, announcement: null });

        return NextResponse.json({
            success: true,
            announcement: {
                id: String(doc._id),
                image: `/api/announcements/image/${doc._id}`,
                exclusiveFor: doc.exclusiveFor,
                title: doc.title || null,
                note: doc.note || null,
                createdAt: doc.createdAt
            }
        });
    } catch (error) {
        console.error('[announcements/active] failed:', error);
        // Fail soft — a broken announcement fetch should never block the landing page.
        return NextResponse.json({ success: true, announcement: null });
    }
}
