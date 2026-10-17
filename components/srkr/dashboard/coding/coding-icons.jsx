// Inline stroke icons for the coding-profiles shell. Same convention as
// dashboard-icons.jsx — no icon dependency, no CDN font, everything inherits
// currentColor so a nav item can recolour its icon by changing `color` alone.

const base = {
    width: 18,
    height: 18,
    viewBox: '0 0 24 24',
    fill: 'none',
    stroke: 'currentColor',
    strokeWidth: 1.9,
    strokeLinecap: 'round',
    strokeLinejoin: 'round'
};

export const IconTrophy = (p) => (
    <svg {...base} {...p}>
        <path d="M8 21h8M12 17v4M7 4h10v5a5 5 0 0 1-10 0V4Z" />
        <path d="M7 6H4.5a1.5 1.5 0 0 0-1.5 1.5C3 10 4.5 11.5 7 12M17 6h2.5A1.5 1.5 0 0 1 21 7.5C21 10 19.5 11.5 17 12" />
    </svg>
);

export const IconPeople = (p) => (
    <svg {...base} {...p}>
        <circle cx="9" cy="8" r="3.5" />
        <path d="M2.5 20a6.5 6.5 0 0 1 13 0" />
        <circle cx="17" cy="9" r="2.6" />
        <path d="M16.2 15.2a5 5 0 0 1 5.3 4.8" />
    </svg>
);

export const IconChart = (p) => (
    <svg {...base} {...p}>
        <path d="M4 20V10M10 20V4M16 20v-7M22 20H2" />
    </svg>
);

export const IconReport = (p) => (
    <svg {...base} {...p}>
        <path d="M14 3H7a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V8l-5-5Z" />
        <path d="M14 3v5h5M9 13h6M9 17h6" />
    </svg>
);

export const IconChevronRight = (p) => (
    <svg {...base} {...p}>
        <path d="m9 6 6 6-6 6" />
    </svg>
);

export const IconChevronLeft = (p) => (
    <svg {...base} {...p}>
        <path d="m15 6-6 6 6 6" />
    </svg>
);

export const IconArrowLeft = (p) => (
    <svg {...base} {...p}>
        <path d="M19 12H5M11 18l-6-6 6-6" />
    </svg>
);

export const IconPulse = (p) => (
    <svg {...base} {...p}>
        <path d="M3 12h4l2.5-6 4 12 2.5-6h5" />
    </svg>
);

export const IconMoon = (p) => (
    <svg {...base} {...p}>
        <path d="M20 14.5A8.5 8.5 0 0 1 9.5 4a8.5 8.5 0 1 0 10.5 10.5Z" />
    </svg>
);

export const IconClock = (p) => (
    <svg {...base} {...p}>
        <circle cx="12" cy="12" r="9" />
        <path d="M12 7v5l3 2" />
    </svg>
);

export const IconExternal = (p) => (
    <svg {...base} {...p}>
        <path d="M14 4h6v6M20 4l-9 9M19 14v5a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V6a1 1 0 0 1 1-1h5" />
    </svg>
);

export const IconCrown = (p) => (
    <svg {...base} {...p} fill="currentColor" stroke="none">
        <path d="M3 8.5 7.5 12l4.5-6 4.5 6L21 8.5 19.5 18h-15L3 8.5Z" />
        <rect x="4.5" y="19" width="15" height="2.2" rx="1.1" />
    </svg>
);

export const IconSparkle = (p) => (
    <svg {...base} {...p}>
        <path d="M12 3v4M12 17v4M3 12h4M17 12h4M6 6l2.5 2.5M15.5 15.5 18 18M6 18l2.5-2.5M15.5 8.5 18 6" />
    </svg>
);

export const IconPrint = (p) => (
    <svg {...base} {...p}>
        <path d="M6 9V3h12v6M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2" />
        <path d="M6 14h12v7H6z" />
    </svg>
);

export const IconMenu = (p) => (
    <svg {...base} {...p}>
        <path d="M4 7h16M4 12h16M4 17h16" />
    </svg>
);
