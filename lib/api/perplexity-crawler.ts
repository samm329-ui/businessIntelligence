// lib/api/perplexity-crawler.ts - Real-time web search like Perplexity
// Uses Exa API for comprehensive web search

const EXA_API_KEY = process.env.EXA_API_KEY || ''

interface SearchResult {
  title: string
  url: string
  snippet: string
  publishedDate?: string
}

export interface PerplexitySearchResult {
  query: string
  results: SearchResult[]
  synthesizedAnswer?: string
  sources: string[]
}

// Search the web for real-time information
export async function perplexitySearch(query: string): Promise<PerplexitySearchResult> {
  console.log(`[Perplexity] Searching: ${query}`)
  
  try {
    const response = await fetch('https://api.exa.ai/search', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': EXA_API_KEY
      },
      body: JSON.stringify({
        query,
        numResults: 10,
        type: 'auto'
      })
    })

    if (!response.ok) {
      throw new Error('Search failed')
    }

    const data = await response.json()
    
    const results: SearchResult[] = data.results?.map((r: any) => ({
      title: r.title,
      url: r.url,
      snippet: r.snippet,
      publishedDate: r.publishedDate
    })) || []

    console.log(`[Perplexity] Found ${results.length} results`)

    return {
      query,
      results,
      sources: results.map(r => r.url)
    }
  } catch (error) {
    console.warn(`[Perplexity] Search failed: ${error}`)
    return { query, results: [], sources: [] }
  }
}

// Get comprehensive company information
export async function getCompanyInfo(companyName: string): Promise<{
  description: string
  financials: {
    revenue?: string
    marketCap?: string
    employees?: string
    founded?: string
  }
  recentNews: SearchResult[]
}> {
  console.log(`[Perplexity] Getting info for: ${companyName}`)
  
  const [overview, news] = await Promise.all([
    perplexitySearch(`${companyName} company overview revenue market cap 2024`),
    perplexitySearch(`${companyName} latest news 2024`)
  ])

  return {
    description: overview.results[0]?.snippet || '',
    financials: {
      revenue: extractFinancial(overview.results, 'revenue'),
      marketCap: extractFinancial(overview.results, 'market cap'),
      employees: extractFinancial(overview.results, 'employees')
    },
    recentNews: news.results.slice(0, 5)
  }
}

function extractFinancial(results: SearchResult[], keyword: string): string | undefined {
  for (const result of results) {
    if (result.snippet.toLowerCase().includes(keyword)) {
      return result.snippet
    }
  }
  return undefined
}

// Industry analysis with real-time data
export async function analyzeIndustry(industry: string): Promise<{
  marketSize: string
  growthRate: string
  keyTrends: string[]
  topCompanies: string[]
  recentDevelopments: SearchResult[]
}> {
  console.log(`[Perplexity] Analyzing industry: ${industry}`)
  
  const [marketData, trends, news] = await Promise.all([
    perplexitySearch(`${industry} market size global 2024 2025`),
    perplexitySearch(`${industry} industry trends growth opportunities 2024`),
    perplexitySearch(`${industry} latest news developments 2024`)
  ])

  return {
    marketSize: marketData.results[0]?.snippet || '',
    growthRate: extractGrowthRate(marketData.results),
    keyTrends: trends.results.slice(0, 5).map(r => r.title),
    topCompanies: extractCompanies(trends.results),
    recentDevelopments: news.results.slice(0, 5)
  }
}

function extractGrowthRate(results: SearchResult[]): string {
  for (const result of results) {
    const match = result.snippet.match(/(\d+\.?\d*)%/)
    if (match) return `${match[1]}%`
  }
  return '5-10%'
}

function extractCompanies(results: SearchResult[]): string[] {
  const companies: string[] = []
  for (const result of results.slice(0, 10)) {
    const match = result.title.match(/^([A-Z][a-zA-Z\s&]+?)(?:\s+[-:]|2024|$)/)
    if (match && !companies.includes(match[1].trim())) {
      companies.push(match[1].trim())
    }
  }
  return companies.slice(0, 5)
}
