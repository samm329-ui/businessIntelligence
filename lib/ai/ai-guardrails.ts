// lib/ai/ai-guardrails.ts
// AI Hallucination Prevention System
// Ensures AI only uses validated data and cites sources

import { supabase } from '../db'

export interface AIGuardrailsConfig {
  maxTokens: number
  temperature: number
  requireCitations: boolean
  allowSpeculation: boolean
  confidenceThreshold: number
}

export interface StructuredInput {
  entityName: string
  entityType: string
  metrics: Record<string, {
    value: number
    unit: string
    source: string
    timestamp: string
    confidence: number
  }>
  context: {
    industry: string
    competitors: string[]
    timeRange: string
  }
}

export interface AIClaim {
  claim: string
  claimType: 'fact' | 'inference' | 'opinion'
  cited: boolean
  source?: string
  verified: boolean
  verificationStatus: 'verified' | 'unverifiable' | 'contradicted'
}

export interface GuardedAIResponse {
  response: string
  structuredData: any
  claims: AIClaim[]
  hallucinationDetected: boolean
  hallucinationDetails: string[]
  confidence: number
  citations: Array<{
    claim: string
    source: string
    value: any
  }>
}

const DEFAULT_CONFIG: AIGuardrailsConfig = {
  maxTokens: 2000,
  temperature: 0.1, // Low temperature for factual responses
  requireCitations: true,
  allowSpeculation: false,
  confidenceThreshold: 70
}

class AIGuardrails {
  private config: AIGuardrailsConfig

  constructor(config: Partial<AIGuardrailsConfig> = {}) {
    this.config = { ...DEFAULT_CONFIG, ...config }
  }

  /**
   * Build structured input from validated data
   * Prevents AI from hallucinating by only feeding verified data
   */
  buildStructuredInput(
    entityName: string,
    metrics: Record<string, any>,
    sources: Record<string, any>,
    context: any
  ): StructuredInput {
    const structuredMetrics: StructuredInput['metrics'] = {}

    for (const [key, value] of Object.entries(metrics)) {
      if (value !== null && value !== undefined && !isNaN(value)) {
        structuredMetrics[key] = {
          value: typeof value === 'number' ? value : parseFloat(value),
          unit: this.inferUnit(key),
          source: sources[key] || 'Unknown',
          timestamp: new Date().toISOString(),
          confidence: this.calculateMetricConfidence(key, value, sources[key])
        }
      }
    }

    return {
      entityName,
      entityType: context.entityType || 'company',
      metrics: structuredMetrics,
      context: {
        industry: context.industry || 'Unknown',
        competitors: context.competitors || [],
        timeRange: context.timeRange || 'Latest available'
      }
    }
  }

  /**
   * Generate AI prompt with guardrails
   */
  generateGuardedPrompt(
    analysisType: string,
    structuredInput: StructuredInput,
    userQuestion?: string
  ): string {
    const metricsList = Object.entries(structuredInput.metrics)
      .map(([key, data]) => {
        return `- ${key}: ${data.value}${data.unit} (Source: ${data.source}, Confidence: ${data.confidence}%)`
      })
      .join('\n')

    return `
You are a financial analyst AI. You must ONLY use the data provided below.
DO NOT make up numbers. DO NOT speculate. DO NOT use outside knowledge.

ANALYSIS TYPE: ${analysisType}
ENTITY: ${structuredInput.entityName} (${structuredInput.entityType})
INDUSTRY: ${structuredInput.context.industry}

VALIDATED DATA:
${metricsList}

${userQuestion ? `USER QUESTION: ${userQuestion}` : ''}

RULES:
1. Use ONLY the metrics listed above
2. If data is missing, say "Data unavailable" - DO NOT guess
3. Cite the source for every number you mention
4. If confidence is below ${this.config.confidenceThreshold}%, mention the uncertainty
5. Format output as JSON with fields: summary, key_findings[], risks[], opportunities[]

OUTPUT FORMAT:
{
  "summary": "Brief summary using only provided data",
  "key_findings": [
    { "finding": "...", "metric": "revenue", "value": 123, "source": "Yahoo Finance" }
  ],
  "risks": ["..."],
  "opportunities": ["..."],
  "data_confidence": 85,
  "citations": [
    { "claim": "Revenue is $100B", "source": "Yahoo Finance", "verified": true }
  ]
}
`
  }

  /**
   * Validate AI response for hallucinations
   */
  async validateResponse(
    rawResponse: string,
    structuredInput: StructuredInput
  ): Promise<GuardedAIResponse> {
    const claims: AIClaim[] = []
    const hallucinationDetails: string[] = []
    let parsedResponse: any = {}

    // Parse JSON response
    try {
      const jsonMatch = rawResponse.match(/\{[\s\S]*\}/)
      if (jsonMatch) {
        parsedResponse = JSON.parse(jsonMatch[0])
      }
    } catch {
      // If not valid JSON, treat entire response as text
      parsedResponse = { summary: rawResponse }
    }

    // Extract and validate claims
    const textToValidate = JSON.stringify(parsedResponse)
    const numberPattern = /[\d,]+(?:\.\d+)?\s*(?:%|crore|Cr|lakh|L|billion|B|million|M)?/gi
    const matches = textToValidate.match(numberPattern) || []

    for (const match of matches) {
      const cleanValue = parseFloat(match.replace(/[^\d.]/g, ''))
      if (!isNaN(cleanValue)) {
        const claim = await this.validateClaim(match, cleanValue, structuredInput)
        claims.push(claim)

        if (claim.verificationStatus === 'contradicted') {
          hallucinationDetails.push(`Claim "${match}" contradicts source data`)
        } else if (claim.verificationStatus === 'unverifiable' && this.config.requireCitations) {
          hallucinationDetails.push(`Claim "${match}" lacks source citation`)
        }
      }
    }

    // Check for speculation
    const speculationPatterns = [
      /\b(probably|likely|maybe|perhaps|I think|it seems|appears to be)\b/gi,
      /\b(could|might|may|should|would)\s+be\b/gi,
      /\b(estimat(ed|ion)|project(ed|ion)|forecast)\b/gi
    ]

    for (const pattern of speculationPatterns) {
      if (pattern.test(textToValidate) && !this.config.allowSpeculation) {
        hallucinationDetails.push('Response contains speculative language')
        break
      }
    }

    // Build citations
    const citations = claims
      .filter(c => c.verified && c.source)
      .map(c => ({
        claim: c.claim,
        source: c.source!,
        value: c.claim
      }))

    // Calculate overall confidence
    const verifiedClaims = claims.filter(c => c.verified).length
    const confidence = claims.length > 0
      ? (verifiedClaims / claims.length) * 100
      : 0

    // Log to database
    await this.logAIAnalysis(structuredInput.entityName, rawResponse, claims, hallucinationDetails)

    return {
      response: rawResponse,
      structuredData: parsedResponse,
      claims,
      hallucinationDetected: hallucinationDetails.length > 0,
      hallucinationDetails,
      confidence,
      citations
    }
  }

  /**
   * Validate a single claim against source data
   */
  private async validateClaim(
    claim: string,
    value: number,
    structuredInput: StructuredInput
  ): Promise<AIClaim> {
    // Check if value matches any known metric
    for (const [metricName, metricData] of Object.entries(structuredInput.metrics)) {
      const metricValue = metricData.value
      const tolerance = metricValue * 0.05 // 5% tolerance

      if (Math.abs(value - metricValue) <= tolerance) {
        return {
          claim,
          claimType: 'fact',
          cited: true,
          source: metricData.source,
          verified: true,
          verificationStatus: 'verified'
        }
      }

      // Check if it's a derived metric (e.g., calculated)
      if (metricName.includes('margin') || metricName.includes('ratio')) {
        const calculatedValue = value
        if (Math.abs(calculatedValue - metricValue) <= tolerance) {
          return {
            claim,
            claimType: 'fact',
            cited: true,
            source: `${metricData.source} (calculated)`,
            verified: true,
            verificationStatus: 'verified'
          }
        }
      }
    }

    // Check if value is in reasonable range for any metric
    const allValues = Object.values(structuredInput.metrics).map(m => m.value)
    const minVal = Math.min(...allValues)
    const maxVal = Math.max(...allValues)

    if (value >= minVal * 0.5 && value <= maxVal * 2) {
      return {
        claim,
        claimType: 'fact',
        cited: false,
        source: undefined,
        verified: false,
        verificationStatus: 'unverifiable'
      }
    }

    return {
      claim,
      claimType: 'fact',
      cited: false,
      source: undefined,
      verified: false,
      verificationStatus: 'contradicted'
    }
  }

  /**
   * Infer unit from metric name
   */
  private inferUnit(metricName: string): string {
    if (metricName.includes('margin') || metricName.includes('growth') || metricName.includes('return')) {
      return '%'
    }
    if (metricName.includes('ratio')) {
      return 'x'
    }
    if (['revenue', 'market_cap', 'net_income', 'ebitda'].includes(metricName)) {
      return ' INR Crore'
    }
    return ''
  }

  /**
   * Calculate confidence score for a metric
   */
  private calculateMetricConfidence(metricName: string, value: number, source: string): number {
    let baseConfidence = 80

    // Adjust based on source reliability
    const sourceReliability: Record<string, number> = {
      'SEC': 100,
      'NSE': 95,
      'BSE': 95,
      'Yahoo Finance': 90,
      'Alpha Vantage': 85,
      'FMP': 88,
      'Calculated': 75
    }

    baseConfidence = sourceReliability[source] || baseConfidence

    // Reduce confidence for suspicious values
    if (value === 0) baseConfidence -= 20
    if (value < 0 && !metricName.includes('growth')) baseConfidence -= 15

    return Math.max(0, Math.min(100, baseConfidence))
  }

  /**
   * Log AI analysis for auditing
   */
  private async logAIAnalysis(
    entityName: string,
    response: string,
    claims: AIClaim[],
    hallucinationDetails: string[]
  ): Promise<void> {
    // Use analysis_results table (Upgrade 2 schema)
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7); // 7 days expiry
    
    const { data, error } = await supabase.from('analysis_results').insert({
      entity_name: entityName,
      analysis_type: 'guarded_analysis',
      executive_summary: response,
      key_findings: claims.map(c => ({ claim: c.claim, verified: c.verified })),
      hallucination_detected: hallucinationDetails.length > 0,
      ai_confidence: Math.round((claims.filter(c => c.verified).length / Math.max(claims.length, 1)) * 100),
      ai_model: 'guarded-model',
      created_at: new Date().toISOString(),
      expires_at: expiresAt.toISOString()
    }).select()

    if (!error && data) {
      console.log(`[AIGuardrails] Analysis logged for ${entityName}, ID: ${data[0]?.id}`)
    }
  }

  /**
   * Get hallucination statistics
   */
  async getHallucinationStats(days: number = 30): Promise<{
    totalAnalyses: number
    hallucinationsDetected: number
    hallucinationRate: number
    topUnverifiedClaims: string[]
  }> {
    const startDate = new Date()
    startDate.setDate(startDate.getDate() - days)

    // Use analysis_results table (Upgrade 2 schema)
    const { data, error } = await supabase
      .from('analysis_results')
      .select('*')
      .gte('created_at', startDate.toISOString())

    if (error || !data) {
      return {
        totalAnalyses: 0,
        hallucinationsDetected: 0,
        hallucinationRate: 0,
        topUnverifiedClaims: []
      }
    }

    const totalAnalyses = data.length
    const hallucinationsDetected = data.filter(a => a.hallucination_detected).length
    const hallucinationRate = totalAnalyses > 0 ? (hallucinationsDetected / totalAnalyses) * 100 : 0

    return {
      totalAnalyses,
      hallucinationsDetected,
      hallucinationRate,
      topUnverifiedClaims: []
    }
  }
}

export const aiGuardrails = new AIGuardrails()
export default aiGuardrails
