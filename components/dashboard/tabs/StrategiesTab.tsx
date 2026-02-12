'use client'

import { useState, useMemo } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
    Target,
    TrendingUp,
    Zap,
    BarChart3,
    ArrowUpRight,
    ShieldCheck,
    Rocket,
    Globe,
    MapPin
} from 'lucide-react'
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, Cell, CartesianGrid } from 'recharts'
import { InfoTooltip, TermWithInfo } from '@/components/ui/InfoTooltip'
import { getChartColor } from '@/lib/chart-colors'
import { RegionSelector } from '../RegionSelector'
import { INDUSTRIES, getIndustryData, Region, getResolvedData } from '@/lib/industry-database'

export function StrategiesTab({ analysis }: { analysis: any }) {
    const [region, setRegion] = useState<Region>('india')
    const industryData = useMemo(() => getResolvedData(analysis.industry), [analysis.industry])

    // Dynamic strategy generator based on industry and region
    const strategies = useMemo(() => {

        const isIndia = region === 'india'
        const baseStrategies = [
            {
                title: isIndia ? 'Domestic Expansion' : 'Global Market Penetration',
                impact: 'High',
                priority: 'Critical',
                description: isIndia
                    ? `Leverage specialized subcategories like ${Object.keys(industryData.subcategories).slice(0, 2).join(' and ')} for tier-2 city growth.`
                    : `Scale operations across high-growth regions focusing on ${industryData.name} innovation.`,
                icon: <Target className="h-5 w-5 text-primary" />
            },
            {
                title: 'Data-Driven Optimization',
                impact: 'Medium',
                priority: 'High',
                description: `Utilize verified data from ${industryData.dataSources[0].name} to optimize supply chain efficiency by 15-20%.`,
                icon: <Zap className="h-5 w-5 text-yellow-400" />
            },
            {
                title: isIndia ? 'Local Regulatory Compliance' : 'International Standards Alignment',
                impact: 'High',
                priority: 'Medium',
                description: isIndia
                    ? `Align with SEBI/RBI guidelines for ${industryData.name} sector stability.`
                    : `Adopt global ESG frameworks to attract institutional investment.`,
                icon: <ShieldCheck className="h-5 w-5 text-green-400" />
            }
        ]
        return baseStrategies
    }, [industryData, region])

    const kpiData = useMemo(() => {
        if (!industryData) return []
        const isIndia = region === 'india'
        return [
            { name: 'Customer Acquisition', value: isIndia ? 85 : 92, target: 100 },
            { name: 'Revenue per User', value: isIndia ? 65 : 78, target: 100 },
            { name: 'Market Share', value: isIndia ? 42 : 35, target: 50 },
            { name: 'Operating Margin', value: isIndia ? 28 : 22, target: 30 },
        ]
    }, [industryData, region])

    if (!industryData) return (
        <div className="flex items-center justify-center h-64 text-muted-foreground">
            No strategy data available for this industry.
        </div>
    )

    return (
        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
            {/* Header */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div>
                    <h2 className="text-2xl font-bold font-heading mb-1">Growth Strategies: {industryData.name}</h2>
                    <p className="text-sm text-muted-foreground">
                        Customized strategic roadmap for {region === 'india' ? 'Indian Market' : 'Global Markets'}
                    </p>
                </div>
                <RegionSelector region={region} onRegionChange={setRegion} />
            </div>

            {/* Strategic Cards Grid */}
            <div className="grid md:grid-cols-3 gap-6">
                {strategies.map((strategy, i) => (
                    <Card key={i} className="glass-card hover:border-primary/30 transition-all duration-300 group">
                        <CardHeader className="pb-2">
                            <div className="flex items-center justify-between mb-2">
                                <div className="p-2 rounded-lg bg-white/5 group-hover:bg-primary/10 transition-colors">
                                    {strategy.icon}
                                </div>
                                <Badge variant="outline" className={
                                    strategy.priority === 'Critical' ? 'text-red-400 border-red-400/20' :
                                        strategy.priority === 'High' ? 'text-yellow-400 border-yellow-400/20' :
                                            'text-green-400 border-green-400/20'
                                }>
                                    {strategy.priority}
                                </Badge>
                            </div>
                            <CardTitle className="text-lg">{strategy.title}</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <p className="text-sm text-muted-foreground leading-relaxed">
                                {strategy.description}
                            </p>
                            <div className="mt-4 flex items-center justify-between">
                                <span className="text-xs font-medium text-primary">Impact: {strategy.impact}</span>
                                <Button variant="ghost" size="sm" className="h-8 text-xs hover:text-primary p-0">
                                    Details <ArrowUpRight className="ml-1 h-3 w-3" />
                                </Button>
                            </div>
                        </CardContent>
                    </Card>
                ))}
            </div>

            {/* Performance KPIs & Trends */}
            <div className="grid lg:grid-cols-2 gap-6">
                <Card className="glass-card">
                    <CardHeader>
                        <CardTitle className="text-base font-medium flex items-center gap-2">
                            <BarChart3 className="h-4 w-4 text-primary" />
                            Performance KPIs ({region === 'india' ? 'India' : 'Global'})
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="h-[300px]">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={kpiData} layout="vertical" margin={{ left: 30 }}>
                                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" horizontal={false} />
                                <XAxis type="number" domain={[0, 100]} hide />
                                <YAxis
                                    dataKey="name"
                                    type="category"
                                    stroke="#666"
                                    fontSize={11}
                                    tickLine={false}
                                    axisLine={false}
                                    width={140}
                                />
                                <Tooltip
                                    cursor={{ fill: 'transparent' }}
                                    contentStyle={{ backgroundColor: '#1A1A1A', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px' }}
                                />
                                <Bar dataKey="value" radius={[0, 4, 4, 0]} barSize={20}>
                                    {kpiData.map((_, index) => (
                                        <Cell key={`cell-${index}`} fill={getChartColor(index)} />
                                    ))}
                                </Bar>
                            </BarChart>
                        </ResponsiveContainer>
                    </CardContent>
                </Card>

                <Card className="glass-card">
                    <CardHeader>
                        <CardTitle className="text-base font-medium flex items-center gap-2">
                            <Rocket className="h-4 w-4 text-primary" />
                            Growth Opportunities
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="space-y-4 text-sm">
                            <div className="flex items-start gap-4 p-4 rounded-xl bg-white/5 border border-white/10 hover:border-primary/20 transition-all cursor-default group">
                                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
                                    <TrendingUp className="h-5 w-5" />
                                </div>
                                <div className="space-y-1">
                                    <p className="font-semibold">{region === 'india' ? 'Tier 2/3 Expansion' : 'Cross-Continental Scaling'}</p>
                                    <p className="text-muted-foreground leading-normal">
                                        Significant untapped potential in emerging regions within the {industryData.name} sector.
                                        {region === 'india' ? ' Projecting 25% growth in rural markets.' : ' Focusing on APAC and EMEA regions.'}
                                    </p>
                                </div>
                            </div>

                            <div className="flex items-start gap-4 p-4 rounded-xl bg-white/5 border border-white/10 hover:border-primary/20 transition-all cursor-default group">
                                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-green-500/10 text-green-500">
                                    <Globe className="h-5 w-5" />
                                </div>
                                <div className="space-y-1">
                                    <p className="font-semibold">ESG Integration</p>
                                    <p className="text-muted-foreground leading-normal">
                                        Sustainability shifting from compliance to competitive advantage.
                                        Early adopters of green tech in {industryData.name} see 12% higher valuations.
                                    </p>
                                </div>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    )
}
