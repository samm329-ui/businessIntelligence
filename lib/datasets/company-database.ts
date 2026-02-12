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
      'C:\\Users\\jishu\\Downloads\\all_real_companies_combined.csv',
      path.resolve(process.cwd(), 'datasets', 'all_real_companies_combined.csv'),
      path.resolve(process.cwd(), '..', '..', 'Downloads', 'all_real_companies_combined.csv'),
      path.resolve(process.cwd(), 'data', 'all_real_companies_combined.csv'),
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
export function searchCompanies(query: string): CompanyRecord[] {
  if (!isDataLoaded || companiesData.length === 0) {
    return []
  }

  const normalizedQuery = query.toLowerCase().trim()
  if (!normalizedQuery) return []

  const results: CompanyRecord[] = []
  const seen = new Set<string>()

  for (const company of companiesData) {
    if (seen.has(company.companyName)) continue

    const nameMatch = company.normalizedCompanyName.includes(normalizedQuery)
    const industryMatch = company.normalizedIndustryName.includes(normalizedQuery)
    const subIndustryMatch = company.subIndustry.toLowerCase().includes(normalizedQuery)
    
    if (nameMatch || industryMatch || subIndustryMatch) {
      results.push(company)
      seen.add(company.companyName)
    }
  }

  // Sort by relevance
  return results.sort((a, b) => {
    const aExact = a.normalizedCompanyName === normalizedQuery ? 2 : 
                  a.normalizedCompanyName.startsWith(normalizedQuery) ? 1 : 0
    const bExact = b.normalizedCompanyName === normalizedQuery ? 2 : 
                  b.normalizedCompanyName.startsWith(normalizedQuery) ? 1 : 0
    return bExact - aExact
  }).slice(0, 20)
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
