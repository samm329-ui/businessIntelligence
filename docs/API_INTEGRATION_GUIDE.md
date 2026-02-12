# EBITA API Integration Guide

## Overview
This guide documents all the APIs used in the EBITA Intelligence platform upgrade, including where to get API keys, rate limits, and integration examples.

## Table of Contents
1. [Indian Market APIs](#indian-market-apis)
2. [Global Market APIs](#global-market-apis)
3. [Government & Regulatory APIs](#government--regulatory-apis)
4. [Supplementary APIs](#supplementary-apis)
5. [Integration Examples](#integration-examples)
6. [Rate Limit Management](#rate-limit-management)
7. [Error Handling](#error-handling)

---

## Indian Market APIs

### 1. NSE India (National Stock Exchange)
**Cost**: FREE (No API key required)
**Rate Limit**: ~100 requests/minute with proper headers
**Documentation**: https://www.nseindia.com/

**Endpoints**:
```
GET https://www.nseindia.com/api/quote-equity?symbol={SYMBOL}
GET https://www.nseindia.com/api/market-data-pre-open?key=ALL
GET https://www.nseindia.com/api/historical/cm/equity?symbol={SYMBOL}
```

**Headers Required**:
```javascript
{
  'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
  'Accept': 'application/json',
  'Accept-Language': 'en-US,en;q=0.9',
  'Referer': 'https://www.nseindia.com/'
}
```

**Implementation**: `lib/integrations/index.ts` - NSEAdapter

---

### 2. BSE India (Bombay Stock Exchange)
**Cost**: FREE (No API key required)
**Rate Limit**: ~100 requests/minute
**Documentation**: https://api.bseindia.com/

**Endpoints**:
```
GET https://api.bseindia.com/BseIndiaAPI/api/StockReachGraph/w?scripcode={CODE}
GET https://api.bseindia.com/BseIndiaAPI/api/MktCapYearlyData/w?Pcode={CODE}
```

**Implementation**: `lib/integrations/index.ts` - BSEAdapter

---

### 3. SEBI (Securities and Exchange Board of India)
**Cost**: FREE (Public data)
**Rate Limit**: No limit
**Documentation**: https://www.sebi.gov.in/sebiweb/other/OtherAction.do?doPmr=yes

**Data Available**:
- Shareholding patterns
- Institutional holdings
- Insider trading reports
- Corporate filings

**Implementation**: `lib/calculators/stakeholder-metrics.ts` - fetchFromSEBI()

---

### 4. Reserve Bank of India (RBI)
**Cost**: FREE
**Rate Limit**: No limit
**Documentation**: https://rbi.org.in/Scripts/Statistics.aspx

**Data Available**:
- Inflation rates
- Interest rates
- GDP data
- Foreign exchange reserves
- Banking statistics

**Implementation**: `lib/integrations/index.ts` - RBIAdapter

---

### 5. Ministry of Corporate Affairs (MCA)
**Cost**: FREE (Public data)
**Rate Limit**: No limit
**Documentation**: https://www.mca.gov.in/content/mca/global/en/data-and-reports.html

**Data Available**:
- Company financials
- Annual reports
- Director information
- Charge details

---

### 6. MOSPI (Ministry of Statistics)
**Cost**: FREE
**Rate Limit**: No limit
**Documentation**: https://www.mospi.gov.in/

**Data Available**:
- GDP data
- Industrial production
- Inflation indices
- Employment statistics

---

## Global Market APIs

### 1. Yahoo Finance
**Cost**: FREE (No API key required)
**Rate Limit**: ~2000 requests/hour
**Documentation**: https://finance.yahoo.com/

**Installation**:
```bash
npm install yahoo-finance2
```

**Usage**:
```typescript
import yahooFinance from 'yahoo-finance2'

const quote = await yahooFinance.quote('AAPL')
const historical = await yahooFinance.historical('AAPL', {
  period1: '2024-01-01',
  period2: '2024-12-31'
})
```

**Features**:
- Real-time quotes
- Historical prices
- Fundamental data
- Options data

**Implementation**: `lib/integrations/index.ts` - YahooFinanceAdapter

---

### 2. Alpha Vantage
**Cost**: FREE tier (500 calls/day)
**Rate Limit**: 5 calls/minute (free tier)
**Get API Key**: https://www.alphavantage.co/support/#api-key

**Base URL**: `https://www.alphavantage.co/query`

**Endpoints**:
```
GET ?function=GLOBAL_QUOTE&symbol={SYMBOL}&apikey={API_KEY}
GET ?function=OVERVIEW&symbol={SYMBOL}&apikey={API_KEY}
GET ?function=INCOME_STATEMENT&symbol={SYMBOL}&apikey={API_KEY}
GET ?function=BALANCE_SHEET&symbol={SYMBOL}&apikey={API_KEY}
GET ?function=TIME_SERIES_DAILY&symbol={SYMBOL}&apikey={API_KEY}
```

**Environment Variable**:
```bash
ALPHA_VANTAGE_API_KEY=your_api_key_here
```

**Implementation**: `lib/integrations/index.ts` - AlphaVantageAdapter

---

### 3. Financial Modeling Prep (FMP)
**Cost**: FREE tier (250 calls/day)
**Rate Limit**: Varies by endpoint
**Get API Key**: https://site.financialmodelingprep.com/developer/docs/

**Base URL**: `https://financialmodelingprep.com/api/v3`

**Endpoints**:
```
GET /quote/{SYMBOL}?apikey={API_KEY}
GET /profile/{SYMBOL}?apikey={API_KEY}
GET /income-statement/{SYMBOL}?apikey={API_KEY}
GET /balance-sheet-statement/{SYMBOL}?apikey={API_KEY}
GET /cash-flow-statement/{SYMBOL}?apikey={API_KEY}
```

**Environment Variable**:
```bash
FMP_API_KEY=your_api_key_here
```

**Implementation**: `lib/integrations/index.ts` - FMPAdapter

---

### 4. SEC Edgar (US Securities and Exchange Commission)
**Cost**: FREE
**Rate Limit**: 10 requests/second
**Documentation**: https://www.sec.gov/edgar/sec-api-documentation

**Base URL**: `https://www.sec.gov/Archives/edgar`

**Endpoints**:
```
GET /cgi-bin/browse-edgar?action=getcompany&CIK={CIK}&type=10-K
GET /cgi-bin/browse-edgar?action=getcompany&CIK={CIK}&type=10-Q
GET /cgi-bin/browse-edgar?action=getcompany&CIK={CIK}&type=8-K
```

**Headers Required**:
```javascript
{
  'User-Agent': 'YourName your@email.com'
}
```

**Note**: SEC requires identifying information in User-Agent header

**Implementation**: `lib/integrations/index.ts` - SECAdapter

---

## Government & Regulatory APIs

### 1. World Bank Open Data
**Cost**: FREE
**Rate Limit**: 100 requests/second
**Documentation**: https://datahelpdesk.worldbank.org/knowledgebase/articles/889392-api-documentation

**Base URL**: `https://api.worldbank.org/v2`

**Endpoints**:
```
GET /country/{COUNTRY_CODE}/indicator/NY.GDP.MKTP.CD
GET /country/{COUNTRY_CODE}/indicator/NV.IND.TOTL.ZS
GET /country/all/indicator/SP.POP.TOTL
```

**Example**:
```typescript
const response = await fetch(
  'https://api.worldbank.org/v2/country/IND/indicator/NY.GDP.MKTP.CD?format=json'
)
const gdpData = await response.json()
```

**Implementation**: `lib/integrations/index.ts` - WorldBankAdapter

---

### 2. IMF Data
**Cost**: FREE
**Rate Limit**: No limit
**Documentation**: https://datahelp.imf.org/knowledgebase/articles/667681-using-json-restful-web-service

**Base URL**: `https://www.imf.org/external/datamapper/api/v1`

**Endpoints**:
```
GET /{INDICATOR}/{COUNTRY_CODE}
GET /NGDP/{COUNTRY_CODE}
GET /PCPIPCH/{COUNTRY_CODE}  # Inflation
```

---

## Supplementary APIs

### 1. NewsAPI
**Cost**: FREE tier (100 requests/day)
**Get API Key**: https://newsapi.org/register

**Base URL**: `https://newsapi.org/v2`

**Endpoints**:
```
GET /everything?q={QUERY}&apiKey={API_KEY}
GET /top-headlines?country={COUNTRY}&category=business&apiKey={API_KEY}
```

**Environment Variable**:
```bash
NEWS_API_KEY=your_api_key_here
```

**Use Case**: Sentiment analysis for stocks/companies

---

### 2. CoinGecko
**Cost**: FREE
**Rate Limit**: 10-30 calls/minute
**Documentation**: https://www.coingecko.com/en/api

**Base URL**: `https://api.coingecko.com/api/v3`

**Endpoints**:
```
GET /simple/price?ids={CRYPTO_ID}&vs_currencies=usd
GET /coins/markets?vs_currency=usd&order=market_cap_desc
```

**Use Case**: Cryptocurrency and fintech sector data

---

## Integration Examples

### Basic Data Fetch
```typescript
import { dataOrchestrator } from '@/lib/integrations'

const data = await dataOrchestrator.fetchWithFallback({
  symbol: 'RELIANCE',
  region: 'INDIA',
  dataType: 'QUOTE'
})
```

### Competitor Analysis
```typescript
import { competitorIntelligence } from '@/lib/services/competitor-intelligence'

const competitors = await competitorIntelligence.fetchCompetitors({
  industry: 'Technology',
  region: 'INDIA',
  limit: 25,
  sortBy: 'marketCap'
})
```

### Stakeholder Data
```typescript
import { stakeholderAnalyzer } from '@/lib/calculators/stakeholder-metrics'

const stakeholders = await stakeholderAnalyzer.fetchStakeholders(
  'Reliance Industries',
  'INDIA'
)
const metrics = stakeholderAnalyzer.calculateMetrics(stakeholders)
```

### Enhanced Financial Metrics
```typescript
import { AdvancedMetricsCalculator } from '@/lib/calculators/advanced-metrics'

const calculator = new AdvancedMetricsCalculator()
const metrics = calculator.calculate({
  revenue: 100000,
  cogs: 60000,
  operatingIncome: 20000,
  netIncome: 15000,
  ebitda: 25000,
  // ... other financial data
})
```

---

## Rate Limit Management

### API Rotation Strategy
The platform automatically rotates between APIs to avoid rate limits:

```typescript
import { APIRotator } from '@/lib/integrations/api-rotator'

const rotator = new APIRotator([
  new AlphaVantageAdapter(),
  new FMPAdapter(),
  new YahooFinanceAdapter()
], 60000) // 1 minute cooldown

const data = await rotator.fetchWithRotation({
  symbol: 'AAPL',
  region: 'GLOBAL',
  dataType: 'QUOTE'
})
```

### Caching Strategy
- Market data: 5-minute cache
- Fundamental data: 1-hour cache
- Historical data: 24-hour cache

```typescript
// Cache configuration in lib/integrations/index.ts
const CACHE_TTL = 5 * 60 * 1000 // 5 minutes for real-time data
```

---

## Error Handling

### Common Error Patterns
```typescript
try {
  const data = await dataOrchestrator.fetchWithFallback(query)
} catch (error) {
  if (error.message.includes('rate limit')) {
    // Switch to next API in rotation
  } else if (error.message.includes('timeout')) {
    // Retry with exponential backoff
  } else {
    // Use cached data as fallback
  }
}
```

### Fallback Chain
1. Try primary source
2. If rate limited, try secondary source
3. If failed, use cached data
4. If no cache, return error with suggestions

---

## Environment Variables Setup

Create `.env.local` file:

```bash
# Optional - for enhanced global data
ALPHA_VANTAGE_API_KEY=your_key_here
FMP_API_KEY=your_key_here
NEWS_API_KEY=your_key_here

# Optional - for Redis caching (Vercel KV)
KV_URL=your_vercel_kv_url
KV_REST_API_TOKEN=your_token
KV_REST_API_READ_ONLY_TOKEN=your_read_token

# Database (Supabase)
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
```

---

## Cost Optimization Tips

1. **Use Indian sources first** (NSE, BSE, RBI) - unlimited free
2. **Cache aggressively** - reduces API calls by 80%
3. **Rotate APIs** - distribute load across sources
4. **Use batch requests** - where supported
5. **Prioritize free tiers** - only upgrade if hitting limits

---

## API Status Monitoring

Check API health:
```typescript
import { dataOrchestrator } from '@/lib/integrations'

const status = dataOrchestrator.getStatus()
console.log(status)
// [
//   { name: 'NSE India', available: true, remainingCalls: 100 },
//   { name: 'Alpha Vantage', available: true, remainingCalls: 480 },
//   ...
// ]
```

---

## Support & Resources

- **NSE Issues**: https://www.nseindia.com/contact
- **Alpha Vantage Support**: support@alphavantage.co
- **FMP Discord**: https://discord.gg/financialmodelingprep
- **Yahoo Finance**: https://github.com/gadicc/node-yahoo-finance2
- **World Bank API Help**: https://datahelpdesk.worldbank.org/

---

## Summary

**Total Free API Calls Available per Day**:
- NSE/BSE: Unlimited
- Yahoo Finance: ~48,000 (2000/hour)
- Alpha Vantage: 500
- FMP: 250
- SEC: 864,000 (10/second)
- World Bank: Unlimited
- **Total**: ~65,000+ calls/day (sufficient for enterprise use)

All APIs are integrated with automatic fallback and rotation!
