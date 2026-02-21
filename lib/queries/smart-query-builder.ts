/**
 * Smart Query Builder
 * 
 * Hierarchical query expansion to improve data retrieval success rate.
 * Addresses the issue of "too specific" API queries.
 * 
 * Features:
 * - Multi-level query hierarchy (specific → broad)
 * - Semantic metric term expansion
 * - Context-aware query building
 * - Industry and geography context
 * 
 * Version: 9.0
 * Date: February 21, 2026
 */

export interface QueryLevel {
  priority: number;
  queries: string[];
  type: 'specific' | 'moderate' | 'broad' | 'industry';
}

export interface EntityContext {
  industry?: string;
  sector?: string;
  country?: string;
  ticker?: string;
  companyType?: 'public' | 'private' | 'startup';
}

export interface QueryResult {
  query: string;
  level: number;
  type: string;
  success: boolean;
  data?: any;
}

export class SmartQueryBuilder {
  
  private currentYear = new Date().getFullYear();
  private lastYear = this.currentYear - 1;

  buildQueryHierarchy(
    company: string,
    metric: string,
    year?: number
  ): QueryLevel[] {
    const targetYear = year || this.currentYear;
    
    return [
      {
        priority: 1,
        type: 'specific',
        queries: [
          `"${company}" ${metric} ${targetYear} exact`,
          `${company} ${metric} FY${targetYear}`,
          `${company} ${metric} Q4 ${targetYear}`
        ]
      },
      {
        priority: 2,
        type: 'moderate',
        queries: [
          `${company} ${metric} ${targetYear}`,
          `${company} financial metrics ${targetYear}`,
          `${company} earnings ${metric}`
        ]
      },
      {
        priority: 3,
        type: 'broad',
        queries: [
          `${company} annual report ${targetYear}`,
          `${company} investor presentation ${targetYear}`,
          `${company} quarterly results ${targetYear}`
        ]
      },
      {
        priority: 4,
        type: 'industry',
        queries: [
          `${company} industry analysis`,
          `${company} sector comparison ${metric}`,
          `${company} vs competitors ${metric}`
        ]
      }
    ];
  }

  expandMetricTerms(metric: string): string[] {
    const expansions: Record<string, string[]> = {
      'ebitda': [
        'EBITDA',
        'Operating EBITDA',
        'Adjusted EBITDA',
        'earnings before interest tax depreciation amortization',
        'operating profit',
        'EBIT',
        'Operating Income'
      ],
      'revenue': [
        'revenue',
        'sales',
        'turnover',
        'total income',
        'gross revenue',
        'net sales',
        'operating revenue',
        'total revenue'
      ],
      'marketCap': [
        'market cap',
        'market capitalization',
        'market value',
        'mcap',
        'equity value',
        'market capitalisation'
      ],
      'peRatio': [
        'PE ratio',
        'P/E ratio',
        'price to earnings',
        'PE multiple',
        'earnings multiple',
        'price earnings ratio'
      ],
      'netIncome': [
        'net income',
        'net profit',
        'profit after tax',
        'PAT',
        'net earnings',
        'bottom line'
      ],
      'ebitdaMargin': [
        'EBITDA margin',
        'EBITDA margin %',
        'operating margin',
        'EBIT margin'
      ],
      'revenueGrowth': [
        'revenue growth',
        'sales growth',
        'year over year growth',
        'YoY growth',
        'growth rate'
      ],
      'roe': [
        'ROE',
        'return on equity',
        'return on shareholders equity'
      ],
      'roa': [
        'ROA',
        'return on assets'
      ],
      'debtToEquity': [
        'debt to equity',
        'D/E ratio',
        'leverage ratio',
        'debt equity ratio'
      ]
    };

    const metricLower = metric.toLowerCase();
    return expansions[metricLower] || [metric];
  }

  buildContextualQuery(
    company: string,
    metric: string,
    context: EntityContext
  ): string[] {
    const metricVariants = this.expandMetricTerms(metric);
    const queries: string[] = [];

    if (context.industry) {
      queries.push(
        `${company} ${context.industry} ${metric}`,
        `${context.industry} companies ${metric} comparison`
      );
    }

    if (context.sector) {
      queries.push(
        `${company} ${context.sector} sector ${metric}`
      );
    }

    if (context.country === 'India' || context.country === 'india') {
      queries.push(
        `${company} NSE ${metric}`,
        `${company} BSE ${metric}`,
        `${company} Indian stock market ${metric}`,
        `${company} NSE BSE ${metric}`
      );
    } else if (context.country === 'USA' || context.country === 'United States') {
      queries.push(
        `${company} NYSE ${metric}`,
        `${company} NASDAQ ${metric}`,
        `${company} US stock ${metric}`
      );
    }

    if (context.ticker) {
      queries.push(
        `${context.ticker} ${metric}`,
        `${context.ticker} stock ${metric}`,
        `${context.ticker} financial ${metric}`
      );
    }

    metricVariants.forEach(variant => {
      queries.push(`${company} ${variant}`);
    });

    return [...new Set(queries)];
  }

  buildCompetitorQueries(company: string, industry?: string): string[] {
    const queries = [
      `${company} competitors`,
      `${company} peer companies`,
      `${company} rival companies`,
      `${company} comparison with competitors`
    ];

    if (industry) {
      queries.push(
        `${industry} sector competitors`,
        `${industry} industry peers`,
        `top ${industry} companies`
      );
    }

    return queries;
  }

  buildFinancialQueries(company: string, context?: EntityContext): string[] {
    const queries: string[] = [];
    
    const baseMetrics = [
      'market cap',
      'revenue',
      'EBITDA',
      'net profit',
      'P/E ratio',
      'EBITDA margin',
      'revenue growth',
      'ROE',
      'debt to equity'
    ];

    for (const metric of baseMetrics) {
      queries.push(`${company} ${metric}`);
    }

    if (context) {
      const contextualQueries = this.buildContextualQuery(company, 'financial metrics', context);
      queries.push(...contextualQueries);
    }

    return [...new Set(queries)];
  }

  buildSearchQuerySet(company: string, options: {
    metrics?: string[];
    includeCompetitors?: boolean;
    includeIndustry?: boolean;
    year?: number;
    context?: EntityContext;
  } = {}): string[] {
    const queries: string[] = [];
    const {
      metrics,
      includeCompetitors = false,
      includeIndustry = false,
      year,
      context
    } = options;

    const defaultMetrics = [
      'market cap',
      'revenue',
      'EBITDA',
      'EBITDA margin',
      'P/E ratio',
      'revenue growth',
      'net profit'
    ];

    const targetMetrics = metrics || defaultMetrics;

    for (const metric of targetMetrics) {
      const hierarchy = this.buildQueryHierarchy(company, metric, year);
      for (const level of hierarchy) {
        queries.push(...level.queries);
      }
    }

    if (includeCompetitors) {
      queries.push(...this.buildCompetitorQueries(company, context?.industry));
    }

    if (includeIndustry && context?.industry) {
      queries.push(
        `${context.industry} industry analysis`,
        `${context.industry} sector trends`,
        `${context.industry} market outlook`
      );
    }

    if (context) {
      const contextual = this.buildContextualQuery(company, 'overview', context);
      queries.push(...contextual);
    }

    return [...new Set(queries)];
  }

  getQueryForSource(source: string, company: string, metric: string): string[] {
    const sourceSpecificQueries: Record<string, string[]> = {
      'serp': [
        `${company} ${metric}`,
        `${company} financial performance ${metric}`
      ],
      'google': [
        `${company} ${metric}`,
        `${company} stock ${metric}`
      ],
      'nat': [
        `What is the current ${metric} of ${company}?`,
        `Provide ${metric} for ${company} from latest financial data`
      ],
      'crawler': [
        `${company} annual report ${metric}`,
        `${company} investor presentation ${metric}`
      ]
    };

    return sourceSpecificQueries[source.toLowerCase()] || sourceSpecificQueries['serp'];
  }
}

export default SmartQueryBuilder;
