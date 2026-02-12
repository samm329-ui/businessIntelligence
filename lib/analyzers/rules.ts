import { supabase } from '../db'

interface AnalysisResult {
  marketSize: {
    min: number
    max: number
    median: number
    confidence: string
  }
  profitability: {
    ebitdaRange: {
      min: number
      max: number
      median: number
    }
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
}

/**
 * Calculate market size statistics
 */
export function calculateMarketSize(dataPoints: Array<{ value: number; confidence: number }>) {
  if (dataPoints.length === 0) {
    return { 
      min: 0, 
      max: 0, 
      median: 0, 
      confidence: 'LOW',
      note: 'No market size data available from sources'
    }
  }
  
  if (dataPoints.length === 1) {
    const value = dataPoints[0].value
    // Add ±20% range for single data point
    return {
      min: Math.round(value * 0.8),
      max: Math.round(value * 1.2),
      median: Math.round(value),
      confidence: 'LOW',
      note: 'Limited data - showing estimated range'
    }
  }
  
  const values = dataPoints.map(d => d.value).sort((a, b) => a - b)
  const min = Math.round(values[0])
  const max = Math.round(values[values.length - 1])
  const median = Math.round(values[Math.floor(values.length / 2)])
  
  // Calculate confidence based on data points and variance
  const avgConfidence = dataPoints.reduce((sum, d) => sum + d.confidence, 0) / dataPoints.length
  const variance = max - min
  const variancePercent = (variance / median) * 100
  
  let confidence = 'LOW'
  if (avgConfidence > 80 && variancePercent < 30) confidence = 'HIGH'
  else if (avgConfidence > 50 && variancePercent < 50) confidence = 'MEDIUM'
  
  return { min, max, median, confidence }
}

/**
 * Calculate EBITDA statistics
 */
export function calculateEBITDA(companies: Array<{ ebitdaMargin: number }>) {
  if (companies.length === 0) {
    return {
      ebitdaRange: { min: 0, max: 0, median: 0 },
      sampleSize: 0,
      confidence: 'LOW',
      note: 'No company data available - EBITDA based on industry averages'
    }
  }
  
  const margins = companies.map(c => c.ebitdaMargin).sort((a, b) => a - b)
  
  // Use 10th and 90th percentile for range (exclude outliers)
  const minIndex = Math.floor(margins.length * 0.1)
  const maxIndex = Math.floor(margins.length * 0.9)
  
  const min = Math.round(margins[minIndex] * 10) / 10
  const max = Math.round(margins[maxIndex] * 10) / 10
  const median = Math.round(margins[Math.floor(margins.length / 2)] * 10) / 10
  
  let confidence = 'LOW'
  if (companies.length > 10) confidence = 'HIGH'
  else if (companies.length > 5) confidence = 'MEDIUM'
  
  return {
    ebitdaRange: { min, max, median },
    sampleSize: companies.length,
    confidence,
    note: `Based on ${companies.length} listed companies`
  }
}

/**
 * Run rule-based analysis
 */
export function runRuleBasedAnalysis(
  marketSizeData: Array<{ value: number; confidence: number }>,
  stockData: Array<{ ebitdaMargin: number }>
): AnalysisResult {
  
  const marketSizeResult = calculateMarketSize(marketSizeData)
  const ebitdaResult = calculateEBITDA(stockData)
  
  // Determine growth trend based on data availability
  let growthTrend = 'STEADY_GROWTH'
  let drivers = ['Market expansion', 'Increasing consumer demand']
  let risks = ['Economic uncertainty', 'Regulatory changes']
  
  if (marketSizeData.length === 0 && stockData.length === 0) {
    growthTrend = 'UNKNOWN'
    drivers = ['Insufficient data to determine growth drivers']
    risks = ['Data availability limits accurate assessment']
  } else if (marketSizeData.length > 0) {
    drivers.push('Government initiatives supporting sector')
    risks.push('Competition from unorganized sector')
  }
  
  // Determine competition level
  let competitionLevel = 'MODERATE'
  if (stockData.length > 10) competitionLevel = 'HIGH'
  else if (stockData.length < 3) competitionLevel = 'LOW'
  
  return {
    marketSize: {
      min: marketSizeResult.min,
      max: marketSizeResult.max,
      median: marketSizeResult.median,
      confidence: marketSizeResult.confidence
    },
    profitability: {
      ebitdaRange: ebitdaResult.ebitdaRange,
      sampleSize: ebitdaResult.sampleSize,
      companyTypes: 'Listed companies on NSE/BSE',
      confidence: ebitdaResult.confidence,
      note: ebitdaResult.note
    },
    growth: {
      trend: growthTrend,
      drivers,
      risks
    },
    competition: {
      level: competitionLevel,
      barriers: {
        capital: marketSizeResult.median > 50000 ? 'HIGH' : 'MODERATE',
        distribution: 'HIGH',
        brand: 'MODERATE',
        regulations: 'MODERATE'
      }
    }
  }
}
