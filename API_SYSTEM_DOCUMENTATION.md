# EBITA Intelligence Platform - Complete API & System Documentation

**Version**: 9.2  
**Date**: February 21, 2026  
**Status**: Production Ready

---

## Table of Contents

1. [Executive Summary](#1-executive-summary)
2. [API Sources & Data Layers](#2-api-sources--data-layers)
3. [N.A.T. AI Integration](#3-nat-ai-integration)
4. [ML Layers & Algorithms](#4-ml-layers--algorithms)
5. [System Components & Connections](#5-system-components--connections)
6. [Data Flow Architecture](#6-data-flow-architecture)
7. [Query Processing](#7-query-processing)
8. [Error Handling & Fallback](#8-error-handling--fallback)
9. [Output Response Format](#9-output-response-format)
10. [API Endpoints](#10-api-endpoints)
11. [Configuration](#11-configuration)

---

## 1. Executive Summary

The EBITA Intelligence Platform is a comprehensive business intelligence system that aggregates data from multiple sources, applies ML algorithms, and provides AI-powered insights through N.A.T. (Neural Analysis Terminal).

### Key Capabilities:
- **Multi-source data aggregation** from 6+ API sources
- **N.A.T. AI** for natural language insights and fallback
- **10+ ML algorithms** for analysis and predictions
- **Multi-currency support** (30 currencies)
- **Global comparison** across 20+ industry profiles
- **Data validation** with quality scoring

---

## 2. API Sources & Data Layers

### 2.1 Primary Data Sources

| Source | Status | Endpoints | Data Provided |
|--------|--------|-----------|---------------|
| **FMP (v4)** | ✅ Working | `/stable/quote`, `/profile`, `/key-metrics` | Market cap, P/E, revenue, EBITDA, sector |
| **Alpha Vantage** | ✅ Working | `/query?function=OVERVIEW` | Company info, sector, industry, financials |
| **Yahoo Finance** | ⚠️ Auth Required | `/v10/finance/quoteSummary` | Real-time quotes |
| **NSE India** | ✅ Working | `stock-nse-india` package | Indian stocks equity details |
| **Currency API** | ✅ Working | `/v4/latest/USD` | 160+ exchange rates |
| **Google CSE** | ⚠️ Quota | `/customsearch/v1` | SERP fallback |

### 2.2 Source Priority & Weights

```
FMP / Alpha Vantage / NSE India  → Weight: 120 (Highest Priority)
Yahoo / N.A.T.                   → Weight: 80
SERP / Crawler / Google          → Weight: 40
Default                           → Weight: 30
```

### 2.3 Data Merge Logic

```
1. Fetch from all sources in PARALLEL
2. Validate each source's data
3. Normalize values (growth rates, margins)
4. Calculate confidence scores
5. Weighted merge based on source priority
6. Fill gaps with N.A.T. fallback data
```

---

## 3. N.A.T. AI Integration

### 3.1 What is N.A.T.?

N.A.T. (Neural Analysis Terminal) is an AI assistant that provides:
- Natural language business intelligence
- Structured data extraction via regex
- Web search for real-time data
- Context when structured APIs fail

### 3.2 N.A.T. Query Types

| Query Type | Purpose | Response |
|------------|---------|----------|
| `initial_search` | Initial data fetch | Structured financial metrics |
| `general` | Company overview | Business intelligence report |
| `realtime` | Latest data | Real-time financial performance |
| `competitors` | Competitive analysis | Market share, competitors |
| `investors` | Investor info | Institutional investors, ratings |
| `marketing` | Marketing strategy | Brand positioning, campaigns |
| `revenue_breakdown` | Revenue analysis | By product/region/segment |

### 3.3 N.A.T. Data Flow

```
User Request
    ↓
Orchestrator
    ↓
┌─────────────────────────────────────┐
│ N.A.T. Query Generator              │
│ - Generates prompt based on type   │
│ - Includes structured output format │
└─────────────────────────────────────┘
    ↓
N.A.T. Server (localhost:8000)
    ↓
┌─────────────────────────────────────┐
│ Groq LLM Processing                 │
│ - meta-llama/llama-4-scout-17b    │
│ - Tavily web search                │
└─────────────────────────────────────┘
    ↓
Response Parser
    ↓
Extract: generalInsight, realtimeInsight,
         competitorsInsight, investorsInsight,
         marketingInsight, revenueBreakdown
```

### 3.4 N.A.T. Fallback Strategy

When structured APIs fail:
1. N.A.T. searches the web for company data
2. Extracts structured metrics via regex
3. Provides full business intelligence report
4. Always includes source URLs

---

## 4. ML Layers & Algorithms

### 4.1 ML Algorithms Implemented

| Algorithm | Purpose | Input Data | Output |
|-----------|---------|------------|--------|
| **KNN** | Similar company finding | Revenue, market cap, margins | Nearest neighbors |
| **Linear Regression** | Revenue projection | Historical revenue | Future revenue forecasts |
| **Decision Tree** | Industry classification | Company metrics | Industry category |
| **K-Means** | Company segmentation | Multiple metrics | Cluster assignments |
| **Hierarchical** | Anomaly detection | Feature vectors | Outlier identification |
| **Mean Shift** | Natural clustering | Feature vectors | Cluster centers |
| **DBSCAN** | Density clustering | Feature vectors | Dense regions |
| **Naive Bayes** | Sentiment analysis | News headlines | Sentiment scores |
| **Neural Network** | Credit risk | Financial ratios | Risk probability |
| **PCA** | Feature reduction | Multiple metrics | Principal components |

### 4.2 ML Data Pipeline

```
Raw Financial Data
    ↓
┌─────────────────────────────────────┐
│ Data Preprocessor                   │
│ - Outlier detection (Z-score, IQR) │
│ - Cross-metric validation           │
│ - Industry-specific checks          │
│ - Missing value imputation          │
└─────────────────────────────────────┘
    ↓
Clean Data
    ↓
┌─────────────────────────────────────┐
│ ML Algorithms (Parallel)             │
│ - All 10 algorithms run simultaneously│
└─────────────────────────────────────┘
    ↓
ML Insights
    ↓
Output: projections, classifications,
        clusters, sentiment, risk scores
```

---

## 5. System Components & Connections

### 5.1 Core Components

```
┌─────────────────────────────────────────────────────────────────────┐
│                        EBITA INTELLIGENCE PLATFORM                   │
└─────────────────────────────────────────────────────────────────────┘

                           ┌─────────────────┐
                           │   Frontend UI   │
                           │  (Next.js App)  │
                           └────────┬────────┘
                                    │
                                    ▼
┌─────────────────────────────────────────────────────────────────────┐
│                        API ROUTE LAYER                               │
│  ┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐    │
│  │ /api/analyze    │  │ /api/intelligence│  │  /api/nat      │    │
│  │ (PUT)           │  │ (GET)           │  │  (POST)        │    │
│  └────────┬────────┘  └────────┬────────┘  └────────┬────────┘    │
└───────────┼─────────────────────┼─────────────────────┼────────────┘
            │                     │                     │
            ▼                     ▼                     ▼
┌─────────────────────────────────────────────────────────────────────┐
│                    ORCHESTRATOR V2 (lib/orchestrator-v2.ts)         │
│                                                                          │
│  ┌──────────────────────────────────────────────────────────────────┐ │
│  │                     MAIN ORCHESTRATION FLOW                        │ │
│  │                                                                       │ │
│  │  1. Input Normalization                                             │ │
│  │  2. Ticker Discovery                                              │ │
│  │  3. Parallel Data Fetch (FMP, Alpha, Yahoo, NSE, N.A.T.)         │ │
│  │  4. Data Validation & Normalization                               │ │
│  │  5. Weighted Merge                                                 │ │
│  │  6. ML Analysis (10 algorithms)                                   │ │
│  │  7. N.A.T. Intelligence (6 query types)                          │ │
│  │  8. Currency Conversion                                           │ │
│  │  9. Global Comparison                                            │ │
│  │  10. Response Assembly                                           │ │
│  └──────────────────────────────────────────────────────────────────┘ │
└───────────┬─────────────────────┬─────────────────────┬─────────────┘
            │                     │                     │
            ▼                     ▼                     ▼
┌───────────────────┐  ┌───────────────────┐  ┌───────────────────┐
│   DATA SOURCES    │  │   ML MODULES       │  │   N.A.T. SERVER   │
│                   │  │                   │  │                   │
│ • FMP (v4)        │  │ • data-preprocessor│ │ • localhost:8000 │
│ • Alpha Vantage   │  │ • ml-utils        │  │ • Groq (LLM)     │
│ • Yahoo Finance   │  │ • advanced-ml      │  │ • Tavily (Search) │
│ • NSE India       │  │ • comparison      │  │ • Vector Store    │
│ • Currency API    │  │                   │  │                   │
└───────────────────┘  └───────────────────┘  └───────────────────┘
            │                     │                     │
            ▼                     ▼                     ▼
┌───────────────────┐  ┌───────────────────┐  ┌───────────────────┐
│   RESOLUTION      │  │   COMPARISON      │  │   UTILITIES       │
│                   │  │                   │  │                   │
│ • smart-normalizer│  │ • global-comp.    │  │ • currency-conv.  │
│ • multi-sector    │  │ • industry-profiles│  │ • smart-query     │
│ • smart-query    │  │                   │  │ • cheerio-scraper │
└───────────────────┘  └───────────────────┘  └───────────────────┘
```

### 5.2 Module Connections

```
orchestrator-v2.ts (Main Controller)
    │
    ├──→ discoverTicker()         → Ticker resolution
    │   └──→ smart-normalizer.ts → Input normalization
    │   └──→ multi-sector.ts     → Conglomerate handling
    │
    ├──→ fetchFromFMP()          → FMP API v4
    ├──→ fetchFromAlpha()        → Alpha Vantage
    ├──→ fetchYahooFinancials()  → Yahoo Finance
    ├──→ fetchFromNSEIndia()    → NSE India (stock-nse-india)
    ├──→ getNATIntelligence()    → N.A.T. Server
    │
    ├──→ validateFinancialData() → Data validation
    ├──→ normalizeFinancialData()→ Value normalization
    ├──→ mergeCandidates()        → Weighted merge
    │
    ├──→ runMLAnalysis()         → ML Pipeline
    │   └──→ ml-utils.ts        → Basic ML (KNN, LR, DT)
    │   └──→ advanced-ml.ts     → Advanced ML (K-Means, NN, PCA)
    │   └──→ data-preprocessor.ts→ Data cleaning
    │
    ├──→ CurrencyConverter       → Currency conversion
    │   └──→ currency-converter.ts
    │
    └──→ comparisonEngine       → Global comparison
        └──→ global-comparison.ts
```

---

## 6. Data Flow Architecture

### 6.1 Complete Data Flow

```
┌─────────────────────────────────────────────────────────────────────────┐
│                         REQUEST PROCESSING                               │
└─────────────────────────────────────────────────────────────────────────┘

USER INPUT
{
  "company": "Apple",
  "region": "global"
}
    │
    ▼
┌─────────────────────────────────────────────────────────────────────────┐
│ STEP 1: Input Processing                                               │
├─────────────────────────────────────────────────────────────────────────┤
│ • smart-normalizer.ts: Normalize company name                         │
│ • multi-sector-resolver.ts: Handle conglomerates                       │
│ • smart-query-builder.ts: Build hierarchical queries                  │
└─────────────────────────────────────────────────────────────────────────┘
    │
    ▼
┌─────────────────────────────────────────────────────────────────────────┐
│ STEP 2: Parallel Data Fetching                                         │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                         │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐   │
│  │  FMP API    │  │   Alpha     │  │   Yahoo    │  │  NSE India │   │
│  │  (v4)       │  │  Vantage    │  │  Finance   │  │   Package  │   │
│  └──────┬──────┘  └──────┬──────┘  └──────┬──────┘  └──────┬──────┘   │
│         │                │                │                │            │
│         ▼                ▼                ▼                ▼            │
│  ┌─────────────────────────────────────────────────────────────────┐   │
│  │              getNATIntelligence() - N.A.T. Server               │   │
│  │  • initial_search: Structured financial data                    │   │
│  │  • general: Company overview                                    │   │
│  │  • realtime: Latest financials                                  │   │
│  │  • competitors: Competitive analysis                            │   │
│  │  • investors: Investor information                              │   │
│  │  • marketing: Marketing strategy                                │   │
│  │  • revenue_breakdown: Revenue analysis                          │   │
│  └─────────────────────────────────────────────────────────────────┘   │
│                                                                         │
└─────────────────────────────────────────────────────────────────────────┘
    │
    ▼
┌─────────────────────────────────────────────────────────────────────────┐
│ STEP 3: Data Validation & Normalization                                │
├─────────────────────────────────────────────────────────────────────────┤
│ • validateFinancialData(): Check P/E ratios, margins, sanity          │
│ • normalizeFinancialData(): Convert growth rates, scale values          │
│ • Quality scoring: Assign confidence based on validation               │
└─────────────────────────────────────────────────────────────────────────┘
    │
    ▼
┌─────────────────────────────────────────────────────────────────────────┐
│ STEP 4: Weighted Merge                                                 │
├─────────────────────────────────────────────────────────────────────────┤
│ Source Weights:                                                        │
│   FMP/Alpha/NSE = 120 (Highest)                                      │
│   Yahoo/N.A.T. = 80                                                  │
│   SERP/Crawler = 40                                                   │
│                                                                         │
│ Output: Merged perMetric with confidence scores                       │
└─────────────────────────────────────────────────────────────────────────┘
    │
    ▼
┌─────────────────────────────────────────────────────────────────────────┐
│ STEP 5: ML Analysis (10 Algorithms Parallel)                          │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                         │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐                  │
│  │     KNN      │  │LinearRegress │  │DecisionTree  │                  │
│  │  Similarity  │  │ Projections  │  │Classification│                  │
│  └──────────────┘  └──────────────┘  └──────────────┘                  │
│                                                                         │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐                  │
│  │   K-Means   │  │ Hierarchical │  │  Mean Shift  │                  │
│  │Segmentation │  │ Anomalies    │  │  Clustering  │                  │
│  └──────────────┘  └──────────────┘  └──────────────┘                  │
│                                                                         │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐                  │
│  │   DBSCAN     │  │ Naive Bayes  │  │Neural Network │                  │
│  │  Outliers   │  │  Sentiment   │  │ Credit Risk  │                  │
│  └──────────────┘  └──────────────┘  └──────────────┘                  │
│                                                                         │
│  ┌──────────────┐                                                      │
│  │     PCA      │                                                      │
│  │FeatureReduce │                                                      │
│  └──────────────┘                                                      │
│                                                                         │
└─────────────────────────────────────────────────────────────────────────┘
    │
    ▼
┌─────────────────────────────────────────────────────────────────────────┐
│ STEP 6: Currency & Global Comparison                                  │
├─────────────────────────────────────────────────────────────────────────┤
│ • CurrencyConverter: Convert to base currency (30 supported)           │
│ • GlobalComparison: Compare against industry benchmarks                │
└─────────────────────────────────────────────────────────────────────────┘
    │
    ▼
┌─────────────────────────────────────────────────────────────────────────┐
│ STEP 7: Response Assembly                                              │
└─────────────────────────────────────────────────────────────────────────┘
    │
    ▼
FINAL RESPONSE
{
  "success": true,
  "version": "v2",
  "company": "Apple",
  "ticker": "AAPL",
  "merged": { perMetric, provenance },
  "analysis": { text, sources, realtimeInsight, competitorsInsight, investorsInsight, marketingInsight, revenueBreakdown },
  "mlInsights": { revenueProjections, industryClassification, companySegmentation, anomalyDetection, pcaResults, creditRisk, extractedFeatures, sentimentAnalysis, natIntelligence },
  "currencyInfo": { companyCurrency, baseCurrency, exchangeRates },
  "globalComparison": { ... },
  "metadata": { processingTimeMs, timestamp }
}
```

---

## 7. Query Processing

### 7.1 Round-Robin Query Builder

The system uses hierarchical fallback for queries:

```
Query: "Apple iPhone market share"
    │
    ├─→ Level 1: Direct API (FMP/Alpha)
    │       "/quote/AAPL"
    │       "OVERVIEW/AAPL"
    │
    ├─→ Level 2: N.A.T. Natural Language
    │       "Search Apple iPhone market share..."
    │
    ├─→ Level 3: SERP Fallback
    │       Google CSE / Scraping
    │
    └─→ Level 4: N.A.T. Comprehensive
        Full business intelligence report
```

### 7.2 Smart Query Builder

```typescript
// From: lib/queries/smart-query-builder.ts
const queries = [
  // Primary queries
  `${company} financial data`,
  `${company} ${ticker} stock`,
  
  // Fallback queries  
  `${company} revenue earnings`,
  `${company} market cap`,
  
  // NSE-specific (for India)
  `${company} NSE`,
  `${company} BSE stock`,
  
  // Industry queries
  `${sector} industry analysis`,
  `${industry} companies`
];
```

---

## 8. Error Handling & Fallback

### 8.1 Fallback Strategy

```
Primary APIs (FMP, Alpha) → FAIL
    ↓
Secondary APIs (Yahoo, NSE) → FAIL
    ↓
N.A.T. Web Search → SUCCESS (with context)
    ↓
Extract structured data via regex
    ↓
Provide full business intelligence
```

### 8.2 Validation Rules

| Check | Rule | Action |
|-------|------|--------|
| P/E Ratio | 0 < P/E < 1000 | Flag warning |
| EBITDA | EBITDA ≤ Revenue | Flag error |
| Growth | -1 < Growth < 1 | Auto-normalize |
| Market Cap | > 0 | Required |
| Currency | Valid code | Convert |

### 8.3 Confidence Scoring

```
Data Confidence = Base Score + Validation Bonus - Error Penalty

Sources:
  FMP/Alpha/NSE     → Base: 60-70%
  Yahoo/N.A.T.     → Base: 50%
  SERP/Scraping     → Base: 30-40%
  
Validation:
  All checks pass    → +20%
  Warnings only      → +10%
  Errors found      → -30%
```

---

## 9. Output Response Format

### 9.1 Complete Response Structure

```json
{
  "success": true,
  "version": "v2",
  "company": "Apple",
  "ticker": "AAPL",
  "region": "global",
  
  // Financial Data
  "merged": {
    "perMetric": {
      "marketCap": { "value": 3888777002850, "confidence": 60, "sources": ["FMP","Alpha"] },
      "peRatio": { "value": 33.45, "confidence": 50, "sources": ["Alpha"] },
      "revenue": { "value": 435617006000, "confidence": 50, "sources": ["Alpha"] },
      "ebitda": { "value": 152901992000, "confidence": 50, "sources": ["Alpha"] },
      "ebitdaMargin": { "value": 35.1, "confidence": 60, "sources": [] },
      "roe": { "value": 0.31, "confidence": 50, "sources": ["FMP"] }
    },
    "provenance": ["https://..."]
  },
  
  // AI Analysis
  "analysis": {
    "text": "**Apple Business Intelligence Report**...",
    "sources": [{ "title": "...", "url": "..." }],
    "realtimeInsight": "Q1 2026: Revenue $143.8B (+16% YoY)...",
    "competitorsInsight": "Direct competitors: Samsung, Google, Microsoft...",
    "investorsInsight": "Major holders: Vanguard, BlackRock...",
    "marketingInsight": "Brand positioning: Premium tech innovator...",
    "revenueBreakdown": "iPhone: 52%, Services: 24%, Mac: 11%..."
  },
  
  // ML Insights
  "mlInsights": {
    "revenueProjections": [{ "year": 2027, "revenue": 435617006000 }],
    "industryClassification": { "industry": "Technology", "confidence": 0.75 },
    "companySegmentation": [{ "company": "Apple", "segment": 0, "metrics": {...} }],
    "anomalyDetection": { "clusters": [[-1,1]], "outlierCount": 1 },
    "pcaResults": { "explainedVariance": [1, 0], "components": [...] },
    "creditRisk": { "risk": "MEDIUM", "probability": 0.5 },
    "extractedFeatures": { "profitMargin": 0.1, "ebitdaMargin": 0.35, "roe": 0.016 },
    "sentimentAnalysis": [{ "text": "Strong earnings", "sentiment": "positive", "confidence": 0.8 }],
    "natIntelligence": { ... }
  },
  
  // Currency
  "currencyInfo": {
    "companyCurrency": "USD",
    "baseCurrency": "USD",
    "exchangeRates": { "USD": 1, "INR": 90.96, "EUR": 0.849, ... },
    "supportedCurrencies": ["USD", "INR", "EUR", ...]
  },
  
  // Global Comparison
  "globalComparison": {
    "industry": "Technology",
    "globalRank": 1,
    "industryPercentile": 99,
    "vsGlobalMedian": { "marketCap": "+2500%", "revenue": "+1800%" }
  },
  
  // Metadata
  "metadata": {
    "processingTimeMs": 45000,
    "timestamp": "2026-02-21T12:00:00.000Z"
  }
}
```

---

## 10. API Endpoints

### 10.1 Main Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| **PUT** | `/api/analyze` | Main analysis endpoint |
| **GET** | `/api/intelligence` | Intelligence query |
| **POST** | `/api/nat/chat` | N.A.T. chat |
| **GET** | `/api/companies` | Company listing |
| **GET** | `/api/health` | Health check |

### 10.2 Request Format

```json
// PUT /api/analyze
{
  "company": "Apple",
  "region": "global",  // global | INDIA | USA | UK | EU
  "currency": "USD",    // Optional: INR, USD, EUR, etc.
  "includeML": true,   // Optional: Include ML insights
  "includeNAT": true    // Optional: Include N.A.T. insights
}
```

---

## 11. Configuration

### 11.1 Environment Variables

```env
# API Keys
FMP_API_KEY=a96AodGuGG1AjYnOQdOQ9sHh3kxUHOkI
ALPHA_VANTAGE_API_KEY=O0AUTSH6E6E15OQ5YX
GOOGLE_CSE_KEY=...
GOOGLE_CSE_ID=...

# N.A.T. Server
NAT_URL=http://localhost:8000
GROQ_API_KEY=...

# Currency API (optional)
EXCHANGE_RATE_API_KEY=...

# Database (optional)
SUPABASE_URL=...
SUPABASE_KEY=...
```

### 11.2 Source Weights Configuration

```typescript
const SOURCE_WEIGHTS = {
  HIGH: 120,      // FMP, Alpha, NSE
  MEDIUM: 80,     // Yahoo, N.A.T.
  LOW: 40,        // SERP, Crawler
  DEFAULT: 30     // Unknown
};
```

---

## Appendix A: File Structure

```
D:\ProjectEBITA\business-intelligence\
├── lib\
│   ├── orchestrator-v2.ts          # Main orchestrator (1850+ lines)
│   ├── ml\
│   │   ├── ml-utils.ts            # KNN, LR, DT
│   │   ├── advanced-ml.ts         # K-Means, NN, PCA, etc.
│   │   └── data-preprocessor.ts   # Data validation
│   ├── queries\
│   │   └── smart-query-builder.ts # Query hierarchy
│   ├── resolution\
│   │   ├── smart-normalizer.ts   # Input normalization
│   │   └── multi-sector-resolver.ts
│   ├── currency\
│   │   └── currency-converter.ts  # 30 currencies
│   └── comparison\
│       └── global-comparison.ts    # Industry benchmarks
├── NAT\
│   ├── run.py                     # N.A.T. server
│   └── ...
├── app\api\analyze\route.ts       # API route
└── .env.local                     # Config
```

---

## Appendix B: Algorithm Versions

| Algorithm | Version | Status |
|-----------|---------|--------|
| KNN | 1.0 | ✅ |
| Linear Regression | 1.0 | ✅ |
| Decision Tree | 1.0 | ✅ |
| K-Means | 2.0 | ✅ |
| Hierarchical | 2.0 | ✅ |
| Mean Shift | 2.0 | ✅ |
| DBSCAN | 2.0 | ✅ |
| Naive Bayes | 2.0 | ✅ |
| Neural Network | 2.0 | ✅ |
| PCA | 2.0 | ✅ |
| N.A.T. | 1.0 | ✅ |

---

**Document Version**: 9.2  
**Last Updated**: February 21, 2026  
**Status**: Production Ready
