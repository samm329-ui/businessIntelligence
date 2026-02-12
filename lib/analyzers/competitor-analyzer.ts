// lib/analyzers/competitor-analyzer.ts
// Segregated service: Competitor Analysis Only
// Responsibility: Map raw stock data to enriched competitor profiles

export interface CompetitorProfile {
  symbol: string
  companyName: string
  marketCap: number
  revenue: number
  ebitdaMargin: number
  growthRate: number
  strengths: string[]
  weaknesses: string[]
  website: string
}

export interface CompetitorAnalysisResult {
  competitors: CompetitorProfile[]
  totalCount: number
  avgMargin: number
  avgGrowth: number
  topPlayer: CompetitorProfile | null
}

export class CompetitorAnalyzer {
  /**
   * Analyze competitors from stock data
   * Single Responsibility: Transform raw data into competitor profiles
   */
  analyze(stockData: Array<{
    symbol: string
    companyName: string
    ebitdaMargin: number
    revenue: number
    marketCap: number
    year: number
    enhancedMetrics?: any
  }>): CompetitorAnalysisResult {
    
    if (stockData.length === 0) {
      return {
        competitors: [],
        totalCount: 0,
        avgMargin: 0,
        avgGrowth: 0,
        topPlayer: null
      }
    }

    // Map to competitor profiles
    const competitors = stockData.map((company) => {
      const enhancedMetrics = company.enhancedMetrics || {}
      const revenueGrowth = enhancedMetrics.revenueGrowth || 0
      const growthRate = revenueGrowth !== 0 
        ? revenueGrowth 
        : (company.ebitdaMargin > 15 ? 12 : 8)
      
      return {
        symbol: company.symbol,
        companyName: company.companyName,
        marketCap: company.marketCap,
        revenue: company.revenue,
        ebitdaMargin: company.ebitdaMargin,
        growthRate,
        strengths: this.extractStrengths(company),
        weaknesses: this.extractWeaknesses(company),
        website: this.generateWebsiteUrl(company.symbol)
      }
    }).sort((a, b) => b.marketCap - a.marketCap)

    // Calculate aggregates
    const avgMargin = competitors.reduce((s, c) => s + c.ebitdaMargin, 0) / competitors.length
    const avgGrowth = competitors.reduce((s, c) => s + c.growthRate, 0) / competitors.length

    return {
      competitors,
      totalCount: competitors.length,
      avgMargin,
      avgGrowth,
      topPlayer: competitors[0] || null
    }
  }

  private extractStrengths(company: any): string[] {
    const strengths: string[] = []
    
    if (company.ebitdaMargin > 20) strengths.push('Strong profitability margins')
    if (company.marketCap > 100000) strengths.push('Large-cap stability')
    if (company.revenue > 50000) strengths.push('Significant revenue base')
    if (strengths.length === 0) strengths.push('Established market presence')
    strengths.push('Listed on recognized exchange')
    
    return strengths
  }

  private extractWeaknesses(company: any): string[] {
    const weaknesses: string[] = []
    
    if (company.ebitdaMargin < 10) weaknesses.push('Thin profit margins')
    if (company.marketCap < 10000) weaknesses.push('Small market capitalization')
    weaknesses.push('Competitive market pressure')
    weaknesses.push('Regulatory compliance costs')
    
    return weaknesses
  }

  private generateWebsiteUrl(symbol: string): string {
    return symbol.endsWith('.NS') || !symbol.includes('.')
      ? `https://www.nseindia.com/get-quotes/equity?symbol=${symbol.replace('.NS', '')}`
      : `https://finance.yahoo.com/quote/${symbol}`
  }
}

export const competitorAnalyzer = new CompetitorAnalyzer()
export default competitorAnalyzer
