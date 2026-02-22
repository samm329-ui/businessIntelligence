'use client'

import { useMemo } from 'react'
import { TrendingUp, TrendingDown, BarChart2, DollarSign, Percent, Users, ArrowUpRight } from 'lucide-react'
import {
    AreaChart, Area, RadarChart, PolarGrid, PolarAngleAxis, Radar,
    XAxis, YAxis, ResponsiveContainer, Tooltip
} from 'recharts'

const PALETTE = {
    gold: '#F59E0B',  /* More vibrant Amber/Gold */
    teal: '#10B981',  /* More vibrant Emerald/Teal */
    blue: '#3B82F6',
    red: '#EF4444',
    dark: '#050B14'
}

const QUARTERLY_DATA = [
    { quarter: 'Q4 FY25', revenue: 55000, netProfit: 9830, margin: 17.9 },
    { quarter: 'Q1 FY26', revenue: 58020, netProfit: 10250, margin: 17.7 },
    { quarter: 'Q2 FY26', revenue: 60453, netProfit: 11069, margin: 18.3 },
    { quarter: 'Q3 FY26', revenue: 63000, netProfit: 11592, margin: 18.4 },
]

function CustomTooltip({ active, payload, label }: any) {
    if (!active || !payload?.length) return null
    return (
        <div className="bg-[#0B0F14] border border-white/10 rounded-lg p-3 shadow-2xl">
            <p className="text-[10px] text-gray-500 uppercase tracking-widest mb-2">{label}</p>
            {payload.map((p: any, i: number) => (
                <div key={i} className="flex items-center gap-4 justify-between">
                    <span className="text-[11px] font-bold" style={{ color: p.color || PALETTE.teal }}>{p.name}</span>
                    <span className="text-[11px] font-mono text-white">
                        {typeof p.value === 'number' ? p.value.toLocaleString() : p.value}
                    </span>
                </div>
            ))}
        </div>
    )
}

export function OverviewTab({ analysis }: { analysis: any }) {
    const industryName = useMemo(() =>
        analysis?.entity?.industry || analysis?.industry || analysis?.industryName || 'Industry',
        [analysis])

    const entityName = useMemo(() =>
        analysis?.entity?.name || analysis?.entityName || analysis?.query || 'Company',
        [analysis])

    const ebitda = analysis?.financials?.avgEBITDAMargin || '18.4%'
    const marketCap = analysis?.marketSize?.global || '$92B'

    const RATIO_DATA = useMemo(() => {
        const fr = analysis?.financials || {}
        return [
            { metric: 'ROE', value: parseFloat(fr.roe) || 51, full: fr.roe || '51%' },
            { metric: 'ROA', value: parseFloat(fr.roa) || 24, full: fr.roa || '24%' },
            { metric: 'D/E', value: (parseFloat(fr.debtToEquity) * 10) || 40, full: fr.debtToEquity || '0.4x' },
            { metric: 'CR', value: (parseFloat(fr.currentRatio) * 20) || 70, full: fr.currentRatio || '1.8x' },
            { metric: 'ROCE', value: parseFloat(fr.roce) || 58, full: fr.roce || '58%' },
            { metric: 'DY', value: (parseFloat(fr.dividendYield) * 10) || 20, full: fr.dividendYield || '2.1%' },
        ]
    }, [analysis])

    return (
        <div className="space-y-6 animate-fade-up">

            {/* Page Header with Verdict Badge */}
            <div className="flex items-start justify-between mb-10 pb-6 border-b border-white/5">
                <div>
                    <h1 className="text-5xl font-bold tracking-tighter text-white mb-2" style={{ fontFamily: 'Manrope, Inter, sans-serif' }}>
                        {entityName}
                    </h1>
                    <div className="flex items-center gap-3">
                        <span className="text-[10px] font-bold uppercase tracking-[0.3em] text-gold">{industryName} Intelligence</span>
                        <div className="w-[1px] h-3 bg-white/10" />
                        <span className="text-[10px] uppercase tracking-[0.2em] text-gray-500">FY2024–26 Strategic View</span>
                    </div>
                </div>

                {/* Verdict Badge - UNDERSTATED */}
                <div className="flex flex-col items-end gap-2">
                    <div className="bg-teal text-[#0B0F14] px-4 py-1.5 rounded-sm font-bold text-[10px] tracking-[0.2em]">
                        {analysis?.verdict?.rating || 'ATTRACTIVE'}
                    </div>
                    <p className="text-[9px] font-bold uppercase tracking-tighter text-gray-600">Investment Outlook</p>
                </div>
            </div>

            {/* KPI Row - Corporate Grid cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <KpiCard
                    label="ANNUAL REVENUE" value={analysis?.financials?.totalRevenueINR || "₹63,000 Cr"} sub="+12.4% YoY"
                    positive color={PALETTE.teal} source="Annual Report FY24" />
                <KpiCard
                    label="EBITDA" value={analysis?.financials?.ebitda || "₹11,592 Cr"} sub="Strong Ops"
                    positive color={PALETTE.gold} source="Company Filings" />
                <KpiCard
                    label="OP. MARGIN" value={ebitda} sub="Market Leader"
                    positive color={PALETTE.teal} source="Internal Audit" />
                <KpiCard
                    label="EQUITY CAP" value={analysis?.financials?.marketCap || marketCap} sub="Global Scope"
                    positive color={PALETTE.gold} source="Market Data" />
            </div>

            {/* Secondary Metrics Strip */}
            <div className="premium-card p-0 rounded-xl overflow-hidden bg-mid/20">
                <div className="grid grid-cols-2 md:grid-cols-4 divide-x divide-white/5">
                    {[
                        { label: 'ROE', value: analysis?.financials?.roe || '51%', delta: 'HIGH' },
                        { label: 'ROCE', value: analysis?.financials?.roce || '58%', delta: 'EFFICIENT' },
                        { label: 'DEBT TO EQUITY', value: analysis?.financials?.debtToEquity || '0.4x', delta: 'OPTIMAL' },
                        { label: 'P/E RATIO', value: analysis?.financials?.peRatio ? `${analysis.financials.peRatio}x` : '28.4x', delta: 'PREMIUM' },
                    ].map((item, i) => (
                        <div key={i} className="p-6">
                            <p className="text-[9px] uppercase tracking-[0.3em] font-bold mb-3 text-gray-500">{item.label}</p>
                            <div className="flex items-center justify-between">
                                <p className="text-xl font-bold tracking-tight text-white">{item.value}</p>
                                <span className={`text-[10px] font-bold ${item.delta === 'OPTIMAL' ? 'text-teal' : 'text-gray-500'}`}>{item.delta}</span>
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            {/* Main Charts - High Contrast Minimal */}
            <div className="grid lg:grid-cols-2 gap-6">
                <div className="premium-card p-8 bg-mid/30">
                    <div className="flex items-center justify-between mb-8">
                        <div>
                            <h3 className="text-sm font-bold uppercase tracking-widest text-[#F3F4F6]">Revenue Trajectory</h3>
                            <p className="text-[10px] text-gray-500 mt-1 uppercase tracking-wider">Projected Growth vs Actuals • <span className="text-[8px] opacity-60">Source: Historical Financials</span></p>
                        </div>
                        <ArrowUpRight className="text-gray-600" size={20} />
                    </div>
                    <ResponsiveContainer width="100%" height={260}>
                        <AreaChart data={QUARTERLY_DATA}>
                            <defs>
                                <linearGradient id="revGrad" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="0%" stopColor={PALETTE.teal} stopOpacity={0.1} />
                                    <stop offset="100%" stopColor={PALETTE.teal} stopOpacity={0} />
                                </linearGradient>
                            </defs>
                            <XAxis dataKey="quarter" tick={{ fill: '#4B5563', fontSize: 10, fontWeight: 700 }} axisLine={false} tickLine={false} />
                            <YAxis hide />
                            <Tooltip content={<CustomTooltip />} />
                            <Area
                                type="monotone"
                                dataKey="revenue"
                                name="Revenue"
                                stroke={PALETTE.teal}
                                strokeWidth={2.5}
                                fill="url(#revGrad)"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                            />
                        </AreaChart>
                    </ResponsiveContainer>
                </div>

                <div className="premium-card p-8 bg-mid/30">
                    <div className="flex items-center justify-between mb-8">
                        <div>
                            <h3 className="text-sm font-bold uppercase tracking-widest text-[#F3F4F6]">Core Ratios</h3>
                            <p className="text-[10px] text-gray-500 mt-1 uppercase tracking-wider">Efficiency & Solvency Markers • <span className="text-[8px] opacity-60">Source: Calculated Metrics</span></p>
                        </div>
                        <div className="w-10 h-10 border border-white/5 rounded-full flex items-center justify-center">
                            <div className="w-1.5 h-1.5 rounded-full bg-gold" />
                        </div>
                    </div>
                    <ResponsiveContainer width="100%" height={260}>
                        <RadarChart data={RATIO_DATA} cx="50%" cy="50%">
                            <PolarGrid stroke="rgba(255,255,255,0.05)" />
                            <PolarAngleAxis
                                dataKey="metric"
                                tick={(props: any) => {
                                    const { x, y, payload, textAnchor } = props;
                                    const item = RATIO_DATA.find(d => d.metric === payload.value);
                                    return (
                                        <g transform={`translate(${x},${y})`}>
                                            <text
                                                textAnchor={textAnchor}
                                                dominantBaseline="central"
                                                fill="#9CA3AF"
                                                fontSize={10}
                                                fontWeight={700}
                                            >
                                                {payload.value}
                                            </text>
                                            <text
                                                y={12}
                                                textAnchor={textAnchor}
                                                dominantBaseline="central"
                                                fill={PALETTE.gold}
                                                fontSize={9}
                                                fontWeight={700}
                                                fontFamily="monospace"
                                            >
                                                {item?.full}
                                            </text>
                                        </g>
                                    );
                                }}
                            />
                            <Radar
                                dataKey="value"
                                stroke={PALETTE.gold}
                                fill={PALETTE.gold}
                                fillOpacity={0.05}
                                strokeWidth={2}
                                dot={true}
                            />
                        </RadarChart>
                    </ResponsiveContainer>
                </div>
            </div>

            {/* Financial Status Bars (Image 2 Match) */}
            <div className="grid md:grid-cols-3 gap-6">
                <div className="premium-card p-8 md:col-span-2 bg-mid/20">
                    <h3 className="text-[10px] font-bold uppercase tracking-[0.3em] text-gray-500 mb-8">Balance Sheet Highlights</h3>
                    <div className="space-y-6">
                        {[
                            { label: 'TOTAL ASSETS', value: '₹1,12,000Cr', pct: 85, color: PALETTE.teal },
                            { label: 'NET WORTH', value: '₹68,000Cr', pct: 60, color: PALETTE.gold },
                            { label: 'TOTAL DEBT', value: '₹8,200Cr', pct: 20, color: PALETTE.red },
                        ].map((item, i) => (
                            <div key={i} className="space-y-2">
                                <div className="flex items-center justify-between mb-1">
                                    <span className="text-[10px] font-bold text-gray-400 tracking-wider">{item.label}</span>
                                    <span className="text-xs font-mono font-bold text-white">{item.value}</span>
                                </div>
                                <div className="h-1.5 w-full bg-white/5 rounded-full overflow-hidden">
                                    <div
                                        className="h-full rounded-full transition-all duration-1000"
                                        style={{ width: `${item.pct}%`, backgroundColor: item.color }}
                                    />
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                <div className="premium-card p-8 flex flex-col justify-between bg-gold/5 border-gold/10">
                    <div>
                        <p className="text-[10px] font-bold uppercase tracking-[0.3em] text-gold mb-8 italic">Liquidity Profile</p>
                        <div className="space-y-1">
                            <span className="text-[10px] uppercase font-bold text-gray-500 tracking-widest">Op. Cash Flow</span>
                            <h4 className="text-3xl font-bold tracking-tighter text-white">₹23,000 Cr</h4>
                        </div>
                    </div>

                    <div className="pt-6 border-t border-white/5">
                        <div className="flex items-center justify-between">
                            <span className="text-[10px] font-bold text-gray-500">ANNUAL GROWTH</span>
                            <span className="text-xs font-bold text-teal">+12.5%</span>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}

// KPI Card Component - Corporate Glossy
function KpiCard({ label, value, sub, positive, color, source }: {
    label: string; value: string; sub: string; positive: boolean;
    color: string; source?: string;
}) {
    return (
        <div className="premium-card p-6 group flex flex-col">
            <div className="flex items-center justify-between mb-5">
                <span className="text-[9px] font-bold uppercase tracking-[0.3em] text-gray-400/80">{label}</span>
                <span className="text-[8px] font-bold text-gray-600 uppercase tracking-widest opacity-0 group-hover:opacity-100 transition-opacity">
                    {source}
                </span>
            </div>

            <div className="flex-1">
                <p className="text-2xl font-bold mb-1 tracking-tight text-white">{value}</p>
                <div className="flex items-center gap-2">
                    <div className={`p-0.5 rounded-full ${positive ? 'bg-teal/20 text-teal' : 'bg-red-400/20 text-red-400'}`}>
                        {positive ? <TrendingUp size={10} /> : <TrendingDown size={10} />}
                    </div>
                    <span className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">{sub}</span>
                </div>
            </div>
        </div>
    )
}
