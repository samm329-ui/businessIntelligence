# EBITA Intelligence System - Complete Architecture Documentation

## Table of Contents
1. [System Overview](#1-system-overview)
2. [Data Pipeline Architecture](#2-data-pipeline-architecture)
3. [Complete File Inventory & Actions](#3-complete-file-inventory--actions)
4. [Flow Diagrams](#4-flow-diagrams)
5. [Layer-Based Architecture](#5-layer-based-architecture)
   5.1 [Database Schema (Supabase/PostgreSQL)](#51-database-schema-supabasepostgresql)
6. [Core Engine Logic](#6-core-engine-logic)
7. [Core Concepts](#7-core-concepts)
8. [Data Sources & APIs](#8-data-sources--apis)
9. [Error Handling & Debugging](#9-error-handling--debugging)
10. [Configuration Reference](#10-configuration-reference)
11. [Latest Updates & Version History](#11-latest-updates--version-history)
12. [Component Connection Diagrams](#12-component-connection-diagrams)
13. [Machine Learning Module](#13-machine-learning-module)
14. [N.A.T. AI Assistant Integration](#14-nat-ai-assistant-integration)
15. [Search Queries - APIs & N.A.T](#15-search-queries---apis--nat)
16. [Data Rectifier Module](#16-data-rectifier-module)
17. [Complete System Architecture Diagram](#17-complete-system-architecture-diagram)
18. [Database Details](#18-database-details)
19. [Version History](#19-version-history)
20. [VERSION 9.0 - Complete Layer-Based Architecture](#20-version-90---complete-layer-based-architecture)
21. [Currency & Global Comparison (v9.1)](#21-currency--global-comparison-v91)

---

## 1. System Overview

### 1.1 Project Purpose
EBITA Intelligence is a real-time business intelligence platform providing company and industry analysis through multi-source data aggregation, AI-powered insights, and comprehensive data validation.

### 1.2 Technology Stack
- **Frontend**: Next.js 16 + React 19 + Tailwind CSS 4
- **Backend**: Next.js API Routes + Python FastAPI Microservice
- **AI/ML**: Groq API (meta-llama/llama-4-scout-17b-16e-instruct)
- **Database**: Supabase (PostgreSQL)
- **External APIs**: Yahoo Finance, Alpha Vantage, Financial Modeling Prep, NSE India
- **Data Visualization**: Recharts
- **UI Components**: shadcn/ui
- **V2 Orchestrator**: TypeScript + Python wrappers + Cheerio scraping

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
    Model: meta-llama/llama-4-scout-17b-16e-instruct
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
│   │   CONFIG: model=meta-llama/llama-4-scout-17b-16e-instruct, temp=0.1, max_tokens=3000
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
    ├─▶ Model: meta-llama/llama-4-scout-17b-16e-instruct
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

## 5.1 Database Schema (Supabase/PostgreSQL)

The EBITA Intelligence Platform uses Supabase (PostgreSQL) for persistent storage. Below is the complete schema:

### 5.1.1 Entity Intelligence Table
```sql
CREATE TABLE public.entity_intelligence (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  canonical_name character varying NOT NULL,
  normalized_name text NOT NULL,
  entity_type character varying NOT NULL DEFAULT 'company',
  parent_entity_id uuid,
  ticker_nse character varying,
  ticker_bse character varying,
  ticker_global character varying,
  isin character varying,
  sector character varying,
  industry character varying,
  sub_industry character varying,
  niche character varying,
  industry_code character varying,
  country character varying DEFAULT 'India',
  state character varying,
  city character varying,
  region character varying DEFAULT 'INDIA',
  is_listed boolean DEFAULT true,
  is_verified boolean DEFAULT false,
  is_active boolean DEFAULT true,
  exchange character varying,
  founded_year integer,
  all_aliases jsonb DEFAULT '[]',
  brands jsonb DEFAULT '[]',
  competitors jsonb DEFAULT '[]',
  subsidiaries jsonb DEFAULT '[]',
  wikipedia_url text,
  website text,
  description text,
  key_people jsonb DEFAULT '[]',
  source character varying,
  data_quality_score integer DEFAULT 0,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  CONSTRAINT entity_intelligence_pkey PRIMARY KEY (id)
);
```

**Purpose:** Master table for all companies, brands, and entities  
**Key Indexes:** `normalized_name`, `ticker_nse`, `industry`, `sector`  
**Used By:** Entity resolver, identifier, collector

### 5.1.2 Consensus Metrics Table
```sql
CREATE TABLE public.consensus_metrics (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  entity_id uuid NOT NULL,
  entity_type character varying NOT NULL DEFAULT 'company',
  entity_name character varying NOT NULL,
  fiscal_period character varying NOT NULL DEFAULT 'TTM',
  market_cap bigint,
  current_price numeric,
  price_change_1d numeric,
  price_change_1y numeric,
  week_high_52 numeric,
  week_low_52 numeric,
  volume bigint,
  revenue bigint,
  revenue_growth numeric,
  gross_profit bigint,
  gross_margin numeric,
  operating_income bigint,
  operating_margin numeric,
  net_income bigint,
  net_margin numeric,
  ebitda bigint,
  ebitda_margin numeric,
  eps numeric,
  total_assets bigint,
  total_liabilities bigint,
  total_debt bigint,
  shareholder_equity bigint,
  cash_and_equivalents bigint,
  pe_ratio numeric,
  pb_ratio numeric,
  ps_ratio numeric,
  ev_to_ebitda numeric,
  debt_to_equity numeric,
  current_ratio numeric,
  quick_ratio numeric,
  roe numeric,
  roa numeric,
  roic numeric,
  roce numeric,
  free_cash_flow bigint,
  operating_cash_flow bigint,
  capital_expenditure bigint,
  confidence_score integer DEFAULT 0,
  sources_used jsonb DEFAULT '[]',
  source_weights jsonb DEFAULT '{}',
  variance_flags jsonb DEFAULT '[]',
  outliers_removed jsonb DEFAULT '{}',
  data_quality integer DEFAULT 0,
  fetched_at timestamp with time zone DEFAULT now(),
  expires_at timestamp with time zone NOT NULL,
  CONSTRAINT consensus_metrics_pkey PRIMARY KEY (id)
);
```

**Purpose:** Stores validated financial metrics with consensus from multiple sources  
**Key Indexes:** `entity_id`, `entity_name`, `expires_at`  
**Used By:** Consensus engine, analyzer, cache layer

### 5.1.3 Analysis Results Table
```sql
CREATE TABLE public.analysis_results (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  entity_id uuid,
  entity_name character varying NOT NULL,
  analysis_type character varying NOT NULL,
  consensus_id uuid,
  executive_summary text,
  key_findings jsonb DEFAULT '[]',
  risks jsonb DEFAULT '[]',
  opportunities jsonb DEFAULT '[]',
  vs_industry_benchmark jsonb,
  investor_highlights jsonb DEFAULT '[]',
  strategic_recommendations jsonb DEFAULT '[]',
  data_gaps_note text,
  ai_model character varying,
  ai_confidence integer,
  tokens_used integer,
  hallucination_detected boolean DEFAULT false,
  validation_passed boolean DEFAULT true,
  created_at timestamp with time zone DEFAULT now(),
  expires_at timestamp with time zone,
  CONSTRAINT analysis_results_pkey PRIMARY KEY (id)
);
```

**Purpose:** Stores AI-generated analysis results with validation metadata  
**Key Indexes:** `entity_id`, `analysis_type`, `created_at`  
**Used By:** AI guardrails, response builder, caching

### 5.1.4 Intelligence Cache Table
```sql
CREATE TABLE public.intelligence_cache (
  id uuid NOT NULL DEFAULT uuid_generate_v4(),
  cache_key text NOT NULL UNIQUE,
  cache_layer character varying NOT NULL DEFAULT 'consensus',
  entity_id uuid,
  entity_name text,
  cache_data jsonb NOT NULL,
  cache_version integer DEFAULT 1,
  ttl_seconds integer DEFAULT 86400,
  expires_at timestamp with time zone NOT NULL,
  hit_count integer DEFAULT 0,
  created_at timestamp with time zone DEFAULT now(),
  last_accessed_at timestamp with time zone DEFAULT now(),
  CONSTRAINT intelligence_cache_pkey PRIMARY KEY (id)
);
```

**Purpose:** Multi-layer caching for fast data retrieval  
**Cache Layers:** `consensus`, `analysis`, `entity`, `search`  
**TTL:** Default 24 hours (86400 seconds)  
**Used By:** Cache manager, orchestrator, API routes

### 5.1.5 API Fetch Log Table
```sql
CREATE TABLE public.api_fetch_log (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  entity_id uuid,
  entity_name character varying,
  source_name character varying NOT NULL,
  ticker_used character varying,
  endpoint_called text,
  metrics_returned jsonb DEFAULT '[]',
  response_time_ms integer,
  success boolean DEFAULT true,
  error_message text,
  http_status integer,
  fetched_at timestamp with time zone DEFAULT now(),
  CONSTRAINT api_fetch_log_pkey PRIMARY KEY (id)
);
```

**Purpose:** Audit trail for all external API calls  
**Used For:** Debugging, performance monitoring, error tracking

### 5.1.6 Data Deltas Table
```sql
CREATE TABLE public.data_deltas (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  entity_id uuid NOT NULL,
  entity_name character varying,
  metric_name character varying NOT NULL,
  previous_value numeric,
  new_value numeric,
  change_absolute numeric,
  change_percent numeric,
  change_direction character varying,
  is_significant boolean DEFAULT false,
  detected_at timestamp with time zone DEFAULT now(),
  source character varying,
  CONSTRAINT data_deltas_pkey PRIMARY KEY (id)
);
```

**Purpose:** Track changes in financial metrics over time  
**Used By:** Delta detector, change monitor, alerting

### 5.1.7 Sector Hierarchy Table
```sql
CREATE TABLE public.sector_hierarchy (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  sector character varying NOT NULL,
  industry character varying NOT NULL,
  sub_industry character varying,
  niche character varying,
  description text,
  typical_pe_range character varying,
  typical_ebitda_margin character varying,
  typical_revenue_growth character varying,
  key_metrics jsonb DEFAULT '[]',
  top_companies jsonb DEFAULT '[]',
  created_at timestamp with time zone DEFAULT now(),
  CONSTRAINT sector_hierarchy_pkey PRIMARY KEY (id)
);
```

**Purpose:** Industry classification and benchmarks  
**Used By:** Entity resolver, industry analyzer, comparator

### 5.1.8 Database Connection Flow

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                         DATABASE CONNECTION FLOW                             │
└─────────────────────────────────────────────────────────────────────────────┘

                         ┌─────────────────────────┐
                         │   Supabase Client      │
                         │   (lib/db.ts)         │
                         └───────────┬─────────────┘
                                     │
         ┌───────────────────────────┼───────────────────────────┐
         │                           │                           │
         ▼                           ▼                           ▼
┌─────────────────┐     ┌─────────────────┐     ┌─────────────────┐
│   Read Operations │     │  Write Operations │     │  Cache Layer    │
│                  │     │                  │     │                 │
│ • Entity lookup │     │ • Store results │     │ • Check first  │
│ • Consensus fetch│    │ • Update metrics │     │ • TTL: 24h     │
│ • Industry info │     │ • Log API calls │     │ • Hit counter  │
└────────┬────────┘     └────────┬────────┘     └────────┬────────┘
         │                      │                      │
         └──────────────────────┼──────────────────────┘
                                │
                                ▼
                    ┌─────────────────────────┐
                    │    PostgreSQL          │
                    │    (Supabase)         │
                    │                        │
                    │  Tables:               │
                    │  • entity_intelligence │
                    │  • consensus_metrics   │
                    │  • analysis_results    │
                    │  • intelligence_cache  │
                    │  • api_fetch_log       │
                    │  • data_deltas         │
                    │  • sector_hierarchy    │
                    └─────────────────────────┘
```

### 5.1.9 Data Flow to Database

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                      DATA PERSISTENCE FLOW                                  │
└─────────────────────────────────────────────────────────────────────────────┘

  Phase 1: Collection
  ───────────────────
  ┌──────────────┐    ┌──────────────┐    ┌──────────────┐
  │ MultiChannel │───▶│  Financial   │───▶│   API Fetch  │
  │ Acquisition  │    │  Extractor   │    │     Log      │
  └──────────────┘    └──────────────┘    └──────┬───────┘
                                                  │
                                                  ▼
  Phase 2: Validation                                       
  ──────────────────
  ┌──────────────┐    ┌──────────────┐    ┌──────────────┐
  │  Consensus   │───▶│   Delta      │───▶│  Intelligence │
  │   Engine     │    │  Detector    │    │    Cache      │
  └──────────────┘    └──────────────┘    └──────┬───────┘
                                                  │
  Phase 3: Storage                                         
  ──────────────────                                
                                    ┌──────────────┴───────┐
                                    │                       │
                                    ▼                       ▼
                          ┌─────────────────┐    ┌─────────────────┐
                          │   Analysis      │    │   Consensus     │
                          │   Results       │    │   Metrics       │
                          │ (analysis_results)│   │(consensus_metrics)
                          └─────────────────┘    └─────────────────┘
                                    │
                                    ▼
                          ┌─────────────────┐
                          │     Delta       │
                          │     Tracking    │
                          │  (data_deltas)  │
                          └─────────────────┘
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
    model: 'meta-llama/llama-4-scout-17b-16e-instruct',
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
        "model": "meta-llama/llama-4-scout-17b-16e-instruct",
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
AI_MODEL=meta-llama/llama-4-scout-17b-16e-instruct                     # Groq model
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

## 11. Latest Updates & Version History

### 11.1 Version 8.0 Updates (February 21, 2026)

#### V2 Multi-Source Orchestrator

**Date:** February 21, 2026  
**Status:** PRODUCTION-READY

| Change | Description | Impact |
|--------|-------------|--------|
| **orchestrator-v2.ts** | New TypeScript orchestrator with multi-source integration | Single authoritative orchestrator |
| **Python Crawler Wrapper** | scripts/run_crawler.py | Robust Python bot integration |
| **Python NET Bot Wrapper** | scripts/run_netbot.py | LLM analysis with merged data |
| **Structured APIs First** | FMP → Alpha → Yahoo priority order | Most reliable data sources first |
| **SERP Fallback** | Google CSE + SerpAPI | Real-time scraping when APIs fail |
| **Merge/Score Logic** | Weighted median + confidence scoring | Normalizes all metrics |
| **Derived Metrics** | EBITDA margin computed from revenue/EBITDA | Always returns value |

#### Architecture Flow

```
Company Input → discoverTicker() → Yahoo Search API
    ↓
Fetch Structured Data (Parallel):
  ├─ fetchFromFMP()      → FMP API
  ├─ fetchFromAlpha()    → Alpha Vantage API
  └─ fetchYahooFinancials() → Yahoo Finance
    ↓
runPythonCrawler() → Python wrapper → Your existing crawler
    ↓
Google Custom Search → SERP links
    ↓
scrapeLinks() → Cheerio scraping of financial pages
    ↓
mergeCandidates() → Weighted median + confidence scoring
    ↓
computeDerived() → EBITDA margin from revenue/EBITDA
    ↓
runNetBot() → Python LLM with merged data (NO hallucination)
    ↓
Return: { merged metrics, provenance, competitors, analysis }
```

#### Files Created

```
lib/orchestrator-v2.ts              → Multi-source orchestrator (TypeScript)
scripts/run_crawler.py              → Python crawler wrapper
scripts/run_netbot.py               → Python NET bot (LLM) wrapper
app/api/analyze/route.ts            → Added PUT handler for V2
.env.local                          → Added V2 config variables
```

#### Errors Encountered & Fixed

1. **Cheerio Import Error**: Module has no default export
   - Fix: Changed to `import * as cheerio from "cheerio"`

2. **p-Retry Type Error**: RetryContext doesn't have .message property
   - Fix: Cast to `any` in onFailedAttempt callback

3. **Catch Block Type Errors**: 'e' is of type 'unknown'
   - Fix: Added `catch (e: any)` throughout

4. **Missing provenance Property**: FMP/Alpha return types didn't have provenance
   - Fix: Cast to `any` when spreading objects

#### API Usage

```bash
# Using V2 Orchestrator
curl -X PUT http://localhost:3000/api/analyze \
  -H "Content-Type: application/json" \
  -d '{"company": "Tata Motors", "region": "India"}'

# Or with explicit mode
curl -X PUT http://localhost:3000/api/analyze \
  -H "Content-Type: application/json" \
  -d '{"company": "Reliance Industries", "mode": "v2"}'
```

---

### 11.2 Version 7.0 Updates (February 19, 2026 - 15:30 IST)

- OVERHAUL: Hardcoded data elimination
- Keyword classification for instant sector detection
- Smart search with client-side intent detection
- Self-learning classification store

### 11.3 Version 6.0 Updates (February 19, 2026 - 14:30 IST)

- Response contract normalization
- Unknown entity store for later enrichment
- Entity discovery background worker

### 11.4 Version 5.4 Updates (February 19, 2026 - 13:55 IST)

#### Major Changes

| Change | Description | Impact |
|--------|-------------|--------|
| **Groq Model Upgrade** | Updated from llama-3.x to meta-llama/llama-4-scout-17b-16e-instruct | Better AI analysis quality |
| **Confidence Threshold** | Lowered from 60% to 35% in analyzer.ts | More analyses can run with lower confidence |
| **PDF Worker Fix** | Installed pdfjs-dist@3.11.174 | PDF parsing now works |
| **Zepto Industry Fix** | Added Quick Commerce sector mappings | Zepto/Blinkit resolve correctly |

#### Files Modified

```
lib/analyzers/groq.ts                      → Model update
lib/ai/groq-prompts.ts                    → Model update
lib/ai/ai-guardrails-v2.ts                → Model update
lib/intelligence/analyzer.ts               → Model + confidence threshold
lib/integration/main-orchestrator.ts       → Model update
lib/analyzers/ai.ts                       → Model update
lib/pipeline.ts                            → Documentation update
lib/analyzers/ai-analyzer.ts              → NEW FILE
lib/intelligence/collector.ts               → Competitor extractor fix
lib/intelligence/financial-extractor.ts    → Revenue pattern fix
lib/resolution/entity-resolver-v2.ts       → Zepto/Quick Commerce mappings
lib/intelligence/identifier.ts             → Zepto mappings
```

#### Errors Fixed

1. **Model Mismatch (13:25)**: Old llama-3.x references across 7 files
2. **Import Path Issues (13:28)**: Created ai-analyzer.ts with correct imports
3. **LSP Errors (13:30)**: Ignored - source files not in project
4. **Confidence Threshold (13:45)**: AI blocked due to 60% threshold
5. **PDF Worker (13:50)**: Missing pdf.worker.mjs module
6. **Zepto Unknown (13:52)**: Industry classification failed

### 11.5 Version 5.3 Updates (February 19, 2026 - 13:00 IST)

| Change | Description | Impact |
|--------|-------------|--------|
| **Competitor Extractor** | Added BLACKLIST, stricter regex patterns | No more "had", "company", "also" |
| **Revenue Extraction** | Added (?!\s*%) negative lookahead | No more 36.6% → ₹835 Cr confusion |

### 11.6 Version 5.0-5.2 Updates

- Search-first architecture
- Indian financial sites (screener.in, trendlyne.com, tickertape.in)
- Confidence gating at 60%
- Bot separation (Bot1A/B, Bot2)
- Consensus engine

---

## 12. Component Connection Diagram

### 12.1 Request Flow

```
┌──────────────────────────────────────────────────────────────────────────────┐
│                              USER REQUEST                                     │
└──────────────────────────────────────────────────────────────────────────────┘
                                      │
                                      ▼
┌──────────────────────────────────────────────────────────────────────────────┐
│                        INPUT PROCESSING LAYER                                │
│  ┌─────────────────┐    ┌─────────────────┐    ┌─────────────────────┐     │
│  │ InputSanitizer  │───▶│ QueryClassifier│───▶│ EntityResolver      │     │
│  │                 │    │                 │    │                     │     │
│  │ • Normalize     │    │ • brand        │    │ • Exact Match       │     │
│  │ • Sanitize      │    │ • company      │    │ • Fuzzy Match       │     │
│  │ • Validate      │    │ • industry     │    │ • Quick Commerce   │     │
│  └─────────────────┘    └─────────────────┘    │ • SECTOR_MAP       │     │
│                                                  └──────────┬──────────┘     │
└──────────────────────────────────────────────────────────────┘               │
                                       │                                       │
                                       ▼                                       │
┌──────────────────────────────────────────────────────────────────────────────┐
│                        DATA ORCHESTRATION LAYER                             │
│  ┌─────────────────┐    ┌─────────────────┐    ┌─────────────────────┐     │
│  │ Orchestrator    │───▶│ Collector       │───▶│ MultiChannel        │     │
│  │                 │    │                 │    │ Acquisition         │     │
│  │ • Pipeline      │    │ • Search        │    │                     │     │
│  │ • Coordination │    │ • Crawl         │    │ • Tier 1: APIs      │     │
│  │ • Confidence   │    │ • Extract       │    │ • Tier 2: Search    │     │
│  └────────┬────────┘    └────────┬────────┘    │ • Tier 3: Crawl    │     │
│           │                       │              └──────────┬──────────┘     │
│           │                       │                         │                 │
│           ▼                       ▼                         ▼                 │
│  ┌──────────────────────────────────────────────────────────────────────┐   │
│  │                    FINANCIAL EXTRACTOR                               │   │
│  │  • Revenue patterns (with % exclusion)                              │   │
│  │  • EBITDA, Profit, Market Cap                                       │   │
│  │  • Table parsing                                                    │   │
│  └──────────────────────────────────────────────────────────────────────┘   │
│                                    │                                        │
│                                    ▼                                        │
│  ┌──────────────────────────────────────────────────────────────────────┐   │
│  │                    CONSENSUS ENGINE                                   │   │
│  │  • Multi-source validation                                          │   │
│  │  • Confidence scoring                                               │   │
│  │  • Anomaly detection                                                │   │
│  └──────────────────────────────────────────────────────────────────────┘   │
└──────────────────────────────────────────────────────────────────────────────┘
                                       │
                                       ▼
┌──────────────────────────────────────────────────────────────────────────────┐
│                          AI ANALYSIS LAYER                                   │
│  ┌─────────────────┐    ┌─────────────────┐    ┌─────────────────────┐     │
│  │ AI Guardrails   │───▶│ Groq API        │───▶│ ResponseValidator   │     │
│  │                 │    │                 │    │                     │     │
│  │ • Input check   │    │ • llama-4-scout │    │ • Hallucination     │     │
│  │ • Prompt build  │    │ • temp: 0.1     │    │ • JSON validation   │     │
│  │ • Confidence    │    │ • max_tokens    │    │ • Output format    │     │
│  └─────────────────┘    └─────────────────┘    └──────────┬──────────┘     │
│                                                            │                │
└──────────────────────────────────────────────────────────────┘               │
                                       │                                       │
                                       ▼                                       │
┌──────────────────────────────────────────────────────────────────────────────┐
│                          OUTPUT LAYER                                        │
│  ┌─────────────────┐    ┌─────────────────┐    ┌─────────────────────┐     │
│  │ Cache Manager   │───▶│ ResponseBuilder │───▶│ Frontend Display    │     │
│  │                 │    │                 │    │                     │     │
│  │ • 24h TTL      │    │ • JSON format   │    │ • Dashboard         │     │
│  │ • Delta track  │    │ • Metadata       │    │ • Charts            │     │
│  │ • Error log    │    │ • Sources       │    │ • Tables            │     │
│  └─────────────────┘    └─────────────────┘    └─────────────────────┘     │
└──────────────────────────────────────────────────────────────────────────────┘
```

### 12.2 Data Flow

```
QUERY: "Zepto"
    │
    ▼
┌─────────────────────────────────────────┐
│ IDENTIFIER (identifier.ts)              │
│ • checkExcelDatabase()                  │
│ • quickCommerceMap: Zepto → Retail     │
│ • Returns: {industry: "Retail",        │
│            subIndustry: "Quick Commerce"}│
└─────────────────────────────────────────┘
    │
    ▼
┌─────────────────────────────────────────┐
│ ORCHESTRATOR (orchestrator.ts)          │
│ • Confidence: 85%                      │
│ • Builds financial queries              │
│ • Coordinates data collection           │
└─────────────────────────────────────────┘
    │
    ▼
┌─────────────────────────────────────────┐
│ COLLECTOR (collector.ts)                │
│ ┌─────────────────────────────────────┐ │
│ │ BLACKLIST Filter (NEW v5.3)         │ │
│ │ Blocks: had, company, also, etc     │ │
│ └─────────────────────────────────────┘ │
│ ┌─────────────────────────────────────┐ │
│ │ Stricter Competitor Patterns        │ │
│ │ competitors?: vs\.?|versus           │ │
│ └─────────────────────────────────────┘ │
└─────────────────────────────────────────┘
    │
    ├──────────────┬──────────────┬──────────────┐
    ▼              ▼              ▼              ▼
┌─────────┐  ┌──────────┐  ┌───────────┐  ┌─────────┐
│ Financial│  │Competitor │  │ Industry  │  │ News    │
│ Extractor│  │ Extractor │  │ Info      │  │ Search  │
└────┬────┘  └─────┬────┘  └─────┬─────┘  └────┬────┘
     │              │              │              │
     │              │              │              │
     │    ┌────────┴──────────────┴────────┐    │
     │    │ FINANCIAL EXTRACTOR (v5.3 FIX) │    │
     │    │ • (?!\s*%) negative lookahead  │    │
     │    │ • Blocks percentages as revenue │    │
     │    └───────────────────────────────┘    │
     │                   │                      │
     ▼                   ▼                      ▼
┌─────────────────────────────────────────────────────────┐
│              CONSENSUS ENGINE                          │
│  • Validates: revenue, ebitda, profit, marketCap     │
│  • Calculates confidence score                        │
│  • Flags anomalies                                   │
└─────────────────────────────────────────────────────────┘
                          │
                          ▼
┌─────────────────────────────────────────────────────────┐
│              AI ANALYSIS (Groq)                        │
│  Model: meta-llama/llama-4-scout-17b-16e-instruct    │
│  Confidence Gate: 35% (lowered from 60%)             │
│  • Anti-hallucination guardrails                     │
│  • JSON response validation                          │
└─────────────────────────────────────────────────────────┘
                          │
                          ▼
┌─────────────────────────────────────────────────────────┐
│              OUTPUT                                    │
│  {                                                   │
│    "summary": "...",                                 │
│    "financials": {revenue, ebitda, profit},          │
│    "competitors": ["Blinkit", "Swiggy Instamart"],   │
│    "confidence": 85                                   │
│  }                                                   │
└─────────────────────────────────────────────────────────┘
```

### 12.3 Layer Architecture

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                          PRESENTATION LAYER                                  │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐  ┌─────────────┐  │
│  │ Dashboard    │  │ Charts       │  │ Tables       │  │ Search      │  │
│  │ (React)      │  │ (Recharts)  │  │ (DataGrid)   │  │ (Input)     │  │
│  └──────────────┘  └──────────────┘  └──────────────┘  └─────────────┘  │
└─────────────────────────────────────────────────────────────────────────────┘
                                      │
                                      ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                           API LAYER                                          │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐  ┌─────────────┐  │
│  │ /api/analyze │  │ /api/search   │  │ /api/health  │  │ /api/metrics│  │
│  │              │  │              │  │              │  │             │  │
│  │ • POST       │  │ • GET        │  │ • GET        │  │ • GET       │  │
│  │ • Validate   │  │ • Query      │  │ • Status     │  │ • Prometheus│  │
│  │ • Route      │  │ • Filter     │  │ • Ready      │  │ • Scrape    │  │
│  └──────────────┘  └──────────────┘  └──────────────┘  └─────────────┘  │
└─────────────────────────────────────────────────────────────────────────────┘
                                      │
                                      ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                       INTELLIGENCE LAYER                                     │
│  ┌──────────────────────────────────────────────────────────────────────┐   │
│  │ ORCHESTRATOR (orchestrator.ts)                                      │   │
│  │  • Pipeline coordination    • Confidence scoring                   │   │
│  │  • Error handling          • Data flow management                  │   │
│  └──────────────────────────────────────────────────────────────────────┘   │
│           │                    │                    │                      │
│           ▼                    ▼                    ▼                      │
│  ┌───────────────┐  ┌─────────────────┐  ┌─────────────────────────┐      │
│  │ IDENTIFIER    │  │ COLLECTOR       │  │ ANALYZER               │      │
│  │               │  │                 │  │                         │      │
│  │ • Entity      │  │ • Search       │  │ • AI Guardrails        │      │
│  │   resolution  │  │ • Crawl       │  │ • Groq API             │      │
│  │ • Industry    │  │ • Extract     │  │ • Validation           │      │
│  │   detection  │  │ • Competitor  │  │ • Output format        │      │
│  │ • Zepto fix  │  │   BLACKLIST   │  │                         │      │
│  └───────────────┘  └─────────────────┘  └─────────────────────────┘      │
│           │                    │                    │                      │
│           │                    ▼                    │                      │
│           │           ┌─────────────────┐          │                      │
│           │           │ FINANCIAL       │          │                      │
│           │           │ EXTRACTOR       │◄─────────┘                      │
│           │           │                 │                                 │
│           │           │ • Revenue (v5.3)│                                 │
│           │           │ • EBITDA         │                                 │
│           │           │ • Market Cap    │                                 │
│           │           │ • % exclusion   │                                 │
│           │           └─────────────────┘                                 │
│           │                    │                                          │
│           ▼                    ▼                                          │
│  ┌──────────────────────────────────────────────────────────────────────┐   │
│  │                    CONSENSUS ENGINE                                   │   │
│  │  • Multi-source validation    • Confidence calculation             │   │
│  │  • Anomaly detection          • Data freshness                     │   │
│  └──────────────────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────────────────┘
                                      │
                                      ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                          DATA LAYER                                         │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐  ┌─────────────┐  │
│  │ Supabase     │  │ Cache        │  │ Datasets     │  │ Python      │  │
│  │              │  │ (Memory)     │  │ (Excel/CSV) │  │ Service     │  │
│  │ • PostgreSQL │  │ • 24h TTL    │  │ • 995+ comp │  │ • NSE/BSE  │  │
│  │ • Tables     │  │ • In-memory  │  │ • 29 ind    │  │ • Scraping │  │
│  │ • Queries    │  │ • Delta      │  │ • Dynamic   │  │             │  │
│  └──────────────┘  └──────────────┘  └──────────────┘  └─────────────┘  │
└─────────────────────────────────────────────────────────────────────────────┘
                                      │
                                      ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                      EXTERNAL SERVICES                                       │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐  ┌─────────────┐  │
│  │ Groq AI     │  │ Google Search│  │ Financial    │  │ Stock       │  │
│  │              │  │              │  │ APIs         │  │ Exchanges   │  │
│  │ • llama-4   │  │ • Custom     │  │ • Yahoo      │  │ • NSE       │  │
│  │ • Guardrails│  │   Search     │  │ • FMP        │  │ • BSE       │  │
│  │ • Analysis  │  │ • SerpAPI    │  │ • Alpha V    │  │             │  │
│  └──────────────┘  └──────────────┘  └──────────────┘  └─────────────┘  │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## 13. Machine Learning Module

### 13.1 Overview

The ML module (`lib/ml/ml-utils.ts`) provides machine learning algorithms for enhanced business intelligence:

| Algorithm | Purpose | Integration |
|-----------|---------|-------------|
| **K-Nearest Neighbors (KNN)** | Competitor similarity scoring | orchestrator-v2.ts |
| **Linear Regression** | Revenue growth prediction | orchestrator-v2.ts |
| **Decision Tree** | Industry classification fallback | orchestrator-v2.ts |

### 13.2 KNN - Competitor Similarity

**File:** `lib/ml/ml-utils.ts`

**Algorithm:**
- Uses Euclidean distance with z-score normalization
- Configurable K parameter (default: 5)
- Returns similarity scores (0-1) for top K competitors

**Usage:**
```typescript
const knn = new KNNClassifier(3);
const similar = knn.findSimilarCompanies(targetMetrics, competitorMetrics);
```

**Integration in Orchestrator:**
- Fetches competitor list from Yahoo Finance
- **Fetches REAL competitor metrics via N.A.T. realtime** (up to 5 competitors)
- Extracts: marketCap, P/E, revenue, EBITDA, ebitdaMargin, revenueGrowth, ROE
- Uses N.A.T. data for accurate similarity calculation
- **Previous version used random placeholders - now uses real data**
- Adds `similarity` score and `metrics` object to each competitor

### 13.3 Linear Regression - Revenue Projection

**Algorithm:**
- Ordinary Least Squares (OLS) regression
- Calculates R² score for confidence
- Projects future revenue based on historical growth

**Usage:**
```typescript
const lr = new LinearRegression();
const projections = lr.projectRevenue(currentRevenue, historicalGrowthRates, 3);
// Returns: [{ year: 2026, revenue: X, growthRate: Y, confidence: Z }, ...]
```

**Integration in Orchestrator:**
- Uses historical revenue growth rate
- Projects 3 years ahead by default
- Returns confidence score based on R²

### 13.4 Decision Tree - Industry Classification

**Algorithm:**
- Gini impurity for split selection
- Recursive tree building with max depth limit
- Handles mixed numerical features

**Usage:**
```typescript
const dt = new DecisionTreeClassifier();
dt.fit(trainingFeatures, trainingLabels);
const classification = dt.classifyCompany(companyMetrics);
```

**Integration in Orchestrator:**
- Fallback when keyword/rule-based classification fails
- Uses financial metrics as features
- Returns industry prediction with confidence

### 13.5 Additional ML Utilities

**Company Similarity Calculator:**
```typescript
const similarity = calculateCompanySimilarity(companyA, companyB);
// Returns: 0-1 score
```

**CAGR Calculator:**
```typescript
const cagr = calculateCAGR(startValue, endValue, periods);
// Returns: compound annual growth rate
```

### 13.6 ML Output in API Response

```json
{
  "company": "Tata Motors",
  "ticker": "TATAMOTORS.NS",
  "competitors": [
    { "symbol": "MARUTI", "name": "Maruti Suzuki", "similarity": 0.85 },
    { "symbol": "HM", "name": "Hyundai Motor", "similarity": 0.72 }
  ],
  "mlInsights": {
    "revenueProjections": [
      { "year": 2026, "revenue": 320000000000, "growthRate": 0.12, "confidence": 0.78 },
      { "year": 2027, "revenue": 358400000000, "growthRate": 0.11, "confidence": 0.65 },
      { "year": 2028, "revenue": 401400000000, "growthRate": 0.10, "confidence": 0.52 }
    ],
    "industryClassification": {
      "industry": "Automobile",
      "confidence": 0.75,
      "alternatives": []
    },
    "companySegmentation": [
      { "company": "TATA", "segment": 0 },
      { "company": "MARUTI", "segment": 1 }
    ],
    "anomalyDetection": {
      "clusters": [[0, 3], [1, 5], [2, 2]],
      "outlierCount": 1
    },
    "creditRisk": {
      "risk": "LOW",
      "probability": 0.25
    },
    "extractedFeatures": {
      "profitMargin": 0.12,
      "debtToEquity": 0.5,
      "roe": 0.15
    },
    "sentimentAnalysis": [
      { "text": "Strong earnings...", "sentiment": "positive", "confidence": 0.85 }
    ],
    "algorithmVersions": {
      "knn": "1.0",
      "linearRegression": "1.0",
      "decisionTree": "1.0",
      "kmeans": "2.0",
      "hierarchical": "2.0",
      "meanshift": "2.0",
      "dbscan": "2.0",
      "naiveBayes": "2.0",
      "neuralNetwork": "2.0",
      "pca": "2.0"
    }
  }
}
```

### 13.7 K-Means Clustering (Company Segmentation)

**Algorithm:** 
- K-means++ initialization
- Euclidean distance with iterative refinement
- Configurable K clusters

**Usage:**
```typescript
const kmeans = new KMeansClustering(4);
const segments = kmeans.segmentCompanies(companies, 4);
```

**Integration:**
- Segments companies into growth categories
- Groups by: revenue, market cap, EBITDA margin, P/E, growth
- **Uses REAL N.A.T. competitor metrics** (marketCap, revenue, ebitdaMargin, peRatio, revenueGrowth)
- Includes target company in segmentation analysis

### 13.8 Hierarchical Clustering

**Algorithm:**
- Agglomerative clustering
- Single/Complete/Average linkage options
- Dendrogram generation

**Usage:**
```typescript
const hc = new HierarchicalClustering('average');
hc.fit(data);
const clusters = hc.getClustersAtLevel(data, 5);
```

### 13.9 Mean Shift Clustering

**Algorithm:**
- Gaussian kernel density estimation
- Automatic cluster detection
- No K parameter needed

**Usage:**
```typescript
const ms = new MeanShiftClustering(1.0);
ms.fit(data);
const segments = ms.autoSegment(data);
```

### 13.10 DBSCAN (Density-Based Clustering)

**Algorithm:**
- Epsilon-neighborhood search
- Core point identification
- Outlier/anomaly detection

**Usage:**
```typescript
const dbscan = new DBSCAN(0.5, 3);
dbscan.fit(data);
const anomalies = dbscan.findAnomalies(companies);
```

**Integration:**
- Identifies outlier companies
- Detects unusual metric patterns
- **Uses REAL N.A.T. competitor metrics** for anomaly detection
- Uses log-scale revenue for better distance calculation
- Includes target company in anomaly analysis

### 13.11 Naive Bayes (Sentiment Analysis)

**Algorithm:**
- Multinomial text classification
- Laplace smoothing
- Log-probability for numerical stability

**Usage:**
```typescript
const nb = new NaiveBayesClassifier();
nb.fit(trainTexts, trainLabels);
const sentiment = nb.analyzeSentiment(newsHeadlines);
```

**Integration:**
- Analyzes news sentiment
- Analyst report classification

### 13.12 Neural Network (Prediction)

**Architecture:**
- Multi-layer perceptron
- Xavier weight initialization
- Backpropagation with gradient descent
- ReLU/Sigmoid/Tanh activations

**Usage:**
```typescript
const nn = new NeuralNetwork([5, 8, 4, 1], { learningRate: 0.01 });
nn.train(inputs, outputs, 1000);
const risk = nn.predictCreditRisk(companyMetrics);
```

**Integration:**
- Credit risk prediction
- Price movement forecasting

### 13.13 PCA (Dimensionality Reduction)

**Algorithm:**
- Covariance matrix computation
- Power iteration for eigenvalues
- Principal component extraction

**Usage:**
```typescript
const pca = new PCA();
pca.fit(data, 2);
const reduced = pca.transform(data);
```

**Integration:**
- Reduces financial metrics to 2D
- Visualization support

### 13.14 Feature Selection & Extraction

**Feature Selector:**
- Correlation matrix analysis
- Uncorrelated feature selection
- Variance-based importance

**Feature Extractor:**
- Ratio feature creation
- Growth feature engineering

**Usage:**
```typescript
const ratios = FeatureExtractor.createRatioFeatures(company);
const important = FeatureSelector.featureImportance(data, names);
```

### 13.15 Complete ML Pipeline Flow

```
Input: Company Financial Metrics
    ↓
┌─────────────────────────────────────────────────────────────┐
│ STEP 0: COMPETITOR DATA FETCHING (NEW)                       │
│ - Fetch competitor list from Yahoo Finance                   │
│ - For each competitor: Call N.A.T. realtime API              │
│ - Extract: marketCap, P/E, revenue, EBITDA, margin, ROE      │
│ - Parallel fetching (p-limit 3), up to 5 competitors        │
│ - THIS ENABLES RELIABLE ML ANALYSIS                         │
└─────────────────────────────────────────────────────────────┘
    ↓
┌─────────────────────────────────────────────────────────────┐
│ STEP 1: Feature Extraction                                   │
│ - Create ratio features (profit margin, ROE, etc.)          │
│ - Calculate growth features (CAGR, volatility)              │
│ - Extract features from REAL competitor data                 │
└─────────────────────────────────────────────────────────────┘
    ↓
┌─────────────────────────────────────────────────────────────┐
│ STEP 2: Feature Selection                                    │
│ - Correlation analysis                                       │
│ - Variance importance                                        │
│ - Remove redundant features                                  │
└─────────────────────────────────────────────────────────────┘
    ↓
┌─────────────────────────────────────────────────────────────┐
│ STEP 3: Clustering Analysis (Parallel)                       │
│ - K-Means: Company segmentation (uses N.A.T. competitor data)│
│ - Hierarchical: Industry grouping                            │
│ - Mean Shift: Auto cluster detection                        │
│ - DBSCAN: Outlier/Anomaly detection (uses N.A.T. data)    │
└─────────────────────────────────────────────────────────────┘
    ↓
┌─────────────────────────────────────────────────────────────┐
│ STEP 4: Classification                                       │
│ - Decision Tree: Industry classification                     │
│ - Naive Bayes: Sentiment analysis                           │
│ - KNN: Competitor similarity (uses N.A.T. competitor data) │
└─────────────────────────────────────────────────────────────┘
    ↓
┌─────────────────────────────────────────────────────────────┐
│ STEP 5: Prediction Models                                    │
│ - Linear Regression: Revenue projection                      │
│ - Neural Network: Credit risk / Price movement              │
│ - PCA: Dimensionality reduction for visualization          │
└─────────────────────────────────────────────────────────────┘
    ↓
┌─────────────────────────────────────────────────────────────┐
│ STEP 1: Feature Extraction                                   │
│ - Create ratio features (profit margin, ROE, etc.)          │
│ - Calculate growth features (CAGR, volatility)              │
└─────────────────────────────────────────────────────────────┘
    ↓
┌─────────────────────────────────────────────────────────────┐
│ STEP 2: Feature Selection                                    │
│ - Correlation analysis                                       │
│ - Variance importance                                        │
│ - Remove redundant features                                  │
└─────────────────────────────────────────────────────────────┘
    ↓
┌─────────────────────────────────────────────────────────────┐
│ STEP 3: Clustering Analysis (Parallel)                       │
│ - K-Means: Company segmentation                              │
│ - Hierarchical: Industry grouping                            │
│ - Mean Shift: Auto cluster detection                         │
│ - DBSCAN: Outlier/Anomaly detection                         │
└─────────────────────────────────────────────────────────────┘
    ↓
┌─────────────────────────────────────────────────────────────┐
│ STEP 4: Classification                                       │
│ - Decision Tree: Industry classification                     │
│ - Naive Bayes: Sentiment analysis                           │
│ - KNN: Competitor similarity                                │
└─────────────────────────────────────────────────────────────┘
    ↓
┌─────────────────────────────────────────────────────────────┐
│ STEP 5: Prediction Models                                    │
│ - Linear Regression: Revenue projection                     │
│ - Neural Network: Credit risk / Price movement              │
│ - PCA: Dimensionality reduction for visualization          │
└─────────────────────────────────────────────────────────────┘
    ↓
Output: Complete ML Insights
```

### 13.16 Error Handling & Edge Cases

| Scenario | Handling |
|----------|----------|
| Empty training data | Returns default values with 0.3 confidence |
| Division by zero | Uses fallback values |
| NaN/Infinity | Returns null, logs warning |
| Dimension mismatch | Throws descriptive error |
| Insufficient clusters | Uses available data only |
| Training convergence | Max iterations with best effort |

---

## 14. N.A.T. AI Assistant Integration

### 14.1 Overview

The orchestrator now integrates with the N.A.T. (Natural Intelligence) AI Assistant to provide additional business intelligence through natural language. **N.A.T. now runs in PARALLEL with all structured APIs for initial data fetching.**

**URL:** Configured via `NAT_URL` or `PYTHON_SERVICE_URL` environment variable

### 14.2 Integration Flow (UPDATED - PARALLEL)

```
User Query: "Tata Motors"
    ↓
discoverTicker() → Yahoo Search API
    ↓
┌─────────────────────────────────────────────────────────────────────────────┐
│                    PARALLEL DATA FETCH (ALL AT ONCE)                       │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│  ┌─────────────┐   ┌─────────────┐   ┌─────────────┐   ┌─────────────┐   │
│  │    FMP     │   │    Alpha   │   │    Yahoo   │   │    NSE     │   │
│  │  API Call  │   │  Vantage   │   │  Finance   │   │   India    │   │
│  └──────┬──────┘   └──────┬──────┘   └──────┬──────┘   └──────┬──────┘   │
│         │                  │                  │                  │            │
│         └──────────────────┴────────┬─────────┴──────────────────┘            │
│                                     │                                         │
│  ┌────────────────────────────────────────────────────────────────────┐   │
│  │                 N.A.T. AI (PARALLEL)                                │   │
│  │  Query: "Provide STRUCTURED financial data: Market Cap, P/E,          │   │
│  │         Revenue, EBITDA, EBITDA Margin, Revenue Growth..."             │   │
│  │  Returns: Parsed structured financial data + sources                   │   │
│  └────────────────────────────────────────────────────────────────────┘   │
│                                     │                                         │
│  ┌────────────────────────────────────────────────────────────────────┐   │
│  │                 Python Crawler (PARALLEL)                            │   │
│  │  python3 ./scripts/run_crawler.py "Tata Motors"                     │   │
│  │  Returns: links[], competitors[], snippets[]                           │   │
│  └────────────────────────────────────────────────────────────────────┘   │
│                                     │                                         │
└─────────────────────────────────────┼───────────────────────────────────────┘
                                      │
                                      ▼
                        MERGE CANDIDATES FROM ALL SOURCES
                        (FMP + Alpha + Yahoo + N.A.T. + Crawler)
                                      │
                                      ▼
```

### 14.3 Complete Query Flow

```
User Input: "Tata Motors"

1. discoverTicker("Tata Motors", "India")
   → Yahoo Search API: "Tata Motors stock ticker"
   → Returns: "TATAMOTORS.NS"

2. PARALLEL DATA FETCH:
   │
   ├─ fetchFromFMP("TATAMOTORS.NS")
   │   → GET https://financialmodelingprep.com/api/v3/quote/TATAMOTORS.NS
   │   → Returns: { marketCap, peRatio, revenue }
   │
   ├─ fetchFromAlpha("TATAMOTORS.NS")
   │   → GET https://www.alphavantage.co/query?function=OVERVIEW&symbol=TATAMOTORS.NS
   │   → Returns: { marketCap, peRatio, ebitda, revenue }
   │
   ├─ fetchYahooFinancials("TATAMOTORS.NS")
   │   → GET https://query1.finance.yahoo.com/v10/finance/quoteSummary/TATAMOTORS.NS
   │   → Returns: { marketCap, peRatio, revenue, ebitda, revenueGrowth }
   │
   ├─ getNATIntelligence("Tata Motors", { type: 'initial_search' })
   │   → POST /chat: "Provide STRUCTURED financial data for Tata Motors..."
   │   → Returns: { structuredData: { marketCap, peRatio, revenue, ebitda... } }
   │
   └─ runPythonCrawler("Tata Motors")
       → python3 ./scripts/run_crawler.py "Tata Motors"
       → Returns: { links[], competitors[], snippets[] }

3. SERP SEARCHES (Sequential):
   ├─ Google CSE: "Tata Motors P/E ratio"
   ├─ Google CSE: "Tata Motors market cap"
   ├─ Google CSE: "Tata Motors EBITDA"
   ├─ Google CSE: "Tata Motors revenue"
   ├─ Google CSE: "Tata Motors EBITDA margin"
   ├─ Google CSE: "Tata Motors revenue growth"
   ├─ Google CSE: "Tata Motors investor presentation"
   └─ Google CSE: "Tata Motors annual report pdf"

4. SCRAPE LINKS:
   → Cheerio scrapes all URLs from crawler + SERP

5. MERGE & SCORE:
   → Weighted median from all sources (FMP:120, Alpha:120, Yahoo:80, N.A.T.:80)

6. ML ANALYSIS (REAL MATHEMATICAL ANALYSIS):
   → KNN, K-Means, DBSCAN, PCA, Neural Network... (Does actual data analysis)

7. N.A.T. CONTEXT (Natural Language):
   → POST /chat (general): "Provide detailed business intelligence..." (Context only)
   → POST /chat (realtime): "Latest financial performance..." (Context only)

8. OUTPUT
```

### 14.4 Data Fetching Queries

#### Structured APIs:
| Source | Endpoint | Data |
|--------|----------|------|
| FMP | `/api/v3/quote/{ticker}` | Market Cap, P/E, Revenue |
| Alpha Vantage | `?function=OVERVIEW` | Market Cap, P/E, EBITDA, Revenue |
| Yahoo Finance | `/quoteSummary/{ticker}` | All financial metrics |

#### N.A.T. Initial Search Query:
```
Provide STRUCTURED financial data for {company}: 
- Current Market Cap (in billions USD)
- P/E Ratio
- Revenue (in billions USD)
- EBITDA (in billions USD)
- EBITDA Margin (%)
- Revenue Growth (%)
- Industry/Sector
- Key competitors
Format as clean structured data.
```

#### SERP Search Queries:
| # | Query | Purpose |
|---|-------|---------|
| 1 | `{company} P/E ratio` | Get P/E ratio |
| 2 | `{company} market cap` | Get market cap |
| 3 | `{company} EBITDA` | Get EBITDA |
| 4 | `{company} revenue` | Get revenue |
| 5 | `{company} EBITDA margin` | Get margin |
| 6 | `{company} revenue growth` | Get growth rate |
| 7 | `{company} "investor presentation"` | Get investor docs |
| 8 | `{company} annual report pdf` | Get annual report |

#### N.A.T. Final Analysis Queries:
| Call | Query | Type |
|------|-------|------|
| General | `Provide detailed business intelligence about {company}. Include: Company overview, Recent news, Industry trends, Key competitors, Investment outlook` | Vector Store |
| Realtime | `Latest financial performance, quarterly results, and market sentiment for {company}. Include recent news and analyst opinions.` | Web Search |

#### N.A.T. Competitor Data Fetching (NEW):
| Step | Action | Description |
|------|--------|-------------|
| 1 | Fetch competitor list | Get from Yahoo Finance recommendations API |
| 2 | N.A.T. realtime query | For each competitor (up to 5), call N.A.T. with structured query |
| 3 | Extract metrics | Parse marketCap, P/E, revenue, EBITDA, margin, ROE from response |
| 4 | Parallel processing | Use p-limit(3) for concurrent competitor fetching |
| 5 | Store metrics | Add to competitor object for ML analysis |

**Competitor Data Query:**
```
Provide STRUCTURED financial metrics for {competitor_name} ({symbol}):
- Current Market Cap (in billions USD)
- P/E Ratio
- Revenue (in billions USD)
- EBITDA (in billions USD)
- EBITDA Margin (%)
- Revenue Growth (%)
- ROE (%)
Format as clean structured data with ONLY numbers.
```

**Why This Matters:**
- Previous system used **random placeholders** for competitor metrics
- Now uses **real N.A.T. fetched data** for reliable ML analysis
- Enables accurate KNN similarity, K-Means clustering, and DBSCAN anomaly detection

### 14.5 Source Weights

| Source | Weight | Purpose |
|--------|--------|---------|
| FMP | 120 | Structured financial API |
| Alpha Vantage | 120 | Structured financial API |
| Yahoo Finance | 80 | Free financial data |
| N.A.T. | 80 | AI extracted data |
| Python Crawler | 40 | Web scraped |
| SERP/Google | 40 | Search results |
| Direct Scrape | 40 | HTML parsing |

### 14.6 NAT Functions

**callNAT(query, chatType)**
- Calls NAT `/chat` endpoint
- Returns natural language response
- Supports both "general" and "realtime" chat types

**getNATIntelligence(company, context)**
- If type='initial_search': Extracts structured data from N.A.T. response
- Otherwise: Calls both general and realtime insights
- Returns deduplicated results

### 14.7 API Response Structure

```json
{
  "company": "Tata Motors",
  "ticker": "TATAMOTORS.NS",
  "merged": { ... },
  "mlInsights": {
    "revenueProjections": [...],
    "natIntelligence": {
      "generalInsight": "Tata Motors is India's largest automobile...",
      "realtimeInsight": "Q3 FY26 results show revenue growth of 5%...",
      "sources": [...]
    }
  }
}
```

### 14.5 Environment Configuration

```env
# N.A.T. Service URL
NAT_URL=http://localhost:8000
# or
PYTHON_SERVICE_URL=http://localhost:8000
```

---

## 15. COMPLETE SYSTEM DIAGRAM (VERSION 8.3)

```
╔══════════════════════════════════════════════════════════════════════════════════════════════════╗
║                           EBITA INTELLIGENCE ENGINE - VERSION 8.3                                ║
║                        Complete Architecture & Data Flow Diagram                                ║
╚══════════════════════════════════════════════════════════════════════════════════════════════════╝

════════════════════════════════════════════════════════════════════════════════════════════════════
                                      USER INPUT LAYER
════════════════════════════════════════════════════════════════════════════════════════════════════

    ┌─────────────┐     ┌─────────────┐     ┌─────────────┐     ┌─────────────┐
    │  Company    │     │   Brand    │     │  Industry  │     │  Ticker   │
    │   Name      │     │   Name     │     │   Name     │     │   Symbol   │
    └──────┬──────┘     └──────┬──────┘     └──────┬──────┘     └──────┬──────┘
           │                    │                    │                    │
           └────────────────────┴────────┬─────────┴────────────────────┘
                                        │
                                        ▼
                         ┌───────────────────────────────┐
                         │     INPUT PREPROCESSOR        │
                         │  • Entity Resolution         │
                         │  • Ticker Discovery          │
                         │  • Region Detection          │
                         └──────────────┬──────────────┘
                                        │
                                        ▼

════════════════════════════════════════════════════════════════════════════════════════════════════
                              PARALLEL DATA SOURCE LAYER (ALL AT ONCE)
════════════════════════════════════════════════════════════════════════════════════════════════════

    ╔════════════════════════════════════════════════════════════════════════════════════════════╗
    ║                          STRUCTURED APIs (Financial Data)                                 ║
    ╠════════════════════════════════════════════════════════════════════════════════════════════╣
    ║                                                                                         ║
    ║  ┌─────────────────────┐  ┌─────────────────────┐  ┌─────────────────────┐          ║
    ║  │        FMP          │  │    Alpha Vantage    │  │   Yahoo Finance    │          ║
    ║  │  financialmodeling  │  │    alphavantage.co  │  │   finance.yahoo   │          ║
    ║  │       prep.com      │  │                     │  │        .com        │          ║
    ║  └──────────┬──────────┘  └──────────┬──────────┘  └──────────┬──────────┘          ║
    ║             │                           │                           │                      ║
    ║             │   ┌───────────────────────┴───────────────────────────┘                      ║
    ║             │   │                                                                     ║
    ║             │   │  Returns: Market Cap, P/E, Revenue, EBITDA, Growth                  ║
    ║             │   │                                                                     ║
    ╚═════════════╪═══╪═════════════════════════════════════════════════════════════════════╝
                  │   │
    ╔═════════════╪═══╪════════════════════════════════════════════════════════════════════╗
    ║             │   │           N.A.T. AI (PARALLEL)                                      ║
    ╠═════════════╪═══╪════════════════════════════════════════════════════════════════════╣
    ║             │   │                                                                     ║
    ║             │   │  ┌─────────────────────────────────────────────────────────────┐   ║
    ║             │   │  │  Query: "Provide STRUCTURED financial data:              │   ║
    ║             │   │  │  Market Cap, P/E, Revenue, EBITDA, EBITDA Margin..."       │   ║
    ║             │   │  └─────────────────────────────────────────────────────────────┘   ║
    ║             │   │                              │                                    ║
    ║             │   │  ┌─────────────────────────────────────────────────────────────┐   ║
    ║             │   │  │  Regex Extraction:                                        │   ║
    ║             │   │  │  • marketCap → $XXX Billion                              │   ║
    ║             │   │  │  • peRatio → XX.XX                                       │   ║
    ║             │   │  │  • revenue → $XXX Billion                                │   ║
    ║             │   │  │  • ebitda → $XXX Billion                                 │   ║
    ║             │   │  │  • ebitdaMargin → XX%                                   │   ║
    ║             │   │  └─────────────────────────────────────────────────────────────┘   ║
    ║             │   │                                                                     ║
    ╚═════════════╪═══╪════════════════════════════════════════════════════════════════════╝
                  │   │
    ╔═════════════╪═══╪════════════════════════════════════════════════════════════════════╗
    ║             │   │         PYTHON CRAWLER (PARALLEL)                                  ║
    ╠═════════════╪═══╪════════════════════════════════════════════════════════════════════╣
    ║             │   │                                                                     ║
    ║             │   │  Command: python3 ./scripts/run_crawler.py "{company}"             ║
    ║             │   │                                                                     ║
    ║             │   │  Returns: { links[], competitors[], snippets[] }                 ║
    ║             │   │                                                                     ║
    ╚═════════════╪═══╪════════════════════════════════════════════════════════════════════╝
                  │   │
                  ▼   ▼

════════════════════════════════════════════════════════════════════════════════════════════════════
                                      MERGE & SCORE ENGINE
════════════════════════════════════════════════════════════════════════════════════════════════════

    ┌─────────────────────────────────────────────────────────────────────────────────────┐
    │                              MERGE CANDIDATES                                        │
    ├─────────────────────────────────────────────────────────────────────────────────────┤
    │                                                                                      │
    │  Sources: [FMP, Alpha, Yahoo, N.A.T., Crawler, SERP, Scraped]                    │
    │                                                                                      │
    │  ┌─────────────┐    ┌─────────────────┐    ┌─────────────────┐                  │
    │  │   Source    │    │   Weighted      │    │   Confidence    │                  │
    │  │   Weight    │───▶│    Median       │───▶│   Calculator    │                  │
    │  │             │    │                 │    │                 │                  │
    │  │ FMP: 120   │    │ Sort by value   │    │ Count × 10     │                  │
    │  │ Alpha: 120 │    │ Weight by       │    │ + Structured   │                  │
    │  │ Yahoo: 80  │    │   authority    │    │   (40)         │                  │
    │  │ N.A.T.: 80  │    │ Get median     │    │ Score 0-100    │                  │
    │  │ Crawl: 40  │    │                 │    │                 │                  │
    │  └─────────────┘    └─────────────────┘    └─────────────────┘                  │
    │                                                                                      │
    │  ┌───────────────────────────────────────────────────────────────────────────┐      │
    │  │                    DERIVED METRICS COMPUTATION                            │      │
    │  ├───────────────────────────────────────────────────────────────────────────┤      │
    │  │                                                                            │      │
    │  │  EBITDA Margin = (EBITDA / Revenue) × 100                                 │      │
    │  │  EV/EBITDA = Enterprise Value / EBITDA                                    │      │
    │  │  ROE = Net Income / Shareholder Equity                                    │      │
    │  │                                                                            │      │
    │  └───────────────────────────────────────────────────────────────────────────┘      │
    │                                                                                      │
    └─────────────────────────────────────────────────────────────────────────────────────┘
                                        │
                                        ▼

════════════════════════════════════════════════════════════════════════════════════════════════════
                                 N.A.T. CONTEXT LAYER (NATURAL LANGUAGE - NOT ANALYSIS)
════════════════════════════════════════════════════════════════════════════════════════════════════

    ┌─────────────────────────────────────────────────────────────────────────────────────┐
    │            N.A.T. PROVIDES CONTEXT ONLY ← NOT MATHEMATICAL ANALYSIS                 │
    │                  ML ALGORITHMS DO THE ACTUAL ANALYSIS                               │
    ├─────────────────────────────────────────────────────────────────────────────────────┤
    │                                                                                      │
    │  ╔════════════════════════════════════════════════════════════════════════════════════╗  │
    │  ║              CLUSTERING ALGORITHMS ← MATHEMATICAL ANALYSIS                       ║  │
    │  ╠════════════════════════════════════════════════════════════════════════════════════╣  │
    │  ║                                                                                  ║  │
    │  ║  ┌──────────┐  ┌──────────────┐  ┌────────────┐  ┌─────────┐                ║  │
    │  ║  │ K-Means   │  │ Hierarchical │  │ Mean Shift │  │ DBSCAN  │                ║  │
    │  ║  │           │  │              │  │            │  │         │                ║  │
    │  ║  │ COMPANY   │  │ INDUSTRY     │  │ AUTO       │  │ OUTLIER │                ║  │
    │  ║  │ SEGMENTS  │  │ GROUPING     │  │ CLUSTERS   │  │ DETECT  │                ║  │
    │  ║  │           │  │              │  │            │  │         │                ║  │
    │  ║  │ Real Math │  │ Real Math    │  │ Real Math   │  │ Real Math│                ║  │
    │  ║  └──────────┘  └──────────────┘  └────────────┘  └─────────┘                ║  │
    │  ║                                                                                  ║  │
    │  ╚════════════════════════════════════════════════════════════════════════════════════╝  │
    │                                                                                      │
    │  ╔════════════════════════════════════════════════════════════════════════════════════╗  │
    │  ║            CLASSIFICATION ALGORITHMS ← MATHEMATICAL ANALYSIS                   ║  │
    │  ╠════════════════════════════════════════════════════════════════════════════════════╣  │
    │  ║                                                                                  ║  │
    │  ║  ┌──────────┐  ┌──────────────┐  ┌────────────┐                                ║  │
    │  ║  │   KNN    │  │  Decision    │  │  Naive     │                                ║  │
    │  ║  │           │  │    Tree      │  │   Bayes    │                                ║  │
    │  ║  │ COMPETITOR│  │ INDUSTRY     │  │ SENTIMENT  │                                ║  │
    │  ║  │ SIMILARITY│  │ CLASSIFY     │  │ ANALYSIS   │                                ║  │
    │  ║  │           │  │              │  │            │                                ║  │
    │  ║  │ Real Math │  │ Real Math    │  │ Real Math   │                                ║  │
    │  ║  └──────────┘  └──────────────┘  └────────────┘                                ║  │
    │  ║                                                                                  ║  │
    │  ╚════════════════════════════════════════════════════════════════════════════════════╝  │
    │                                                                                      │
    │  ╔════════════════════════════════════════════════════════════════════════════════════╗  │
    │  ║                 PREDICTION MODELS ← MATHEMATICAL ANALYSIS                       ║  │
    │  ╠════════════════════════════════════════════════════════════════════════════════════╣  │
    │  ║                                                                                  ║  │
    │  ║  ┌────────────────────────┐  ┌──────────────────────┐                          ║  │
    │  ║  │   Linear Regression    │  │   Neural Network     │                          ║  │
    │  ║  │                        │  │                      │                          ║  │
    │  ║  │ REVENUE PROJECTION    │  │ CREDIT RISK         │                          ║  │
    │  ║  │ GROWTH FORECAST       │  │ PRICE MOVEMENT       │                          ║  │
    │  ║  │                       │  │                      │                          ║  │
    │  ║  │ Real Math Calculations │  │ Real Math Calculations│                          ║  │
    │  ║  └────────────────────────┘  └──────────────────────┘                          ║  │
    │  ║                                                                                  ║  │
    │  ╚════════════════════════════════════════════════════════════════════════════════════╝  │
    │                                                                                      │
    │  ╔════════════════════════════════════════════════════════════════════════════════════╗  │
    │  ║            DIMENSIONALITY REDUCTION ← MATHEMATICAL ANALYSIS                    ║  │
    │  ╠════════════════════════════════════════════════════════════════════════════════════╣  │
    │  ║                                                                                  ║  │
    │  ║  ┌────────────────────────┐  ┌──────────────────────┐                          ║  │
    │  ║  │           PCA           │  │  Feature Selection  │                          ║  │
    │  ║  │                        │  │                      │                          ║  │
    │  ║  │ PRINCIPAL COMPONENTS  │  │ CORRELATION MATRIX  │                          ║  │
    │  ║  │ VARIANCE EXPLAINED      │  │ FEATURE IMPORTANCE  │                          ║  │
    │  ║  │                        │  │                      │                          ║  │
    │  ║  │ Real Math Calculations │  │ Real Math Calculations│                          ║  │
    │  ║  └────────────────────────┘  └──────────────────────┘                          ║  │
    │  ║                                                                                  ║  │
    │  ╚════════════════════════════════════════════════════════════════════════════════════╝  │
    │                                                                                      │
    └─────────────────────────────────────────────────────────────────────────────────────┘
                                        │
                                        ▼

════════════════════════════════════════════════════════════════════════════════════════════
                                 N.A.T. CONTEXT LAYER (Natural Language)
════════════════════════════════════════════════════════════════════════════════════════════════════

    ┌─────────────────────────────────────────────────────────────────────────────────────┐
    │                    N.A.T. PROVIDES CONTEXT, NOT ANALYSIS                           │
    │                   (ML Algorithms Do The Mathematical Analysis)                       │
    ├─────────────────────────────────────────────────────────────────────────────────────┤
    │                                                                                      │
    │     ┌─────────────────────────────┐     ┌─────────────────────────────┐             │
    │     │       GENERAL CHAT        │     │      REALTIME CHAT         │             │
    │     │   (Vector Store Context)  │     │   (Web Search Enabled)     │             │
    │     │                          │     │                           │             │
    │     │ • Company Overview       │     │ • Latest Financial News   │             │
    │     │ • Industry Trends        │     │ • Quarterly Results       │             │
    │     │ • Business Model         │     │ • Analyst Opinions        │             │
    │     │ • Key Risks              │     │ • Market Sentiment        │             │
    │     │                          │     │                           │             │
    │     │  (Context only)         │     │  (Context only)          │             │
    │     └──────────────┬───────────┘     └───────────────┬───────────┘             │
    │                    │                                  │                           │
    │                    └────────────┬─────────────────────┘                           │
    │                                 │                                                 │
    │                                 ▼                                                 │
    │                    ┌─────────────────────────────┐                                 │
    │                    │   SOURCE AGGREGATION       │                                 │
    │                    │   (Context Only)           │                                 │
    │                    └─────────────────────────────┘                                 │
    │                                                                                      │
    └─────────────────────────────────────────────────────────────────────────────────────┘

    ┌─────────────────────────────────────────────────────────────────────────────────────┐
    │                           CLASSIFICATION ALGORITHMS                                │
    ├─────────────────────────────────────────────────────────────────────────────────────┤
    │  ┌──────────┐  ┌──────────────┐  ┌────────────┐                                │
    │  │   KNN    │  │  Decision    │  │  Naive     │                                │
    │  │           │  │    Tree      │  │   Bayes    │                                │
    │  │ Competitor│  │ Industry     │  │ Sentiment  │                                │
    │  │ Similarity│  │ Classification│  │ Analysis   │                                │
    │  └──────────┘  └──────────────┘  └────────────┘                                │
    └─────────────────────────────────────────────────────────────────────────────────────┘

    ┌─────────────────────────────────────────────────────────────────────────────────────┐
    │                              PREDICTION MODELS                                    │
    ├─────────────────────────────────────────────────────────────────────────────────────┤
    │  ┌────────────────────────┐  ┌──────────────────────┐                          │
    │  │   Linear Regression   │  │   Neural Network     │                          │
    │  │                       │  │                      │                          │
    │  │ Revenue Projection   │  │ Credit Risk          │                          │
    │  │ Growth Forecast      │  │ Price Movement       │                          │
    │  └────────────────────────┘  └──────────────────────┘                          │
    └─────────────────────────────────────────────────────────────────────────────────────┘

    ┌─────────────────────────────────────────────────────────────────────────────────────┐
    │                         DIMENSIONALITY REDUCTION                                    │
    ├─────────────────────────────────────────────────────────────────────────────────────┤
    │  ┌────────────────────────┐  ┌──────────────────────┐                          │
    │  │           PCA           │  │ Feature Selection    │                          │
    │  │                        │  │                      │                          │
    │  │ Principal Components  │  │ Correlation Matrix   │                          │
    │  │ Variance Explained     │  │ Variance Importance │                          │
    │  └────────────────────────┘  └──────────────────────┘                          │
    └─────────────────────────────────────────────────────────────────────────────────────┘
                                        │
                                        ▼

════════════════════════════════════════════════════════════════════════════════════════════
                                 N.A.T. FINAL ANALYSIS LAYER
════════════════════════════════════════════════════════════════════════════════════════════

    ┌─────────────────────────────────────────────────────────────────────────────────────┐
    │                        DUAL CHANNEL N.A.T. PROCESSING                               │
    ├─────────────────────────────────────────────────────────────────────────────────────┤
    │                                                                                      │
    │     ┌─────────────────────────────┐     ┌─────────────────────────────┐             │
    │     │       GENERAL CHAT        │     │      REALTIME CHAT         │             │
    │     │   (Vector Store Context)  │     │   (Web Search Enabled)     │             │
    │     │                          │     │                           │             │
    │     │ • Company Overview       │     │ • Latest Financial News   │             │
    │     │ • Industry Trends        │     │ • Quarterly Results       │             │
    │     │ • Business Model         │     │ • Analyst Opinions        │             │
    │     │ • Key Risks              │     │ • Market Sentiment        │             │
    │     └──────────────┬───────────┘     └───────────────┬───────────┘             │
    │                    │                                  │                           │
    │                    └────────────┬─────────────────────┘                           │
    │                                 │                                                 │
    │                                 ▼                                                 │
    │                    ┌─────────────────────────────┐                                 │
    │                    │   SOURCE AGGREGATION       │                                 │
    │                    │   (Deduplicated)           │                                 │
    │                    └─────────────────────────────┘                                 │
    │                                                                                      │
    └─────────────────────────────────────────────────────────────────────────────────────┘
                                        │
                                        ▼

════════════════════════════════════════════════════════════════════════════════════════════
                                       OUTPUT LAYER
════════════════════════════════════════════════════════════════════════════════════════════

    {
      "company": "Tata Motors",
      "ticker": "TATAMOTORS.NS",
      "region": "India",
      
      "merged": {
        "perMetric": {
          "marketCap": { "value": 500000000000, "confidence": 95, "sources": ["FMP","Yahoo"] },
          "peRatio": { "value": 18.5, "confidence": 90, "sources": ["Alpha","FMP"] },
          "revenue": { "value": 320000000000, "confidence": 88, "sources": ["Yahoo","N.A.T."] },
          "ebitda": { "value": 48000000000, "confidence": 85, "sources": ["FMP"] },
          "ebitdaMargin": { "value": 15.0, "confidence": 80, "sources": ["computed"] }
        },
        "provenance": [...]
      },
      
      "competitors": [
        { "symbol": "MARUTI", "name": "Maruti Suzuki", "similarity": 0.85 },
        { "symbol": "HM", "name": "Hyundai Motor", "similarity": 0.72 }
      ],
      
      "mlInsights": {
        "revenueProjections": [...],
        "companySegmentation": [...],
        "anomalyDetection": { "outlierCount": 1 },
        "creditRisk": { "risk": "LOW", "probability": 0.25 },
        "natIntelligence": {
          "generalInsight": "...",
          "realtimeInsight": "...",
          "sources": [...]
        }
      },
      
      "analysis": { "text": "..." },
      "timestamp": "2026-02-21T21:00:00.000Z"
    }


════════════════════════════════════════════════════════════════════════════════════════════
                                    VERSION INFO
════════════════════════════════════════════════════════════════════════════════════════════

    Version: 8.3 (NAT Parallel Integration)
    Date: February 21, 2026 21:00 IST
    Total ML Algorithms: 12+
    Data Sources: 6 APIs + Python Services + N.A.T. (Parallel)
    Supported Companies: 995+
    Supported Industries: 29 + Quick Commerce

    KEY FEATURES:
    ✓ All data sources fetch in PARALLEL
    ✓ N.A.T. extracts structured financial data
    ✓ Weighted merge with confidence scoring
    ✓ Complete ML pipeline (Clustering, Classification, Prediction, PCA)
    ✓ N.A.T. provides both initial data and final analysis

════════════════════════════════════════════════════════════════════════════════════════════
```
---

## 15. Search Queries - APIs & N.A.T

### 15.1 Overview

The orchestrator uses two types of search queries:
1. **Direct API Queries** - Hardcoded search strings for SERP/Google CSE
2. **N.A.T. Natural Language Queries** - AI-powered queries for context and structured data extraction

### 15.2 SERP / Google CSE Search Queries

**Location:** `lib/orchestrator-v2.ts` (Lines 734-743)

```typescript
const queries = [
  `${company} P/E ratio`,
  `${company} market cap`,
  `${company} EBITDA`,
  `${company} revenue`,
  `${company} EBITDA margin`,
  `${company} revenue growth`,
  `${company} "investor presentation"`,
  `${company} annual report pdf`
];
```

**Purpose:** Each query targets a specific metric to extract from SERP results and scraped pages.

**Processing Flow:**
```
Query → Google CSE / SERP API → Organic Results → Link Extraction → Page Scraping → Regex Parsing
```

**Scraped Metrics:**
| Regex Pattern | Metric Extracted |
|---------------|------------------|
| `/P\/?E(?:\s*ratio)?[:\s]*([\d\.,]+)/i` | P/E Ratio |
| `/market\s*cap[:\s]*([\d\.,\s\w]+)/i` | Market Cap |
| `/revenue[:\s]*([\d\.,\s\w]+)/i` | Revenue |
| `/ebitda[:\s]*([\d\.,\s\w]+)/i` | EBITDA |
| `/ebitda\s*margin[:\s]*([\d\.,]+%?)/i` | EBITDA Margin |

**Currency Parsing:**
- Supports: K (thousand), M (million), B (billion), crore, lakh
- Example: "5.2B" → 5,200,000,000

### 15.3 N.A.T. Search Queries

**Location:** `lib/orchestrator-v2.ts` (Lines 154-165, 203-231)

#### 15.3.1 Initial Search Query (Parallel with APIs)

```typescript
const initialQuery = `Search and provide STRUCTURED financial data for ${company}: 
  - Current Market Cap (in billions USD)
  - P/E Ratio
  - Revenue (in billions USD)
  - EBITDA (in billions USD)
  - EBITDA Margin (%)
  - Revenue Growth (%)
  - Industry/Sector
  - Key competitors
  Format as clean structured data.`;
```

**Purpose:** Extract structured numerical data from N.A.T.'s natural language response using regex parsing.

**Extracted Fields:**
| Regex Pattern | Field | Multiplier |
|---------------|-------|------------|
| `/market\s*cap[:\s]*\$?([\d.,]+)/i` | marketCap | 1e9 |
| `/p\/?e\s*ratio[:\s]*([\d.,]+)/i` | peRatio | 1 |
| `/revenue[:\s]*\$?([\d.,]+)/i` | revenue | 1e9 |
| `/ebitda[:\s]*\$?([\d.,]+)/i` | ebitda | 1e9 |
| `/ebitda\s*margin[:\s]*([\d.,]+)/i` | ebitdaMargin | 1 |
| `/revenue\s*growth[:\s]*([\d.,]+)/i` | revenueGrowth | 0.01 |

#### 15.3.2 General Insight Query

```typescript
const generalQuery = `Provide detailed business intelligence about ${company}. Include: 
  1) Company overview 
  2) Recent news 
  3) Industry trends 
  4) Key competitors 
  5) Investment outlook`;
```

**Purpose:** Get contextual business intelligence from vector store (historical data).

#### 15.3.3 Realtime Insight Query

```typescript
const realtimeQuery = `Latest financial performance, quarterly results, and market sentiment 
  for ${company}. Include recent news and analyst opinions.`;
```

**Purpose:** Get latest real-time data via web search integration.

### 15.4 Query Execution Flow

```
                    ┌─────────────────────────────────────┐
                    │         USER REQUEST                 │
                    │     "Analyze Apple Inc."             │
                    └─────────────────┬───────────────────┘
                                      │
                    ┌─────────────────▼───────────────────┐
                    │     1. TICKER DISCOVERY              │
                    │     (Yahoo Finance Search API)        │
                    └─────────────────┬───────────────────┘
                                      │
           ┌──────────────────────────┼──────────────────────────┐
           │                          │                          │
           ▼                          ▼                          ▼
┌─────────────────────┐─────┐   ┌──────────────── ┌─────────────────────┐
│  STRUCTURED APIs   │  │    N.A.T. AI        │  │   PYTHON BOTS       │
│  (Parallel Fetch)   │  │  (Parallel Fetch)   │  │  (Parallel Fetch)   │
├─────────────────────┤  ├─────────────────────┤  ├─────────────────────┤
│ • FMP              │  │ • Initial Search    │  │ • run_crawler.py    │
│ • Alpha Vantage   │  │ • General Insight   │  │ • run_netbot.py     │
│ • Yahoo Finance   │  │ • Realtime Insight  │  │                     │
└─────────┬─────────┘  └──────────┬──────────┘  └──────────┬──────────┘
          │                       │                         │
          └───────────────────────┼─────────────────────────┘
                                  │
                                  ▼
                    ┌─────────────────────────────────────┐
                    │     2. SERP SEARCH QUERIES           │
                    │     (8 hardcoded queries)            │
                    └─────────────────┬───────────────────┘
                                      │
                                      ▼
                    ┌─────────────────────────────────────┐
                    │     3. PAGE SCRAPING                │
                    │     (Up to 40 URLs)                 │
                    └─────────────────┬───────────────────┘
                                      │
                                      ▼
                    ┌─────────────────────────────────────┐
                    │     4. DATA MERGING                 │
                    │     (Weighted median)               │
                    └─────────────────────────────────────┘
```

---

## 16. Data Rectifier Module

### 16.1 Overview

**CRITICAL GAP IDENTIFIED:** The current system lacks a dedicated data rectifier module. Only basic confidence scoring exists in `lib/logic/data-quality.ts`.

### 16.2 Current Data Quality Scoring (Basic)

**Location:** `lib/logic/data-quality.ts`

```typescript
export interface DataPoint {
    value: any;
    source: string;
    timestamp: string;
    reliability: number; // 0-100 based on source type
}

export function calculateConfidenceScore(points: DataPoint[]) {
    // 1. Source Reliability (Max 40)
    const avgReliability = points.reduce((acc, p) => acc + p.reliability, 0) / points.length;
    score += (avgReliability / 100) * 40;

    // 2. Data Freshness (Max 30)
    // If < 1 day: +30, < 7 days: +20, < 30 days: +10, else: +5

    // 3. Cross-Ref Variance (Max 20)
    // If variance < 5%: +20, < 15%: +10, else: 0

    // 4. Source Diversity (Bonus 10)
    // 3+ sources: +10, 2 sources: +5
}
```

### 16.3 Missing Data Rectifier Features

The following features are **MISSING** and need to be implemented:

| Feature | Description | Priority |
|---------|-------------|----------|
| **Range Validation** | Validate P/E 0-5000, marketCap > 0, margins -100% to 100% | HIGH |
| **Outlier Removal** | IQR-based or Z-score outlier detection before ML | HIGH |
| **Source Filtering** | Reject sources with < 30% historical accuracy | HIGH |
| **Contradiction Detection** | Flag values that contradict across sources (>50% variance) | MEDIUM |
| **Currency Normalization** | Convert all currencies to base USD | MEDIUM |
| **Date Normalization** | Standardize all dates to ISO format | LOW |
| **Format Standardization** | Normalize number formats (1,000,000 vs 1000000) | LOW |

### 16.4 Recommended Data Rectifier Implementation

```typescript
// lib/validators/data-rectifier.ts

export interface RectifiedData {
    originalValue: number;
    rectifiedValue: number;
    isValid: boolean;
    issues: string[];
    confidence: number;
}

export class DataRectifier {
    private validationRules: Record<string, { min: number; max: number }> = {
        marketCap: { min: 0, max: 1e15 },
        peRatio: { min: -500, max: 5000 },
        ebitdaMargin: { min: -100, max: 100 },
        revenueGrowth: { min: -1, max: 10 },  // -100% to 1000%
        profitMargin: { min: -100, max: 100 },
        roe: { min: -100, max: 100 },
        debtEquity: { min: 0, max: 100 }
    };

    // IQR-based outlier detection
    removeOutliers(values: number[]): number[] {
        if (values.length < 4) return values;
        
        const sorted = [...values].sort((a, b) => a - b);
        const q1 = sorted[Math.floor(sorted.length / 4)];
        const q3 = sorted[Math.floor(sorted.length * 3 / 4)];
        const iqr = q3 - q1;
        const lower = q1 - 1.5 * iqr;
        const upper = q3 + 1.5 * iqr;
        
        return values.filter(v => v >= lower && v <= upper);
    }

    // Z-score outlier detection
    removeOutliersZScore(values: number[], threshold = 3): number[] {
        const mean = values.reduce((a, b) => a + b, 0) / values.length;
        const std = Math.sqrt(values.reduce((sq, n) => sq + Math.pow(n - mean, 2), 0) / values.length);
        
        if (std === 0) return values;
        
        return values.filter(v => Math.abs((v - mean) / std) <= threshold);
    }

    // Validate against business rules
    validateRange(value: number, metric: string): { valid: boolean; issues: string[] } {
        const rule = this.validationRules[metric];
        if (!rule) return { valid: true, issues: [] };

        const issues: string[] = [];
        if (value < rule.min) issues.push(`Value ${value} below minimum ${rule.min}`);
        if (value > rule.max) issues.push(`Value ${value} above maximum ${rule.max}`);

        return { valid: issues.length === 0, issues };
    }

    // Check for contradictory values between sources
    detectContradictions(values: { source: string; value: number }[]): boolean {
        if (values.length < 2) return false;
        
        const numericValues = values.map(v => v.value).filter(v => !isNaN(v));
        if (numericValues.length < 2) return false;

        const min = Math.min(...numericValues);
        const max = Math.max(...numericValues);
        const variance = (max - min) / (max || 1);

        return variance > 0.5; // > 50% variance = contradiction
    }

    // Main rectification method
    rectify(metric: string, values: { source: string; value: number; timestamp: string }[]): RectifiedData[] {
        return values.map(v => {
            const issues: string[] = [];
            
            // 1. Range validation
            const rangeCheck = this.validateRange(v.value, metric);
            issues.push(...rangeCheck.issues);

            // 2. Calculate confidence penalty
            let confidence = 100;
            if (issues.length > 0) confidence -= issues.length * 20;

            return {
                originalValue: v.value,
                rectifiedValue: v.value,
                isValid: rangeCheck.valid,
                issues,
                confidence: Math.max(0, confidence)
            };
        });
    }
}
```

### 16.5 Integration Point

The Data Rectifier should be integrated **BEFORE** ML analysis:

```
Raw Data Sources
       │
       ▼
┌──────────────────┐
│  Data Merging   │  ← Current: weighted median only
└────────┬────────┘
         │
         ▼
┌──────────────────┐     ◄── NEW: Insert DataRectifier here
│  Data Rectifier │
│  - Range Check  │
│  - Outlier Rem. │
│  - Contradict.  │
└────────┬────────┘
         │
         ▼
┌──────────────────┐
│   ML Analysis   │  ← KNN, Linear Regression, etc.
└──────────────────┘
```

---

## 17. Complete System Architecture Diagram

### 17.1 End-to-End Data Flow

```
+=========================================================================+
|                         EBITA INTELLIGENCE PLATFORM                      |
|                          COMPLETE SYSTEM ARCHITECTURE                   |
+=========================================================================+

                                    +-----------------------------------------+
                                    |           CLIENT REQUEST                |
                                    |    { company: "Tata Motors",          |
                                    |      region: "India" }                |
                                    +------------------+--------------------+
                                                       |
                                                       v
                                    +-----------------------------------------+
                                    |      API ROUTE (Next.js)               |
                                    |    app/api/analyze/route.ts           |
                                    |    - Request Validation               |
                                    |    - Rate Limiting                    |
                                    |    - Response Caching                  |
                                    +------------------+--------------------+
                                                       |
                                                       v
                                    +-----------------------------------------+
                                    |    ORCHESTRATOR V2 (lib/orchestrator) |
                                    |    Version: 8.3.1                      |
                                    +------------------+--------------------+
                                                       |
            +------------------------------------------+------------------------------------------+
            |                                         |                                         |
            v                                         v                                         v
+---------------------------+      +---------------------------+      +---------------------------+
|   STRUCTURED APIs        |      |   N.A.T. AI ASSISTANT    |      |   PYTHON SERVICES         |
|   (PARALLEL FETCH)       |      |   (PARALLEL FETCH)      |      |   (PARALLEL FETCH)        |
+---------------------------+      +---------------------------+      +---------------------------+
|                           |      |                           |      |                           |
|  +-----------+           |      |  +--------------------+    |      |  +--------------+         |
|  |    FMP     |           |      |  |  Initial Search   |    |      |  | run_crawler   |         |
|  | Financial  |           |      |  |  (Structured Data)|    |      |  |    .py       |         |
|  | Modeling   |           |      |  +---------+---------+    |      |  |               |         |
|  |   Prep     |           |      |            |               |      |  | Real-time     |         |
|  |            |           |      |  +---------v---------+    |      |  | financial     |         |
|  | API Key    |           |      |  |  General Insight  |    |      |  | data fetch    |         |
|  | Weight:120 |           |      |  |  (Vector Store)  |    |      |  +-------+------+         |
|  +------+------+           |      |  +---------+---------+    |      |          |               |
|         |                   |      |            |               |      |  +-------v------+         |
|  +------v------+           |      |  +---------v---------+    |      |  | run_netbot   |         |
|  |   Alpha    |           |      |  |  Realtime Insight |    |      |  |    .py       |         |
|  |  Vantage   |           |      |  |  (Web Search)    |    |      |  |               |         |
|  |            |           |      |  +---------+---------+    |      |  | Analysis &   |         |
|  | API Key    |           |      |            |               |      |  | insights     |         |
|  | Weight:120 |           |      |  +---------v---------+    |      |  +-------+------+         |
|  +------+------+           |      |  |  Regex Extraction |    |      |          |               |
|         |                   |      |  |  (marketCap,    |    |      |  +-------v------+         |
|  +------v------+           |      |  |   peRatio, etc.)|    |      |  |  Python      |         |
|  |    Yahoo   |           |      |  +---------+---------+    |      |  |  FastAPI     |         |
|  |  Finance   |           |      |            |               |      |  |  Service     |         |
|  |            |           |      |  +---------v---------+    |      |  |  (port 8000) |         |
|  |   Free     |           |      |  |  Source Aggregation|   |      |  +--------------+         |
|  | Weight:80  |           |      |  +--------------------+    |      |                           |
|  +-----------+           |      |                           |      |                           |
|                           |      |  Weight: 80               |      |  Weight: 40               |
+------+--------------------+      +-------------+--------------+      +------------+------------+
         |                                         |                                        |
         +-----------------------------------------+----------------------------------------+
                                                   |
                                                   v
                                    +-----------------------------------------+
                                    |   SERP / GOOGLE CSE QUERIES             |
                                    |   (8 Hardcoded Queries)                 |
                                    +-----------------------------------------+
                                    |  * "${company} P/E ratio"              |
                                    |  * "${company} market cap"              |
                                    |  * "${company} EBITDA"                  |
                                    |  * "${company} revenue"                 |
                                    |  * "${company} EBITDA margin"           |
                                    |  * "${company} revenue growth"          |
                                    |  * "${company} investor presentation"  |
                                    |  * "${company} annual report pdf"      |
                                    +------------------+------------------------+
                                                       |
                                                       v
                                    +-----------------------------------------+
                                    |   PAGE SCRAPING (Cheerio)               |
                                    |   Up to 40 URLs                         |
                                    |   Concurrency: 6                        |
                                    +------------------+------------------------+
                                                       |
                                                       v
                                    +-----------------------------------------+
                                    |   DATA MERGING & SCORING               |
                                    |   Weighted Median Calculation          |
                                    +-----------------------------------------+
                                    |                                         |
                                    |  Source Weights:                        |
                                    |  +------------+----------+              |
                                    |  | FMP        |  120     |              |
                                    |  | Alpha      |  120     |              |
                                    |  | Yahoo      |   80     |              |
                                    |  | N.A.T.     |   80     |              |
                                    |  | Crawler    |   40     |              |
                                    |  | SERP/Scrape|   40    |              |
                                    |  +------------+----------+              |
                                    |                                         |
                                    +------------------+------------------------+
                                                       |
                                                       v
                                    +-----------------------------------------+
                                    |   DERIVED METRICS COMPUTATION          |
                                    |   EBITDA Margin = EBITDA / Revenue     |
                                    +------------------+------------------------+
                                                       |
                                                       v
                                    +-----------------------------------------+
                                    |   DATA RECTIFIER (MISSING)             |
                                    |   - Range Validation                   |
                                    |   - Outlier Removal (IQR/Z-score)      |
                                    |   - Contradiction Detection           |
                                    |   - Source Reliability Filter         |
                                    +------------------+------------------------+
                                                       |
                                                       v
    +------------------------------------------+------------------------------------------+
    |                                          |                                          |
    v                                          v                                          v
+---------------------------+      +---------------------------+      +---------------------------+
|    MACHINE LEARNING        |      |    COMPETITOR ANALYSIS   |      |    ANALYSIS GENERATION    |
|    ANALYTICS               |      |                           |      |                           |
+---------------------------+      |  * Yahoo Recommendations  |      |  * run_netbot()           |
|                           |      |  * KNN Similarity        |      |  * AI Guardrails          |
| +-------------------------+|      |  * Sector Mapping        |      |  * Response Formatting    |
| | KNN (K-Nearest)         ||      +-----------+-------------+      +------------+--------------+
| | Competitor Similarity   ||                  |                              |
| | Input: revenue, mCap,  ||                  v                              v
| |        ebitdaMargin,   ||    +-----------------------------------------------------+
| |        peRatio, roe    ||    |                    OUTPUT                          |
| +-------------------------+|    |  +-----------------------------------------------+    |
|                           |    |  | company: "Tata Motors"                       |    |
| +-------------------------+|    |  | ticker: "TATAMOTORS.NS"                      |    |
| | Linear Regression      ||    |  | merged: { perMetric: {...}, provenance: [] }|    |
| | Revenue Projection     ||    |  | competitors: [{ symbol, similarity }]      |    |
| | 3-year forecast        ||    |  | mlInsights: { revenueProjections,          |    |
| +-------------------------+|    |  |               companySegmentation,          |    |
|                           |    |  |               anomalyDetection, ... }      |    |
| +-------------------------+|    |  | natIntelligence: { generalInsight,         |    |
| | Decision Tree          ||    |  |                    realtimeInsight, ... } |    |
| | Industry Classification||    |  | analysis: { text: "..." }                 |    |
| +-------------------------+|    |  | timestamp: "2026-02-21T..."               |    |
|                           |    |  +-----------------------------------------------+    |
| +-------------------------+|    +-----------------------------------------------------+
| | K-Means Clustering     ||    
| | Company Segmentation   ||    +-----------------------------------------------------+
| +-------------------------+|    |                   DATABASE STORAGE                   |
|                           |    |                                                     |
| +-------------------------+|    |  +---------------+ +---------------+                 |
| | Hierarchical Clustering||    |  | Supabase/     | | Cache Layer   |                 |
| | Industry Groupings     ||    |  | PostgreSQL    | | (File-based)  |                 |
| +-------------------------+|    |  +-------+-------+ +-------+-------+                 |
|                           |    |          |               |                            |
| +-------------------------+|    |          v               v                            |
| | Mean Shift             ||    |  +-------------------------------------+              |
| | Auto-clustering        ||    |  |  * entity_intelligence              |              |
| +-------------------------+|    |  |  * consensus_metrics                |              |
|                           |    |  |  * analysis_results                 |              |
| +-------------------------+|    |  |  * intelligence_cache               |              |
| | DBSCAN                 ||    |  |  * api_fetch_log                    |              |
| | Anomaly Detection      ||    |  |  * data_deltas                      |              |
| +-------------------------+|    |  |  * sector_hierarchy                 |              |
|                           |    |  |  * unknown_entities                 |              |
| +-------------------------+|    |  +-------------------------------------+              |
| | Naive Bayes            ||    |                                                     |
| | Sentiment Analysis     ||    +-----------------------------------------------------+
| +-------------------------+|    
|                           |      
| +-------------------------+|      
| | Neural Network         ||      
| | Credit Risk Prediction ||      
| +-------------------------+|      
|                           |      
| +-------------------------+|      
| | PCA                    ||      
| | Dimensionality Reduct. ||      
| +-------------------------+|      
|                           |      
| +-------------------------+|      
| | Feature Selection      ||      
| | Feature Extraction    ||      
| +-------------------------+|      
+------+---------------------+      
       |
       v
```

### 17.2 Source Weight Summary

| Source | Weight | Type | Reliability |
|--------|--------|------|-------------|
| **FMP** | 120 | Structured API | High |
| **Alpha Vantage** | 120 | Structured API | High |
| **Yahoo Finance** | 80 | Structured API | Medium |
| **N.A.T.** | 80 | AI Extracted | Medium |
| **Python Crawler** | 40 | Web Scraping | Low |
| **SERP/Google CSE** | 40 | Web Scraping | Low |

---

## 18. Database Details

### 18.1 Database Connection

**Location:** `lib/db.ts`

```typescript
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

export const supabase = createClient(supabaseUrl, supabaseKey);
```

### 18.2 Database Schema (PostgreSQL/Supabase)

The system uses 9 interconnected tables:

| Table | Purpose | Key Fields |
|-------|---------|------------|
| `entity_intelligence` | Master company data | canonical_name, ticker_nse/bse, sector, industry |
| `consensus_metrics` | Validated financial data | marketCap, revenue, ebitda, confidence_score |
| `analysis_results` | AI analysis outputs | executive_summary, hallucination_detected |
| `intelligence_cache` | Multi-layer caching | cache_key, cache_layer, expires_at |
| `api_fetch_log` | API usage tracking | endpoint, response_time_ms, success |
| `data_deltas` | Change tracking | metric_name, change_percent, is_significant |
| `sector_hierarchy` | Industry taxonomy | sector, industry, typical_pe_range |
| `unknown_entities` | Unresolved queries | original_query, status, enrichment_data |
| `entity_discovery_queue` | Background jobs | entity_id, status, retry_count |

### 18.3 Complete SQL Schema

```sql
-- Entity Intelligence (Master Company Table)
CREATE TABLE public.entity_intelligence (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  canonical_name character varying NOT NULL,
  normalized_name text NOT NULL,
  entity_type character varying DEFAULT 'company',
  ticker_nse character varying,
  ticker_bse character varying,
  ticker_global character varying,
  sector character varying,
  industry character varying,
  sub_industry character varying,
  niche character varying,
  country character varying DEFAULT 'India',
  region character varying DEFAULT 'INDIA',
  is_listed boolean DEFAULT true,
  is_verified boolean DEFAULT false,
  brands jsonb DEFAULT '[]',
  competitors jsonb DEFAULT '[]',
  created_at timestamp DEFAULT now(),
  updated_at timestamp DEFAULT now()
);

-- Consensus Metrics (Validated Financial Data)
CREATE TABLE public.consensus_metrics (
  id uuid DEFAULT gen_random_uuid(),
  entity_id uuid NOT NULL,
  entity_name character varying NOT NULL,
  market_cap bigint,
  revenue bigint,
  ebitda bigint,
  ebitda_margin numeric,
  pe_ratio numeric,
  revenue_growth numeric,
  confidence_score integer DEFAULT 0,
  sources_used jsonb DEFAULT '[]',
  variance_flags jsonb DEFAULT '[]',
  fetched_at timestamp DEFAULT now(),
  expires_at timestamp NOT NULL
);

-- Analysis Results (AI Outputs)
CREATE TABLE public.analysis_results (
  id uuid DEFAULT gen_random_uuid(),
  entity_id uuid,
  entity_name character varying NOT NULL,
  analysis_type character varying NOT NULL,
  executive_summary text,
  key_findings jsonb DEFAULT '[]',
  hallucination_detected boolean DEFAULT false,
  validation_passed boolean DEFAULT true,
  created_at timestamp DEFAULT now()
);

-- Intelligence Cache
CREATE TABLE public.intelligence_cache (
  id uuid DEFAULT uuid_generate_v4(),
  cache_key text NOT NULL UNIQUE,
  cache_layer character varying DEFAULT 'consensus',
  cache_data jsonb NOT NULL,
  expires_at timestamp NOT NULL,
  hit_count integer DEFAULT 0,
  created_at timestamp DEFAULT now()
);

-- API Fetch Log
CREATE TABLE public.api_fetch_log (
  id uuid DEFAULT gen_random_uuid(),
  entity_name character varying,
  source_name character varying NOT NULL,
  endpoint_called text,
  response_time_ms integer,
  success boolean DEFAULT true,
  error_message text,
  fetched_at timestamp DEFAULT now()
);

-- Data Deltas (Change Tracking)
CREATE TABLE public.data_deltas (
  id uuid DEFAULT gen_random_uuid(),
  entity_id uuid NOT NULL,
  metric_name character varying NOT NULL,
  previous_value numeric,
  new_value numeric,
  change_percent numeric,
  is_significant boolean DEFAULT false,
  detected_at timestamp DEFAULT now()
);

-- Sector Hierarchy
CREATE TABLE public.sector_hierarchy (
  id uuid DEFAULT gen_random_uuid(),
  sector character varying NOT NULL,
  industry character varying NOT NULL,
  sub_industry character varying,
  typical_pe_range character varying,
  typical_ebitda_margin character varying
);

-- Unknown Entities
CREATE TABLE public.unknown_entities (
  id uuid DEFAULT gen_random_uuid(),
  original_query text NOT NULL,
  normalized_name text NOT NULL UNIQUE,
  partial_industry character varying,
  status character varying DEFAULT 'pending',
  enrichment_data jsonb,
  discovered_at timestamp DEFAULT now()
);

-- Entity Discovery Queue
CREATE TABLE public.entity_discovery_queue (
  id uuid DEFAULT gen_random_uuid(),
  entity_id uuid NOT NULL,
  status character varying DEFAULT 'queued',
  priority integer DEFAULT 0,
  queued_at timestamp DEFAULT now(),
  retry_count integer DEFAULT 0
);
```

### 18.4 Data Flow to Database

```
+---------------------------------------------------------------+
|                   DATA STORAGE FLOW                           |
+---------------------------------------------------------------+

     Raw Data              Consensus              Analysis
        |                     |                       |
        v                     v                       v
+---------------+     +---------------+     +---------------+
|  API Fetch    |     |  Weighted     |     |  AI Guard-    |
|  Log          |     |  Merge        |     |  rails        |
|               |     |               |     |               |
| * endpoint    |     | * sources     |     | * hallucina-  |
| * timestamp   |     | * confidence  |     |   tion check  |
| * response    |     | * median      |     | * validation  |
+-------+-------+     +-------+-------+     +-------+-------+
        |                     |                       |
        |                     v                       |
        |              +---------------+             |
        |              |  Consensus    |             |
        |              |  Metrics      |             |
        |              |               |             |
        |              | * marketCap   |             |
        |              | * revenue     |             |
        |              | * ebitda      |             |
        |              | * confidence  |             |
        |              +-------+-------+             |
        |                      |                      |
        |                      v                      |
        |              +---------------+             |
        |              |  Entity        |             |
        |              |  Intelligence  |<------------+
        |              |               |
        |              | * name        |
        |              | * industry    |
        |              | * competitors |
        |              +-------+-------+
        |                      |
        |                      v
        |              +---------------+
        +------------->|  Intelligence |
                       |  Cache        |
                       |               |
                       | * raw         |
                       | * consensus   |
                       | * enriched    |
                       | * analyzed    |
                       +---------------+
```

### 18.5 Query Performance

| Query Type | Typical Latency | Optimization |
|------------|-----------------|--------------|
| Entity Lookup | 50-100ms | indexed columns |
| Metrics Fetch | 100-200ms | expires_at index |
| Analysis Store | 200-500ms | batch inserts |
| Cache Hit | 10-20ms | in-memory layer |

---

## 19. Version History

| Version | Date | Changes |
|---------|------|---------|
| 9.1 | Feb 21, 2026 | Added: Multi-Currency Support (INR, USD, EUR, GBP, JPY, etc.), Global Comparison Engine |
| 9.0 | Feb 21, 2026 | CRITICAL UPGRADE: Pre-ML Data Filtration, Smart Query Builder, Input Normalizer, Multi-Sector Resolver |
| 8.4 | Feb 21, 2026 | Added: N.A.T. competitor data fetching for reliable ML analysis (KNN, K-Means, DBSCAN) |
| 8.3.1 | Feb 21, 2026 | Added: Search Queries (15), Data Rectifier (16), System Architecture (17), Database Details (18) |
| 8.3 | Feb 21, 2026 | N.A.T. parallel integration, 12+ ML algorithms |
| 8.2 | Feb 20, 2026 | Python bots integration |
| 8.1 | Feb 19, 2026 | Multi-source orchestrator v2 |
| 8.0 | Feb 18, 2026 | Complete rewrite with ML |

---

## 20. VERSION 9.0 - COMPLETE LAYER-BASED ARCHITECTURE

### 20.1 Architecture Overview

The EBITA Intelligence Platform Version 9.0 implements a complete layer-based architecture with 8 distinct layers:

```
+=========================================================================+
|                    EBITA INTELLIGENCE PLATFORM v9.0                      |
|                    COMPLETE LAYER-BASED ARCHITECTURE                   |
+=========================================================================+

┌───────────────────────────────────────────────────────────────────────┐
│ LAYER 1: INPUT PROCESSING                                              │
├───────────────────────────────────────────────────────────────────────┤
│                                                                       │
│  ┌─────────────────────┐  ┌─────────────────────┐  ┌─────────────┐  │
│  │  Raw User Query     │→ │ SmartInputNormalizer│→ │  Normalized │  │
│  │  "Relianse Industries│  │                     │  │  Input      │  │
│  │  or "Tata Motrs"    │  │ • Phonetic Match    │  │             │  │
│  │                     │  │ • Context Disambig  │  │ • Company   │  │
│  │                     │  │ • Abbreviation Exp  │  │ • Industry  │  │
│  │                     │  │ • Multi-word Corr  │  │ • Context   │  │
│  └─────────────────────┘  └─────────────────────┘  └─────────────┘  │
│                                                                       │
│  FILES:                                                               │
│  • lib/resolution/smart-normalizer.ts (NEW v9.0)                    │
│                                                                       │
└───────────────────────────────────────────────────────────────────────┘
                                    │
                                    ▼
┌───────────────────────────────────────────────────────────────────────┐
│ LAYER 2: ENTITY RESOLUTION                                            │
├───────────────────────────────────────────────────────────────────────┤
│                                                                       │
│  ┌─────────────────────┐  ┌─────────────────────┐                   │
│  │  Normalized Input   │→ │ MultiSectorResolver │                   │
│  │                     │  │                     │                   │
│  │ • Company Name      │  │ • Conglomerate Check│                   │
│  │ • Industry Context  │  │ • Sector Breakdown  │                   │
│  │ • Region           │  │ • Primary Sector    │                   │
│  │                     │  │ • Sector Competitors│                   │
│  └─────────────────────┘  └─────────────────────┘                   │
│                                    │                                  │
│                                    ▼                                  │
│  ┌─────────────────────────────────────────────────────────────┐     │
│  │ OUTPUT: { isConglomerate, sectors[], primarySector }      │     │
│  └─────────────────────────────────────────────────────────────┘     │
│                                                                       │
│  FILES:                                                               │
│  • lib/resolution/multi-sector-resolver.ts (NEW v9.0)               │
│                                                                       │
└───────────────────────────────────────────────────────────────────────┘
                                    │
                                    ▼
┌───────────────────────────────────────────────────────────────────────┐
│ LAYER 3: QUERY CONSTRUCTION                                           │
├───────────────────────────────────────────────────────────────────────┤
│                                                                       │
│  ┌─────────────────────┐  ┌─────────────────────┐                   │
│  │  Entity Context    │→ │ SmartQueryBuilder   │                   │
│  │                     │  │                     │                   │
│  │ • Company          │  │ • Hierarchical      │                   │
│  │ • Industry         │  │   Query Levels:     │                   │
│  │ • Sector           │  │   1. Specific      │                   │
│  │ • Region           │  │   2. Moderate      │                   │
│  │                     │  │   3. Broad        │                   │
│  │                     │  │   4. Industry     │                   │
│  └─────────────────────┘  └─────────────────────┘                   │
│                                    │                                  │
│                                    ▼                                  │
│  ┌─────────────────────────────────────────────────────────────┐     │
│  │ QUERY SET: 40+ queries per company                        │     │
│  │ • Level 1: "${company} EBITDA 2026 exact"                 │     │
│  │ • Level 2: "${company} financial metrics 2026"            │     │
│  │ • Level 3: "${company} annual report 2026"                │     │
│  │ • Level 4: "${company} industry analysis"                  │     │
│  └─────────────────────────────────────────────────────────────┘     │
│                                                                       │
│  FILES:                                                               │
│  • lib/queries/smart-query-builder.ts (NEW v9.0)                    │
│                                                                       │
└───────────────────────────────────────────────────────────────────────┘
                                    │
                                    ▼
┌───────────────────────────────────────────────────────────────────────┐
│ LAYER 4: DATA ACQUISITION (PARALLEL)                                 │
├───────────────────────────────────────────────────────────────────────┤
│                                                                       │
│  ┌──────────────────────────────────────────────────────────────┐     │
│  │                    PARALLEL FETCHING                          │     │
│  │                                                               │     │
│  │  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐     │     │
│  │  │   FMP    │ │  Alpha   │ │  Yahoo   │ │   N.A.T. │     │     │
│  │  │  (120)   │ │  (120)   │ │   (80)   │ │   (80)   │     │     │
│  │  └────┬─────┘ └────┬─────┘ └────┬─────┘ └────┬─────┘     │     │
│  │       │            │            │            │             │     │
│  │  ┌────▼────────────▼────────────▼────────────▼────┐       │     │
│  │  │           SERP / Google CSE / Scraping          │       │     │
│  │  │                    (40)                         │       │     │
│  │  └────────────────────┬───────────────────────────┘       │     │
│  │                       │                                    │     │
│  │  ┌───────────────────▼───────────────────────────┐        │     │
│  │  │            Python Bots (Parallel)              │        │     │
│  │  │  • run_crawler.py • run_netbot.py            │        │     │
│  │  └───────────────────────────────────────────────┘        │     │
│  └──────────────────────────────────────────────────────────────┘     │
│                                                                       │
│  FILES:                                                               │
│  • lib/orchestrator-v2.ts                                            │
│  • lib/api/financial-api.ts                                         │
│  • lib/nat/nat_service.ts                                           │
│  • scripts/run_crawler.py, run_netbot.py                             │
│                                                                       │
└───────────────────────────────────────────────────────────────────────┘
                                    │
                                    ▼
┌───────────────────────────────────────────────────────────────────────┐
│ LAYER 5: DATA MERGING & QUALITY                                       │
├───────────────────────────────────────────────────────────────────────┤
│                                                                       │
│  ┌──────────────────────────────────────────────────────────────┐     │
│  │  STEP 1: Raw Data Aggregation                               │     │
│  │  ─────────────────────────────────                         │     │
│  │  • Collect all values per metric from all sources         │     │
│  │  • Store source, value, timestamp, reliability            │     │
│  └──────────────────────────────────────────────────────────────┘     │
│                                    │                                  │
│                                    ▼                                  │
│  ┌──────────────────────────────────────────────────────────────┐     │
│  │  STEP 2: Weighted Median Calculation                        │     │
│  │  ─────────────────────────────────                         │     │
│  │  • FMP/Alpha: 120 (high reliability)                     │     │
│  │  • Yahoo/N.A.T.: 80 (medium)                              │     │
│  │  • Crawler/SERP: 40 (low)                                 │     │
│  │  • Calculate weighted median                                │     │
│  └──────────────────────────────────────────────────────────────┘     │
│                                    │                                  │
│                                    ▼                                  │
│  ┌──────────────────────────────────────────────────────────────┐     │
│  │  STEP 3: Confidence Scoring                                 │     │
│  │  ─────────────────────────────────                         │     │
│  │  • Source reliability (40%)                                │     │
│  │  • Data freshness (30%)                                  │     │
│  │  • Cross-ref variance (20%)                               │     │
│  │  • Source diversity (10%)                                 │     │
│  └──────────────────────────────────────────────────────────────┘     │
│                                    │                                  │
│                                    ▼                                  │
│  ┌──────────────────────────────────────────────────────────────┐     │
│  │  STEP 4: Derived Metrics                                   │     │
│  │  ─────────────────────────────────                         │     │
│  │  • EBITDA Margin = EBITDA / Revenue                       │     │
│  │  • EV/EBITDA = (Market Cap + Debt) / EBITDA              │     │
│  └──────────────────────────────────────────────────────────────┘     │
│                                                                       │
│  FILES:                                                               │
│  • lib/orchestrator-v2.ts (mergeCandidates, computeDerived)         │
│                                                                       │
└───────────────────────────────────────────────────────────────────────┘
                                    │
                                    ▼
┌───────────────────────────────────────────────────────────────────────┐
│ LAYER 6: PRE-ML DATA QUALITY (NEW v9.0)                              │
├───────────────────────────────────────────────────────────────────────┤
│                                                                       │
│  ┌──────────────────────────────────────────────────────────────┐     │
│  │  MLDataPreprocessor - CRITICAL NEW LAYER                   │     │
│  │  ────────────────────────────────────────────────────────   │     │
│  │                                                               │     │
│  │  ┌─────────────────────────────────────────────────────┐   │     │
│  │  │  Step 1: Outlier Detection                          │   │     │
│  │  │  • Z-score method (3 std dev threshold)             │   │     │
│  │  │  • IQR method (1.5x interquartile range)            │   │     │
│  │  └─────────────────────────────────────────────────────┘   │     │
│  │                           │                                  │     │
│  │                           ▼                                  │     │
│  │  ┌─────────────────────────────────────────────────────┐   │     │
│  │  │  Step 2: Cross-Metric Validation                    │   │     │
│  │  │  • EBITDA < Revenue (IMPOSSIBLE otherwise)          │   │     │
│  │  │  • Net Income < Revenue                             │   │     │
│  │  │  • EBITDA Margin calculation verification            │   │     │
│  │  │  • Market Cap / Revenue sanity (P/S ratio)         │   │     │
│  │  │  • P/E ratio bounds check                          │   │     │
│  │  └─────────────────────────────────────────────────────┘   │     │
│  │                           │                                  │     │
│  │                           ▼                                  │     │
│  │  ┌─────────────────────────────────────────────────────┐   │     │
│  │  │  Step 3: Industry-Specific Validation               │   │     │
│  │  │  • 16 industry profiles with typical ranges        │   │     │
│  │  │  • Technology, Banking, IT, Automobile, etc.        │   │     │
│  │  │  • P/E, EBITDA Margin, Revenue Growth ranges       │   │     │
│  │  └─────────────────────────────────────────────────────┘   │     │
│  │                           │                                  │     │
│  │                           ▼                                  │     │
│  │  ┌─────────────────────────────────────────────────────┐   │     │
│  │  │  Step 4: Data Completeness                          │   │     │
│  │  │  • Check required fields present                    │   │     │
│  │  │  • Calculate completeness %                         │   │     │
│  │  └─────────────────────────────────────────────────────┘   │     │
│  │                           │                                  │     │
│  │                           ▼                                  │     │
│  │  ┌─────────────────────────────────────────────────────┐   │     │
│  │  │  Step 5: Missing Value Imputation                  │   │     │
│  │  │  • EBITDA from margin × revenue                    │   │     │
│  │  │  • Market Cap from P/E × Net Income                │   │     │
│  │  │  • Mark imputed fields for transparency            │   │     │
│  │  └─────────────────────────────────────────────────────┘   │     │
│  │                           │                                  │     │
│  │                           ▼                                  │     │
│  │  ┌─────────────────────────────────────────────────────┐   │     │
│  │  │  OUTPUT: Quality Score (0-100)                      │   │     │
│  │  │  • >80: Excellent                                   │   │     │
│  │  │  • 40-80: Acceptable                               │   │     │
│  │  │  • <40: Unreliable - warn user                    │   │     │
│  │  └─────────────────────────────────────────────────────┘   │     │
│  │                                                               │     │
│  FILES:                                                               │
│  • lib/ml/data-preprocessor.ts (NEW v9.0 - 410 lines)             │
│                                                                       │
└───────────────────────────────────────────────────────────────────────┘
                                    │
                                    ▼
┌───────────────────────────────────────────────────────────────────────┐
│ LAYER 7: MACHINE LEARNING ANALYTICS                                   │
├───────────────────────────────────────────────────────────────────────┤
│                                                                       │
│  ┌──────────────────────────────────────────────────────────────┐     │
│  │  COMPETITOR ANALYSIS                                         │     │
│  │  ─────────────────────────────────                         │     │
│  │  • Fetch competitor list (Yahoo Finance)                   │     │
│  │  • Fetch REAL metrics via N.A.T. (up to 5 competitors)    │     │
│  │  • KNN similarity calculation                               │     │
│  │  • Add similarity scores to each competitor                │     │
│  └──────────────────────────────────────────────────────────────┘     │
│                                    │                                  │
│                                    ▼                                  │
│  ┌──────────────────────────────────────────────────────────────┐     │
│  │  CLUSTERING ALGORITHMS (Parallel)                           │     │
│  │  ─────────────────────────────────                         │     │
│  │                                                               │     │
│  │  ┌─────────────┐ ┌─────────────┐ ┌─────────────┐          │     │
│  │  │   K-Means   │ │ Hierarchical│ │ Mean Shift │          │     │
│  │  │ Segmentation│ │ Clustering  │ │ Auto-Clust │          │     │
│  │  └─────────────┘ └─────────────┘ └─────────────┘          │     │
│  │                                                               │     │
│  │  ┌─────────────┐                                          │     │
│  │  │   DBSCAN    │ ← Anomaly Detection                       │     │
│  │  │  Outliers   │                                          │     │
│  │  └─────────────┘                                          │     │
│  └──────────────────────────────────────────────────────────────┘     │
│                                    │                                  │
│                                    ▼                                  │
│  ┌──────────────────────────────────────────────────────────────┐     │
│  │  CLASSIFICATION                                             │     │
│  │  ─────────────────────────────────                         │     │
│  │  • Decision Tree → Industry Classification                 │     │
│  │  • Naive Bayes → Sentiment Analysis                        │     │
│  │  • KNN → Competitor Similarity                            │     │
│  └──────────────────────────────────────────────────────────────┘     │
│                                    │                                  │
│                                    ▼                                  │
│  ┌──────────────────────────────────────────────────────────────┐     │
│  │  PREDICTION MODELS                                          │     │
│  │  ─────────────────────────────────                         │     │
│  │  • Linear Regression → Revenue Projection (3 years)       │     │
│  │  • Neural Network → Credit Risk Prediction                 │     │
│  │  • PCA → Dimensionality Reduction                         │     │
│  │  • Feature Selection → Important Metrics                  │     │
│  └──────────────────────────────────────────────────────────────┘     │
│                                                                       │
│  FILES:                                                               │
│  • lib/ml/ml-utils.ts (KNN, Linear Regression, Decision Tree)       │
│  • lib/ml/advanced-ml.ts (K-Means, DBSCAN, Neural Network, PCA)   │
│                                                                       │
└───────────────────────────────────────────────────────────────────────┘
                                    │
                                    ▼
┌───────────────────────────────────────────────────────────────────────┐
│ LAYER 8: OUTPUT & STORAGE                                            │
├───────────────────────────────────────────────────────────────────────┤
│                                                                       │
│  ┌──────────────────────────────────────────────────────────────┐     │
│  │  RESPONSE STRUCTURE                                          │     │
│  │  ─────────────────────────────────                         │     │
│  │  {                                                            │     │
│  │    "company": "Reliance Industries",                        │     │
│  │    "ticker": "RELIANCE.NS",                                  │     │
│  │    "merged": { "perMetric": {...}, "provenance": [...] }, │     │
│  │    "dataQuality": { "score": 85, "issues": [...] },       │     │
│  │    "multiSector": { "isConglomerate": true, ... },          │     │
│  │    "competitors": [...],                                     │     │
│  │    "mlInsights": {                                           │     │
│  │      "revenueProjections": [...],                           │     │
│  │      "companySegmentation": {...},                          │     │
│  │      "anomalyDetection": {...},                             │     │
│  │      "natIntelligence": {...}                               │     │
│  │    },                                                        │     │
│  │    "analysis": { "text": "..." },                          │     │
│  │    "timestamp": "2026-02-21T..."                           │     │
│  │  }                                                            │     │
│  └──────────────────────────────────────────────────────────────┘     │
│                                    │                                  │
│                                    ▼                                  │
│  ┌──────────────────────────────────────────────────────────────┐     │
│  │  DATABASE STORAGE (Supabase/PostgreSQL)                    │     │
│  │  ──────────────────────────────────────                     │     │
│  │  • entity_intelligence → Master company data                 │     │
│  │  • consensus_metrics → Validated financial metrics          │     │
│  │  • analysis_results → AI analysis with validation           │     │
│  │  • intelligence_cache → Multi-layer caching                │     │
│  │  • api_fetch_log → API usage tracking                     │     │
│  │  • data_deltas → Change tracking                           │     │
│  │  • sector_hierarchy → Industry taxonomy                    │     │
│  │  • unknown_entities → Unresolved queries                   │     │
│  │  • entity_discovery_queue → Background jobs                │     │
│  └──────────────────────────────────────────────────────────────┘     │
│                                                                       │
└───────────────────────────────────────────────────────────────────────┘
```

---

### 20.2 Data Flow Summary

```
USER INPUT
    │
    ▼
Layer 1: INPUT PROCESSING
    • SmartInputNormalizer
    • Phonetic matching, context disambiguation
    ▼
Layer 2: ENTITY RESOLUTION  
    • MultiSectorResolver
    • Conglomerate detection, sector breakdown
    ▼
Layer 3: QUERY CONSTRUCTION
    • SmartQueryBuilder
    • Hierarchical query levels (4 levels)
    ▼
Layer 4: DATA ACQUISITION (PARALLEL)
    • FMP, Alpha, Yahoo, N.A.T., Python Bots
    • SERP, Google CSE, Web Scraping
    ▼
Layer 5: DATA MERGING & QUALITY
    • Weighted median, confidence scoring
    • Derived metrics calculation
    ▼
Layer 6: PRE-ML DATA QUALITY (NEW v9.0)
    • MLDataPreprocessor
    • Outlier detection, cross-metric validation
    • Industry-specific validation, imputation
    ▼
Layer 7: ML ANALYTICS
    • KNN, K-Means, DBSCAN, Decision Tree
    • Linear Regression, Neural Network, PCA
    ▼
Layer 8: OUTPUT & STORAGE
    • API Response + Database Persistence
```

---

### 20.3 New Files in v9.0

| File | Lines | Purpose |
|------|-------|---------|
| `lib/ml/data-preprocessor.ts` | 410 | Pre-ML data filtration, validation |
| `lib/queries/smart-query-builder.ts` | 280 | Hierarchical query builder |
| `lib/resolution/smart-normalizer.ts` | 330 | Input normalization, phonetic matching |
| `lib/resolution/multi-sector-resolver.ts` | 280 | Conglomerate sector resolver |
| `lib/currency/currency-converter.ts` | 300 | Multi-currency conversion (INR, USD, EUR, etc.) |
| `lib/comparison/global-comparison.ts` | 380 | Global comparison engine |

---

## 21. CURRENCY & GLOBAL COMPARISON (v9.1)

### 21.1 Supported Currencies

| Code | Symbol | Name | Region |
|------|--------|------|--------|
| USD | $ | US Dollar | USA, North America |
| INR | ₹ | Indian Rupee | India |
| EUR | € | Euro | Europe, EU |
| GBP | £ | British Pound | UK |
| JPY | ¥ | Japanese Yen | Japan |
| CNY | ¥ | Chinese Yuan | China |
| AUD | A$ | Australian Dollar | Australia |
| CAD | C$ | Canadian Dollar | Canada |
| SGD | S$ | Singapore Dollar | Singapore |
| CHF | Fr | Swiss Franc | Switzerland |
| AED | د.إ | UAE Dirham | UAE |
| SAR | ﷼ | Saudi Riyal | Saudi Arabia |

### 21.2 Currency Detection

The system automatically detects currency from:
- **Symbol**: $, ₹, €, £, ¥
- **Text**: "INR", "rupee", "dollar", "euro"
- **Region**: Auto-detect from company region

### 21.3 Global Comparison Features

**Industry Benchmarks (8 Industries):**
- Technology, Banking, Automobile, IT Services
- Retail, Pharmaceuticals, FMCG, Energy

**Comparison Metrics:**
- Global percentile rankings (P25, P50, P75, P90)
- Industry-relative performance
- vs Global Median (percentage difference)
- Cross-market peer comparison

### 21.4 Data Flow

```
Company Data (Original Currency)
         │
         ▼
┌─────────────────────────────┐
│  Currency Detection        │
│  • Symbol/Text/Region      │
└─────────────────────────────┘
         │
         ▼
┌─────────────────────────────┐
│  Currency Conversion       │
│  • Convert to Base (USD)  │
│  • Exchange Rate API      │
└─────────────────────────────┘
         │
         ▼
┌─────────────────────────────┐
│  Global Benchmarking       │
│  • Industry Percentiles    │
│  • vs Global Median       │
│  • Peer Comparison        │
└─────────────────────────────┘
         │
         ▼
┌─────────────────────────────┐
│  Output                   │
│  • currencyInfo          │
│  • globalComparison      │
│  • All metrics in USD    │
└─────────────────────────────┘
```

### 21.5 API Response Enhancement

```json
{
  "company": "Reliance Industries",
  "region": "India",
  "currencyInfo": {
    "companyCurrency": "INR",
    "baseCurrency": "USD",
    "exchangeRates": { "USD": 1, "INR": 83.12, ... },
    "supportedCurrencies": ["USD", "INR", "EUR", ...]
  },
  "globalComparison": {
    "normalizedMetrics": {
      "marketCap": 250000000000,
      "revenue": 120000000000,
      "currency": "USD"
    },
    "globalRank": {
      "marketCap": 85,
      "revenue": 78,
      "ebitdaMargin": 72
    },
    "industryPercentile": {
      "marketCap": 90,
      "revenue": 85,
      "ebitdaMargin": 75
    },
    "vsGlobalMedian": {
      "marketCap": 150,
      "revenue": 120,
      "ebitdaMargin": 10
    }
  }
}
```

---

**Document Status:** COMPLETE - All sections updated
**Last Updated:** February 21, 2026
**Total Sections:** 21
