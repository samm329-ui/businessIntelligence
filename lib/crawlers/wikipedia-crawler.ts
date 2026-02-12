// lib/crawlers/wikipedia-crawler.ts
// Enhanced Wikipedia crawler for comprehensive company/industry information
// Free API: https://en.wikipedia.org/api/rest_v1/

import { BaseCrawler, CrawlResult } from './base-crawler'

export interface WikipediaCompanyInfo {
  name: string
  type: string
  industry: string
  founded: string
  headquarters: string
  revenue: string
  employees: string
  operatingIncome?: string
  netIncome?: string
  totalAssets?: string
  totalEquity?: string
  parent?: string
  brands: string[]
  subsidiaries: string[]
  products: string[]
  services: string[]
  keyPeople: string[]
  website: string
  summary: string
  url: string
  pageViews?: number
  lastEdited?: string
}

export interface WikipediaIndustryInfo {
  name: string
  description: string
  keyPlayers: string[]
  marketSize: string
  growthRate: string
  regions: string[]
  url: string
}

export class WikipediaCrawler extends BaseCrawler {
  constructor() {
    super('Wikipedia', {
      timeout: 15000,
      retries: 2,
      rateLimitDelay: 500
    })
  }

  async crawl(query: string): Promise<CrawlResult> {
    try {
      console.log(`[Wikipedia] Searching for: ${query}`)
      
      const searchResult = await this.searchWikipedia(query)
      if (!searchResult) {
        return this.createErrorResult('No Wikipedia page found')
      }

      const summaryData = await this.getPageContentRest(searchResult.title)
      const wikiText = await this.getPageContent(searchResult.title)
      
      if (!wikiText && !summaryData) {
        return this.createErrorResult('Failed to fetch page content')
      }

      // Parse full page for financial data
      let parsedInfo: WikipediaCompanyInfo
      
      if (wikiText) {
        parsedInfo = this.parseFinancialData(wikiText, searchResult.title)
      } else {
        parsedInfo = {
          name: searchResult.title,
          type: '',
          industry: '',
          founded: '',
          headquarters: '',
          revenue: '',
          employees: '',
          brands: [],
          subsidiaries: [],
          products: [],
          services: [],
          keyPeople: [],
          website: '',
          summary: '',
          url: ''
        }
      }
      
      // Merge summary data
      parsedInfo.type = summaryData?.type || parsedInfo.type
      parsedInfo.website = summaryData?.content_urls?.desktop?.page || parsedInfo.website || `https://en.wikipedia.org/wiki/${searchResult.title.replace(/ /g, '_')}`
      parsedInfo.summary = summaryData?.extract || parsedInfo.summary
      parsedInfo.url = summaryData?.content_urls?.desktop?.page || parsedInfo.url || `https://en.wikipedia.org/wiki/${searchResult.title.replace(/ /g, '_')}`
      
      console.log(`[Wikipedia] Found: ${parsedInfo.name} | Revenue: ${parsedInfo.revenue || 'N/A'} | Employees: ${parsedInfo.employees || 'N/A'}`)
      
      return this.createSuccessResult(parsedInfo, 0.9)
    } catch (error) {
      console.error('[Wikipedia] Crawl failed:', error)
      return this.createErrorResult(error instanceof Error ? error.message : 'Unknown error')
    }
  }

  // Search Wikipedia for a query
  private async searchWikipedia(query: string): Promise<{title: string, pageId: number} | null> {
    try {
      const url = `https://en.wikipedia.org/w/api.php?action=query&list=search&srsearch=${encodeURIComponent(query)}&format=json&origin=*&srlimit=1`
      
      const response = await this.fetchWithRetry(url)
      const data = await response.json()
      
      if (data.query?.search?.length > 0) {
        return {
          title: data.query.search[0].title,
          pageId: data.query.search[0].pageid
        }
      }
    } catch (error) {
      console.warn('[Wikipedia] Search failed:', error)
    }
    
    return null
  }

  // Get page content using REST API (more structured)
  private async getPageContentRest(title: string): Promise<any | null> {
    try {
      // Use the page summary endpoint
      const summaryUrl = `https://en.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(title.replace(/ /g, '_'))}`
      
      const response = await this.fetchWithRetry(summaryUrl)
      if (response.ok) {
        const data = await response.json()
        return data
      }
    } catch (error) {
      console.warn('[Wikipedia] REST API failed:', error)
    }
    return null
  }

  // Get page content using Action API (raw wikitext) - FOR FINANCIAL DATA
  private async getPageContent(title: string): Promise<string> {
    try {
      const url = `https://en.wikipedia.org/w/api.php?action=query&prop=revisions&rvprop=content&format=json&rvslots=main&titles=${encodeURIComponent(title)}&origin=*`
      
      const response = await this.fetchWithRetry(url)
      const data = await response.json()
      
      const pages = data.query?.pages
      if (pages) {
        const pageId = Object.keys(pages)[0]
        return pages[pageId]?.revisions?.[0]?.slots?.main?.['*'] || ''
      }
    } catch (error) {
      console.warn('[Wikipedia] Content fetch failed:', error)
    }
    
    return ''
  }

  // Parse full page infobox for FINANCIAL DATA
  private parseFinancialData(wikiText: string, title: string): WikipediaCompanyInfo {
    const info: WikipediaCompanyInfo = {
      name: title,
      type: '',
      industry: '',
      founded: '',
      headquarters: '',
      revenue: '',
      employees: '',
      brands: [],
      subsidiaries: [],
      products: [],
      services: [],
      keyPeople: [],
      website: '',
      summary: '',
      url: `https://en.wikipedia.org/wiki/${title.replace(/ /g, '_')}`
    }

    const infoboxMatch = wikiText.match(/\{\{Infobox[^}]+\}\}/)
    if (infoboxMatch) {
      const infobox = infoboxMatch[0]
      
      const extractField = (fieldName: string): string => {
        const patterns = [
          new RegExp(`\\|\\s*${fieldName}\\s*=\\s*([^|}]+)`, 'i'),
          new RegExp(`\\|\\s*${fieldName}\\s*=\\s*\\[\\[([^\\]|]+)`, 'i')
        ]
        for (const pattern of patterns) {
          const match = infobox.match(pattern)
          if (match) {
            return this.cleanWikiText(match[1])
          }
        }
        return ''
      }

      info.revenue = extractField('revenue')
      info.operatingIncome = extractField('operating_income')
      info.netIncome = extractField('net_income')
      info.employees = extractField('num_employees') || extractField('employees')
      info.industry = extractField('industry')
      info.founded = extractField('founded')
      info.headquarters = extractField('headquarters') || extractField('location')
      info.parent = extractField('parent')

      const productsStr = extractField('products')
      if (productsStr) {
        info.products = productsStr.split(/[,;]/).map(p => p.trim()).filter(p => p.length > 0)
      }
    }

    // Extract summary
    const summaryMatch = wikiText.match(/\{\{Short description\|([^}]+)\}\}/)
    if (summaryMatch) {
      info.summary = this.cleanWikiText(summaryMatch[1])
    }

    return info
  }

  // Parse enhanced data from REST API response
  private parseEnhancedData(data: any, title: string): WikipediaCompanyInfo {
    const info: WikipediaCompanyInfo = {
      name: data.titles?.normalized || title,
      type: data.type || '',
      industry: '',
      founded: '',
      headquarters: '',
      revenue: '',
      employees: '',
      brands: [],
      subsidiaries: [],
      products: [],
      services: [],
      keyPeople: [],
      website: data.content_urls?.desktop?.page || `https://en.wikipedia.org/wiki/${title.replace(/ /g, '_')}`,
      summary: data.extract || '',
      url: data.content_urls?.desktop?.page || `https://en.wikipedia.org/wiki/${title.replace(/ /g, '_')}`
    }

    // Try to extract industry from description
    if (data.extract) {
      const industryPatterns = [
        /(?:is|are)\s+(?:an?|the)\s+([\w\s]+?)(?:\s+company|\s+corporation|\s+industry|\s+firm|\s+business)/i,
        /(?:operates\s+in|part\s+of)\s+(?:the\s+)?([\w\s]+?)(?:\s+industry|\s+sector|\s+market)/i
      ]

      for (const pattern of industryPatterns) {
        const match = data.extract.match(pattern)
        if (match) {
          info.industry = match[1].trim()
          break
        }
      }
    }

    return info
  }

  // Parse infobox from wikitext (fallback method)
  private parseInfobox(wikiText: string, title: string): WikipediaCompanyInfo {
    const info: WikipediaCompanyInfo = {
      name: title,
      type: '',
      industry: '',
      founded: '',
      headquarters: '',
      revenue: '',
      employees: '',
      brands: [],
      subsidiaries: [],
      products: [],
      services: [],
      keyPeople: [],
      website: '',
      summary: '',
      url: `https://en.wikipedia.org/wiki/${title.replace(/ /g, '_')}`
    }

    // Extract infobox using regex
    const infoboxMatch = wikiText.match(/\{\{Infobox[^}]+\}\}/)
    if (infoboxMatch) {
      const infobox = infoboxMatch[0]
      
      // Helper function to extract field
      const extractField = (fieldName: string): string => {
        const pattern = new RegExp(`\\|\\s*${fieldName}\\s*=\\s*([^|}]+)`)
        const match = infobox.match(pattern)
        return match ? this.cleanWikiText(match[1]) : ''
      }

      // Extract all fields
      info.type = extractField('type')
      info.industry = extractField('industry')
      info.founded = extractField('founded')
      info.headquarters = extractField('headquarters|location')
      info.revenue = extractField('revenue')
      info.operatingIncome = extractField('operating_income')
      info.netIncome = extractField('net_income')
      info.totalAssets = extractField('assets')
      info.totalEquity = extractField('equity')
      info.employees = extractField('num_employees')
      info.parent = extractField('parent')
      info.website = extractField('website')

      // Extract lists
      const brandsStr = extractField('brands')
      if (brandsStr) {
        info.brands = brandsStr.split(/[,;]/).map(b => b.trim()).filter(b => b.length > 0)
      }

      const productsStr = extractField('products')
      if (productsStr) {
        info.products = productsStr.split(/[,;]/).map(p => p.trim()).filter(p => p.length > 0)
      }

      const servicesStr = extractField('services')
      if (servicesStr) {
        info.services = servicesStr.split(/[,;]/).map(s => s.trim()).filter(s => s.length > 0)
      }

      const keyPeopleStr = extractField('key_people')
      if (keyPeopleStr) {
        info.keyPeople = keyPeopleStr.split(/[,;]/).map(p => p.trim()).filter(p => p.length > 0)
      }
    }

    // Extract summary from short description
    const summaryMatch = wikiText.match(/\{\{Short description\|([^}]+)\}\}/)
    if (summaryMatch) {
      info.summary = this.cleanWikiText(summaryMatch[1])
    }

    return info
  }

  private cleanWikiText(text: string): string {
    if (!text) return ''
    return text
      .replace(/\[\[([^\]|]+)\|?[^\]]*\]\]/g, '$1') // Remove wiki links
      .replace(/\{\{[^\}]+\}\}/g, '') // Remove templates
      .replace(/<[^>]+>/g, '') // Remove HTML
      .replace(/\s+/g, ' ') // Normalize whitespace
      .trim()
  }

  // Fetch industry information
  async crawlIndustry(industryName: string): Promise<WikipediaIndustryInfo | null> {
    try {
      const searchQuery = `${industryName} industry`
      const searchResult = await this.searchWikipedia(searchQuery)
      
      if (!searchResult) return null

      const pageData = await this.getPageContentRest(searchResult.title)
      if (!pageData) return null

      return {
        name: industryName,
        description: pageData.extract || '',
        keyPlayers: [],
        marketSize: '',
        growthRate: '',
        regions: [],
        url: pageData.content_urls?.desktop?.page || ''
      }
    } catch (error) {
      console.error('[Wikipedia] Industry crawl failed:', error)
      return null
    }
  }

  // Batch crawl multiple companies
  async batchCrawl(queries: string[]): Promise<Map<string, WikipediaCompanyInfo | null>> {
    const results = new Map<string, WikipediaCompanyInfo | null>()
    
    for (const query of queries) {
      try {
        const result = await this.crawl(query)
        if (result.success && result.data) {
          results.set(query, result.data as WikipediaCompanyInfo)
        } else {
          results.set(query, null)
        }
        
        // Respect rate limits
        await new Promise(resolve => setTimeout(resolve, 500))
      } catch (error) {
        console.warn(`[Wikipedia] Failed to crawl ${query}:`, error)
        results.set(query, null)
      }
    }
    
    return results
  }
}

export const wikipediaCrawler = new WikipediaCrawler()
export default wikipediaCrawler
