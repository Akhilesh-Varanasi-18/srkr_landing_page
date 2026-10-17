import Link from 'next/link';
import { redirect } from 'next/navigation';
import { PROGRAMS, availablePrograms } from '../../../lib/coding-profiles/programs';

export const metadata = {
    title: 'Coding Profiles',
    description: 'Internal ToriiMinds × SRKR coding-profile analytics.',
    robots: { index: false, follow: false }
};

/**
 * Step 1 — pick a program.
 *
 * With exactly one live program this would be a screen whose only purpose is to be
 * clicked through, so it redirects straight past itself. The step still exists in the
 * route tree: the moment Bamboo Coder starts reporting, this page renders the choice
 * without anything else needing to change, and /dashboard/coding-profiles stays a
 * stable link either way.
 */
export default function CodingProfilesIndex() {
    const live = availablePrograms();

    if (live.length === 1) {
        redirect(`/dashboard/coding-profiles/${live[0].code}`);
    }

    return (
        <main className="cp-picker">
            <header className="cp-picker__head">
                <p className="cp-picker__eyebrow">Coding profiles</p>
                <h1>Select a program</h1>
                <p className="cp-picker__sub">
                    Each program keeps its own roster, captures and scoring.
                </p>
            </header>

            <ul className="cp-picker__list">
                {PROGRAMS.map((program) => {
                    const card = (
                        <>
                            <span className="cp-picker__name">{program.name}</span>
                            <span className="cp-picker__meta">
                                {program.college} · {program.yearLabel} · Class of {program.passoutYear}
                            </span>
                            <span className="cp-picker__tagline">{program.tagline}</span>
                            {!program.available && (
                                <span className="cp-chip cp-chip--ghost">
                                    {program.unavailableReason || 'Not reporting yet'}
                                </span>
                            )}
                        </>
                    );

                    return (
                        <li key={program.code}>
                            {program.available ? (
                                <Link
                                    href={`/dashboard/coding-profiles/${program.code}`}
                                    className="cp-picker__card"
                                >
                                    {card}
                                </Link>
                            ) : (
                                <span className="cp-picker__card is-disabled" aria-disabled="true">
                                    {card}
                                </span>
                            )}
                        </li>
                    );
                })}
            </ul>
        </main>
    );
}
