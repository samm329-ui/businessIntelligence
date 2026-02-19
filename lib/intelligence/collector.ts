/**
 * Data Collection Orchestrator (v4.0 — Search-First + Source Authority)
 * 
 * ARCHITECTURE (v4.0):
 * - Search-first: collectDataSearchFirst() accepts pre-fetched search results
 * - Financial-specific queries (investor presentations, SEC filings, earnings)
 * - Tiered source authority scoring
 * - Crawler intelligence (domain authority, page type detection)
 * - Source reliability weighting during merge
 * - Timestamp freshness weighting
 * - Duplicate detection
 */

import { searchCompanyInfo, searchIndustryInfo, searchFinancialData, searchCompetitors, searchNews, type SearchResult } from '../search-bots/google-bot';
import { identifyInput, type IdentificationResult } from './identifier';
import { createTracer, REALTIME_PRIORITY_MODE } from '../debugging/pipeline-tracer';
import { findPDFUrls, extractFinancialsFromPDFs } from './pdf-extractor';
import axios from 'axios';
import * as cheerio from 'cheerio';

function safeMerge(primary: any, secondary: any): any {
  const result = { ...primary };
  
  if (!secondary || typeof secondary !== 'object') return result;
  
  for (const key in secondary) {
    const primaryValue = result[key];
    const secondaryValue = secondary[key];
    
    if (secondaryValue !== null && secondaryValue !== undefined) {
      if (primaryValue === null || primaryValue === undefined) {
        result[key] = secondaryValue;
      } else if (typeof primaryValue === 'object' && typeof secondaryValue === 'object') {
        result[key] = safeMerge(primaryValue, secondaryValue);
      }
    }
  }
  
  return result;
}

export interface CollectedData {
  entity: {
    name: string;
    type: 'company' | 'industry' | 'brand' | 'unknown';
    industry: string;
    subIndustry: string;
  };
  sources: {
    companyInfo: SearchResult[];
    industryInfo: SearchResult[];
    financialData: SearchResult[];
    competitors: SearchResult[];
    news: SearchResult[];
    crawledPages: CrawledPage[];
  };
  csvCompetitors?: string[]; // Indian competitors from CSV database
  metadata: {
    collectedAt: string;
    totalSources: number;
    collectionTimeMs: number;
    isNewEntity: boolean;
    dataConfidenceScore?: number;
  };
}

export interface CrawledPage {
  url: string;
  title: string;
  content: string;
  crawledAt: string;
  sourceType: 'official' | 'news' | 'financial' | 'other';
}

export interface CollectionOptions {
  maxSources?: number;
  crawlDepth?: number;
  newsDays?: number;
  includeCrawling?: boolean;
  delayBetweenRequests?: number;
}

const DEFAULT_OPTIONS: CollectionOptions = {
  maxSources: 10,
  crawlDepth: 2,
  newsDays: 365,
  includeCrawling: true,
  delayBetweenRequests: 1000,
};

function buildFinancialQueries(entityName: string, industry: string): string[] {
  return [
    `${entityName} site:screener.in`,
    `${entityName} revenue EBITDA profit site:moneycontrol.com`,
    `${entityName} quarterly results revenue profit FY2024 FY2025`,
    `${entityName} annual report revenue EBITDA filetype:pdf`,
    `${entityName} revenue EBITDA profit margin 2024 2025`,
  ];
}

function buildFinancialQuery(entityName: string, industry: string): string {
  return `${entityName} revenue EBITDA profit annual report 2024 2025`;
}

interface StructuredFinancialData {
  revenue?: { value: string; source: string; confidence: number };
  ebitda?: { value: string; source: string; confidence: number };
  profit?: { value: string; source: string; confidence: number };
  marketCap?: { value: string; source: string; confidence: number };
  growth?: { value: string; source: string; confidence: number };
}

function extractStructuredFinancialData(searchResults: SearchResult[]): StructuredFinancialData {
  const data: StructuredFinancialData = {};
  
  for (const result of searchResults) {
    const text = `${result.title || ''} ${result.description || ''}`;
    
    // Revenue patterns
    const revenueMatch = text.match(/revenue[^\d]*₹?(\d+\.?\d*)\s*(cr|crore|lakh|million|billion)/i);
    if (revenueMatch && !data.revenue) {
      data.revenue = {
        value: `${revenueMatch[1]} ${revenueMatch[2]}`,
        source: result.source || 'web_search',
        confidence: 0.7,
      };
    }
    
    // EBITDA patterns
    const ebitdaMatch = text.match(/ebitda[^\d]*₹?(\d+\.?\d*)\s*(cr|crore|lakh|million|billion)/i);
    if (ebitdaMatch && !data.ebitda) {
      data.ebitda = {
        value: `${ebitdaMatch[1]} ${ebitdaMatch[2]}`,
        source: result.source || 'web_search',
        confidence: 0.7,
      };
    }
    
    // Profit patterns
    const profitMatch = text.match(/(?:net\s+)?profit[^\d]*₹?(\d+\.?\d*)\s*(cr|crore|lakh|million|billion)/i);
    if (profitMatch && !data.profit) {
      data.profit = {
        value: `${profitMatch[1]} ${profitMatch[2]}`,
        source: result.source || 'web_search',
        confidence: 0.7,
      };
    }
    
    // Market cap patterns
    const marketCapMatch = text.match(/market\s*cap[^\d]*₹?(\d+\.?\d*)\s*(cr|crore|lakh|million|billion)/i);
    if (marketCapMatch && !data.marketCap) {
      data.marketCap = {
        value: `${marketCapMatch[1]} ${marketCapMatch[2]}`,
        source: result.source || 'web_search',
        confidence: 0.8,
      };
    }
    
    // Growth patterns
    const growthMatch = text.match(/(?:revenue\s+)?growth[^\d]*(-?\d+\.?\d*)\s*%/i);
    if (growthMatch && !data.growth) {
      data.growth = {
        value: `${growthMatch[1]}%`,
        source: result.source || 'web_search',
        confidence: 0.6,
      };
    }
  }
  
  return data;
}

function applyDataConfidenceWeighting(data: StructuredFinancialData): StructuredFinancialData {
  const MIN_CONFIDENCE_THRESHOLD = 0.5;
  const weighted: StructuredFinancialData = {};
  
  if (data.revenue && data.revenue.confidence >= MIN_CONFIDENCE_THRESHOLD) {
    weighted.revenue = data.revenue;
  }
  if (data.ebitda && data.ebitda.confidence >= MIN_CONFIDENCE_THRESHOLD) {
    weighted.ebitda = data.ebitda;
  }
  if (data.profit && data.profit.confidence >= MIN_CONFIDENCE_THRESHOLD) {
    weighted.profit = data.profit;
  }
  if (data.marketCap && data.marketCap.confidence >= MIN_CONFIDENCE_THRESHOLD) {
    weighted.marketCap = data.marketCap;
  }
  if (data.growth && data.growth.confidence >= MIN_CONFIDENCE_THRESHOLD) {
    weighted.growth = data.growth;
  }
  
  return weighted;
}

const SOURCE_AUTHORITY_TIERS: Record<string, { tier: number; weight: number; label: string }> = {
  'sec.gov': { tier: 1, weight: 1.0, label: 'SEC Filing' },
  'bseindia.com': { tier: 1, weight: 1.0, label: 'BSE India' },
  'nseindia.com': { tier: 1, weight: 1.0, label: 'NSE India' },
  'screener.in': { tier: 1, weight: 0.95, label: 'Screener India' },
  'trendlyne.com': { tier: 1, weight: 0.92, label: 'Trendlyne' },
  'tickertape.in': { tier: 1, weight: 0.9, label: 'TickerTape' },
  'investor': { tier: 1, weight: 0.95, label: 'Investor Relations' },
  'ir.': { tier: 1, weight: 0.95, label: 'Investor Relations' },
  'annualreport': { tier: 1, weight: 0.95, label: 'Annual Report' },
  
  'reuters.com': { tier: 2, weight: 0.9, label: 'Reuters' },
  'bloomberg.com': { tier: 2, weight: 0.9, label: 'Bloomberg' },
  'finance.yahoo.com': { tier: 2, weight: 0.85, label: 'Yahoo Finance' },
  'moneycontrol.com': { tier: 2, weight: 0.85, label: 'Moneycontrol' },
  'business-standard.com': { tier: 2, weight: 0.8, label: 'Business Standard' },
  'economictimes.indiatimes.com': { tier: 2, weight: 0.8, label: 'Economic Times' },
  'livemint.com': { tier: 2, weight: 0.8, label: 'Livemint' },
  'financialexpress.com': { tier: 2, weight: 0.78, label: 'Financial Express' },
  'marketwatch.com': { tier: 2, weight: 0.8, label: 'MarketWatch' },
  'ft.com': { tier: 2, weight: 0.85, label: 'Financial Times' },
  
  'wikipedia.org': { tier: 3, weight: 0.65, label: 'Wikipedia' },
};

const BLOCKED_DOMAINS = new Set([
  'facebook.com', 'twitter.com', 'instagram.com', 'linkedin.com',
  'pinterest.com', 'tiktok.com', 'reddit.com', 'quora.com',
  'medium.com', 'blogspot.com', 'wordpress.com',
]);

function getSourceAuthority(url: string): { tier: number; weight: number; label: string; blocked: boolean } {
  const urlLower = url.toLowerCase();
  
  for (const domain of BLOCKED_DOMAINS) {
    if (urlLower.includes(domain)) {
      return { tier: 99, weight: 0, label: 'Blocked', blocked: true };
    }
  }
  
  for (const [pattern, authority] of Object.entries(SOURCE_AUTHORITY_TIERS)) {
    if (urlLower.includes(pattern)) {
      return { ...authority, blocked: false };
    }
  }
  
  return { tier: 3, weight: 0.5, label: 'General Web', blocked: false };
}

function filterAndRankByAuthority(results: SearchResult[]): SearchResult[] {
  return results
    .filter(r => !getSourceAuthority(r.url).blocked)
    .sort((a, b) => {
      const aAuth = getSourceAuthority(a.url);
      const bAuth = getSourceAuthority(b.url);
      return bAuth.weight - aAuth.weight;
    });
}

function shouldCrawlDomain(url: string): { shouldCrawl: boolean; reason: string; priority: number } {
  const authority = getSourceAuthority(url);
  
  if (authority.blocked) {
    return { shouldCrawl: false, reason: 'blocked_domain', priority: 0 };
  }
  
  const urlLower = url.toLowerCase();
  
  if (urlLower.endsWith('.pdf')) {
    return { shouldCrawl: false, reason: 'pdf_not_supported', priority: 0 };
  }
  
  if (urlLower.includes('login') || urlLower.includes('signup') || urlLower.includes('paywall')) {
    return { shouldCrawl: false, reason: 'requires_auth', priority: 0 };
  }
  
  if (authority.tier === 1) {
    return { shouldCrawl: true, reason: 'tier1_authoritative', priority: 10 };
  }
  
  if (authority.tier === 2) {
    return { shouldCrawl: true, reason: 'tier2_financial_source', priority: 8 };
  }
  
  return { shouldCrawl: true, reason: 'general_source', priority: 3 };
}

function deduplicateResults(results: SearchResult[]): SearchResult[] {
  const seen = new Map<string, SearchResult>();
  
  for (const result of results) {
    const key = result.url.replace(/^https?:\/\//, '').replace(/\/$/, '').toLowerCase();
    if (!seen.has(key)) {
      seen.set(key, result);
    }
  }
  
  return Array.from(seen.values());
}

export async function collectData(
  input: string,
  options: CollectionOptions = {}
): Promise<CollectedData> {
  const startTime = Date.now();
  const opts = { ...DEFAULT_OPTIONS, ...options };

  console.log(`[Collector] Starting data collection for: "${input}"`);

  // Step 1: Identify the entity
  const identification = await identifyInput(input);
  
  if (!identification.found) {
    throw new Error(`Could not identify entity: "${input}"`);
  }

  const entityName = identification.name;
  const industry = identification.industry;

  console.log(`[Collector] Identified: ${entityName} (${industry})`);

  // Build enhanced financial queries for better results
  const financialQuery = buildFinancialQuery(entityName, industry);

  // Step 2: Collect from multiple sources (parallel where possible)
  const [
    companyInfo,
    industryInfo,
    financialData,
    competitors,
    news,
  ] = await Promise.all([
    searchCompanyInfo(financialQuery),
    searchIndustryInfo(industry),
    searchFinancialData(financialQuery),
    searchCompetitors(entityName, industry),
    searchNews(entityName, opts.newsDays || 30),
  ]);

  console.log(`[Collector] Search complete: ${companyInfo.length + industryInfo.length + financialData.length + competitors.length + news.length} results`);

  // Trace web search execution
  const tracer = createTracer('collector');
  tracer.trace('WEB_SEARCH_TRIGGERED', {
    source: 'web_search',
    metadata: {
      companyInfoCount: companyInfo.length,
      industryInfoCount: industryInfo.length,
      financialDataCount: financialData.length,
      competitorsCount: competitors.length,
      newsCount: news.length,
    },
  });

  // Step 3: Crawl important pages (if enabled)
  let crawledPages: CrawledPage[] = [];
  if (opts.includeCrawling) {
    const urlsToCrawl = selectUrlsToCrawl([
      ...companyInfo,
      ...financialData,
    ], opts.maxSources || 10);
    
    crawledPages = await crawlUrls(urlsToCrawl, opts.delayBetweenRequests || 1000);
    console.log(`[Collector] Crawled ${crawledPages.length} pages`);
    
    // Trace crawler execution
    tracer.trace('CRAWLER_EXECUTED', {
      source: 'crawler',
      metadata: {
        pagesCrawled: crawledPages.length,
        urlsAttempted: urlsToCrawl.length,
      },
    });
  }

  const endTime = Date.now();

  // Extract structured financial data from search results
  const structuredFinancialData = extractStructuredFinancialData(financialData);

  // Apply data confidence weighting
  const weightedFinancialData = applyDataConfidenceWeighting(structuredFinancialData);

  return {
    entity: {
      name: entityName,
      type: identification.type,
      industry: identification.industry,
      subIndustry: identification.subIndustry,
    },
    sources: {
      companyInfo: filterAndRankByAuthority(companyInfo).slice(0, opts.maxSources),
      industryInfo: filterAndRankByAuthority(industryInfo).slice(0, opts.maxSources),
      financialData: filterAndRankByAuthority(financialData).slice(0, opts.maxSources),
      competitors: filterAndRankByAuthority(competitors).slice(0, opts.maxSources),
      news: filterAndRankByAuthority(news).slice(0, opts.maxSources),
      crawledPages,
    },
    metadata: {
      collectedAt: new Date().toISOString(),
      totalSources: companyInfo.length + industryInfo.length + financialData.length + competitors.length + news.length + crawledPages.length,
      collectionTimeMs: endTime - startTime,
      isNewEntity: identification.isNew || false,
    },
  };
}

export async function collectDataSearchFirst(
  input: string,
  identification: IdentificationResult,
  preSearchResults: SearchResult[],
  options: CollectionOptions = {}
): Promise<CollectedData> {
  const startTime = Date.now();
  const opts = { ...DEFAULT_OPTIONS, ...options };

  const entityName = identification.name || input;
  const industry = identification.industry || 'Unknown';

  console.log(`[Collector] Search-first collection for: "${entityName}" (${industry})`);

  const financialQueries = buildFinancialQueries(entityName, industry);
  const primaryFinancialQuery = buildFinancialQuery(entityName, industry);

  const [
    industryInfo,
    financialData,
    competitors,
    news,
    ...additionalFinancialResults
  ] = await Promise.all([
    searchIndustryInfo(industry),
    searchFinancialData(primaryFinancialQuery),
    searchCompetitors(entityName, industry),
    searchNews(entityName, opts.newsDays || 30),
    ...financialQueries.slice(0, 3).map(q => 
      searchFinancialData(q).catch(() => [] as SearchResult[])
    ),
  ]);

  const allFinancialData = deduplicateResults([
    ...financialData,
    ...additionalFinancialResults.flat(),
  ]);
  const allCompanyInfo = deduplicateResults(preSearchResults);

  console.log(`[Collector] Search-first complete: ${allCompanyInfo.length + industryInfo.length + allFinancialData.length + competitors.length + news.length} results`);

  const tracer = createTracer('collector-search-first');
  tracer.trace('WEB_SEARCH_TRIGGERED', {
    source: 'web_search',
    metadata: {
      mode: 'search_first',
      companyInfoCount: allCompanyInfo.length,
      industryInfoCount: industryInfo.length,
      financialDataCount: allFinancialData.length,
      competitorsCount: competitors.length,
      newsCount: news.length,
      preSearchUsed: preSearchResults.length,
    },
  });

  const allSearchResults = filterAndRankByAuthority([
    ...allCompanyInfo,
    ...allFinancialData,
  ]);

  const pdfUrls = findPDFUrls([...allCompanyInfo, ...allFinancialData], 2);
  let crawledPages: CrawledPage[] = [];
  
  if (pdfUrls.length > 0) {
    console.log(`[Collector] EXTRACTION PRIORITY 1/3: Extracting ${pdfUrls.length} PDFs...`);
    try {
      const pdfResults = await extractFinancialsFromPDFs(pdfUrls);
      for (const pdf of pdfResults) {
        if (pdf.success && pdf.text) {
          crawledPages.push({
            url: pdf.url,
            title: `PDF: ${pdf.url.split('/').pop() || 'document'}`,
            content: pdf.text.substring(0, 10000),
            crawledAt: pdf.extractedAt,
            sourceType: 'financial',
          });
        }
      }
      console.log(`[Collector] PDF extraction complete: ${pdfResults.filter(p => p.success).length}/${pdfResults.length} successful`);
    } catch (error: any) {
      console.warn(`[Collector] PDF extraction failed: ${error.message}`);
    }
  }

  if (opts.includeCrawling) {
    const urlsToCrawl = selectUrlsToCrawlIntelligent(allSearchResults, opts.maxSources || 8);
    const crawled = await crawlUrls(urlsToCrawl, opts.delayBetweenRequests || 1000);
    crawledPages = [...crawledPages, ...crawled];
    console.log(`[Collector] EXTRACTION PRIORITY 2/3: Smart-crawled ${crawled.length} pages (from ${urlsToCrawl.length} candidates)`);
    
    tracer.trace('CRAWLER_EXECUTED', {
      source: 'crawler',
      metadata: {
        pagesCrawled: crawled.length,
        urlsAttempted: urlsToCrawl.length,
        mode: 'intelligent',
      },
    });
  }

  console.log(`[Collector] EXTRACTION PRIORITY 3/3: Search results processed (${allSearchResults.length} items)`);

  const endTime = Date.now();

  const structuredFinancialData = extractStructuredFinancialData(allFinancialData);
  const weightedFinancialData = applyDataConfidenceWeighting(structuredFinancialData);

  return {
    entity: {
      name: entityName,
      type: identification.type || 'unknown',
      industry: identification.industry || 'Unknown',
      subIndustry: identification.subIndustry || 'Unknown',
    },
    sources: {
      companyInfo: filterAndRankByAuthority(allCompanyInfo).slice(0, opts.maxSources),
      industryInfo: filterAndRankByAuthority(industryInfo).slice(0, opts.maxSources),
      financialData: filterAndRankByAuthority(allFinancialData).slice(0, opts.maxSources),
      competitors: filterAndRankByAuthority(competitors).slice(0, opts.maxSources),
      news: filterAndRankByAuthority(news).slice(0, opts.maxSources),
      crawledPages,
    },
    metadata: {
      collectedAt: new Date().toISOString(),
      totalSources: allCompanyInfo.length + industryInfo.length + allFinancialData.length + competitors.length + news.length + crawledPages.length,
      collectionTimeMs: endTime - startTime,
      isNewEntity: identification.isNew || false,
    },
  };
}

// ═══════════════════════════════════════════════════════════════════════════
// Select URLs to Crawl
// ═══════════════════════════════════════════════════════════════════════════

function selectUrlsToCrawl(searchResults: SearchResult[], maxUrls: number): string[] {
  return selectUrlsToCrawlIntelligent(searchResults, maxUrls);
}

function selectUrlsToCrawlIntelligent(searchResults: SearchResult[], maxUrls: number): string[] {
  const urls: string[] = [];
  const seenDomains = new Set<string>();

  const scored = searchResults.map(result => {
    const crawlDecision = shouldCrawlDomain(result.url);
    const authority = getSourceAuthority(result.url);
    
    if (!crawlDecision.shouldCrawl) return { ...result, score: -1, reason: crawlDecision.reason };
    
    let score = crawlDecision.priority;
    const url = result.url.toLowerCase();
    const title = (result.title || '').toLowerCase();

    if (authority.tier === 1) score += 15;
    else if (authority.tier === 2) score += 10;

    if (url.includes('investor') || url.includes('annual-report') || url.includes('earnings')) {
      score += 12;
    }
    if (title.includes('financial') || title.includes('revenue') || title.includes('earnings')) {
      score += 8;
    }
    if (url.includes('wikipedia.org')) score += 5;

    return { ...result, score, reason: crawlDecision.reason };
  });

  const sortedScored = scored
    .filter(r => r.score >= 0)
    .sort((a, b) => b.score - a.score);

  for (const result of sortedScored) {
    if (urls.length >= maxUrls) break;
    if (result.score < 0) continue;

    try {
      const domain = new URL(result.url).hostname;
      if (!seenDomains.has(domain)) {
        urls.push(result.url);
        seenDomains.add(domain);
      }
    } catch {
    }
  }

  return urls;
}

// ═══════════════════════════════════════════════════════════════════════════
// Crawl URLs
// ═══════════════════════════════════════════════════════════════════════════

async function crawlUrls(urls: string[], delayMs: number): Promise<CrawledPage[]> {
  const crawledPages: CrawledPage[] = [];

  for (const url of urls) {
    try {
      const page = await crawlPageWithRetry(url, 3);
      if (page) {
        crawledPages.push(page);
      }
      // Add delay to be polite
      await new Promise(resolve => setTimeout(resolve, delayMs));
    } catch (error: any) {
      console.warn(`[Collector] Failed to crawl ${url}:`, error.message);
    }
  }

  return crawledPages;
}

async function crawlPageWithRetry(url: string, retries = 3): Promise<CrawledPage | null> {
  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      return await crawlPage(url);
    } catch (error: any) {
      if (attempt === retries) {
        throw error;
      }
      const delay = 1000 * attempt;
      console.log(`[Collector] Retry ${attempt}/${retries} for ${url} after ${delay}ms`);
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }
  return null;
}

async function crawlPage(url: string): Promise<CrawledPage | null> {
  try {
    const response = await axios.get(url, {
      timeout: 15000,
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
        'Accept-Language': 'en-US,en;q=0.5',
      },
      maxRedirects: 5,
    });

    const $ = cheerio.load(response.data);
    
    // Remove script and style elements
    $('script, style, nav, footer, header, aside').remove();

    // Extract main content
    const title = $('title').text().trim();
    let content = '';

    // Try to find main content area
    const contentSelectors = [
      'article',
      'main',
      '[role="main"]',
      '.content',
      '.main-content',
      '#content',
      '#main-content',
      '.post-content',
      '.entry-content',
    ];

    for (const selector of contentSelectors) {
      const element = $(selector);
      if (element.length > 0) {
        content = element.text().trim();
        break;
      }
    }

    // Fallback to body if no content found
    if (!content) {
      content = $('body').text().trim();
    }

    // Clean up content
    content = content
      .replace(/\s+/g, ' ')
      .replace(/\n+/g, '\n')
      .substring(0, 10000); // Limit content size

    // Determine source type
    const urlLower = url.toLowerCase();
    let sourceType: CrawledPage['sourceType'] = 'other';
    
    if (urlLower.includes('moneycontrol') || urlLower.includes('economictimes') || 
        urlLower.includes('finance') || urlLower.includes('bse') || urlLower.includes('nse')) {
      sourceType = 'financial';
    } else if (urlLower.includes('news') || urlLower.includes('article') || 
               urlLower.includes('times') || urlLower.includes('post')) {
      sourceType = 'news';
    } else if (!urlLower.includes('wikipedia') && !urlLower.includes('google')) {
      sourceType = 'official';
    }

    return {
      url,
      title,
      content,
      crawledAt: new Date().toISOString(),
      sourceType,
    };
  } catch (error: any) {
    console.warn(`[Collector] Crawl error for ${url}:`, error.message);
    return null;
  }
}

// ═══════════════════════════════════════════════════════════════════════════
// Collect Financial Data (Enhanced)
// ═══════════════════════════════════════════════════════════════════════════

export async function collectFinancialData(
  companyName: string,
  ticker?: string
): Promise<{
  revenue?: string;
  ebitda?: string;
  profit?: string;
  growth?: string;
  marketCap?: string;
  sources: string[];
}> {
  const data: any = { sources: [] };

  // Try Yahoo Finance if ticker available
  if (ticker) {
    try {
      const yahooData = await fetchYahooFinance(ticker);
      Object.assign(data, yahooData);
      data.sources.push('yahoo_finance');
    } catch (error: any) {
      console.warn(`[Collector] Yahoo Finance error:`, error.message);
    }
  }

  // Search for financial info
  try {
    const searchResults = await searchFinancialData(companyName);
    
    // Extract financial figures from search results
    for (const result of searchResults) {
      const { title, description } = result;
      const text = `${title} ${description}`;

      // Revenue patterns
      const revenueMatch = text.match(/revenue[^\d]*(\d+\.?\d*)\s*(cr|crore|lakh|million|billion)/i);
      if (revenueMatch && !data.revenue) {
        data.revenue = `${revenueMatch[1]} ${revenueMatch[2]}`;
      }

      // EBITDA patterns
      const ebitdaMatch = text.match(/ebitda[^\d]*(\d+\.?\d*)\s*(cr|crore|lakh|million|billion)/i);
      if (ebitdaMatch && !data.ebitda) {
        data.ebitda = `${ebitdaMatch[1]} ${ebitdaMatch[2]}`;
      }

      // Profit patterns
      const profitMatch = text.match(/profit[^\d]*(\d+\.?\d*)\s*(cr|crore|lakh|million|billion)/i);
      if (profitMatch && !data.profit) {
        data.profit = `${profitMatch[1]} ${profitMatch[2]}`;
      }

      // Growth patterns
      const growthMatch = text.match(/growth[^\d]*(\d+\.?\d*)%?/i);
      if (growthMatch && !data.growth) {
        data.growth = `${growthMatch[1]}%`;
      }

      // Market cap patterns
      const mcapMatch = text.match(/market cap[^\d]*(\d+\.?\d*)\s*(cr|crore|lakh|million|billion)/i);
      if (mcapMatch && !data.marketCap) {
        data.marketCap = `${mcapMatch[1]} ${mcapMatch[2]}`;
      }
    }

    if (searchResults.length > 0) {
      data.sources.push('google_search');
    }
  } catch (error: any) {
    console.warn(`[Collector] Financial search error:`, error.message);
  }

  return data;
}

// ═══════════════════════════════════════════════════════════════════════════
// Fetch Yahoo Finance Data (Unofficial)
// ═══════════════════════════════════════════════════════════════════════════

async function fetchYahooFinance(ticker: string): Promise<any> {
  try {
    // Using Yahoo Finance unofficial API
    const response = await axios.get(`https://query1.finance.yahoo.com/v8/finance/chart/${ticker}`, {
      timeout: 10000,
    });

    const result = response.data.chart.result?.[0];
    if (!result) {
      throw new Error('No data from Yahoo Finance');
    }

    const meta = result.meta;
    
    return {
      marketCap: meta.marketCap ? formatMarketCap(meta.marketCap) : undefined,
      revenue: undefined, // Yahoo doesn't provide revenue directly
    };
  } catch (error: any) {
    throw new Error(`Yahoo Finance fetch failed: ${error.message}`);
  }
}

function formatMarketCap(cap: number): string {
  if (cap >= 1e12) {
    return `${(cap / 1e12).toFixed(2)}T`;
  } else if (cap >= 1e9) {
    return `${(cap / 1e9).toFixed(2)}B`;
  } else if (cap >= 1e6) {
    return `${(cap / 1e6).toFixed(2)}M`;
  }
  return `${cap}`;
}

// ═══════════════════════════════════════════════════════════════════════════
// Extract Competitors from Data - Using CSV Database for Indian Companies
// ═══════════════════════════════════════════════════════════════════════════

import { getIndianCompetitors, getIndianCompetitorsBySubIndustry, loadCompanyDatabase } from '../datasets/company-database';

export interface CompetitorGraph {
  primary: string;
  competitors: string[];
  relationships: Map<string, string[]>;
  sources: string[];
}

export async function extractCompetitors(collectedData: CollectedData): Promise<string[]> {
  const competitors = new Set<string>();
  const entityName = collectedData.entity.name;
  const industry = collectedData.entity.industry;
  const subIndustry = collectedData.entity.subIndustry;
  
  console.log(`[Collector] Extracting competitors for ${entityName} (${industry}/${subIndustry})`);
  
  // Priority 1: CSV database (verified Indian companies)
  try {
    await loadCompanyDatabase();
    
    let csvCompetitors = getIndianCompetitorsBySubIndustry(subIndustry, entityName, 10);
    
    if (csvCompetitors.length < 5) {
      const industryCompetitors = getIndianCompetitors(industry, entityName, 10);
      const seen = new Set(csvCompetitors.map(c => c.companyName));
      for (const comp of industryCompetitors) {
        if (!seen.has(comp.companyName)) {
          csvCompetitors.push(comp);
          seen.add(comp.companyName);
        }
      }
    }
    
    for (const comp of csvCompetitors.slice(0, 10)) {
      competitors.add(comp.companyName);
    }
    
    console.log(`[Collector] CSV competitors: ${csvCompetitors.length}`);
  } catch (error: any) {
    console.warn(`[Collector] CSV competitor error: ${error.message}`);
  }

  // Priority 2: Structured extraction from earnings/market reports (FIX 7)
  const earningsReportPatterns = collectedData.sources.financialData.filter(r => 
    /earning|report|quarter|annual|result|revenue|profit|analysis/i.test(r.title || '')
  );
  
  for (const result of earningsReportPatterns) {
    const text = `${result.title} ${result.description}`;
    
    // Patterns specific to earnings/market reports
    const earningsCompetitorPatterns = [
      /(?:vs|versus|compared\s+to|compete[d]?\s+with)\s+([A-Z][a-zA-Z]+(?:\s+[A-Z][a-zA-Z]+)?)/gi,
      /(?:peer|peer\s+group|competing\s+companies)[:\s]+([A-Z][a-zA-Z,\s]+?)(?:\.|$)/gi,
      /(?:market\s+share|revenue\s+share)[:\s]+([A-Z][a-zA-Z]+)/gi,
      /(?:competes?|competing)\s+(?:with|in)\s+([A-Z][a-zA-Z]+)/gi,
    ];
    
    for (const pattern of earningsCompetitorPatterns) {
      let match;
      while ((match = pattern.exec(text)) !== null) {
        const names = match[1]?.split(/,\s*|\s+and\s+/);
        for (const rawName of names || []) {
          const name = rawName.trim();
          if (name && name.length > 2 && name.length < 50 && !/^(the|and|or|vs|etc)$/i.test(name)) {
            if (name.toLowerCase() !== entityName.toLowerCase()) {
              competitors.add(name);
            }
          }
        }
      }
    }
  }
  
  // Priority 3: Crawled pages (especially financial reports)
  for (const page of collectedData.sources.crawledPages) {
    if (page.sourceType === 'financial' || /earning|report|annual|quarter|results/i.test(page.title)) {
      const text = page.content.substring(0, 5000);
      
      const companyPatterns = [
        /([A-Z][a-zA-Z]+(?:\s+Ltd\.?|\s+Limited|\s+Inc\.?|\s+Corp\.?)?)\s+(?:reported|announced|posted|declared)/gi,
        /(?:competitor|peer|rival)[:\s]+([A-Z][a-zA-Z\s,]+?)(?:\.|;|$)/gi,
        /vs\.?\s+([A-Z][a-zA-Z]+)/gi,
      ];
      
      for (const pattern of companyPatterns) {
        let match;
        while ((match = pattern.exec(text)) !== null) {
          const name = match[1]?.trim();
          if (name && name.length > 2 && name.length < 50 && name.toLowerCase() !== entityName.toLowerCase()) {
            competitors.add(name);
          }
        }
      }
    }
  }
  
  // Priority 4: General competitor search results
  const BLACKLIST = new Set([
    'the','and','or','vs','etc','also','had','has','have','been','was',
    'were','are','this','that','with','from','into','than','then','they',
    'company','companies','business','market','industry','sector','india',
    'indian','million','billion','crore','revenue','profit','growth',
    'funding','raised','investors','startup','venture','capital','data',
    'report','quarter','annual','results','financial','statement'
  ]);

  for (const result of collectedData.sources.competitors) {
    const text = `${result.title} ${result.description}`;
    
    // Stricter patterns that require context keywords
    const companyPatterns = [
      /(?:competitors?|rivals?|competing with)\s*:?\s*([A-Z][a-zA-Z]+(?:\s+[A-Z][a-zA-Z]+){0,2})/gi,
      /(?:vs\.?|versus)\s+([A-Z][a-zA-Z]+(?:\s+[A-Z][a-zA-Z]+){0,2})\b/gi,
    ];

    for (const pattern of companyPatterns) {
      let match;
      while ((match = pattern.exec(text)) !== null) {
        const names = match[1]?.split(/,\s*/);
        for (const rawName of names || []) {
          const name = rawName.trim();
          // Stricter filtering
          if (name && name.length > 2 && name.length < 40 
              && !BLACKLIST.has(name.toLowerCase())
              && /^[A-Z]/.test(name)  // must start with capital
              && name.split(' ').length <= 4  // max 4 words
              && name.toLowerCase() !== entityName.toLowerCase()) {
            competitors.add(name);
          }
        }
      }
    }
  }

  // Priority 5: Industry and news sources
  for (const result of [...collectedData.sources.industryInfo, ...collectedData.sources.news]) {
    const text = `${result.title} ${result.description}`;
    
    const listingPatterns = [
      /(?:listed|traded|NSE|BSE|NYSE|NASDAQ)[:\s]+([A-Z][a-zA-Z\s]+?)(?:,|\.|;|$)/gi,
      /(?:funding|raised|IPO|valuation)[^\n]*?([A-Z][a-zA-Z]+(?:\s+[A-Z][a-zA-Z]+){0,2})/gi,
      /(?:industry\s+association|trade\s+body)[^\n]*?([A-Z][a-zA-Z\s,]+)/gi,
    ];
    
    for (const pattern of listingPatterns) {
      let match;
      while ((match = pattern.exec(text)) !== null) {
        const name = match[1]?.trim();
        if (name && name.length > 3 && name.length < 40 && name.toLowerCase() !== entityName.toLowerCase()) {
          competitors.add(name);
        }
      }
    }
  }
  
  const finalCompetitors = Array.from(competitors).slice(0, 15);
  console.log(`[Collector] Total competitors found: ${finalCompetitors.length}`);
  
  return finalCompetitors;
}

// ═══════════════════════════════════════════════════════════════════════════
// Get Collection Summary
// ═══════════════════════════════════════════════════════════════════════════

export function getCollectionSummary(data: CollectedData): string {
  const { entity, sources, metadata } = data;
  
  return `
Data Collection Summary
=======================
Entity: ${entity.name}
Type: ${entity.type}
Industry: ${entity.industry} / ${entity.subIndustry}

Sources Collected:
- Company Info: ${sources.companyInfo.length} results
- Industry Info: ${sources.industryInfo.length} results
- Financial Data: ${sources.financialData.length} results
- Competitors: ${sources.competitors.length} results
- News: ${sources.news.length} articles
- Crawled Pages: ${sources.crawledPages.length} pages

Metadata:
- Collection Time: ${metadata.collectionTimeMs}ms
- Total Sources: ${metadata.totalSources}
- Is New Entity: ${metadata.isNewEntity ? 'Yes' : 'No'}
- Collected At: ${metadata.collectedAt}
  `.trim();
}
