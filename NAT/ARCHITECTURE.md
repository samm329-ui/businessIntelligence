# N.A.T. AI - Architecture Document

## Engine Overview

**N.A.T. (Natasha) - Advanced Business Intelligence Engine**

Version: 1.0.0  
Updated: February 20, 2026

---

## System Architecture

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                    N.A.T. BUSINESS INTELLIGENCE ENGINE                      │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│  ┌──────────────┐     ┌──────────────┐     ┌──────────────┐                │
│  │   FRONTEND   │────▶│   FASTAPI    │────▶│   SERVICES   │                │
│  │  (Next.js/   │     │   SERVER     │     │   LAYER      │                │
│  │   Any UI)    │     │   :8000      │     │              │                │
│  └──────────────┘     └──────────────┘     └──────┬───────┘                │
│                                                    │                         │
│         ┌─────────────────────────────────────────┼────────────────────┐     │
│         │                                         │                    │     │
│         ▼                                         ▼                    ▼     │
│  ┌─────────────┐                          ┌──────────────┐    ┌─────────┐ │
│  │  /chat       │                          │ /intelligence│    │ /health │ │
│  │ (General +  │                          │ (Full BI     │    │ /status │ │
│  │  Realtime)  │                          │  Pipeline)   │    └─────────┘ │
│  └─────────────┘                          └──────────────┘                │
│                                                                              │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## API Endpoints

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/` | GET | Root info |
| `/health` | GET | Health check with uptime |
| `/chat` | POST | General/Realtime chat |
| `/intelligence` | POST | Full BI analysis |
| `/system/status` | GET | Basic system status |
| `/system/detailed` | GET | Detailed status with timestamps |
| `/vectorstore/status` | GET | Vector store info |
| `/sessions` | GET | Chat sessions |
| `/learning/files` | GET | Learning files |

---

## Intelligence Pipeline

```
USER QUERY
    │
    ▼
┌─────────────────────────────────────────────────────────────┐
│ STEP 1: AUTO-CLASSIFICATION                                │
│ • Classify: company/industry/brand/sector                   │
│ • Extract: name, industry, sector, stock symbol             │
└─────────────────────────────────────────────────────────────┘
    │
    ▼
┌─────────────────────────────────────────────────────────────┐
│ STEP 2: PARALLEL DATA FETCH                                 │
│   ┌──────────────┐  ┌──────────────┐  ┌──────────────┐   │
│   │ Alpha Vantage│  │ FMP          │  │ Tavily/Google│   │
│   │ - Revenue    │  │ - Profile    │  │ - Search     │   │
│   │ - EBITDA     │  │ - Market Cap │  │ - Research   │   │
│   │ - PE Ratio   │  │ - Industry   │  │              │   │
│   └──────────────┘  └──────────────┘  └──────────────┘   │
│   ┌──────────────┐                                       │
│   │ News API    │                                       │
│   │ - Headlines│                                       │
│   └──────────────┘                                       │
└─────────────────────────────────────────────────────────────┘
    │
    ▼
┌─────────────────────────────────────────────────────────────┐
│ STEP 3: GROQ DEEP ANALYSIS                                   │
│ • 40+ fields: EBITDA, TAM/SAM/SOM, PE ratio, competitors   │
│ • Investor/Founder Verdicts                                   │
│ • Marks UNAVAILABLE instead of hallucinating               │
└─────────────────────────────────────────────────────────────┘
    │
    ▼
┌─────────────────────────────────────────────────────────────┐
│ STEP 4: FORMAT RESPONSE                                     │
│ • Clean investor/founder report                              │
│ • Structured sections with headers                          │
└─────────────────────────────────────────────────────────────┘
    │
    ▼
┌─────────────────────────────────────────────────────────────┐
│ STEP 5: SELF-LEARNING                                       │
│ • Save to FAISS vector store                                │
│ • 1-hour cache                                              │
└─────────────────────────────────────────────────────────────┘
```

---

## API Data Sources

| Source | Type | Data | Required | Status |
|--------|------|------|----------|--------|
| **Groq** | LLM | All AI processing | YES | ✅ Configured |
| **Tavily** | Search | Web research, News | Recommended | ✅ Configured |
| **Alpha Vantage** | Financial | Revenue, EBITDA, PE | Optional | ✅ Configured |
| **FMP** | Financial | Company profiles | Optional | ✅ Configured |
| **Yahoo Finance** | Financial | Market data | Optional | ✅ No key needed |
| **NSE India** | Financial | Indian stock quotes | Optional | ✅ No key needed |
| **BSE India** | Financial | Indian stock quotes | Optional | ✅ Added v9.0 |
| **Google CSE** | Search | Backup research | Optional | ✅ Configured |

---

## Production Intelligence Service (v9.1)

The `/analyze` endpoint uses `production_intelligence.py` - a production-grade service with multi-source data aggregation and financial ratio calculations.

### Service Location
```
NAT/app/services/production_intelligence.py
```

### Key Features (v9.1)

1. **Known Companies Dictionary**
   - 15+ pre-configured Indian companies
   - Instant classification without API calls
   - Includes: Reliance, Tata, TCS, Infosys, HDFC, ICICI, Adani, etc.

2. **Financial Ratio Calculations**
   - Fetches complete financial data from FMP API
   - Calculates all ratios using exact formulas:
     - Profitability: Net Margin, Gross Margin, ROE, ROA, EPS
     - Valuation: P/E, P/B, EV/EBITDA
     - Liquidity: Current Ratio, Quick Ratio
     - Solvency: Debt/Equity, Interest Coverage
     - Efficiency: Inventory Turnover, Asset Turnover, DSO
     - Cash Flow: Free Cash Flow
   - Returns source attribution for verification

2. **Industry Competitors Fallback**
   - 8 industries with pre-configured competitors
   - Oil & Gas, IT Services, Banking, Automobiles, FMCG, Pharmaceuticals, Telecommunications, Conglomerate

3. **Multi-Source API Integration**
   ```python
   def fetch_all_data(classification):
       # Parallel API calls
       - Alpha Vantage: Company overview, financials
       - FMP: Company profile, financials
       - Yahoo Finance: Market data, valuation
       - NSE India: Indian stock quotes
       - BSE India: Indian stock quotes
       
       # Parallel Web Search
       - Industry competitors (India + Global)
       - Market size (TAM/SAM/SOM)
       - Revenue breakdown
       - Investors, Growth, Benchmarks
       - Marketing strategies
       - News
   ```

4. **Error Handling**
   - All API calls wrapped in try-except
   - Graceful degradation when sources fail
   - Detailed logging for debugging

### Analysis Flow

```
QUERY → CLASSIFY (Known companies OR Groq+Tavily)
     → FETCH APIs (Parallel: Alpha Vantage, FMP, Yahoo, NSE, BSE)
     → WEB SEARCH (Parallel: 15+ search topics)
     → ANALYZE (Groq LLM combines all data)
     → RETURN (Structured response with sources)
```

### Caching
- 30-minute TTL (1800 seconds)
- Cache key: lowercase query
- Stores: classification, structured_data, sources_used, web_sources

---

## Outputs Generated

### For Companies:
- Revenue, EBITDA, Profit Margins
- Market Cap, Valuation, PE Ratio
- Funding Rounds, Investors
- TAM, SAM, SOM
- Competitors (India + Global)
- **Investor Verdict**: Buy/Hold/Watch/Pass
- **Founder Verdict**: Good Market/Competitive/Saturated/Emerging

### For Industries:
- Market Size (Global/India)
- TAM, SAM, SOM
- Segment Breakdown
- Investment Heatmap
- Key Players, VC/PE Investors

---

## System Status - Detailed Report

**GET /system/detailed** returns:
- System name: N.A.T.
- Full name: Natasha
- Version: 1.0.0
- Uptime start time
- Current time (with date)
- All API configurations (Available/Not configured)
- Vector store status (document count, model)
- Cache status (entries, TTL)
- Active sessions count

---

## Usage

### Intelligence Query:
```bash
curl -X POST http://localhost:8000/intelligence \
  -H "Content-Type: application/json" \
  -d '{"query": "Byju's financial performance 2024"}'
```

### Search Bar Integration:
```javascript
// From your frontend
const result = await fetch('/intelligence', {
  method: 'POST',
  body: JSON.stringify({ query: searchInput })
});
```

---

## File Structure

```
NAT/
├── app/
│   ├── main.py                  # FastAPI with all endpoints
│   ├── models.py                # Pydantic models
│   ├── services/
│   │   ├── chat_service.py      # Session management
│   │   ├── groq_service.py      # LLM calls
│   │   ├── vector_store.py      # FAISS + embeddings
│   │   ├── realtime_service.py  # Web search
│   │   └── intelligence_service.py  # Full BI pipeline
│   └── utils/
│       └── time_info.py
├── database/
│   ├── learning_data/           # Memory files
│   ├── chats_data/              # Sessions
│   └── vector_store/            # FAISS index
├── config.py                    # Configuration
├── run.py                       # Server startup
├── test.py                      # CLI testing
└── requirements.txt
```

---

## Deployment

**Local:**
```bash
pip install -r requirements.txt
cp .env.example .env  # Add API keys
python run.py
```

**Railway (Recommended):**
1. Connect GitHub to Railway
2. Set environment variables
3. Deploy - bot runs automatically

**Frontend (Vercel):**
- Your Next.js calls Railway bot URL
- No Python needed on Vercel
