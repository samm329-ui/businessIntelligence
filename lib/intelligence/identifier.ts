/**
 * Industry/Company Identifier
 * 
 * Identifies the industry for any input (company, brand, or industry name)
 * Priority:
 *   1. Check Excel dataset (primary)
 *   2. Check dynamic entities
 *   3. Check CSV dataset
 *   4. Google Search + Add to dataset
 */

import { loadIndianCompaniesFromExcel, searchIndianCompanies, getCompanyByExactName, getIndustryInfo, getAllIndustries } from '../datasets/load-excel-companies';
import { loadDynamicEntities, entityExists, addEntity, identifyIndustry } from '../dataset-manager/updater';
import { searchCompanyInfo, searchIndustryInfo } from '../search-bots/google-bot';
import { searchCompanies as searchCSVCompanies, loadCompanyDatabase } from '../datasets/company-database';

export interface IdentificationResult {
  found: boolean;
  type: 'company' | 'industry' | 'brand' | 'unknown';
  name: string;
  industry: string;
  subIndustry: string;
  confidence: number;
  source: 'excel' | 'dynamic' | 'csv' | 'google' | 'none';
  data?: any;
  isNew?: boolean;
  ticker?: string;
  domain?: string;
  aliases?: string[];
}

export interface SearchContext {
  results?: Array<{ title: string; url: string; description: string }>;
  hints?: { name?: string; industry?: string; type?: string };
}

function extractTickerFromSearchResults(results: Array<{ title: string; url: string; description: string }>): string | undefined {
  for (const r of results) {
    const text = `${r.title} ${r.description}`;
    const nseMatch = text.match(/NSE[:\s]+([A-Z]{2,10})/);
    if (nseMatch) return `NSE:${nseMatch[1]}`;
    const bseMatch = text.match(/BSE[:\s]+(\d{5,6})/);
    if (bseMatch) return `BSE:${bseMatch[1]}`;
    const tickerMatch = text.match(/(?:ticker|symbol|stock)[:\s]+([A-Z]{1,6}(?:\.[A-Z]{1,2})?)/i);
    if (tickerMatch) return tickerMatch[1];
    const nasdaqMatch = text.match(/(?:NASDAQ|NYSE)[:\s]+([A-Z]{1,5})/);
    if (nasdaqMatch) return nasdaqMatch[1];
  }
  return undefined;
}

function extractDomainFromSearchResults(results: Array<{ title: string; url: string; description: string }>, entityName: string): string | undefined {
  const nameWords = entityName.toLowerCase().split(/\s+/).filter(w => w.length > 2);
  for (const r of results) {
    try {
      const hostname = new URL(r.url).hostname.replace('www.', '');
      for (const word of nameWords) {
        if (hostname.includes(word) && !hostname.includes('wikipedia') && !hostname.includes('google') && !hostname.includes('yahoo') && !hostname.includes('moneycontrol')) {
          return hostname;
        }
      }
    } catch {}
  }
  return undefined;
}

function extractAliasesFromSearchResults(results: Array<{ title: string; url: string; description: string }>, entityName: string): string[] {
  const aliases = new Set<string>();
  const entityLower = entityName.toLowerCase();
  for (const r of results) {
    const text = `${r.title} ${r.description}`;
    const alsoKnown = text.match(/(?:also\s+known\s+as|formerly|aka|trading\s+as|d\/b\/a)\s+["']?([A-Z][a-zA-Z\s]+?)["']?(?:\.|,|;|\)|$)/gi);
    if (alsoKnown) {
      for (const match of alsoKnown) {
        const alias = match.replace(/^(?:also\s+known\s+as|formerly|aka|trading\s+as|d\/b\/a)\s+["']?/i, '').replace(/["']?[.,;)]?$/, '').trim();
        if (alias.length > 2 && alias.length < 50 && alias.toLowerCase() !== entityLower) {
          aliases.add(alias);
        }
      }
    }
    const parenthetical = text.match(/([A-Z][a-zA-Z]+(?:\s+[A-Z][a-zA-Z]+){0,3})\s*\(([A-Z][a-zA-Z\s]+?)\)/g);
    if (parenthetical) {
      for (const match of parenthetical) {
        const inner = match.match(/\(([^)]+)\)/);
        if (inner && inner[1].length > 2 && inner[1].length < 40) {
          aliases.add(inner[1].trim());
        }
      }
    }
  }
  return Array.from(aliases).slice(0, 5);
}

function resolveFromSearchContext(input: string, ctx: SearchContext): IdentificationResult | null {
  if (!ctx.results || ctx.results.length === 0) return null;

  let bestName = input;
  let industry = ctx.hints?.industry || '';
  let type: IdentificationResult['type'] = (ctx.hints?.type as any) || 'unknown';
  let confidence = 0;

  for (const r of ctx.results.slice(0, 5)) {
    const text = `${r.title} ${r.description}`;
    if (!industry) {
      const indMatch = text.match(/(?:industry|sector|segment)[:\s]+([A-Za-z\s&]+?)(?:\.|,|;|\n|$)/i);
      if (indMatch) industry = indMatch[1].trim();
    }
    if (type === 'unknown' && /\b(?:Ltd|Limited|Inc|Corp|Company|Group|Holdings|Pvt)\b/i.test(text)) {
      type = 'company';
    }
    const nameMatch = text.match(new RegExp(`(${input.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}[\\w\\s]*?(?:Ltd|Limited|Inc|Corp|Company|Group|Holdings)?)`, 'i'));
    if (nameMatch && nameMatch[1].length > bestName.length) {
      bestName = nameMatch[1].trim();
    }
  }

  if (ctx.results.length >= 3) confidence = 80;
  else if (ctx.results.length >= 1) confidence = 65;
  if (industry) confidence = Math.min(95, confidence + 10);
  if (type === 'company') confidence = Math.min(95, confidence + 5);

  if (confidence < 60) return null;

  const ticker = extractTickerFromSearchResults(ctx.results);
  const domain = extractDomainFromSearchResults(ctx.results, bestName);
  const aliases = extractAliasesFromSearchResults(ctx.results, bestName);

  return {
    found: true,
    type,
    name: bestName,
    industry: industry || 'Unknown',
    subIndustry: 'General',
    confidence,
    source: 'google',
    ticker,
    domain,
    aliases,
    isNew: true,
  };
}

// ═══════════════════════════════════════════════════════════════════════════
// Main Identification Function
// ═══════════════════════════════════════════════════════════════════════════

export async function identifyInput(input: string, searchContext?: SearchContext): Promise<IdentificationResult> {
  const trimmedInput = input.trim();
  if (!trimmedInput || trimmedInput.length < 2) {
    return {
      found: false,
      type: 'unknown',
      name: trimmedInput,
      industry: 'Unknown',
      subIndustry: 'Unknown',
      confidence: 0,
      source: 'none',
    };
  }

  console.log(`[Identifier] Identifying: "${trimmedInput}"${searchContext?.results ? ` (with ${searchContext.results.length} search hints)` : ''}`);

  if (searchContext?.results && searchContext.results.length > 0) {
    const searchBasedResult = resolveFromSearchContext(trimmedInput, searchContext);
    if (searchBasedResult && searchBasedResult.confidence >= 75) {
      console.log(`[Identifier] Resolved via search context: ${searchBasedResult.name} (${searchBasedResult.industry}) [${searchBasedResult.confidence}%]`);

      const excelValidation = await checkExcelDatabase(searchBasedResult.name);
      if (excelValidation.found) {
        excelValidation.ticker = searchBasedResult.ticker || extractTickerFromSearchResults(searchContext.results);
        excelValidation.domain = searchBasedResult.domain || extractDomainFromSearchResults(searchContext.results, excelValidation.name);
        excelValidation.aliases = extractAliasesFromSearchResults(searchContext.results, excelValidation.name);
        excelValidation.confidence = Math.max(excelValidation.confidence, searchBasedResult.confidence);
        console.log(`[Identifier] Search-first + Excel validated: ${excelValidation.name}`);
        return excelValidation;
      }

      const csvValidation = await checkCSVDatabase(searchBasedResult.name);
      if (csvValidation.found) {
        csvValidation.ticker = searchBasedResult.ticker;
        csvValidation.domain = searchBasedResult.domain;
        csvValidation.aliases = searchBasedResult.aliases;
        csvValidation.confidence = Math.max(csvValidation.confidence, searchBasedResult.confidence);
        console.log(`[Identifier] Search-first + CSV validated: ${csvValidation.name}`);
        return csvValidation;
      }

      return searchBasedResult;
    }
  }

  const excelResult = await checkExcelDatabase(trimmedInput);
  if (excelResult.found) {
    console.log(`[Identifier] Found in Excel: ${excelResult.name} (${excelResult.industry})`);
    if (searchContext?.results) {
      excelResult.ticker = excelResult.ticker || extractTickerFromSearchResults(searchContext.results);
      excelResult.domain = extractDomainFromSearchResults(searchContext.results, excelResult.name);
      excelResult.aliases = extractAliasesFromSearchResults(searchContext.results, excelResult.name);
    }
    return excelResult;
  }

  const dynamicResult = await checkDynamicEntities(trimmedInput);
  if (dynamicResult.found) {
    console.log(`[Identifier] Found in dynamic dataset: ${dynamicResult.name}`);
    if (searchContext?.results) {
      dynamicResult.ticker = extractTickerFromSearchResults(searchContext.results);
      dynamicResult.domain = extractDomainFromSearchResults(searchContext.results, dynamicResult.name);
      dynamicResult.aliases = extractAliasesFromSearchResults(searchContext.results, dynamicResult.name);
    }
    return dynamicResult;
  }

  const csvResult = await checkCSVDatabase(trimmedInput);
  if (csvResult.found) {
    console.log(`[Identifier] Found in CSV: ${csvResult.name}`);
    if (searchContext?.results) {
      csvResult.ticker = extractTickerFromSearchResults(searchContext.results);
      csvResult.domain = extractDomainFromSearchResults(searchContext.results, csvResult.name);
      csvResult.aliases = extractAliasesFromSearchResults(searchContext.results, csvResult.name);
    }
    return csvResult;
  }

  const industryResult = await checkIndustryName(trimmedInput);
  if (industryResult.found) {
    console.log(`[Identifier] Matched as industry: ${industryResult.industry}`);
    return industryResult;
  }

  console.log(`[Identifier] Not found in datasets, searching Google...`);
  const googleResult = await searchAndIdentify(trimmedInput);
  
  if (googleResult.found) {
    console.log(`[Identifier] Identified via Google: ${googleResult.name} (${googleResult.industry})`);
    if (searchContext?.results) {
      googleResult.ticker = extractTickerFromSearchResults(searchContext.results);
      googleResult.domain = extractDomainFromSearchResults(searchContext.results, googleResult.name);
      googleResult.aliases = extractAliasesFromSearchResults(searchContext.results, googleResult.name);
    }
    return { ...googleResult, isNew: true };
  }

  console.log(`[Identifier] Could not identify: "${trimmedInput}"`);
  return {
    found: false,
    type: 'unknown',
    name: trimmedInput,
    industry: 'Unknown',
    subIndustry: 'Unknown',
    confidence: 0,
    source: 'none',
  };
}

// ═══════════════════════════════════════════════════════════════════════════
// Check Excel Database
// ═══════════════════════════════════════════════════════════════════════════

async function checkExcelDatabase(input: string): Promise<IdentificationResult> {
  // Quick Commerce Special Cases (Feb 2026)
  const inputLower = input.toLowerCase().trim();
  const quickCommerceMap: Record<string, IdentificationResult> = {
    'zepto': {
      found: true,
      type: 'company',
      name: 'Zepto',
      industry: 'Retail',
      subIndustry: 'Quick Commerce',
      confidence: 95,
      source: 'dynamic',
      isNew: false,
    },
    'blinkit': {
      found: true,
      type: 'company',
      name: 'Blinkit (Zepto)',
      industry: 'Retail',
      subIndustry: 'Quick Commerce',
      confidence: 95,
      source: 'dynamic',
      isNew: false,
    },
    'instamart': {
      found: true,
      type: 'company',
      name: 'Swiggy Instamart',
      industry: 'Retail',
      subIndustry: 'Quick Commerce',
      confidence: 95,
      source: 'dynamic',
      isNew: false,
    },
  };

  if (quickCommerceMap[inputLower]) {
    console.log(`[Identifier] Quick Commerce match: ${input}`);
    return quickCommerceMap[inputLower];
  }

  try {
    const exactMatch = getCompanyByExactName(input);
    if (exactMatch) {
      return {
        found: true,
        type: 'company',
        name: exactMatch.companyName,
        industry: exactMatch.industry || 'Unknown',
        subIndustry: exactMatch.subCategory || 'General',
        confidence: 100,
        source: 'excel',
        data: exactMatch,
      };
    }

    const searchResults = searchIndianCompanies(input);
    if (searchResults.length > 0) {
      const bestMatch = searchResults[0];
      const isExact = bestMatch.companyName.toLowerCase() === input.toLowerCase();
      
      return {
        found: true,
        type: 'company',
        name: bestMatch.companyName,
        industry: bestMatch.industry || 'Unknown',
        subIndustry: bestMatch.subCategory || 'General',
        confidence: isExact ? 95 : 80,
        source: 'excel',
        data: bestMatch,
      };
    }

    return { found: false, type: 'unknown', name: input, industry: 'Unknown', subIndustry: 'Unknown', confidence: 0, source: 'none' };
  } catch (error: any) {
    console.error('[Identifier] Excel check error:', error.message);
    return { found: false, type: 'unknown', name: input, industry: 'Unknown', subIndustry: 'Unknown', confidence: 0, source: 'none' };
  }
}

// ═══════════════════════════════════════════════════════════════════════════
// Check Dynamic Entities
// ═══════════════════════════════════════════════════════════════════════════

async function checkDynamicEntities(input: string): Promise<IdentificationResult> {
  try {
    const dynamicEntities = await loadDynamicEntities();
    const normalizedInput = input.toLowerCase().trim();

    const match = dynamicEntities.find(e => 
      e.name.toLowerCase() === normalizedInput ||
      e.normalizedName === normalizedInput
    );

    if (match) {
      return {
        found: true,
        type: 'company',
        name: match.name,
        industry: match.industry,
        subIndustry: match.subIndustry || 'General',
        confidence: match.confidence || 70,
        source: 'dynamic',
        data: match,
      };
    }

    return { found: false, type: 'unknown', name: input, industry: 'Unknown', subIndustry: 'Unknown', confidence: 0, source: 'none' };
  } catch (error: any) {
    console.error('[Identifier] Dynamic check error:', error.message);
    return { found: false, type: 'unknown', name: input, industry: 'Unknown', subIndustry: 'Unknown', confidence: 0, source: 'none' };
  }
}

// ═══════════════════════════════════════════════════════════════════════════
// Check CSV Database
// ═══════════════════════════════════════════════════════════════════════════

async function checkCSVDatabase(input: string): Promise<IdentificationResult> {
  try {
    const loaded = await loadCompanyDatabase();
    console.log(`[Identifier] CSV database loaded: ${loaded}`);
    
    const results = searchCSVCompanies(input);
    console.log(`[Identifier] CSV search for "${input}": ${results.length} results`);
    
    if (results.length > 0) {
      const bestMatch = results[0];
      const isExact = bestMatch.companyName.toLowerCase() === input.toLowerCase();
      console.log(`[Identifier] CSV match: ${bestMatch.companyName} (exact: ${isExact})`);

      return {
        found: true,
        type: 'company',
        name: bestMatch.companyName,
        industry: bestMatch.industryName || 'Unknown',
        subIndustry: 'General',
        confidence: isExact ? 90 : 75,
        source: 'csv',
        data: bestMatch,
      };
    }

    return { found: false, type: 'unknown', name: input, industry: 'Unknown', subIndustry: 'Unknown', confidence: 0, source: 'none' };
  } catch (error: any) {
    console.error('[Identifier] CSV check error:', error.message);
    return { found: false, type: 'unknown', name: input, industry: 'Unknown', subIndustry: 'Unknown', confidence: 0, source: 'none' };
  }
}

// ═══════════════════════════════════════════════════════════════════════════
// Check if Input is an Industry Name
// ═══════════════════════════════════════════════════════════════════════════

async function checkIndustryName(input: string): Promise<IdentificationResult> {
  try {
    // Check Excel industries
    const excelIndustries = getAllIndustries();
    const matchedExcelIndustry = excelIndustries.find(ind => 
      ind.toLowerCase() === input.toLowerCase() || 
      ind.toLowerCase().includes(input.toLowerCase())
    );

    if (matchedExcelIndustry) {
      const industryInfo = getIndustryInfo(matchedExcelIndustry);
      
      return {
        found: true,
        type: 'industry',
        name: matchedExcelIndustry,
        industry: matchedExcelIndustry,
        subIndustry: industryInfo?.subCategories?.[0] || 'General',
        confidence: 95,
        source: 'excel',
        data: industryInfo,
      };
    }

    return { found: false, type: 'unknown', name: input, industry: 'Unknown', subIndustry: 'Unknown', confidence: 0, source: 'none' };
  } catch (error: any) {
    console.error('[Identifier] Industry check error:', error.message);
    return { found: false, type: 'unknown', name: input, industry: 'Unknown', subIndustry: 'Unknown', confidence: 0, source: 'none' };
  }
}

// ═══════════════════════════════════════════════════════════════════════════
// Search Google and Identify
// ═══════════════════════════════════════════════════════════════════════════

async function searchAndIdentify(input: string): Promise<IdentificationResult> {
  try {
    // Search for company info
    const searchResults = await searchCompanyInfo(input);

    if (searchResults.length === 0) {
      return { found: false, type: 'unknown', name: input, industry: 'Unknown', subIndustry: 'Unknown', confidence: 0, source: 'none' };
    }

    // Identify industry from search results
    const industryData = await identifyIndustry(input, searchResults);

    if (!industryData || industryData.confidence < 40) {
      return { found: false, type: 'unknown', name: input, industry: 'Unknown', subIndustry: 'Unknown', confidence: 0, source: 'none' };
    }

    // Add to dynamic dataset
    const addResult = await addEntity({
      name: input,
      industry: industryData.industry,
      subIndustry: industryData.subIndustry,
      source: 'google_search',
      confidence: industryData.confidence,
    });

    if (addResult.success) {
      return {
        found: true,
        type: 'company',
        name: input,
        industry: industryData.industry,
        subIndustry: industryData.subIndustry,
        confidence: industryData.confidence,
        source: 'google',
        data: { searchResults, entityId: addResult.entityId },
      };
    }

    return { found: false, type: 'unknown', name: input, industry: 'Unknown', subIndustry: 'Unknown', confidence: 0, source: 'none' };
  } catch (error: any) {
    console.error('[Identifier] Google search error:', error.message);
    return { found: false, type: 'unknown', name: input, industry: 'Unknown', subIndustry: 'Unknown', confidence: 0, source: 'none' };
  }
}

// ═══════════════════════════════════════════════════════════════════════════
// Batch Identification
// ═══════════════════════════════════════════════════════════════════════════

export async function identifyBatch(inputs: string[]): Promise<IdentificationResult[]> {
  const results: IdentificationResult[] = [];
  
  for (const input of inputs) {
    const result = await identifyInput(input);
    results.push(result);
    // Add delay to be polite to APIs
    await new Promise(resolve => setTimeout(resolve, 500));
  }

  return results;
}

// ═══════════════════════════════════════════════════════════════════════════
// Get Identification Stats
// ═══════════════════════════════════════════════════════════════════════════

export async function getIdentificationStats(): Promise<{
  totalExcel: number;
  totalDynamic: number;
  totalCSV: number;
  totalIndustries: number;
}> {
  try {
    const excelRecords = await loadIndianCompaniesFromExcel();
    const dynamicEntities = await loadDynamicEntities();
    await loadCompanyDatabase();
    const csvResults = searchCSVCompanies(''); // Get all

    const allIndustries = new Set<string>();
    excelRecords.forEach(e => allIndustries.add(e.industry));
    dynamicEntities.forEach(e => allIndustries.add(e.industry));

    return {
      totalExcel: excelRecords.length,
      totalDynamic: dynamicEntities.length,
      totalCSV: csvResults.length,
      totalIndustries: allIndustries.size,
    };
  } catch (error: any) {
    console.error('[Identifier] Stats error:', error.message);
    return { totalExcel: 0, totalDynamic: 0, totalCSV: 0, totalIndustries: 0 };
  }
}
