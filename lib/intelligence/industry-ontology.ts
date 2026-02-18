/**
 * Industry Ontology Layer
 * 
 * FIX 2: Entity Resolution Enhancement
 * - Industry → Subcategory mapping
 * - Resolves entity → subcategory FIRST, not just top-level industry
 * - This fixes: generic outputs, wrong competitors, vague analysis
 */

export interface IndustryNode {
  name: string;
  level: 'sector' | 'industry' | 'subindustry';
  parent?: string;
  keywords: string[];
  competitors?: string[];
}

export const INDUSTRY_ONTOLOGY: Record<string, IndustryNode> = {
  // AUTOMOTIVE
  'Automotive': {
    name: 'Automotive',
    level: 'sector',
    keywords: ['vehicle', 'car', 'automobile', 'auto'],
  },
  'Electric Vehicles': {
    name: 'Electric Vehicles',
    level: 'industry',
    parent: 'Automotive',
    keywords: ['ev', 'electric vehicle', 'evs', 'battery', 'charging'],
  },
  'ICE Vehicles': {
    name: 'ICE Vehicles',
    level: 'industry',
    parent: 'Automotive',
    keywords: ['internal combustion', 'petrol', 'diesel', 'gasoline'],
  },
  'Commercial Vehicles': {
    name: 'Commercial Vehicles',
    level: 'subindustry',
    parent: 'Automotive',
    keywords: ['truck', 'bus', 'commercial', 'fleet', 'logistics'],
  },
  'Two-Wheelers': {
    name: 'Two-Wheelers',
    level: 'subindustry',
    parent: 'Automotive',
    keywords: ['motorcycle', 'scooter', 'bike', 'two wheeler'],
  },
  'EV Batteries': {
    name: 'EV Batteries',
    level: 'subindustry',
    parent: 'Electric Vehicles',
    keywords: ['battery', 'lithium', 'cell', 'energy storage'],
  },
  'EV Charging': {
    name: 'EV Charging',
    level: 'subindustry',
    parent: 'Electric Vehicles',
    keywords: ['charging station', 'charging infrastructure', 'charger'],
  },

  // PHARMA
  'Pharmaceuticals': {
    name: 'Pharmaceuticals',
    level: 'sector',
    keywords: ['pharma', 'drug', 'medicine', 'pharmaceutical'],
  },
  'Generic Drugs': {
    name: 'Generic Drugs',
    level: 'industry',
    parent: 'Pharmaceuticals',
    keywords: ['generic', 'generics', 'off-patent'],
  },
  'API Manufacturing': {
    name: 'API Manufacturing',
    level: 'subindustry',
    parent: 'Pharmaceuticals',
    keywords: ['api', 'active pharmaceutical ingredient', 'bulk drug'],
  },
  'Formulations': {
    name: 'Formulations',
    level: 'subindustry',
    parent: 'Pharmaceuticals',
    keywords: ['formulation', 'tablet', 'capsule', 'syrup'],
  },

  // IT SERVICES
  'IT Services': {
    name: 'IT Services',
    level: 'sector',
    keywords: ['it', 'information technology', 'software', 'services'],
  },
  'Software Services': {
    name: 'Software Services',
    level: 'industry',
    parent: 'IT Services',
    keywords: ['software', 'saas', 'cloud', 'app development'],
  },
  'IT Consulting': {
    name: 'IT Consulting',
    level: 'industry',
    parent: 'IT Services',
    keywords: ['consulting', 'advisory', 'digital transformation'],
  },
  'BPO': {
    name: 'BPO',
    level: 'subindustry',
    parent: 'IT Services',
    keywords: ['bpo', 'outsourcing', 'kpo', 'process outsourcing'],
  },

  // BANKING
  'Banking': {
    name: 'Banking',
    level: 'sector',
    keywords: ['bank', 'banking', 'financial services'],
  },
  'Private Banking': {
    name: 'Private Banking',
    level: 'industry',
    parent: 'Banking',
    keywords: ['private bank', 'wealth management', 'nri'],
  },
  'Public Banking': {
    name: 'Public Banking',
    level: 'industry',
    parent: 'Banking',
    keywords: ['public sector bank', 'psu bank', 'govt bank'],
  },
  'Universal Banking': {
    name: 'Universal Banking',
    level: 'industry',
    parent: 'Banking',
    keywords: ['universal bank', '多元金融'],
  },
  'NBFC': {
    name: 'NBFC',
    level: 'industry',
    parent: 'Banking',
    keywords: ['nbfc', 'non-banking', 'housing finance', 'microfinance'],
  },

  // FMCG
  'FMCG': {
    name: 'FMCG',
    level: 'sector',
    keywords: ['fmcg', 'consumer goods', 'fast moving consumer goods'],
  },
  'Consumer Food': {
    name: 'Consumer Food',
    level: 'industry',
    parent: 'FMCG',
    keywords: ['food', 'packaged food', 'confectionery', 'beverages'],
  },
  'Personal Care': {
    name: 'Personal Care',
    level: 'industry',
    parent: 'FMCG',
    keywords: ['personal care', 'cosmetics', 'beauty', 'skincare'],
  },
  'Household Care': {
    name: 'Household Care',
    level: 'industry',
    parent: 'FMCG',
    keywords: ['household', 'cleaning', 'detergent', 'soap'],
  },

  // STEEL
  'Steel': {
    name: 'Steel',
    level: 'sector',
    keywords: ['steel', 'iron', 'metal', 'ferrous'],
  },
  'Flat Steel': {
    name: 'Flat Steel',
    level: 'industry',
    parent: 'Steel',
    keywords: ['flat steel', 'coils', 'sheets', 'plates'],
  },
  'Long Steel': {
    name: 'Long Steel',
    level: 'industry',
    parent: 'Steel',
    keywords: ['long steel', 'bars', 'rods', 'structurals'],
  },
  'Alloy Steel': {
    name: 'Alloy Steel',
    level: 'subindustry',
    parent: 'Steel',
    keywords: ['alloy', 'special steel', 'stainless'],
  },

  // TELECOM
  'Telecom': {
    name: 'Telecom',
    level: 'sector',
    keywords: ['telecom', 'telecommunication', 'mobile', 'wireless'],
  },
  'Wireless Telecom': {
    name: 'Wireless Telecom',
    level: 'industry',
    parent: 'Telecom',
    keywords: ['wireless', 'mobile operator', 'isp', '4g', '5g'],
  },
  'Telecom Infrastructure': {
    name: 'Telecom Infrastructure',
    level: 'subindustry',
    parent: 'Telecom',
    keywords: ['towers', 'fiber', 'infrastructure', 'dark fiber'],
  },

  // POWER
  'Power': {
    name: 'Power',
    level: 'sector',
    keywords: ['power', 'energy', 'electricity', 'generation'],
  },
  'Thermal Power': {
    name: 'Thermal Power',
    level: 'industry',
    parent: 'Power',
    keywords: ['thermal', 'coal', 'gas', 'thermal power plant'],
  },
  'Renewable Power': {
    name: 'Renewable Power',
    level: 'industry',
    parent: 'Power',
    keywords: ['renewable', 'solar', 'wind', 'hydro', 'green energy'],
  },
  'Power Distribution': {
    name: 'Power Distribution',
    level: 'subindustry',
    parent: 'Power',
    keywords: ['distribution', 'discom', 'power retail'],
  },

  // OIL & GAS
  'Oil & Gas': {
    name: 'Oil & Gas',
    level: 'sector',
    keywords: ['oil', 'gas', 'petroleum', 'hydrocarbon'],
  },
  'Exploration & Production': {
    name: 'Exploration & Production',
    level: 'industry',
    parent: 'Oil & Gas',
    keywords: ['e&p', 'exploration', 'production', 'upstream'],
  },
  'Refining & Marketing': {
    name: 'Refining & Marketing',
    level: 'industry',
    parent: 'Oil & Gas',
    keywords: ['refinery', 'marketing', 'downstream', 'oil marketing'],
  },

  // REAL ESTATE
  'Real Estate': {
    name: 'Real Estate',
    level: 'sector',
    keywords: ['real estate', 'property', 'housing', 'construction'],
  },
  'Residential': {
    name: 'Residential',
    level: 'industry',
    parent: 'Real Estate',
    keywords: ['residential', 'housing', 'apartments', 'homes'],
  },
  'Commercial': {
    name: 'Commercial',
    level: 'industry',
    parent: 'Real Estate',
    keywords: ['commercial', 'office', 'retail', 'warehousing'],
  },
};

export class IndustryOntology {
  private cache: Map<string, { industry: string; subindustry: string }> = new Map();
  
  resolveIndustry(entityName: string, searchContext: string): { industry: string; subindustry: string } {
    const cacheKey = `${entityName}-${searchContext.substring(0, 50)}`;
    
    if (this.cache.has(cacheKey)) {
      return this.cache.get(cacheKey)!;
    }
    
    const combinedText = `${entityName} ${searchContext}`.toLowerCase();
    
    // First try to match subindustry (most specific)
    for (const [key, node] of Object.entries(INDUSTRY_ONTOLOGY)) {
      if (node.level === 'subindustry') {
        for (const keyword of node.keywords) {
          if (combinedText.includes(keyword)) {
            const result = {
              subindustry: node.name,
              industry: node.parent || key,
            };
            this.cache.set(cacheKey, result);
            return result;
          }
        }
      }
    }
    
    // Then try industry level
    for (const [key, node] of Object.entries(INDUSTRY_ONTOLOGY)) {
      if (node.level === 'industry') {
        for (const keyword of node.keywords) {
          if (combinedText.includes(keyword)) {
            const result = {
              industry: node.name,
              subindustry: node.parent || '',
            };
            this.cache.set(cacheKey, result);
            return result;
          }
        }
      }
    }
    
    // Default to sector level
    for (const [key, node] of Object.entries(INDUSTRY_ONTOLOGY)) {
      if (node.level === 'sector') {
        for (const keyword of node.keywords) {
          if (combinedText.includes(keyword)) {
            const result = {
              industry: node.name,
              subindustry: '',
            };
            this.cache.set(cacheKey, result);
            return result;
          }
        }
      }
    }
    
    // Default fallback
    const result = { industry: 'Unknown', subindustry: '' };
    this.cache.set(cacheKey, result);
    return result;
  }
  
  getSubcategories(industry: string): string[] {
    const subcategories: string[] = [];
    for (const node of Object.values(INDUSTRY_ONTOLOGY)) {
      if (node.parent === industry || node.name === industry) {
        subcategories.push(node.name);
      }
    }
    return subcategories;
  }
  
  getCompetitorsForIndustry(industry: string): string[] {
    const competitors: string[] = [];
    const industryNode = INDUSTRY_ONTOLOGY[industry];
    
    if (industryNode?.competitors) {
      competitors.push(...industryNode.competitors);
    }
    
    return competitors;
  }
  
  clearCache(): void {
    this.cache.clear();
  }
}

let ontologyInstance: IndustryOntology | null = null;

export function getIndustryOntology(): IndustryOntology {
  if (!ontologyInstance) {
    ontologyInstance = new IndustryOntology();
  }
  return ontologyInstance;
}
