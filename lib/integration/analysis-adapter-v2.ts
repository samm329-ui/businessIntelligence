// lib/integration/analysis-adapter-v2.ts
// DEBUG VERSION - Shows exactly what's happening step by step

import { runCompleteAnalysis, CompleteAnalysis } from '../analyzers/engine'
import { entityResolver } from '../resolution/entity-resolver'
import { lookupBrand } from '../resolution/brand-knowledge-base'
import { competitorIntelligence } from '../services/competitor-intelligence'
import { IndustryKPICalculator } from '../calculators/industry-kpi-calculator'

export interface FetchedData {
  marketSize: Array<{
    value: number
    unit: string
    year: number
    confidence: number
    source: string
    url: string
  }>
  stockData: Array<{
    symbol: string
    companyName: string
    ebitdaMargin: number
    revenue: number
    marketCap: number
    year: number
    source: string
  }>
  resolvedCompany?: any
  sourcesAttempted: number
  sourcesSuccessful: number
  industryName: string
  mappingConfidence: number
  dataFreshness: { year: number; quarter: string }
  competitors?: any[]
}

/**
 * STEP 1: Resolve what the user searched for
 */
async function resolveEntity(rawInput: string) {
  console.log('\n🔍 STEP 1: ENTITY RESOLUTION')
  console.log(`   Input: "${rawInput}"`)
  
  const resolved = await entityResolver.resolve(rawInput, {
    preferredRegion: 'india',
    queryType: 'overview'
  })
  
  console.log(`   ✓ Resolved to: ${resolved.name}`)
  console.log(`   ✓ Type: ${resolved.entityType}`)
  console.log(`   ✓ Parent Company: ${resolved.parentCompany?.name || 'None'}`)
  console.log(`   ✓ Ticker: ${resolved.parentCompany?.ticker || 'None'}`)
  console.log(`   ✓ Confidence: ${(resolved.confidence * 100).toFixed(1)}%`)
  
  return resolved
}

/**
 * STEP 2: Determine Industry from Entity
 */
function determineIndustry(resolvedEntity: any, rawInput: string) {
  console.log('\n📊 STEP 2: INDUSTRY DETERMINATION')
  
  let industry: string
  let sector: string
  
  // Check if it's a brand first
  const brandMapping = lookupBrand(rawInput)
  
  if (brandMapping) {
    console.log(`   ✓ Brand found: ${brandMapping.brandName}`)
    console.log(`   ✓ Category: ${brandMapping.productCategory}`)
    console.log(`   ✓ Sector: ${brandMapping.sector}`)
    console.log(`   ✓ Industry: ${brandMapping.industry}`)
    
    // Use the brand's actual industry
    industry = brandMapping.industry
    sector = brandMapping.sector
    
    console.log(`   ✓ Mapped to Industry: ${industry}`)
  } else if (resolvedEntity.entityType === 'brand' && resolvedEntity.parentCompany) {
    // Brand resolved but not in KB - use parent company sector
    console.log(`   ✓ Brand resolved (not in KB)`)
    industry = 'FMCG' // Default for brands
    sector = 'FMCG'
    console.log(`   ✓ Defaulted to: ${industry}`)
  } else {
    // Not a brand - use resolved name as industry
    console.log(`   ✓ Not a brand, using resolved name`)
    industry = resolvedEntity.name
    sector = 'Unknown'
    console.log(`   ✓ Industry: ${industry}`)
  }
  
  return { industry, sector }
}

/**
 * STEP 3: Fetch Competitors for Industry
 */
async function fetchCompetitorsForIndustry(industry: string, sector: string) {
  console.log('\n🏢 STEP 3: FETCHING COMPETITORS')
  console.log(`   Industry: ${industry}`)
  console.log(`   Sector: ${sector}`)
  
  // Map industry names to competitor intelligence keys
  const industryMapping: Record<string, string> = {
    'Personal Care': 'FMCG',
    'Home Care': 'FMCG',
    'Oral Care': 'FMCG',
    'Food Processing': 'FMCG',
    'Beverages': 'FMCG',
    'Dairy': 'FMCG',
    'FMCG': 'FMCG'
  }
  
  const competitorIndustry = industryMapping[industry] || industry
  console.log(`   ✓ Mapped to competitor category: ${competitorIndustry}`)
  
  try {
    const competitors = await competitorIntelligence.fetchCompetitors({
      industry: competitorIndustry,
      region: 'INDIA',
      limit: 15,
      sortBy: 'marketCap',
      includePrivate: false
    })
    
    console.log(`   ✓ Found ${competitors.length} competitors`)
    console.log('   ✓ Top 5 competitors:')
    competitors.slice(0, 5).forEach((comp, i) => {
      console.log(`      ${i+1}. ${comp.name} (${comp.ticker})`)
    })
    
    return competitors
  } catch (error) {
    console.error(`   ✗ Failed to fetch competitors:`, error)
    return []
  }
}

/**
 * MAIN FUNCTION: Complete data fetching pipeline
 */
export async function fetchAllData(
  rawInput: string,
  preferredRegion: 'india' | 'global' = 'india'
): Promise<FetchedData> {
  
  console.log('\n' + '='.repeat(60))
  console.log('🔍 ANALYSIS PIPELINE DEBUG LOG')
  console.log('='.repeat(60))
  console.log(`\nInput: "${rawInput}"`)
  console.log(`Region: ${preferredRegion.toUpperCase()}`)
  
  // Step 1: Resolve Entity
  const resolvedEntity = await resolveEntity(rawInput)
  
  // Step 2: Determine Industry
  const { industry, sector } = determineIndustry(resolvedEntity, rawInput)
  
  // Step 3: Fetch Competitors
  const competitors = await fetchCompetitorsForIndustry(industry, sector)
  
  // Prepare results
  const stockData = competitors.map(comp => ({
    symbol: comp.ticker,
    companyName: comp.name,
    ebitdaMargin: comp.ebitdaMargin || 15,
    revenue: comp.revenue || 0,
    marketCap: comp.marketCap || 0,
    year: new Date().getFullYear(),
    source: 'Competitor Intelligence'
  }))
  
  console.log('\n📊 FINAL RESULTS:')
  console.log(`   Industry: ${industry}`)
  console.log(`   Competitors: ${stockData.length}`)
  console.log(`   Top 3: ${stockData.slice(0, 3).map(s => s.companyName).join(', ')}`)
  console.log('\n' + '='.repeat(60) + '\n')
  
  return {
    marketSize: [],
    stockData,
    resolvedCompany: resolvedEntity.entityType === 'company' ? {
      name: resolvedEntity.name,
      ticker: resolvedEntity.parentCompany?.ticker,
      sector: sector
    } : undefined,
    sourcesAttempted: 1,
    sourcesSuccessful: competitors.length > 0 ? 1 : 0,
    industryName: industry,
    mappingConfidence: resolvedEntity.confidence,
    dataFreshness: { year: new Date().getFullYear(), quarter: 'Q4' },
    competitors
  }
}

export async function runCompleteAnalysisWithNewArchitecture(
  industry: string,
  fetchedData: FetchedData
): Promise<CompleteAnalysis> {
  return runCompleteAnalysis(
    industry,
    fetchedData.marketSize,
    fetchedData.stockData,
    fetchedData.resolvedCompany
  )
}

export default fetchAllData
