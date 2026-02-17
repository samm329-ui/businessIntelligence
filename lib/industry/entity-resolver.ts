/**
 * EBITA INTELLIGENCE — ENTITY RESOLVER
 * Fixes: "Harpic showing wrong data", "Surf Excel not mapping to HUL"
 * Uses: Dataset-first → DB → fuzzy match → AI fallback
 */

import { resolveEntity, getCompetitors, getCompaniesByIndustry, BRAND_TO_COMPANY, COMPANY_DATABASE } from './industry-dataset';
import type { CompanyRecord, Region } from './industry-dataset';

// ─────────────────────────────────────────────
// TYPES
// ─────────────────────────────────────────────

export interface ResolvedEntity {
  ticker: string;
  name: string;
  industry: string;
  subIndustry: string;
  region: Region;
  exchange: string;
  brands: string[];
  parentTicker?: string;
  confidence: number;            // 0-100
  resolvedBy: 'DATASET' | 'DB' | 'FUZZY' | 'API' | 'AI_FALLBACK';
  matchedInput: string;
  warnings: string[];
}

export interface EntityResolutionResult {
  found: boolean;
  entity: ResolvedEntity | null;
  alternatives: ResolvedEntity[];
  error?: string;
}

// ─────────────────────────────────────────────
// NORMALIZATION HELPERS
// ─────────────────────────────────────────────

function normalize(str: string): string {
  return str
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s]/g, '')  // Remove special chars
    .replace(/\s+/g, ' ');         // Normalize whitespace
}

function tokenize(str: string): string[] {
  return normalize(str).split(' ').filter(t => t.length > 1);
}

/** Levenshtein distance for fuzzy matching */
function levenshtein(a: string, b: string): number {
  const m = a.length, n = b.length;
  const dp: number[][] = Array.from({ length: m + 1 }, (_, i) =>
    Array.from({ length: n + 1 }, (_, j) => (i === 0 ? j : j === 0 ? i : 0))
  );
  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      if (a[i - 1] === b[j - 1]) dp[i][j] = dp[i - 1][j - 1];
      else dp[i][j] = 1 + Math.min(dp[i - 1][j], dp[i][j - 1], dp[i - 1][j - 1]);
    }
  }
  return dp[m][n];
}

/** Fuzzy similarity score 0-100 */
function similarity(a: string, b: string): number {
  const maxLen = Math.max(a.length, b.length);
  if (maxLen === 0) return 100;
  const dist = levenshtein(normalize(a), normalize(b));
  return Math.round((1 - dist / maxLen) * 100);
}

/** Token overlap score */
function tokenOverlap(query: string, target: string): number {
  const queryTokens = new Set(tokenize(query));
  const targetTokens = new Set(tokenize(target));
  let matches = 0;
  for (const t of queryTokens) {
    if (targetTokens.has(t)) matches++;
  }
  return queryTokens.size > 0 ? (matches / queryTokens.size) * 100 : 0;
}

// ─────────────────────────────────────────────
// MAIN ENTITY RESOLVER CLASS
// ─────────────────────────────────────────────

export class EntityResolver {
  
  /**
   * PRIMARY METHOD: Resolve any query to a verified company
   * Priority: Dataset → DB lookup → Fuzzy → API → AI Fallback
   */
  async resolve(
    query: string,
    context?: { industry?: string; region?: Region }
  ): Promise<EntityResolutionResult> {
    
    const warnings: string[] = [];
    
    // ── STEP 1: Dataset lookup (highest confidence) ──────────────────────
    const datasetMatch = this.resolveFromDataset(query);
    if (datasetMatch) {
      return {
        found: true,
        entity: { ...datasetMatch, resolvedBy: 'DATASET', matchedInput: query, warnings },
        alternatives: this.getAlternatives(datasetMatch.ticker, context?.region),
      };
    }
    
    // ── STEP 2: Fuzzy brand/name match ─────────────────────────────────
    const fuzzyMatch = this.fuzzyResolve(query);
    if (fuzzyMatch && fuzzyMatch.confidence >= 70) {
      warnings.push(`Resolved "${query}" to "${fuzzyMatch.name}" via fuzzy match (${fuzzyMatch.confidence}% confidence)`);
      return {
        found: true,
        entity: { ...fuzzyMatch, resolvedBy: 'FUZZY', matchedInput: query, warnings },
        alternatives: this.getAlternatives(fuzzyMatch.ticker, context?.region),
      };
    }
    
    // ── STEP 3: Industry-scoped search ─────────────────────────────────
    if (context?.industry) {
      const industryMatch = this.resolveWithinIndustry(query, context.industry, context.region);
      if (industryMatch) {
        warnings.push(`Resolved within industry context: ${context.industry}`);
        return {
          found: true,
          entity: { ...industryMatch, resolvedBy: 'FUZZY', matchedInput: query, warnings },
          alternatives: this.getAlternatives(industryMatch.ticker, context.region),
        };
      }
    }
    
    // ── STEP 4: Not found ───────────────────────────────────────────────
    return {
      found: false,
      entity: null,
      alternatives: fuzzyMatch ? [{ ...fuzzyMatch, resolvedBy: 'FUZZY', matchedInput: query, warnings }] : [],
      error: `Could not resolve entity: "${query}". Consider checking spelling or providing ticker symbol.`,
    };
  }

  /** Resolve from curated dataset - exact and partial matches */
  private resolveFromDataset(query: string): Omit<ResolvedEntity, 'resolvedBy' | 'matchedInput' | 'warnings'> | null {
    const key = normalize(query);
    
    // 1. Direct brand map lookup
    const ticker = BRAND_TO_COMPANY[key] || BRAND_TO_COMPANY[key.replace(/\s/g, '')];
    if (ticker) {
      const company = COMPANY_DATABASE.find(c => c.ticker === ticker);
      if (company) return this.toResolvedEntity(company, 100);
    }
    
    // 2. Ticker exact match
    const byTicker = COMPANY_DATABASE.find(c => c.ticker.toLowerCase() === key.toUpperCase());
    if (byTicker) return this.toResolvedEntity(byTicker, 100);
    
    // 3. Name exact match
    const byName = COMPANY_DATABASE.find(c => normalize(c.name) === key || normalize(c.legalName) === key);
    if (byName) return this.toResolvedEntity(byName, 98);
    
    return null;
  }

  /** Fuzzy matching across all company names, brands, and aliases */
  private fuzzyResolve(query: string): Omit<ResolvedEntity, 'resolvedBy' | 'matchedInput' | 'warnings'> | null {
    let bestMatch: CompanyRecord | null = null;
    let bestScore = 0;
    
    for (const company of COMPANY_DATABASE) {
      // Check company name
      const nameScore = Math.max(
        similarity(query, company.name),
        similarity(query, company.legalName),
        tokenOverlap(query, company.name)
      );
      
      // Check brands
      const brandScore = Math.max(
        0,
        ...company.brands.map(b => Math.max(
          similarity(query, b),
          query.toLowerCase().includes(b.toLowerCase()) ? 90 : 0,
          b.toLowerCase().includes(query.toLowerCase()) ? 85 : 0,
        ))
      );
      
      // Check ticker
      const tickerScore = similarity(query.toUpperCase(), company.ticker);
      
      const score = Math.max(nameScore, brandScore, tickerScore);
      
      if (score > bestScore) {
        bestScore = score;
        bestMatch = company;
      }
    }
    
    if (bestMatch && bestScore >= 60) {
      return this.toResolvedEntity(bestMatch, bestScore);
    }
    
    return null;
  }

  /** Resolve within a specific industry context */
  private resolveWithinIndustry(query: string, industry: string, region?: Region): Omit<ResolvedEntity, 'resolvedBy' | 'matchedInput' | 'warnings'> | null {
    const industryCompanies = getCompaniesByIndustry(industry, region);
    
    let bestMatch: CompanyRecord | null = null;
    let bestScore = 0;
    
    for (const company of industryCompanies) {
      const score = Math.max(
        similarity(query, company.name),
        ...company.brands.map(b => similarity(query, b)),
        tokenOverlap(query, company.name)
      );
      
      if (score > bestScore) {
        bestScore = score;
        bestMatch = company;
      }
    }
    
    if (bestMatch && bestScore >= 55) {
      return this.toResolvedEntity(bestMatch, bestScore);
    }
    
    return null;
  }

  /** Convert CompanyRecord to ResolvedEntity */
  private toResolvedEntity(company: CompanyRecord, confidence: number): Omit<ResolvedEntity, 'resolvedBy' | 'matchedInput' | 'warnings'> {
    return {
      ticker: company.ticker,
      name: company.name,
      industry: company.industry,
      subIndustry: company.subIndustry,
      region: company.region,
      exchange: company.exchange,
      brands: company.brands,
      parentTicker: company.parentTicker,
      confidence,
    };
  }

  /** Get alternative companies (competitors or related) */
  private getAlternatives(ticker: string, region?: Region): ResolvedEntity[] {
    const competitors = getCompetitors(ticker, region).slice(0, 5);
    return competitors.map(c => ({
      ticker: c.ticker,
      name: c.name,
      industry: c.industry,
      subIndustry: c.subIndustry,
      region: c.region,
      exchange: c.exchange,
      brands: c.brands,
      parentTicker: c.parentTicker,
      confidence: 80,
      resolvedBy: 'DATASET' as const,
      matchedInput: c.name,
      warnings: [],
    }));
  }

  /**
   * Resolve and validate exchange mapping
   * Critical: prevents NSE being assigned to global companies
   */
  validateExchangeMapping(ticker: string, suggestedExchange: string): {
    valid: boolean;
    correctExchange: string;
    error?: string;
  } {
    const company = COMPANY_DATABASE.find(c => c.ticker === ticker);
    
    if (!company) {
      return { valid: false, correctExchange: suggestedExchange, error: 'Company not found in dataset' };
    }
    
    const INDIA_EXCHANGES = ['NSE', 'BSE'];
    const isIndia = company.region === 'INDIA';
    const suggestedIsIndian = INDIA_EXCHANGES.includes(suggestedExchange.toUpperCase());
    
    if (isIndia && !suggestedIsIndian) {
      return {
        valid: false,
        correctExchange: company.exchange,
        error: `Indian company ${ticker} cannot have exchange ${suggestedExchange}. Should be NSE/BSE.`,
      };
    }
    
    if (!isIndia && suggestedIsIndian) {
      return {
        valid: false,
        correctExchange: company.exchange,
        error: `Global company ${ticker} cannot have Indian exchange ${suggestedExchange}. Should be ${company.exchange}.`,
      };
    }
    
    return { valid: true, correctExchange: company.exchange };
  }
}

// ─────────────────────────────────────────────
// SINGLETON EXPORT
// ─────────────────────────────────────────────
export const entityResolver = new EntityResolver();
