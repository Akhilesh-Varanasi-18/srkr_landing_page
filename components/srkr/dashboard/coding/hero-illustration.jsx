'use client';

import { motion, useReducedMotion } from 'framer-motion';
import { BRAND } from './coding-theme';

// Hero-banner illustration: a student at a desk, hands on an open laptop, with a desk
// lamp and a plant at the left edge and a takeaway coffee at the right. A soft amber
// cloud with thin white flowing curves sits behind the scene. Flat shapes only — no
// raster, no text, no webfont.
//
// Geometry lives in a 560x320 viewBox and the SVG is sized by its container. It sits
// on the banner's warm gradient, so there is no background rect. Colour follows the
// dashboard rule: #F2A63B / #ED9035 are fills only (blob, laptop lid, lamp light) and
// never a thin stroke; the face is plain white with a slate outline like the avatars.
// The person is drawn slightly right of centre so the left third — where the banner's
// copy sits — stays calmer than the right.
//
// Motion: steam drifts, the lamp glow breathes, the hands tap, the torso breathes, the
// plant sways and the flow lines drift. With prefers-reduced-motion every wrapper
// collapses to a plain <g>: same static scene, zero loops, no entrance.

const INK = '#1E293B'; // headingAlt — hair, desk, lamp arm (not a BRAND key)
const WHITE = '#FFFFFF';
const PLANT_BASE = { x: 56, y: 284 };

/** Plain <g> under reduced motion; otherwise a motion.g with the given props. */
function Motion({ reduce, children, ...motionProps }) {
    if (reduce) return <g>{children}</g>;
    return <motion.g {...motionProps}>{children}</motion.g>;
}

/** One pointed leaf of `length`, rising from the plant base at `rotate` degrees. */
function Leaf({ rotate, length, fill, opacity }) {
    const w = length * 0.2;
    const d = `M0 0C${-w} ${-length * 0.3} ${-w} ${-length * 0.72} 0 ${-length}C${w} ${-length * 0.72} ${w} ${-length * 0.3} 0 0Z`;
    return (
        <g transform={`translate(${PLANT_BASE.x} ${PLANT_BASE.y}) rotate(${rotate})`}>
            <path d={d} fill={fill} opacity={opacity} />
            <line x1="0" y1="-4" x2="0" y2={-length * 0.82} stroke={BRAND.body} strokeWidth="1.2" opacity="0.45" />
        </g>
    );
}

/** A steam wisp that rises and fades on its own clock. */
function Wisp({ d, delay, reduce }) {
    return (
        <Motion
            reduce={reduce}
            animate={{ y: [0, -14], opacity: [0, 0.6, 0] }}
            transition={{ duration: 3.4, delay, repeat: Infinity, ease: 'easeInOut' }}
        >
            <path d={d} fill="none" stroke={BRAND.muted} strokeWidth="2" strokeLinecap="round" opacity={reduce ? 0.35 : 1} />
        </Motion>
    );
}

/** Forearm + hand, from the elbow to the hand centre, bobbing on a typing clock. */
function Hand({ from, to, duration, delay, reduce }) {
    return (
        <Motion
            reduce={reduce}
            animate={{ y: [0, -2, 0] }}
            transition={{ duration, delay, repeat: Infinity, ease: 'easeInOut' }}
        >
            <g fill="none" strokeLinecap="round">
                <line x1={from[0]} y1={from[1]} x2={to[0]} y2={to[1]} stroke={BRAND.border} strokeWidth="17" />
                <line x1={from[0]} y1={from[1]} x2={to[0]} y2={to[1]} stroke={WHITE} strokeWidth="14.6" />
            </g>
            <circle cx={to[0]} cy={to[1]} r="8.5" fill={WHITE} stroke={BRAND.border} strokeWidth="1.2" />
        </Motion>
    );
}

const BLOB_PATH =
    'M152 250C128 206 150 150 212 140C248 134 262 96 310 70C362 42 440 30 494 62C544 92 556 170 536 226C520 272 480 292 430 292L200 292C172 290 160 268 152 250Z';

export default function HeroIllustration({ className = '' }) {
    const reduce = Boolean(useReducedMotion());
    const loop = (duration, delay = 0) => ({ duration, delay, repeat: Infinity, ease: 'easeInOut' });

    return (
        <svg
            className={className}
            viewBox="0 0 560 320"
            width="100%"
            height="100%"
            preserveAspectRatio="xMidYMid meet"
            role="img"
            aria-labelledby="cp-hero-title"
        >
            <title id="cp-hero-title">Student working at a laptop at a desk</title>
            <defs>
                <linearGradient id="cp-hero-blob" x1="0" y1="0" x2="1" y2="1">
                    <stop offset="0" stopColor={BRAND.tertiary} stopOpacity="0.18" />
                    <stop offset="1" stopColor={BRAND.secondary} stopOpacity="0.11" />
                </linearGradient>
                <linearGradient id="cp-hero-shirt" x1="0" y1="0" x2="1" y2="1">
                    <stop offset="0" stopColor={BRAND.secondary} />
                    <stop offset="1" stopColor={BRAND.primary} />
                </linearGradient>
                <linearGradient id="cp-hero-lid" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0" stopColor={BRAND.tertiary} />
                    <stop offset="1" stopColor={BRAND.amber} />
                </linearGradient>
                <linearGradient id="cp-hero-cone" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0" stopColor={BRAND.tertiary} stopOpacity="0.34" />
                    <stop offset="1" stopColor={BRAND.tertiary} stopOpacity="0" />
                </linearGradient>
                <clipPath id="cp-hero-blob-clip">
                    <path d={BLOB_PATH} />
                </clipPath>
                <clipPath id="cp-hero-torso">
                    <path d="M250 284V206C250 184 276 168 320 168C364 168 390 184 390 206V284Z" />
                </clipPath>
            </defs>

            <Motion
                reduce={reduce}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, ease: 'easeOut' }}
            >
                {/* ── Backdrop: soft cloud, drifting flow lines, accent dots ── */}
                <path d={BLOB_PATH} fill="url(#cp-hero-blob)" />
                <g clipPath="url(#cp-hero-blob-clip)">
                    <Motion reduce={reduce} animate={{ x: [0, -10, 0] }} transition={loop(18)}>
                        <g fill="none" stroke={WHITE} strokeWidth="1.8" strokeLinecap="round" opacity="0.85">
                            <path d="M110 150C220 120 300 184 390 122C450 82 520 90 590 122" />
                            <path d="M110 202C210 160 310 224 420 162C480 130 530 142 590 172" />
                            <path d="M150 112C240 90 320 134 410 82C460 54 520 50 590 72" />
                            <path d="M170 262C260 232 360 272 450 222C500 192 540 196 590 214" />
                        </g>
                    </Motion>
                </g>
                <circle cx="214" cy="50" r="3" fill={BRAND.primary} />
                <circle cx="470" cy="36" r="3.5" fill={BRAND.blue} />
                <circle cx="538" cy="238" r="3.5" fill={BRAND.sky} />
                <circle cx="196" cy="98" r="2.5" fill={BRAND.sky} />

                {/* ── Lamp light: a breathing cone from the shade down to the desk ── */}
                <Motion reduce={reduce} animate={{ opacity: [0.55, 1, 0.55] }} transition={loop(4.5)}>
                    <polygon points="117,204 153,179 238,284 162,284" fill="url(#cp-hero-cone)" />
                </Motion>

                {/* ── Plant, swaying about its base behind the lamp ── */}
                <Motion
                    reduce={reduce}
                    style={{ originX: 0.5, originY: 1 }}
                    animate={{ rotate: [-2.5, 2.5, -2.5] }}
                    transition={loop(6)}
                >
                    <Leaf rotate={-52} length={54} fill={BRAND.blue} opacity={0.4} />
                    <Leaf rotate={-28} length={74} fill={BRAND.purple} opacity={0.5} />
                    <Leaf rotate={-6} length={92} fill={BRAND.purple} opacity={0.62} />
                    <Leaf rotate={16} length={78} fill={BRAND.blue} opacity={0.55} />
                    <Leaf rotate={36} length={58} fill={BRAND.purple} opacity={0.4} />
                </Motion>

                {/* ── Person (behind the desk): neck, upper arms, shirt, head, hair ── */}
                <Motion reduce={reduce} animate={{ y: [0, -2, 0] }} transition={loop(3.8)}>
                    <rect x="310" y="140" width="20" height="34" rx="6" fill={WHITE} stroke={BRAND.border} strokeWidth="1.2" />
                    <g fill="none" strokeWidth="22" strokeLinecap="round">
                        <line x1="272" y1="194" x2="240" y2="246" stroke={BRAND.secondary} />
                        <line x1="368" y1="194" x2="400" y2="246" stroke={BRAND.primary} />
                    </g>
                    <path d="M250 284V206C250 184 276 168 320 168C364 168 390 184 390 206V284Z" fill="url(#cp-hero-shirt)" />
                    <path d="M344 160H396V290H326Z" fill={BRAND.primaryHover} opacity="0.4" clipPath="url(#cp-hero-torso)" />
                    <path d="M306 170Q320 180 334 170" fill="none" stroke={WHITE} strokeWidth="2" strokeLinecap="round" opacity="0.8" />
                    <g fill={WHITE} stroke={BRAND.border} strokeWidth="1.2">
                        <circle cx="291" cy="121" r="5" />
                        <circle cx="349" cy="121" r="5" />
                        <circle cx="320" cy="118" r="30" />
                    </g>
                    <path
                        d="M290 126C283 104 281 80 294 69C287 63 284 57 288 53C296 55 302 57 305 60C307 52 312 47 318 48C321 54 325 58 329 58C339 58 345 62 349 70C357 82 355 104 350 124C348 108 342 100 332 100C326 92 313 92 306 101C299 107 294 116 290 126Z"
                        fill={INK}
                    />
                </Motion>

                {/* ── Desk: floor shadow, bar, lighter top edge ── */}
                <ellipse cx="300" cy="303" rx="224" ry="7" fill="rgba(15,23,42,0.08)" />
                <rect x="40" y="284" width="504" height="12" rx="6" fill={INK} />
                <line x1="47" y1="285.5" x2="537" y2="285.5" stroke={BRAND.body} strokeWidth="3" strokeLinecap="round" />

                {/* ── Lamp: base, jointed arm, blue conical shade ── */}
                <ellipse cx="100" cy="283" rx="15" ry="4.5" fill={INK} />
                <g fill="none" stroke={INK} strokeWidth="3" strokeLinecap="round">
                    <line x1="100" y1="282" x2="92" y2="222" />
                    <line x1="92" y1="222" x2="122" y2="174" />
                </g>
                <circle cx="92" cy="222" r="3.5" fill={INK} />
                <g transform="rotate(-35 128 182)">
                    <polygon points="114,172 142,172 150,194 106,194" fill={BRAND.blue} />
                    <circle cx="128" cy="172" r="5" fill={INK} />
                    <line x1="108" y1="194" x2="148" y2="194" stroke={WHITE} strokeWidth="2" opacity="0.6" strokeLinecap="round" />
                </g>

                {/* ── Laptop on the desk: lid facing the viewer, dark base ── */}
                <rect x="270" y="208" width="100" height="72" rx="6" fill="url(#cp-hero-lid)" />
                <rect x="273.5" y="211.5" width="93" height="65" rx="4" fill="none" stroke={WHITE} strokeWidth="1.5" opacity="0.35" />
                <circle cx="320" cy="244" r="11" fill={WHITE} opacity="0.24" />
                <rect x="254" y="276" width="132" height="9" rx="3" fill={BRAND.heading} />
                <line x1="258" y1="277.5" x2="382" y2="277.5" stroke={BRAND.body} strokeWidth="1.5" strokeLinecap="round" />

                {/* ── Forearms and hands, each tapping on its own clock ── */}
                <Hand from={[240, 246]} to={[264, 277]} duration={0.42} delay={0} reduce={reduce} />
                <Hand from={[400, 246]} to={[376, 277]} duration={0.46} delay={0.2} reduce={reduce} />

                {/* ── Coffee: tapered white cup, red band with a bean, grey lid, steam ── */}
                <path d="M453 240H487L484 284H456Z" fill={WHITE} stroke={BRAND.border} strokeWidth="1.2" />
                <path d="M454 254H486L485 268H455Z" fill={BRAND.primary} />
                <circle cx="470" cy="261" r="5.5" fill={WHITE} />
                <ellipse cx="470" cy="261" rx="3.4" ry="2.4" fill={BRAND.heading} transform="rotate(-35 470 261)" />
                <line x1="468" y1="262.5" x2="472" y2="259.5" stroke={WHITE} strokeWidth="0.9" strokeLinecap="round" />
                <rect x="450" y="233" width="40" height="9" rx="3" fill={BRAND.border} />
                <rect x="459" y="227" width="22" height="7" rx="2.5" fill={BRAND.border} />
                <line x1="452" y1="241" x2="488" y2="241" stroke={BRAND.muted} strokeWidth="1" opacity="0.3" />
                <Wisp d="M461 222C456 214 466 208 461 200" delay={0} reduce={reduce} />
                <Wisp d="M470 224C465 215 475 208 470 198" delay={1.1} reduce={reduce} />
                <Wisp d="M479 222C474 214 484 208 479 200" delay={2.2} reduce={reduce} />
            </Motion>
        </svg>
    );
}
