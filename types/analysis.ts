/**
 * EBITA Intelligence - Shared Type Definitions
 * 
 * This file defines the single source of truth for all analysis-related types.
 * Import these types in both API routes and frontend components to ensure
 * type consistency across the entire application.
 * 
 * Version: 6.0 (Upgrade 5)
 * Last Updated: February 19, 2026
 */

// DataSource type (inline for now - can be moved to common.ts later)
export interface DataSource {
  source: string;
  data?: Record<string, unknown>;
  confidence: number;
  fetchedAt?: string;
  error?: string;
}

// ============================================================================
// CORE ANALYSIS TYPES
// ============================================================================

export interface AnalysisResponse {
  success: boolean;
  entity?: EntityInfo;
  data?: AnalysisData;
  analysis?: AnalysisContent;
  metadata?: AnalysisMetadata;
  error?: AnalysisError;
}

export interface EntityInfo {
  type: 'company' | 'brand' | 'industry' | 'unknown';
  name: string;
  id: string;
  confidence: number;
  industry?: string;
  subIndustry?: string;
  sector?: string;
  ticker?: string;
  parentCompany?: string;
}

export interface AnalysisData {
  financials?: FinancialMetrics;
  marketData?: Record<string, unknown>;
  sources?: string[];
  confidence: number;
  warnings?: string[];
}

export interface FinancialMetrics {
  revenue?: string | null;
  revenueGrowth?: string | null;
  ebitda?: string | null;
  ebitdaMargin?: string | null;
  netProfit?: string | null;
  netMargin?: string | null;
  grossProfit?: string | null;
  grossMargin?: string | null;
  operatingProfit?: string | null;
  operatingMargin?: string | null;
  marketCap?: string | null;
  peRatio?: string | null;
  debtToEquity?: string | null;
  currentRatio?: string | null;
  roe?: string | null;
  roa?: string | null;
  eps?: string | null;
  dividendYield?: string | null;
  week52High?: string | null;
  week52Low?: string | null;
}

export interface AnalysisContent {
  summary?: string;
  executiveSummary?: string;
  keyFindings?: string[];
  risks?: string[];
  opportunities?: string[];
  industryOutlook?: string;
  competitorAnalysis?: string;
  financialHealth?: string;
  investmentVerdict?: string;
  aiGenerated: boolean;
  citations?: Citation[];
  hallucinationChecked: boolean;
}

export interface Citation {
  claim: string;
  source: string;
  value?: string;
}

export interface AnalysisMetadata {
  processingTimeMs: number;
  entityResolutionTimeMs?: number;
  dataFetchTimeMs?: number;
  analysisTimeMs?: number;
  sourcesUsed?: string[];
  validationWarnings?: string[];
  requestId: string;
  dataConfidenceScore?: number;
  version?: string;
}

export interface AnalysisError {
  type: string;
  message: string;
  recoverable: boolean;
  details?: Record<string, unknown>;
}

// ============================================================================
// CONSENSUS TYPES
// ============================================================================

export interface ConsensusMetrics {
  entityId: string;
  entityName: string;
  entityType: string;
  fiscalPeriod: string;
  
  // Valuation Metrics
  marketCap?: MetricValue;
  enterpriseValue?: MetricValue;
  currentPrice?: MetricValue;
  priceChange?: MetricValue;
  
  // Revenue & Growth
  revenue?: MetricValue;
  revenueGrowth?: MetricValue;
  
  // Profitability Metrics
  grossProfit?: MetricValue;
  grossMargin?: MetricValue;
  operatingProfit?: MetricValue;
  operatingMargin?: MetricValue;
  netIncome?: MetricValue;
  netMargin?: MetricValue;
  ebitda?: MetricValue;
  ebitdaMargin?: MetricValue;
  
  // Per Share
  eps?: MetricValue;
  bookValuePerShare?: MetricValue;
  dividendPerShare?: MetricValue;
  
  // Efficiency
  roe?: MetricValue;
  roa?: MetricValue;
  roic?: MetricValue;
  
  // Leverage
  totalDebt?: MetricValue;
  debtToEquity?: MetricValue;
  currentRatio?: MetricValue;
  quickRatio?: MetricValue;
  
  // Valuation Ratios
  peRatio?: MetricValue;
  pbRatio?: MetricValue;
  psRatio?: MetricValue;
  evToEbitda?: MetricValue;
  
  // Market Data
  week52High?: MetricValue;
  week52Low?: MetricValue;
  volume?: MetricValue;
  
  // Meta
  overallConfidence: number;
  dataGaps: string[];
  sources: DataSource[];
  fetchedAt: string;
  expiresAt: string;
}

export interface MetricValue {
  value: number | null;
  unit?: string;
  source?: string;
  confidence?: number;
  timestamp?: string;
}

// ============================================================================
// API REQUEST TYPES
// ============================================================================

export interface AnalysisRequest {
  query: string;
  region?: 'india' | 'global';
  analysisType?: AnalysisType;
  userId?: string;
}

export type AnalysisType = 
  | 'financial' 
  | 'competitor' 
  | 'industry' 
  | 'overview'
  | 'investor'
  | 'strategic';

// ============================================================================
// IDENTIFICATION TYPES
// ============================================================================

export interface IdentificationResult {
  found: boolean;
  type: 'company' | 'brand' | 'industry' | 'unknown';
  name: string;
  industry: string;
  subIndustry: string;
  confidence: number;
  source: 'excel' | 'dynamic' | 'csv' | 'google' | 'none';
  data?: unknown;
  isNew?: boolean;
  ticker?: string;
  domain?: string;
  aliases?: string[];
}

// ============================================================================
// UNKNOWN ENTITY TYPES
// ============================================================================

export interface UnknownEntity {
  id: string;
  originalQuery: string;
  normalizedName: string;
  discoveredAt: string;
  lastAttemptedAt?: string;
  attemptCount: number;
  status: 'pending' | 'enriched' | 'failed' | 'promoted';
  enrichmentData?: EnrichedEntityData;
}

export interface EnrichedEntityData {
  suggestedName?: string;
  suggestedIndustry?: string;
  suggestedSector?: string;
  ticker?: string;
  sources?: string[];
  confidence?: number;
}

export interface EntityDiscoveryJob {
  id: string;
  entityId: string;
  status: 'queued' | 'processing' | 'completed' | 'failed';
  startedAt?: string;
  completedAt?: string;
  result?: EnrichedEntityData;
  error?: string;
}

// ============================================================================
// FRONTEND SPECIFIC TYPES (for compatibility)
// ============================================================================

export interface DashboardData {
  entity: EntityInfo;
  financials: FinancialMetrics;
  competitors: string[];
  keyFindings: string[];
  risks: string[];
  opportunities: string[];
  confidence: number;
  summary: string;
}

export interface ChartDataPoint {
  label: string;
  value: number;
  color?: string;
}

// ============================================================================
// TYPE GUARDS & UTILITIES
// ============================================================================

export function isAnalysisResponse(obj: unknown): obj is AnalysisResponse {
  return (
    typeof obj === 'object' &&
    obj !== null &&
    'success' in obj
  );
}

export function isFinancialMetrics(obj: unknown): obj is FinancialMetrics {
  return (
    typeof obj === 'object' &&
    obj !== null &&
    ('revenue' in obj || 'ebitda' in obj || 'netProfit' in obj)
  );
}

export function createEmptyAnalysisResponse(query: string): AnalysisResponse {
  return {
    success: false,
    error: {
      type: 'EMPTY_RESPONSE',
      message: `No analysis data available for "${query}"`,
      recoverable: true,
    },
    metadata: {
      processingTimeMs: 0,
      requestId: crypto.randomUUID(),
    },
  };
}

export function createDegradedResponse(
  query: string,
  entity: Partial<EntityInfo> | null,
  reason: string
): AnalysisResponse {
  return {
    success: true,
    entity: entity ? {
      type: entity.type || 'unknown',
      name: entity.name || query,
      id: entity.id || 'unknown',
      confidence: entity.confidence || 0,
      industry: entity.industry,
      subIndustry: entity.subIndustry,
      sector: entity.sector,
    } : undefined,
    analysis: {
      summary: `Partial analysis for "${query}". ${reason}`,
      keyFindings: [
        `Entity resolution confidence: ${entity?.confidence || 0}%`,
        reason,
      ],
      risks: [
        'Limited data available for this entity',
        'Some metrics may be unavailable',
      ],
      opportunities: [
        'More data may improve analysis quality',
      ],
      aiGenerated: false,
      hallucinationChecked: false,
    },
    metadata: {
      processingTimeMs: 0,
      requestId: crypto.randomUUID(),
      validationWarnings: [reason],
    },
  };
}

export default AnalysisResponse;
