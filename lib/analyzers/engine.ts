import { runRuleBasedAnalysis } from './rules'
import { runAIAnalysis } from './ai'

export interface CompleteAnalysis {
  industry: string
  verdict: {
    rating: string
    confidence: string
    reasoning: string
  }
  marketSize: {
    value: { min: number; max: number; median: number }
    unit: string
    year: number
    currency: string
    confidence: string
    sources: Array<{ name: string; url: string; reliability: number }>
    methodology: string
    freshness: string
  }
  profitability: {
    ebitdaRange: { min: number; max: number; median: number }
    sampleSize: number
    companyTypes: string
    confidence: string
    note: string
  }
  growth: {
    trend: string
    drivers: string[]
    risks: string[]
  }
  competition: {
    level: string
    barriers: Record<string, string>
  }
  keyInsights: string[]
  dataQuality: {
    overallConfidence: string
    sourceCount: number
    crossValidated: boolean
    gaps: string[]
  }
  marketAnalysis: {
    marketShare: Array<{ name: string; value: number; growth: number; margin: number }>
    concentrationRatio: number
    topPlayers: Array<{ name: string; share: number; growth: number }>
    marketLifecycle: string
    seasonality: string
  }
  capital: {
    initialInvestment: { min: number; max: number; unit: string }
    breakEvenPeriod: { min: number; max: number; unit: string }
    roiProjection: { min: number; max: number; unit: string }
    fundingOptions: Array<{ type: string; description: string }>
    capitalIntensity: string
  }
  risk: {
    overallRiskScore: number
    keyRisks: Array<{ type: string; severity: string; description: string; mitigation: string }>
    positiveFactors: Array<{ type: string; impact: string; description: string }>
    heatMap: Array<{ dimension: string; score: number; label: string }>
  }
  marketingStrategy: {
    disruptiveStrategies: Array<{ name: string; description: string; expectedImpact: string; investment: string }>
    digitalChannels: Array<{ channel: string; effectiveness: string; cost: string }>
    traditionalChannels: Array<{ channel: string; effectiveness: string; cost: string }>
    competitiveAdvantages: string[]
    goToMarket: string[]
  }
  competitors: Array<{
    symbol: string
    companyName: string
    marketCap: number
    revenue: number
    ebitdaMargin: number
    growthRate: number
    strengths: string[]
    weaknesses: string[]
    website: string
  }>
}

/**
 * Run complete analysis pipeline
 */
export async function runCompleteAnalysis(
  industry: string,
  marketSizeData: Array<{ value: number; unit: string; year: number; confidence: number; source: string; url: string }>,
  stockData: Array<{ symbol: string; companyName: string; ebitdaMargin: number; revenue: number; marketCap: number; year: number }>,
  companyContext?: any
): Promise<CompleteAnalysis> {

  // Run rule-based analysis
  const ruleBasedResults = runRuleBasedAnalysis(
    marketSizeData.map(d => ({ value: d.value, confidence: d.confidence })),
    stockData
  )

  // Run AI analysis
  const aiResults = await runAIAnalysis(industry, marketSizeData, stockData, companyContext)

  // Build data quality assessment
  const gaps: string[] = []

  if (marketSizeData.length === 0) {
    gaps.push('No government or market size data available - APIs may be unavailable or require authentication')
  }

  if (stockData.length === 0) {
    gaps.push('No stock market data available - NSE/BSE APIs may be rate-limited or require API keys')
  }

  if (marketSizeData.length === 1) {
    gaps.push('Limited market size data - only one source available')
  }

  // Determine overall confidence
  let overallConfidence = 'LOW'
  if (marketSizeData.length >= 2 && stockData.length >= 5) overallConfidence = 'HIGH'
  else if (marketSizeData.length >= 1 || stockData.length >= 3) overallConfidence = 'MEDIUM'

  const competitors = stockData.map((company: any, index: number) => {
    const enhancedMetrics = (company as any).enhancedMetrics || {}
    const revenueGrowth = enhancedMetrics.revenueGrowth || 0
    const growthRate = revenueGrowth !== 0 ? revenueGrowth : (company.ebitdaMargin > 15 ? 12 : 8)
    
    const strengths: string[] = []
    if (company.ebitdaMargin > 20) strengths.push('Strong profitability margins')
    if (company.marketCap > 100000) strengths.push('Large-cap stability')
    if (company.revenue > 50000) strengths.push('Significant revenue base')
    if (strengths.length === 0) strengths.push('Established market presence')
    strengths.push('Listed on recognized exchange')

    const weaknesses: string[] = []
    if (company.ebitdaMargin < 10) weaknesses.push('Thin profit margins')
    if (company.marketCap < 10000) weaknesses.push('Small market capitalization')
    weaknesses.push('Competitive market pressure')
    weaknesses.push('Regulatory compliance costs')

    return {
      symbol: company.symbol,
      companyName: company.companyName,
      marketCap: company.marketCap,
      revenue: company.revenue,
      ebitdaMargin: company.ebitdaMargin,
      growthRate,
      strengths,
      weaknesses,
      website: company.symbol.endsWith('.NS') || !company.symbol.includes('.')
        ? `https://www.nseindia.com/get-quotes/equity?symbol=${company.symbol.replace('.NS', '')}`
        : `https://finance.yahoo.com/quote/${company.symbol}`
    }
  }).sort((a, b) => b.marketCap - a.marketCap)

  const totalRevenue = competitors.reduce((sum, c) => sum + (c.revenue || 0), 0)
  const top3Revenue = competitors.slice(0, 3).reduce((sum, c) => sum + (c.revenue || 0), 0)
  const midTierRevenue = competitors.slice(3, 10).reduce((sum, c) => sum + (c.revenue || 0), 0)
  const smallRevenue = competitors.slice(10).reduce((sum, c) => sum + (c.revenue || 0), 0)
  const top3Share = totalRevenue > 0 ? Math.round((top3Revenue / totalRevenue) * 100) : 45
  const midTierShare = totalRevenue > 0 ? Math.round((midTierRevenue / totalRevenue) * 100) : 30
  const smallShare = totalRevenue > 0 ? Math.round((smallRevenue / totalRevenue) * 100) : 15
  const restShare = Math.max(0, 100 - top3Share - midTierShare - smallShare)

  const top3Margins = competitors.slice(0, 3)
  const avgTop3Margin = top3Margins.length > 0 ? Math.round(top3Margins.reduce((s, c) => s + c.ebitdaMargin, 0) / top3Margins.length) : 22
  const midTierCompanies = competitors.slice(3, 10)
  const avgMidMargin = midTierCompanies.length > 0 ? Math.round(midTierCompanies.reduce((s, c) => s + c.ebitdaMargin, 0) / midTierCompanies.length) : 18
  const smallCompanies = competitors.slice(10)
  const avgSmallMargin = smallCompanies.length > 0 ? Math.round(smallCompanies.reduce((s, c) => s + c.ebitdaMargin, 0) / smallCompanies.length) : 12

  const avgTop3Growth = top3Margins.length > 0 ? Math.round(top3Margins.reduce((s, c) => s + c.growthRate, 0) / top3Margins.length) : 12
  const avgMidGrowth = midTierCompanies.length > 0 ? Math.round(midTierCompanies.reduce((s, c) => s + c.growthRate, 0) / midTierCompanies.length) : 15
  const avgSmallGrowth = smallCompanies.length > 0 ? Math.round(smallCompanies.reduce((s, c) => s + c.growthRate, 0) / smallCompanies.length) : 20

  const marketShareData = [
    { name: 'Top 3 Players', value: top3Share, growth: avgTop3Growth, margin: avgTop3Margin },
    { name: 'Mid-tier Companies', value: midTierShare, growth: avgMidGrowth, margin: avgMidMargin },
    { name: 'Small Players', value: smallShare, growth: avgSmallGrowth, margin: avgSmallMargin },
    { name: 'New Entrants', value: restShare, growth: Math.round(avgSmallGrowth * 1.5), margin: Math.round(avgSmallMargin * 0.7) }
  ]

  const competitorCount = competitors.length
  const avgMargin = competitors.length > 0 ? competitors.reduce((s, c) => s + c.ebitdaMargin, 0) / competitors.length : 15
  const avgGrowth = competitors.length > 0 ? competitors.reduce((s, c) => s + c.growthRate, 0) / competitors.length : 10

  const competitionScore = Math.min(95, 30 + competitorCount * 3)
  const marketRisk = avgGrowth > 15 ? 40 : avgGrowth > 5 ? 55 : 70
  const financialRisk = avgMargin > 20 ? 35 : avgMargin > 10 ? 50 : 70
  const riskLabel = (score: number) => score >= 70 ? 'High' : score >= 50 ? 'Moderate' : score >= 30 ? 'Low-Moderate' : 'Low'

  const riskHeatMap = [
    { dimension: 'Market Risk', score: marketRisk, label: riskLabel(marketRisk) },
    { dimension: 'Competition Risk', score: competitionScore, label: riskLabel(competitionScore) },
    { dimension: 'Regulatory Risk', score: 45, label: 'Low-Moderate' },
    { dimension: 'Technology Risk', score: Math.round(55 + (competitorCount > 15 ? 10 : 0)), label: riskLabel(55 + (competitorCount > 15 ? 10 : 0)) },
    { dimension: 'Financial Risk', score: financialRisk, label: riskLabel(financialRisk) },
    { dimension: 'Operational Risk', score: Math.round(40 + (avgMargin < 10 ? 15 : 0)), label: riskLabel(40 + (avgMargin < 10 ? 15 : 0)) },
    { dimension: 'Supply Chain Risk', score: 55, label: 'Moderate' },
    { dimension: 'Talent Risk', score: competitorCount > 20 ? 65 : 50, label: riskLabel(competitorCount > 20 ? 65 : 50) }
  ]

  // Generate capital requirements
  const medianMarketSize = ruleBasedResults.marketSize.median || 50000
  const capitalMultiplier = medianMarketSize > 100000 ? 0.02 : medianMarketSize > 50000 ? 0.03 : 0.05

  // Generate disruptive marketing strategies
  const marketingStrategies = {
    disruptiveStrategies: [
      {
        name: 'AI-Powered Personalization',
        description: 'Leverage AI to offer hyper-personalized products/services at scale, creating superior customer experience',
        expectedImpact: '35% increase in customer retention',
        investment: '₹2-5 Cr'
      },
      {
        name: 'Subscription-Based Model',
        description: 'Convert one-time purchases into recurring revenue through subscription services',
        expectedImpact: '3x increase in customer lifetime value',
        investment: '₹1-3 Cr'
      },
      {
        name: 'Direct-to-Consumer (DTC)',
        description: 'Bypass traditional distribution channels to sell directly to consumers, capturing higher margins',
        expectedImpact: '25-40% margin improvement',
        investment: '₹3-7 Cr'
      },
      {
        name: 'Community-Driven Growth',
        description: 'Build engaged communities around your brand for organic growth and word-of-mouth marketing',
        expectedImpact: '50% reduction in CAC',
        investment: '₹50L - 1.5 Cr'
      },
      {
        name: 'Freemium with Upsell',
        description: 'Offer free basic services to acquire users, then upsell premium features',
        expectedImpact: '5-10% conversion to paid',
        investment: '₹1-2 Cr'
      }
    ],
    digitalChannels: [
      { channel: 'Social Media Advertising', effectiveness: 'High', cost: '₹50L-2Cr/year' },
      { channel: 'Influencer Marketing', effectiveness: 'Very High', cost: '₹25L-1Cr/year' },
      { channel: 'Content Marketing/SEO', effectiveness: 'High', cost: '₹20L-75L/year' },
      { channel: 'Performance Marketing', effectiveness: 'Very High', cost: '₹1-3Cr/year' },
      { channel: 'Email Marketing', effectiveness: 'High', cost: '₹5-15L/year' }
    ],
    traditionalChannels: [
      { channel: 'Television Advertising', effectiveness: 'Medium', cost: '₹5-20Cr' },
      { channel: 'Print Advertising', effectiveness: 'Low', cost: '₹50L-2Cr' },
      { channel: 'Outdoor Advertising', effectiveness: 'Medium', cost: '₹1-5Cr' },
      { channel: 'Events & Sponsorships', effectiveness: 'High', cost: '₹1-3Cr' },
      { channel: 'Retail Partnerships', effectiveness: 'High', cost: '₹50L-2Cr' }
    ],
    competitiveAdvantages: [
      'Superior customer experience',
      'Innovation-driven product portfolio',
      'Strong distribution network',
      'Cost leadership through efficiency',
      'Brand differentiation',
      'Technology-first approach'
    ],
    goToMarket: [
      'Phase 1: Digital-first launch with social media buzz',
      'Phase 2: Influencer partnerships for credibility',
      'Phase 3: Performance marketing for scale',
      'Phase 4: Community building for retention',
      'Phase 5: Expand to traditional channels based on data'
    ]
  }

  // Combine results
  return {
    industry,
    verdict: {
      rating: aiResults.verdict,
      confidence: aiResults.confidence,
      reasoning: aiResults.reasoning
    },
    marketSize: {
      value: {
        min: ruleBasedResults.marketSize.min,
        max: ruleBasedResults.marketSize.max,
        median: ruleBasedResults.marketSize.median
      },
      unit: 'crore_inr',
      year: new Date().getFullYear(),
      currency: 'INR',
      confidence: ruleBasedResults.marketSize.confidence,
      sources: marketSizeData.map(d => ({
        name: d.source,
        url: d.url,
        reliability: d.confidence
      })),
      methodology: 'Aggregated from RBI Database, data.gov.in, MOSPI, and industry reports',
      freshness: `${new Date().getFullYear()} data (Real-time APIs)`
    },
    profitability: {
      ebitdaRange: ruleBasedResults.profitability.ebitdaRange,
      sampleSize: ruleBasedResults.profitability.sampleSize,
      companyTypes: 'Listed companies on NSE/BSE',
      confidence: ruleBasedResults.profitability.confidence,
      note: ruleBasedResults.profitability.note
    },
    growth: ruleBasedResults.growth,
    competition: ruleBasedResults.competition,
    keyInsights: aiResults.keyInsights,
    dataQuality: {
      overallConfidence,
      sourceCount: marketSizeData.length + stockData.length,
      crossValidated: marketSizeData.length > 1,
      gaps
    },
    marketAnalysis: {
      marketShare: marketShareData,
      concentrationRatio: top3Share,
      topPlayers: competitors.slice(0, 5).map((c, i) => {
        const share = totalRevenue > 0 ? Math.round((c.revenue / totalRevenue) * 100) : (15 - (i * 2))
        return {
          name: c.companyName,
          share,
          growth: c.growthRate
        }
      }),
      marketLifecycle: avgGrowth > 20 ? 'Early Growth' : avgGrowth > 10 ? 'Growth Stage' : avgGrowth > 5 ? 'Mature' : 'Declining',
      seasonality: 'Moderate'
    },
    capital: {
      initialInvestment: {
        min: Math.round(medianMarketSize * capitalMultiplier * 0.5),
        max: Math.round(medianMarketSize * capitalMultiplier * 1.5),
        unit: 'Crore INR'
      },
      breakEvenPeriod: {
        min: 18,
        max: 36,
        unit: 'months'
      },
      roiProjection: {
        min: 15,
        max: 35,
        unit: '% annually'
      },
      fundingOptions: [
        { type: 'Bootstrapping', description: 'Self-funding with retained earnings' },
        { type: 'Angel/Seed Funding', description: 'Early-stage investors for initial setup' },
        { type: 'Venture Capital', description: 'Series A/B for scaling operations' },
        { type: 'Bank Loans', description: 'Traditional financing with collateral' },
        { type: 'Government Schemes', description: 'MSME subsidies and tax benefits' }
      ],
      capitalIntensity: 'Medium'
    },
    risk: {
      overallRiskScore: Math.round(riskHeatMap.reduce((s, r) => s + r.score, 0) / riskHeatMap.length),
      keyRisks: [
        { type: 'Competition', severity: 'High', description: 'Intense competition from established players', mitigation: 'Focus on niche segments and differentiation' },
        { type: 'Regulatory', severity: 'Medium', description: 'Changing compliance requirements', mitigation: 'Dedicated legal team and compliance framework' },
        { type: 'Technology', severity: 'Medium', description: 'Rapid technology obsolescence', mitigation: 'Continuous R&D investment and partnerships' },
        { type: 'Market', severity: 'Medium', description: 'Economic downturn impact on spending', mitigation: 'Diversified product portfolio' },
        { type: 'Talent', severity: 'Low-Medium', description: 'Difficulty in hiring skilled workforce', mitigation: 'Competitive compensation and culture' }
      ],
      positiveFactors: [
        { type: 'Growing Demand', impact: 'High', description: 'Increasing consumer adoption and market expansion' },
        { type: 'Digital Transformation', impact: 'High', description: 'Technology enabling new business models' },
        { type: 'Government Support', impact: 'Medium', description: 'Favorable policies and subsidies for the sector' },
        { type: 'Export Potential', impact: 'Medium', description: 'Growing international market opportunities' },
        { type: 'Innovation Ecosystem', impact: 'Medium', description: 'Access to startups and technology partners' }
      ],
      heatMap: riskHeatMap
    },
    marketingStrategy: marketingStrategies,
    competitors
  }
}
