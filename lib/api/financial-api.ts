// lib/api/financial-api.ts - Real-time financial data using Alpha Vantage & News API

const ALPHA_VANTAGE_KEY = process.env.ALPHA_VANTAGE_API_KEY || ''
const NEWS_API_KEY = process.env.NEWS_API_KEY || ''

interface FinancialData {
  revenue?: number
  marketCap?: number
  ebitda?: number
  eps?: number
  pe?: number
  employees?: number
  source: string
  confidence: number
}

interface NewsArticle {
  title: string
  description: string
  url: string
  publishedAt: string
  source: string
}

// Ticker mapping for US companies (for instant lookup without API calls)
const TICKER_MAP: Record<string, string> = {
  // Technology
  'Microsoft Corporation': 'MSFT',
  'Microsoft': 'MSFT',
  'Apple Inc.': 'AAPL',
  'Apple': 'AAPL',
  'Google (Alphabet Inc.)': 'GOOGL',
  'Alphabet Inc.': 'GOOGL',
  'Alphabet': 'GOOGL',
  'Google': 'GOOGL',
  'Meta Platforms Inc.': 'META',
  'Meta Platforms': 'META',
  'Meta': 'META',
  'NVIDIA Corporation': 'NVDA',
  'NVIDIA': 'NVDA',
  'Intel Corporation': 'INTC',
  'Intel': 'INTC',
  'IBM Corporation': 'IBM',
  'IBM': 'IBM',
  'Oracle Corporation': 'ORCL',
  'Oracle': 'ORCL',
  'Cisco Systems Inc.': 'CSCO',
  'Cisco Systems': 'CSCO',
  'Cisco': 'CSCO',
  'Adobe Inc.': 'ADBE',
  'Adobe': 'ADBE',
  'Salesforce Inc.': 'CRM',
  'Salesforce': 'CRM',
  'Tesla Inc.': 'TSLA',
  'Tesla': 'TSLA',
  'Netflix Inc.': 'NFLX',
  'Netflix': 'NFLX',
  'PayPal Holdings': 'PYPL',
  'PayPal': 'PYPL',
  
  // US Banks - Pre-mapped for instant lookup
  'JPMorgan Chase & Co.': 'JPM',
  'JPMorgan Chase': 'JPM',
  'Bank of America Corp.': 'BAC',
  'Bank of America': 'BAC',
  'Wells Fargo & Company': 'WFC',
  'Wells Fargo': 'WFC',
  'Goldman Sachs Group Inc.': 'GS',
  'Goldman Sachs': 'GS',
  'Morgan Stanley': 'MS',
  'Citigroup Inc.': 'C',
  'Citigroup': 'C',
  'U.S. Bancorp': 'USB',
  'US Bancorp': 'USB',
  'PNC Financial Services': 'PNC',
  'PNC Financial': 'PNC',
  'Truist Financial Corporation': 'TFC',
  'Truist Financial': 'TFC',
  'Capital One Financial Corp.': 'COF',
  'Capital One': 'COF',
  'TD Bank': 'TD',
  'American Express': 'AXP',
  'US Bank': 'USB',
  
  // Retail & Other
  'Amazon.com Inc.': 'AMZN',
  'Amazon': 'AMZN',
  'Walmart Inc.': 'WMT',
  'Walmart': 'WMT',
  'Home Depot': 'HD',
  'Johnson & Johnson': 'JNJ',
  'Pfizer Inc.': 'PFE',
  'Pfizer': 'PFE',
  'UnitedHealth Group': 'UNH',
  'AbbVie Inc.': 'ABBV',
  'Merck & Co.': 'MRK',
  'Merck': 'MRK',
  
  // Indian Companies
  'HDFC Bank': 'HDFCBANK',
  'ICICI Bank': 'ICICIBANK',
  'State Bank of India': 'SBIN',
  'TCS': 'TCS',
  'Infosys': 'INFY',
  'Reliance Industries': 'RELIANCE',
}

export async function fetchFinancialData(companyName: string): Promise<FinancialData> {
  const ticker = TICKER_MAP[companyName]
  
  if (!ticker) {
    console.log(`[Financial] No ticker mapping for: ${companyName}`)
    return { source: 'Unknown', confidence: 0 }
  }

  console.log(`[Financial] Fetching: ${companyName} → ${ticker}`)

  // Alpha Vantage Overview
  try {
    const url = `https://www.alphavantage.co/query?function=OVERVIEW&symbol=${ticker}&apikey=${ALPHA_VANTAGE_KEY}`
    const response = await fetch(url)
    const data = await response.json()

    if (data && data.Symbol === ticker && data.MarketCapitalization) {
      console.log(`  ✓ Alpha Vantage: MarketCap=${parseFloat(data.MarketCapitalization)/1e9}B`)
      
      const revenue = parseFloat(data.RevenueTTM || '0')
      const ebitda = parseFloat(data.EBITDA || '0')
      
      return {
        revenue: revenue > 0 ? revenue / 1e9 : undefined,
        marketCap: parseFloat(data.MarketCapitalization) / 1e9,
        ebitda: ebitda > 0 ? ebitda / 1e9 : undefined,
        eps: parseFloat(data.EPS) || undefined,
        pe: parseFloat(data.PERatio) || undefined,
        employees: data.FullTimeEmployees ? parseInt(data.FullTimeEmployees.replace(/,/g, '')) : undefined,
        source: 'Alpha Vantage',
        confidence: 0.95
      }
    }
  } catch (error) {
    console.warn(`  ✗ Alpha Vantage failed: ${error}`)
  }

  return { source: 'Unknown', confidence: 0 }
}

export async function batchFetchFinancialData(companies: string[]): Promise<Map<string, FinancialData>> {
  const results = new Map<string, FinancialData>()
  
  console.log(`[Financial] Fetching data for ${companies.length} companies...`)
  
  // Only fetch first 5 to avoid rate limiting
  const companiesToFetch = companies.slice(0, 5)
  
  for (const company of companiesToFetch) {
    const data = await fetchFinancialData(company)
    results.set(company, data)
    
    // Rate limit: Use 3 second delay to stay under 5/minute
    await new Promise(r => setTimeout(r, 3000))
  }
  
  const verified = Array.from(results.values()).filter(d => d.confidence > 0).length
  console.log(`[Financial] Verified: ${verified}/${companiesToFetch.length} (limited to 5 due to API rate limits)`)
  
  return results
}

// Fetch industry news
export async function fetchIndustryNews(industry: string): Promise<NewsArticle[]> {
  if (!NEWS_API_KEY) {
    console.log(`[News] API key not configured`)
    return []
  }

  try {
    console.log(`[News] Fetching news for: ${industry}`)
    const url = `https://newsapi.org/v2/everything?q=${encodeURIComponent(industry)}&language=en&sortBy=publishedAt&pageSize=5&apiKey=${NEWS_API_KEY}`
    const response = await fetch(url)
    const data = await response.json()

    if (data.status === 'ok' && data.articles) {
      console.log(`  ✓ Found ${data.articles.length} articles`)
      
      return data.articles.map((article: any) => ({
        title: article.title,
        description: article.description,
        url: article.url,
        publishedAt: article.publishedAt,
        source: article.source?.name || 'Unknown'
      }))
    }
  } catch (error) {
    console.warn(`  ✗ News API failed: ${error}`)
  }

  return []
}
