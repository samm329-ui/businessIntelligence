// lib/integration/analysis-adapter.ts
// DEPRECATED: This file is for backward compatibility only.
// Use lib/intelligence/orchestrator.ts for new implementations.
//
// Adapter to bridge main-orchestrator with existing analysis engine
// Maintains backward compatibility while using new architecture

export const DEPRECATED = true;
console.warn('[DEPRECATED] analysis-adapter.ts is deprecated. Use lib/intelligence/orchestrator.ts');

import { mainOrchestrator, AnalysisRequest, AnalysisResponse } from './main-orchestrator'
import { runCompleteAnalysis, CompleteAnalysis } from '../analyzers/engine'
import { multiSourceOrchestrator } from '../data/multi-source-orchestrator'
import { entityResolver } from '../resolution/entity-resolver'
import { lookupBrand } from '../resolution/brand-knowledge-base'
import { fetchGovernmentMarketSize } from '../fetchers/government'
import { normalizeIndustry } from '../fetchers/industryMappings'
import { resolveCompanyIdentity } from '../resolvers/company-resolver'
import { competitorIntelligence } from '../services/competitor-intelligence'
import { IndustryKPICalculator } from '../calculators/industry-kpi-calculator'
import { supabase } from '../db'

export interface FetchedData {
  marketSize: Array<{
    value: number
    unit: string
    year: number
    confidence: number
    source: string
    url: string
    isEstimated?: boolean
  }>
  stockData: Array<{
    symbol: string
    companyName: string
    ebitdaMargin: number
    revenue: number
    marketCap: number
    year: number
    source: string
    enhancedMetrics?: any
  }>
  resolvedCompany?: any
  sourcesAttempted: number
  sourcesSuccessful: number
  industryName: string
  mappingConfidence: number
  dataFreshness: { year: number; quarter: string }
  competitors?: any[]
  stakeholderMetrics?: any
  sectorMetrics?: any
  validationStatus?: any
}

/**
 * Fetch data using new architecture but return in legacy format
 * This maintains compatibility with existing runCompleteAnalysis
 */
export async function fetchAllData(
  rawInput: string,
  preferredRegion: 'india' | 'global' = 'india'
): Promise<FetchedData> {
  const startTime = Date.now()
  
  console.log(`\n🔍 Analysis Request: "${rawInput}" [${preferredRegion.toUpperCase()}]`)
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n')

  // Step 1: Entity Resolution
  const resolvedEntity = await entityResolver.resolve(rawInput, {
    preferredRegion,
    queryType: 'overview'
  })

  // Step 2: Determine Industry
  // For brands, use their sector from knowledge base; for industries, normalize the name
  let industry: string
  let sector: string
  
  if (resolvedEntity.entityType === 'brand' && resolvedEntity.parentCompany) {
    // Brand detected - map to appropriate industry based on brand category
    const brandMapping = lookupBrand(rawInput)
    if (brandMapping) {
      // Map product category to industry
      const categoryToIndustry: Record<string, string> = {
        'FMCG': 'FMCG',
        'Food': 'Food Processing',
        'Beverages': 'Beverages',
        'Personal Care': 'Personal Care',
        'Home Care': 'Home Care',
        'Oral Care': 'Personal Care',
        'Hair Care': 'Personal Care',
        'Skincare': 'Personal Care',
        'Soap': 'Personal Care',
        'Detergent': 'Home Care',
        'Laundry': 'Home Care',
        'Dishwash': 'Home Care',
        'Coffee': 'Beverages',
        'Tea': 'Beverages',
        'Juice': 'Beverages',
        'Chocolate': 'Food Processing',
        'Biscuits': 'Food Processing',
        'Instant Noodles': 'Food Processing',
        'Atta': 'Food Processing',
        'Dairy': 'Dairy',
        'Healthcare': 'Pharma',
        'Ayurveda': 'Pharma'
      }
      
      industry = categoryToIndustry[brandMapping.productCategory] || 
                categoryToIndustry[brandMapping.industry] || 
                'FMCG'
      sector = brandMapping.sector
      console.log(`✓ Brand "${resolvedEntity.name}" mapped to industry: ${industry} (sector: ${sector})`)
    } else {
      // Fallback to normalization
      const mapping = normalizeIndustry(resolvedEntity.name || rawInput)
      industry = mapping.normalized
      sector = mapping.sector || 'Unknown'
    }
  } else {
    // For industries/companies, normalize the name
    const mapping = normalizeIndustry(resolvedEntity.name || rawInput)
    industry = mapping.normalized
    sector = mapping.sector || 'Unknown'
  }

  console.log(`✓ Entity: ${resolvedEntity.name || industry} (${resolvedEntity.entityType})`)
  console.log(`✓ Confidence: ${(resolvedEntity.confidence * 100).toFixed(1)}%`)

  const results: FetchedData = {
    marketSize: [],
    stockData: [],
    resolvedCompany: resolvedEntity.entityType === 'company' ? {
      name: resolvedEntity.name,
      ticker: resolvedEntity.parentCompany?.ticker,
      sector: sector
    } : undefined,
    sourcesAttempted: 0,
    sourcesSuccessful: 0,
    industryName: industry,
    mappingConfidence: resolvedEntity.confidence,
    dataFreshness: { year: new Date().getFullYear(), quarter: 'Q4' }
  }

  // Step 3: Fetch Market Size Data (Government Sources)
  results.sourcesAttempted++
  try {
    const govData = await fetchGovernmentMarketSize(industry)
    if (govData.length > 0) {
      results.marketSize.push(...govData)
      results.sourcesSuccessful++
      console.log(`✓ Market Size: ${govData.length} government source(s)`)
    }
  } catch (error) {
    console.warn('⚠ Market data fetch failed:', error)
  }

  // Step 4: Fetch Stock Data (Multi-Source)
  results.sourcesAttempted++
  try {
    if (resolvedEntity.entityType === 'company' && resolvedEntity.parentCompany?.ticker) {
      // Single company query - fetch detailed data
      const ticker = resolvedEntity.parentCompany.ticker
      const multiSourceData = await multiSourceOrchestrator.fetchWithValidation(
        ticker,
        ['marketCap', 'revenue', 'ebitda', 'pe'],
        preferredRegion
      )

      if (multiSourceData.confidence > 50) {
        results.stockData.push({
          symbol: ticker,
          companyName: resolvedEntity.name,
          ebitdaMargin: multiSourceData.validations.find(v => v.field === 'ebitda')?.consensus || 15,
          revenue: multiSourceData.validations.find(v => v.field === 'revenue')?.consensus || 0,
          marketCap: multiSourceData.consensusValue || 0,
          year: new Date().getFullYear(),
          source: multiSourceData.sources.map(s => s.source).join(', '),
          enhancedMetrics: {
            pe: multiSourceData.validations.find(v => v.field === 'pe')?.consensus || 0,
            confidence: multiSourceData.confidence
          }
        })
        results.sourcesSuccessful++
        console.log(`✓ Company Data: ${ticker} (confidence: ${multiSourceData.confidence.toFixed(1)}%)`)
      }
    }

    // Step 5: Fetch Competitors
    try {
      console.log(`🔍 Fetching competitors for ${industry}...`)
      const competitors = await competitorIntelligence.fetchCompetitors({
        industry,
        region: preferredRegion === 'india' ? 'INDIA' : 'GLOBAL',
        limit: 20,
        sortBy: 'marketCap',
        includePrivate: false
      })

      // Add competitors to stockData
      for (const comp of competitors.slice(0, 15)) {
        if (!results.stockData.find(s => s.symbol === comp.ticker)) {
          results.stockData.push({
            symbol: comp.ticker || 'N/A',
            companyName: comp.name,
            ebitdaMargin: comp.ebitdaMargin || 15,
            revenue: comp.revenue || 0,
            marketCap: comp.marketCap || 0,
            year: new Date().getFullYear(),
            source: 'Competitor Intelligence'
          })
        }
      }

      results.competitors = competitors
      console.log(`✓ Competitors: ${competitors.length} companies`)
    } catch (error) {
      console.warn('⚠ Competitor fetch failed:', error)
    }

  } catch (error) {
    console.warn('⚠ Stock data fetch failed:', error)
  }

  // Step 6: Calculate Industry KPIs (using first company if available)
  try {
    if (results.stockData.length > 0) {
      const kpiCalc = new IndustryKPICalculator()
      const firstCompany = results.stockData[0]
      
      // Create minimal company profile and financials
      const companyProfile = {
        name: firstCompany.companyName,
        ticker: firstCompany.symbol,
        marketCap: firstCompany.marketCap,
        revenue: firstCompany.revenue,
        ebitda: firstCompany.revenue * (firstCompany.ebitdaMargin / 100),
        netIncome: firstCompany.revenue * 0.1, // Estimate
        totalAssets: firstCompany.marketCap * 0.5, // Estimate
        shareholderEquity: firstCompany.marketCap * 0.4, // Estimate
        totalDebt: firstCompany.marketCap * 0.2, // Estimate
        currentAssets: firstCompany.marketCap * 0.15, // Estimate
        currentLiabilities: firstCompany.marketCap * 0.1, // Estimate
        inventory: 0,
        receivables: firstCompany.revenue * 0.1, // Estimate
        cash: firstCompany.marketCap * 0.05, // Estimate
        cogs: firstCompany.revenue * 0.6, // Estimate
        operatingIncome: firstCompany.revenue * (firstCompany.ebitdaMargin / 100) * 0.9 // Estimate
      }
      
      const financials = {
        ...companyProfile,
        revenueLastYear: companyProfile.revenue * 0.95, // Estimate 5% growth
        avgTotalAssets: companyProfile.totalAssets,
        avgInventory: companyProfile.inventory,
        avgReceivables: companyProfile.receivables,
        interestExpense: companyProfile.totalDebt * 0.05, // Estimate 5% interest
        taxRate: 0.25,
        bookValue: companyProfile.shareholderEquity,
        stockPrice: companyProfile.marketCap / 100, // Estimate
        annualDividend: 0,
        operatingCashFlow: companyProfile.netIncome * 1.2, // Estimate
        capitalExpenditures: companyProfile.revenue * 0.05, // Estimate
        eps: companyProfile.netIncome / 100, // Estimate
        epsLastYear: companyProfile.netIncome * 0.95 / 100 // Estimate
      }
      
      const kpis = kpiCalc.calculateKPIs(companyProfile, financials, industry)
      results.sectorMetrics = {
        ...kpis,
        dataQuality: results.stockData.length >= 10 ? 'HIGH' : results.stockData.length >= 5 ? 'MEDIUM' : 'LOW'
      }
      console.log(`✓ KPIs: ${Object.keys(kpis).length} metrics calculated`)
    }
  } catch (error) {
    console.warn('⚠ KPI calculation failed:', error)
  }

  const duration = Date.now() - startTime
  console.log(`\n✓ Analysis complete in ${duration}ms`)
  console.log(`  Sources: ${results.sourcesSuccessful}/${results.sourcesAttempted} successful`)
  console.log(`  Companies: ${results.stockData.length}`)
  console.log(`  Market Data: ${results.marketSize.length} points`)
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n')

  return results
}

/**
 * Run complete analysis with new architecture
 * Maintains backward compatibility with existing frontend
 */
export async function runCompleteAnalysisWithNewArchitecture(
  industry: string,
  fetchedData: FetchedData
): Promise<CompleteAnalysis> {
  // Use existing analysis engine with fetched data
  return runCompleteAnalysis(
    industry,
    fetchedData.marketSize,
    fetchedData.stockData,
    fetchedData.resolvedCompany
  )
}

/**
 * Direct analysis using main orchestrator (for future use)
 */
export async function analyzeWithMainOrchestrator(
  query: string,
  region: 'india' | 'global' = 'india'
): Promise<AnalysisResponse> {
  return mainOrchestrator.analyze({
    query,
    region,
    analysisType: 'overview'
  })
}

export default fetchAllData
