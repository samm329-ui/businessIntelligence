/**
 * EBITA INTELLIGENCE — DATA ORCHESTRATOR
 * Priority Pipeline: Dataset → Supabase DB → API → Crawler → AI Fallback
 * Handles: Rate limiting, caching, cross-validation, confidence scoring
 */

// ─────────────────────────────────────────────
// TYPES
// ─────────────────────────────────────────────

export type DataSource = 'DATASET' | 'SUPABASE' | 'NSE' | 'YAHOO' | 'ALPHA_VANTAGE' | 'FMP' | 'SCREENER' | 'MONEYCONTROL';

export interface DataPoint {
  value: number | string | null;
  source: DataSource;
  fetchedAt: Date;
  confidence: number;  // 0-100
  raw?: unknown;
}

export interface CompanyFinancials {
  ticker: string;
  name: string;
  
  // Market data
  currentPrice: DataPoint;
  marketCap: DataPoint;
  
  // P&L
  totalRevenue: DataPoint;
  revenueGrowthYoY: DataPoint;
  netIncome: DataPoint;
  netMargin: DataPoint;
  grossMargin: DataPoint;
  ebitda: DataPoint;
  ebitdaMargin: DataPoint;
  operatingMargin: DataPoint;
  
  // Balance sheet
  totalAssets: DataPoint;
  totalDebt: DataPoint;
  shareholderEquity: DataPoint;
  cashAndEquivalents: DataPoint;
  
  // Ratios
  peRatio: DataPoint;
  pbRatio: DataPoint;
  debtToEquity: DataPoint;
  roe: DataPoint;
  roa: DataPoint;
  currentRatio: DataPoint;
  
  // Per share
  eps: DataPoint;
  bookValuePerShare: DataPoint;
  dividendYield: DataPoint;
  
  // Metadata
  overallConfidence: number;
  missingFields: string[];
  sources: DataSource[];
  lastUpdated: Date;
  fiscalPeriod: string;
}

interface CacheEntry {
  data: unknown;
  expiresAt: Date;
}

// ─────────────────────────────────────────────
// CACHE LAYER (in-memory + Supabase backing)
// ─────────────────────────────────────────────

const TTL_SECONDS = {
  STOCK_PRICE: 300,          // 5 minutes
  FINANCIALS: 3600,          // 1 hour
  SHAREHOLDING: 86400,       // 1 day
  INDUSTRY_METRICS: 604800,  // 1 week
  COMPETITOR_LIST: 604800,   // 1 week
};

class InMemoryCache {
  private store = new Map<string, CacheEntry>();

  get<T>(key: string): T | null {
    const entry = this.store.get(key);
    if (!entry) return null;
    if (new Date() > entry.expiresAt) {
      this.store.delete(key);
      return null;
    }
    return entry.data as T;
  }

  set(key: string, data: unknown, ttlSeconds: number) {
    const expiresAt = new Date(Date.now() + ttlSeconds * 1000);
    this.store.set(key, { data, expiresAt });
  }

  invalidate(keyPattern: string) {
    for (const key of this.store.keys()) {
      if (key.includes(keyPattern)) this.store.delete(key);
    }
  }
}

const cache = new InMemoryCache();

// ─────────────────────────────────────────────
// RATE LIMITER
// ─────────────────────────────────────────────

class RateLimiter {
  private calls = new Map<string, number[]>();
  private limits: Record<string, { perMinute: number; perDay: number }> = {
    NSE:           { perMinute: 10,  perDay: 1000 },
    YAHOO:         { perMinute: 60,  perDay: 2000 },
    ALPHA_VANTAGE: { perMinute: 5,   perDay: 500  },
    FMP:           { perMinute: 4,   perDay: 250  },
    SCREENER:      { perMinute: 3,   perDay: 200  },
    MONEYCONTROL:  { perMinute: 3,   perDay: 200  },
  };

  async waitIfNeeded(source: string): Promise<void> {
    const limit = this.limits[source];
    if (!limit) return;

    const now = Date.now();
    const calls = (this.calls.get(source) || []).filter(t => now - t < 60000);
    
    if (calls.length >= limit.perMinute) {
      const waitMs = 60000 - (now - calls[0]) + 200;
      console.log(`[RateLimit] Waiting ${waitMs}ms for ${source}`);
      await new Promise(r => setTimeout(r, waitMs));
    }

    calls.push(now);
    this.calls.set(source, calls);
  }
}

const rateLimiter = new RateLimiter();

// ─────────────────────────────────────────────
// SOURCE CONFIDENCE WEIGHTS
// ─────────────────────────────────────────────

const SOURCE_CONFIDENCE: Record<DataSource, number> = {
  DATASET:       90,   // Curated, verified
  SUPABASE:      85,   // Our validated DB
  NSE:           88,   // Official exchange
  YAHOO:         78,   // Reliable aggregator
  ALPHA_VANTAGE: 75,   // Good but rate limited
  FMP:           76,   // Good fundamentals
  SCREENER:      70,   // Scraped, India-focused
  MONEYCONTROL:  65,   // Scraped
};

// ─────────────────────────────────────────────
// INDIVIDUAL DATA FETCHERS
// ─────────────────────────────────────────────

async function fetchNSEData(ticker: string): Promise<Record<string, DataPoint>> {
  await rateLimiter.waitIfNeeded('NSE');
  
  try {
    // NSE session init
    const sessionRes = await fetch('https://www.nseindia.com', {
      headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/120.0.0.0' },
    });
    const cookies = (sessionRes.headers.get('set-cookie') || '')
      .split(',').map(c => c.split(';')[0]).join('; ');

    const headers = {
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/120.0.0.0',
      'Accept': 'application/json',
      'Referer': 'https://www.nseindia.com/',
      'Cookie': cookies,
    };

    const [quoteRes, finRes] = await Promise.allSettled([
      fetch(`https://www.nseindia.com/api/quote-equity?symbol=${ticker}`, { headers }),
      fetch(`https://www.nseindia.com/api/corporates-financial-results?symbol=${ticker}`, { headers }),
    ]);

    const now = new Date();
    const result: Record<string, DataPoint> = {};
    const conf = SOURCE_CONFIDENCE.NSE;

    if (quoteRes.status === 'fulfilled' && quoteRes.value.ok) {
      const data = await quoteRes.value.json() as Record<string, unknown>;
      const info = (data.info || data) as Record<string, unknown>;
      const priceInfo = (data.priceInfo || {}) as Record<string, unknown>;
      const secInfo = (data.securityInfo || {}) as Record<string, unknown>;
      
      if (priceInfo.lastPrice) result.currentPrice  = { value: Number(priceInfo.lastPrice), source: 'NSE', fetchedAt: now, confidence: conf };
      if (priceInfo.pChange)   result.changePercent = { value: Number(priceInfo.pChange), source: 'NSE', fetchedAt: now, confidence: conf };
      if (secInfo.isinCode)    result.isin          = { value: String(secInfo.isinCode), source: 'NSE', fetchedAt: now, confidence: conf };
    }

    return result;
  } catch (err) {
    console.error(`[NSE] Failed for ${ticker}:`, err);
    return {};
  }
}

async function fetchYahooData(ticker: string): Promise<Record<string, DataPoint>> {
  await rateLimiter.waitIfNeeded('YAHOO');
  
  // Map Indian tickers to Yahoo format
  const yahooTicker = ticker.includes('.') ? ticker : 
    (['HINDUNILVR', 'TCS', 'INFY', 'WIPRO', 'HCLTECH'].includes(ticker) ? `${ticker}.NS` : ticker);
  
  try {
    const url = `https://query1.finance.yahoo.com/v10/finance/quoteSummary/${yahooTicker}?modules=summaryDetail,financialData,defaultKeyStatistics,incomeStatementHistory`;
    
    const response = await fetch(url, {
      headers: { 'User-Agent': 'Mozilla/5.0 (compatible; EBITA-Intelligence/2.0)' },
    });
    
    if (!response.ok) return {};
    
    const json = await response.json() as {
      quoteSummary?: {
        result?: Array<{
          summaryDetail?: Record<string, { raw?: number }>;
          financialData?: Record<string, { raw?: number }>;
          defaultKeyStatistics?: Record<string, { raw?: number }>;
        }>;
      };
    };
    const data = json.quoteSummary?.result?.[0];
    if (!data) return {};
    
    const now = new Date();
    const conf = SOURCE_CONFIDENCE.YAHOO;
    const result: Record<string, DataPoint> = {};

    const sd = data.summaryDetail || {};
    const fd = data.financialData || {};
    const ks = data.defaultKeyStatistics || {};

    const pick = (d: Record<string, { raw?: number }>, key: string) => d[key]?.raw ?? null;

    if (pick(sd, 'marketCap'))          result.marketCap         = { value: pick(sd, 'marketCap'), source: 'YAHOO', fetchedAt: now, confidence: conf };
    if (pick(sd, 'trailingPE'))         result.peRatio           = { value: pick(sd, 'trailingPE'), source: 'YAHOO', fetchedAt: now, confidence: conf };
    if (pick(sd, 'dividendYield'))      result.dividendYield     = { value: (pick(sd, 'dividendYield') ?? 0) * 100, source: 'YAHOO', fetchedAt: now, confidence: conf };
    if (pick(fd, 'totalRevenue'))       result.totalRevenue      = { value: pick(fd, 'totalRevenue'), source: 'YAHOO', fetchedAt: now, confidence: conf };
    if (pick(fd, 'grossMargins'))       result.grossMargin       = { value: (pick(fd, 'grossMargins') ?? 0) * 100, source: 'YAHOO', fetchedAt: now, confidence: conf };
    if (pick(fd, 'operatingMargins'))   result.operatingMargin   = { value: (pick(fd, 'operatingMargins') ?? 0) * 100, source: 'YAHOO', fetchedAt: now, confidence: conf };
    if (pick(fd, 'profitMargins'))      result.netMargin         = { value: (pick(fd, 'profitMargins') ?? 0) * 100, source: 'YAHOO', fetchedAt: now, confidence: conf };
    if (pick(fd, 'returnOnEquity'))     result.roe               = { value: (pick(fd, 'returnOnEquity') ?? 0) * 100, source: 'YAHOO', fetchedAt: now, confidence: conf };
    if (pick(fd, 'returnOnAssets'))     result.roa               = { value: (pick(fd, 'returnOnAssets') ?? 0) * 100, source: 'YAHOO', fetchedAt: now, confidence: conf };
    if (pick(fd, 'debtToEquity'))       result.debtToEquity      = { value: (pick(fd, 'debtToEquity') ?? 0) / 100, source: 'YAHOO', fetchedAt: now, confidence: conf };
    if (pick(fd, 'currentRatio'))       result.currentRatio      = { value: pick(fd, 'currentRatio'), source: 'YAHOO', fetchedAt: now, confidence: conf };
    if (pick(fd, 'totalCash'))          result.cashAndEquivalents = { value: pick(fd, 'totalCash'), source: 'YAHOO', fetchedAt: now, confidence: conf };
    if (pick(fd, 'totalDebt'))          result.totalDebt         = { value: pick(fd, 'totalDebt'), source: 'YAHOO', fetchedAt: now, confidence: conf };
    if (pick(ks, 'trailingEps'))        result.eps               = { value: pick(ks, 'trailingEps'), source: 'YAHOO', fetchedAt: now, confidence: conf };
    if (pick(ks, 'priceToBook'))        result.pbRatio           = { value: pick(ks, 'priceToBook'), source: 'YAHOO', fetchedAt: now, confidence: conf };
    if (pick(ks, 'bookValue'))          result.bookValuePerShare  = { value: pick(ks, 'bookValue'), source: 'YAHOO', fetchedAt: now, confidence: conf };

    return result;
  } catch (err) {
    console.error(`[Yahoo] Failed for ${yahooTicker}:`, err);
    return {};
  }
}

async function fetchAlphaVantageData(ticker: string): Promise<Record<string, DataPoint>> {
  const apiKey = process.env.ALPHA_VANTAGE_API_KEY;
  if (!apiKey) return {};
  
  await rateLimiter.waitIfNeeded('ALPHA_VANTAGE');
  
  const cacheKey = `av_overview_${ticker}`;
  const cached = cache.get<Record<string, DataPoint>>(cacheKey);
  if (cached) return cached;
  
  try {
    const res = await fetch(
      `https://www.alphavantage.co/query?function=OVERVIEW&symbol=${ticker}&apikey=${apiKey}`
    );
    if (!res.ok) return {};
    
    const data = await res.json() as Record<string, string>;
    if (data.Note || data.Information) {
      console.warn('[AlphaVantage] Rate limit hit');
      return {};
    }
    
    const now = new Date();
    const conf = SOURCE_CONFIDENCE.ALPHA_VANTAGE;
    const result: Record<string, DataPoint> = {};

    const n = (key: string) => data[key] ? Number(data[key]) : null;

    if (n('MarketCapitalization')) result.marketCap       = { value: n('MarketCapitalization'), source: 'ALPHA_VANTAGE', fetchedAt: now, confidence: conf };
    if (n('EBITDA'))              result.ebitda           = { value: n('EBITDA'), source: 'ALPHA_VANTAGE', fetchedAt: now, confidence: conf };
    if (n('PERatio'))             result.peRatio          = { value: n('PERatio'), source: 'ALPHA_VANTAGE', fetchedAt: now, confidence: conf };
    if (n('PriceToBookRatio'))    result.pbRatio          = { value: n('PriceToBookRatio'), source: 'ALPHA_VANTAGE', fetchedAt: now, confidence: conf };
    if (n('ReturnOnEquityTTM'))   result.roe              = { value: (n('ReturnOnEquityTTM') ?? 0) * 100, source: 'ALPHA_VANTAGE', fetchedAt: now, confidence: conf };
    if (n('ReturnOnAssetsTTM'))   result.roa              = { value: (n('ReturnOnAssetsTTM') ?? 0) * 100, source: 'ALPHA_VANTAGE', fetchedAt: now, confidence: conf };
    if (n('GrossProfitTTM'))      result.grossProfit      = { value: n('GrossProfitTTM'), source: 'ALPHA_VANTAGE', fetchedAt: now, confidence: conf };
    if (n('DilutedEPSTTM'))       result.eps              = { value: n('DilutedEPSTTM'), source: 'ALPHA_VANTAGE', fetchedAt: now, confidence: conf };
    if (n('DividendYield'))       result.dividendYield    = { value: (n('DividendYield') ?? 0) * 100, source: 'ALPHA_VANTAGE', fetchedAt: now, confidence: conf };

    cache.set(cacheKey, result, TTL_SECONDS.FINANCIALS);
    return result;
  } catch (err) {
    console.error(`[AlphaVantage] Failed for ${ticker}:`, err);
    return {};
  }
}

// ─────────────────────────────────────────────
// MULTI-SOURCE RECONCILER
// ─────────────────────────────────────────────

function reconcileField(
  fieldName: string,
  points: Array<{ value: number | string | null; source: DataSource; confidence: number; fetchedAt: Date }>
): DataPoint {
  const numeric = points.filter(p => typeof p.value === 'number' && isFinite(p.value as number)) as
    Array<{ value: number; source: DataSource; confidence: number; fetchedAt: Date }>;

  if (numeric.length === 0) {
    return { value: null, source: points[0]?.source || 'DATASET', fetchedAt: new Date(), confidence: 0 };
  }

  if (numeric.length === 1) {
    return { value: numeric[0].value, source: numeric[0].source, fetchedAt: numeric[0].fetchedAt, confidence: numeric[0].confidence };
  }

  // Sort by value and take median
  const sorted = [...numeric].sort((a, b) => a.value - b.value);
  const mid = Math.floor(sorted.length / 2);
  const median = sorted.length % 2 === 0
    ? (sorted[mid - 1].value + sorted[mid].value) / 2
    : sorted[mid].value;

  // Check for large discrepancies
  const mean = numeric.reduce((sum, p) => sum + p.value, 0) / numeric.length;
  const maxDeviation = Math.max(...numeric.map(p => Math.abs((p.value - mean) / (mean || 1)) * 100));

  let confidence = Math.max(...numeric.map(p => p.confidence));
  if (maxDeviation > 20) {
    confidence = Math.max(confidence - 20, 30);  // Penalize for inconsistency
    console.warn(`[Reconcile] High variance for ${fieldName}: ${maxDeviation.toFixed(1)}%`);
  }

  // Use highest-confidence source as primary
  const best = numeric.sort((a, b) => b.confidence - a.confidence)[0];

  return {
    value: median,
    source: best.source,
    fetchedAt: best.fetchedAt,
    confidence,
  };
}

// ─────────────────────────────────────────────
// CONFIDENCE CALCULATOR
// ─────────────────────────────────────────────

function calculateOverallConfidence(financials: Partial<CompanyFinancials>): number {
  const criticalFields = ['currentPrice', 'marketCap', 'totalRevenue', 'netMargin', 'peRatio'];
  const importantFields = ['roe', 'debtToEquity', 'ebitdaMargin', 'grossMargin', 'currentRatio'];

  let score = 0;
  let maxScore = 0;

  for (const field of criticalFields) {
    maxScore += 15;
    const point = (financials as Record<string, DataPoint>)[field];
    if (point?.value != null) score += (point.confidence / 100) * 15;
  }

  for (const field of importantFields) {
    maxScore += 7;
    const point = (financials as Record<string, DataPoint>)[field];
    if (point?.value != null) score += (point.confidence / 100) * 7;
  }

  return maxScore > 0 ? Math.round((score / maxScore) * 100) : 0;
}

// ─────────────────────────────────────────────
// MAIN ORCHESTRATOR
// ─────────────────────────────────────────────

export class DataOrchestrator {

  /**
   * Fetch company financials using priority pipeline
   */
  async fetchCompanyFinancials(
    ticker: string,
    region: 'INDIA' | 'GLOBAL',
    useCache = true
  ): Promise<CompanyFinancials> {
    
    const cacheKey = `financials_${ticker}`;
    if (useCache) {
      const cached = cache.get<CompanyFinancials>(cacheKey);
      if (cached) {
        console.log(`[Cache] Hit for ${ticker}`);
        return cached;
      }
    }

    console.log(`[Orchestrator] Fetching ${ticker} from ${region}...`);

    // ── Parallel fetch from all sources ─────────────────────────────────
    const [nseData, yahooData, avData] = await Promise.allSettled([
      region === 'INDIA' ? fetchNSEData(ticker) : Promise.resolve({}),
      fetchYahooData(ticker),
      fetchAlphaVantageData(ticker),
    ]);

    // Merge all source data
    const allData: Record<string, DataPoint[]> = {};

    for (const result of [nseData, yahooData, avData]) {
      if (result.status === 'fulfilled') {
        for (const [key, point] of Object.entries(result.value)) {
          if (!allData[key]) allData[key] = [];
          allData[key].push(point as DataPoint);
        }
      }
    }

    // ── Reconcile each field ─────────────────────────────────────────────
    const reconciled: Record<string, DataPoint> = {};
    for (const [field, points] of Object.entries(allData)) {
      reconciled[field] = reconcileField(field, points as Array<{ value: number | string | null; source: DataSource; confidence: number; fetchedAt: Date }>);
    }

    const nullPoint = (source: DataSource = 'YAHOO'): DataPoint => ({
      value: null, source, fetchedAt: new Date(), confidence: 0
    });

    // ── Build complete financials object ─────────────────────────────────
    const financials: CompanyFinancials = {
      ticker,
      name: ticker,  // Will be enriched from dataset
      currentPrice:       reconciled.currentPrice      || nullPoint('NSE'),
      marketCap:          reconciled.marketCap         || nullPoint('YAHOO'),
      totalRevenue:       reconciled.totalRevenue      || nullPoint('YAHOO'),
      revenueGrowthYoY:   reconciled.revenueGrowthYoY || nullPoint('YAHOO'),
      netIncome:          reconciled.netIncome         || nullPoint('YAHOO'),
      netMargin:          reconciled.netMargin         || nullPoint('YAHOO'),
      grossMargin:        reconciled.grossMargin       || nullPoint('YAHOO'),
      ebitda:             reconciled.ebitda            || nullPoint('ALPHA_VANTAGE'),
      ebitdaMargin:       reconciled.ebitdaMargin      || nullPoint('YAHOO'),
      operatingMargin:    reconciled.operatingMargin   || nullPoint('YAHOO'),
      totalAssets:        reconciled.totalAssets       || nullPoint('YAHOO'),
      totalDebt:          reconciled.totalDebt         || nullPoint('YAHOO'),
      shareholderEquity:  reconciled.shareholderEquity || nullPoint('YAHOO'),
      cashAndEquivalents: reconciled.cashAndEquivalents || nullPoint('YAHOO'),
      peRatio:            reconciled.peRatio           || nullPoint('YAHOO'),
      pbRatio:            reconciled.pbRatio           || nullPoint('YAHOO'),
      debtToEquity:       reconciled.debtToEquity      || nullPoint('YAHOO'),
      roe:                reconciled.roe               || nullPoint('YAHOO'),
      roa:                reconciled.roa               || nullPoint('YAHOO'),
      currentRatio:       reconciled.currentRatio      || nullPoint('YAHOO'),
      eps:                reconciled.eps               || nullPoint('YAHOO'),
      bookValuePerShare:  reconciled.bookValuePerShare || nullPoint('YAHOO'),
      dividendYield:      reconciled.dividendYield     || nullPoint('YAHOO'),
      overallConfidence: 0,
      missingFields: [],
      sources: [...new Set(Object.values(reconciled).map(p => p.source))],
      lastUpdated: new Date(),
      fiscalPeriod: 'TTM',
    };

    // Calculate confidence and missing fields
    financials.overallConfidence = calculateOverallConfidence(financials);
    financials.missingFields = Object.entries(financials)
      .filter(([k, v]) => 
        v && typeof v === 'object' && 'value' in v && 
        (v as DataPoint).value === null &&
        !['overallConfidence', 'missingFields', 'sources', 'lastUpdated', 'fiscalPeriod', 'ticker', 'name'].includes(k)
      )
      .map(([k]) => k);

    // Cache the result
    cache.set(cacheKey, financials, TTL_SECONDS.FINANCIALS);

    console.log(`[Orchestrator] ${ticker} done. Confidence: ${financials.overallConfidence}%`);
    return financials;
  }

  /** Convert financials to format expected by Groq prompts */
  toPromptContext(financials: CompanyFinancials, companyRecord: { name: string; industry: string; subIndustry: string; region: string; brands?: string[] }): {
    revenue: number | null;
    revenueGrowth: number | null;
    netMargin: number | null;
    ebitdaMargin: number | null;
    roe: number | null;
    debtToEquity: number | null;
    peRatio: number | null;
    marketCap: number | null;
    source: string;
    confidence: number;
    fiscalPeriod: string;
  } {
    const v = (p: DataPoint) => typeof p.value === 'number' ? p.value : null;

    return {
      revenue:       v(financials.totalRevenue),
      revenueGrowth: v(financials.revenueGrowthYoY),
      netMargin:     v(financials.netMargin),
      ebitdaMargin:  v(financials.ebitdaMargin),
      roe:           v(financials.roe),
      debtToEquity:  v(financials.debtToEquity),
      peRatio:       v(financials.peRatio),
      marketCap:     v(financials.marketCap),
      source:        financials.sources.join(', '),
      confidence:    financials.overallConfidence,
      fiscalPeriod:  financials.fiscalPeriod,
    };
  }

  invalidateCache(ticker: string) {
    cache.invalidate(ticker);
  }
}

export const orchestrator = new DataOrchestrator();
export { TTL_SECONDS };
