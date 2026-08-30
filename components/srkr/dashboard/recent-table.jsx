'use client';

import { useMemo, useState } from 'react';
import { shortBranch, formatDateTime } from './dashboard-theme';
import { IconSearch, IconInbox } from './dashboard-icons';

export default function RecentTable({ rows }) {
    const [query, setQuery] = useState('');

    const filtered = useMemo(() => {
        const q = query.trim().toLowerCase();
        if (!q) return rows;
        return rows.filter((r) =>
            [r.fullName, r.rollNumber, r.collegeEmail, r.mobileNumber, r.branch, r.programName, r.registrationId]
                .some((v) => String(v || '').toLowerCase().includes(q))
        );
    }, [rows, query]);

    return (
        <div className="dash-card dash-table-card">
            <div className="dash-table-toolbar">
                <div>
                    <h3 className="dash-card-title">Recent registrations</h3>
                    <p className="dash-card-sub">Latest {rows.length} shown · search by name, roll, email or branch</p>
                </div>
                <div className="dash-search">
                    <IconSearch />
                    <input
                        type="text"
                        placeholder="Search registrations…"
                        value={query}
                        onChange={(e) => setQuery(e.target.value)}
                        aria-label="Search registrations"
                    />
                </div>
            </div>

            <div className="dash-table-scroll">
                <table className="dash-table">
                    <thead>
                        <tr>
                            <th>Reg. ID</th>
                            <th>Name</th>
                            <th>Roll No.</th>
                            <th>Branch</th>
                            <th>Year</th>
                            <th>Program</th>
                            <th>Gender</th>
                            <th>Residence</th>
                            <th>Registered</th>
                        </tr>
                    </thead>
                    <tbody>
                        {filtered.length === 0 ? (
                            <tr>
                                <td colSpan={9} className="dash-table-empty">
                                    {rows.length === 0 ? 'No registrations yet.' : 'No matches for your search.'}
                                </td>
                            </tr>
                        ) : filtered.map((r) => (
                            <tr key={r.registrationId}>
                                <td className="dash-td-id">{r.registrationId}</td>
                                <td className="dash-td-name">{r.fullName}</td>
                                <td>{r.rollNumber}</td>
                                <td title={r.branch}>{shortBranch(r.branch)}</td>
                                <td>{r.passoutYear}</td>
                                <td>{r.programName}</td>
                                <td><span className={`dash-pill ${r.gender === 'Female' ? 'dash-pill--f' : 'dash-pill--m'}`}>{r.gender}</span></td>
                                <td>{r.residenceType}</td>
                                <td>{formatDateTime(r.createdAt)}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
