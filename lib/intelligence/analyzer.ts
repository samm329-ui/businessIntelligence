/**
 * AI Analyzer
 * 
 * FIX 3: Separates Quantitative vs Qualitative Analysis
 * - Quantitative AI: Only numbers (EBITDA, Revenue, Growth, Margins)
 * - Qualitative AI: Marketing strategy, Industry positioning, Competitive insights
 * This reduces hallucinations by keeping numeric analysis strict.
 */

import type { CollectedData } from './collector';

export interface AnalysisResult {
  executiveSummary: string;
  financials: {
    revenue?: string;
    ebitda?: string;
    profit?: string;
    growth?: string;
    marketCap?: string;
  };
  competitors: string[];
  keyFindings: string[];
  risks: string[];
  opportunities: string[];
  industryOutlook: string;
  confidence: number;
  model: string;
  tokensUsed?: number;
  
  quantitativeAnalysis?: {
    strict: boolean;
    dataUsed: string[];
  };
  qualitativeAnalysis?: {
    confidence: number;
    factors: string[];
  };
}

// ═══════════════════════════════════════════════════════════════════════════
// Main Analysis Function
// ═══════════════════════════════════════════════════════════════════════════

export async function analyzeWithAI(data: CollectedData): Promise<AnalysisResult> {
  const apiKey = process.env.GROQ_API_KEY || process.env.OPENAI_API_KEY;

  if (!apiKey) {
    console.warn('[Analyzer] No AI API key found, using rule-based analysis');
    return ruleBasedAnalysis(data);
  }

  try {
    // Try Groq first (faster, cheaper)
    if (process.env.GROQ_API_KEY) {
      return await analyzeWithGroq(data);
    }

    // Fallback to OpenAI
    if (process.env.OPENAI_API_KEY) {
      return await analyzeWithOpenAI(data);
    }

    return ruleBasedAnalysis(data);
  } catch (error: any) {
    console.error('[Analyzer] AI analysis failed:', error.message);
    return ruleBasedAnalysis(data);
  }
}

// ═══════════════════════════════════════════════════════════════════════════
// Groq Analysis
// ═══════════════════════════════════════════════════════════════════════════

async function analyzeWithGroq(data: CollectedData): Promise<AnalysisResult> {
  const apiKey = process.env.GROQ_API_KEY;
  
  if (!apiKey) {
    throw new Error('Groq API key not configured');
  }

  const prompt = buildAnalysisPrompt(data);

  try {
    const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'llama-3.1-70b-versatile',
        messages: [
          {
            role: 'system',
            content: `You are a financial analyst AI embedded in the EBITA Intelligence Platform. Analyze ONLY provided data and extract key financial metrics, competitors, risks, and opportunities. Respond in JSON format only.

ABSOLUTE RULES:
1. NEVER invent, estimate, or guess financial numbers not explicitly in the input.
2. If a metric is not found in the data, set it to null — do NOT fill gaps.
3. If data confidence is noted as below 60%, cap your confidence below 55 and prefix summary with "[INSUFFICIENT DATA]".
4. Always cite which data section (company info, financial info, news, web content) supports each claim.
5. Do NOT make investment recommendations or predict stock prices.`
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        temperature: 0.1,
        max_tokens: 4000,
        response_format: { type: 'json_object' },
      }),
    });

    if (!response.ok) {
      throw new Error(`Groq API error: ${response.status}`);
    }

    const result = await response.json();
    const content = result.choices[0]?.message?.content;
    
    if (!content) {
      throw new Error('Empty response from Groq');
    }

    const parsed = JSON.parse(content);
    
    return {
      executiveSummary: parsed.executiveSummary || 'No summary available',
      financials: {
        revenue: parsed.financials?.revenue,
        ebitda: parsed.financials?.ebitda,
        profit: parsed.financials?.profit,
        growth: parsed.financials?.growth,
        marketCap: parsed.financials?.marketCap,
      },
      competitors: parsed.competitors || [],
      keyFindings: parsed.keyFindings || [],
      risks: parsed.risks || [],
      opportunities: parsed.opportunities || [],
      industryOutlook: parsed.industryOutlook || 'No outlook available',
      confidence: parsed.confidence || 70,
      model: 'groq-llama-3.1-70b',
      tokensUsed: result.usage?.total_tokens,
    };

  } catch (error: any) {
    console.error('[Analyzer] Groq analysis error:', error.message);
    throw error;
  }
}

// ═══════════════════════════════════════════════════════════════════════════
// OpenAI Analysis
// ═══════════════════════════════════════════════════════════════════════════

async function analyzeWithOpenAI(data: CollectedData): Promise<AnalysisResult> {
  const apiKey = process.env.OPENAI_API_KEY;
  
  if (!apiKey) {
    throw new Error('OpenAI API key not configured');
  }

  const prompt = buildAnalysisPrompt(data);

  try {
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [
          {
            role: 'system',
            content: `You are a financial analyst AI embedded in the EBITA Intelligence Platform. Analyze ONLY provided data and extract key metrics. Respond in JSON format.

ABSOLUTE RULES:
1. NEVER invent financial numbers not in the input.
2. If a metric is missing, set to null.
3. If data confidence < 60%, cap confidence below 55 and prefix summary with "[INSUFFICIENT DATA]".
4. Cite data sources for each claim.`
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        temperature: 0.1,
        max_tokens: 4000,
        response_format: { type: 'json_object' },
      }),
    });

    if (!response.ok) {
      throw new Error(`OpenAI API error: ${response.status}`);
    }

    const result = await response.json();
    const content = result.choices[0]?.message?.content;
    
    if (!content) {
      throw new Error('Empty response from OpenAI');
    }

    const parsed = JSON.parse(content);
    
    return {
      executiveSummary: parsed.executiveSummary || 'No summary available',
      financials: {
        revenue: parsed.financials?.revenue,
        ebitda: parsed.financials?.ebitda,
        profit: parsed.financials?.profit,
        growth: parsed.financials?.growth,
        marketCap: parsed.financials?.marketCap,
      },
      competitors: parsed.competitors || [],
      keyFindings: parsed.keyFindings || [],
      risks: parsed.risks || [],
      opportunities: parsed.opportunities || [],
      industryOutlook: parsed.industryOutlook || 'No outlook available',
      confidence: parsed.confidence || 70,
      model: 'openai-gpt-4o-mini',
      tokensUsed: result.usage?.total_tokens,
    };

  } catch (error: any) {
    console.error('[Analyzer] OpenAI analysis error:', error.message);
    throw error;
  }
}

// ═══════════════════════════════════════════════════════════════════════════
// Build Analysis Prompt
// ═══════════════════════════════════════════════════════════════════════════

function buildAnalysisPrompt(data: CollectedData): string {
  const { entity, sources, csvCompetitors } = data;

  const dataConfidence = data.metadata.dataConfidenceScore ?? 0;
  const consensusData = (data as any).consensusForAI || '';
  const consensusMetrics = (data as any).consensusMetrics;
  const structuredFinancials = (data as any).structuredFinancials;
  
  const confidenceGate = dataConfidence < 60 
    ? `\n\nCRITICAL: Data confidence score is ${dataConfidence}% (below 60% threshold). You MUST:
- Set confidence to below 55
- Prefix executiveSummary with "[INSUFFICIENT DATA]"
- Set all financial values you are not 100% certain about to null
- Do NOT speculate or estimate any numbers
`
    : '';

  const consensusBlock = consensusData
    ? `\nVALIDATED CONSENSUS DATA (USE THIS AS PRIMARY FINANCIAL SOURCE):
${consensusData}
`
    : '';

  const structuredFinancialBlock = structuredFinancials?.extractions?.length
    ? `\nSTRUCTURED FINANCIAL EXTRACTIONS:
${structuredFinancials.extractions.map((e: any) => `${e.metric}: ${e.value} (source: ${e.source}, confidence: ${e.confidence}%)`).join('\n')}
`
    : '';

  const csvCompetitorInfo = csvCompetitors && csvCompetitors.length > 0 
    ? `\nINDIAN COMPETITORS (VERIFIED DATABASE):
${csvCompetitors.map(c => `- ${c}`).join('\n')}`
    : '';

  const searchCompetitors = sources.competitors.length > 0
    ? `\nCOMPETITOR REFERENCES (from search):
${sources.competitors.slice(0, 5).map(s => `- ${s.title}`).join('\n')}`
    : '';

  return `
Analyze ONLY the structured consensus data and competitor lists below for ${entity.name} (${entity.type}) in the ${entity.industry} industry.

Data Confidence Score: ${dataConfidence}%${confidenceGate}
${consensusBlock}
${structuredFinancialBlock}
${csvCompetitorInfo}
${searchCompetitors}

Extract the following and respond in JSON format:
{
  "executiveSummary": "Brief 2-3 sentence summary",
  "financials": {
    "revenue": "Revenue figure with units (e.g., INR 500 Cr) or null if not found in data",
    "ebitda": "EBITDA figure or null",
    "profit": "Net profit figure or null",
    "growth": "Growth rate % or null",
    "marketCap": "Market cap or null"
  },
  "competitors": ["Competitor 1", "Competitor 2", ...],
  "keyFindings": ["Finding 1", "Finding 2", ...],
  "risks": ["Risk 1", "Risk 2", ...],
  "opportunities": ["Opportunity 1", "Opportunity 2", ...],
  "industryOutlook": "Brief industry outlook",
  "confidence": 0-100
}

ABSOLUTE RULES (NEVER VIOLATE):
1. Use ONLY consensus and structured data above. Do NOT use raw company/financial/news content.
2. If a financial metric is not in the consensus/structured data, set it to null.
3. If data confidence is below 60%, set your confidence below 55 and prefix summary with "[INSUFFICIENT DATA]".
4. Do NOT add assumptions, estimates, or speculative figures.
5. Prioritize CSV competitors list for Indian companies.
6. Only include information from the structured data above. Use null for unknowns.
7. Do not hallucinate. If unsure, say "Data unavailable".
`;
}

// FIX 3: Separate Quantitative vs Qualitative prompts
function buildQuantitativePrompt(data: CollectedData): string {
  const { entity } = data;
  const consensusData = (data as any).consensusForAI || '';
  const consensusMetrics = (data as any).consensusMetrics;
  const dataConfidence = data.metadata.dataConfidenceScore ?? 0;
  
  return `
QUANTITATIVE ANALYSIS ONLY - STRICT NUMERIC DATA

For ${entity.name} in ${entity.industry} industry:

Extract ONLY the following numeric values from the consensus data below.
DO NOT interpret, estimate, or add any qualitative information.

CONSENSUS DATA:
${consensusData}

Respond in JSON format with ONLY numeric values - set to null if not found:
{
  "revenue": "INR XXX Cr or null",
  "ebitda": "INR XXX Cr or null", 
  "profit": "INR XXX Cr or null",
  "growth": "XX% or null",
  "marketCap": "INR XXX Cr or null",
  "margins": {
    "grossMargin": "XX% or null",
    "operatingMargin": "XX% or null", 
    "netMargin": "XX% or null"
  },
  "confidence": 0-100,
  "dataUsed": ["list which sources you extracted numbers from"]
}

RULES:
- ONLY extract numbers that are EXPLICITLY in the consensus data
- If a number is not there, set it to null - DO NOT estimate
- Do NOT add any text beyond the JSON
- Do NOT provide insights, risks, or opportunities
`;
}

function buildQualitativePrompt(data: CollectedData, quantitativeResult?: any): string {
  const { entity, sources, csvCompetitors } = data;
  const dataConfidence = data.metadata.dataConfidenceScore ?? 0;
  const competitors = (data as any).competitors || [];
  
  // Build context from competitors and industry info (NOT raw financials)
  const competitorContext = csvCompetitors && csvCompetitors.length > 0
    ? `Known competitors: ${csvCompetitors.slice(0, 10).join(', ')}`
    : `Competitors found: ${competitors.slice(0, 5).join(', ')}`;

  const industryContext = sources.industryInfo.slice(0, 3).map(s => s.title).join('; ') || 'General industry';

  return `
QUALITATIVE ANALYSIS ONLY - Strategic interpretation

For ${entity.name} (${entity.type}) in ${entity.industry} industry:

${competitorContext}

Industry context: ${industryContext}

Data confidence: ${dataConfidence}%

Based on the industry and competitor context above (NOT specific financial numbers), provide:

1. Industry outlook (general trends, not specific numbers)
2. Key risks (strategic, market, regulatory - not financial)
3. Key opportunities (market positioning, growth areas - not specific numbers)
4. Competitive positioning (how ${entity.name} compares to competitors qualitatively)

Respond in JSON:
{
  "industryOutlook": "Brief qualitative outlook",
  "risks": ["Risk 1", "Risk 2"],
  "opportunities": ["Opportunity 1", "Opportunity 2"],
  "competitiveInsights": "Brief competitive positioning",
  "confidence": 0-100,
  "basis": ["what sources informed this analysis"]
}

RULES:
- Do NOT use specific revenue/EBITDA/profit numbers
- Focus on STRATEGIC and QUALITATIVE analysis
- If insufficient context, note what would be needed
`;
}

// ═══════════════════════════════════════════════════════════════════════════
// Rule-Based Analysis (Fallback)
// ═══════════════════════════════════════════════════════════════════════════

function ruleBasedAnalysis(data: CollectedData): AnalysisResult {
  const { entity, sources, metadata, csvCompetitors } = data;
  
  // Use CSV competitors first (prioritized for Indian companies)
  const competitors = new Set<string>();
  
  if (csvCompetitors && csvCompetitors.length > 0) {
    // Use CSV database competitors (verified Indian companies)
    for (const competitor of csvCompetitors) {
      competitors.add(competitor);
    }
    console.log(`[Analyzer] Using ${csvCompetitors.length} competitors from CSV database`);
  } else {
    // Fall back to extracting from search results
    console.log(`[Analyzer] No CSV competitors, extracting from search results...`);
    for (const result of sources.competitors) {
      const words = result.title.split(/\s+/);
      for (const word of words) {
        if (word.length > 3 && word[0] === word[0].toUpperCase() && 
            word !== 'The' && word !== 'And' && word !== 'For') {
          competitors.add(word);
        }
      }
    }
  }

  // Extract financial figures using regex
  const allText = [
    ...sources.financialData.map(s => s.description),
    ...sources.crawledPages.map(p => p.content),
  ].join(' ');

  const financials: any = {};

  // Revenue patterns
  const revenueMatch = allText.match(/(?:revenue|sales|turnover)[^\d]*(₹?\d+\.?\d*)\s*(cr|crore|lakh|mn|bn)/i);
  if (revenueMatch) {
    financials.revenue = `₹${revenueMatch[1]} ${revenueMatch[2]}`;
  }

  // EBITDA patterns
  const ebitdaMatch = allText.match(/ebitda[^\d]*(₹?\d+\.?\d*)\s*(cr|crore|lakh|mn|bn)/i);
  if (ebitdaMatch) {
    financials.ebitda = `₹${ebitdaMatch[1]} ${ebitdaMatch[2]}`;
  }

  // Growth patterns
  const growthMatch = allText.match(/growth[^\d]*(\d+\.?\d*)%/i);
  if (growthMatch) {
    financials.growth = `${growthMatch[1]}%`;
  }

  return {
    executiveSummary: `${entity.name} is a ${entity.type} in the ${entity.industry} industry. Analysis based on ${metadata.totalSources} sources.`,
    financials,
    competitors: Array.from(competitors).slice(0, 5),
    keyFindings: [
      `Identified in ${entity.industry} industry`,
      `Data collected from ${metadata.totalSources} sources`,
      metadata.isNewEntity ? 'Newly added to dataset' : 'Existing entity in dataset',
    ],
    risks: [
      'Market competition',
      'Economic conditions',
      'Regulatory changes',
    ],
    opportunities: [
      'Industry growth potential',
      'Market expansion',
      'Innovation opportunities',
    ],
    industryOutlook: `${entity.industry} shows steady growth potential with increasing digitalization and market expansion.`,
    confidence: 60,
    model: 'rule-based',
  };
}

// ═══════════════════════════════════════════════════════════════════════════
// Quick Analysis (Without AI)
// ═══════════════════════════════════════════════════════════════════════════

export function quickAnalyze(data: CollectedData): Partial<AnalysisResult> {
  return ruleBasedAnalysis(data);
}
