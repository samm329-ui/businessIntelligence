# EBITA Intelligence System - Complete Architecture Documentation

## Table of Contents
1. [System Overview](#1-system-overview)
2. [Data Pipeline Architecture](#2-data-pipeline-architecture)
3. [Complete File Inventory & Actions](#3-complete-file-inventory--actions)
4. [Flow Diagrams](#4-flow-diagrams)
5. [Layer-Based Architecture](#5-layer-based-architecture)
6. [Core Engine Logic](#6-core-engine-logic)
7. [Core Concepts](#7-core-concepts)
8. [Data Sources & APIs](#8-data-sources--apis)
9. [Error Handling & Debugging](#9-error-handling--debugging)
10. [Configuration Reference](#10-configuration-reference)

---

## 1. System Overview

### 1.1 Project Purpose
EBITA Intelligence is a real-time business intelligence platform providing company and industry analysis through multi-source data aggregation, AI-powered insights, and comprehensive data validation.

### 1.2 Technology Stack
- **Frontend**: Next.js 16 + React 19 + Tailwind CSS 4
- **Backend**: Next.js API Routes + Python FastAPI Microservice
- **AI/ML**: Groq API (llama-3.3-70b-versatile)
- **Database**: Supabase (PostgreSQL)
- **External APIs**: Yahoo Finance, Alpha Vantage, Financial Modeling Prep, NSE India
- **Data Visualization**: Recharts
- **UI Components**: shadcn/ui

### 1.3 System Capabilities
- Real-time financial data aggregation
- Multi-source cross-validation with confidence scoring
- AI-powered analysis with anti-hallucination guardrails
- Comprehensive debugging and pipeline tracing
- Support for 995+ companies across 29 industries
- Coverage: India (NSE/BSE) + Global (NYSE/NASDAQ/LSE)

---

## 2. Data Pipeline Architecture

### 2.1 High-Level Pipeline Flow

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                         DATA PIPELINE FLOW                                   │
└─────────────────────────────────────────────────────────────────────────────┘

PHASE 1: INPUT PROCESSING
=========================
User Query (Company/Industry/Brand/Product)
    ↓
[Input Sanitization] → Remove special chars, normalize
    ↓
[Query Classification] → brand | company | industry | product
    ↓
[Entity Resolution] → Match to verified entity with confidence score


PHASE 2: ENTITY RESOLUTION
==========================
Resolution Pipeline:
    ↓
┌─────────────────────────────────────────────────────────┐
│ 1. EXACT MATCH CHECK                                    │
│    • Check master dataset (995 companies)              │
│    • Check brand mappings                              │
│    • Check industry classifications                    │
│    Confidence: 100%                                    │
└─────────────────────────────────────────────────────────┘
    ↓ Not Found
┌─────────────────────────────────────────────────────────┐
│ 2. FUZZY MATCH (Levenshtein Distance)                   │
│    • Threshold: 75% similarity                         │
│    • Check name variations                             │
│    • Check ticker symbols                              │
│    Confidence: 75-99%                                  │
└─────────────────────────────────────────────────────────┘
    ↓ Not Found
┌─────────────────────────────────────────────────────────┐
│ 3. ALIAS MATCHING                                       │
│    • Brand-to-company mappings                         │
│    • Product category matching                         │
│    • Parent company extraction                         │
│    Confidence: 60-90%                                  │
└─────────────────────────────────────────────────────────┘
    ↓ Not Found
┌─────────────────────────────────────────────────────────┐
│ 4. SECONDARY VERIFICATION (if confidence < 80%)        │
│    • Web search confirmation                           │
│    • Cross-reference multiple sources                  │
│    Confidence: Adjusted based on results               │
└─────────────────────────────────────────────────────────┘


PHASE 3: DATA ORCHESTRATION
===========================
Parallel Data Fetch Strategy:
    ↓
┌─────────────────────────────────────────────────────────────────────────┐
│ PRIORITY QUEUE (Lower number = Higher priority)                        │
├─────────────────────────────────────────────────────────────────────────┤
│ Priority 1.0 → API Realtime (Alpha Vantage, FMP, Yahoo Finance)       │
│ Priority 0.9 → Cache (Redis/Supabase, TTL: 24h)                       │
│ Priority 0.7 → Web Search (Google Custom Search API)                  │
│ Priority 0.6 → Crawlers (NSE/BSE scraping via Python service)         │
│ Priority 0.3 → Dataset (Classification context only)                  │
│ Priority 0.1 → Fallback (Last resort, low confidence)                 │
└─────────────────────────────────────────────────────────────────────────┘

Multi-Source Fetch (Parallel):
    ├─→ Yahoo Finance API (Global stocks, 78% reliability)
    ├─→ Alpha Vantage API (Global stocks, 75% reliability, 5/min limit)
    ├─→ Financial Modeling Prep (Global stocks, 76% reliability, 4/min limit)
    ├─→ NSE India API (Indian stocks, 88% reliability, 10/min limit)
    └─→ Python Service (NSE/BSE scraping, session-based)

Cross-Validation Logic:
    ↓
[Data Point Aggregation]
    ↓
[Outlier Detection] → Remove values >2 std dev from mean
    ↓
[Median Calculation] → Use median (not mean) for consensus
    ↓
[Variance Check] → Flag if variance >15% across sources
    ↓
[Confidence Score Assignment]
    • High (90-100%): Multiple sources agree, low variance
    • Medium (70-89%): 2-3 sources, moderate variance
    • Low (<70%): Single source or high variance


PHASE 4: AI ANALYSIS
====================
Guardrails Pipeline:
    ↓
[Input Validation] → Verify data completeness
    ↓
[Prompt Sanitization] → Escape special chars, validate JSON
    ↓
[Groq API Call]
    Model: llama-3.3-70b-versatile
    Temperature: 0.1 (low for factual accuracy)
    Max Tokens: 2000-3000
    JSON Mode: Enabled
    ↓
[Response Validation]
    ├─→ Check for speculative language ("might", "could", "probably")
    ├─→ Verify all numeric claims against source data
    ├─→ Ensure citations present for every metric
    └─→ Flag hallucinations (invented data)
    ↓
[Hallucination Detection] → AI-based verification of outputs
    ↓
[Output Post-Processing] → Format for frontend consumption


PHASE 5: OUTPUT & STORAGE
=========================
    ↓
[Cache Update] → Store results with 24h TTL
    ↓
[Response Construction] → Build JSON response
    ↓
[Frontend Rendering] → Dashboard display
    ↓
[Pipeline Logging] → Store trace for debugging
```

### 2.2 Pipeline Stages (Debug Trace Points)

```
STAGE_001: INPUT_RECEIVED
    - Action: Log raw user query
    - Data: timestamp, query_string, session_id

STAGE_002: QUERY_CLASSIFIED
    - Action: Classify query type
    - Data: classification (brand|company|industry|product)

STAGE_003: ENTITY_RESOLUTION_START
    - Action: Begin entity matching
    - Data: resolution_strategy

STAGE_004: EXACT_MATCH_ATTEMPT
    - Action: Check exact name/ticker match
    - Data: match_found (boolean), confidence

STAGE_005: FUZZY_MATCH_ATTEMPT
    - Action: Levenshtein distance calculation
    - Data: best_match, similarity_score

STAGE_006: ALIAS_MATCH_ATTEMPT
    - Action: Check brand/product aliases
    - Data: parent_company, aliases_checked

STAGE_007: SECONDARY_VERIFICATION (Conditional)
    - Action: Web search confirmation
    - Data: search_results, verification_confidence

STAGE_008: ENTITY_RESOLVED
    - Action: Final entity match
    - Data: resolved_entity, final_confidence, resolution_path

STAGE_009: CACHE_CHECK
    - Action: Check for cached results
    - Data: cache_hit (boolean), cache_age

STAGE_010: CACHE_HIT (if cached)
    - Action: Return cached data
    - Skip to: STAGE_022

STAGE_011: CACHE_MISS
    - Action: Proceed with data fetch
    - Data: cache_key, reason_for_miss

STAGE_012: DATA_SOURCE_SELECTION
    - Action: Prioritize data sources
    - Data: sources_selected, priority_order

STAGE_013: PARALLEL_FETCH_START
    - Action: Initiate parallel API calls
    - Data: api_calls_initiated[], timestamps

STAGE_014: YAHOO_FINANCE_FETCH
    - Action: Fetch from Yahoo Finance
    - Data: response_time, success/failure, data_points

STAGE_015: ALPHA_VANTAGE_FETCH
    - Action: Fetch from Alpha Vantage
    - Data: response_time, rate_limit_status, data_points

STAGE_016: FMP_FETCH
    - Action: Fetch from Financial Modeling Prep
    - Data: response_time, rate_limit_status, data_points

STAGE_017: NSE_INDIA_FETCH
    - Action: Fetch from NSE India
    - Data: response_time, session_status, data_points

STAGE_018: DATA_AGGREGATION
    - Action: Combine all source data
    - Data: source_count, data_completeness

STAGE_019: CROSS_VALIDATION
    - Action: Validate across sources
    - Data: variance_per_metric, outliers_flagged

STAGE_020: CONSENSUS_BUILDING
    - Action: Calculate median values
    - Data: consensus_values, confidence_scores

STAGE_021: DATASET_CONTEXT_LOAD
    - Action: Load industry/company context
    - Data: competitors[], industry_benchmarks[]

STAGE_022: AI_PROMPT_CONSTRUCTION
    - Action: Build AI prompt with guardrails
    - Data: prompt_length, context_tokens

STAGE_023: AI_API_CALL
    - Action: Call Groq API
    - Data: model, temperature, max_tokens

STAGE_024: AI_RESPONSE_RECEIVED
    - Action: Receive AI output
    - Data: response_time, token_usage

STAGE_025: OUTPUT_VALIDATION
    - Action: Validate AI output
    - Data: validation_errors[], hallucination_flags[]

STAGE_026: OUTPUT_CLEANUP
    - Action: Format and clean output
    - Data: cleanup_actions[]

STAGE_027: CACHE_UPDATE
    - Action: Store results in cache
    - Data: cache_key, ttl, storage_location

STAGE_028: FINAL_OUTPUT
    - Action: Return response to user
    - Data: response_size, total_processing_time
```

---

## 3. Complete File Inventory & Actions

### 3.1 Frontend Layer (Next.js App Router)

```
app/
├── api/
│   ├── analyze/
│   │   └── route.ts                    # Legacy analysis endpoint
│   │       ACTION: Handle POST requests for company analysis
│   │       INPUT: { company: string, industry?: string }
│   │       OUTPUT: { analysis: object, metadata: object }
│   │
│   ├── intelligence/
│   │   └── route.ts                    # Main intelligence API
│   │       ACTION: Process intelligence queries with full pipeline
│   │       INPUT: { query: string, options?: IntelligenceOptions }
│   │       OUTPUT: { result: IntelligenceResult, trace: PipelineTrace }
│   │
│   ├── companies/
│   │   └── route.ts                    # Company search endpoint
│   │       ACTION: Search and filter companies
│   │       INPUT: GET ?q=searchTerm&limit=10
│   │       OUTPUT: { companies: Company[], total: number }
│   │
│   ├── cache/
│   │   └── route.ts                    # Cache management API
│   │       ACTION: CRUD operations on cache
│   │       INPUT: GET/POST/DELETE with cache_key
│   │       OUTPUT: { status: string, data?: any }
│   │
│   └── health/
│       └── route.ts                    # System health check
│           ACTION: Return system status and component health
│           INPUT: GET /api/health
│           OUTPUT: { status: "healthy|degraded", components: {} }
│
├── analyze/
│   └── [industry]/
│       └── page.tsx                    # Dynamic analysis page
│           ACTION: Render industry analysis dashboard
│           INPUT: Route param: industry slug
│           OUTPUT: Rendered dashboard with tabs
│
├── landing/
│   └── page.tsx                        # Landing page
│       ACTION: Display marketing landing page
│
├── layout.tsx                          # Root layout with providers
│   ACTION: Wrap app with context providers and global styles
│
└── page.tsx                            # Home page with search
    ACTION: Display search interface and redirect to analysis
```

### 3.2 Component Layer

```
components/
├── dashboard/
│   ├── AnalysisDashboard.tsx           # Main dashboard container
│   │   ACTION: Orchestrate dashboard tabs and data flow
│   │   PROPS: { industry: string, initialData?: AnalysisData }
│   │
│   ├── SearchBar.tsx                   # Company search input
│   │   ACTION: Handle user search with autocomplete
│   │   PROPS: { onSearch: (query: string) => void, suggestions?: Company[] }
│   │
│   ├── tabs/
│   │   ├── OverviewTab.tsx             # Company overview display
│   │   │   ACTION: Render key metrics and summary
│   │   │
│   │   ├── CompetitorsTab.tsx          # Competitor analysis
│   │   │   ACTION: Display competitor comparison charts
│   │   │
│   │   ├── StrategiesTab.tsx           # Strategic insights
│   │   │   ACTION: Show AI-generated strategic recommendations
│   │   │
│   │   └── InvestorsTab.tsx            # Shareholder analysis
│   │       ACTION: Display shareholding patterns and investor info
│   │
│   └── charts/
│       ├── RevenueChart.tsx            # Revenue trend visualization
│       ├── ProfitMarginChart.tsx       # Margin analysis charts
│       ├── MarketCapChart.tsx          # Market cap comparison
│       └── CompetitorComparison.tsx    # Multi-metric competitor charts
│
└── ui/                                 # shadcn/ui primitives
    ├── button.tsx
    ├── card.tsx
    ├── input.tsx
    ├── tabs.tsx
    └── [40+ other UI components]
```

### 3.3 Core Logic Layer

```
lib/
├── intelligence/                       # Core Intelligence System
│   ├── index.ts                        # Main exports
│   │   ACTION: Export all intelligence modules
│   │
│   ├── types.ts                        # TypeScript definitions
│   │   ACTION: Define all intelligence-related types
│   │   KEY TYPES: IntelligenceQuery, IntelligenceResult, PipelineTrace
│   │
│   └── config.ts                       # Intelligence configuration
│       ACTION: Define default configs and thresholds
│       KEY CONFIGS: confidence_thresholds, rate_limits, cache_ttl
│
├── data/                               # Data Orchestration
│   ├── orchestrator.ts                 # Main data orchestrator
│   │   ACTION: Coordinate multi-source data fetching
│   │   KEY METHODS: fetchData(), prioritizeSources(), aggregateResults()
│   │
│   ├── multi-source-orchestrator.ts    # Cross-validation orchestrator
│   │   ACTION: Fetch from multiple sources and build consensus
│   │   KEY METHODS: fetchWithValidation(), calculateConsensus(), detectOutliers()
│   │
│   ├── cache-manager.ts                # Cache operations
│   │   ACTION: Manage cache storage and retrieval
│   │   KEY METHODS: get(), set(), invalidate(), checkFreshness()
│   │
│   └── priority-manager.ts             # Source priority management
│       ACTION: Manage data source priorities based on freshness needs
│       KEY METHODS: setRealtimePriority(), resetPriorities()
│
├── resolution/                         # Entity Resolution
│   └── entity-resolver.ts              # Main entity resolution logic
│       ACTION: Match user queries to verified entities
│       KEY METHODS:
│         - classifyQuery(): Determine query type
│         - exactMatch(): Check exact name/ticker match
│         - fuzzyMatch(): Levenshtein distance matching
│         - resolveAlias(): Map brands to companies
│         - verifyWithSearch(): Web search confirmation
│
├── fetchers/                           # External API fetchers
│   ├── yahoo-finance.ts                # Yahoo Finance API
│   │   ACTION: Fetch stock quotes and financials
│   │   ENDPOINTS: /quote, /financials, /balance-sheet
│   │
│   ├── alpha-vantage.ts                # Alpha Vantage API
│   │   ACTION: Fetch global stock data
│   │   ENDPOINTS: /query?function=TIME_SERIES_DAILY, /query?function=OVERVIEW
│   │
│   ├── fmp.ts                          # Financial Modeling Prep
│   │   ACTION: Fetch comprehensive financial data
│   │   ENDPOINTS: /quote, /income-statement, /balance-sheet-statement
│   │
│   ├── nse-india.ts                    # NSE India API
│   │   ACTION: Fetch Indian stock data
│   │   ENDPOINTS: /api/quote-equity, /api/corporate-info
│   │
│   └── web-search.ts                   # Google Custom Search
│       ACTION: Execute web searches for information
│       ENDPOINTS: /customsearch/v1
│
├── ai/                                 # AI & Prompt Systems
│   ├── ai-guardrails.ts                # Anti-hallucination system
│   │   ACTION: Validate AI inputs and outputs
│   │   KEY METHODS:
│   │     - validateInput(): Check data completeness
│   │     - validateOutput(): Detect hallucinations
│   │     - verifyClaims(): Cross-check numeric claims
│   │   RULES:
│   │     - "Use ONLY provided metrics"
│   │     - "If data missing, say 'Data unavailable' - DO NOT guess"
│   │     - "Cite source for every number mentioned"
│   │
│   ├── groq-client.ts                  # Groq API client
│   │   ACTION: Handle Groq API communication
│   │   CONFIG: model=llama-3.3-70b-versatile, temp=0.1, max_tokens=3000
│   │
│   ├── groq-prompts.ts                 # Prompt library
│   │   ACTION: Define all AI prompts
│   │   PROMPTS:
│   │     - companyAnalysis: Financial health assessment
│   │     - competitorAnalysis: Competitive landscape
│   │     - industryAnalysis: Market trends and benchmarks
│   │     - investorAnalysis: Shareholding insights
│   │     - hallucinationDetection: Output verification
│   │
│   └── prompt-builder.ts               # Dynamic prompt construction
│       ACTION: Build context-aware prompts
│       KEY METHODS: buildAnalysisPrompt(), sanitizeInput(), formatContext()
│
├── analyzers/                          # Analysis engines
│   ├── financial-analyzer.ts           # Financial metrics analysis
│   │   ACTION: Calculate financial ratios and trends
│   │   METRICS: EBITDA, P/E, ROE, Debt-to-Equity, etc.
│   │
│   ├── competitor-analyzer.ts          # Competitor comparison
│   │   ACTION: Compare company against competitors
│   │   OUTPUT: Relative positioning, gap analysis
│   │
│   └── trend-analyzer.ts               # Trend detection
│       ACTION: Identify historical trends
│       METHODS: Moving averages, YoY growth, momentum indicators
│
├── datasets/                           # Data loading
│   ├── company-database.ts             # CSV-based company DB
│   │   ACTION: Load and search 995 companies from CSV
│   │   SOURCE: datasets/all_real_companies_combined.csv
│   │   KEY METHODS: load(), search(), filterByIndustry()
│   │
│   ├── industry-dataset.ts             # Master industry dataset
│   │   ACTION: Manage 50+ verified companies with GICS/NAICS
│   │   KEY METHODS: getByTicker(), getByIndustry(), getCompetitors()
│   │
│   └── data-loader.ts                  # Generic data loader
│       ACTION: Load JSON/CSV files with caching
│       KEY METHODS: loadJSON(), loadCSV(), validateSchema()
│
└── debugging/                          # Debugging Infrastructure
    ├── pipeline-tracer.ts              # Pipeline tracing
    │   ACTION: Record every pipeline stage for debugging
    │   OUTPUT: logs/pipeline/req_[timestamp].json
    │   STAGES: 28 distinct trace points (see Section 2.2)
    │
    ├── data-validator.ts               # Data validation
    │   ACTION: Validate data ranges and consistency
    │   CHECKS:
    │     - Revenue: 1 Cr to 10 Lakh Cr (realistic range)
    │     - Contradictions: Profit > Revenue detection
    │     - Null overwrites: Prevent undefined overwrites
    │     - Currency normalization: Standardize to INR/USD
    │
    ├── cache-auditor.ts                # Cache auditing
    │   ACTION: Monitor cache freshness and TTL
    │   FEATURES:
    │     - TTL tracking (24h default)
    │     - Realtime priority mode
    │     - Transparency in output
    │
    └── logger.ts                       # Centralized logging
        ACTION: Structured logging across all modules
        LEVELS: error, warn, info, debug, trace
```

### 3.4 Python Microservice

```
python-service/
└── main.py                             # FastAPI application
    ACTION: Handle NSE/BSE data scraping
    
    ENDPOINTS:
    - POST /fetch/quote
      ACTION: Fetch company quotes from NSE/BSE
      INPUT: { symbol: string, exchange: "NSE"|"BSE" }
      OUTPUT: { quote: object, timestamp: string }
    
    - POST /fetch/financials
      ACTION: Fetch financial statements
      INPUT: { symbol: string, type: "income"|"balance"|"cashflow" }
      OUTPUT: { financials: object[], metadata: object }
    
    - POST /fetch/shareholders
      ACTION: Fetch shareholding pattern
      INPUT: { symbol: string, period: string }
      OUTPUT: { shareholders: object, changes: object }
    
    - POST /fetch/index-companies
      ACTION: Fetch index constituents
      INPUT: { index: string }
      OUTPUT: { constituents: string[], weights: object }
    
    KEY FUNCTIONS:
    - create_nse_session(): Initialize NSE session with cookies
    - fetch_with_retry(): Retry logic for failed requests
    - cross_validate(): Compare multiple sources for consensus
    - calculate_confidence(): Assign confidence scores
```

### 3.5 Dataset Files

```
datasets/
├── all_real_companies_combined.csv     # Master company list (995 companies)
│   ACTION: Provide comprehensive company database
│   COLUMNS: name, ticker, industry, country, exchange, sector
│
├── companies_master.csv                # Verified company subset
│   ACTION: High-confidence company data
│
├── industries_master.csv               # Industry classifications
│   ACTION: GICS and NAICS mappings
│   COLUMNS: industry_name, gics_code, naics_code, description
│
└── brands_master.csv                   # Brand mappings
    ACTION: Map brands to parent companies
    COLUMNS: brand_name, parent_company, product_categories

lib/industry/
└── industry-dataset.ts                 # 50+ verified companies
    ACTION: TypeScript company records with full metadata
    STRUCTURE: See CompanyRecord interface in Section 7
```

### 3.6 Configuration & Scripts

```
config/
├── api-config.ts                       # API configuration
│   ACTION: Define API endpoints and rate limits
│
├── constants.ts                        # System constants
│   ACTION: Define thresholds and limits
│   CONSTANTS:
│     - MAX_SOURCES: 10
│     - CACHE_TTL: 24 * 60 * 60 * 1000 (24h)
│     - FUZZY_THRESHOLD: 0.75
│     - HIGH_VARIANCE_THRESHOLD: 0.15
│
└── feature-flags.ts                    # Feature toggles
    ACTION: Enable/disable features

scripts/
├── db-setup.ts                         # Database initialization
│   ACTION: Create tables and indexes
│
├── migrate-data.ts                     # Data migration
│   ACTION: Migrate between versions
│
└── validate-datasets.ts                # Dataset validation
    ACTION: Verify CSV integrity and completeness
```

### 3.7 Database Schema

```
lib/db.ts                               # Database client
    ACTION: Prisma/Supabase client configuration
    
    TABLES:
    - companies
      id, ticker, name, legal_name, industry, sector, 
      market_cap, created_at, updated_at
    
    - analysis_cache
      id, query_hash, result_json, confidence, 
      created_at, expires_at, access_count
    
    - pipeline_logs
      id, request_id, trace_json, duration_ms, 
      success, error_message, created_at
    
    - api_calls
      id, source, endpoint, status_code, 
      response_time_ms, rate_limit_remaining, created_at
```

---

## 4. Flow Diagrams

### 4.1 End-to-End Request Flow

```
┌──────────┐     ┌──────────────┐     ┌────────────────┐     ┌─────────────┐
│          │     │              │     │                │     │             │
│  Client  │────▶│  Next.js API │────▶│  Intelligence  │────▶│   Entity    │
│          │     │   Routes     │     │   System       │     │  Resolver   │
│          │     │              │     │                │     │             │
└──────────┘     └──────────────┘     └────────────────┘     └──────┬──────┘
                                                                     │
                                                                     ▼
┌──────────┐     ┌──────────────┐     ┌────────────────┐     ┌─────────────┐
│          │     │              │     │                │     │  Master     │
│  Client  │◀────│   Response   │◀────│  AI Analysis   │◀────│   Dataset   │
│          │     │   Formatter  │     │   + Guardrails │     │  (Context)  │
│          │     │              │     │                │     │             │
└──────────┘     └──────────────┘     └────────────────┘     └─────────────┘
       ▲                                              ▲              ▲
       │                                              │              │
       └──────────────────────────────────────────────┘              │
                      │                                               │
                      ▼                                               │
       ┌───────────────────────────────────────────────────────────────┘
       │
       ▼
┌──────────────────────────────────────────────────────────────────────────┐
│                          DATA ORCHESTRATION                               │
├──────────────────────────────────────────────────────────────────────────┤
│                                                                           │
│   ┌──────────────┐   ┌──────────────┐   ┌──────────────┐   ┌───────────┐ │
│   │ Yahoo Finance│   │Alpha Vantage │   │     FMP      │   │  NSE      │ │
│   │     API      │   │     API      │   │     API      │   │   India   │ │
│   └──────┬───────┘   └──────┬───────┘   └──────┬───────┘   └─────┬─────┘ │
│          │                  │                  │                 │       │
│          └──────────────────┴──────────────────┴─────────────────┘       │
│                                    │                                      │
│                                    ▼                                      │
│                          ┌──────────────────┐                            │
│                          │ Cross-Validation │                            │
│                          │   Engine         │                            │
│                          └────────┬─────────┘                            │
│                                   │                                       │
│                                   ▼                                       │
│                          ┌──────────────────┐                            │
│                          │ Consensus Values │                            │
│                          │ + Confidence     │                            │
│                          └──────────────────┘                            │
│                                                                           │
└──────────────────────────────────────────────────────────────────────────┘
```

### 4.2 Entity Resolution Flow

```
                         ENTITY RESOLUTION FLOW
                         ====================

┌─────────────────┐
│  User Query     │  "Reliance" / "Jio" / "Oil" / "Telecom"
└────────┬────────┘
         │
         ▼
┌─────────────────────────────────────────────────────────┐
│ STEP 1: QUERY CLASSIFICATION                             │
│ ─────────────────────────                                │
│ Check query type:                                         │
│   • Exact company name?  → COMPANY                        │
│   • Brand name?          → BRAND                          │
│   • Industry term?       → INDUSTRY                       │
│   • Product category?    → PRODUCT                        │
└────────┬────────────────────────────────────────────────┘
         │
         ▼
┌─────────────────────────────────────────────────────────┐
│ STEP 2: EXACT MATCH (Confidence: 100%)                   │
│ ─────────────────────────────────────                    │
│ Check against:                                           │
│   ✓ Master dataset (995 companies)                       │
│   ✓ Company legal names                                  │
│   ✓ Ticker symbols (RELIANCE.NS, etc.)                   │
│                                                          │
│ MATCH? ───────Yes──────▶ RETURN entity with 100% conf    │
│   │                                                      │
│   No                                                     │
│   │                                                      │
│   ▼                                                      │
└────────┬────────────────────────────────────────────────┘
         │
         ▼
┌─────────────────────────────────────────────────────────┐
│ STEP 3: FUZZY MATCH (Confidence: 75-99%)                 │
│ ────────────────────────────────────────                 │
│ Calculate Levenshtein distance for all names             │
│ Threshold: 75% similarity                                │
│                                                          │
│ Examples:                                                │
│   "Relaince" → "Reliance" (1 char diff = 88%)           │
│   "TCS" → "Tata Consultancy" (alias match)              │
│                                                          │
│ MATCH ≥75%? ───Yes───▶ RETURN with calculated conf       │
│   │                                                      │
│   No                                                     │
│   │                                                      │
│   ▼                                                      │
└────────┬────────────────────────────────────────────────┘
         │
         ▼
┌─────────────────────────────────────────────────────────┐
│ STEP 4: ALIAS MATCHING (Confidence: 60-90%)              │
│ ─────────────────────────────────────────                │
│ Check:                                                   │
│   ✓ Brand-to-company mappings                            │
│   ✓ Product category associations                        │
│   ✓ Parent company relationships                         │
│                                                          │
│ Examples:                                                │
│   "Jio" → Reliance Industries (parent company)          │
│   "Pixel" → Google/Alphabet (brand mapping)             │
│   "SUV" → Automobile industry (category)                │
│                                                          │
│ MATCH FOUND? ──Yes───▶ RETURN with 60-90% conf           │
│   │                                                      │
│   No                                                     │
│   │                                                      │
│   ▼                                                      │
└────────┬────────────────────────────────────────────────┘
         │
         ▼
┌─────────────────────────────────────────────────────────┐
│ STEP 5: SECONDARY VERIFICATION (if conf < 80%)           │
│ ───────────────────────────────────────────────          │
│ Execute web search to confirm entity                     │
│ Cross-reference multiple search results                  │
│                                                          │
│ IF results confirm entity:                               │
│   → ADJUST confidence based on consensus                 │
│   → RETURN verified entity                               │
│                                                          │
│ IF no consensus:                                         │
│   → RETURN multiple suggestions                          │
│   → User clarification required                          │
└─────────────────────────────────────────────────────────┘
```

### 4.3 Data Cross-Validation Flow

```
                    DATA CROSS-VALIDATION FLOW
                    ==========================

┌─────────────────────────────────────────────────────────────────────┐
│                    PARALLEL DATA FETCH                               │
├─────────────────────────────────────────────────────────────────────┤
│                                                                      │
│   Yahoo Finance      Alpha Vantage        FMP          NSE India    │
│   ────────────       ────────────      ───────       ─────────      │
│      ↓                    ↓               ↓              ↓          │
│   $120.5B             $118.3B          $121.1B        $119.8B       │
│   [78% reliable]     [75% reliable]   [76% reliable]  [88% reliable]│
│      ↓                    ↓               ↓              ↓          │
└──────┬────────────────────┬───────────────┬──────────────┬───────────┘
       │                    │               │              │
       └────────────────────┴───────────────┴──────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────────────┐
│                    AGGREGATION & OUTLIER DETECTION                   │
├─────────────────────────────────────────────────────────────────────┤
│                                                                      │
│   Values: [$120.5B, $118.3B, $121.1B, $119.8B]                      │
│                                                                      │
│   Statistical Analysis:                                              │
│   • Mean: $119.9B                                                   │
│   • Median: $120.15B  ← USE THIS (outlier-resistant)                │
│   • Std Dev: $1.2B                                                  │
│                                                                      │
│   Outlier Check:                                                     │
│   • All values within 2 std dev of mean ✓                          │
│   • No outliers detected ✓                                          │
│                                                                      │
└───────────────────────────────┬─────────────────────────────────────┘
                                │
                                ▼
┌─────────────────────────────────────────────────────────────────────┐
│                    VARIANCE & CONSENSUS CALCULATION                  │
├─────────────────────────────────────────────────────────────────────┤
│                                                                      │
│   Variance Calculation:                                              │
│   • Range: $121.1B - $118.3B = $2.8B                                │
│   • Variance %: ($2.8B / $120.15B) × 100 = 2.33%                    │
│                                                                      │
│   Threshold Check:                                                   │
│   • High variance threshold: 15%                                     │
│   • Actual variance: 2.33%                                           │
│   • Result: LOW VARIANCE ✓                                          │
│                                                                      │
└───────────────────────────────┬─────────────────────────────────────┘
                                │
                                ▼
┌─────────────────────────────────────────────────────────────────────┐
│                    CONFIDENCE SCORE ASSIGNMENT                       │
├─────────────────────────────────────────────────────────────────────┤
│                                                                      │
│   Consensus Value: $120.15B (Median)                                │
│                                                                      │
│   Confidence Calculation:                                            │
│   • Source count: 4 (excellent coverage)                            │
│   • Variance: Low (2.33% < 15%)                                     │
│   • Source reliability: Weighted average 79.25%                     │
│                                                                      │
│   Final Confidence: 92% (HIGH)                                      │
│   Sources: Yahoo, AlphaVantage, FMP, NSE                            │
│   Flag: None (all checks passed)                                    │
│                                                                      │
└─────────────────────────────────────────────────────────────────────┘
```

### 4.4 AI Analysis Flow with Guardrails

```
                    AI ANALYSIS PIPELINE
                    ====================

┌─────────────────────────────────────────────────────────────────────┐
│ 1. INPUT PREPARATION                                                │
└─────────────────────────────────────────────────────────────────────┘
    │
    ▼
┌─────────────────────────────────────────────────────────────────────┐
│ Raw Data Input                                                      │
│ • Revenue: ₹240,000 Cr (Conf: 92%)                                  │
│ • EBITDA: ₹42,000 Cr (Conf: 88%)                                    │
│ • Competitors: [Company A, Company B]                               │
│ • Industry: Technology                                              │
└────────┬────────────────────────────────────────────────────────────┘
         │
         ▼
┌─────────────────────────────────────────────────────────────────────┐
│ 2. INPUT VALIDATION                                                 │
└─────────────────────────────────────────────────────────────────────┘
    │
    ├─▶ Check data completeness ─────────▶ PASS ✓
    ├─▶ Verify numeric ranges ───────────▶ PASS ✓
    ├─▶ Detect contradictions ───────────▶ PASS ✓
    └─▶ Validate JSON structure ─────────▶ PASS ✓
         │
         ▼
┌─────────────────────────────────────────────────────────────────────┐
│ 3. PROMPT SANITIZATION                                              │
└─────────────────────────────────────────────────────────────────────┘
    │
    ├─▶ Escape special characters
    ├─▶ Remove potential injection attempts
    ├─▶ Format numbers consistently
    └─▶ Add guardrail instructions:
        "USE ONLY PROVIDED METRICS"
        "IF DATA MISSING, SAY 'Data unavailable'"
        "CITE SOURCE FOR EVERY NUMBER"
         │
         ▼
┌─────────────────────────────────────────────────────────────────────┐
│ 4. GROQ API CALL                                                    │
└─────────────────────────────────────────────────────────────────────┘
    │
    ├─▶ Model: llama-3.3-70b-versatile
    ├─▶ Temperature: 0.1 (factual precision)
    ├─▶ Max Tokens: 3000
    ├─▶ JSON Mode: Enabled
    └─▶ Request sent...
         │
         ▼
┌─────────────────────────────────────────────────────────────────────┐
│ 5. RESPONSE VALIDATION                                              │
└─────────────────────────────────────────────────────────────────────┘
    │
    ├─▶ Check speculative language:
    │   ✗ "might increase" → FLAG
    │   ✗ "could be higher" → FLAG
    │   ✓ "increased by 15%" → PASS
    │
    ├─▶ Verify numeric claims:
    │   Claim: "Revenue grew 12%"
    │   Source data: Revenue change +12.3%
    │   Result: VERIFIED ✓
    │
    ├─▶ Check citations:
    │   Every metric must have [Source: Yahoo Finance] format
    │   Missing citations → FLAG
    │
    └─▶ Detect hallucinations:
        Compare AI output against input data
        New numbers not in input → HALLUCINATION
         │
         ▼
┌─────────────────────────────────────────────────────────────────────┐
│ 6. HALLUCINATION DETECTION                                          │
└─────────────────────────────────────────────────────────────────────┘
    │
    ├─▶ Scan for invented metrics
    ├─▶ Verify all company names exist
    ├─▶ Check financial figures match input
    └─▶ Flag suspicious statements
         │
         ├─▶ HALLUCINATION DETECTED?
         │   ├─Yes─▶ LOG ERROR → Request regeneration
         │   └─No──▶ Proceed
         │
         ▼
┌─────────────────────────────────────────────────────────────────────┐
│ 7. OUTPUT CLEANUP & FORMATTING                                      │
└─────────────────────────────────────────────────────────────────────┘
    │
    ├─▶ Remove flagged speculative language
    ├─▶ Ensure consistent formatting
    ├─▶ Add confidence indicators
    └─▶ Structure for frontend consumption
         │
         ▼
┌─────────────────────────────────────────────────────────────────────┐
│ 8. FINAL OUTPUT                                                     │
└─────────────────────────────────────────────────────────────────────┘
    │
    ├─▶ Analysis JSON
    ├─▶ Confidence scores
    ├─▶ Citations
    └─▶ Validation status: PASSED ✓
```

---

## 5. Layer-Based Architecture

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                           PRESENTATION LAYER                                 │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│  ┌──────────────────┐  ┌──────────────────┐  ┌──────────────────┐           │
│  │   React Pages    │  │   Components     │  │   UI Primitives  │           │
│  │                  │  │                  │  │                  │           │
│  │ • page.tsx       │  │ • Dashboard      │  │ • Button         │           │
│  │ • [industry]/    │  │ • SearchBar      │  │ • Card           │           │
│  │   page.tsx       │  │ • Charts         │  │ • Input          │           │
│  │ • landing/       │  │ • Tabs           │  │ • Tabs           │           │
│  │   page.tsx       │  │                  │  │ • Dialog         │           │
│  └────────┬─────────┘  └────────┬─────────┘  └────────┬─────────┘           │
│           │                   │                   │                        │
│           └───────────────────┴───────────────────┘                        │
│                               │                                             │
│           Next.js 16 + React 19 + Tailwind CSS 4 + Recharts                │
└───────────────────────────────┬─────────────────────────────────────────────┘
                                │
                                ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                              API LAYER                                       │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│  ┌──────────────────────────────────────────────────────────────────────┐   │
│  │                     Next.js API Routes                                │   │
│  ├──────────────────────────────────────────────────────────────────────┤   │
│  │                                                                       │   │
│  │   POST /api/intelligence    → Main intelligence pipeline              │   │
│  │   POST /api/analyze         → Legacy analysis endpoint                │   │
│  │   GET  /api/companies       → Company search                          │   │
│  │   GET  /api/cache           → Cache management                        │   │
│  │   GET  /api/health          → Health checks                           │   │
│  │                                                                       │   │
│  └──────────────────────────────────────────────────────────────────────┘   │
│                                                                              │
│  ┌──────────────────────────────────────────────────────────────────────┐   │
│  │                  Python FastAPI Microservice                          │   │
│  ├──────────────────────────────────────────────────────────────────────┤   │
│  │                                                                       │   │
│  │   POST /fetch/quote         → Stock quotes                            │   │
│  │   POST /fetch/financials    → Financial statements                    │   │
│  │   POST /fetch/shareholders  → Shareholding patterns                   │   │
│  │   POST /fetch/index-companies → Index constituents                    │   │
│  │                                                                       │   │
│  └──────────────────────────────────────────────────────────────────────┘   │
│                                                                              │
└───────────────────────────────┬─────────────────────────────────────────────┘
                                │
                                ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                         INTELLIGENCE LAYER                                   │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│  ┌─────────────────────┐  ┌─────────────────────┐  ┌─────────────────────┐  │
│  │  Entity Resolution  │  │  Data Orchestration │  │   AI Analysis       │  │
│  │                     │  │                     │  │                     │  │
│  │ • Query Classifier  │  │ • Multi-Source      │  │ • Groq Client       │  │
│  │ • Exact Matcher     │  │   Orchestrator      │  │ • Prompt Builder    │  │
│  │ • Fuzzy Matcher     │  │ • Priority Manager  │  │ • Guardrails        │  │
│  │ • Alias Resolver    │  │ • Cache Manager     │  │ • Output Validator  │  │
│  └─────────────────────┘  └─────────────────────┘  └─────────────────────┘  │
│                                                                              │
│  ┌─────────────────────┐  ┌─────────────────────┐  ┌─────────────────────┐  │
│  │  Analysis Engines   │  │  Dataset Managers   │  │  Debugging Tools    │  │
│  │                     │  │                     │  │                     │  │
│  │ • Financial Analyzer│  │ • Company DB        │  │ • Pipeline Tracer   │  │
│  │ • Competitor Analyzer│ │ • Industry Dataset  │  │ • Data Validator    │  │
│  │ • Trend Analyzer    │  │ • Data Loader       │  │ • Cache Auditor     │  │
│  └─────────────────────┘  └─────────────────────┘  └─────────────────────┘  │
│                                                                              │
└───────────────────────────────┬─────────────────────────────────────────────┘
                                │
                                ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                          DATA FETCHER LAYER                                  │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│  ┌──────────────────┐  ┌──────────────────┐  ┌──────────────────┐           │
│  │  Yahoo Finance   │  │ Alpha Vantage    │  │      FMP         │           │
│  │  ─────────────   │  │ ─────────────    │  │   ─────────      │           │
│  │  Reliability: 78%│  │ Reliability: 75% │  │ Reliability: 76% │           │
│  │  Rate: 2000/day  │  │ Rate: 500/day    │  │ Rate: 250/day    │           │
│  └──────────────────┘  └──────────────────┘  └──────────────────┘           │
│                                                                              │
│  ┌──────────────────┐  ┌──────────────────┐  ┌──────────────────┐           │
│  │    NSE India     │  │  Python Service  │  │   Web Search     │           │
│  │  ─────────────   │  │ ───────────────  │  │  ───────────     │           │
│  │  Reliability: 88%│  │ NSE/BSE Scraping │  │ Google Custom    │           │
│  │  Rate: 1000/day  │  │ Session-based    │  │ Search API       │           │
│  └──────────────────┘  └──────────────────┘  └──────────────────┘           │
│                                                                              │
└───────────────────────────────┬─────────────────────────────────────────────┘
                                │
                                ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                         STORAGE & CACHE LAYER                                │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│  ┌──────────────────────────────────────────────────────────────────────┐   │
│  │                         Supabase (PostgreSQL)                         │   │
│  ├──────────────────────────────────────────────────────────────────────┤   │
│  │   • companies table        → Company records                          │   │
│  │   • analysis_cache table   → Cached analysis results                  │   │
│  │   • pipeline_logs table    → Debug traces                             │   │
│  │   • api_calls table        → API call tracking                        │   │
│  └──────────────────────────────────────────────────────────────────────┘   │
│                                                                              │
│  ┌──────────────────────────────────────────────────────────────────────┐   │
│  │                        Static Datasets (CSV)                          │   │
│  ├──────────────────────────────────────────────────────────────────────┤   │
│  │   • all_real_companies_combined.csv  → 995 companies                  │   │
│  │   • industries_master.csv            → Industry classifications       │   │
│  │   • brands_master.csv                → Brand mappings                 │   │
│  └──────────────────────────────────────────────────────────────────────┘   │
│                                                                              │
│  ┌──────────────────────────────────────────────────────────────────────┐   │
│  │                        File System Cache                              │   │
│  ├──────────────────────────────────────────────────────────────────────┤   │
│  │   • logs/pipeline/*.json             → Pipeline traces                │   │
│  │   • data/cache/*.json                → Local cache                    │   │
│  │   • data/versions/*.json             → Version snapshots              │   │
│  └──────────────────────────────────────────────────────────────────────┘   │
│                                                                              │
└───────────────────────────────┬─────────────────────────────────────────────┘
                                │
                                ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                      EXTERNAL SERVICES LAYER                                 │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐        │
│  │  Groq AI    │  │   Google    │  │  Financial  │  │   Stock     │        │
│  │  Platform   │  │   Search    │  │    APIs     │  │  Exchanges  │        │
│  │             │  │             │  │             │  │             │        │
│  │ • llama-3.3 │  │ • Custom    │  │ • Yahoo Fin │  │ • NSE India │        │
│  │   -70b      │  │   Search    │  │ • Alpha Van │  │ • BSE       │        │
│  │ • JSON Mode │  │ • 100/day   │  │ • FMP       │  │ • NYSE      │        │
│  │ • Temp 0.1  │  │   free      │  │             │  │ • NASDAQ    │        │
│  └─────────────┘  └─────────────┘  └─────────────┘  └─────────────┘        │
│                                                                              │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## 6. Core Engine Logic

### 6.1 Entity Resolution Algorithm

```typescript
// Pseudocode representation of entity resolution logic

function resolveEntity(query: string): ResolutionResult {
  // STAGE 1: Classify query type
  const queryType = classifyQuery(query);
  // Types: 'brand' | 'company' | 'industry' | 'product' | 'unknown'
  
  // STAGE 2: Exact match check
  const exactMatch = checkExactMatch(query, masterDataset);
  if (exactMatch.confidence === 100) {
    return { entity: exactMatch.entity, confidence: 100, method: 'exact' };
  }
  
  // STAGE 3: Fuzzy matching with Levenshtein distance
  const fuzzyMatches = findFuzzyMatches(query, masterDataset, threshold = 0.75);
  if (fuzzyMatches.length > 0) {
    const bestMatch = fuzzyMatches[0];
    if (bestMatch.similarity >= 0.75) {
      return { 
        entity: bestMatch.entity, 
        confidence: Math.round(bestMatch.similarity * 100),
        method: 'fuzzy'
      };
    }
  }
  
  // STAGE 4: Alias matching
  const aliasMatch = checkBrandAlias(query, brandMappings);
  if (aliasMatch.found) {
    return {
      entity: aliasMatch.parentCompany,
      confidence: aliasMatch.confidence, // 60-90%
      method: 'alias',
      note: `Brand "${query}" maps to parent company`
    };
  }
  
  // STAGE 5: Secondary verification (if confidence < 80%)
  if (bestMatch?.confidence < 80 || !bestMatch) {
    const verification = verifyWithWebSearch(query);
    if (verification.confirmed) {
      return {
        entity: verification.entity,
        confidence: verification.adjustedConfidence,
        method: 'verified'
      };
    }
  }
  
  // No match found
  return {
    entity: null,
    confidence: 0,
    method: 'none',
    suggestions: fuzzyMatches.slice(0, 5) // Top 5 suggestions
  };
}

// Levenshtein distance calculation
function calculateSimilarity(str1: string, str2: string): number {
  const distance = levenshteinDistance(str1.toLowerCase(), str2.toLowerCase());
  const maxLength = Math.max(str1.length, str2.length);
  return 1 - (distance / maxLength);
}
```

### 6.2 Cross-Validation Algorithm

```typescript
// Multi-source data cross-validation logic

function crossValidateDataPoint(
  metric: string,
  sources: DataSource[]
): ValidatedDataPoint {
  
  // Collect all values from sources
  const values = sources
    .filter(s => s.data[metric] !== null && s.data[metric] !== undefined)
    .map(s => ({
      value: s.data[metric],
      source: s.name,
      reliability: s.reliability
    }));
  
  if (values.length === 0) {
    return { value: null, confidence: 0, sources: [], flag: 'NO_DATA' };
  }
  
  if (values.length === 1) {
    return {
      value: values[0].value,
      confidence: values[0].reliability * 0.7, // Single source penalty
      sources: [values[0].source],
      flag: 'SINGLE_SOURCE'
    };
  }
  
  // Calculate statistics
  const numericValues = values.map(v => v.value);
  const mean = calculateMean(numericValues);
  const median = calculateMedian(numericValues);
  const stdDev = calculateStdDev(numericValues);
  
  // Detect outliers (values > 2 standard deviations from mean)
  const outlierThreshold = 2 * stdDev;
  const validValues = values.filter(v => 
    Math.abs(v.value - mean) <= outlierThreshold
  );
  
  // Calculate variance percentage
  const maxVal = Math.max(...numericValues);
  const minVal = Math.min(...numericValues);
  const variancePercent = ((maxVal - minVal) / median) * 100;
  
  // Determine confidence
  let confidence: number;
  let flag: string | null = null;
  
  if (values.length >= 3 && variancePercent < 15) {
    confidence = 90 + Math.random() * 10; // 90-100%
  } else if (values.length >= 2 && variancePercent < 15) {
    confidence = 70 + Math.random() * 20; // 70-90%
  } else if (variancePercent >= 15) {
    confidence = 50 + Math.random() * 20; // 50-70%
    flag = 'HIGH_VARIANCE';
  } else {
    confidence = values[0].reliability * 0.6;
    flag = 'LOW_COVERAGE';
  }
  
  // Return median as consensus (outlier-resistant)
  return {
    value: median,
    confidence: Math.round(confidence),
    sources: values.map(v => v.source),
    variance: variancePercent,
    flag
  };
}
```

### 6.3 Priority-Based Data Fetching

```typescript
// Priority-based data source selection logic

const DATA_SOURCE_PRIORITIES = {
  'API_REALTIME': 1.0,      // Highest - Fresh financial APIs
  'CACHE': 0.9,             // High - Recent cached data
  'WEB_SEARCH': 0.7,        // Medium - Search results
  'CRAWLERS': 0.6,          // Medium - Scraped data
  'DATASET': 0.3,           // Low - Static classification only
  'FALLBACK': 0.1           // Lowest - Last resort
};

function prioritizeDataSources(
  query: IntelligenceQuery,
  mode: 'realtime' | 'cached' = 'realtime'
): PrioritizedSource[] {
  
  const sources: PrioritizedSource[] = [
    { name: 'yahoo_finance', priority: 1.0, type: 'API_REALTIME' },
    { name: 'alpha_vantage', priority: 1.0, type: 'API_REALTIME' },
    { name: 'fmp', priority: 1.0, type: 'API_REALTIME' },
    { name: 'nse_india', priority: 1.0, type: 'API_REALTIME' },
    { name: 'cache', priority: mode === 'realtime' ? 0.9 : 1.0, type: 'CACHE' },
    { name: 'web_search', priority: 0.7, type: 'WEB_SEARCH' },
    { name: 'python_service', priority: 0.6, type: 'CRAWLERS' },
    { name: 'master_dataset', priority: 0.3, type: 'DATASET' }
  ];
  
  // Sort by priority (descending)
  return sources.sort((a, b) => b.priority - a.priority);
}

async function fetchWithPriority(
  entity: ResolvedEntity,
  sources: PrioritizedSource[]
): Promise<DataAggregationResult> {
  
  const results: SourceResult[] = [];
  const minAcceptablePriority = 0.6;
  
  // Try sources in priority order
  for (const source of sources) {
    if (source.priority < minAcceptablePriority && results.length > 0) {
      // We have sufficient high-priority data
      break;
    }
    
    try {
      const result = await fetchFromSource(entity, source.name);
      results.push({
        source: source.name,
        data: result,
        priority: source.priority,
        timestamp: Date.now()
      });
      
      // If high-priority source succeeds, we can be selective about lower ones
      if (source.priority >= 0.9) {
        continue;
      }
    } catch (error) {
      logFetchError(source.name, error);
      continue;
    }
  }
  
  return aggregateResults(results);
}
```

### 6.4 AI Guardrails Logic

```typescript
// Anti-hallucination guardrails implementation

class AIGuardrails {
  
  // Input validation before AI processing
  validateInput(data: AnalysisInput): ValidationResult {
    const errors: string[] = [];
    
    // Check for required fields
    const requiredFields = ['revenue', 'industry', 'company_name'];
    for (const field of requiredFields) {
      if (!data[field]) {
        errors.push(`Missing required field: ${field}`);
      }
    }
    
    // Check for realistic ranges
    if (data.revenue && (data.revenue < 1e7 || data.revenue > 1e15)) {
      errors.push(`Revenue value ${data.revenue} outside realistic range`);
    }
    
    // Check for contradictions
    if (data.netIncome && data.revenue && data.netIncome > data.revenue) {
      errors.push(`Net income (${data.netIncome}) cannot exceed revenue (${data.revenue})`);
    }
    
    return {
      valid: errors.length === 0,
      errors
    };
  }
  
  // Output validation after AI processing
  validateOutput(output: string, input: AnalysisInput): ValidationResult {
    const errors: string[] = [];
    const hallucinations: string[] = [];
    
    // Check for speculative language
    const speculativePatterns = [
      /\bmight\b/gi, /\bcould\b/gi, /\bprobably\b/gi,
      /\bmay\b/gi, /\bpossibly\b/gi, /\bperhaps\b/gi
    ];
    
    for (const pattern of speculativePatterns) {
      const matches = output.match(pattern);
      if (matches) {
        errors.push(`Speculative language detected: "${matches[0]}"`);
      }
    }
    
    // Extract all numbers from AI output
    const numberPattern = /\b\d+(?:,\d{3})*(?:\.\d+)?\s*(?:Cr|Lakh|Billion|Million)?\b/gi;
    const outputNumbers = output.match(numberPattern) || [];
    
    // Verify each number exists in input data
    for (const num of outputNumbers) {
      const normalizedNum = this.normalizeNumber(num);
      const foundInInput = this.findNumberInInput(normalizedNum, input);
      
      if (!foundInInput) {
        hallucinations.push(`Number "${num}" not found in input data`);
      }
    }
    
    // Check for citation format
    if (!output.includes('[') || !output.includes(']')) {
      errors.push('Missing citations for metrics');
    }
    
    return {
      valid: errors.length === 0 && hallucinations.length === 0,
      errors,
      hallucinations,
      confidence: this.calculateOutputConfidence(errors, hallucinations)
    };
  }
  
  // Calculate confidence based on validation results
  private calculateOutputConfidence(
    errors: string[],
    hallucinations: string[]
  ): number {
    let confidence = 100;
    
    // Deduct for errors
    confidence -= errors.length * 5;
    
    // Heavy penalty for hallucinations
    confidence -= hallucinations.length * 20;
    
    return Math.max(0, confidence);
  }
  
  // Build sanitized prompt with guardrails
  buildGuardedPrompt(context: AnalysisInput, task: string): string {
    return `
TASK: ${task}

INPUT DATA (USE ONLY THESE VALUES):
${JSON.stringify(context, null, 2)}

GUARDRAILS:
1. Use ONLY the metrics provided above
2. If information is missing, explicitly state "Data unavailable" - DO NOT guess
3. Cite the source for every number you mention using [Source: Name] format
4. Do not use speculative language (might, could, probably)
5. Do not invent or assume any financial figures
6. If you cannot verify a claim against the input data, do not include it

VIOLATION PENALTY: Responses containing hallucinated data will be rejected.

Provide your analysis in valid JSON format.
    `.trim();
  }
}
```

### 6.5 Cache Management Logic

```typescript
// Cache management with TTL and freshness checking

class CacheManager {
  private defaultTTL = 24 * 60 * 60 * 1000; // 24 hours
  
  async get(key: string, options: CacheOptions = {}): Promise<CacheResult | null> {
    const entry = await this.storage.get(key);
    
    if (!entry) {
      return null;
    }
    
    const age = Date.now() - entry.createdAt;
    const ttl = options.ttl || this.defaultTTL;
    const isFresh = age < ttl;
    
    // Check if realtime priority mode is enabled
    const realtimeMode = process.env.REALTIME_PRIORITY_MODE === 'true';
    
    if (realtimeMode && !options.allowStale) {
      // In realtime mode, consider data stale if older than 1 hour
      const maxAge = 60 * 60 * 1000; // 1 hour
      if (age > maxAge) {
        logCacheEvent('CACHE_MISS_STALE', { key, age });
        return null;
      }
    }
    
    if (!isFresh && !options.allowStale) {
      logCacheEvent('CACHE_MISS_EXPIRED', { key, age, ttl });
      return null;
    }
    
    // Update access metrics
    await this.updateAccessMetrics(key);
    
    return {
      data: entry.data,
      age,
      isFresh,
      accessCount: entry.accessCount + 1
    };
  }
  
  async set(
    key: string,
    data: any,
    options: CacheOptions = {}
  ): Promise<void> {
    const entry: CacheEntry = {
      data,
      createdAt: Date.now(),
      expiresAt: Date.now() + (options.ttl || this.defaultTTL),
      accessCount: 0,
      metadata: {
        source: options.source,
        confidence: options.confidence,
        entity: options.entity
      }
    };
    
    await this.storage.set(key, entry);
    logCacheEvent('CACHE_SET', { key, ttl: options.ttl });
  }
  
  async invalidate(pattern: string): Promise<number> {
    const keys = await this.storage.keys();
    const matchingKeys = keys.filter(k => k.includes(pattern));
    
    for (const key of matchingKeys) {
      await this.storage.delete(key);
    }
    
    logCacheEvent('CACHE_INVALIDATE', { pattern, count: matchingKeys.length });
    return matchingKeys.length;
  }
  
  // Audit cache freshness across all entries
  async auditCache(): Promise<CacheAuditReport> {
    const keys = await this.storage.keys();
    const now = Date.now();
    
    const report: CacheAuditReport = {
      totalEntries: keys.length,
      freshEntries: 0,
      staleEntries: 0,
      expiredEntries: 0,
      averageAge: 0,
      entries: []
    };
    
    let totalAge = 0;
    
    for (const key of keys) {
      const entry = await this.storage.get(key);
      if (!entry) continue;
      
      const age = now - entry.createdAt;
      totalAge += age;
      
      const status = age < this.defaultTTL ? 'fresh' : 
                     age < this.defaultTTL * 2 ? 'stale' : 'expired';
      
      report.entries.push({
        key,
        age,
        status,
        accessCount: entry.accessCount
      });
      
      if (status === 'fresh') report.freshEntries++;
      else if (status === 'stale') report.staleEntries++;
      else report.expiredEntries++;
    }
    
    report.averageAge = totalAge / keys.length;
    
    return report;
  }
}
```

---

## 7. Core Concepts

### 7.1 Entity Types

```typescript
// Company Record Structure
interface CompanyRecord {
  // Identification
  ticker: string;              // Stock ticker (e.g., "RELIANCE.NS")
  name: string;                // Common name (e.g., "Reliance Industries")
  legalName: string;           // Legal entity name
  
  // Classification
  naicsCode: string;           // North American Industry Classification
  gicsCode: string;            // Global Industry Classification Standard
  industry: string;            // Industry category
  subIndustry: string;         // Sub-industry category
  
  // Market Information
  region: 'INDIA' | 'GLOBAL';  // Geographic region
  exchange: Exchange;          // Stock exchange
  marketCapTier: 'MEGA' | 'LARGE' | 'MID' | 'SMALL';
  
  // Relationships
  brands: string[];            // Associated brands
  productCategories: string[]; // Product categories
  parentCompany?: string;      // Parent company (if subsidiary)
  subsidiaries?: string[];     // Subsidiary companies
  
  // Metadata
  headquarters: string;        // HQ location
  verified: boolean;           // Verification status
  verifiedAt?: Date;           // Last verification timestamp
}

// Query Classification Types
type QueryType = 
  | 'brand'      // Product/service brand (e.g., "Jio", "Pixel")
  | 'company'    // Company name or ticker (e.g., "Reliance", "AAPL")
  | 'industry'   // Industry category (e.g., "Technology", "Banking")
  | 'product'    // Product category (e.g., "SUV", "Smartphone")
  | 'unknown';   // Cannot classify
```

### 7.2 Confidence Scoring

```typescript
// Confidence Level Definitions
interface ConfidenceScore {
  value: number;               // 0-100
  level: 'HIGH' | 'MEDIUM' | 'LOW' | 'CRITICAL';
  factors: ConfidenceFactor[]; // Contributing factors
}

interface ConfidenceFactor {
  source: string;              // What contributed to confidence
  impact: number;              // + or - impact on score
  description: string;         // Human-readable explanation
}

// Confidence Level Thresholds
const CONFIDENCE_LEVELS = {
  HIGH: { min: 90, max: 100, color: 'green', action: 'PROCEED' },
  MEDIUM: { min: 70, max: 89, color: 'yellow', action: 'PROCEED_WITH_NOTE' },
  LOW: { min: 50, max: 69, color: 'orange', action: 'ADD_DISCLAIMER' },
  CRITICAL: { min: 0, max: 49, color: 'red', action: 'REQUEST_CLARIFICATION' }
};

// Factors Affecting Confidence
const CONFIDENCE_FACTORS = {
  // Positive factors
  MULTIPLE_SOURCES: +15,       // Data from 3+ sources
  LOW_VARIANCE: +10,           // <15% variance across sources
  HIGH_RELIABILITY_SOURCE: +8, // Source reliability >80%
  RECENT_DATA: +5,             // Data <24 hours old
  VERIFIED_ENTITY: +10,        // Entity in verified dataset
  
  // Negative factors
  SINGLE_SOURCE: -20,          // Only one data source
  HIGH_VARIANCE: -15,          // >15% variance across sources
  STALE_DATA: -10,             // Data >7 days old
  UNVERIFIED_ENTITY: -10,      // Entity not in dataset
  RATE_LIMITED: -5,            // Source rate limited
  API_ERROR: -10               // Source returned error
};
```

### 7.3 Data Source Reliability Matrix

```typescript
// Data Source Reliability and Limits
interface DataSourceConfig {
  name: string;
  reliability: number;         // 0-100% historical accuracy
  rateLimit: {
    requestsPerMinute: number;
    requestsPerDay: number;
  };
  coverage: 'GLOBAL' | 'INDIA' | 'US' | 'EUROPE';
  dataTypes: DataType[];
  cost: 'FREE' | 'PAID' | 'FREEMIUM';
  authentication: 'API_KEY' | 'OAUTH' | 'NONE';
}

const DATA_SOURCES: DataSourceConfig[] = [
  {
    name: 'Yahoo Finance',
    reliability: 78,
    rateLimit: { requestsPerMinute: 60, requestsPerDay: 2000 },
    coverage: 'GLOBAL',
    dataTypes: ['quote', 'financials', 'historical', 'splits'],
    cost: 'FREE',
    authentication: 'NONE'
  },
  {
    name: 'Alpha Vantage',
    reliability: 75,
    rateLimit: { requestsPerMinute: 5, requestsPerDay: 500 },
    coverage: 'GLOBAL',
    dataTypes: ['quote', 'financials', 'technical', 'forex'],
    cost: 'FREEMIUM',
    authentication: 'API_KEY'
  },
  {
    name: 'Financial Modeling Prep',
    reliability: 76,
    rateLimit: { requestsPerMinute: 4, requestsPerDay: 250 },
    coverage: 'GLOBAL',
    dataTypes: ['quote', 'financials', 'ratios', 'growth'],
    cost: 'FREEMIUM',
    authentication: 'API_KEY'
  },
  {
    name: 'NSE India',
    reliability: 88,
    rateLimit: { requestsPerMinute: 10, requestsPerDay: 1000 },
    coverage: 'INDIA',
    dataTypes: ['quote', 'corporate_info', 'shareholders', 'indices'],
    cost: 'FREE',
    authentication: 'SESSION_COOKIE'
  },
  {
    name: 'Python Service (Scraping)',
    reliability: 85,
    rateLimit: { requestsPerMinute: 6, requestsPerDay: 600 },
    coverage: 'INDIA',
    dataTypes: ['quote', 'shareholders', 'indices'],
    cost: 'FREE',
    authentication: 'INTERNAL'
  }
];
```

### 7.4 Analysis Types

```typescript
// Available Analysis Types
interface AnalysisConfig {
  type: AnalysisType;
  description: string;
  requiredData: DataType[];
  aiPrompt: string;
  outputSchema: JSONSchema;
}

type AnalysisType =
  | 'company_overview'        // Financial health summary
  | 'competitor_analysis'     // Competitive positioning
  | 'industry_benchmark'      // Industry comparison
  | 'investor_analysis'       // Shareholding patterns
  | 'trend_forecast'          // Future projections
  | 'risk_assessment';        // Risk factors

const ANALYSIS_CONFIGS: Record<AnalysisType, AnalysisConfig> = {
  company_overview: {
    type: 'company_overview',
    description: 'Comprehensive financial health assessment',
    requiredData: ['revenue', 'netIncome', 'totalAssets', 'marketCap'],
    aiPrompt: 'Analyze the financial health...',
    outputSchema: { /* JSON schema */ }
  },
  
  competitor_analysis: {
    type: 'competitor_analysis',
    description: 'Competitive landscape and positioning',
    requiredData: ['company_metrics', 'competitor_metrics[]', 'market_share'],
    aiPrompt: 'Compare this company with competitors...',
    outputSchema: { /* JSON schema */ }
  },
  
  // ... other analysis types
};
```

### 7.5 Error Categories & Handling

```typescript
// Error Classification System
interface SystemError {
  code: ErrorCode;
  category: ErrorCategory;
  severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  message: string;
  context: ErrorContext;
  resolution: ResolutionStrategy;
}

type ErrorCategory =
  | 'ENTITY_RESOLUTION'      // Cannot identify company/industry
  | 'DATA_FETCH'            // API failure, timeout
  | 'DATA_VALIDATION'       // Invalid data format, out of range
  | 'AI_PROCESSING'         // AI hallucination, API error
  | 'CACHE'                 // Cache miss, corruption
  | 'RATE_LIMIT'            // API rate limit exceeded
  | 'AUTHENTICATION'        // API key invalid, expired
  | 'TIMEOUT'               // Request timeout
  | 'UNKNOWN';              // Unclassified error

type ErrorCode =
  // Entity Resolution Errors (1xx)
  | 'E101_NO_EXACT_MATCH'
  | 'E102_FUZZY_MATCH_FAILED'
  | 'E103_MULTIPLE_MATCHES'
  | 'E104_UNRECOGNIZED_QUERY'
  
  // Data Fetch Errors (2xx)
  | 'E201_API_TIMEOUT'
  | 'E202_API_ERROR'
  | 'E203_RATE_LIMIT_EXCEEDED'
  | 'E204_INVALID_RESPONSE'
  | 'E205_ALL_SOURCES_FAILED'
  
  // Data Validation Errors (3xx)
  | 'E301_OUT_OF_RANGE'
  | 'E302_CONTRADICTION_DETECTED'
  | 'E303_MISSING_REQUIRED_FIELD'
  | 'E304_TYPE_MISMATCH'
  
  // AI Processing Errors (4xx)
  | 'E401_AI_TIMEOUT'
  | 'E402_HALLUCINATION_DETECTED'
  | 'E403_INVALID_AI_RESPONSE'
  | 'E404_SPECULATIVE_LANGUAGE'
  
  // Cache Errors (5xx)
  | 'E501_CACHE_MISS'
  | 'E502_CACHE_CORRUPTION'
  | 'E503_CACHE_WRITE_ERROR'
  
  // System Errors (9xx)
  | 'E901_UNKNOWN_ERROR'
  | 'E902_SERVICE_UNAVAILABLE';

// Resolution Strategies
const ERROR_RESOLUTIONS: Record<ErrorCode, ResolutionStrategy> = {
  E101_NO_EXACT_MATCH: {
    action: 'USE_FUZZY_MATCH',
    fallback: 'REQUEST_CLARIFICATION',
    userMessage: 'Did you mean one of these?'
  },
  
  E201_API_TIMEOUT: {
    action: 'RETRY_WITH_BACKOFF',
    fallback: 'USE_CACHE',
    maxRetries: 3,
    backoffMs: 1000
  },
  
  E402_HALLUCINATION_DETECTED: {
    action: 'REGENERATE_RESPONSE',
    fallback: 'USE_FALLBACK_PROMPT',
    validationRequired: true
  },
  
  // ... other resolutions
};
```

---

## 8. Data Sources & APIs

### 8.1 API Configuration Details

```typescript
// Complete API Configuration
const API_CONFIG = {
  // Yahoo Finance (Unofficial)
  yahooFinance: {
    baseUrl: 'https://query1.finance.yahoo.com/v8/finance',
    endpoints: {
      quote: '/chart/{symbol}',
      financials: '/chart/{symbol}?interval=1d&range=1y',
      profile: '/quote/{symbol}'
    },
    reliability: 78,
    rateLimit: { requestsPerMinute: 60, requestsPerDay: 2000 },
    auth: null
  },
  
  // Alpha Vantage
  alphaVantage: {
    baseUrl: 'https://www.alphavantage.co/query',
    endpoints: {
      quote: '?function=GLOBAL_QUOTE&symbol={symbol}&apikey={key}',
      overview: '?function=OVERVIEW&symbol={symbol}&apikey={key}',
      income: '?function=INCOME_STATEMENT&symbol={symbol}&apikey={key}',
      daily: '?function=TIME_SERIES_DAILY&symbol={symbol}&apikey={key}'
    },
    reliability: 75,
    rateLimit: { requestsPerMinute: 5, requestsPerDay: 500 },
    auth: { type: 'API_KEY', param: 'apikey' }
  },
  
  // Financial Modeling Prep
  fmp: {
    baseUrl: 'https://financialmodelingprep.com/api/v3',
    endpoints: {
      quote: '/quote/{symbol}?apikey={key}',
      income: '/income-statement/{symbol}?apikey={key}',
      balance: '/balance-sheet-statement/{symbol}?apikey={key}',
      ratios: '/ratios/{symbol}?apikey={key}'
    },
    reliability: 76,
    rateLimit: { requestsPerMinute: 4, requestsPerDay: 250 },
    auth: { type: 'API_KEY', param: 'apikey' }
  },
  
  // NSE India
  nseIndia: {
    baseUrl: 'https://www.nseindia.com/api',
    endpoints: {
      quote: '/quote-equity?symbol={symbol}',
      corporate: '/corporate-info?symbol={symbol}',
      shareholders: '/corporate-share-holdings-master',
      indices: '/allIndices'
    },
    reliability: 88,
    rateLimit: { requestsPerMinute: 10, requestsPerDay: 1000 },
    auth: { type: 'SESSION_COOKIE', required: true }
  },
  
  // Google Custom Search
  googleSearch: {
    baseUrl: 'https://www.googleapis.com/customsearch/v1',
    endpoints: {
      search: '?key={key}&cx={cx}&q={query}'
    },
    rateLimit: { requestsPerDay: 100 },
    auth: { type: 'API_KEY', params: ['key', 'cx'] }
  },
  
  // Groq AI
  groq: {
    baseUrl: 'https://api.groq.com/openai/v1',
    endpoints: {
      chat: '/chat/completions'
    },
    model: 'llama-3.3-70b-versatile',
    config: {
      temperature: 0.1,
      maxTokens: 3000,
      jsonMode: true
    },
    auth: { type: 'API_KEY', header: 'Authorization' }
  }
};
```

### 8.2 Data Source Priority Matrix

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                    DATA SOURCE PRIORITY MATRIX                               │
├──────────────────┬──────────────┬────────────┬────────────┬─────────────────┤
│ Data Type        │ Primary      │ Secondary  │ Tertiary   │ Fallback        │
├──────────────────┼──────────────┼────────────┼────────────┼─────────────────┤
│ Stock Quote      │ NSE India    │ Yahoo Fin  │ Alpha Van  │ Web Search      │
│ (Indian)         │ (88%)        │ (78%)      │ (75%)      │ (60%)           │
├──────────────────┼──────────────┼────────────┼────────────┼─────────────────┤
│ Stock Quote      │ Yahoo Fin    │ Alpha Van  │ FMP        │ Web Search      │
│ (Global)         │ (78%)        │ (75%)      │ (76%)      │ (60%)           │
├──────────────────┼──────────────┼────────────┼────────────┼─────────────────┤
│ Financial        │ FMP          │ Alpha Van  │ Yahoo Fin  │ Web Search      │
│ Statements       │ (76%)        │ (75%)      │ (78%)      │ (50%)           │
├──────────────────┼──────────────┼────────────┼────────────┼─────────────────┤
│ Shareholding     │ Python Svc   │ NSE India  │ -          │ Company Website │
│ Pattern          │ (85%)        │ (88%)      │            │ (70%)           │
├──────────────────┼──────────────┼────────────┼────────────┼─────────────────┤
│ Industry         │ Master       │ Web Search │ AI         │ -               │
│ Classification   │ Dataset      │ (65%)      │ Inference  │                 │
│                  │ (100%)       │            │ (40%)      │                 │
├──────────────────┼──────────────┼────────────┼────────────┼─────────────────┤
│ Competitor       │ Master       │ Web Search │ AI         │ -               │
│ Mapping          │ Dataset      │ (60%)      │ Analysis   │                 │
│                  │ (95%)        │            │ (50%)      │                 │
├──────────────────┼──────────────┼────────────┼────────────┼─────────────────┤
│ Market Trends    │ Yahoo Fin    │ Alpha Van  │ Web Search │ AI Prediction   │
│                  │ Historical   │ Historical │ News       │ (30%)           │
│                  │ (80%)        │ (75%)      │ (65%)      │                 │
└──────────────────┴──────────────┴────────────┴────────────┴─────────────────┘
```

---

## 9. Error Handling & Debugging

### 9.1 Pipeline Trace Format

```json
{
  "requestId": "req_abc123xyz",
  "timestamp": "2026-02-19T10:30:00.000Z",
  "query": "Reliance Industries",
  "stages": [
    {
      "stage": "INPUT_RECEIVED",
      "timestamp": "2026-02-19T10:30:00.100Z",
      "data": {
        "rawQuery": "Reliance Industries",
        "sanitizedQuery": "reliance industries"
      }
    },
    {
      "stage": "QUERY_CLASSIFIED",
      "timestamp": "2026-02-19T10:30:00.150Z",
      "data": {
        "classification": "company",
        "confidence": 0.95
      }
    },
    {
      "stage": "ENTITY_RESOLUTION_START",
      "timestamp": "2026-02-19T10:30:00.200Z",
      "data": {
        "strategy": "exact_then_fuzzy"
      }
    },
    {
      "stage": "EXACT_MATCH_ATTEMPT",
      "timestamp": "2026-02-19T10:30:00.250Z",
      "data": {
        "matchFound": true,
        "entity": {
          "ticker": "RELIANCE.NS",
          "name": "Reliance Industries Ltd",
          "industry": "Conglomerate"
        },
        "confidence": 100
      }
    },
    {
      "stage": "CACHE_CHECK",
      "timestamp": "2026-02-19T10:30:00.300Z",
      "data": {
        "cacheHit": false,
        "cacheKey": "analysis:RELIANCE.NS:20260219",
        "reason": "CACHE_MISS_STALE"
      }
    },
    {
      "stage": "PARALLEL_FETCH_START",
      "timestamp": "2026-02-19T10:30:00.350Z",
      "data": {
        "sources": ["yahoo_finance", "alpha_vantage", "fmp", "nse_india"]
      }
    },
    {
      "stage": "YAHOO_FINANCE_FETCH",
      "timestamp": "2026-02-19T10:30:00.800Z",
      "data": {
        "success": true,
        "responseTimeMs": 450,
        "dataPoints": 12
      }
    },
    {
      "stage": "NSE_INDIA_FETCH",
      "timestamp": "2026-02-19T10:30:01.200Z",
      "data": {
        "success": true,
        "responseTimeMs": 850,
        "dataPoints": 15
      }
    },
    {
      "stage": "DATA_AGGREGATION",
      "timestamp": "2026-02-19T10:30:01.500Z",
      "data": {
        "sourcesAggregated": 4,
        "totalDataPoints": 48,
        "completeness": 0.92
      }
    },
    {
      "stage": "CROSS_VALIDATION",
      "timestamp": "2026-02-19T10:30:01.600Z",
      "data": {
        "metricsValidated": 12,
        "outliersDetected": 0,
        "highVarianceFlags": 0
      }
    },
    {
      "stage": "AI_PROMPT_CONSTRUCTION",
      "timestamp": "2026-02-19T10:30:01.700Z",
      "data": {
        "promptLength": 2450,
        "contextTokens": 512
      }
    },
    {
      "stage": "AI_API_CALL",
      "timestamp": "2026-02-19T10:30:01.750Z",
      "data": {
        "model": "llama-3.3-70b-versatile",
        "temperature": 0.1,
        "maxTokens": 3000
      }
    },
    {
      "stage": "AI_RESPONSE_RECEIVED",
      "timestamp": "2026-02-19T10:30:03.500Z",
      "data": {
        "responseTimeMs": 1750,
        "tokenUsage": {
          "prompt": 512,
          "completion": 892,
          "total": 1404
        }
      }
    },
    {
      "stage": "OUTPUT_VALIDATION",
      "timestamp": "2026-02-19T10:30:03.600Z",
      "data": {
        "validationErrors": [],
        "hallucinationFlags": [],
        "speculativeLanguage": [],
        "status": "PASSED"
      }
    },
    {
      "stage": "CACHE_UPDATE",
      "timestamp": "2026-02-19T10:30:03.700Z",
      "data": {
        "cacheKey": "analysis:RELIANCE.NS:20260219",
        "ttl": 86400000
      }
    },
    {
      "stage": "FINAL_OUTPUT",
      "timestamp": "2026-02-19T10:30:03.800Z",
      "data": {
        "totalProcessingTimeMs": 3700,
        "responseSize": 15234,
        "confidence": 94
      }
    }
  ],
  "summary": {
    "success": true,
    "entity": "RELIANCE.NS",
    "processingTimeMs": 3700,
    "dataQuality": {
      "sourceCount": 4,
      "confidence": 94,
      "flags": []
    }
  }
}
```

### 9.2 Debug Log Locations

```
logs/
├── pipeline/                           # Pipeline trace logs
│   ├── req_20260219_103000_abc123.json
│   ├── req_20260219_103045_def456.json
│   └── ...
│
├── errors/                             # Error logs
│   ├── entity_resolution_errors.log
│   ├── api_errors.log
│   ├── ai_errors.log
│   └── system_errors.log
│
├── performance/                        # Performance metrics
│   ├── api_response_times.log
│   ├── ai_latency.log
│   └── cache_hit_rates.log
│
└── audit/                              # Audit trails
    ├── cache_audits.log
    ├── data_validation.log
    └── access_logs.log
```

### 9.3 Common Issues & Debugging

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                    COMMON ISSUES & DEBUGGING GUIDE                           │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│ ISSUE 1: Low Confidence Scores (<70%)                                       │
│ ───────────────────────────────────                                         │
│ Symptoms: Results show "Low Confidence" warnings                             │
│                                                                             │
│ Root Causes:                                                                │
│ • Single source data → Check STAGE_013-017 in pipeline trace                │
│ • High variance across sources → Check STAGE_019 variance value             │
│ • Entity not in dataset → Check STAGE_004-006 resolution attempts           │
│                                                                             │
│ Debug Steps:                                                                │
│ 1. Check logs/pipeline/req_*.json for failed API calls                     │
│ 2. Verify API keys in .env.local                                           │
│ 3. Check rate limit status in STAGE_015-017                                │
│ 4. Review data source priority in lib/data/orchestrator.ts                 │
│                                                                             │
│ Fix:                                                                        │
│ • Enable fallback sources in priority-manager.ts                            │
│ • Increase fuzzy matching threshold in entity-resolver.ts                   │
│ • Add entity to datasets/all_real_companies_combined.csv                    │
│                                                                              │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│ ISSUE 2: AI Hallucinations                                                  │
│ ─────────────────────────                                                   │
│ Symptoms: AI generates numbers not in source data                           │
│                                                                             │
│ Root Causes:                                                                │
│ • Guardrails bypassed → Check STAGE_025 validation results                  │
│ • Missing citations → Check for [Source: X] format                          │
│ • Temperature too high → Should be 0.1 in groq-client.ts                    │
│                                                                             │
│ Debug Steps:                                                                │
│ 1. Check STAGE_025 for hallucination_flags[]                                │
│ 2. Review AI prompt in STAGE_022                                            │
│ 3. Verify groq-client.ts temperature setting                                │
│ 4. Check if input data is complete in STAGE_021                             │
│                                                                             │
│ Fix:                                                                        │
│ • Strengthen guardrails in lib/ai/ai-guardrails.ts                          │
│ • Reduce temperature to 0.0 in groq-client.ts                               │
│ • Add mandatory citation requirements in prompts                            │
│ • Implement pre-submission verification                                     │
│                                                                              │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│ ISSUE 3: API Rate Limit Errors                                              │
│ ──────────────────────────────                                              │
│ Symptoms: 429 errors, "Rate limit exceeded" messages                        │
│                                                                             │
│ Root Causes:                                                                │
│ • Too many requests → Check logs/performance/api_response_times.log         │
│ • No rate limit handling → Check fetchers/* for retry logic                 │
│ • Missing API keys → Check .env.local configuration                         │
│                                                                             │
│ Debug Steps:                                                                │
│ 1. Check API call frequency in logs/api_errors.log                         │
│ 2. Verify rate limit headers in API responses                               │
│ 3. Check if multiple requests are made simultaneously                       │
│ 4. Review rate limit configuration in config/constants.ts                   │
│                                                                             │
│ Fix:                                                                        │
│ • Implement request queuing in fetchers/                                    │
│ • Add exponential backoff retry logic                                       │
│ • Cache results to reduce API calls                                         │
│ • Distribute load across multiple API keys                                  │
│                                                                              │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│ ISSUE 4: Entity Resolution Failures                                         │
│ ───────────────────────────────────                                         │
│ Symptoms: "Company not found", wrong company matched                        │
│                                                                             │
│ Root Causes:                                                                │
│ • Company not in dataset → Check STAGE_004 exact match                      │
│ • Fuzzy threshold too strict → Check entity-resolver.ts                     │
│ • Alias mapping missing → Check brands_master.csv                           │
│                                                                             │
│ Debug Steps:                                                                │
│ 1. Check STAGE_004-006 for resolution attempts                              │
│ 2. Test query against entity-resolver.ts directly                           │
│ 3. Verify company exists in datasets/                                       │
│ 4. Check fuzzy similarity scores in STAGE_005                               │
│                                                                             │
│ Fix:                                                                        │
│ • Add company to master dataset                                             │
│ • Add brand alias to brands_master.csv                                      │
│ • Lower fuzzy threshold temporarily                                         │
│ • Implement secondary web search verification                               │
│                                                                              │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│ ISSUE 5: Stale Cache Data                                                   │
│ ─────────────────────                                                       │
│ Symptoms: Old financial data, outdated metrics                              │
│                                                                             │
│ Root Causes:                                                                │
│ • TTL not expired → Check STAGE_009 cache_age                               │
│ • Cache not invalidated → Check cache invalidation logic                    │
│ • Realtime mode disabled → Check REALTIME_PRIORITY_MODE env                 │
│                                                                             │
│ Debug Steps:                                                                │
│ 1. Check cache entry age in STAGE_009 or logs/audit/cache_audits.log       │
│ 2. Verify TTL configuration in lib/data/cache-manager.ts                    │
│ 3. Check if cache invalidation triggers are working                         │
│ 4. Review REALTIME_PRIORITY_MODE environment variable                       │
│                                                                             │
│ Fix:                                                                        │
│ • Manually invalidate cache: DELETE /api/cache?pattern=company              │
│ • Reduce TTL for financial data                                             │
│ • Enable REALTIME_PRIORITY_MODE=true                                        │
│ • Add cache-bypass option for critical queries                              │
│                                                                              │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## 10. Configuration Reference

### 10.1 Environment Variables

```bash
# REQUIRED - Core functionality will fail without these
GROQ_API_KEY=gsk_your_groq_api_key_here              # AI analysis
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key

# RECOMMENDED - Required for full functionality
GOOGLE_CUSTOM_SEARCH_API_KEY=your_google_api_key     # Web search (100/day free)
GOOGLE_SEARCH_ENGINE_ID=your_search_engine_id        # Custom search engine
ALPHA_VANTAGE_API_KEY=your_alpha_vantage_key         # Financial data (500/day free)
FMP_API_KEY=your_fmp_api_key                         # Financial data (250/day free)

# OPTIONAL - Enhanced features
PYTHON_SERVICE_URL=http://localhost:8000             # Python microservice
PYTHON_SERVICE_SECRET=dev-secret                     # Service authentication
NEWSAPI_KEY=your_newsapi_key                         # News aggregation

# FEATURE FLAGS
REALTIME_PRIORITY_MODE=true                          # Prioritize fresh data
DEBUG=true                                           # Enable debug logging
ENABLE_CACHE=true                                    # Enable response caching
ENABLE_AI_GUARDAILS=true                             # Enable anti-hallucination

# CACHE CONFIGURATION
CACHE_TTL_HOURS=24                                   # Default cache TTL
CACHE_MAX_SIZE_MB=100                                # Max cache size

# RATE LIMITING
RATE_LIMIT_ENABLED=true                              # Enable rate limiting
MAX_REQUESTS_PER_MINUTE=60                           # Global rate limit

# AI CONFIGURATION
AI_MODEL=llama-3.3-70b-versatile                     # Groq model
AI_TEMPERATURE=0.1                                   # Factual precision (0-1)
AI_MAX_TOKENS=3000                                   # Max response length
AI_TIMEOUT_MS=30000                                  # AI API timeout

# TIMEOUTS
API_TIMEOUT_MS=10000                                 # External API timeout
FETCH_TIMEOUT_MS=5000                                # Data fetch timeout
REQUEST_TIMEOUT_MS=30000                             # Total request timeout
```

### 10.2 System Constants

```typescript
// lib/config/constants.ts

export const SYSTEM_CONSTANTS = {
  // Entity Resolution
  FUZZY_MATCH_THRESHOLD: 0.75,           // 75% similarity required
  MIN_CONFIDENCE_FOR_AI: 70,             // Min confidence to proceed with AI
  MAX_SUGGESTIONS: 5,                    // Max entity suggestions
  
  // Data Validation
  MIN_REVENUE_CR: 1,                     // Minimum realistic revenue (1 Cr)
  MAX_REVENUE_CR: 1000000,               // Maximum realistic revenue (10 Lakh Cr)
  HIGH_VARIANCE_THRESHOLD: 0.15,         // 15% variance = high
  MIN_SOURCES_FOR_CONSENSUS: 2,          // Min sources for reliable consensus
  
  // Cache
  DEFAULT_CACHE_TTL_MS: 24 * 60 * 60 * 1000,  // 24 hours
  MAX_CACHE_SIZE_MB: 100,
  CACHE_CLEANUP_INTERVAL_MS: 60 * 60 * 1000,  // 1 hour
  
  // Rate Limiting
  DEFAULT_RATE_LIMIT_PER_MIN: 60,
  RATE_LIMIT_WINDOW_MS: 60 * 1000,       // 1 minute window
  
  // AI
  AI_TEMPERATURE: 0.1,
  AI_MAX_TOKENS: 3000,
  AI_TIMEOUT_MS: 30000,
  MAX_RETRIES_ON_HALLUCINATION: 2,
  
  // Timeouts
  API_TIMEOUT_MS: 10000,
  FETCH_TIMEOUT_MS: 5000,
  REQUEST_TIMEOUT_MS: 30000,
  
  // Data Fetching
  MAX_PARALLEL_REQUESTS: 4,
  DEFAULT_FETCH_DEPTH: 1,
  MAX_SOURCES_PER_QUERY: 10,
  
  // Logging
  LOG_LEVEL: process.env.DEBUG ? 'debug' : 'info',
  MAX_LOG_FILES: 10,
  LOG_ROTATION_SIZE_MB: 50
};

// Data Source Specific Limits
export const RATE_LIMITS = {
  yahooFinance: { requestsPerMinute: 60, requestsPerDay: 2000 },
  alphaVantage: { requestsPerMinute: 5, requestsPerDay: 500 },
  fmp: { requestsPerMinute: 4, requestsPerDay: 250 },
  nseIndia: { requestsPerMinute: 10, requestsPerDay: 1000 },
  googleSearch: { requestsPerDay: 100 }
};
```

### 10.3 File-to-Feature Mapping

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                    FILE-TO-FEATURE MAPPING                                   │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│ FEATURE: Company Search & Identification                                    │
│ ─────────────────────────────────────                                       │
│ Files:                                                                      │
│ • components/dashboard/SearchBar.tsx           → UI component               │
│ • lib/resolution/entity-resolver.ts            → Resolution logic           │
│ • lib/datasets/company-database.ts             → Database queries           │
│ • app/api/companies/route.ts                   → API endpoint               │
│                                                                              │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│ FEATURE: Financial Data Aggregation                                         │
│ ───────────────────────────────────                                         │
│ Files:                                                                      │
│ • lib/data/orchestrator.ts                     → Main orchestrator          │
│ • lib/data/multi-source-orchestrator.ts        → Cross-validation           │
│ • lib/fetchers/*.ts                            → API fetchers               │
│ • python-service/main.py                       → NSE/BSE scraping           │
│                                                                              │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│ FEATURE: AI-Powered Analysis                                                │
│ ──────────────────────────                                                  │
│ Files:                                                                      │
│ • lib/ai/groq-client.ts                        → API client                 │
│ • lib/ai/groq-prompts.ts                       → Prompt definitions         │
│ • lib/ai/ai-guardrails.ts                      → Anti-hallucination         │
│ • lib/ai/prompt-builder.ts                     → Dynamic prompts            │
│ • lib/analyzers/*.ts                           → Analysis engines           │
│                                                                              │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│ FEATURE: Data Validation & Quality                                          │
│ ──────────────────────────────────                                          │
│ Files:                                                                      │
│ • lib/debugging/data-validator.ts              → Validation logic           │
│ • lib/data/cache-manager.ts                    → Cache validation           │
│ • lib/debugging/pipeline-tracer.ts             → Pipeline tracing           │
│ • lib/debugging/cache-auditor.ts               → Cache auditing             │
│                                                                              │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│ FEATURE: Dashboard & Visualization                                          │
│ ──────────────────────────────────                                          │
│ Files:                                                                      │
│ • components/dashboard/AnalysisDashboard.tsx   → Main dashboard             │
│ • components/dashboard/tabs/*.tsx              → Tab components             │
│ • components/charts/*.tsx                      → Chart components           │
│ • app/analyze/[industry]/page.tsx              → Analysis page              │
│                                                                              │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│ FEATURE: Dataset Management                                                 │
│ ───────────────────────────                                                 │
│ Files:                                                                      │
│ • lib/datasets/company-database.ts             → CSV loading                │
│ • lib/industry/industry-dataset.ts             → Master dataset             │
│ • datasets/all_real_companies_combined.csv     → Raw data                   │
│ • scripts/validate-datasets.ts                 → Validation                 │
│                                                                              │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## Appendix A: Quick Reference

### Debugging Commands

```bash
# Check recent pipeline traces
ls -la logs/pipeline/ | tail -20

# View specific request trace
cat logs/pipeline/req_[timestamp].json | jq '.stages[] | {stage, timestamp}'

# Check API errors
tail -f logs/errors/api_errors.log

# Monitor cache hit rates
tail -f logs/performance/cache_hit_rates.log

# Validate dataset integrity
npm run validate-datasets

# Clear cache
npm run cache:clear

# Run health check
curl http://localhost:3000/api/health
```

### Key Metrics to Monitor

1. **Pipeline Success Rate** - Should be >95%
2. **Average Response Time** - Should be <5 seconds
3. **Cache Hit Rate** - Should be >60%
4. **AI Hallucination Rate** - Should be <1%
5. **API Error Rate** - Should be <5%
6. **Average Confidence Score** - Should be >80%

---

*Last Updated: February 19, 2026*
*Version: 2.0*
*Total Components: 75+ files*
*Data Sources: 6 APIs + Python Service*
*Supported Companies: 995+*
*Supported Industries: 29*
