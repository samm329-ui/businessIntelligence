// lib/data/multi-source-orchestrator.ts
// Multi-Source Data Fetch with Cross-Validation
// Prevents single-source errors and validates data integrity

import { supabase } from '../db'
import { YahooFinanceFetcher } from '../fetchers/yahoo-finance-fetcher'
import { AlphaVantageFetcher } from '../fetchers/alpha-vantage-fetcher'
import { FinancialModelingPrepFetcher } from '../fetchers/fmp-fetcher'

export interface DataSourceResult {
  source: string
  data: any
  timestamp: Date
  reliability: number
  error?: string
}

export interface CrossValidationResult {
  field: string
  values: Array<{
    source: string
    value: number
    timestamp: Date
  }>
  consensus: number
  variance: number
  isAnomaly: boolean
  anomalySources: string[]
}

export interface MultiSourceData {
  entityId: string
  entityType: string
  field: string
  consensusValue: number
  confidence: number
  sourceCount: number
  sources: DataSourceResult[]
  validations: CrossValidationResult[]
  warnings: string[]
  timestamp: Date
}

// Tolerance thresholds for cross-validation
const VALIDATION_THRESHOLDS = {
  price: 0.03,        // 3% variance allowed
  marketCap: 0.05,    // 5% variance allowed
  revenue: 0.10,      // 10% variance allowed
  margin: 0.15,       // 15% variance allowed
  ratio: 0.20,        // 20% variance allowed
}

class MultiSourceOrchestrator {
  private yahooFetcher = new YahooFinanceFetcher()
  private alphaFetcher = new AlphaVantageFetcher()
  private fmpFetcher = new FinancialModelingPrepFetcher()

  /**
   * Fetch data from multiple sources and cross-validate
   */
  async fetchWithValidation(
    ticker: string,
    fields: string[],
    region: 'india' | 'global' = 'india'
  ): Promise<MultiSourceData> {
    console.log(`[MultiSourceOrchestrator] Fetching ${fields.join(', ')} for ${ticker}`)

    const startTime = Date.now()
    const sources: DataSourceResult[] = []
    const warnings: string[] = []

    // Fetch from all available sources in parallel
    const fetchPromises = [
      this.fetchFromYahoo(ticker, region),
      this.fetchFromAlphaVantage(ticker),
      this.fetchFromFMP(ticker),
    ]

    const results = await Promise.allSettled(fetchPromises)

    results.forEach((result, index) => {
      const sourceNames = ['Yahoo Finance', 'Alpha Vantage', 'FMP']
      if (result.status === 'fulfilled') {
        sources.push(result.value)
      } else {
        warnings.push(`${sourceNames[index]} failed: ${result.reason}`)
        sources.push({
          source: sourceNames[index],
          data: null,
          timestamp: new Date(),
          reliability: 0,
          error: result.reason
        })
      }
    })

    // Cross-validate each field
    const validations: CrossValidationResult[] = []
    for (const field of fields) {
      const validation = this.crossValidateField(field, sources)
      validations.push(validation)

      if (validation.isAnomaly) {
        warnings.push(
          `Anomaly detected in ${field}: variance ${(validation.variance * 100).toFixed(1)}% across sources`
        )
      }
    }

    // Calculate overall confidence
    const successfulSources = sources.filter(s => s.data && !s.error).length
    const totalSources = sources.length
    const baseConfidence = (successfulSources / totalSources) * 100

    // Reduce confidence for anomalies
    const anomalyCount = validations.filter(v => v.isAnomaly).length
    const adjustedConfidence = Math.max(0, baseConfidence - (anomalyCount * 15))

    // Log the fetch
    await this.logDataFetch(ticker, sources, validations, warnings)

    return {
      entityId: ticker,
      entityType: 'company',
      field: fields[0],
      consensusValue: validations[0]?.consensus || 0,
      confidence: adjustedConfidence,
      sourceCount: successfulSources,
      sources,
      validations,
      warnings,
      timestamp: new Date()
    }
  }

  /**
   * Fetch from Yahoo Finance
   */
  private async fetchFromYahoo(ticker: string, region: string): Promise<DataSourceResult> {
    try {
      // Adjust ticker for region
      const adjustedTicker = region === 'india' && !ticker.includes('.') 
        ? `${ticker}.NS` 
        : ticker

      const [quote, financials] = await Promise.all([
        this.yahooFetcher.getQuote(adjustedTicker),
        this.yahooFetcher.getFinancials(adjustedTicker)
      ])

      const q: any = quote
      const f: any = financials

      return {
        source: 'Yahoo Finance',
        data: {
          price: q.regularMarketPrice,
          marketCap: q.marketCap,
          pe: q.trailingPE,
          pb: q.priceToBook,
          volume: q.regularMarketVolume,
          revenue: f.financialData?.totalRevenue,
          ebitda: f.financialData?.ebitda,
          netIncome: f.financialData?.netIncome,
          debtToEquity: f.financialData?.debtToEquity,
          currentRatio: f.financialData?.currentRatio,
          grossMargin: f.financialData?.grossMargins,
          operatingMargin: f.financialData?.operatingMargins,
          netMargin: f.financialData?.profitMargins,
          roe: f.financialData?.returnOnEquity,
        },
        timestamp: new Date(),
        reliability: 90
      }
    } catch (error) {
      throw error instanceof Error ? error.message : 'Yahoo Finance fetch failed'
    }
  }

  /**
   * Fetch from Alpha Vantage
   */
  private async fetchFromAlphaVantage(ticker: string): Promise<DataSourceResult> {
    try {
      const [overview, income] = await Promise.all([
        this.alphaFetcher.getCompanyOverview(ticker),
        this.alphaFetcher.getIncomeStatement(ticker)
      ])

      const latestIncome = income.annualReports?.[0]

      return {
        source: 'Alpha Vantage',
        data: {
          marketCap: parseInt(overview.MarketCapitalization),
          pe: parseFloat(overview.PERatio),
          pb: parseFloat(overview.PriceToBookRatio),
          revenue: latestIncome ? parseInt(latestIncome.totalRevenue) : null,
          netIncome: latestIncome ? parseInt(latestIncome.netIncome) : null,
          eps: parseFloat(overview.EPS),
          beta: parseFloat(overview.Beta),
          sector: overview.Sector,
          industry: overview.Industry,
        },
        timestamp: new Date(),
        reliability: 85
      }
    } catch (error) {
      throw error instanceof Error ? error.message : 'Alpha Vantage fetch failed'
    }
  }

  /**
   * Fetch from Financial Modeling Prep
   */
  private async fetchFromFMP(ticker: string): Promise<DataSourceResult> {
    try {
      const [profile, financials, metrics] = await Promise.all([
        this.fmpFetcher.getProfile(ticker),
        this.fmpFetcher.getFinancials(ticker),
        this.fmpFetcher.getKeyMetrics(ticker)
      ])

      const profileData = profile?.[0]
      const financialData = financials?.[0]
      const metricsData = metrics?.[0]

      return {
        source: 'FMP',
        data: {
          price: profileData?.price,
          marketCap: profileData?.mktCap,
          pe: profileData?.pe,
          eps: profileData?.eps,
          revenue: financialData?.revenue,
          netIncome: financialData?.netIncome,
          ebitda: financialData?.ebitda,
          debtToEquity: metricsData?.debtToEquityRatio,
          currentRatio: metricsData?.currentRatio,
          roe: metricsData?.roe,
        },
        timestamp: new Date(),
        reliability: 88
      }
    } catch (error) {
      throw error instanceof Error ? error.message : 'FMP fetch failed'
    }
  }

  /**
   * Cross-validate a field across all sources
   */
  private crossValidateField(
    field: string,
    sources: DataSourceResult[]
  ): CrossValidationResult {
    const values: Array<{ source: string; value: number; timestamp: Date }> = []

    for (const source of sources) {
      if (source.data && source.data[field] !== undefined && source.data[field] !== null) {
        const val = parseFloat(source.data[field])
        if (!isNaN(val) && isFinite(val)) {
          values.push({
            source: source.source,
            value: val,
            timestamp: source.timestamp
          })
        }
      }
    }

    if (values.length === 0) {
      return {
        field,
        values: [],
        consensus: 0,
        variance: 0,
        isAnomaly: true,
        anomalySources: []
      }
    }

    if (values.length === 1) {
      return {
        field,
        values,
        consensus: values[0].value,
        variance: 0,
        isAnomaly: false,
        anomalySources: []
      }
    }

    // Calculate median as consensus
    const sorted = [...values].sort((a, b) => a.value - b.value)
    const mid = Math.floor(sorted.length / 2)
    const consensus = sorted.length % 2 === 0
      ? (sorted[mid - 1].value + sorted[mid].value) / 2
      : sorted[mid].value

    // Calculate variance
    const mean = values.reduce((sum, v) => sum + v.value, 0) / values.length
    const variance = values.reduce((sum, v) => sum + Math.pow(v.value - mean, 2), 0) / values.length
    const stdDev = Math.sqrt(variance)
    const coefficientOfVariation = stdDev / mean

    // Determine threshold
    let threshold = VALIDATION_THRESHOLDS.ratio
    if (['price', 'marketCap'].includes(field)) threshold = VALIDATION_THRESHOLDS[field as keyof typeof VALIDATION_THRESHOLDS] || VALIDATION_THRESHOLDS.ratio
    if (field.includes('margin')) threshold = VALIDATION_THRESHOLDS.margin

    // Identify anomalies
    const anomalySources: string[] = []
    for (const v of values) {
      const deviation = Math.abs(v.value - consensus) / consensus
      if (deviation > threshold) {
        anomalySources.push(v.source)
      }
    }

    return {
      field,
      values,
      consensus,
      variance: coefficientOfVariation,
      isAnomaly: anomalySources.length > 0,
      anomalySources
    }
  }

  /**
   * Log data fetch for audit trail
   */
  private async logDataFetch(
    ticker: string,
    sources: DataSourceResult[],
    validations: CrossValidationResult[],
    warnings: string[]
  ): Promise<void> {
    for (const source of sources) {
      if (source.data) {
        await supabase.from('data_lineage').insert({
          entity_type: 'company',
          entity_id: ticker,
          data_source_id: await this.getSourceId(source.source),
          source_table: 'multi_source_fetch',
          raw_value: JSON.stringify(source.data),
          fetched_at: source.timestamp.toISOString(),
          confidence_score: source.reliability
        })
      }
    }

    // Log cross-source comparisons
    for (const validation of validations) {
      if (validation.values.length > 1) {
        await supabase.from('cross_source_comparison').insert({
          entity_type: 'company',
          entity_id: ticker,
          field_name: validation.field,
          source_1_id: await this.getSourceId(validation.values[0]?.source),
          source_1_value: validation.values[0]?.value?.toString(),
          source_2_id: await this.getSourceId(validation.values[1]?.source),
          source_2_value: validation.values[1]?.value?.toString(),
          variance_percent: validation.variance * 100,
          is_anomaly: validation.isAnomaly
        })
      }
    }
  }

  /**
   * Get data source ID from name
   */
  private async getSourceId(sourceName: string): Promise<string | null> {
    const { data } = await supabase
      .from('data_sources')
      .select('id')
      .ilike('name', sourceName)
      .single()

    return data?.id || null
  }

  /**
   * Calculate consensus value with weighting
   */
  calculateWeightedConsensus(validations: CrossValidationResult[]): number {
    let totalWeight = 0
    let weightedSum = 0

    for (const validation of validations) {
      if (validation.values.length > 0 && !validation.isAnomaly) {
        // Weight by number of agreeing sources
        const weight = validation.values.length
        weightedSum += validation.consensus * weight
        totalWeight += weight
      }
    }

    return totalWeight > 0 ? weightedSum / totalWeight : 0
  }
}

export const multiSourceOrchestrator = new MultiSourceOrchestrator()
export default multiSourceOrchestrator
