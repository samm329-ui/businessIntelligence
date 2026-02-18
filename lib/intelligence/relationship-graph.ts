export type RelationshipType = 'competitor' | 'subsidiary' | 'parent' | 'acquirer' | 'partner' | 'supplier' | 'customer' | 'emerging';

export interface CompanyRelationship {
  company: string;
  relatedCompany: string;
  relationshipType: RelationshipType;
  source?: string;
  confidence: number;
  detectedAt: string;
}

export interface RelationshipGraph {
  nodes: Map<string, CompanyNode>;
  edges: CompanyRelationship[];
}

export interface CompanyNode {
  name: string;
  aliases: string[];
  ticker?: string;
  industry?: string;
  subIndustry?: string;
  type: 'company' | 'brand' | 'subsidiary' | 'parent';
  parentCompany?: string;
}

const RELATIONSHIP_PATTERNS: Record<RelationshipType, RegExp[]> = {
  competitor: [
    /(?:vs|versus|competes?\s+with|competitor\s+to)\s+([A-Z][a-zA-Z]+(?:\s+[A-Z][a-zA-Z]+)?)/gi,
    /(?:key\s+competitor|main\s+competitor|top\s+competitor)[:\s]+([A-Z][a-zA-Z\s,]+?)(?:\.|$)/gi,
    /(?:market\s+leader|top\s+player|key\s+player)[s]?\s*(?:include|are|:)\s*([A-Z][a-zA-Z\s,]+)/gi,
    /(?:rivals?|peer\s+companies?)[:\s]+([A-Z][a-zA-Z\s,]+)/gi,
  ],
  subsidiary: [
    /(?:subsidiary|unit|division)\s+of\s+([A-Z][a-zA-Z]+(?:\s+[A-Z][a-zA-Z]+)?)/gi,
    /([A-Z][a-zA-Z]+(?:\s+[A-Z][a-zA-Z]+)?)\s+(?:subsidiary|unit|division)/gi,
    /(?:owned\s+by|wholly\s+owned\s+by|controlled\s+by)\s+([A-Z][a-zA-Z]+)/gi,
    /([A-Z][a-zA-Z]+)\s+is\s+(?:a\s+)?(?:subsidiary|unit)\s+of/gi,
  ],
  parent: [
    /parent\s+company[:\s]+([A-Z][a-zA-Z]+(?:\s+[A-Z][a-zA-Z]+)?)/gi,
    /([A-Z][a-zA-Z]+)\s+owns?\s+(?:all\s+)?(?:of\s+)?(?:the\s+)?(?:shares?|stake)/gi,
    /holding\s+company[:\s]+([A-Z][a-zA-Z]+)/gi,
  ],
  acquirer: [
    /(?:acquired|acquisition|acquire[d]?\s+by)\s+([A-Z][a-zA-Z]+)/gi,
    /([A-Z][a-zA-Z]+)\s+(?:acquired|acquire[d]?|bought)\s+(?:by|)/gi,
    /merger\s+with\s+([A-Z][a-zA-Z]+)/gi,
  ],
  partner: [
    /(?:partnered?\s+with|strategic\s+alliance|joint\s+venture)\s+([A-Z][a-zA-Z]+)/gi,
    /([A-Z][a-zA-Z]+)\s+(?:partnered?\s+with|allied\s+with)/gi,
  ],
  supplier: [
    /(?:supplier|vendor|provider)\s+to\s+([A-Z][a-zA-Z]+)/gi,
    /supplies?\s+to\s+([A-Z][a-zA-Z]+)/gi,
    /(?:key\s+supplier|major\s+supplier)[:\s]+([A-Z][a-zA-Z]+)/gi,
  ],
  customer: [
    /(?:customer|client)\s+of\s+([A-Z][a-zA-Z]+)/gi,
    /([A-Z][a-zA-Z]+)\s+(?:customers?|clients?)/gi,
  ],
  emerging: [
    /(?:emerging|new\s+ entrant|disruptor)[s]?\s+in\s+(?:the\s+)?([A-Z][a-zA-Z]+)/gi,
    /(?:startup|new\s+player)[s]?\s+(?:in|to)\s+([A-Z][a-zA-Z]+)/gi,
  ],
};

const KNOWN_INDIAN_RELATIONSHIPS: CompanyRelationship[] = [
  { company: 'Tata Motors', relatedCompany: 'Jaguar Land Rover', relationshipType: 'subsidiary', source: 'known', confidence: 100, detectedAt: new Date().toISOString() },
  { company: 'Tata Motors', relatedCompany: 'Tata Motors', relationshipType: 'parent', source: 'known', confidence: 100, detectedAt: new Date().toISOString() },
  { company: 'Tata Group', relatedCompany: 'Tata Motors', relationshipType: 'subsidiary', source: 'known', confidence: 100, detectedAt: new Date().toISOString() },
  { company: 'Tata Group', relatedCompany: 'Tata Steel', relationshipType: 'subsidiary', source: 'known', confidence: 100, detectedAt: new Date().toISOString() },
  { company: 'Tata Group', relatedCompany: 'TCS', relationshipType: 'subsidiary', source: 'known', confidence: 100, detectedAt: new Date().toISOString() },
  { company: 'Mahindra & Mahindra', relatedCompany: 'Mahindra Electric', relationshipType: 'subsidiary', source: 'known', confidence: 100, detectedAt: new Date().toISOString() },
  { company: 'Maruti Suzuki', relatedCompany: 'Suzuki Motor', relationshipType: 'parent', source: 'known', confidence: 100, detectedAt: new Date().toISOString() },
  { company: 'Hindustan Unilever', relatedCompany: 'Unilever', relationshipType: 'parent', source: 'known', confidence: 100, detectedAt: new Date().toISOString() },
  { company: 'ITC', relatedCompany: 'British American Tobacco', relationshipType: 'parent', source: 'known', confidence: 100, detectedAt: new Date().toISOString() },
  { company: 'Reliance Industries', relatedCompany: 'Jio', relationshipType: 'subsidiary', source: 'known', confidence: 100, detectedAt: new Date().toISOString() },
];

export class MarketRelationshipGraph {
  private relationships: CompanyRelationship[] = [...KNOWN_INDIAN_RELATIONSHIPS];
  private nodes: Map<string, CompanyNode> = new Map();

  constructor() {
    this.initializeKnownNodes();
  }

  private initializeKnownNodes(): void {
    const knownCompanies: CompanyNode[] = [
      { name: 'Tata Motors', aliases: ['TML', 'Tata Motors Ltd'], ticker: 'TTMT', industry: 'Automotive', type: 'company' },
      { name: 'Jaguar Land Rover', aliases: ['JLR'], industry: 'Automotive', type: 'subsidiary', parentCompany: 'Tata Motors' },
      { name: 'Tata Steel', aliases: ['Tata Steel Ltd'], ticker: 'TATASTEEL', industry: 'Steel', type: 'subsidiary', parentCompany: 'Tata Group' },
      { name: 'TCS', aliases: ['Tata Consultancy Services'], ticker: 'TCS', industry: 'IT Services', type: 'subsidiary', parentCompany: 'Tata Group' },
      { name: 'Mahindra & Mahindra', aliases: ['M&M'], ticker: 'M&M', industry: 'Automotive', type: 'company' },
      { name: 'Mahindra Electric', aliases: ['Mahindra Electric Mobility'], industry: 'Electric Vehicles', type: 'subsidiary', parentCompany: 'Mahindra & Mahindra' },
      { name: 'Maruti Suzuki', aliases: ['Maruti', 'MSIL'], ticker: 'MARUTI', industry: 'Automotive', type: 'company' },
      { name: 'Suzuki Motor', aliases: ['Suzuki'], industry: 'Automotive', type: 'parent' },
      { name: 'Hindustan Unilever', aliases: ['HUL'], ticker: 'HUL', industry: 'FMCG', type: 'company' },
      { name: 'Unilever', aliases: ['Unilever PLC'], industry: 'FMCG', type: 'parent' },
      { name: 'ITC', aliases: ['ITC Ltd'], ticker: 'ITC', industry: 'FMCG', type: 'company' },
      { name: 'British American Tobacco', aliases: ['BAT'], industry: 'Tobacco', type: 'parent' },
      { name: 'Reliance Industries', aliases: ['RIL'], ticker: 'RELIANCE', industry: 'Conglomerate', type: 'company' },
      { name: 'Jio', aliases: ['Reliance Jio', 'Jio Platforms'], industry: 'Telecom', type: 'subsidiary', parentCompany: 'Reliance Industries' },
    ];

    for (const company of knownCompanies) {
      this.nodes.set(company.name.toLowerCase(), {
        name: company.name,
        aliases: company.aliases,
        ticker: company.ticker,
        industry: company.industry,
        type: company.type,
        parentCompany: company.parentCompany,
      });
    }
  }

  addRelationship(relationship: CompanyRelationship): void {
    const existing = this.relationships.findIndex(
      r => r.company === relationship.company && r.relatedCompany === relationship.relatedCompany
    );
    if (existing >= 0) {
      this.relationships[existing] = relationship;
    } else {
      this.relationships.push(relationship);
    }
  }

  detectRelationshipsFromText(companyName: string, text: string): CompanyRelationship[] {
    const detected: CompanyRelationship[] = [];
    
    for (const [type, patterns] of Object.entries(RELATIONSHIP_PATTERNS) as [RelationshipType, RegExp[]][]) {
      for (const pattern of patterns) {
        let match;
        const regex = new RegExp(pattern.source, pattern.flags);
        while ((match = regex.exec(text)) !== null) {
          const relatedCompany = match[1]?.trim();
          if (relatedCompany && relatedCompany.length > 2 && relatedCompany.length < 50) {
            if (relatedCompany.toLowerCase() !== companyName.toLowerCase()) {
              detected.push({
                company: companyName,
                relatedCompany,
                relationshipType: type,
                source: 'text_analysis',
                confidence: 60,
                detectedAt: new Date().toISOString(),
              });
            }
          }
        }
      }
    }

    for (const rel of detected) {
      this.addRelationship(rel);
    }

    return detected;
  }

  getCompetitors(companyName: string): CompanyRelationship[] {
    return this.relationships.filter(
      r => (r.company.toLowerCase() === companyName.toLowerCase() || r.relatedCompany.toLowerCase() === companyName.toLowerCase()) &&
           r.relationshipType === 'competitor'
    );
  }

  getSubsidiaries(companyName: string): CompanyRelationship[] {
    return this.relationships.filter(
      r => r.company.toLowerCase() === companyName.toLowerCase() && r.relationshipType === 'subsidiary'
    );
  }

  getParent(companyName: string): CompanyRelationship | undefined {
    return this.relationships.find(
      r => r.relatedCompany.toLowerCase() === companyName.toLowerCase() && 
           (r.relationshipType === 'parent' || r.relationshipType === 'acquirer')
    );
  }

  getRelatedCompanies(companyName: string): CompanyRelationship[] {
    return this.relationships.filter(
      r => r.company.toLowerCase() === companyName.toLowerCase() || r.relatedCompany.toLowerCase() === companyName.toLowerCase()
    );
  }

  getGraph(): CompanyRelationship[] {
    return this.relationships;
  }

  getNode(companyName: string): CompanyNode | undefined {
    return this.nodes.get(companyName.toLowerCase());
  }
}

let relationshipGraphInstance: MarketRelationshipGraph | null = null;

export function getRelationshipGraph(): MarketRelationshipGraph {
  if (!relationshipGraphInstance) {
    relationshipGraphInstance = new MarketRelationshipGraph();
  }
  return relationshipGraphInstance;
}
