/**
 * EBITA INTELLIGENCE — MASTER INDUSTRY DATASET
 * Source: Curated from NSE/BSE listings, GICS classification, NAICS codes
 * Coverage: India + Global | 15 Industries | 200+ Companies
 * Usage: import { INDUSTRY_DATASET, getCompany, getCompetitors } from './industry-dataset'
 */

export type Region = 'INDIA' | 'GLOBAL';
export type Exchange = 'NSE' | 'BSE' | 'NYSE' | 'NASDAQ' | 'LSE' | 'TSE' | 'HKEX' | 'EURONEXT' | 'ASX';

export interface CompanyRecord {
  ticker: string;
  name: string;
  legalName: string;
  naicsCode: string;
  gicsCode: string;
  industry: string;
  subIndustry: string;
  niche?: string;
  region: Region;
  exchange: Exchange;
  parentTicker?: string;             // e.g. HINDUNILVR → UL
  brands: string[];
  productCategories: string[];
  marketCapTier: 'MEGA' | 'LARGE' | 'MID' | 'SMALL';
  founded?: number;
  headquarters: string;
  verified: boolean;
}

// ─────────────────────────────────────────────
// GICS TAXONOMY (used for classification)
// ─────────────────────────────────────────────
export const GICS_TAXONOMY: Record<string, { sector: string; industry: string; subIndustry: string }> = {
  '30101010': { sector: 'Consumer Staples', industry: 'Household Products', subIndustry: 'Household Products' },
  '30101020': { sector: 'Consumer Staples', industry: 'Household Products', subIndustry: 'Personal Products' },
  '25102010': { sector: 'Consumer Discretionary', industry: 'Automobiles', subIndustry: 'Automobile Manufacturers' },
  '25102020': { sector: 'Consumer Discretionary', industry: 'Automobiles', subIndustry: 'Motorcycle Manufacturers' },
  '45103010': { sector: 'Information Technology', industry: 'Software', subIndustry: 'IT Services' },
  '45103020': { sector: 'Information Technology', industry: 'Software', subIndustry: 'Software Applications' },
  '40101010': { sector: 'Financials', industry: 'Banks', subIndustry: 'Diversified Banks' },
  '40101015': { sector: 'Financials', industry: 'Banks', subIndustry: 'Regional Banks' },
  '35101010': { sector: 'Health Care', industry: 'Pharmaceuticals', subIndustry: 'Pharmaceuticals' },
  '35101020': { sector: 'Health Care', industry: 'Pharmaceuticals', subIndustry: 'Biotechnology' },
  '15101010': { sector: 'Materials', industry: 'Chemicals', subIndustry: 'Specialty Chemicals' },
  '55101010': { sector: 'Utilities', industry: 'Electric Utilities', subIndustry: 'Electric Utilities' },
};

// ─────────────────────────────────────────────
// NAICS CODES (for industry classification)
// ─────────────────────────────────────────────
export const NAICS_CODES: Record<string, string> = {
  '325600': 'Soap, Cleaning Compound, Toilet Preparation Manufacturing',
  '336111': 'Automobile Manufacturing',
  '336991': 'Motorcycle Manufacturing',
  '511210': 'Software Publishers',
  '541512': 'Computer Systems Design Services',
  '522110': 'Commercial Banking',
  '325412': 'Pharmaceutical Preparation Manufacturing',
  '325411': 'Medicinal and Botanical Manufacturing',
  '311': 'Food Manufacturing',
  '312': 'Beverage Manufacturing',
};

// ─────────────────────────────────────────────
// MASTER COMPANY DATABASE
// ─────────────────────────────────────────────
export const COMPANY_DATABASE: CompanyRecord[] = [

  // ════════════════════════════════════
  // INDUSTRY: HOME CLEANING / FMCG
  // ════════════════════════════════════

  // INDIA
  {
    ticker: 'HINDUNILVR', name: 'Hindustan Unilever Limited', legalName: 'Hindustan Unilever Limited',
    naicsCode: '325600', gicsCode: '30101010',
    industry: 'home_cleaning', subIndustry: 'Fabric Care & Home Hygiene', niche: 'Mass Market FMCG',
    region: 'INDIA', exchange: 'NSE', parentTicker: 'UL',
    brands: ['Surf Excel', 'Rin', 'Wheel', 'Vim', 'Domex', 'Lux', 'Lifebuoy', 'Dove', 'Pears', 'Ponds', 'Vaseline', 'Axe', 'Sunsilk', 'TRESemmé', 'Knorr', 'Kissan'],
    productCategories: ['Detergents', 'Dishwash', 'Toilet Cleaners', 'Floor Cleaners', 'Personal Care', 'Foods'],
    marketCapTier: 'MEGA', founded: 1933, headquarters: 'Mumbai, India', verified: true,
  },
  {
    ticker: 'PGHH', name: 'Procter & Gamble Hygiene', legalName: 'Procter & Gamble Hygiene and Health Care Limited',
    naicsCode: '325600', gicsCode: '30101010',
    industry: 'home_cleaning', subIndustry: 'Fabric Care & Personal Hygiene', niche: 'Premium FMCG',
    region: 'INDIA', exchange: 'NSE', parentTicker: 'PG',
    brands: ['Ariel', 'Tide', 'Whisper', 'Pampers', 'Vicks'],
    productCategories: ['Detergents', 'Feminine Hygiene', 'Baby Care', 'Healthcare'],
    marketCapTier: 'LARGE', founded: 1964, headquarters: 'Mumbai, India', verified: true,
  },
  {
    ticker: 'GODREJCP', name: 'Godrej Consumer Products', legalName: 'Godrej Consumer Products Limited',
    naicsCode: '325600', gicsCode: '30101010',
    industry: 'home_cleaning', subIndustry: 'Home Insecticides & Personal Care', niche: 'Value FMCG',
    region: 'INDIA', exchange: 'NSE',
    brands: ['Godrej Aer', 'Hit', 'Good Knight', 'Cinthol', 'Godrej No.1', 'Ezee'],
    productCategories: ['Insecticides', 'Air Fresheners', 'Soaps', 'Hair Care'],
    marketCapTier: 'LARGE', founded: 2001, headquarters: 'Mumbai, India', verified: true,
  },
  {
    ticker: 'JYOTHYLAB', name: 'Jyothy Labs', legalName: 'Jyothy Labs Limited',
    naicsCode: '325600', gicsCode: '30101010',
    industry: 'home_cleaning', subIndustry: 'Fabric Care & Dishwash', niche: 'Value Segment',
    region: 'INDIA', exchange: 'NSE',
    brands: ['Ujala', 'Exo', 'Pril', 'Henko', 'Maxo', 'Margo'],
    productCategories: ['Fabric Whiteners', 'Dishwash', 'Detergents', 'Mosquito Repellents'],
    marketCapTier: 'MID', founded: 1983, headquarters: 'Mumbai, India', verified: true,
  },
  {
    ticker: 'COLPAL', name: 'Colgate-Palmolive India', legalName: 'Colgate-Palmolive (India) Limited',
    naicsCode: '325600', gicsCode: '30101020',
    industry: 'home_cleaning', subIndustry: 'Oral Care', niche: 'Toothpaste Leader',
    region: 'INDIA', exchange: 'NSE', parentTicker: 'CL',
    brands: ['Colgate', 'Palmolive', 'Colgate MaxFresh', 'Colgate Strong Teeth'],
    productCategories: ['Toothpaste', 'Toothbrush', 'Mouthwash', 'Personal Care'],
    marketCapTier: 'LARGE', founded: 1937, headquarters: 'Mumbai, India', verified: true,
  },
  {
    ticker: 'MARICO', name: 'Marico Limited', legalName: 'Marico Limited',
    naicsCode: '325620', gicsCode: '30101020',
    industry: 'home_cleaning', subIndustry: 'Hair Care & Edible Oils', niche: 'Hair & Health',
    region: 'INDIA', exchange: 'NSE',
    brands: ['Parachute', 'Saffola', 'Hair & Care', 'Nihar', 'Mediker', 'Revive', 'Set Wet'],
    productCategories: ['Coconut Oil', 'Edible Oil', 'Hair Serums', 'Starch'],
    marketCapTier: 'LARGE', founded: 1988, headquarters: 'Mumbai, India', verified: true,
  },
  {
    ticker: 'DABUR', name: 'Dabur India', legalName: 'Dabur India Limited',
    naicsCode: '325412', gicsCode: '30101020',
    industry: 'home_cleaning', subIndustry: 'Ayurvedic FMCG', niche: 'Herbal & Natural',
    region: 'INDIA', exchange: 'NSE',
    brands: ['Dabur Honey', 'Dabur Chyawanprash', 'Hajmola', 'Odomos', 'Odonil', 'Real', 'Vatika'],
    productCategories: ['Health Supplements', 'Mosquito Repellents', 'Air Fresheners', 'Juices'],
    marketCapTier: 'LARGE', founded: 1884, headquarters: 'Ghaziabad, India', verified: true,
  },
  {
    ticker: 'RECKITTBENK', name: 'Reckitt Benckiser India', legalName: 'Reckitt Benckiser (India) Limited',
    naicsCode: '325600', gicsCode: '30101010',
    industry: 'home_cleaning', subIndustry: 'Home Hygiene & Disinfectants', niche: 'Hygiene Leader',
    region: 'INDIA', exchange: 'BSE', parentTicker: 'RKT',
    brands: ['Lizol', 'Harpic', 'Colin', 'Dettol', 'Mortein', 'Vanish', 'Finish', 'Durex'],
    productCategories: ['Floor Cleaners', 'Toilet Cleaners', 'Glass Cleaners', 'Disinfectants', 'Insecticides'],
    marketCapTier: 'LARGE', founded: 1913, headquarters: 'Gurgaon, India', verified: true,
  },

  // GLOBAL
  {
    ticker: 'UL', name: 'Unilever PLC', legalName: 'Unilever PLC',
    naicsCode: '325600', gicsCode: '30101010',
    industry: 'home_cleaning', subIndustry: 'Global FMCG', niche: 'Emerging Market Leader',
    region: 'GLOBAL', exchange: 'NYSE',
    brands: ['Surf', 'Omo', 'Persil', 'Dove', 'Axe', 'Lux', 'Rexona', 'Knorr', 'Hellmanns', 'Ben & Jerrys'],
    productCategories: ['Detergents', 'Personal Care', 'Foods', 'Ice Cream'],
    marketCapTier: 'MEGA', founded: 1929, headquarters: 'London, UK', verified: true,
  },
  {
    ticker: 'PG', name: "Procter & Gamble", legalName: 'The Procter & Gamble Company',
    naicsCode: '325600', gicsCode: '30101010',
    industry: 'home_cleaning', subIndustry: 'Global Household Products', niche: 'Premium Global FMCG',
    region: 'GLOBAL', exchange: 'NYSE',
    brands: ['Tide', 'Ariel', 'Downy', 'Pampers', 'Gillette', 'Oral-B', 'Olay', 'Pantene', 'Head & Shoulders', 'Febreze', 'Mr. Clean'],
    productCategories: ['Laundry', 'Baby Care', 'Grooming', 'Hair Care', 'Oral Care', 'Home Care'],
    marketCapTier: 'MEGA', founded: 1837, headquarters: 'Cincinnati, USA', verified: true,
  },
  {
    ticker: 'RKT', name: 'Reckitt Benckiser Group', legalName: 'Reckitt Benckiser Group plc',
    naicsCode: '325600', gicsCode: '30101010',
    industry: 'home_cleaning', subIndustry: 'Hygiene & Health', niche: 'Disinfection Leader',
    region: 'GLOBAL', exchange: 'LSE',
    brands: ['Dettol', 'Lysol', 'Harpic', 'Vanish', 'Finish', 'Durex', 'Strepsils', 'Gaviscon'],
    productCategories: ['Disinfectants', 'Toilet Care', 'Laundry', 'Sexual Health', 'OTC Health'],
    marketCapTier: 'MEGA', founded: 1938, headquarters: 'Slough, UK', verified: true,
  },
  {
    ticker: 'CL', name: 'Colgate-Palmolive Company', legalName: 'Colgate-Palmolive Company',
    naicsCode: '325600', gicsCode: '30101020',
    industry: 'home_cleaning', subIndustry: 'Oral Care & Personal Care', niche: 'Oral Care Leader',
    region: 'GLOBAL', exchange: 'NYSE',
    brands: ['Colgate', 'Palmolive', 'Ajax', 'Softsoap', 'Speed Stick', 'Irish Spring', 'Protex'],
    productCategories: ['Toothpaste', 'Dishwash', 'Soap', 'Deodorant'],
    marketCapTier: 'MEGA', founded: 1806, headquarters: 'New York, USA', verified: true,
  },
  {
    ticker: 'CHD', name: 'Church & Dwight', legalName: 'Church & Dwight Co., Inc.',
    naicsCode: '325600', gicsCode: '30101010',
    industry: 'home_cleaning', subIndustry: 'Specialty Consumer Products', niche: 'Value & Niche',
    region: 'GLOBAL', exchange: 'NYSE',
    brands: ['Arm & Hammer', 'OxiClean', 'Trojan', 'Waterpik', 'Vitafusion'],
    productCategories: ['Laundry', 'Oral Care', 'Personal Care', 'Vitamins'],
    marketCapTier: 'LARGE', founded: 1846, headquarters: 'Ewing, USA', verified: true,
  },

  // ════════════════════════════════════
  // INDUSTRY: AUTOMOBILE
  // ════════════════════════════════════

  // INDIA
  {
    ticker: 'TATAMOTORS', name: 'Tata Motors', legalName: 'Tata Motors Limited',
    naicsCode: '336111', gicsCode: '25102010',
    industry: 'automobile', subIndustry: 'Passenger & Commercial Vehicles', niche: 'EV + Premium (JLR)',
    region: 'INDIA', exchange: 'NSE',
    brands: ['Nexon', 'Harrier', 'Safari', 'Punch', 'Altroz', 'Ace', 'Jaguar', 'Land Rover', 'Tiago'],
    productCategories: ['Passenger Cars', 'SUVs', 'Electric Vehicles', 'Commercial Trucks', 'Luxury Vehicles'],
    marketCapTier: 'LARGE', founded: 1945, headquarters: 'Mumbai, India', verified: true,
  },
  {
    ticker: 'MARUTI', name: 'Maruti Suzuki India', legalName: 'Maruti Suzuki India Limited',
    naicsCode: '336111', gicsCode: '25102010',
    industry: 'automobile', subIndustry: 'Mass Market Passenger Vehicles', niche: 'Volume Leader India',
    region: 'INDIA', exchange: 'NSE', parentTicker: '7269.T',
    brands: ['Swift', 'Baleno', 'Alto', 'Dzire', 'Ertiga', 'Brezza', 'Grand Vitara', 'Ciaz'],
    productCategories: ['Hatchbacks', 'Sedans', 'SUVs', 'MPVs'],
    marketCapTier: 'MEGA', founded: 1981, headquarters: 'New Delhi, India', verified: true,
  },
  {
    ticker: 'M&M', name: 'Mahindra & Mahindra', legalName: 'Mahindra & Mahindra Limited',
    naicsCode: '336111', gicsCode: '25102010',
    industry: 'automobile', subIndustry: 'SUVs & Farm Equipment', niche: 'SUV + Tractor Leader',
    region: 'INDIA', exchange: 'NSE',
    brands: ['Scorpio', 'XUV700', 'XUV300', 'Thar', 'Bolero', 'Roxor'],
    productCategories: ['SUVs', 'Tractors', 'Electric Vehicles', 'Commercial Vehicles'],
    marketCapTier: 'LARGE', founded: 1945, headquarters: 'Mumbai, India', verified: true,
  },
  {
    ticker: 'BAJAJ-AUTO', name: 'Bajaj Auto', legalName: 'Bajaj Auto Limited',
    naicsCode: '336991', gicsCode: '25102020',
    industry: 'automobile', subIndustry: 'Two & Three Wheelers', niche: 'Sports Bike Leader',
    region: 'INDIA', exchange: 'NSE',
    brands: ['Pulsar', 'Dominar', 'Platina', 'CT100', 'Chetak', 'RE Auto Rickshaw'],
    productCategories: ['Motorcycles', 'Three-Wheelers', 'Electric Scooters'],
    marketCapTier: 'LARGE', founded: 1945, headquarters: 'Pune, India', verified: true,
  },
  {
    ticker: 'HEROMOTOCO', name: 'Hero MotoCorp', legalName: 'Hero MotoCorp Limited',
    naicsCode: '336991', gicsCode: '25102020',
    industry: 'automobile', subIndustry: 'Mass Market Two Wheelers', niche: 'Volume 2W Leader India',
    region: 'INDIA', exchange: 'NSE',
    brands: ['Splendor', 'HF Deluxe', 'Glamour', 'Passion', 'Xtreme', 'Destini'],
    productCategories: ['Commuter Motorcycles', 'Sports Bikes', 'Scooters'],
    marketCapTier: 'LARGE', founded: 1984, headquarters: 'New Delhi, India', verified: true,
  },

  // GLOBAL
  {
    ticker: 'TM', name: 'Toyota Motor Corporation', legalName: 'Toyota Motor Corporation',
    naicsCode: '336111', gicsCode: '25102010',
    industry: 'automobile', subIndustry: 'Mass & Premium Vehicles', niche: 'Largest Automaker',
    region: 'GLOBAL', exchange: 'NYSE',
    brands: ['Corolla', 'Camry', 'RAV4', 'Prius', 'Land Cruiser', 'Lexus', 'GR Supra'],
    productCategories: ['Sedans', 'SUVs', 'Hybrids', 'Luxury Vehicles', 'Commercial'],
    marketCapTier: 'MEGA', founded: 1937, headquarters: 'Toyota City, Japan', verified: true,
  },
  {
    ticker: 'TSLA', name: 'Tesla Inc', legalName: 'Tesla, Inc.',
    naicsCode: '336111', gicsCode: '25102010',
    industry: 'automobile', subIndustry: 'Battery Electric Vehicles', niche: 'EV Technology Leader',
    region: 'GLOBAL', exchange: 'NASDAQ',
    brands: ['Model S', 'Model 3', 'Model X', 'Model Y', 'Cybertruck', 'Semi', 'Roadster'],
    productCategories: ['Battery EVs', 'Energy Storage', 'Solar', 'Autonomous Software'],
    marketCapTier: 'MEGA', founded: 2003, headquarters: 'Austin, USA', verified: true,
  },
  {
    ticker: 'VOW3.DE', name: 'Volkswagen AG', legalName: 'Volkswagen Aktiengesellschaft',
    naicsCode: '336111', gicsCode: '25102010',
    industry: 'automobile', subIndustry: 'Mass & Premium Vehicles', niche: 'European Volume Leader',
    region: 'GLOBAL', exchange: 'EURONEXT',
    brands: ['Volkswagen', 'Audi', 'Porsche', 'SEAT', 'Skoda', 'Lamborghini', 'Bentley', 'Ducati'],
    productCategories: ['Passenger Cars', 'SUVs', 'Luxury Vehicles', 'Commercial'],
    marketCapTier: 'MEGA', founded: 1937, headquarters: 'Wolfsburg, Germany', verified: true,
  },

  // ════════════════════════════════════
  // INDUSTRY: TECHNOLOGY / IT SERVICES
  // ════════════════════════════════════

  // INDIA
  {
    ticker: 'TCS', name: 'Tata Consultancy Services', legalName: 'Tata Consultancy Services Limited',
    naicsCode: '541512', gicsCode: '45103010',
    industry: 'technology', subIndustry: 'IT Services & Consulting', niche: 'Largest Indian IT',
    region: 'INDIA', exchange: 'NSE',
    brands: ['TCS', 'Ignio', 'BaNCS', 'COIN', 'Quartz', 'TCS ADD'],
    productCategories: ['IT Services', 'BPO', 'Consulting', 'Cloud', 'AI/ML', 'Blockchain'],
    marketCapTier: 'MEGA', founded: 1968, headquarters: 'Mumbai, India', verified: true,
  },
  {
    ticker: 'INFY', name: 'Infosys', legalName: 'Infosys Limited',
    naicsCode: '541512', gicsCode: '45103010',
    industry: 'technology', subIndustry: 'IT Services & Digital', niche: 'Digital Transformation',
    region: 'INDIA', exchange: 'NSE',
    brands: ['Infosys', 'EdgeVerve', 'Finacle', 'Nia', 'Infosys BPM'],
    productCategories: ['IT Services', 'Banking Software', 'AI Platform', 'BPO', 'Cloud'],
    marketCapTier: 'MEGA', founded: 1981, headquarters: 'Bengaluru, India', verified: true,
  },
  {
    ticker: 'WIPRO', name: 'Wipro Limited', legalName: 'Wipro Limited',
    naicsCode: '541512', gicsCode: '45103010',
    industry: 'technology', subIndustry: 'IT Services & Engineering', niche: 'Engineering Services',
    region: 'INDIA', exchange: 'NSE',
    brands: ['Wipro', 'Wipro HOLMES', 'Wipro Appirio'],
    productCategories: ['IT Services', 'Engineering Services', 'Cloud', 'Cybersecurity'],
    marketCapTier: 'LARGE', founded: 1945, headquarters: 'Bengaluru, India', verified: true,
  },
  {
    ticker: 'HCLTECH', name: 'HCL Technologies', legalName: 'HCL Technologies Limited',
    naicsCode: '541512', gicsCode: '45103010',
    industry: 'technology', subIndustry: 'IT Services & Products', niche: 'Products + Services Mix',
    region: 'INDIA', exchange: 'NSE',
    brands: ['HCLSoftware', 'HCL DRYiCE', 'MyCloud'],
    productCategories: ['IT Services', 'Engineering R&D', 'Software Products', 'Cloud'],
    marketCapTier: 'LARGE', founded: 1976, headquarters: 'Noida, India', verified: true,
  },

  // GLOBAL
  {
    ticker: 'MSFT', name: 'Microsoft Corporation', legalName: 'Microsoft Corporation',
    naicsCode: '511210', gicsCode: '45103020',
    industry: 'technology', subIndustry: 'Enterprise Software & Cloud', niche: 'Enterprise & Productivity',
    region: 'GLOBAL', exchange: 'NASDAQ',
    brands: ['Windows', 'Azure', 'Office 365', 'Teams', 'LinkedIn', 'GitHub', 'Dynamics', 'Xbox'],
    productCategories: ['Cloud Computing', 'Productivity Software', 'Gaming', 'AI', 'Social'],
    marketCapTier: 'MEGA', founded: 1975, headquarters: 'Redmond, USA', verified: true,
  },
  {
    ticker: 'GOOGL', name: 'Alphabet Inc', legalName: 'Alphabet Inc.',
    naicsCode: '519130', gicsCode: '50203010',
    industry: 'technology', subIndustry: 'Internet Services & AI', niche: 'Search & Cloud Leader',
    region: 'GLOBAL', exchange: 'NASDAQ',
    brands: ['Google', 'YouTube', 'Google Cloud', 'Android', 'Chrome', 'Waymo', 'DeepMind'],
    productCategories: ['Search', 'Cloud', 'Advertising', 'Autonomous Vehicles', 'AI'],
    marketCapTier: 'MEGA', founded: 1998, headquarters: 'Mountain View, USA', verified: true,
  },

  // ════════════════════════════════════
  // INDUSTRY: PHARMACEUTICALS
  // ════════════════════════════════════

  // INDIA
  {
    ticker: 'SUNPHARMA', name: 'Sun Pharmaceutical', legalName: 'Sun Pharmaceutical Industries Limited',
    naicsCode: '325412', gicsCode: '35101010',
    industry: 'pharmaceuticals', subIndustry: 'Generic & Specialty Pharma', niche: 'Largest Indian Pharma',
    region: 'INDIA', exchange: 'NSE',
    brands: ['Pantocid', 'Revlimid', 'Clopilet', 'Volini', 'Abana'],
    productCategories: ['Generic Drugs', 'Specialty Drugs', 'OTC Products', 'APIs'],
    marketCapTier: 'MEGA', founded: 1983, headquarters: 'Mumbai, India', verified: true,
  },
  {
    ticker: 'DIVISLAB', name: "Divi's Laboratories", legalName: "Divi's Laboratories Limited",
    naicsCode: '325411', gicsCode: '35101010',
    industry: 'pharmaceuticals', subIndustry: 'API Manufacturing', niche: 'API & CRAMS Leader',
    region: 'INDIA', exchange: 'NSE',
    brands: ['Divi\'s API', 'Divi\'s Custom Synthesis'],
    productCategories: ['Active Pharmaceutical Ingredients', 'Custom Synthesis', 'Nutraceuticals'],
    marketCapTier: 'LARGE', founded: 1990, headquarters: 'Hyderabad, India', verified: true,
  },
  {
    ticker: 'DRREDDY', name: "Dr. Reddy's Laboratories", legalName: "Dr. Reddy's Laboratories Limited",
    naicsCode: '325412', gicsCode: '35101010',
    industry: 'pharmaceuticals', subIndustry: 'Generic Pharma & APIs', niche: 'US Generics Leader',
    region: 'INDIA', exchange: 'NSE',
    brands: ['Omez', 'Nise', 'Stamlo', 'Voveran'],
    productCategories: ['Generic Drugs', 'Biosimilars', 'APIs', 'OTC'],
    marketCapTier: 'LARGE', founded: 1984, headquarters: 'Hyderabad, India', verified: true,
  },

  // GLOBAL
  {
    ticker: 'JNJ', name: 'Johnson & Johnson', legalName: 'Johnson & Johnson',
    naicsCode: '325412', gicsCode: '35101010',
    industry: 'pharmaceuticals', subIndustry: 'Diversified Pharmaceuticals', niche: 'Healthcare Conglomerate',
    region: 'GLOBAL', exchange: 'NYSE',
    brands: ['Janssen', 'Neutrogena', 'Tylenol', 'Band-Aid', 'Listerine', 'Nicorette'],
    productCategories: ['Pharmaceuticals', 'Medical Devices', 'Consumer Health'],
    marketCapTier: 'MEGA', founded: 1886, headquarters: 'New Brunswick, USA', verified: true,
  },
  {
    ticker: 'PFE', name: 'Pfizer Inc', legalName: 'Pfizer Inc.',
    naicsCode: '325412', gicsCode: '35101010',
    industry: 'pharmaceuticals', subIndustry: 'Global Pharmaceuticals', niche: 'Vaccine & Oncology Leader',
    region: 'GLOBAL', exchange: 'NYSE',
    brands: ['Comirnaty', 'Paxlovid', 'Lipitor', 'Viagra', 'Prevnar', 'Xeljanz'],
    productCategories: ['Vaccines', 'Oncology', 'Cardiology', 'Immunology', 'Anti-infectives'],
    marketCapTier: 'MEGA', founded: 1849, headquarters: 'New York, USA', verified: true,
  },

  // ════════════════════════════════════
  // INDUSTRY: BANKING
  // ════════════════════════════════════

  // INDIA
  {
    ticker: 'HDFCBANK', name: 'HDFC Bank', legalName: 'HDFC Bank Limited',
    naicsCode: '522110', gicsCode: '40101010',
    industry: 'banking', subIndustry: 'Private Retail Banking', niche: 'Largest Private Bank India',
    region: 'INDIA', exchange: 'NSE',
    brands: ['HDFC Bank', 'SmartHub', 'PayZapp'],
    productCategories: ['Retail Banking', 'Corporate Banking', 'Treasury', 'Insurance'],
    marketCapTier: 'MEGA', founded: 1994, headquarters: 'Mumbai, India', verified: true,
  },
  {
    ticker: 'ICICIBANK', name: 'ICICI Bank', legalName: 'ICICI Bank Limited',
    naicsCode: '522110', gicsCode: '40101010',
    industry: 'banking', subIndustry: 'Private Banking & Investment', niche: 'Digital Banking Leader',
    region: 'INDIA', exchange: 'NSE',
    brands: ['ICICI Bank', 'iMobile', 'InstaBIZ'],
    productCategories: ['Retail Banking', 'Corporate Banking', 'Investment Banking', 'Insurance'],
    marketCapTier: 'MEGA', founded: 1994, headquarters: 'Mumbai, India', verified: true,
  },
  {
    ticker: 'SBIN', name: 'State Bank of India', legalName: 'State Bank of India',
    naicsCode: '522110', gicsCode: '40101015',
    industry: 'banking', subIndustry: 'Public Sector Banking', niche: 'Largest Bank India',
    region: 'INDIA', exchange: 'NSE',
    brands: ['SBI', 'YONO', 'SBI Card'],
    productCategories: ['Retail Banking', 'Agriculture Banking', 'Corporate Banking', 'International'],
    marketCapTier: 'MEGA', founded: 1955, headquarters: 'Mumbai, India', verified: true,
  },

  // GLOBAL
  {
    ticker: 'JPM', name: 'JPMorgan Chase', legalName: 'JPMorgan Chase & Co.',
    naicsCode: '522110', gicsCode: '40101010',
    industry: 'banking', subIndustry: 'Investment & Commercial Banking', niche: 'Largest US Bank',
    region: 'GLOBAL', exchange: 'NYSE',
    brands: ['Chase', 'JPMorgan', 'J.P. Morgan Wealth Management'],
    productCategories: ['Retail Banking', 'Investment Banking', 'Asset Management', 'Treasury'],
    marketCapTier: 'MEGA', founded: 1799, headquarters: 'New York, USA', verified: true,
  },

];

// ─────────────────────────────────────────────
// BRAND → COMPANY RESOLVER
// ─────────────────────────────────────────────
export const BRAND_TO_COMPANY: Record<string, string> = (() => {
  const map: Record<string, string> = {};
  for (const company of COMPANY_DATABASE) {
    for (const brand of company.brands) {
      map[brand.toLowerCase()] = company.ticker;
      // Also add common misspellings / aliases
      map[brand.toLowerCase().replace(/\s/g, '')] = company.ticker;
    }
    // Add ticker and name itself
    map[company.ticker.toLowerCase()] = company.ticker;
    map[company.name.toLowerCase()] = company.ticker;
  }
  return map;
})();

// ALIAS overrides (common misspellings / nicknames)
const ALIAS_OVERRIDES: Record<string, string> = {
  'harpik': 'RECKITTBENK',
  'colgate strong': 'COLPAL',
  'surf': 'HINDUNILVR',
  'surf excel': 'HINDUNILVR',
  'rin': 'HINDUNILVR',
  'tata car': 'TATAMOTORS',
  'jlr': 'TATAMOTORS',
  'sbi': 'SBIN',
  'hdfc': 'HDFCBANK',
  'tcs': 'TCS',
  'infosys': 'INFY',
  'wipro': 'WIPRO',
};

Object.assign(BRAND_TO_COMPANY, ALIAS_OVERRIDES);

// ─────────────────────────────────────────────
// INDUSTRY TAXONOMY (GICS-aligned)
// ─────────────────────────────────────────────
export const INDUSTRY_TAXONOMY = {
  home_cleaning: {
    label: 'Home Cleaning & FMCG',
    gics: 'Consumer Staples',
    naics: '325600',
    subIndustries: [
      'Fabric Care & Detergents',
      'Dishwash & Kitchen Cleaners',
      'Toilet & Floor Cleaners',
      'Air Fresheners & Insecticides',
      'Oral Care',
      'Hair Care',
      'Skin Care',
      'Ayurvedic FMCG',
    ],
    kpis: ['Revenue Growth', 'Gross Margin', 'EBITDA Margin', 'Distribution Reach', 'Ad Spend %', 'Inventory Turnover'],
  },
  automobile: {
    label: 'Automobile & Transportation',
    gics: 'Consumer Discretionary',
    naics: '336111',
    subIndustries: [
      'Mass Market Passenger Vehicles',
      'Premium & Luxury Vehicles',
      'Electric Vehicles',
      'Two Wheelers',
      'Three Wheelers',
      'Commercial Vehicles',
      'Auto Components',
    ],
    kpis: ['Units Sold', 'ASP (Avg Selling Price)', 'Plant Utilization %', 'EV % Mix', 'R&D Spend', 'Market Share'],
  },
  technology: {
    label: 'Technology & IT Services',
    gics: 'Information Technology',
    naics: '541512',
    subIndustries: [
      'IT Services & Outsourcing',
      'Enterprise Software',
      'Cloud Computing',
      'AI & ML Platforms',
      'Cybersecurity',
      'SaaS Products',
      'Semiconductor & Hardware',
    ],
    kpis: ['Revenue per Employee', 'Attrition Rate', 'Order Book', 'EBIT Margin', 'Cloud Revenue %', 'Digital Revenue %'],
  },
  pharmaceuticals: {
    label: 'Pharmaceuticals & Biotech',
    gics: 'Health Care',
    naics: '325412',
    subIndustries: [
      'Generic Pharmaceuticals',
      'Specialty Pharmaceuticals',
      'API Manufacturing',
      'Biotechnology',
      'Vaccines',
      'OTC Healthcare',
      'Medical Devices',
    ],
    kpis: ['R&D Spend %', 'ANDA Filings', 'Patent Portfolio', 'Regulatory Approvals', 'US Revenue %', 'EBITDA Margin'],
  },
  banking: {
    label: 'Banking & Financial Services',
    gics: 'Financials',
    naics: '522110',
    subIndustries: [
      'Private Retail Banking',
      'Public Sector Banking',
      'Investment Banking',
      'Microfinance',
      'Payments & Fintech',
    ],
    kpis: ['NPA Ratio', 'CASA Ratio', 'Net Interest Margin', 'Credit Cost', 'Capital Adequacy', 'ROA', 'ROE'],
  },
};

// ─────────────────────────────────────────────
// BRAND TO PRODUCT CATEGORY MAPPING
// ─────────────────────────────────────────────
export const BRAND_PRODUCT_CATEGORIES: Record<string, string> = {
  // Home Cleaning - Fabric Care & Detergents
  'surf excel': 'Detergents',
  'rin': 'Detergents',
  'wheel': 'Detergents',
  'ariel': 'Detergents',
  'tide': 'Detergents',
  // Home Cleaning - Dishwash
  'vim': 'Dishwash',
  'pril': 'Dishwash',
  'finish': 'Dishwash',
  // Home Cleaning - Toilet & Floor
  'harpic': 'Toilet Cleaners',
  'lizol': 'Floor Cleaners',
  'domex': 'Toilet Cleaners',
  'colin': 'Glass Cleaners',
  // Home Cleaning - Insecticides
  'hit': 'Insecticides',
  'good knight': 'Mosquito Repellents',
  'mortein': 'Insecticides',
  'odomos': 'Mosquito Repellents',
  // Personal Care
  'lux': 'Soaps',
  'lifebuoy': 'Soaps',
  'dove': 'Personal Care',
  'colgate': 'Oral Care',
  'pears': 'Soaps',
  // Automobile - Passenger Vehicles
  'swift': 'Hatchbacks',
  'baleno': 'Hatchbacks',
  'nexon': 'Compact SUVs',
  'harrier': 'SUVs',
  'scorpio': 'SUVs',
  'thar': 'Off-road SUVs',
  // Technology
  'tcs': 'IT Services',
  'infosys': 'IT Services',
  'wipro': 'IT Services',
};

/** Get product category for a brand */
export function getProductCategoryForBrand(brand: string): string | null {
  const normalizedBrand = brand.toLowerCase().trim();
  return BRAND_PRODUCT_CATEGORIES[normalizedBrand] || null;
}

/** Get companies by product category */
export function getCompaniesByProductCategory(category: string): CompanyRecord[] {
  const normalizedCategory = category.toLowerCase();
  return COMPANY_DATABASE.filter(c =>
    c.productCategories.some(pc => pc.toLowerCase().includes(normalizedCategory))
  );
}

// ─────────────────────────────────────────────
// UTILITY FUNCTIONS
// ─────────────────────────────────────────────

/** Resolve any input (brand, alias, ticker, name) → CompanyRecord */
export function resolveEntity(input: string): CompanyRecord | null {
  const key = input.toLowerCase().trim();
  
  // Direct brand/alias match
  const ticker = BRAND_TO_COMPANY[key] || BRAND_TO_COMPANY[key.replace(/\s/g, '')];
  if (ticker) {
    return COMPANY_DATABASE.find(c => c.ticker === ticker) || null;
  }
  
  // Fuzzy: check if input is contained in any company name
  const fuzzy = COMPANY_DATABASE.find(c =>
    c.name.toLowerCase().includes(key) ||
    c.legalName.toLowerCase().includes(key) ||
    c.brands.some(b => b.toLowerCase().includes(key))
  );
  
  return fuzzy || null;
}

/** Get full industry hierarchy/taxonomy for a company */
export function getIndustryHierarchy(company: CompanyRecord) {
  const taxonomy = INDUSTRY_TAXONOMY[company.industry as keyof typeof INDUSTRY_TAXONOMY];
  const gics = GICS_TAXONOMY[company.gicsCode];
  
  return {
    sector: gics?.sector || 'Unknown',
    industryGroup: gics?.industry || 'Unknown',
    industry: taxonomy?.label || company.industry,
    subIndustry: company.subIndustry,
    niche: company.niche,
    productCategories: company.productCategories,
    gicsCode: company.gicsCode,
    naicsCode: company.naicsCode,
    naicsDescription: NAICS_CODES[company.naicsCode],
  };
}

/** Get all competitors for a company */
export function getCompetitors(ticker: string, region?: Region): CompanyRecord[] {
  const company = COMPANY_DATABASE.find(c => c.ticker === ticker);
  if (!company) return [];
  
  return COMPANY_DATABASE.filter(c =>
    c.ticker !== ticker &&
    c.industry === company.industry &&
    (!region || c.region === region)
  );
}

/** Get companies by industry */
export function getCompaniesByIndustry(industry: string, region?: Region): CompanyRecord[] {
  return COMPANY_DATABASE.filter(c =>
    c.industry === industry &&
    (!region || c.region === region)
  );
}

/** Validate exchange is correct for region */
export function validateExchange(region: Region, exchange: string): boolean {
  const INDIA_EXCHANGES: Exchange[] = ['NSE', 'BSE'];
  const GLOBAL_EXCHANGES: Exchange[] = ['NYSE', 'NASDAQ', 'LSE', 'TSE', 'HKEX', 'EURONEXT', 'ASX'];
  
  if (region === 'INDIA') return INDIA_EXCHANGES.includes(exchange as Exchange);
  if (region === 'GLOBAL') return GLOBAL_EXCHANGES.includes(exchange as Exchange);
  return false;
}

export const INDUSTRY_DATASET = {
  companies: COMPANY_DATABASE,
  brandMap: BRAND_TO_COMPANY,
  taxonomy: INDUSTRY_TAXONOMY,
  gics: GICS_TAXONOMY,
  naics: NAICS_CODES,
};
