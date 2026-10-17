import { notFound } from 'next/navigation';
import CodingClient from '../../../../components/srkr/dashboard/coding/coding-client';
import { PROGRAMS, getProgram } from '../../../../lib/coding-profiles/programs';

// A thin SERVER shell. Keeping it server-side is what preserves `robots: noindex` on
// a page that lists 317 students by name — making the layout or this page a client
// component would silently drop the metadata export.
//
// The shell itself is prerendered because it holds no student data: every figure on
// this page is fetched client-side from the passcode-gated overview route, so nothing
// identifying is ever baked into static HTML.
export function generateStaticParams() {
    return PROGRAMS.map((program) => ({ program: program.code }));
}

export async function generateMetadata({ params }) {
    const program = getProgram(params.program);
    return {
        title: program ? `${program.name} · Coding Profiles` : 'Coding Profiles',
        description: 'Internal ToriiMinds × SRKR coding-profile analytics.',
        robots: { index: false, follow: false }
    };
}

export default function ProgramPage({ params }) {
    const program = getProgram(params.program);
    if (!program) notFound();

    if (!program.available) {
        return (
            <main className="cp-page">
                <div className="cp-emptystate">
                    <h2>{program.name} is not reporting yet</h2>
                    <p>{program.unavailableReason}</p>
                </div>
            </main>
        );
    }

    // The program object is serialisable and tiny, so it is handed to the client
    // rather than re-fetched there.
    return <CodingClient program={program} />;
}
