// lib/validators/data-validator.ts
// Multi-layer data validation and accuracy engine

export interface ValidationCheck {
  passed: boolean
  confidence?: number
  severity?: 'ERROR' | 'WARNING' | 'INFO'
  message?: string
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  details?: Record<string, any>
  recommendation?: string
}

export interface ValidationResult {
  valid: boolean
  confidence: number
  errors: ValidationCheck[]
  warnings: ValidationCheck[]
  recommendation: string
}

export interface ValidationContext {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  historicalData?: Array<Record<string, any>>
  industry?: string
  region?: string
}

export interface DataSource {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  fetch: (identifier: string) => Promise<Record<string, any>>
  name: string
}

export class DataValidationEngine {
  private rules: ValidationRule[]
  private crossReferenceSources: DataSource[]

  constructor(rules: ValidationRule[] = [], sources: DataSource[] = []) {
    this.rules = rules
    this.crossReferenceSources = sources
  }

  async validate(data: any, context: ValidationContext = {}): Promise<ValidationResult> {
    const checks: ValidationCheck[] = await Promise.all([
      this.checkDataFreshness(data),
      this.checkSourceCredibility(data?.source),
      this.crossValidateMetrics(data),
      this.detectAnomalies(data, context),
      this.verifyCalculations(data),
      this.checkConsistency(data)
    ])

    return this.aggregateResults(checks)
  }

  /**
   * Checks if data is fresh (within acceptable time window)
   */
  private async checkDataFreshness(data: any): Promise<ValidationCheck> {
    if (!data?.lastUpdated) {
      return {
        passed: false,
        severity: 'WARNING',
        message: 'No timestamp available',
        confidence: 50
      }
    }

    const lastUpdated = new Date(data.lastUpdated)
    const now = new Date()
    const ageInDays = (now.getTime() - lastUpdated.getTime()) / (1000 * 60 * 60 * 24)

    let confidence = 100
    let severity: 'ERROR' | 'WARNING' | 'INFO' = 'INFO'
    let passed = true

    if (ageInDays > 365) {
      confidence = 30
      severity = 'ERROR'
      passed = false
    } else if (ageInDays > 90) {
      confidence = 60
      severity = 'WARNING'
    } else if (ageInDays > 30) {
      confidence = 80
      severity = 'INFO'
    }

    return {
      passed,
      confidence,
      severity,
      message: `Data is ${Math.round(ageInDays)} days old`,
      details: { ageInDays, lastUpdated: data.lastUpdated }
    }
  }

  /**
   * Checks source credibility
   */
  private async checkSourceCredibility(source?: string): Promise<ValidationCheck> {
    const credibleSources = [
      'NSE', 'BSE', 'SEBI', 'RBI', 'SEC', 'Bloomberg',
      'World Bank', 'IMF', 'Yahoo Finance', 'Alpha Vantage'
    ]

    const credibilityScore = credibleSources.includes(source || '') ? 95 : 70

    return {
      passed: credibilityScore >= 80,
      confidence: credibilityScore,
      severity: credibilityScore >= 80 ? 'INFO' : 'WARNING',
      message: `Source: ${source || 'Unknown'}`,
      details: { source, isCredible: credibilityScore >= 80 }
    }
  }

  /**
   * Cross-validates data against multiple sources
   */
  private async crossValidateMetrics(data: any): Promise<ValidationCheck> {
    if (!data?.identifier || this.crossReferenceSources.length === 0) {
      return {
        passed: true,
        confidence: 70,
        severity: 'INFO',
        message: 'Cross-validation skipped - no alternative sources'
      }
    }

    try {
      const alternatives = await Promise.all(
        this.crossReferenceSources.map(source =>
          source.fetch(data.identifier).catch(() => null)
        )
      ).then(results => results.filter(Boolean))

      if (alternatives.length === 0) {
        return {
          passed: true,
          confidence: 70,
          severity: 'INFO',
          message: 'No cross-reference data available'
        }
      }

      const discrepancies = this.findDiscrepancies(data, alternatives)

      if (discrepancies.length > 0) {
        return {
          passed: false,
          severity: 'WARNING',
          message: `Found ${discrepancies.length} discrepancies`,
          details: discrepancies,
          recommendation: 'Use median value or flag for manual review',
          confidence: Math.max(50, 100 - discrepancies.length * 15)
        }
      }

      return {
        passed: true,
        confidence: 95,
        severity: 'INFO',
        message: 'Cross-validation successful'
      }
    } catch (error) {
      return {
        passed: true,
        confidence: 60,
        severity: 'WARNING',
        message: 'Cross-validation failed',
        details: { error: error instanceof Error ? error.message : String(error) }
      }
    }
  }

  /**
   * Detects statistical anomalies
   */
  private detectAnomalies(data: any, context: ValidationContext): ValidationCheck {
    const outliers: string[] = []
    const impossibleValues: string[] = []

    // Check for impossible values
    if (data?.revenue < 0) impossibleValues.push('Negative revenue')
    if (data?.ebitdaMargin > 100) impossibleValues.push('EBITDA margin > 100%')
    if (data?.marketCap <= 0) impossibleValues.push('Non-positive market cap')
    if (data?.peRatio && data.peRatio < 0 && data.peRatio !== -1) {
      impossibleValues.push('Invalid P/E ratio')
    }
    if (data?.debtToEquity && data.debtToEquity < 0) {
      impossibleValues.push('Negative D/E ratio')
    }
    if (data?.currentRatio && data.currentRatio > 50) {
      impossibleValues.push('Unrealistic current ratio')
    }

    // Check against historical data for outliers
    if (context.historicalData && context.historicalData.length > 0) {
      const historicalValues = context.historicalData.map((h: any) => h.value || h.revenue)
      const currentValue = data?.value || data?.revenue

      if (currentValue && historicalValues.length > 0) {
        const mean = historicalValues.reduce((a: number, b: number) => a + b, 0) / historicalValues.length
        const stdDev = Math.sqrt(
          historicalValues.reduce((sq: number, n: number) => sq + Math.pow(n - mean, 2), 0) / historicalValues.length
        )

        const zScore = Math.abs((currentValue - mean) / (stdDev || 1))
        if (zScore > 3) {
          outliers.push(`Value ${currentValue} is ${zScore.toFixed(1)} standard deviations from mean`)
        }
      }
    }

    const hasIssues = outliers.length > 0 || impossibleValues.length > 0

    return {
      passed: !hasIssues,
      severity: hasIssues ? 'ERROR' : 'INFO',
      message: hasIssues ? 'Anomalies detected' : 'No anomalies detected',
      details: { outliers, impossibleValues },
      confidence: hasIssues ? 40 : 90
    }
  }

  /**
   * Verifies mathematical consistency
   */
  private verifyCalculations(data: any): ValidationCheck {
    const tests: { name: string; passed: boolean }[] = []

    // Test 1: Market Cap = Share Price × Shares Outstanding
    if (data?.marketCap && data?.sharePrice && data?.sharesOutstanding) {
      const calculatedMarketCap = data.sharePrice * data.sharesOutstanding
      const variance = Math.abs(data.marketCap - calculatedMarketCap) / data.marketCap
      tests.push({
        name: 'Market Cap calculation',
        passed: variance < 0.05
      })
    }

    // Test 2: Enterprise Value = Market Cap + Debt - Cash
    if (data?.enterpriseValue && data?.marketCap && data?.totalDebt !== undefined && data?.cash !== undefined) {
      const calculatedEV = data.marketCap + data.totalDebt - data.cash
      const variance = Math.abs(data.enterpriseValue - calculatedEV) / (data.enterpriseValue || 1)
      tests.push({
        name: 'Enterprise Value calculation',
        passed: variance < 0.05
      })
    }

    // Test 3: Free Cash Flow = Operating CF - CapEx
    if (data?.freeCashFlow && data?.operatingCashFlow && data?.capitalExpenditures) {
      const calculatedFCF = data.operatingCashFlow - data.capitalExpenditures
      const variance = Math.abs(data.freeCashFlow - calculatedFCF) / (Math.abs(data.freeCashFlow) || 1)
      tests.push({
        name: 'Free Cash Flow calculation',
        passed: variance < 0.05
      })
    }

    const failures = tests.filter(t => !t.passed).length
    const confidence = tests.length > 0 ? ((tests.length - failures) / tests.length) * 100 : 80

    return {
      passed: failures === 0,
      severity: failures > 0 ? 'WARNING' : 'INFO',
      message: `${tests.length - failures}/${tests.length} calculations verified`,
      details: { tests },
      confidence
    }
  }

  /**
   * Checks data consistency
   */
  private checkConsistency(data: any): ValidationCheck {
    const issues: string[] = []

    // Check for missing critical fields
    const criticalFields = ['revenue', 'marketCap', 'ebitdaMargin']
    const missingFields = criticalFields.filter(f => data?.[f] === undefined || data?.[f] === null)

    if (missingFields.length > 0) {
      issues.push(`Missing critical fields: ${missingFields.join(', ')}`)
    }

    // Check for inconsistent ratios
    if (data?.grossMargin && data?.netMargin && data.grossMargin < data.netMargin) {
      issues.push('Gross margin is less than net margin (unusual)')
    }

    return {
      passed: issues.length === 0,
      severity: issues.length > 0 ? 'WARNING' : 'INFO',
      message: issues.length > 0 ? 'Consistency issues found' : 'Data is consistent',
      details: { issues, missingFields },
      confidence: issues.length > 0 ? 60 : 90
    }
  }

  /**
   * Finds discrepancies between data sources
   */
  private findDiscrepancies(primary: any, alternatives: any[]): Array<{ field: string; variance: number }> {
    const discrepancies: Array<{ field: string; variance: number }> = []
    const tolerance = 0.05 // 5% variance allowed

    const fieldsToCompare = ['marketCap', 'revenue', 'ebitdaMargin', 'peRatio']

    for (const field of fieldsToCompare) {
      if (primary[field] === undefined) continue

      const values = alternatives.map(a => a[field]).filter(v => v !== undefined)
      if (values.length === 0) continue

      const avg = values.reduce((a, b) => a + b, 0) / values.length
      const variance = Math.abs((primary[field] - avg) / (avg || 1))

      if (variance > tolerance) {
        discrepancies.push({ field, variance })
      }
    }

    return discrepancies
  }

  /**
   * Aggregates all validation results
   */
  private aggregateResults(checks: ValidationCheck[]): ValidationResult {
    const validChecks = checks.filter(c => c.confidence !== undefined)
    const totalScore = validChecks.reduce((sum, c) => sum + (c.confidence || 0), 0)
    const avgConfidence = validChecks.length > 0 ? totalScore / validChecks.length : 50

    const errors = checks.filter(c => c.severity === 'ERROR')
    const warnings = checks.filter(c => c.severity === 'WARNING')

    return {
      valid: errors.length === 0,
      confidence: avgConfidence,
      errors,
      warnings,
      recommendation: this.generateRecommendation(avgConfidence, errors, warnings)
    }
  }

  private generateRecommendation(confidence: number, errors: any[], warnings: any[]): string {
    if (errors.length > 0) return 'DO NOT USE - Contains critical errors'
    if (warnings.length > 2) return 'USE WITH CAUTION - Multiple warnings'
    if (confidence < 70) return 'LOW CONFIDENCE - Verify manually'
    if (confidence < 85) return 'MODERATE CONFIDENCE - Cross-check recommended'
    return 'HIGH CONFIDENCE - Safe to use'
  }
}

// Validation rule interface
export interface ValidationRule {
  name: string
  validate: (data: any) => ValidationCheck
}

// Claim verifier for verifying numerical claims
export class ClaimVerifier {
  /**
   * Verifies claims made in analysis against source data
   */
  async verifyClaim(claim: string, sourceData: any): Promise<{
    claim: string
    verifications: Array<{
      claim: string
      status: 'VERIFIED' | 'MINOR_DISCREPANCY' | 'FALSE' | 'UNVERIFIED'
      variance?: number
      sourceValue?: number
    }>
    overallStatus: string
  }> {
    const numericalClaims = this.extractNumbers(claim)

    const verifications = await Promise.all(
      numericalClaims.map(async (num) => {
        const sourceValue = this.findCorrespondingValue(num, sourceData)

        if (!sourceValue) {
          return {
            claim: num.text,
            status: 'UNVERIFIED' as const,
            reason: 'No source data'
          }
        }

        const variance = Math.abs((num.value - sourceValue) / sourceValue)

        if (variance < 0.05) {
          return { claim: num.text, status: 'VERIFIED' as const, variance, sourceValue }
        } else if (variance < 0.15) {
          return { claim: num.text, status: 'MINOR_DISCREPANCY' as const, variance, sourceValue }
        } else {
          return { claim: num.text, status: 'FALSE' as const, variance, sourceValue }
        }
      })
    )

    return {
      claim,
      verifications,
      overallStatus: this.determineOverallStatus(verifications)
    }
  }

  private extractNumbers(claim: string): Array<{ text: string; value: number }> {
    const numberPattern = /[\d,]+(?:\.\d+)?/g
    const matches = claim.match(numberPattern) || []

    return matches.map(match => ({
      text: match,
      value: parseFloat(match.replace(/,/g, ''))
    })).filter(n => !isNaN(n.value))
  }

  private findCorrespondingValue(num: { value: number }, sourceData: any): number | null {
    // Search through source data for matching values
    const searchObj = (obj: any): number | null => {
      for (const key in obj) {
        if (typeof obj[key] === 'number' && Math.abs(obj[key] - num.value) / (obj[key] || 1) < 0.1) {
          return obj[key]
        }
        if (typeof obj[key] === 'object' && obj[key] !== null) {
          const found = searchObj(obj[key])
          if (found !== null) return found
        }
      }
      return null
    }

    return searchObj(sourceData)
  }

  private determineOverallStatus(verifications: any[]): string {
    const hasFalse = verifications.some(v => v.status === 'FALSE')
    const hasDiscrepancy = verifications.some(v => v.status === 'MINOR_DISCREPANCY')
    const allVerified = verifications.every(v => v.status === 'VERIFIED')

    if (hasFalse) return 'FALSE'
    if (hasDiscrepancy) return 'PARTIALLY_VERIFIED'
    if (allVerified) return 'VERIFIED'
    return 'UNVERIFIED'
  }

  /**
   * Flags suspicious patterns in financial data
   */
  detectManipulation(data: any, industry: string): Array<{ type: string; severity: 'HIGH' | 'MEDIUM' | 'LOW' }> {
    const flags: Array<{ type: string; severity: 'HIGH' | 'MEDIUM' | 'LOW' }> = []

    // Check for accounting red flags
    if (data?.revenueGrowth > 50 && data?.receivablesGrowth > data?.revenueGrowth) {
      flags.push({ type: 'REVENUE_RECOGNITION_RISK', severity: 'HIGH' })
    }

    if (data?.inventoryGrowth > data?.revenueGrowth * 2) {
      flags.push({ type: 'INVENTORY_BUILDUP', severity: 'MEDIUM' })
    }

    if (data?.operatingCashFlow < 0 && data?.netIncome > 0) {
      flags.push({ type: 'CASH_FLOW_MISMATCH', severity: 'HIGH' })
    }

    // Industry-specific checks
    if (industry === 'Technology' && data?.rAndDExpense < data?.revenue * 0.05) {
      flags.push({ type: 'LOW_R_AND_D', severity: 'MEDIUM' })
    }

    return flags
  }
}

export default DataValidationEngine
