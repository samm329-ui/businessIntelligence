/**
 * Google Search Bot - Free Implementation
 * Uses multiple methods to search Google without paid API
 * 
 * Methods:
 * 1. Google Custom Search API (100 queries/day free) - PRIMARY
 * 2. DuckDuckGo (no API key) - FALLBACK
 * 3. SerpAPI (100 queries/month free) - OPTIONAL
 * 4. Direct scraping (last resort)
 */

import axios from 'axios';
import * as cheerio from 'cheerio';

export interface SearchResult {
  title: string;
  url: string;
  description: string;
  source: 'google' | 'duckduckgo' | 'serpapi' | 'scrape';
}

export interface SearchOptions {
  numResults?: number;
  safeSearch?: boolean;
  language?: string;
  country?: string;
}

// ═══════════════════════════════════════════════════════════════════════════
// Method 1: Google Custom Search API (Free: 100 queries/day)
// ═══════════════════════════════════════════════════════════════════════════

export async function searchWithGoogleAPI(
  query: string,
  options: SearchOptions = {}
): Promise<SearchResult[]> {
  const apiKey = process.env.GOOGLE_CUSTOM_SEARCH_API_KEY;
  const cx = process.env.GOOGLE_SEARCH_ENGINE_ID;

  if (!apiKey || !cx) {
    console.log('[GoogleBot] API key not configured, skipping Google API');
    return [];
  }

  try {
    const response = await axios.get('https://www.googleapis.com/customsearch/v1', {
      params: {
        key: apiKey,
        cx: cx,
        q: query,
        num: options.numResults || 10,
        safe: options.safeSearch ? 'active' : 'off',
        lr: options.language ? `lang_${options.language}` : undefined,
        cr: options.country ? `country${options.country.toUpperCase()}` : undefined,
      },
      timeout: 10000,
    });

    if (!response.data.items) {
      return [];
    }

    return response.data.items.map((item: any) => ({
      title: item.title,
      url: item.link,
      description: item.snippet,
      source: 'google' as const,
    }));
  } catch (error: any) {
    console.error('[GoogleBot] API search error:', error.message);
    return [];
  }
}

// ═══════════════════════════════════════════════════════════════════════════
// Method 2: DuckDuckGo (No API key needed)
// ═══════════════════════════════════════════════════════════════════════════

export async function searchWithDuckDuckGo(
  query: string,
  options: SearchOptions = {}
): Promise<SearchResult[]> {
  try {
    const response = await axios.get('https://html.duckduckgo.com/html/', {
      params: { q: query },
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
        'Accept-Language': 'en-US,en;q=0.5',
        'Accept-Encoding': 'gzip, deflate, br',
        'DNT': '1',
        'Connection': 'keep-alive',
      },
      timeout: 15000,
    });

    const $ = cheerio.load(response.data);
    const results: SearchResult[] = [];

    $('.result').each((_, element) => {
      const titleElement = $(element).find('.result__a');
      const snippetElement = $(element).find('.result__snippet');
      const urlElement = $(element).find('.result__url');

      const title = titleElement.text().trim();
      const url = titleElement.attr('href') || urlElement.text().trim();
      const description = snippetElement.text().trim();

      if (title && url) {
        results.push({
          title,
          url: url.startsWith('http') ? url : `https://${url}`,
          description,
          source: 'duckduckgo',
        });
      }
    });

    return results.slice(0, options.numResults || 10);
  } catch (error: any) {
    console.error('[GoogleBot] DuckDuckGo search error:', error.message);
    return [];
  }
}

// ═══════════════════════════════════════════════════════════════════════════
// Method 3: SerpAPI (Free: 100 queries/month)
// ═══════════════════════════════════════════════════════════════════════════

export async function searchWithSerpAPI(
  query: string,
  options: SearchOptions = {}
): Promise<SearchResult[]> {
  const apiKey = process.env.SERPAPI_KEY;

  if (!apiKey) {
    return [];
  }

  try {
    const response = await axios.get('https://serpapi.com/search', {
      params: {
        api_key: apiKey,
        engine: 'google',
        q: query,
        num: options.numResults || 10,
        safe: options.safeSearch ? 'active' : 'off',
        hl: options.language,
        gl: options.country,
      },
      timeout: 15000,
    });

    if (!response.data.organic_results) {
      return [];
    }

    return response.data.organic_results.map((item: any) => ({
      title: item.title,
      url: item.link,
      description: item.snippet,
      source: 'serpapi',
    }));
  } catch (error: any) {
    console.error('[GoogleBot] SerpAPI search error:', error.message);
    return [];
  }
}

// ═══════════════════════════════════════════════════════════════════════════
// Method 4: Direct Google Scraping (Last resort, may be blocked)
// ═══════════════════════════════════════════════════════════════════════════

export async function searchWithScraping(
  query: string,
  options: SearchOptions = {}
): Promise<SearchResult[]> {
  try {
    const response = await axios.get('https://www.google.com/search', {
      params: {
        q: query,
        num: options.numResults || 10,
        safe: options.safeSearch ? 'active' : 'off',
        lr: options.language ? `lang_${options.language}` : undefined,
        cr: options.country ? `country${options.country.toUpperCase()}` : undefined,
      },
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
        'Accept-Language': 'en-US,en;q=0.5',
        'Accept-Encoding': 'gzip, deflate, br',
        'Referer': 'https://www.google.com/',
        'DNT': '1',
        'Connection': 'keep-alive',
      },
      timeout: 15000,
    });

    const $ = cheerio.load(response.data);
    const results: SearchResult[] = [];

    // Try different selectors as Google changes them frequently
    const selectors = [
      'div.g',
      'div[data-async-context]',
      '.g',
      'div.tF2Cxc',
      'div.yuRUbf',
    ];

    for (const selector of selectors) {
      $(selector).each((_, element) => {
        const titleElement = $(element).find('h3');
        const linkElement = $(element).find('a');
        const snippetElement = $(element).find('.VwiC3b, .s3v94d, .st');

        const title = titleElement.text().trim();
        const url = linkElement.attr('href');
        const description = snippetElement.text().trim();

        if (title && url && url.startsWith('http')) {
          results.push({
            title,
            url,
            description,
            source: 'scrape',
          });
        }
      });

      if (results.length > 0) break;
    }

    return results.slice(0, options.numResults || 10);
  } catch (error: any) {
    console.error('[GoogleBot] Scraping error:', error.message);
    return [];
  }
}

// ═══════════════════════════════════════════════════════════════════════════
// Main Search Function - Tries all methods
// ═══════════════════════════════════════════════════════════════════════════

export async function searchGoogle(
  query: string,
  options: SearchOptions = {}
): Promise<SearchResult[]> {
  console.log(`[GoogleBot] Searching for: "${query}"`);

  // Try methods in order of reliability
  const methods = [
    { name: 'Google API', fn: searchWithGoogleAPI },
    { name: 'DuckDuckGo', fn: searchWithDuckDuckGo },
    { name: 'SerpAPI', fn: searchWithSerpAPI },
    { name: 'Direct Scraping', fn: searchWithScraping },
  ];

  for (const method of methods) {
    try {
      console.log(`[GoogleBot] Trying ${method.name}...`);
      const results = await method.fn(query, options);
      
      if (results.length > 0) {
        console.log(`[GoogleBot] ✓ Success with ${method.name}: ${results.length} results`);
        return results;
      }
    } catch (error: any) {
      console.warn(`[GoogleBot] ${method.name} failed:`, error.message);
    }
  }

  console.warn('[GoogleBot] All search methods failed');
  return [];
}

// ═══════════════════════════════════════════════════════════════════════════
// Specialized Search Functions
// ═══════════════════════════════════════════════════════════════════════════

export async function searchCompanyInfo(companyName: string): Promise<SearchResult[]> {
  const queries = [
    `"${companyName}" company profile investor relations`,
    `"${companyName}" annual report financial highlights 2025 2024`,
    `"${companyName}" business model revenue segments`,
  ];

  const allResults: SearchResult[] = [];
  
  for (const query of queries) {
    const results = await searchGoogle(query, { numResults: 5 });
    allResults.push(...results);
    await new Promise(resolve => setTimeout(resolve, 1000));
  }

  const seen = new Set<string>();
  return allResults.filter(r => {
    if (seen.has(r.url)) return false;
    seen.add(r.url);
    return true;
  });
}

export async function searchIndustryInfo(industryName: string): Promise<SearchResult[]> {
  const queries = [
    `"${industryName}" industry overview market size 2025 2024`,
    `"${industryName}" market report key players growth rate`,
    `"${industryName}" industry trends forecast`,
  ];

  const allResults: SearchResult[] = [];
  
  for (const query of queries) {
    const results = await searchGoogle(query, { numResults: 5 });
    allResults.push(...results);
    await new Promise(resolve => setTimeout(resolve, 1000));
  }

  const seen = new Set<string>();
  return allResults.filter(r => {
    if (seen.has(r.url)) return false;
    seen.add(r.url);
    return true;
  });
}

export async function searchFinancialData(companyName: string): Promise<SearchResult[]> {
  const queries = [
    `"${companyName}" investor presentation pdf 2025 2024`,
    `"${companyName}" earnings call transcript quarterly results`,
    `"${companyName}" revenue EBITDA profit margin annual report`,
    `"${companyName}" SEC filing BSE NSE financial statements`,
  ];

  const allResults: SearchResult[] = [];
  
  for (const query of queries) {
    const results = await searchGoogle(query, { numResults: 5 });
    allResults.push(...results);
    await new Promise(resolve => setTimeout(resolve, 1000));
  }

  const seen = new Set<string>();
  return allResults.filter(r => {
    if (seen.has(r.url)) return false;
    seen.add(r.url);
    return true;
  });
}

export async function searchCompetitors(companyName: string, industry: string): Promise<SearchResult[]> {
  const queries = [
    `"${companyName}" competitors market share ${industry}`,
    `top companies "${industry}" industry market leaders`,
    `"${companyName}" vs competitors comparison`,
    `${industry} industry association members companies list`,
    `${industry} market report key players 2025 2024`,
  ];

  const allResults: SearchResult[] = [];
  
  for (const query of queries) {
    const results = await searchGoogle(query, { numResults: 5 });
    allResults.push(...results);
    await new Promise(resolve => setTimeout(resolve, 1000));
  }

  const seen = new Set<string>();
  return allResults.filter(r => {
    if (seen.has(r.url)) return false;
    seen.add(r.url);
    return true;
  });
}

export async function searchNews(companyName: string, days: number = 30): Promise<SearchResult[]> {
  const date = new Date();
  date.setDate(date.getDate() - days);
  const dateStr = date.toISOString().split('T')[0].replace(/-/g, '');

  const query = `${companyName} news after:${dateStr}`;
  return searchGoogle(query, { numResults: 10 });
}
