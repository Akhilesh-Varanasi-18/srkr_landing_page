'use client';

import { BRAND, RANGE_LABELS } from './dashboard-theme';
import { IconUsers, IconCalendar, IconTrend, IconLayers } from './dashboard-icons';

export default function KpiTiles({ kpis, range, programCount, branchCount }) {
    const rangeLabel = RANGE_LABELS[range] || 'All time';
    return (
        <div className="dash-kpis">
            <div className="dash-kpi dash-kpi--accent">
                <div className="dash-kpi-label">
                    <span className="dash-kpi-icon"><IconUsers /></span>
                    Total ({rangeLabel})
                </div>
                <div className="dash-kpi-value">{kpis.total.toLocaleString('en-IN')}</div>
                <div className="dash-kpi-foot">
                    {range === 'all' ? 'All registrations to date' : `${kpis.allTotal.toLocaleString('en-IN')} all-time`}
                </div>
            </div>

            <div className="dash-kpi">
                <div className="dash-kpi-label">
                    <span className="dash-kpi-icon"><IconCalendar /></span>
                    Today
                </div>
                <div className="dash-kpi-value">{kpis.todayCount.toLocaleString('en-IN')}</div>
                <div className="dash-kpi-foot">New sign-ups since midnight</div>
            </div>

            <div className="dash-kpi">
                <div className="dash-kpi-label">
                    <span className="dash-kpi-icon"><IconTrend /></span>
                    Last 7 days
                </div>
                <div className="dash-kpi-value">{kpis.weekCount.toLocaleString('en-IN')}</div>
                <div className="dash-kpi-foot">
                    <span className="dash-kpi-delta">{kpis.allTotal > 0 ? Math.round((kpis.weekCount / kpis.allTotal) * 100) : 0}%</span> of all registrations
                </div>
            </div>

            <div className="dash-kpi">
                <div className="dash-kpi-label">
                    <span className="dash-kpi-icon"><IconLayers /></span>
                    Coverage
                </div>
                <div className="dash-kpi-value">{branchCount}<span style={{ fontSize: 18, color: BRAND.muted, fontWeight: 600 }}> / {programCount}</span></div>
                <div className="dash-kpi-foot">Branches · program tracks</div>
            </div>
        </div>
    );
}
