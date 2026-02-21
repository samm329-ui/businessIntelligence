/**
 * Global Comparison Module
 * 
 * Enables cross-market company comparison with currency normalization.
 * Compares companies across different regions (India, US, Europe, etc.)
 * 
 * Features:
 * - Multi-currency normalization
 * - Industry-relative benchmarking
 * - Global percentile rankings
 * - Region-specific metrics
 * 
 * Version: 9.1
 * Date: February 21, 2026
 */

import { CurrencyConverter, CurrencyCode, CURRENCY_METADATA } from '../currency/currency-converter';

export interface CompanyMetrics {
  company: string;
  ticker: string;
  region: string;
  industry?: string;
  currency: CurrencyCode;
  marketCap: number;
  revenue: number;
  ebitda: number;
  ebitdaMargin: number;
  peRatio: number;
  revenueGrowth: number;
  roe: number;
  roa: number;
  debtEquity: number;
  profitMargin: number;
}

export interface PercentileData {
  p25: number;
  p50: number;
  p75: number;
  p90: number;
}

export interface GlobalBenchmark {
  industry: string;
  region: string;
  metrics: {
    medianMarketCap: number;
    medianRevenue: number;
    medianEBITDAMargin: number;
    medianPERatio: number;
    medianRevenueGrowth: number;
    medianROE: number;
  };
  percentiles: {
    marketCap: PercentileData;
    revenue: PercentileData;
    ebitdaMargin: PercentileData;
    peRatio: PercentileData;
  };
}

export interface ComparisonResult {
  company: string;
  baseCurrency: CurrencyCode;
  normalizedMetrics: CompanyMetrics;
  globalRank: {
    marketCap: number;
    revenue: number;
    ebitdaMargin: number;
    peRatio: number;
    roe: number;
  };
  industryPercentile: {
    marketCap: number;
    revenue: number;
    ebitdaMargin: number;
    peRatio: number;
    roe: number;
  };
  vsGlobalMedian: {
    marketCap: number;
    revenue: number;
    ebitdaMargin: number;
    peRatio: number;
    roe: number;
  };
  peerComparison: {
    company: string;
    ticker: string;
    similarity: number;
    currency: CurrencyCode;
    normalizedRevenue: number;
    normalizedMarketCap: number;
  }[];
}

export const INDUSTRY_GLOBAL_BENCHMARKS: Record<string, GlobalBenchmark> = {
  'Technology': {
    industry: 'Technology',
    region: 'Global',
    metrics: {
      medianMarketCap: 500000000000,
      medianRevenue: 50000000000,
      medianEBITDAMargin: 25,
      medianPERatio: 28,
      medianRevenueGrowth: 15,
      medianROE: 20
    },
    percentiles: {
      marketCap: { p25: 10000000000, p50: 50000000000, p75: 200000000000, p90: 1000000000000 },
      revenue: { p25: 1000000000, p50: 10000000000, p75: 50000000000, p90: 200000000000 },
      ebitdaMargin: { p25: 15, p50: 25, p75: 35, p90: 45 },
      peRatio: { p25: 15, p50: 28, p75: 40, p90: 60 }
    }
  },
  'Banking': {
    industry: 'Banking',
    region: 'Global',
    metrics: {
      medianMarketCap: 100000000000,
      medianRevenue: 20000000000,
      medianEBITDAMargin: 45,
      medianPERatio: 15,
      medianRevenueGrowth: 8,
      medianROE: 12
    },
    percentiles: {
      marketCap: { p25: 10000000000, p50: 50000000000, p75: 150000000000, p90: 300000000000 },
      revenue: { p25: 2000000000, p50: 10000000000, p75: 30000000000, p90: 80000000000 },
      ebitdaMargin: { p25: 35, p50: 45, p75: 55, p90: 65 },
      peRatio: { p25: 8, p50: 15, p75: 20, p90: 25 }
    }
  },
  'Automobile': {
    industry: 'Automobile',
    region: 'Global',
    metrics: {
      medianMarketCap: 50000000000,
      medianRevenue: 30000000000,
      medianEBITDAMargin: 12,
      medianPERatio: 18,
      medianRevenueGrowth: 5,
      medianROE: 15
    },
    percentiles: {
      marketCap: { p25: 5000000000, p50: 20000000000, p75: 80000000000, p90: 200000000000 },
      revenue: { p25: 3000000000, p50: 15000000000, p75: 50000000000, p90: 150000000000 },
      ebitdaMargin: { p25: 5, p50: 12, p75: 20, p90: 30 },
      peRatio: { p25: 8, p50: 18, p75: 25, p90: 35 }
    }
  },
  'IT Services': {
    industry: 'IT Services',
    region: 'Global',
    metrics: {
      medianMarketCap: 150000000000,
      medianRevenue: 15000000000,
      medianEBITDAMargin: 22,
      medianPERatio: 25,
      medianRevenueGrowth: 12,
      medianROE: 22
    },
    percentiles: {
      marketCap: { p25: 5000000000, p50: 30000000000, p75: 100000000000, p90: 250000000000 },
      revenue: { p25: 1000000000, p50: 8000000000, p75: 25000000000, p90: 60000000000 },
      ebitdaMargin: { p25: 15, p50: 22, p75: 30, p90: 40 },
      peRatio: { p25: 15, p50: 25, p75: 35, p90: 50 }
    }
  },
  'Retail': {
    industry: 'Retail',
    region: 'Global',
    metrics: {
      medianMarketCap: 30000000000,
      medianRevenue: 25000000000,
      medianEBITDAMargin: 8,
      medianPERatio: 25,
      medianRevenueGrowth: 10,
      medianROE: 18
    },
    percentiles: {
      marketCap: { p25: 2000000000, p50: 10000000000, p75: 40000000000, p90: 100000000000 },
      revenue: { p25: 2000000000, p50: 10000000000, p75: 40000000000, p90: 100000000000 },
      ebitdaMargin: { p25: 3, p50: 8, p75: 12, p90: 18 },
      peRatio: { p25: 15, p50: 25, p75: 35, p90: 50 }
    }
  },
  'Pharmaceuticals': {
    industry: 'Pharmaceuticals',
    region: 'Global',
    metrics: {
      medianMarketCap: 80000000000,
      medianRevenue: 12000000000,
      medianEBITDAMargin: 20,
      medianPERatio: 22,
      medianRevenueGrowth: 8,
      medianROE: 16
    },
    percentiles: {
      marketCap: { p25: 5000000000, p50: 25000000000, p75: 80000000000, p90: 200000000000 },
      revenue: { p25: 1000000000, p50: 5000000000, p75: 15000000000, p90: 40000000000 },
      ebitdaMargin: { p25: 12, p50: 20, p75: 28, p90: 38 },
      peRatio: { p25: 12, p50: 22, p75: 30, p90: 45 }
    }
  },
  'FMCG': {
    industry: 'FMCG',
    region: 'Global',
    metrics: {
      medianMarketCap: 60000000000,
      medianRevenue: 15000000000,
      medianEBITDAMargin: 18,
      medianPERatio: 30,
      medianRevenueGrowth: 6,
      medianROE: 20
    },
    percentiles: {
      marketCap: { p25: 5000000000, p50: 20000000000, p75: 60000000000, p90: 150000000000 },
      revenue: { p25: 2000000000, p50: 8000000000, p75: 20000000000, p90: 50000000000 },
      ebitdaMargin: { p25: 10, p50: 18, p75: 25, p90: 35 },
      peRatio: { p25: 20, p50: 30, p75: 40, p90: 55 }
    }
  },
  'Energy': {
    industry: 'Energy',
    region: 'Global',
    metrics: {
      medianMarketCap: 40000000000,
      medianRevenue: 35000000000,
      medianEBITDAMargin: 18,
      medianPERatio: 12,
      medianRevenueGrowth: 5,
      medianROE: 12
    },
    percentiles: {
      marketCap: { p25: 5000000000, p50: 20000000000, p75: 80000000000, p90: 200000000000 },
      revenue: { p25: 5000000000, p50: 20000000000, p75: 60000000000, p90: 150000000000 },
      ebitdaMargin: { p25: 8, p50: 18, p75: 25, p90: 35 },
      peRatio: { p25: 6, p50: 12, p75: 18, p90: 25 }
    }
  },
  'Healthcare': {
    industry: 'Healthcare',
    region: 'Global',
    metrics: {
      medianMarketCap: 30000000000,
      medianRevenue: 8000000000,
      medianEBITDAMargin: 18,
      medianPERatio: 24,
      medianRevenueGrowth: 10,
      medianROE: 15
    },
    percentiles: {
      marketCap: { p25: 2000000000, p50: 15000000000, p75: 50000000000, p90: 150000000000 },
      revenue: { p25: 500000000, p50: 4000000000, p75: 12000000000, p90: 30000000000 },
      ebitdaMargin: { p25: 10, p50: 18, p75: 26, p90: 36 },
      peRatio: { p25: 14, p50: 24, p75: 34, p90: 48 }
    }
  },
  'Telecommunications': {
    industry: 'Telecommunications',
    region: 'Global',
    metrics: {
      medianMarketCap: 50000000000,
      medianRevenue: 25000000000,
      medianEBITDAMargin: 30,
      medianPERatio: 14,
      medianRevenueGrowth: 4,
      medianROE: 10
    },
    percentiles: {
      marketCap: { p25: 5000000000, p50: 25000000000, p75: 80000000000, p90: 200000000000 },
      revenue: { p25: 3000000000, p50: 15000000000, p75: 40000000000, p90: 100000000000 },
      ebitdaMargin: { p25: 20, p50: 30, p75: 40, p90: 50 },
      peRatio: { p25: 8, p50: 14, p75: 20, p90: 28 }
    }
  },
  'Construction': {
    industry: 'Construction',
    region: 'Global',
    metrics: {
      medianMarketCap: 20000000000,
      medianRevenue: 18000000000,
      medianEBITDAMargin: 10,
      medianPERatio: 16,
      medianRevenueGrowth: 6,
      medianROE: 14
    },
    percentiles: {
      marketCap: { p25: 1000000000, p50: 8000000000, p75: 30000000000, p90: 80000000000 },
      revenue: { p25: 1000000000, p50: 8000000000, p75: 25000000000, p90: 60000000000 },
      ebitdaMargin: { p25: 4, p50: 10, p75: 15, p90: 22 },
      peRatio: { p25: 8, p50: 16, p75: 22, p90: 30 }
    }
  },
  'Aerospace & Defense': {
    industry: 'Aerospace & Defense',
    region: 'Global',
    metrics: {
      medianMarketCap: 60000000000,
      medianRevenue: 20000000000,
      medianEBITDAMargin: 16,
      medianPERatio: 26,
      medianRevenueGrowth: 7,
      medianROE: 25
    },
    percentiles: {
      marketCap: { p25: 5000000000, p50: 30000000000, p75: 100000000000, p90: 250000000000 },
      revenue: { p25: 2000000000, p50: 10000000000, p75: 30000000000, p90: 80000000000 },
      ebitdaMargin: { p25: 8, p50: 16, p75: 24, p90: 34 },
      peRatio: { p25: 16, p50: 26, p75: 36, p90: 50 }
    }
  },
  'Metals & Mining': {
    industry: 'Metals & Mining',
    region: 'Global',
    metrics: {
      medianMarketCap: 25000000000,
      medianRevenue: 20000000000,
      medianEBITDAMargin: 22,
      medianPERatio: 10,
      medianRevenueGrowth: 5,
      medianROE: 12
    },
    percentiles: {
      marketCap: { p25: 2000000000, p50: 12000000000, p75: 45000000000, p90: 120000000000 },
      revenue: { p25: 2000000000, p50: 10000000000, p75: 30000000000, p90: 80000000000 },
      ebitdaMargin: { p25: 12, p50: 22, p75: 32, p90: 42 },
      peRatio: { p25: 5, p50: 10, p75: 15, p90: 22 }
    }
  },
  'Real Estate': {
    industry: 'Real Estate',
    region: 'Global',
    metrics: {
      medianMarketCap: 15000000000,
      medianRevenue: 3000000000,
      medianEBITDAMargin: 35,
      medianPERatio: 18,
      medianRevenueGrowth: 8,
      medianROE: 10
    },
    percentiles: {
      marketCap: { p25: 1000000000, p50: 8000000000, p75: 25000000000, p90: 70000000000 },
      revenue: { p25: 300000000, p50: 1500000000, p75: 5000000000, p90: 15000000000 },
      ebitdaMargin: { p25: 25, p50: 35, p75: 45, p90: 55 },
      peRatio: { p25: 10, p50: 18, p75: 25, p90: 35 }
    }
  },
  'Insurance': {
    industry: 'Insurance',
    region: 'Global',
    metrics: {
      medianMarketCap: 80000000000,
      medianRevenue: 40000000000,
      medianEBITDAMargin: 12,
      medianPERatio: 14,
      medianRevenueGrowth: 6,
      medianROE: 12
    },
    percentiles: {
      marketCap: { p25: 5000000000, p50: 40000000000, p75: 120000000000, p90: 300000000000 },
      revenue: { p25: 5000000000, p50: 25000000000, p75: 60000000000, p90: 150000000000 },
      ebitdaMargin: { p25: 6, p50: 12, p75: 18, p90: 26 },
      peRatio: { p25: 8, p50: 14, p75: 20, p90: 28 }
    }
  },
  'Media & Entertainment': {
    industry: 'Media & Entertainment',
    region: 'Global',
    metrics: {
      medianMarketCap: 40000000000,
      medianRevenue: 15000000000,
      medianEBITDAMargin: 20,
      medianPERatio: 22,
      medianRevenueGrowth: 12,
      medianROE: 18
    },
    percentiles: {
      marketCap: { p25: 3000000000, p50: 20000000000, p75: 60000000000, p90: 180000000000 },
      revenue: { p25: 1000000000, p50: 7000000000, p75: 20000000000, p90: 50000000000 },
      ebitdaMargin: { p25: 10, p50: 20, p75: 30, p90: 42 },
      peRatio: { p25: 12, p50: 22, p75: 32, p90: 45 }
    }
  },
  'Food & Beverages': {
    industry: 'Food & Beverages',
    region: 'Global',
    metrics: {
      medianMarketCap: 40000000000,
      medianRevenue: 18000000000,
      medianEBITDAMargin: 16,
      medianPERatio: 28,
      medianRevenueGrowth: 5,
      medianROE: 18
    },
    percentiles: {
      marketCap: { p25: 3000000000, p50: 18000000000, p75: 50000000000, p90: 120000000000 },
      revenue: { p25: 2000000000, p50: 8000000000, p75: 22000000000, p90: 55000000000 },
      ebitdaMargin: { p25: 8, p50: 16, p75: 24, p90: 34 },
      peRatio: { p25: 18, p50: 28, p75: 38, p90: 52 }
    }
  },
  'Chemicals': {
    industry: 'Chemicals',
    region: 'Global',
    metrics: {
      medianMarketCap: 25000000000,
      medianRevenue: 15000000000,
      medianEBITDAMargin: 18,
      medianPERatio: 16,
      medianRevenueGrowth: 6,
      medianROE: 14
    },
    percentiles: {
      marketCap: { p25: 2000000000, p50: 12000000000, p75: 40000000000, p90: 100000000000 },
      revenue: { p25: 1500000000, p50: 7000000000, p75: 20000000000, p90: 50000000000 },
      ebitdaMargin: { p25: 10, p50: 18, p75: 26, p90: 36 },
      peRatio: { p25: 8, p50: 16, p75: 24, p90: 34 }
    }
  },
  'Semiconductors': {
    industry: 'Semiconductors',
    region: 'Global',
    metrics: {
      medianMarketCap: 100000000000,
      medianRevenue: 20000000000,
      medianEBITDAMargin: 28,
      medianPERatio: 30,
      medianRevenueGrowth: 20,
      medianROE: 25
    },
    percentiles: {
      marketCap: { p25: 8000000000, p50: 50000000000, p75: 150000000000, p90: 400000000000 },
      revenue: { p25: 2000000000, p50: 10000000000, p75: 30000000000, p90: 80000000000 },
      ebitdaMargin: { p25: 18, p50: 28, p75: 38, p90: 48 },
      peRatio: { p25: 18, p50: 30, p75: 42, p90: 60 }
    }
  }
};

export class GlobalComparisonEngine {
  private currencyConverter: CurrencyConverter;
  private baseCurrency: CurrencyCode;
  
  constructor(baseCurrency: CurrencyCode = 'USD') {
    this.currencyConverter = new CurrencyConverter();
    this.baseCurrency = baseCurrency;
  }

  async initialize(): Promise<void> {
    await this.currencyConverter.fetchExchangeRates('USD');
  }

  normalizeToBaseCurrency(metrics: CompanyMetrics): CompanyMetrics {
    const converted = this.currencyConverter.convert(metrics.marketCap, metrics.currency, this.baseCurrency);
    const convertedRevenue = this.currencyConverter.convert(metrics.revenue, metrics.currency, this.baseCurrency);
    const convertedEBITDA = this.currencyConverter.convert(metrics.ebitda, metrics.currency, this.baseCurrency);
    
    return {
      ...metrics,
      currency: this.baseCurrency,
      marketCap: converted.value,
      revenue: convertedRevenue.value,
      ebitda: convertedEBITDA.value
    };
  }

  calculatePercentile(value: number, benchmark: PercentileData): number {
    if (value <= benchmark.p25) return 25;
    if (value <= benchmark.p50) return 50;
    if (value <= benchmark.p75) return 75;
    if (value <= benchmark.p90) return 90;
    return 95;
  }

  calculateGlobalRank(value: number, allValues: number[]): number {
    const sorted = [...allValues].sort((a, b) => a - b);
    const position = sorted.findIndex((v: number) => v >= value);
    return Math.round((position / sorted.length) * 100);
  }

  calculateVsMedian(value: number, median: number): number {
    if (median === 0) return 0;
    return ((value - median) / median) * 100;
  }

  async compareWithIndustry(
    companyMetrics: CompanyMetrics,
    industryPeers: CompanyMetrics[]
  ): Promise<ComparisonResult> {
    const normalized = this.normalizeToBaseCurrency(companyMetrics);
    
    const peerNormalized = industryPeers.map(p => this.normalizeToBaseCurrency(p));
    
    const benchmark = INDUSTRY_GLOBAL_BENCHMARKS[companyMetrics.industry || 'Technology'] || 
                     INDUSTRY_GLOBAL_BENCHMARKS['Technology'];
    
    const allMarketCaps = [normalized.marketCap, ...peerNormalized.map(p => p.marketCap)];
    const allRevenues = [normalized.revenue, ...peerNormalized.map(p => p.revenue)];
    const allMargins = [normalized.ebitdaMargin, ...peerNormalized.map(p => p.ebitdaMargin)];
    const allPE = [normalized.peRatio, ...peerNormalized.map(p => p.peRatio)];
    const allROE = [normalized.roe, ...peerNormalized.map(p => p.roe)];
    
    const comparison: ComparisonResult = {
      company: normalized.company,
      baseCurrency: this.baseCurrency,
      normalizedMetrics: normalized,
      globalRank: {
        marketCap: this.calculateGlobalRank(normalized.marketCap, allMarketCaps),
        revenue: this.calculateGlobalRank(normalized.revenue, allRevenues),
        ebitdaMargin: this.calculateGlobalRank(normalized.ebitdaMargin, allMargins),
        peRatio: this.calculateGlobalRank(normalized.peRatio, allPE),
        roe: this.calculateGlobalRank(normalized.roe, allROE)
      },
      industryPercentile: {
        marketCap: this.calculatePercentile(normalized.marketCap, benchmark.percentiles.marketCap),
        revenue: this.calculatePercentile(normalized.revenue, benchmark.percentiles.revenue),
        ebitdaMargin: this.calculatePercentile(normalized.ebitdaMargin, benchmark.percentiles.ebitdaMargin),
        peRatio: this.calculatePercentile(normalized.peRatio, benchmark.percentiles.peRatio),
        roe: this.calculatePercentile(normalized.roe, benchmark.percentiles.marketCap)
      },
      vsGlobalMedian: {
        marketCap: this.calculateVsMedian(normalized.marketCap, benchmark.metrics.medianMarketCap),
        revenue: this.calculateVsMedian(normalized.revenue, benchmark.metrics.medianRevenue),
        ebitdaMargin: this.calculateVsMedian(normalized.ebitdaMargin, benchmark.metrics.medianEBITDAMargin),
        peRatio: this.calculateVsMedian(normalized.peRatio, benchmark.metrics.medianPERatio),
        roe: this.calculateVsMedian(normalized.roe, benchmark.metrics.medianROE)
      },
      peerComparison: peerNormalized.map(p => ({
        company: p.company,
        ticker: p.ticker,
        similarity: this.calculateSimilarity(normalized, p),
        currency: p.currency,
        normalizedRevenue: p.revenue,
        normalizedMarketCap: p.marketCap
      })).sort((a, b) => b.similarity - a.similarity).slice(0, 10)
    };

    return comparison;
  }

  calculateSimilarity(company1: CompanyMetrics, company2: CompanyMetrics): number {
    const revenueDiff = Math.abs(company1.revenue - company2.revenue) / Math.max(company1.revenue, company2.revenue);
    const marginDiff = Math.abs(company1.ebitdaMargin - company2.ebitdaMargin) / Math.max(company1.ebitdaMargin, company2.ebitdaMargin, 1);
    const peDiff = Math.abs(company1.peRatio - company2.peRatio) / Math.max(company1.peRatio, company2.peRatio, 1);
    
    return Math.max(0, 1 - (revenueDiff + marginDiff + peDiff) / 3);
  }

  getGlobalBenchmark(industry: string): GlobalBenchmark | null {
    return INDUSTRY_GLOBAL_BENCHMARKS[industry] || null;
  }

  convertToAnyCurrency(value: number, fromCurrency: CurrencyCode, toCurrency: CurrencyCode): number {
    const converted = this.currencyConverter.convert(value, fromCurrency, toCurrency);
    return converted.value;
  }

  formatGlobalValue(value: number, currency: CurrencyCode): string {
    return this.currencyConverter.formatCurrency(value, currency);
  }

  getSupportedCurrencies(): CurrencyCode[] {
    return this.currencyConverter.getAllCurrencies();
  }
}

export async function createRegionalComparison(
  companies: CompanyMetrics[],
  baseCurrency: CurrencyCode = 'USD'
): Promise<Record<string, ComparisonResult>> {
  const engine = new GlobalComparisonEngine(baseCurrency);
  await engine.initialize();
  const results: Record<string, ComparisonResult> = {};
  
  for (const company of companies) {
    const industryPeers = companies.filter(c => (c.industry || 'Technology') === (company.industry || 'Technology') && c.company !== company.company);
    const comparison = await engine.compareWithIndustry(company, industryPeers as CompanyMetrics[]);
    results[company.ticker] = comparison;
  }
  
  return results;
}

export { CURRENCY_METADATA };
export default GlobalComparisonEngine;
