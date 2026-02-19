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

  // STEP 1: Try Groq AI classification first (more accurate)
  const groqClassification = await classifyIndustryWithGroq(name, searchResults);
  if (groqClassification && groqClassification.confidence >= 60) {
    return groqClassification;
  }

  // STEP 2: Fallback to regex patterns if Groq fails or has low confidence
  const industryPatterns: Record<string, { industry: string; subIndustry: string }> = {
    'software|saas|technology company|it services|cloud computing': { industry: 'Information Technology', subIndustry: 'Software' },
    'bank|financial services|insurance|fintech|nbfc': { industry: 'Financial Services', subIndustry: 'Banking' },
    'pharma|pharmaceutical|biotech|healthcare|medical': { industry: 'Healthcare', subIndustry: 'Pharmaceuticals' },
    'automobile|automotive|car|vehicle|ev|electric vehicle': { industry: 'Automotive', subIndustry: 'Automobile Manufacturers' },
    'e-commerce|online retail|marketplace': { industry: 'E-commerce', subIndustry: 'Online Retail' },
    'telecom|telecommunication|mobile|broadband': { industry: 'Telecommunications', subIndustry: 'Wireless' },
    'oil refiner|petroleum|oil & gas|oil and gas|fuel|refinery': { industry: 'Energy', subIndustry: 'Oil & Gas' },
    'energy company|oil company|gas company': { industry: 'Energy', subIndustry: 'Oil & Gas' },
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
        confidence: 70,
      };
    }
  }

  // If no match found, return Unknown (never default to IT)
  return {
    industry: 'Unknown',
    subIndustry: 'General',
    confidence: 20,
  };
}

/**
 * Classify industry using Groq AI based on search results
 * This is more accurate than regex patterns
 */
async function classifyIndustryWithGroq(
  name: string,
  searchResults: { title: string; description: string; url: string }[]
): Promise<{ industry: string; subIndustry: string; confidence: number } | null> {
  try {
    // Prepare search snippets
    const searchSnippets = searchResults
      .slice(0, 3)
      .map(r => `${r.title}: ${r.description}`)
      .join('\n\n');

    const classificationPrompt = `Based on these search results about "${name}", determine the industry classification.

Search results:
${searchSnippets}

Analyze the search results and determine:
1. What sector is this company/entity in?
2. What is the specific industry?
3. What is the sub-industry/niche?

Examples:
- Bharat Petroleum → Energy > Oil & Gas > Oil Refining & Marketing
- TCS → Technology > IT Services > Software Consulting
- HDFC Bank → Financial Services > Banking > Private Banking
- Zepto → Consumer > Retail > Quick Commerce

Respond ONLY in this JSON format:
{
  "sector": "Energy",
  "industry": "Oil & Gas",
  "subIndustry": "Oil Refining & Marketing",
  "confidence": 85,
  "reasoning": "Brief explanation of why"
}

Important:
- If the search results clearly mention "oil", "petroleum", "refinery", "fuel" → classify as Energy/Oil & Gas
- If the search results clearly mention "software", "IT services", "technology company" → classify as Technology/IT
- If unclear or mixed signals, set confidence below 50
- Never guess - if truly unclear, return "Unknown"`;

    const apiKey = process.env.GROQ_API_KEY;
    if (!apiKey) {
      console.warn('[IndustryClassification] GROQ_API_KEY not set, skipping AI classification');
      return null;
    }

    const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: 'meta-llama/llama-4-scout-17b-16e-instruct',
        messages: [
          {
            role: 'system',
            content: 'You are an industry classification expert. Analyze search results and classify companies accurately. Respond only in JSON format.',
          },
          {
            role: 'user',
            content: classificationPrompt,
          },
        ],
        temperature: 0.1,
        max_tokens: 500,
        response_format: { type: 'json_object' },
      }),
    });

    if (!response.ok) {
      console.warn('[IndustryClassification] Groq API error:', response.status);
      return null;
    }

    const data = await response.json();
    const content = data.choices[0]?.message?.content;
    
    if (!content) {
      return null;
    }

    const classification = JSON.parse(content);
    
    // Validate the response
    if (!classification.industry || classification.confidence < 50) {
      console.log(`[IndustryClassification] Low confidence (${classification.confidence}%) for ${name}, returning Unknown`);
      return {
        industry: 'Unknown',
        subIndustry: 'General',
        confidence: classification.confidence || 30,
      };
    }

    console.log(`[IndustryClassification] Groq classified ${name} as ${classification.industry} (${classification.confidence}%)`);
    
    return {
      industry: classification.industry,
      subIndustry: classification.subIndustry || 'General',
      confidence: classification.confidence,
    };

  } catch (error) {
    console.error('[IndustryClassification] Error:', error);
    return null;
  }
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
