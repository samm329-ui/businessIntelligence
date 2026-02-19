/**
 * Intelligence API Route
 * 
 * Main API endpoint for the intelligence system.
 * POST /api/intelligence
 * 
 * Body: {
 *   input: string,           // Company, industry, or brand name
 *   forceRefresh?: boolean,  // Force fresh data collection
 *   options?: {              // Collection options
 *     maxSources?: number,
 *     newsDays?: number,
 *     includeCrawling?: boolean
 *   }
 * }
 * 
 * Version: 6.0 (Upgrade 5) - Added mapToAnalysisResponse for contract normalization
 */

import { NextRequest, NextResponse } from 'next/server';
import { getIntelligence, getSystemStatus, quickCheck } from '@/lib/intelligence/orchestrator';
import type { AnalysisResponse } from '@/types/analysis';

/**
 * mapToAnalysisResponse - Normalizes orchestrator output to typed contract
 * 
 * This function handles field name variations across versions and ensures
 * the frontend always receives consistent typed data.
 */
function mapToAnalysisResponse(result: any): AnalysisResponse {
  // Handle null/undefined result
  if (!result) {
    return {
      success: false,
      error: {
        type: 'NULL_RESULT',
        message: 'Orchestrator returned null',
        recoverable: false,
      },
      metadata: {
        processingTimeMs: 0,
        requestId: crypto.randomUUID(),
      },
    };
  }

  // Handle explicit success: false
  if (result.success === false) {
    return {
      success: false,
      error: result.error || {
        type: 'UNKNOWN_ERROR',
        message: 'Unknown error from orchestrator',
        recoverable: true,
      },
      metadata: result.metadata,
    };
  }

  // Normalize entity field (handle variations)
  const entity = result.entity ? {
    type: result.entity.type || result.entity.entityType || 'unknown',
    name: result.entity.name || result.entity.canonicalName || 'Unknown',
    id: result.entity.id || result.entity.entityId || 'unknown',
    confidence: result.entity.confidence || result.entity.confidenceScore || 0,
    industry: result.entity.industry || result.entity.sector,
    subIndustry: result.entity.subIndustry || result.entity.subSector,
    sector: result.entity.sector,
    ticker: result.entity.ticker || result.entity.tickerNSE,
    parentCompany: result.entity.parentCompany || result.entity.parent_entity_id,
  } : undefined;

  // Normalize analysis content (handle summary variations)
  const analysisContent = result.analysis || result.data?.analysis;
  const analysis = analysisContent ? {
    summary: analysisContent.summary || analysisContent.executiveSummary || '',
    executiveSummary: analysisContent.executiveSummary || analysisContent.summary,
    keyFindings: analysisContent.keyFindings || analysisContent.key_findings || [],
    risks: analysisContent.risks || [],
    opportunities: analysisContent.opportunities || analysisContent.opportunities || [],
    industryOutlook: analysisContent.industryOutlook || analysisContent.industry_outlook,
    competitorAnalysis: analysisContent.competitorAnalysis,
    financialHealth: analysisContent.financialHealth,
    investmentVerdict: analysisContent.investmentVerdict,
    aiGenerated: analysisContent.aiGenerated || analysisContent.ai_generated || false,
    hallucinationChecked: analysisContent.hallucinationChecked || analysisContent.hallucination_checked || false,
    citations: analysisContent.citations || [],
  } : undefined;

  // Normalize financial metrics
  const financialData = result.data?.financials || result.financials || result.data;
  const financials = financialData ? {
    revenue: financialData.revenue || null,
    revenueGrowth: financialData.revenueGrowth || financialData.revenue_growth || null,
    ebitda: financialData.ebitda || null,
    ebitdaMargin: financialData.ebitdaMargin || financialData.ebitda_margin || null,
    netProfit: financialData.netProfit || financialData.net_income || null,
    netMargin: financialData.netMargin || financialData.net_margin || null,
    grossProfit: financialData.grossProfit || financialData.gross_profit || null,
    grossMargin: financialData.grossMargin || financialData.gross_margin || null,
    operatingProfit: financialData.operatingProfit || financialData.operating_income || null,
    operatingMargin: financialData.operatingMargin || financialData.operating_margin || null,
    marketCap: financialData.marketCap || financialData.market_cap || null,
    peRatio: financialData.peRatio || financialData.pe_ratio || null,
    debtToEquity: financialData.debtToEquity || financialData.debt_to_equity || null,
    currentRatio: financialData.currentRatio || financialData.current_ratio || null,
    roe: financialData.roe || null,
    roa: financialData.roa || null,
    eps: financialData.eps || null,
    dividendYield: financialData.dividendYield || financialData.dividend_yield || null,
    week52High: financialData.week52High || financialData.week_52_high || null,
    week52Low: financialData.week52Low || financialData.week_52_low || null,
  } : undefined;

  // Build normalized response
  return {
    success: true,
    entity,
    data: {
      financials,
      marketData: result.data?.marketData || result.marketData || result.data?.market_data,
      sources: result.data?.sources || result.sources || [],
      confidence: result.data?.confidence || result.confidence || result.metadata?.dataConfidenceScore || 0,
      warnings: result.data?.warnings || result.warnings || result.metadata?.validationWarnings || [],
    },
    analysis,
    metadata: {
      processingTimeMs: result.metadata?.processingTimeMs || result.metadata?.totalTimeMs || 0,
      entityResolutionTimeMs: result.metadata?.entityResolutionTimeMs,
      dataFetchTimeMs: result.metadata?.dataFetchTimeMs,
      analysisTimeMs: result.metadata?.analysisTimeMs,
      sourcesUsed: result.metadata?.sourcesUsed || result.sourcesUsed || [],
      validationWarnings: result.metadata?.validationWarnings || [],
      requestId: result.metadata?.requestId || crypto.randomUUID(),
      dataConfidenceScore: result.metadata?.dataConfidenceScore || result.data?.confidence || 0,
    },
  };
}

export async function POST(req: NextRequest) {
  const startTime = Date.now();

  try {
    const body = await req.json();
    const { input, forceRefresh, options, hints } = body;

    if (!input || typeof input !== 'string' || input.trim().length < 2) {
      return NextResponse.json(
        { success: false, error: 'Input is required and must be at least 2 characters' },
        { status: 400 }
      );
    }

    console.log(`\n[API] Intelligence request: "${input}"`);
    if (hints) {
      console.log(`[API] Client hints: sector=${hints.sector}, industry=${hints.industry}`);
    }

    // Get intelligence with hints
    const rawResult = await getIntelligence({
      input: input.trim(),
      forceRefresh: forceRefresh || false,
      options: options || {},
      hints: hints,
    });

    // Normalize to typed contract
    const result = mapToAnalysisResponse(rawResult);

    const totalTime = Date.now() - startTime;

    console.log(`[API] Request completed in ${totalTime}ms`);
    console.log(`[API] Response mapped to typed contract, success: ${result.success}`);

    return NextResponse.json({
      ...result,
      metadata: {
        ...result.metadata,
        apiTimeMs: totalTime,
      },
    });

  } catch (error: any) {
    console.error('[API] Error:', error);
    
    return NextResponse.json(
      { 
        success: false, 
        error: error.message || 'Internal server error',
        timestamp: new Date().toISOString(),
      },
      { status: 500 }
    );
  }
}

// GET /api/intelligence - System status
export async function GET() {
  try {
    const status = await getSystemStatus();
    
    return NextResponse.json({
      success: true,
      status,
      timestamp: new Date().toISOString(),
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}

// Quick check endpoint
export async function PUT(req: NextRequest) {
  try {
    const body = await req.json();
    const { input } = body;

    if (!input) {
      return NextResponse.json(
        { success: false, error: 'Input required' },
        { status: 400 }
      );
    }

    const result = await quickCheck(input);
    
    return NextResponse.json({
      success: true,
      result,
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}
