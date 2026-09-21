import { NextResponse } from 'next/server';
import { ObjectId } from 'mongodb';
import { getAnnouncementsCollection } from '../../../../../lib/mongodb';
import { isAuthenticated } from '../../../../../lib/dashboard-auth';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

function parseId(raw) {
    try { return new ObjectId(raw); } catch { return null; }
}

/** Reactivate a past announcement — deactivates whatever is currently live. */
export async function PATCH(request, { params }) {
    if (!isAuthenticated(request)) {
        return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });
    }
    const id = parseId(params.id);
    if (!id) return NextResponse.json({ success: false, message: 'Invalid announcement id.' }, { status: 400 });

    let body = {};
    try { body = await request.json(); } catch { /* no body is fine — default action is activate */ }

    try {
        const collection = await getAnnouncementsCollection();
        const existing = await collection.findOne({ _id: id }, { projection: { _id: 1 } });
        if (!existing) return NextResponse.json({ success: false, message: 'Announcement not found.' }, { status: 404 });

        if (body.action === 'deactivate') {
            await collection.updateOne({ _id: id }, { $set: { isActive: false, updatedAt: new Date() } });
        } else {
            await collection.updateMany({ isActive: true }, { $set: { isActive: false } });
            await collection.updateOne({ _id: id }, { $set: { isActive: true, updatedAt: new Date() } });
        }
        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('[dashboard/announcements/:id] patch failed:', error);
        return NextResponse.json({ success: false, message: 'Could not update the announcement.' }, { status: 500 });
    }
}

/** Permanently delete one announcement (and its stored image). */
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
