# Quick Setup Guide - EBITA Intelligence System

## ⚡ 5-Minute Setup

### Step 1: Install Dependencies (Already Done)
```bash
npm install
```

### Step 2: Environment Configuration
```bash
# Copy the example environment file
copy .env.example .env.local

# Or on Mac/Linux:
cp .env.example .env.local
```

### Step 3: Add API Keys (Minimum Required)

Edit `.env.local` and add at least these two keys:

```env
# REQUIRED - Get from https://console.groq.com/keys (FREE)
GROQ_API_KEY=your_groq_key_here

# RECOMMENDED - Get from https://developers.google.com/custom-search/v1/overview (FREE)
GOOGLE_CUSTOM_SEARCH_API_KEY=your_google_key_here
GOOGLE_SEARCH_ENGINE_ID=your_search_engine_id_here
```

**That's it! The system is ready to use.**

---

## 🚀 Start the Application

```bash
npm run dev
```

The application will start on `http://localhost:3000`

---

## 🧪 Test the System

### Option 1: Use the API
```bash
curl -X POST http://localhost:3000/api/intelligence \
  -H "Content-Type: application/json" \
  -d '{"input": "Reliance Industries"}'
```

### Option 2: Use the Web Interface
1. Open `http://localhost:3000`
2. Use the search bar to enter company names
3. View the intelligence dashboard

### Option 3: System Status Check
```bash
curl http://localhost:3000/api/intelligence
```

---

## 📋 Complete API Key Setup (Optional but Recommended)

### 1. Groq AI (Required for Analysis)
- **URL**: https://console.groq.com/keys
- **Cost**: FREE tier available
- **Setup**:
  1. Sign up with email
  2. Go to API Keys section
  3. Create new key
  4. Copy to `.env.local`

### 2. Google Custom Search (Better Search Results)
- **URL**: https://developers.google.com/custom-search/v1/overview
- **Cost**: FREE (100 queries/day)
- **Setup**:
  1. Go to Google Cloud Console
  2. Create a project (or use existing)
  3. Enable "Custom Search API"
  4. Create API Key
  5. Go to https://cse.google.com/cse/
  6. Create a search engine
  7. Enable "Search the entire web"
  8. Copy Search Engine ID
  9. Add both to `.env.local`:
     ```
     GOOGLE_CUSTOM_SEARCH_API_KEY=your_key_here
     GOOGLE_SEARCH_ENGINE_ID=your_engine_id_here
     ```

### 3. NewsAPI (News Collection)
- **URL**: https://newsapi.org/
- **Cost**: FREE (100 requests/day)
- **Setup**:
  1. Sign up
  2. Get API key from dashboard
  3. Add to `.env.local`

### 4. SerpAPI (Enhanced Google Results)
- **URL**: https://serpapi.com/
- **Cost**: FREE (100 queries/month)
- **Setup**:
  1. Sign up
  2. Get API key
  3. Add to `.env.local`

---

## 📁 File Structure

```
business-intelligence/
├── .env.local                    # Your API keys (created by you)
├── .env.example                  # Template (already created)
├── lib/
│   ├── intelligence/
│   │   ├── orchestrator.ts       # Main entry point
│   │   ├── identifier.ts         # Industry/company identification
│   │   ├── collector.ts          # Data collection
│   │   ├── analyzer.ts           # AI analysis
│   │   ├── change-detector.ts    # Change detection
│   │   └── init.ts               # System initialization
│   ├── search-bots/
│   │   └── google-bot.ts         # Multi-method search
│   ├── dataset-manager/
│   │   └── updater.ts            # Dynamic dataset updates
│   └── datasets/
│       ├── load-excel-companies.ts
│       └── company-database.ts
├── app/
│   └── api/
│       └── intelligence/
│           └── route.ts          # API endpoint
├── scripts/
│   └── setup-intelligence.ts     # Setup script
├── INTELLIGENCE_SYSTEM_README.md # Full documentation
└── SETUP.md                      # This file
```

---

## 🔧 Troubleshooting

### "Cannot find module"
```bash
# Reinstall dependencies
npm install
```

### "Build errors"
```bash
# Clear cache and rebuild
npm run build
```

### "API key not working"
1. Check `.env.local` exists in root directory
2. Ensure no spaces around `=` in `.env.local`
3. Restart the dev server: `npm run dev`
4. Check keys are valid (not expired)

### "Excel file not found"
The system looks for:
- `C:\Users\jishu\Downloads\Indian_Industry_Companies_Database.xlsx`

If your file is elsewhere, update the path in:
- `lib/datasets/load-excel-companies.ts`

### "No search results"
- Check internet connection
- Verify Google API key (if using)
- The system will fallback to DuckDuckGo (free, unlimited)

---

## 💡 Usage Examples

### Identify a Company
```javascript
const response = await fetch('/api/intelligence', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ input: 'Tata Motors' })
});
const data = await response.json();
```

### Quick Check (Fast)
```javascript
const response = await fetch('/api/intelligence', {
  method: 'PUT',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ input: 'Infosys' })
});
```

### Force Refresh
```javascript
const response = await fetch('/api/intelligence', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ 
    input: 'HDFC Bank',
    forceRefresh: true 
  })
});
```

---

## 🎯 Next Steps

1. ✅ **Add API keys** to `.env.local`
2. ✅ **Start the app**: `npm run dev`
3. ✅ **Test with**: `curl -X POST http://localhost:3000/api/intelligence -H "Content-Type: application/json" -d '{"input":"Reliance"}'`
4. ✅ **View results** in the dashboard

---

## 📞 Support

If you encounter issues:

1. Check the console logs for errors
2. Verify `.env.local` has correct API keys
3. Check `INTELLIGENCE_SYSTEM_README.md` for detailed docs
4. Review `ARCHITECTURE.md` for system design

---

## ✨ Features Ready to Use

- ✅ Multi-dataset company identification
- ✅ Google search fallback (4 methods)
- ✅ Dynamic dataset updates
- ✅ Web crawling
- ✅ Change detection
- ✅ AI-powered analysis (Groq/OpenAI)
- ✅ Resource optimization (caching)

**Just add your API keys and start using!** 🚀
