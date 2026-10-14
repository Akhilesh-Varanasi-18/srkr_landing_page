// Shared external links. Kept in one place so a changed invite link only needs
// updating here rather than in the header, the mobile nav, and the success screen.

// Main community "welcome" link — the entry point for all official updates.
export const WHATSAPP_COMMUNITY_URL = 'https://chat.whatsapp.com/CF2BIK4euBQB4Ickhfhm0z';

// Year-wise WhatsApp groups shown under the "Year-wise Groups" tab of the
// community pop-up. A group with a '#' link renders as "coming soon".
export const FIRST_YEAR_WHATSAPP_URL = 'https://chat.whatsapp.com/E9VMSKFbxLd3RgJmeHQ6Kh';
export const SECOND_YEAR_WHATSAPP_URL = 'https://chat.whatsapp.com/JDiCCgL0skzCJtS4q6nDW2';

// Drives the year-wise group list in the community pop-up. Add a 3rd/4th year
// entry here and it appears automatically — no component change needed: the
// modal raises the ordinal suffix itself, so "3rd Year …" renders as 3ʳᵈ Year.
// `groupName` is the group's real name in WhatsApp, shown so a student can
// confirm they landed in the right place before tapping Join.
export const WHATSAPP_YEAR_GROUPS = [
    { id: 'first-year', label: '1st Year WhatsApp Group', year: '1st Year', groupName: 'TORII_SRKR_1ST Years', url: FIRST_YEAR_WHATSAPP_URL },
    { id: 'second-year', label: '2nd Year WhatsApp Group', year: '2nd Year', groupName: 'TORII_SRKR_2ND Years', url: SECOND_YEAR_WHATSAPP_URL }
];

// Partner sites the header logos link out to.
export const TORIIMINDS_URL = 'https://toriiminds.com/';
export const SRKR_COLLEGE_URL = 'https://www.srkrec.ac.in/';
