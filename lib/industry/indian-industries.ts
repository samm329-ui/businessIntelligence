/**
 * Comprehensive Indian Industry Dataset
 * Source: industry_data_table.txt
 * 
 * Structure: Sector → Industry → Sub-Category → Companies & Brands
 */

export interface IndustryInfo {
  sector: string;
  industry: string;
  subCategory: string;
  description: string;
  companies: string[];
  brands: string[];
  keywords: string[];
}

// PRIMARY SECTOR (Raw Materials)
export const PRIMARY_INDUSTRIES: IndustryInfo[] = [
  {
    sector: 'Primary Sector',
    industry: 'Agriculture & Crop Production',
    subCategory: 'Pulses (Dal) Processing & Trading',
    description: 'Companies involved in milling Gram, Tur/Arhar, Moong, Urad, Masoor, and Lentils',
    companies: [
      'Tata Consumer Products', 'ITC Limited', 'Adani Wilmar Ltd', 'Reliance Retail',
      'Patanjali Foods Ltd', 'Haldiram Snacks', 'Bikano', 'Rajdhani Group',
      'Shakti Bhog Foods', 'AgroPure Capital Foods', 'MTR Foods', '24 Mantra Organic',
      'Organic India', 'Phalada Agro', 'Natureland Organic Foods'
    ],
    brands: ['Tata Sampann', 'Aashirvaad', 'Fortune', 'Good Life', 'Patanjali', 'Bikano'],
    keywords: ['pulses', 'dal', 'lentils', 'grams', 'urad', 'moong', 'masoor', 'arhar']
  },
  {
    sector: 'Primary Sector',
    industry: 'Agriculture & Crop Production',
    subCategory: 'Oilseeds Processing & Edible Oils',
    description: 'Companies involved in crushing Soybean, Groundnut, Mustard, Sunflower',
    companies: [
      'Adani Wilmar', 'Cargill India', 'Bunge India', 'Emami Agrotech',
      'Marico Limited', 'Patanjali Foods', 'Agro Tech Foods', 'Mother Dairy',
      'Kaleesuwari Refinery', 'Liberty Oil Mills', 'Gemini Edibles'
    ],
    brands: ['Fortune', 'Saffola', 'Parachute', 'Dalda', 'Dhara', 'Emami', 'Sundrop'],
    keywords: ['oil', 'edible oil', 'mustard', 'soybean', 'sunflower', 'groundnut', 'cooking oil']
  },
  {
    sector: 'Primary Sector',
    industry: 'Agriculture & Crop Production',
    subCategory: 'Sugarcane (Sugar & Ethanol)',
    description: 'Companies involved in sugarcane crushing, sugar production, distillery',
    companies: [
      'Balrampur Chini Mills', 'Triveni Engineering', 'Shree Renuka Sugars',
      'Bajaj Hindusthan Sugar', 'E.I.D. Parry', 'Dalmia Bharat Sugar',
      'Dhampur Sugar Mills', 'Bannari Amman Sugars', 'Dwarikesh Sugar'
    ],
    brands: ['Balrampur', 'Triveni', 'Renuka', 'Dalmia'],
    keywords: ['sugar', 'sugarcane', 'ethanol', 'distillery']
  },
  {
    sector: 'Primary Sector',
    industry: 'Agriculture & Crop Production',
    subCategory: 'Cotton (Ginning & Trading)',
    description: 'Companies involved in cotton ginning, pressing bales, raw cotton trading',
    companies: [
      'Cotton Corporation of India', 'Vardhman Textiles', 'Trident Group',
      'Nahar Spinning', 'KPR Mill', 'Sutlej Textiles', 'Ambika Cotton'
    ],
    brands: ['CCI', 'Vardhman', 'Trident'],
    keywords: ['cotton', 'ginning', 'spinning', 'textiles', 'raw cotton']
  },
  {
    sector: 'Primary Sector',
    industry: 'Agriculture & Crop Production',
    subCategory: 'Horticulture (Fruits & Vegetables)',
    description: 'Companies involved in growing, aggregating, and exporting fresh produce',
    companies: [
      'Mahindra Agri Solutions', 'Adani Agri Fresh', 'Reliance Retail', 'Mother Dairy',
      'Sahyadri Farms', 'INI Farms', 'Jain Irrigation', 'Ninjacart', 'WayCool'
    ],
    brands: ['Saboro', 'Reliance Fresh', 'Safal', 'Ninjacart'],
    keywords: ['fruits', 'vegetables', 'fresh produce', 'horticulture', 'exports', 'agri']
  },
  {
    sector: 'Primary Sector',
    industry: 'Agriculture & Crop Production',
    subCategory: 'Plantation Crops (Tea & Coffee)',
    description: 'Companies involved in tea estates, coffee plantations, processing',
    companies: [
      'Tata Consumer Products', 'Hindustan Unilever', 'Wagh Bakri', 'McLeod Russel',
      'Tata Coffee', 'CCL Products', 'Coffee Day Enterprises', 'Goodricke Group'
    ],
    brands: ['Tata Tea', 'Tetley', 'Brooke Bond', 'Lipton', 'Taj Mahal', 'Continental Coffee'],
    keywords: ['tea', 'coffee', 'plantation', 'estates', 'brew']
  },
  {
    sector: 'Primary Sector',
    industry: 'Agriculture & Crop Production',
    subCategory: 'Organic Farming',
    description: 'Certified organic food products and farming',
    companies: [
      'Organic India', '24 Mantra Organic', 'Sresta Natural', 'Phalada Agro',
      'Natureland Organic', 'Conscious Food', 'Morarka Organic', 'Down To Earth'
    ],
    brands: ['Organic India', '24 Mantra', 'Pure & Sure', 'Down To Earth'],
    keywords: ['organic', 'certified organic', 'natural', 'pesticide free']
  }
];

// SECONDARY SECTOR (Manufacturing)
export const SECONDARY_INDUSTRIES: IndustryInfo[] = [
  {
    sector: 'Secondary Sector',
    industry: 'Automobiles & Auto Components',
    subCategory: 'Four Wheelers (Cars & SUVs)',
    description: 'Passenger vehicles manufacturing',
    companies: ['Maruti Suzuki', 'Hyundai India', 'Tata Motors', 'Mahindra & Mahindra', 'Kia India', 'Honda Cars', 'Toyota Kirloskar', 'Ford India', 'Skoda Auto', 'Volkswagen'],
    brands: ['Maruti', 'Hyundai', 'Tata', 'Mahindra', 'Kia', 'Honda', 'Toyota', 'Ford', 'Skoda', 'Volkswagen'],
    keywords: ['automobile', 'car', 'suv', 'passenger vehicle', 'four wheeler', 'pv']
  },
  {
    sector: 'Secondary Sector',
    industry: 'Automobiles & Auto Components',
    subCategory: 'Two & Three Wheelers',
    description: 'Motorcycles, scooters, auto-rickshaws',
    companies: ['Hero MotoCorp', 'Bajaj Auto', 'TVS Motor', 'Honda Motorcycle', 'Suzuki Motorcycle', 'Yamaha Motor', 'Royal Enfield', 'Jawa Motors', 'Piaggio India', 'Atul Auto'],
    brands: ['Hero', 'Bajaj', 'TVS', 'Honda', 'Yamaha', 'Royal Enfield', 'Jawa', 'Piaggio'],
    keywords: ['two wheeler', 'motorcycle', 'scooter', 'auto rickshaw', '3 wheeler', '2w']
  },
  {
    sector: 'Secondary Sector',
    industry: 'Automobiles & Auto Components',
    subCategory: 'Commercial Vehicles',
    description: 'Trucks, buses, LCVs',
    companies: ['Tata Motors', 'Ashok Leyland', 'Mahindra & Mahindra', 'Eicher Motors', 'Force Motors', 'SML Isuzu', 'Scania India', 'Volvo India'],
    brands: ['Tata', 'Ashok Leyland', 'Eicher', 'Force', 'Volvo', 'Scania'],
    keywords: ['commercial vehicle', 'truck', 'bus', 'lcv', 'cv']
  },
  {
    sector: 'Secondary Sector',
    industry: 'Automobiles & Auto Components',
    subCategory: 'Electric Vehicles',
    description: 'EV manufacturers and components',
    companies: ['Tata Motors EV', 'MG Motor India', 'Mahindra EV', 'Ola Electric', 'Ather Energy', 'TVS Motor EV', 'Hero MotoCorp EV', 'BYD India'],
    brands: ['Tata Nexon EV', 'MG Comet', 'Mahindra XUV400', 'Ola S1', 'Ather 450'],
    keywords: ['ev', 'electric vehicle', 'electric car', 'ebike', 'e-scooter']
  },
  {
    sector: 'Secondary Sector',
    industry: 'Automobiles & Auto Components',
    subCategory: 'Auto Components',
    description: 'OEM parts, components, accessories',
    companies: ['Bosch India', 'Bharat Petroleum', 'Exide Industries', 'Amara Raja Batteries', 'Lucas TVS', 'Motherson Sumi', 'Bajaj Auto', ' Schaeffler India', 'ZF India'],
    brands: ['Bosch', 'Exide', 'Amara Raja', 'Lucas', 'Motherson'],
    keywords: ['auto components', 'auto parts', 'oem', 'aftermarket', 'battery']
  },
  {
    sector: 'Secondary Sector',
    industry: 'FMCG (Fast Moving Consumer Goods)',
    subCategory: 'Personal Care & Hygiene',
    description: 'Soaps, shampoos, toothpaste, deodorants',
    companies: ['Hindustan Unilever', 'ITC Limited', 'Godrej Consumer', 'Marico', 'Colgate-Palmolive', 'Procter & Gamble', 'Reckitt Benckiser', 'Dabur India', 'Emami', 'Jabsons'],
    brands: ['Dove', 'Lux', 'Lifebuoy', 'Surf Excel', 'Rin', 'ITC', 'Godrej', 'Parachute', 'Colgate', 'Dabur'],
    keywords: ['fmcg', 'personal care', 'hygiene', 'soap', 'shampoo', 'toothpaste', 'consumer goods']
  },
  {
    sector: 'Secondary Sector',
    industry: 'FMCG (Fast Moving Consumer Goods)',
    subCategory: 'Food & Beverages',
    description: 'Packaged foods, snacks, beverages',
    companies: ['Nestle India', 'Britannia Industries', 'Tata Consumer Products', 'Mondelez India', 'Parle Products', 'Haldiram', 'Bikaji Foods', 'Prataap Snacks', 'Bajaj Corp', 'Kohinoor'],
    brands: ['Maggi', 'Nestle', 'Britannia', 'Tata', 'Parle', 'Haldiram', 'Bikano'],
    keywords: ['food', 'snacks', 'beverages', 'noodles', 'biscuits', 'confectionery']
  },
  {
    sector: 'Secondary Sector',
    industry: 'Pharmaceuticals',
    subCategory: 'Generic Pharmaceuticals',
    description: 'Generic medicines, formulations',
    companies: ['Sun Pharmaceutical', 'Dr. Reddy\'s Laboratories', 'Cipla', 'Lupin', 'Zydus Lifesciences', 'Abbott India', 'Mankind Pharma', 'Divis Laboratories', 'Bajaj Healthcare', 'Glenmark'],
    brands: ['Sun Pharma', 'Dr Reddy', 'Cipla', 'Lupin', 'Zydus', 'Mankind'],
    keywords: ['pharma', 'pharmaceutical', 'medicine', 'generic', 'formulation', 'drugs']
  },
  {
    sector: 'Secondary Sector',
    industry: 'Pharmaceuticals',
    subCategory: 'API & Contract Manufacturing',
    description: 'Active Pharmaceutical Ingredients, CDMO',
    companies: ['Divis Labs', 'Laurus Labs', 'Suven Pharma', 'Gland Pharma', 'Granules India', 'Aurobindo Pharma', 'Hetero Drugs', 'Macleods Pharma'],
    brands: ['Divis', 'Laurus', 'Suven'],
    keywords: ['api', 'active pharmaceutical', 'cdmo', 'contract manufacturing', 'bulk drugs']
  },
  {
    sector: 'Secondary Sector',
    industry: 'Chemicals & Petrochemicals',
    subCategory: 'Specialty Chemicals',
    description: 'Specialty chemicals, agrochemicals',
    companies: ['UPL Limited', 'BASF India', 'Dow India', 'Clariant India', 'BASF', 'Gujarat Chemical', 'India Glycols', 'Nocil'],
    brands: ['UPL', 'BASF', 'Dow'],
    keywords: ['chemicals', 'specialty chemicals', 'petrochemical', 'agrochemicals']
  },
  {
    sector: 'Secondary Sector',
    industry: 'Steel & Metals',
    subCategory: 'Integrated Steel',
    description: 'Steel manufacturing, iron making',
    companies: ['Tata Steel', 'JSW Steel', 'Steel Authority of India', 'Jindal Steel & Power', 'Essar Steel', 'NMDC', 'Hindustan Zinc', 'Vedanta'],
    brands: ['Tata Steel', 'JSW', 'SAIL', 'Jindal'],
    keywords: ['steel', 'iron', 'metals', 'sponge iron', 'ferro alloys']
  },
  {
    sector: 'Secondary Sector',
    industry: 'Cement',
    subCategory: 'Large Cap Cement',
    description: 'Cement manufacturing',
    companies: ['UltraTech Cement', 'Ambuja Cements', 'ACC Limited', 'Shree Cement', 'Ramco Cements', 'Dalmia Bharat Cement', 'JK Lakshmi Cement', 'Birla Corp'],
    brands: ['UltraTech', 'Ambuja', 'ACC', 'Shree Cement', 'Ramco'],
    keywords: ['cement', 'concrete', 'building materials']
  },
  {
    sector: 'Secondary Sector',
    industry: 'Textiles & Apparel',
    subCategory: 'Cotton Textiles',
    description: 'Spinning, weaving, fabric',
    companies: ['Raymond', 'Arvind Limited', 'Welspun India', 'Future Enterprises', 'Trident Group', 'Nahar Spinning', 'Alok Industries', 'Indo Count'],
    brands: ['Raymond', 'Arvind', 'Welspun', 'Trident'],
    keywords: ['textiles', 'fabric', 'cotton', 'apparel', 'garment']
  },
  {
    sector: 'Secondary Sector',
    industry: 'Electronics (ESDM)',
    subCategory: 'Consumer Electronics',
    description: 'TVs, mobiles, appliances',
    companies: ['Samsung India', 'LG Electronics', 'Sony India', 'Panasonic India', 'Whirlpool India', 'Godrej Appliances', 'Haier India', 'Xiaomi India', 'OnePlus'],
    brands: ['Samsung', 'LG', 'Sony', 'Whirlpool', 'Godrej', 'Xiaomi', 'OnePlus'],
    keywords: ['electronics', 'consumer electronics', 'tv', 'appliances', 'smartphone']
  }
];

// TERTIARY SECTOR (Services)
export const TERTIARY_INDUSTRIES: IndustryInfo[] = [
  {
    sector: 'Tertiary Sector',
    industry: 'Financial Services',
    subCategory: 'Banking - Public Sector',
    description: 'Public sector banks',
    companies: ['State Bank of India', 'Punjab National Bank', 'Bank of Baroda', 'Canara Bank', 'Union Bank of India', 'Bank of India', 'Central Bank of India', 'Indian Bank'],
    brands: ['SBI', 'PNB', 'BoB', 'Canara Bank', 'Union Bank'],
    keywords: ['banking', 'bank', 'public sector bank', 'psu bank']
  },
  {
    sector: 'Tertiary Sector',
    industry: 'Financial Services',
    subCategory: 'Banking - Private Sector',
    description: 'Private sector banks',
    companies: ['HDFC Bank', 'ICICI Bank', 'Kotak Mahindra Bank', 'Axis Bank', 'IndusInd Bank', 'Yes Bank', 'IDFC First Bank', 'RBL Bank'],
    brands: ['HDFC', 'ICICI', 'Kotak', 'Axis', 'IndusInd'],
    keywords: ['private bank', 'banking', 'retail banking']
  },
  {
    sector: 'Tertiary Sector',
    industry: 'Financial Services',
    subCategory: 'NBFC - Housing Finance',
    description: 'Home loan providers',
    companies: ['HDFC Ltd', 'LIC Housing Finance', 'PNB Housing Finance', 'Bajaj Housing Finance', 'Muthoot Housing Finance', 'India Infradebt'],
    brands: ['HDFC', 'LIC Housing', 'PNB Housing'],
    keywords: ['housing finance', 'home loan', 'mortgage']
  },
  {
    sector: 'Tertiary Sector',
    industry: 'Financial Services',
    subCategory: 'NBFC - Microfinance',
    description: 'Microfinance institutions',
    companies: ['Bandhan Bank', 'CreditAccess Grameen', 'Spandana Sphoorty', 'Ujjivan Small Finance Bank', 'Equitas Small Finance Bank', 'AU Small Finance Bank'],
    brands: ['Bandhan', 'CreditAccess', 'Ujjivan', 'Equitas', 'AU Bank'],
    keywords: ['microfinance', 'mfi', 'small finance bank', 'mfis']
  },
  {
    sector: 'Tertiary Sector',
    industry: 'Financial Services',
    subCategory: 'Insurance',
    description: 'Life and general insurance',
    companies: ['Life Insurance Corporation', 'SBI Life Insurance', 'HDFC Life Insurance', 'ICICI Prudential Life', 'Bajaj Allianz Life', 'Max Life Insurance', 'Tata AIA Life', 'Reliance Nippon Life'],
    brands: ['LIC', 'SBI Life', 'HDFC Life', 'ICICI Prudential'],
    keywords: ['insurance', 'life insurance', 'general insurance', 'term insurance']
  },
  {
    sector: 'Tertiary Sector',
    industry: 'Information Technology',
    subCategory: 'IT Services',
    description: 'IT services, consulting, software development',
    companies: ['TCS', 'Infosys', 'Wipro', 'HCL Technologies', 'Tech Mahindra', 'Cognizant India', 'Accenture India', 'Deloitte India', 'EY India', 'PwC India'],
    brands: ['TCS', 'Infosys', 'Wipro', 'HCL', 'Tech Mahindra'],
    keywords: ['it', 'software', 'technology', 'it services', 'consulting', 'software development']
  },
  {
    sector: 'Tertiary Sector',
    industry: 'Information Technology',
    subCategory: 'SaaS & Product Companies',
    description: 'Software as a Service, product companies',
    companies: ['Zoho Corporation', 'Freshworks', 'Druva', 'InMobi', 'Flipkart', 'Paytm', 'Razorpay', 'Cred', 'Rappi'],
    brands: ['Zoho', 'Freshworks', 'Freshdesk', 'Freshsales'],
    keywords: ['saas', 'product', 'software', 'cloud', 'b2b software']
  },
  {
    sector: 'Tertiary Sector',
    industry: 'Healthcare & Life Sciences',
    subCategory: 'Hospitals',
    description: 'Hospital chains, healthcare services',
    companies: ['Apollo Hospitals', 'Fortis Healthcare', 'Max Healthcare', 'Narayana Health', 'Manipal Hospitals', 'Columbia Asia', 'Medanta', 'Rainbow Hospitals'],
    brands: ['Apollo', 'Fortis', 'Max', 'Narayana Health', 'Medanta'],
    keywords: ['hospital', 'healthcare', 'medical', 'clinic', 'health services']
  },
  {
    sector: 'Tertiary Sector',
    industry: 'Healthcare & Life Sciences',
    subCategory: 'Diagnostic & Labs',
    description: 'Diagnostic chains, pathology labs',
    companies: ['Dr. Lal PathLabs', 'Metropolis Healthcare', 'SRL Diagnostics', 'Thyrocare Technologies', 'Pathkind Labs', 'City X-Ray'],
    brands: ['Dr Lal PathLabs', 'Metropolis', 'SRL'],
    keywords: ['diagnostic', 'lab', 'pathology', 'blood test', 'mri', 'ct scan']
  },
  {
    sector: 'Tertiary Sector',
    industry: 'Retail',
    subCategory: 'Modern Retail',
    description: 'Retail chains, supermarkets',
    companies: ['Reliance Retail', 'Aditya Birla Group', 'Future Group', 'D-Mart', 'Shoppers Stop', 'Lifestyle', 'Pantaloons', 'Big Bazaar', 'Star India'],
    brands: ['Reliance Retail', 'D-Mart', 'Big Bazaar', 'Shoppers Stop', 'Pantaloons'],
    keywords: ['retail', 'supermarket', 'ecommerce', 'modern retail', 'kirana']
  },
  {
    sector: 'Tertiary Sector',
    industry: 'Real Estate',
    subCategory: 'Residential Real Estate',
    description: 'Residential property developers',
    companies: ['DLF Limited', 'Godrej Properties', 'Prestige Estates', 'Oberoi Realty', 'Bandra-Worli Sea Link', 'Mahindra Lifespaces', 'Tata Housing', 'Lodha Group'],
    brands: ['DLF', 'Godrej Properties', 'Prestige', 'Oberoi', 'Lodha'],
    keywords: ['real estate', 'property', 'housing', 'residential', 'builder', 'apartment']
  },
  {
    sector: 'Tertiary Sector',
    industry: 'Media & Entertainment',
    subCategory: 'Broadcasting & OTT',
    description: 'TV channels, streaming platforms',
    companies: ['Star India', 'Zee Entertainment', 'Sun TV Network', 'Sony India', 'Disney India', 'Viacom18', 'ALTBalaji', 'Hoichoi'],
    brands: ['Star', 'Zee', 'Sony', 'Hotstar', 'Voot'],
    keywords: ['media', 'entertainment', 'ott', 'streaming', 'tv', 'broadcast']
  },
  {
    sector: 'Tertiary Sector',
    industry: 'Telecommunications',
    subCategory: 'Telecom Services',
    description: 'Telecom operators',
    companies: ['Reliance Jio', 'Airtel', 'Vodafone Idea', 'BSNL', 'MTNL'],
    brands: ['Jio', 'Airtel', 'Vi', 'BSNL'],
    keywords: ['telecom', 'mobile', 'network', 'sim', 'data services']
  },
  {
    sector: 'Tertiary Sector',
    industry: 'Logistics & Transportation',
    subCategory: 'Logistics & Supply Chain',
    description: 'Logistics, freight, supply chain',
    companies: ['Allcargo Logistics', 'Gati', 'Blue Dart', 'FedEx India', 'Safexpress', 'TVS Logistics', 'Mahindra Logistics', 'Rivigo', 'Ecom Express'],
    brands: ['Allcargo', 'Gati', 'Blue Dart', 'FedEx'],
    keywords: ['logistics', 'freight', 'supply chain', 'courier', 'transportation']
  }
];

// COMBINED INDUSTRY LIST
export const ALL_INDUSTRIES = [...PRIMARY_INDUSTRIES, ...SECONDARY_INDUSTRIES, ...TERTIARY_INDUSTRIES];

// KEYWORD TO INDUSTRY MAPPING
export const INDUSTRY_KEYWORDS: Record<string, IndustryInfo[]> = {};

// Initialize keyword mapping
ALL_INDUSTRIES.forEach(industry => {
  industry.keywords.forEach(keyword => {
    const key = keyword.toLowerCase();
    if (!INDUSTRY_KEYWORDS[key]) {
      INDUSTRY_KEYWORDS[key] = [];
    }
    INDUSTRY_KEYWORDS[key].push(industry);
  });
});

// BRAND TO COMPANY MAPPING
export const BRAND_TO_INDUSTRY: Record<string, IndustryInfo> = {};
ALL_INDUSTRIES.forEach(industry => {
  industry.brands.forEach(brand => {
    BRAND_TO_INDUSTRY[brand.toLowerCase()] = industry;
  });
  industry.companies.forEach(company => {
    BRAND_TO_INDUSTRY[company.toLowerCase()] = industry;
  });
});

// SECTOR KEYWORDS
export const SECTOR_KEYWORDS: Record<string, string[]> = {
  'primary': ['agriculture', 'farming', 'crop', 'mining', 'raw material', 'mining', 'agri'],
  'secondary': ['manufacturing', 'factory', 'production', 'industrial', 'auto', 'fmcg', 'pharma', 'steel', 'cement', 'textile'],
  'tertiary': ['services', 'banking', 'insurance', 'it', 'software', 'retail', 'hospital', 'logistics', 'real estate', 'media']
};

// INDUSTRY NAME MAPPING - Expanded with all variations
export const INDUSTRY_NAMES: Record<string, string> = {
  // Automobiles
  'automobile': 'Automobiles & Auto Components',
  'auto': 'Automobiles & Auto Components',
  'cars': 'Automobiles & Auto Components',
  'automotive': 'Automobiles & Auto Components',
  'vehicle': 'Automobiles & Auto Components',
  'vehicles': 'Automobiles & Auto Components',
  'four wheeler': 'Automobiles & Auto Components',
  'two wheeler': 'Automobiles & Auto Components',
  'commercial vehicle': 'Automobiles & Auto Components',
  'ev': 'Automobiles & Auto Components',
  'electric vehicle': 'Automobiles & Auto Components',
  
  // FMCG
  'fmcg': 'FMCG (Fast Moving Consumer Goods)',
  'consumer goods': 'FMCG (Fast Moving Consumer Goods)',
  'consumer': 'FMCG (Fast Moving Consumer Goods)',
  'personal care': 'FMCG (Fast Moving Consumer Goods)',
  'soap': 'FMCG (Fast Moving Consumer Goods)',
  'shampoo': 'FMCG (Fast Moving Consumer Goods)',
  'toothpaste': 'FMCG (Fast Moving Consumer Goods)',
  'biscuits': 'FMCG (Fast Moving Consumer Goods)',
  'snacks': 'FMCG (Fast Moving Consumer Goods)',
  'food': 'FMCG (Fast Moving Consumer Goods)',
  'beverages': 'FMCG (Fast Moving Consumer Goods)',
  
  // Pharmaceuticals
  'pharma': 'Pharmaceuticals',
  'pharmaceutical': 'Pharmaceuticals',
  'pharmaceuticals': 'Pharmaceuticals',
  'medicine': 'Pharmaceuticals',
  'drugs': 'Pharmaceuticals',
  'generic': 'Pharmaceuticals',
  
  // Banking & Finance
  'banking': 'Financial Services',
  'bank': 'Financial Services',
  'banks': 'Financial Services',
  'finance': 'Financial Services',
  'financial': 'Financial Services',
  'financial services': 'Financial Services',
  'private bank': 'Financial Services',
  'public sector bank': 'Financial Services',
  'housing finance': 'Financial Services',
  'home loan': 'Financial Services',
  'mortgage': 'Financial Services',
  'nbfc': 'Financial Services',
  'microfinance': 'Financial Services',
  'insurance': 'Financial Services',
  'life insurance': 'Financial Services',
  
  // IT & Technology
  'it': 'Information Technology',
  'it services': 'Information Technology',
  'software': 'Information Technology',
  'technology': 'Information Technology',
  'tech': 'Information Technology',
  'saas': 'Information Technology',
  'cloud': 'Information Technology',
  'software development': 'Information Technology',
  
  // Metals & Materials
  'steel': 'Steel & Metals',
  'metals': 'Steel & Metals',
  'iron': 'Steel & Metals',
  'sponge iron': 'Steel & Metals',
  
  // Cement & Construction
  'cement': 'Cement',
  'concrete': 'Cement',
  
  // Textiles
  'textile': 'Textiles & Apparel',
  'textiles': 'Textiles & Apparel',
  'apparel': 'Textiles & Apparel',
  'fabric': 'Textiles & Apparel',
  'garment': 'Textiles & Apparel',
  'clothing': 'Textiles & Apparel',
  
  // Electronics
  'electronics': 'Electronics (ESDM)',
  'consumer electronics': 'Electronics (ESDM)',
  'appliances': 'Electronics (ESDM)',
  'tv': 'Electronics (ESDM)',
  'smartphone': 'Electronics (ESDM)',
  'mobile': 'Electronics (ESDM)',
  
  // Retail
  'retail': 'Retail',
  'retail chain': 'Retail',
  'supermarket': 'Retail',
  'ecommerce': 'Retail',
  'e commerce': 'Retail',
  
  // Real Estate
  'real estate': 'Real Estate',
  'property': 'Real Estate',
  'real estate developer': 'Real Estate',
  'housing': 'Real Estate',
  'residential': 'Real Estate',
  
  // Healthcare
  'healthcare': 'Healthcare & Life Sciences',
  'health': 'Healthcare & Life Sciences',
  'hospital': 'Healthcare & Life Sciences',
  'hospitals': 'Healthcare & Life Sciences',
  'medical': 'Healthcare & Life Sciences',
  'diagnostic': 'Healthcare & Life Sciences',
  'lab': 'Healthcare & Life Sciences',
  'pathology': 'Healthcare & Life Sciences',
  
  // Media & Entertainment
  'media': 'Media & Entertainment',
  'entertainment': 'Media & Entertainment',
  'ott': 'Media & Entertainment',
  'streaming': 'Media & Entertainment',
  'tv channels': 'Media & Entertainment',
  
  // Telecom
  'telecom': 'Telecommunications',
  'telecommunication': 'Telecommunications',
  'telecom services': 'Telecommunications',
  'mobile network': 'Telecommunications',
  
  // Logistics
  'logistics': 'Logistics & Transportation',
  'transportation': 'Logistics & Transportation',
  'transport': 'Logistics & Transportation',
  'freight': 'Logistics & Transportation',
  'courier': 'Logistics & Transportation',
  'supply chain': 'Logistics & Transportation',
  
  // Energy
  'oil': 'Energy',
  'gas': 'Energy',
  'power': 'Energy',
  'energy': 'Energy',
  'renewable energy': 'Energy',
  'electricity': 'Energy',
  
  // Chemicals
  'chemical': 'Chemicals & Petrochemicals',
  'chemicals': 'Chemicals & Petrochemicals',
  'petrochemical': 'Chemicals & Petrochemicals',
  'agrochemical': 'Chemicals & Petrochemicals',
  
  // Agriculture
  'agriculture': 'Agriculture & Crop Production',
  'farming': 'Agriculture & Crop Production',
  'agri': 'Agriculture & Crop Production',
  'crop': 'Agriculture & Crop Production',
  'pulses': 'Agriculture & Crop Production',
  'oilseeds': 'Agriculture & Crop Production',
  'edible oil': 'Agriculture & Crop Production',
  'sugar': 'Agriculture & Crop Production',
  'sugarcane': 'Agriculture & Crop Production',
  'cotton': 'Agriculture & Crop Production',
  'tea': 'Agriculture & Crop Production',
  'coffee': 'Agriculture & Crop Production',
  'organic': 'Agriculture & Crop Production',
  'horticulture': 'Agriculture & Crop Production',
  'fruits': 'Agriculture & Crop Production',
  'vegetables': 'Agriculture & Crop Production'
};

export function getIndustryByKeyword(keyword: string): IndustryInfo[] {
  return INDUSTRY_KEYWORDS[keyword.toLowerCase()] || [];
}

export function getIndustryByName(name: string): IndustryInfo | null {
  return BRAND_TO_INDUSTRY[name.toLowerCase()] || null;
}

export function getIndustryBySector(sector: string): IndustryInfo[] {
  const all = ALL_INDUSTRIES;
  if (sector.toLowerCase().includes('primary')) {
    return all.filter(i => i.sector === 'Primary Sector');
  }
  if (sector.toLowerCase().includes('secondary')) {
    return all.filter(i => i.sector === 'Secondary Sector');
  }
  if (sector.toLowerCase().includes('tertiary')) {
    return all.filter(i => i.sector === 'Tertiary Sector');
  }
  return all;
}
