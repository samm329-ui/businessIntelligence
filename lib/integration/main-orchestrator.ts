// lib/integration/main-orchestrator.ts
// DEPRECATED: This file is for backward compatibility only.
// Use lib/intelligence/orchestrator.ts for new implementations.
//
// Main Orchestrator - Ties all systems together for accuracy-first analysis
// This is the central hub that coordinates entity resolution, multi-source data,
// validation, AI analysis with guardrails, and error monitoring

export const DEPRECATED = true;
console.warn('[DEPRECATED] main-orchestrator.ts is deprecated. Use lib/intelligence/orchestrator.ts');

import { entityResolver, EntityResolutionResult } from '../resolution/entity-resolver'
import { multiSourceOrchestrator, MultiSourceData } from '../data/multi-source-orchestrator'
import { aiGuardrails, StructuredInput } from '../ai/ai-guardrails'
import { errorMonitor } from '../monitoring/error-monitor'
import { supabase } from '../db'

export interface AnalysisRequest {
  query: string
  region?: 'india' | 'global'
  analysisType?: 'financial' | 'competitor' | 'industry' | 'overview'
  userId?: string
}

export interface AnalysisResponse {
  success: boolean
  entity?: {
    type: string
    name: string
    id: string
    confidence: number
    parentCompany?: any
  }
  data?: {
    financials: Record<string, any>
    marketData: Record<string, any>
    sources: string[]
    confidence: number
    warnings: string[]
  }
  analysis?: {
    summary: string
    keyFindings: string[]
    risks: string[]
    opportunities: string[]
    aiGenerated: boolean
    citations: any[]
    hallucinationChecked: boolean
  }
  metadata: {
    processingTimeMs: number
    entityResolutionTimeMs: number
    dataFetchTimeMs: number
    analysisTimeMs: number
    sourcesUsed: string[]
    validationWarnings: string[]
    requestId: string
  }
  error?: {
    type: string
    message: string
    recoverable: boolean
  }
}

class MainOrchestrator {
  /**
   * Main entry point - Run complete analysis pipeline
   */
  async analyze(request: AnalysisRequest): Promise<AnalysisResponse> {
    const requestId = crypto.randomUUID()
    const startTime = Date.now()
    
    console.log(`\n[MainOrchestrator] Starting analysis for: "${request.query}" [${requestId}]`)
    
    try {
      // Phase 1: Entity Resolution
      const resolutionStart = Date.now()
      const resolvedEntity = await entityResolver.resolve(request.query, {
        preferredRegion: request.region,
        queryType: request.analysisType
      })
      const resolutionTime = Date.now() - resolutionStart
      
      if (!resolvedEntity.entityId) {
        return {
          success: false,
          error: {
            type: 'entity_not_found',
            message: `Could not resolve entity: "${request.query}"`,
            recoverable: false
          },
          metadata: {
            processingTimeMs: Date.now() - startTime,
            entityResolutionTimeMs: resolutionTime,
            dataFetchTimeMs: 0,
            analysisTimeMs: 0,
            sourcesUsed: [],
            validationWarnings: [],
            requestId
          }
        }
      }
      
      // Phase 2: Multi-Source Data Fetch
      const fetchStart = Date.now()
      let multiSourceData: MultiSourceData | null = null
      
      if (resolvedEntity.entityType === 'company' || resolvedEntity.entityType === 'parent_company') {
        const ticker = resolvedEntity.parentCompany?.ticker || 
                      (await this.getCompanyTicker(resolvedEntity.entityId))
        
        if (ticker) {
          multiSourceData = await multiSourceOrchestrator.fetchWithValidation(
            ticker,
            ['marketCap', 'revenue', 'ebitda', 'netIncome', 'pe', 'debtToEquity'],
            request.region
          )
        }
      }
      const fetchTime = Date.now() - fetchStart
      
      // Phase 3: Build Structured Input for AI
      const structuredInput = this.buildStructuredInput(
        resolvedEntity,
        multiSourceData
      )
      
      // Phase 4: AI Analysis with Guardrails
      const analysisStart = Date.now()
      let aiResponse: any = null
      
      if (structuredInput.metrics && Object.keys(structuredInput.metrics).length > 0) {
        const prompt = aiGuardrails.generateGuardedPrompt(
          request.analysisType || 'overview',
          structuredInput
        )
        
        // Call Groq API
        const groqResponse = await this.callGroqAPI(prompt)
        
        if (groqResponse) {
          aiResponse = await aiGuardrails.validateResponse(
            groqResponse,
            structuredInput
          )
        }
      }
      const analysisTime = Date.now() - analysisStart
      
      // Phase 5: Build Response
      const totalTime = Date.now() - startTime
      
      const response: AnalysisResponse = {
        success: true,
        entity: {
          type: resolvedEntity.entityType,
          name: resolvedEntity.name,
          id: resolvedEntity.entityId,
          confidence: resolvedEntity.confidence,
          parentCompany: resolvedEntity.parentCompany
        },
        data: {
          financials: multiSourceData?.consensusValue ? {
            marketCap: multiSourceData.consensusValue,
            confidence: multiSourceData.confidence
          } : {},
          marketData: multiSourceData?.sources?.reduce((acc, source) => {
            if (source.data) {
              acc[source.source] = source.data
            }
            return acc
          }, {} as Record<string, any>) || {},
          sources: multiSourceData?.sources?.map(s => s.source) || [],
          confidence: multiSourceData?.confidence || 0,
          warnings: multiSourceData?.warnings || []
        },
        analysis: aiResponse ? {
          summary: aiResponse.structuredData?.summary || 'Analysis available',
          keyFindings: aiResponse.structuredData?.key_findings || [],
          risks: aiResponse.structuredData?.risks || [],
          opportunities: aiResponse.structuredData?.opportunities || [],
          aiGenerated: true,
          citations: aiResponse.citations || [],
          hallucinationChecked: true
        } : undefined,
        metadata: {
          processingTimeMs: totalTime,
          entityResolutionTimeMs: resolutionTime,
          dataFetchTimeMs: fetchTime,
          analysisTimeMs: analysisTime,
          sourcesUsed: multiSourceData?.sources?.map(s => s.source) || [],
          validationWarnings: multiSourceData?.warnings || [],
          requestId
        }
      }
      
      // Log successful analysis
      await this.logAnalysis(requestId, request, response, 'success')
      
      console.log(`[MainOrchestrator] Analysis complete in ${totalTime}ms [${requestId}]`)
      
      return response
      
    } catch (error) {
      console.error(`[MainOrchestrator] Error:`, error)
      
      // Log error
      await errorMonitor.logError({
        errorType: 'system_error',
        severity: 'error',
        component: 'MainOrchestrator',
        message: error instanceof Error ? error.message : 'Unknown error',
        details: { request, requestId }
      })
      
      return {
        success: false,
        error: {
          type: 'system_error',
          message: error instanceof Error ? error.message : 'Analysis failed',
          recoverable: true
        },
        metadata: {
          processingTimeMs: Date.now() - startTime,
          entityResolutionTimeMs: 0,
          dataFetchTimeMs: 0,
          analysisTimeMs: 0,
          sourcesUsed: [],
          validationWarnings: [],
          requestId
        }
      }
    }
  }
  
  /**
   * Get company ticker from database
   * Updated to use entity_intelligence (Upgrade 2 schema)
   */
  private async getCompanyTicker(companyId: string): Promise<string | null> {
    const { data } = await supabase
      .from('entity_intelligence')
      .select('ticker_nse')
      .eq('id', companyId)
      .single()
    
    return data?.ticker_nse || null
  }
  
  /**
   * Build structured input for AI
   */
  private buildStructuredInput(
    entity: EntityResolutionResult,
    multiSourceData: MultiSourceData | null
  ): StructuredInput {
    const metrics: StructuredInput['metrics'] = {}
    const sources: Record<string, string> = {}
    
    if (multiSourceData) {
      for (const validation of multiSourceData.validations) {
        if (validation.consensus !== 0 && !validation.isAnomaly) {
          metrics[validation.field] = {
            value: validation.consensus,
            unit: this.inferUnit(validation.field),
            source: validation.values.map(v => v.source).join(', '),
            timestamp: new Date().toISOString(),
            confidence: 85 // Base confidence for consensus
          }
          sources[validation.field] = validation.values[0].source
        }
      }
    }
    
    return {
      entityName: entity.name,
      entityType: entity.entityType,
      metrics,
      context: {
        industry: 'Unknown', // Would fetch from DB
        competitors: [],
        timeRange: 'Latest available'
      }
    }
  }
  
  /**
   * Infer unit from metric name
   */
  private inferUnit(metricName: string): string {
    if (metricName.includes('margin') || metricName.includes('growth')) return '%'
    if (metricName.includes('ratio')) return 'x'
    if (['marketCap', 'revenue', 'ebitda', 'netIncome'].includes(metricName)) {
      return ' INR Crore'
    }
    return ''
  }
  
  /**
   * Call Groq AI API
   */
  private async callGroqAPI(prompt: string): Promise<string | null> {
    const apiKey = process.env.GROQ_API_KEY
    if (!apiKey) {
      console.warn('[MainOrchestrator] No GROQ_API_KEY set')
      return null
    }
    
    try {
      const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          model: 'llama-3.3-70b-versatile',
          messages: [
            { role: 'system', content: 'You are a financial analyst AI.' },
            { role: 'user', content: prompt }
          ],
          temperature: 0.1,
          max_tokens: 2000,
          response_format: { type: 'json_object' }
        })
      })
      
      if (!response.ok) {
        throw new Error(`Groq API error: ${response.status}`)
      }
      
      const data = await response.json()
      return data.choices[0].message.content
      
    } catch (error) {
      console.error('[MainOrchestrator] Groq API error:', error)
      return null
    }
  }
  
  /**
   * Log analysis for audit trail
   */
  private async logAnalysis(
    requestId: string,
    request: AnalysisRequest,
    response: AnalysisResponse,
    status: string
  ): Promise<void> {
    // Use intelligence_cache (Upgrade 2 schema)
    const expiresAt = new Date()
    expiresAt.setDate(expiresAt.getDate() + 7)
    
    await supabase.from('intelligence_cache').insert({
      cache_key: requestId,
      cache_layer: 'analysis',
      entity_name: request.query,
      cache_data: {
        query_params: request,
        result_data: response,
        data_sources_used: response.metadata?.sourcesUsed || [],
        confidence_score: response.data?.confidence || 0
      },
      expires_at: expiresAt.toISOString(),
      ttl_seconds: 604800
    })
  }
  
  /**
   * Get system status
   */
  async getSystemStatus(): Promise<{
    entityResolver: boolean
    multiSource: boolean
    aiGuardrails: boolean
    errorMonitor: boolean
    database: boolean
  }> {
    const status = {
      entityResolver: true,
      multiSource: true,
      aiGuardrails: !!process.env.GROQ_API_KEY,
      errorMonitor: true,
      database: false
    }
    
    // Test database - using entity_intelligence (Upgrade 2 schema)
    try {
      const { data } = await supabase.from('entity_intelligence').select('count').limit(1)
      status.database = !!data
    } catch {
      status.database = false
    }
    
    return status
  }
}

export const mainOrchestrator = new MainOrchestrator()
export default mainOrchestrator
