import { NextResponse } from 'next/server';
import { getRegistrationsCollection } from '../../../../lib/mongodb';
import { isAuthenticated } from '../../../../lib/dashboard-auth';
import {
    resolveRange,
    rangeMatch,
    fillDailySeries,
    startOfISTDay,
    IST_TZ
} from '../../../../lib/analytics-range';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

const RECENT_LIMIT = 100;

export async function GET(request) {
    if (!isAuthenticated(request)) {
        return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });
    }

    const range = resolveRange(request.nextUrl.searchParams.get('range'));

    // 3rd-year (2028 / "AI Ready Engineers") students are hidden from the dashboard
    // for now — they aren't part of the current registration drive. Excluding them
    // here keeps every chart AND the KPI tiles consistent. Remove HIDDEN_PASSOUT_YEARS
    // (or empty it) to show 3rd years again.
    const HIDDEN_PASSOUT_YEARS = ['2028'];
    const excludeHidden = { passoutYear: { $nin: HIDDEN_PASSOUT_YEARS } };
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
        // One round trip for everything inside the selected range.
        const [facet] = await collection
            .aggregate([
                { $match: match },
                {
                    $facet: {
                        total: [{ $count: 'n' }],
                        byGender: [{ $group: { _id: '$gender', n: { $sum: 1 } } }],
                        byBranch: [{ $group: { _id: '$branch', n: { $sum: 1 } } }, { $sort: { n: -1 } }],
                        byResidence: [{ $group: { _id: '$residenceType', n: { $sum: 1 } } }],
                        byLaptop: [{ $group: { _id: '$hasLaptop', n: { $sum: 1 } } }],
                        byCrtFee: [{ $group: { _id: '$paidCrtFee', n: { $sum: 1 } } }],
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
                                    paidCrtFee: 1,
                                    passoutYear: 1,
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
        // momentum numbers don't shift when you change the chart range.
        const todayStart = startOfISTDay(now);
        const weekStart = new Date(todayStart.getTime() - 6 * 24 * 60 * 60 * 1000);
        const [allTotal, todayCount, weekCount] = await Promise.all([
            collection.countDocuments({ ...excludeHidden }),
            collection.countDocuments({ createdAt: { $gte: todayStart }, ...excludeHidden }),
            collection.countDocuments({ createdAt: { $gte: weekStart }, ...excludeHidden })
        ]);

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
        // for the grouped-bar chart, ordered foundation → core → industry.
        const PROGRAM_ORDER = ['Bamboo Coder', 'SkillUp Coder', 'AI Ready Engineers'];
        const PROGRAM_SHORT = { 'Bamboo Coder': 'Bamboo', 'SkillUp Coder': 'SkillUp', 'AI Ready Engineers': 'AI Ready' };
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

        return NextResponse.json({
            success: true,
            range: range.key,
            generatedAt: now.toISOString(),
            kpis: { total, allTotal, todayCount, weekCount },
            byGender: clean(facet.byGender).map((r) => ({ name: r._id, value: r.n })),
            byBranch: clean(facet.byBranch).map((r) => ({ name: r._id, value: r.n })),
            byResidence: clean(facet.byResidence).map((r) => ({ name: r._id, value: r.n })),
            byLaptop: clean(facet.byLaptop).map((r) => ({ name: r._id, value: r.n })),
            byCrtFee: clean(facet.byCrtFee).map((r) => ({ name: r._id, value: r.n })),
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
