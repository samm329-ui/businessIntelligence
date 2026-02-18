# EBITA Intelligence System Architecture

## System Flow

```
User Input (Company/Industry/Brand)
         ↓
[IDENTIFICATION PHASE]
         ↓
    ┌─────────────────┐
    │ 1. Check Excel  │ ← Primary dataset (Indian companies)
    └─────────────────┘
         ↓ Not Found
    ┌─────────────────┐
    │ 2. Check CSV    │ ← Global companies
    └─────────────────┘
         ↓ Not Found
    ┌─────────────────┐
    │ 3. Check JSON   │ ← Indian dataset
    └─────────────────┘
         ↓ Not Found
    ┌─────────────────┐
    │ 4. Google Search│ ← Fetch and identify
    │   + Update DB   │
    └─────────────────┘
         ↓
[DATA COLLECTION PHASE]
         ↓
    ┌─────────────────┐
    │ Multi-Bot Search│
    │ • Google (free) │
    │ • DuckDuckGo    │
    │ • Bing (free)   │
    │ • News APIs     │
    │ • Web Crawler   │
    └─────────────────┘
         ↓
[ANALYSIS PHASE]
         ↓
    ┌─────────────────┐
    │ AI Analysis     │
    │ • EBITDA        │
    │ • Competitors   │
    │ • Growth Rate   │
    │ • KPIs          │
    └─────────────────┘
         ↓
[STORAGE & DISPLAY]
         ↓
    ┌─────────────────┐
    │ Store Results   │ ← Supabase/Local
    │ Show Dashboard  │
    └─────────────────┘
         ↓
[CHANGE DETECTION - Later]
         ↓
    ┌─────────────────┐
    │ Periodic Check  │ ← Every 24h/7d
    │ Compare Data    │
    │ Update if Changed│
    └─────────────────┘
```

## Module Structure

```
lib/
├── intelligence/           # Core intelligence system
│   ├── identifier.ts      # Industry/company identification
│   ├── collector.ts       # Multi-source data collection
│   ├── analyzer.ts        # AI analysis pipeline
│   └── change-detector.ts # Change detection system
├── search-bots/           # Free search bots
│   ├── google-bot.ts      # Google scraping bot
│   ├── duckduckgo-bot.ts  # DuckDuckGo bot
│   ├── bing-bot.ts        # Bing bot
│   └── news-bot.ts        # News aggregation bot
├── dataset-manager/       # Dataset management
│   ├── updater.ts         # Dynamic dataset updates
│   ├── cache.ts           # Caching system
│   └── merger.ts          # Dataset merging
└── orchestrator.ts        # Main orchestrator
```

## Free APIs & Methods Available

### Search (Free)
- **Google Custom Search API** - 100 queries/day free
- **DuckDuckGo** - No API key needed (scraping)
- **Bing Web Search API** - 1000 queries/month free
- **SerpAPI** - 100 queries/month free (Google)

### News (Free)
- **NewsAPI** - 100 requests/day free
- **GNews** - 100 requests/day free
- **Currents API** - 600 requests/month free

### Financial Data (Free)
- **Yahoo Finance** (unofficial)
- **Alpha Vantage** - 5 calls/min, 500/day free
- **Financial Modeling Prep** - 250 calls/day free

### Web Scraping (Free)
- **Cheerio** + **Axios** - Direct scraping
- **Puppeteer** - Headless browser
- **Playwright** - Advanced scraping

## API Keys Needed (Ask User)

**Required for production:**
1. **Google Custom Search API Key** + **Search Engine ID**
   - Get from: https://developers.google.com/custom-search/v1/overview
   - Cost: Free (100 queries/day)

2. **NewsAPI Key** (optional but recommended)
   - Get from: https://newsapi.org/
   - Cost: Free (100 requests/day)

3. **Groq/OpenAI API Key** (for AI analysis)
   - Get from: https://groq.com/ or https://openai.com/
   - Cost: Groq has free tier

4. **SerpAPI Key** (optional - better Google results)
   - Get from: https://serpapi.com/
   - Cost: Free (100 queries/month)

**Optional (for enhanced features):**
5. **Alpha Vantage API Key** (financial data)
   - Get from: https://www.alphavantage.co/
   - Cost: Free (5 calls/min)

6. **Bing Search API Key**
   - Get from: https://www.microsoft.com/en-us/bing/apis/bing-web-search-api
   - Cost: Free (1000 queries/month)

## Data Collection Strategy

### First Time (Full Collection)
1. Search company/industry info (5-10 sources)
2. Crawl official website
3. Search news (last 1 year)
4. Search financial reports
5. Search competitors
6. Aggregate all data
7. Store in database

### Subsequent Checks (Change Detection)
1. Check last modified dates
2. Compare key metrics
3. If changes > threshold (5%), update
4. Otherwise, serve cached data
5. Full refresh every 7 days

## Resource Optimization

### Storage
- Store raw HTML (compressed)
- Store extracted JSON
- Store only last 3 versions
- Archive older data

### GPU/Compute
- Use Groq for fast inference (free tier)
- Cache AI responses
- Batch similar queries
- Rate limit: 1 request/sec for free tier

### Bandwidth
- Respect robots.txt
- Add delays between requests (1-3 sec)
- Use caching aggressively
- Compress data before storage

## Configuration

```typescript
const config = {
  // Search settings
  search: {
    google: { enabled: true, apiKey: process.env.GOOGLE_API_KEY },
    duckduckgo: { enabled: true },
    bing: { enabled: true, apiKey: process.env.BING_API_KEY },
    serpapi: { enabled: false, apiKey: process.env.SERPAPI_KEY },
  },
  
  // Data collection
  collection: {
    maxSources: 10,
    crawlDepth: 2,
    newsDays: 365,
    respectRobots: true,
    delayMs: 1000,
  },
  
  // Storage
  storage: {
    provider: 'supabase', // or 'local'
    cacheDuration: 24 * 60 * 60 * 1000, // 24 hours
    maxVersions: 3,
  },
  
  // Change detection
  changeDetection: {
    enabled: true,
    checkInterval: 24 * 60 * 60 * 1000, // 24 hours
    threshold: 0.05, // 5% change threshold
  },
  
  // AI Analysis
  ai: {
    provider: 'groq', // or 'openai'
    model: 'llama-3.1-70b',
    temperature: 0.1,
    maxTokens: 4000,
  }
};
```

## Key Features

1. **Smart Identification** - Multi-layer dataset lookup + Google fallback
2. **Dynamic Updates** - Auto-updates dataset when new entity found
3. **Multi-Source Collection** - 5+ free search methods
4. **Intelligent Caching** - Stores and reuses data efficiently
5. **Change Detection** - Only updates when data changes
6. **Resource Optimization** - Minimal storage and compute usage

## Files to Create

1. `lib/intelligence/identifier.ts` - Main identification logic
2. `lib/search-bots/google-bot.ts` - Google search bot
3. `lib/search-bots/duckduckgo-bot.ts` - DuckDuckGo bot
4. `lib/search-bots/news-bot.ts` - News aggregation
5. `lib/intelligence/collector.ts` - Data collection orchestrator
6. `lib/dataset-manager/updater.ts` - Dynamic dataset updates
7. `lib/intelligence/change-detector.ts` - Change detection
8. `lib/intelligence/analyzer.ts` - AI analysis
9. `app/api/analyze-v2/route.ts` - New API endpoint
10. `ARCHITECTURE.md` - This document
