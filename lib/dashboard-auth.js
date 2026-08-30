import crypto from 'crypto';

// Passcode gate for the registrations dashboard. A single shared passcode lives
// in DASHBOARD_PASSCODE (.env.local). On successful login we set an httpOnly
// cookie whose value is sha256(passcode); every protected route re-derives the
// expected hash from the env var and timing-safe compares. No session store,
// no user table — just enough to keep student PII off the open internet.

export const DASHBOARD_COOKIE = 'srkr_dash';
// 8 hours — long enough for a working session, short enough that a shared laptop
// doesn't stay unlocked forever.
export const DASHBOARD_COOKIE_MAX_AGE = 60 * 60 * 8;

const sha256 = (value) => crypto.createHash('sha256').update(String(value)).digest('hex');

/** The token we store in the cookie for a correct passcode, or null if unconfigured. */
export function expectedToken() {
    const passcode = process.env.DASHBOARD_PASSCODE;
    if (!passcode) return null;
    return sha256(passcode);
}

/** True when the submitted passcode matches DASHBOARD_PASSCODE. */
export function passcodeMatches(candidate) {
    const passcode = process.env.DASHBOARD_PASSCODE;
    if (!passcode) return false;
    const a = sha256(candidate);
    const b = sha256(passcode);
    // Compare the fixed-length hashes (never the raw passcodes) to avoid leaking
    // length and to keep the comparison timing-safe.
    return crypto.timingSafeEqual(Buffer.from(a), Buffer.from(b));
}

/** True when the request carries a valid dashboard session cookie. */
export function isAuthenticated(request) {
    const expected = expectedToken();
    if (!expected) return false;
    const token = request.cookies.get(DASHBOARD_COOKIE)?.value;
    if (!token || token.length !== expected.length) return false;
    try {
        return crypto.timingSafeEqual(Buffer.from(token), Buffer.from(expected));
    } catch {
        return false;
    }
}

/** Standard cookie options for the session cookie. */
export function sessionCookieOptions() {
    return {
        httpOnly: true,
        sameSite: 'strict',
        secure: process.env.NODE_ENV === 'production',
        path: '/',
        maxAge: DASHBOARD_COOKIE_MAX_AGE
    };
}
