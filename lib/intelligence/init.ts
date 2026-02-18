/**
 * Intelligence System Initialization
 * 
 * This module initializes the intelligence system when the app starts.
 * It loads all datasets, validates configuration, and prepares the system.
 */

import { loadIndianCompaniesFromExcel, getAllIndustries as getExcelIndustries } from '../datasets/load-excel-companies';
import { loadCompanyDatabase } from '../datasets/company-database';
import { loadDynamicEntities } from '../dataset-manager/updater';

export interface InitializationStatus {
  success: boolean;
  datasets: {
    excel: { loaded: boolean; count: number; industries: string[] };
    csv: { loaded: boolean };
    dynamic: { loaded: boolean; count: number };
  };
  apis: {
    groq: boolean;
    google: boolean;
    newsapi: boolean;
    serpapi: boolean;
  };
  ready: boolean;
  errors: string[];
}

let isInitialized = false;
let initializationStatus: InitializationStatus | null = null;

// ═══════════════════════════════════════════════════════════════════════════
// Initialize Intelligence System
// ═══════════════════════════════════════════════════════════════════════════

export async function initializeIntelligenceSystem(): Promise<InitializationStatus> {
  if (isInitialized && initializationStatus) {
    return initializationStatus;
  }

  console.log('\n🔧 Initializing EBITA Intelligence System...\n');

  const status: InitializationStatus = {
    success: true,
    datasets: {
      excel: { loaded: false, count: 0, industries: [] },
      csv: { loaded: false },
      dynamic: { loaded: false, count: 0 },
    },
    apis: {
      groq: !!process.env.GROQ_API_KEY,
      google: !!process.env.GOOGLE_CUSTOM_SEARCH_API_KEY,
      newsapi: !!process.env.NEWSAPI_KEY,
      serpapi: !!process.env.SERPAPI_KEY,
    },
    ready: false,
    errors: [],
  };

  // Load Excel Dataset
  try {
    console.log('📊 Loading Excel dataset...');
    const excelRecords = await loadIndianCompaniesFromExcel();
    status.datasets.excel.loaded = true;
    status.datasets.excel.count = excelRecords.length;
    status.datasets.excel.industries = getExcelIndustries();
    console.log(`✅ Excel: ${excelRecords.length} companies, ${status.datasets.excel.industries.length} industries`);
  } catch (error: any) {
    console.warn(`⚠️  Excel dataset: ${error.message}`);
    status.errors.push(`Excel: ${error.message}`);
  }

  // Load CSV Dataset
  try {
    console.log('📊 Loading CSV dataset...');
    status.datasets.csv.loaded = await loadCompanyDatabase();
    console.log(`✅ CSV: ${status.datasets.csv.loaded ? 'Loaded' : 'Not loaded'}`);
  } catch (error: any) {
    console.warn(`⚠️  CSV dataset: ${error.message}`);
    status.errors.push(`CSV: ${error.message}`);
  }

  // Load Dynamic Entities
  try {
    console.log('📊 Loading dynamic entities...');
    const dynamicEntities = await loadDynamicEntities();
    status.datasets.dynamic.loaded = true;
    status.datasets.dynamic.count = dynamicEntities.length;
    console.log(`✅ Dynamic: ${dynamicEntities.length} entities`);
  } catch (error: any) {
    console.warn(`⚠️  Dynamic entities: ${error.message}`);
    status.errors.push(`Dynamic: ${error.message}`);
  }

  // Check if system is ready
  const hasDataset = status.datasets.excel.loaded || status.datasets.csv.loaded;
  const hasAI = status.apis.groq || status.apis.google;
  
  status.ready = hasDataset;
  status.success = status.errors.length === 0 || hasDataset;

  // Log API status
  console.log('\n🔑 API Configuration:');
  console.log(`   Groq AI: ${status.apis.groq ? '✅' : '⚠️'}`);
  console.log(`   Google Search: ${status.apis.google ? '✅' : '⚠️'}`);
  console.log(`   NewsAPI: ${status.apis.newsapi ? '✅' : '⚠️'}`);
  console.log(`   SerpAPI: ${status.apis.serpapi ? '✅' : '⚠️'}`);

  // Log status
  if (status.ready) {
    console.log('\n✅ Intelligence System Ready!\n');
    if (!status.apis.groq) {
      console.log('⚠️  Note: Add GROQ_API_KEY to .env.local for AI analysis\n');
    }
    if (!status.apis.google) {
      console.log('⚠️  Note: Add Google API keys for better search results\n');
    }
  } else {
    console.log('\n❌ Intelligence System NOT ready - check errors above\n');
  }

  isInitialized = true;
  initializationStatus = status;
  
  return status;
}

// ═══════════════════════════════════════════════════════════════════════════
// Get Initialization Status
// ═══════════════════════════════════════════════════════════════════════════

export function getInitializationStatus(): InitializationStatus | null {
  return initializationStatus;
}

// ═══════════════════════════════════════════════════════════════════════════
// Check if System is Ready
// ═══════════════════════════════════════════════════════════════════════════

export function isSystemReady(): boolean {
  return isInitialized && (initializationStatus?.ready || false);
}

// ═══════════════════════════════════════════════════════════════════════════
// Reinitialize (Force reload)
// ═══════════════════════════════════════════════════════════════════════════

export async function reinitialize(): Promise<InitializationStatus> {
  isInitialized = false;
  initializationStatus = null;
  return initializeIntelligenceSystem();
}

// ═══════════════════════════════════════════════════════════════════════════
// Auto-initialize on module load (server-side only)
// ═══════════════════════════════════════════════════════════════════════════

if (typeof window === 'undefined') {
  // Only run on server
  initializeIntelligenceSystem().catch(console.error);
}

export default initializeIntelligenceSystem;
