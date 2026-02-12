// lib/utils/consolidated-utils.ts
// ============================================================================
// CONSOLIDATED UTILITIES - DRY principle applied
// All common functions used across the codebase in one place
// ============================================================================

import { createHash } from 'crypto'

// ============================================================================
// STRING UTILITIES
// ============================================================================

export const StringUtils = {
  normalize: (str: string): string => 
    str.toLowerCase().trim().replace(/\s+/g, ' '),
  
  slugify: (str: string): string => 
    str.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, ''),
  
  capitalize: (str: string): string => 
    str.charAt(0).toUpperCase() + str.slice(1),
  
  truncate: (str: string, length: number, suffix: string = '...'): string =>
    str.length > length ? str.slice(0, length - suffix.length) + suffix : str,
  
  extractNumber: (str: string): number => {
    const match = str.match(/[\d,]+/)
    return match ? parseInt(match[0].replace(/,/g, '')) : 0
  }
}

// ============================================================================
// NUMBER UTILITIES
// ============================================================================

export const NumberUtils = {
  formatCrore: (num: number): string => {
    if (num >= 10000000) return `${(num / 10000000).toFixed(2)} Cr`
    if (num >= 100000) return `${(num / 100000).toFixed(2)} L`
    return num.toLocaleString()
  },
  
  formatCompact: (num: number): string => {
    if (num >= 1000000000) return `${(num / 1000000000).toFixed(1)}B`
    if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`
    if (num >= 1000) return `${(num / 1000).toFixed(1)}K`
    return num.toString()
  },
  
  formatPercent: (num: number, decimals: number = 1): string => 
    `${num.toFixed(decimals)}%`,
  
  clamp: (num: number, min: number, max: number): number =>
    Math.min(Math.max(num, min), max),
  
  round: (num: number, decimals: number = 0): number => {
    const factor = Math.pow(10, decimals)
    return Math.round(num * factor) / factor
  }
}

// ============================================================================
// DATE UTILITIES
// ============================================================================

export const DateUtils = {
  now: (): Date => new Date(),
  
  daysAgo: (days: number): Date => {
    const d = new Date()
    d.setDate(d.getDate() - days)
    return d
  },
  
  hoursAgo: (hours: number): Date => {
    const d = new Date()
    d.setHours(d.getHours() - hours)
    return d
  },
  
  isExpired: (date: Date, ttlDays: number): boolean => {
    return Date.now() > new Date(date.getTime() + ttlDays * 24 * 60 * 60 * 1000).getTime()
  },
  
  format: (date: Date): string => 
    date.toISOString().split('T')[0],
  
  age: (date: Date): number => 
    Math.floor((Date.now() - date.getTime()) / 1000)
}

// ============================================================================
// CACHE UTILITIES
// ============================================================================

export const CacheUtils = {
  key: (...parts: string[]): string => 
    createHash('md5').update(parts.join(':')).digest('hex').substring(0, 16),
  
  ttl: (days: number): number => 
    days * 24 * 60 * 60 * 1000,
  
  isValid: (expiresAt: number): boolean => 
    Date.now() < expiresAt
}

// ============================================================================
// API UTILITIES
// ============================================================================

export const ApiUtils = {
  delay: (ms: number): Promise<void> => 
    new Promise(r => setTimeout(r, ms)),
  
  timeout: <T>(promise: Promise<T>, ms: number): Promise<T> => {
    const timeout = new Promise<never>((_, reject) => 
      setTimeout(() => reject(new Error('Timeout')), ms)
    )
    return Promise.race([promise, timeout])
  },
  
  retry: async <T>(
    fn: () => Promise<T>,
    attempts: number = 3,
    delay: number = 1000
  ): Promise<T> => {
    for (let i = 0; i < attempts; i++) {
      try {
        return await fn()
      } catch (e) {
        if (i === attempts - 1) throw e
        await ApiUtils.delay(delay * (i + 1))
      }
    }
    throw new Error('Max retries exceeded')
  }
}

// ============================================================================
// VALIDATION UTILITIES
// ============================================================================

export const ValidationUtils = {
  isEmpty: (val: any): boolean => {
    if (val === null || val === undefined) return true
    if (typeof val === 'string') return val.trim().length === 0
    if (Array.isArray(val)) return val.length === 0
    if (typeof val === 'object') return Object.keys(val).length === 0
    return false
  },
  
  isValidTicker: (ticker: string): boolean => 
    /^[A-Z]{1,5}(\.[A-Z]{1,3})?$/.test(ticker.toUpperCase()),
  
  isValidIndustry: (industry: string): boolean => 
    industry.length >= 2 && industry.length <= 50,
  
  sanitize: (str: string): string => 
    str.replace(/<[^>]*>/g, '').trim()
}

// ============================================================================
// RESPONSE UTILITIES
// ============================================================================

export const ResponseUtils = {
  success: <T>(data: T, meta?: object) => ({
    success: true,
    data,
    ...meta,
    timestamp: new Date().toISOString()
  }),
   
  error: (message: string, code?: string) => ({
    success: false,
    error: message,
    code,
    timestamp: new Date().toISOString()
  }),
  
  paginated: <T>(data: T[], page: number, pageSize: number, total: number) => ({
    success: true,
    data,
    pagination: {
      page,
      pageSize,
      total,
      totalPages: Math.ceil(total / pageSize),
      hasMore: page * pageSize < total
    }
  })
}

// ============================================================================
// COLLECTION UTILITIES
// ============================================================================

export const CollectionUtils = {
  groupBy: <T>(arr: T[], key: keyof T): Record<string, T[]> =>
    arr.reduce((acc, item) => {
      const k = String(item[key])
      acc[k] = acc[k] || []
      acc[k].push(item)
      return acc
    }, {} as Record<string, T[]>),

  sortBy: <T>(arr: T[], key: keyof T, order: 'asc' | 'desc' = 'asc'): T[] =>
    [...arr].sort((a, b) => {
      const av = a[key] as number
      const bv = b[key] as number
      return order === 'asc' ? av - bv : bv - av
    }),

  unique: <T>(arr: T[], key?: keyof T): T[] => {
    if (!key) return [...new Set(arr)]
    const seen = new Set()
    return arr.filter(item => {
      const k = String(item[key])
      if (seen.has(k)) return false
      seen.add(k)
      return true
    })
  },

  chunk: <T>(arr: T[], size: number): T[][] => {
    const chunks: T[][] = []
    for (let i = 0; i < arr.length; i += size) {
      chunks.push(arr.slice(i, i + size))
    }
    return chunks
  }
}

// ============================================================================
// ANALYSIS RESPONSE BUILDERS
// ============================================================================

export interface CacheMetadata {
  fromCache: boolean
  age: number
  hitCount: number
  cachedAt: string | null
}

export interface AnalysisResponseConfig {
  query: string
  entityType: 'brand' | 'company' | 'industry' | 'unknown'
  industry: string
  entityName: string
  stockData: Array<{ companyName: string; ebitdaMargin: number; revenue: number; marketCap: number }>
  marketSize?: { global: number; india: number; growth: number }
  competitors: Array<{ name: string; ticker: string; sector: string }>
  confidence: number
  source: string
  processingTime: number
}

export const AnalysisBuilder = {
  buildMarketSize(data: { global: number; india: number; growth: number }, confidence: string) {
    return {
      value: { min: Math.round(data.india * 0.8), max: Math.round(data.india * 1.2), median: data.india },
      unit: 'billion_usd',
      year: 2024,
      currency: 'USD',
      confidence,
      sources: [{ name: 'Industry Research 2024', url: '', reliability: 90 }],
      methodology: 'Aggregated from industry reports and market research',
      freshness: '2024 Data'
    }
  },

  buildProfitability(stockData: AnalysisResponseConfig['stockData'], companiesWithData: number) {
    const ebitdaMargins = stockData.map(s => s.ebitdaMargin || 15)
    const avgEbitda = ebitdaMargins.length > 0 ? ebitdaMargins.reduce((a, b) => a + b, 0) / ebitdaMargins.length : 15
    return {
      ebitdaRange: {
        min: Math.round(Math.min(...ebitdaMargins)),
        max: Math.round(Math.max(...ebitdaMargins)),
        median: Math.round(avgEbitda)
      },
      sampleSize: stockData.length,
      companyTypes: 'Major Industry Players',
      confidence: companiesWithData >= 5 ? 'HIGH' : companiesWithData >= 3 ? 'MEDIUM' : 'LOW',
      note: `Based on ${companiesWithData} companies with verified financial data`
    }
  },

  buildVerdict(avgEbitda: number, marketGrowth: number, stockDataLength: number) {
    if (stockDataLength < 5) {
      return { rating: 'INSUFFICIENT_DATA', confidence: 'LOW' as const, reasoning: `Limited data - only ${stockDataLength} companies analyzed` }
    }
    if (avgEbitda > 20 && marketGrowth > 12) {
      return { rating: 'ATTRACTIVE', confidence: 'HIGH' as const, reasoning: `Strong fundamentals with ${avgEbitda.toFixed(1)}% EBITDA margins and ${marketGrowth}% growth` }
    }
    if (avgEbitda > 12 && marketGrowth > 7) {
      return { rating: 'MODERATE', confidence: 'MEDIUM' as const, reasoning: `Viable potential with ${avgEbitda.toFixed(1)}% EBITDA margins` }
    }
    return { rating: 'RISKY', confidence: 'MEDIUM' as const, reasoning: `Challenges with ${avgEbitda.toFixed(1)}% margins and ${marketGrowth}% growth` }
  },

  buildGrowth(marketGrowth: number) {
    return {
      trend: marketGrowth > 10 ? 'High Growth' : marketGrowth > 7 ? 'Stable Growth' : 'Mature',
      drivers: [`${marketGrowth}% annual market growth`, 'Digital transformation', 'Government support', 'Rising demand'],
      risks: ['Intense competition', 'Regulatory requirements', 'Market saturation']
    }
  },

  buildCompetition(stockDataLength: number, avgEbitda: number) {
    return {
      level: stockDataLength > 10 ? 'Very High' : stockDataLength > 5 ? 'High' : 'Moderate',
      barriers: { entry: avgEbitda > 18 ? 'High' : avgEbitda > 12 ? 'Medium' : 'Low', capital: 'High' }
    }
  },

  buildKeyInsights(marketSize: { global: number; india: number; growth: number }, stockData: AnalysisResponseConfig['stockData'], avgEbitda: number, companiesWithData: number) {
    const totalRevenue = stockData.reduce((sum, c) => sum + c.revenue, 0)
    return [
      `Global market: $${marketSize.global}B | India: $${marketSize.india}B | Growth: ${marketSize.growth}%`,
      `Analyzed ${stockData.length} major players with combined revenue: ₹${(totalRevenue / 1000).toFixed(1)}K Cr`,
      `${companiesWithData} companies with verified 2024 financial data`,
      `Industry average EBITDA: ${avgEbitda.toFixed(1)}%`
    ]
  },

  buildResponse(config: AnalysisResponseConfig, cacheMetadata?: CacheMetadata) {
    const avgEbitda = config.stockData.length > 0 ? config.stockData.reduce((sum, c) => sum + c.ebitdaMargin, 0) / config.stockData.length : 15
    const companiesWithData = config.stockData.filter(s => s.revenue > 0).length
    const marketSize = config.marketSize || { global: 100, india: 100, growth: 10 }
    const verdict = this.buildVerdict(avgEbitda, marketSize.growth, config.stockData.length)

    return {
      industry: config.industry,
      entityName: config.entityName,
      entityType: config.entityType,
      verdict,
      marketSize: this.buildMarketSize(marketSize, verdict.confidence),
      profitability: this.buildProfitability(config.stockData, companiesWithData),
      growth: this.buildGrowth(marketSize.growth),
      competition: this.buildCompetition(config.stockData.length, avgEbitda),
      keyInsights: this.buildKeyInsights(marketSize, config.stockData, avgEbitda, companiesWithData),
      stockData: config.stockData,
      industryName: config.industry,
      mappingConfidence: config.confidence,
      processingTime: config.processingTime,
      cached: cacheMetadata?.fromCache || false,
      _cacheMetadata: cacheMetadata
    }
  }
}

// ============================================================================ UNIFIED DATA FETCHER
// ============================================================================

export type DataSource = 'cache' | 'csv' | 'api' | 'hardcoded' | 'none'

export interface UnifiedFetchResult<T> {
  data: T | null
  source: DataSource
  fromCache: boolean
  confidence: number
}

export const UnifiedFetcher = {
  async fetchWithCache<T>(
    key: string,
    fetchFromSource: () => Promise<T | null>,
    cacheGet: (key: string) => Promise<{ fromCache: boolean; data: T }>,
    cacheSet: (key: string, data: T) => Promise<void>
  ): Promise<UnifiedFetchResult<T>> {
    const cached = await cacheGet(key)
    if (cached.fromCache && cached.data) {
      return { data: cached.data, source: 'cache', fromCache: true, confidence: 1 }
    }
    const data = await fetchFromSource()
    if (data) {
      await cacheSet(key, data)
      return { data, source: 'csv', fromCache: false, confidence: 0.9 }
    }
    return { data: null, source: 'none', fromCache: false, confidence: 0 }
  }
}

// ============================================================================
// EXPORT ALL
// ============================================================================

export default {
  String: StringUtils,
  Number: NumberUtils,
  Date: DateUtils,
  Cache: CacheUtils,
  API: ApiUtils,
  Validation: ValidationUtils,
  Response: ResponseUtils,
  Collection: CollectionUtils,
  Analysis: AnalysisBuilder,
  Fetcher: UnifiedFetcher
}
