/**
 * EBITA INTELLIGENCE — GROQ AI PROMPT LIBRARY
 * Anti-hallucination guardrails: AI never invents financial numbers
 * All prompts require structured JSON input, return structured JSON output
 * Model: meta-llama/llama-4-scout-17b-16e-instruct (via Groq)
 */

// ─────────────────────────────────────────────
// TYPES
// ─────────────────────────────────────────────

export interface GroqMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

export interface PromptContext {
  company: {
    name: string;
    ticker: string;
    industry: string;
    subIndustry: string;
    region: string;
    brands?: string[];
  };
  financials?: {
    revenue?: number | null;
    revenueGrowth?: number | null;
    netMargin?: number | null;
    ebitdaMargin?: number | null;
    roe?: number | null;
    debtToEquity?: number | null;
    peRatio?: number | null;
    marketCap?: number | null;
    source?: string;
    confidence?: number;
    fiscalPeriod?: string;
  };
  competitors?: Array<{
    name: string;
    ticker: string;
    marketCap?: number | null;
    revenueGrowth?: number | null;
    netMargin?: number | null;
  }>;
  investors?: Array<{
    name: string;
    category: string;
    holdingPercent?: number | null;
    change?: number | null;
  }>;
  industryMetrics?: {
    medianMargin?: number | null;
    avgGrowth?: number | null;
    marketSize?: number | null;
    numberOfCompanies?: number;
  };
  dataMeta: {
    sources: string[];
    fetchedAt: string;
    overallConfidence: number;   // 0-100
    missingFields: string[];     // Fields we couldn't get data for
  };
}

// ─────────────────────────────────────────────
// SYSTEM PROMPT — CORE IDENTITY
// ─────────────────────────────────────────────
export const SYSTEM_PROMPT_BASE = `You are EBITA Intelligence, a professional financial analysis AI embedded in a business intelligence platform.

## ABSOLUTE RULES (NEVER VIOLATE):

1. **NO NUMBER INVENTION**: NEVER generate, estimate, or invent financial numbers including:
   - Revenue, profit, market cap, stock price, growth rates
   - Ratios (P/E, ROE, EBITDA margin, etc.)
   - Market share percentages, employee counts
   - Any quantitative financial data NOT provided in the input JSON
   
2. **DATA-ONLY ANALYSIS**: Your role is to INTERPRET and EXPLAIN data you are given.
   - If a field is null or missing: say "Data unavailable" — do NOT estimate
   - If confidence is below 60: clearly flag it as "Low confidence data"
   - NEVER fill in gaps with your training knowledge of financial figures

3. **EXPLICIT SOURCE ATTRIBUTION**: Always reference which data points came from which sources.

4. **UNCERTAINTY FLAGGING**: When analyzing, clearly mark:
   - "HIGH CONFIDENCE" — multiple validated sources, recent data
   - "MEDIUM CONFIDENCE" — single source or older data
   - "LOW CONFIDENCE" — unverified or inferred
   - "DATA UNAVAILABLE" — field not provided

5. **OUTPUT FORMAT**: Always respond in valid JSON matching the requested schema.

## WHAT YOU CAN DO:
- Interpret financial ratios and what they mean for the business
- Compare provided competitor metrics qualitatively
- Identify strategic patterns from the data provided
- Generate founder-focused insights and risks
- Explain KPIs in plain English
- Assess competitive positioning based on provided data

## WHAT YOU CANNOT DO:
- Generate any number not in the input
- Predict stock prices or future revenues
- Make investment recommendations
- Fill missing data with estimates`;

// ─────────────────────────────────────────────
// PROMPT 1: FULL COMPANY ANALYSIS
// ─────────────────────────────────────────────
export function buildCompanyAnalysisPrompt(ctx: PromptContext): GroqMessage[] {
  const safeNum = (n: number | null | undefined, decimals = 2) =>
    n != null ? n.toFixed(decimals) : 'UNAVAILABLE';

  const financialBlock = ctx.financials
    ? `{
  "revenue": ${ctx.financials.revenue ?? null},
  "revenue_growth_yoy_percent": ${ctx.financials.revenueGrowth ?? null},
  "net_margin_percent": ${ctx.financials.netMargin ?? null},
  "ebitda_margin_percent": ${ctx.financials.ebitdaMargin ?? null},
  "roe_percent": ${ctx.financials.roe ?? null},
  "debt_to_equity": ${ctx.financials.debtToEquity ?? null},
  "pe_ratio": ${ctx.financials.peRatio ?? null},
  "market_cap_usd": ${ctx.financials.marketCap ?? null},
  "fiscal_period": "${ctx.financials.fiscalPeriod ?? 'Unknown'}",
  "data_source": "${ctx.financials.source ?? 'Unknown'}",
  "data_confidence_score": ${ctx.financials.confidence ?? 0}
}`
    : '{ "status": "NO_FINANCIAL_DATA_AVAILABLE" }';

  const competitorBlock = ctx.competitors?.length
    ? JSON.stringify(ctx.competitors.map(c => ({
        name: c.name,
        ticker: c.ticker,
        market_cap: c.marketCap ?? null,
        revenue_growth_yoy: c.revenueGrowth ?? null,
        net_margin: c.netMargin ?? null,
      })), null, 2)
    : '[]';

  const investorBlock = ctx.investors?.length
    ? JSON.stringify(ctx.investors.map(i => ({
        name: i.name,
        category: i.category,
        holding_percent: i.holdingPercent ?? null,
        qoq_change: i.change ?? null,
      })), null, 2)
    : '[]';

  return [
    { role: 'system', content: SYSTEM_PROMPT_BASE },
    {
      role: 'user',
      content: `Analyze this company using ONLY the data provided below. Do not invent any numbers.

## COMPANY PROFILE
\`\`\`json
{
  "name": "${ctx.company.name}",
  "ticker": "${ctx.company.ticker}",
  "industry": "${ctx.company.industry}",
  "sub_industry": "${ctx.company.subIndustry}",
  "region": "${ctx.company.region}",
  "brands": ${JSON.stringify(ctx.company.brands ?? [])}
}
\`\`\`

## FINANCIAL DATA (Validated - Use ONLY these numbers)
\`\`\`json
${financialBlock}
\`\`\`

## COMPETITOR BENCHMARKS (for context only)
\`\`\`json
${competitorBlock}
\`\`\`

## INVESTOR / SHAREHOLDING DATA
\`\`\`json
${investorBlock}
\`\`\`

## DATA QUALITY META
\`\`\`json
{
  "sources_used": ${JSON.stringify(ctx.dataMeta.sources)},
  "fetched_at": "${ctx.dataMeta.fetchedAt}",
  "overall_confidence": ${ctx.dataMeta.overallConfidence},
  "missing_fields": ${JSON.stringify(ctx.dataMeta.missingFields)}
}
\`\`\`

## REQUIRED OUTPUT FORMAT (respond in this exact JSON schema):
\`\`\`json
{
  "verdict": {
    "summary": "2-3 sentence business health summary",
    "confidence_level": "HIGH | MEDIUM | LOW",
    "recommendation": "BUY | HOLD | WATCH | AVOID | INSUFFICIENT_DATA"
  },
  "financial_health": {
    "profitability": "Analysis based ONLY on provided margin data or 'Data unavailable'",
    "growth_trajectory": "Analysis of growth metrics or 'Data unavailable'",
    "leverage": "Debt situation or 'Data unavailable'",
    "valuation": "P/E and market cap context or 'Data unavailable'"
  },
  "competitive_position": {
    "market_standing": "Position vs competitors based on provided data",
    "brand_strength": "Assessment based on brand portfolio provided",
    "moat_factors": ["List of identified competitive advantages"]
  },
  "investor_signals": {
    "institutional_sentiment": "Based on holding data or 'Data unavailable'",
    "promoter_confidence": "Promoter holding trend or 'Data unavailable'",
    "key_changes": ["Notable shareholding changes"]
  },
  "risks": [
    { "type": "FINANCIAL | COMPETITIVE | REGULATORY | MACRO", "description": "Risk detail", "severity": "HIGH | MEDIUM | LOW" }
  ],
  "opportunities": [
    { "type": "MARKET | PRODUCT | GEOGRAPHIC | OPERATIONAL", "description": "Opportunity detail" }
  ],
  "data_warnings": [
    "List any fields that had LOW confidence or were unavailable"
  ]
}
\`\`\`

IMPORTANT: If financial data confidence is below 60, mark recommendation as "INSUFFICIENT_DATA".`,
    },
  ];
}

// ─────────────────────────────────────────────
// PROMPT 2: COMPETITOR ANALYSIS
// ─────────────────────────────────────────────
export function buildCompetitorAnalysisPrompt(
  mainCompany: PromptContext['company'],
  competitors: NonNullable<PromptContext['competitors']>,
  industryMetrics?: PromptContext['industryMetrics']
): GroqMessage[] {
  return [
    { role: 'system', content: SYSTEM_PROMPT_BASE },
    {
      role: 'user',
      content: `Perform a competitive analysis for "${mainCompany.name}" in the "${mainCompany.industry}" industry.
Use ONLY the competitor data provided below.

## MAIN COMPANY
${JSON.stringify(mainCompany, null, 2)}

## COMPETITORS (with available metrics)
${JSON.stringify(competitors, null, 2)}

## INDUSTRY BENCHMARKS (use ONLY if provided, not null)
${JSON.stringify(industryMetrics ?? {}, null, 2)}

## REQUIRED OUTPUT:
\`\`\`json
{
  "competitive_landscape": {
    "market_structure": "FRAGMENTED | CONSOLIDATED | OLIGOPOLY | MONOPOLY",
    "intensity": "HIGH | MEDIUM | LOW",
    "description": "Brief landscape description based only on provided data"
  },
  "rankings": [
    {
      "rank": 1,
      "company": "Company name",
      "ticker": "Ticker",
      "strengths": ["Data-based strength"],
      "weaknesses": ["Data-based weakness"]
    }
  ],
  "main_company_vs_peers": {
    "above_average": ["Metrics where main company outperforms — only if data shows this"],
    "below_average": ["Metrics where main company underperforms — only if data shows this"],
    "data_gaps": ["Metrics that couldn't be compared due to missing data"]
  },
  "heatmap_data": [
    {
      "company": "Name",
      "metrics": {
        "revenue_growth": null,
        "net_margin": null,
        "market_cap": null,
        "pe_ratio": null
      }
    }
  ]
}
\`\`\``,
    },
  ];
}

// ─────────────────────────────────────────────
// PROMPT 3: INDUSTRY INTELLIGENCE
// ─────────────────────────────────────────────
export function buildIndustryAnalysisPrompt(
  industry: string,
  region: string,
  metrics: PromptContext['industryMetrics'],
  companies: Array<{ name: string; marketCap: number | null; revenueGrowth: number | null }>,
  dataMeta: PromptContext['dataMeta']
): GroqMessage[] {
  return [
    { role: 'system', content: SYSTEM_PROMPT_BASE },
    {
      role: 'user',
      content: `Analyze the "${industry}" industry in "${region}" using ONLY the data provided.

## INDUSTRY METRICS
${JSON.stringify(metrics ?? {}, null, 2)}

## COMPANIES IN SECTOR (${companies.length} companies)
${JSON.stringify(companies, null, 2)}

## DATA QUALITY
${JSON.stringify(dataMeta, null, 2)}

## REQUIRED OUTPUT:
\`\`\`json
{
  "industry_overview": {
    "maturity": "EMERGING | GROWING | MATURE | DECLINING",
    "market_structure": "Description based on HHI / concentration data if available",
    "key_drivers": ["Growth driver 1", "Growth driver 2"]
  },
  "market_sizing": {
    "commentary": "Based ONLY on provided market_size field or 'Data unavailable'",
    "growth_outlook": "Based ONLY on provided avg_growth field or 'Data unavailable'"
  },
  "profitability_benchmark": {
    "commentary": "Based on median_margin if provided",
    "industry_leaders": ["Companies with best margins — from provided data only"]
  },
  "risks_and_tailwinds": {
    "risks": ["Industry-level risks identifiable from data"],
    "tailwinds": ["Industry-level opportunities from data"]
  },
  "data_confidence": "${dataMeta.overallConfidence}",
  "data_warnings": ["Fields with missing data"]
}
\`\`\``,
    },
  ];
}

// ─────────────────────────────────────────────
// PROMPT 4: INVESTOR ANALYSIS
// ─────────────────────────────────────────────
export function buildInvestorAnalysisPrompt(
  company: PromptContext['company'],
  investors: NonNullable<PromptContext['investors']>,
  previousQuarterInvestors?: NonNullable<PromptContext['investors']>
): GroqMessage[] {
  return [
    { role: 'system', content: SYSTEM_PROMPT_BASE },
    {
      role: 'user',
      content: `Analyze the investor/shareholding pattern for "${company.name}".
Use ONLY the data provided below.

## CURRENT SHAREHOLDING
${JSON.stringify(investors, null, 2)}

## PREVIOUS QUARTER (for comparison — may be null)
${JSON.stringify(previousQuarterInvestors ?? null, null, 2)}

## REQUIRED OUTPUT:
\`\`\`json
{
  "ownership_summary": {
    "promoter_control": "STRONG | MODERATE | WEAK based on promoter_holding_percent or 'Data unavailable'",
    "institutional_interest": "HIGH | MEDIUM | LOW based on institutional totals or 'Data unavailable'",
    "foreign_interest": "Commentary on FII/FPI holding or 'Data unavailable'"
  },
  "notable_changes": [
    {
      "investor": "Name",
      "change": "INCREASED | DECREASED | ENTERED | EXITED",
      "signal": "What this change might indicate"
    }
  ],
  "sentiment_signal": "BULLISH | NEUTRAL | BEARISH | INSUFFICIENT_DATA",
  "concentration_risk": "HIGH | MEDIUM | LOW — based on top holder concentration",
  "data_warnings": ["Any missing or low-confidence fields"]
}
\`\`\``,
    },
  ];
}

// ─────────────────────────────────────────────
// PROMPT 5: KPI EXPLANATION (for dashboard tooltips)
// ─────────────────────────────────────────────
export function buildKPIExplainerPrompt(
  kpiName: string,
  kpiValue: number | null,
  industry: string,
  industryMedian?: number | null
): GroqMessage[] {
  return [
    { role: 'system', content: SYSTEM_PROMPT_BASE },
    {
      role: 'user',
      content: `Explain this KPI in plain English for a founder/investor audience.

KPI: "${kpiName}"
Value: ${kpiValue ?? 'NOT AVAILABLE'}
Industry: "${industry}"
Industry Median: ${industryMedian ?? 'NOT AVAILABLE'}

## REQUIRED OUTPUT (2-3 sentences max, plain English):
\`\`\`json
{
  "what_it_means": "Plain English definition of this KPI",
  "value_context": "What ${kpiValue ?? 'this value'} means for a ${industry} company — only if value is provided",
  "vs_industry": "How it compares to industry median ${industryMedian ?? '(unavailable)'} — only if both are provided",
  "good_range": "Typical healthy range for ${industry} sector"
}
\`\`\``,
    },
  ];
}

// ─────────────────────────────────────────────
// PROMPT 6: HALLUCINATION DETECTION
// ─────────────────────────────────────────────
export function buildHallucinationCheckPrompt(
  aiOutput: string,
  sourceData: object
): GroqMessage[] {
  return [
    { role: 'system', content: 'You are a financial data auditor. Your job is to detect hallucinations in AI-generated financial analysis.' },
    {
      role: 'user',
      content: `Check if the AI analysis contains any numbers NOT present in the source data.

## SOURCE DATA (Ground Truth)
\`\`\`json
${JSON.stringify(sourceData, null, 2)}
\`\`\`

## AI ANALYSIS TO VERIFY
\`\`\`
${aiOutput}
\`\`\`

## REQUIRED OUTPUT:
\`\`\`json
{
  "hallucinations_found": true | false,
  "suspicious_claims": [
    {
      "claim": "The exact claim from AI output",
      "issue": "Why this is suspicious",
      "verdict": "CONFIRMED_HALLUCINATION | LIKELY_HALLUCINATION | ACCEPTABLE_INFERENCE"
    }
  ],
  "overall_quality": "CLEAN | MINOR_ISSUES | MAJOR_ISSUES",
  "approved_for_display": true | false
}
\`\`\``,
    },
  ];
}

// ─────────────────────────────────────────────
// GROQ API CALLER
// ─────────────────────────────────────────────
export async function callGroq(
  messages: GroqMessage[],
  options?: {
    model?: string;
    maxTokens?: number;
    temperature?: number;
    jsonMode?: boolean;
  }
): Promise<{ success: boolean; data?: unknown; error?: string; raw?: string }> {
  const GROQ_API_KEY = process.env.GROQ_API_KEY;
  if (!GROQ_API_KEY) {
    return { success: false, error: 'GROQ_API_KEY not configured' };
  }

  try {
    const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${GROQ_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: options?.model ?? 'meta-llama/llama-4-scout-17b-16e-instruct',
        messages,
        max_tokens: options?.maxTokens ?? 2000,
        temperature: options?.temperature ?? 0.1,  // Low temperature for factual analysis
        response_format: options?.jsonMode ? { type: 'json_object' } : undefined,
      }),
    });

    if (!response.ok) {
      const err = await response.text();
      return { success: false, error: `Groq API error ${response.status}: ${err}` };
    }

    const result = await response.json() as {
      choices?: Array<{ message?: { content?: string } }>;
    };
    const content = result.choices?.[0]?.message?.content ?? '';

    // Parse JSON from response
    try {
      // Remove markdown code blocks if present
      const cleaned = content.replace(/```json\n?|\n?```/g, '').trim();
      const parsed = JSON.parse(cleaned);
      return { success: true, data: parsed, raw: content };
    } catch {
      return { success: true, data: content, raw: content };
    }

  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown Groq error',
    };
  }
}

// ─────────────────────────────────────────────
// COMPLETE AI ANALYSIS PIPELINE
// ─────────────────────────────────────────────
export async function runFullAnalysis(ctx: PromptContext) {
  const messages = buildCompanyAnalysisPrompt(ctx);
  
  const result = await callGroq(messages, {
    maxTokens: 3000,
    temperature: 0.1,
    jsonMode: false,
  });
  
  if (!result.success) {
    return {
      success: false,
      error: result.error,
      fallback: {
        verdict: { summary: 'Analysis unavailable', confidence_level: 'LOW', recommendation: 'INSUFFICIENT_DATA' },
        data_warnings: ['AI analysis failed: ' + result.error],
      },
    };
  }
  
  // Run hallucination check on the output
  const hallucinationCheck = await callGroq(
    buildHallucinationCheckPrompt(
      JSON.stringify(result.data),
      { financials: ctx.financials, dataMeta: ctx.dataMeta }
    ),
    { maxTokens: 800, temperature: 0 }
  );
  
  return {
    success: true,
    analysis: result.data,
    qualityCheck: hallucinationCheck.data,
    approvedForDisplay: (hallucinationCheck.data as { approved_for_display?: boolean })?.approved_for_display ?? true,
  };
}
