// lib/api/self-learning.ts - Suggest missing data when confidence is LOW

interface MissingDataReport {
  confidence: 'LOW' | 'MEDIUM' | 'HIGH'
  missingCompanies: string[]
  missingTickers: string[]
  suggestions: string[]
  neededParameters: string[]
}

export function analyzeMissingData(
  competitors: any[],
  verifiedCount: number,
  industry: string
): MissingDataReport {
  const missingCompanies: string[] = []
  const missingTickers: string[] = []
  const suggestions: string[] = []
  const neededParameters: string[] = []

  for (const comp of competitors) {
    if (!comp.revenue || comp.revenue === 0) {
      missingCompanies.push(comp.name)
    }
    if (!comp.ticker || comp.ticker === 'N/A') {
      missingTickers.push(comp.name)
    }
  }

  // Determine confidence
  let confidence: 'LOW' | 'MEDIUM' | 'HIGH'
  if (verifiedCount < 3) {
    confidence = 'LOW'
    neededParameters.push('More company financial data (revenue, EBITDA, market cap)')
    neededParameters.push('Stock tickers for competitors')
  } else if (verifiedCount < 5) {
    confidence = 'MEDIUM'
    neededParameters.push('Additional competitor financials')
  } else {
    confidence = 'HIGH'
  }

  // Generate suggestions
  if (missingCompanies.length > 0) {
    suggestions.push(`Search for financial data: ${missingCompanies.slice(0, 3).join(', ')}`)
  }
  
  if (missingTickers.length > 0) {
    suggestions.push(`Find stock tickers for: ${missingTickers.slice(0, 3).join(', ')}`)
  }

  // Auto-suggest parameters user could provide
  if (confidence === 'LOW') {
    neededParameters.push('Specific company names to analyze')
    neededParameters.push('Industry benchmarks (optional)')
    neededParameters.push('Target market region (India/USA/Global)')
  }

  return {
    confidence,
    missingCompanies,
    missingTickers,
    suggestions,
    neededParameters
  }
}

// Example: What parameters would improve this analysis
export function getImprovementParams(industry: string) {
  return {
    industry,
    suggestions: [
      'Add specific competitor names for deeper analysis',
      'Provide revenue range for better benchmarks',
      'Specify geographic focus (India/USA/Global)',
      'Add timeframe preference (1yr/3yr/5yr projections)'
    ]
  }
}
