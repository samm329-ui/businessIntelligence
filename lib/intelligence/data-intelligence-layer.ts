/**
 * EBITA Intelligence - Data Intelligence Layer (DIL)
 * 
 * The central orchestration layer. Every data request passes through here.
 * Runs Memory Bot and Realtime Bot in parallel, then feeds both into
 * the Consensus Engine. The AI never sees raw source data.
 */

import { buildConsensus, formatForAI, ConsensusMetrics, SOURCE_WEIGHTS } from './consensus-engine';

// ─── Types ────────────────────────────────────────────────────────────────────

export interface DILRequest {
  entityId: string;
  entityName: string;
  entityType: 'company' | 'industry';
  ticker?: string;
  tickerNSE?: string;
  tickerBSE?: string;
  region: 'INDIA' | 'GLOBAL';
  forceRefresh?: boolean;
}

export interface DILResponse {
  consensus: ConsensusMetrics;
  formattedForAI: string;
  cacheHit: boolean;
  fetchTimeMs: number;
  sourcesAttempted: string[];
  sourcesFailed: string[];
}

// Raw data shape from any source - all optional, all nullable
export interface RawFinancialData {
  marketCap?: number | null;
  currentPrice?: number | null;
  priceChange1D?: number | null;
  priceChange1Y?: number | null;
  weekHigh52?: number | null;
  weekLow52?: number | null;
  volume?: number | null;
  revenue?: number | null;
  revenueGrowthYoy?: number | null;
  grossProfit?: number | null;
  grossMargin?: number | null;
  operatingIncome?: number | null;
  operatingMargin?: number | null;
  netIncome?: number | null;
  netMargin?: number | null;
  ebitda?: number | null;
  ebitdaMargin?: number | null;
  eps?: number | null;
  totalAssets?: number | null;
  totalDebt?: number | null;
  cashAndEquivalents?: number | null;
  shareholderEquity?: number | null;
  peRatio?: number | null;
  pbRatio?: number | null;
  psRatio?: number | null;
  evToEbitda?: number | null;
  debtToEquity?: number | null;
  currentRatio?: number | null;
  roe?: number | null;
  roa?: number | null;
  roic?: number | null;
  freeCashFlow?: number | null;
  operatingCashFlow?: number | null;
  [key: string]: number | null | undefined;
}

// ─── In-Memory Cache ──────────────────────────────────────────────────────────
// Fast cache layer - Supabase is the persistent store
const memoryCache = new Map<string, { data: ConsensusMetrics; expiresAt: number }>();

function getCacheKey(entityId: string): string {
  return `dil:${entityId}`;
}

function getFromMemoryCache(entityId: string): ConsensusMetrics | null {
  const key = getCacheKey(entityId);
  const cached = memoryCache.get(key);
  if (!cached) return null;
  if (Date.now() > cached.expiresAt) {
    memoryCache.delete(key);
    return null;
  }
  return cached.data;
}

function setMemoryCache(entityId: string, data: ConsensusMetrics, ttlMs = 15 * 60 * 1000): void {
  const key = getCacheKey(entityId);
  memoryCache.set(key, { data, expiresAt: Date.now() + ttlMs });
}

// ─── Memory Bot ──────────────────────────────────────────────────────────────
// Reads from: dataset, Supabase cache, historical records
// Purpose: Fast baseline, sub-100ms

async function runMemoryBot(
  request: DILRequest,
  supabaseClient?: any
): Promise<{ sourceName: string; data: RawFinancialData } | null> {
  try {
    if (!supabaseClient) return null;

    // Query the consensus_metrics table for the most recent data
    const { data, error } = await supabaseClient
      .from('consensus_metrics')
      .select('*')
      .eq('entity_id', request.entityId)
      .order('fetched_at', { ascending: false })
      .limit(1)
      .single();

    if (error || !data) return null;

    // Check if still fresh (within TTL)
    const expiresAt = new Date(data.expires_at);
    if (expiresAt < new Date()) return null;

    return {
      sourceName: 'memory_cache',
      data: {
        marketCap: data.market_cap,
        currentPrice: data.current_price,
        revenue: data.revenue,
        revenueGrowthYoy: data.revenue_growth,
        grossMargin: data.gross_margin,
        operatingMargin: data.operating_margin,
        netMargin: data.net_margin,
        ebitda: data.ebitda,
        ebitdaMargin: data.ebitda_margin,
        eps: data.eps,
        peRatio: data.pe_ratio,
        pbRatio: data.pb_ratio,
        evToEbitda: data.ev_to_ebitda,
        debtToEquity: data.debt_to_equity,
        currentRatio: data.current_ratio,
        roe: data.roe,
        roa: data.roa,
        roic: data.roic,
        freeCashFlow: data.free_cash_flow,
        operatingCashFlow: data.operating_cash_flow,
        totalDebt: data.total_debt,
        cashAndEquivalents: data.cash_and_equivalents,
      },
    };
  } catch (err) {
    console.error('[MemoryBot] Error:', err);
    return null;
  }
}

// ─── Realtime Bot ─────────────────────────────────────────────────────────────
// Runs multiple fetchers in parallel - handles failures gracefully
// Each fetcher is isolated - one failing doesn't block others

interface FetcherResult {
  sourceName: string;
  data: RawFinancialData;
  success: boolean;
  error?: string;
}

async function runFetcher(
  name: string,
  fetchFn: () => Promise<RawFinancialData | null>
): Promise<FetcherResult> {
  try {
    const data = await Promise.race([
      fetchFn(),
      new Promise<null>((_, reject) => setTimeout(() => reject(new Error('Timeout')), 8000)),
    ]);
    if (!data) return { sourceName: name, data: {}, success: false, error: 'No data returned' };
    return { sourceName: name, data, success: true };
  } catch (err: any) {
    return { sourceName: name, data: {}, success: false, error: err.message };
  }
}

async function runRealtimeBot(
  request: DILRequest,
  fetchers: {
    yfinance?: (ticker: string, region: string) => Promise<RawFinancialData | null>;
    nse?: (ticker: string) => Promise<RawFinancialData | null>;
    bse?: (ticker: string) => Promise<RawFinancialData | null>;
    fmp?: (ticker: string) => Promise<RawFinancialData | null>;
    alphaVantage?: (ticker: string) => Promise<RawFinancialData | null>;
    wikipedia?: (companyName: string) => Promise<RawFinancialData | null>;
  }
): Promise<FetcherResult[]> {
  const fetchPromises: Promise<FetcherResult>[] = [];

  const ticker = request.ticker || request.tickerNSE || request.entityName;
  const isIndian = request.region === 'INDIA';

  // Always try yfinance - free and comprehensive
  if (fetchers.yfinance) {
    const yTicker = isIndian && request.tickerNSE ? `${request.tickerNSE}.NS` : ticker;
    fetchPromises.push(runFetcher('yfinance', () => fetchers.yfinance!(yTicker, request.region)));
  }

  // Indian-specific sources
  if (isIndian) {
    if (fetchers.nse && (request.tickerNSE || request.ticker)) {
      fetchPromises.push(runFetcher('nse_official', () => fetchers.nse!(request.tickerNSE || request.ticker!)));
    }
    if (fetchers.bse && (request.tickerBSE || request.ticker)) {
      fetchPromises.push(runFetcher('bse_official', () => fetchers.bse!(request.tickerBSE || request.ticker!)));
    }
  }

  // Global financial data APIs (rate-limited, use carefully)
  if (fetchers.fmp && ticker) {
    fetchPromises.push(runFetcher('fmp', () => fetchers.fmp!(ticker)));
  }
  if (fetchers.alphaVantage && ticker) {
    fetchPromises.push(runFetcher('alpha_vantage', () => fetchers.alphaVantage!(ticker)));
  }

  // Wikipedia - free, unlimited, good for company overview
  if (fetchers.wikipedia) {
    fetchPromises.push(runFetcher('wikipedia', () => fetchers.wikipedia!(request.entityName)));
  }

  // Run all fetchers in parallel - collect all results regardless of failures
  const results = await Promise.allSettled(fetchPromises);

  return results.map((result, idx) => {
    if (result.status === 'fulfilled') return result.value;
    return {
      sourceName: `unknown_${idx}`,
      data: {},
      success: false,
      error: result.reason?.message || 'Unknown error',
    };
  });
}

// ─── Main DIL Function ────────────────────────────────────────────────────────

export async function runDataIntelligenceLayer(
  request: DILRequest,
  fetchers: Parameters<typeof runRealtimeBot>[1],
  supabaseClient?: any
): Promise<DILResponse> {
  const startTime = Date.now();
  const sourcesAttempted: string[] = [];
  const sourcesFailed: string[] = [];

  // 1. Check in-memory cache first (fastest path)
  if (!request.forceRefresh) {
    const cached = getFromMemoryCache(request.entityId);
    if (cached) {
      return {
        consensus: cached,
        formattedForAI: formatForAI(cached),
        cacheHit: true,
        fetchTimeMs: Date.now() - startTime,
        sourcesAttempted: ['memory_cache'],
        sourcesFailed: [],
      };
    }
  }

  // 2. Run Memory Bot and Realtime Bot in parallel
  const [memoryResult, realtimeResults] = await Promise.all([
    runMemoryBot(request, supabaseClient),
    runRealtimeBot(request, fetchers),
  ]);

  // 3. Collect all raw source data
  const rawSourceData: Record<string, Record<string, number | null>> = {};

  if (memoryResult) {
    sourcesAttempted.push('memory_cache');
    // Give cached data a weight boost since it was already consensus-processed
    rawSourceData['memory_cache'] = memoryResult.data as Record<string, number | null>;
    // Override weight to be treated as a high-confidence source
    SOURCE_WEIGHTS['memory_cache'] = 0.90;
  }

  for (const result of realtimeResults) {
    sourcesAttempted.push(result.sourceName);
    if (result.success && Object.keys(result.data).length > 0) {
      rawSourceData[result.sourceName] = result.data as Record<string, number | null>;
    } else {
      sourcesFailed.push(result.sourceName);
    }
  }

  // 4. If we have no data at all, return empty consensus
  if (Object.keys(rawSourceData).length === 0) {
    const emptyCons = buildConsensus(
      request.entityId, request.entityName, request.entityType, {}, new Date()
    );
    return {
      consensus: emptyCons,
      formattedForAI: formatForAI(emptyCons),
      cacheHit: false,
      fetchTimeMs: Date.now() - startTime,
      sourcesAttempted,
      sourcesFailed,
    };
  }

  // 5. Run Consensus Engine
  const consensus = buildConsensus(
    request.entityId,
    request.entityName,
    request.entityType,
    rawSourceData,
    new Date()
  );

  // 5b. Detect and persist deltas (if we have previous data)
  if (memoryResult) {
    const previousConsensus = buildConsensus(
      request.entityId,
      request.entityName,
      request.entityType,
      { memory_cache: memoryResult.data as Record<string, number | null> },
      new Date()
    );
    const delta = detectDeltas(previousConsensus, consensus);
    if (delta.hasSignificantChange && supabaseClient) {
      await persistDeltas(request.entityId, request.entityName, delta, supabaseClient);
    }
  }

  // 6. Store in memory cache (15 min for price data)
  setMemoryCache(request.entityId, consensus, 15 * 60 * 1000);

  // 7. Persist to Supabase (non-blocking)
  if (supabaseClient) {
    persistToSupabase(supabaseClient, request, consensus).catch(err =>
      console.error('[DIL] Supabase persist error:', err)
    );
  }

  return {
    consensus,
    formattedForAI: formatForAI(consensus),
    cacheHit: false,
    fetchTimeMs: Date.now() - startTime,
    sourcesAttempted,
    sourcesFailed,
  };
}

// ─── Supabase Persistence ─────────────────────────────────────────────────────

async function persistToSupabase(
  supabaseClient: any,
  request: DILRequest,
  consensus: ConsensusMetrics
): Promise<void> {
  try {
    const row = {
      entity_id: request.entityId,
      entity_type: request.entityType,
      entity_name: request.entityName,
      fiscal_period: consensus.fiscalPeriod,
      market_cap: consensus.marketCap.value,
      current_price: consensus.currentPrice.value,
      revenue: consensus.revenue.value,
      revenue_growth: consensus.revenueGrowthYoy.value,
      gross_margin: consensus.grossMargin.value,
      operating_margin: consensus.operatingMargin.value,
      net_margin: consensus.netMargin.value,
      ebitda: consensus.ebitda.value,
      ebitda_margin: consensus.ebitdaMargin.value,
      eps: consensus.eps.value,
      pe_ratio: consensus.peRatio.value,
      pb_ratio: consensus.pbRatio.value,
      ev_to_ebitda: consensus.evToEbitda.value,
      debt_to_equity: consensus.debtToEquity.value,
      current_ratio: consensus.currentRatio.value,
      roe: consensus.roe.value,
      roa: consensus.roa.value,
      roic: consensus.roic.value,
      free_cash_flow: consensus.freeCashFlow.value,
      operating_cash_flow: consensus.operatingCashFlow.value,
      total_debt: consensus.totalDebt.value,
      cash_and_equivalents: consensus.cashAndEquivalents.value,
      confidence_score: consensus.overallConfidence,
      sources_used: JSON.stringify(consensus.sourcesUsed),
      variance_flags: JSON.stringify(consensus.varianceWarnings),
      fetched_at: consensus.fetchedAt.toISOString(),
      expires_at: consensus.expiresAt.toISOString(),
      data_quality: Math.round(consensus.overallConfidence / 10),
    };

    await supabaseClient
      .from('consensus_metrics')
      .upsert(row, { onConflict: 'entity_id,fiscal_period' });

  } catch (err) {
    console.error('[DIL] Failed to persist consensus:', err);
  }
}

// ─── Delta Detection ──────────────────────────────────────────────────────────
// Compares new consensus with previous - only triggers re-analysis if meaningful change

export interface DeltaResult {
  hasSignificantChange: boolean;
  changedMetrics: { metric: string; from: number; to: number; changePercent: number }[];
  maxChangePercent: number;
}

export function detectDeltas(
  previous: ConsensusMetrics,
  current: ConsensusMetrics,
  thresholdPercent = 2
): DeltaResult {
  const changedMetrics: DeltaResult['changedMetrics'] = [];
  const metricsToCheck = [
    'marketCap', 'currentPrice', 'revenue', 'netMargin', 'peRatio', 'ebitdaMargin',
  ] as const;

  for (const key of metricsToCheck) {
    const prev = (previous as any)[key]?.value;
    const curr = (current as any)[key]?.value;
    if (prev === null || curr === null || prev === undefined || curr === undefined) continue;
    if (prev === 0) continue;

    const changePercent = Math.abs((curr - prev) / prev) * 100;
    if (changePercent >= thresholdPercent) {
      changedMetrics.push({ metric: key, from: prev, to: curr, changePercent });
    }
  }

  const maxChangePercent = changedMetrics.length > 0
    ? Math.max(...changedMetrics.map(c => c.changePercent))
    : 0;

  return {
    hasSignificantChange: changedMetrics.length > 0,
    changedMetrics,
    maxChangePercent,
  };
}

// ─── Persist Deltas ───────────────────────────────────────────────────────────
// Stores significant changes to change_log table for tracking metric evolution

export async function persistDeltas(
  entityId: string,
  entityName: string,
  delta: DeltaResult,
  supabaseClient: any
): Promise<void> {
  if (!delta.hasSignificantChange || !supabaseClient) return;

  try {
    const changeRecords = delta.changedMetrics.map(change => ({
      entity_id: entityId,
      entity_name: entityName,
      metric_name: change.metric,
      previous_value: change.from,
      new_value: change.to,
      change_absolute: change.to - change.from,
      change_percent: change.changePercent,
      change_direction: change.to > change.from ? 'up' : 'down',
      is_significant: change.changePercent >= 5,
      source: 'consensus_engine',
      detected_at: new Date().toISOString(),
    }));

    await supabaseClient.from('data_deltas').insert(changeRecords);
    
    console.log(`[DIL] Persisted ${changeRecords.length} deltas for ${entityName}`);
  } catch (err) {
    console.error('[DIL] Failed to persist deltas:', err);
  }
}
