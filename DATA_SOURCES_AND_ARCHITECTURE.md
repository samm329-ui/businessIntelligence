# Business Intelligence Platform - Data Sources & Architecture Documentation

## Overview

This document describes all current data sources, their fetching mechanisms, and the complete system architecture with flow diagrams.

---

## 1. Data Sources

### 1.1 Indian Market Data Sources

| Source | Base URL | Data Type | Rate Limit | Cost | API Key Required |
|--------|----------|-----------|------------|------|------------------|
| **NSE India** | `https://www.nseindia.com/api` | Stock quotes, Historical data, Sector indices | 100/min | FREE | NO |
| **BSE India** | `https://api.bseindia.com` | Market data, Market cap | 100/min | FREE | NO |
| **RBI** | `https://rbi.org.in/Scripts/Statistics.aspx` | Macro indicators, Inflation data | Unlimited | FREE | NO |
| **MOSPI** | `https://www.mospi.gov.in` | GDP, Industrial production | Unlimited | FREE | NO |

#### NSE India Endpoints
- `/quote-equity?symbol={SYMBOL}` - Stock quotes
- `/market-data-pre-open?key=ALL` - Market pre-open data
- `/historical/cm/equity?symbol={SYMBOL}` - Historical data
- `/equity-stockIndices?index={SECTOR_CODE}` - Sector indices

#### BSE India Endpoints
- `/BseIndiaAPI/api/StockReachGraph/w?scripcode={CODE}` - Stock reach graph
- `/BseIndiaAPI/api/MktCapYearlyData/w?Pcode={CODE}` - Market cap data

**Files**: `lib/fetchers/nse.ts`, `lib/integrations/index.ts` (BSEAdapter)

---

### 1.2 Global Market Data Sources

| Source | Base URL | Data Type | Rate Limit | Cost | API Key Required |
|--------|----------|-----------|------------|------|------------------|
| **Yahoo Finance** | `https://query1.finance.yahoo.com` | Real-time quotes, Fundamentals | 2000/hr | FREE | NO |
| **Alpha Vantage** | `https://www.alphavantage.co` | Global quotes, Income statements | 5/min | FREE | YES |
| **Financial Modeling Prep** | `https://financialmodelingprep.com/api/v3` | Quotes, Company profiles | 250/day | FREE | YES |
| **World Bank** | `https://api.worldbank.org/v2` | GDP, Economic indicators | 100/sec | FREE | NO |
| **IMF** | `https://www.imf.org/external/datamapper/api/v1` | GDP, Economic indicators | Unlimited | FREE | NO |
| **SEC Edgar** | `https://www.sec.gov/cgi-bin/browse-edgar` | Company filings, CIK lookups | 10/sec | FREE | NO |
| **NewsAPI** | `https://newsapi.org/v2` | News articles | 100/day | FREE | YES |

#### Yahoo Finance Endpoints
- `/v8/finance/chart/{SYMBOL}` - Real-time chart data
- `/v10/finance/quoteSummary/{SYMBOL}` - Company fundamentals
- `/v1/finance/search` - Company search

#### Alpha Vantage Endpoints
- `/query?function=GLOBAL_QUOTE&symbol={SYMBOL}` - Global quote
- `/query?function=OVERVIEW&symbol={SYMBOL}` - Company overview
- `/query?function=INCOME_STATEMENT&symbol={SYMBOL}` - Income statements

#### Financial Modeling Prep Endpoints
- `/quote/{SYMBOL}?apikey={API_KEY}` - Stock quotes
- `/profile/{SYMBOL}?apikey={API_KEY}` - Company profile
- `/income-statement/{SYMBOL}?apikey={API_KEY}` - Income statements

#### World Bank Endpoints
- `/country/IND/indicator/NY.GDP.MKTP.CD` - India GDP
- `/country/{COUNTRY}/indicator/NV.IND.TOTL.ZS` - Industry data

**Files**: `lib/integrations/index.ts`, `lib/services/real-time-company-data.ts`, `lib/fetchers/government.ts`

---

### 1.3 Database (Supabase/PostgreSQL)

| Database | Type | Provider | Connection Library |
|----------|------|----------|-------------------|
| **Supabase** | PostgreSQL | Cloud | `@supabase/supabase-js` v2.95.3 |

#### Database Tables
1. `industries` - Industry master data
2. `data_sources` - External API tracking
3. `market_data` - Market size data points
4. `company_data` - Company financials
5. `company_benchmarks` - Case studies
6. `analysis_cache` - Cached analysis results
7. `api_usage` - API call tracking
8. `error_logs` - Error logging
9. `job_locks` - Async job management
10. `financial_glossary` - Financial terms

**Files**: `lib/db.ts`, `supabase/schema.sql`

---

## 2. Data Fetching Architecture

### 2.1 Fetching Flow

```
User Request
    │
    ▼
┌─────────────────────────┐
│   Frontend (Next.js)    │
│   - Landing Page        │
│   - SearchBar           │
│   - AnalysisDashboard   │
└───────────┬─────────────┘
            │ HTTP Request
            ▼
┌─────────────────────────┐
│    API Routes            │
│   - POST /api/analyze   │
│   - GET /api/health     │
│   - GET /api/debug      │
└───────────┬─────────────┘
            │
            ▼
┌─────────────────────────┐
│   Service Layer         │
│   - DataOrchestrator    │
│   - APIRotator          │
│   - CompetitorIntel    │
└───────────┬─────────────┘
            │
            ▼
┌─────────────────────────┐
│   Fetchers Layer       │
│   - Orchestrator       │
│   - Government Data    │
│   - NSE/BSE Data       │
└───────────┬─────────────┘
            │
            ▼
┌─────────────────────────┐
│   External APIs         │
│   - NSE India           │
│   - Yahoo Finance       │
│   - World Bank          │
│   - Alpha Vantage       │
│   - FMP                 │
│   - RBI/MOSPI           │
└─────────────────────────┘
```

### 2.2 Data Fetching Methods

#### Direct API Calls
```typescript
// lib/fetchers/nse.ts
fetchNSEData(symbol: string): Promise<StockData> {
  const response = await fetch(`https://www.nseindia.com/api/quote-equity?symbol=${symbol}`, {
    headers: { 'User-Agent': 'Mozilla/5.0...' }
  });
  return response.json();
}
```

#### Adapter Pattern
```typescript
// lib/integrations/index.ts
class YahooFinanceAdapter {
  async fetchQuote(symbol: string): Promise<QuoteData> {
    const response = await fetch(`https://query1.finance.yahoo.com/v8/finance/chart/${symbol}`);
    return this.parseResponse(response);
  }
}
```

#### API Rotator for Rate Limiting
```typescript
// lib/integrations/api-rotator.ts
class APIRotator {
  private providers: APIProvider[];
  private currentIndex: number;
  
  async fetchWithRotation(request: Request): Promise<Response> {
    const provider = this.getNextAvailableProvider();
    return provider.execute(request);
  }
}
```

#### Database Queries
```typescript
// lib/db.ts
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

// Example query
const { data, error } = await supabase
  .from('market_data')
  .select('*')
  .eq('industry', 'IT');
```

---

## 3. System Architecture Flow Diagram

### 3.1 Complete System Architecture

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                              FRONTEND (Next.js)                             │
│  ┌─────────────────┐  ┌─────────────────┐  ┌─────────────────────────────┐ │
│  │                 │  │                 │  │                             │ │
│  │   Landing Page  │  │   SearchBar     │  │   AnalysisDashboard        │ │
│  │   (app/page.tsx)│  │  (components/)  │  │   (components/dashboard/)   │ │
│  │                 │  │                 │  │                             │ │
│  └────────┬────────┘  └────────┬────────┘  └─────────────┬───────────────┘ │
│           │                   │                            │                 │
│           │                   │                            │                 │
│           │                   │                            │                 │
│           │                   │                            │                 │
│           │                   │                            │                 │
│           └───────────────────┼────────────────────────────┘                 │
│                               │                                              │
│                               ▼                                              │
│                    ┌─────────────────────┐                                  │
│                    │                     │                                  │
│                    │   API Routes        │                                  │
│                    │   /api/analyze     │                                  │
│                    │   /api/health       │                                  │
│                    │   /api/debug        │                                  │
│                    │                     │                                  │
│                    └──────────┬──────────┘                                  │
│                               │                                             │
│                               │                                             │
└───────────────────────────────┼─────────────────────────────────────────────┘
                                │
                                ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                           BACKEND SERVICE LAYER                              │
│                                                                              │
│  ┌─────────────────────────────────────────────────────────────────────┐    │
│  │                     DataOrchestrator                                 │    │
│  │  ┌─────────────┐ ┌─────────────┐ ┌─────────────┐ ┌─────────────────┐ │    │
│  │  │  NSEAdapter │ │  BSEAdapter │ │   Yahoo     │ │ AlphaVantage    │ │    │
│  │  │             │ │             │ │   Adapter   │ │ Adapter         │ │    │
│  │  └─────────────┘ └─────────────┘ └─────────────┘ └─────────────────┘ │    │
│  │                                                                       │    │
│  │  ┌─────────────┐ ┌─────────────┐ ┌─────────────┐ ┌─────────────────┐ │    │
│  │  │  FMPAdapter │ │  SECAdapter │ │ WorldBank   │ │  RBI/MOSPI      │ │    │
│  │  │             │ │             │ │  Adapter    │ │  Adapter        │ │    │
│  │  └─────────────┘ └─────────────┘ └─────────────┘ └─────────────────┘ │    │
│  └─────────────────────────────────────────────────────────────────────┘    │
│                                                                              │
│  ┌─────────────────────────┐  ┌───────────────────────────────────────────┐  │
│  │                         │  │                                           │  │
│  │    API Rotator          │  │        Competitor Intelligence           │  │
│  │    (Rate Limiting)      │  │        (20+ competitors per industry)     │  │
│  │                         │  │                                           │  │
│  └─────────────────────────┘  └───────────────────────────────────────────┘  │
│                                                                              │
│  ┌───────────────────────────────────────────────────────────────────────┐  │
│  │                                                                        │  │
│  │                    Real-Time Company Data Service                     │  │
│  │                    (Yahoo Finance Integration)                        │  │
│  │                                                                        │  │
│  └───────────────────────────────────────────────────────────────────────┘  │
│                                                                              │
└──────────────────────────────────────────┬───────────────────────────────────┘
                                           │
                                           ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                              FETCHERS LAYER                                  │
│                                                                              │
│  ┌─────────────────────┐  ┌─────────────────────┐  ┌──────────────────────┐ │
│  │                     │  │                     │  │                      │ │
│  │   Orchestrator      │  │   Government Data   │  │   NSE/BSE Fetcher   │ │
│  │   (fetchAllData)    │  │   (World Bank,      │  │   (Indian Stocks)   │ │
│  │                     │  │    IMF, RBI)        │  │                      │ │
│  │  - Market Size      │  │                     │  │  - 100+ Companies   │ │
│  │  - Stock Data       │  │  - GDP Data         │  │  - Sector Coverage  │ │
│  │  - Competitors      │  │  - Inflation        │  │  - IT, FMCG, Bank   │ │
│  │  - Fallback Logic   │  │  - Industrial Prod  │  │  - Pharma, Auto     │ │
│  │                     │  │                     │  │                      │ │
│  └─────────────────────┘  └─────────────────────┘  └──────────────────────┘ │
│                                                                              │
└──────────────────────────────────────────┬───────────────────────────────────┘
                                           │
                                           ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                          EXTERNAL DATA APIS                                  │
│                                                                              │
│  ┌─────────────────┐  ┌─────────────────┐  ┌─────────────────────────────┐ │
│  │                 │  │                 │  │                             │ │
│  │   NSE India     │  │   BSE India     │  │   Yahoo Finance            │ │
│  │   (India)       │  │   (India)       │  │   (Global)                 │ │
│  │                 │  │                 │  │                             │ │
│  └─────────────────┘  └─────────────────┘  └─────────────────────────────┘ │
│                                                                              │
│  ┌─────────────────┐  ┌─────────────────┐  ┌─────────────────────────────┐ │
│  │                 │  │                 │  │                             │ │
│  │  Alpha Vantage  │  │   World Bank    │  │   IMF                       │ │
│  │  (Fundamentals) │  │   (Macro Data)  │  │   (Economic Indicators)    │ │
│  │                 │  │                 │  │                             │ │
│  └─────────────────┘  └─────────────────┘  └─────────────────────────────┘ │
│                                                                              │
│  ┌─────────────────┐  ┌─────────────────┐  ┌─────────────────────────────┐ │
│  │                 │  │                 │  │                             │ │
│  │      RBI        │  │     MOSPI       │  │   SEC Edgar                │ │
│  │  (India Macro)  │  │  (India Stats)  │  │   (US Filings)             │ │
│  │                 │  │                 │  │                             │ │
│  └─────────────────┘  └─────────────────┘  └─────────────────────────────┘ │
│                                                                              │
└──────────────────────────────────────────┬───────────────────────────────────┘
                                           │
                                           ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                          CALCULATORS & ANALYZERS                             │
│                                                                              │
│  ┌───────────────────────────┐  ┌─────────────────────────────────────────┐ │
│  │                           │  │                                         │ │
│  │  Advanced Metrics Calc    │  │        Analysis Engine                  │ │
│  │  (30+ Financial KPIs)     │  │  - Rule-based Analysis                  │ │
│  │                           │  │  - AI Analysis (Groq)                  │ │
│  │  - Profitability          │  │  - Sector-specific Analysis             │ │
│  │  - Liquidity              │  │                                         │ │
│  │  - Leverage               │  └─────────────────────────────────────────┘  │
│  │  - Efficiency             │                                             │
│  │  - Valuation              │  ┌─────────────────────────────────────────┐  │
│  │  - Growth                 │  │                                         │  │
│  │                           │  │        AI Analysis Service             │  │
│  └───────────────────────────┘  │        (Groq AI Integration)           │  │
│                                 │                                         │  │
│  ┌───────────────────────────┐  │  - Natural Language Insights           │  │
│  │                           │  │  - Intelligent Recommendations         │  │
│  │  Industry KPI Calculator   │  │                                         │  │
│  │  (Sector Benchmarks)      │  └─────────────────────────────────────────┘  │
│  │                           │                                             │
│  └───────────────────────────┘                                             │
│                                                                              │
└──────────────────────────────────────────┬───────────────────────────────────┘
                                           │
                                           ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                        DATABASE (Supabase/PostgreSQL)                        │
│                                                                              │
│  ┌───────────────┐  ┌───────────────┐  ┌───────────────────────────────┐   │
│  │               │  │               │  │                               │   │
│  │   Industries │  │  Market Data  │  │      Analysis Cache           │   │
│  │               │  │               │  │                               │   │
│  └───────────────┘  └───────────────┘  └───────────────────────────────┘   │
│                                                                              │
│  ┌───────────────┐  ┌───────────────┐  ┌───────────────────────────────┐   │
│  │               │  │               │  │                               │   │
│  │  Company Data │  │  API Usage    │  │        Error Logs            │   │
│  │               │  │               │  │                               │   │
│  └───────────────┘  └───────────────┘  └───────────────────────────────┘   │
│                                                                              │
│  ┌───────────────┐  ┌───────────────┐  ┌───────────────────────────────┐   │
│  │               │  │               │  │                               │   │
│  │ Job Locks     │  │  Financial    │  │     Company Benchmarks       │   │
│  │               │  │  Glossary     │  │                               │   │
│  └───────────────┘  └───────────────┘  └───────────────────────────────┘   │
│                                                                              │
└─────────────────────────────────────────────────────────────────────────────┘
```

### 3.2 Request Flow Sequence

```
1. User enters industry name on Landing Page
   ↓
2. Frontend sends POST /api/analyze with {industry, region}
   ↓
3. API Route validates input
   ↓
4. DataOrchestrator receives request
   ↓
5. APIRotator selects available data provider
   ↓
6. Fetchers collect data from multiple sources:
   - NSE/BSE (Indian stocks)
   - Yahoo Finance (Global stocks)
   - World Bank/IMF (Macroeconomic data)
   - Alpha Vantage/FMP (Fundamentals)
   ↓
7. Real-Time Company Data Service fetches latest quotes
   ↓
8. Advanced Metrics Calculator computes 30+ KPIs
   ↓
9. Analysis Engine runs:
   - Rule-based statistical analysis
   - AI-powered insights (Groq)
   ↓
10. Results cached in Supabase (analysis_cache table)
    ↓
11. Comprehensive response sent to frontend
    ↓
12. Frontend displays:
    - Market size estimates
    - Competitor heatmaps
    - Risk analysis
    - Investment verdict
    - Strategic recommendations
```

---

## 4. Environment Variables

```bash
# Supabase Database
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key

# AI
GROQ_API_KEY=your-groq-api-key

# Financial Data APIs
ALPHA_VANTAGE_API_KEY=your-alpha-vantage-key
FMP_API_KEY=your-fmp-api-key
NEWS_API_KEY=your-news-api-key

# Environment
NODE_ENV=development
```

---

## 5. File Structure Reference

| Layer | Location | Purpose |
|-------|----------|---------|
| **Frontend** | `app/page.tsx` | Landing page |
| **Frontend** | `app/analyze/[industry]/page.tsx` | Analysis page |
| **Frontend** | `components/` | UI components |
| **API Routes** | `app/api/analyze/route.ts` | Main analysis endpoint |
| **API Routes** | `app/api/health/route.ts` | Health check |
| **Services** | `lib/integrations/index.ts` | Data adapters |
| **Services** | `lib/services/` | Business logic |
| **Fetchers** | `lib/fetchers/` | Data fetching |
| **Calculators** | `lib/calculators/` | KPI calculations |
| **Analyzers** | `lib/analyzers/` | Analysis engines |
| **Database** | `lib/db.ts` | DB connection |
| **Database** | `supabase/schema.sql` | DB schema |
| **Config** | `.env.local` | Environment variables |

---

## 6. Data Source Details

### 6.1 Indian Data Sources

**NSE India** (`lib/fetchers/nse.ts`)
- Coverage: 100+ Indian companies
- Sectors: IT, FMCG, Banking, Pharma, Automobile
- Data: Stock quotes, historical data, sector indices
- Rate Limit: 100 requests/minute

**BSE India** (`lib/integrations/index.ts`)
- Coverage: All BSE-listed companies
- Data: Market cap, stock reach
- Rate Limit: 100 requests/minute

**RBI & MOSPI** (`lib/fetchers/government.ts`)
- Data: Inflation rates, GDP, industrial production
- Reliability: 96-98%
- Cost: Free

### 6.2 Global Data Sources

**Yahoo Finance** (`lib/services/real-time-company-data.ts`)
- Global coverage
- Real-time and historical data
- No API key required
- Rate Limit: 2000 requests/hour

**Alpha Vantage** (`lib/integrations/index.ts`)
- Global fundamentals
- Income statements
- API key required
- Rate Limit: 5 requests/minute (free tier)

**Financial Modeling Prep** (`lib/integrations/index.ts`)
- Company profiles
- Financial statements
- API key required
- Rate Limit: 250 requests/day

**World Bank & IMF** (`lib/fetchers/government.ts`)
- Macroeconomic data
- GDP indicators
- Rate Limit: 100 requests/second (World Bank)

---

## 7. Rate Limiting & Fallback Strategy

### 7.1 API Rotator

```typescript
class APIRotator {
  private providers: APIProvider[];
  
  async fetchWithFallback(request: Request): Promise<Response> {
    for (const provider of this.providers) {
      if (provider.isAvailable()) {
        try {
          return await provider.execute(request);
        } catch (error) {
          this.markProviderAsFailing(provider);
          continue;
        }
      }
    }
    throw new Error('All providers failed');
  }
}
```

### 7.2 Fallback Order

1. **Primary**: Yahoo Finance (high rate limit, no key)
2. **Secondary**: NSE India (Indian stocks)
3. **Tertiary**: Alpha Vantage (fundamentals)
4. **Quaternary**: FMP (detailed financials)
5. **Cache**: Supabase analysis_cache table

---

## 8. Caching Strategy

### 8.1 In-Memory Cache

```typescript
// lib/utils/cache.ts
class Cache {
  private store: Map<string, CacheEntry>;
  
  get<T>(key: string): T | null {
    const entry = this.store.get(key);
    if (entry && entry.expiry > Date.now()) {
      return entry.value;
    }
    return null;
  }
  
  set<T>(key: string, value: T, ttl: number = 300000): void {
    this.store.set(key, {
      value,
      expiry: Date.now() + ttl
    });
  }
}
```

### 8.2 Database Cache

- **Table**: `analysis_cache`
- **TTL**: 5 minutes (configurable)
- **Purpose**: Cache expensive analysis results

---

## 9. Error Handling

### 9.1 Error Logging

```typescript
// lib/utils/errorLogger.ts
class ErrorLogger {
  async log(error: Error, context: RequestContext): Promise<void> {
    await supabase.from('error_logs').insert({
      error_message: error.message,
      stack_trace: error.stack,
      context,
      timestamp: new Date()
    });
  }
}
```

### 9.2 API Health Checks

```typescript
// app/api/health/route.ts
GET /api/health {
  database: supabase.connectionCheck(),
  ai: groq.apiKeyValid(),
  timestamp: new Date()
}
```

---

## 10. Industry Coverage

### 10.1 Supported Industries

1. Technology (IT Services, Software)
2. FMCG (Consumer Goods)
3. Banking & Finance
4. Pharmaceuticals
5. Automobile
6. Real Estate
7. Energy & Utilities
8. Healthcare
9. Telecommunications
10. Media & Entertainment
11. Retail
12. Manufacturing
13. Agriculture
14. Infrastructure
15. Textiles

### 10.2 Regional Support

- **India**: NSE, BSE, RBI, MOSPI
- **Global**: Yahoo Finance, World Bank, IMF, SEC
- **Hybrid**: Cross-border analysis supported

---

## 11. Analysis Outputs

### 11.1 Market Analysis
- Market size estimates
- Growth projections
- Market share analysis
- Industry trends

### 11.2 Financial Analysis
- 30+ KPIs (profitability, liquidity, leverage, efficiency)
- Company benchmarking
- Peer comparison
- Historical trends

### 11.3 Competitor Intelligence
- 20+ competitors per industry
- Market position scoring
- Competitor heatmaps
- SWOT analysis

### 11.4 Strategic Recommendations
- Capital requirements
- Marketing strategies
- Risk assessment
- Investment verdict

---

*Last Updated: February 2025*
*Document Version: 1.0*
