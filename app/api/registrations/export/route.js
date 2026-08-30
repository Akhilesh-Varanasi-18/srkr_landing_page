import { NextResponse } from 'next/server';
import ExcelJS from 'exceljs';
import { getRegistrationsCollection } from '../../../../lib/mongodb';
import { isAuthenticated } from '../../../../lib/dashboard-auth';
import { resolveRange, rangeMatch, IST_TZ } from '../../../../lib/analytics-range';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

// Brand palette — kept in hex (ExcelJS wants ARGB) rather than CSS vars.
const CORAL = 'FFE2544C';
const HEADER_TEXT = 'FFFFFFFF';
const STRIPE = 'FFFFF3EF';

const COLUMNS = [
    { header: 'Registration ID', key: 'registrationId', width: 18 },
    { header: 'Full Name', key: 'fullName', width: 26 },
    { header: 'Roll Number', key: 'rollNumber', width: 16 },
    { header: 'College Email', key: 'collegeEmail', width: 32 },
    { header: 'Mobile Number', key: 'mobileNumber', width: 16 },
    { header: 'Branch', key: 'branch', width: 44 },
    { header: 'Gender', key: 'gender', width: 10 },
    { header: 'Residence', key: 'residenceType', width: 14 },
    { header: 'Passout Year', key: 'passoutYear', width: 13 },
    { header: 'Year / Batch', key: 'yearLabel', width: 22 },
    { header: 'Program', key: 'programName', width: 20 },
    { header: 'Program Code', key: 'programCode', width: 14 },
    { header: 'Track', key: 'programTrack', width: 22 },
    { header: 'Status', key: 'status', width: 13 },
    { header: 'Registered At (IST)', key: 'registeredAt', width: 22 }
];

const RANGE_LABEL = { all: 'All time', today: 'Today', '7d': 'Last 7 days', '30d': 'Last 30 days' };

/** Formats a Date as 'YYYY-MM-DD HH:mm' in IST for human-readable cells/filenames. */
function formatIST(date) {
    if (!date) return '';
    const shifted = new Date(date.getTime() + 330 * 60 * 1000);
    return shifted.toISOString().slice(0, 16).replace('T', ' ');
}

export async function GET(request) {
    if (!isAuthenticated(request)) {
        return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });
    }

    const range = resolveRange(request.nextUrl.searchParams.get('range'));
    const match = rangeMatch(range);
    const now = new Date();

    let rows;
    try {
        const collection = await getRegistrationsCollection();
        rows = await collection.find(match).sort({ createdAt: -1 }).toArray();
    } catch (error) {
        console.error('[export] query failed:', error);
        return NextResponse.json({ success: false, message: 'Could not read registrations.' }, { status: 503 });
    }

    const workbook = new ExcelJS.Workbook();
    workbook.creator = 'ToriiMinds × SRKR';
    workbook.created = now;
    const sheet = workbook.addWorksheet('Registrations', {
        views: [{ state: 'frozen', ySplit: 3 }]
    });

    // ── Title band (rows 1-2) ──
    sheet.mergeCells(1, 1, 1, COLUMNS.length);
    const titleCell = sheet.getCell(1, 1);
    titleCell.value = 'ToriiMinds × SRKR — Registrations Report';
    titleCell.font = { name: 'Calibri', size: 15, bold: true, color: { argb: CORAL } };
    titleCell.alignment = { vertical: 'middle' };
    sheet.getRow(1).height = 24;

    sheet.mergeCells(2, 1, 2, COLUMNS.length);
    const metaCell = sheet.getCell(2, 1);
    metaCell.value = `Filter: ${RANGE_LABEL[range.key]}   •   ${rows.length} registration(s)   •   Generated ${formatIST(now)} IST`;
    metaCell.font = { name: 'Calibri', size: 10, color: { argb: 'FF64748B' } };
    metaCell.alignment = { vertical: 'middle' };

    // ── Header row (row 3) ──
    sheet.columns = COLUMNS.map((c) => ({ key: c.key, width: c.width }));
    const headerRow = sheet.getRow(3);
    COLUMNS.forEach((col, i) => {
        const cell = headerRow.getCell(i + 1);
        cell.value = col.header;
        cell.font = { bold: true, color: { argb: HEADER_TEXT }, size: 11 };
        cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: CORAL } };
        cell.alignment = { vertical: 'middle', horizontal: 'left' };
        cell.border = { bottom: { style: 'thin', color: { argb: CORAL } } };
    });
    headerRow.height = 20;

    // ── Data rows ──
    rows.forEach((doc, index) => {
        const row = sheet.addRow({
            registrationId: doc.registrationId || '',
            fullName: doc.fullName || '',
            rollNumber: doc.rollNumber || '',
            collegeEmail: doc.collegeEmail || '',
            mobileNumber: doc.mobileNumber || '',
            branch: doc.branch || '',
            gender: doc.gender || '',
            residenceType: doc.residenceType || '',
            passoutYear: doc.passoutYear || '',
            yearLabel: doc.yearLabel || '',
            programName: doc.programName || '',
            programCode: doc.programCode || '',
            programTrack: doc.programTrack || '',
            status: doc.status || '',
            registeredAt: formatIST(doc.createdAt)
        });
        if (index % 2 === 1) {
            row.eachCell((cell) => {
                cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: STRIPE } };
            });
        }
    });

    sheet.autoFilter = { from: { row: 3, column: 1 }, to: { row: 3, column: COLUMNS.length } };

    const buffer = await workbook.xlsx.writeBuffer();
    const filename = `SRKR_Registrations_${range.key}_${formatIST(now).replace(/[ :]/g, '-')}.xlsx`;

    return new NextResponse(buffer, {
        status: 200,
        headers: {
            'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
            'Content-Disposition': `attachment; filename="${filename}"`,
            'Cache-Control': 'no-store'
        }
    });
}
