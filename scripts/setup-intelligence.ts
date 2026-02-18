/**
 * EBITA Intelligence System - Setup and Initialization
 * 
 * This script initializes the intelligence system:
 * 1. Creates necessary directories
 * 2. Loads all datasets
 * 3. Sets up caching
 * 4. Validates configuration
 * 
 * Run: npx ts-node scripts/setup-intelligence.ts
 * Or: node scripts/setup-intelligence.js
 */

import * as fs from 'fs';
import * as path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Configuration
const CONFIG = {
  directories: [
    'data/versions',
    'data/cache',
    'datasets/temp',
    'logs',
  ],
  requiredFiles: [
    '.env.local',
  ],
  datasets: {
    excel: 'C:\\Users\\jishu\\Downloads\\Indian_Industry_Companies_Database.xlsx',
    csv: 'datasets/all_real_companies_combined.csv',
  }
};

// ANSI Colors
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m',
};

function log(message: string, color: keyof typeof colors = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

function logSection(title: string) {
  console.log('\n' + '='.repeat(60));
  log(title, 'cyan');
  console.log('='.repeat(60));
}

// ═══════════════════════════════════════════════════════════════════════════
// Check Environment Variables
// ═══════════════════════════════════════════════════════════════════════════

async function checkEnvironment() {
  logSection('Checking Environment Configuration');
  
  const envPath = path.resolve(process.cwd(), '.env.local');
  
  if (!fs.existsSync(envPath)) {
    log('⚠️  .env.local not found!', 'yellow');
    log('Creating from .env.example...', 'blue');
    
    const examplePath = path.resolve(process.cwd(), '.env.example');
    if (fs.existsSync(examplePath)) {
      fs.copyFileSync(examplePath, envPath);
      log('✅ Created .env.local from template', 'green');
      log('📝 Please edit .env.local and add your API keys', 'yellow');
    } else {
      log('❌ .env.example not found!', 'red');
    }
  } else {
    log('✅ .env.local found', 'green');
  }

  // Check required variables
  const required = ['GROQ_API_KEY'];
  const missing = required.filter(key => !process.env[key]);
  
  if (missing.length > 0) {
    log(`\n⚠️  Missing required environment variables:`, 'yellow');
    missing.forEach(key => log(`   - ${key}`, 'yellow'));
    log('\nThe system will work with limited functionality', 'yellow');
    log('Add API keys to .env.local for full features', 'blue');
  } else {
    log('\n✅ All required environment variables set', 'green');
  }

  // Check optional variables
  const optional = [
    'GOOGLE_CUSTOM_SEARCH_API_KEY',
    'NEWSAPI_KEY',
    'SERPAPI_KEY',
    'OPENAI_API_KEY',
  ];
  
  const setOptional = optional.filter(key => process.env[key]);
  
  if (setOptional.length > 0) {
    log(`\n✅ Optional API keys configured (${setOptional.length}/${optional.length}):`, 'green');
    setOptional.forEach(key => log(`   ✓ ${key}`, 'green'));
  }
  
  const missingOptional = optional.filter(key => !process.env[key]);
  if (missingOptional.length > 0) {
    log(`\n⚠️  Optional API keys not set (${missingOptional.length}/${optional.length}):`, 'yellow');
    missingOptional.forEach(key => log(`   - ${key}`, 'yellow'));
  }
}

// ═══════════════════════════════════════════════════════════════════════════
// Create Directories
// ═══════════════════════════════════════════════════════════════════════════

async function createDirectories() {
  logSection('Creating Required Directories');
  
  for (const dir of CONFIG.directories) {
    const fullPath = path.resolve(process.cwd(), dir);
    
    if (!fs.existsSync(fullPath)) {
      try {
        fs.mkdirSync(fullPath, { recursive: true });
        log(`✅ Created: ${dir}`, 'green');
      } catch (error: any) {
        log(`❌ Failed to create ${dir}: ${error.message}`, 'red');
      }
    } else {
      log(`✅ Exists: ${dir}`, 'blue');
    }
  }
}

// ═══════════════════════════════════════════════════════════════════════════
// Check Datasets
// ═══════════════════════════════════════════════════════════════════════════

async function checkDatasets() {
  logSection('Checking Datasets');
  
  // Check Excel file
  if (fs.existsSync(CONFIG.datasets.excel)) {
    const stats = fs.statSync(CONFIG.datasets.excel);
    const sizeMB = (stats.size / 1024 / 1024).toFixed(2);
    log(`✅ Excel Database: ${CONFIG.datasets.excel} (${sizeMB} MB)`, 'green');
  } else {
    log(`⚠️  Excel Database not found:`, 'yellow');
    log(`   ${CONFIG.datasets.excel}`, 'yellow');
    log(`   The system will use CSV and Google search fallback`, 'blue');
  }

  // Check CSV file
  const csvPath = path.resolve(process.cwd(), CONFIG.datasets.csv);
  if (fs.existsSync(csvPath)) {
    const stats = fs.statSync(csvPath);
    const sizeKB = (stats.size / 1024).toFixed(2);
    log(`✅ CSV Database: ${CONFIG.datasets.csv} (${sizeKB} KB)`, 'green');
  } else {
    log(`⚠️  CSV Database not found: ${CONFIG.datasets.csv}`, 'yellow');
  }
}

// ═══════════════════════════════════════════════════════════════════════════
// Initialize Datasets
// ═══════════════════════════════════════════════════════════════════════════

async function initializeDatasets() {
  logSection('Initializing Datasets');
  
  try {
    // Load Excel dataset
    log('Loading Excel dataset...', 'blue');
    const { loadIndianCompaniesFromExcel } = await import('../lib/datasets/load-excel-companies.js');
    const excelRecords = await loadIndianCompaniesFromExcel();
    log(`✅ Loaded ${excelRecords.length} companies from Excel`, 'green');
  } catch (error: any) {
    log(`⚠️  Excel dataset: ${error.message}`, 'yellow');
  }

  try {
    // Load CSV dataset
    log('Loading CSV dataset...', 'blue');
    const { loadCompanyDatabase } = await import('../lib/datasets/company-database.js');
    const csvLoaded = await loadCompanyDatabase();
    log(`✅ CSV dataset: ${csvLoaded ? 'Loaded' : 'Not loaded'}`, csvLoaded ? 'green' : 'yellow');
  } catch (error: any) {
    log(`⚠️  CSV dataset: ${error.message}`, 'yellow');
  }

  try {
    // Load dynamic entities
    log('Loading dynamic entities...', 'blue');
    const { loadDynamicEntities } = await import('../lib/dataset-manager/updater.js');
    const dynamicEntities = await loadDynamicEntities();
    log(`✅ Dynamic entities: ${dynamicEntities.length} loaded`, 'green');
  } catch (error: any) {
    log(`⚠️  Dynamic entities: ${error.message}`, 'yellow');
  }
}

// ═══════════════════════════════════════════════════════════════════════════
// Test API Connections
// ═══════════════════════════════════════════════════════════════════════════

async function testAPIs() {
  logSection('Testing API Connections');

  // Test Groq
  if (process.env.GROQ_API_KEY) {
    try {
      log('Testing Groq API...', 'blue');
      const response = await fetch('https://api.groq.com/openai/v1/models', {
        headers: { 'Authorization': `Bearer ${process.env.GROQ_API_KEY}` }
      });
      
      if (response.ok) {
        log('✅ Groq API: Connected', 'green');
      } else {
        log('❌ Groq API: Authentication failed', 'red');
      }
    } catch (error: any) {
      log(`❌ Groq API: ${error.message}`, 'red');
    }
  } else {
    log('⚠️  Groq API: Not configured', 'yellow');
  }

  // Test Google
  if (process.env.GOOGLE_CUSTOM_SEARCH_API_KEY) {
    log('✅ Google Custom Search: Configured', 'green');
  } else {
    log('⚠️  Google Custom Search: Not configured (will use DuckDuckGo)', 'yellow');
  }
}

// ═══════════════════════════════════════════════════════════════════════════
// Create Startup File
// ═══════════════════════════════════════════════════════════════════════════

async function createStartupFile() {
  logSection('Creating Startup Configuration');
  
  const startupContent = `// Auto-generated startup configuration
export const INTELLIGENCE_CONFIG = {
  initialized: true,
  timestamp: '${new Date().toISOString()}',
  version: '1.0.0',
};

export default INTELLIGENCE_CONFIG;
`;

  const startupPath = path.resolve(process.cwd(), 'lib', 'intelligence', 'config.ts');
  fs.writeFileSync(startupPath, startupContent);
  log('✅ Created: lib/intelligence/config.ts', 'green');
}

// ═══════════════════════════════════════════════════════════════════════════
// Print Summary
// ═══════════════════════════════════════════════════════════════════════════

function printSummary() {
  logSection('Setup Complete!');
  
  console.log(`
${colors.bright}${colors.green}✅ EBITA Intelligence System is ready!${colors.reset}

${colors.cyan}Next Steps:${colors.reset}
1. Edit ${colors.yellow}.env.local${colors.reset} and add your API keys
2. Run ${colors.yellow}npm run dev${colors.reset} to start the application
3. Test with: POST /api/intelligence
   { "input": "Your Company Name" }

${colors.cyan}API Endpoints:${colors.reset}
- POST /api/intelligence    - Full analysis
- PUT  /api/intelligence    - Quick check
- GET  /api/intelligence    - System status

${colors.cyan}Documentation:${colors.reset}
- INTELLIGENCE_SYSTEM_README.md - Full guide
- ARCHITECTURE.md               - System architecture
- .env.example                  - Configuration template

${colors.yellow}Required API Keys:${colors.reset}
1. GROQ_API_KEY (Free) - https://console.groq.com/keys
2. GOOGLE_CUSTOM_SEARCH_API_KEY (Free) - https://developers.google.com/custom-search/

${colors.blue}The system will work without API keys using:
- DuckDuckGo search (free, unlimited)
- Rule-based analysis (no AI)
- Local datasets only
${colors.reset}
  `);
}

// ═══════════════════════════════════════════════════════════════════════════
// Main Setup Function
// ═══════════════════════════════════════════════════════════════════════════

async function main() {
  console.log(`
${colors.bright}${colors.cyan}
╔════════════════════════════════════════════════════════════╗
║     EBITA INTELLIGENCE SYSTEM - SETUP                      ║
║     Business Intelligence with AI-Powered Analysis         ║
╚════════════════════════════════════════════════════════════╝
${colors.reset}
  `);

  try {
    await checkEnvironment();
    await createDirectories();
    await checkDatasets();
    await initializeDatasets();
    await testAPIs();
    await createStartupFile();
    printSummary();
    
    process.exit(0);
  } catch (error: any) {
    log(`\n❌ Setup failed: ${error.message}`, 'red');
    console.error(error);
    process.exit(1);
  }
}

// Run setup
main();
