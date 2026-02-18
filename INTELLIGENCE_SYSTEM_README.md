# EBITA Intelligence System

A comprehensive business intelligence system that identifies industries/companies from any input, collects data from multiple free sources, analyzes it using AI, and tracks changes over time.

## Architecture Overview

```
User Input → Identification → Data Collection → Change Detection → AI Analysis → Results
     ↓              ↓                ↓                ↓              ↓           ↓
  Company    Check Datasets    Multi-Bot       Compare with     Groq/       Dashboard
  Industry   (Excel → CSV    Google Search    Previous         OpenAI      Display
  Brand      → Dynamic)       Crawler          Versions         Analysis
                               News APIs        Store if
                                                Changed
```

## Flow

### 1. **Identification Phase**
Checks datasets in priority order:
1. **Excel Database** (Primary) - `c:\Users\jishu\Downloads\Indian_Industry_Companies_Database.xlsx`
2. **Dynamic Entities** - Companies added via Google search
3. **CSV Database** - Global companies
4. **Google Search** - If not found, searches and adds to dataset

### 2. **Data Collection Phase**
Multi-source collection:
- **Google Search Bot** - Multiple methods (API, DuckDuckGo, SerpAPI, Scraping)
- **Web Crawler** - Crawls top 10 relevant pages
- **News Bot** - Last 365 days of news
- **Financial Data** - Revenue, EBITDA, growth rates

### 3. **Change Detection**
- Compares with previous data
- Only updates if >5% changes or significant metrics changed
- Reduces storage, GPU, and API usage

### 4. **AI Analysis**
- **Groq** (Primary) - Free tier, fast
- **OpenAI** (Fallback) - GPT-4o-mini
- Extracts: EBITDA, Revenue, Growth, Competitors, Risks, Opportunities

## API Keys Required

### Required for Production:

#### 1. **Groq API Key** (For AI Analysis)
- **Get**: https://console.groq.com/keys
- **Free Tier**: Yes (generous limits)
- **Model**: llama-3.1-70b-versatile
- **Set**: `GROQ_API_KEY=your_key_here`

#### 2. **Google Custom Search API** (For Better Search Results)
- **Get**: https://developers.google.com/custom-search/v1/overview
- **Free Tier**: 100 queries/day
- **Steps**:
  1. Create a Custom Search Engine at https://cse.google.com/cse/
  2. Enable "Search the entire web"
  3. Get API Key from Google Cloud Console
  4. Get Search Engine ID from CSE control panel
- **Set**:
  ```
  GOOGLE_CUSTOM_SEARCH_API_KEY=your_api_key
  GOOGLE_SEARCH_ENGINE_ID=your_engine_id
  ```

### Optional (Enhances Results):

#### 3. **NewsAPI Key** (For News Data)
- **Get**: https://newsapi.org/
- **Free Tier**: 100 requests/day
- **Set**: `NEWSAPI_KEY=your_key`

#### 4. **SerpAPI Key** (Better Google Results)
- **Get**: https://serpapi.com/
- **Free Tier**: 100 queries/month
- **Set**: `SERPAPI_KEY=your_key`

#### 5. **OpenAI API Key** (Fallback AI)
- **Get**: https://platform.openai.com/
- **Model**: GPT-4o-mini
- **Set**: `OPENAI_API_KEY=your_key`

### Setup Environment Variables

Create a `.env.local` file in your project root:

```env
# Required
GROQ_API_KEY=groq_key_here

# Recommended
GOOGLE_CUSTOM_SEARCH_API_KEY=google_api_key_here
GOOGLE_SEARCH_ENGINE_ID=search_engine_id_here

# Optional
NEWSAPI_KEY=newsapi_key_here
SERPAPI_KEY=serpapi_key_here
OPENAI_API_KEY=openai_key_here
```

## Files Created

```
lib/
├── search-bots/
│   └── google-bot.ts           # Multi-method Google search
├── dataset-manager/
│   └── updater.ts              # Dynamic dataset updates
├── intelligence/
│   ├── identifier.ts           # Entity identification
│   ├── collector.ts            # Data collection orchestrator
│   ├── analyzer.ts             # AI analysis
│   ├── change-detector.ts      # Change detection
│   └── orchestrator.ts         # Main orchestrator
├── datasets/
│   └── load-excel-companies.ts # Excel database loader
└── resolution/
    └── entity-resolver-v2.ts   # Updated resolver

app/
└── api/
    └── intelligence/
        └── route.ts            # API endpoint

ARCHITECTURE.md                  # Full architecture docs
```

## Usage

### API Endpoint

```bash
# Get intelligence for a company
POST /api/intelligence
Content-Type: application/json

{
  "input": "Reliance Industries",
  "forceRefresh": false,
  "options": {
    "maxSources": 10,
    "newsDays": 365,
    "includeCrawling": true
  }
}
```

### Response

```json
{
  "success": true,
  "entity": {
    "name": "Reliance Industries",
    "type": "company",
    "industry": "Conglomerate",
    "subIndustry": "Oil & Gas, Telecom, Retail"
  },
  "analysis": {
    "executiveSummary": "India's largest conglomerate...",
    "financials": {
      "revenue": "₹9,74,864 Cr",
      "ebitda": "₹1,57,500 Cr",
      "growth": "23%"
    },
    "competitors": ["Tata Group", "Adani Group", "Birla Group"],
    "keyFindings": [...],
    "risks": [...],
    "opportunities": [...]
  },
  "metadata": {
    "totalTimeMs": 15432,
    "isNewEntity": false,
    "sourcesUsed": ["google", "news", "crawled"]
  }
}
```

### Quick Check

```bash
PUT /api/intelligence
{ "input": "Tesla" }
```

Response:
```json
{
  "success": true,
  "result": {
    "found": true,
    "name": "Tesla Inc",
    "industry": "Automotive",
    "confidence": 95
  }
}
```

### System Status

```bash
GET /api/intelligence
```

Response:
```json
{
  "success": true,
  "status": {
    "datasets": {
      "excelLoaded": true,
      "dynamicEntities": 15,
      "csvLoaded": true
    },
    "apiKeys": {
      "google": true,
      "newsApi": false,
      "serpApi": false,
      "groq": true
    },
    "capabilities": [
      "Multi-dataset company identification",
      "Google search fallback",
      "AI-powered analysis"
    ]
  }
}
```

## Features

### ✅ Completed
- [x] Multi-dataset identification (Excel → CSV → Dynamic → Google)
- [x] Google search bot (4 methods)
- [x] Dynamic dataset updates
- [x] Web crawling
- [x] Change detection system
- [x] AI analysis (Groq + OpenAI)
- [x] Resource optimization (caching, change detection)

### 🔄 How It Works

1. **First Request**: Full data collection + AI analysis + Storage
2. **Second Request** (within 24h): Returns cached data
3. **After 24h**: Checks for changes, updates if significant
4. **New Entity**: Google search → Add to dataset → Full analysis

### 💡 Key Benefits

- **Flexible**: Works with any input (company, brand, industry)
- **Self-Learning**: Automatically adds new entities to dataset
- **Efficient**: Only updates when data changes (saves storage/GPU)
- **Multi-Source**: 5+ free data sources
- **Cost-Effective**: Free tier APIs sufficient for most use cases

## Cost Estimation

### Free Tier Limits:
- **Groq**: Generous free tier (sufficient for testing)
- **Google Custom Search**: 100 queries/day
- **DuckDuckGo**: Unlimited (scraping)
- **NewsAPI**: 100 requests/day
- **SerpAPI**: 100 queries/month

### For 100 companies/month:
- **AI Analysis**: ~$0-5 (Groq free tier)
- **Google Search**: $0 (within free tier)
- **News**: $0 (within free tier)
- **Storage**: ~$0-1 (local/Supabase free tier)

**Total: $0-6/month** for 100 companies with free tiers!

## Next Steps

1. **Get API Keys** (Groq + Google Custom Search minimum)
2. **Add to `.env.local`**
3. **Test with**: `POST /api/intelligence` with `{ "input": "Your Company" }`
4. **Check logs** to see the system in action

## Troubleshooting

### "Could not identify entity"
- Entity not in datasets → Will Google search (requires API key)
- Check logs for search errors

### "AI analysis failed"
- Check Groq API key is set
- Falls back to rule-based analysis

### "No search results"
- Check internet connection
- Verify Google API key (if using)
- DuckDuckGo scraping may be blocked

### "Changes not detected"
- First request always collects fresh data
- Subsequent requests check last update time
- Force refresh with `forceRefresh: true`

## Support

For issues or questions, check:
1. `ARCHITECTURE.md` for detailed flow
2. Console logs for debug info
3. API response metadata for timing info
