/**
 * EBITA Intelligence - Wikipedia Fetcher
 * 
 * Free, unlimited, no API key needed.
 * Great for: company overview, founding, headquarters, subsidiaries, brands.
 * Not for: live financial data (numbers may be outdated).
 */

import { RawFinancialData } from '../intelligence/data-intelligence-layer';

export interface WikipediaCompanyData {
  description: string;
  foundedYear?: number;
  headquarters?: string;
  founders?: string[];
  subsidiaries?: string[];
  products?: string[];
  keyPeople?: string[];
  industry?: string;
  revenue?: number | null;    // Often outdated - low trust
  employees?: number | null;
  website?: string;
  exchange?: string;
  ticker?: string;
}

const WIKI_API = 'https://en.wikipedia.org/api/rest_v1';
const WIKI_QUERY_API = 'https://en.wikipedia.org/w/api.php';

/**
 * Get a company summary from Wikipedia.
 * Returns both structured data (for entity resolution) and
 * limited financial data (very low trust - only used to fill gaps).
 */
export async function fetchWikipediaData(companyName: string): Promise<{
  companyData: WikipediaCompanyData | null;
  financialData: RawFinancialData;
}> {
  try {
    // First get the page summary
    const summary = await fetchWikipediaSummary(companyName);
    if (!summary) {
      // Try with "company" appended
      const summaryWithCompany = await fetchWikipediaSummary(`${companyName} company`);
      if (!summaryWithCompany) return { companyData: null, financialData: {} };
    }

    const pageData = summary || await fetchWikipediaSummary(`${companyName} company`);
    if (!pageData) return { companyData: null, financialData: {} };

    // Get full page content for more details
    const fullContent = await fetchWikipediaPageContent(pageData.title);

    const companyData = parseCompanyData(pageData, fullContent);
    
    // Financial data from Wikipedia - very limited trust, only for gap-filling
    const financialData: RawFinancialData = {};
    if (companyData.revenue) financialData.revenue = companyData.revenue;
    // Don't include other financial metrics - Wikipedia data is too often outdated

    return { companyData, financialData };
  } catch (err) {
    console.error(`[Wikipedia] Error fetching ${companyName}:`, err);
    return { companyData: null, financialData: {} };
  }
}

async function fetchWikipediaSummary(query: string): Promise<any | null> {
  try {
    const encodedTitle = encodeURIComponent(query.replace(/\s+/g, '_'));
    const response = await fetch(`${WIKI_API}/page/summary/${encodedTitle}`, {
      headers: { 'User-Agent': 'EBITA-Intelligence/1.0 (financial-research-tool)' },
    });

    if (!response.ok) return null;

    const data = await response.json();
    
    // Verify it's actually a company/organization article
    if (data.type === 'disambiguation') {
      return await resolveDisambiguation(query);
    }

    // Check if description suggests it's a company
    const desc = (data.description || '').toLowerCase();
    const isCompany = /company|corporation|enterprise|conglomerate|bank|firm|group|limited|pvt|inc\b|ltd\b/i.test(desc);
    
    if (!isCompany && data.description) {
      // Not obviously a company, return anyway but flag
    }

    return data;
  } catch {
    return null;
  }
}

async function resolveDisambiguation(query: string): Promise<any | null> {
  try {
    const params = new URLSearchParams({
      action: 'query',
      list: 'search',
      srsearch: `${query} company`,
      srlimit: '3',
      format: 'json',
      origin: '*',
    });

    const response = await fetch(`${WIKI_QUERY_API}?${params}`);
    if (!response.ok) return null;

    const data = await response.json();
    const results = data?.query?.search || [];
    
    if (results.length === 0) return null;

    // Take first result and fetch its summary
    const title = results[0].title;
    const encodedTitle = encodeURIComponent(title.replace(/\s+/g, '_'));
    const summaryResponse = await fetch(`${WIKI_API}/page/summary/${encodedTitle}`, {
      headers: { 'User-Agent': 'EBITA-Intelligence/1.0' },
    });

    if (!summaryResponse.ok) return null;
    return await summaryResponse.json();
  } catch {
    return null;
  }
}

async function fetchWikipediaPageContent(title: string): Promise<string> {
  try {
    const params = new URLSearchParams({
      action: 'query',
      titles: title,
      prop: 'revisions',
      rvprop: 'content',
      rvslots: 'main',
      format: 'json',
      origin: '*',
      rvsection: '0', // Only intro section - faster, has key facts
    });

    const response = await fetch(`${WIKI_QUERY_API}?${params}`);
    if (!response.ok) return '';

    const data = await response.json();
    const pages = data?.query?.pages || {};
    const page = Object.values(pages)[0] as any;
    
    return page?.revisions?.[0]?.slots?.main?.['*'] || '';
  } catch {
    return '';
  }
}

function parseCompanyData(summary: any, wikiContent: string): WikipediaCompanyData {
  const result: WikipediaCompanyData = {
    description: summary.extract || summary.description || '',
  };

  // Extract from wiki markup (rough extraction)
  if (wikiContent) {
    // Founded year
    const foundedMatch = wikiContent.match(/founded\s*=\s*(?:.*?)?(\d{4})/i) ||
                         wikiContent.match(/\bfounded.*?(\d{4})/i) ||
                         wikiContent.match(/established.*?(\d{4})/i);
    if (foundedMatch) result.foundedYear = parseInt(foundedMatch[1]);

    // Headquarters
    const hqMatch = wikiContent.match(/headquarters\s*=\s*([^\n|]+)/i) ||
                    wikiContent.match(/location_city\s*=\s*([^\n|]+)/i);
    if (hqMatch) result.headquarters = hqMatch[1].replace(/\[\[|\]\]|''/g, '').trim();

    // Revenue (parse from wiki infobox - treat as low confidence)
    const revenueMatch = wikiContent.match(/revenue\s*=.*?([\d,\.]+)\s*(billion|million|crore|lakh)?/i);
    if (revenueMatch) {
      const amount = parseFloat(revenueMatch[1].replace(/,/g, ''));
      const unit = (revenueMatch[2] || '').toLowerCase();
      let revenue = amount;
      if (unit === 'billion') revenue = amount * 1e9;
      else if (unit === 'million') revenue = amount * 1e6;
      else if (unit === 'crore') revenue = amount * 1e7;
      else if (unit === 'lakh') revenue = amount * 1e5;
      result.revenue = revenue > 0 ? revenue : null;
    }

    // Employees
    const empMatch = wikiContent.match(/num_employees\s*=.*?([\d,]+)/i) ||
                     wikiContent.match(/employees\s*=.*?([\d,]+)/i);
    if (empMatch) result.employees = parseInt(empMatch[1].replace(/,/g, ''));

    // Stock exchange
    const exchangeMatch = wikiContent.match(/traded_as\s*=.*?(NSE|BSE|NYSE|NASDAQ|LSE)/i);
    if (exchangeMatch) result.exchange = exchangeMatch[1].toUpperCase();

    // Ticker
    const tickerMatch = wikiContent.match(/traded_as\s*=.*?:([A-Z]{2,8})/i);
    if (tickerMatch) result.ticker = tickerMatch[1].toUpperCase();

    // Subsidiaries
    const subsSection = wikiContent.match(/subsidiaries\s*=\s*([^\n]+(?:\n\*[^\n]+)*)/i);
    if (subsSection) {
      result.subsidiaries = subsSection[1]
        .split(/\n?\*|\|/)
        .map(s => s.replace(/\[\[|\]\]|''/g, '').trim())
        .filter(s => s.length > 2 && s.length < 100)
        .slice(0, 10);
    }

    // Key people
    const keyPeopleMatch = wikiContent.match(/key_people\s*=\s*([^\n]+(?:\n\*[^\n]+)*)/i);
    if (keyPeopleMatch) {
      result.keyPeople = keyPeopleMatch[1]
        .split(/\n?\*|\|/)
        .map(s => s.replace(/\[\[|\]\]|''/g, '').trim())
        .filter(s => s.length > 2 && s.length < 80)
        .slice(0, 6);
    }
  }

  // Extract from description
  const websiteMatch = summary.content_urls?.desktop?.page;
  if (websiteMatch) result.website = websiteMatch;

  return result;
}

/**
 * Search Wikipedia for a company - useful when exact title unknown
 */
export async function searchWikipedia(query: string, limit = 5): Promise<string[]> {
  try {
    const params = new URLSearchParams({
      action: 'query',
      list: 'search',
      srsearch: query,
      srlimit: String(limit),
      format: 'json',
      origin: '*',
    });

    const response = await fetch(`${WIKI_QUERY_API}?${params}`);
    if (!response.ok) return [];

    const data = await response.json();
    return (data?.query?.search || []).map((r: any) => r.title);
  } catch {
    return [];
  }
}
