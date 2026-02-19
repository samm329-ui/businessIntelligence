import type { SearchResult } from '../search-bots/google-bot';
import type { CrawledPage } from './collector';

export interface ExtractedFinancial {
  metric: string;
  value: number | null;
  rawValue: string;
  unit: string;
  currency: string;
  source: string;
  sourceUrl?: string;
  confidence: number;
  extractedAt: string;
  fiscalPeriod?: string;
  publishedDate?: string;
  freshnessScore?: number;
}

export interface StructuredFinancials {
  revenue: ExtractedFinancial[];
  ebitda: ExtractedFinancial[];
  netProfit: ExtractedFinancial[];
  operatingProfit: ExtractedFinancial[];
  grossProfit: ExtractedFinancial[];
  marketCap: ExtractedFinancial[];
  revenueGrowth: ExtractedFinancial[];
  ebitdaMargin: ExtractedFinancial[];
  netMargin: ExtractedFinancial[];
  peRatio: ExtractedFinancial[];
  debtToEquity: ExtractedFinancial[];
  roe: ExtractedFinancial[];
  eps: ExtractedFinancial[];
  freeCashFlow: ExtractedFinancial[];

  metadata: {
    totalExtractions: number;
    uniqueMetrics: number;
    avgConfidence: number;
    sourcesUsed: string[];
    extractedAt: string;
  };
}

const UNIT_MULTIPLIERS: Record<string, number> = {
  'cr': 1e7,
  'crore': 1e7,
  'crores': 1e7,
  'lakh': 1e5,
  'lakhs': 1e5,
  'million': 1e6,
  'mn': 1e6,
  'billion': 1e9,
  'bn': 1e9,
  'b': 1e9,
  'trillion': 1e12,
  'tn': 1e12,
  't': 1e12,
  'thousand': 1e3,
  'k': 1e3,
};

const CURRENCY_SYMBOLS: Record<string, string> = {
  '₹': 'INR',
  'rs': 'INR',
  'rs.': 'INR',
  'inr': 'INR',
  '$': 'USD',
  'usd': 'USD',
  '€': 'EUR',
  'eur': 'EUR',
  '£': 'GBP',
  'gbp': 'GBP',
};

interface MetricPattern {
  metric: string;
  patterns: RegExp[];
  isPercentage?: boolean;
  isRatio?: boolean;
}

const METRIC_PATTERNS: MetricPattern[] = [
  {
    metric: 'revenue',
    patterns: [
      // Negative lookahead (?!\s*%) ensures we don't match percentages
      /(?:total\s+)?(?:revenue|sales|turnover|top\s*line)[^\d₹$€£]*?([₹$€£]?\s*[\d,]+\.?\d*)\s*(?!\s*%)(cr(?:ore)?s?|lakh?s?|(?:m|b|t)(?:illion|n)?|k|thousand)?/gi,
      /(?:revenue|sales|turnover)\s*(?:of|at|was|is|stood\s+at|reached)\s*(?:rs\.?|inr|₹|\$)?\s*([\d,]+\.?\d*)\s*(?!\s*%)(cr(?:ore)?s?|lakh?s?|(?:m|b|t)(?:illion|n)?)?/gi,
    ],
  },
  {
    metric: 'ebitda',
    patterns: [
      /ebitda[^\d₹$€£]*?([₹$€£]?\s*[\d,]+\.?\d*)\s*(?!\s*%)(cr(?:ore)?s?|lakh?s?|(?:m|b|t)(?:illion|n)?)?/gi,
      /ebitda\s*(?:of|at|was|is|stood\s+at|reached)\s*(?:rs\.?|inr|₹|\$)?\s*([\d,]+\.?\d*)\s*(?!\s*%)(cr(?:ore)?s?|lakh?s?|(?:m|b|t)(?:illion|n)?)?/gi,
    ],
  },
  {
    metric: 'netProfit',
    patterns: [
      /(?:net\s+)?(?:profit|income|earnings|PAT)\s*(?:after\s+tax)?[^\d₹$€£]*?([₹$€£]?\s*[\d,]+\.?\d*)\s*(?!\s*%)(cr(?:ore)?s?|lakh?s?|(?:m|b|t)(?:illion|n)?)?/gi,
      /(?:net\s+)?(?:profit|PAT)\s*(?:of|at|was|is|stood\s+at)\s*(?:rs\.?|inr|₹|\$)?\s*([\d,]+\.?\d*)\s*(?!\s*%)(cr(?:ore)?s?|lakh?s?|(?:m|b|t)(?:illion|n)?)?/gi,
    ],
  },
  {
    metric: 'operatingProfit',
    patterns: [
      /operating\s+(?:profit|income|EBIT)[^\d₹$€£]*?([₹$€£]?\s*[\d,]+\.?\d*)\s*(?!\s*%)(cr(?:ore)?s?|lakh?s?|(?:m|b|t)(?:illion|n)?)?/gi,
    ],
  },
  {
    metric: 'grossProfit',
    patterns: [
      /gross\s+profit[^\d₹$€£]*?([₹$€£]?\s*[\d,]+\.?\d*)\s*(?!\s*%)(cr(?:ore)?s?|lakh?s?|(?:m|b|t)(?:illion|n)?)?/gi,
    ],
  },
  {
    metric: 'marketCap',
    patterns: [
      /market\s*(?:cap(?:itali[sz]ation)?)[^\d₹$€£]*?([₹$€£]?\s*[\d,]+\.?\d*)\s*(?!\s*%)(cr(?:ore)?s?|lakh?s?|(?:m|b|t)(?:illion|n)?)?/gi,
      /m[\.\s]*cap[^\d₹$€£]*?([₹$€£]?\s*[\d,]+\.?\d*)\s*(?!\s*%)(cr(?:ore)?s?|lakh?s?|(?:m|b|t)(?:illion|n)?)?/gi,
    ],
  },
  {
    metric: 'revenueGrowth',
    patterns: [
      /revenue\s+growth[^\d]*?(-?[\d,]+\.?\d*)\s*%/gi,
      /(?:yoy|y-o-y|year.over.year)\s+(?:revenue\s+)?growth[^\d]*?(-?[\d,]+\.?\d*)\s*%/gi,
      /(?:top\s*line|sales)\s+(?:growth|grew|increased|declined)[^\d]*?(-?[\d,]+\.?\d*)\s*%/gi,
    ],
    isPercentage: true,
  },
  {
    metric: 'ebitdaMargin',
    patterns: [
      /ebitda\s+margin[^\d]*?(-?[\d,]+\.?\d*)\s*%/gi,
    ],
    isPercentage: true,
  },
  {
    metric: 'netMargin',
    patterns: [
      /(?:net\s+)?(?:profit\s+)?margin[^\d]*?(-?[\d,]+\.?\d*)\s*%/gi,
      /PAT\s+margin[^\d]*?(-?[\d,]+\.?\d*)\s*%/gi,
    ],
    isPercentage: true,
  },
  {
    metric: 'peRatio',
    patterns: [
      /(?:p\/e|pe|price[\s-]*(?:to[\s-]*)?earnings)\s*(?:ratio)?[^\d]*?([\d,]+\.?\d*)/gi,
    ],
    isRatio: true,
  },
  {
    metric: 'debtToEquity',
    patterns: [
      /(?:debt[\s-]*(?:to[\s-]*)?equity)\s*(?:ratio)?[^\d]*?([\d,]+\.?\d*)/gi,
      /d\/e\s*(?:ratio)?[^\d]*?([\d,]+\.?\d*)/gi,
    ],
    isRatio: true,
  },
  {
    metric: 'roe',
    patterns: [
      /(?:return\s+on\s+equity|ROE)[^\d]*?(-?[\d,]+\.?\d*)\s*%/gi,
    ],
    isPercentage: true,
  },
  {
    metric: 'eps',
    patterns: [
      /(?:earnings\s+per\s+share|EPS)[^\d₹$€£]*?([₹$€£]?\s*[\d,]+\.?\d*)/gi,
    ],
  },
  {
    metric: 'freeCashFlow',
    patterns: [
      /(?:free\s+cash\s+flow|FCF)[^\d₹$€£]*?([₹$€£]?\s*[\d,]+\.?\d*)\s*(cr(?:ore)?s?|lakh?s?|(?:m|b|t)(?:illion|n)?)?/gi,
    ],
  },
];

function parseNumber(raw: string): number | null {
  const cleaned = raw.replace(/[₹$€£,\s]/g, '');
  const num = parseFloat(cleaned);
  return isNaN(num) ? null : num;
}

function detectCurrency(text: string): string {
  const lower = text.toLowerCase();
  for (const [symbol, currency] of Object.entries(CURRENCY_SYMBOLS)) {
    if (lower.includes(symbol)) return currency;
  }
  return 'INR';
}

function detectUnit(unitStr: string | undefined): { unit: string; multiplier: number } {
  if (!unitStr) return { unit: '', multiplier: 1 };
  const lower = unitStr.toLowerCase().trim();
  for (const [key, mult] of Object.entries(UNIT_MULTIPLIERS)) {
    if (lower === key || lower.startsWith(key)) {
      return { unit: key, multiplier: mult };
    }
  }
  return { unit: unitStr, multiplier: 1 };
}

function detectFiscalPeriod(text: string): string | undefined {
  const fyMatch = text.match(/(?:FY|fiscal\s+year)\s*['"]?(\d{2,4})/i);
  if (fyMatch) return `FY${fyMatch[1]}`;

  const qMatch = text.match(/Q([1-4])\s*(?:FY)?['"]?(\d{2,4})/i);
  if (qMatch) return `Q${qMatch[1]}FY${qMatch[2]}`;

  const yearMatch = text.match(/(?:20[2-3]\d)[-/](?:20)?([2-3]\d)/);
  if (yearMatch) return `FY${yearMatch[1]}`;

  const singleYear = text.match(/\b(202[3-6])\b/);
  if (singleYear) return singleYear[1];

  return undefined;
}

function computeFreshnessScore(text: string): { score: number; publishedDate?: string } {
  const datePatterns = [
    /(?:published|updated|date)[:\s]*(\d{1,2}[\s/-]\w+[\s/-]\d{2,4})/i,
    /(\w+ \d{1,2},? \d{4})/,
    /(\d{1,2}[\s/-](?:Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)\w*[\s/-]\d{2,4})/i,
    /(\d{4}[-/]\d{2}[-/]\d{2})/,
  ];

  for (const pattern of datePatterns) {
    const match = text.match(pattern);
    if (match) {
      try {
        const date = new Date(match[1]);
        if (!isNaN(date.getTime())) {
          const monthsOld = (Date.now() - date.getTime()) / (1000 * 60 * 60 * 24 * 30);
          let score = 1.0;
          if (monthsOld <= 6) score = 1.0;
          else if (monthsOld <= 12) score = 0.85;
          else if (monthsOld <= 24) score = 0.6;
          else score = 0.3;
          return { score, publishedDate: date.toISOString().split('T')[0] };
        }
      } catch {}
    }
  }

  return { score: 0.7 };
}

function extractFromText(
  text: string,
  source: string,
  sourceUrl?: string,
  baseConfidence: number = 0.6
): ExtractedFinancial[] {
  const results: ExtractedFinancial[] = [];
  const fiscalPeriod = detectFiscalPeriod(text);
  const currency = detectCurrency(text);
  const freshness = computeFreshnessScore(text);

  for (const mp of METRIC_PATTERNS) {
    for (const pattern of mp.patterns) {
      pattern.lastIndex = 0;
      let match;
      while ((match = pattern.exec(text)) !== null) {
        const rawValue = match[1];
        const unitStr = match[2];
        const num = parseNumber(rawValue);

        if (num === null) continue;
        if (mp.isPercentage && (num > 500 || num < -200)) continue;
        if (mp.isRatio && num > 1000) continue;
        if (!mp.isPercentage && !mp.isRatio && num === 0) continue;

        const { unit, multiplier } = mp.isPercentage || mp.isRatio
          ? { unit: mp.isPercentage ? '%' : 'x', multiplier: 1 }
          : detectUnit(unitStr);

        const normalizedValue = num * multiplier;

        results.push({
          metric: mp.metric,
          value: normalizedValue,
          rawValue: match[0].trim().substring(0, 100),
          unit,
          currency,
          source,
          sourceUrl,
          confidence: baseConfidence * freshness.score,
          extractedAt: new Date().toISOString(),
          fiscalPeriod,
          publishedDate: freshness.publishedDate,
          freshnessScore: freshness.score,
        });

        break;
      }
    }
  }

  return results;
}

function extractFromTable(text: string, source: string, sourceUrl?: string): ExtractedFinancial[] {
  const results: ExtractedFinancial[] = [];

  const tablePatterns = [
    // Negative lookahead (?!\s*%) ensures we don't match percentages
    /(?:Revenue|Sales|Turnover)\s*[:\|]\s*([₹$€£]?\s*[\d,]+\.?\d*)\s*(?!\s*%)(cr(?:ore)?s?|lakh?s?|(?:m|b|t)(?:illion|n)?)?/gi,
    /(?:EBITDA)\s*[:\|]\s*([₹$€£]?\s*[\d,]+\.?\d*)\s*(?!\s*%)(cr(?:ore)?s?|lakh?s?|(?:m|b|t)(?:illion|n)?)?/gi,
    /(?:Net\s+(?:Profit|Income)|PAT)\s*[:\|]\s*([₹$€£]?\s*[\d,]+\.?\d*)\s*(?!\s*%)(cr(?:ore)?s?|lakh?s?|(?:m|b|t)(?:illion|n)?)?/gi,
    /(?:Market\s*Cap)\s*[:\|]\s*([₹$€£]?\s*[\d,]+\.?\d*)\s*(?!\s*%)(cr(?:ore)?s?|lakh?s?|(?:m|b|t)(?:illion|n)?)?/gi,
    /(?:P\/E|PE\s+Ratio)\s*[:\|]\s*([\d,]+\.?\d*)/gi,
    /(?:EPS)\s*[:\|]\s*([₹$€£]?\s*[\d,]+\.?\d*)/gi,
    /(?:ROE)\s*[:\|]\s*(-?[\d,]+\.?\d*)\s*%/gi,
  ];

  const metricMap: Record<number, string> = {
    0: 'revenue', 1: 'ebitda', 2: 'netProfit', 3: 'marketCap',
    4: 'peRatio', 5: 'eps', 6: 'roe',
  };

  for (let i = 0; i < tablePatterns.length; i++) {
    const pattern = tablePatterns[i];
    pattern.lastIndex = 0;
    let match;
    while ((match = pattern.exec(text)) !== null) {
      const num = parseNumber(match[1]);
      if (num === null || num === 0) continue;

      const unitStr = match[2];
      const isPercent = i === 6;
      const isRatio = i === 4;
      const { unit, multiplier } = isPercent || isRatio
        ? { unit: isPercent ? '%' : 'x', multiplier: 1 }
        : detectUnit(unitStr);

      results.push({
        metric: metricMap[i],
        value: num * multiplier,
        rawValue: match[0].trim().substring(0, 100),
        unit,
        currency: detectCurrency(text),
        source,
        sourceUrl,
        confidence: 0.75,
        extractedAt: new Date().toISOString(),
        fiscalPeriod: detectFiscalPeriod(text),
      });
      break;
    }
  }

  return results;
}

const TRUSTED_FINANCIAL_DOMAINS = new Set([
  'nseindia.com', 'bseindia.com', 'sec.gov',
  'reuters.com', 'bloomberg.com', 'ft.com',
  'finance.yahoo.com', 'moneycontrol.com', 'marketwatch.com',
  'economictimes.indiatimes.com', 'livemint.com', 'business-standard.com',
  'financialexpress.com', 'ndtv.com/business', 'screener.in',
  'trendlyne.com', 'tickertape.in', 'valueresearchonline.com',
]);

const UNTRUSTED_DOMAINS = new Set([
  'facebook.com', 'twitter.com', 'instagram.com', 'linkedin.com',
  'pinterest.com', 'tiktok.com', 'reddit.com', 'quora.com',
  'medium.com', 'blogspot.com', 'wordpress.com', 'tumblr.com',
  'youtube.com', 'wikipedia.org',
]);

function isFinanciallyTrustedSource(url: string): boolean {
  const lower = url.toLowerCase();
  for (const domain of UNTRUSTED_DOMAINS) {
    if (lower.includes(domain)) return false;
  }
  return true;
}

function getFinancialSourceConfidence(url: string): number {
  const lower = url.toLowerCase();
  if (lower.includes('bseindia') || lower.includes('nseindia') || lower.includes('sec.gov')) return 0.95;
  if (lower.includes('screener.in') || lower.includes('trendlyne') || lower.includes('tickertape')) return 0.90;
  if (lower.includes('moneycontrol') || lower.includes('finance.yahoo') || lower.includes('reuters') || lower.includes('bloomberg')) return 0.85;
  if (lower.includes('economictimes') || lower.includes('livemint') || lower.includes('business-standard') || lower.includes('ft.com')) return 0.80;
  if (lower.includes('financialexpress') || lower.includes('marketwatch') || lower.includes('ndtv.com/business')) return 0.75;
  for (const domain of TRUSTED_FINANCIAL_DOMAINS) {
    if (lower.includes(domain)) return 0.70;
  }
  return 0.45;
}

export function extractFinancials(
  searchResults: SearchResult[],
  crawledPages: CrawledPage[]
): StructuredFinancials {
  const allExtractions: ExtractedFinancial[] = [];

  for (const result of searchResults) {
    const url = result.url;
    if (!isFinanciallyTrustedSource(url)) {
      continue;
    }

    const text = `${result.title} ${result.description}`;
    const source = result.source || 'web_search';
    const confidence = getFinancialSourceConfidence(url);

    allExtractions.push(...extractFromText(text, source, url, confidence));
  }

  for (const page of crawledPages) {
    if (!isFinanciallyTrustedSource(page.url)) {
      continue;
    }

    let confidence = getFinancialSourceConfidence(page.url);
    if (page.sourceType === 'financial') confidence = Math.max(confidence, 0.85);
    else if (page.sourceType === 'official') confidence = Math.max(confidence, 0.80);

    allExtractions.push(...extractFromText(page.content, `crawl_${page.sourceType}`, page.url, confidence));
    allExtractions.push(...extractFromTable(page.content, `crawl_table_${page.sourceType}`, page.url));
  }

  const grouped: Record<string, ExtractedFinancial[]> = {};
  for (const ex of allExtractions) {
    if (!grouped[ex.metric]) grouped[ex.metric] = [];
    grouped[ex.metric].push(ex);
  }

  for (const metric of Object.keys(grouped)) {
    grouped[metric].sort((a, b) => b.confidence - a.confidence);
  }

  const sourcesUsed = [...new Set(allExtractions.map(e => e.source))];
  const totalExtractions = allExtractions.length;
  const uniqueMetrics = Object.keys(grouped).length;
  const avgConfidence = totalExtractions > 0
    ? allExtractions.reduce((sum, e) => sum + e.confidence, 0) / totalExtractions
    : 0;

  return {
    revenue: grouped['revenue'] || [],
    ebitda: grouped['ebitda'] || [],
    netProfit: grouped['netProfit'] || [],
    operatingProfit: grouped['operatingProfit'] || [],
    grossProfit: grouped['grossProfit'] || [],
    marketCap: grouped['marketCap'] || [],
    revenueGrowth: grouped['revenueGrowth'] || [],
    ebitdaMargin: grouped['ebitdaMargin'] || [],
    netMargin: grouped['netMargin'] || [],
    peRatio: grouped['peRatio'] || [],
    debtToEquity: grouped['debtToEquity'] || [],
    roe: grouped['roe'] || [],
    eps: grouped['eps'] || [],
    freeCashFlow: grouped['freeCashFlow'] || [],
    metadata: {
      totalExtractions,
      uniqueMetrics,
      avgConfidence: Math.round(avgConfidence * 100) / 100,
      sourcesUsed,
      extractedAt: new Date().toISOString(),
    },
  };
}

export function financialsToConsensusInput(
  financials: StructuredFinancials
): Record<string, Record<string, number | null>> {
  const sourceData: Record<string, Record<string, number | null>> = {};

  function addToSource(extractions: ExtractedFinancial[], metricKey: string) {
    for (const ex of extractions) {
      const sourceKey = ex.source;
      if (!sourceData[sourceKey]) sourceData[sourceKey] = {};
      if (sourceData[sourceKey][metricKey] === undefined) {
        sourceData[sourceKey][metricKey] = ex.value;
      }
    }
  }

  addToSource(financials.revenue, 'revenue');
  addToSource(financials.ebitda, 'ebitda');
  addToSource(financials.netProfit, 'netIncome');
  addToSource(financials.operatingProfit, 'operatingIncome');
  addToSource(financials.grossProfit, 'grossProfit');
  addToSource(financials.marketCap, 'marketCap');
  addToSource(financials.revenueGrowth, 'revenueGrowthYoy');
  addToSource(financials.ebitdaMargin, 'ebitdaMargin');
  addToSource(financials.netMargin, 'netMargin');
  addToSource(financials.peRatio, 'peRatio');
  addToSource(financials.debtToEquity, 'debtToEquity');
  addToSource(financials.roe, 'roe');
  addToSource(financials.eps, 'eps');
  addToSource(financials.freeCashFlow, 'freeCashFlow');

  return sourceData;
}
