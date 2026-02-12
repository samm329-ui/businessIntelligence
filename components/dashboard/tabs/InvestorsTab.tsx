'use client'

import React from 'react'
import { IndustryData, CompanyData } from '@/lib/industry-database'
import { TrendingUp, Users, DollarSign, Target, ExternalLink } from 'lucide-react'
import {
    BarChart,
    Bar,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
    Cell
} from 'recharts'

interface InvestorsTabProps {
    data: IndustryData
    searchQuery: string
}

export default function InvestorsTab({ data, searchQuery }: InvestorsTabProps) {
    if (!data) return (
        <div className="p-8 text-center">
            <p className="text-muted-foreground">Initializing stakeholder data...</p>
        </div>
    )
    const investors = data.investors || []

    const stats = [
        {
            label: 'Total Stakeholders',
            value: investors.length,
            icon: Users,
            color: 'text-blue-400',
            bg: 'bg-blue-400/10'
        },
        {
            label: 'Avg. Portfolio Cap',
            value: `$${(investors.reduce((acc, curr) => acc + curr.marketCap, 0) / (investors.length || 1)).toFixed(1)}B`,
            icon: DollarSign,
            color: 'text-purple-400',
            bg: 'bg-purple-400/10'
        },
        {
            label: 'Sector Exposure',
            value: 'High',
            icon: Target,
            color: 'text-emerald-400',
            bg: 'bg-emerald-400/10'
        },
        {
            label: 'Investment Growth',
            value: '+12.5%',
            icon: TrendingUp,
            color: 'text-orange-400',
            bg: 'bg-orange-400/10'
        }
    ]

    return (
        <div className="space-y-6">
            {/* Stats Overview */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {stats.map((stat, index) => (
                    <div key={index} className="p-4 rounded-xl border border-white/5 bg-white/5 hover:bg-white/[0.07] transition-all group">
                        <div className="flex items-center gap-3">
                            <div className={`p-2 rounded-lg ${stat.bg}`}>
                                <stat.icon className={`w-5 h-5 ${stat.color}`} />
                            </div>
                            <div>
                                <p className="text-xs text-white/40 uppercase tracking-wider font-medium">{stat.label}</p>
                                <p className="text-xl font-bold text-white mt-0.5">{stat.value}</p>
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Investor List */}
                <div className="lg:col-span-2 space-y-4">
                    <div className="p-6 rounded-2xl border border-white/5 bg-white/5">
                        <div className="flex items-center justify-between mb-6">
                            <h3 className="text-lg font-bold text-white flex items-center gap-2">
                                <Users className="w-5 h-5 text-blue-400" />
                                Institutional Stakeholders
                            </h3>
                            <span className="text-xs text-white/40 px-3 py-1 bg-white/5 rounded-full border border-white/5">
                                Sector: {data.name}
                            </span>
                        </div>

                        <div className="overflow-x-auto">
                            <table className="w-full">
                                <thead>
                                    <tr className="border-b border-white/10 text-left">
                                        <th className="pb-4 text-xs font-semibold text-white/40 uppercase tracking-wider">Stakeholder</th>
                                        <th className="pb-4 text-xs font-semibold text-white/40 uppercase tracking-wider text-right">Market Cap</th>
                                        <th className="pb-4 text-xs font-semibold text-white/40 uppercase tracking-wider text-right">Growth (%)</th>
                                        <th className="pb-4 text-xs font-semibold text-white/40 uppercase tracking-wider text-center">Region</th>
                                        <th className="pb-4 text-xs font-semibold text-white/40 uppercase tracking-wider text-center">Action</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-white/5">
                                    {investors.map((investor, index) => (
                                        <tr key={index} className="group hover:bg-white/[0.02] transition-colors">
                                            <td className="py-4">
                                                <div>
                                                    <div className="text-sm font-semibold text-white">{investor.name}</div>
                                                    <div className="text-xs text-white/40">{investor.ticker} • {investor.exchange}</div>
                                                </div>
                                            </td>
                                            <td className="py-4 text-right">
                                                <div className="text-sm font-medium text-white">${investor.marketCap}B</div>
                                            </td>
                                            <td className="py-4 text-right">
                                                <div className={`text-sm font-medium ${investor.growth >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                                                    {investor.growth > 0 ? '+' : ''}{investor.growth}%
                                                </div>
                                            </td>
                                            <td className="py-4 text-center">
                                                <span className={`text-[10px] px-2 py-0.5 rounded-full border ${investor.region === 'india'
                                                    ? 'bg-orange-400/5 border-orange-400/20 text-orange-400'
                                                    : 'bg-blue-400/5 border-blue-400/20 text-blue-400'
                                                    } uppercase font-bold`}>
                                                    {investor.region}
                                                </span>
                                            </td>
                                            <td className="py-4 text-center">
                                                <a
                                                    href={investor.website || `https://finance.yahoo.com/quote/${investor.ticker}`}
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    className="p-1 px-2 rounded bg-white/5 border border-white/10 text-white/40 hover:text-white hover:bg-white/10 transition-all font-medium text-[10px] inline-flex items-center gap-1 uppercase tracking-tighter"
                                                >
                                                    View Portfolio
                                                    <ExternalLink className="w-3 h-3" />
                                                </a>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>

                {/* Investment Composition */}
                <div className="space-y-6">
                    <div className="p-6 rounded-2xl border border-white/5 bg-white/5">
                        <h3 className="text-lg font-bold text-white mb-6">Market Influence</h3>
                        <div className="h-[240px] w-full">
                            <ResponsiveContainer width="100%" height="100%">
                                <BarChart data={investors} margin={{ top: 0, right: 10, left: -20, bottom: 0 }}>
                                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
                                    <XAxis
                                        dataKey="name"
                                        stroke="rgba(255,255,255,0.3)"
                                        fontSize={10}
                                        tickLine={false}
                                        axisLine={false}
                                    />
                                    <YAxis
                                        stroke="rgba(255,255,255,0.3)"
                                        fontSize={10}
                                        tickLine={false}
                                        axisLine={false}
                                        label={{ value: '$ (B)', angle: -90, position: 'insideLeft', fill: 'rgba(255,255,255,0.3)', offset: 10 }}
                                    />
                                    <Tooltip
                                        contentStyle={{ backgroundColor: '#111', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px' }}
                                        itemStyle={{ color: '#fff' }}
                                    />
                                    <Bar dataKey="marketCap" radius={[4, 4, 0, 0]}>
                                        {investors.map((entry, index) => (
                                            <Cell key={`cell-${index}`} fill={index % 2 === 0 ? '#60a5fa' : '#a855f7'} />
                                        ))}
                                    </Bar>
                                </BarChart>
                            </ResponsiveContainer>
                        </div>
                        <p className="mt-4 text-xs text-white/40 leading-relaxed text-center px-4">
                            Aggregated market capitalization of major {data.name} institutional stakeholders.
                        </p>
                    </div>

                    <div className="p-6 rounded-2xl border border-white/5 bg-white/5 relative overflow-hidden group">
                        <div className="absolute top-0 right-0 p-3 opacity-10 group-hover:scale-110 transition-transform">
                            <Target className="w-12 h-12 text-blue-400" />
                        </div>
                        <h4 className="text-sm font-bold text-white mb-2">Stakeholder Sentiment</h4>
                        <div className="flex items-center gap-2 mb-4">
                            <span className="text-2xl font-bold text-emerald-400 font-mono tracking-tighter">BULLISH</span>
                            <span className="text-xs text-white/20 font-medium">Confidence: 88%</span>
                        </div>
                        <div className="w-full bg-white/5 rounded-full h-1.5 overflow-hidden">
                            <div className="bg-emerald-400 h-full w-[88%] shadow-[0_0_10px_rgba(52,211,153,0.5)]"></div>
                        </div>
                        <p className="mt-4 text-[11px] text-white/40 leading-relaxed italic">
                            Trend analysis indicates sustained institutional capital inflow over the trailing 12 months for {data.name} sector.
                        </p>
                    </div>
                </div>
            </div>
        </div>
    )
}
