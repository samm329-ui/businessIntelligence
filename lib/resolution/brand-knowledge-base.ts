// lib/resolution/brand-knowledge-base.ts
// Static Knowledge Base for Entity Resolution
// Maps brands → companies → parent companies
// Fallback when database is empty or for common brands

export interface BrandMapping {
  brandName: string
  aliases: string[]
  companyName: string
  parentCompanyName: string
  ticker: string
  exchange: string
  sector: string
  industry: string
  productCategory: string
}

// Comprehensive Brand → Company → Parent mappings
export const BRAND_KNOWLEDGE_BASE: BrandMapping[] = [
  // Reckitt Brands (UK)
  {
    brandName: 'Harpic',
    aliases: ['harpic', 'harpic cleaner', 'harpic toilet cleaner', 'harpic bathroom'],
    companyName: 'Reckitt Benckiser India',
    parentCompanyName: 'Reckitt',
    ticker: 'RECKITT', // Not listed in India, but parent is RKT on LSE
    exchange: 'LSE',
    sector: 'FMCG',
    industry: 'Home Care',
    productCategory: 'Toilet Cleaners'
  },
  {
    brandName: 'Dettol',
    aliases: ['dettol', 'dettol soap', 'dettol handwash', 'dettol antiseptic', 'dettol liquid'],
    companyName: 'Reckitt Benckiser India',
    parentCompanyName: 'Reckitt',
    ticker: 'RECKITT',
    exchange: 'LSE',
    sector: 'FMCG',
    industry: 'Personal Care',
    productCategory: 'Antiseptics'
  },
  {
    brandName: 'Lizol',
    aliases: ['lizol', 'lysol', 'lizol cleaner', 'lysol cleaner', 'lizol disinfectant'],
    companyName: 'Reckitt Benckiser India',
    parentCompanyName: 'Reckitt',
    ticker: 'RECKITT',
    exchange: 'LSE',
    sector: 'FMCG',
    industry: 'Home Care',
    productCategory: 'Surface Cleaners'
  },
  {
    brandName: 'Vanish',
    aliases: ['vanish', 'vanish stain remover', 'vanish oxi action'],
    companyName: 'Reckitt Benckiser India',
    parentCompanyName: 'Reckitt',
    ticker: 'RECKITT',
    exchange: 'LSE',
    sector: 'FMCG',
    industry: 'Home Care',
    productCategory: 'Laundry'
  },
  {
    brandName: 'Air Wick',
    aliases: ['airwick', 'air wick', 'air freshener'],
    companyName: 'Reckitt Benckiser India',
    parentCompanyName: 'Reckitt',
    ticker: 'RECKITT',
    exchange: 'LSE',
    sector: 'FMCG',
    industry: 'Home Care',
    productCategory: 'Air Fresheners'
  },

  // Hindustan Unilever Brands (India)
  {
    brandName: 'Dove',
    aliases: ['dove', 'dove soap', 'dove shampoo', 'dove body wash'],
    companyName: 'Hindustan Unilever',
    parentCompanyName: 'Unilever',
    ticker: 'HINDUNILVR',
    exchange: 'NSE',
    sector: 'FMCG',
    industry: 'Personal Care',
    productCategory: 'Beauty & Personal Care'
  },
  {
    brandName: 'Surf Excel',
    aliases: ['surf', 'surf excel', 'surf detergent', 'surf washing powder'],
    companyName: 'Hindustan Unilever',
    parentCompanyName: 'Unilever',
    ticker: 'HINDUNILVR',
    exchange: 'NSE',
    sector: 'FMCG',
    industry: 'Home Care',
    productCategory: 'Laundry'
  },
  {
    brandName: 'Lifebuoy',
    aliases: ['lifebuoy', 'lifebuoy soap', 'lifeboy'],
    companyName: 'Hindustan Unilever',
    parentCompanyName: 'Unilever',
    ticker: 'HINDUNILVR',
    exchange: 'NSE',
    sector: 'FMCG',
    industry: 'Personal Care',
    productCategory: 'Soap'
  },
  {
    brandName: 'Lux',
    aliases: ['lux', 'lux soap', 'lux body wash'],
    companyName: 'Hindustan Unilever',
    parentCompanyName: 'Unilever',
    ticker: 'HINDUNILVR',
    exchange: 'NSE',
    sector: 'FMCG',
    industry: 'Personal Care',
    productCategory: 'Soap'
  },
  {
    brandName: 'Ponds',
    aliases: ['ponds', "pond's", 'ponds cream', 'ponds face wash'],
    companyName: 'Hindustan Unilever',
    parentCompanyName: 'Unilever',
    ticker: 'HINDUNILVR',
    exchange: 'NSE',
    sector: 'FMCG',
    industry: 'Personal Care',
    productCategory: 'Skincare'
  },
  {
    brandName: 'Fair & Lovely',
    aliases: ['fair and lovely', 'fair & lovely', 'glow & lovely'],
    companyName: 'Hindustan Unilever',
    parentCompanyName: 'Unilever',
    ticker: 'HINDUNILVR',
    exchange: 'NSE',
    sector: 'FMCG',
    industry: 'Personal Care',
    productCategory: 'Skincare'
  },
  {
    brandName: 'Clinic Plus',
    aliases: ['clinic plus', 'clinic+', 'clinic shampoo'],
    companyName: 'Hindustan Unilever',
    parentCompanyName: 'Unilever',
    ticker: 'HINDUNILVR',
    exchange: 'NSE',
    sector: 'FMCG',
    industry: 'Personal Care',
    productCategory: 'Hair Care'
  },
  {
    brandName: 'Sunlight',
    aliases: ['sunlight', 'sunlight detergent', 'sunlight soap'],
    companyName: 'Hindustan Unilever',
    parentCompanyName: 'Unilever',
    ticker: 'HINDUNILVR',
    exchange: 'NSE',
    sector: 'FMCG',
    industry: 'Home Care',
    productCategory: 'Detergent'
  },
  {
    brandName: 'Rin',
    aliases: ['rin', 'rin detergent', 'rin soap'],
    companyName: 'Hindustan Unilever',
    parentCompanyName: 'Unilever',
    ticker: 'HINDUNILVR',
    exchange: 'NSE',
    sector: 'FMCG',
    industry: 'Home Care',
    productCategory: 'Detergent'
  },
  {
    brandName: 'Wheel',
    aliases: ['wheel', 'wheel detergent', 'wheel active'],
    companyName: 'Hindustan Unilever',
    parentCompanyName: 'Unilever',
    ticker: 'HINDUNILVR',
    exchange: 'NSE',
    sector: 'FMCG',
    industry: 'Home Care',
    productCategory: 'Detergent'
  },
  {
    brandName: 'Vim',
    aliases: ['vim', 'vim bar', 'vim dishwash', 'vim liquid'],
    companyName: 'Hindustan Unilever',
    parentCompanyName: 'Unilever',
    ticker: 'HINDUNILVR',
    exchange: 'NSE',
    sector: 'FMCG',
    industry: 'Home Care',
    productCategory: 'Dishwash'
  },
  {
    brandName: 'Bru',
    aliases: ['bru', 'bru coffee', 'bru instant'],
    companyName: 'Hindustan Unilever',
    parentCompanyName: 'Unilever',
    ticker: 'HINDUNILVR',
    exchange: 'NSE',
    sector: 'FMCG',
    industry: 'Food & Beverages',
    productCategory: 'Coffee'
  },
  {
    brandName: 'Lipton',
    aliases: ['lipton', 'lipton tea'],
    companyName: 'Hindustan Unilever',
    parentCompanyName: 'Unilever',
    ticker: 'HINDUNILVR',
    exchange: 'NSE',
    sector: 'FMCG',
    industry: 'Food & Beverages',
    productCategory: 'Tea'
  },
  {
    brandName: 'Red Label',
    aliases: ['red label', 'redlabel', 'red label tea'],
    companyName: 'Hindustan Unilever',
    parentCompanyName: 'Unilever',
    ticker: 'HINDUNILVR',
    exchange: 'NSE',
    sector: 'FMCG',
    industry: 'Food & Beverages',
    productCategory: 'Tea'
  },
  {
    brandName: 'Taj Mahal',
    aliases: ['taj mahal', 'tajmahal', 'taj mahal tea'],
    companyName: 'Hindustan Unilever',
    parentCompanyName: 'Unilever',
    ticker: 'HINDUNILVR',
    exchange: 'NSE',
    sector: 'FMCG',
    industry: 'Food & Beverages',
    productCategory: 'Tea'
  },
  {
    brandName: 'TRESemmé',
    aliases: ['tresemme', 'tresemmé', 'tresemme shampoo'],
    companyName: 'Hindustan Unilever',
    parentCompanyName: 'Unilever',
    ticker: 'HINDUNILVR',
    exchange: 'NSE',
    sector: 'FMCG',
    industry: 'Personal Care',
    productCategory: 'Hair Care'
  },

  // ITC Brands
  {
    brandName: 'Aashirvaad',
    aliases: ['aashirvaad', 'aashirwad', 'aashirvaad atta'],
    companyName: 'ITC',
    parentCompanyName: 'ITC',
    ticker: 'ITC',
    exchange: 'NSE',
    sector: 'FMCG',
    industry: 'Food',
    productCategory: 'Atta'
  },
  {
    brandName: 'Sunfeast',
    aliases: ['sunfeast', 'sunfeast biscuits', 'sunfeast noodles'],
    companyName: 'ITC',
    parentCompanyName: 'ITC',
    ticker: 'ITC',
    exchange: 'NSE',
    sector: 'FMCG',
    industry: 'Food',
    productCategory: 'Biscuits'
  },
  {
    brandName: 'Bingo!',
    aliases: ['bingo', 'bingo chips', 'bingo snacks'],
    companyName: 'ITC',
    parentCompanyName: 'ITC',
    ticker: 'ITC',
    exchange: 'NSE',
    sector: 'FMCG',
    industry: 'Food',
    productCategory: 'Snacks'
  },
  {
    brandName: 'Classmate',
    aliases: ['classmate', 'classmate notebooks'],
    companyName: 'ITC',
    parentCompanyName: 'ITC',
    ticker: 'ITC',
    exchange: 'NSE',
    sector: 'FMCG',
    industry: 'Stationery',
    productCategory: 'Notebooks'
  },

  // Nestle Brands
  {
    brandName: 'Maggi',
    aliases: ['maggi', 'maggi noodles', 'maggi masala'],
    companyName: 'Nestle India',
    parentCompanyName: 'Nestle',
    ticker: 'NESTLEIND',
    exchange: 'NSE',
    sector: 'FMCG',
    industry: 'Food',
    productCategory: 'Instant Noodles'
  },
  {
    brandName: 'Nescafe',
    aliases: ['nescafe', 'nescafe coffee', 'nescafe classic'],
    companyName: 'Nestle India',
    parentCompanyName: 'Nestle',
    ticker: 'NESTLEIND',
    exchange: 'NSE',
    sector: 'FMCG',
    industry: 'Beverages',
    productCategory: 'Coffee'
  },
  {
    brandName: 'KitKat',
    aliases: ['kitkat', 'kit kat'],
    companyName: 'Nestle India',
    parentCompanyName: 'Nestle',
    ticker: 'NESTLEIND',
    exchange: 'NSE',
    sector: 'FMCG',
    industry: 'Food',
    productCategory: 'Chocolate'
  },
  {
    brandName: 'Munch',
    aliases: ['munch', 'munch chocolate'],
    companyName: 'Nestle India',
    parentCompanyName: 'Nestle',
    ticker: 'NESTLEIND',
    exchange: 'NSE',
    sector: 'FMCG',
    industry: 'Food',
    productCategory: 'Chocolate'
  },
  {
    brandName: 'Milkmaid',
    aliases: ['milkmaid', 'milkmaid condensed milk'],
    companyName: 'Nestle India',
    parentCompanyName: 'Nestle',
    ticker: 'NESTLEIND',
    exchange: 'NSE',
    sector: 'FMCG',
    industry: 'Dairy',
    productCategory: 'Condensed Milk'
  },

  // Britannia Brands
  {
    brandName: 'Britannia',
    aliases: ['britannia', 'britannia biscuits'],
    companyName: 'Britannia Industries',
    parentCompanyName: 'Britannia',
    ticker: 'BRITANNIA',
    exchange: 'NSE',
    sector: 'FMCG',
    industry: 'Food',
    productCategory: 'Biscuits'
  },
  {
    brandName: 'Good Day',
    aliases: ['good day', 'goodday', 'good day biscuits'],
    companyName: 'Britannia Industries',
    parentCompanyName: 'Britannia',
    ticker: 'BRITANNIA',
    exchange: 'NSE',
    sector: 'FMCG',
    industry: 'Food',
    productCategory: 'Biscuits'
  },
  {
    brandName: 'Tiger',
    aliases: ['tiger', 'tiger biscuits'],
    companyName: 'Britannia Industries',
    parentCompanyName: 'Britannia',
    ticker: 'BRITANNIA',
    exchange: 'NSE',
    sector: 'FMCG',
    industry: 'Food',
    productCategory: 'Biscuits'
  },

  // Dabur Brands
  {
    brandName: 'Dabur',
    aliases: ['dabur', 'dabur chyawanprash', 'dabur honey'],
    companyName: 'Dabur India',
    parentCompanyName: 'Dabur',
    ticker: 'DABUR',
    exchange: 'NSE',
    sector: 'FMCG',
    industry: 'Ayurveda',
    productCategory: 'Healthcare'
  },
  {
    brandName: 'Real',
    aliases: ['real', 'real juice', 'real fruit juice'],
    companyName: 'Dabur India',
    parentCompanyName: 'Dabur',
    ticker: 'DABUR',
    exchange: 'NSE',
    sector: 'FMCG',
    industry: 'Beverages',
    productCategory: 'Juice'
  },
  {
    brandName: 'Vatika',
    aliases: ['vatika', 'vatika shampoo', 'vatika hair oil'],
    companyName: 'Dabur India',
    parentCompanyName: 'Dabur',
    ticker: 'DABUR',
    exchange: 'NSE',
    sector: 'FMCG',
    industry: 'Personal Care',
    productCategory: 'Hair Care'
  },

  // Colgate-Palmolive
  {
    brandName: 'Colgate',
    aliases: ['colgate', 'colgate toothpaste', 'colgate tooth brush'],
    companyName: 'Colgate-Palmolive India',
    parentCompanyName: 'Colgate-Palmolive',
    ticker: 'COLPAL',
    exchange: 'NSE',
    sector: 'FMCG',
    industry: 'Oral Care',
    productCategory: 'Toothpaste'
  },
  {
    brandName: 'Palmolive',
    aliases: ['palmolive', 'palmolive soap'],
    companyName: 'Colgate-Palmolive India',
    parentCompanyName: 'Colgate-Palmolive',
    ticker: 'COLPAL',
    exchange: 'NSE',
    sector: 'FMCG',
    industry: 'Personal Care',
    productCategory: 'Soap'
  },

  // P&G Brands (not listed in India, but important)
  {
    brandName: 'Tide',
    aliases: ['tide', 'tide detergent'],
    companyName: 'Procter & Gamble India',
    parentCompanyName: 'Procter & Gamble',
    ticker: 'PG',
    exchange: 'NYSE',
    sector: 'FMCG',
    industry: 'Home Care',
    productCategory: 'Detergent'
  },
  {
    brandName: 'Ariel',
    aliases: ['ariel', 'ariel detergent'],
    companyName: 'Procter & Gamble India',
    parentCompanyName: 'Procter & Gamble',
    ticker: 'PG',
    exchange: 'NYSE',
    sector: 'FMCG',
    industry: 'Home Care',
    productCategory: 'Detergent'
  },
  {
    brandName: 'Head & Shoulders',
    aliases: ['head and shoulders', 'head & shoulders', 'h&s'],
    companyName: 'Procter & Gamble India',
    parentCompanyName: 'Procter & Gamble',
    ticker: 'PG',
    exchange: 'NYSE',
    sector: 'FMCG',
    industry: 'Personal Care',
    productCategory: 'Shampoo'
  },
  {
    brandName: 'Pantene',
    aliases: ['pantene', 'pantene shampoo'],
    companyName: 'Procter & Gamble India',
    parentCompanyName: 'Procter & Gamble',
    ticker: 'PG',
    exchange: 'NYSE',
    sector: 'FMCG',
    industry: 'Personal Care',
    productCategory: 'Shampoo'
  },
  {
    brandName: 'Gillette',
    aliases: ['gillette', 'gillette razor', 'gillette blades'],
    companyName: 'Procter & Gamble India',
    parentCompanyName: 'Procter & Gamble',
    ticker: 'PG',
    exchange: 'NYSE',
    sector: 'FMCG',
    industry: 'Personal Care',
    productCategory: 'Grooming'
  },
  {
    brandName: 'Oral-B',
    aliases: ['oral b', 'oral-b', 'oralb'],
    companyName: 'Procter & Gamble India',
    parentCompanyName: 'Procter & Gamble',
    ticker: 'PG',
    exchange: 'NYSE',
    sector: 'FMCG',
    industry: 'Oral Care',
    productCategory: 'Toothbrush'
  },
  {
    brandName: 'Pampers',
    aliases: ['pampers', 'pampers diapers'],
    companyName: 'Procter & Gamble India',
    parentCompanyName: 'Procter & Gamble',
    ticker: 'PG',
    exchange: 'NYSE',
    sector: 'FMCG',
    industry: 'Baby Care',
    productCategory: 'Diapers'
  },

  // Godrej Brands
  {
    brandName: 'Godrej No.1',
    aliases: ['godrej no 1', 'godrej no.1', 'godrej soap'],
    companyName: 'Godrej Consumer Products',
    parentCompanyName: 'Godrej',
    ticker: 'GODREJCP',
    exchange: 'NSE',
    sector: 'FMCG',
    industry: 'Personal Care',
    productCategory: 'Soap'
  },
  {
    brandName: 'Cinthol',
    aliases: ['cinthol', 'cinthol soap'],
    companyName: 'Godrej Consumer Products',
    parentCompanyName: 'Godrej',
    ticker: 'GODREJCP',
    exchange: 'NSE',
    sector: 'FMCG',
    industry: 'Personal Care',
    productCategory: 'Soap'
  },

  // Marico Brands
  {
    brandName: 'Parachute',
    aliases: ['parachute', 'parachute oil', 'parachute coconut oil'],
    companyName: 'Marico',
    parentCompanyName: 'Marico',
    ticker: 'MARICO',
    exchange: 'NSE',
    sector: 'FMCG',
    industry: 'Personal Care',
    productCategory: 'Hair Oil'
  },
  {
    brandName: 'Saffola',
    aliases: ['saffola', 'saffola oil', 'saffola oats'],
    companyName: 'Marico',
    parentCompanyName: 'Marico',
    ticker: 'MARICO',
    exchange: 'NSE',
    sector: 'FMCG',
    industry: 'Food',
    productCategory: 'Edible Oil'
  },

  // Emami Brands
  {
    brandName: 'Boroplus',
    aliases: ['boroplus', 'boro plus', 'boroplus cream'],
    companyName: 'Emami',
    parentCompanyName: 'Emami',
    ticker: 'EMAMI',
    exchange: 'NSE',
    sector: 'FMCG',
    industry: 'Personal Care',
    productCategory: 'Skincare'
  },
  {
    brandName: 'Navratna',
    aliases: ['navratna', 'navratna oil'],
    companyName: 'Emami',
    parentCompanyName: 'Emami',
    ticker: 'EMAMI',
    exchange: 'NSE',
    sector: 'FMCG',
    industry: 'Personal Care',
    productCategory: 'Hair Oil'
  },
  {
    brandName: 'Fair and Handsome',
    aliases: ['fair and handsome', 'fair & handsome'],
    companyName: 'Emami',
    parentCompanyName: 'Emami',
    ticker: 'EMAMI',
    exchange: 'NSE',
    sector: 'FMCG',
    industry: 'Personal Care',
    productCategory: 'Skincare'
  }
]

// Create lookup maps for fast resolution
export const BRAND_NAME_MAP = new Map<string, BrandMapping>()
export const ALIAS_MAP = new Map<string, BrandMapping>()

// Populate maps
BRAND_KNOWLEDGE_BASE.forEach(mapping => {
  BRAND_NAME_MAP.set(mapping.brandName.toLowerCase(), mapping)
  mapping.aliases.forEach(alias => {
    ALIAS_MAP.set(alias.toLowerCase(), mapping)
  })
})

/**
 * Lookup brand by name or alias
 * Returns null if not found
 */
export function lookupBrand(query: string): BrandMapping | null {
  const normalized = query.toLowerCase().trim()
  
  // Try exact brand name match
  const brandMatch = BRAND_NAME_MAP.get(normalized)
  if (brandMatch) return brandMatch
  
  // Try alias match
  const aliasMatch = ALIAS_MAP.get(normalized)
  if (aliasMatch) return aliasMatch
  
  // Try fuzzy matching
  for (const [alias, mapping] of ALIAS_MAP.entries()) {
    if (alias.includes(normalized) || normalized.includes(alias)) {
      return mapping
    }
  }
  
  return null
}

/**
 * Get all brands for a company
 */
export function getBrandsForCompany(companyName: string): BrandMapping[] {
  const normalized = companyName.toLowerCase()
  return BRAND_KNOWLEDGE_BASE.filter(
    b => b.companyName.toLowerCase().includes(normalized) || 
         b.parentCompanyName.toLowerCase().includes(normalized)
  )
}

/**
 * Get all brands in a sector
 */
export function getBrandsBySector(sector: string): BrandMapping[] {
  const normalized = sector.toLowerCase()
  return BRAND_KNOWLEDGE_BASE.filter(
    b => b.sector.toLowerCase() === normalized || 
         b.industry.toLowerCase().includes(normalized) ||
         b.productCategory.toLowerCase().includes(normalized)
  )
}

export default BRAND_KNOWLEDGE_BASE
