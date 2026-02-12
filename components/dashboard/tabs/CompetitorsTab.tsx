'use client'

import { useState, useMemo } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Building2, TrendingUp, TrendingDown, Lightbulb, FileText, ExternalLink, Search } from 'lucide-react'
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, LineChart, Line, Cell } from 'recharts'
import { InfoTooltip, TermWithInfo } from '@/components/ui/InfoTooltip'
import { SectionSource } from '@/components/ui/SourceCitation'
import { getChartColor } from '@/lib/chart-colors'
import { RegionSelector } from '../RegionSelector'
import { INDUSTRIES, getIndustryByCompany, getCompetitors, CompanyData, Region, getIndustryData, getResolvedData } from '@/lib/industry-database'

// Sparkline data generator based on actual growth trend
const generateSparkline = (growth: number) => {
    const trend = growth > 15 ? 'up' : growth < 0 ? 'down' : 'neutral'
    const base = 50
    // Generate deterministic trend based on growth rate
    const trendFactor = growth / 10 // Normalize growth to trend factor
    
    return Array(7).fill(0).map((_, i) => {
        const trendValue = trend === 'up' ? i * 4 * trendFactor :
                          trend === 'down' ? -i * 2 * Math.abs(trendFactor) :
                          i * 0.5
        // Add small variance based on position (not random)
        const variance = Math.sin(i * 0.8) * 3
        return { v: base + trendValue + variance }
    })
}

const getForecast = (growth: number): string => {
    if (growth > 30) return 'Strong Buy'
    if (growth > 15) return 'Buy'
    if (growth > 0) return 'Hold'
    if (growth > -15) return 'Reduce'
    return 'Sell'
}

export function CompetitorsTab({ analysis }: { analysis: any }) {
    const [region, setRegion] = useState<Region>('india')

    // Detect if user searched for a company
    const companyMatch = useMemo(() => getIndustryByCompany(analysis.industry), [analysis.industry])
    const industryData = useMemo(() => getResolvedData(analysis.industry), [analysis.industry])

    // Get competitors based on search type
    const competitors = useMemo(() => {
        let companies: CompanyData[] = []

        if (companyMatch) {
            // User searched for a company - show its competitors
            companies = getCompetitors(analysis.industry, region)
        }

        // If no competitors found for company, or user searched for industry
        if (companies.length === 0) {
            Object.values(industryData.subcategories).forEach((sub: any) => {
                sub.companies.forEach((c: CompanyData) => {
                    if (region === 'global' || c.region === region) {
                        companies.push(c)
                    }
                })
            })
        }

        return companies
            .sort((a, b) => b.marketCap - a.marketCap)
            .slice(0, 10)
            .map((c, i) => ({
                rank: i + 1,
                name: c.name,
                ticker: c.ticker,
                marketCap: c.marketCap,
                growth: c.growth,
                evSales: (c.marketCap / c.revenue).toFixed(1),
                evEbitda: (c.marketCap / (c.revenue * c.ebitdaMargin / 100)).toFixed(1),
                peRatio: c.peRatio.toFixed(1),
                sector: c.region === 'india' ? 'India' : 'Global',
                exchange: c.exchange,
                forecast: getForecast(c.growth),
                sparkline: generateSparkline(c.growth)
            }))
    }, [analysis.industry, companyMatch, industryData, region])

    const currencySymbol = region === 'india' ? '₹' : '$'
    const currencyUnit = region === 'india' ? 'K Cr' : 'B'
    const formatCap = (val: number) => `${currencySymbol}${val.toFixed(1)}${currencyUnit}`

    // SWOT metrics calculated from real data
    const swotMetrics = useMemo(() => {
        if (competitors.length === 0) return []
        const avgGrowth = competitors.reduce((a, c) => a + c.growth, 0) / competitors.length
        const avgPE = competitors.reduce((a, c) => a + parseFloat(c.peRatio), 0) / competitors.length

        return [
            { label: 'Avg Growth Rate', value: `${avgGrowth.toFixed(1)}%`, percentile: Math.min(95, Math.max(20, avgGrowth * 3)), trend: avgGrowth > 10 ? 'up' : 'down' },
            { label: 'Sector P/E', value: avgPE.toFixed(1), percentile: avgPE > 25 ? 65 : 45, trend: 'neutral' },
            { label: 'Companies Tracked', value: competitors.length.toString(), percentile: 80, trend: 'up' },
            { label: 'Market Coverage', value: `${region === 'india' ? 'India' : 'Global'}`, percentile: 100, trend: 'up' },
        ]
    }, [competitors, region])

    // Real competitive insights
    const insights = useMemo(() => {
        if (competitors.length < 3) return []
        const sorted = [...competitors].sort((a, b) => b.growth - a.growth)
        return [
            { company: sorted[0]?.name, insight: 'Fastest Growing', detail: `${sorted[0]?.growth.toFixed(1)}% YoY revenue growth`, change: `+${sorted[0]?.growth.toFixed(1)}%` },
            { company: sorted[sorted.length - 1]?.name, insight: 'Lowest Growth', detail: `${sorted[sorted.length - 1]?.growth.toFixed(1)}% YoY growth`, change: `${sorted[sorted.length - 1]?.growth.toFixed(1)}%` },
            { company: [...competitors].sort((a, b) => b.marketCap - a.marketCap)[0]?.name, insight: 'Market Leader', detail: `Largest market cap in ${companyMatch?.subcategory || analysis.industry}`, change: '' },
        ]
    }, [competitors, analysis.industry, companyMatch])

    return (
        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
            {/* Header */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div>
                    <h2 className="text-2xl font-bold font-heading mb-1 flex items-center gap-2">
                        <Building2 className="h-6 w-6 text-primary" />
                        {companyMatch ? `${analysis.industry} Competitors` : `${analysis.industry} Companies`}
                    </h2>
                    {companyMatch && (
                        <p className="text-sm text-muted-foreground">
                            Showing competitors in {companyMatch.subcategory} ({companyMatch.industry})
                        </p>
                    )}
                </div>
                <RegionSelector region={region} onRegionChange={setRegion} />
            </div>

            {/* Summary Cards */}
            <div className="grid md:grid-cols-4 gap-4">
                <Card className="glass-card">
                    <CardContent className="p-5">
                        <p className="text-xs text-muted-foreground mb-2">Total Companies</p>
                        <p className="text-2xl font-bold">{competitors.length}</p>
                    </CardContent>
                </Card>
                <Card className="glass-card">
                    <CardContent className="p-5">
                        <p className="text-xs text-muted-foreground mb-2">Combined Market Cap</p>
                        <p className="text-2xl font-bold">{formatCap(competitors.reduce((a, c) => a + c.marketCap, 0))}</p>
                    </CardContent>
                </Card>
                <Card className="glass-card">
                    <CardContent className="p-5">
                        <p className="text-xs text-muted-foreground mb-2">Avg Growth</p>
                        <p className="text-2xl font-bold text-green-400">
                            +{(competitors.reduce((a, c) => a + c.growth, 0) / (competitors.length || 1)).toFixed(1)}%
                        </p>
                    </CardContent>
                </Card>
                <Card className="glass-card">
                    <CardContent className="p-5">
                        <p className="text-xs text-muted-foreground mb-2">Data Region</p>
                        <p className="text-2xl font-bold">{region === 'india' ? '🇮🇳 India' : '🌍 Global'}</p>
                    </CardContent>
                </Card>
            </div>

            {/* Competitors Table */}
            <Card className="glass-card overflow-hidden">
                <CardHeader>
                    <CardTitle className="text-base font-medium flex items-center gap-2">
                        Top Competitors
                    </CardTitle>
                </CardHeader>
                <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                        <thead className="bg-white/5 text-muted-foreground text-xs">
                            <tr>
                                <th className="px-4 py-3 text-left">#</th>
                                <th className="px-4 py-3 text-left">Company</th>
                                <th className="px-4 py-3 text-right"><TermWithInfo term="Market Cap">Mkt Cap</TermWithInfo></th>
                                <th className="px-4 py-3 text-right">Growth</th>
                                <th className="px-4 py-3 text-right"><TermWithInfo term="P/E Ratio">P/E</TermWithInfo></th>
                                <th className="px-4 py-3 text-center">Trend</th>
                                <th className="px-4 py-3 text-left">Exchange</th>
                                <th className="px-4 py-3 text-center">Rating</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-white/5">
                            {competitors.map((comp) => (
                                <tr key={comp.rank} className="hover:bg-white/5 transition-colors">
                                    <td className="px-4 py-3 font-medium">{comp.rank}</td>
                                    <td className="px-4 py-3">
                                        <a
                                            href={(industryData.subcategories[companyMatch?.subcategory || '']?.companies.find(c => c.name === comp.name) as any)?.website || `https://finance.yahoo.com/quote/${comp.ticker}`}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="group/link inline-flex flex-col"
                                        >
                                            <div className="flex items-center gap-1 group-hover/link:text-primary transition-colors">
                                                <span className="font-medium">{comp.name}</span>
                                                <ExternalLink className="h-2.5 w-2.5 opacity-0 group-hover/link:opacity-100 transition-opacity" />
                                            </div>
                                            <span className="text-xs text-muted-foreground">{comp.ticker}</span>
                                        </a>
                                    </td>
                                    <td className="px-4 py-3 text-right font-mono">{formatCap(comp.marketCap)}</td>
                                    <td className={`px-4 py-3 text-right font-mono ${comp.growth >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                                        {comp.growth >= 0 ? '+' : ''}{comp.growth.toFixed(1)}%
                                    </td>
                                    <td className="px-4 py-3 text-right font-mono">{comp.peRatio}</td>
                                    <td className="px-4 py-3">
                                        <div className="w-16 h-6">
                                            <ResponsiveContainer width="100%" height="100%">
                                                <LineChart data={comp.sparkline}>
                                                    <Line type="monotone" dataKey="v" stroke={comp.growth >= 0 ? '#10B981' : '#EF4444'} strokeWidth={1.5} dot={false} />
                                                </LineChart>
                                            </ResponsiveContainer>
                                        </div>
                                    </td>
                                    <td className="px-4 py-3 text-xs">{comp.exchange}</td>
                                    <td className="px-4 py-3 text-center">
                                        <Badge className={`text-[10px] ${comp.forecast === 'Strong Buy' ? 'bg-green-500/20 text-green-400' :
                                            comp.forecast === 'Buy' ? 'bg-emerald-500/20 text-emerald-400' :
                                                comp.forecast === 'Hold' ? 'bg-yellow-500/20 text-yellow-400' :
                                                    'bg-red-500/20 text-red-400'
                                            } border-none`}>
                                            {comp.forecast}
                                        </Badge>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </Card>

            {/* SWOT & Insights */}
            <div className="grid lg:grid-cols-2 gap-6">
                <Card className="glass-card">
                    <CardHeader>
                        <CardTitle className="text-base font-medium flex items-center gap-2">
                            Sector Metrics
                            <InfoTooltip term="SWOT" definition="Key financial metrics for the sector" />
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        {swotMetrics.map((metric) => (
                            <div key={metric.label} className="space-y-1">
                                <div className="flex justify-between text-xs">
                                    <span className="text-muted-foreground">{metric.label}</span>
                                    <span className="font-mono">{metric.value}</span>
                                </div>
                                <div className="h-2 bg-white/5 rounded-full overflow-hidden">
                                    <div
                                        className={`h-full ${metric.percentile >= 70 ? 'bg-green-500' : metric.percentile >= 40 ? 'bg-yellow-500' : 'bg-red-500'}`}
                                        style={{ width: `${metric.percentile}%` }}
                                    />
                                </div>
                            </div>
                        ))}
                    </CardContent>
                </Card>

                <Card className="glass-card">
                    <CardHeader>
                        <CardTitle className="text-base font-medium flex items-center gap-2">
                            <Lightbulb className="h-4 w-4 text-yellow-400" />
                            Competitive Insights
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        {insights.map((item, i) => (
                            <div key={i} className="flex items-start gap-3 p-3 rounded-lg bg-white/5">
                                <div className="flex-1">
                                    <p className="text-sm font-medium">{item.company}</p>
                                    <p className="text-xs text-primary">{item.insight}</p>
                                    <p className="text-xs text-muted-foreground mt-1">{item.detail}</p>
                                </div>
                                {item.change && (
                                    <Badge className={`text-xs ${item.change.startsWith('+') ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'} border-none`}>
                                        {item.change}
                                    </Badge>
                                )}
                            </div>
                        ))}
                    </CardContent>
                </Card>
            </div>

            {/* Market Cap Comparison Chart */}
            <Card className="glass-card">
                <CardHeader>
                    <CardTitle className="text-base font-medium">Market Cap Comparison</CardTitle>
                </CardHeader>
                <CardContent className="h-[280px]">
                    <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={competitors.slice(0, 6)} layout="vertical">
                            <XAxis type="number" stroke="#666" fontSize={10} tickFormatter={(v) => `${currencySymbol}${v}${currencyUnit}`} />
                            <YAxis type="category" dataKey="name" stroke="#666" fontSize={10} width={120} />
                            <Tooltip contentStyle={{ backgroundColor: '#1A1A1A', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px' }} />
                            <Bar dataKey="marketCap" radius={[0, 4, 4, 0]}>
                                {competitors.slice(0, 6).map((_, index) => (
                                    <Cell key={`cell-${index}`} fill={getChartColor(index)} />
                                ))}
                            </Bar>
                        </BarChart>
                    </ResponsiveContainer>
                </CardContent>
            </Card>

            {/* Data Sources */}
            <SectionSource sources={industryData.dataSources} />
        </div>
    )
}
