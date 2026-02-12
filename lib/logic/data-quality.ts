/**
 * Data Quality Scoring Engine
 * Implements the 4-factor confidence scoring system.
 * Factors: Source Reliability (40%), Data Freshness (30%), Cross-Ref Variance (20%), Completeness (10%).
 */

export interface DataPoint {
    value: any;
    source: string;
    timestamp: string;
    reliability: number; // 0-100 based on source type
}

export function calculateConfidenceScore(points: DataPoint[]) {
    if (points.length === 0) return 0;

    let score = 0;

    // 1. Source Reliability (Max 40)
    const avgReliability = points.reduce((acc, p) => acc + p.reliability, 0) / points.length;
    score += (avgReliability / 100) * 40;

    // 2. Data Freshness (Max 30)
    const now = new Date().getTime();
    const mostRecent = Math.max(...points.map(p => new Date(p.timestamp).getTime()));
    const ageDays = (now - mostRecent) / (1000 * 60 * 60 * 24);

    if (ageDays < 1) score += 30;
    else if (ageDays < 7) score += 20;
    else if (ageDays < 30) score += 10;
    else score += 5;

    // 3. Cross-Ref Variance (Max 20)
    if (points.length > 1) {
        const values = points.map(p => parseFloat(p.value)).filter(v => !isNaN(v));
        if (values.length > 1) {
            const min = Math.min(...values);
            const max = Math.max(...values);
            const variance = (max - min) / (max || 1);

            if (variance < 0.05) score += 20; // < 5% variance
            else if (variance < 0.15) score += 10; // < 15% variance
            else score += 0;
        }
    } else {
        score += 5; // Penalty for single source
    }

    // 4. Source Diversity (Bonus 10)
    const uniqueSources = new Set(points.map(p => p.source)).size;
    if (uniqueSources >= 3) score += 10;
    else if (uniqueSources === 2) score += 5;

    return Math.min(Math.round(score), 100);
}
