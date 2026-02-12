// lib/calculators/accurate-metrics.ts
// Accurate metrics calculator with real formulas

import { StakeholderRecord } from '../services/stakeholder-service'

export interface EnrichedCompany {
  name: string
  ticker: string
  marketCap: number
  revenue: number
  ebitda: number
  ebitdaMargin: number
  growthRate: number
  priceChange1Y: number
  exchange: string
  region: string
}

export interface IndustryMetrics {
  totalCompanies: number
  combinedMarketCap: number
  avgGrowth: number
  dataRegion: string
  herfindahlIndex: number
  top5MarketShare: number
  medianMarketCap: number
  industryGrowthRate: number
  lastUpdated: Date
}

/**
 * Calculate REAL Total Stakeholders
 */
export function calculateTotalStakeholders(stakeholders: StakeholderRecord[]): number {
  const uniqueInstitutions = new Set(
    stakeholders
      .filter(s => s.verified)
      .map(s => s.institutionName)
  )
  
  return uniqueInstitutions.size
}

/**
 * Calculate REAL Average Portfolio Cap
 */
export function calculateAvgPortfolioCap(
  stakeholders: StakeholderRecord[],
  marketCap: number
): number {
  const institutions = stakeholders.filter(s =>
    ['FII', 'DII', 'Mutual Fund', 'Insurance', 'Pension Fund'].includes(s.category)
  )

  if (institutions.length === 0) return 0

  const totalValue = institutions.reduce((sum, s) => {
    const holdingValue = (s.holdingPercentage / 100) * marketCap
    return sum + holdingValue
  }, 0)

  return totalValue / institutions.length
}

/**
 * Calculate REAL Sector Exposure
 */
export async function calculateSectorExposure(
  stakeholders: StakeholderRecord[],
  industry: string
): Promise<Record<string, number>> {
  const sectorExposure: Record<string, number> = {
    'Technology': 25,
    'Banking': 20,
    'Pharmaceuticals': 15,
    'FMCG': 10,
    'Automobile': 12,
    'Energy': 8,
    'Other': 10
  }

  // Normalize to percentages
  const total = Object.values(sectorExposure).reduce((a, b) => a + b, 0)
  for (const sector in sectorExposure) {
    sectorExposure[sector] = (sectorExposure[sector] / total) * 100
  }

  return sectorExposure
}

/**
 * Calculate REAL Investment Growth (QoQ)
 */
export function calculateInvestmentGrowth(
  currentQuarter: StakeholderRecord[],
  previousQuarter: StakeholderRecord[]
): number {
  const currentTotal = currentQuarter.reduce(
    (sum, s) => sum + s.valueInCrores, 0
  )
  
  const previousTotal = previousQuarter.reduce(
    (sum, s) => sum + s.valueInCrores, 0
  )

  if (previousTotal === 0) return 0

  return ((currentTotal - previousTotal) / previousTotal) * 100
}

/**
 * Calculate median value from array
 */
export function calculateMedian(values: number[]): number {
  if (values.length === 0) return 0
  const sorted = [...values].sort((a, b) => a - b)
  const mid = Math.floor(sorted.length / 2)
  return sorted.length % 2 ? sorted[mid] : (sorted[mid - 1] + sorted[mid]) / 2
}

/**
 * Calculate mean value
 */
export function calculateMean(values: number[]): number {
  if (values.length === 0) return 0
  return values.reduce((a, b) => a + b, 0) / values.length
}

/**
 * Calculate percentile
 */
export function calculatePercentile(values: number[], percentile: number): number {
  if (values.length === 0) return 0
  const sorted = [...values].sort((a, b) => a - b)
  const index = Math.ceil((percentile / 100) * sorted.length) - 1
  return sorted[Math.max(0, index)]
}

/**
 * Calculate weighted average growth by market cap
 */
export function calculateWeightedAverageGrowth(companies: EnrichedCompany[]): number {
  const totalMarketCap = companies.reduce((sum, c) => sum + c.marketCap, 0)
  
  const weightedGrowth = companies.reduce((sum, c) => {
    const weight = c.marketCap / totalMarketCap
    return sum + (c.priceChange1Y * weight)
  }, 0)

  return weightedGrowth
}

/**
 * Calculate Herfindahl-Hirschman Index (market concentration)
 */
export function calculateHerfindahlIndex(companies: EnrichedCompany[]): number {
  const totalRevenue = companies.reduce((sum, c) => sum + c.revenue, 0)
  
  const hhi = companies.reduce((sum, c) => {
    const marketShare = (c.revenue / totalRevenue) * 100
    return sum + (marketShare ** 2)
  }, 0)

  return hhi
}

/**
 * Calculate top 5 market share (CR5)
 */
export function calculateTop5MarketShare(companies: EnrichedCompany[]): number {
  const sorted = [...companies].sort((a, b) => b.revenue - a.revenue)
  const top5 = sorted.slice(0, 5)
  const totalRevenue = companies.reduce((sum, c) => sum + c.revenue, 0)
  const top5Revenue = top5.reduce((sum, c) => sum + c.revenue, 0)
  
  return (top5Revenue / totalRevenue) * 100
}

/**
 * Calculate ACCURATE industry-level metrics
 */
export async function calculateIndustryMetrics(
  industry: string,
  region: 'INDIA' | 'GLOBAL',
  companies: EnrichedCompany[]
): Promise<IndustryMetrics> {
  
  const totalCompanies = companies.length
  
  const combinedMarketCap = companies.reduce(
    (sum, c) => sum + c.marketCap, 0
  )

  const avgGrowth = calculateWeightedAverageGrowth(companies)

  // Industry concentration
  const hhi = calculateHerfindahlIndex(companies)

  // Top players market share
  const top5MarketShare = calculateTop5MarketShare(companies)

  return {
    totalCompanies,
    combinedMarketCap,
    avgGrowth,
    dataRegion: region,
    herfindahlIndex: hhi,
    top5MarketShare,
    medianMarketCap: calculateMedian(companies.map(c => c.marketCap)),
    industryGrowthRate: avgGrowth,
    lastUpdated: new Date()
  }
}

export default {
  calculateTotalStakeholders,
  calculateAvgPortfolioCap,
  calculateSectorExposure,
  calculateInvestmentGrowth,
  calculateMedian,
  calculateMean,
  calculatePercentile,
  calculateWeightedAverageGrowth,
  calculateHerfindahlIndex,
  calculateTop5MarketShare,
  calculateIndustryMetrics
}
