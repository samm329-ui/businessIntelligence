/**
 * EBITA Intelligence - Indian Companies Dataset Loader
 * Parsed from: industry_data_table.txt
 * 
 * Dataset: 6,287 Indian companies
 * Industries: 16 broad industries
 * Sub-categories: 69 specific segments
 * Coverage: Agriculture → IT → Healthcare → Finance → Manufacturing
 * 
 * USAGE:
 *   1. Place indian_companies_clean.json in datasets/
 *   2. Call loadIndianCompaniesFromJson() at server startup
 *   3. Entity resolver will use this automatically
 */

import * as fs from 'fs';
import * as path from 'path';
import { CompanyRecord } from '../resolution/entity-resolver-v2';

// Industry → Sector mapping (from your dataset)
export const INDUSTRY_TO_SECTOR: Record<string, string> = {
  'Agriculture & Crop Production': 'Primary Sector',
  'Animal Husbandry & Livestock': 'Primary Sector',
  'Mining & Quarrying': 'Primary Sector',
  'Food & Beverage Processing': 'Secondary Sector',
  'Textiles & Apparel': 'Secondary Sector',
  'Chemicals, Petrochemicals & Pharma': 'Secondary Sector',
  'Engineering & Capital Goods': 'Secondary Sector',
  'Automobiles & Auto Components': 'Secondary Sector',
  'Electronics (ESDM)': 'Secondary Sector',
  'Materials & Construction Inputs': 'Secondary Sector',
  'Infrastructure & Construction': 'Secondary Sector',
  'Information Technology (IT) & BPM': 'Tertiary Sector',
  'Financial Services (BFSI)': 'Tertiary Sector',
  'Healthcare & Life Sciences': 'Tertiary Sector',
  'Logistics & Transportation': 'Tertiary Sector',
};

// Sub-category → broader industry mapping
export const SUBCAT_TO_INDUSTRY: Record<string, string> = {
  'Pulses Processing & Trading': 'Agriculture & Crop Production',
  'Oilseeds Processing & Edible Oils': 'Agriculture & Crop Production',
  'Horticulture': 'Agriculture & Crop Production',
  'Commercial Crops': 'Agriculture & Crop Production',
  'Organic Farming': 'Agriculture & Crop Production',
  'Plantation Crops': 'Agriculture & Crop Production',
  'Dairy': 'Animal Husbandry & Livestock',
  'Poultry': 'Animal Husbandry & Livestock',
  'Fisheries': 'Animal Husbandry & Livestock',
  'Apiculture': 'Animal Husbandry & Livestock',
  'Banking': 'Financial Services (BFSI)',
  'NBFCs': 'Financial Services (BFSI)',
  'Insurance': 'Financial Services (BFSI)',
  'Fintech': 'Financial Services (BFSI)',
  'Pharmaceuticals': 'Chemicals, Petrochemicals & Pharma',
  'Medical Devices': 'Healthcare & Life Sciences',
  'Hospitals & Clinics': 'Healthcare & Life Sciences',
  'Diagnostics': 'Healthcare & Life Sciences',
  'Wellness': 'Healthcare & Life Sciences',
  'IT Services': 'Information Technology (IT) & BPM',
  'ITeS / BPM': 'Information Technology (IT) & BPM',
  'Emerging Tech': 'Information Technology (IT) & BPM',
  'Electric Vehicles': 'Automobiles & Auto Components',
  'OEMs (Vehicle Makers)': 'Automobiles & Auto Components',
  'Auto Components': 'Automobiles & Auto Components',
  'Ferrous Metals': 'Materials & Construction Inputs',
  'Non-Ferrous Metals': 'Materials & Construction Inputs',
  'Cement': 'Materials & Construction Inputs',
  'Ceramics & Glass': 'Materials & Construction Inputs',
  'Logistics': 'Logistics & Transportation',
  'Aviation': 'Logistics & Transportation',
  'Maritime': 'Logistics & Transportation',
  'Railways': 'Logistics & Transportation',
};

interface RawRow {
  id: string;
  company_name: string;
  normalized_name: string;
  brands: string;
  location: string;
  sector: string;
  industry: string;
  sub_category: string;
  size_tier: string;
  region: string;
  country: string;
  is_listed: string;
  source: string;
}

function rowToCompanyRecord(row: RawRow, index: number): CompanyRecord {
  const brandList = row.brands 
    ? row.brands.split('|').map(b => b.trim()).filter(Boolean)
    : [];

  // Build aliases from name variations
  const aliases = buildAliases(row.company_name, brandList);

  return {
    id: row.id || `ind_${index}`,
    canonicalName: row.company_name,
    normalizedName: row.normalized_name,
    sector: INDUSTRY_TO_SECTOR[row.industry] || row.sector || 'Unknown',
    industry: row.industry,
    subIndustry: row.sub_category,
    country: row.country || 'India',
    region: 'INDIA',
    isListed: row.is_listed === 'true',
    aliases,
    brands: brandList,
    source: 'indian_dataset_txt',
  };
}

function buildAliases(name: string, brands: string[]): string[] {
  const aliases: string[] = [];
  
  // Short name without legal suffix
  const short = name
    .replace(/\s+(Pvt\.?\s+)?Ltd\.?/gi, '')
    .replace(/\s+Limited/gi, '')
    .replace(/\s+Private/gi, '')
    .replace(/\s+Industries/gi, '')
    .replace(/\s+Corporation/gi, '')
    .trim();
  
  if (short && short !== name && short.length > 3) {
    aliases.push(short);
  }

  // Add initials for multi-word names
  const words = name.split(/\s+/).filter(w => w.length > 2 && !/pvt|ltd|limited|private/i.test(w));
  if (words.length >= 2 && words.length <= 5) {
    const initials = words.map(w => w[0].toUpperCase()).join('');
    if (initials.length >= 2 && initials.length <= 6) aliases.push(initials);
  }

  // Add brands as aliases too (brand → parent company)
  aliases.push(...brands);

  return [...new Set(aliases)].filter(a => a.length > 2);
}

const DATA_PATHS = [
  './datasets/indian_companies_clean.json',
  './datasets/indian_companies.json', 
  '../datasets/indian_companies_clean.json',
  './public/datasets/indian_companies_clean.json',
];

export function loadIndianCompaniesFromJson(customPath?: string): CompanyRecord[] {
  const paths = customPath ? [customPath, ...DATA_PATHS] : DATA_PATHS;

  for (const p of paths) {
    const resolved = path.resolve(p);
    if (!fs.existsSync(resolved)) continue;

    try {
      const raw = fs.readFileSync(resolved, 'utf-8');
      const rows: RawRow[] = JSON.parse(raw);
      const records = rows.map((row, i) => rowToCompanyRecord(row, i));
      console.log(`[IndianDataset] Loaded ${records.length} companies from ${resolved}`);
      return records;
    } catch (err) {
      console.error(`[IndianDataset] Error loading ${p}:`, err);
    }
  }

  console.warn('[IndianDataset] JSON file not found. Run the parser first.');
  return [];
}

// Get all companies in a specific industry/sub-category
// Useful for competitor detection
export function getCompaniesByIndustry(
  records: CompanyRecord[],
  industry: string,
  subIndustry?: string
): CompanyRecord[] {
  return records.filter(r => {
    const industryMatch = r.industry.toLowerCase().includes(industry.toLowerCase());
    if (!subIndustry) return industryMatch;
    return industryMatch && r.subIndustry.toLowerCase().includes(subIndustry.toLowerCase());
  });
}

// Get all unique industries in the dataset  
export function getIndustryList(records: CompanyRecord[]): string[] {
  return [...new Set(records.map(r => r.industry))].sort();
}

// Get all sub-industries for a given industry
export function getSubIndustryList(records: CompanyRecord[], industry: string): string[] {
  return [...new Set(
    records
      .filter(r => r.industry.toLowerCase().includes(industry.toLowerCase()))
      .map(r => r.subIndustry)
  )].sort();
}
