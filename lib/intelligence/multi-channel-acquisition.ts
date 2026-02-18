/**
 * Multi-Channel Data Acquisition Layer
 * 
 * FIX 1: Improve Data Acquisition Layer
 * - Channel A: Structured Financial APIs (FMP, TwelveData, Polygon)
 * - Channel B: Document Mining Pipeline (PDF prioritization)
 * - Channel C: News Intelligence (Reuters, Bloomberg, ET, Moneycontrol)
 * 
 * This addresses the "garbage in = garbage out" problem
 */

import axios, { AxiosInstance } from 'axios';

export interface DataSourceConfig {
  name: string;
  type: 'api' | 'pdf' | 'news';
  baseUrl?: string;
  apiKey?: string;
  priority: number;
  rateLimit: number; // requests per minute
  enabled: boolean;
}

export interface AcquiredData {
  source: string;
  type: 'financial' | 'news' | 'document';
  data: any;
  fetchedAt: Date;
  confidence: number;
}

const DATA_SOURCES: DataSourceConfig[] = [
  // Financial APIs (Priority 1 - Structured)
  { name: 'fmp', type: 'api', baseUrl: 'https://financialmodelingprep.com/api/v3', priority: 1, rateLimit: 250, enabled: true },
  { name: 'twelvedata', type: 'api', baseUrl: 'https://api.twelvedata.com', priority: 2, rateLimit: 800, enabled: true },
  { name: 'polygon', type: 'api', baseUrl: 'https://api.polygon.io/v2', priority: 3, rateLimit: 5, enabled: false }, // Paid only
  
  // News Sources (Priority 2 - Financial News)
  { name: 'reuters', type: 'news', baseUrl: 'https://www.reuters.com', priority: 4, rateLimit: 100, enabled: true },
  { name: 'moneycontrol', type: 'news', baseUrl: 'https://www.moneycontrol.com', priority: 5, rateLimit: 60, enabled: true },
  { name: 'economic_times', type: 'news', baseUrl: 'https://economictimes.indiatimes.com', priority: 6, rateLimit: 60, enabled: true },
  
  // PDF/Document Sources (Priority 3 - Annual Reports)
  { name: 'nse_filings', type: 'pdf', baseUrl: 'https://www.nseindia.com/companies-listing/corporate-filings', priority: 7, rateLimit: 30, enabled: true },
  { name: 'bse_filings', type: 'pdf', baseUrl: 'https://www.bseindia.com/corporates', priority: 8, rateLimit: 30, enabled: true },
];

export class MultiChannelAcquisition {
  private sources: Map<string, DataSourceConfig> = new Map();
  private apiClients: Map<string, AxiosInstance> = new Map();
  
  constructor() {
    for (const source of DATA_SOURCES) {
      this.sources.set(source.name, source);
      if (source.baseUrl && source.type === 'api') {
        const client = axios.create({
          baseURL: source.baseUrl,
          timeout: 10000,
        });
        this.apiClients.set(source.name, client);
      }
    }
  }
  
  isEnabled(name: string): boolean {
    const source = this.sources.get(name);
    return source?.enabled ?? false;
  }
  
  enableSource(name: string): void {
    const source = this.sources.get(name);
    if (source) {
      source.enabled = true;
      console.log(`[Acquisition] Enabled source: ${name}`);
    }
  }
  
  disableSource(name: string): void {
    const source = this.sources.get(name);
    if (source) {
      source.enabled = false;
      console.log(`[Acquisition] Disabled source: ${name}`);
    }
  }
  
  getEnabledSources(): DataSourceConfig[] {
    return Array.from(this.sources.values())
      .filter(s => s.enabled)
      .sort((a, b) => a.priority - b.priority);
  }
  
  async fetchFromAPI(sourceName: string, endpoint: string, params: any = {}): Promise<AcquiredData | null> {
    const source = this.sources.get(sourceName);
    if (!source || !source.enabled || source.type !== 'api') {
      return null;
    }
    
    const client = this.apiClients.get(sourceName);
    if (!client) {
      return null;
    }
    
    try {
      const apiKey = this.getAPIKey(sourceName);
      if (!apiKey) {
        console.warn(`[Acquisition] No API key for ${sourceName}`);
        return null;
      }
      
      const response = await client.get(endpoint, {
        params: { ...params, apikey: apiKey },
      });
      
      return {
        source: sourceName,
        type: 'financial',
        data: response.data,
        fetchedAt: new Date(),
        confidence: this.calculateSourceConfidence(sourceName, 'api'),
      };
    } catch (error: any) {
      console.error(`[Acquisition] ${sourceName} failed:`, error.message);
      return null;
    }
  }
  
  private getAPIKey(sourceName: string): string | undefined {
    const keyMap: Record<string, string | undefined> = {
      fmp: process.env.FMP_API_KEY || process.env.FINANCIAL_MODELING_PREP_KEY,
      twelvedata: process.env.TWELVE_DATA_KEY,
      polygon: process.env.POLYGON_API_KEY,
    };
    return keyMap[sourceName];
  }
  
  private calculateSourceConfidence(sourceName: string, type: string): number {
    const confidenceMap: Record<string, number> = {
      fmp: 85,
      twelvedata: 80,
      polygon: 90,
      reuters: 75,
      moneycontrol: 70,
      economic_times: 70,
      nse_filings: 95,
      bse_filings: 95,
    };
    return confidenceMap[sourceName] ?? 50;
  }
  
  async acquireFinancialData(ticker: string): Promise<AcquiredData[]> {
    const results: AcquiredData[] = [];
    
    // Try FMP first (highest priority)
    if (this.isEnabled('fmp')) {
      const fmpData = await this.fetchFromAPI('fmp', `/profile/${ticker}`);
      if (fmpData) results.push(fmpData);
      
      const fmpQuote = await this.fetchFromAPI('fmp', `/quote/${ticker}`);
      if (fmpQuote) results.push(fmpQuote);
    }
    
    // Try TwelveData
    if (this.isEnabled('twelvedata')) {
      const tdData = await this.fetchFromAPI('twelvedata', '/time_series', {
        symbol: ticker,
        interval: '1day',
        outputsize: 30,
      });
      if (tdData) results.push(tdData);
    }
    
    return results;
  }
  
  async acquireNews(companyName: string, limit: number = 10): Promise<AcquiredData[]> {
    const results: AcquiredData[] = [];
    
    // News sources use scraping (not API) - handled by crawler
    // This is a placeholder for structured news API if available
    
    return results;
  }
  
  getSourceStatus(): { name: string; enabled: boolean; priority: number; type: string }[] {
    return Array.from(this.sources.values()).map(s => ({
      name: s.name,
      enabled: s.enabled,
      priority: s.priority,
      type: s.type,
    }));
  }
}

let acquisitionInstance: MultiChannelAcquisition | null = null;

export function getAcquisition(): MultiChannelAcquisition {
  if (!acquisitionInstance) {
    acquisitionInstance = new MultiChannelAcquisition();
  }
  return acquisitionInstance;
}
