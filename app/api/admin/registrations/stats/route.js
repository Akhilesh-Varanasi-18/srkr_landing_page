import { NextResponse } from 'next/server';
import { getRegistrationsCollection } from '../../../../../lib/mongodb';
import { isAuthenticated } from '../../../../../lib/dashboard-auth';
import { eligibleRoster } from '../../../../../lib/registration-eligibility';
import { PROGRAM_BY_KEY, REGISTRATION_PROGRAMS } from '../../../../../lib/registration-schema';
import {
    resolveRange,
    rangeMatch,
    fillDailySeries,
    startOfISTDay,
    IST_TZ
} from '../../../../../lib/analytics-range';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

const RECENT_LIMIT = 100;

// Moon Coder is the roster-gated intake whose uptake (registered vs eligible, per
// SkillUp batch) and academics (CGPA, backlogs) the dashboard tracks.
const MOON = PROGRAM_BY_KEY.mooncoder;

// CGPA bands: [0,6) [6,7) [7,8) [8,9) [9,10]. The last boundary is nudged past 10
// so a perfect 10.00 lands in the top band instead of the overflow bucket.
const CGPA_BOUNDARIES = [0, 6, 7, 8, 9, 10.01];
const CGPA_BAND_LABELS = ['< 6', '6 – 7', '7 – 8', '8 – 9', '9 – 10'];

export async function GET(request) {
    if (!isAuthenticated(request)) {
        return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });
    }

    const range = resolveRange(request.nextUrl.searchParams.get('range'));
    // ?program=<key> scopes every figure to one intake; anything else is all programs.
    const program = PROGRAM_BY_KEY[request.nextUrl.searchParams.get('program')] || null;

    // Passout years to hide from the dashboard (charts + KPIs). Empty = show all.
    // (3rd years / 2028 are registering again, so nothing is hidden currently.)
    const HIDDEN_PASSOUT_YEARS = [];
    const excludeHidden = { passoutYear: { $nin: HIDDEN_PASSOUT_YEARS }, ...(program ? { programCode: program.code } : {}) };
    const match = { ...rangeMatch(range), ...excludeHidden };
    const now = new Date();

    let collection;
    try {
        collection = await getRegistrationsCollection();
    } catch (error) {
        console.error('[stats] database connection failed:', error);
        return NextResponse.json({ success: false, message: 'Database unreachable.' }, { status: 503 });
    }

    try {
        // Everything inside the selected range in one aggregation, issued together
        // with the absolute counts below so the whole payload costs a single
        // wall-clock round trip to the database.
        const facetQuery = collection
            .aggregate([
                { $match: match },
                {
                    $facet: {
                        total: [{ $count: 'n' }],
                        byGender: [{ $group: { _id: '$gender', n: { $sum: 1 } } }],
                        byBranch: [{ $group: { _id: '$branch', n: { $sum: 1 } } }, { $sort: { n: -1 } }],
                        byResidence: [{ $group: { _id: '$residenceType', n: { $sum: 1 } } }],
                        byLaptop: [{ $group: { _id: '$hasLaptop', n: { $sum: 1 } } }],
                        // CRT enrolment split retired — replaced by admission-basis below.
                        // byCrtFee: [{ $group: { _id: '$paidCrtFee', n: { $sum: 1 } } }],
                        // Admission basis (1st-year intake, historical): "Rank-based" if
                        // either entrance rank was provided, else "Management". The form no
                        // longer collects ranks, so this only ever counts the 2030 rows.
                        byAdmission: [
                            { $match: { eapcetRank: { $exists: true } } },
                            {
                                $group: {
                                    _id: {
                                        $cond: [
                                            {
                                                $and: [
                                                    { $eq: [{ $ifNull: ['$eapcetRank', ''] }, ''] },
                                                    { $eq: [{ $ifNull: ['$jeeRank', ''] }, ''] }
                                                ]
                                            },
                                            'Management',
                                            'Rank-based'
                                        ]
                                    },
                                    n: { $sum: 1 }
                                }
                            }
                        ],
                        // Moon Coder academics — only rows that carry the numeric fields.
                        byCgpaBand: [
                            { $match: { cgpa: { $type: 'number' } } },
                            {
                                $bucket: {
                                    groupBy: '$cgpa',
                                    boundaries: CGPA_BOUNDARIES,
                                    default: 'other',
                                    output: { n: { $sum: 1 } }
                                }
                            }
                        ],
                        byBacklogs: [
                            { $match: { activeBacklogs: { $type: 'number' } } },
                            { $group: { _id: { $min: ['$activeBacklogs', 3] }, n: { $sum: 1 } } }
                        ],
                        academics: [
                            { $match: { cgpa: { $type: 'number' }, activeBacklogs: { $type: 'number' } } },
                            {
                                $group: {
                                    _id: null,
                                    n: { $sum: 1 },
                                    avgCgpa: { $avg: '$cgpa' },
                                    clear: { $sum: { $cond: [{ $eq: ['$activeBacklogs', 0] }, 1, 0] } },
                                    edited: { $sum: { $cond: [{ $gt: [{ $size: { $ifNull: ['$prefill.editedFields', []] } }, 0] }, 1, 0] } }
                                }
                            }
                        ],
                        // Moon Coder uptake per SkillUp batch (the batch is copied from the
                        // roster at registration time).
                        moonByBatch: [
                            { $match: { programCode: MOON.code } },
                            { $group: { _id: { $ifNull: ['$batch', 'Unknown'] }, n: { $sum: 1 } } }
                        ],
                        // Class time slot choices, overall and per SkillUp batch.
                        byTimeSlot: [
                            { $match: { timeSlot: { $type: 'string' } } },
                            { $group: { _id: '$timeSlot', n: { $sum: 1 } } }
                        ],
                        slotByBatch: [
                            { $match: { programCode: MOON.code, timeSlot: { $type: 'string' } } },
                            { $group: { _id: { batch: { $ifNull: ['$batch', 'Unknown'] }, slot: '$timeSlot' }, n: { $sum: 1 } } }
                        ],
                        laptopByProgram: [
                            { $group: { _id: { program: '$programName', laptop: '$hasLaptop' }, n: { $sum: 1 } } }
                        ],
                        byProgram: [
                            {
                                $group: {
                                    _id: { name: '$programName', year: '$passoutYear', label: '$yearLabel' },
                                    n: { $sum: 1 }
                                }
                            }
                        ],
                        branchByYear: [
                            { $group: { _id: { branch: '$branch', year: '$passoutYear' }, n: { $sum: 1 } } }
                        ],
                        byDay: [
                            {
                                $group: {
                                    _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt', timezone: IST_TZ } },
                                    n: { $sum: 1 }
                                }
                            },
                            { $sort: { _id: 1 } }
                        ],
                        recent: [
                            { $sort: { createdAt: -1 } },
                            { $limit: RECENT_LIMIT },
                            {
                                $project: {
                                    _id: 0,
                                    registrationId: 1,
                                    fullName: 1,
                                    rollNumber: 1,
                                    collegeEmail: 1,
                                    mobileNumber: 1,
                                    branch: 1,
                                    gender: 1,
                                    residenceType: 1,
                                    hasLaptop: 1,
                                    passoutYear: 1,
                                    cgpa: 1,
                                    activeBacklogs: 1,
                                    batch: 1,
                                    timeSlot: 1,
                                    programName: 1,
                                    createdAt: 1
                                }
                            }
                        ]
                    }
                }
            ])
            .toArray();

        // Absolute KPIs — always the true totals, independent of the filter, so the
        // momentum numbers don't shift when you change the chart range. The Moon
        // Coder eligible count comes from the roster, which is the eligibility list.
        const todayStart = startOfISTDay(now);
        const weekStart = new Date(todayStart.getTime() - 6 * 24 * 60 * 60 * 1000);
        const [[facet], allTotal, todayCount, weekCount, moonTotal, roster, perProgram] = await Promise.all([
            facetQuery,
            collection.countDocuments({ ...excludeHidden }),
            collection.countDocuments({ createdAt: { $gte: todayStart }, ...excludeHidden }),
            collection.countDocuments({ createdAt: { $gte: weekStart }, ...excludeHidden }),
            collection.countDocuments({ programCode: MOON.code }),
            eligibleRoster().catch((error) => {
                console.error('[stats] roster unavailable:', error);
                return [];
            }),
            // All-time count per program, unfiltered — the program selector's badges.
            collection.aggregate([{ $group: { _id: '$programCode', n: { $sum: 1 } } }]).toArray()
        ]);
        const perProgramCount = new Map(perProgram.map((r) => [r._id, r.n]));
        const programs = REGISTRATION_PROGRAMS.map((p) => ({
            key: p.key,
            name: p.programName,
            code: p.code,
            open: p.open,
            passoutYear: p.passoutYear,
            yearLabel: p.yearLabel,
            badge: p.badge,
            total: perProgramCount.get(p.code) || 0
        }));

        const total = facet.total[0]?.n || 0;

        // Build a gap-free daily series. For "all", anchor the start on the first
        // registration so the curve doesn't begin at an arbitrary date.
        const dayCounts = new Map(facet.byDay.map((d) => [d._id, d.n]));
        const seriesStart = range.start
            ? range.start
            : facet.byDay.length
              ? new Date(`${facet.byDay[0]._id}T00:00:00.000Z`)
              : todayStart;
        const timeSeries = fillDailySeries(dayCounts, seriesStart, now);

        const clean = (rows) => rows.filter((r) => r._id != null);

        // Reshape laptop×program into one row per program: { program, short, Yes, No }
        // for the grouped-bar chart, ordered foundation → core → industry → Moon.
        const PROGRAM_ORDER = ['Bamboo Coder', 'SkillUp Coder', 'AI Ready Engineers', 'Moon Coder'];
        const PROGRAM_SHORT = { 'Bamboo Coder': 'Bamboo', 'SkillUp Coder': 'SkillUp', 'AI Ready Engineers': 'AI Ready', 'Moon Coder': 'Moon' };
        const lbpMap = new Map();
        facet.laptopByProgram.forEach((r) => {
            const prog = r._id?.program;
            const lap = r._id?.laptop;
            if (!prog) return;
            if (!lbpMap.has(prog)) lbpMap.set(prog, { program: prog, short: PROGRAM_SHORT[prog] || prog, Yes: 0, No: 0 });
            if (lap === 'Yes' || lap === 'No') lbpMap.get(prog)[lap] += r.n;
        });
        const laptopByProgram = [
            ...PROGRAM_ORDER.filter((p) => lbpMap.has(p)).map((p) => lbpMap.get(p)),
            ...[...lbpMap.keys()].filter((p) => !PROGRAM_ORDER.includes(p)).map((p) => lbpMap.get(p))
        ];

        // CGPA bands in fixed order (the $bucket _id is the band's lower bound).
        const bandCounts = new Map(facet.byCgpaBand.map((r) => [r._id, r.n]));
        const byCgpaBand = CGPA_BAND_LABELS.map((name, i) => ({ name, value: bandCounts.get(CGPA_BOUNDARIES[i]) || 0 }));

        const BACKLOG_LABELS = { 0: 'None', 1: '1', 2: '2', 3: '3+' };
        const backlogCounts = new Map(facet.byBacklogs.map((r) => [r._id, r.n]));
        const byBacklogs = [0, 1, 2, 3].map((k) => ({ name: BACKLOG_LABELS[k], value: backlogCounts.get(k) || 0 }));

        const academicsRow = facet.academics[0] || null;
        const academics = {
            count: academicsRow?.n || 0,
            avgCgpa: academicsRow?.avgCgpa != null ? Math.round(academicsRow.avgCgpa * 100) / 100 : null,
            clearCount: academicsRow?.clear || 0,
            editedCount: academicsRow?.edited || 0
        };

        // Uptake per batch: eligible from the roster, registered from the range facet
        // (so the range filter shows "how many signed up this week" per batch), plus
        // the all-time registered count for the headline.
        const eligibleByBatch = new Map();
        roster.forEach((row) => {
            const key = row.batch || 'Unknown';
            eligibleByBatch.set(key, (eligibleByBatch.get(key) || 0) + 1);
        });
        const registeredByBatch = new Map(facet.moonByBatch.map((r) => [r._id, r.n]));
        const batchKeys = [...new Set([...eligibleByBatch.keys(), ...registeredByBatch.keys()])].sort((a, b) =>
            a.localeCompare(b, undefined, { numeric: true })
        );
        // Class time slots: catalogue order first, then any label no longer offered
        // (so older rows still count), overall and per batch.
        const slotLabels = (MOON.timeSlots || []).map((s) => s.label);
        const slotCounts = new Map(clean(facet.byTimeSlot).map((r) => [r._id, r.n]));
        const allSlotLabels = [...slotLabels, ...[...slotCounts.keys()].filter((l) => !slotLabels.includes(l))];
        const byTimeSlot = allSlotLabels.map((name) => ({ name, value: slotCounts.get(name) || 0 }));
        const slotByBatch = batchKeys.map((batch) => {
            const row = { batch };
            allSlotLabels.forEach((label) => { row[label] = 0; });
            return row;
        });
        const slotRowByBatch = new Map(slotByBatch.map((row) => [row.batch, row]));
        facet.slotByBatch.forEach((r) => {
            const row = slotRowByBatch.get(r._id?.batch || 'Unknown');
            if (row && r._id?.slot) row[r._id.slot] = (row[r._id.slot] || 0) + r.n;
        });

        const moonCoder = {
            programName: MOON.programName,
            open: MOON.open,
            eligible: roster.length,
            registered: moonTotal,
            registeredInRange: facet.moonByBatch.reduce((s, r) => s + r.n, 0),
            timeSlots: allSlotLabels,
            byBatch: batchKeys.map((batch) => ({
                batch,
                eligible: eligibleByBatch.get(batch) || 0,
                registered: registeredByBatch.get(batch) || 0
            }))
        };

        return NextResponse.json({
            success: true,
            range: range.key,
            program: program ? program.key : 'all',
            programs,
            grandTotal: perProgram.reduce((n, r) => n + r.n, 0),
            generatedAt: now.toISOString(),
            kpis: { total, allTotal, todayCount, weekCount },
            byGender: clean(facet.byGender).map((r) => ({ name: r._id, value: r.n })),
            byBranch: clean(facet.byBranch).map((r) => ({ name: r._id, value: r.n })),
            byResidence: clean(facet.byResidence).map((r) => ({ name: r._id, value: r.n })),
            byLaptop: clean(facet.byLaptop).map((r) => ({ name: r._id, value: r.n })),
            byAdmission: clean(facet.byAdmission).map((r) => ({ name: r._id, value: r.n })),
            byCgpaBand,
            byBacklogs,
            academics,
            byTimeSlot,
            slotByBatch,
            moonCoder,
            byProgram: facet.byProgram
                .filter((r) => r._id?.name)
                .map((r) => ({ name: r._id.name, year: r._id.year, label: r._id.label, value: r.n })),
            laptopByProgram,
            branchByYear: facet.branchByYear
                .filter((r) => r._id?.branch)
                .map((r) => ({ branch: r._id.branch, year: r._id.year, value: r.n })),
            timeSeries,
            recent: facet.recent
        });
    } catch (error) {
        console.error('[stats] aggregation failed:', error);
        return NextResponse.json({ success: false, message: 'Failed to compute analytics.' }, { status: 500 });
    }
}
