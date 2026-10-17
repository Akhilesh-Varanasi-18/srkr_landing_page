'use client';

import { genderKey, initialsOf, avatarVariant, avatarStyle } from './coding-theme';

// PLACEHOLDER PORTRAITS until real student photos arrive: one illustration per
// gender, cropped two ways from public/assets/images/banner — a head-and-shoulders
// square for the small circles, and the trimmed full figure for the podium and detail
// stages. Every card shares the same two files, so the whole grid costs two image
// requests; the per-student gradient backdrop is what keeps a column of cards from
// reading as one face repeated. When photos land, swap the sources here only.
const FACE_SRC = {
    male: '/assets/images/srkr/avatars/boy-face.webp',
    female: '/assets/images/srkr/avatars/girl-face.webp'
};
const FIGURE_SRC = {
    male: '/assets/images/srkr/avatars/boy-figure.webp',
    female: '/assets/images/srkr/avatars/girl-figure.webp'
};

// THE 305-ANIMATION PROBLEM, SOLVED HERE.
//
// A Lottie player per student card is not a tuning problem: lottie-web builds an SVG
// subtree of ~40 nodes and drives it from its own requestAnimationFrame loop, so 305
// of them is 12,000+ extra DOM nodes and a main thread that misses every frame — and
// on a mid-range Android it is an out-of-memory tab kill. IntersectionObserver does
// not rescue it either; twenty simultaneously visible players still consume a third
// of the frame budget, and the construction cost merely spreads across the scroll.
//
// So the grid gets no players at all. This module emits nine student figures ONCE as
// <symbol> definitions, and every card references one with a single <use> element —
// two DOM nodes per card instead of forty, no network request, no animation loop.
//
// COLOUR: the circular backdrop is a CSS background on the wrapping <span>, NOT an
// SVG gradient. That is deliberate. A <linearGradient> living in shared <defs>
// resolves its var() stops against its own inherited context rather than the <use>
// site, so one shared gradient paints every avatar identically no matter what the
// card sets — the per-student colour variants would silently do nothing. Plain
// `fill="var(--cp-av-*)"` inside the symbol DOES inherit through <use>, so the
// figure tints correctly while the span supplies the backdrop.
//
// The figure is white and every detail — hair, eyes, smile, glasses, headphones, cap
// — is dark slate. That keeps the characters legible on all four backdrops, keeps
// accessories from disappearing into the face, and deliberately avoids assigning a
// skin tone to 317 real students.
//
// Gender picks the character set and a hash of the roll number picks one of four
// styles within it, so a screen of cards reads as a crowd of different people rather
// than one clone repeated — and a given student always gets the same face.

/** Shoulders, neck, ears and head — identical across every character. */
function Base() {
    return (
        <>
            {/* The neck is the SAME white as the head and body, not a tinted block.
                A translucent shade here sits over the backdrop gradient and renders as
                a muddy rectangle with hard edges; one continuous silhouette, separated
                only by the collar arc, is what reads cleanly at 42px. */}
            <path d="M27.6 33h8.8v11.4a4.4 4.4 0 0 1-8.8 0V33Z" fill="var(--cp-av-figure)" />
            <ellipse cx="32" cy="64" rx="20" ry="19" fill="var(--cp-av-figure)" />
            <path
                d="M25.6 46.4c1.7 2.7 3.9 4.1 6.4 4.1s4.7-1.4 6.4-4.1"
                fill="none"
                stroke="var(--cp-av-shade)"
                strokeWidth="1.5"
                strokeLinecap="round"
            />
            <circle cx="21.3" cy="26.4" r="2.2" fill="var(--cp-av-figure)" />
            <circle cx="42.7" cy="26.4" r="2.2" fill="var(--cp-av-figure)" />
            <ellipse cx="32" cy="25" rx="11" ry="12" fill="var(--cp-av-figure)" />
        </>
    );
}

/** Eyes and a small smile — the difference between a character and a mannequin. */
function Face() {
    return (
        <g fill="var(--cp-av-ink)">
            <circle cx="27.9" cy="25.4" r="1.45" />
            <circle cx="36.1" cy="25.4" r="1.45" />
            <path
                d="M29.1 30c.85.85 1.82 1.27 2.9 1.27s2.05-.42 2.9-1.27"
                fill="none"
                stroke="var(--cp-av-ink)"
                strokeWidth="1.35"
                strokeLinecap="round"
            />
        </g>
    );
}

/** Round specs. Drawn over the eyes, in the same ink so they actually read. */
function Glasses() {
    return (
        <g fill="none" stroke="var(--cp-av-ink)" strokeWidth="1.5">
            <circle cx="27.6" cy="25.4" r="3.9" />
            <circle cx="36.4" cy="25.4" r="3.9" />
            <path d="M31.5 25.4h1" strokeLinecap="round" />
            <path d="M23.7 25.4h-1.9M40.3 25.4h1.9" strokeLinecap="round" />
        </g>
    );
}

/** Over-ear headphones — the most "coder student" accessory in the set. */
function Headphones() {
    return (
        <g>
            <path
                d="M18.9 27.4a13.1 13.1 0 0 1 26.2 0"
                fill="none"
                stroke="var(--cp-av-ink)"
                strokeWidth="2.6"
                strokeLinecap="round"
            />
            <rect x="15.7" y="24.2" width="6" height="10.4" rx="3" fill="var(--cp-av-ink)" />
            <rect x="42.3" y="24.2" width="6" height="10.4" rx="3" fill="var(--cp-av-ink)" />
        </g>
    );
}

export function AvatarSpriteDefs() {
    return (
        <svg className="cp-sprite" aria-hidden="true" focusable="false" width="0" height="0">
            <defs>
                {/* ── Male 0 · short crop + headphones ── */}
                <symbol id="cp-av-male-0" viewBox="0 0 64 64">
                    <Base />
                    <path
                        d="M32 11.6c6.6 0 11.5 4.9 11.5 11.7 0 1.2-.1 2.2-.3 3-.7-3.7-1.6-5.9-3.2-6.7-2.4 1.4-5.1 2.1-8 2.1s-5.6-.7-8-2.1c-1.6.8-2.5 3-3.2 6.7-.2-.8-.3-1.8-.3-3C20.5 16.5 25.4 11.6 32 11.6Z"
                        fill="var(--cp-av-hair)"
                    />
                    <Face />
                    <Headphones />
                </symbol>

                {/* ── Male 1 · textured crop + glasses ── */}
                <symbol id="cp-av-male-1" viewBox="0 0 64 64">
                    <Base />
                    <path
                        d="M20.8 24.6C20.3 16.8 25.2 11.4 32 11.4s11.7 5.4 11.2 13.2c-1-2.3-1.9-4-2.9-5.3-1.1 1-2.4 1.5-3.9 1.5-1.7 0-3.1-.7-4.2-2.1-1.1 1.6-2.6 2.4-4.4 2.4-1.5 0-2.9-.6-4.1-1.8-1.1 1.2-2.1 3-3 5.3Z"
                        fill="var(--cp-av-hair)"
                    />
                    <Face />
                    <Glasses />
                </symbol>

                {/* ── Male 2 · curls ── */}
                <symbol id="cp-av-male-2" viewBox="0 0 64 64">
                    <Base />
                    <g fill="var(--cp-av-hair)">
                        <circle cx="24.2" cy="18.1" r="5.3" />
                        <circle cx="32" cy="14.6" r="6" />
                        <circle cx="39.8" cy="18.1" r="5.3" />
                        <circle cx="21.4" cy="23.2" r="3.8" />
                        <circle cx="42.6" cy="23.2" r="3.8" />
                    </g>
                    <Face />
                </symbol>

                {/* ── Male 3 · cap ── */}
                <symbol id="cp-av-male-3" viewBox="0 0 64 64">
                    <Base />
                    <path
                        d="M23.4 22.6c-.3-.9-.5-1.8-.5-2.7 0-4.3 4.1-7.8 9.1-7.8s9.1 3.5 9.1 7.8c0 .9-.2 1.8-.5 2.7Z"
                        fill="var(--cp-av-hair)"
                    />
                    <Face />
                    <path
                        d="M32 10.6c-6.3 0-11.2 4.7-11.2 10.8v1h22.4v-1c0-6.1-4.9-10.8-11.2-10.8Z"
                        fill="var(--cp-av-ink)"
                    />
                    <path
                        d="M20.6 21.4h22.8c3.9 0 7 1 7 2.6s-3.1 1.6-7 1.6H20.6c-1 0-1.9-.9-1.9-2.1s.9-2.1 1.9-2.1Z"
                        fill="var(--cp-av-ink)"
                    />
                    <circle cx="32" cy="11.6" r="1.5" fill="var(--cp-av-figure)" opacity=".55" />
                </symbol>

                {/* ── Female 0 · long hair + headphones ── */}
                <symbol id="cp-av-female-0" viewBox="0 0 64 64">
                    <path
                        d="M20 23.6C20 15.8 25.2 11 32 11s12 4.8 12 12.6c0 0 .5 14.2 1.1 20.2.2 1.8-2.4 2.3-3 .5l-2.4-7.5V24.4c-2.5 2-5.6 3-7.7 3s-5.2-1-7.7-3v12.4l-2.4 7.5c-.6 1.8-3.2 1.3-3-.5.6-6 1.1-20.2 1.1-20.2Z"
                        fill="var(--cp-av-hair)"
                    />
                    <Base />
                    <path
                        d="M32 11.4c6.6 0 11.5 5 11.5 12.2 0 1.2-.1 2.3-.3 3.1-.7-3.9-1.7-6.3-3.3-7.2-2.5 1.6-5.2 2.3-7.9 2.3s-5.4-.7-7.9-2.3c-1.6.9-2.6 3.3-3.3 7.2-.2-.8-.3-1.9-.3-3.1 0-7.2 4.9-12.2 11.5-12.2Z"
                        fill="var(--cp-av-hair)"
                    />
                    <Face />
                    <Headphones />
                </symbol>

                {/* ── Female 1 · top knot + glasses ── */}
                <symbol id="cp-av-female-1" viewBox="0 0 64 64">
                    <circle cx="32" cy="9.6" r="5.1" fill="var(--cp-av-hair)" />
                    <Base />
                    <path
                        d="M20.8 24.8C20.8 16.6 25.8 11.6 32 11.6s11.2 5 11.2 13.2c-1.1-3.2-2-5.3-3.1-6.2-2.4 1.7-5.2 2.5-8.1 2.5s-5.7-.8-8.1-2.5c-1.1.9-2 3-3.1 6.2Z"
                        fill="var(--cp-av-hair)"
                    />
                    <Face />
                    <Glasses />
                </symbol>

                {/* ── Female 2 · bob ── */}
                <symbol id="cp-av-female-2" viewBox="0 0 64 64">
                    <path
                        d="M20.3 24.2C20.3 16.5 25.3 11.7 32 11.7s11.7 4.8 11.7 12.5c0 0 .3 8.6.8 12.9.2 1.7-2.3 2.1-2.8.4l-2-6.4V24.6c-2.4 1.9-5.3 2.9-7.7 2.9s-5.3-1-7.7-2.9v6.5l-2 6.4c-.5 1.7-3 1.3-2.8-.4.5-4.3.8-12.9.8-12.9Z"
                        fill="var(--cp-av-hair)"
                    />
                    <Base />
                    <path
                        d="M32 11.9c6.5 0 11.3 5 11.3 12.1 0 1.1-.1 2.2-.3 3-.7-3.8-1.6-6.2-3.2-7.1-2.5 1.6-5.1 2.3-7.8 2.3s-5.3-.7-7.8-2.3c-1.6.9-2.5 3.3-3.2 7.1-.2-.8-.3-1.9-.3-3 0-7.1 4.8-12.1 11.3-12.1Z"
                        fill="var(--cp-av-hair)"
                    />
                    <Face />
                </symbol>

                {/* ── Female 3 · ponytail ── */}
                <symbol id="cp-av-female-3" viewBox="0 0 64 64">
                    <path
                        d="M41.4 19.8c4.8 1.1 7.7 4.8 7.7 10.1 0 4.3-1.6 7.9-4.2 10.6-1.1 1.2-3.1-.2-2.4-1.7 1.4-2.6 2.1-5.3 2.1-8.2 0-4.4-1.5-7.7-4.3-9.8Z"
                        fill="var(--cp-av-hair)"
                    />
                    <circle cx="42.2" cy="20.6" r="2.9" fill="var(--cp-av-ink)" />
                    <Base />
                    <path
                        d="M20.8 24.8C20.8 16.6 25.8 11.6 32 11.6s11.2 5 11.2 13.2c-1.1-3.2-2-5.3-3.1-6.2-2.4 1.7-5.2 2.5-8.1 2.5s-5.7-.8-8.1-2.5c-1.1.9-2 3-3.1 6.2Z"
                        fill="var(--cp-av-hair)"
                    />
                    <Face />
                </symbol>

                {/* ── Neutral · used when the roster has no gender value ── */}
                <symbol id="cp-av-neutral-0" viewBox="0 0 64 64">
                    <Base />
                    <path
                        d="M32 12c6.2 0 10.8 4.7 10.8 11.1 0 1.1-.1 2-.3 2.8-.6-3.5-1.4-5.6-3-6.4-2.3 1.3-4.8 2-7.5 2s-5.2-.7-7.5-2c-1.6.8-2.4 2.9-3 6.4-.2-.8-.3-1.7-.3-2.8C21.2 16.7 25.8 12 32 12Z"
                        fill="var(--cp-av-hair)"
                    />
                    <Face />
                </symbol>
            </defs>
        </svg>
    );
}

/**
 * The large cut-out figure for the podium and the detail panel: the same placeholder
 * illustration uncropped, so it can stand behind a card's edge. The stage that holds
 * it anchors the image bottom-centre and lets the sides clip, which is also what a
 * real photo cut-out of a different aspect ratio will need. Falls back to the drawn
 * sprite when the roster has no gender.
 */
export function CodingFigure({ gender, rollKey, name, eager = false, className = '' }) {
    const key = genderKey(gender);
    if (!FIGURE_SRC[key]) {
        return <CodingAvatar gender={gender} rollKey={rollKey} name={name} size="lg" className={className} />;
    }
    return (
        <img
            className={`cp-figure ${className}`}
            src={FIGURE_SRC[key]}
            alt=""
            loading={eager ? 'eager' : 'lazy'}
            decoding="async"
            draggable="false"
        />
    );
}

/**
 * One student's avatar.
 *
 * @param {object}  props
 * @param {string}  props.gender     roster value; anything unrecognised gets the neutral figure
 * @param {string}  props.rollKey    seeds the stable colour and character variant
 * @param {string}  props.name       used for the monogram fallback
 * @param {string}  [props.size]     'sm' (grid) | 'md' (podium 2/3) | 'lg' (podium 1, detail)
 * @param {boolean} [props.monogram] render initials instead — used for students with
 *                                   no captured profile, so the grid shows at a glance
 *                                   that we have no data rather than no activity
 */
export default function CodingAvatar({ gender, rollKey, name, size = 'sm', monogram = false, className = '' }) {
    const key = genderKey(gender);
    const colour = avatarVariant(rollKey);

    if (monogram) {
        return (
            <span
                className={`cp-avatar cp-avatar--${size} cp-avatar--mono ${className}`}
                aria-hidden="true"
            >
                {initialsOf(name)}
            </span>
        );
    }

    if (FACE_SRC[key]) {
        return (
            <span
                className={`cp-avatar cp-avatar--${size} cp-avatar--v${colour} cp-avatar--photo ${className}`}
                aria-hidden="true"
            >
                <img src={FACE_SRC[key]} alt="" width="256" height="256" loading="lazy" decoding="async" />
            </span>
        );
    }

    // No gender on the roster: the drawn sprite, whose single neutral character is style 0.
    const style = key === 'neutral' ? 0 : avatarStyle(rollKey);

    return (
        <span
            className={`cp-avatar cp-avatar--${size} cp-avatar--v${colour} ${className}`}
            aria-hidden="true"
        >
            <svg viewBox="0 0 64 64" focusable="false">
                <use href={`#cp-av-${key}-${style}`} />
            </svg>
        </span>
    );
}
