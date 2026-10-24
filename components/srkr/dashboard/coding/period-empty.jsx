'use client';

import { fmtDay, fromIso, isoDate, isIsoDate } from '../../../../lib/coding-profiles/period';

// Shown when the chosen period holds no capture: nothing can be counted inside it.
// Lists the captures on record so the admin can jump to one that has numbers.

export default function PeriodEmpty({ label, captures = [], onPick, onReset }) {
    const days = [...new Set(captures.map((c) => isoDate(new Date(c))).filter(isIsoDate))].sort().reverse();
    return (
        <section className="cp-period-empty" aria-live="polite">
            <h2>No capture falls inside {label}</h2>
            <p>
                A period shows what was added between the last capture before it and the last capture inside it.
                Pick a period that contains a capture, or one of the capture dates below.
            </p>
            <div className="cp-period-empty__captures">
                {days.map((d) => (
                    <button key={d} type="button" className="cp-period__capture" onClick={() => onPick?.({ from: d, to: d })}>
                        {fmtDay(fromIso(d))}
                    </button>
                ))}
                <button type="button" className="cp-period__capture" onClick={onReset}>
                    All time
                </button>
            </div>
        </section>
    );
}
