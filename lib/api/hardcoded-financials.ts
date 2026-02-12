// lib/api/hardcoded-financials.ts - Hardcoded financial data for major companies
// Used when API limits are exhausted

export const HARDCODED_FINANCIALS: Record<string, {
  revenue: number  // in Billions USD
  marketCap: number  // in Billions USD
  ebitda: number    // in Billions USD
  employees: number
}> = {
  // US Technology
  'Microsoft Corporation': { revenue: 211.915, marketCap: 2947, ebitda: 88.524, employees: 221000 },
  'Apple Inc.': { revenue: 383.285, marketCap: 2895, ebitda: 114.301, employees: 164000 },
  'Google (Alphabet Inc.)': { revenue: 307.394, marketCap: 1750, ebitda: 85.376, employees: 182000 },
  'Meta Platforms Inc.': { revenue: 134.902, marketCap: 985, ebitda: 45.755, employees: 67000 },
  'NVIDIA Corporation': { revenue: 60.922, marketCap: 1180, ebitda: 29.765, employees: 29600 },
  'Tesla Inc.': { revenue: 96.773, marketCap: 785, ebitda: 13.656, employees: 140473 },
  
  // US Banks
  'JPMorgan Chase & Co.': { revenue: 172.319, marketCap: 495, ebitda: 65.437, employees: 312000 },
  'Bank of America Corp.': { revenue: 98.584, marketCap: 275, ebitda: 32.432, employees: 235000 },
  'Wells Fargo & Company': { revenue: 73.784, marketCap: 198, ebitda: 22.502, employees: 238000 },
  'Goldman Sachs Group Inc.': { revenue: 51.198, marketCap: 158, ebitda: 13.906, employees: 48700 },
  'Morgan Stanley': { revenue: 54.761, marketCap: 182, ebitda: 14.772, employees: 82000 },
  'Citigroup Inc.': { revenue: 81.437, marketCap: 118, ebitda: 27.443, employees: 240000 },
  
  // US Retail & Healthcare
  'Amazon.com Inc.': { revenue: 574.784, marketCap: 1580, ebitda: 71.557, employees: 1540000 },
  'Walmart Inc.': { revenue: 648.125, marketCap: 425, ebitda: 42.338, employees: 2100000 },
  'Johnson & Johnson': { revenue: 85.249, marketCap: 365, ebitda: 18.532, employees: 134000 },
  'Pfizer Inc.': { revenue: 58.496, marketCap: 152, ebitda: 10.498, employees: 88000 },
  'UnitedHealth Group': { revenue: 371.544, marketCap: 495, ebitda: 28.523, employees: 440000 },
  
  // Indian Companies
  'TCS': { revenue: 28.5, marketCap: 150, ebitda: 6.8, employees: 600000 },
  'Infosys': { revenue: 18.5, marketCap: 75, ebitda: 4.5, employees: 320000 },
  'HDFC Bank': { revenue: 9.2, marketCap: 125, ebitda: 4.2, employees: 175000 },
  'Reliance Industries': { revenue: 105.0, marketCap: 180, ebitda: 18.5, employees: 350000 },
}

// Get financial data with fallback to hardcoded
export function getFinancialData(companyName: string): {
  revenue: number
  marketCap: number
  ebitda: number
  employees: number
  source: string
} | null {
  const data = HARDCODED_FINANCIALS[companyName]
  if (data) {
    return {
      revenue: data.revenue,
      marketCap: data.marketCap,
      ebitda: data.ebitda,
      employees: data.employees,
      source: 'Hardcoded Database'
    }
  }
  return null
}

// Batch lookup for multiple companies
export function batchGetFinancialData(companies: string[]): Map<string, ReturnType<typeof getFinancialData>> {
  const results = new Map()
  for (const company of companies) {
    results.set(company, getFinancialData(company))
  }
  return results
}
