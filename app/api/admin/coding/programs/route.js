import { NextResponse } from 'next/server';
import { isAuthenticated } from '../../../../../lib/dashboard-auth';
import {
    listPrograms,
    createProgram,
    validateProgramInput,
    programStats
} from '../../../../../lib/coding-profiles/program-store';
import { recordAudit } from '../../../../../lib/coding-profiles/store';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

const MAX_BODY_BYTES = 2048;

/** GET — every program with its roster size and latest capture, for tabs and cards. */
export async function GET(request) {
    if (!isAuthenticated(request)) {
        return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });
    }
    try {
        const [programs, stats] = await Promise.all([listPrograms(), programStats()]);
        return NextResponse.json({
            success: true,
            programs: programs.map((p) => {
                const capture = stats.captures.get(p.code) || null;
                return {
                    ...p,
                    students: stats.students.get(p.code) || 0,
                    capturedAt: capture?.capturedAt || null,
                    captured: capture?.summary?.captured ?? capture?.rowCount ?? 0
                };
            })
        });
    } catch (error) {
        console.error('[coding/programs] list failed:', error);
        return NextResponse.json({ success: false, message: 'Database unreachable.' }, { status: 503 });
    }
}

/** POST { name, yearLabel?, passoutYear?, tagline? } — create a program. */
export async function POST(request) {
    if (!isAuthenticated(request)) {
        return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });
    }
    const origin = request.headers.get('origin');
    if (origin && new URL(origin).host !== request.headers.get('host')) {
        return NextResponse.json({ success: false, message: 'Bad origin.' }, { status: 403 });
    }

    let payload;
    try {
        const raw = await request.text();
        if (raw.length > MAX_BODY_BYTES) {
            return NextResponse.json({ success: false, message: 'Request body too large.' }, { status: 413 });
        }
        payload = JSON.parse(raw);
    } catch {
        return NextResponse.json({ success: false, message: 'Invalid request format.' }, { status: 400 });
    }

    const { values, errors } = validateProgramInput(payload || {});
    if (Object.keys(errors).length) {
        return NextResponse.json({ success: false, message: 'Please correct the highlighted fields.', errors }, { status: 422 });
    }

    try {
        const program = await createProgram(values);
        await recordAudit({ programCode: program.code, action: 'program.create', name: program.name });
        return NextResponse.json({ success: true, program }, { status: 201 });
    } catch (error) {
        if (error?.code === 'name_taken') {
            return NextResponse.json({ success: false, message: error.message, errors: { name: error.message } }, { status: 409 });
        }
        console.error('[coding/programs] create failed:', error);
        return NextResponse.json({ success: false, message: 'Could not create the program.' }, { status: 500 });
    }
}
