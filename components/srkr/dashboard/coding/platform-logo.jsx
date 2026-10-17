'use client';

import { PLATFORM_BY_KEY } from './coding-theme';

// A platform's logo as a small glossy glass badge: white rounded tile, inner
// highlight, a shadow tinted with the platform's accent, and a sheen that sweeps
// across on hover. Replaces the "LC / CC / HR / GFG" codes everywhere.
//
// Sizes: xs 20px (tabs, tooltips, top bar) · sm 26px (card rail) · md 34px
// (podium tiles, detail blocks) · lg 44px (detail links on wide screens).
// Decorative by default — the name is always written or spoken beside it — so the
// image is empty-alt unless `labelled` asks for the name.

/** "#E2544C" -> "rgba(226, 84, 76, a)" for the badge's tinted shadow. */
function glow(hex, alpha) {
    const n = parseInt(String(hex).replace('#', ''), 16);
    if (!Number.isFinite(n)) return `rgba(226, 84, 76, ${alpha})`; // --srkr-primary
    return `rgba(${(n >> 16) & 255}, ${(n >> 8) & 255}, ${n & 255}, ${alpha})`;
}

export default function PlatformLogo({ platform, size = 'sm', labelled = false, className = '' }) {
    const p = typeof platform === 'string' ? PLATFORM_BY_KEY[platform] : platform;
    if (!p?.logo) return null;
    return (
        <span
            className={`cp-plogo cp-plogo--${size} cp-plogo--${p.key} ${className}`.trim()}
            style={{ '--cp-plogo-glow': glow(p.accent, 0.24) }}
            aria-hidden={labelled ? undefined : 'true'}
        >
            <img src={p.logo} alt={labelled ? p.name : ''} width="256" height="256" loading="lazy" decoding="async" draggable="false" />
        </span>
    );
}
