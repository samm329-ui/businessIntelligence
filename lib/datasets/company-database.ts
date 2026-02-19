// lib/datasets/company-database.ts
// Comprehensive company database loaded from CSV
// Contains 995 real companies across 29 industries and 27 countries
// Server-side only - use API routes for client access

export interface CompanyRecord {
  companyName: string
  normalizedCompanyName: string
  industryName: string
  normalizedIndustryName: string
  subIndustry: string
  country: string
  source: string
  confidenceScore: number
  verified: boolean
}

export interface IndustryGroup {
  industryName: string
  companies: CompanyRecord[]
  subIndustries: string[]
  countries: string[]
}

// In-memory storage (will be populated server-side)
let companiesData: CompanyRecord[] = []
let industryMapData: Map<string, IndustryGroup> = new Map()
let companyNameMapData: Map<string, CompanyRecord> = new Map()
let isDataLoaded = false

// Parse CSV line
function parseCSVLine(line: string): string[] {
  const values: string[] = []
  let current = ''
  let inQuotes = false
  
  for (let i = 0; i < line.length; i++) {
    const char = line[i]
    
    if (char === '"') {
      inQuotes = !inQuotes
    } else if (char === ',' && !inQuotes) {
      values.push(current.trim())
      current = ''
    } else {
      current += char
    }
  }
  
  values.push(current.trim())
  return values
}

// Load CSV data (SERVER-SIDE ONLY)
export async function loadCompanyDatabase(): Promise<boolean> {
  if (isDataLoaded) return true
  
  // Only run on server
  if (typeof window !== 'undefined') {
    console.warn('Company database can only be loaded server-side')
    return false
  }

  try {
    // Dynamic import to avoid client-side issues
    const fs = await import('fs/promises')
    const path = await import('path')
    
    const possiblePaths = [
      path.resolve(process.cwd(), 'datasets', 'all_real_companies_combined.csv'),
      path.resolve(process.cwd(), '..', 'business-intelligence', 'datasets', 'all_real_companies_combined.csv'),
      path.resolve(process.cwd(), 'data', 'all_real_companies_combined.csv'),
      path.resolve(process.cwd(), '..', '..', 'business-intelligence', 'datasets', 'all_real_companies_combined.csv'),
      'C:\\Users\\jishu\\Downloads\\all_real_companies_combined.csv',
    ]

    let csvContent: string | null = null

    for (const filePath of possiblePaths) {
      try {
        csvContent = await fs.readFile(filePath, 'utf-8')
        console.log(`✅ Loaded company database from: ${filePath}`)
        break
      } catch (e) {
        // Try next path
      }
    }

    if (!csvContent) {
      console.warn('⚠️ Could not load CSV file')
      return false
    }

    // Parse CSV
    const lines = csvContent.split('\n').filter(line => line.trim())
    
    for (let i = 1; i < lines.length; i++) {
      const line = lines[i]
      const values = parseCSVLine(line)
      
      if (values.length >= 9) {
        const company: CompanyRecord = {
          companyName: values[0],
          normalizedCompanyName: values[1],
          industryName: values[2],
          normalizedIndustryName: values[3],
          subIndustry: values[4],
          country: values[5],
          source: values[6],
          confidenceScore: parseInt(values[7]) || 100,
          verified: values[8]?.toLowerCase() === 'true'
        }

        companiesData.push(company)
        companyNameMapData.set(company.normalizedCompanyName, company)
        
        // Group by industry
        if (!industryMapData.has(company.industryName)) {
          industryMapData.set(company.industryName, {
            industryName: company.industryName,
            companies: [],
            subIndustries: [],
            countries: []
          })
        }
        
        const industryGroup = industryMapData.get(company.industryName)!
        industryGroup.companies.push(company)
        
        if (!industryGroup.subIndustries.includes(company.subIndustry)) {
          industryGroup.subIndustries.push(company.subIndustry)
        }
        
        if (!industryGroup.countries.includes(company.country)) {
          industryGroup.countries.push(company.country)
        }
      }
    }

    isDataLoaded = true
    console.log(`✅ Loaded ${companiesData.length} companies across ${industryMapData.size} industries`)
    return true
  } catch (error) {
    console.error('Error loading company database:', error)
    return false
  }
}

// Search companies (works on both server and client if data is loaded)
export function searchCompanies(query: string, options?: {
  country?: string;
  industry?: string;
  minConfidence?: number;
  limit?: number;
}): CompanyRecord[] {
  if (!isDataLoaded || companiesData.length === 0) {
    console.warn('[CompanyDB] Database not loaded, cannot search')
    return []
  }

  const normalizedQuery = query.toLowerCase().trim().replace(/[^a-z0-9\s]/g, '')
  if (!normalizedQuery && !options?.country && !options?.industry) return []

  console.log(`[CompanyDB] Searching for: "${normalizedQuery}" in ${companiesData.length} companies`)

  const results: CompanyRecord[] = []
  const seen = new Set<string>()
  const queryTokens = normalizedQuery.split(/\s+/).filter(t => t.length > 1)

  for (const company of companiesData) {
    if (seen.has(company.companyName)) continue

    // Apply filters first
    if (options?.country && !company.country.toLowerCase().includes(options.country.toLowerCase())) continue
    if (options?.industry && !company.industryName.toLowerCase().includes(options.industry.toLowerCase())) continue
    if (options?.minConfidence && company.confidenceScore < options.minConfidence) continue

    // Clean normalized names for comparison (remove special chars)
    const cleanNormalizedName = company.normalizedCompanyName.replace(/[^a-z0-9\s]/g, '')
    const cleanCompanyName = company.companyName.toLowerCase().replace(/[^a-z0-9\s]/g, '')
    
    // Check various match types - case insensitive
    const nameMatch = cleanNormalizedName.includes(normalizedQuery) || 
                      normalizedQuery.includes(cleanNormalizedName) ||
                      cleanCompanyName.includes(normalizedQuery) ||
                      // Fuzzy match - partial word match
                      cleanNormalizedName.split(' ').some(w => w.startsWith(normalizedQuery.split(' ')[0])) ||
                      cleanCompanyName.split(' ').some(w => w.startsWith(normalizedQuery.split(' ')[0]))
    const industryMatch = company.normalizedIndustryName.includes(normalizedQuery)
    const subIndustryMatch = company.subIndustry.toLowerCase().replace(/[^a-z0-9\s]/g, '').includes(normalizedQuery)
    
    // Token matching - match if most query tokens are in company name
    const companyTokens = cleanNormalizedName.split(/\s+/)
    const matchingTokens = queryTokens.filter(qt => 
      companyTokens.some(ct => ct.includes(qt) || qt.includes(ct))
    )
    const tokenMatch = queryTokens.length > 0 && matchingTokens.length >= Math.min(1, queryTokens.length)
    
    if (nameMatch || industryMatch || subIndustryMatch || tokenMatch) {
      results.push(company)
      seen.add(company.companyName)
    }
  }

  console.log(`[CompanyDB] Found ${results.length} matches`)

  // Sort by relevance - case insensitive scoring
  return results.sort((a, b) => {
    const aClean = a.normalizedCompanyName.replace(/[^a-z0-9\s]/g, '')
    const bClean = b.normalizedCompanyName.replace(/[^a-z0-9\s]/g, '')
    
    // Exact match gets highest score
    const aExact = aClean === normalizedQuery ? 10 : 
                   aClean.startsWith(normalizedQuery) ? 8 : 
                   aClean.includes(normalizedQuery) ? 5 : 0
    const bExact = bClean === normalizedQuery ? 10 : 
                   bClean.startsWith(normalizedQuery) ? 8 : 
                   bClean.includes(normalizedQuery) ? 5 : 0
    
    // Confidence boost
    const aConf = a.confidenceScore / 100
    const bConf = b.confidenceScore / 100
    
    // Verified boost
    const aVerified = a.verified ? 2 : 0
    const bVerified = b.verified ? 2 : 0
    
    return (bExact + bConf + bVerified) - (aExact + aConf + aVerified)
  }).slice(0, options?.limit || 20)
} 

// Get company by name
export function getCompanyByName(name: string): CompanyRecord | undefined {
  if (!isDataLoaded) return undefined
  
  const normalized = name.toLowerCase().trim()
  return companyNameMapData.get(normalized) || 
         companiesData.find(c => c.companyName.toLowerCase() === normalized)
}

// Get companies by industry
export function getCompaniesByIndustry(industryName: string): CompanyRecord[] {
  if (!isDataLoaded) return []
  
  const group = industryMapData.get(industryName)
  return group?.companies || []
}

// Get all industries
export function getAllIndustries(): string[] {
  if (!isDataLoaded) return []
  
  return Array.from(industryMapData.keys()).sort()
}

// Get industry statistics
export function getIndustryStats(industryName: string) {
  if (!isDataLoaded) return null
  
  const group = industryMapData.get(industryName)
  if (!group) return null

  return {
    companyCount: group.companies.length,
    subIndustries: group.subIndustries,
    countries: group.countries,
    topCompanies: group.companies.slice(0, 10)
  }
}

// Get total count
export function getCompanyCount(): number {
  return companiesData.length
}

// Check if database is loaded
export function isDatabaseLoaded(): boolean {
  return isDataLoaded
}

// Get similar companies
export function getSimilarCompanies(companyName: string, limit: number = 10): CompanyRecord[] {
  if (!isDataLoaded) return []
  
  const company = getCompanyByName(companyName)
  if (!company) return []

  return companiesData
    .filter(c => 
      c.companyName !== company.companyName &&
      (c.industryName === company.industryName || 
       c.subIndustry === company.subIndustry)
    )
    .slice(0, limit)
}

// Get Indian competitors by industry
export function getIndianCompetitors(industryName: string, excludeCompany?: string, limit: number = 10): CompanyRecord[] {
  if (!isDataLoaded) {
    console.warn('[CompanyDB] Database not loaded, cannot get Indian competitors')
    return []
  }
  
  const normalizedIndustry = industryName.toLowerCase().trim()
  
  console.log(`[CompanyDB] Finding Indian competitors for industry: "${industryName}"`)
  
  const competitors = companiesData
    .filter(c => {
      // Must be from India
      if (c.country !== 'India') return false
      
      // Exclude the source company if provided
      if (excludeCompany && c.companyName.toLowerCase() === excludeCompany.toLowerCase()) return false
      
      // Match by industry
      const industryMatch = c.industryName.toLowerCase().includes(normalizedIndustry) ||
                           normalizedIndustry.includes(c.industryName.toLowerCase())
      
      return industryMatch
    })
    .sort((a, b) => b.confidenceScore - a.confidenceScore) // Sort by confidence
    .slice(0, limit)
  
  console.log(`[CompanyDB] Found ${competitors.length} Indian competitors in ${industryName}`)
  
  return competitors
}

// Get Indian competitors by sub-industry (more specific)
export function getIndianCompetitorsBySubIndustry(subIndustry: string, excludeCompany?: string, limit: number = 10): CompanyRecord[] {
  if (!isDataLoaded) {
    console.warn('[CompanyDB] Database not loaded, cannot get Indian competitors')
    return []
  }
  
  const normalizedSubIndustry = subIndustry.toLowerCase().trim()
  
  console.log(`[CompanyDB] Finding Indian competitors for sub-industry: "${subIndustry}"`)
  
  const competitors = companiesData
    .filter(c => {
      // Must be from India
      if (c.country !== 'India') return false
      
      // Exclude the source company if provided
      if (excludeCompany && c.companyName.toLowerCase() === excludeCompany.toLowerCase()) return false
      
      // Match by sub-industry
      const subIndustryMatch = c.subIndustry.toLowerCase().includes(normalizedSubIndustry) ||
                              normalizedSubIndustry.includes(c.subIndustry.toLowerCase())
      
      return subIndustryMatch
    })
    .sort((a, b) => b.confidenceScore - a.confidenceScore)
    .slice(0, limit)
  
  console.log(`[CompanyDB] Found ${competitors.length} Indian competitors in ${subIndustry}`)
  
  return competitors
}

// Get all Indian companies
export function getAllIndianCompanies(): CompanyRecord[] {
  if (!isDataLoaded) return []
  
  return companiesData
    .filter(c => c.country === 'India')
    .sort((a, b) => b.confidenceScore - a.confidenceScore)
}

// Get all companies
export function getAllCompanies(): CompanyRecord[] {
  return [...companiesData]
}

// Client-side database wrapper (for components)
export class CompanyDatabaseClient {
  private dataLoaded = false

  async load(): Promise<void> {
    if (this.dataLoaded) return
    
    // On client, we'll need to fetch via API
    if (typeof window !== 'undefined') {
      this.dataLoaded = true
    } else {
      await loadCompanyDatabase()
      this.dataLoaded = true
    }
  }

  isLoaded(): boolean {
    return isDataLoaded || this.dataLoaded
  }

  searchCompanies(query: string): CompanyRecord[] {
    return searchCompanies(query)
  }

  getCompanyByName(name: string): CompanyRecord | undefined {
    return getCompanyByName(name)
  }

  getCompaniesByIndustry(industryName: string): CompanyRecord[] {
    return getCompaniesByIndustry(industryName)
  }

  getAllIndustries(): string[] {
    return getAllIndustries()
  }

  getIndustryStats(industryName: string) {
    return getIndustryStats(industryName)
  }

  getCount(): number {
    return getCompanyCount()
  }

  getSimilarCompanies(companyName: string, limit: number = 10): CompanyRecord[] {
    return getSimilarCompanies(companyName, limit)
  }
}

// Export singleton for client use
export const companyDatabase = new CompanyDatabaseClient()
export default companyDatabase
