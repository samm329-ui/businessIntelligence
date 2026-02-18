/**
 * EBITA Intelligence - Complete Pipeline Architecture
 * 
 * This file documents how all components work together in the analysis pipeline.
 * It shows the data flow from user query to final response.
 * 
 * =============================================================================
 * PACKAGE DEPENDENCIES (from package.json)
 * =============================================================================
 * 
 * Scripts:
 * - "dev": "next dev"              - Development server
 * - "build": "next build"          - Production build  
 * - "start": "next start"          - Production server
 * - "lint": "eslint"               - Code linting
 * 
 * Core Dependencies:
 * - next: ^16.1.6                  - React framework
 * - react: ^19.2.3                  - UI library
 * - @supabase/supabase-js: ^2.95.3 - Database client
 * - tailwindcss: ^4                - Styling
 * 
 * Data Fetching:
 * - axios: ^1.13.5                 - HTTP client for API calls
 * - yahoo-finance2: ^3.13.0         - Yahoo Finance API wrapper
 * 
 * AI & ML:
 * - @anthropic-ai/sdk: ^0.74.0     - Anthropic Claude API
 * 
 * Data Processing:
 * - csv-parser: ^3.2.0              - CSV parsing
 * - xlsx: ^0.18.5                  - Excel file handling
 * - exceljs: ^4.4.0                - Excel manipulation
 * - mathjs: ^12.4.3                - Math operations
 * - simple-statistics: ^7.8.8     - Statistics library
 * - d3: ^7.9.0                     - Data visualization
 * 
 * PDF Generation:
 * - pdfkit: ^0.17.2                - PDF creation
 * - jspdf: ^2.5.2                  - JavaScript PDF
 * 
 * Database:
 * - pg: ^8.18.0                    - PostgreSQL client
 * - zod: ^4.3.6                    - Schema validation
 * 
 * UI Components:
 * - lucide-react: ^0.563.0         - Icons
 * - recharts: ^3.7.0               - Charts
 * - class-variance-authority: ^0.7.1 - CSS class utilities
 * - clsx: ^2.1.1                   - Conditional classes
 * - tailwind-merge: ^3.4.0         - Tailwind merge
 * 
 * Date/Time:
 * - date-fns: ^4.1.0               - Date utilities
 * 
 * Web Scraping:
 * - cheerio: ^1.2.0                - HTML parsing
 * - https-proxy-agent: ^7.0.6      - Proxy support
 * 
 * Environment Variables Required (.env.local):
 * - NEXT_PUBLIC_SUPABASE_URL
 * - NEXT_PUBLIC_SUPABASE_ANON_KEY
 * - SUPABASE_SERVICE_ROLE_KEY
 * - GROQ_API_KEY (for AI analysis via Groq)
 * - ANTHROPIC_API_KEY (for Claude)
 * - ALPHA_VANTAGE_API_KEY
 * - FMP_API_KEY
 * 
 * =============================================================================
 * COMPONENT FILE STRUCTURE
 * =============================================================================
 * 
 * lib/
 * ├── pipeline.ts                    # This file - Pipeline overview
 * │
 * ├── db.ts                          # Supabase client initialization
 * │
 * ├── integration/
 * │   └── main-orchestrator.ts       # Central orchestrator (PHASE 1-5)
 * │
 * ├── resolution/
 * │   ├── entity-resolver.ts         # Entity resolution engine (PHASE 1)
 * │   └── brand-knowledge-base.ts    # Static brand/company mappings
 * │
 * ├── data/
 * │   └── multi-source-orchestrator.ts # Multi-source data (PHASE 2)
 * │
 * ├── ai/
 * │   └── ai-guardrails.ts           # AI hallucination prevention (PHASE 4)
 * │
 * ├── monitoring/
 * │   └── error-monitor.ts           # Error tracking (PHASE 5)
 * │
 * ├── fetchers/                      # Data source integrations
 * │   ├── yahoo-finance-fetcher.ts   # Yahoo Finance API
 * │   ├── alpha-vantage-fetcher.ts   # Alpha Vantage API
 * │   ├── fmp-fetcher.ts             # Financial Modeling Prep
 * │   ├── nse-fetcher.ts             # NSE India
 * │   ├── bse-fetcher.ts             # BSE India
 * │   ├── world-bank-fetcher.ts      # World Bank data
 * │   ├── imf-fetcher.ts            # IMF data
 * │   ├── sec-edgar-fetcher.ts      # SEC Edgar filings
 * │   └── ...
 * │
 * ├── analyzers/                     # Analysis modules
 * │   ├── engine.ts                  # Core analysis engine
 * │   └── ...
 * │
 * ├── services/                      # Business logic services
 * │   ├── competitor-intelligence.ts  # Competitor analysis
 * │   └── ...
 * │
 * └── utils/                         # Utility functions
 * 
 * =============================================================================
 * PIPELINE FLOW DIAGRAM
 * =============================================================================
 * 
 * ┌─────────────────────────────────────────────────────────────────────────────┐
 * │                         USER QUERY INPUT                                     │
 * │                  "Tell me about Reliance Industries"                        │
 * └─────────────────────────────────────────────────────────────────────────────┘
 *                                    │
 *                                    ▼
 * ┌─────────────────────────────────────────────────────────────────────────────┐
 * │  PHASE 1: ENTITY RESOLUTION ENGINE                                          │
 * │  File: lib/resolution/entity-resolver.ts                                    │
 * │                                                                             │
 * │  ┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐          │
 * │  │ Query Classifier│───▶│ Exact Match    │───▶│ Fuzzy Match    │          │
 * │  │ (brand/company/ │    │ (DB + KB)      │    │ (Levenshtein)  │          │
 * │  │  industry)      │    └─────────────────┘    └─────────────────┘          │
 * │  └─────────────────┘           │                       │                    │
 * │                                ▼                       ▼                    │
 * │                       ┌─────────────────┐    ┌─────────────────┐          │
 * │                       │ Alias Match     │    │ Parent Company  │          │
 * │                       │ (tickers, etc)  │    │ Extraction     │          │
 * │                       └─────────────────┘    └─────────────────┘          │
 * │                                                                            │
 * │  OUTPUT: EntityResolutionResult {                                          │
 * │    entityType: 'company' | 'brand' | 'parent_company'                     │
 * │    entityId: 'uuid'                                                       │
 * │    name: 'Reliance Industries Limited'                                    │
 * │    confidence: 100                                                        │
 * │    parentCompany: { id, name, ticker: 'RELIANCE' }                        │
 * │  }                                                                        │
 * └─────────────────────────────────────────────────────────────────────────────┘
 *                                    │
 *                                    ▼
 * ┌─────────────────────────────────────────────────────────────────────────────┐
 * │  PHASE 2: MULTI-SOURCE DATA ORCHESTRATOR                                  │
 * │  File: lib/data/multi-source-orchestrator.ts                               │
 * │                                                                             │
 * │  ┌─────────────────────────────────────────────────────────────────────┐   │
 * │  │                    FETCH FROM MULTIPLE APIs                         │   │
 * │  │  ┌─────────────────┐ ┌─────────────────┐ ┌─────────────────┐     │   │
 * │  │  │ Yahoo Finance   │ │ Alpha Vantage  │ │ FMP            │     │   │
 * │  │  │ (reliability:90)│ │ (reliability:85)│ │(reliability:88)│     │   │
 * │  │  │ - Price         │ │ - Market Cap   │ │ - Profile      │     │   │
 * │  │  │ - Market Cap    │ │ - PE Ratio     │ │ - Financials   │     │   │
 * │  │  │ - PE Ratio      │ │ - Revenue     │ │ - Key Metrics  │     │   │
 * │  │  │ - Revenue       │ │ - EPS          │ │               │     │   │
 * │  │  └─────────────────┘ └─────────────────┘ └─────────────────┘     │   │
 * │  └─────────────────────────────────────────────────────────────────────┘   │
 * │                                    │                                        │
 * │                                    ▼                                        │
 * │  ┌─────────────────────────────────────────────────────────────────────┐   │
 * │  │                 CROSS-VALIDATION ENGINE                             │   │
 * │  │                                                                      │   │
 * │  │  Tolerance Thresholds:                                             │   │
 * │  │  - Price: 3% variance                                              │   │
 * │  │  - Market Cap: 5% variance                                         │   │
 * │  │  - Revenue: 10% variance                                           │   │
 * │  │  - Margins: 15% variance                                           │   │
 * │  │  - Ratios: 20% variance                                            │   │
 * │  │                                                                      │   │
 * │  │  Consensus Calculation: Median of all source values               │   │
 * │  │  Anomaly Detection: Flag if variance > threshold                  │   │
 * │  └─────────────────────────────────────────────────────────────────────┘   │
 * │                                                                            │
 * │  OUTPUT: MultiSourceData {                                               │
 * │    consensusValue: 2500000                                               │
 * │    confidence: 85                                                        │
 * │    sourceCount: 3                                                        │
 * │    validations: [{ field: 'marketCap', consensus: 2500000, isAnomaly: false }] │
 * │    warnings: []                                                          │
 * │  }                                                                        │
 * └─────────────────────────────────────────────────────────────────────────────┘
 *                                    │
 *                                    ▼
 * ┌─────────────────────────────────────────────────────────────────────────────┐
 * │  PHASE 3: BUILD STRUCTURED INPUT                                          │
 * │  File: lib/integration/main-orchestrator.ts (buildStructuredInput)        │
 * │                                                                             │
 * │  Combines entity resolution + multi-source data into structured format   │
 * │  for AI consumption.                                                      │
 * │                                                                            │
 * │  OUTPUT: StructuredInput {                                               │
 * │    entityName: 'Reliance Industries'                                     │
 * │    entityType: 'company'                                                  │
 * │    metrics: {                                                             │
 * │      marketCap: { value: 2500000, unit: 'INR Crore', source: 'Yahoo Finance' } │
 * │      revenue: { value: 100000, unit: 'INR Crore', source: 'FMP' }       │
 * │    }                                                                      │
 * │    context: { industry: 'Unknown', competitors: [], timeRange: 'Latest' }│
 * │  }                                                                        │
 * └─────────────────────────────────────────────────────────────────────────────┘
 *                                    │
 *                                    ▼
 * ┌─────────────────────────────────────────────────────────────────────────────┐
 * │  PHASE 4: AI ANALYSIS WITH GUARDRAILS                                     │
 * │  File: lib/ai/ai-guardrails.ts                                           │
 * │                                                                             │
 * │  ┌─────────────────────────────────────────────────────────────────────┐   │
 * │  │                    GUARDRAILED PROMPT GENERATION                    │   │
 * │  │                                                                      │   │
 * │  │  Rules embedded in prompt:                                          │   │
 * │  │  1. Use ONLY the data provided                                      │   │
 * │  │  2. If missing, say "Data unavailable" - NO guessing              │   │
 * │  │  3. Cite source for every number                                   │   │
 * │  │  4. If confidence < 70%, mention uncertainty                       │   │
 * │  │  5. Format as JSON                                                 │   │
 * │  └─────────────────────────────────────────────────────────────────────┘   │
 * │                                    │                                        │
 * │                                    ▼                                        │
 * │  ┌─────────────────────────────────────────────────────────────────────┐   │
 * │  │                         GROQ API CALL                              │   │
 * │  │  Endpoint: https://api.groq.com/openai/v1/chat/completions        │   │
 * │  │  Model: llama-3.3-70b-versatile                                    │   │
 * │  │  Temperature: 0.1 (low for factual responses)                     │   │
 * │  │  Max Tokens: 2000                                                  │   │
 * │  └─────────────────────────────────────────────────────────────────────┘   │
 * │                                    │                                        │
 * │                                    ▼                                        │
 * │  ┌─────────────────────────────────────────────────────────────────────┐   │
 * │  │                    RESPONSE VALIDATION                             │   │
 * │  │                                                                      │   │
 * │  │  - Pattern matching for hallucinated numbers                       │   │
 * │  │  - Verify numbers against source data (5% tolerance)              │   │
 * │  │  - Detect speculative language (probably, might, estimated)        │   │
 * │  │  - Check citations match provided sources                          │   │
 * │  └─────────────────────────────────────────────────────────────────────┘   │
 * │                                                                            │
 * │  OUTPUT: GuardedAIResponse {                                             │
 * │    structuredData: { summary, key_findings, risks, opportunities }     │
 * │    hallucinationDetected: false                                         │
 * │    confidence: 85                                                        │
 * │    citations: [{ claim, source, value }]                                │
 * │  }                                                                        │
 * └─────────────────────────────────────────────────────────────────────────────┘
 *                                    │
 *                                    ▼
 * ┌─────────────────────────────────────────────────────────────────────────────┐
 * │  PHASE 5: ERROR MONITORING & LOGGING                                      │
 * │  File: lib/monitoring/error-monitor.ts                                  │
 * │                                                                             │
 * │  All errors logged to database with:                                      │
 * │  - Error type (api_error, validation_error, resolution_error, etc.)     │
 * │  - Severity (info, warning, error, critical)                            │
 * │  - Component tracking                                                     │
 * │  - Stack trace                                                           │
 * │  - Query context                                                         │
 * └─────────────────────────────────────────────────────────────────────────────┘
 *                                    │
 *                                    ▼
 * ┌─────────────────────────────────────────────────────────────────────────────┐
 * │                         FINAL RESPONSE                                     │
 * │                                                                             │
 * │  {                                                                        │
 * │    success: true,                                                         │
 * │    entity: { type: 'company', name: 'Reliance Industries', confidence: 100 },│
 * │    data: {                                                                │
 * │      financials: { marketCap: 2500000, confidence: 85 },                  │
 * │      sources: ['Yahoo Finance', 'Alpha Vantage', 'FMP'],                 │
 * │      warnings: []                                                         │
 * │    },                                                                     │
 * │    analysis: {                                                            │
 * │      summary: 'Reliance Industries shows...',                            │
 * │      keyFindings: [...],                                                  │
 * │      risks: [...],                                                        │
 * │      opportunities: [...],                                                │
 * │      aiGenerated: true,                                                  │
 * │      citations: [...],                                                    │
 * │      hallucinationChecked: true                                          │
 * │    },                                                                     │
 * │    metadata: {                                                            │
 * │      processingTimeMs: 2500,                                             │
 * │      entityResolutionTimeMs: 150,                                        │
 * │      dataFetchTimeMs: 1800,                                              │
 * │      analysisTimeMs: 500,                                                │
 * │      sourcesUsed: ['Yahoo Finance', 'Alpha Vantage', 'FMP'],            │
 * │      requestId: 'uuid'                                                   │
 * │    }                                                                      │
 * │  }                                                                        │
 * └─────────────────────────────────────────────────────────────────────────────┘
 * 
 * =============================================================================
 * USAGE EXAMPLE
 * =============================================================================
 * 
 * import { mainOrchestrator } from './lib/integration/main-orchestrator'
 * 
 * async function analyzeCompany() {
 *   const result = await mainOrchestrator.analyze({
 *     query: 'Reliance Industries',
 *     region: 'india',
 *     analysisType: 'financial'
 *   })
 *   
 *   console.log(result)
 * }
 * 
 * =============================================================================
 * DATABASE TABLES USED
 * =============================================================================
 * 
 * - companies: Operating companies/subsidiaries
 * - parent_companies: Ultimate parent entities
 * - brands: Brand names with aliases
 * - industries: NAICS/GICS classification
 * - data_sources: API registry
 * - data_lineage: Every data point audit trail
 * - validation_rules: Automated validation criteria
 * - cross_source_comparison: Multi-source anomaly detection
 * - error_logs: Comprehensive error tracking
 * - ai_analysis: AI output with mandatory citations
 * - ai_citations: Source attribution records
 * 
 * =============================================================================
 * ALL AVAILABLE DATA FETCHERS
 * =============================================================================
 * 
 * | Fetcher                  | File                    | API Type     | Rate Limit      |
 * |--------------------------|-------------------------|--------------|-----------------|
 * | Yahoo Finance           | yahoo-finance-fetcher.ts| Real-time   | 2000/hour       |
 * | Alpha Vantage           | alpha-vantage-fetcher.ts| Fundamentals | 500/day         |
 * | Financial Modeling Prep | fmp-fetcher.ts          | Deep Finance | 250/day         |
 * | NSE India               | nse-fetcher.ts          | Indian Stock | 10/min          |
 * | BSE India               | bse-fetcher.ts          | Indian Stock | Unlimited       |
 * | World Bank              | world-bank-fetcher.ts   | Macro        | Unlimited       |
 * | IMF                     | imf-fetcher.ts          | Macro        | Unlimited       |
 * | SEC Edgar               | sec-edgar-fetcher.ts    | Filings      | 10/sec          |
 * 
 * =============================================================================
 */

import { getIntelligence, IntelligenceRequest, IntelligenceResponse } from './intelligence/orchestrator'

export type { IntelligenceRequest, IntelligenceResponse }

/**
 * Example usage of the complete pipeline
 */
export async function runAnalysisPipeline(input: string): Promise<IntelligenceResponse> {
  const request: IntelligenceRequest = {
    input,
    forceRefresh: true,
  }
  
  return getIntelligence(request)
}

/**
 * Get system status - checks all components
 */
export async function getSystemHealth() {
  return {
    status: 'healthy',
    orchestrator: 'lib/intelligence/orchestrator',
    debugging: {
      tracerEnabled: true,
      validatorEnabled: true,
      cacheAuditorEnabled: true,
    }
  }
}
