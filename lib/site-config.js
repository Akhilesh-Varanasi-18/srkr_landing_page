// Shared external links. Kept in one place so a changed invite link only needs
// updating here rather than in the header, the mobile nav, and the success screen.

// Main community "welcome" link — the entry point for all official updates.
export const WHATSAPP_COMMUNITY_URL = 'https://chat.whatsapp.com/CF2BIK4euBQB4Ickhfhm0z';

// Year-wise WhatsApp groups shown under the "Year-wise Groups" tab of the
// community pop-up. TODO: replace the placeholders below with the real invite
// links once provided. A group with a '#' link renders as "coming soon".
export const FIRST_YEAR_WHATSAPP_URL = '#';
export const SECOND_YEAR_WHATSAPP_URL = '#';

// Drives the year-wise group list in the community pop-up. Add a 3rd/4th year
// entry here and it appears automatically — no component change needed.
export const WHATSAPP_YEAR_GROUPS = [
    { id: 'first-year', label: 'First Year WhatsApp Group', year: '1st Year', url: FIRST_YEAR_WHATSAPP_URL },
    { id: 'second-year', label: 'Second Year WhatsApp Group', year: '2nd Year', url: SECOND_YEAR_WHATSAPP_URL }
];

// Partner sites the header logos link out to.
export const TORIIMINDS_URL = 'https://toriiminds.com/';
export const SRKR_COLLEGE_URL = 'https://www.srkrec.ac.in/';
