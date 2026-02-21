/**
 * ML Data Preprocessor
 * 
 * Pre-ML data filtration pipeline to ensure only clean, validated data
 * reaches ML models. Addresses the critical gap identified in analysis.
 * 
 * Features:
 * - Outlier detection (Z-score, IQR)
 * - Cross-metric validation (EBITDA < Revenue)
 * - Industry-specific validation
 * - Data completeness scoring
 * - Missing value imputation
 * 
 * Version: 9.0
 * Date: February 21, 2026
 */

export interface DataPoint {
  value: number;
  source: string;
  timestamp: string;
  reliability: number;
}

export interface ConsensusMetrics {
  marketCap?: number | null;
  revenue?: number | null;
  ebitda?: number | null;
  ebitdaMargin?: number | null;
  peRatio?: number | null;
  revenueGrowth?: number | null;
  netIncome?: number | null;
  profitMargin?: number | null;
  roe?: number | null;
  roa?: number | null;
  debtEquity?: number | null;
  currentRatio?: number | null;
  sector?: string;
  industry?: string;
  _imputedFields?: string[];
}

export interface ValidationResult {
  isValid: boolean;
  errors: string[];
  warnings: string[];
  severity: 'pass' | 'warning' | 'error';
}

export interface FilteredDataset {
  data: ConsensusMetrics;
  removedCount: number;
  removalReasons: string[];
  qualityScore: number;
  validationResults: ValidationResult[];
}

export interface IndustryProfile {
  sector: string;
  typicalPERange: [number, number];
  typicalEBITDAMarginRange: [number, number];
  typicalRevenueGrowthRange: [number, number];
  typicalPriceToSales: [number, number];
  maxDebtEquity: number;
}

export const INDUSTRY_PROFILES: Record<string, IndustryProfile> = {
  'Technology': {
    sector: 'Technology',
    typicalPERange: [15, 45],
    typicalEBITDAMarginRange: [10, 35],
    typicalRevenueGrowthRange: [5, 30],
    typicalPriceToSales: [3, 15],
    maxDebtEquity: 2.0
  },
  'IT Services': {
    sector: 'IT Services',
    typicalPERange: [20, 40],
    typicalEBITDAMarginRange: [15, 30],
    typicalRevenueGrowthRange: [8, 25],
    typicalPriceToSales: [4, 12],
    maxDebtEquity: 1.5
  },
  'Banking': {
    sector: 'Banking',
    typicalPERange: [8, 25],
    typicalEBITDAMarginRange: [30, 60],
    typicalRevenueGrowthRange: [5, 20],
    typicalPriceToSales: [2, 8],
    maxDebtEquity: 15.0
  },
  'Financial Services': {
    sector: 'Financial Services',
    typicalPERange: [10, 30],
    typicalEBITDAMarginRange: [20, 50],
    typicalRevenueGrowthRange: [5, 25],
    typicalPriceToSales: [2, 10],
    maxDebtEquity: 10.0
  },
  'Automobile': {
    sector: 'Automobile',
    typicalPERange: [10, 35],
    typicalEBITDAMarginRange: [5, 25],
    typicalRevenueGrowthRange: [-5, 20],
    typicalPriceToSales: [0.5, 5],
    maxDebtEquity: 3.0
  },
  'Manufacturing': {
    sector: 'Manufacturing',
    typicalPERange: [12, 30],
    typicalEBITDAMarginRange: [8, 20],
    typicalRevenueGrowthRange: [0, 15],
    typicalPriceToSales: [0.8, 4],
    maxDebtEquity: 2.5
  },
  'Energy': {
    sector: 'Energy',
    typicalPERange: [8, 25],
    typicalEBITDAMarginRange: [10, 30],
    typicalRevenueGrowthRange: [-10, 15],
    typicalPriceToSales: [0.5, 3],
    maxDebtEquity: 3.0
  },
  'Oil & Gas': {
    sector: 'Oil & Gas',
    typicalPERange: [6, 20],
    typicalEBITDAMarginRange: [8, 25],
    typicalRevenueGrowthRange: [-15, 20],
    typicalPriceToSales: [0.4, 2.5],
    maxDebtEquity: 3.5
  },
  'Telecommunications': {
    sector: 'Telecommunications',
    typicalPERange: [10, 30],
    typicalEBITDAMarginRange: [15, 40],
    typicalRevenueGrowthRange: [0, 15],
    typicalPriceToSales: [1, 5],
    maxDebtEquity: 4.0
  },
  'Retail': {
    sector: 'Retail',
    typicalPERange: [15, 50],
    typicalEBITDAMarginRange: [2, 12],
    typicalRevenueGrowthRange: [5, 25],
    typicalPriceToSales: [0.3, 2.5],
    maxDebtEquity: 3.0
  },
  'E-commerce': {
    sector: 'E-commerce',
    typicalPERange: [20, 100],
    typicalEBITDAMarginRange: [-10, 15],
    typicalRevenueGrowthRange: [15, 80],
    typicalPriceToSales: [1, 8],
    maxDebtEquity: 5.0
  },
  'Pharmaceuticals': {
    sector: 'Pharmaceuticals',
    typicalPERange: [15, 40],
    typicalEBITDAMarginRange: [10, 30],
    typicalRevenueGrowthRange: [0, 20],
    typicalPriceToSales: [2, 10],
    maxDebtEquity: 2.0
  },
  'FMCG': {
    sector: 'FMCG',
    typicalPERange: [20, 45],
    typicalEBITDAMarginRange: [10, 25],
    typicalRevenueGrowthRange: [3, 15],
    typicalPriceToSales: [3, 12],
    maxDebtEquity: 2.0
  },
  'Steel': {
    sector: 'Steel',
    typicalPERange: [5, 20],
    typicalEBITDAMarginRange: [5, 20],
    typicalRevenueGrowthRange: [-10, 15],
    typicalPriceToSales: [0.3, 2],
    maxDebtEquity: 4.0
  },
  'Infrastructure': {
    sector: 'Infrastructure',
    typicalPERange: [8, 25],
    typicalEBITDAMarginRange: [8, 20],
    typicalRevenueGrowthRange: [0, 15],
    typicalPriceToSales: [0.5, 3],
    maxDebtEquity: 5.0
  },
  'Real Estate': {
    sector: 'Real Estate',
    typicalPERange: [10, 30],
    typicalEBITDAMarginRange: [5, 20],
    typicalRevenueGrowthRange: [0, 20],
    typicalPriceToSales: [0.5, 4],
    maxDebtEquity: 6.0
  },
  'Default': {
    sector: 'Default',
    typicalPERange: [10, 40],
    typicalEBITDAMarginRange: [5, 30],
    typicalRevenueGrowthRange: [-5, 25],
    typicalPriceToSales: [1, 8],
    maxDebtEquity: 3.0
  }
};

export class MLDataPreprocessor {
  
  filterOutliersZScore(data: number[], threshold = 3): number[] {
    if (data.length < 4) return data;
    
    const mean = data.reduce((a, b) => a + b, 0) / data.length;
    const std = Math.sqrt(
      data.reduce((sq, n) => sq + Math.pow(n - mean, 2), 0) / data.length
    );
    
    if (std === 0) return data;
    
    return data.filter(v => Math.abs((v - mean) / std) <= threshold);
  }

  filterOutliersIQR(data: number[]): number[] {
    if (data.length < 4) return data;
    
    const sorted = [...data].sort((a, b) => a - b);
    const q1 = sorted[Math.floor(sorted.length / 4)];
    const q3 = sorted[Math.floor(sorted.length * 3 / 4)];
    const iqr = q3 - q1;
    const lower = q1 - 1.5 * iqr;
    const upper = q3 + 1.5 * iqr;
    
    return data.filter(v => v >= lower && v <= upper);
  }

  validateConsistency(metrics: ConsensusMetrics): ValidationResult {
    const errors: string[] = [];
    const warnings: string[] = [];
    
    if (!metrics) {
      return { isValid: false, errors: ['No metrics provided'], warnings: [], severity: 'error' };
    }

    if (metrics.ebitda && metrics.revenue && metrics.ebitda > metrics.revenue) {
      errors.push(`CRITICAL: EBITDA (${metrics.ebitda}) exceeds Revenue (${metrics.revenue}) - impossible data`);
    }

    if (metrics.netIncome && metrics.revenue && metrics.netIncome > metrics.revenue) {
      errors.push(`CRITICAL: Net Income (${metrics.netIncome}) exceeds Revenue (${metrics.revenue}) - impossible data`);
    }

    if (metrics.netIncome && metrics.ebitda && metrics.netIncome > metrics.ebitda) {
      warnings.push(`WARNING: Net Income (${metrics.netIncome}) exceeds EBITDA (${metrics.ebitda}) - rare but possible`);
    }

    if (metrics.ebitdaMargin && metrics.ebitda && metrics.revenue) {
      const calculatedMargin = (metrics.ebitda / metrics.revenue) * 100;
      const diff = Math.abs(calculatedMargin - metrics.ebitdaMargin);
      if (diff > 10) {
        errors.push(`CRITICAL: EBITDA margin mismatch - stated ${metrics.ebitdaMargin}%, calculated ${calculatedMargin.toFixed(2)}%`);
      } else if (diff > 5) {
        warnings.push(`WARNING: EBITDA margin variance - stated ${metrics.ebitdaMargin}%, calculated ${calculatedMargin.toFixed(2)}%`);
      }
    }

    if (metrics.marketCap && metrics.revenue) {
      const priceToSales = metrics.marketCap / metrics.revenue;
      if (priceToSales < 0.05) {
        warnings.push(`WARNING: Extremely low Price-to-Sales ratio: ${priceToSales.toFixed(2)}`);
      } else if (priceToSales > 100) {
        warnings.push(`WARNING: Extremely high Price-to-Sales ratio: ${priceToSales.toFixed(2)}`);
      }
    }

    if (metrics.peRatio !== undefined && metrics.peRatio !== null) {
      if (metrics.peRatio < 0) {
        warnings.push(`INFO: Negative P/E ratio (${metrics.peRatio}) - company has losses`);
      } else if (metrics.peRatio > 500) {
        warnings.push(`WARNING: Extremely high P/E ratio (${metrics.peRatio}) - may indicate distress or high growth`);
      } else if (metrics.peRatio > 200) {
        warnings.push(`INFO: Very high P/E ratio (${metrics.peRatio})`);
      }
    }

    if (metrics.debtEquity && metrics.debtEquity < 0) {
      errors.push(`CRITICAL: Negative Debt-to-Equity ratio: ${metrics.debtEquity}`);
    }

    const hasErrors = errors.length > 0;
    return {
      isValid: errors.length === 0,
      errors,
      warnings,
      severity: hasErrors ? 'error' : warnings.length > 0 ? 'warning' : 'pass'
    };
  }

  validateAgainstIndustry(
    metrics: ConsensusMetrics,
    industry: string
  ): ValidationResult {
    const profile = INDUSTRY_PROFILES[industry] || INDUSTRY_PROFILES['Default'];
    const warnings: string[] = [];
    const errors: string[] = [];

    if (metrics.peRatio && metrics.peRatio > 0) {
      const [minPE, maxPE] = profile.typicalPERange;
      if (metrics.peRatio < minPE * 0.3) {
        warnings.push(`P/E ratio ${metrics.peRatio} extremely low for ${industry} (typical: ${minPE}-${maxPE})`);
      } else if (metrics.peRatio < minPE * 0.5) {
        warnings.push(`P/E ratio ${metrics.peRatio} below typical range [${minPE}-${maxPE}] for ${industry}`);
      } else if (metrics.peRatio > maxPE * 2) {
        warnings.push(`P/E ratio ${metrics.peRatio} extremely high for ${industry} (typical: ${minPE}-${maxPE})`);
      }
    }

    if (metrics.ebitdaMargin) {
      const [minMargin, maxMargin] = profile.typicalEBITDAMarginRange;
      if (metrics.ebitdaMargin < minMargin * 0.5) {
        warnings.push(`EBITDA margin ${metrics.ebitdaMargin}% extremely low for ${industry} (typical: ${minMargin}-${maxMargin}%)`);
      } else if (metrics.ebitdaMargin > maxMargin * 2) {
        warnings.push(`EBITDA margin ${metrics.ebitdaMargin}% extremely high for ${industry} (typical: ${minMargin}-${maxMargin}%)`);
      }
    }

    if (metrics.revenueGrowth) {
      const [minGrowth, maxGrowth] = profile.typicalRevenueGrowthRange;
      if (metrics.revenueGrowth < minGrowth * 2 && metrics.revenueGrowth < -0.2) {
        warnings.push(`Revenue growth ${(metrics.revenueGrowth * 100).toFixed(1)}% unusually negative for ${industry}`);
      } else if (metrics.revenueGrowth > maxGrowth * 2) {
        warnings.push(`Revenue growth ${(metrics.revenueGrowth * 100).toFixed(1)}% unusually high for ${industry}`);
      }
    }

    if (metrics.marketCap && metrics.revenue) {
      const [minPS, maxPS] = profile.typicalPriceToSales;
      const priceToSales = metrics.marketCap / metrics.revenue;
      if (priceToSales < minPS * 0.3) {
        warnings.push(`Price-to-Sales ${priceToSales.toFixed(2)} extremely low for ${industry}`);
      } else if (priceToSales > maxPS * 3) {
        warnings.push(`Price-to-Sales ${priceToSales.toFixed(2)} extremely high for ${industry}`);
      }
    }

    if (metrics.debtEquity && metrics.debtEquity > profile.maxDebtEquity * 1.5) {
      warnings.push(`Debt-to-Equity ${metrics.debtEquity} very high for ${industry} (typical max: ${profile.maxDebtEquity})`);
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings,
      severity: errors.length > 0 ? 'error' : warnings.length > 0 ? 'warning' : 'pass'
    };
  }

  calculateCompleteness(metrics: ConsensusMetrics): number {
    const requiredFields = [
      'marketCap', 'revenue', 'ebitda', 'ebitdaMargin', 
      'peRatio', 'revenueGrowth', 'roe', 'profitMargin'
    ];

    const presentFields = requiredFields.filter(
      field => metrics[field as keyof ConsensusMetrics] !== null && 
               metrics[field as keyof ConsensusMetrics] !== undefined
    );

    return (presentFields.length / requiredFields.length) * 100;
  }

  imputeMissingValues(data: ConsensusMetrics): ConsensusMetrics {
    const imputed = { ...data };
    const imputedFields: string[] = [];

    if (!imputed.ebitda && imputed.ebitdaMargin && imputed.revenue) {
      imputed.ebitda = (imputed.revenue! * imputed.ebitdaMargin!) / 100;
      imputedFields.push('ebitda');
    }

    if (!imputed.ebitdaMargin && imputed.ebitda && imputed.revenue) {
      imputed.ebitdaMargin = (imputed.ebitda! / imputed.revenue!) * 100;
      imputedFields.push('ebitdaMargin');
    }

    if (!imputed.profitMargin && imputed.netIncome && imputed.revenue) {
      imputed.profitMargin = (imputed.netIncome! / imputed.revenue!) * 100;
      imputedFields.push('profitMargin');
    }

    if (!imputed.marketCap && imputed.peRatio && imputed.netIncome) {
      imputed.marketCap = imputed.peRatio * imputed.netIncome;
      imputedFields.push('marketCap');
    }

    if (imputedFields.length > 0) {
      imputed._imputedFields = imputedFields;
    }

    return imputed;
  }

  calculateQualityScore(
    completeness: number,
    consistencyResult: ValidationResult,
    industryResult: ValidationResult
  ): number {
    let score = completeness;

    if (consistencyResult.severity === 'error') score -= 30;
    else if (consistencyResult.severity === 'warning') score -= 10;

    if (industryResult.severity === 'error') score -= 20;
    else if (industryResult.severity === 'warning') score -= 5;

    return Math.max(0, Math.min(100, score));
  }

  async preprocess(
    rawData: ConsensusMetrics,
    industry: string
  ): Promise<FilteredDataset> {
    const validationResults: ValidationResult[] = [];

    const consistencyResult = this.validateConsistency(rawData);
    validationResults.push(consistencyResult);

    const industryResult = this.validateAgainstIndustry(rawData, industry);
    validationResults.push(industryResult);

    const completeness = this.calculateCompleteness(rawData);

    const qualityScore = this.calculateQualityScore(
      completeness,
      consistencyResult,
      industryResult
    );

    const allErrors = [
      ...consistencyResult.errors,
      ...industryResult.errors
    ];
    const allWarnings = [
      ...consistencyResult.warnings,
      ...industryResult.warnings
    ];

    let processedData = { ...rawData };

    if (qualityScore >= 30 && !consistencyResult.isValid === false) {
      processedData = this.imputeMissingValues(rawData);
    }

    return {
      data: processedData,
      removedCount: allErrors.length,
      removalReasons: [...allErrors, ...allWarnings],
      qualityScore,
      validationResults
    };
  }

  getValidationSummary(results: ValidationResult[]): string {
    const summary: string[] = [];
    
    for (const result of results) {
      if (result.errors.length > 0) {
        summary.push(`ERRORS: ${result.errors.join('; ')}`);
      }
      if (result.warnings.length > 0) {
        summary.push(`WARNINGS: ${result.warnings.join('; ')}`);
      }
    }
    
    return summary.length > 0 ? summary.join('\n') : 'All validations passed';
  }
}

export default MLDataPreprocessor;
