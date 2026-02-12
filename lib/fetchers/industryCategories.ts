// Industry Categories and Sub-categories System

export interface CategoryData {
  name: string
  marketShare: number // Percentage of parent industry
  growthRate: number // Annual growth %
  avgMargin: number // Average EBITDA %
  keyPlayers: string[]
  description: string
}

export interface IndustryCategory {
  industry: string
  categories: CategoryData[]
}

// Comprehensive category mappings for all major industries
export const INDUSTRY_CATEGORIES: Record<string, CategoryData[]> = {
  'FMCG': [
    {
      name: 'Personal Care',
      marketShare: 28,
      growthRate: 12,
      avgMargin: 22,
      keyPlayers: ['HUL', 'P&G', 'Dabur', 'Marico', 'Emami'],
      description: 'Hair care, skin care, oral care, deodorants'
    },
    {
      name: 'Home Care',
      marketShare: 24,
      growthRate: 10,
      avgMargin: 18,
      keyPlayers: ['HUL', 'P&G', 'Reckitt', 'Godrej'],
      description: 'Detergents, surface cleaners, dishwash, air fresheners'
    },
    {
      name: 'Food & Beverages',
      marketShare: 35,
      growthRate: 15,
      avgMargin: 16,
      keyPlayers: ['Nestle', 'ITC', 'Britannia', 'PepsiCo', 'Coca-Cola'],
      description: 'Packaged foods, snacks, beverages, dairy'
    },
    {
      name: 'Health & Wellness',
      marketShare: 13,
      growthRate: 22,
      avgMargin: 25,
      keyPlayers: ['Himalaya', 'Dabur', 'Patanjali', 'Amway'],
      description: 'Ayurvedic products, supplements, herbal care'
    }
  ],
  
  'IT': [
    {
      name: 'Software Services',
      marketShare: 42,
      growthRate: 15,
      avgMargin: 24,
      keyPlayers: ['TCS', 'Infosys', 'Wipro', 'HCL', 'Tech Mahindra'],
      description: 'IT consulting, application development, maintenance'
    },
    {
      name: 'BPO & KPO',
      marketShare: 18,
      growthRate: 8,
      avgMargin: 18,
      keyPlayers: ['Genpact', 'WNS', 'EXL', 'WNS'],
      description: 'Business process outsourcing, knowledge process outsourcing'
    },
    {
      name: 'Cloud & Infrastructure',
      marketShare: 25,
      growthRate: 35,
      avgMargin: 20,
      keyPlayers: ['TCS', 'Infosys', 'AWS India', 'Azure India', 'Google Cloud'],
      description: 'Cloud migration, infrastructure management, DevOps'
    },
    {
      name: 'Product Engineering',
      marketShare: 15,
      growthRate: 25,
      avgMargin: 28,
      keyPlayers: ['LTTS', 'Persistent', 'Zensar', 'Happiest Minds'],
      description: 'R&D services, product development, testing'
    }
  ],
  
  'Pharma': [
    {
      name: 'Generic Medicines',
      marketShare: 35,
      growthRate: 12,
      avgMargin: 20,
      keyPlayers: ['Sun Pharma', 'Cipla', 'Dr Reddy', 'Lupin', 'Aurobindo'],
      description: 'Generic drugs, APIs, bulk drugs'
    },
    {
      name: 'Branded Formulations',
      marketShare: 28,
      growthRate: 9,
      avgMargin: 24,
      keyPlayers: ['Abbott', 'Pfizer', 'Cipla', 'Zydus', 'Alkem'],
      description: 'Branded prescription drugs, OTC medicines'
    },
    {
      name: 'Biologics & Biosimilars',
      marketShare: 15,
      growthRate: 18,
      avgMargin: 32,
      keyPlayers: ['Biocon', 'Dr Reddy', 'Cipla', 'Zydus', 'Intas'],
      description: 'Vaccines, biosimilars, monoclonal antibodies'
    },
    {
      name: 'Contract Research',
      marketShare: 12,
      growthRate: 22,
      avgMargin: 26,
      keyPlayers: ['Syngene', 'Aragen', 'GVK Bio', 'Piramal'],
      description: 'Clinical trials, drug discovery, research services'
    },
    {
      name: 'Ayurvedic & Herbal',
      marketShare: 10,
      growthRate: 28,
      avgMargin: 28,
      keyPlayers: ['Himalaya', 'Dabur', 'Patanjali', 'Baidyanath'],
      description: 'Traditional medicines, herbal supplements'
    }
  ],
  
  'Banking': [
    {
      name: 'Retail Banking',
      marketShare: 45,
      growthRate: 12,
      avgMargin: 26,
      keyPlayers: ['HDFC Bank', 'ICICI Bank', 'SBI', 'Axis Bank', 'Kotak'],
      description: 'Personal loans, deposits, credit cards'
    },
    {
      name: 'Corporate Banking',
      marketShare: 30,
      growthRate: 10,
      avgMargin: 28,
      keyPlayers: ['HDFC Bank', 'ICICI Bank', 'Axis Bank', 'Yes Bank'],
      description: 'Working capital, term loans, trade finance'
    },
    {
      name: 'Investment Banking',
      marketShare: 12,
      growthRate: 18,
      avgMargin: 45,
      keyPlayers: ['HDFC Bank', 'ICICI Securities', 'Axis Capital', 'Kotak'],
      description: 'M&A, IPOs, debt syndication'
    },
    {
      name: 'Digital Payments',
      marketShare: 13,
      growthRate: 55,
      avgMargin: 15,
      keyPlayers: ['Paytm', 'PhonePe', 'Google Pay', 'Razorpay'],
      description: 'UPI, wallets, payment gateways'
    }
  ],
  
  'Automobile': [
    {
      name: 'Passenger Vehicles',
      marketShare: 38,
      growthRate: 8,
      avgMargin: 11,
      keyPlayers: ['Maruti', 'Tata Motors', 'Hyundai', 'Mahindra', 'Toyota'],
      description: 'Cars, SUVs, MUVs'
    },
    {
      name: 'Two Wheelers',
      marketShare: 32,
      growthRate: 6,
      avgMargin: 13,
      keyPlayers: ['Hero', 'Honda', 'TVS', 'Bajaj', 'Royal Enfield'],
      description: 'Motorcycles, scooters'
    },
    {
      name: 'Commercial Vehicles',
      marketShare: 18,
      growthRate: 12,
      avgMargin: 8,
      keyPlayers: ['Tata Motors', 'Ashok Leyland', 'VECV', 'Mahindra'],
      description: 'Trucks, buses, LCVs'
    },
    {
      name: 'Electric Vehicles',
      marketShare: 12,
      growthRate: 85,
      avgMargin: 5,
      keyPlayers: ['Tata Motors', 'Mahindra', 'MG', 'BYD', 'Hyundai'],
      description: 'EV cars, e-scooters, e-buses'
    }
  ],
  
  'Textile': [
    {
      name: 'Readymade Garments',
      marketShare: 40,
      growthRate: 15,
      avgMargin: 14,
      keyPlayers: ['Page Industries', 'Raymond', 'Arvind', 'Zodiac'],
      description: 'Shirts, trousers, innerwear'
    },
    {
      name: 'Denim',
      marketShare: 15,
      growthRate: 8,
      avgMargin: 16,
      keyPlayers: ['Arvind', 'KG Denim', 'Raymond', 'Nandan'],
      description: 'Denim fabric, jeans'
    },
    {
      name: 'Technical Textiles',
      marketShare: 20,
      growthRate: 25,
      avgMargin: 22,
      keyPlayers: ['Garware', 'SRF', 'Fabindia', 'BSL'],
      description: 'Industrial textiles, medical textiles'
    },
    {
      name: 'Home Textiles',
      marketShare: 25,
      growthRate: 12,
      avgMargin: 13,
      keyPlayers: ['Trident', 'Welspun', 'D Decor', ' exporters'],
      description: 'Bed linen, towels, carpets'
    }
  ],
  
  'Food Processing': [
    {
      name: 'Dairy',
      marketShare: 35,
      growthRate: 14,
      avgMargin: 10,
      keyPlayers: ['Amul', 'Mother Dairy', 'Nestle', 'Danone'],
      description: 'Milk, yogurt, cheese, ice cream'
    },
    {
      name: 'Snacks & Confectionery',
      marketShare: 25,
      growthRate: 18,
      avgMargin: 15,
      keyPlayers: ['Haldiram', 'Bikaji', 'Parle', 'Britannia'],
      description: 'Namkeen, sweets, chocolates'
    },
    {
      name: 'Beverages',
      marketShare: 20,
      growthRate: 10,
      avgMargin: 20,
      keyPlayers: ['Coca-Cola', 'PepsiCo', 'Dabur', 'Parle Agro'],
      description: 'Soft drinks, juices, water'
    },
    {
      name: 'Packaged Foods',
      marketShare: 20,
      growthRate: 16,
      avgMargin: 18,
      keyPlayers: ['Nestle', 'ITC', 'MTR', 'Gits'],
      description: 'Instant foods, spices, pickles'
    }
  ],
  
  'Real Estate': [
    {
      name: 'Residential',
      marketShare: 55,
      growthRate: 8,
      avgMargin: 22,
      keyPlayers: ['DLF', 'Lodha', 'Godrej Properties', 'Oberoi'],
      description: 'Apartments, villas, townships'
    },
    {
      name: 'Commercial',
      marketShare: 25,
      growthRate: 12,
      avgMargin: 28,
      keyPlayers: ['DLF', 'BPTP', 'Embassy', 'Prestige'],
      description: 'Offices, retail spaces, malls'
    },
    {
      name: 'Industrial',
      marketShare: 12,
      growthRate: 15,
      avgMargin: 24,
      keyPlayers: ['DLF', 'Reliance Industrial', 'Gujarat Industrial'],
      description: 'Warehouses, factories, SEZs'
    },
    {
      name: 'Warehousing & Logistics',
      marketShare: 8,
      growthRate: 35,
      avgMargin: 32,
      keyPlayers: ['Allcargo', 'Mahindra Logistics', 'Delhivery'],
      description: 'Cold storage, distribution centers'
    }
  ],
  
  'Hospitality': [
    {
      name: 'Hotels & Resorts',
      marketShare: 40,
      growthRate: 18,
      avgMargin: 24,
      keyPlayers: ['Taj', 'Oberoi', 'ITC Hotels', 'Lemon Tree'],
      description: 'Luxury, business, budget hotels'
    },
    {
      name: 'Food Service',
      marketShare: 35,
      growthRate: 22,
      avgMargin: 18,
      keyPlayers: ['Jubilant FoodWorks', 'Westlife', 'Sapphire Foods'],
      description: 'QSR, fine dining, cafes'
    },
    {
      name: 'Cloud Kitchen',
      marketShare: 15,
      growthRate: 65,
      avgMargin: 12,
      keyPlayers: ['Rebel Foods', 'Swiggy Access', 'Zomato Kitchen'],
      description: 'Virtual restaurants, delivery-only'
    },
    {
      name: 'Travel & Tourism',
      marketShare: 10,
      growthRate: 25,
      avgMargin: 20,
      keyPlayers: ['MakeMyTrip', 'Yatra', 'ClearTrip', 'EaseMyTrip'],
      description: 'OTA, tour operators, travel agencies'
    }
  ],
  
  'E-commerce': [
    {
      name: 'Fashion & Apparel',
      marketShare: 30,
      growthRate: 25,
      avgMargin: 25,
      keyPlayers: ['Myntra', 'AJIO', 'Nykaa Fashion', 'Tata Cliq'],
      description: 'Clothing, footwear, accessories'
    },
    {
      name: 'Electronics',
      marketShare: 25,
      growthRate: 20,
      avgMargin: 12,
      keyPlayers: ['Amazon', 'Flipkart', 'Croma', 'Reliance Digital'],
      description: 'Mobiles, laptops, appliances'
    },
    {
      name: 'Grocery',
      marketShare: 22,
      growthRate: 55,
      avgMargin: 8,
      keyPlayers: ['Blinkit', 'Zepto', 'Instamart', 'BigBasket'],
      description: 'Quick commerce, online grocery'
    },
    {
      name: 'Beauty & Personal Care',
      marketShare: 15,
      growthRate: 45,
      avgMargin: 35,
      keyPlayers: ['Nykaa', 'Purplle', 'Sugar', 'MyGlamm'],
      description: 'Cosmetics, skincare, grooming'
    },
    {
      name: 'Home & Furniture',
      marketShare: 8,
      growthRate: 28,
      avgMargin: 18,
      keyPlayers: ['Pepperfry', 'Urban Ladder', 'IKEA India', 'Wakefit'],
      description: 'Furniture, home decor, kitchen'
    }
  ],
  
  'Education': [
    {
      name: 'K-12 Schools',
      marketShare: 35,
      growthRate: 10,
      avgMargin: 28,
      keyPlayers: ['DPS', 'Ryan', 'KV', 'EuroKids'],
      description: 'Primary, secondary education'
    },
    {
      name: 'Higher Education',
      marketShare: 25,
      growthRate: 8,
      avgMargin: 32,
      keyPlayers: ['Amity', 'Manipal', 'Lovely', 'VIT'],
      description: 'Universities, colleges'
    },
    {
      name: 'EdTech',
      marketShare: 20,
      growthRate: 45,
      avgMargin: 15,
      keyPlayers: ['BYJUs', 'Unacademy', 'Vedantu', 'WhiteHat Jr'],
      description: 'Online learning, test prep'
    },
    {
      name: 'Test Prep',
      marketShare: 12,
      growthRate: 18,
      avgMargin: 38,
      keyPlayers: ['Aakash', 'Allen', 'Resonance', 'Career Launcher'],
      description: 'JEE, NEET, CAT coaching'
    },
    {
      name: 'Vocational Training',
      marketShare: 8,
      growthRate: 30,
      avgMargin: 22,
      keyPlayers: ['NSDC', 'Aptech', 'NIIT', 'Jetking'],
      description: 'Skill development, certification'
    }
  ],
  
  'Healthcare': [
    {
      name: 'Hospitals',
      marketShare: 45,
      growthRate: 15,
      avgMargin: 18,
      keyPlayers: ['Apollo', 'Max', 'Fortis', 'Aster', 'Narayana'],
      description: 'Multi-specialty, super-specialty hospitals'
    },
    {
      name: 'Diagnostics',
      marketShare: 20,
      growthRate: 18,
      avgMargin: 24,
      keyPlayers: ['Dr Lal PathLabs', 'SRL', 'Thyrocare', 'Metropolis'],
      description: 'Pathology, radiology, imaging'
    },
    {
      name: 'Pharmacy Retail',
      marketShare: 18,
      growthRate: 22,
      avgMargin: 12,
      keyPlayers: ['Apollo Pharmacy', 'MedPlus', 'Netmeds', '1mg'],
      description: 'Retail pharmacies, online pharmacy'
    },
    {
      name: 'Medical Devices',
      marketShare: 12,
      growthRate: 25,
      avgMargin: 20,
      keyPlayers: ['Siemens', 'GE Healthcare', 'Medtronic', 'Transasia'],
      description: 'Diagnostic equipment, surgical tools'
    },
    {
      name: 'Telemedicine',
      marketShare: 5,
      growthRate: 75,
      avgMargin: 28,
      keyPlayers: ['Practo', 'DocsApp', 'Medlife', '1mg'],
      description: 'Online consultations, e-prescriptions'
    }
  ]
}

// Default categories for industries without specific mapping
export const DEFAULT_CATEGORIES: CategoryData[] = [
  {
    name: 'Products',
    marketShare: 60,
    growthRate: 12,
    avgMargin: 18,
    keyPlayers: ['Leading Companies'],
    description: 'Core products and services'
  },
  {
    name: 'Services',
    marketShare: 40,
    growthRate: 15,
    avgMargin: 22,
    keyPlayers: ['Service Providers'],
    description: 'Support and ancillary services'
  }
]

/**
 * Get categories for an industry
 */
export function getIndustryCategories(industry: string): CategoryData[] {
  const normalized = industry.toLowerCase()
  
  for (const [key, categories] of Object.entries(INDUSTRY_CATEGORIES)) {
    if (normalized.includes(key.toLowerCase())) {
      return categories
    }
  }
  
  return DEFAULT_CATEGORIES
}

/**
 * Get category by name within an industry
 */
export function getCategoryByName(industry: string, categoryName: string): CategoryData | null {
  const categories = getIndustryCategories(industry)
  return categories.find(c => 
    c.name.toLowerCase() === categoryName.toLowerCase()
  ) || null
}

/**
 * Calculate weighted average metrics for an industry
 */
export function calculateIndustryMetrics(industry: string) {
  const categories = getIndustryCategories(industry)
  
  const totalMarketShare = categories.reduce((sum, c) => sum + c.marketShare, 0)
  const weightedGrowth = categories.reduce((sum, c) => sum + (c.growthRate * c.marketShare), 0) / totalMarketShare
  const weightedMargin = categories.reduce((sum, c) => sum + (c.avgMargin * c.marketShare), 0) / totalMarketShare
  
  return {
    categories: categories.length,
    avgGrowthRate: Math.round(weightedGrowth),
    avgMargin: Math.round(weightedMargin),
    totalMarketShare,
    topCategory: categories.sort((a, b) => b.marketShare - a.marketShare)[0]
  }
}

/**
 * Get trending categories (high growth)
 */
export function getTrendingCategories(industry: string): CategoryData[] {
  const categories = getIndustryCategories(industry)
  return categories
    .filter(c => c.growthRate > 20)
    .sort((a, b) => b.growthRate - a.growthRate)
}

/**
 * Get all category names for search suggestions
 */
export function getAllCategoryNames(): string[] {
  const allCategories: string[] = []
  
  Object.values(INDUSTRY_CATEGORIES).forEach(categories => {
    categories.forEach(cat => {
      allCategories.push(cat.name)
    })
  })
  
  return [...new Set(allCategories)]
}
