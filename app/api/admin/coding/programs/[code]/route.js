import { NextResponse } from 'next/server';
import { isAuthenticated } from '../../../../../../lib/dashboard-auth';
import { getProgram, deleteEmptyProgram } from '../../../../../../lib/coding-profiles/program-store';
import { recordAudit } from '../../../../../../lib/coding-profiles/store';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

/**
 * DELETE — removes a program that holds no roster and no captures (one created by
 * mistake). A program with data is refused: uploads are never thrown away from here.
 */
export async function DELETE(request, { params }) {
    if (!isAuthenticated(request)) {
        return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });
    }
    const origin = request.headers.get('origin');
    if (origin && new URL(origin).host !== request.headers.get('host')) {
        return NextResponse.json({ success: false, message: 'Bad origin.' }, { status: 403 });
    }

    try {
        const program = await getProgram(params.code);
        if (!program) return NextResponse.json({ success: false, message: 'Unknown program.' }, { status: 404 });
        await deleteEmptyProgram(program.code);
        await recordAudit({ programCode: program.code, action: 'program.delete', name: program.name });
        return NextResponse.json({ success: true });
    } catch (error) {
        if (error?.code === 'not_empty') {
            return NextResponse.json({ success: false, message: error.message }, { status: 409 });
        }
        console.error('[coding/programs] delete failed:', error);
        return NextResponse.json({ success: false, message: 'Could not remove the program.' }, { status: 500 });
    }
}
