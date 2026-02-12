// lib/utils/web-search.ts - Web search wrapper using Exa

export interface SearchResult {
  title: string
  url: string
  snippet?: string
}

export async function websearch(query: string, numResults: number = 5): Promise<SearchResult[]> {
  try {
    const results = await fetch(`https://api.exa.ai/search`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': process.env.EXA_API_KEY || ''
      },
      body: JSON.stringify({
        query,
        numResults,
        type: 'auto'
      })
    }).then(r => r.json())

    if (results.results) {
      return results.results.map((r: any) => ({
        title: r.title,
        url: r.url,
        snippet: r.snippet
      }))
    }
  } catch (error) {
    console.warn('Web search failed:', error)
  }
  return []
}

// Alternative: Use News API for company searches
export async function searchCompany(companyName: string): Promise<SearchResult | null> {
  try {
    const results = await websearch(`${companyName} stock ticker market cap`, 1)
    return results[0] || null
  } catch {
    return null
  }
}
