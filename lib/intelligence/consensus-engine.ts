/**
 * EBITA Intelligence - Consensus Engine
 * 
 * Takes raw data from multiple sources and produces a single validated,
 * weighted consensus output. This is the core of the Data Intelligence Layer.
 * 
 * The AI ONLY ever receives the output of this engine - never raw API data.
 */

const FRESHNESS_CUTOFF_MONTHS = 36; // Hard cutoff: discard data older than 36 months

export interface SourceValue {
  value: number | null;
  source: string;
  fetchedAt: Date;
  reliability: number; // 0-1 trust weight
}

export interface ConsensusMetric {
  value: number | null;
  confidence: number; // 0-100
  variance: number | null; // % spread between sources
  hasWarning: boolean;
  warningReason?: string;
  sources: { source: string; value: number | null; weight: number }[];
  isAvailable: boolean;
}

export interface ConsensusMetrics {
  // Identity
  entityId: string;
  entityName: string;
  entityType: 'company' | 'industry';
  fiscalPeriod: string;

  // Market Data
  marketCap: ConsensusMetric;
  currentPrice: ConsensusMetric;
  priceChange1D: ConsensusMetric;
  priceChange1Y: ConsensusMetric;
  weekHigh52: ConsensusMetric;
  weekLow52: ConsensusMetric;
  volume: ConsensusMetric;

  // Income Statement
  revenue: ConsensusMetric;
  revenueGrowthYoy: ConsensusMetric;
  grossProfit: ConsensusMetric;
  grossMargin: ConsensusMetric;
  operatingIncome: ConsensusMetric;
  operatingMargin: ConsensusMetric;
  netIncome: ConsensusMetric;
  netMargin: ConsensusMetric;
  ebitda: ConsensusMetric;
  ebitdaMargin: ConsensusMetric;
  eps: ConsensusMetric;

  // Balance Sheet
  totalAssets: ConsensusMetric;
  totalDebt: ConsensusMetric;
  cashAndEquivalents: ConsensusMetric;
  shareholderEquity: ConsensusMetric;

  // Ratios
  peRatio: ConsensusMetric;
  pbRatio: ConsensusMetric;
  psRatio: ConsensusMetric;
  evToEbitda: ConsensusMetric;
  debtToEquity: ConsensusMetric;
  currentRatio: ConsensusMetric;
  roe: ConsensusMetric;
  roa: ConsensusMetric;
  roic: ConsensusMetric;

  // Cash Flow
  freeCashFlow: ConsensusMetric;
  operatingCashFlow: ConsensusMetric;

  // Overall metadata
  overallConfidence: number;
  sourcesUsed: string[];
  dataGaps: string[]; // metrics that had no data
  varianceWarnings: string[]; // metrics with >15% variance
  fetchedAt: Date;
  expiresAt: Date;
  
  // Confidence explanation (FIX 2 - WHY confidence is high/low)
  confidenceExplanation: ConfidenceExplanation;
}

export interface ConfidenceExplanation {
  overallScore: number;
  level: 'high' | 'medium' | 'low' | 'very_low';
  reasons: string[];
  factors: {
    sourceCount: number;
    pdfCount: number;
    freshnessScore: number;
    varianceScore: number;
    dataCompleteness: number;
  };
}

// Source trust weights - these are fixed and based on source reliability
export const SOURCE_WEIGHTS: Record<string, number> = {
  // Exchange filings (highest priority) - FIX 5: Weighted source boosting
  'nse_official': 1.30,    // +30% boost
  'bse_official': 1.28,     // +28% boost
  'sec_filings': 1.30,
  
  // Official PDFs (annual reports, investor presentations)
  'pdf_annual_report': 1.20, // +20% boost
  'pdf_investor_presentation': 1.20,
  'pdf_earnings': 1.15,
  
  // Financial APIs (structured data)
  'fmp': 1.15,              // +15% boost
  'twelvedata': 1.10,
  'polygon': 1.15,
  'alpha_vantage': 1.00,
  'yfinance': 0.95,
  
  // News (medium)
  'reuters': 0.85,
  'bloomberg': 0.88,
  'moneycontrol': 0.80,
  'economic_times': 0.75,
  
  // Crawled content (lower)
  'crawl_official': 0.85,
  'crawl_financial': 0.80,
  'crawl_news': 0.65,
  
  // Search snippets (lowest)
  'search': 0.55,
  'duckduckgo': 0.50,
  
  // AI inference (lowest trust)
  'ai_inference': 0.35,
};

const VARIANCE_WARNING_THRESHOLD = 0.15; // 15% spread triggers warning
const MIN_SOURCES_FOR_CONSENSUS = 1;
const STALENESS_PENALTY_PER_HOUR = 0.005; // confidence drops 0.5% per hour

/**
 * Calculate weighted median of an array of values.
 * More robust than weighted mean - resistant to outliers.
 */
function weightedMedian(values: { value: number; weight: number }[]): number | null {
  if (values.length === 0) return null;
  if (values.length === 1) return values[0].value;

  // Sort by value
  const sorted = [...values].sort((a, b) => a.value - b.value);
  const totalWeight = sorted.reduce((sum, v) => sum + v.weight, 0);

  let cumWeight = 0;
  for (const item of sorted) {
    cumWeight += item.weight;
    if (cumWeight >= totalWeight / 2) {
      return item.value;
    }
  }

  return sorted[sorted.length - 1].value;
}

/**
 * Remove statistical outliers using modified Z-score.
 * Keeps values within 2 standard deviations of the median.
 */
function removeOutliers(values: { value: number; weight: number; source: string }[]): {
  cleaned: { value: number; weight: number; source: string }[];
  removed: string[];
} {
  if (values.length <= 2) return { cleaned: values, removed: [] };

  const vals = values.map(v => v.value);
  const median = vals.sort((a, b) => a - b)[Math.floor(vals.length / 2)];
  const deviations = vals.map(v => Math.abs(v - median));
  const mad = deviations.sort((a, b) => a - b)[Math.floor(deviations.length / 2)];
  
  // Modified Z-score threshold = 2.5
  const threshold = 2.5 * 1.4826 * mad;

  const cleaned: typeof values = [];
  const removed: string[] = [];

  for (const item of values) {
    if (Math.abs(item.value - median) <= threshold || threshold === 0) {
      cleaned.push(item);
    } else {
      removed.push(`${item.source}:${item.value}`);
    }
  }

  return { cleaned: cleaned.length > 0 ? cleaned : values, removed };
}

/**
 * Calculate freshness factor - penalizes stale data
 * Hard cutoff: data older than 36 months returns 0 (discarded)
 */
function freshnessFactor(fetchedAt: Date): number {
  const hoursOld = (Date.now() - fetchedAt.getTime()) / (1000 * 60 * 60);
  const monthsOld = hoursOld / (24 * 30);
  
  // Hard cutoff: discard data older than 36 months
  if (monthsOld > FRESHNESS_CUTOFF_MONTHS) {
    return 0;
  }
  
  return Math.max(0.3, 1 - (hoursOld * STALENESS_PENALTY_PER_HOUR));
}

/**
 * Build a single ConsensusMetric from an array of source values.
 * This is the core calculation for each metric.
 */
export function buildConsensusMetric(
  sourceValues: SourceValue[],
  metricName: string
): ConsensusMetric {
  // Filter out nulls and data older than 36 months
  const cutoffDate = new Date();
  cutoffDate.setMonth(cutoffDate.getMonth() - FRESHNESS_CUTOFF_MONTHS);
  
  const available = sourceValues.filter(sv => 
    sv.value !== null && 
    sv.value !== undefined && 
    !isNaN(sv.value as number) &&
    sv.fetchedAt >= cutoffDate
  );

  if (available.length < MIN_SOURCES_FOR_CONSENSUS) {
    return {
      value: null,
      confidence: 0,
      variance: null,
      hasWarning: false,
      sources: sourceValues.map(sv => ({ source: sv.source, value: sv.value, weight: sv.reliability })),
      isAvailable: false,
    };
  }

  // Apply freshness to weights
  const weightedValues = available.map(sv => ({
    value: sv.value as number,
    weight: sv.reliability * freshnessFactor(sv.fetchedAt),
    source: sv.source,
  }));

  // Remove outliers
  const { cleaned, removed } = removeOutliers(weightedValues);

  // Calculate weighted median (consensus value)
  const consensusValue = weightedMedian(cleaned);

  // Calculate variance (max-min spread as % of median)
  const vals = cleaned.map(v => v.value);
  const minVal = Math.min(...vals);
  const maxVal = Math.max(...vals);
  const variance = consensusValue && consensusValue !== 0
    ? (maxVal - minVal) / Math.abs(consensusValue)
    : 0;

  const hasVarianceWarning = variance > VARIANCE_WARNING_THRESHOLD;

  // Calculate confidence score
  const avgWeight = cleaned.reduce((sum, v) => sum + v.weight, 0) / cleaned.length;
  const sourceCount = cleaned.length;
  const agreementBonus = hasVarianceWarning ? 0 : 10;
  const multiSourceBonus = sourceCount >= 3 ? 15 : sourceCount >= 2 ? 8 : 0;
  const outlierPenalty = removed.length * 5;

  const confidence = Math.min(100, Math.max(0,
    Math.round(avgWeight * 70 + agreementBonus + multiSourceBonus - outlierPenalty)
  ));

  return {
    value: consensusValue,
    confidence,
    variance: Math.round(variance * 1000) / 10, // as percentage, 1 decimal
    hasWarning: hasVarianceWarning || removed.length > 0,
    warningReason: hasVarianceWarning
      ? `High variance (${Math.round(variance * 100)}%) across sources`
      : removed.length > 0
      ? `Outliers removed from: ${removed.join(', ')}`
      : undefined,
    sources: sourceValues.map(sv => ({ source: sv.source, value: sv.value, weight: sv.reliability })),
    isAvailable: true,
  };
}

/**
 * Main consensus builder - takes raw multi-source data and returns
 * a single validated ConsensusMetrics object.
 * 
 * This is what the AI receives - nothing else.
 */
export function buildConsensus(
  entityId: string,
  entityName: string,
  entityType: 'company' | 'industry',
  rawSourceData: Record<string, Record<string, number | null>>,
  fetchedAt: Date = new Date()
): ConsensusMetrics {
  
  // Map raw data into SourceValue arrays per metric
  function getSourceValues(metricKey: string): SourceValue[] {
    return Object.entries(rawSourceData).map(([sourceName, metrics]) => ({
      value: metrics[metricKey] ?? null,
      source: sourceName,
      fetchedAt,
      reliability: SOURCE_WEIGHTS[sourceName] ?? 0.5,
    }));
  }

  // Build each metric
  const metrics = {
    marketCap: buildConsensusMetric(getSourceValues('marketCap'), 'marketCap'),
    currentPrice: buildConsensusMetric(getSourceValues('currentPrice'), 'currentPrice'),
    priceChange1D: buildConsensusMetric(getSourceValues('priceChange1D'), 'priceChange1D'),
    priceChange1Y: buildConsensusMetric(getSourceValues('priceChange1Y'), 'priceChange1Y'),
    weekHigh52: buildConsensusMetric(getSourceValues('weekHigh52'), 'weekHigh52'),
    weekLow52: buildConsensusMetric(getSourceValues('weekLow52'), 'weekLow52'),
    volume: buildConsensusMetric(getSourceValues('volume'), 'volume'),
    revenue: buildConsensusMetric(getSourceValues('revenue'), 'revenue'),
    revenueGrowthYoy: buildConsensusMetric(getSourceValues('revenueGrowthYoy'), 'revenueGrowthYoy'),
    grossProfit: buildConsensusMetric(getSourceValues('grossProfit'), 'grossProfit'),
    grossMargin: buildConsensusMetric(getSourceValues('grossMargin'), 'grossMargin'),
    operatingIncome: buildConsensusMetric(getSourceValues('operatingIncome'), 'operatingIncome'),
    operatingMargin: buildConsensusMetric(getSourceValues('operatingMargin'), 'operatingMargin'),
    netIncome: buildConsensusMetric(getSourceValues('netIncome'), 'netIncome'),
    netMargin: buildConsensusMetric(getSourceValues('netMargin'), 'netMargin'),
    ebitda: buildConsensusMetric(getSourceValues('ebitda'), 'ebitda'),
    ebitdaMargin: buildConsensusMetric(getSourceValues('ebitdaMargin'), 'ebitdaMargin'),
    eps: buildConsensusMetric(getSourceValues('eps'), 'eps'),
    totalAssets: buildConsensusMetric(getSourceValues('totalAssets'), 'totalAssets'),
    totalDebt: buildConsensusMetric(getSourceValues('totalDebt'), 'totalDebt'),
    cashAndEquivalents: buildConsensusMetric(getSourceValues('cashAndEquivalents'), 'cashAndEquivalents'),
    shareholderEquity: buildConsensusMetric(getSourceValues('shareholderEquity'), 'shareholderEquity'),
    peRatio: buildConsensusMetric(getSourceValues('peRatio'), 'peRatio'),
    pbRatio: buildConsensusMetric(getSourceValues('pbRatio'), 'pbRatio'),
    psRatio: buildConsensusMetric(getSourceValues('psRatio'), 'psRatio'),
    evToEbitda: buildConsensusMetric(getSourceValues('evToEbitda'), 'evToEbitda'),
    debtToEquity: buildConsensusMetric(getSourceValues('debtToEquity'), 'debtToEquity'),
    currentRatio: buildConsensusMetric(getSourceValues('currentRatio'), 'currentRatio'),
    roe: buildConsensusMetric(getSourceValues('roe'), 'roe'),
    roa: buildConsensusMetric(getSourceValues('roa'), 'roa'),
    roic: buildConsensusMetric(getSourceValues('roic'), 'roic'),
    freeCashFlow: buildConsensusMetric(getSourceValues('freeCashFlow'), 'freeCashFlow'),
    operatingCashFlow: buildConsensusMetric(getSourceValues('operatingCashFlow'), 'operatingCashFlow'),
  };

  // Calculate overall confidence
  const availableMetrics = Object.values(metrics).filter(m => m.isAvailable);
  const overallConfidence = availableMetrics.length > 0
    ? Math.round(availableMetrics.reduce((sum, m) => sum + m.confidence, 0) / availableMetrics.length)
    : 0;

  // Collect data gaps and variance warnings
  const dataGaps = Object.entries(metrics)
    .filter(([, m]) => !m.isAvailable)
    .map(([key]) => key);

  const varianceWarnings = Object.entries(metrics)
    .filter(([, m]) => m.hasWarning && m.isAvailable)
    .map(([key, m]) => `${key}: ${m.warningReason}`);

  const sourcesUsed = [...new Set(Object.keys(rawSourceData))];

  // TTL: price data expires in 15min, financials in 24h
  const expiresAt = new Date(fetchedAt.getTime() + 24 * 60 * 60 * 1000);

  // Generate confidence explanation (FIX 2)
  const confidenceExplanation = generateConfidenceExplanation(
    overallConfidence,
    sourcesUsed,
    dataGaps,
    varianceWarnings,
    fetchedAt
  );

  return {
    entityId,
    entityName,
    entityType,
    fiscalPeriod: 'TTM',
    ...metrics,
    overallConfidence,
    sourcesUsed,
    dataGaps,
    varianceWarnings,
    fetchedAt,
    expiresAt,
    confidenceExplanation,
  };
}

/**
 * Generate human-readable explanation of WHY confidence is high/low
 * This helps users understand the reliability of the data
 */
function generateConfidenceExplanation(
  overallConfidence: number,
  sourcesUsed: string[],
  dataGaps: string[],
  varianceWarnings: string[],
  fetchedAt: Date
): ConfidenceExplanation {
  const reasons: string[] = [];
  
  // Count different source types
  let pdfCount = 0;
  let officialSourceCount = 0;
  let webSourceCount = 0;
  
  for (const source of sourcesUsed) {
    if (source.includes('pdf') || source.includes('PDF')) {
      pdfCount++;
    } else if (source.includes('nse') || source.includes('bse') || source.includes('sec') || source.includes('official')) {
      officialSourceCount++;
    } else {
      webSourceCount++;
    }
  }
  
  // Calculate freshness score (0-100)
  const hoursOld = (Date.now() - fetchedAt.getTime()) / (1000 * 60 * 60);
  let freshnessScore = 100;
  if (hoursOld > 24 * 30) freshnessScore = 30; // > 1 month
  else if (hoursOld > 24 * 6) freshnessScore = 60; // > 6 days
  else if (hoursOld > 24) freshnessScore = 80; // > 1 day
  
  // Calculate variance score
  const varianceScore = varianceWarnings.length === 0 ? 100 : Math.max(0, 100 - varianceWarnings.length * 20);
  
  // Calculate data completeness
  const totalMetrics = 35; // Total possible metrics
  const availableMetrics = totalMetrics - dataGaps.length;
  const dataCompleteness = Math.round((availableMetrics / totalMetrics) * 100);
  
  // Build reasons based on factors
  if (overallConfidence >= 70) {
    reasons.push(`High confidence: ${sourcesUsed.length} financial sources providing consistent data`);
    if (pdfCount >= 1) reasons.push(`${pdfCount} PDF document(s) with official financial data`);
    if (officialSourceCount >= 1) reasons.push(`${officialSourceCount} official exchange source(s)`);
    if (freshnessScore >= 80) reasons.push('Data is fresh (less than 24 hours old)');
  } else if (overallConfidence >= 50) {
    reasons.push(`Medium confidence: ${sourcesUsed.length} sources with some variance`);
    if (webSourceCount > 2) reasons.push('Reliance on web sources - may have inconsistencies');
    if (dataCompleteness < 70) reasons.push(`Only ${dataCompleteness}% of metrics available`);
  } else if (overallConfidence >= 30) {
    reasons.push(`Low confidence: Limited sources or high variance`);
    if (sourcesUsed.length <= 1) reasons.push('Only 1 source available - cannot verify accuracy');
    if (varianceWarnings.length > 0) reasons.push(`${varianceWarnings.length} metrics show conflicting values`);
  } else {
    reasons.push('Very low confidence - insufficient reliable data');
    reasons.push('AI analysis blocked until more data is collected');
  }
  
  // Determine level
  let level: ConfidenceExplanation['level'];
  if (overallConfidence >= 70) level = 'high';
  else if (overallConfidence >= 50) level = 'medium';
  else if (overallConfidence >= 30) level = 'low';
  else level = 'very_low';
  
  return {
    overallScore: overallConfidence,
    level,
    reasons,
    factors: {
      sourceCount: sourcesUsed.length,
      pdfCount,
      freshnessScore,
      varianceScore,
      dataCompleteness,
    },
  };
}

/**
 * Format consensus metrics for AI prompt injection.
 * Produces a clean, structured text block the AI can reference.
 * Missing values are explicitly marked as UNAVAILABLE.
 */
export function formatForAI(consensus: ConsensusMetrics): string {
  function fmt(metric: ConsensusMetric, label: string, isCurrency = false, multiplier = 1): string {
    if (!metric.isAvailable || metric.value === null) {
      return `${label}: UNAVAILABLE`;
    }
    const val = metric.value * multiplier;
    const formatted = isCurrency
      ? val > 1e9 ? `₹${(val / 1e9).toFixed(2)}B` : val > 1e7 ? `₹${(val / 1e7).toFixed(2)}Cr` : `₹${val.toFixed(2)}`
      : val.toFixed(2);
    const warning = metric.hasWarning ? ` [HIGH VARIANCE - treat with caution]` : '';
    return `${label}: ${formatted} (confidence: ${metric.confidence}%)${warning}`;
  }

  return `
=== VALIDATED CONSENSUS DATA FOR ${consensus.entityName.toUpperCase()} ===
Overall Data Confidence: ${consensus.overallConfidence}%
Sources: ${consensus.sourcesUsed.join(', ')}
Data As Of: ${consensus.fetchedAt.toISOString()}

--- MARKET DATA ---
${fmt(consensus.marketCap, 'Market Cap', true)}
${fmt(consensus.currentPrice, 'Current Price', true)}
${fmt(consensus.priceChange1D, '1-Day Price Change', false)}%
${fmt(consensus.priceChange1Y, '1-Year Price Change', false)}%
${fmt(consensus.weekHigh52, '52-Week High', true)}
${fmt(consensus.weekLow52, '52-Week Low', true)}

--- INCOME STATEMENT ---
${fmt(consensus.revenue, 'Revenue (TTM)', true)}
${fmt(consensus.revenueGrowthYoy, 'Revenue Growth YoY', false)}%
${fmt(consensus.grossMargin, 'Gross Margin', false)}%
${fmt(consensus.operatingMargin, 'Operating Margin', false)}%
${fmt(consensus.netMargin, 'Net Margin', false)}%
${fmt(consensus.ebitda, 'EBITDA', true)}
${fmt(consensus.ebitdaMargin, 'EBITDA Margin', false)}%
${fmt(consensus.eps, 'EPS', true)}

--- BALANCE SHEET ---
${fmt(consensus.totalAssets, 'Total Assets', true)}
${fmt(consensus.totalDebt, 'Total Debt', true)}
${fmt(consensus.cashAndEquivalents, 'Cash & Equivalents', true)}
${fmt(consensus.debtToEquity, 'Debt to Equity', false)}

--- VALUATION RATIOS ---
${fmt(consensus.peRatio, 'P/E Ratio', false)}
${fmt(consensus.pbRatio, 'P/B Ratio', false)}
${fmt(consensus.evToEbitda, 'EV/EBITDA', false)}

--- RETURNS ---
${fmt(consensus.roe, 'Return on Equity (ROE)', false)}%
${fmt(consensus.roa, 'Return on Assets (ROA)', false)}%
${fmt(consensus.roic, 'Return on Invested Capital (ROIC)', false)}%

--- CASH FLOW ---
${fmt(consensus.freeCashFlow, 'Free Cash Flow', true)}
${fmt(consensus.operatingCashFlow, 'Operating Cash Flow', true)}

${consensus.dataGaps.length > 0 ? `\n--- DATA GAPS (DO NOT ESTIMATE THESE) ---\n${consensus.dataGaps.join(', ')}` : ''}
${consensus.varianceWarnings.length > 0 ? `\n--- VARIANCE WARNINGS ---\n${consensus.varianceWarnings.join('\n')}` : ''}
=== END VALIDATED DATA ===
`.trim();
}

/**
 * Format data provenance for display to users
 * Shows: source count, last update, reliability scores
 */
export function formatProvenance(consensus: ConsensusMetrics): string {
  const { confidenceExplanation, sourcesUsed, fetchedAt, overallConfidence } = consensus;
  
  const lastUpdate = new Date(fetchedAt).toLocaleString();
  const hoursOld = (Date.now() - new Date(fetchedAt).getTime()) / (1000 * 60 * 60);
  const freshness = hoursOld < 1 ? '< 1 hour ago' : 
                   hoursOld < 24 ? `${Math.round(hoursOld)} hours ago` : 
                   `${Math.round(hoursOld / 24)} days ago`;
  
  return `
╔══════════════════════════════════════════════════════════════╗
║                    DATA PROVENANCE                           ║
╠══════════════════════════════════════════════════════════════╣
║  Source Count:      ${sourcesUsed.length} sources                          ║
║  Last Update:       ${lastUpdate.padEnd(36)}║
║  Data Age:          ${freshness.padEnd(36)}║
║  Reliability Score: ${overallConfidence}% ${overallConfidence >= 70 ? '✓ HIGH' : overallConfidence >= 50 ? '⚠ MEDIUM' : '✗ LOW'.padEnd(26)}║
╠══════════════════════════════════════════════════════════════╣
║  CONFIDENCE BREAKDOWN:                                      ║
${confidenceExplanation.reasons.map(r => `║  • ${r.padEnd(58)}║`).join('\n')}
╚══════════════════════════════════════════════════════════════╝
`.trim();
}
