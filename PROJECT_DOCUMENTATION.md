# EBITA Intelligence Platform - Complete Technical Documentation

## Table of Contents
1. [Project Overview](#project-overview)
2. [Technology Stack](#technology-stack)
3. [Architecture Diagram](#architecture-diagram)
4. [Core Components](#core-components)
5. [How the Search Engine Works](#how-the-search-engine-works)
6. [Data Flow](#data-flow)
7. [API Endpoints](#api-endpoints)
8. [Data Sources](#data-sources)
9. [Potential Issues & Limitations](#potential-issues--limitations)
10. [Project Structure](#project-structure)

---

## Project Overview

**EBITA Intelligence** is a real-time business intelligence and company analysis platform that provides:

- **Company Analysis**: Financial data, metrics, and performance indicators
- **Industry Analysis**: Market trends, benchmarks, and competitive landscape
- **Competitor Intelligence**: Competitor comparison and market positioning
- **Investor Tracking**: Institutional holdings and investor activity
- **Strategic Insights**: AI-generated analysis with risk/opportunity identification

The platform combines multiple data sources (Yahoo Finance, NSE India, BSE India, Alpha Vantage, Financial Modeling Prep) with AI-powered analysis to deliver accurate, real-time business intelligence.

---

## Technology Stack

### Frontend
| Technology | Purpose |
|------------|---------|
| Next.js 16 | React framework with App Router |
| React 19 | UI library |
| Tailwind CSS 4 | Styling |
| Recharts | Data visualization |
| Lucide React | Icons |
| shadcn/ui | Component library (Radix UI) |

### Backend
| Technology | Purpose |
|------------|---------|
| Next.js API Routes | Serverless API endpoints |
| Supabase | Database (PostgreSQL) |
| Python Service (FastAPI) | Data scraping & NSE/BSE fetching |

### AI & Data Processing
| Technology | Purpose |
|------------|---------|
| Groq | AI-powered analysis (primary) |
| Anthropic Claude | AI analysis (backup) |
| Yahoo Finance API | Real-time market data |
| Alpha Vantage | Financial data API |
| Financial Modeling Prep | Financial APIs |

### Data Processing Libraries
- `csv-parser`, `xlsx`, `exceljs` - Excel/CSV handling
- `d3`, `recharts` - Data visualization
- `cheerio` - Web scraping
- `mathjs`, `simple-statistics` - Calculations

---

## Architecture Diagram

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                              CLIENT (Browser)                                │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │                        Next.js Frontend                               │   │
│  │  ┌─────────────┐  ┌──────────────────┐  ┌────────────────────────┐  │   │
│  │  │ Home Page   │  │ Analysis Dashboard │  │ Components/Charts    │  │   │
│  │  │ (Search)   │  │ (Tabs: Overview,  │  │ - HeatMaps           │  │   │
│  │  │             │  │  Competitors,      │  │ - VerdictCards       │  │   │
│  │  │             │  │  Strategies,       │  │ - VisualCharts      │  │   │
│  │  │             │  │  Investors)        │  │ - CategoryBreakdown │  │   │
│  │  └──────┬──────┘  └────────┬─────────┘  └────────────────────────┘  │   │
│  └─────────┼──────────────────┼──────────────────────────────────────────┘   │
└────────────┼──────────────────┼──────────────────────────────────────────────┘
             │                  │
             │ POST /api/analyze│
             │ GET  /api/companies
             │                  │
┌────────────▼──────────────────▼──────────────────────────────────────────────┐
│                           NEXT.JS API LAYER                                  │
│  ┌─────────────────────────────────────────────────────────────────────────┐ │
│  │                        API Routes (app/api/)                           │ │
│  │  ┌──────────────┐ ┌───────────────┐ ┌─────────────┐ ┌──────────────┐  │ │
│  │  │ /analyze     │ │ /companies    │ │ /cache      │ │ /rate-limits │  │ │
│  │  │ (Main API)   │ │ (Data API)    │ │ (Cache)     │ │ (Rate Limit) │  │ │
│  │  └──────┬───────┘ └───────┬───────┘ └──────┬──────┘ └──────┬───────┘  │ │
│  └─────────┼─────────────────┼─────────────────┼──────────────┼──────────┘ │
└────────────┼─────────────────┼─────────────────┼──────────────┼─────────────┘
             │                 │                 │              │
┌────────────▼─────────────────▼─────────────────▼──────────────▼─────────────┐
│                        LIBRARY LAYER (lib/)                                  │
│                                                                             │
│  ┌──────────────────────────────────────────────────────────────────────┐   │
│  │                    MAIN ORCHESTRATOR                                  │   │
│  │              (integration/main-orchestrator.ts)                      │   │
│  │  ┌─────────────┐  ┌─────────────┐  ┌────────────┐  ┌─────────────┐  │   │
│  │  │ Phase 1:    │  │ Phase 2:    │  │ Phase 3:   │  │ Phase 4:    │  │   │
│  │  │ Entity      │─▶│ Multi-Source│─▶│ Build      │─▶│ AI Analysis│  │   │
│  │  │ Resolution  │  │ Data Fetch  │  │ Prompt     │  │ (Groq)     │  │   │
│  │  └─────────────┘  └─────────────┘  └────────────┘  └──────┬──────┘  │   │
│  │         │                 │                 │              │         │   │
│  │         ▼                 ▼                 ▼              ▼         │   │
│  │  ┌─────────────┐  ┌─────────────┐  ┌─────────────────────────────┐    │   │
│  │  │ Entity      │  │ Multi-Source│ │ AI Guardrails              │    │   │
│  │  │ Resolver    │  │ Orchestrator│ │ (Hallucination Prevention) │    │   │
│  │  │             │  │             │ │                            │    │   │
│  │  │ - Company   │  │ - Yahoo     │ │ - Prompt Validation       │    │   │
│  │  │ - Industry │  │ - Alpha     │ │ - Response Validation      │    │   │
│  │  │ - Brand    │  │   Vantage   │ │ - Cross-Reference Check   │    │   │
│  │  └─────────────┘  │ - FMP       │ └─────────────────────────────┘    │   │
│  │                   │ - NSE/BSE   │                                   │   │
│  │                   └─────────────┘                                   │   │
│  └──────────────────────────────────────────────────────────────────────┘   │
│                                                                             │
│  ┌─────────────────────────────┐  ┌────────────────────────────────────┐   │
│  │   COMPANY DATABASE         │  │    FETCHERS (Data Sources)        │   │
│  │   (datasets/company-       │  │                                    │   │
│  │    database.ts)            │  │  ┌──────────┐ ┌──────────┐        │   │
│  │                            │  │  │ Yahoo    │ │ Alpha    │        │   │
│  │  - 995 companies          │  │  │ Finance  │ │ Vantage  │        │   │
│  │  - 29 industries         │  │  └──────────┘ └──────────┘        │   │
│  │  - 27 countries          │  │  ┌──────────┐ ┌──────────┐        │   │
│  │  - Loaded from CSV        │  │  │ FMP      │ │ NSE/BSE  │        │   │
│  │                            │  │  └──────────┘ └──────────┘        │   │
│  └─────────────────────────────┘  └────────────────────────────────────┘   │
│                                                                             │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │   SUPPORTING SERVICES                                                │   │
│  │  ┌──────────────┐  ┌─────────────┐  ┌─────────────┐  ┌───────────┐  │   │
│  │  │ Rate Limiter │  │ Cache       │  │ Error       │  │ Validators│  │   │
│  │  │              │  │             │  │ Monitor     │  │           │  │   │
│  │  └──────────────┘  └─────────────┘  └─────────────┘  └───────────┘  │   │
│  └─────────────────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────────────────┘
              │
              │ External APIs

---

## V2 Multi-Source Orchestrator Architecture (Version 8.0)

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                     V2 ORCHESTRATOR (lib/orchestrator-v2.ts)               │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  ┌─────────────────┐                                                       │
│  │  Input:         │                                                       │
│  │  Company Name   │                                                       │
│  │  Region        │                                                       │
│  └────────┬────────┘                                                       │
│           │                                                                 │
│           ▼                                                                 │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │ Step 1: Ticker Discovery (discoverTicker)                          │   │
│  │  • Yahoo Finance Search API                                         │   │
│  │  • Cache results for 7 days                                        │   │
│  │  • Supports: .NS (India), .BO (Bombay) suffixes                    │   │
│  └─────────────────────────────────────────────────────────────────────┘   │
│           │                                                                 │
│           ▼                                                                 │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │ Step 2: Multi-Source Data Fetch (PARALLEL)                        │   │
│  │                                                                      │   │
│  │  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐            │   │
│  │  │ FMP API     │  │ Alpha Vantage│  │ Yahoo Finance│            │   │
│  │  │ (Priority 1)│  │ (Priority 2)│  │ (Priority 3)│            │   │
│  │  └──────────────┘  └──────────────┘  └──────────────┘            │   │
│  │       │                  │                  │                       │   │
│  │       └──────────────────┼──────────────────┘                       │   │
│  │                          ▼                                           │   │
│  │              Returns: Market Cap, P/E, Revenue, EBITDA              │   │
│  └─────────────────────────────────────────────────────────────────────┘   │
│           │                                                                 │
│           ▼                                                                 │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │ Step 3: Python Crawler Integration                                │   │
│  │  • Calls: scripts/run_crawler.py                                  │   │
│  │  • Your existing Python real-time crawler                          │   │
│  │  • Returns: links[], competitors[], snippets[]                     │   │
│  └─────────────────────────────────────────────────────────────────────┘   │
│           │                                                                 │
│           ▼                                                                 │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │ Step 4: SERP Search (Fallback)                                   │   │
│  │  • Google Custom Search API (primary)                              │   │
│  │  • SerpAPI (fallback)                                            │   │
│  │  • Queries: P/E, Market Cap, EBITDA, Revenue, etc.               │   │
│  └─────────────────────────────────────────────────────────────────────┘   │
│           │                                                                 │
│           ▼                                                                 │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │ Step 5: Web Scraping (scrapeLinks)                                │   │
│  │  • Cheerio-based HTML parsing                                      │   │
│  │  • Extracts: P/E, Market Cap, Revenue, EBITDA, Margins           │   │
│  │  • Concurrent scraping (6 parallel)                               │   │
│  └─────────────────────────────────────────────────────────────────────┘   │
│           │                                                                 │
│           ▼                                                                 │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │ Step 6: Merge & Score (mergeCandidates)                          │   │
│  │  • Weighted median by source authority                             │   │
│  │  • Source weights: FMP/Alpha (120) > Yahoo (80) > Scrape (40)   │   │
│  │  • Confidence = (sources × 10) + (structured ? 40 : 0)          │   │
│  └─────────────────────────────────────────────────────────────────────┘   │
│           │                                                                 │
│           ▼                                                                 │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │ Step 7: Derived Metrics (computeDerived)                         │   │
│  │  • EBITDA Margin = (EBITDA / Revenue) × 100                     │   │
│  │  • EV/EBITDA (if EV and EBITDA available)                       │   │
│  └─────────────────────────────────────────────────────────────────────┘   │
│           │                                                                 │
│           ▼                                                                 │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │ Step 8: Python NET Bot (LLM Analysis)                            │   │
│  │  • Calls: scripts/run_netbot.py                                  │   │
│  │  • Sends: merged financial data + provenance                     │   │
│  │  • LLM receives ONLY verified data (NO hallucination)             │   │
│  │  • Returns: structured analysis                                   │   │
│  └─────────────────────────────────────────────────────────────────────┘   │
│           │                                                                 │
│           ▼                                                                 │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │ Output: { company, ticker, region, merged, competitors, analysis } │   │
│  │  • merged.perMetric: { value, confidence, sources[] }              │   │
│  │  • merged.provenance: URL[]                                        │   │
│  │  • analysis: { summary, data_points, confidence }                │   │
│  └─────────────────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────────────────┘
```

### API Usage

```bash
# Using V2 Orchestrator (Multi-Source)
curl -X PUT http://localhost:3000/api/analyze \
  -H "Content-Type: application/json" \
  -d '{"company": "Tata Motors", "region": "India"}'

# Using V2 mode explicitly
curl -X PUT http://localhost:3000/api/analyze \
  -H "Content-Type: application/json" \
  -d '{"company": "Reliance Industries", "mode": "v2"}'
```

### Environment Variables Required

```env
# Financial APIs
FMP_API_KEY=your_fmp_key
ALPHA_VANTAGE_KEY=your_alpha_key

# Search APIs
GOOGLE_CSE_KEY=your_google_cse_key
GOOGLE_CSE_ID=your_google_cse_id
SERPAPI_KEY=your_serpapi_key

# Python Bot Integration
PYTHON_CRAWLER_CMD=python3
PYTHON_CRAWLER_SCRIPT=./scripts/run_crawler.py
PYTHON_NET_CMD=python3
PYTHON_NET_SCRIPT=./scripts/run_netbot.py

# Configuration
CACHE_DIR=.cache
LOG_FILE=./orchestrator-v2.log
USER_AGENT=EBITA-Intelligence/2.0
```

---
             │
┌────────────▼─────────────────────────────────────────────────────────────────┐
│                          EXTERNAL SERVICES                                  │
│                                                                             │
│  ┌───────────────┐  ┌───────────────┐  ┌───────────────┐  ┌─────────────┐  │
│  │ Yahoo Finance │  │ Alpha Vantage │  │ FMP API      │  │ Groq AI    │  │
│  │ (Market Data) │  │ (Financials)  │  │ (Financials) │  │ (Analysis) │  │
│  └───────────────┘  └───────────────┘  └───────────────┘  └─────────────┘  │
│                                                                             │
│  ┌───────────────┐  ┌───────────────┐  ┌───────────────┐                  │
│  │ NSE India    │  │ BSE India    │  │ Supabase DB  │                  │
│  │ (India Data) │  │ (India Data) │  │ (Storage)    │                  │
│  └───────────────┘  └───────────────┘  └───────────────┘                  │
│                                                                             │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │                    PYTHON SERVICE (FastAPI)                         │   │
│  │                    (python-service/main.py)                         │   │
│  │  ┌─────────────┐  ┌─────────────┐  ┌─────────────────────────────┐  │   │
│  │  │ NSE Fetcher │  │ Yahoo       │  │ Confidence Scorer          │  │   │
│  │  │             │  │ Fetcher     │  │ (Cross-Validation)         │  │   │
│  │  └─────────────┘  └─────────────┘  └─────────────────────────────┘  │   │
│  └─────────────────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## Core Components

### 1. Entity Resolution System (`lib/resolution/`)

**Purpose**: Identify and match user queries to correct companies/industries

**Files**:
- `entity-resolver.ts` - Main resolution logic
- `universal-resolver.ts` - Enhanced resolver with fuzzy matching
- `brand-knowledge-base.ts` - Static brand-to-company mappings
- `auto-discovery.ts` - Self-learning entity discovery

**How It Works**:
1. Receives user query (e.g., "Apple", "iPhone maker")
2. Normalizes the query (lowercase, remove special chars)
3. Checks against company database (995 companies)
4. Uses fuzzy matching for brand names
5. Returns resolved entity with confidence score

### 2. Multi-Source Data Orchestrator (`lib/data/`)

**Purpose**: Fetch and reconcile data from multiple sources

**Files**:
- `multi-source-orchestrator.ts` - Main orchestrator
- `orchestrator.ts` - Legacy orchestrator

**Data Sources**:
| Source | Coverage | Reliability |
|--------|----------|-------------|
| Yahoo Finance | Global | 78% |
| Alpha Vantage | Global | 75% |
| Financial Modeling Prep | Global | 76% |
| NSE India | India | 88% |
| BSE India | India | 85% |

**Cross-Validation**:
- Fetches same metric from multiple sources
- Calculates median value (outlier resistant)
- Flags high variance (>15%) as warning
- Returns consensus value with confidence score

### 3. AI Analysis Engine (`lib/ai/` & `lib/analyzers/`)

**Purpose**: Generate intelligent analysis from raw data

**Files**:
- `ai-guardrails.ts` - Prevents AI hallucinations
- `groq-prompts.ts` - Prompt templates
- `engine.ts` - Analysis engine
- `market-analyzer.ts` - Market analysis
- `competitor-analyzer.ts` - Competitor analysis

**Process**:
1. Builds structured input from fetched data
2. Generates guarded prompt with data validation
3. Calls Groq API for analysis
4. Validates response against source data
5. Cross-references claims with known facts
6. Returns structured analysis with citations

### 4. Company Database (`lib/datasets/company-database.ts`)

**Purpose**: In-memory database of verified companies

**Data**:
- 995 real companies
- 29 industries
- 27 countries
- Source: `datasets/all_real_companies_combined.csv`

**Fields**:
```typescript
interface CompanyRecord {
  companyName: string
  normalizedCompanyName: string
  industryName: string
  normalizedIndustryName: string
  subIndustry: string
  country: string
  source: string
  confidenceScore: number
  verified: boolean
}
```

### 5. API Routes (`app/api/`)

| Route | Purpose |
|-------|---------|
| `/api/analyze` | Main analysis endpoint |
| `/api/companies` | Company search/lookup |
| `/api/cache` | Cache management |
| `/api/rate-limits` | Rate limit status |
| `/api/health` | Health check |

---

## How the Search Engine Works

### Complete Search Flow

```
USER ACTION
    │
    ▼
┌─────────────────────────────────────────────────────────────────────────┐
│ 1. USER INPUT                                                           │
│    User types: "Apple stock analysis" or selects "Technology" industry  │
└─────────────────────────────────────────────────────────────────────────┘
    │
    ▼
┌─────────────────────────────────────────────────────────────────────────┐
│ 2. FRONTEND PROCESSING                                                  │
│    - SearchBar.tsx captures input                                       │
│    - Validates input (min 2 chars)                                      │
│    - Navigates to /analyze/[industry]                                   │
└─────────────────────────────────────────────────────────────────────────┘
    │
    ▼
┌─────────────────────────────────────────────────────────────────────────┐
│ 3. ANALYSIS DASHBOARD LOAD                                              │
│    - AnalysisDashboard.tsx renders                                      │
│    - Calls /api/analyze with query                                       │
└─────────────────────────────────────────────────────────────────────────┘
    │
    ▼
┌─────────────────────────────────────────────────────────────────────────┐
│ 4. API ROUTE: /api/analyze (app/api/analyze/route.ts)                   │
│                                                                         │
│    a) Validate request body                                             │
│    b) Check rate limits                                                 │
│    c) Route to main orchestrator                                        │
└─────────────────────────────────────────────────────────────────────────┘
    │
    ▼
┌─────────────────────────────────────────────────────────────────────────┐
│ 5. MAIN ORCHESTRATOR (lib/integration/main-orchestrator.ts)            │
│                                                                         │
│    ╔═══════════════════════════════════════════════════════════════╗  │
│    ║ PHASE 1: ENTITY RESOLUTION                                     ║  │
│    ╠═══════════════════════════════════════════════════════════════╣  │
│    ║ Input: "Apple" or "iPhone"                                      ║  │
│    ║ Process:                                                         ║  │
│    ║   - Normalize query ("apple" → "apple inc")                    ║  │
│    ║   - Search company database                                     ║  │
│    ║   - Check brand knowledge base (iPhone → Apple)                ║  │
│    ║   - Fuzzy match against 995 companies                          ║  │
│    ║ Output: { entityId, name, type, confidence }                   ║  │
│    ╚═══════════════════════════════════════════════════════════════╝  │
│    │                                                                     │
│    ▼                                                                     │
│    ╔═══════════════════════════════════════════════════════════════╗  │
│    ║ PHASE 2: MULTI-SOURCE DATA FETCH                             ║  │
│    ╠═══════════════════════════════════════════════════════════════╣  │
│    ║ Input: { ticker: "AAPL", region: "GLOBAL" }                   ║  │
│    ║ Process:                                                         ║  │
│    ║   - Call Yahoo Finance API                                     ║  │
│    ║   - Call Alpha Vantage API                                     ║  │
│    ║   - Call FMP API                                               ║  │
│    ║   - Parallel fetching with Promise.all                         ║  │
│    ║   - Cross-validate values (median, variance check)            ║  │
│    ║ Output: { consensusValues, sourceData[], confidence }         ║  │
│    ╚═══════════════════════════════════════════════════════════════╝  │
│    │                                                                     │
│    ▼                                                                     │
│    ╔═══════════════════════════════════════════════════════════════╗  │
│    ║ PHASE 3: BUILD STRUCTURED INPUT                               ║  │
│    ╠═══════════════════════════════════════════════════════════════╣  │
│    ║ Input: { entity, multiSourceData }                             ║  │
│    ║ Process:                                                         ║  │
│    ║   - Extract key metrics                                        ║  │
│    ║   - Format for AI consumption                                   ║  │
│    ║   - Add validation flags                                        ║  │
│    ║ Output: { companyInfo, metrics, sources, warnings }           ║  │
│    ╚═══════════════════════════════════════════════════════════════╝  │
│    │                                                                     │
│    ▼                                                                     │
│    ╔═══════════════════════════════════════════════════════════════╗  │
│    ║ PHASE 4: AI ANALYSIS (GROQ)                                   ║  │
│    ╠═══════════════════════════════════════════════════════════════╣  │
│    ║ Input: { structuredInput, analysisType }                      ║  │
│    ║ Process:                                                         ║  │
│    ║   - Generate guarded prompt                                     ║  │
│    ║   - Include source data in prompt                               ║  │
│    ║   - Request structured JSON response                           ║  │
│    ║   - Call Groq API                                               ║  │
│    ║   - Validate response against source data                      ║  │
│    ║   - Check for hallucinations                                    ║  │
│    ║ Output: { summary, findings, risks, opportunities }           ║  │
│    ╚═══════════════════════════════════════════════════════════════╝  │
│    │                                                                     │
│    ▼                                                                     │
│    ╔═══════════════════════════════════════════════════════════════╗  │
│    ║ PHASE 5: RESPONSE & CACHING                                   ║  │
│    ╠═══════════════════════════════════════════════════════════════╣  │
│    ║ Process:                                                         ║  │
│    ║   - Build final response object                                 ║  │
│    ║   - Add metadata (timing, sources)                             ║  │
│    ║   - Cache results                                               ║  │
│    ║   - Log analysis to database                                    ║  │
│    ║ Output: Complete AnalysisResponse                               ║  │
│    ╚═══════════════════════════════════════════════════════════════╝  │
└─────────────────────────────────────────────────────────────────────────┘
    │
    ▼
┌─────────────────────────────────────────────────────────────────────────┐
│ 6. FRONTEND RENDERING                                                   │
│    - AnalysisDashboard receives data                                     │
│    - Renders tabs: Overview, Competitors, Strategies, Investors        │
│    - Displays charts: HeatMaps, VerdictCards, VisualCharts             │
└─────────────────────────────────────────────────────────────────────────┘
    │
    ▼
┌─────────────────────────────────────────────────────────────────────────┐
│ 7. USER SEES RESULTS                                                   │
│    - Company overview with key metrics                                  │
│    - Competitor comparison                                              │
│    - Strategic recommendations                                          │
│    - Investor information                                              │
└─────────────────────────────────────────────────────────────────────────┘
```

### Timing Breakdown (Typical)

| Phase | Time |
|-------|------|
| Entity Resolution | 50-100ms |
| Data Fetch (3 sources) | 200-500ms |
| AI Analysis (Groq) | 500-2000ms |
| Response Building | 50ms |
| **Total** | **800-3000ms** |

---

## Data Flow

### Input → Output Data Transformation

```
QUERY: "Tesla Analysis"
         │
         ▼
    ┌────────────┐
    │  Entity    │
    │  Resolver  │
    └─────┬──────┘
          │
          ▼
    ┌─────────────────────┐
    │ Resolved:           │
    │ - name: Tesla Inc   │
    │ - ticker: TSLA      │
    │ - industry: Auto    │
    │ - confidence: 95%   │
    └─────┬───────────────┘
          │
          ▼
    ┌─────────────────────┐
    │ Multi-Source Fetch  │
    │                     │
    │ Yahoo:  {           │
    │   marketCap: 800B, │
    │   pe: 45,          │
    │   revenue: 96B     │
    │ }                  │
    │                     │
    │ Alpha: {           │
    │   marketCap: 798B, │
    │   pe: 44.5,        │
    │   revenue: 96.2B   │
    │ }                  │
    │                     │
    │ FMP: {             │
    │   marketCap: 802B  │
    │ }                  │
    └─────┬─────────────┘
          │
          ▼ (Cross-Validation)
    ┌─────────────────────┐
    │ Consensus Values:    │
    │ - marketCap: 800B  │
    │ - pe: 45 (median)  │
    │ - confidence: 82%  │
    │ - variance: <2%    │
    └─────┬───────────────┘
          │
          ▼
    ┌─────────────────────┐
    │ AI Analysis         │
    │ (Groq Prompt)       │
    │                     │
    │ Based on:           │
    │ - Market Cap: $800B │
    │ - P/E Ratio: 45      │
    │ - Revenue: $96B     │
    │ - Industry: Auto    │
    │                     │
    │ Generated:          │
    │ - Summary           │
    │ - Key Findings      │
    │ - Risks             │
    │ - Opportunities     │
    └─────┬───────────────┘
          │
          ▼
    ┌─────────────────────┐
    │ FINAL RESPONSE      │
    │                     │
    │ {                  │
    │   success: true,    │
    │   entity: {...},    │
    │   data: {...},      │
    │   analysis: {...},  │
    │   metadata: {...}   │
    │ }                  │
    └─────────────────────┘
```

---

## API Endpoints

### POST /api/analyze

Main analysis endpoint for company/industry analysis.

**Request**:
```json
{
  "query": "Apple",
  "type": "company",
  "region": "GLOBAL",
  "includeCompetitors": true,
  "includeInvestors": true
}
```

**Response**:
```json
{
  "success": true,
  "entity": {
    "type": "company",
    "name": "Apple Inc",
    "id": "apple-inc",
    "confidence": 98
  },
  "data": {
    "financials": {
      "marketCap": 3000000000000,
      "revenue": 383000000000,
      "ebitda": 114000000000
    },
    "marketData": {...},
    "sources": ["Yahoo", "Alpha Vantage", "FMP"],
    "confidence": 85
  },
  "analysis": {
    "summary": "Apple Inc demonstrates...",
    "keyFindings": [...],
    "risks": [...],
    "opportunities": [...],
    "citations": [...]
  },
  "metadata": {
    "processingTimeMs": 1500,
    "sourcesUsed": ["Yahoo", "Alpha Vantage"],
    "requestId": "abc-123"
  }
}
```

### GET /api/companies

Search and filter company database.

**Query Params**:
- `search` - Search term
- `industry` - Filter by industry
- `country` - Filter by country

### GET /api/cache

Manage analysis cache.

### GET /api/rate-limits

Check current rate limit status.

---

## Data Sources

### Primary Data Sources

| Source | Type | Data Provided | API Key Required |
|--------|------|---------------|------------------|
| Yahoo Finance | API | Market data, financials | No (limited) |
| Alpha Vantage | API | Financial statements | Yes (ALPHA_VANTAGE_API_KEY) |
| Financial Modeling Prep | API | Financial data | Yes (FMP_API_KEY) |
| NSE India | Scraping | Indian market data | No |
| BSE India | Scraping | Indian market data | No |
| World Bank | API | Macro indicators | No |
| IMF | API | Economic data | No |

### Company Database Sources

- `datasets/all_real_companies_combined.csv` - Main company list
- `datasets/companies_master.csv` - Master company data
- `datasets/industries_master.csv` - Industry taxonomy
- `datasets/brands_master.csv` - Brand to company mappings
- `datasets/company_aliases_master.csv` - Company aliases

---

## Potential Issues & Limitations

### 1. API Rate Limits

**Issue**: External APIs have rate limits
- Yahoo Finance: Limited requests
- Alpha Vantage: 25-500 requests/day (free tier)
- FMP: Limited on free tier

**Mitigation**: Implemented caching and rate limiting

### 2. Data Consistency

**Issue**: Different sources may report different values
- Example: Yahoo shows market cap as $800B, FMP shows $798B

**Mitigation**: 
- Cross-validation with median calculation
- Variance flagging (>15% difference)
- Confidence scoring based on source reliability

### 3. Entity Resolution Errors

**Issue**: Wrong company matched for ambiguous queries
- "Apple" could be Apple Inc or Apple (fruit)

**Mitigation**:
- Confidence scoring
- Brand knowledge base
- User confirmation for low confidence

### 4. AI Hallucinations

**Issue**: AI may generate false information

**Mitigation**:
- AI Guardrails system
- Response validation against source data
- Citation requirements
- Cross-reference checking

### 5. India Market Data
**Issue**: NSE/BSE scraping may be blocked

**Mitigation**:
- Python service with session handling
- Cookie management
- Fallback to Yahoo Finance for India

### 6. Database Loading

**Issue**: Company database loads from CSV on server startup
- Hardcoded paths may fail

**Mitigation**: Multiple path fallback

### 7. Python Service Dependency

**Issue**: Some features require Python FastAPI service
- NSE/BSE data fetching
- Advanced scraping

**Status**: Optional - system works without it using other sources

---

## Project Structure

```
business-intelligence/
├── app/                          # Next.js App Router
│   ├── api/                      # API Routes
│   │   ├── analyze/             # Main analysis endpoint
│   │   ├── companies/           # Company search
│   │   ├── cache/              # Cache management
│   │   └── ...
│   ├── analyze/[industry]/      # Dynamic analysis page
│   ├── landing/                 # Landing page
│   ├── globals.css             # Global styles
│   ├── layout.tsx              # Root layout
│   └── page.tsx                # Home page
│
├── components/                  # React Components
│   ├── dashboard/              # Dashboard components
│   │   ├── AnalysisDashboard.tsx
│   │   ├── SearchBar.tsx
│   │   ├── Sidebar.tsx
│   │   ├── tabs/               # Dashboard tabs
│   │   │   ├── OverviewTab.tsx
│   │   │   ├── CompetitorsTab.tsx
│   │   │   ├── StrategiesTab.tsx
│   │   │   └── InvestorsTab.tsx
│   │   └── ...
│   ├── charts/                 # Chart components
│   │   ├── HeatMap.tsx
│   │   ├── CompetitorHeatmap.tsx
│   │   └── ...
│   └── ui/                     # UI primitives (shadcn)
│
├── lib/                         # Core Application Logic
│   ├── datasets/               # Data loading
│   │   └── company-database.ts
│   │
│   ├── resolution/             # Entity Resolution
│   │   ├── entity-resolver.ts
│   │   ├── universal-resolver.ts
│   │   └── brand-knowledge-base.ts
│   │
│   ├── data/                   # Data Orchestration
│   │   ├── orchestrator.ts
│   │   └── multi-source-orchestrator.ts
│   │
│   ├── integration/            # Main Integration
│   │   └── main-orchestrator.ts
│   │
│   ├── ai/                     # AI Systems
│   │   ├── ai-guardrails.ts
│   │   └── groq-prompts.ts
│   │
│   ├── analyzers/              # Analysis Engines
│   │   ├── engine.ts
│   │   ├── market-analyzer.ts
│   │   ├── competitor-analyzer.ts
│   │   └── risk-analyzer.ts
│   │
│   ├── fetchers/               # Data Fetchers
│   │   ├── yahoo-finance-fetcher.ts
│   │   ├── alpha-vantage-fetcher.ts
│   │   ├── fmp-fetcher.ts
│   │   ├── nse-fetcher.ts
│   │   └── ...
│   │
│   ├── services/              # Business Services
│   │   ├── real-time-company-data.ts
│   │   ├── competitor-intelligence.ts
│   │   └── stakeholder-service.ts
│   │
│   ├── utils/                  # Utilities
│   │   ├── export.ts
│   │   └── ...
│   │
│   ├── db.ts                   # Database client
│   ├── cache.ts                # Cache management
│   ├── rateLimiter.ts          # Rate limiting
│   └── pipeline.ts             # Pipeline documentation
│
├── datasets/                   # Data Files
│   ├── all_real_companies_combined.csv
│   ├── companies_master.csv
│   ├── industries_master.csv
│   ├── brands_master.csv
│   └── company_aliases_master.csv
│
├── python-service/             # Python Data Service
│   └── main.py                # FastAPI service
│
├── public/                     # Static Assets
│
├── package.json               # Dependencies
├── tsconfig.json              # TypeScript config
├── next.config.ts             # Next.js config
├── tailwind.config.ts         # Tailwind config
└── .env.local                 # Environment variables
```

---

## Environment Variables

Required in `.env.local`:

```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key

# AI APIs
GROQ_API_KEY=your_groq_key
ANTHROPIC_API_KEY=your_anthropic_key

# Financial APIs
ALPHA_VANTAGE_API_KEY=your_alpha_vantage_key
FMP_API_KEY=your_fmp_key

# Python Service (optional)
PYTHON_SERVICE_SECRET=dev-secret
```

---

## Running the Project

```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Build for production
npm run build

# Start production server
npm start
```

---

*Last Updated: February 2026*
*Version: 3.0*
