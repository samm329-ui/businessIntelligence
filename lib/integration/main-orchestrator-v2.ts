/**
 * EBITA Intelligence - Main Orchestrator v2
 * 
 * Complete pipeline:
 * Query → Entity Resolution → DIL (Memory + Realtime + Consensus) → AI → Response
 * 
 * Drop this in: lib/integration/main-orchestrator-v2.ts
 * Update your /api/analyze/route.ts to import from here.
 */

import { resolveEntity, ResolvedEntity, initializeEntityDatabase } from '../resolution/entity-resolver-v2';
import { runDataIntelligenceLayer, DILRequest, detectDeltas } from '../intelligence/data-intelligence-layer';
import { runAIAnalysis, AIAnalysisRequest, AIAnalysisResponse, AnalysisType } from '../ai/ai-guardrails-v2';
import { fetchWikipediaData } from '../fetchers/wikipedia-fetcher';
import { searchCompanyContext, calculateNewsSentiment } from '../fetchers/duckduckgo-fetcher';
import { runDailyCleanup } from '../cleanup-job';
import { ConsensusMetrics } from '../intelligence/consensus-engine';

// ─── Types ────────────────────────────────────────────────────────────────────

export interface AnalysisRequest {
  query: string;
  analysisType: AnalysisType;
  region?: 'INDIA' | 'GLOBAL' | 'AUTO';
  includeCompetitors?: boolean;
  includeInvestors?: boolean;
  forceRefresh?: boolean;
}

export interface FullAnalysisResponse {
  success: boolean;
  entity: ResolvedEntity | null;
  consensus: ConsensusMetrics | null;
  analysis: AIAnalysisResponse | null;
  newsContext?: {
    headlines: string[];
    sentiment: string;
    topics: string[];
  };
  wikiContext?: {
    description: string;
    founded?: number;
    headquarters?: string;
  };
  competitors?: CompetitorSummary[];
  metadata: {
    processingTimeMs: number;
    sourcesUsed: string[];
    sourcesFailed: string[];
    cacheHit: boolean;
    entityConfidence: number;
    dataConfidence: number;
    requestId: string;
  };
  error?: string;
}

interface CompetitorSummary {
  name: string;
  ticker?: string;
  marketCap?: number | null;
  revenue?: number | null;
  netMargin?: number | null;
  peRatio?: number | null;
}

// ─── Environment Config ───────────────────────────────────────────────────────

interface OrchestratorConfig {
  supabaseClient: any;
  pythonServiceUrl?: string;
  groqApiKey?: string;
  anthropicApiKey?: string;
  fmpApiKey?: string;
  alphaVantageApiKey?: string;
  indianCompaniesTxtPath?: string;
}

// ─── Main Orchestrator ────────────────────────────────────────────────────────

export class EBITAOrchestrator {
  private config: OrchestratorConfig;
  private isInitialized = false;

  constructor(config: OrchestratorConfig) {
    this.config = config;
  }

  async initialize(): Promise<void> {
    if (this.isInitialized) return;

    await initializeEntityDatabase(this.config.supabaseClient, {
      txtFilePath: this.config.indianCompaniesTxtPath,
      uploadToSupabase: false, // Set to true ONLY on first run to seed DB
    });

    this.isInitialized = true;
  }

  async analyze(request: AnalysisRequest): Promise<FullAnalysisResponse> {
    const startTime = Date.now();
    const requestId = `req_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;

    if (!this.isInitialized) {
      await this.initialize();
    }

    // ── Phase 1: Entity Resolution ──────────────────────────────────────────
    let entity: ResolvedEntity | null = null;
    try {
      entity = await resolveEntity(request.query, this.config.supabaseClient);
    } catch (err: any) {
      console.error('[Orchestrator] Entity resolution error:', err.message);
    }

    if (!entity) {
      return this.errorResponse(requestId, startTime, `Could not identify company or industry: "${request.query}"`);
    }

    if (entity.confidence < 60) {
      // Low confidence - still proceed but flag it
      console.warn(`[Orchestrator] Low confidence (${entity.confidence}%) for: ${request.query} → ${entity.canonicalName}`);
    }

    // ── Phase 2: Data Intelligence Layer ───────────────────────────────────
    const dilRequest: DILRequest = {
      entityId: entity.entityId,
      entityName: entity.canonicalName,
      entityType: 'company',
      ticker: entity.ticker,
      tickerNSE: entity.tickerNSE,
      tickerBSE: entity.tickerBSE,
      region: entity.region,
      forceRefresh: request.forceRefresh,
    };

    // Build fetchers based on available config
    const fetchers = this.buildFetchers(entity);

    const dilResponse = await runDataIntelligenceLayer(
      dilRequest,
      fetchers,
      this.config.supabaseClient
    );

    // ── Phase 3: Wikipedia + News Context (parallel, non-blocking) ─────────
    const [wikiResult, newsResult] = await Promise.allSettled([
      fetchWikipediaData(entity.canonicalName),
      searchCompanyContext(entity.canonicalName, entity.ticker),
    ]);

    const wikiData = wikiResult.status === 'fulfilled' ? wikiResult.value.companyData : null;
    const newsData = newsResult.status === 'fulfilled' ? newsResult.value : null;

    // ── Phase 4: AI Analysis ────────────────────────────────────────────────
    let analysis: AIAnalysisResponse | null = null;

    if (dilResponse.consensus.overallConfidence > 0) {
      const aiRequest: AIAnalysisRequest = {
        analysisType: request.analysisType,
        consensus: dilResponse.consensus,
        additionalContext: wikiData?.description
          ? `Company background: ${wikiData.description.slice(0, 500)}`
          : undefined,
      };

      try {
        analysis = await runAIAnalysis(aiRequest, {
          groq: this.config.groqApiKey ? { apiKey: this.config.groqApiKey } : undefined,
          anthropic: this.config.anthropicApiKey ? { apiKey: this.config.anthropicApiKey } : undefined,
        });
      } catch (err: any) {
        console.error('[Orchestrator] AI analysis failed:', err.message);
        // Non-fatal - return data without AI analysis
      }
    }

    // ── Phase 5: Log to Supabase (non-blocking) ────────────────────────────
    this.logAnalysis(requestId, entity, dilResponse, analysis, Date.now() - startTime).catch(
      err => console.error('[Orchestrator] Logging error:', err.message)
    );

    // ── Build Response ──────────────────────────────────────────────────────
    const newsSentiment = newsData ? calculateNewsSentiment(newsData) : null;

    return {
      success: true,
      entity,
      consensus: dilResponse.consensus,
      analysis,
      newsContext: newsData ? {
        headlines: newsData.recentHeadlines,
        sentiment: newsSentiment?.label || 'neutral',
        topics: newsData.keyTopics,
      } : undefined,
      wikiContext: wikiData ? {
        description: wikiData.description,
        founded: wikiData.foundedYear,
        headquarters: wikiData.headquarters,
      } : undefined,
      metadata: {
        processingTimeMs: Date.now() - startTime,
        sourcesUsed: dilResponse.sourcesAttempted,
        sourcesFailed: dilResponse.sourcesFailed,
        cacheHit: dilResponse.cacheHit,
        entityConfidence: entity.confidence,
        dataConfidence: dilResponse.consensus.overallConfidence,
        requestId,
      },
    };
  }

  private buildFetchers(entity: ResolvedEntity) {
    const pythonUrl = this.config.pythonServiceUrl || 'http://localhost:8001';
    const fmpKey = this.config.fmpApiKey;
    const avKey = this.config.alphaVantageApiKey;

    return {
      // yfinance via Python service
      yfinance: async (ticker: string, _region: string) => {
        try {
          const res = await fetch(`${pythonUrl}/fetch/yfinance?ticker=${encodeURIComponent(ticker)}`, {
            signal: AbortSignal.timeout(8000),
          });
          if (!res.ok) return null;
          const data = await res.json();
          return data.success ? data.data : null;
        } catch {
          return null;
        }
      },

      // NSE via Python service
      nse: async (ticker: string) => {
        try {
          const res = await fetch(`${pythonUrl}/fetch/nse?symbol=${encodeURIComponent(ticker)}`, {
            signal: AbortSignal.timeout(8000),
          });
          if (!res.ok) return null;
          const data = await res.json();
          return data.success ? data.data : null;
        } catch {
          return null;
        }
      },

      // FMP API (if key available)
      fmp: fmpKey ? async (ticker: string) => {
        try {
          const [profile, ratios] = await Promise.all([
            fetch(`https://financialmodelingprep.com/api/v3/profile/${ticker}?apikey=${fmpKey}`).then(r => r.json()),
            fetch(`https://financialmodelingprep.com/api/v3/ratios-ttm/${ticker}?apikey=${fmpKey}`).then(r => r.json()),
          ]);

          const p = profile?.[0] || {};
          const r = ratios?.[0] || {};

          return {
            marketCap: p.mktCap || null,
            currentPrice: p.price || null,
            revenue: p.revenue || null,
            grossMargin: r.grossProfitMarginTTM ? r.grossProfitMarginTTM * 100 : null,
            operatingMargin: r.operatingProfitMarginTTM ? r.operatingProfitMarginTTM * 100 : null,
            netMargin: r.netProfitMarginTTM ? r.netProfitMarginTTM * 100 : null,
            peRatio: r.peRatioTTM || null,
            pbRatio: r.priceToBookRatioTTM || null,
            debtToEquity: r.debtEquityRatioTTM || null,
            roe: r.returnOnEquityTTM ? r.returnOnEquityTTM * 100 : null,
            roa: r.returnOnAssetsTTM ? r.returnOnAssetsTTM * 100 : null,
          };
        } catch {
          return null;
        }
      } : undefined,

      // Alpha Vantage (if key available)
      alphaVantage: avKey ? async (ticker: string) => {
        try {
          const res = await fetch(
            `https://www.alphavantage.co/query?function=OVERVIEW&symbol=${ticker}&apikey=${avKey}`
          );
          const data = await res.json();
          if (data.Note || data.Information) return null; // Rate limited

          return {
            marketCap: data.MarketCapitalization ? parseFloat(data.MarketCapitalization) : null,
            revenue: data.RevenueTTM ? parseFloat(data.RevenueTTM) : null,
            ebitda: data.EBITDA ? parseFloat(data.EBITDA) : null,
            peRatio: data.TrailingPE ? parseFloat(data.TrailingPE) : null,
            pbRatio: data.PriceToBookRatio ? parseFloat(data.PriceToBookRatio) : null,
            eps: data.EPS ? parseFloat(data.EPS) : null,
            grossMargin: data.GrossProfitTTM && data.RevenueTTM
              ? (parseFloat(data.GrossProfitTTM) / parseFloat(data.RevenueTTM)) * 100
              : null,
          };
        } catch {
          return null;
        }
      } : undefined,

      // Wikipedia
      wikipedia: async (companyName: string) => {
        try {
          const { financialData } = await fetchWikipediaData(companyName);
          return Object.keys(financialData).length > 0 ? financialData : null;
        } catch {
          return null;
        }
      },
    };
  }

  private async logAnalysis(
    requestId: string,
    entity: ResolvedEntity,
    dilResponse: any,
    analysis: AIAnalysisResponse | null,
    processingTimeMs: number
  ): Promise<void> {
    try {
      if (!this.config.supabaseClient) return;

      await this.config.supabaseClient.from('api_usage').insert({
        user_identifier: 'system',
        endpoint: '/api/analyze',
        industry_searched: entity?.industry || 'Unknown',
        request_timestamp: new Date().toISOString(),
        response_time_ms: processingTimeMs,
        success: true,
        cache_hit: dilResponse.cacheHit,
      });

      if (analysis) {
        await this.config.supabaseClient.from('analysis_results').insert({
          entity_id: entity.entityId,
          entity_name: entity.canonicalName,
          analysis_type: 'overview',
          executive_summary: analysis.executiveSummary,
          key_findings: JSON.stringify(analysis.keyFindings),
          risks: JSON.stringify(analysis.risks),
          opportunities: JSON.stringify(analysis.opportunities),
          ai_model: analysis.model,
          ai_confidence: analysis.confidence,
          tokens_used: analysis.tokensUsed,
          validation_passed: true,
          expires_at: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
        });
      }
    } catch (err) {
      // Non-fatal
    }
  }

  private errorResponse(requestId: string, startTime: number, error: string): FullAnalysisResponse {
    return {
      success: false,
      entity: null,
      consensus: null,
      analysis: null,
      metadata: {
        processingTimeMs: Date.now() - startTime,
        sourcesUsed: [],
        sourcesFailed: [],
        cacheHit: false,
        entityConfidence: 0,
        dataConfidence: 0,
        requestId,
      },
      error,
    };
  }

  async runCleanup(): Promise<void> {
    await runDailyCleanup(this.config.supabaseClient);
  }
}

// ─── Singleton factory ────────────────────────────────────────────────────────
// Use this in your Next.js API routes

let orchestratorInstance: EBITAOrchestrator | null = null;

export function getOrchestrator(): EBITAOrchestrator {
  if (!orchestratorInstance) {
    orchestratorInstance = new EBITAOrchestrator({
      supabaseClient: null, // Will be set via setSupabaseClient
      pythonServiceUrl: process.env.PYTHON_SERVICE_URL || 'http://localhost:8001',
      groqApiKey: process.env.GROQ_API_KEY,
      anthropicApiKey: process.env.ANTHROPIC_API_KEY,
      fmpApiKey: process.env.FMP_API_KEY,
      alphaVantageApiKey: process.env.ALPHA_VANTAGE_API_KEY,
      indianCompaniesTxtPath: process.env.INDIAN_COMPANIES_TXT_PATH || './datasets/indian_companies.txt',
    });
  }
  return orchestratorInstance;
}

export function setSupabaseClient(client: any): void {
  getOrchestrator()['config'].supabaseClient = client;
}
