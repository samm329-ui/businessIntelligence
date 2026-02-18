/**
 * EBITA INTELLIGENCE — MAIN API ROUTE
 * File: app/api/analyze/route.ts
 * 
 * Connects: EntityResolver → DataOrchestrator → Groq AI → Response
 * Method: POST /api/analyze
 * 
 * Body: { query: string, type?: 'company' | 'industry', region?: 'INDIA' | 'GLOBAL' }
 */

import { NextRequest, NextResponse } from 'next/server';
import { entityResolver } from '@/lib/industry/entity-resolver';
import { orchestrator } from '@/lib/data/orchestrator';
import { 
  getCompetitors, 
  getCompaniesByIndustry,
  getProductCategoryForBrand,
  getCompaniesByProductCategory,
  getIndustryHierarchy,
  COMPANY_DATABASE,
  INDUSTRY_TAXONOMY,
  type CompanyRecord
} from '@/lib/industry/industry-dataset';
import {
  buildCompanyAnalysisPrompt,
  buildCompetitorAnalysisPrompt,
  buildInvestorAnalysisPrompt,
  callGroq,
  type PromptContext,
} from '@/lib/ai/groq-prompts';

// ─────────────────────────────────────────────
// REQUEST VALIDATION
// ─────────────────────────────────────────────

interface AnalyzeRequest {
  query: string;
  type?: 'company' | 'industry' | 'competitor' | 'investor';
  region?: 'INDIA' | 'GLOBAL';
  industry?: string;
  includeCompetitors?: boolean;
  includeInvestors?: boolean;
}

function validateRequest(body: unknown): { valid: boolean; data?: AnalyzeRequest; error?: string } {
  if (!body || typeof body !== 'object') {
    return { valid: false, error: 'Request body must be JSON' };
  }

  const b = body as Record<string, unknown>;

  if (!b.query || typeof b.query !== 'string' || b.query.trim().length < 2) {
    return { valid: false, error: 'query is required and must be at least 2 characters' };
  }

  if (b.region && !['INDIA', 'GLOBAL'].includes(b.region as string)) {
    return { valid: false, error: 'region must be INDIA or GLOBAL' };
  }

  return {
    valid: true,
    data: {
      query: b.query.trim(),
      type: (b.type as AnalyzeRequest['type']) || 'company',
      region: b.region as AnalyzeRequest['region'],
      industry: b.industry as string,
      includeCompetitors: b.includeCompetitors !== false,
      includeInvestors: b.includeInvestors !== false,
    },
  };
}

// ─────────────────────────────────────────────
// RESPONSE BUILDER
// ─────────────────────────────────────────────

function buildErrorResponse(message: string, status = 400) {
  return NextResponse.json(
    { success: false, error: message, timestamp: new Date().toISOString() },
    { status }
  );
}

// ─────────────────────────────────────────────
// MAIN POST HANDLER
// ─────────────────────────────────────────────

export async function POST(req: NextRequest) {
  const startTime = Date.now();

  try {
    // 1. Parse and validate request
    const body = await req.json().catch(() => null);
    const validation = validateRequest(body);

    if (!validation.valid || !validation.data) {
      return buildErrorResponse(validation.error || 'Invalid request');
    }

    const { query, region, industry, includeCompetitors, includeInvestors } = validation.data;

    // 2. Resolve entity (brand/ticker/company name → verified company)
    const resolution = await entityResolver.resolve(query, { industry, region });

    if (!resolution.found || !resolution.entity) {
      return NextResponse.json({
        success: false,
        error: `Could not identify: "${query}"`,
        suggestions: resolution.alternatives.map(a => ({
          name: a.name,
          ticker: a.ticker,
          industry: a.industry,
        })),
        resolverWarnings: [`Try using the company name (e.g., "Hindustan Unilever") or ticker (e.g., "HINDUNILVR")`],
      }, { status: 404 });
    }

    const entity = resolution.entity;

    // 3. Get product category context (e.g., "Surf Excel" → "Detergents")
    const productCategory = getProductCategoryForBrand(query);
    const companyInDB = COMPANY_DATABASE.find(c => c.ticker === entity.ticker);
    const industryHierarchy = companyInDB 
      ? getIndustryHierarchy(companyInDB)
      : {
          sector: entity.industry || 'Unknown',
          industryGroup: entity.subIndustry || entity.industry || 'Unknown',
          industry: entity.industry || 'Unknown',
          subIndustry: entity.subIndustry || 'Unknown',
          niche: undefined,
          productCategories: [],
          gicsCode: undefined,
          naicsCode: undefined,
          naicsDescription: undefined,
        };

    // 4. Fetch financial data via priority pipeline
    const financials = await orchestrator.fetchCompanyFinancials(
      entity.ticker,
      entity.region
    );

    // 5. Fetch competitors - prioritize same product category, then same sub-industry, then same industry
    let competitorData: PromptContext['competitors'] = [];
    let competitorContext = '';
    
    if (includeCompetitors) {
      // First try to get competitors from same product category
      let competitorRecords: CompanyRecord[] = [];
      
      if (productCategory) {
        // Get companies that share the same product category
        const categoryCompetitors = getCompaniesByProductCategory(productCategory)
          .filter(c => c.ticker !== entity.ticker && c.region === entity.region);
        
        if (categoryCompetitors.length > 0) {
          competitorRecords = categoryCompetitors;
          competitorContext = `Product Category: ${productCategory}`;
        }
      }
      
      // If no product category competitors, get same sub-industry competitors
      if (competitorRecords.length === 0) {
        const company = COMPANY_DATABASE.find(c => c.ticker === entity.ticker);
        if (company) {
          competitorRecords = COMPANY_DATABASE.filter(c => 
            c.ticker !== entity.ticker &&
            c.subIndustry === company.subIndustry &&
            c.region === entity.region
          );
          if (competitorRecords.length > 0) {
            competitorContext = `Sub-Industry: ${company.subIndustry}`;
          }
        }
      }
      
      // Fallback to same industry competitors
      if (competitorRecords.length === 0) {
        competitorRecords = getCompetitors(entity.ticker, entity.region);
        competitorContext = `Industry: ${entity.industry}`;
      }
      
      competitorData = competitorRecords.slice(0, 10).map(c => ({
        name: c.name,
        ticker: c.ticker,
        marketCap: null,
        revenueGrowth: null,
        netMargin: null,
      }));
    }

    // 6. Build prompt context with full industry taxonomy
    const companyRecord = {
      name: entity.name,
      ticker: entity.ticker,
      industry: entity.industry || 'Unknown',
      subIndustry: entity.subIndustry || 'Unknown',
      region: entity.region,
      brands: entity.brands || [],
      productCategory: productCategory,
      industryHierarchy: industryHierarchy,
    };

    const ctx: PromptContext = {
      company: companyRecord,
      financials: orchestrator.toPromptContext(financials, companyRecord),
      competitors: competitorData,
      investors: [],  // Will add investor fetch in next iteration
      dataMeta: {
        sources: financials.sources,
        fetchedAt: financials.lastUpdated.toISOString(),
        overallConfidence: financials.overallConfidence,
        missingFields: financials.missingFields,
      },
    };

    // 6. Run AI analysis (with guardrails)
    const analysisMessages = buildCompanyAnalysisPrompt(ctx);
    const aiResult = await callGroq(analysisMessages, {
      maxTokens: 2500,
      temperature: 0.1,
    });

    // 7. Build final response
    const responseTime = Date.now() - startTime;

    // 8. Build industry taxonomy info
    const industryInfo = INDUSTRY_TAXONOMY[entity.industry as keyof typeof INDUSTRY_TAXONOMY];

    return NextResponse.json({
      success: true,
      
      // Entity resolution info
      entity: {
        ticker: entity.ticker,
        name: entity.name,
        industry: entity.industry,
        subIndustry: entity.subIndustry,
        region: entity.region,
        exchange: entity.exchange,
        brands: entity.brands,
        parentCompany: entity.parentTicker,
        resolvedBy: entity.resolvedBy,
        resolutionConfidence: entity.confidence,
        warnings: entity.warnings,
      },

      // Industry taxonomy and context
      industryContext: {
        searchedBrand: query,
        productCategory: productCategory,
        hierarchy: industryHierarchy,
        taxonomy: {
          label: industryInfo?.label || entity.industry,
          gicsSector: industryInfo?.gics,
          naicsCode: industryInfo?.naics,
          subIndustries: industryInfo?.subIndustries || [],
          kpis: industryInfo?.kpis || [],
        },
        competitorFilterContext: competitorContext,
      },

      // Raw financial data with source tracking
      financials: {
        currentPrice:       financials.currentPrice,
        marketCap:          financials.marketCap,
        revenue:            financials.totalRevenue,
        netMargin:          financials.netMargin,
        grossMargin:        financials.grossMargin,
        ebitdaMargin:       financials.ebitdaMargin,
        roe:                financials.roe,
        peRatio:            financials.peRatio,
        debtToEquity:       financials.debtToEquity,
        dividendYield:      financials.dividendYield,
        eps:                financials.eps,
        currentRatio:       financials.currentRatio,
      },

      // Competitors list (from dataset - filtered by product category/sub-industry)
      competitors: competitorData,

      // AI Analysis
      analysis: aiResult.success ? aiResult.data : null,
      analysisError: aiResult.success ? null : aiResult.error,

      // Data quality metadata
      meta: {
        dataConfidence:     financials.overallConfidence,
        dataSources:        financials.sources,
        missingFields:      financials.missingFields,
        lastUpdated:        financials.lastUpdated,
        fiscalPeriod:       financials.fiscalPeriod,
        responseTimeMs:     responseTime,
      },
    });

  } catch (error) {
    console.error('[API] Unexpected error:', error);
    return buildErrorResponse(
      error instanceof Error ? error.message : 'Internal server error',
      500
    );
  }
}

// ─────────────────────────────────────────────
// GET HANDLER — Health check + supported industries
// ─────────────────────────────────────────────

export async function GET() {
  return NextResponse.json({
    status: 'healthy',
    version: '3.0',
    supportedIndustries: ['home_cleaning', 'automobile', 'technology', 'pharmaceuticals', 'banking'],
    supportedRegions: ['INDIA', 'GLOBAL'],
    dataSources: ['NSE', 'YAHOO', 'ALPHA_VANTAGE', 'FMP', 'DATASET'],
    exampleRequest: {
      method: 'POST',
      body: { query: 'Surf Excel', includeCompetitors: true, includeInvestors: true },
    },
    exampleQueries: [
      'Surf Excel',         // → Resolves to HUL (HINDUNILVR)
      'Harpic',             // → Resolves to Reckitt Benckiser
      'TCS',                // → Tata Consultancy Services
      'TSLA',               // → Tesla
      'HINDUNILVR',         // → Direct ticker lookup
    ],
  });
}
