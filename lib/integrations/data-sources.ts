// lib/integrations/data-sources.ts
// Configuration for all free data sources

export interface DataSourceConfig {
  name: string
  url: string
  endpoints?: Record<string, string>
  rateLimit: string
  cost: string
  reliability: 'HIGH' | 'MEDIUM' | 'LOW'
  region: 'INDIA' | 'GLOBAL' | 'BOTH'
}

// Indian Market Data Sources (100% Free)
export const INDIAN_SOURCES: DataSourceConfig[] = [
  {
    name: 'NSE India',
    url: 'https://www.nseindia.com/api',
    endpoints: {
      stockQuote: '/quote-equity?symbol={SYMBOL}',
      marketData: '/market-data-pre-open?key=ALL',
      corporateActions: '/corporates-{type}?index=equities',
      historical: '/historical/cm/equity?symbol={SYMBOL}'
    },
    rateLimit: '100/minute (with proper headers)',
    cost: 'FREE',
    reliability: 'HIGH',
    region: 'INDIA'
  },
  {
    name: 'BSE India',
    url: 'https://api.bseindia.com',
    endpoints: {
      stockQuote: '/BseIndiaAPI/api/StockReachGraph/w?scripcode={CODE}',
      bulkDeals: '/BseIndiaAPI/api/MktCapYearlyData/w?Pcode={CODE}'
    },
    rateLimit: '100/minute',
    cost: 'FREE',
    reliability: 'HIGH',
    region: 'INDIA'
  },
  {
    name: 'SEBI',
    url: 'https://www.sebi.gov.in',
    endpoints: {
      shareholding: '/sebiweb/other/OtherAction.do?doPmr=yes',
      filings: '/sebiweb/home/HomeAction.do'
    },
    rateLimit: 'No limit (public data)',
    cost: 'FREE',
    reliability: 'HIGH',
    region: 'INDIA'
  },
  {
    name: 'Reserve Bank of India',
    url: 'https://rbi.org.in/Scripts/Statistics.aspx',
    endpoints: {
      macroData: '/Scripts/Statistics.aspx',
      inflation: '/Scripts/BS_PressReleaseDisplay.aspx'
    },
    rateLimit: 'No limit',
    cost: 'FREE',
    reliability: 'HIGH',
    region: 'INDIA'
  },
  {
    name: 'Ministry of Corporate Affairs',
    url: 'https://www.mca.gov.in',
    endpoints: {
      companyData: '/content/mca/global/en/data-and-reports.html'
    },
    rateLimit: 'No limit (public data)',
    cost: 'FREE',
    reliability: 'HIGH',
    region: 'INDIA'
  },
  {
    name: 'MOSPI',
    url: 'https://www.mospi.gov.in',
    endpoints: {
      gdp: '/web/gdp-data',
      industry: '/web/industrial-production'
    },
    rateLimit: 'No limit',
    cost: 'FREE',
    reliability: 'HIGH',
    region: 'INDIA'
  }
]

// Global Market Data Sources (Free Tiers)
export const GLOBAL_SOURCES: DataSourceConfig[] = [
  {
    name: 'Yahoo Finance',
    url: 'https://query1.finance.yahoo.com',
    endpoints: {
      quote: '/v8/finance/chart/{SYMBOL}',
      fundamentals: '/v10/finance/quoteSummary/{SYMBOL}'
    },
    rateLimit: '~2000/hour',
    cost: 'FREE',
    reliability: 'HIGH',
    region: 'GLOBAL'
  },
  {
    name: 'Alpha Vantage',
    url: 'https://www.alphavantage.co',
    endpoints: {
      quote: '/query?function=GLOBAL_QUOTE&symbol={SYMBOL}&apikey={API_KEY}',
      fundamentals: '/query?function=OVERVIEW&symbol={SYMBOL}&apikey={API_KEY}',
      income: '/query?function=INCOME_STATEMENT&symbol={SYMBOL}&apikey={API_KEY}'
    },
    rateLimit: '5 calls/minute (free tier)',
    cost: 'FREE tier available',
    reliability: 'HIGH',
    region: 'GLOBAL'
  },
  {
    name: 'Financial Modeling Prep',
    url: 'https://financialmodelingprep.com/api/v3',
    endpoints: {
      quote: '/quote/{SYMBOL}?apikey={API_KEY}',
      profile: '/profile/{SYMBOL}?apikey={API_KEY}',
      financials: '/income-statement/{SYMBOL}?apikey={API_KEY}'
    },
    rateLimit: '250/day (free tier)',
    cost: 'FREE',
    reliability: 'HIGH',
    region: 'GLOBAL'
  },
  {
    name: 'SEC Edgar',
    url: 'https://www.sec.gov/cgi-bin/browse-edgar',
    endpoints: {
      filings: '?action=getcompany&CIK={CIK}&type={TYPE}&dateb=&owner=include&count=40',
      companyInfo: '/cgi-bin/browse-edgar?action=getcompany&CIK={CIK}'
    },
    rateLimit: '10 requests/second',
    cost: 'FREE',
    reliability: 'HIGH',
    region: 'GLOBAL'
  },
  {
    name: 'World Bank Open Data',
    url: 'https://api.worldbank.org/v2',
    endpoints: {
      gdp: '/country/{COUNTRY}/indicator/NY.GDP.MKTP.CD',
      industry: '/country/{COUNTRY}/indicator/NV.IND.TOTL.ZS'
    },
    rateLimit: '100 requests/second',
    cost: 'FREE',
    reliability: 'HIGH',
    region: 'GLOBAL'
  },
  {
    name: 'IMF Data',
    url: 'https://www.imf.org/external/datamapper/api/v1',
    endpoints: {
      indicators: '/{INDICATOR}/{COUNTRY}'
    },
    rateLimit: 'No limit',
    cost: 'FREE',
    reliability: 'HIGH',
    region: 'GLOBAL'
  }
]

// Supplementary Sources
export const SUPPLEMENTARY_SOURCES: DataSourceConfig[] = [
  {
    name: 'NewsAPI',
    url: 'https://newsapi.org/v2',
    endpoints: {
      everything: '/everything?q={QUERY}&apiKey={API_KEY}'
    },
    rateLimit: '100 requests/day',
    cost: 'FREE tier',
    reliability: 'MEDIUM',
    region: 'GLOBAL'
  },
  {
    name: 'CoinGecko',
    url: 'https://api.coingecko.com/api/v3',
    endpoints: {
      prices: '/simple/price?ids={ID}&vs_currencies=usd',
      markets: '/coins/markets?vs_currency=usd'
    },
    rateLimit: '10-30 calls/minute',
    cost: 'FREE',
    reliability: 'HIGH',
    region: 'GLOBAL'
  }
]

// API Key Requirements
export const API_KEY_INFO: Record<string, { required: boolean; freeTier: boolean; getKeyUrl: string }> = {
  'Alpha Vantage': {
    required: true,
    freeTier: true,
    getKeyUrl: 'https://www.alphavantage.co/support/#api-key'
  },
  'Financial Modeling Prep': {
    required: true,
    freeTier: true,
    getKeyUrl: 'https://financialmodelingprep.com/developer/docs/'
  },
  'NewsAPI': {
    required: true,
    freeTier: true,
    getKeyUrl: 'https://newsapi.org/register'
  },
  'NSE India': {
    required: false,
    freeTier: true,
    getKeyUrl: ''
  },
  'Yahoo Finance': {
    required: false,
    freeTier: true,
    getKeyUrl: ''
  }
}

// Cost Summary
export const COST_SUMMARY = {
  hosting: { name: 'Vercel', cost: '$0/month', limit: '100GB bandwidth' },
  database: { name: 'Supabase', cost: '$0/month', limit: '500MB storage' },
  indianApis: { name: 'NSE/BSE/RBI', cost: '$0/month', limit: 'Unlimited' },
  yahooFinance: { name: 'Yahoo Finance', cost: '$0/month', limit: '~2000 calls/hour' },
  alphaVantage: { name: 'Alpha Vantage', cost: '$0/month', limit: '500 calls/day' },
  fmp: { name: 'FMP', cost: '$0/month', limit: '250 calls/day' },
  sec: { name: 'SEC Edgar', cost: '$0/month', limit: '10 req/sec' },
  worldBank: { name: 'World Bank', cost: '$0/month', limit: 'Unlimited' }
}

// Get all sources for a region
export function getSourcesForRegion(region: 'INDIA' | 'GLOBAL' | 'BOTH'): DataSourceConfig[] {
  if (region === 'INDIA') return INDIAN_SOURCES
  if (region === 'GLOBAL') return GLOBAL_SOURCES
  return [...INDIAN_SOURCES, ...GLOBAL_SOURCES]
}

// Get sources that don't require API keys
export function getFreeSources(region: 'INDIA' | 'GLOBAL' | 'BOTH'): DataSourceConfig[] {
  return getSourcesForRegion(region).filter(source =>
    !API_KEY_INFO[source.name]?.required
  )
}

export default {
  INDIAN_SOURCES,
  GLOBAL_SOURCES,
  SUPPLEMENTARY_SOURCES,
  API_KEY_INFO,
  COST_SUMMARY,
  getSourcesForRegion,
  getFreeSources
}
