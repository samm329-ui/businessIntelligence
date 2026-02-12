# Data Sources Configuration Guide

This platform collects data from multiple government and market sources. Here's how to configure each:

## 📊 Available Data Sources

### 1. **RBI Database on Indian Economy** (95% reliability)
- **URL**: https://dbie.rbi.org.in
- **Data**: GDP, GVA, sector-wise economic indicators
- **Cost**: Free
- **API Key**: Not required for basic access
- **Rate Limits**: Standard web limits apply

### 2. **data.gov.in** (90% reliability)
- **URL**: https://data.gov.in
- **Data**: Open government datasets, industry statistics
- **Cost**: Free
- **API Key**: Optional but recommended for higher rate limits
- **Rate Limits**: 
  - Without key: 100 requests/day
  - With key: 10,000 requests/day

**How to get API Key:**
1. Visit https://data.gov.in/user/login
2. Create account or login
3. Go to "My Account" → "API Keys"
4. Generate new key
5. Add to `.env.local`:
   ```
   DATA_GOV_API_KEY=your-api-key-here
   ```

### 3. **MOSPI (Ministry of Statistics)** (92% reliability)
- **URL**: https://mospi.gov.in
- **Data**: Economic surveys, GDP, sectoral data
- **Cost**: Free
- **API Key**: Not required
- **Rate Limits**: Standard web limits

### 4. **NSE India** (85% reliability)
- **URL**: https://www.nseindia.com
- **Data**: Stock prices, market data, company financials
- **Cost**: Free for public data
- **API Key**: Not required for public endpoints
- **Rate Limits**: 
  - Standard: 100 requests/minute
  - May require session cookies

**Note**: NSE APIs are reverse-engineered and may break if NSE changes their website structure.

### 5. **BSE India** (85% reliability)
- **URL**: https://www.bseindia.com
- **Data**: Stock data, market information
- **Cost**: Free
- **API Key**: Not required
- **Rate Limits**: Standard web limits

## 🔧 Configuration

### Required Environment Variables

Add these to your `.env.local` file:

```env
# Required for all sources
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key

# Required for AI analysis
GROQ_API_KEY=gsk_your-groq-key

# Optional - for higher rate limits on data.gov.in
DATA_GOV_API_KEY=your-data-gov-api-key
```

## ⚠️ Common Issues

### "No data available" or "000" values

This happens when:
1. **APIs are rate-limited** - Wait a few minutes and try again
2. **APIs require authentication** - Check if you need API keys
3. **Industry name not recognized** - Try different variations (e.g., "IT" vs "Technology")
4. **API endpoints changed** - The fetchers may need updating

### Solutions:

#### 1. **Check API Status**
Visit the source websites directly to see if they're accessible:
- https://dbie.rbi.org.in
- https://data.gov.in
- https://www.nseindia.com

#### 2. **Use API Keys**
For data.gov.in, get an API key to increase rate limits from 100/day to 10,000/day.

#### 3. **Industry Name Mapping**
The system tries to map common industry names to API-specific formats. Try these variations:
- "IT" or "Technology" → "IT"
- "Pharma" or "Pharmaceutical" → "PHARMA"
- "Bank" or "Banking" → "BANK"
- "Auto" or "Automobile" → "AUTOMOBILE"

#### 4. **Check Server Logs**
The server console shows detailed logs:
```
🔍 Fetching data for industry: FMCG
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
✅ Government sources: 2 data points
⚠️  NSE: No stock data available
✅ BSE: 3 companies
```

## 🚀 Premium Alternatives

If free APIs are insufficient, consider these paid sources:

### **Bloomberg API**
- Comprehensive market data
- Cost: ~$20,000/year
- Website: https://www.bloomberg.com/professional

### **Refinitiv (Thomson Reuters)**
- Financial data and analytics
- Cost: Contact for pricing
- Website: https://www.refinitiv.com

### **CRISIL**
- India-focused industry research
- Cost: Contact for pricing
- Website: https://www.crisil.com

### **Capitaline**
- Indian company financials
- Cost: ~₹50,000/year
- Website: https://www.capitaline.com

### **CMIE (Centre for Monitoring Indian Economy)**
- Economic and industry data
- Cost: Contact for pricing
- Website: https://cmie.com

## 📝 Data Flow

```
User Search
    ↓
Fetch from Multiple Sources (Parallel)
    ├─ RBI Database (Economic data)
    ├─ data.gov.in (Government datasets)
    ├─ MOSPI (Statistical data)
    ├─ NSE (Stock data)
    └─ BSE (Stock data)
    ↓
Validate & Aggregate
    ↓
Run AI Analysis (Groq)
    ↓
Display Results
```

## 🔍 Debugging

Enable detailed logging by checking your server console. The system logs:
- Which sources were attempted
- Which succeeded/failed
- Specific error messages
- Data points collected

## 🔄 Fallback Strategy

The system is designed to work even with partial data:
- If government sources fail → Shows stock data only
- If stock APIs fail → Shows government data only
- If all fail → Shows "Data Unavailable" with specific reasons

This ensures the platform remains functional even when individual sources are down.
