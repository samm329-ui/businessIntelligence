// app/api/v2/unified-analysis/route.ts
// ============================================================================
// UNIFIED ANALYSIS API - Single endpoint, maximum efficiency
// DRY Principle: One endpoint handles all analysis requests
// ============================================================================

import { NextResponse } from 'next/server'
import { compressedCache, cacheGet, cacheSet } from '@/lib/cache/compressed-cache'
import { loadCompanyDatabase, getCompaniesByIndustry, getIndustryStats, getSimilarCompanies } from '@/lib/datasets/company-database'

// ============================================================================
// CONFIGURATION - Centralized settings
// ============================================================================

const CONFIG = {
  cacheTTL: 7 * 24 * 60 * 60, // 7 days
  maxCompetitors: 20,
  defaultLevel: 'detailed',
  levels: ['basic', 'detailed', 'comprehensive'] as const
}

// ============================================================================
// DATA FETCHERS - Unified, reusable functions
// ============================================================================

async function fetchFromCache(key: string): Promise<any | null> {
  const result = await cacheGet(key)
  return result.fromCache ? result.data : null
}

async function fetchFromCSV(query: string): Promise<any | null> {
  // Try industry
  const stats = getIndustryStats(query)
  if (stats) {
    return {
      type: 'industry',
      data: {
        name: query,
        ...stats
      }
    }
  }
  
  // Try companies
  const companies = getCompaniesByIndustry(query)
  if (companies.length > 0) {
    return {
      type: 'companies',
      data: {
        query,
        companies: companies.slice(0, CONFIG.maxCompetitors),
        totalCount: companies.length
      }
    }
  }
  
  return null
}

async function fetchData(query: string): Promise<any> {
  // Strategy 1: Cache
  const cacheKey = `analysis:${query.toLowerCase()}`
  const cached = await fetchFromCache(cacheKey)
  if (cached) {
    return { data: cached, source: 'cache', fromCache: true }
  }
  
  // Strategy 2: CSV
  const csvData = await fetchFromCSV(query)
  if (csvData) {
    await cacheSet(cacheKey, csvData.data)
    return { data: csvData.data, source: 'csv', fromCache: false }
  }
  
  // Fallback: Empty response
  return { 
    data: { 
      query,
      error: 'No data found',
      companies: [],
      industries: []
    }, 
    source: 'none', 
    fromCache: false 
  }
}

// ============================================================================
// RESPONSE BUILDERS - Consistent response structure
// ============================================================================

function buildIndustryResponse(data: any, source: string, duration: number, fromCache: boolean) {
  return {
    success: true,
    query: data.name || data.query,
    timestamp: new Date().toISOString(),
    source,
    cached: fromCache,
    performance: { duration },
    data: {
      name: data.name,
      companyCount: data.companyCount,
      topCompanies: data.topCompanies?.slice(0, 10).map((c: any) => ({
        name: c.companyName,
        industry: c.industryName,
        country: c.country
      })),
      subIndustries: data.subIndustries || [],
      countries: data.countries || []
    }
  }
}

function buildCompanyResponse(data: any, source: string, duration: number, fromCache: boolean) {
  return {
    success: true,
    query: data.query,
    timestamp: new Date().toISOString(),
    source,
    cached: fromCache,
    performance: { duration },
    data: {
      query: data.query,
      totalCompanies: data.totalCount,
      companies: data.companies?.map((c: any) => ({
        name: c.companyName,
        industry: c.industryName,
        subIndustry: c.subIndustry,
        country: c.country
      }))
    }
  }
}

// ============================================================================
// MAIN HANDLERS
// ============================================================================

async function handlePOST(request: Request) {
  const startTime = Date.now()
  
  try {
    const { query, level = CONFIG.defaultLevel } = await request.json()
    
    if (!query || typeof query !== 'string') {
      return NextResponse.json(
        { error: 'Query string required' },
        { status: 400 }
      )
    }

    // Initialize if needed
    await loadCompanyDatabase()

    // Fetch data
    const result = await fetchData(query)
    
    // Build response
    let response: any
    if (result.data.companyCount !== undefined || result.data.topCompanies) {
      response = buildIndustryResponse(result.data, result.source, Date.now() - startTime, result.fromCache)
    } else if (result.data.companies) {
      response = buildCompanyResponse(result.data, result.source, Date.now() - startTime, result.fromCache)
    } else {
      response = {
        success: false,
        query,
        timestamp: new Date().toISOString(),
        source: result.source,
        cached: result.fromCache,
        performance: { duration: Date.now() - startTime },
        error: result.data.error || 'No results found'
      }
    }

    return NextResponse.json(response)

  } catch (error) {
    console.error('[API] Error:', error)
    return NextResponse.json(
      { 
        success: false, 
        error: 'Analysis failed',
        message: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}

async function handleGET(request: Request) {
  const { searchParams } = new URL(request.url)
  const action = searchParams.get('action')

  switch (action) {
    case 'status':
      const stats = await compressedCache.getStats()
      return NextResponse.json({
        success: true,
        ...stats,
        timestamp: new Date().toISOString()
      })
      
    case 'clear':
      await compressedCache.clear()
      return NextResponse.json({ success: true, message: 'Cache cleared' })
      
    case 'cleanup':
      const result = await compressedCache.cleanup()
      return NextResponse.json({ 
        success: true, 
        deleted: result.deleted, 
        freedMB: result.freedMB.toFixed(2) 
      })
      
    default:
      return NextResponse.json({
        success: true,
        endpoints: {
          POST: 'Analyze query',
          'GET ?action=status': 'Get cache statistics',
          'GET ?action=clear': 'Clear all cache',
          'GET ?action=cleanup': 'Remove expired entries'
        }
      })
  }
}

// ============================================================================
// EXPORTS
// ============================================================================

export async function POST(request: Request) {
  return handlePOST(request)
}

export async function GET(request: Request) {
  return handleGET(request)
}
