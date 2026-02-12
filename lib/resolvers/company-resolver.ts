
export type Exchange = 'NSE' | 'BSE' | 'NASDAQ' | 'NYSE' | 'LSE' | 'PRIVATE'

export interface CompanyIdentity {
    name: string
    ticker: string
    exchange: Exchange
    country: string
    region: 'india' | 'global'
    sector: string
    subSector?: string
    isPublic: boolean
    officialWebsite?: string
}

/**
 * Resolves a raw string input into a verified CompanyIdentity.
 * In a real production environment, this would call specialized APIs like 
 * AlphaVantage Search, NSE/BSE Master lists, or Bloomberg Identifiers.
 */
export async function resolveCompanyIdentity(input: string, preferredRegion: 'india' | 'global' = 'india'): Promise<CompanyIdentity | null> {
    const query = input.toLowerCase().trim()

    // Mock dictionary of significant entities for high-precision mapping
    // This allows differentiation between "Tata Motors" and "Tata Chemicals"
    const COMPANIES: Record<string, CompanyIdentity> = {
        'tata motors': {
            name: 'Tata Motors Ltd',
            ticker: 'TATAMOTORS',
            exchange: 'NSE',
            country: 'India',
            region: 'india',
            sector: 'Automobile',
            subSector: 'Passenger & Commercial Vehicles',
            isPublic: true,
            officialWebsite: 'https://www.tatamotors.com'
        },
        'tata chemicals': {
            name: 'Tata Chemicals Ltd',
            ticker: 'TATACHEM',
            exchange: 'NSE',
            country: 'India',
            region: 'india',
            sector: 'Chemicals',
            subSector: 'Specialty Chemicals',
            isPublic: true,
            officialWebsite: 'https://www.tatachemicals.com'
        },
        'reliance': {
            name: 'Reliance Industries Ltd',
            ticker: 'RELIANCE',
            exchange: 'NSE',
            country: 'India',
            region: 'india',
            sector: 'Energy',
            subSector: 'O2C & Retail',
            isPublic: true,
            officialWebsite: 'https://www.ril.com'
        },
        'amul': {
            name: 'Amul (GCMMF)',
            ticker: 'AMUL',
            exchange: 'PRIVATE',
            country: 'India',
            region: 'india',
            sector: 'Dairy',
            subSector: 'Consumer Goods',
            isPublic: false,
            officialWebsite: 'https://www.amul.com'
        },
        'nestle india': {
            name: 'Nestlé India Ltd',
            ticker: 'NESTLEIND',
            exchange: 'NSE',
            country: 'India',
            region: 'india',
            sector: 'FMCG',
            subSector: 'Food Processing',
            isPublic: true,
            officialWebsite: 'https://www.nestle.in'
        },
        'nestle': {
            name: 'Nestlé S.A.',
            ticker: 'NESN',
            exchange: 'LSE',
            country: 'Switzerland',
            region: 'global',
            sector: 'FMCG',
            subSector: 'Food & Beverage',
            isPublic: true,
            officialWebsite: 'https://www.nestle.com'
        }
    }

    // 1. Direct match check
    if (COMPANIES[query]) return COMPANIES[query]

    // 2. Fuzzy/Alias Check
    for (const [key, identity] of Object.entries(COMPANIES)) {
        if (query.includes(key) || key.includes(query)) {
            // Priority to preferred region if multiple matches exist
            if (identity.region === preferredRegion) return identity
        }
    }

    // 3. Heuristic resolution for unknown entries
    // This part would normally call an external Search API
    return null
}
