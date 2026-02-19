/**
 * EBITA Intelligence - Entity Resolver v2
 * 
 * Resolves any user query to a verified company or industry entity.
 * Priority: 
 *   1. Indian Excel Database (PRIMARY - c:\Users\jishu\Downloads\Indian_Industry_Companies_Database.xlsx)
 *   2. Indian JSON Dataset
 *   3. Global CSV Database
 *   4. Fuzzy matching
 *   5. Industry keyword match
 * 
 * Supports:
 * - Indian companies from Excel (PRIMARY SOURCE)
 * - 9000+ Indian companies (from JSON dataset)
 * - 995 global companies (from CSV dataset)
 * - Brand → parent company mapping
 * - Fuzzy matching for misspellings
 */

import { loadIndianCompaniesFromExcel, searchIndianCompanies, getCompanyByExactName, getCompaniesByIndustry, getIndustryInfo, getAllIndustries, getSubCategoriesByIndustry, type ExcelCompanyRecord } from '../datasets/load-excel-companies';
import { searchCompanies, getCompanyByName, loadCompanyDatabase, type CompanyRecord as CSVCompanyRecord } from '../datasets/company-database';

// ─── Types ────────────────────────────────────────────────────────────────────

export interface ResolvedEntity {
  entityId: string;
  canonicalName: string;
  ticker?: string;
  tickerNSE?: string;
  tickerBSE?: string;
  tickerGlobal?: string;
  sector: string;
  industry: string;
  subIndustry: string;
  niche?: string;
  country: string;
  region: 'INDIA' | 'GLOBAL';
  isListed: boolean;
  exchange?: string;
  confidence: number; // 0-100
  matchMethod: string;
  alternatives?: AlternativeMatch[];
}

export interface AlternativeMatch {
  entityId: string;
  name: string;
  confidence: number;
  matchMethod: string;
}

export interface CompanyRecord {
  id: string;
  canonicalName: string;
  normalizedName: string;
  ticker?: string;
  tickerNSE?: string;
  tickerBSE?: string;
  tickerGlobal?: string;
  sector: string;
  industry: string;
  subIndustry: string;
  niche?: string;
  country: string;
  region: 'INDIA' | 'GLOBAL';
  isListed: boolean;
  exchange?: string;
  aliases: string[];
  brands: string[];
  parentCompany?: string;
  source: string; // 'indian_9000' | 'global_995' | 'supabase'
}

// ─── Normalization ────────────────────────────────────────────────────────────

function normalize(text: string): string {
  return text
    .toLowerCase()
    .replace(/\s+(ltd|limited|pvt|private|inc|corp|corporation|co|company|llp|llc|plc|group|holdings?|enterprises?|industries?|technologies?|solutions?|services?|systems?|global|india|bharat)\b\.?/g, '')
    .replace(/[^a-z0-9\s]/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}

// Levenshtein distance for fuzzy matching
function levenshtein(a: string, b: string): number {
  const m = a.length, n = b.length;
  const dp: number[][] = Array.from({ length: m + 1 }, (_, i) =>
    Array.from({ length: n + 1 }, (_, j) => (i === 0 ? j : j === 0 ? i : 0))
  );
  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      dp[i][j] = a[i - 1] === b[j - 1]
        ? dp[i - 1][j - 1]
        : 1 + Math.min(dp[i - 1][j], dp[i][j - 1], dp[i - 1][j - 1]);
    }
  }
  return dp[m][n];
}

function similarityScore(a: string, b: string): number {
  if (a === b) return 100;
  if (a.includes(b) || b.includes(a)) return 90;
  const dist = levenshtein(a, b);
  const maxLen = Math.max(a.length, b.length);
  return Math.round((1 - dist / maxLen) * 100);
}

// ─── Company Database (In-Memory) ─────────────────────────────────────────────

class CompanyDatabase {
  private companies: CompanyRecord[] = [];
  private byNormalizedName = new Map<string, CompanyRecord>();
  private byTicker = new Map<string, CompanyRecord>();
  private byAlias = new Map<string, CompanyRecord>();
  private byBrand = new Map<string, CompanyRecord>();
  private isLoaded = false;

  async load(
    indianCompanies: CompanyRecord[],
    globalCompanies: CompanyRecord[]
  ): Promise<void> {
    if (this.isLoaded) return;

    const allCompanies = [...indianCompanies, ...globalCompanies];
    this.companies = allCompanies;

    for (const company of allCompanies) {
      this.byNormalizedName.set(company.normalizedName, company);

      if (company.ticker) this.byTicker.set(company.ticker.toUpperCase(), company);
      if (company.tickerNSE) this.byTicker.set(company.tickerNSE.toUpperCase(), company);
      if (company.tickerBSE) this.byTicker.set(company.tickerBSE.toUpperCase(), company);
      if (company.tickerGlobal) this.byTicker.set(company.tickerGlobal.toUpperCase(), company);

      for (const alias of company.aliases) {
        this.byAlias.set(normalize(alias), company);
      }

      for (const brand of company.brands) {
        this.byBrand.set(normalize(brand), company);
      }
    }

    this.isLoaded = true;
    console.log(`[EntityDB] Loaded ${allCompanies.length} companies (${indianCompanies.length} Indian, ${globalCompanies.length} global)`);
  }

  findByNormalizedName(name: string): CompanyRecord | null {
    return this.byNormalizedName.get(normalize(name)) || null;
  }

  findByTicker(ticker: string): CompanyRecord | null {
    return this.byTicker.get(ticker.toUpperCase()) || null;
  }

  findByAlias(query: string): CompanyRecord | null {
    return this.byAlias.get(normalize(query)) || null;
  }

  findByBrand(brand: string): CompanyRecord | null {
    return this.byBrand.get(normalize(brand)) || null;
  }

  fuzzySearch(query: string, topN = 5): { company: CompanyRecord; score: number }[] {
    const normalizedQuery = normalize(query);
    const results: { company: CompanyRecord; score: number }[] = [];

    for (const company of this.companies) {
      const score = similarityScore(normalizedQuery, company.normalizedName);
      if (score >= 60) {
        results.push({ company, score });
      }
    }

    return results.sort((a, b) => b.score - a.score).slice(0, topN);
  }

  getAll(): CompanyRecord[] {
    return this.companies;
  }
}

// Singleton database instance
export const companyDB = new CompanyDatabase();

// Initialize entity database
export async function initializeEntityDatabase(
  supabaseClient: any,
  options?: {
    txtFilePath?: string;
    uploadToSupabase?: boolean;
  }
): Promise<void> {
  // Load from entity_intelligence table if exists
  if (supabaseClient) {
    try {
      const { data: entities } = await supabaseClient
        .from('entity_intelligence')
        .select('*')
        .limit(10000);
      
      if (entities && entities.length > 0) {
        const records: CompanyRecord[] = entities.map((e: any) => ({
          id: e.id,
          canonicalName: e.canonical_name,
          normalizedName: e.normalized_name,
          ticker: e.ticker_nse,
          tickerNSE: e.ticker_nse,
          tickerBSE: e.ticker_bse,
          tickerGlobal: e.ticker_global,
          sector: e.sector || '',
          industry: e.industry || '',
          subIndustry: e.sub_industry || '',
          niche: e.niche,
          country: e.country || 'India',
          region: e.region || 'INDIA',
          isListed: e.is_listed ?? true,
          exchange: e.exchange,
          aliases: e.all_aliases || [],
          brands: e.brands || [],
          source: e.source || 'supabase'
        }));
        
        await companyDB.load(records, []);
        console.log(`[EntityDB] Loaded ${records.length} companies from Supabase`);
        return;
      }
    } catch (err) {
      console.warn('[EntityDB] Could not load from Supabase, using default data');
    }
  }
  
  // Default empty load
  await companyDB.load([], []);
}

// ─── TXT Dataset Loader ────────────────────────────────────────────────────────
// Flexible parser that handles common TXT formats for Indian company data

export function parseIndianCompaniesTxt(rawText: string): CompanyRecord[] {
  const companies: CompanyRecord[] = [];
  const lines = rawText.split('\n').map(l => l.trim()).filter(l => l.length > 0);

  if (lines.length === 0) return companies;

  // Detect format by examining first few lines
  const firstLine = lines[0];
  const isTabSeparated = firstLine.includes('\t');
  const isCommaSeparated = firstLine.includes(',');
  const isPipeSeparated = firstLine.includes('|');

  const separator = isTabSeparated ? '\t' : isPipeSeparated ? '|' : isCommaSeparated ? ',' : null;

  if (separator) {
    // Structured format - parse headers
    const headers = lines[0].split(separator).map(h => h.trim().toLowerCase().replace(/\s+/g, '_'));
    
    for (let i = 1; i < lines.length; i++) {
      const parts = lines[i].split(separator).map(p => p.trim());
      if (parts.length < 2) continue;

      const row: Record<string, string> = {};
      headers.forEach((h, idx) => { row[h] = parts[idx] || ''; });

      // Map flexible column names to our schema
      const companyName =
        row['company_name'] || row['name'] || row['company'] ||
        row['company_name_nse'] || row['issuer_name'] || parts[0];

      if (!companyName || companyName.length < 2) continue;

      const ticker =
        row['symbol'] || row['ticker'] || row['nse_symbol'] ||
        row['scrip_code'] || row['symbol_nse'] || '';

      const sector =
        row['sector'] || row['industry_sector'] || row['broad_sector'] || 'Unknown';

      const industry =
        row['industry'] || row['industry_name'] || row['sub_sector'] || sector;

      const subIndustry =
        row['sub_industry'] || row['sub_sector'] || row['category'] || industry;

      const exchange =
        row['exchange'] || row['listing_at'] || (ticker.length > 0 ? 'NSE' : '');

      const id = `indian_${companyName.toLowerCase().replace(/[^a-z0-9]/g, '_')}_${i}`;

      companies.push({
        id,
        canonicalName: companyName,
        normalizedName: normalize(companyName),
        ticker: ticker || undefined,
        tickerNSE: exchange?.toUpperCase().includes('NSE') ? ticker : undefined,
        tickerBSE: exchange?.toUpperCase().includes('BSE') ? ticker : undefined,
        sector: mapSectorHierarchy(sector).sector,
        industry: mapSectorHierarchy(industry).industry,
        subIndustry: mapSectorHierarchy(subIndustry).subIndustry,
        country: 'India',
        region: 'INDIA',
        isListed: ticker.length > 0,
        exchange: exchange || undefined,
        aliases: buildAliases(companyName, ticker),
        brands: [],
        source: 'indian_9000',
      });
    }
  } else {
    // Unstructured format - one company name per line
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      // Skip obvious headers or empty lines
      if (line.length < 2 || /^(s\.?no|sr|serial|company|name|#)/i.test(line)) continue;

      const id = `indian_${normalize(line).replace(/\s/g, '_')}_${i}`;

      companies.push({
        id,
        canonicalName: line,
        normalizedName: normalize(line),
        sector: 'Unknown',
        industry: 'Unknown',
        subIndustry: 'Unknown',
        country: 'India',
        region: 'INDIA',
        isListed: false,
        aliases: buildAliases(line, ''),
        brands: [],
        source: 'indian_9000',
      });
    }
  }

  console.log(`[EntityDB] Parsed ${companies.length} Indian companies from TXT`);
  return companies;
}

// Build automatic aliases from company name
function buildAliases(name: string, ticker: string): string[] {
  const aliases: string[] = [];
  const n = normalize(name);
  if (n !== name.toLowerCase()) aliases.push(n);

  // Add common abbreviations
  const words = name.split(/\s+/);
  if (words.length >= 2) {
    // Initials: "Tata Consultancy Services" → "TCS"
    const initials = words.map(w => w[0]).join('').toUpperCase();
    if (initials.length >= 2 && initials.length <= 6) aliases.push(initials);
  }

  if (ticker) aliases.push(ticker.toUpperCase());
  return [...new Set(aliases)];
}

// ─── Industry Hierarchy Mapping ───────────────────────────────────────────────

const INDUSTRY_HIERARCHY: Record<string, { sector: string; industry: string; subIndustry: string }> = {
  // Financial Services
  'bank': { sector: 'Financial Services', industry: 'Banking', subIndustry: 'Commercial Banking' },
  'banking': { sector: 'Financial Services', industry: 'Banking', subIndustry: 'Commercial Banking' },
  'nbfc': { sector: 'Financial Services', industry: 'NBFC', subIndustry: 'Diversified NBFC' },
  'insurance': { sector: 'Financial Services', industry: 'Insurance', subIndustry: 'Life Insurance' },
  'fintech': { sector: 'Financial Services', industry: 'Fintech', subIndustry: 'Digital Payments' },
  'microfinance': { sector: 'Financial Services', industry: 'NBFC', subIndustry: 'Microfinance' },

  // Technology
  'it': { sector: 'Technology', industry: 'IT Services', subIndustry: 'Enterprise IT' },
  'software': { sector: 'Technology', industry: 'IT Services', subIndustry: 'Software Products' },
  'saas': { sector: 'Technology', industry: 'IT Services', subIndustry: 'SaaS' },
  'bpo': { sector: 'Technology', industry: 'IT Services', subIndustry: 'BPO/KPO' },
  'telecom': { sector: 'Technology', industry: 'Telecommunications', subIndustry: 'Mobile Telecom' },

  // Consumer
  'fmcg': { sector: 'Consumer Goods', industry: 'FMCG', subIndustry: 'Diversified FMCG' },
  'food': { sector: 'Consumer Goods', industry: 'FMCG', subIndustry: 'Food & Beverages' },
  'retail': { sector: 'Consumer', industry: 'Retail', subIndustry: 'Diversified Retail' },
  'ecommerce': { sector: 'Consumer', industry: 'Retail', subIndustry: 'E-commerce' },
  'qsr': { sector: 'Consumer', industry: 'Retail', subIndustry: 'Quick Service Restaurants' },
  'quick commerce': { sector: 'Consumer', industry: 'Retail', subIndustry: 'Quick Commerce' },
  'q-commerce': { sector: 'Consumer', industry: 'Retail', subIndustry: 'Quick Commerce' },
  'instant delivery': { sector: 'Consumer', industry: 'Retail', subIndustry: 'Quick Commerce' },

  // Manufacturing
  'auto': { sector: 'Manufacturing', industry: 'Automobile', subIndustry: 'Diversified Auto' },
  'automobile': { sector: 'Manufacturing', industry: 'Automobile', subIndustry: 'Diversified Auto' },
  'ev': { sector: 'Manufacturing', industry: 'Automobile', subIndustry: 'Electric Vehicles' },
  'pharma': { sector: 'Healthcare', industry: 'Pharmaceuticals', subIndustry: 'Generic Pharma' },
  'steel': { sector: 'Materials', industry: 'Steel & Metals', subIndustry: 'Integrated Steel' },
  'cement': { sector: 'Materials', industry: 'Cement', subIndustry: 'Large Cap Cement' },
  'textile': { sector: 'Manufacturing', industry: 'Textiles', subIndustry: 'Diversified Textiles' },
  'chemical': { sector: 'Materials', industry: 'Chemicals', subIndustry: 'Specialty Chemicals' },

  // Infrastructure & Real Estate
  'realty': { sector: 'Real Estate', industry: 'Real Estate', subIndustry: 'Residential' },
  'construction': { sector: 'Infrastructure', industry: 'Construction', subIndustry: 'Civil Construction' },
  'power': { sector: 'Energy', industry: 'Power', subIndustry: 'Diversified Power' },
  'renewable': { sector: 'Energy', industry: 'Power', subIndustry: 'Renewable Energy' },
  'oil': { sector: 'Energy', industry: 'Oil & Gas', subIndustry: 'E&P' },
  'gas': { sector: 'Energy', industry: 'Oil & Gas', subIndustry: 'Gas Distribution' },

  // Healthcare
  'hospital': { sector: 'Healthcare', industry: 'Healthcare Services', subIndustry: 'Hospitals' },
  'diagnostic': { sector: 'Healthcare', industry: 'Healthcare Services', subIndustry: 'Diagnostics' },

  // Default
  'unknown': { sector: 'Diversified', industry: 'Conglomerate', subIndustry: 'Diversified' },
};

function mapSectorHierarchy(rawSector: string): { sector: string; industry: string; subIndustry: string } {
  const key = rawSector.toLowerCase().trim();
  for (const [pattern, mapping] of Object.entries(INDUSTRY_HIERARCHY)) {
    if (key.includes(pattern)) return mapping;
  }
  return { sector: rawSector || 'Unknown', industry: rawSector || 'Unknown', subIndustry: rawSector || 'Unknown' };
}

// ─── Brand Knowledge Base ─────────────────────────────────────────────────────

const BRAND_MAPPINGS: Record<string, string> = {
  // Quick Commerce (NEW - Feb 2026)
  'zepto': 'Zepto',
  'blinkit': 'Zepto',
  'instamart': 'Zepto',
  'swiggy instamart': 'Swiggy Instamart',

  // Tata Group
  'tata sky': 'Tata Play Ltd',
  'tata play': 'Tata Play Ltd',
  'tanishq': 'Titan Company Ltd',
  'fasttrack': 'Titan Company Ltd',
  'titan': 'Titan Company Ltd',
  'nexon': 'Tata Motors Ltd',
  'safari': 'Tata Motors Ltd',
  'tiago': 'Tata Motors Ltd',
  'jaguar': 'Tata Motors Ltd',
  'land rover': 'Tata Motors Ltd',
  'tata salt': 'Tata Consumer Products Ltd',
  'tetley': 'Tata Consumer Products Ltd',
  'himalayan water': 'Tata Consumer Products Ltd',
  'starbucks india': 'Tata Consumer Products Ltd',

  // Reliance
  'jio': 'Reliance Industries Ltd',
  'reliancejio': 'Reliance Industries Ltd',
  'jiomart': 'Reliance Retail Ventures Ltd',
  'reliance fresh': 'Reliance Retail Ventures Ltd',
  'smart bazaar': 'Reliance Retail Ventures Ltd',
  'trends': 'Reliance Retail Ventures Ltd',
  'ajio': 'Reliance Retail Ventures Ltd',

  // Infosys / Tech
  'infosys bpm': 'Infosys Ltd',
  'wipro consumer': 'Wipro Ltd',
  'hcl software': 'HCL Technologies Ltd',
  'techm': 'Tech Mahindra Ltd',

  // Consumer brands
  'lifebuoy': 'Hindustan Unilever Ltd',
  'surf excel': 'Hindustan Unilever Ltd',
  'dove': 'Hindustan Unilever Ltd',
  'rin': 'Hindustan Unilever Ltd',
  'lux': 'Hindustan Unilever Ltd',
  'knorr': 'Hindustan Unilever Ltd',
  'magnum': 'Hindustan Unilever Ltd',
  'dettol': 'Reckitt Benckiser India',
  'harpic': 'Reckitt Benckiser India',
  'thums up': 'Coca-Cola India',
  'limca': 'Coca-Cola India',
  'maaza': 'Coca-Cola India',
  'sprite india': 'Coca-Cola India',
  'parle g': 'Parle Products',
  'monaco': 'Parle Products',
  'hide & seek': 'Parle Products',
  'cadbury': 'Mondelez India',
  'oreo india': 'Mondelez India',
  'amul': 'Gujarat Cooperative Milk Marketing Federation',
  'fortune oil': 'Adani Wilmar Ltd',
  'saffola': 'Marico Ltd',
  'parachute': 'Marico Ltd',
  'set wet': 'Marico Ltd',
  'colgate india': 'Colgate-Palmolive India Ltd',
  'palmolive india': 'Colgate-Palmolive India Ltd',

  // Pharma
  'crocin': 'GlaxoSmithKline Pharmaceuticals',
  'augmentin': 'GlaxoSmithKline Pharmaceuticals',
  'digene': 'Abbott India',

  // Banks
  'hdfc bank': 'HDFC Bank Ltd',
  'icici': 'ICICI Bank Ltd',
  'kotak 811': 'Kotak Mahindra Bank Ltd',
  'payzapp': 'HDFC Bank Ltd',

  // Global tech
  'iphone': 'Apple Inc',
  'macbook': 'Apple Inc',
  'ipad': 'Apple Inc',
  'android': 'Alphabet Inc',
  'google': 'Alphabet Inc',
  'youtube': 'Alphabet Inc',
  'gmail': 'Alphabet Inc',
  'windows': 'Microsoft Corporation',
  'office 365': 'Microsoft Corporation',
  'azure': 'Microsoft Corporation',
  'whatsapp': 'Meta Platforms Inc',
  'instagram': 'Meta Platforms Inc',
  'facebook': 'Meta Platforms Inc',
  'aws': 'Amazon.com Inc',
  'kindle': 'Amazon.com Inc',
  'alexa': 'Amazon.com Inc',
};

// ─── Main Resolver ────────────────────────────────────────────────────────────

export async function resolveEntity(
  query: string,
  supabaseClient?: any
): Promise<ResolvedEntity | null> {
  const trimmedQuery = query.trim();
  if (!trimmedQuery || trimmedQuery.length < 2) return null;

  const normalizedQuery = normalize(trimmedQuery);

  // ═══════════════════════════════════════════════════════════════════════════
  // STEP 0B: Quick Commerce Special Cases (Feb 2026)
  // ═══════════════════════════════════════════════════════════════════════════
  const quickCommerceCompanies: Record<string, ResolvedEntity> = {
    'zepto': {
      entityId: 'zepto_quick_commerce',
      canonicalName: 'Zepto',
      ticker: 'ZEPTO',
      tickerNSE: undefined,
      tickerBSE: undefined,
      tickerGlobal: undefined,
      sector: 'Consumer',
      industry: 'Retail',
      subIndustry: 'Quick Commerce',
      country: 'India',
      region: 'INDIA',
      isListed: false,
      exchange: undefined,
      confidence: 95,
      matchMethod: 'quick_commerce_database',
    },
    'blinkit': {
      entityId: 'blinkit_quick_commerce',
      canonicalName: 'Blinkit (Zepto)',
      ticker: 'BLINKIT',
      tickerNSE: undefined,
      tickerBSE: undefined,
      tickerGlobal: undefined,
      sector: 'Consumer',
      industry: 'Retail',
      subIndustry: 'Quick Commerce',
      country: 'India',
      region: 'INDIA',
      isListed: false,
      exchange: undefined,
      confidence: 95,
      matchMethod: 'quick_commerce_database',
    },
  };

  const qcKey = normalizedQuery.toLowerCase();
  if (quickCommerceCompanies[qcKey]) {
    console.log(`[EntityResolver] Quick Commerce match: ${qcKey}`);
    return quickCommerceCompanies[qcKey];
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // STEP 0: PRIMARY - Indian Excel Database (c:\Users\jishu\Downloads\...)
  // ═══════════════════════════════════════════════════════════════════════════
  
  // Try to load Excel database if not already loaded
  try {
    const excelRecords = await loadIndianCompaniesFromExcel();
    
    if (excelRecords && excelRecords.length > 0) {
      // Exact name match in Excel
      const excelExact = getCompanyByExactName(trimmedQuery);
      if (excelExact) {
        return {
          entityId: `excel_${normalize(excelExact.companyName)}`,
          canonicalName: excelExact.companyName,
          ticker: excelExact.companyName.toUpperCase().replace(/\s+/g, ''),
          tickerNSE: undefined,
          tickerBSE: undefined,
          tickerGlobal: undefined,
          sector: excelExact.sector || 'Unknown',
          industry: excelExact.industry || 'Unknown',
          subIndustry: excelExact.subCategory || 'General',
          country: excelExact.country || 'India',
          region: 'INDIA',
          isListed: excelExact.isListed,
          exchange: excelExact.isListed ? 'NSE' : undefined,
          confidence: 100,
          matchMethod: 'excel_exact',
        };
      }

      // Search in Excel (partial match)
      const excelResults = searchIndianCompanies(trimmedQuery);
      if (excelResults.length > 0) {
        const bestExcel = excelResults[0];
        return {
          entityId: `excel_${normalize(bestExcel.companyName)}`,
          canonicalName: bestExcel.companyName,
          ticker: bestExcel.companyName.toUpperCase().replace(/\s+/g, ''),
          tickerNSE: undefined,
          tickerBSE: undefined,
          tickerGlobal: undefined,
          sector: bestExcel.sector || 'Unknown',
          industry: bestExcel.industry || 'Unknown',
          subIndustry: bestExcel.subCategory || 'General',
          country: bestExcel.country || 'India',
          region: 'INDIA',
          isListed: bestExcel.isListed,
          exchange: bestExcel.isListed ? 'NSE' : undefined,
          confidence: excelResults[0].companyName.toLowerCase() === trimmedQuery.toLowerCase() ? 95 : 80,
          matchMethod: 'excel_search',
          alternatives: excelResults.slice(1, 6).map(c => ({
            entityId: `excel_${normalize(c.companyName)}`,
            name: c.companyName,
            confidence: 70,
            matchMethod: 'excel_search',
          })),
        };
      }

      // Check if query is an industry name
      const industries = getAllIndustries();
      const matchedIndustry = industries.find(ind => 
        ind.toLowerCase() === normalizedQuery || 
        ind.toLowerCase().includes(normalizedQuery) ||
        normalizedQuery.includes(ind.toLowerCase())
      );
      
      if (matchedIndustry) {
        const industryInfo = getIndustryInfo(matchedIndustry);
        const subCategories = getSubCategoriesByIndustry(matchedIndustry);
        
        return {
          entityId: `industry_${normalize(matchedIndustry)}`,
          canonicalName: matchedIndustry,
          sector: industryInfo?.industry || matchedIndustry,
          industry: matchedIndustry,
          subIndustry: subCategories[0] || 'General',
          country: 'India',
          region: 'INDIA',
          isListed: false,
          confidence: 90,
          matchMethod: 'excel_industry',
          alternatives: subCategories.slice(0, 10).map(sc => ({
            entityId: `subcat_${normalize(sc)}`,
            name: sc,
            confidence: 70,
            matchMethod: 'excel_subcategory',
          })),
        };
      }
    }
  } catch (excelError) {
    console.warn('[EntityResolver] Excel database error:', excelError);
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // STEP 1: Exact name match (from existing company DB)
  // ═══════════════════════════════════════════════════════════════════════════
  const exactMatch = companyDB.findByNormalizedName(normalizedQuery);
  if (exactMatch) {
    return toResolvedEntity(exactMatch, 100, 'exact_name');
  }

  // ── Step 2: Ticker match ──
  const tickerMatch = companyDB.findByTicker(trimmedQuery.toUpperCase());
  if (tickerMatch) {
    return toResolvedEntity(tickerMatch, 98, 'ticker');
  }

  // ── Step 3: Brand knowledge base ──
  const brandKey = trimmedQuery.toLowerCase();
  const brandCompanyName = BRAND_MAPPINGS[brandKey];
  if (brandCompanyName) {
    const brandMatch = companyDB.findByNormalizedName(brandCompanyName);
    if (brandMatch) return toResolvedEntity(brandMatch, 95, 'brand_mapping');
    // Brand known but company not in DB - create a placeholder
    return createPlaceholderEntity(brandCompanyName, 'Unknown', 'Unknown', 90, 'brand_mapping');
  }

  // ── Step 4: Alias match ──
  const aliasMatch = companyDB.findByAlias(normalizedQuery);
  if (aliasMatch) {
    return toResolvedEntity(aliasMatch, 90, 'alias');
  }

  // ── Step 5: Brand DB match ──
  const brandDbMatch = companyDB.findByBrand(normalizedQuery);
  if (brandDbMatch) {
    return toResolvedEntity(brandDbMatch, 88, 'brand_db');
  }

  // ── Step 6: Fuzzy matching ──
  const fuzzyResults = companyDB.fuzzySearch(trimmedQuery, 5);
  if (fuzzyResults.length > 0 && fuzzyResults[0].score >= 75) {
    const best = fuzzyResults[0];
    const alternatives = fuzzyResults.slice(1).map(r => ({
      entityId: r.company.id,
      name: r.company.canonicalName,
      confidence: r.score,
      matchMethod: 'fuzzy',
    }));
    return toResolvedEntity(best.company, best.score, 'fuzzy', alternatives);
  }

  // ── Step 7: CSV Company Database Fallback ──
  try {
    await loadCompanyDatabase();
    const csvResults = searchCompanies(trimmedQuery);
    if (csvResults.length > 0) {
      const bestCSV = csvResults[0];
      const region = bestCSV.country === 'India' || bestCSV.country === 'INDIA' ? 'INDIA' : 'GLOBAL';
      return {
        entityId: `csv_${normalize(bestCSV.companyName).replace(/\s/g, '_')}`,
        canonicalName: bestCSV.companyName,
        ticker: bestCSV.companyName.toUpperCase().replace(/\s+/g, ''),
        tickerNSE: undefined,
        tickerBSE: undefined,
        tickerGlobal: region === 'GLOBAL' ? bestCSV.companyName.toUpperCase().replace(/\s+/g, '') : undefined,
        sector: mapCSVIndustryToSector(bestCSV.industryName),
        industry: bestCSV.industryName || 'Unknown',
        subIndustry: bestCSV.subIndustry || bestCSV.industryName || 'Unknown',
        country: bestCSV.country,
        region: region,
        isListed: bestCSV.verified,
        exchange: region === 'INDIA' ? 'NSE' : bestCSV.country === 'UK' ? 'LSE' : bestCSV.country === 'USA' ? 'NYSE' : undefined,
        confidence: bestCSV.confidenceScore || 80,
        matchMethod: 'csv_database',
      };
    }
  } catch (csvError) {
    console.warn('[EntityResolver] CSV fallback error:', csvError);
  }

  // ── Step 8: CSV Database Fallback (handled in Step 7 above) ──
  
  // ── Step 9: Supabase lookup (for dynamically added entities) ──
  if (supabaseClient) {
    const supabaseEntity = await lookupInSupabase(trimmedQuery, supabaseClient);
    if (supabaseEntity) return supabaseEntity;
  }

  // ── Step 10: Industry keyword match (last resort) ──
  const industryGuess = guessIndustry(normalizedQuery);
  if (industryGuess) {
    return createPlaceholderEntity(trimmedQuery, industryGuess.sector, industryGuess.industry, 55, 'industry_keyword');
  }

  return null;
}

async function lookupInSupabase(query: string, supabaseClient: any): Promise<ResolvedEntity | null> {
  try {
    const { data } = await supabaseClient
      .from('entity_intelligence')
      .select('*')
      .ilike('canonical_name', `%${query}%`)
      .limit(1)
      .single();

    if (!data) return null;

    return {
      entityId: data.id,
      canonicalName: data.canonical_name,
      ticker: data.ticker_nse || data.ticker_bse || data.ticker_global,
      tickerNSE: data.ticker_nse,
      tickerBSE: data.ticker_bse,
      tickerGlobal: data.ticker_global,
      sector: data.sector,
      industry: data.industry,
      subIndustry: data.sub_industry,
      country: data.country,
      region: data.region,
      isListed: data.is_listed,
      exchange: data.exchange,
      confidence: 80,
      matchMethod: 'supabase',
    };
  } catch {
    return null;
  }
}

function mapCSVIndustryToSector(industryName: string): string {
  const industryLower = (industryName || '').toLowerCase();
  
  const sectorMap: Record<string, string> = {
    'technology': 'Information Technology',
    'it services': 'Information Technology',
    'software': 'Information Technology',
    'semiconductors': 'Information Technology',
    'consumer electronics': 'Information Technology',
    'e-commerce': 'Consumer Discretionary',
    'automotive': 'Consumer Discretionary',
    'electric vehicles': 'Consumer Discretionary',
    'financial services': 'Financials',
    'banking': 'Financials',
    'insurance': 'Financials',
    'healthcare': 'Health Care',
    'pharmaceuticals': 'Health Care',
    'biotechnology': 'Health Care',
    'energy': 'Energy',
    'oil & gas': 'Energy',
    'utilities': 'Utilities',
    'telecommunications': 'Communication Services',
    'media': 'Communication Services',
    'streaming services': 'Communication Services',
    'retail': 'Consumer Staples',
    'food & beverage': 'Consumer Staples',
    'consumer goods': 'Consumer Staples',
    'real estate': 'Real Estate',
    'construction': 'Materials',
    'chemicals': 'Materials',
    'metals & mining': 'Materials',
    'aerospace': 'Industrials',
    'defense': 'Industrials',
    'transportation': 'Industrials',
  };

  for (const [key, sector] of Object.entries(sectorMap)) {
    if (industryLower.includes(key)) {
      return sector;
    }
  }
  return 'Unknown';
}

function guessIndustry(normalizedQuery: string): { sector: string; industry: string } | null {
  for (const [pattern, mapping] of Object.entries(INDUSTRY_HIERARCHY)) {
    if (normalizedQuery.includes(pattern)) {
      return { sector: mapping.sector, industry: mapping.industry };
    }
  }
  return null;
}

function toResolvedEntity(
  company: CompanyRecord,
  confidence: number,
  matchMethod: string,
  alternatives?: AlternativeMatch[]
): ResolvedEntity {
  return {
    entityId: company.id,
    canonicalName: company.canonicalName,
    ticker: company.ticker || company.tickerNSE || company.tickerBSE || company.tickerGlobal,
    tickerNSE: company.tickerNSE,
    tickerBSE: company.tickerBSE,
    tickerGlobal: company.tickerGlobal,
    sector: company.sector,
    industry: company.industry,
    subIndustry: company.subIndustry,
    niche: company.niche,
    country: company.country,
    region: company.region,
    isListed: company.isListed,
    exchange: company.exchange,
    confidence,
    matchMethod,
    alternatives,
  };
}

function createPlaceholderEntity(
  name: string,
  sector: string,
  industry: string,
  confidence: number,
  matchMethod: string
): ResolvedEntity {
  return {
    entityId: `placeholder_${normalize(name).replace(/\s/g, '_')}`,
    canonicalName: name,
    sector,
    industry,
    subIndustry: industry,
    country: 'Unknown',
    region: 'GLOBAL',
    isListed: false,
    confidence,
    matchMethod,
  };
}
