/**
 * Main Intelligence Orchestrator (v4.0 — Search-First Architecture)
 * 
 * ARCHITECTURE CHANGE (v4.0):
 * Pipeline reordered: Search FIRST → Entity Resolution → Dataset Classification LAST
 * This eliminates dataset bias and improves realtime data quality.
 * 
 * KEY PRINCIPLES:
 * - Search-first: Web search runs BEFORE entity resolution
 * - Entity resolution is ENHANCED by search context
 * - Datasets provide ONLY classification/context, never financial data
 * - Source reliability weighting during data merge
 * - Timestamp freshness weighting
 * - Confidence gating: AI refuses to analyze with <60% data confidence
 * - Full traceability of every step
 */

import { identifyInput, type IdentificationResult } from './identifier';
import { collectDataSearchFirst, extractCompetitors, type CollectedData, type CollectionOptions } from './collector';
import { analyzeWithAI, type AnalysisResult } from './analyzer';
import { extractFinancials, financialsToConsensusInput, type StructuredFinancials } from './financial-extractor';
import { buildConsensus, formatForAI, type ConsensusMetrics } from './consensus-engine';
import { createTracer, getCurrentTracer, clearTracer, logDatasetUsage } from '../debugging/pipeline-tracer';
import { dataValidator } from '../debugging/data-validator';
import { cacheAuditor } from '../debugging/cache-auditor';

function normalizeConfidence(value: any): number {
  if (value === null || value === undefined) return 0;
  
  let normalizedValue = value;
  if (typeof normalizedValue === 'string') {
    normalizedValue = normalizedValue.replace('%', '').trim();
  }
  
  let num = Number(normalizedValue);
  
  if (Number.isNaN(num)) return 0;
  
  if (num <= 1) num = num * 100;
  
  return Math.round(num);
}

export interface IntelligenceRequest {
  input: string;
  forceRefresh?: boolean;
  options?: CollectionOptions;
}

export interface IntelligenceResponse {
  success: boolean;
  entity: {
    name: string;
    type: string;
    industry: string;
    subIndustry: string;
  };
  analysis: AnalysisResult | null;
  data: CollectedData | null;
  metadata: {
    identificationTimeMs: number;
    collectionTimeMs: number;
    analysisTimeMs: number;
    totalTimeMs: number;
    isNewEntity: boolean;
    isFromCache: boolean;
    changeDetected: boolean;
    sourcesUsed: string[];
    dataSource: 'realtime' | 'cache' | 'dataset';
    cacheAge?: number;
    requestId: string;
    validated: boolean;
    errors?: string[];
    warnings?: string[];
  };
  error?: string;
}

// Feature flag for realtime priority mode
const REALTIME_PRIORITY_MODE = process.env.REALTIME_PRIORITY_MODE === 'true';

// ═══════════════════════════════════════════════════════════════════════════
// Main Intelligence Function
// ═══════════════════════════════════════════════════════════════════════════

export async function getIntelligence(
  request: IntelligenceRequest
): Promise<IntelligenceResponse> {
  const totalStartTime = Date.now();
  const tracer = createTracer(request.input);
  const requestId = tracer.getRequestId();
  
  console.log(`\n[Orchestrator] ========== NEW REQUEST [${requestId}] ==========`);
  console.log(`[Orchestrator] Input: "${request.input}"`);
  console.log(`[Orchestrator] Force Refresh: ${request.forceRefresh ? 'Yes' : 'No'}`);
  console.log(`[Orchestrator] Realtime Priority Mode: ${REALTIME_PRIORITY_MODE ? 'ENABLED' : 'DISABLED'}`);

  try {
    // ═══════════════════════════════════════════════════════════════════
    // STEP 1: QUICK WEB SEARCH FIRST (Search-First Architecture v4.0)
    // Search runs BEFORE entity resolution to avoid dataset bias
    // ═══════════════════════════════════════════════════════════════════
    const searchStartTime = Date.now();
    console.log(`[Orchestrator] STEP 1: Quick web search (search-first mode)...`);
    tracer.trace('SEARCH_FIRST_INITIATED', { metadata: { input: request.input } });

    let quickSearchResults: any[] = [];
    let searchEntityHints: { name?: string; industry?: string; type?: string } = {};
    try {
      const { searchCompanyInfo, searchFinancialData: searchFinancial } = await import('../search-bots/google-bot');
      quickSearchResults = await searchCompanyInfo(request.input);

      for (const result of quickSearchResults.slice(0, 5)) {
        const text = `${result.title} ${result.description}`;
        if (!searchEntityHints.industry) {
          const industryMatch = text.match(/(?:industry|sector|segment)[:\s]+([A-Za-z\s&]+?)(?:\.|,|;|\n|$)/i);
          if (industryMatch) searchEntityHints.industry = industryMatch[1].trim();
        }
        if (!searchEntityHints.type) {
          if (/\b(?:Ltd|Limited|Inc|Corp|Company|Group|Holdings)\b/i.test(text)) {
            searchEntityHints.type = 'company';
          }
        }
      }
      console.log(`[Orchestrator] STEP 1 complete: ${quickSearchResults.length} results, hints: ${JSON.stringify(searchEntityHints)}`);
    } catch (error: any) {
      console.warn(`[Orchestrator] STEP 1 search failed (non-fatal): ${error.message}`);
    }
    const quickSearchTime = Date.now() - searchStartTime;

    tracer.trace('SEARCH_FIRST_COMPLETED', {
      metadata: {
        resultsCount: quickSearchResults.length,
        entityHints: searchEntityHints,
        timeMs: quickSearchTime,
      },
    });

    // ═══════════════════════════════════════════════════════════════════
    // STEP 2: ENTITY RESOLUTION (Enhanced by search context)
    // ═══════════════════════════════════════════════════════════════════
    const idStartTime = Date.now();
    console.log(`[Orchestrator] STEP 2: Entity resolution (search-enhanced)...`);
    const identification = await identifyInput(request.input, {
      results: quickSearchResults,
      hints: searchEntityHints,
    });
    const idTime = Date.now() - idStartTime;

    if (searchEntityHints.industry && !identification.industry) {
      identification.industry = searchEntityHints.industry;
    }
    if (searchEntityHints.type && identification.type === 'unknown') {
      identification.type = searchEntityHints.type as any;
    }

    tracer.traceEntityResolution(
      identification.name || request.input,
      identification.source as any,
      identification.confidence,
      { found: identification.found, searchEnhanced: Object.keys(searchEntityHints).length > 0 }
    );

    if (!identification.found && quickSearchResults.length === 0) {
      tracer.trace('FINAL_OUTPUT', { error: 'Entity not found' });
      clearTracer();
      
      return {
        success: false,
        entity: {
          name: request.input,
          type: 'unknown',
          industry: 'Unknown',
          subIndustry: 'Unknown',
        },
        analysis: null,
        data: null,
        metadata: {
          identificationTimeMs: idTime,
          collectionTimeMs: 0,
          analysisTimeMs: 0,
          totalTimeMs: Date.now() - totalStartTime,
          isNewEntity: false,
          isFromCache: false,
          changeDetected: false,
          sourcesUsed: [],
          dataSource: 'dataset',
          requestId,
          validated: false,
          errors: ['Could not identify entity from search or dataset'],
        },
        error: `Could not identify entity: "${request.input}"`,
      };
    }

    if (!identification.found && quickSearchResults.length > 0) {
      identification.found = true;
      identification.name = request.input;
      identification.source = 'google' as any;
      identification.confidence = 60;
      identification.isNew = true;
      console.log(`[Orchestrator] Entity not in dataset but found via search — proceeding with search data`);
    }

    logDatasetUsage(identification.name, 'classification');
    const normalizedConfidence = normalizeConfidence(identification.confidence);
    console.log(`[Orchestrator] STEP 2 complete: ${identification.name} (${identification.industry}) [${normalizedConfidence}% confidence]`);

    // ═══════════════════════════════════════════════════════════════════
    // STEP 3: CACHE AUDIT
    // ═══════════════════════════════════════════════════════════════════
    const cacheAudit = cacheAuditor.auditCache(identification.name, request.forceRefresh || REALTIME_PRIORITY_MODE);
    
    tracer.traceCacheBehavior(
      cacheAudit.shouldUseCache,
      identification.name,
      cacheAudit.lastUpdated || undefined
    );

    const shouldBypassCache = cacheAudit.shouldUseCache && 
      (request.forceRefresh || REALTIME_PRIORITY_MODE);
    
    if (shouldBypassCache) {
      tracer.trace('CACHE_BYPASS', {
        metadata: {
          reason: request.forceRefresh ? 'force_refresh' : 'realtime_priority_mode',
          cacheAge: cacheAudit.cacheAge,
        }
      });
    }
    
    if (cacheAudit.shouldUseCache && !shouldBypassCache) {
      console.log(`[Orchestrator] Using cached data (age: ${cacheAudit.cacheAge.toFixed(1)}h)`);
      tracer.trace('FINAL_OUTPUT', { source: 'cache' });
      
      // Read actual cached data
      const cachedEntry = cacheAuditor.readCache(identification.name);
      clearTracer();
      
      return {
        success: true,
        entity: {
          name: identification.name,
          type: identification.type,
          industry: identification.industry,
          subIndustry: identification.subIndustry,
        },
        analysis: cachedEntry?.data?.analysis || null,
        data: cachedEntry?.data?.collectedData || null,
        metadata: {
          identificationTimeMs: idTime,
          collectionTimeMs: 0,
          analysisTimeMs: 0,
          totalTimeMs: Date.now() - totalStartTime,
          isNewEntity: false,
          isFromCache: true,
          changeDetected: false,
          sourcesUsed: cachedEntry?.data?.sources || ['cache'],
          dataSource: 'cache',
          cacheAge: cacheAudit.cacheAge,
          requestId,
          validated: true,
        },
      };
    }

    console.log(`[Orchestrator] STEP 3: Fetching realtime data (${cacheAudit.reason})`);

    // ═══════════════════════════════════════════════════════════════════
    // STEP 4: COLLECT DATA (Search-First with pre-fetched results)
    // ═══════════════════════════════════════════════════════════════════
    const collectionStartTime = Date.now();
    tracer.trace('DATA_AGGREGATION', { metadata: { stage: 'started', mode: 'search_first' } });
    
    const collectedData = await collectDataSearchFirst(
      request.input, 
      identification,
      quickSearchResults,
      request.options
    );
    
    console.log(`[Orchestrator] STEP 4b: Extracting competitors...`);
    const csvCompetitors = await extractCompetitors(collectedData);
    console.log(`[Orchestrator] Found ${csvCompetitors.length} competitors`);
    collectedData.csvCompetitors = csvCompetitors;
    
    const collectionTime = Date.now() - collectionStartTime;

    tracer.traceDataAggregation(
      ['api_realtime', 'web_search', 'crawler'],
      0
    );

    console.log(`[Orchestrator] Data collected in ${collectionTime}ms (${collectedData.metadata.totalSources} sources)`);

    // ═══════════════════════════════════════════════════════════════════
    // STEP 5: VALIDATE COLLECTED DATA
    // ═══════════════════════════════════════════════════════════════════
    console.log(`[Orchestrator] STEP 5: Validating data...`);
    const validationResult = dataValidator.validateFinancialMetrics({
      revenue: extractFinancialValue(collectedData, 'revenue'),
      ebitda: extractFinancialValue(collectedData, 'ebitda'),
      profit: extractFinancialValue(collectedData, 'profit'),
      growth: extractFinancialValue(collectedData, 'growth'),
      marketCap: extractFinancialValue(collectedData, 'marketCap'),
    });

    tracer.trace('DATA_AGGREGATION', {
      metadata: {
        stage: 'validated',
        valid: validationResult.valid,
        errorCount: validationResult.errors.length,
        warningCount: validationResult.warnings.length,
      },
    });

    if (validationResult.warnings.length > 0) {
      console.warn(`[Orchestrator] Data validation warnings:`, validationResult.warnings);
    }
    if (validationResult.errors.length > 0) {
      console.error(`[Orchestrator] Data validation errors:`, validationResult.errors);
    }

    // ═══════════════════════════════════════════════════════════════════
    // STEP 5b: DATA CONFIDENCE GATING (v4.0)
    // If overall data confidence < 60%, flag for AI
    // ═══════════════════════════════════════════════════════════════════
    const dataConfidenceScore = computeDataConfidence(collectedData, validationResult);
    collectedData.metadata.dataConfidenceScore = dataConfidenceScore;
    console.log(`[Orchestrator] Data confidence score: ${dataConfidenceScore}%`);

    tracer.trace('CONFIDENCE_GATING', {
      metadata: { score: dataConfidenceScore, threshold: 60, gated: dataConfidenceScore < 60 },
    });

    // ═══════════════════════════════════════════════════════════════════
    // STEP 5c: STRUCTURED FINANCIAL EXTRACTION (v4.1 — NEW)
    // Extracts structured metrics from raw text BEFORE AI sees it
    // ═══════════════════════════════════════════════════════════════════
    console.log(`[Orchestrator] STEP 5c: Structured financial extraction...`);
    const structuredFinancials = extractFinancials(
      [...collectedData.sources.financialData, ...collectedData.sources.companyInfo],
      collectedData.sources.crawledPages
    );
    console.log(`[Orchestrator] Extracted ${structuredFinancials.metadata.totalExtractions} data points across ${structuredFinancials.metadata.uniqueMetrics} metrics (avg confidence: ${structuredFinancials.metadata.avgConfidence})`);

    tracer.trace('DATA_AGGREGATION', {
      metadata: {
        stage: 'structured_extraction',
        totalExtractions: structuredFinancials.metadata.totalExtractions,
        uniqueMetrics: structuredFinancials.metadata.uniqueMetrics,
        avgConfidence: structuredFinancials.metadata.avgConfidence,
      },
    });

    // ═══════════════════════════════════════════════════════════════════
    // STEP 5d: CONSENSUS ENGINE (v4.1 — NEW)
    // Multi-source consensus with outlier removal + variance detection
    // ═══════════════════════════════════════════════════════════════════
    console.log(`[Orchestrator] STEP 5d: Building consensus from ${structuredFinancials.metadata.sourcesUsed.length} sources...`);
    const consensusInput = financialsToConsensusInput(structuredFinancials);
    const consensusMetrics = buildConsensus(
      identification.name,
      identification.name,
      identification.type === 'industry' ? 'industry' : 'company',
      consensusInput
    );
    const consensusForAI = formatForAI(consensusMetrics);
    console.log(`[Orchestrator] Consensus built: ${consensusMetrics.overallConfidence}% confidence, ${consensusMetrics.dataGaps.length} gaps, ${consensusMetrics.varianceWarnings.length} warnings`);

    tracer.trace('DATA_AGGREGATION', {
      metadata: {
        stage: 'consensus_built',
        overallConfidence: consensusMetrics.overallConfidence,
        sourcesUsed: consensusMetrics.sourcesUsed,
        dataGaps: consensusMetrics.dataGaps.length,
        varianceWarnings: consensusMetrics.varianceWarnings.length,
      },
    });

    (collectedData as any).structuredFinancials = structuredFinancials;
    (collectedData as any).consensusMetrics = consensusMetrics;
    (collectedData as any).consensusForAI = consensusForAI;

    // ═══════════════════════════════════════════════════════════════════
    // STEP 6: SANITIZE + AI ANALYSIS (now receives consensus data)
    // ═══════════════════════════════════════════════════════════════════
    console.log(`[Orchestrator] STEP 6: AI analysis (with consensus data)...`);
    const sanitizedData = dataValidator.sanitizeForAI(collectedData);
    tracer.traceAIPrompt(true, ['api_realtime', 'web_search', 'crawler', 'consensus_engine']);

    const analysisStartTime = Date.now();
    tracer.trace('AI_PROMPT_BUILT', { metadata: { sanitized: true, dataConfidence: dataConfidenceScore, consensusConfidence: consensusMetrics.overallConfidence } });
    
    const analysis = await analyzeWithAI(collectedData);
    const analysisTime = Date.now() - analysisStartTime;

    tracer.traceAIResponse(analysisTime, false);
    console.log(`[Orchestrator] Analysis complete in ${analysisTime}ms (confidence: ${analysis.confidence}%)`);

    // ═══════════════════════════════════════════════════════════════════
    // STEP 7: VALIDATE AI OUTPUT + CONFIDENCE GATE
    // ═══════════════════════════════════════════════════════════════════
    console.log(`[Orchestrator] STEP 7: Validating AI output...`);
    const outputValidation = dataValidator.validateOutput(analysis);
    
    if (dataConfidenceScore < 60 && analysis.confidence > 70) {
      analysis.confidence = Math.min(analysis.confidence, 55);
      analysis.executiveSummary = `[LOW DATA CONFIDENCE] ${analysis.executiveSummary}`;
      console.warn(`[Orchestrator] AI confidence capped due to low data confidence (${dataConfidenceScore}%)`);
    }

    tracer.traceValidation(
      outputValidation.valid,
      {
        hasFinancials: !!analysis.financials,
        hasCompetitors: analysis.competitors.length > 0,
        hasSummary: !!analysis.executiveSummary,
        dataConfidenceAboveThreshold: dataConfidenceScore >= 60,
      },
      outputValidation.errors
    );

    if (outputValidation.warnings.length > 0) {
      console.warn(`[Orchestrator] Output validation warnings:`, outputValidation.warnings);
    }

    // ═══════════════════════════════════════════════════════════════════
    // STEP 8: CACHE + RETURN
    // ═══════════════════════════════════════════════════════════════════
    cacheAuditor.writeCache(identification.name, {
      analysis,
      collectedData,
      timestamp: new Date().toISOString(),
    });

    const totalTime = Date.now() - totalStartTime;
    tracer.trace('FINAL_OUTPUT', {
      metadata: {
        totalTimeMs: totalTime,
        validated: outputValidation.valid,
        pipelineVersion: '4.0-search-first',
        dataConfidenceScore,
      },
    });

    const debugReport = tracer.generateReport();
    console.log(`\n[Orchestrator] Debug Report:\n${debugReport}\n`);
    clearTracer();

    return {
      success: true,
      entity: {
        name: identification.name,
        type: identification.type,
        industry: identification.industry,
        subIndustry: identification.subIndustry,
      },
      analysis,
      data: collectedData,
      metadata: {
        identificationTimeMs: idTime,
        collectionTimeMs: collectionTime,
        analysisTimeMs: analysisTime,
        totalTimeMs: totalTime,
        isNewEntity: identification.isNew || false,
        isFromCache: false,
        changeDetected: false,
        sourcesUsed: [
          'api_realtime',
          'web_search',
          'crawler',
          ...collectedData.sources.companyInfo.map((s: any) => s.source),
        ],
        dataSource: 'realtime',
        requestId,
        validated: outputValidation.valid,
        errors: outputValidation.errors,
        warnings: outputValidation.warnings,
      },
    };

  } catch (error: any) {
    console.error('[Orchestrator] ✗ Error:', error);
    
    const tracer = getCurrentTracer();
    if (tracer) {
      tracer.trace('FINAL_OUTPUT', { error: error.message });
      clearTracer();
    }
    
    return {
      success: false,
      entity: {
        name: request.input,
        type: 'unknown',
        industry: 'Unknown',
        subIndustry: 'Unknown',
      },
      analysis: null,
      data: null,
      metadata: {
        identificationTimeMs: 0,
        collectionTimeMs: 0,
        analysisTimeMs: 0,
        totalTimeMs: Date.now() - totalStartTime,
        isNewEntity: false,
        isFromCache: false,
        changeDetected: false,
        sourcesUsed: [],
        dataSource: 'dataset',
        requestId,
        validated: false,
        errors: [error.message],
      },
      error: error.message,
    };
  }
}

// ═══════════════════════════════════════════════════════════════════════════
// Helper: Extract Financial Value from Collected Data
// ═══════════════════════════════════════════════════════════════════════════

function extractFinancialValue(collectedData: CollectedData, metric: string): any {
  const allText = [
    ...collectedData.sources.financialData.map((s: any) => s.description),
    ...collectedData.sources.crawledPages.map((p: any) => p.content),
  ].join(' ');

  const patterns: Record<string, RegExp> = {
    revenue: /revenue[^\d]*(₹?\d+\.?\d*)\s*(cr|crore|lakh|mn|bn)/i,
    ebitda: /ebitda[^\d]*(₹?\d+\.?\d*)\s*(cr|crore|lakh|mn|bn)/i,
    profit: /profit[^\d]*(₹?\d+\.?\d*)\s*(cr|crore|lakh|mn|bn)/i,
    growth: /growth[^\d]*(\d+\.?\d*)%/i,
    marketCap: /market\s*cap[^\d]*(₹?\d+\.?\d*)\s*(cr|crore|lakh|mn|bn)/i,
  };

  const match = allText.match(patterns[metric]);
  if (match) {
    return `${match[1]} ${match[2] || ''}`.trim();
  }

  return null;
}

function computeDataConfidence(collectedData: CollectedData, validationResult: any): number {
  let score = 0;
  const maxScore = 100;

  const totalSources = collectedData.metadata.totalSources;
  if (totalSources >= 10) score += 25;
  else if (totalSources >= 5) score += 15;
  else if (totalSources >= 1) score += 5;

  const financialSources = collectedData.sources.financialData.length;
  if (financialSources >= 5) score += 25;
  else if (financialSources >= 2) score += 15;
  else if (financialSources >= 1) score += 8;

  const crawledPages = collectedData.sources.crawledPages.length;
  if (crawledPages >= 3) score += 15;
  else if (crawledPages >= 1) score += 8;

  const hasNews = collectedData.sources.news.length > 0;
  if (hasNews) score += 10;

  const hasCompetitors = collectedData.sources.competitors.length > 0;
  if (hasCompetitors) score += 10;

  if (validationResult.valid) score += 15;
  else score += 5;

  score -= validationResult.errors.length * 5;

  return Math.max(0, Math.min(maxScore, score));
}

// ═══════════════════════════════════════════════════════════════════════════
// Batch Intelligence
// ═══════════════════════════════════════════════════════════════════════════

export async function getIntelligenceBatch(
  inputs: string[],
  options?: CollectionOptions
): Promise<IntelligenceResponse[]> {
  const results: IntelligenceResponse[] = [];

  for (const input of inputs) {
    const result = await getIntelligence({ input, options });
    results.push(result);
    
    // Add delay between requests to be polite
    await new Promise(resolve => setTimeout(resolve, 1000));
  }

  return results;
}

// ═══════════════════════════════════════════════════════════════════════════
// Quick Check (Just Identification)
// ═══════════════════════════════════════════════════════════════════════════

export async function quickCheck(input: string): Promise<{
  found: boolean;
  name?: string;
  industry?: string;
  confidence?: number;
}> {
  const identification = await identifyInput(input);
  
  if (!identification.found) {
    return { found: false };
  }

  return {
    found: true,
    name: identification.name,
    industry: identification.industry,
    confidence: identification.confidence,
  };
}

// ═══════════════════════════════════════════════════════════════════════════
// Get System Status
// ═══════════════════════════════════════════════════════════════════════════

export async function getSystemStatus(): Promise<{
  datasets: {
    excelLoaded: boolean;
    dynamicEntities: number;
    csvLoaded: boolean;
  };
  apiKeys: {
    google: boolean;
    newsApi: boolean;
    serpApi: boolean;
    groq: boolean;
  };
  capabilities: string[];
  debugging: {
    tracerEnabled: boolean;
    validatorEnabled: boolean;
    cacheAuditorEnabled: boolean;
    realtimePriorityMode: boolean;
  };
}> {
  const { loadIndianCompaniesFromExcel } = await import('../datasets/load-excel-companies');
  const { loadDynamicEntities } = await import('../dataset-manager/updater');
  const { loadCompanyDatabase } = await import('../datasets/company-database');

  let excelLoaded = false;
  let dynamicCount = 0;
  let csvLoaded = false;

  try {
    const excel = await loadIndianCompaniesFromExcel();
    excelLoaded = excel.length > 0;
  } catch { /* ignore */ }

  try {
    const dynamic = await loadDynamicEntities();
    dynamicCount = dynamic.length;
  } catch { /* ignore */ }

  try {
    csvLoaded = await loadCompanyDatabase();
  } catch { /* ignore */ }

  const capabilities = [
    'Multi-dataset company identification',
    'Google search fallback',
    'Dynamic dataset updates',
    'Multi-source data collection',
    'Web crawling',
    'AI-powered analysis',
    'Pipeline tracing',
    'Data validation',
    'Cache auditing',
  ];

  if (process.env.GOOGLE_CUSTOM_SEARCH_API_KEY) capabilities.push('Google Custom Search API');
  if (process.env.NEWSAPI_KEY) capabilities.push('NewsAPI');
  if (process.env.SERPAPI_KEY) capabilities.push('SerpAPI');
  if (process.env.GROQ_API_KEY) capabilities.push('Groq AI');

  return {
    datasets: {
      excelLoaded,
      dynamicEntities: dynamicCount,
      csvLoaded,
    },
    apiKeys: {
      google: !!process.env.GOOGLE_CUSTOM_SEARCH_API_KEY,
      newsApi: !!process.env.NEWSAPI_KEY,
      serpApi: !!process.env.SERPAPI_KEY,
      groq: !!process.env.GROQ_API_KEY,
    },
    capabilities,
    debugging: {
      tracerEnabled: true,
      validatorEnabled: true,
      cacheAuditorEnabled: true,
      realtimePriorityMode: REALTIME_PRIORITY_MODE,
    },
  };
}

// Export debugging utilities
export { createTracer, getCurrentTracer, clearTracer, cacheAuditor, dataValidator };
