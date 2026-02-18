/**
 * Dataset Updater - Dynamic Dataset Management
 * 
 * Automatically updates datasets when new companies/industries are discovered
 * via Google search or other sources.
 */

import * as fs from 'fs';
import * as path from 'path';
import { loadIndianCompaniesFromExcel, type ExcelCompanyRecord } from '../datasets/load-excel-companies';

export interface NewEntityData {
  name: string;
  normalizedName?: string;
  industry: string;
  subIndustry?: string;
  brands?: string[];
  location?: string;
  country?: string;
  isListed?: boolean;
  sector?: string;
  source: string;
  confidence: number;
  addedAt?: string;
}

export interface DatasetUpdateResult {
  success: boolean;
  entityId?: string;
  message: string;
  alreadyExists?: boolean;
}

// Paths to datasets
const DATASET_PATHS = {
  excel: 'C:\\Users\\jishu\\Downloads\\Indian_Industry_Companies_Database.xlsx',
  json: path.resolve(process.cwd(), 'datasets', 'dynamic_entities.json'),
  csv: path.resolve(process.cwd(), 'datasets', 'all_real_companies_combined.csv'),
};

// In-memory cache for new entities
let dynamicEntities: NewEntityData[] = [];
let isLoaded = false;

// ═══════════════════════════════════════════════════════════════════════════
// Load Dynamic Entities
// ═══════════════════════════════════════════════════════════════════════════

export async function loadDynamicEntities(): Promise<NewEntityData[]> {
  if (isLoaded) return dynamicEntities;

  try {
    if (fs.existsSync(DATASET_PATHS.json)) {
      const data = fs.readFileSync(DATASET_PATHS.json, 'utf-8');
      dynamicEntities = JSON.parse(data);
      console.log(`[DatasetUpdater] Loaded ${dynamicEntities.length} dynamic entities`);
    }
  } catch (error: any) {
    console.warn('[DatasetUpdater] Error loading dynamic entities:', error.message);
    dynamicEntities = [];
  }

  isLoaded = true;
  return dynamicEntities;
}

// ═══════════════════════════════════════════════════════════════════════════
// Save Dynamic Entities
// ═══════════════════════════════════════════════════════════════════════════

export async function saveDynamicEntities(): Promise<void> {
  try {
    const dir = path.dirname(DATASET_PATHS.json);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }

    fs.writeFileSync(DATASET_PATHS.json, JSON.stringify(dynamicEntities, null, 2));
    console.log(`[DatasetUpdater] Saved ${dynamicEntities.length} dynamic entities`);
  } catch (error: any) {
    console.error('[DatasetUpdater] Error saving dynamic entities:', error.message);
  }
}

// ═══════════════════════════════════════════════════════════════════════════
// Check if Entity Exists
// ═══════════════════════════════════════════════════════════════════════════

export async function entityExists(name: string): Promise<boolean> {
  const normalized = name.toLowerCase().trim();

  // Check dynamic entities
  const dynamicMatch = dynamicEntities.some(e => 
    e.name.toLowerCase() === normalized ||
    e.normalizedName === normalized
  );
  if (dynamicMatch) return true;

  // Check Excel database
  try {
    const excelRecords = await loadIndianCompaniesFromExcel();
    const excelMatch = excelRecords.some(e => 
      e.companyName.toLowerCase() === normalized ||
      e.normalizedName === normalized
    );
    if (excelMatch) return true;
  } catch (e) {
    // Ignore
  }

  return false;
}

// ═══════════════════════════════════════════════════════════════════════════
// Add New Entity to Dataset
// ═══════════════════════════════════════════════════════════════════════════

export async function addEntity(
  entity: NewEntityData
): Promise<DatasetUpdateResult> {
  await loadDynamicEntities();

  // Check if already exists
  const exists = await entityExists(entity.name);
  if (exists) {
    return {
      success: false,
      message: `Entity "${entity.name}" already exists in dataset`,
      alreadyExists: true,
    };
  }

  // Normalize data
  const normalizedEntity: NewEntityData = {
    ...entity,
    normalizedName: entity.normalizedName || entity.name.toLowerCase().replace(/\s+/g, '_'),
    subIndustry: entity.subIndustry || 'General',
    country: entity.country || 'India',
    isListed: entity.isListed ?? false,
    confidence: entity.confidence || 70,
    addedAt: new Date().toISOString(),
  };

  // Add to dynamic entities
  dynamicEntities.push(normalizedEntity);
  
  // Save to file
  await saveDynamicEntities();

  console.log(`[DatasetUpdater] ✓ Added new entity: ${entity.name} (${entity.industry})`);

  return {
    success: true,
    entityId: `dynamic_${normalizedEntity.normalizedName}`,
    message: `Successfully added "${entity.name}" to dataset`,
  };
}

// ═══════════════════════════════════════════════════════════════════════════
// Identify Industry from Search Results
// ═══════════════════════════════════════════════════════════════════════════

export async function identifyIndustry(
  name: string,
  searchResults: { title: string; description: string; url: string }[]
): Promise<{ industry: string; subIndustry: string; confidence: number } | null> {
  // Combine all text for analysis
  const combinedText = searchResults
    .map(r => `${r.title} ${r.description}`)
    .join(' ')
    .toLowerCase();

  // Industry keywords mapping
  const industryPatterns: Record<string, { industry: string; subIndustry: string }> = {
    'software|saas|technology|it services|cloud computing': { industry: 'Information Technology', subIndustry: 'Software' },
    'bank|financial services|insurance|fintech|nbfc': { industry: 'Financial Services', subIndustry: 'Banking' },
    'pharma|pharmaceutical|biotech|healthcare|medical': { industry: 'Healthcare', subIndustry: 'Pharmaceuticals' },
    'automobile|automotive|car|vehicle|ev|electric vehicle': { industry: 'Automotive', subIndustry: 'Automobile Manufacturers' },
    'e-commerce|online retail|marketplace': { industry: 'E-commerce', subIndustry: 'Online Retail' },
    'telecom|telecommunication|mobile|broadband': { industry: 'Telecommunications', subIndustry: 'Wireless' },
    'energy|oil|gas|renewable|solar|wind': { industry: 'Energy', subIndustry: 'Renewable Energy' },
    'real estate|property|construction|infra': { industry: 'Real Estate', subIndustry: 'Real Estate' },
    'consumer goods|fmcg|retail|food|beverage': { industry: 'Consumer Goods', subIndustry: 'FMCG' },
    'manufacturing|industrial|engineering|machinery': { industry: 'Industrials', subIndustry: 'Manufacturing' },
    'media|entertainment|streaming|ott|content': { industry: 'Media', subIndustry: 'Entertainment' },
    'logistics|transport|shipping|supply chain': { industry: 'Logistics', subIndustry: 'Transportation' },
    'education|edtech|learning|coaching': { industry: 'Education', subIndustry: 'EdTech' },
    'agriculture|farming|agritech|food processing': { industry: 'Agriculture', subIndustry: 'Agritech' },
  };

  // Check for matches
  for (const [pattern, data] of Object.entries(industryPatterns)) {
    const regex = new RegExp(pattern, 'i');
    if (regex.test(combinedText)) {
      return {
        industry: data.industry,
        subIndustry: data.subIndustry,
        confidence: 80,
      };
    }
  }

  // Try to extract from search results more specifically
  const commonWords = combinedText.match(/\b\w+\b/g) || [];
  const wordFreq: Record<string, number> = {};
  
  for (const word of commonWords) {
    if (word.length > 3) {
      wordFreq[word] = (wordFreq[word] || 0) + 1;
    }
  }

  // If no match found, return generic
  return {
    industry: 'Unknown',
    subIndustry: 'General',
    confidence: 30,
  };
}

// ═══════════════════════════════════════════════════════════════════════════
// Smart Entity Adder - Searches and adds if not found
// ═══════════════════════════════════════════════════════════════════════════

export async function smartAddEntity(
  name: string,
  searchResults: { title: string; description: string; url: string }[]
): Promise<DatasetUpdateResult> {
  // Check if exists
  const exists = await entityExists(name);
  if (exists) {
    return {
      success: false,
      message: `Entity "${name}" already exists`,
      alreadyExists: true,
    };
  }

  // Identify industry from search results
  const industryData = await identifyIndustry(name, searchResults);

  if (!industryData || industryData.confidence < 50) {
    return {
      success: false,
      message: `Could not confidently identify industry for "${name}"`,
    };
  }

  // Add entity
  return addEntity({
    name,
    industry: industryData.industry,
    subIndustry: industryData.subIndustry,
    source: 'google_search',
    confidence: industryData.confidence,
  });
}

// ═══════════════════════════════════════════════════════════════════════════
// Get All Entities (Combined)
// ═══════════════════════════════════════════════════════════════════════════

export async function getAllEntities(): Promise<(ExcelCompanyRecord | NewEntityData)[]> {
  const excelRecords = await loadIndianCompaniesFromExcel();
  await loadDynamicEntities();
  
  return [...excelRecords, ...dynamicEntities];
}

// ═══════════════════════════════════════════════════════════════════════════
// Search in All Entities
// ═══════════════════════════════════════════════════════════════════════════

export async function searchAllEntities(query: string): Promise<(ExcelCompanyRecord | NewEntityData)[]> {
  const allEntities = await getAllEntities();
  const normalizedQuery = query.toLowerCase().trim();

  return allEntities.filter(e => {
    const name = 'companyName' in e ? e.companyName : e.name;
    const normalizedName = 'normalizedName' in e ? e.normalizedName : name.toLowerCase().replace(/\s+/g, '_');
    
    return name.toLowerCase().includes(normalizedQuery) ||
           normalizedName?.includes(normalizedQuery) ||
           e.industry?.toLowerCase().includes(normalizedQuery);
  });
}

// ═══════════════════════════════════════════════════════════════════════════
// Statistics
// ═══════════════════════════════════════════════════════════════════════════

export async function getDatasetStats(): Promise<{
  excelCount: number;
  dynamicCount: number;
  totalCount: number;
  industries: string[];
}> {
  const excelRecords = await loadIndianCompaniesFromExcel();
  await loadDynamicEntities();

  const allIndustries = new Set<string>();
  excelRecords.forEach(e => allIndustries.add(e.industry));
  dynamicEntities.forEach(e => allIndustries.add(e.industry));

  return {
    excelCount: excelRecords.length,
    dynamicCount: dynamicEntities.length,
    totalCount: excelRecords.length + dynamicEntities.length,
    industries: Array.from(allIndustries).sort(),
  };
}
