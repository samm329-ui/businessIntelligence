/**
 * Data Validator - Financial Data Validation and Sanitization
 * 
 * This module validates financial data to ensure:
 * - Values are realistic and within expected ranges
 * - No contradictory metrics
 * - Proper currency/unit normalization
 * - Source transparency
 */

import { DataSource } from './pipeline-tracer';

export interface FinancialMetric {
  metric: string;
  value: number | string | null;
  unit?: string;
  currency?: string;
  source: DataSource;
  confidence: number;
  timestamp: string;
  isEstimated: boolean;
}

export interface ValidationResult {
  valid: boolean;
  errors: string[];
  warnings: string[];
  sanitized: boolean;
  metrics: FinancialMetric[];
}

// Realistic ranges for financial metrics (INR - Indian companies)
const REALISTIC_RANGES: Record<string, { min: number; max: number; unit: string }> = {
  revenue: { min: 1, max: 10000000, unit: 'Cr' }, // 1 Cr to 10 Lakh Cr
  ebitda: { min: -100000, max: 2000000, unit: 'Cr' },
  profit: { min: -500000, max: 1000000, unit: 'Cr' },
  growth: { min: -100, max: 1000, unit: '%' },
  marketCap: { min: 1, max: 50000000, unit: 'Cr' },
  peRatio: { min: 0.1, max: 200, unit: 'x' },
  debtToEquity: { min: 0, max: 50, unit: 'ratio' },
  roe: { min: -100, max: 100, unit: '%' },
  roa: { min: -50, max: 50, unit: '%' },
};

// Contradictory metric pairs
const CONTRADICTORY_METRICS: Array<[string, string, (a: number, b: number) => boolean]> = [
  ['profit', 'revenue', (profit, revenue) => profit > revenue],
  ['ebitda', 'revenue', (ebitda, revenue) => ebitda > revenue * 1.5], // EBITDA > 150% revenue is suspicious
  ['growth', 'revenue', (growth, revenue) => growth < -100], // Growth < -100% for revenue is impossible
];

export class DataValidator {
  private errors: string[] = [];
  private warnings: string[] = [];

  validateFinancialMetrics(metrics: Record<string, any>): ValidationResult {
    this.errors = [];
    this.warnings = [];
    
    const validatedMetrics: FinancialMetric[] = [];
    const parsedMetrics: Record<string, number> = {};

    // Parse and validate each metric
    for (const [key, value] of Object.entries(metrics)) {
      if (value === null || value === undefined) {
        validatedMetrics.push({
          metric: key,
          value: null,
          source: 'dataset',
          confidence: 0,
          timestamp: new Date().toISOString(),
          isEstimated: false,
        });
        continue;
      }

      const parsed = this.parseFinancialValue(value);
      
      if (parsed === null) {
        this.warnings.push(`Could not parse ${key}: "${value}"`);
        validatedMetrics.push({
          metric: key,
          value: null,
          source: 'dataset',
          confidence: 0,
          timestamp: new Date().toISOString(),
          isEstimated: false,
        });
        continue;
      }

      parsedMetrics[key] = parsed.value;

      // Check realistic ranges
      const range = REALISTIC_RANGES[key];
      if (range) {
        if (parsed.value < range.min || parsed.value > range.max) {
          this.warnings.push(`${key} value ${parsed.value} ${range.unit} is outside realistic range (${range.min}-${range.max} ${range.unit})`);
        }
      }

      validatedMetrics.push({
        metric: key,
        value: parsed.value,
        unit: parsed.unit,
        source: parsed.source,
        confidence: parsed.confidence,
        timestamp: new Date().toISOString(),
        isEstimated: parsed.isEstimated || value.toString().includes('ESTIMATED'),
      });
    }

    // Check for contradictory metrics
    this.checkContradictions(parsedMetrics);

    // Check for null overwrites (null replacing valid data)
    this.checkNullOverwrites(metrics, validatedMetrics);

    return {
      valid: this.errors.length === 0,
      errors: this.errors,
      warnings: this.warnings,
      sanitized: this.warnings.length > 0,
      metrics: validatedMetrics,
    };
  }

  private parseFinancialValue(value: any): { value: number; unit: string; source: DataSource; confidence: number; isEstimated: boolean } | null {
    if (typeof value === 'number') {
      return {
        value,
        unit: '',
        source: 'api_realtime',
        confidence: 90,
        isEstimated: false,
      };
    }

    if (typeof value !== 'string') {
      return null;
    }

    const str = value.toString().toLowerCase().trim();
    
    // Extract numeric value
    const match = str.match(/(-?\d+\.?\d*)\s*(cr|crore|lakh|mn|bn|%|x)?/i);
    
    if (!match) {
      return null;
    }

    let numValue = parseFloat(match[1]);
    let unit = match[2] || '';

    // Normalize units
    switch (unit.toLowerCase()) {
      case 'lakh':
      case 'lacs':
        numValue = numValue / 100; // Convert to Crores
        unit = 'Cr';
        break;
      case 'mn':
      case 'million':
        numValue = numValue * 0.1; // Approximate to Crores (1M ≈ 0.1 Cr)
        unit = 'Cr';
        break;
      case 'bn':
      case 'billion':
        numValue = numValue * 100; // Convert to Crores (1B ≈ 100 Cr)
        unit = 'Cr';
        break;
      case 'k':
      case 'thousand':
        numValue = numValue / 100000; // Convert to Crores
        unit = 'Cr';
        break;
    }

    // Determine if estimated
    const isEstimated = str.includes('est') || str.includes('approx') || str.includes('~');
    
    // Determine source and confidence
    let source: DataSource = 'api_realtime';
    let confidence = 90;

    if (isEstimated) {
      source = 'fallback';
      confidence = 40;
    } else if (str.includes('dataset') || str.includes('csv')) {
      source = 'dataset';
      confidence = 30;
    } else if (str.includes('crawl') || str.includes('web')) {
      source = 'crawler';
      confidence = 60;
    }

    return {
      value: numValue,
      unit,
      source,
      confidence,
      isEstimated,
    };
  }

  private checkContradictions(metrics: Record<string, number>): void {
    for (const [metric1, metric2, checkFn] of CONTRADICTORY_METRICS) {
      if (metrics[metric1] !== undefined && metrics[metric2] !== undefined) {
        if (checkFn(metrics[metric1], metrics[metric2])) {
          this.errors.push(`Contradictory metrics: ${metric1} (${metrics[metric1]}) and ${metric2} (${metrics[metric2]})`);
        }
      }
    }
  }

  private checkNullOverwrites(original: Record<string, any>, validated: FinancialMetric[]): void {
    const originalValues = Object.entries(original).filter(([_, v]) => v !== null && v !== undefined);
    const nullReplacements = validated.filter(m => m.value === null && original[m.metric] !== null);

    if (nullReplacements.length > 0) {
      this.errors.push(`Null values overwriting valid data for: ${nullReplacements.map(m => m.metric).join(', ')}`);
    }
  }

  validateOutput(analysis: any): { valid: boolean; errors: string[]; warnings: string[] } {
    const errors: string[] = [];
    const warnings: string[] = [];

    // Check for required fields
    const requiredFields = ['executiveSummary', 'financials', 'confidence'];
    for (const field of requiredFields) {
      if (!analysis[field]) {
        errors.push(`Missing required field: ${field}`);
      }
    }

    // Check for financial metrics
    if (analysis.financials) {
      const financialValidation = this.validateFinancialMetrics(analysis.financials);
      errors.push(...financialValidation.errors);
      warnings.push(...financialValidation.warnings);
    }

    // Check confidence score
    if (analysis.confidence !== undefined) {
      if (analysis.confidence < 0 || analysis.confidence > 100) {
        errors.push(`Confidence score ${analysis.confidence} is out of range (0-100)`);
      }
      if (analysis.confidence < 50) {
        warnings.push(`Low confidence score: ${analysis.confidence}%`);
      }
    }

    // Check for hallucination indicators
    const hallucinationPatterns = [
      /\b(guess|estimate|approximately|around|about)\b/gi,
      /\b(might|could|should|would|may)\b/gi,
      /\b(likely|probably|presumably)\b/gi,
    ];

    const text = JSON.stringify(analysis).toLowerCase();
    for (const pattern of hallucinationPatterns) {
      if (pattern.test(text)) {
        warnings.push('Output contains speculative language (hallucination indicator)');
        break;
      }
    }

    // Check for source transparency
    if (!analysis.metadata?.sources && !analysis.dataSources) {
      warnings.push('Output lacks source transparency');
    }

    return {
      valid: errors.length === 0,
      errors,
      warnings,
    };
  }

  sanitizeForAI(data: any): string {
    // Remove HTML tags
    let sanitized = JSON.stringify(data)
      .replace(/<[^>]*>/g, '')
      .replace(/\\n/g, ' ')
      .replace(/\\t/g, ' ')
      .replace(/\s+/g, ' ');

    // Remove CSV dumps
    sanitized = sanitized.replace(/company_name[^]*?(?=\}|\])/gi, '[CSV_DATA_REMOVED]');

    // Remove raw HTML artifacts
    sanitized = sanitized.replace(/<script[^]*?<\/script>/gi, '');
    sanitized = sanitized.replace(/<style[^]*?<\/style>/gi, '');

    return sanitized;
  }

  normalizeCurrency(value: number, fromCurrency: string, toCurrency: string = 'INR'): number {
    // Simplified currency normalization
    const rates: Record<string, number> = {
      'USD': 83, // 1 USD = 83 INR
      'EUR': 90,
      'GBP': 105,
      'INR': 1,
    };

    const fromRate = rates[fromCurrency] || 1;
    const toRate = rates[toCurrency] || 1;

    return (value * fromRate) / toRate;
  }
}

// Singleton instance
export const dataValidator = new DataValidator();

export default DataValidator;
