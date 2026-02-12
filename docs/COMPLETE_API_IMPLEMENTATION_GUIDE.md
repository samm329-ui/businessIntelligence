# EBITA Intelligence - Complete API Implementation Guide

## Overview

This guide provides complete instructions for implementing all data sources in the EBITA Intelligence platform. All APIs listed are **FREE** or have generous free tiers.

---

## Quick API Reference Table

| API | Purpose | Key Required | Free Tier | Setup URL |
|-----|---------|--------------|-----------|-----------|
| **Supabase** | Database | Yes | 500MB | https://supabase.com |
| **Groq AI** | AI Analysis | Yes | 30 req/min | https://console.groq.com |
| **Alpha Vantage** | Stock Data | Yes | 500/day | https://www.alphavantage.co |
| **FMP** | Financial Data | Yes | 250/day | https://financialmodelingprep.com |
| **Yahoo Finance** | Market Data | **No** | 2000/hour | Built-in (npm) |
| **NSE India** | Indian Stocks | **No** | ~10/min | Built-in |
| **BSE India** | Indian Stocks | **No** | Unlimited | Built-in |
| **World Bank** | Macro Data | **No** | Unlimited | https://data.worldbank.org |
| **IMF** | Economic Data | **No** | Unlimited | https://data.imf.org |
| **SEC Edgar** | US Filings | **No** | 10/sec | https://www.sec.gov/edgar |

---

## 1. REQUIRED APIs (Must Set Up First)

### A. Supabase (Database & Auth)

**Purpose**: Primary database for storing company profiles, brand mappings, financial data, and error logs.

**Cost**: Free tier includes:
- 500MB database
- 2GB file storage
- 50,000 monthly active users
- Unlimited API requests

**Setup Steps**:

1. **Create Account**
   ```
   Visit: https://supabase.com
   Click "Start your project"
   Sign up with GitHub or email
   ```

2. **Create Project**
   ```
   Click "New Project"
   Name: "ebita-intelligence"
   Database Password: [generate strong password]
   Region: [select closest to your users]
   ```

3. **Get API Keys**
   ```
   Go to: Project Settings → API
   Copy these values:
   
   - Project URL → NEXT_PUBLIC_SUPABASE_URL
   - anon/public key → NEXT_PUBLIC_SUPABASE_ANON_KEY
   - service_role key → SUPABASE_SERVICE_ROLE_KEY
   ```

4. **Run Database Schema**
   ```sql
   Go to: SQL Editor → New Query
   Copy contents from: supabase/enhanced_schema.sql
   Click "Run"
   ```

5. **Enable Extensions**
   ```sql
   -- In SQL Editor, run:
   CREATE EXTENSION IF NOT EXISTS pg_trgm;  -- For fuzzy search
   CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
   ```

6. **Add to .env.local**
   ```bash
   NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
   NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGci...
   SUPABASE_SERVICE_ROLE_KEY=eyJhbGci...
   ```

**Implementation Location**: `lib/db.ts`

---

### B. Groq AI (Analysis Engine)

**Purpose**: Powers AI-driven industry analysis and insights with Llama 3.3 70B model.

**Cost**: Free tier includes ~30 requests/minute

**Setup Steps**:

1. **Create Account**
   ```
   Visit: https://console.groq.com
   Sign up with email or GitHub
   ```

2. **Get API Key**
   ```
   Go to: API Keys → Create API Key
   Name: "ebita-production"
   Copy the key
   ```

3. **Add to .env.local**
   ```bash
   GROQ_API_KEY=gsk_your_key_here
   ```

4. **Test Implementation**
   ```typescript
   // Test in any component
   const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
     method: 'POST',
     headers: {
       'Authorization': `Bearer ${process.env.GROQ_API_KEY}`,
       'Content-Type': 'application/json'
     },
     body: JSON.stringify({
       model: 'llama-3.3-70b-versatile',
       messages: [{ role: 'user', content: 'Hello' }]
     })
   })
   ```

**Implementation Location**: `lib/ai/ai.ts` and `lib/ai/ai-guardrails.ts`

---

## 2. RECOMMENDED APIs (Enhanced Data Quality)

### C. Alpha Vantage (Global Stock Data)

**Purpose**: Company fundamentals, income statements, balance sheets for global companies.

**Cost**: Free tier - 500 API calls/day (5 per minute)

**Setup Steps**:

1. **Get API Key**
   ```
   Visit: https://www.alphavantage.co/support/#api-key
   Fill in:
   - Name: EBITA Intelligence
   - Email: your-email@example.com
   - Purpose: Financial Analysis Platform
   
   Key is emailed instantly
   ```

2. **Add to .env.local**
   ```bash
   ALPHA_VANTAGE_API_KEY=your_key_here
   ```

3. **Implementation**
   Already implemented in: `lib/fetchers/alpha-vantage-fetcher.ts`

4. **Available Endpoints**:
   - `OVERVIEW` - Company profile (P/E, P/B, market cap)
   - `INCOME_STATEMENT` - Revenue, net income
   - `BALANCE_SHEET` - Assets, liabilities
   - `GLOBAL_QUOTE` - Real-time price

5. **Rate Limiting**:
   ```typescript
   // Built-in rate limiting in AlphaVantageFetcher
   // 5 calls per minute = 1 call per 12 seconds
   ```

---

### D. Financial Modeling Prep (Comprehensive Financials)

**Purpose**: Deep financial data, key metrics, institutional holders.

**Cost**: Free tier - 250 API calls/day

**Setup Steps**:

1. **Create Account**
   ```
   Visit: https://site.financialmodelingprep.com/developer/docs/
   Click "Get API Key"
   Create account with email
   ```

2. **Get API Key**
   ```
   Login → Dashboard → API Key
   Copy the key
   ```

3. **Add to .env.local**
   ```bash
   FMP_API_KEY=your_key_here
   ```

4. **Implementation**
   Already implemented in: `lib/fetchers/fmp-fetcher.ts`

5. **Available Endpoints**:
   - `/profile/{ticker}` - Company info
   - `/income-statement/{ticker}` - Financial statements
   - `/key-metrics/{ticker}` - Financial ratios
   - `/institutional-holder/{ticker}` - Shareholder data

---

## 3. FREE APIs (No Key Required)

### E. Yahoo Finance (via yahoo-finance2)

**Purpose**: Real-time stock quotes, historical data, financial statements.

**Cost**: FREE - No API key needed (via npm package)

**Rate Limit**: ~2000 requests/hour

**Implementation**: Already installed and configured

```typescript
// Usage example:
import { YahooFinanceFetcher } from '@/lib/fetchers/yahoo-finance-fetcher'

const fetcher = new YahooFinanceFetcher()
const quote = await fetcher.getQuote('RELIANCE.NS')
const financials = await fetcher.getFinancials('RELIANCE.NS')
```

**Location**: `lib/fetchers/yahoo-finance-fetcher.ts`

---

### F. NSE India (National Stock Exchange)

**Purpose**: Indian stock quotes, company info, shareholding patterns.

**Cost**: FREE - Public endpoints

**Rate Limit**: ~10 requests/minute (session-based)

**Important**: Requires cookie-based session management (handled automatically)

**Implementation**: 
```typescript
// Location: lib/fetchers/nse-fetcher.ts
import { NSEFetcher } from '@/lib/fetchers/nse-fetcher'

const nse = new NSEFetcher()
await nse.initSession() // Must call first
const data = await nse.getStockQuote('TCS')
```

**Available Methods**:
- `getStockQuote(symbol)` - Current price, volume
- `getIndustryCompanies(industry)` - All companies in sector
- `getShareholdingPattern(symbol)` - Promoter/FII/DII holdings
- `getFinancialResults(symbol)` - Quarterly results
- `getCorporateActions(symbol)` - Dividends, splits

---

### G. BSE India (Bombay Stock Exchange)

**Purpose**: Alternative source for Indian stock data.

**Cost**: FREE - Public API

**Implementation**:
```typescript
// Location: lib/fetchers/bse-fetcher.ts
import { BSEFetcher } from '@/lib/fetchers/bse-fetcher'

const bse = new BSEFetcher()
const data = await bse.getStockQuote('500209') // TCS scrip code
```

---

### H. World Bank API

**Purpose**: GDP, inflation, industry-specific economic data.

**Cost**: FREE - Unlimited

**Base URL**: `https://api.worldbank.org/v2`

**Key Indicators**:
- `NY.GDP.MKTP.CD` - GDP (current USD)
- `FP.CPI.TOTL.ZG` - Inflation
- `NV.IND.MANF.CD` - Manufacturing value added

**Implementation**:
```typescript
// Location: lib/fetchers/world-bank-fetcher.ts
const gdpData = await fetch(
  'https://api.worldbank.org/v2/country/IND/indicator/NY.GDP.MKTP.CD?format=json&per_page=10'
)
```

---

### I. IMF Data API

**Purpose**: Global growth projections, economic forecasts.

**Cost**: FREE - Unlimited

**Base URL**: `https://www.imf.org/external/datamapper/api/v1`

**Implementation**:
```typescript
// Location: lib/fetchers/imf-fetcher.ts
const growthData = await fetch(
  'https://www.imf.org/external/datamapper/api/v1/NGDP_RPCH/IND'
)
```

---

### J. SEC Edgar (US Company Filings)

**Purpose**: 13F institutional holdings, company facts, XBRL financials.

**Cost**: FREE - Requires User-Agent header

**Rate Limit**: 10 requests/second

**Important**: Must include contact email in User-Agent

**Implementation**:
```typescript
// Location: lib/fetchers/sec-edgar-fetcher.ts
const headers = {
  'User-Agent': 'YourCompany contact@yourcompany.com'
}

const data = await fetch(
  'https://data.sec.gov/submissions/CIK0000320193.json',
  { headers }
)
```

---

## 4. DATA FLOW ARCHITECTURE

```
┌─────────────────────────────────────────────────────────────────┐
│                    USER QUERY                                    │
└──────────────────────┬──────────────────────────────────────────┘
                       ↓
┌─────────────────────────────────────────────────────────────────┐
│  ENTITY RESOLUTION (lib/resolution/entity-resolver.ts)          │
│  - Classify query (brand/company/industry)                      │
│  - Fuzzy matching (Levenshtein distance)                        │
│  - Alias matching (Harpic → Reckitt)                            │
│  - Parent company mapping                                       │
└──────────────────────┬──────────────────────────────────────────┘
                       ↓
┌─────────────────────────────────────────────────────────────────┐
│  MULTI-SOURCE FETCH (lib/data/multi-source-orchestrator.ts)     │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐          │
│  │ Yahoo Fin.   │  │ Alpha Vant.  │  │ FMP          │          │
│  │ (Real-time)  │  │ (Fundamentals│  │ (Deep Data)  │          │
│  └──────────────┘  └──────────────┘  └──────────────┘          │
└──────────────────────┬──────────────────────────────────────────┘
                       ↓
┌─────────────────────────────────────────────────────────────────┐
│  CROSS-VALIDATION (Tolerance: 3-20% depending on metric)        │
│  - Compare values across sources                                │
│  - Flag anomalies (>threshold variance)                         │
│  - Calculate consensus (weighted median)                        │
└──────────────────────┬──────────────────────────────────────────┘
                       ↓
┌─────────────────────────────────────────────────────────────────┐
│  DATA LINEAGE LOGGING (supabase/data_lineage table)             │
│  - Track every data point origin                                │
│  - Store confidence scores                                      │
│  - Maintain audit trail                                         │
└──────────────────────┬──────────────────────────────────────────┘
                       ↓
┌─────────────────────────────────────────────────────────────────┐
│  AI ANALYSIS (lib/ai/ai-guardrails.ts)                          │
│  - Structured input only (prevents hallucination)               │
│  - Mandatory source citations                                   │
│  - Hallucination detection & logging                            │
└──────────────────────┬──────────────────────────────────────────┘
                       ↓
┌─────────────────────────────────────────────────────────────────┐
│  RESPONSE WITH FULL ATTRIBUTION                                  │
│  {                                                               │
│    "data": {...},                                                │
│    "confidence": 85,                                             │
│    "sources": ["Yahoo Finance", "Alpha Vantage"],               │
│    "warnings": [],                                               │
│    "citations": [...]                                            │
│  }                                                               │
└─────────────────────────────────────────────────────────────────┘
```

---

## 5. ERROR HANDLING STRATEGY

### A. API Failure Fallback Chain

```typescript
// Primary → Secondary → Tertiary → Fallback
Yahoo Finance → Alpha Vantage → FMP → Industry Averages
```

### B. Cross-Source Validation Thresholds

| Metric Type | Tolerance | Action if Exceeded |
|-------------|-----------|-------------------|
| Stock Price | 3% | Flag warning, use median |
| Market Cap | 5% | Flag warning, use median |
| Revenue | 10% | Flag anomaly, investigate |
| Margins | 15% | Flag anomaly, investigate |
| Ratios | 20% | Flag anomaly, use conservative |

### C. Error Logging

All errors automatically logged to `error_logs` table:
- API failures
- Validation failures  
- Resolution errors
- AI hallucinations

View errors:
```sql
SELECT * FROM error_logs 
WHERE resolved = false 
AND severity IN ('error', 'critical')
ORDER BY created_at DESC;
```

---

## 6. IMPLEMENTATION CHECKLIST

### Phase 1: Foundation (Week 1)
- [ ] Set up Supabase project
- [ ] Run enhanced_schema.sql
- [ ] Configure .env.local with all keys
- [ ] Install dependencies: `npm install`

### Phase 2: Core Systems (Week 2)
- [ ] Test entity resolution: "Harpic" should resolve to Reckitt
- [ ] Test multi-source fetch: Compare Yahoo vs Alpha vs FMP
- [ ] Verify cross-validation: Check anomaly detection
- [ ] Test AI guardrails: Ensure no hallucinations

### Phase 3: Data Population (Week 3)
- [ ] Populate parent companies (top 100 India)
- [ ] Populate brands with aliases
- [ ] Add industry classifications
- [ ] Seed competitor relationships

### Phase 4: Testing (Week 4)
- [ ] Run full analysis on 10 test companies
- [ ] Verify source attribution in all responses
- [ ] Check confidence scores are reasonable
- [ ] Review error logs for patterns

---

## 7. TROUBLESHOOTING

### API Rate Limits Exceeded
```typescript
// Solution: Implement request queuing
const queue = new PQueue({ concurrency: 1, interval: 12000 })
await queue.add(() => fetchData())
```

### NSE Session Expired
```typescript
// Automatic re-authentication
async function fetchWithRetry(symbol: string) {
  try {
    return await nseFetcher.getStockQuote(symbol)
  } catch (e) {
    await nseFetcher.initSession() // Re-auth
    return await nseFetcher.getStockQuote(symbol)
  }
}
```

### Supabase Connection Issues
```bash
# Check connection
npm run test-db

# Verify env vars
echo $NEXT_PUBLIC_SUPABASE_URL
```

---

## 8. MONITORING DASHBOARD

Access monitoring views in Supabase SQL Editor:

```sql
-- Data Quality Dashboard
SELECT * FROM data_quality_dashboard;

-- Error Monitoring
SELECT * FROM error_monitoring;

-- AI Hallucination Report
SELECT * FROM ai_hallucination_report;

-- Company Profiles
SELECT * FROM company_full_profile LIMIT 10;
```

---

## 9. SUPPORT & RESOURCES

### API Documentation
- **Supabase**: https://supabase.com/docs
- **Groq**: https://console.groq.com/docs
- **Alpha Vantage**: https://www.alphavantage.co/documentation/
- **FMP**: https://site.financialmodelingprep.com/developer/docs/
- **Yahoo Finance**: https://github.com/gadicc/node-yahoo-finance2
- **World Bank**: https://datahelpdesk.worldbank.org/knowledgebase/articles/889392
- **SEC Edgar**: https://www.sec.gov/edgar/sec-api-documentation

### Getting Help
- Check error_logs table for detailed error messages
- Review entity_resolution_log for resolution issues
- Monitor cross_source_comparison for data discrepancies

---

**Last Updated**: 2024
**Version**: 1.0
**Platform**: EBITA Intelligence
