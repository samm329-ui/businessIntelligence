// lib/resolution/auto-discovery.ts
// Auto-discovers and learns about new companies/brands

import { supabase } from '../db'
import { wikipediaCrawler } from '../crawlers/wikipedia-crawler'

export class AutoDiscovery {
  
  /**
   * Discover a new company and add to database
   */
  async discoverCompany(companyName: string): Promise<{
    success: boolean
    message: string
    companyId?: string
  }> {
    console.log(`\n🔍 Auto-discovering: ${companyName}`)

    try {
      // Step 1: Check if already exists
      const { data: existing } = await supabase
        .from('companies')
        .select('id')
        .ilike('name', companyName)
        .limit(1)

      if (existing && existing.length > 0) {
        return { success: false, message: 'Company already exists' }
      }

      // Step 2: Crawl Wikipedia for info
      const wikiResult = await wikipediaCrawler.crawl(companyName)
      
      if (!wikiResult.success) {
        return { success: false, message: 'Could not find company info' }
      }

      const info = wikiResult.data

      // Step 3: Extract industry from Wikipedia data
      const industry = this.extractIndustry(info)

      // Step 4: Insert into database
      const { data: newCompany, error } = await supabase
        .from('companies')
        .insert({
          name: info.name || companyName,
          industry: industry,
          sector: industry,
          country: info.headquarters || 'India',
          is_public: true,
          data_quality_score: 50 // Initial score
        })
        .select()
        .single()

      if (error) {
        throw error
      }

      // Step 5: Insert brands if any
      if (info.brands && info.brands.length > 0) {
        for (const brandName of info.brands) {
          await supabase.from('brands').insert({
            name: brandName,
            company_id: newCompany.id,
            product_category: industry
          })
        }
      }

      console.log(`✅ Discovered and added: ${info.name}`)
      return {
        success: true,
        message: `Discovered ${info.name} in ${industry}`,
        companyId: newCompany.id
      }

    } catch (error) {
      console.error('Discovery failed:', error)
      return {
        success: false,
        message: error instanceof Error ? error.message : 'Discovery failed'
      }
    }
  }

  /**
   * Extract industry from Wikipedia data
   */
  private extractIndustry(info: any): string {
    const text = `${info.industry} ${info.type} ${info.summary}`.toLowerCase()
    
    const industryKeywords: Record<string, string[]> = {
      'FMCG': ['consumer', 'fmcg', 'food', 'beverage', 'personal care'],
      'Technology': ['software', 'technology', 'it services', 'digital'],
      'Banking': ['bank', 'financial', 'finance'],
      'Healthcare': ['pharma', 'healthcare', 'medical'],
      'Automobile': ['auto', 'automotive', 'vehicle'],
      'Energy': ['oil', 'gas', 'energy', 'power'],
      'Real Estate': ['real estate', 'construction', 'property']
    }

    for (const [industry, keywords] of Object.entries(industryKeywords)) {
      for (const keyword of keywords) {
        if (text.includes(keyword)) {
          return industry
        }
      }
    }

    return 'Unknown'
  }

  /**
   * Get suggestions for unknown queries
   */
  async getSuggestions(query: string): Promise<string[]> {
    const { data: brands } = await supabase
      .from('brands')
      .select('name')
      .ilike('name', `%${query}%`)
      .limit(5)

    const { data: companies } = await supabase
      .from('companies')
      .select('name')
      .ilike('name', `%${query}%`)
      .limit(5)

    return [
      ...(brands?.map(b => b.name) || []),
      ...(companies?.map(c => c.name) || [])
    ]
  }
}

export const autoDiscovery = new AutoDiscovery()
export default autoDiscovery
