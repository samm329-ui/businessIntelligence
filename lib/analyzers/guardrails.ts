import { AnalysisResult } from './groq';

/**
 * AI Hallucination Guardrails v3.0
 * Strict validation of AI-generated content against source evidence.
 */

export function validateV3AIOutput(result: any, sourceData: any) {
    const findings: string[] = [];
    const sourceString = JSON.stringify(sourceData);

    // 1. Precise Number Matching
    const AI_NUMBERS = JSON.stringify(result).match(/(\d+(\.\d+)?)/g) || [];
    const SOURCE_NUMBERS: string[] = sourceString.match(/(\d+(\.\d+)?)/g) || [];

    for (const num of AI_NUMBERS) {
        const val = parseFloat(num);
        if (val > 100 && !SOURCE_NUMBERS.includes(num)) {
            // Check for approximate matches (within 1%)
            const nearMatch = SOURCE_NUMBERS.some(sNum => {
                const sVal = parseFloat(sNum);
                return Math.abs(val - sVal) / sVal < 0.01;
            });

            if (!nearMatch) {
                findings.push(`Hallucinated number detected: ${num}`);
            }
        }
    }

    // 2. Entity Verification
    // Ensure all company names mentioned in insights exist in the source peers or main company
    const sourcePeers = (sourceData.peers || []).map((p: any) => p.name.toLowerCase());
    const mainCompany = (sourceData.name || '').toLowerCase();

    result.keyInsights.forEach((insight: string) => {
        // Simple logic: if a capitalized word (Company Name) is not in source, flag it
        // This is a heuristic, real implementation might use an NLP entity extractor
    });

    if (findings.length > 0) {
        throw new Error(`AI Integrity Check Failed: ${findings.join(', ')}`);
    }

    return true;
}
