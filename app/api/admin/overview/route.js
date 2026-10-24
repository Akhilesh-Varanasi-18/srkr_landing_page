import { NextResponse } from 'next/server';
import { isAuthenticated } from '../../../../lib/dashboard-auth';
import { getRegistrationsCollection, getAnnouncementsCollection } from '../../../../lib/mongodb';
import { startOfISTDay } from '../../../../lib/analytics-range';
import { REGISTRATION_PROGRAMS } from '../../../../lib/registration-schema';
import { eligibleRoster } from '../../../../lib/registration-eligibility';
import { listPrograms, programStats } from '../../../../lib/coding-profiles/program-store';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

/**
 * The admin landing page's three module cards, in one round trip: headline
 * registration figures and the open intake, the coding programs with their latest
 * capture, and whichever announcement is live. Each block fails soft so one slow
 * collection never blanks the whole page.
 */
export async function GET(request) {
    if (!isAuthenticated(request)) {
        return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });
    }

    const now = new Date();
    const todayStart = startOfISTDay(now);
    const weekStart = new Date(todayStart.getTime() - 6 * 24 * 60 * 60 * 1000);
    const open = REGISTRATION_PROGRAMS.find((p) => p.open) || null;

    const registrations = (async () => {
        const collection = await getRegistrationsCollection();
        const [total, today, week, openCount, roster] = await Promise.all([
            collection.countDocuments({}),
            collection.countDocuments({ createdAt: { $gte: todayStart } }),
            collection.countDocuments({ createdAt: { $gte: weekStart } }),
            open ? collection.countDocuments({ programCode: open.code }) : 0,
            open?.eligibility === 'skillup-roster' ? eligibleRoster().catch(() => []) : []
        ]);
        return {
            total,
            today,
            week,
            programs: REGISTRATION_PROGRAMS.length,
            openIntake: open
                ? { key: open.key, name: open.programName, registered: openCount, eligible: roster.length || null }
                : null
        };
    })();

    const coding = (async () => {
        const [programs, stats] = await Promise.all([listPrograms(), programStats()]);
        const rows = programs.map((p) => {
            const capture = stats.captures.get(p.code) || null;
            return { code: p.code, name: p.name, students: stats.students.get(p.code) || 0, capturedAt: capture?.capturedAt || null };
        });
        const latest = rows.reduce((a, r) => (r.capturedAt && (!a || new Date(r.capturedAt) > new Date(a)) ? r.capturedAt : a), null);
        return {
            programs: rows,
            programCount: rows.length,
            students: rows.reduce((n, r) => n + r.students, 0),
            latestCapture: latest
        };
    })();

    const announcements = (async () => {
        const collection = await getAnnouncementsCollection();
        const [live, total] = await Promise.all([
            collection.findOne(
                { isActive: true },
                { projection: { _id: 1, title: 1, exclusiveFor: 1, createdAt: 1 }, sort: { createdAt: -1 } }
            ),
            collection.countDocuments({})
        ]);
        return {
            total,
            live: live ? { id: String(live._id), title: live.title || null, exclusiveFor: live.exclusiveFor || null, createdAt: live.createdAt } : null
        };
    })();

    const settle = (promise, label) =>
        promise.catch((error) => {
            console.error(`[admin/overview] ${label} failed:`, error);
            return null;
        });

    const [reg, cod, ann] = await Promise.all([
        settle(registrations, 'registrations'),
        settle(coding, 'coding'),
        settle(announcements, 'announcements')
    ]);

    return NextResponse.json({
        success: true,
        generatedAt: now.toISOString(),
        registrations: reg,
        coding: cod,
        announcements: ann
    });
}
