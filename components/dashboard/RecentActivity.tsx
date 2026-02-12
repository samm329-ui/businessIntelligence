'use client'

import { TrendingUp, TrendingDown, Newspaper, Calendar, ExternalLink } from 'lucide-react'

interface NewsItem {
    id: string
    title: string
    source: string
    sourceUrl: string
    date: string
    sentiment: 'positive' | 'negative' | 'neutral'
    category: string
}

interface RecentActivityProps {
    industry: string
    news: NewsItem[]
    className?: string
}

// Mock news generator based on industry
export function getIndustryNews(industry: string): NewsItem[] {
    const baseNews: Record<string, NewsItem[]> = {
        'Renewable Energy': [
            { id: '1', title: 'Solar capacity additions reach record 450GW globally in 2024', source: 'IEA', sourceUrl: 'https://www.iea.org', date: '2024-12-15', sentiment: 'positive', category: 'Market Growth' },
            { id: '2', title: 'Wind energy investments surge 35% in emerging markets', source: 'Bloomberg NEF', sourceUrl: 'https://about.bnef.com', date: '2024-12-10', sentiment: 'positive', category: 'Investment' },
            { id: '3', title: 'Battery storage costs decline 15% year-over-year', source: 'Reuters', sourceUrl: 'https://www.reuters.com', date: '2024-12-08', sentiment: 'positive', category: 'Technology' },
            { id: '4', title: 'Grid integration challenges slow offshore wind projects', source: 'Energy Monitor', sourceUrl: 'https://www.energymonitor.ai', date: '2024-12-05', sentiment: 'negative', category: 'Infrastructure' },
        ],
        'Technology': [
            { id: '1', title: 'AI chip demand drives semiconductor revenue to $600B', source: 'Gartner', sourceUrl: 'https://www.gartner.com', date: '2024-12-15', sentiment: 'positive', category: 'Semiconductors' },
            { id: '2', title: 'Cloud computing market grows 22% to reach $680B', source: 'IDC', sourceUrl: 'https://www.idc.com', date: '2024-12-12', sentiment: 'positive', category: 'Cloud' },
            { id: '3', title: 'Tech layoffs slow as hiring picks up in AI sector', source: 'TechCrunch', sourceUrl: 'https://techcrunch.com', date: '2024-12-10', sentiment: 'neutral', category: 'Employment' },
            { id: '4', title: 'Cybersecurity spending hits record amid rising threats', source: 'Forbes', sourceUrl: 'https://www.forbes.com', date: '2024-12-08', sentiment: 'positive', category: 'Security' },
        ],
        'FMCG': [
            { id: '1', title: 'Premium product segment grows 18% in urban markets', source: 'Nielsen', sourceUrl: 'https://www.nielsen.com', date: '2024-12-14', sentiment: 'positive', category: 'Retail' },
            { id: '2', title: 'E-commerce captures 25% of FMCG sales in metros', source: 'Euromonitor', sourceUrl: 'https://www.euromonitor.com', date: '2024-12-11', sentiment: 'positive', category: 'Digital' },
            { id: '3', title: 'Raw material costs stabilize after volatile quarter', source: 'Reuters', sourceUrl: 'https://www.reuters.com', date: '2024-12-09', sentiment: 'neutral', category: 'Supply Chain' },
            { id: '4', title: 'Sustainable packaging adoption reaches 40% industry-wide', source: 'Packaging World', sourceUrl: 'https://www.packworld.com', date: '2024-12-06', sentiment: 'positive', category: 'Sustainability' },
        ],
    }

    // Return industry-specific news or generic fallback
    return baseNews[industry] || [
        { id: '1', title: `${industry} sector shows steady growth in Q4 2024`, source: 'Reuters', sourceUrl: 'https://www.reuters.com', date: '2024-12-15', sentiment: 'positive', category: 'Market Trends' },
        { id: '2', title: `Investment inflows to ${industry} up 20% YoY`, source: 'Bloomberg', sourceUrl: 'https://www.bloomberg.com', date: '2024-12-12', sentiment: 'positive', category: 'Investment' },
        { id: '3', title: `Regulatory changes impact ${industry} operations`, source: 'Financial Times', sourceUrl: 'https://www.ft.com', date: '2024-12-10', sentiment: 'neutral', category: 'Regulation' },
        { id: '4', title: `New technologies disrupting ${industry} landscape`, source: 'McKinsey', sourceUrl: 'https://www.mckinsey.com', date: '2024-12-08', sentiment: 'positive', category: 'Innovation' },
    ]
}

export function RecentActivity({ industry, news, className = '' }: RecentActivityProps) {
    return (
        <div className={`glass-card rounded-xl p-5 ${className}`}>
            <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                    <Newspaper className="h-4 w-4 text-primary" />
                    <h3 className="text-sm font-semibold">Recent Activity: {industry}</h3>
                </div>
                <button className="text-xs text-muted-foreground hover:text-primary transition-colors">
                    View All
                </button>
            </div>

            <div className="space-y-3">
                {news.slice(0, 4).map((item) => (
                    <div
                        key={item.id}
                        className="flex items-start gap-3 p-3 rounded-lg bg-white/5 hover:bg-white/10 transition-colors group"
                    >
                        <div className={`p-1.5 rounded-md ${item.sentiment === 'positive' ? 'bg-green-500/20 text-green-400' :
                                item.sentiment === 'negative' ? 'bg-red-500/20 text-red-400' :
                                    'bg-gray-500/20 text-gray-400'
                            }`}>
                            {item.sentiment === 'positive' ? (
                                <TrendingUp className="h-3.5 w-3.5" />
                            ) : item.sentiment === 'negative' ? (
                                <TrendingDown className="h-3.5 w-3.5" />
                            ) : (
                                <Newspaper className="h-3.5 w-3.5" />
                            )}
                        </div>

                        <div className="flex-1 min-w-0">
                            <p className="text-xs font-medium line-clamp-2 group-hover:text-primary transition-colors">
                                {item.title}
                            </p>
                            <div className="flex items-center gap-2 mt-1.5">
                                <a
                                    href={item.sourceUrl}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="text-[10px] text-muted-foreground hover:text-primary flex items-center gap-0.5"
                                >
                                    {item.source}
                                    <ExternalLink className="h-2 w-2" />
                                </a>
                                <span className="text-[10px] text-muted-foreground/50">•</span>
                                <span className="text-[10px] text-muted-foreground flex items-center gap-1">
                                    <Calendar className="h-2 w-2" />
                                    {item.date}
                                </span>
                                <span className="text-[10px] text-muted-foreground/50">•</span>
                                <span className="text-[10px] px-1.5 py-0.5 rounded bg-white/5 text-muted-foreground">
                                    {item.category}
                                </span>
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    )
}
