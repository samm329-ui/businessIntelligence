// lib/analyzers/market-analyzer.ts
// Segregated service: Market Structure Analysis Only
// Responsibility: Calculate market share, concentration, lifecycle

export interface MarketSegment {
  name: string
  value: number // percentage
  growth: number
  margin: number
}

export interface MarketAnalysisResult {
  segments: MarketSegment[]
  concentrationRatio: number
  topPlayers: Array<{
    name: string
    share: number
    growth: number
  }>
  marketLifecycle: 'Early Growth' | 'Growth Stage' | 'Mature' | 'Declining'
  seasonality: string
  totalMarketRevenue: number
}

export class MarketAnalyzer {
  /**
   * Analyze market structure from competitor data
   * Single Responsibility: Calculate market metrics
   */
  analyze(competitors: Array<{
    companyName: string
    revenue: number
    growthRate: number
    ebitdaMargin: number
  }>): MarketAnalysisResult {
    
    if (competitors.length === 0) {
      return this.getFallbackAnalysis()
    }

    const totalRevenue = competitors.reduce((sum, c) => sum + (c.revenue || 0), 0)
    
    // Calculate market segments
    const segments = this.calculateMarketSegments(competitors, totalRevenue)
    
    // Calculate concentration (CR3 - top 3 concentration ratio)
    const top3Revenue = competitors.slice(0, 3).reduce((sum, c) => sum + (c.revenue || 0), 0)
    const concentrationRatio = totalRevenue > 0 
      ? Math.round((top3Revenue / totalRevenue) * 100)
      : 45

    // Determine lifecycle based on average growth
    const avgGrowth = competitors.reduce((s, c) => s + c.growthRate, 0) / competitors.length
    const marketLifecycle = this.determineLifecycle(avgGrowth)

    // Calculate top players with market share
    const topPlayers = competitors.slice(0, 5).map((c, i) => ({
      name: c.companyName,
      share: totalRevenue > 0 
        ? Math.round((c.revenue / totalRevenue) * 100)
        : (15 - (i * 2)),
      growth: c.growthRate
    }))

    return {
      segments,
      concentrationRatio,
      topPlayers,
      marketLifecycle,
      seasonality: 'Moderate',
      totalMarketRevenue: totalRevenue
    }
  }

  private calculateMarketSegments(
    competitors: Array<any>,
    totalRevenue: number
  ): MarketSegment[] {
    const top3Revenue = competitors.slice(0, 3).reduce((sum, c) => sum + (c.revenue || 0), 0)
    const midTierRevenue = competitors.slice(3, 10).reduce((sum, c) => sum + (c.revenue || 0), 0)
    const smallRevenue = competitors.slice(10).reduce((sum, c) => sum + (c.revenue || 0), 0)
    
    const top3Share = totalRevenue > 0 ? Math.round((top3Revenue / totalRevenue) * 100) : 45
    const midTierShare = totalRevenue > 0 ? Math.round((midTierRevenue / totalRevenue) * 100) : 30
    const smallShare = totalRevenue > 0 ? Math.round((smallRevenue / totalRevenue) * 100) : 15
    const restShare = Math.max(0, 100 - top3Share - midTierShare - smallShare)

    // Calculate average metrics per segment
    const top3 = competitors.slice(0, 3)
    const midTier = competitors.slice(3, 10)
    const small = competitors.slice(10)

    return [
      {
        name: 'Top 3 Players',
        value: top3Share,
        growth: this.calculateAvgGrowth(top3),
        margin: this.calculateAvgMargin(top3)
      },
      {
        name: 'Mid-tier Companies',
        value: midTierShare,
        growth: this.calculateAvgGrowth(midTier),
        margin: this.calculateAvgMargin(midTier)
      },
      {
        name: 'Small Players',
        value: smallShare,
        growth: this.calculateAvgGrowth(small),
        margin: this.calculateAvgMargin(small)
      },
      {
        name: 'New Entrants',
        value: restShare,
        growth: Math.round(this.calculateAvgGrowth(small) * 1.5),
        margin: Math.round(this.calculateAvgMargin(small) * 0.7)
      }
    ]
  }

  private calculateAvgGrowth(companies: Array<any>): number {
    if (companies.length === 0) return 0
    return Math.round(companies.reduce((s, c) => s + (c.growthRate || 0), 0) / companies.length)
  }

  private calculateAvgMargin(companies: Array<any>): number {
    if (companies.length === 0) return 0
    return Math.round(companies.reduce((s, c) => s + (c.ebitdaMargin || 0), 0) / companies.length)
  }

  private determineLifecycle(avgGrowth: number): MarketAnalysisResult['marketLifecycle'] {
    if (avgGrowth > 20) return 'Early Growth'
    if (avgGrowth > 10) return 'Growth Stage'
    if (avgGrowth > 5) return 'Mature'
    return 'Declining'
  }

  private getFallbackAnalysis(): MarketAnalysisResult {
    return {
      segments: [
        { name: 'Top 3 Players', value: 45, growth: 12, margin: 22 },
        { name: 'Mid-tier Companies', value: 30, growth: 15, margin: 18 },
        { name: 'Small Players', value: 15, growth: 20, margin: 12 },
        { name: 'New Entrants', value: 10, growth: 30, margin: 8 }
      ],
      concentrationRatio: 45,
      topPlayers: [],
      marketLifecycle: 'Growth Stage',
      seasonality: 'Moderate',
      totalMarketRevenue: 0
    }
  }
}

export const marketAnalyzer = new MarketAnalyzer()
export default marketAnalyzer
