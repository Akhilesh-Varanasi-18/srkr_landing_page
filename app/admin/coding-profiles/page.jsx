import CodingClient from '../../../components/srkr/dashboard/coding/coding-client';

// The program, the view and the period all live in the query string
// (?program=&view=&from=&to=), read on the client, so this page prerenders as a
// shell with no student data baked in.
export const metadata = { title: 'Coding Profiles' };

export default function CodingProfilesPage() {
    return <CodingClient />;
}
