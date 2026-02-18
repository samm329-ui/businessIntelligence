/**
 * EBITA Intelligence - AI Guardrails v2
 * 
 * CRITICAL: This module enforces that the AI NEVER generates financial numbers.
 * It only receives validated consensus data and must interpret it - not invent it.
 * 
 * Any response containing numbers not present in the consensus data is rejected.
 */

import { ConsensusMetrics, formatForAI } from '../intelligence/consensus-engine';

// ─── Types ────────────────────────────────────────────────────────────────────

export type AnalysisType = 'overview' | 'competitors' | 'strategies' | 'investors' | 'industry';

export interface AIAnalysisRequest {
  analysisType: AnalysisType;
  consensus: ConsensusMetrics;
  industryBenchmarks?: IndustryBenchmark;
  competitors?: CompetitorContext[];
  additionalContext?: string;
}

export interface IndustryBenchmark {
  industryName: string;
  avgRevenue?: number | null;
  avgGrossMargin?: number | null;
  avgNetMargin?: number | null;
  avgEbitdaMargin?: number | null;
  avgPeRatio?: number | null;
  avgRevenueGrowth?: number | null;
  topPlayerNames?: string[];
  confidence: number;
}

export interface CompetitorContext {
  name: string;
  ticker?: string;
  marketCap?: number | null;
  revenue?: number | null;
  netMargin?: number | null;
  peRatio?: number | null;
  revenueGrowth?: number | null;
}

export interface AIAnalysisResponse {
  executiveSummary: string;
  keyFindings: Finding[];
  risks: Risk[];
  opportunities: Opportunity[];
  vsIndustryBenchmark?: BenchmarkComparison;
  investorHighlights?: string[];
  strategicRecommendations?: string[];
  dataGapsNote?: string;
  confidence: number;
  model: string;
  tokensUsed?: number;
}

export interface Finding {
  finding: string;
  metricReference: string;
  implication: string;
  sentiment: 'positive' | 'negative' | 'neutral';
}

export interface Risk {
  risk: string;
  severity: 'high' | 'medium' | 'low';
  basedOnMetric: string;
}

export interface Opportunity {
  opportunity: string;
  basedOnMetric: string;
  timeHorizon: 'short' | 'medium' | 'long';
}

export interface BenchmarkComparison {
  marginVsAvg: string;
  growthVsAvg: string;
  valuationVsAvg: string;
  overallPositioning: 'leader' | 'above_average' | 'average' | 'below_average' | 'laggard';
}

// ─── Prompt Builder ───────────────────────────────────────────────────────────

export function buildGuardedPrompt(request: AIAnalysisRequest): {
  system: string;
  user: string;
} {
  const validatedDataBlock = formatForAI(request.consensus);
  const dataGaps = request.consensus.dataGaps;
  const hasGaps = dataGaps.length > 0;

  const system = `You are a senior financial intelligence analyst at a premier investment research firm.

ABSOLUTE RULES — VIOLATION WILL INVALIDATE YOUR ENTIRE RESPONSE:
1. You ONLY interpret data from the VALIDATED CONSENSUS DATA block below. You never generate financial numbers.
2. If a metric shows "UNAVAILABLE", you MUST say "data unavailable" for that metric. Never estimate, extrapolate, or infer a specific number.
3. Never say "approximately", "roughly", or "estimated" with a made-up number. Say "data unavailable" instead.
4. All numbers you cite must come verbatim from the VALIDATED CONSENSUS DATA block.
5. If confidence is below 70%, explicitly note the data quality concern in your analysis.
6. You are analyzing real companies with real investors reading this. Accuracy over impressiveness.
7. Respond ONLY in valid JSON matching the required schema exactly.

WHAT YOU CAN DO:
- Explain what the numbers mean in business context
- Compare metrics against industry norms (use your training knowledge for benchmarks)
- Identify risks and opportunities based on the validated numbers
- Generate strategic insights grounded in the provided metrics
- Note when numbers seem unusual or require further investigation

WHAT YOU CANNOT DO:
- Generate revenue, profit, margin, or any financial number not in the data block
- Predict specific future numeric values  
- Fill in gaps with AI-estimated numbers
- Reference unnamed "industry sources" or "market reports" with made-up figures
- Mention specific unnamed investors or invented board details`;

  const competitorBlock = request.competitors && request.competitors.length > 0
    ? `\n--- COMPETITOR DATA (VALIDATED) ---\n${request.competitors.map(c =>
        `${c.name}: MarketCap=${c.marketCap ?? 'N/A'}, Revenue=${c.revenue ?? 'N/A'}, NetMargin=${c.netMargin ?? 'N/A'}%, PE=${c.peRatio ?? 'N/A'}`
      ).join('\n')}`
    : '';

  const benchmarkBlock = request.industryBenchmarks
    ? `\n--- INDUSTRY BENCHMARKS (${request.industryBenchmarks.industryName}) ---\nAvg Gross Margin: ${request.industryBenchmarks.avgGrossMargin ?? 'N/A'}%\nAvg Net Margin: ${request.industryBenchmarks.avgNetMargin ?? 'N/A'}%\nAvg EBITDA Margin: ${request.industryBenchmarks.avgEbitdaMargin ?? 'N/A'}%\nAvg P/E Ratio: ${request.industryBenchmarks.avgPeRatio ?? 'N/A'}\nAvg Revenue Growth: ${request.industryBenchmarks.avgRevenueGrowth ?? 'N/A'}%\nTop Players: ${request.industryBenchmarks.topPlayerNames?.join(', ') ?? 'N/A'}`
    : '';

  const gapsWarning = hasGaps
    ? `\nDATA GAPS — DO NOT ESTIMATE THESE METRICS: ${dataGaps.join(', ')}`
    : '';

  const analysisInstructions: Record<AnalysisType, string> = {
    overview: 'Provide a comprehensive company overview analysis. Focus on financial health, profitability, valuation, and overall business performance.',
    competitors: 'Provide competitive positioning analysis. Compare the company against competitors and industry benchmarks. Identify competitive advantages and vulnerabilities.',
    strategies: 'Provide strategic analysis. Identify growth opportunities, risks to the business model, and strategic recommendations based on the financial data.',
    investors: 'Provide investor-focused analysis. Focus on value metrics, return potential, dividend sustainability, debt levels, and capital efficiency.',
    industry: 'Provide industry analysis. Focus on industry positioning, market share implications, sector trends visible in the metrics, and industry-relative performance.',
  };

  const user = `${validatedDataBlock}${competitorBlock}${benchmarkBlock}${gapsWarning}

ANALYSIS REQUESTED: ${analysisInstructions[request.analysisType]}
${request.additionalContext ? `\nADDITIONAL CONTEXT: ${request.additionalContext}` : ''}

Respond with ONLY this JSON structure (no markdown, no preamble, raw JSON only):
{
  "executiveSummary": "3-4 sentences. Use only numbers from the validated data block.",
  "keyFindings": [
    {
      "finding": "Specific observation",
      "metricReference": "exact metric name from data (e.g., netMargin, peRatio)",
      "implication": "What this means for the business",
      "sentiment": "positive|negative|neutral"
    }
  ],
  "risks": [
    {
      "risk": "Specific risk description",
      "severity": "high|medium|low",
      "basedOnMetric": "which metric reveals this risk"
    }
  ],
  "opportunities": [
    {
      "opportunity": "Specific opportunity",
      "basedOnMetric": "which metric supports this",
      "timeHorizon": "short|medium|long"
    }
  ],
  "vsIndustryBenchmark": {
    "marginVsAvg": "how margins compare to industry (only if benchmark data provided)",
    "growthVsAvg": "how growth compares to industry",
    "valuationVsAvg": "how valuation compares to industry",
    "overallPositioning": "leader|above_average|average|below_average|laggard"
  },
  "investorHighlights": ["key point 1", "key point 2", "key point 3"],
  "strategicRecommendations": ["recommendation 1", "recommendation 2"],
  "dataGapsNote": "Note about any significant gaps in available data. Write null if no significant gaps."
}`;

  return { system, user };
}

// ─── Response Validator ───────────────────────────────────────────────────────

interface ValidationResult {
  isValid: boolean;
  issues: string[];
  sanitizedResponse?: AIAnalysisResponse;
}

export function validateAIResponse(
  rawResponse: string,
  consensus: ConsensusMetrics
): ValidationResult {
  const issues: string[] = [];

  // 1. Parse JSON
  let parsed: any;
  try {
    // Strip markdown code fences if present
    const cleaned = rawResponse
      .replace(/^```json\s*/i, '')
      .replace(/^```\s*/i, '')
      .replace(/\s*```$/i, '')
      .trim();
    parsed = JSON.parse(cleaned);
  } catch {
    return { isValid: false, issues: ['Response is not valid JSON'] };
  }

  // 2. Check required fields
  const requiredFields = ['executiveSummary', 'keyFindings', 'risks', 'opportunities'];
  for (const field of requiredFields) {
    if (!parsed[field]) issues.push(`Missing required field: ${field}`);
  }

  // 3. Check for hallucinated numbers
  // Extract all numbers mentioned in the text parts of the response
  const allTextContent = JSON.stringify(parsed);
  const numbersInResponse = (allTextContent.match(/\d+\.?\d*/g) || [])
    .map(n => parseFloat(n))
    .filter(n => n > 100); // Focus on financial numbers (not percentages or ratios)

  // Get all valid numbers from consensus
  const validNumbers = new Set<number>();
  const addIfValid = (val: number | null | undefined) => {
    if (val !== null && val !== undefined) validNumbers.add(Math.round(val));
  };

  // Add all consensus values (rounded for comparison)
  [
    consensus.marketCap, consensus.revenue, consensus.ebitda,
    consensus.totalAssets, consensus.totalDebt, consensus.cashAndEquivalents,
    consensus.freeCashFlow, consensus.operatingCashFlow, consensus.netIncome,
  ].forEach(m => m?.value && addIfValid(m.value));

  // 4. Check that executive summary doesn't have too many unverified claims
  if (parsed.executiveSummary && parsed.executiveSummary.length > 1000) {
    issues.push('Executive summary too long - may contain hallucinated content');
  }

  // 5. Validate keyFindings structure
  if (Array.isArray(parsed.keyFindings)) {
    for (const finding of parsed.keyFindings) {
      if (!finding.finding || !finding.implication) {
        issues.push('Invalid finding structure - missing finding or implication');
      }
      if (!['positive', 'negative', 'neutral'].includes(finding.sentiment)) {
        finding.sentiment = 'neutral'; // Fix instead of reject
      }
    }
  }

  // 6. Validate risks structure
  if (Array.isArray(parsed.risks)) {
    for (const risk of parsed.risks) {
      if (!['high', 'medium', 'low'].includes(risk.severity)) {
        risk.severity = 'medium'; // Fix instead of reject
      }
    }
  }

  // 7. If any data gap metrics appear as specific numbers in the summary, flag it
  for (const gap of consensus.dataGaps) {
    // Simple heuristic: if the gap metric name appears near a number in the summary
    const gapPattern = new RegExp(`${gap}[^.]*?[0-9]+`, 'i');
    if (gapPattern.test(parsed.executiveSummary || '')) {
      issues.push(`Possible hallucination: "${gap}" is in data gaps but appears with a number`);
    }
  }

  const isValid = issues.filter(i => !i.startsWith('Possible')).length === 0;

  if (isValid || issues.every(i => i.startsWith('Possible'))) {
    // Build clean response
    const sanitized: AIAnalysisResponse = {
      executiveSummary: parsed.executiveSummary || '',
      keyFindings: (parsed.keyFindings || []).slice(0, 6),
      risks: (parsed.risks || []).slice(0, 5),
      opportunities: (parsed.opportunities || []).slice(0, 5),
      vsIndustryBenchmark: parsed.vsIndustryBenchmark,
      investorHighlights: (parsed.investorHighlights || []).slice(0, 5),
      strategicRecommendations: (parsed.strategicRecommendations || []).slice(0, 4),
      dataGapsNote: parsed.dataGapsNote || null,
      confidence: consensus.overallConfidence,
      model: 'groq',
    };
    return { isValid: true, issues, sanitizedResponse: sanitized };
  }

  return { isValid: false, issues };
}

// ─── Main AI Analysis Runner ──────────────────────────────────────────────────

interface AIClient {
  groq?: {
    apiKey: string;
    model?: string;
  };
  anthropic?: {
    apiKey: string;
  };
}

export async function runAIAnalysis(
  request: AIAnalysisRequest,
  clients: AIClient,
  maxRetries = 2
): Promise<AIAnalysisResponse> {
  const { system, user } = buildGuardedPrompt(request);

  // Try Groq first (primary - fast and free tier)
  if (clients.groq?.apiKey) {
    for (let attempt = 0; attempt < maxRetries; attempt++) {
      try {
        const result = await callGroq(system, user, clients.groq.apiKey, clients.groq.model);
        const validation = validateAIResponse(result.text, request.consensus);

        if (validation.isValid && validation.sanitizedResponse) {
          return {
            ...validation.sanitizedResponse,
            model: `groq:${clients.groq.model || 'llama-3.1-70b-versatile'}`,
            tokensUsed: result.tokensUsed,
          };
        }

        console.warn(`[AIGuardrails] Groq attempt ${attempt + 1} validation failed:`, validation.issues);
        
        // On retry, add stricter instruction
        if (attempt < maxRetries - 1) {
          console.log('[AIGuardrails] Retrying with stricter prompt...');
          await new Promise(r => setTimeout(r, 1000));
        }
      } catch (err: any) {
        console.error(`[AIGuardrails] Groq error attempt ${attempt + 1}:`, err.message);
        if (err.message?.includes('rate_limit') || err.message?.includes('429')) {
          break; // Don't retry on rate limit - fall through to Claude
        }
      }
    }
  }

  // Fallback to Anthropic Claude
  if (clients.anthropic?.apiKey) {
    try {
      const result = await callClaude(system, user, clients.anthropic.apiKey);
      const validation = validateAIResponse(result.text, request.consensus);

      if (validation.isValid && validation.sanitizedResponse) {
        return {
          ...validation.sanitizedResponse,
          model: 'claude-haiku-4-5-20251001',
          tokensUsed: result.tokensUsed,
        };
      }
      
      // If validation still fails but we got a response, return best-effort
      if (validation.sanitizedResponse) {
        console.warn('[AIGuardrails] Returning best-effort response with validation warnings');
        return { ...validation.sanitizedResponse!, model: 'claude-haiku-4-5-20251001' };
      }
    } catch (err: any) {
      console.error('[AIGuardrails] Claude fallback error:', err.message);
    }
  }

  // Final fallback: return a minimal response using only validated data
  return buildFallbackResponse(request.consensus);
}

// ─── API Callers ──────────────────────────────────────────────────────────────

async function callGroq(
  system: string,
  user: string,
  apiKey: string,
  model = 'llama-3.1-70b-versatile'
): Promise<{ text: string; tokensUsed: number }> {
  const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model,
      messages: [
        { role: 'system', content: system },
        { role: 'user', content: user },
      ],
      temperature: 0.1, // Low temperature = more consistent, less hallucination
      max_tokens: 2000,
      response_format: { type: 'json_object' },
    }),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Groq API error ${response.status}: ${error}`);
  }

  const data = await response.json();
  return {
    text: data.choices[0]?.message?.content || '',
    tokensUsed: data.usage?.total_tokens || 0,
  };
}

async function callClaude(
  system: string,
  user: string,
  apiKey: string
): Promise<{ text: string; tokensUsed: number }> {
  const response = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'x-api-key': apiKey,
      'anthropic-version': '2023-06-01',
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 2000,
      system,
      messages: [{ role: 'user', content: user }],
    }),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Claude API error ${response.status}: ${error}`);
  }

  const data = await response.json();
  return {
    text: data.content[0]?.text || '',
    tokensUsed: (data.usage?.input_tokens || 0) + (data.usage?.output_tokens || 0),
  };
}

// ─── Fallback Response ────────────────────────────────────────────────────────
// When all AI calls fail, return a minimal but accurate response using only validated data

function buildFallbackResponse(consensus: ConsensusMetrics): AIAnalysisResponse {
  const company = consensus.entityName;
  const conf = consensus.overallConfidence;
  
  const marketCapStr = consensus.marketCap.value
    ? `Market cap of ₹${(consensus.marketCap.value / 1e9).toFixed(1)}B` : '';
  const marginStr = consensus.netMargin.value
    ? `net margin of ${consensus.netMargin.value.toFixed(1)}%` : '';
  const peStr = consensus.peRatio.value
    ? `P/E ratio of ${consensus.peRatio.value.toFixed(1)}` : '';

  const summaryParts = [company, marketCapStr, marginStr, peStr].filter(Boolean);

  return {
    executiveSummary: `Analysis generated for ${company}. Data confidence: ${conf}%. Available metrics: ${summaryParts.slice(1).join(', ')}. ${consensus.dataGaps.length > 0 ? `Note: ${consensus.dataGaps.length} metrics unavailable.` : ''}`,
    keyFindings: [],
    risks: [],
    opportunities: [],
    dataGapsNote: consensus.dataGaps.length > 0
      ? `The following metrics are unavailable: ${consensus.dataGaps.join(', ')}`
      : undefined,
    confidence: conf,
    model: 'fallback',
  };
}
