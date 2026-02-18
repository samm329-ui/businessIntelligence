import { analyzeWithAI, type AnalysisResult } from './analyzer';
import type { CollectorOutput } from './bot-collector';

export interface AnalystOutput {
  analysis: AnalysisResult;
  confidenceGated: boolean;
  originalConfidence: number;
  gatedConfidence: number;
  analysisTimeMs: number;
  pipelineVersion: string;
}

export async function runAnalyst(
  collectorOutput: CollectorOutput
): Promise<AnalystOutput> {
  const startTime = Date.now();
  console.log(`[Bot2:Analyst] Starting analysis for: "${collectorOutput.entity.name}"`);

  const dataConfidence = collectorOutput.metadata.dataConfidenceScore;
  const consensusConfidence = collectorOutput.consensusMetrics.overallConfidence;
  const sourceCount = collectorOutput.consensusMetrics.sourcesUsed.length;

  // FIX 5: Raise confidence threshold from 40% to 60%
  if (consensusConfidence < 60) {
    console.error(`[Bot2:Analyst] BLOCKED: Consensus confidence ${consensusConfidence}% < 60% threshold`);
    throw new Error(`BLOCKED: Insufficient consensus confidence (${consensusConfidence}%) - below 60% threshold. Collect more data before analysis.`);
  }

  // FIX 2: Minimum source rule - need at least 2 independent sources for consensus
  if (sourceCount < 2) {
    console.error(`[Bot2:Analyst] BLOCKED: Only ${sourceCount} source(s) - need minimum 2 for consensus`);
    throw new Error(`BLOCKED: Insufficient independent financial sources (${sourceCount}). One source ≠ consensus. Collect more data.`);
  }

  const collectedData = collectorOutput.collectedData;
  (collectedData as any).consensusForAI = collectorOutput.consensusForAI;
  (collectedData as any).consensusMetrics = collectorOutput.consensusMetrics;
  (collectedData as any).structuredFinancials = collectorOutput.structuredFinancials;
  collectedData.metadata.dataConfidenceScore = dataConfidence;

  const analysis = await analyzeWithAI(collectedData);

  let confidenceGated = false;
  const originalConfidence = analysis.confidence;
  let gatedConfidence = originalConfidence;

  if (dataConfidence < 60 && analysis.confidence > 70) {
    analysis.confidence = Math.min(analysis.confidence, 55);
    analysis.executiveSummary = `[LOW DATA CONFIDENCE] ${analysis.executiveSummary}`;
    confidenceGated = true;
    gatedConfidence = analysis.confidence;
    console.warn(`[Bot2:Analyst] Confidence gated: ${originalConfidence}% -> ${gatedConfidence}% (data confidence: ${dataConfidence}%)`);
  }

  const analysisTime = Date.now() - startTime;
  console.log(`[Bot2:Analyst] Complete in ${analysisTime}ms | confidence: ${analysis.confidence}% | gated: ${confidenceGated}`);

  return {
    analysis,
    confidenceGated,
    originalConfidence,
    gatedConfidence,
    analysisTimeMs: analysisTime,
    pipelineVersion: '4.5-threshold-60',
  };
}
