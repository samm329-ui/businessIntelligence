'use client'

import { useState, useMemo } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { TrendingUp, DollarSign, Building2, Globe, Activity, ExternalLink, BarChart3 } from 'lucide-react'
import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip, CartesianGrid, BarChart, Bar, PieChart, Pie, Cell, Legend } from 'recharts'
import { VerdictCard } from '../VerdictCard'
import { InfoTooltip, TermWithInfo } from '@/components/ui/InfoTooltip'
import { SectionSource, VerifiedData } from '@/components/ui/SourceCitation'
import { RecentActivity, getIndustryNews } from '../RecentActivity'
import { HeatMap, generateHeatMapData } from '@/components/charts/HeatMap'
import { PIE_COLORS, getChartColor } from '@/lib/chart-colors'
import { RegionSelector } from '../RegionSelector'
import { INDUSTRIES, getIndustryData, getRevenueBreakdown, Region, DATA_SOURCES_DETAILED, getResolvedData, getIndustryByCompany } from '@/lib/industry-database'

export function OverviewTab({ analysis }: { analysis: any }) {
    const [region, setRegion] = useState<Region>('india')

    // Get industry-specific data with smart resolution
    const industryData = useMemo(() => getResolvedData(analysis.industry), [analysis.industry])
    const companyContext = useMemo(() => getIndustryByCompany(analysis.industry), [analysis.industry])

    // Get revenue breakdown based on industry and region
    const revenueData = useMemo(() => {
        const breakdown = industryData.revenueBreakdown[region]
        return Object.entries(breakdown).map(([name, value], index) => ({
            name,
            value,
            color: PIE_COLORS[index % PIE_COLORS.length]
        }))
    }, [industryData, region])

    // Get top companies for this industry and region
    const topCompanies = useMemo(() => {
        const companies: any[] = []

        // Use either specific subcategory if found via company search, or entire industry
        const sourceData = companyContext
            ? industryData.subcategories[companyContext.subcategory].companies
            : Object.values(industryData.subcategories).flatMap(s => s.companies)

        sourceData
            .filter(c => region === 'global' || c.region === region)
            .forEach(c => companies.push(c))

        return companies
            .sort((a, b) => b.marketCap - a.marketCap)
            .slice(0, 6)
            .map(c => ({ name: c.name.split(' ')[0], value: c.marketCap, growth: c.growth, ticker: c.ticker }))
    }, [industryData, companyContext, region])

    // Market size based on region
    const marketSize = region === 'india' ? industryData.indiaMarketSize : industryData.globalMarketSize
    const marketGrowth = region === 'india' ? industryData.indiaGrowth : industryData.globalGrowth

    const currencySymbol = region === 'india' ? '₹' : '$'
    const currencyUnit = region === 'india' ? 'K Cr' : 'B'

    const formatCurrency = (val: number) => `${currencySymbol}${val.toFixed(1)}${currencyUnit}`
    const industryNews = getIndustryNews(industryData.name)

    // Data sources for this industry
    const dataSources = industryData?.dataSources || ['Statista', 'Bloomberg']

    return (
        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">

            {/* Industry Context & Hierarchy */}
            {analysis.industryHierarchy && (
                <Card className="glass-card border-primary/20">
                    <CardContent className="p-4">
                        <div className="flex flex-wrap items-center gap-2 text-sm">
                            <span className="text-muted-foreground">Industry Hierarchy:</span>
                            <Badge variant="secondary" className="text-xs">
                                {analysis.industryHierarchy.sector}
                            </Badge>
                            <span className="text-muted-foreground">›</span>
                            <Badge variant="secondary" className="text-xs">
                                {analysis.industryHierarchy.industry}
                            </Badge>
                            <span className="text-muted-foreground">›</span>
                            <Badge variant="outline" className="text-xs bg-primary/10 text-primary border-primary/30">
                                {analysis.subIndustry || analysis.industryHierarchy.subIndustry}
                            </Badge>
                            {analysis.productCategory && (
                                <>
                                    <span className="text-muted-foreground">›</span>
                                    <Badge className="text-xs bg-primary text-primary-foreground">
                                        {analysis.productCategory}
                                    </Badge>
                                </>
                            )}
                        </div>
                        {analysis.competitorContext && (
                            <p className="text-xs text-muted-foreground mt-2">
                                Competitors filtered by: {analysis.competitorContext}
                            </p>
                        )}
                    </CardContent>
                </Card>
            )}

            {/* Header with Region Selector */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div>
                    <h2 className="text-2xl font-bold font-heading mb-1">{analysis.industry}</h2>
                    {analysis.subIndustry && (
                        <p className="text-sm text-muted-foreground">
                            {analysis.subIndustry}
                            {analysis.productCategory && ` • ${analysis.productCategory}`}
                        </p>
                    )}
                    <VerifiedData source={dataSources.slice(0, 3).join(', ')} lastUpdated="Jan 2025" />
                </div>
                <div className="flex items-center gap-3">
                    <RegionSelector region={region} onRegionChange={setRegion} />
                    <Badge variant="outline" className="h-8 gap-1 pl-1 pr-3 bg-green-500/10 text-green-500 border-green-500/20">
                        <span className="relative flex h-2 w-2 mr-1">
                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                            <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
                        </span>
                        Live
                    </Badge>
                </div>
            </div>

            {/* Verdict Card */}
            <VerdictCard analysis={analysis} />

            {/* Market Overview Cards */}
            <div className="grid md:grid-cols-4 gap-4">
                <Card className="glass-card">
                    <CardContent className="p-5">
                        <p className="text-xs text-muted-foreground mb-2 flex items-center gap-1">
                            <TermWithInfo term="TAM">Market Size (TAM)</TermWithInfo>
                        </p>
                        <p className="text-2xl font-bold">{formatCurrency(marketSize)}</p>
                        <p className="text-xs text-muted-foreground mt-1">{region === 'india' ? 'India' : 'Global'} 2024</p>
                    </CardContent>
                </Card>
                <Card className="glass-card">
                    <CardContent className="p-5">
                        <p className="text-xs text-muted-foreground mb-2 flex items-center gap-1">
                            <TermWithInfo term="CAGR">Growth Rate</TermWithInfo>
                        </p>
                        <p className="text-2xl font-bold text-green-400">+{marketGrowth}%</p>
                        <p className="text-xs text-muted-foreground mt-1">CAGR 2024-2028</p>
                    </CardContent>
                </Card>
                <Card className="glass-card">
                    <CardContent className="p-5">
                        <p className="text-xs text-muted-foreground mb-2">Top Companies</p>
                        <p className="text-2xl font-bold">{topCompanies.length}+</p>
                        <p className="text-xs text-muted-foreground mt-1">Major players tracked</p>
                    </CardContent>
                </Card>
                <Card className="glass-card">
                    <CardContent className="p-5">
                        <p className="text-xs text-muted-foreground mb-2">Data Sources</p>
                        <p className="text-2xl font-bold">{dataSources.length}</p>
                        <p className="text-xs text-muted-foreground mt-1">Verified sources</p>
                    </CardContent>
                </Card>
            </div>

            {/* Top Companies Chart */}
            {topCompanies.length > 0 && (
                <Card className="glass-card">
                    <CardHeader className="flex flex-row items-center justify-between">
                        <CardTitle className="text-base font-medium flex items-center gap-2">
                            <BarChart3 className="h-4 w-4 text-primary" />
                            <TermWithInfo term="Market Cap">Top {region === 'india' ? 'Indian' : 'Global'} Companies</TermWithInfo>
                        </CardTitle>
                        <Badge variant="outline" className="text-xs">by Market Cap</Badge>
                    </CardHeader>
                    <CardContent className="h-[280px]">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={topCompanies}>
                                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.02)" vertical={false} />
                                <XAxis dataKey="name" stroke="#666" fontSize={11} tickLine={false} axisLine={false} />
                                <YAxis stroke="#666" fontSize={11} tickLine={false} axisLine={false} tickFormatter={(val) => `${currencySymbol}${val}${region === 'india' ? 'K Cr' : 'B'}`} />
                                <Tooltip
                                    contentStyle={{ backgroundColor: '#1A1A1A', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px' }}
                                    formatter={(value) => [`${currencySymbol}${value}${region === 'india' ? 'K Cr' : 'B'}`, 'Market Cap']}
                                />
                                <Bar dataKey="value" radius={[4, 4, 0, 0]}>
                                    {topCompanies.map((_, index) => (
                                        <Cell key={`cell-${index}`} fill={getChartColor(index)} />
                                    ))}
                                </Bar>
                            </BarChart>
                        </ResponsiveContainer>
                    </CardContent>
                </Card>
            )}

            {/* Revenue Breakdown - Industry Specific */}
            <div className="grid lg:grid-cols-2 gap-6">
                <Card className="glass-card">
                    <CardHeader>
                        <CardTitle className="text-base font-medium flex items-center gap-2">
                            <TermWithInfo term="EBITDA">Revenue Breakdown ({region === 'india' ? 'India' : 'Global'})</TermWithInfo>
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="h-[280px]">
                        <ResponsiveContainer width="100%" height="100%">
                            <PieChart>
                                <Pie
                                    data={revenueData}
                                    cx="35%"
                                    cy="50%"
                                    innerRadius={50}
                                    outerRadius={80}
                                    paddingAngle={2}
                                    dataKey="value"
                                >
                                    {revenueData.map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={entry.color} />
                                    ))}
                                </Pie>
                                <Legend
                                    layout="vertical"
                                    align="right"
                                    verticalAlign="middle"
                                    formatter={(value, entry: any) => (
                                        <span className="text-xs text-muted-foreground">
                                            {value} <span className="text-foreground ml-2">{entry.payload.value}%</span>
                                        </span>
                                    )}
                                />
                            </PieChart>
                        </ResponsiveContainer>
                    </CardContent>
                </Card>

                <Card className="glass-card">
                    <CardHeader>
                        <CardTitle className="text-base font-medium">Market Growth Projection</CardTitle>
                    </CardHeader>
                    <CardContent className="h-[280px]">
                        <div className="flex items-center gap-4 mb-4">
                            <span className="text-2xl font-bold text-green-400">+{marketGrowth}%</span>
                            <span className="text-sm text-muted-foreground">Expected CAGR</span>
                        </div>
                        <ResponsiveContainer width="100%" height="75%">
                            <AreaChart data={[
                                { year: '2024', value: marketSize },
                                { year: '2025', value: marketSize * (1 + marketGrowth / 100) },
                                { year: '2026', value: marketSize * Math.pow(1 + marketGrowth / 100, 2) },
                                { year: '2027', value: marketSize * Math.pow(1 + marketGrowth / 100, 3) },
                                { year: '2028', value: marketSize * Math.pow(1 + marketGrowth / 100, 4) },
                            ]}>
                                <defs>
                                    <linearGradient id="colorGrowth" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="#10B981" stopOpacity={0.4} />
                                        <stop offset="95%" stopColor="#10B981" stopOpacity={0} />
                                    </linearGradient>
                                </defs>
                                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.02)" vertical={false} />
                                <XAxis dataKey="year" stroke="#666" fontSize={10} tickLine={false} axisLine={false} />
                                <YAxis stroke="#666" fontSize={10} tickLine={false} axisLine={false} tickFormatter={(val) => `${currencySymbol}${val.toFixed(0)}`} />
                                <Tooltip contentStyle={{ backgroundColor: '#1A1A1A', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px' }} />
                                <Area type="monotone" dataKey="value" stroke="#10B981" strokeWidth={2} fill="url(#colorGrowth)" />
                            </AreaChart>
                        </ResponsiveContainer>
                    </CardContent>
                </Card>
            </div>

            {/* Recent News */}
            <RecentActivity industry={analysis.industry} news={industryNews} />

            {/* Heat Map */}
            <HeatMap data={generateHeatMapData(analysis.industry)} title={`${analysis.industry} Regional Analysis`} />

            {/* Data Sources Footer */}
            <SectionSource sources={industryData.dataSources} />
        </div>
    )
}
