/**
 * Pipeline Tracer - Comprehensive Logging and Debugging
 * 
 * This module provides structured tracing across the entire intelligence pipeline
 * for debugging, monitoring, and ensuring data reliability.
 * 
 * Each trace includes:
 * - Timestamp
 * - Entity name
 * - Source used
 * - Confidence score
 * - Errors
 * - Data lineage
 */

import * as fs from 'fs';
import * as path from 'path';

export interface PipelineTrace {
  requestId: string;
  timestamp: string;
  stage: PipelineStage;
  entity?: string;
  input?: string;
  source?: DataSource;
  dataType?: 'financial' | 'classification' | 'competitor' | 'news' | 'context';
  confidence?: number;
  value?: any;
  metadata?: Record<string, any>;
  error?: string;
  durationMs?: number;
  realtimePriorityMode?: boolean;
}

export type PipelineStage = 
  | 'INPUT_RECEIVED'
  | 'ENTITY_RESOLUTION'
  | 'SECONDARY_VERIFICATION'
  | 'SEARCH_FIRST_INITIATED'
  | 'SEARCH_FIRST_COMPLETED'
  | 'CONFIDENCE_GATING'
  | 'SOURCE_AUTHORITY_FILTER'
  | 'CRAWLER_INTELLIGENCE'
  | 'DATASET_MATCH'
  | 'WEB_SEARCH_TRIGGERED'
  | 'API_FETCH_STARTED'
  | 'API_FETCH_COMPLETED'
  | 'CRAWLER_EXECUTED'
  | 'CACHE_HIT'
  | 'CACHE_MISS'
  | 'CACHE_BYPASS'
  | 'DATA_AGGREGATION'
  | 'AI_PROMPT_BUILT'
  | 'AI_RESPONSE_RECEIVED'
  | 'OUTPUT_VALIDATION'
  | 'FINAL_OUTPUT';

export type DataSource = 
  | 'dataset'
  | 'api_realtime'
  | 'cache'
  | 'web_search'
  | 'crawler'
  | 'fallback';

export type DataReliability = {
  source: DataSource;
  weight: number; // 0-1
  requiresVerification: boolean;
};

// Reliability hierarchy (as per requirements)
export const RELIABILITY_HIERARCHY: DataReliability[] = [
  { source: 'api_realtime', weight: 1.0, requiresVerification: false },
  { source: 'cache', weight: 0.9, requiresVerification: true },
  { source: 'web_search', weight: 0.7, requiresVerification: true },
  { source: 'crawler', weight: 0.6, requiresVerification: true },
  { source: 'dataset', weight: 0.3, requiresVerification: true }, // Context only
  { source: 'fallback', weight: 0.1, requiresVerification: true },
];

export const REALTIME_PRIORITY_MODE = process.env.REALTIME_PRIORITY_MODE === 'true';

class PipelineTracer {
  private traces: PipelineTrace[] = [];
  private requestId: string;
  private logFile: string;
  private maxTracesInMemory: number = 1000;

  constructor(entityName?: string) {
    this.requestId = `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const logDir = path.resolve(process.cwd(), 'logs', 'pipeline');
    
    if (!fs.existsSync(logDir)) {
      fs.mkdirSync(logDir, { recursive: true });
    }
    
    this.logFile = path.join(logDir, `${this.requestId}.json`);
    
    this.trace('INPUT_RECEIVED', {
      input: entityName,
      realtimePriorityMode: REALTIME_PRIORITY_MODE,
    });
  }

  trace(stage: PipelineStage, metadata?: Partial<PipelineTrace>): void {
    const trace: PipelineTrace = {
      requestId: this.requestId,
      timestamp: new Date().toISOString(),
      stage,
      ...metadata,
    };

    this.traces.push(trace);
    
    // Log to console for immediate visibility
    const duration = metadata?.durationMs ? `[${metadata.durationMs}ms]` : '';
    const source = metadata?.source ? `[${metadata.source}]` : '';
    const confidence = metadata?.confidence ? `[${metadata.confidence}%]` : '';
    
    if (metadata?.error) {
      console.error(`[TRACER] ❌ ${stage} ${source} ${duration} ${confidence} - ERROR: ${metadata.error}`);
    } else {
      console.log(`[TRACER] ✅ ${stage} ${source} ${duration} ${confidence}`);
    }

    // Persist to file periodically
    if (this.traces.length % 10 === 0) {
      this.persist();
    }
  }

  traceEntityResolution(entity: string, source: DataSource, confidence: number, metadata?: any): void {
    this.trace('ENTITY_RESOLUTION', {
      entity,
      source,
      confidence,
      metadata: {
        ...metadata,
        verified: confidence >= 80,
      },
    });
  }

  traceDatasetMatch(entity: string, matched: boolean, confidence: number): void {
    this.trace('DATASET_MATCH', {
      entity,
      source: 'dataset',
      confidence,
      metadata: {
        matched,
        usage: 'classification_only', // Datasets only for classification
        financialDataProvided: false,
      },
    });
  }

  traceApiFetch(apiName: string, started: boolean, durationMs?: number, error?: string): void {
    this.trace(started ? 'API_FETCH_STARTED' : 'API_FETCH_COMPLETED', {
      source: 'api_realtime',
      metadata: {
        api: apiName,
      },
      durationMs,
      error,
    });
  }

  traceCacheBehavior(hit: boolean, entity: string, freshness?: string): void {
    this.trace(hit ? 'CACHE_HIT' : 'CACHE_MISS', {
      entity,
      source: hit ? 'cache' : undefined,
      metadata: {
        freshness,
        realtimePriority: REALTIME_PRIORITY_MODE,
        overrideCache: REALTIME_PRIORITY_MODE && !hit,
      },
    });
  }

  traceDataAggregation(sources: DataSource[], conflicts: number): void {
    this.trace('DATA_AGGREGATION', {
      metadata: {
        sources,
        sourceCount: sources.length,
        conflicts,
        reliabilityWeights: sources.map(s => {
          const hierarchy = RELIABILITY_HIERARCHY.find(h => h.source === s);
          return { source: s, weight: hierarchy?.weight || 0 };
        }),
      },
    });
  }

  traceAIPrompt(sanitized: boolean, dataSources: string[]): void {
    this.trace('AI_PROMPT_BUILT', {
      metadata: {
        sanitized,
        dataSourceCount: dataSources.length,
        realtimePriority: REALTIME_PRIORITY_MODE,
        instruction: REALTIME_PRIORITY_MODE 
          ? 'Use only verified realtime data. Do not assume financial values.'
          : 'Standard analysis',
      },
    });
  }

  traceAIResponse(durationMs: number, hasHallucination: boolean): void {
    this.trace('AI_RESPONSE_RECEIVED', {
      durationMs,
      metadata: {
        hasHallucination,
        validated: !hasHallucination,
      },
    });
  }

  traceValidation(passed: boolean, checks: Record<string, boolean>, errors?: string[]): void {
    this.trace('OUTPUT_VALIDATION', {
      metadata: {
        passed,
        checks,
        errorCount: errors?.length || 0,
        errors,
      },
    });
  }

  traceFinancialData(
    metric: string,
    value: any,
    source: DataSource,
    confidence: number,
    isEstimated?: boolean
  ): void {
    this.trace('DATA_AGGREGATION', {
      dataType: 'financial',
      source,
      confidence,
      value: isEstimated ? `${value} (ESTIMATED)` : value,
      metadata: {
        metric,
        isEstimated: isEstimated || false,
        realtime: source === 'api_realtime',
        verified: confidence >= 80 && !isEstimated,
      },
    });
  }

  persist(): void {
    try {
      fs.writeFileSync(this.logFile, JSON.stringify(this.traces, null, 2));
    } catch (error) {
      console.error('[TRACER] Failed to persist traces:', error);
    }
  }

  getTraces(): PipelineTrace[] {
    return [...this.traces];
  }

  getRequestId(): string {
    return this.requestId;
  }

  generateReport(): string {
    const report = {
      requestId: this.requestId,
      totalStages: this.traces.length,
      errors: this.traces.filter(t => t.error).length,
      realtimeDataUsed: this.traces.filter(t => t.source === 'api_realtime').length,
      cacheUsed: this.traces.filter(t => t.source === 'cache').length,
      datasetOnly: this.traces.filter(t => 
        t.stage === 'DATASET_MATCH' && t.metadata?.financialDataProvided === false
      ).length,
      sources: [...new Set(this.traces.map(t => t.source).filter(Boolean))],
      timeline: this.traces.map(t => ({
        stage: t.stage,
        timestamp: t.timestamp,
        duration: t.durationMs,
      })),
    };

    return JSON.stringify(report, null, 2);
  }
}

// Global tracer instance
let currentTracer: PipelineTracer | null = null;

export function createTracer(entityName?: string): PipelineTracer {
  currentTracer = new PipelineTracer(entityName);
  return currentTracer;
}

export function getCurrentTracer(): PipelineTracer | null {
  return currentTracer;
}

export function clearTracer(): void {
  if (currentTracer) {
    currentTracer.persist();
  }
  currentTracer = null;
}

export function getReliabilityWeight(source: DataSource): number {
  const reliability = RELIABILITY_HIERARCHY.find(r => r.source === source);
  return reliability?.weight || 0;
}

export function shouldUseRealtimeOverCache(): boolean {
  return REALTIME_PRIORITY_MODE;
}

export function logDatasetUsage(entity: string, usage: 'classification' | 'financial' | 'rejected'): void {
  const tracer = getCurrentTracer();
  if (tracer) {
    tracer.trace('DATASET_MATCH', {
      entity,
      source: 'dataset',
      metadata: {
        usage,
        allowed: usage === 'classification',
        warning: usage !== 'classification' ? 'Dataset used for non-classification purpose' : undefined,
      },
    });
  }
}

export default PipelineTracer;
