/**
 * Multi-Sector Entity Resolver
 * 
 * Handles conglomerates with multiple business segments/sectors.
 * Addresses the issue where companies like Reliance have diverse business units.
 * 
 * Features:
 * - Identify conglomerates
 * - Fetch business unit breakdown
 * - Sector-specific competitor analysis
 * - Multi-sector ML analysis
 * 
 * Version: 9.0
 * Date: February 21, 2026
 */

export interface SectorProfile {
  name: string;
  revenueContribution: number;
  isPrimary: boolean;
  subIndustries: string[];
  competitors: string[];
}

export interface MultiSectorEntity {
  companyName: string;
  isConglomerate: boolean;
  sectors: SectorProfile[];
  primarySector: string;
}

export interface SectorAnalysis {
  sector: string;
  revenueContribution: number;
  metrics: any;
  competitors: string[];
  ranking?: number;
  peerComparison?: any;
}

const KNOWN_CONGLOMERATES: Record<string, SectorProfile[]> = {
  'Reliance Industries': [
    {
      name: 'Oil & Gas',
      revenueContribution: 55,
      isPrimary: true,
      subIndustries: ['Oil Refining', 'Petrochemicals', 'Natural Gas'],
      competitors: ['ONGC', 'IOC', 'BPCL', 'HPCL', 'Shell India', 'Essar Oil']
    },
    {
      name: 'Telecommunications',
      revenueContribution: 25,
      isPrimary: false,
      subIndustries: ['Mobile Networks', 'Broadband', 'Digital Services'],
      competitors: ['Bharti Airtel', 'Vodafone Idea', 'BSNL']
    },
    {
      name: 'Retail',
      revenueContribution: 15,
      isPrimary: false,
      subIndustries: ['E-commerce', 'Physical Retail', 'Fashion', 'Grocery'],
      competitors: ['DMart', 'Flipkart', 'Amazon India', 'BigBazaar', 'Reliance Retail']
    },
    {
      name: 'New Energy',
      revenueContribution: 5,
      isPrimary: false,
      subIndustries: ['Solar', 'Green Energy', 'Hydrogen'],
      competitors: ['Adani Green', 'Tata Power', 'NTPC']
    }
  ],
  'Tata Group': [
    {
      name: 'IT Services',
      revenueContribution: 40,
      isPrimary: true,
      subIndustries: ['Software Services', 'Consulting', 'Digital Transformation'],
      competitors: ['Infosys', 'Wipro', 'HCL Technologies', 'Accenture India']
    },
    {
      name: 'Automobile',
      revenueContribution: 20,
      isPrimary: false,
      subIndustries: ['Passenger Vehicles', 'Commercial Vehicles', 'Electric Vehicles'],
      competitors: ['Maruti Suzuki', 'Hyundai India', 'Mahindra & Mahindra', 'Kia India']
    },
    {
      name: 'Steel',
      revenueContribution: 15,
      isPrimary: false,
      subIndustries: ['Steel Production', 'Alloy Steel', 'Long Products'],
      competitors: ['JSW Steel', 'SAIL', 'NMDC', 'ArcelorMittal Nippon Steel']
    },
    {
      name: 'Consumer',
      revenueContribution: 10,
      isPrimary: false,
      subIndustries: ['Consumer Goods', 'Packaged Foods', 'Beverages', 'Titan'],
      competitors: ['Hindustan Unilever', 'Nestlé India', 'ITC', 'Britannia']
    },
    {
      name: 'Aerospace & Defense',
      revenueContribution: 5,
      isPrimary: false,
      subIndustries: ['Defense', 'Aerospace', 'Civil Aviation'],
      competitors: ['HAL', 'Bharat Electronics', 'Larsen & Toubro']
    }
  ],
  'Aditya Birla Group': [
    {
      name: 'Metals & Mining',
      revenueContribution: 35,
      isPrimary: true,
      subIndustries: ['Aluminum', 'Copper', 'Zinc', 'Fertilizers'],
      competitors: ['Vedanta', 'Hindalco', 'NMDC', 'Coal India']
    },
    {
      name: 'Cement',
      revenueContribution: 25,
      isPrimary: false,
      subIndustries: ['Portland Cement', 'Ready Mix Concrete', 'Building Materials'],
      competitors: ['Ambuja Cements', 'ACC', 'UltraTech Cement', 'Shree Cement']
    },
    {
      name: 'Telecommunications',
      revenueContribution: 20,
      isPrimary: false,
      subIndustries: ['Mobile Services', 'Broadband', 'Digital'],
      competitors: ['Bharti Airtel', 'Reliance Jio', 'Vodafone Idea']
    },
    {
      name: 'Fashion & Retail',
      revenueContribution: 10,
      isPrimary: false,
      subIndustries: ['Apparel', 'Lifestyle', 'Fashion Retail'],
      competitors: ['Future Group', 'Shoppers Stop', 'Lifestyle International']
    },
    {
      name: 'Financial Services',
      revenueContribution: 10,
      isPrimary: false,
      subIndustries: ['NBFC', 'Insurance', 'Asset Management'],
      competitors: ['Bajaj Finserv', 'HDFC', 'ICICI Prudential']
    }
  ],
  'Mahindra Group': [
    {
      name: 'Automobile',
      revenueContribution: 40,
      isPrimary: true,
      subIndustries: ['SUVs', 'Pickups', 'Electric Vehicles', 'Tractors'],
      competitors: ['Tata Motors', 'Maruti Suzuki', 'Toyota Kirloskar', 'Kia India']
    },
    {
      name: 'Farm Equipment',
      revenueContribution: 20,
      isPrimary: false,
      subIndustries: ['Tractors', 'Harvesters', 'Agricultural Machinery'],
      competitors: ['Tafe', 'Escorts Kubota', 'John Deere India']
    },
    {
      name: 'IT Services',
      revenueContribution: 15,
      isPrimary: false,
      subIndustries: ['Software Services', 'Digital Solutions', 'Tech Consulting'],
      competitors: ['TCS', 'Infosys', 'Wipro', 'Tech Mahindra']
    },
    {
      name: 'Real Estate',
      revenueContribution: 10,
      isPrimary: false,
      subIndustries: ['Residential', 'Commercial', 'Mixed Use'],
      competitors: ['Godrej Properties', 'DLF', 'Prestige Group', 'Sobha']
    },
    {
      name: 'Hospitality',
      revenueContribution: 5,
      isPrimary: false,
      subIndustries: ['Hotels', 'Resorts', 'Travel Services'],
      competitors: ['IHCL', 'EIH', 'Lemon Tree', 'oyo']
    }
  ],
  'ITC Limited': [
    {
      name: 'FMCG',
      revenueContribution: 50,
      isPrimary: true,
      subIndustries: ['Foods', 'Personal Care', 'Agri Business', 'Packaged Goods'],
      competitors: ['Hindustan Unilever', 'Nestlé India', 'Britannia', 'Parle']
    },
    {
      name: 'Hotels',
      revenueContribution: 15,
      isPrimary: false,
      subIndustries: ['Luxury Hotels', 'Business Hotels', 'Resorts'],
      competitors: ['IHCL', 'EIH', 'Mahindra Hotels', 'Taj Hotels']
    },
    {
      name: 'Packaging',
      revenueContribution: 15,
      isPrimary: false,
      subIndustries: ['Flexible Packaging', 'Corrugated Boxes', 'FMCG Packaging'],
      competitors: ['Multi Packaging', 'Uflex', 'Astral Packaging']
    },
    {
      name: 'Agri',
      revenueContribution: 10,
      isPrimary: false,
      subIndustries: ['Leaf Tobacco', 'Agri Commodities', 'Food Grains'],
      competitors: ['Adani Wilmar', 'Rallis India', 'PI Industries']
    },
    {
      name: 'Education',
      revenueContribution: 5,
      isPrimary: false,
      subIndustries: ['Schools', 'Colleges', 'Skill Development'],
      competitors: ['Byju\'s', 'Unacademy', 'Vedantu', 'Great Learning']
    }
  ]
};

export class MultiSectorResolver {
  
  async resolveAllSectors(companyName: string): Promise<MultiSectorEntity> {
    const normalizedName = this.normalizeCompanyName(companyName);
    
    const knownConglomerate = KNOWN_CONGLOMERATES[normalizedName];
    
    if (knownConglomerate) {
      return {
        companyName: normalizedName,
        isConglomerate: true,
        sectors: knownConglomerate,
        primarySector: knownConglomerate.find(s => s.isPrimary)?.name || knownConglomerate[0].name
      };
    }

    const singleSector = await this.resolveSingleSector(companyName);
    
    return {
      companyName,
      isConglomerate: false,
      sectors: [{
        name: singleSector,
        revenueContribution: 100,
        isPrimary: true,
        subIndustries: [],
        competitors: []
      }],
      primarySector: singleSector
    };
  }

  private normalizeCompanyName(name: string): string {
    const normalized = name.toLowerCase().trim();
    
    const nameMappings: Record<string, string> = {
      'reliance': 'Reliance Industries',
      'reliance industries limited': 'Reliance Industries',
      'tata': 'Tata Group',
      'tata group': 'Tata Group',
      'aditya birla': 'Aditya Birla Group',
      'aditya birla group': 'Aditya Birla Group',
      'mahindra': 'Mahindra Group',
      'mahindra and mahindra': 'Mahindra Group',
      'itc': 'ITC Limited',
      'itc limited': 'ITC Limited'
    };

    return nameMappings[normalized] || name;
  }

  private async resolveSingleSector(companyName: string): Promise<string> {
    const industryMappings: Record<string, string> = {
      'TCS': 'IT Services',
      'Infosys': 'IT Services',
      'Wipro': 'IT Services',
      'HCL Technologies': 'IT Services',
      'Tech Mahindra': 'IT Services',
      'HDFC Bank': 'Banking',
      'ICICI Bank': 'Banking',
      'State Bank of India': 'Banking',
      'Kotak Mahindra Bank': 'Banking',
      'Axis Bank': 'Banking',
      'Bajaj Finance': 'Financial Services',
      'Bajaj Finserv': 'Financial Services',
      'Maruti Suzuki': 'Automobile',
      'Hyundai India': 'Automobile',
      'Kia India': 'Automobile',
      'Toyota Kirloskar': 'Automobile',
      'Sun Pharmaceutical': 'Pharmaceuticals',
      'Dr. Reddy\'s': 'Pharmaceuticals',
      'Cipla': 'Pharmaceuticals',
      'Divi\'s Labs': 'Pharmaceuticals',
      'Asian Paints': 'Chemicals',
      'Nerolac Paints': 'Chemicals',
      'Berger Paints': 'Chemicals',
      'Hindustan Unilever': 'FMCG',
      'Nestlé India': 'FMCG',
      'Britannia': 'FMCG',
      'Parle Products': 'FMCG',
      'JSW Steel': 'Steel',
      'Tata Steel': 'Steel',
      'SAIL': 'Steel',
      'NTPC': 'Power',
      'Tata Power': 'Power',
      'Adani Power': 'Power',
      'Bharti Airtel': 'Telecommunications',
      'Vodafone Idea': 'Telecommunications'
    };

    return industryMappings[companyName] || 'Default';
  }

  async analyzeForSector(
    companyName: string,
    sectorName: string
  ): Promise<SectorAnalysis | null> {
    const entity = await this.resolveAllSectors(companyName);
    
    if (!entity.isConglomerate) {
      return null;
    }

    const sectorProfile = entity.sectors.find(
      s => s.name.toLowerCase() === sectorName.toLowerCase()
    );

    if (!sectorProfile) {
      return null;
    }

    return {
      sector: sectorProfile.name,
      revenueContribution: sectorProfile.revenueContribution,
      metrics: null,
      competitors: sectorProfile.competitors,
      ranking: undefined,
      peerComparison: undefined
    };
  }

  getConglomerates(): string[] {
    return Object.keys(KNOWN_CONGLOMERATES);
  }

  isConglomerate(companyName: string): boolean {
    const normalized = this.normalizeCompanyName(companyName);
    return normalized in KNOWN_CONGLOMERATES;
  }

  getSectorsForCompany(companyName: string): SectorProfile[] | null {
    const normalized = this.normalizeCompanyName(companyName);
    return KNOWN_CONGLOMERATES[normalized] || null;
  }
}

export default MultiSectorResolver;
