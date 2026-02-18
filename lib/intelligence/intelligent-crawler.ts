/**
 * Intelligent Crawler with 3 Modes
 * 
 * FIX 3: Crawler Stability Fix
 * - Mode 1: Simple fetch (cheap, fast)
 * - Mode 2: Headless browser (JS rendering, anti-bot)
 * - Mode 3: Search API fallback (never return empty)
 */

import axios from 'axios';
import * as cheerio from 'cheerio';

export interface CrawlResult {
  url: string;
  content: string;
  title: string;
  mode: 'simple' | 'headless' | 'fallback';
  success: boolean;
  error?: string;
  fetchedAt: Date;
}

export interface CrawlerOptions {
  mode: 'simple' | 'headless' | 'fallback' | 'auto';
  timeout: number;
  retries: number;
  userAgent: string;
  useProxy: boolean;
}

const DEFAULT_OPTIONS: CrawlerOptions = {
  mode: 'auto',
  timeout: 15000,
  retries: 3,
  userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
  useProxy: false,
};

// FIX 4: URL Scoring for Crawler Prioritization
export function scoreURL(url: string): number {
  const lowerUrl = url.toLowerCase();
  
  // Highest priority - official financial documents
  if (lowerUrl.includes('annual-report')) return 10;
  if (lowerUrl.includes('investor-presentation')) return 9;
  if (lowerUrl.includes('quarterly-results')) return 9;
  if (lowerUrl.includes('financial-results')) return 8;
  
  // High priority - PDF documents
  if (lowerUrl.endsWith('.pdf')) return 8;
  if (lowerUrl.includes('filetype:pdf')) return 8;
  
  // Medium priority - exchange filings
  if (lowerUrl.includes('nseindia.com') || lowerUrl.includes('bseindia.com')) return 7;
  if (lowerUrl.includes('filing')) return 7;
  if (lowerUrl.includes('disclosure')) return 7;
  
  // Lower priority - news and general
  if (lowerUrl.includes('news')) return 4;
  if (lowerUrl.includes('article')) return 3;
  if (lowerUrl.includes('blog')) return 2;
  
  // Default
  return 1;
}

export function sortByScore(urls: string[]): string[] {
  return [...urls].sort((a, b) => scoreURL(b) - scoreURL(a));
}

export class IntelligentCrawler {
  private options: CrawlerOptions;
  
  constructor(options: Partial<CrawlerOptions> = {}) {
    this.options = { ...DEFAULT_OPTIONS, ...options };
  }
  
  async crawl(url: string): Promise<CrawlResult> {
    const startTime = Date.now();
    
    // Auto mode: Try simple first, then fallback
    let mode = this.options.mode;
    if (mode === 'auto') {
      mode = 'simple';
    }
    
    try {
      // Try primary mode
      let result = await this.crawlWithMode(url, mode);
      
      // If failed and auto mode, try fallback
      if (!result.success && mode === 'simple') {
        console.log(`[Crawler] Simple mode failed, trying fallback...`);
        result = await this.crawlWithMode(url, 'fallback');
      }
      
      return result;
    } catch (error: any) {
      return {
        url,
        content: '',
        title: '',
        mode: mode as any,
        success: false,
        error: error.message,
        fetchedAt: new Date(),
      };
    }
  }
  
  private async crawlWithMode(url: string, mode: 'simple' | 'headless' | 'fallback'): Promise<CrawlResult> {
    if (mode === 'simple') {
      return this.crawlSimple(url);
    } else if (mode === 'headless') {
      return this.crawlHeadless(url);
    } else {
      return this.crawlFallback(url);
    }
  }
  
  private async crawlSimple(url: string): Promise<CrawlResult> {
    try {
      const response = await axios.get(url, {
        timeout: this.options.timeout,
        headers: {
          'User-Agent': this.options.userAgent,
          'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
          'Accept-Language': 'en-US,en;q=0.5',
        },
        maxRedirects: 5,
      });
      
      const $ = cheerio.load(response.data);
      const title = $('title').text() || '';
      const content = $('body').text().replace(/\s+/g, ' ').trim().substring(0, 50000);
      
      return {
        url,
        content,
        title: title.trim(),
        mode: 'simple',
        success: true,
        fetchedAt: new Date(),
      };
    } catch (error: any) {
      return {
        url,
        content: '',
        title: '',
        mode: 'simple',
        success: false,
        error: error.message,
        fetchedAt: new Date(),
      };
    }
  }
  
  private async crawlHeadless(url: string): Promise<CrawlResult> {
    // Placeholder for Playwright/Puppeteer integration
    // For now, falls back to simple mode
    console.log(`[Crawler] Headless mode requested for ${url} - using simple as fallback`);
    return this.crawlSimple(url);
  }
  
  private async crawlFallback(url: string): Promise<CrawlResult> {
    // Search API fallback - use Google search to get snippets
    // This ensures we never return empty data
    try {
      const searchQuery = encodeURIComponent(url.replace(/^https?:\/\//, '').split('/')[0]);
      const searchUrl = `https://html.duckduckgo.com/html/?q=${searchQuery}`;
      
      const response = await axios.get(searchUrl, {
        timeout: this.options.timeout,
        headers: {
          'User-Agent': this.options.userAgent,
        },
      });
      
      const $ = cheerio.load(response.data);
      const snippets: string[] = [];
      
      $('.result__snippet').each((_, el) => {
        const text = $(el).text().trim();
        if (text) snippets.push(text);
      });
      
      const content = snippets.join(' ').substring(0, 10000);
      
      return {
        url,
        content: content || `Search results for: ${url}`,
        title: `Search fallback for ${url}`,
        mode: 'fallback',
        success: snippets.length > 0,
        error: snippets.length === 0 ? 'No search results found' : undefined,
        fetchedAt: new Date(),
      };
    } catch (error: any) {
      return {
        url,
        content: `Could not fetch ${url}: ${error.message}`,
        title: '',
        mode: 'fallback',
        success: false,
        error: error.message,
        fetchedAt: new Date(),
      };
    }
  }
  
  async crawlMultiple(urls: string[]): Promise<CrawlResult[]> {
    const results: CrawlResult[] = [];
    
    for (const url of urls) {
      const result = await this.crawl(url);
      results.push(result);
      
      // Rate limiting
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
    
    return results;
  }
}

let crawlerInstance: IntelligentCrawler | null = null;

export function getCrawler(options?: Partial<CrawlerOptions>): IntelligentCrawler {
  if (!crawlerInstance) {
    crawlerInstance = new IntelligentCrawler(options);
  }
  return crawlerInstance;
}
