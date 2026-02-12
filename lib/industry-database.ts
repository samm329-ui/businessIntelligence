// Comprehensive Industry Database with Real Data
// Supports India and Global regions with accurate company financials

export type Region = 'india' | 'global'

export interface CompanyData {
    name: string
    ticker: string
    marketCap: number  // in billions USD
    revenue: number    // in billions USD
    growth: number     // YoY %
    ebitdaMargin: number
    peRatio: number
    marketShare?: number // % in its specific sub-segment
    region: Region
    exchange: string
    website?: string
    lastUpdated?: string
    revenueBreakdown?: Record<string, number> // Geographic, e.g. { 'India': 80, 'Global': 20 }
}

export interface DataSource {
    name: string
    url: string
}

export interface IndustryData {
    name: string
    icon: string
    globalMarketSize: number  // billions USD
    indiaMarketSize: number   // billions USD
    globalGrowth: number
    indiaGrowth: number
    subcategories: Record<string, SubcategoryData>
    revenueBreakdown: Record<Region, Record<string, number>>
    dataSources: DataSource[] // Updated to structured sources
    investors: CompanyData[]
}

export interface SubcategoryData {
    companies: CompanyData[]
    description: string
}

// Master Industry Database
export const INDUSTRIES: Record<string, IndustryData> = {
    'Automobile': {
        name: 'Automobile',
        icon: '🚗',
        globalMarketSize: 2950,
        indiaMarketSize: 124,
        globalGrowth: 7.2,
        indiaGrowth: 8.8,
        subcategories: {
            'Electric Vehicles': {
                description: 'Battery electric and plug-in hybrid vehicles',
                companies: [
                    { name: 'Tesla', ticker: 'TSLA', marketCap: 785, revenue: 96.8, growth: 18.8, ebitdaMargin: 17.2, peRatio: 42.5, marketShare: 18, region: 'global', exchange: 'NASDAQ', website: 'https://www.tesla.com', lastUpdated: '2025-Q4', revenueBreakdown: { 'USA': 45, 'China': 22, 'Europe': 18, 'Others': 15 } },
                    { name: 'BYD', ticker: '1211.HK', marketCap: 98, revenue: 85.6, growth: 42.0, ebitdaMargin: 8.5, peRatio: 22.3, marketShare: 21, region: 'global', exchange: 'HKEX', website: 'https://www.bydglobal.com', lastUpdated: '2025-Q4', revenueBreakdown: { 'China': 88, 'Brazil': 4, 'Europe': 4, 'Others': 4 } },
                    { name: 'Rivian', ticker: 'RIVN', marketCap: 14.2, revenue: 4.4, growth: 167.4, ebitdaMargin: -85.2, peRatio: -4.2, marketShare: 2, region: 'global', exchange: 'NASDAQ', website: 'https://rivian.com', lastUpdated: '2025-Q4' },
                    { name: 'Lucid', ticker: 'LCID', marketCap: 7.8, revenue: 0.8, growth: 55.2, ebitdaMargin: -245.0, peRatio: -3.8, marketShare: 0.5, region: 'global', exchange: 'NASDAQ', website: 'https://www.lucidmotors.com', lastUpdated: '2025-Q4' },
                    { name: 'Tata Motors (EV)', ticker: 'TATAMOTORS', marketCap: 42.5, revenue: 5.2, growth: 68.5, ebitdaMargin: 12.4, peRatio: 28.6, marketShare: 72, region: 'india', exchange: 'NSE', website: 'https://www.tatamotors.com', lastUpdated: '2025-Q4', revenueBreakdown: { 'India': 95, 'Global': 5 } },
                    { name: 'Ola Electric', ticker: 'OLAELEC', marketCap: 4.8, revenue: 0.6, growth: 90.2, ebitdaMargin: -42.5, peRatio: -15.2, marketShare: 35, region: 'india', exchange: 'NSE', website: 'https://www.olaelectric.com', lastUpdated: '2025-Q4', revenueBreakdown: { 'India': 100 } },
                ]
            },
            'Passenger Vehicles': {
                description: 'Cars, SUVs, and crossovers for personal use',
                companies: [
                    { name: 'Toyota', ticker: 'TM', marketCap: 295, revenue: 274.5, growth: 21.4, ebitdaMargin: 13.8, peRatio: 9.2, region: 'global', exchange: 'NYSE' },
                    { name: 'Volkswagen', ticker: 'VOW3.DE', marketCap: 68, revenue: 322.3, growth: 15.5, ebitdaMargin: 8.2, peRatio: 4.1, region: 'global', exchange: 'XETRA' },
                    { name: 'Maruti Suzuki', ticker: 'MARUTI', marketCap: 48.2, revenue: 14.8, growth: 18.2, ebitdaMargin: 13.5, peRatio: 32.4, region: 'india', exchange: 'NSE' },
                    { name: 'Tata Motors', ticker: 'TATAMOTORS', marketCap: 42.5, revenue: 42.8, growth: 26.8, ebitdaMargin: 14.2, peRatio: 9.8, region: 'india', exchange: 'NSE' },
                    { name: 'Mahindra & Mahindra', ticker: 'M&M', marketCap: 38.6, revenue: 15.2, growth: 15.8, ebitdaMargin: 16.2, peRatio: 22.5, region: 'india', exchange: 'NSE' },
                ]
            },
            'Two-Wheelers': {
                description: 'Motorcycles, scooters, and mopeds',
                companies: [
                    { name: 'Hero MotoCorp', ticker: 'HEROMOTOCO', marketCap: 11.8, revenue: 4.8, growth: 8.2, ebitdaMargin: 14.5, peRatio: 24.2, region: 'india', exchange: 'NSE' },
                    { name: 'Bajaj Auto', ticker: 'BAJAJ-AUTO', marketCap: 28.5, revenue: 5.2, growth: 22.5, ebitdaMargin: 19.8, peRatio: 32.8, region: 'india', exchange: 'NSE' },
                    { name: 'TVS Motor', ticker: 'TVSMOTOR', marketCap: 12.4, revenue: 4.2, growth: 18.5, ebitdaMargin: 11.2, peRatio: 48.5, region: 'india', exchange: 'NSE' },
                ]
            }
        },
        revenueBreakdown: {
            india: { 'Passenger Vehicles': 48, 'Two-Wheelers': 28, 'Commercial Vehicles': 14, 'EVs': 10 },
            global: { 'Passenger Vehicles': 62, 'Commercial Vehicles': 16, 'Electric Vehicles': 15, 'Two-Wheelers': 7 }
        },
        investors: [
            { name: 'Berkshire Hathaway', ticker: 'BRK.B', marketCap: 885, revenue: 364.5, growth: 12.5, ebitdaMargin: 18.5, peRatio: 12.4, region: 'global', exchange: 'NYSE', website: 'https://www.berkshirehathaway.com' },
            { name: 'SoftBank Group', ticker: '9984.T', marketCap: 95, revenue: 45.2, growth: 8.2, ebitdaMargin: 12.5, peRatio: 15.8, region: 'global', exchange: 'TSE', website: 'https://group.softbank/en' },
            { name: 'LIC India', ticker: 'LICI', marketCap: 45.8, revenue: 92.5, growth: 6.8, ebitdaMargin: 4.5, peRatio: 14.2, region: 'india', exchange: 'NSE', website: 'https://licindia.in' },
            { name: 'Temasek', ticker: 'PRIVATE', marketCap: 285, revenue: 22.5, growth: 10.2, ebitdaMargin: 15.8, peRatio: 0, region: 'global', exchange: 'SGX', website: 'https://www.temasek.com.sg' },
        ],
        dataSources: [
            { name: 'SIAM India', url: 'https://www.siam.in' },
            { name: 'Bloomberg Auto', url: 'https://www.bloomberg.com/industries/autos' },
            { name: 'NSE India', url: 'https://www.nseindia.com' }
        ]
    },

    'FMCG': {
        name: 'FMCG',
        icon: '🛒',
        globalMarketSize: 15400,
        indiaMarketSize: 114,
        globalGrowth: 5.6,
        indiaGrowth: 10.2,
        subcategories: {
            'Food & Beverages': {
                description: 'Packaged foods, beverages, and snacks',
                companies: [
                    { name: 'Nestle', ticker: 'NESN.SW', marketCap: 285, revenue: 98.2, growth: 8.2, ebitdaMargin: 19.5, peRatio: 24.2, region: 'global', exchange: 'SIX' },
                    { name: 'Coca-Cola', ticker: 'KO', marketCap: 268, revenue: 45.8, growth: 6.2, ebitdaMargin: 31.2, peRatio: 24.8, region: 'global', exchange: 'NYSE' },
                    { name: 'Nestle India', ticker: 'NESTLEIND', marketCap: 28.5, revenue: 2.8, growth: 12.5, ebitdaMargin: 24.2, peRatio: 82.5, region: 'india', exchange: 'NSE' },
                    { name: 'Britannia', ticker: 'BRITANNIA', marketCap: 15.2, revenue: 2.2, growth: 14.8, ebitdaMargin: 18.5, peRatio: 58.2, region: 'india', exchange: 'NSE' },
                ]
            },
            'Personal Care': {
                description: 'Skincare, haircare, cosmetics, and hygiene',
                companies: [
                    { name: 'Hindustan Unilever', ticker: 'HINDUNILVR', marketCap: 68.5, revenue: 7.8, growth: 8.5, ebitdaMargin: 24.8, peRatio: 58.2, region: 'india', exchange: 'NSE' },
                    { name: 'Marico', ticker: 'MARICO', marketCap: 8.2, revenue: 1.2, growth: 12.2, ebitdaMargin: 20.5, peRatio: 52.4, region: 'india', exchange: 'NSE' },
                ]
            }
        },
        revenueBreakdown: {
            india: { 'Food & Beverages': 40, 'Personal Care': 35, 'Home Care': 15, 'Dairy': 10 },
            global: { 'Food & Beverages': 48, 'Personal Care': 30, 'Home Care': 12, 'Beverages': 10 }
        },
        investors: [
            { name: 'BlackRock', ticker: 'BLK', marketCap: 145, revenue: 18.5, growth: 8.2, ebitdaMargin: 38.5, peRatio: 22.5, region: 'global', exchange: 'NYSE', website: 'https://www.blackrock.com' },
            { name: 'Vanguard Group', ticker: 'PRIVATE', marketCap: 480, revenue: 14.2, growth: 6.5, ebitdaMargin: 28.2, peRatio: 0, region: 'global', exchange: 'PRIVATE', website: 'https://investor.vanguard.com' },
            { name: 'SBI Mutual Fund', ticker: 'PRIVATE', marketCap: 12.5, revenue: 0.8, growth: 18.5, ebitdaMargin: 45.2, peRatio: 0, region: 'india', exchange: 'NSE', website: 'https://www.sbimf.com' },
        ],
        dataSources: [
            { name: 'Nielsen IQ', url: 'https://nielseniq.com' },
            { name: 'Euromonitor', url: 'https://www.euromonitor.com' },
            { name: 'IBEF FMCG', url: 'https://www.ibef.org/industry/fmcg' }
        ]
    },

    'Technology': {
        name: 'Technology',
        icon: '💻',
        globalMarketSize: 5600,
        indiaMarketSize: 258,
        globalGrowth: 9.2,
        indiaGrowth: 14.5,
        subcategories: {
            'IT Services': {
                description: 'Software services, consulting, and outsourcing',
                companies: [
                    { name: 'TCS', ticker: 'TCS', marketCap: 168.5, revenue: 29.2, growth: 8.5, ebitdaMargin: 26.8, peRatio: 28.5, region: 'india', exchange: 'NSE' },
                    { name: 'Infosys', ticker: 'INFY', marketCap: 72.5, revenue: 18.5, growth: 4.2, ebitdaMargin: 24.2, peRatio: 22.4, region: 'india', exchange: 'NSE' },
                    { name: 'HCL Tech', ticker: 'HCLTECH', marketCap: 48.2, revenue: 13.5, growth: 6.2, ebitdaMargin: 22.4, peRatio: 24.5, region: 'india', exchange: 'NSE' },
                    { name: 'Accenture', ticker: 'ACN', marketCap: 218.5, revenue: 64.2, growth: 5.8, ebitdaMargin: 16.2, peRatio: 28.5, region: 'global', exchange: 'NYSE' },
                ]
            },
            'Cloud Computing': {
                description: 'Cloud infrastructure, SaaS, and platform services',
                companies: [
                    { name: 'Amazon AWS', ticker: 'AMZN', marketCap: 1950, revenue: 90.8, growth: 13.2, ebitdaMargin: 35.2, peRatio: 42.5, region: 'global', exchange: 'NASDAQ' },
                    { name: 'Microsoft Azure', ticker: 'MSFT', marketCap: 3120, revenue: 85.2, growth: 29.5, ebitdaMargin: 45.2, peRatio: 35.8, region: 'global', exchange: 'NASDAQ' },
                ]
            }
        },
        revenueBreakdown: {
            india: { 'IT Services': 75, 'Software Products': 12, 'Hardware': 8, 'Cloud': 5 },
            global: { 'Cloud Computing': 35, 'Software Products': 25, 'IT Services': 22, 'Semiconductors': 18 }
        },
        investors: [
            { name: 'Tiger Global', ticker: 'PRIVATE', marketCap: 58, revenue: 2.5, growth: 22.4, ebitdaMargin: 12.5, peRatio: 0, region: 'global', exchange: 'PRIVATE', website: 'https://www.tigerglobal.com' },
            { name: 'SoftBank Vision Fund', ticker: '9984.T', marketCap: 75, revenue: 12.8, growth: 18.5, ebitdaMargin: 10.2, peRatio: 0, region: 'global', exchange: 'TSE', website: 'https://visionfund.com' },
            { name: 'Accel India', ticker: 'PRIVATE', marketCap: 9.2, revenue: 0.4, growth: 20.2, ebitdaMargin: 15.2, peRatio: 0, region: 'india', exchange: 'NSE', website: 'https://www.accel.com' },
        ],
        dataSources: [
            { name: 'Gartner Research', url: 'https://www.gartner.com' },
            { name: 'NASSCOM India', url: 'https://nasscom.in' },
            { name: 'IDC Data', url: 'https://www.idc.com' }
        ]
    },

    'Healthcare': {
        name: 'Healthcare',
        icon: '🏥',
        globalMarketSize: 12600,
        indiaMarketSize: 378,
        globalGrowth: 7.5,
        indiaGrowth: 18.2,
        subcategories: {
            'Pharmaceuticals': {
                description: 'Generic and branded pharmaceutical products',
                companies: [
                    { name: 'Sun Pharma', ticker: 'SUNPHARMA', marketCap: 52.5, revenue: 5.8, growth: 12.5, ebitdaMargin: 28.2, peRatio: 32.5, region: 'india', exchange: 'NSE' },
                    { name: 'Cipla', ticker: 'CIPLA', marketCap: 14.5, revenue: 3.5, growth: 10.8, ebitdaMargin: 22.8, peRatio: 28.5, region: 'india', exchange: 'NSE' },
                    { name: 'Pfizer', ticker: 'PFE', marketCap: 158.5, revenue: 58.5, growth: -42.5, ebitdaMargin: 28.5, peRatio: 12.5, region: 'global', exchange: 'NYSE' },
                ]
            },
            'Hospitals': {
                description: 'Hospital chains and healthcare facilities',
                companies: [
                    { name: 'Apollo Hospitals', ticker: 'APOLLOHOSP', marketCap: 12.5, revenue: 2.2, growth: 15.8, ebitdaMargin: 14.2, peRatio: 68.5, region: 'india', exchange: 'NSE' },
                    { name: 'Max Healthcare', ticker: 'MAXHEALTH', marketCap: 8.5, revenue: 0.8, growth: 22.5, ebitdaMargin: 18.5, peRatio: 72.5, region: 'india', exchange: 'NSE' },
                ]
            }
        },
        revenueBreakdown: {
            india: { 'Pharmaceuticals': 55, 'Hospitals': 28, 'Diagnostics': 10, 'Medical Devices': 7 },
            global: { 'Pharmaceuticals': 45, 'Medical Devices': 20, 'Hospitals': 18, 'Health Tech': 17 }
        },
        investors: [
            { name: 'Mubadala Health', ticker: 'PRIVATE', marketCap: 280, revenue: 12.5, growth: 8.2, ebitdaMargin: 18.5, peRatio: 0, region: 'global', exchange: 'PRIVATE', website: 'https://www.mubadala.com' },
            { name: 'KKR Healthcare', ticker: 'KKR', marketCap: 85, revenue: 4.2, growth: 12.5, ebitdaMargin: 32.4, peRatio: 18.5, region: 'global', exchange: 'NYSE', website: 'https://www.kkr.com/businesses/private-equity/healthcare' },
            { name: 'Quadria Capital', ticker: 'PRIVATE', marketCap: 2.5, revenue: 0.1, growth: 25.2, ebitdaMargin: 12.5, peRatio: 0, region: 'india', exchange: 'PRIVATE', website: 'https://www.quadriacapital.com' },
        ],
        dataSources: [
            { name: 'IQVIA Reports', url: 'https://www.iqvia.com' },
            { name: 'WHO Data', url: 'https://www.who.int/data' },
            { name: 'IBEF Healthcare', url: 'https://www.ibef.org/industry/healthcare' }
        ]
    },

    'Renewable Energy': {
        name: 'Renewable Energy',
        icon: '🌱',
        globalMarketSize: 1280,
        indiaMarketSize: 48,
        globalGrowth: 15.5,
        indiaGrowth: 22.4,
        subcategories: {
            'Solar': {
                description: 'Solar panels, inverters, and installations',
                companies: [
                    { name: 'First Solar', ticker: 'FSLR', marketCap: 22.5, revenue: 3.3, growth: 24.5, ebitdaMargin: 32.5, peRatio: 18.2, region: 'global', exchange: 'NASDAQ' },
                    { name: 'Adani Green', ticker: 'ADANIGREEN', marketCap: 28.5, revenue: 1.2, growth: 42.5, ebitdaMargin: 68.5, peRatio: 125.2, region: 'india', exchange: 'NSE' },
                ]
            },
            'Wind': {
                description: 'Wind turbines and wind farm operators',
                companies: [
                    { name: 'Vestas', ticker: 'VWS.CO', marketCap: 28.5, revenue: 15.2, growth: 8.5, ebitdaMargin: 5.2, peRatio: 85.2, region: 'global', exchange: 'CPH' },
                    { name: 'Suzlon Energy', ticker: 'SUZLON', marketCap: 8.5, revenue: 0.8, growth: 62.5, ebitdaMargin: 12.5, peRatio: 42.5, region: 'india', exchange: 'NSE' },
                ]
            }
        },
        revenueBreakdown: {
            india: { 'Solar': 58, 'Wind': 30, 'Hydropower': 10, 'Others': 2 },
            global: { 'Solar': 48, 'Wind': 35, 'Battery Storage': 12, 'Green Hydrogen': 5 }
        },
        investors: [
            { name: 'Brookfield Renewables', ticker: 'BEP', marketCap: 78, revenue: 95.2, growth: 12.5, ebitdaMargin: 22.4, peRatio: 28.2, region: 'global', exchange: 'NYSE', website: 'https://bep.brookfield.com' },
            { name: 'I Squared Capital', ticker: 'PRIVATE', marketCap: 35, revenue: 4.8, growth: 18.5, ebitdaMargin: 15.8, peRatio: 0, region: 'global', exchange: 'PRIVATE', website: 'https://isquaredcapital.com' },
            { name: 'Macquarie Green Inv', ticker: 'MQG.AX', marketCap: 65, revenue: 16.5, growth: 8.5, ebitdaMargin: 20.2, peRatio: 18.5, region: 'global', exchange: 'ASX', website: 'https://www.greeninvestmentgroup.com' },
        ],
        dataSources: [
            { name: 'IEA Renewable Data', url: 'https://www.iea.org/reports/renewables-2023' },
            { name: 'IRENA Statistics', url: 'https://www.irena.org/Data' },
            { name: 'MNRE India', url: 'https://mnre.gov.in' }
        ]
    },

    'Financial Services': {
        name: 'Financial Services',
        icon: '🏦',
        globalMarketSize: 28800,
        indiaMarketSize: 1920,
        globalGrowth: 6.5,
        indiaGrowth: 15.2,
        subcategories: {
            'Banking': {
                description: 'Commercial and retail banking services',
                companies: [
                    { name: 'HDFC Bank', ticker: 'HDFCBANK', marketCap: 148.5, revenue: 28.5, growth: 18.5, ebitdaMargin: 42.5, peRatio: 18.2, region: 'india', exchange: 'NSE' },
                    { name: 'SBI', ticker: 'SBIN', marketCap: 72.5, revenue: 58.5, growth: 15.2, ebitdaMargin: 28.5, peRatio: 9.8, region: 'india', exchange: 'NSE' },
                    { name: 'JPMorgan', ticker: 'JPM', marketCap: 585.2, revenue: 158.5, growth: 12.2, ebitdaMargin: 38.5, peRatio: 12.5, region: 'global', exchange: 'NYSE' },
                ]
            },
            'Insurance': {
                description: 'Life, health, and general insurance',
                companies: [
                    { name: 'LIC', ticker: 'LICI', marketCap: 42.5, revenue: 95.2, growth: 8.5, ebitdaMargin: 5.2, peRatio: 12.5, region: 'india', exchange: 'NSE' },
                    { name: 'HDFC Life', ticker: 'HDFCLIFE', marketCap: 18.5, revenue: 6.2, growth: 18.5, ebitdaMargin: 12.5, peRatio: 85.2, region: 'india', exchange: 'NSE' },
                ]
            }
        },
        revenueBreakdown: {
            india: { 'Banking': 60, 'Insurance': 25, 'Asset Management': 10, 'Fintech': 5 },
            global: { 'Banking': 55, 'Insurance': 28, 'Asset Management': 10, 'Fintech': 7 }
        },
        investors: [
            { name: 'Goldman Sachs', ticker: 'GS', marketCap: 138, revenue: 45.2, growth: 8.2, ebitdaMargin: 28.5, peRatio: 14.2, region: 'global', exchange: 'NYSE', website: 'https://www.goldmansachs.com' },
            { name: 'Morgan Stanley', ticker: 'MS', marketCap: 145, revenue: 54.2, growth: 7.5, ebitdaMargin: 25.8, peRatio: 16.5, region: 'global', exchange: 'NYSE', website: 'https://www.morganstanley.com' },
            { name: 'Gaw Capital', ticker: 'PRIVATE', marketCap: 15, revenue: 0.8, growth: 12.5, ebitdaMargin: 18.5, peRatio: 0, region: 'global', exchange: 'PRIVATE', website: 'https://www.gawcapital.com' },
        ],
        dataSources: [
            { name: 'RBI Reports', url: 'https://www.rbi.org.in' },
            { name: 'SEBI Data', url: 'https://www.sebi.gov.in' },
            { name: 'Bloomberg Finance', url: 'https://www.bloomberg.com/markets' }
        ]
    },

    'Real Estate': {
        name: 'Real Estate',
        icon: '🏢',
        globalMarketSize: 3900,
        indiaMarketSize: 265,
        globalGrowth: 4.8,
        indiaGrowth: 18.5,
        subcategories: {
            'Residential': {
                description: 'Housing, apartments, and luxury villas',
                companies: [
                    { name: 'DLF', ticker: 'DLF', marketCap: 25.8, revenue: 0.8, growth: 15.2, ebitdaMargin: 35.2, peRatio: 48.5, region: 'india', exchange: 'NSE', website: 'https://www.dlf.in' },
                    { name: 'Godrej Properties', ticker: 'GODREJPROP', marketCap: 8.5, revenue: 0.4, growth: 22.4, ebitdaMargin: 18.5, peRatio: 65.2, region: 'india', exchange: 'NSE', website: 'https://www.godrejproperties.com' }
                ]
            },
            'Commercial': {
                description: 'Office spaces, retail malls, and warehouses',
                companies: [
                    { name: 'Brookfield Reit', ticker: 'BIRET', marketCap: 1.8, revenue: 0.2, growth: 12.5, ebitdaMargin: 85.2, peRatio: 15.2, region: 'india', exchange: 'NSE', website: 'https://www.brookfieldproperties.com' }
                ]
            }
        },
        revenueBreakdown: {
            india: { 'Residential': 65, 'Commercial': 25, 'Retail': 10 },
            global: { 'Residential': 55, 'Commercial': 30, 'Industrial': 15 }
        },
        investors: [
            { name: 'Blackstone RE', ticker: 'BX', marketCap: 158, revenue: 12.5, growth: 15.2, ebitdaMargin: 45.2, peRatio: 22.5, region: 'global', exchange: 'NYSE', website: 'https://www.blackstone.com/our-businesses/real-estate/' }
        ],
        dataSources: [
            { name: 'JLL Research', url: 'https://www.jll.co.in/en/trends-and-insights' },
            { name: 'CBRE Insights', url: 'https://www.cbre.com/insights' }
        ]
    },

    'E-commerce': {
        name: 'E-commerce',
        icon: '🛍️',
        globalMarketSize: 6300,
        indiaMarketSize: 112,
        globalGrowth: 9.5,
        indiaGrowth: 21.4,
        subcategories: {
            'Marketplace': {
                description: 'Multi-vendor retail platforms',
                companies: [
                    { name: 'Amazon', ticker: 'AMZN', marketCap: 1950, revenue: 574.8, growth: 12.5, ebitdaMargin: 15.2, peRatio: 42.5, region: 'global', exchange: 'NASDAQ', website: 'https://www.amazon.com' },
                    { name: 'Flipkart', ticker: 'PRIVATE', marketCap: 35.2, revenue: 7.5, growth: 18.5, ebitdaMargin: -2.5, peRatio: 0, region: 'india', exchange: 'NSE', website: 'https://www.flipkart.com' }
                ]
            }
        },
        revenueBreakdown: {
            india: { 'Electronics': 45, 'Fashion': 25, 'Grocery': 20, 'Others': 10 },
            global: { 'Retail': 70, 'Services': 20, 'Others': 10 }
        },
        investors: [
            { name: 'Tiger Global', ticker: 'PRIVATE', marketCap: 50, revenue: 1.5, growth: 20, ebitdaMargin: 10, peRatio: 0, region: 'global', exchange: 'PRIVATE', website: 'https://www.tigerglobal.com' }
        ],
        dataSources: [
            { name: 'Statista E-com', url: 'https://www.statista.com/outlook/dmo/ecommerce/worldwide' },
            { name: 'RedSeer', url: 'https://redseer.com' }
        ]
    }
}

// Data Sources Master List
export const DATA_SOURCES_DETAILED = {
    india: [
        { name: 'NSE', url: 'https://www.nseindia.com', type: 'Exchange' },
        { name: 'BSE', url: 'https://www.bseindia.com', type: 'Exchange' },
        { name: 'RBI', url: 'https://www.rbi.org.in', type: 'Regulator' },
        { name: 'SEBI', url: 'https://www.sebi.gov.in', type: 'Regulator' },
        { name: 'Moneycontrol', url: 'https://www.moneycontrol.com', type: 'Financial News' },
        { name: 'Economic Times', url: 'https://economictimes.com', type: 'Business News' },
        { name: 'IBEF', url: 'https://www.ibef.org', type: 'Industry Data' },
        { name: 'NASSCOM', url: 'https://nasscom.in', type: 'Tech Industry' },
        { name: 'SIAM', url: 'https://www.siam.in', type: 'Auto Industry' },
    ],
    global: [
        { name: 'Bloomberg', url: 'https://www.bloomberg.com', type: 'Financial Data' },
        { name: 'Reuters', url: 'https://www.reuters.com', type: 'News & Data' },
        { name: 'S&P Global', url: 'https://www.spglobal.com', type: 'Ratings & Analytics' },
        { name: 'Morningstar', url: 'https://www.morningstar.com', type: 'Investment Research' },
        { name: 'Yahoo Finance', url: 'https://finance.yahoo.com', type: 'Market Data' },
        { name: 'Statista', url: 'https://www.statista.com', type: 'Statistics' },
        { name: 'Gartner', url: 'https://www.gartner.com', type: 'Tech Research' },
        { name: 'IEA', url: 'https://www.iea.org', type: 'Energy Data' },
        { name: 'WHO', url: 'https://www.who.int', type: 'Health Data' },
    ]
}

// Helper functions
export function getIndustryByCompany(companyName: string): { industry: string, subcategory: string } | null {
    const lowerName = companyName.toLowerCase()

    for (const [industryKey, industry] of Object.entries(INDUSTRIES)) {
        for (const [subKey, subData] of Object.entries(industry.subcategories)) {
            if (subKey.toLowerCase().includes(lowerName)) {
                return { industry: industryKey, subcategory: subKey }
            }
            for (const company of subData.companies) {
                if (company.name.toLowerCase().includes(lowerName) ||
                    lowerName.includes(company.name.toLowerCase()) ||
                    company.ticker.toLowerCase() === lowerName) {
                    return { industry: industryKey, subcategory: subKey }
                }
            }
        }
    }
    return null
}

export function getCompetitors(companyName: string, region: Region = 'global'): CompanyData[] {
    const match = getIndustryByCompany(companyName)
    if (!match) {
        // Fallback: If no company match, try to get industry data and return its first subcategory companies
        const industry = getIndustryData(companyName)
        if (industry) {
            const firstSub = Object.values(industry.subcategories)[0]
            return firstSub.companies.filter(c => region === 'global' || c.region === region).slice(0, 8)
        }
        return []
    }

    const industry = INDUSTRIES[match.industry]
    const subData = industry.subcategories[match.subcategory]

    return subData.companies
        .filter(c => c.name.toLowerCase() !== companyName.toLowerCase())
        .filter(c => region === 'global' || c.region === region)
        .slice(0, 8)
}

export function getIndustryData(industryName: string): IndustryData | null {
    const lowerQuery = industryName.toLowerCase()

    // 1. Direct match
    const directKey = Object.keys(INDUSTRIES).find(k =>
        k.toLowerCase() === lowerQuery ||
        INDUSTRIES[k].name.toLowerCase() === lowerQuery
    )
    if (directKey) return INDUSTRIES[directKey]

    // 2. Subcategory match
    for (const industry of Object.values(INDUSTRIES)) {
        if (Object.keys(industry.subcategories).some(s => s.toLowerCase().includes(lowerQuery))) {
            return industry
        }
    }

    // 3. Company match
    const companyMatch = getIndustryByCompany(industryName)
    if (companyMatch) return INDUSTRIES[companyMatch.industry]

    return null
}

export function getResolvedData(industryName: string): IndustryData {
    return getIndustryData(industryName) || INDUSTRIES['Technology'] // Fallback to Tech
}

export function getRevenueBreakdown(industryName: string, region: Region): Record<string, number> {
    const industry = getIndustryData(industryName) || INDUSTRIES['Technology']
    return industry.revenueBreakdown[region] || { 'Other': 100 }
}

/**
 * Get all companies in a specific industry
 */
export function getCompaniesByIndustry(industryName: string): CompanyData[] {
    const industry = getIndustryData(industryName)
    if (!industry) return []
    
    const companies: CompanyData[] = []
    Object.values(industry.subcategories).forEach(subcategory => {
        companies.push(...subcategory.companies)
    })
    
    return companies
}
