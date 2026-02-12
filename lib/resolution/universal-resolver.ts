// lib/resolution/universal-resolver.ts
// Universal resolver that handles ANY company, brand, or industry

import { wikipediaCrawler } from '../crawlers/wikipedia-crawler'
import { crawlerOrchestrator } from '../crawlers/crawler-orchestrator'
import { lookupBrand } from './brand-knowledge-base'
import { supabase } from '../db'
import { companyDatabase, CompanyRecord } from '../datasets/company-database'

export interface UniversalResolution {
  query: string
  entityType: 'brand' | 'company' | 'industry' | 'unknown'
  name: string
  industry: string
  sector: string
  ticker?: string
  exchange?: string
  parentCompany?: string
  confidence: number
  source: string
  competitors: Array<{
    name: string
    ticker: string
    sector: string
  }>
}

// Industry keywords mapping for dynamic detection
const INDUSTRY_KEYWORDS: Record<string, string[]> = {
  'FMCG': ['consumer goods', 'fmcg', 'food', 'beverage', 'personal care', 'home care', 'detergent', 'soap', 'shampoo'],
  'Technology': ['software', 'it services', 'technology', 'digital', 'saas', 'cloud', 'ai', 'tech'],
  'Banking': ['bank', 'financial services', 'finance', 'nbfc', 'insurance', 'fintech'],
  'Automobile': ['automotive', 'auto', 'car', 'vehicle', 'motor', 'ev', 'electric vehicle'],
  'Healthcare': ['pharma', 'pharmaceutical', 'healthcare', 'medical', 'hospital', 'biotech'],
  'Energy': ['oil', 'gas', 'petroleum', 'renewable', 'solar', 'wind', 'power', 'energy'],
  'Real Estate': ['real estate', 'property', 'construction', 'infrastructure', 'housing'],
  'Manufacturing': ['steel', 'cement', 'chemical', 'textile', 'manufacturing', 'industrial'],
  'Telecom': ['telecom', 'telecommunications', 'mobile', 'broadband', 'internet'],
  'Retail': ['retail', 'e-commerce', 'shopping', 'marketplace', 'store']
}

export class UniversalResolver {
  
  /**
   * Resolve ANY query - brand, company, or industry
   */
  async resolve(query: string): Promise<UniversalResolution> {
    console.log(`\n🔍 Universal Resolver: "${query}"`)
    
    // Load company database if not already loaded
    if (!companyDatabase.isLoaded()) {
      await companyDatabase.load()
    }
    
    // Step 1: Check comprehensive CSV database (995 companies)
    const csvResult = await this.tryCSVDatabaseResolution(query)
    if (csvResult.confidence > 0.85) {
      console.log(`✓ Resolved from CSV Database: ${csvResult.name} (${csvResult.industry})`)
      return csvResult
    }
    
    // Step 2: Check if it's a known brand
    const brandResult = await this.tryBrandResolution(query)
    if (brandResult.confidence > 0.8) {
      console.log(`✓ Resolved as brand: ${brandResult.name}`)
      return brandResult
    }
    
    // Step 3: Try Wikipedia crawl for company info
    const wikiResult = await this.tryWikipediaResolution(query)
    if (wikiResult.confidence > 0.7) {
      console.log(`✓ Resolved via Wikipedia: ${wikiResult.name}`)
      return wikiResult
    }
    
    // Step 4: Check Supabase database
    const dbResult = await this.tryDatabaseResolution(query)
    if (dbResult.confidence > 0.6) {
      console.log(`✓ Resolved from database: ${dbResult.name}`)
      return dbResult
    }
    
    // Step 5: Use CSV result if available (lower confidence)
    if (csvResult.confidence > 0.5) {
      console.log(`✓ Resolved from CSV Database (partial): ${csvResult.name}`)
      return csvResult
    }
    
    // Step 6: Dynamic industry detection
    const dynamicResult = await this.tryDynamicResolution(query)
    if (dynamicResult.confidence > 0.5) {
      console.log(`✓ Dynamic resolution: ${dynamicResult.industry}`)
      return dynamicResult
    }
    
    // Step 7: Unknown - return generic
    console.log(`⚠ Unknown entity, returning generic`)
    return this.createUnknownResolution(query)
  }
  
  private async tryCSVDatabaseResolution(query: string): Promise<UniversalResolution> {
    try {
      // First try exact match
      let company = companyDatabase.getCompanyByName(query)
      
      // If no exact match, search
      if (!company) {
        const results = companyDatabase.searchCompanies(query)
        if (results.length > 0) {
          company = results[0]
        }
      }
      
      if (company) {
        // Get similar companies as competitors
        const similarCompanies = companyDatabase.getSimilarCompanies(company.companyName, 10)
        const competitors = similarCompanies.map(c => ({
          name: c.companyName,
          ticker: 'N/A', // CSV doesn't have ticker data
          sector: c.industryName
        }))
        
        // Calculate confidence based on match quality
        const normalizedQuery = query.toLowerCase().trim()
        const normalizedCompany = company.normalizedCompanyName
        let confidence = 0.7
        
        if (normalizedCompany === normalizedQuery) {
          confidence = 0.95
        } else if (normalizedCompany.startsWith(normalizedQuery)) {
          confidence = 0.9
        } else if (normalizedCompany.includes(normalizedQuery)) {
          confidence = 0.85
        }
        
        return {
          query,
          entityType: 'company',
          name: company.companyName,
          industry: company.industryName,
          sector: company.industryName,
          ticker: undefined,
          exchange: company.country === 'India' ? 'NSE/BSE' : 
                   company.country === 'USA' ? 'NYSE/NASDAQ' : undefined,
          parentCompany: undefined,
          confidence,
          source: 'comprehensive_csv_database',
          competitors: competitors.length > 0 ? competitors : await this.getCompetitorsForIndustry(company.industryName)
        }
      }
      
      // Check if query matches an industry name
      const allIndustries = companyDatabase.getAllIndustries()
      const matchingIndustry = allIndustries.find(ind => 
        ind.toLowerCase() === query.toLowerCase() ||
        ind.toLowerCase().includes(query.toLowerCase()) ||
        query.toLowerCase().includes(ind.toLowerCase())
      )
      
      if (matchingIndustry) {
        const industryStats = companyDatabase.getIndustryStats(matchingIndustry)
        if (industryStats) {
          const competitors = industryStats.topCompanies.map(c => ({
            name: c.companyName,
            ticker: 'N/A',
            sector: matchingIndustry
          }))
          
          return {
            query,
            entityType: 'industry',
            name: matchingIndustry,
            industry: matchingIndustry,
            sector: matchingIndustry,
            confidence: 0.88,
            source: 'comprehensive_csv_database',
            competitors: competitors.length > 0 ? competitors : await this.getCompetitorsForIndustry(matchingIndustry)
          }
        }
      }
    } catch (error) {
      console.warn('CSV Database lookup failed:', error)
    }
    
    return this.createEmptyResolution(query)
  }
  
  private async tryBrandResolution(query: string): Promise<UniversalResolution> {
    const brand = lookupBrand(query)
    
    if (brand) {
      return {
        query,
        entityType: 'brand',
        name: brand.brandName,
        industry: brand.industry,
        sector: brand.sector,
        ticker: brand.ticker,
        exchange: brand.exchange,
        parentCompany: brand.parentCompanyName,
        confidence: 1.0,
        source: 'brand_knowledge_base',
        competitors: await this.getCompetitorsForIndustry(brand.industry)
      }
    }
    
    return this.createEmptyResolution(query)
  }
  
  private async tryWikipediaResolution(query: string): Promise<UniversalResolution> {
    try {
      const wikiResult = await wikipediaCrawler.crawl(query)
      
      if (wikiResult.success && wikiResult.data) {
        const data = wikiResult.data
        const detectedIndustry = this.detectIndustryFromText(
          `${data.industry} ${data.summary} ${data.type}`
        )
        
        return {
          query,
          entityType: 'company',
          name: data.name,
          industry: detectedIndustry || 'Unknown',
          sector: detectedIndustry || 'Unknown',
          ticker: undefined, // Would need separate API
          exchange: undefined,
          parentCompany: data.parent,
          confidence: wikiResult.confidence / 100,
          source: 'wikipedia',
          competitors: await this.getCompetitorsForIndustry(detectedIndustry || 'Unknown')
        }
      }
    } catch (error) {
      console.warn('Wikipedia crawl failed:', error)
    }
    
    return this.createEmptyResolution(query)
  }
  
  private async tryDatabaseResolution(query: string): Promise<UniversalResolution> {
    try {
      // Search in companies table
      const { data: companies } = await supabase
        .from('companies')
        .select('*, parent_companies(name)')
        .ilike('name', `%${query}%`)
        .limit(1)
      
      if (companies && companies.length > 0) {
        const company = companies[0]
        return {
          query,
          entityType: 'company',
          name: company.name,
          industry: company.industry || 'Unknown',
          sector: company.sector || 'Unknown',
          ticker: company.ticker,
          exchange: company.exchange,
          parentCompany: company.parent_companies?.name,
          confidence: 0.8,
          source: 'database',
          competitors: await this.getCompetitorsForIndustry(company.industry || 'Unknown')
        }
      }
      
      // Search in brands table
      const { data: brands } = await supabase
        .from('brands')
        .select('*, companies(*)')
        .ilike('name', `%${query}%`)
        .limit(1)
      
      if (brands && brands.length > 0) {
        const brand = brands[0]
        return {
          query,
          entityType: 'brand',
          name: brand.name,
          industry: brand.product_category || 'Unknown',
          sector: 'FMCG',
          ticker: brand.companies?.ticker,
          exchange: brand.companies?.exchange,
          parentCompany: brand.companies?.name,
          confidence: 0.8,
          source: 'database',
          competitors: await this.getCompetitorsForIndustry(brand.product_category || 'FMCG')
        }
      }
    } catch (error) {
      console.warn('Database lookup failed:', error)
    }
    
    return this.createEmptyResolution(query)
  }
  
  private async tryDynamicResolution(query: string): Promise<UniversalResolution> {
    const normalizedQuery = query.toLowerCase()
    
    // Try keyword matching
    for (const [industry, keywords] of Object.entries(INDUSTRY_KEYWORDS)) {
      for (const keyword of keywords) {
        if (normalizedQuery.includes(keyword.toLowerCase())) {
          return {
            query,
            entityType: 'industry',
            name: query,
            industry: industry,
            sector: industry,
            confidence: 0.6,
            source: 'dynamic_detection',
            competitors: await this.getCompetitorsForIndustry(industry)
          }
        }
      }
    }
    
    return this.createEmptyResolution(query)
  }
  
  private detectIndustryFromText(text: string): string | null {
    if (!text) return null
    
    const lowerText = text.toLowerCase()
    
    for (const [industry, keywords] of Object.entries(INDUSTRY_KEYWORDS)) {
      for (const keyword of keywords) {
        if (lowerText.includes(keyword.toLowerCase())) {
          return industry
        }
      }
    }
    
    return null
  }
  
  private async getCompetitorsForIndustry(industry: string): Promise<Array<{name: string; ticker: string; sector: string}>> {
    // Comprehensive competitor lists for all industries
    const competitors: Record<string, Array<{name: string; ticker: string; sector: string}>> = {
      'FMCG': [
        { name: 'Hindustan Unilever', ticker: 'HINDUNILVR', sector: 'FMCG' },
        { name: 'ITC Limited', ticker: 'ITC', sector: 'FMCG' },
        { name: 'Nestle India', ticker: 'NESTLEIND', sector: 'FMCG' },
        { name: 'Britannia Industries', ticker: 'BRITANNIA', sector: 'FMCG' },
        { name: 'Godrej Consumer', ticker: 'GODREJCP', sector: 'FMCG' },
        { name: 'Dabur India', ticker: 'DABUR', sector: 'FMCG' },
        { name: 'Marico', ticker: 'MARICO', sector: 'FMCG' },
        { name: 'Colgate-Palmolive', ticker: 'COLPAL', sector: 'FMCG' },
        { name: 'Emami', ticker: 'EMAMI', sector: 'FMCG' },
        { name: 'Tata Consumer', ticker: 'TATACONSUM', sector: 'FMCG' }
      ],
      'Food Processing': [
        { name: 'Nestle India', ticker: 'NESTLEIND', sector: 'FMCG' },
        { name: 'Britannia Industries', ticker: 'BRITANNIA', sector: 'FMCG' },
        { name: 'Hindustan Unilever', ticker: 'HINDUNILVR', sector: 'FMCG' },
        { name: 'ITC Limited', ticker: 'ITC', sector: 'FMCG' },
        { name: 'Tata Consumer', ticker: 'TATACONSUM', sector: 'FMCG' },
        { name: 'Dabur India', ticker: 'DABUR', sector: 'FMCG' },
        { name: 'Marico', ticker: 'MARICO', sector: 'FMCG' },
        { name: 'Godrej Consumer', ticker: 'GODREJCP', sector: 'FMCG' },
        { name: 'Jyothy Labs', ticker: 'JYOTHYLAB', sector: 'FMCG' },
        { name: 'Prataap Snacks', ticker: 'DIAMONDYD', sector: 'FMCG' }
      ],
      'Technology': [
        { name: 'TCS', ticker: 'TCS', sector: 'Technology' },
        { name: 'Infosys', ticker: 'INFY', sector: 'Technology' },
        { name: 'HCL Technologies', ticker: 'HCLTECH', sector: 'Technology' },
        { name: 'Wipro', ticker: 'WIPRO', sector: 'Technology' },
        { name: 'Tech Mahindra', ticker: 'TECHM', sector: 'Technology' },
        { name: 'LTIMindtree', ticker: 'LTIM', sector: 'Technology' },
        { name: 'Persistent Systems', ticker: 'PERSISTENT', sector: 'Technology' },
        { name: 'Coforge', ticker: 'COFORGE', sector: 'Technology' },
        { name: 'Mphasis', ticker: 'MPHASIS', sector: 'Technology' },
        { name: 'KPIT Tech', ticker: 'KPITTECH', sector: 'Technology' }
      ],
      'Banking': [
        { name: 'HDFC Bank', ticker: 'HDFCBANK', sector: 'Banking' },
        { name: 'ICICI Bank', ticker: 'ICICIBANK', sector: 'Banking' },
        { name: 'State Bank of India', ticker: 'SBIN', sector: 'Banking' },
        { name: 'Kotak Mahindra Bank', ticker: 'KOTAKBANK', sector: 'Banking' },
        { name: 'Axis Bank', ticker: 'AXISBANK', sector: 'Banking' },
        { name: 'IndusInd Bank', ticker: 'INDUSINDBK', sector: 'Banking' },
        { name: 'Yes Bank', ticker: 'YESBANK', sector: 'Banking' },
        { name: 'Punjab National Bank', ticker: 'PNB', sector: 'Banking' },
        { name: 'Bank of Baroda', ticker: 'BANKBARODA', sector: 'Banking' },
        { name: 'Canara Bank', ticker: 'CANBK', sector: 'Banking' }
      ],
      'Automobile': [
        { name: 'Maruti Suzuki', ticker: 'MARUTI', sector: 'Automobile' },
        { name: 'Tata Motors', ticker: 'TATAMOTORS', sector: 'Automobile' },
        { name: 'Mahindra & Mahindra', ticker: 'M&M', sector: 'Automobile' },
        { name: 'Hero MotoCorp', ticker: 'HEROMOTOCO', sector: 'Automobile' },
        { name: 'Bajaj Auto', ticker: 'BAJAJ-AUTO', sector: 'Automobile' },
        { name: 'TVS Motor', ticker: 'TVSMOTOR', sector: 'Automobile' },
        { name: 'Eicher Motors', ticker: 'EICHERMOT', sector: 'Automobile' },
        { name: 'Ashok Leyland', ticker: 'ASHOKLEY', sector: 'Automobile' },
        { name: 'MRF', ticker: 'MRF', sector: 'Automobile' },
        { name: 'Bosch', ticker: 'BOSCHLTD', sector: 'Automobile' }
      ],
      'Healthcare': [
        { name: 'Sun Pharma', ticker: 'SUNPHARMA', sector: 'Healthcare' },
        { name: 'Cipla', ticker: 'CIPLA', sector: 'Healthcare' },
        { name: 'Dr Reddys Labs', ticker: 'DRREDDY', sector: 'Healthcare' },
        { name: 'Lupin', ticker: 'LUPIN', sector: 'Healthcare' },
        { name: 'Aurobindo Pharma', ticker: 'AUROPHARMA', sector: 'Healthcare' },
        { name: 'Torrent Pharma', ticker: 'TORNTPHARM', sector: 'Healthcare' },
        { name: 'Zydus Lifesciences', ticker: 'ZYDUSLIFE', sector: 'Healthcare' },
        { name: 'Biocon', ticker: 'BIOCON', sector: 'Healthcare' },
        { name: 'Alkem Labs', ticker: 'ALKEM', sector: 'Healthcare' },
        { name: 'Apollo Hospitals', ticker: 'APOLLOHOSP', sector: 'Healthcare' }
      ],
      'Energy': [
        { name: 'Reliance Industries', ticker: 'RELIANCE', sector: 'Energy' },
        { name: 'NTPC', ticker: 'NTPC', sector: 'Energy' },
        { name: 'Power Grid Corp', ticker: 'POWERGRID', sector: 'Energy' },
        { name: 'Adani Green Energy', ticker: 'ADANIGREEN', sector: 'Energy' },
        { name: 'Tata Power', ticker: 'TATAPOWER', sector: 'Energy' },
        { name: 'JSW Energy', ticker: 'JSWENERGY', sector: 'Energy' },
        { name: 'NHPC', ticker: 'NHPC', sector: 'Energy' },
        { name: 'SJVN', ticker: 'SJVN', sector: 'Energy' },
        { name: 'Torrent Power', ticker: 'TORNTPOWER', sector: 'Energy' },
        { name: 'CESC', ticker: 'CESC', sector: 'Energy' }
      ],
      'Real Estate': [
        { name: 'DLF', ticker: 'DLF', sector: 'Real Estate' },
        { name: 'Godrej Properties', ticker: 'GODREJPROP', sector: 'Real Estate' },
        { name: 'Oberoi Realty', ticker: 'OBEROIRLTY', sector: 'Real Estate' },
        { name: 'Prestige Estates', ticker: 'PRESTIGE', sector: 'Real Estate' },
        { name: 'Sobha', ticker: 'SOBHA', sector: 'Real Estate' },
        { name: 'Phoenix Mills', ticker: 'PHOENIXLTD', sector: 'Real Estate' },
        { name: 'Brigade Enterprises', ticker: 'BRIGADE', sector: 'Real Estate' },
        { name: 'Mahindra Lifespace', ticker: 'MAHLIFE', sector: 'Real Estate' },
        { name: 'Sunteck Realty', ticker: 'SUNTECK', sector: 'Real Estate' },
        { name: 'Puravankara', ticker: 'PURVA', sector: 'Real Estate' }
      ],
      'Telecom': [
        { name: 'Bharti Airtel', ticker: 'BHARTIARTL', sector: 'Telecom' },
        { name: 'Reliance Jio', ticker: 'RELIANCE', sector: 'Telecom' },
        { name: 'Vodafone Idea', ticker: 'IDEA', sector: 'Telecom' },
        { name: 'MTNL', ticker: 'MTNL', sector: 'Telecom' },
        { name: 'Tata Communications', ticker: 'TATACOMM', sector: 'Telecom' }
      ],
      'Unknown': [
        { name: 'Reliance Industries', ticker: 'RELIANCE', sector: 'Conglomerate' },
        { name: 'Tata Consultancy Services', ticker: 'TCS', sector: 'Technology' },
        { name: 'HDFC Bank', ticker: 'HDFCBANK', sector: 'Banking' },
        { name: 'Infosys', ticker: 'INFY', sector: 'Technology' },
        { name: 'ICICI Bank', ticker: 'ICICIBANK', sector: 'Banking' },
        { name: 'ITC Limited', ticker: 'ITC', sector: 'FMCG' },
        { name: 'Kotak Mahindra Bank', ticker: 'KOTAKBANK', sector: 'Banking' },
        { name: 'Larsen & Toubro', ticker: 'LT', sector: 'Infrastructure' },
        { name: 'HCL Technologies', ticker: 'HCLTECH', sector: 'Technology' },
        { name: 'Axis Bank', ticker: 'AXISBANK', sector: 'Banking' }
      ]
    }
    
    return competitors[industry] || competitors['Unknown']
  }
  
  private createEmptyResolution(query: string): UniversalResolution {
    return {
      query,
      entityType: 'unknown',
      name: query,
      industry: 'Unknown',
      sector: 'Unknown',
      confidence: 0,
      source: 'none',
      competitors: []
    }
  }
  
  private createUnknownResolution(query: string): UniversalResolution {
    return {
      query,
      entityType: 'unknown',
      name: query,
      industry: 'Unknown',
      sector: 'Unknown',
      confidence: 0.3,
      source: 'fallback',
      competitors: [
        { name: 'Reliance Industries', ticker: 'RELIANCE', sector: 'Conglomerate' },
        { name: 'TCS', ticker: 'TCS', sector: 'Technology' },
        { name: 'HDFC Bank', ticker: 'HDFCBANK', sector: 'Banking' },
        { name: 'Infosys', ticker: 'INFY', sector: 'Technology' },
        { name: 'ICICI Bank', ticker: 'ICICIBANK', sector: 'Banking' }
      ]
    }
  }
}

export const universalResolver = new UniversalResolver()
export default universalResolver
