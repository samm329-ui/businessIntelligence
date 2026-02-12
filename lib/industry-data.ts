// Industry and company database for search autocomplete

export interface IndustryCategory {
    name: string
    icon: string
    subcategories: string[]
    topCompanies: string[]
}

export const INDUSTRY_DATABASE: IndustryCategory[] = [
    {
        name: 'Technology',
        icon: '💻',
        subcategories: ['Software', 'Hardware', 'Semiconductors', 'IT Services', 'Cloud Computing', 'Cybersecurity'],
        topCompanies: ['Apple', 'Microsoft', 'Google', 'Amazon', 'Meta', 'NVIDIA', 'Intel', 'Cisco', 'Oracle', 'Salesforce'],
    },
    {
        name: 'Renewable Energy',
        icon: '🌱',
        subcategories: ['Solar', 'Wind', 'Hydropower', 'Battery Storage', 'EV Infrastructure', 'Green Hydrogen'],
        topCompanies: ['NextEra Energy', 'Enphase', 'First Solar', 'Vestas', 'SolarEdge', 'Tesla Energy', 'Orsted', 'Brookfield Renewable'],
    },
    {
        name: 'FMCG',
        icon: '🛒',
        subcategories: ['Food & Beverages', 'Personal Care', 'Household Products', 'Packaged Foods', 'Dairy'],
        topCompanies: ['Procter & Gamble', 'Unilever', 'Nestle', 'Coca-Cola', 'PepsiCo', 'HUL', 'ITC', 'Britannia', 'Dabur'],
    },
    {
        name: 'Healthcare',
        icon: '🏥',
        subcategories: ['Pharmaceuticals', 'Biotech', 'Medical Devices', 'Health Tech', 'Hospitals', 'Diagnostics'],
        topCompanies: ['Johnson & Johnson', 'Pfizer', 'UnitedHealth', 'Abbott', 'Roche', 'Novartis', 'Merck', 'Sun Pharma', 'Dr. Reddy\'s'],
    },
    {
        name: 'Financial Services',
        icon: '🏦',
        subcategories: ['Banking', 'Insurance', 'Asset Management', 'Fintech', 'Payments', 'Wealth Management'],
        topCompanies: ['JPMorgan', 'Goldman Sachs', 'HDFC Bank', 'ICICI Bank', 'SBI', 'Bajaj Finance', 'Kotak', 'Visa', 'Mastercard'],
    },
    {
        name: 'E-commerce',
        icon: '🛍️',
        subcategories: ['Retail', 'Marketplace', 'D2C Brands', 'Quick Commerce', 'B2B Commerce'],
        topCompanies: ['Amazon', 'Alibaba', 'Flipkart', 'Shopify', 'JD.com', 'MercadoLibre', 'Nykaa', 'Meesho', 'Zomato'],
    },
    {
        name: 'Automobile',
        icon: '🚗',
        subcategories: ['Electric Vehicles', 'Two-wheelers', 'Passenger Vehicles', 'Commercial Vehicles', 'Auto Components'],
        topCompanies: ['Tesla', 'Toyota', 'Volkswagen', 'Tata Motors', 'Maruti Suzuki', 'Mahindra', 'BYD', 'Ola Electric', 'Hero MotoCorp'],
    },
    {
        name: 'Real Estate',
        icon: '🏢',
        subcategories: ['Residential', 'Commercial', 'REITs', 'PropTech', 'Construction'],
        topCompanies: ['DLF', 'Godrej Properties', 'Oberoi Realty', 'Prestige Estates', 'Embassy REIT', 'Mindspace REIT'],
    },
    {
        name: 'Media & Entertainment',
        icon: '🎬',
        subcategories: ['Streaming', 'Gaming', 'Advertising', 'Publishing', 'Music', 'Sports'],
        topCompanies: ['Netflix', 'Disney', 'Warner Bros', 'Spotify', 'Sony', 'Nintendo', 'Take-Two', 'Zee', 'PVR'],
    },
    {
        name: 'Telecommunications',
        icon: '📡',
        subcategories: ['Mobile Networks', 'Broadband', 'Telecom Equipment', '5G Infrastructure', 'Satellite'],
        topCompanies: ['Reliance Jio', 'Airtel', 'Vodafone Idea', 'AT&T', 'Verizon', 'T-Mobile', 'Ericsson', 'Nokia'],
    },
    {
        name: 'Agriculture',
        icon: '🌾',
        subcategories: ['AgriTech', 'Fertilizers', 'Seeds', 'Agri Equipment', 'Food Processing'],
        topCompanies: ['UPL', 'PI Industries', 'Bayer CropScience', 'Syngenta', 'Tata Chemicals', 'Coromandel'],
    },
    {
        name: 'AI & Machine Learning',
        icon: '🤖',
        subcategories: ['Generative AI', 'Computer Vision', 'NLP', 'MLOps', 'AI Chips'],
        topCompanies: ['OpenAI', 'Anthropic', 'Google DeepMind', 'NVIDIA', 'Microsoft AI', 'Cohere', 'Databricks'],
    },
]

// Search function for autocomplete
export function searchIndustries(query: string): Array<{ type: 'industry' | 'company' | 'category', name: string, parent?: string }> {
    if (!query || query.length < 2) return []

    const results: Array<{ type: 'industry' | 'company' | 'category', name: string, parent?: string }> = []
    const lowerQuery = query.toLowerCase()

    INDUSTRY_DATABASE.forEach((industry) => {
        // Match industry name
        if (industry.name.toLowerCase().includes(lowerQuery)) {
            results.push({ type: 'industry', name: industry.name })
        }

        // Match subcategories
        industry.subcategories.forEach((sub) => {
            if (sub.toLowerCase().includes(lowerQuery)) {
                results.push({ type: 'category', name: sub, parent: industry.name })
            }
        })

        // Match companies
        industry.topCompanies.forEach((company) => {
            if (company.toLowerCase().includes(lowerQuery)) {
                results.push({ type: 'company', name: company, parent: industry.name })
            }
        })
    })

    // Limit results and prioritize exact matches
    return results
        .sort((a, b) => {
            const aExact = a.name.toLowerCase().startsWith(lowerQuery) ? 0 : 1
            const bExact = b.name.toLowerCase().startsWith(lowerQuery) ? 0 : 1
            return aExact - bExact
        })
        .slice(0, 8)
}

// Get trending categories
export const TRENDING_CATEGORIES = [
    'EV Vehicles',
    'Cloud Computing',
    'Renewable Energy',
    'AI Technology',
    'Cryptocurrency',
    'Fintech',
    'Health Tech',
    'Space Exploration',
]

// Quick category chips
export const QUICK_CATEGORIES = [
    'Technology',
    'AI/Cloud',
    'Automobiles',
    'Cryptocurrency',
    'Business',
]
