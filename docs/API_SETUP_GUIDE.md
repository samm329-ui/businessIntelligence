# EBITA Intelligence - API Setup & Integration Guide

## Overview

This platform aggregates data from **10+ sources** to provide accurate business intelligence. Below is the complete guide for setting up every API and data source.

---

## 1. REQUIRED APIs

### A. Supabase (Database)
- **URL**: https://supabase.com
- **Cost**: Free tier (500MB database, 50k monthly active users)
- **Setup**:
  1. Create account at https://supabase.com
  2. Create a new project
  3. Go to Settings → API
  4. Copy `Project URL` → `NEXT_PUBLIC_SUPABASE_URL`
  5. Copy `anon/public key` → `NEXT_PUBLIC_SUPABASE_ANON_KEY`
  6. Copy `service_role key` → `SUPABASE_SERVICE_ROLE_KEY`
  7. Go to SQL Editor and run the schema from `supabase/schema.sql`

### B. Groq AI (Analysis Engine)
- **URL**: https://console.groq.com
- **Cost**: Free (generous limits)
- **Setup**:
  1. Create account at https://console.groq.com
  2. Go to API Keys → Create API Key
  3. Copy key → `GROQ_API_KEY`
- **Model Used**: `llama-3.3-70b-versatile`
- **Rate Limit**: ~30 requests/minute on free tier

---

## 2. RECOMMENDED APIs (Enhanced Data Quality)

### C. Alpha Vantage (Stock Data)
- **URL**: https://www.alphavantage.co/support/#api-key
- **Cost**: Free (500 API calls/day)
- **Setup**:
  1. Visit the URL above
  2. Fill in name and email
  3. Get instant API key
  4. Set `ALPHA_VANTAGE_API_KEY` in `.env.local`
- **Endpoints Used**:
  - `OVERVIEW` - Company fundamentals (P/E, EPS, market cap, sector)
  - `INCOME_STATEMENT` - Revenue, net income, EBITDA
  - `BALANCE_SHEET` - Assets, liabilities, equity
  - `GLOBAL_QUOTE` - Real-time stock price

### D. Financial Modeling Prep (Global Financials)
- **URL**: https://site.financialmodelingprep.com/developer/docs/
- **Cost**: Free (250 API calls/day)
- **Setup**:
  1. Create account at the URL above
  2. Go to Dashboard → API Key
  3. Set `FMP_API_KEY` in `.env.local`
- **Endpoints Used**:
  - `/profile/{ticker}` - Company profile
  - `/income-statement/{ticker}` - Income statements
  - `/key-metrics/{ticker}` - Key financial ratios
  - `/institutional-holder/{ticker}` - Top institutional holders
  - `/stock-screener` - Industry-wide stock screening

---

## 3. FREE APIs (No Key Required)

### E. Yahoo Finance (via `yahoo-finance2` npm package)
- **Cost**: Free, no API key needed
- **Rate Limit**: ~2000 calls/hour
- **Already installed**: `yahoo-finance2` in package.json
- **Data Provided**:
  - Real-time stock quotes (price, volume, market cap)
  - Financial statements (income, balance sheet, cash flow)
  - Institutional holders and fund ownership
  - Historical price data
  - Industry search and screening
- **How it works**: The `YahooFinanceFetcher` class in `lib/fetchers/yahoo-finance-fetcher.ts` wraps this library

### F. NSE India (Indian Stock Exchange)
- **URL**: https://www.nseindia.com
- **Cost**: Free, no API key
- **Rate Limit**: ~10 calls/minute (session-based)
- **Important**: NSE requires browser-like headers and cookies. The `NSEFetcher` class handles this automatically.
- **Endpoints Used**:
  - `/api/quote-equity?symbol=TCS` - Stock quotes
  - `/api/equity-stockIndices?index=NIFTY_IT` - Sector companies
  - `/api/corporates-shareholding-pattern?symbol=TCS` - Shareholding data
  - `/api/corporates-financial-results?symbol=TCS` - Quarterly results

### G. BSE India (Bombay Stock Exchange)
- **URL**: https://api.bseindia.com
- **Cost**: Free, no API key
- **Rate Limit**: Generous
- **Endpoints Used**:
  - `/BseIndiaAPI/api/StockReachGraph/w` - Stock data

### H. World Bank API
- **URL**: https://api.worldbank.org/v2
- **Cost**: Free, unlimited
- **Example**: `https://api.worldbank.org/v2/country/IND/indicator/NY.GDP.MKTP.CD?format=json`
- **Data**: GDP, inflation, industry-specific economic data

### I. IMF Data API
- **URL**: https://www.imf.org/external/datamapper/api/v1
- **Cost**: Free, unlimited
- **Data**: Global growth projections, country-level economic data

### J. SEC Edgar (US Company Filings)
- **URL**: https://data.sec.gov
- **Cost**: Free, no API key
- **Rate Limit**: 10 requests/second
- **Important**: Requires `User-Agent` header with contact email
- **Data**: 13F institutional holdings, company fundamentals (XBRL)

---

## 4. OPTIONAL APIs

### K. News API
- **URL**: https://newsapi.org/register
- **Cost**: Free (100 calls/day)
- **Setup**: Register → Get API Key → Set `NEWS_API_KEY`

---

## 5. ENVIRONMENT SETUP

### Step 1: Copy example env
```bash
cp .env.local.example .env.local
```

### Step 2: Add your keys
Edit `.env.local` and fill in the keys you obtained above.

### Step 3: Set up database
1. Go to your Supabase dashboard → SQL Editor
2. Copy and paste the contents of `supabase/schema.sql`
3. Click "Run"

### Step 4: Install dependencies
```bash
npm install
```

### Step 5: Run development server
```bash
npm run dev
```

### Step 6: Test API health
Visit `http://localhost:3000/api/health` to verify all connections.

---

## 6. DATA FLOW ARCHITECTURE

```
User Request (POST /api/analyze)
        │
        ▼
  ┌─────────────────┐
  │  Rate Limiter    │ ← Supabase (30 searches/month)
  └────────┬────────┘
           ▼
  ┌─────────────────┐
  │  Cache Check     │ ← Supabase (7-day TTL)
  └────────┬────────┘
           ▼
  ┌─────────────────────────────┐
  │  Data Orchestrator          │
  │  ├── Government APIs (free) │
  │  ├── NSE/BSE (free)         │
  │  ├── Yahoo Finance (free)   │
  │  ├── Alpha Vantage (key)    │
  │  └── FMP (key)              │
  └────────┬────────────────────┘
           ▼
  ┌─────────────────┐
  │  Validation      │ ← Cross-source verification
  └────────┬────────┘
           ▼
  ┌─────────────────┐
  │  Analysis Engine │
  │  ├── Rule-based  │
  │  └── AI (Groq)   │
  └────────┬────────┘
           ▼
  ┌─────────────────┐
  │  Response + Cache│
  └─────────────────┘
```

---

## 7. API RATE LIMITS SUMMARY

| API | Rate Limit | Key Required | Cost |
|-----|-----------|-------------|------|
| Yahoo Finance | 2000/hour | No | Free |
| NSE India | ~10/min | No | Free |
| BSE India | Generous | No | Free |
| Alpha Vantage | 500/day (5/min) | Yes | Free |
| FMP | 250/day | Yes | Free |
| World Bank | Unlimited | No | Free |
| IMF | Unlimited | No | Free |
| SEC Edgar | 10/sec | No | Free |
| Groq AI | ~30/min | Yes | Free |
| Supabase | 500k rows | Yes | Free tier |

---

## 8. PRODUCTION DEPLOYMENT

### Deploy to Vercel
```bash
npm install -g vercel
vercel login
vercel --prod
```

### Set Environment Variables in Vercel
Go to your Vercel project → Settings → Environment Variables and add all keys from `.env.local`.

### Production Optimizations
- API responses are cached for 5 minutes (in-memory) and 7 days (Supabase)
- Rate limiting prevents abuse (30 searches/month per IP)
- Multi-source fallback ensures data availability even if individual APIs fail
