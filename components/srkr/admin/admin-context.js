'use client';

import { createContext, useContext } from 'react';

// What every admin module can reach without prop-drilling through the shell:
// how to end the session, how to report a 401 (the shell drops back to the login
// gate), and the rail's state for layout decisions.
export const AdminContext = createContext({
    signOut: () => {},
    unauthorized: () => {},
    navExpanded: true,
    overlay: false
});

export const useAdmin = () => useContext(AdminContext);
