import { NextResponse } from 'next/server';
import {
    passcodeMatches,
    expectedToken,
    isAuthenticated,
    sessionCookieOptions,
    DASHBOARD_COOKIE
} from '../../../../lib/dashboard-auth';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

/** GET — cheap check the client uses on load to decide login-screen vs dashboard. */
export async function GET(request) {
    if (!expectedToken()) {
        return NextResponse.json(
            { authenticated: false, configured: false, message: 'DASHBOARD_PASSCODE is not set on the server.' },
            { status: 200 }
        );
    }
    return NextResponse.json({ authenticated: isAuthenticated(request), configured: true });
}

/** POST { passcode } — set the session cookie on a correct passcode. */
export async function POST(request) {
    if (!expectedToken()) {
        return NextResponse.json(
            { success: false, message: 'Dashboard access is not configured. Set DASHBOARD_PASSCODE and restart.' },
            { status: 503 }
        );
    }

    let passcode;
    try {
        const body = await request.json();
        passcode = typeof body?.passcode === 'string' ? body.passcode : '';
    } catch {
        return NextResponse.json({ success: false, message: 'Invalid request.' }, { status: 400 });
    }

    if (!passcode || !passcodeMatches(passcode)) {
        return NextResponse.json({ success: false, message: 'Incorrect passcode.' }, { status: 401 });
    }

    const response = NextResponse.json({ success: true });
    response.cookies.set(DASHBOARD_COOKIE, expectedToken(), sessionCookieOptions());
    return response;
}

/** DELETE — log out by clearing the cookie. */
export async function DELETE() {
    const response = NextResponse.json({ success: true });
    response.cookies.set(DASHBOARD_COOKIE, '', { ...sessionCookieOptions(), maxAge: 0 });
    return response;
}
