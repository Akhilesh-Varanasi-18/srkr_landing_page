'use client';

import { useEffect, useState } from 'react';

/**
 * Tracks a media query. Starts as `initial` on the server and first client render,
 * then follows the real viewport — so a component that renders differently per
 * breakpoint never disagrees with its own server markup.
 */
export function useMedia(query, initial = false) {
    const [matches, setMatches] = useState(initial);

    useEffect(() => {
        const mq = window.matchMedia(query);
        const sync = () => setMatches(mq.matches);
        sync();
        mq.addEventListener('change', sync);
        return () => mq.removeEventListener('change', sync);
    }, [query]);

    return matches;
}
