import { NextResponse } from 'next/server'
import { loadCompanyDatabase, searchCompanies, getCompanyByName, getCompaniesByIndustry, getAllIndustries, getIndustryStats, getSimilarCompanies, isDatabaseLoaded } from '@/lib/datasets/company-database'

// Load database on first request
let databaseInitialized = false

async function ensureDatabase() {
  if (!databaseInitialized) {
    await loadCompanyDatabase()
    databaseInitialized = true
  }
}

// GET /api/companies?query=apple&action=search
export async function GET(request: Request) {
  try {
    await ensureDatabase()
    
    const { searchParams } = new URL(request.url)
    const action = searchParams.get('action') || 'search'
    const query = searchParams.get('query') || ''
    const industry = searchParams.get('industry') || ''
    const limit = parseInt(searchParams.get('limit') || '20')

    switch (action) {
      case 'search':
        const searchResults = searchCompanies(query)
        return NextResponse.json({
          success: true,
          query,
          results: searchResults.slice(0, limit),
          total: searchResults.length
        })

      case 'get':
        const company = getCompanyByName(query)
        if (!company) {
          return NextResponse.json(
            { success: false, error: 'Company not found' },
            { status: 404 }
          )
        }
        return NextResponse.json({
          success: true,
          company,
          similar: getSimilarCompanies(company.companyName, 5)
        })

      case 'industry':
        if (industry) {
          const companies = getCompaniesByIndustry(industry)
          const stats = getIndustryStats(industry)
          return NextResponse.json({
            success: true,
            industry,
            companies: companies.slice(0, limit),
            stats
          })
        } else {
          const industries = getAllIndustries()
          return NextResponse.json({
            success: true,
            industries,
            count: industries.length
          })
        }

      case 'stats':
        const allIndustries = getAllIndustries()
        const industryStats = allIndustries.map(ind => ({
          name: ind,
          ...getIndustryStats(ind)
        }))
        return NextResponse.json({
          success: true,
          totalCompanies: searchCompanies('').length,
          totalIndustries: allIndustries.length,
          industries: industryStats
        })

      default:
        return NextResponse.json(
          { success: false, error: 'Invalid action' },
          { status: 400 }
        )
    }
  } catch (error) {
    console.error('Company API Error:', error)
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// Health check endpoint
export async function HEAD() {
  await ensureDatabase()
  return NextResponse.json({ loaded: isDatabaseLoaded() })
}
