/**
 * ML Utilities Module
 * 
 * Provides machine learning algorithms for business intelligence:
 * - KNN: Competitor similarity scoring
 * - Linear Regression: Revenue growth prediction
 * - Decision Tree: Industry classification
 * 
 * Version: 1.0
 * Date: February 21, 2026
 */

import { mean, variance } from 'mathjs';

function std(data: number[]): number {
  if (data.length === 0) return 0;
  const v = variance(data as any);
  return typeof v === 'number' ? Math.sqrt(v) : 0;
}

/**
 * K-Nearest Neighbors for competitor similarity scoring
 */
export class KNNClassifier {
  private k: number;
  private data: number[][] = [];
  private labels: string[] = [];
  
  constructor(k: number = 5) {
    this.k = k;
  }
  
  /**
   * Train with historical competitor data
   */
  fit(features: number[][], labels: string[]): void {
    this.data = features;
    this.labels = labels;
  }
  
  /**
   * Calculate Euclidean distance between two points
   */
  private euclideanDistance(a: number[], b: number[]): number {
    if (a.length !== b.length) throw new Error('Dimension mismatch');
    let sum = 0;
    for (let i = 0; i < a.length; i++) {
      sum += Math.pow(a[i] - b[i], 2);
    }
    return Math.sqrt(sum);
  }
  
  /**
   * Normalize features using z-score normalization
   */
  private normalize(data: number[][]): number[][] {
    if (data.length === 0) return [];
    
    const numFeatures = data[0].length;
    const means: number[] = [];
    const stds: number[] = [];
    
    for (let j = 0; j < numFeatures; j++) {
      const col = data.map(row => row[j]);
      means.push(mean(col as any) as number);
      stds.push(std(col as any) || 1);
    }
    
    return data.map(row => 
      row.map((val, j) => (val - means[j]) / stds[j])
    );
  }
  
  /**
   * Predict similarity score for a company against competitors
   */
  predictsimilarity(queryFeatures: number[]): { competitor: string; similarity: number }[] {
    if (this.data.length === 0) return [];
    
    const normalizedData = this.normalize(this.data);
    const normalizedQuery = this.normalize([queryFeatures])[0];
    
    const distances = normalizedData.map((features, idx) => ({
      label: this.labels[idx],
      distance: this.euclideanDistance(features, normalizedQuery)
    }));
    
    // Sort by distance (ascending)
    distances.sort((a, b) => a.distance - b.distance);
    
    // Get top k and convert to similarity (1 / (1 + distance))
    return distances.slice(0, this.k).map(d => ({
      competitor: d.label,
      similarity: Math.round((1 / (1 + d.distance)) * 100) / 100
    }));
  }
  
  /**
   * Find most similar competitors based on financial metrics
   */
  findSimilarCompanies(
    targetMetrics: { revenue: number; marketCap: number; ebitdaMargin: number; peRatio: number; roe: number },
    competitorMetrics: Array<{ name: string; revenue: number; marketCap: number; ebitdaMargin: number; peRatio: number; roe: number }>
  ): Array<{ name: string; similarity: number; metrics: any }> {
    if (competitorMetrics.length === 0) return [];
    
    const target = [
      targetMetrics.revenue || 0,
      targetMetrics.marketCap || 0,
      targetMetrics.ebitdaMargin || 0,
      targetMetrics.peRatio || 0,
      targetMetrics.roe || 0
    ];
    
    const features = competitorMetrics.map(c => [
      c.revenue || 0,
      c.marketCap || 0,
      c.ebitdaMargin || 0,
      c.peRatio || 0,
      c.roe || 0
    ]);
    
    const labels = competitorMetrics.map(c => c.name);
    
    this.fit(features, labels);
    const results = this.predictsimilarity(target);
    
    return results.map((r, idx) => ({
      name: r.competitor,
      similarity: r.similarity,
      metrics: competitorMetrics[idx] || {}
    }));
  }
}

/**
 * Linear Regression for revenue growth prediction
 */
export class LinearRegression {
  private slope: number = 0;
  private intercept: number = 0;
  private trained: boolean = false;
  private r2: number = 0;
  
  /**
   * Train with historical data points [x, y]
   */
  fit(data: number[][]): void {
    if (data.length < 2) {
      this.trained = false;
      return;
    }
    
    const n = data.length;
    let sumX = 0, sumY = 0, sumXY = 0, sumX2 = 0, sumY2 = 0;
    
    for (const [x, y] of data) {
      sumX += x;
      sumY += y;
      sumXY += x * y;
      sumX2 += x * x;
      sumY2 += y * y;
    }
    
    const xMean = sumX / n;
    const yMean = sumY / n;
    
    // Calculate slope and intercept
    const denominator = n * sumX2 - sumX * sumX;
    if (Math.abs(denominator) < 1e-10) {
      this.slope = 0;
      this.intercept = yMean;
    } else {
      this.slope = (n * sumXY - sumX * sumY) / denominator;
      this.intercept = yMean - this.slope * xMean;
    }
    
    // Calculate R² score
    const ssRes = data.reduce((sum, [x, y]) => {
      const predicted = this.predict(x);
      return sum + Math.pow(y - predicted, 2);
    }, 0);
    
    const ssTot = data.reduce((sum, [, y]) => sum + Math.pow(y - yMean, 2), 0);
    
    this.r2 = ssTot > 0 ? 1 - (ssRes / ssTot) : 0;
    this.trained = true;
  }
  
  /**
   * Predict y value for given x
   */
  predict(x: number): number {
    if (!this.trained) return 0;
    return this.slope * x + this.intercept;
  }
  
  /**
   * Predict future revenue based on historical growth
   */
  predictFutureRevenue(
    historicalGrowth: number[], // Quarterly/Annual growth rates
    periodsAhead: number = 4   // Number of periods to predict
  ): { period: number; predicted: number; confidence: number }[] {
    if (historicalGrowth.length < 2 || !this.trained) {
      // Fallback: use average growth
      const avgGrowth = historicalGrowth.reduce((a, b) => a + b, 0) / historicalGrowth.length;
      return Array.from({ length: periodsAhead }, (_, i) => ({
        period: i + 1,
        predicted: 0,
        confidence: 0.3
      }));
    }
    
    // Fit linear regression on growth trend
    const growthData = historicalGrowth.map((g, i) => [i, g]);
    this.fit(growthData);
    
    const predictions: { period: number; predicted: number; confidence: number }[] = [];
    const lastPeriod = historicalGrowth.length;
    
    for (let i = 1; i <= periodsAhead; i++) {
      const predictedGrowth = this.predict(lastPeriod + i - 1);
      predictions.push({
        period: i,
        predicted: Math.max(0, predictedGrowth), // Revenue can't be negative
        confidence: Math.max(0, Math.min(1, this.r2))
      });
    }
    
    return predictions;
  }
  
  /**
   * Calculate revenue growth projection
   */
  projectRevenue(
    currentRevenue: number,
    historicalGrowthRates: number[], // e.g., [0.12, 0.15, 0.08, 0.11] for 4 quarters
    projectionYears: number = 3
  ): { year: number; revenue: number; growthRate: number; confidence: number }[] {
    const projections: { year: number; revenue: number; growthRate: number; confidence: number }[] = [];
    
    // Fit regression on historical growth
    const growthData = historicalGrowthRates.map((g, i) => [i, g]);
    this.fit(growthData);
    
    let lastRevenue = currentRevenue;
    
    for (let year = 1; year <= projectionYears; year++) {
      // Predict growth rate for this year
      const predictedGrowth = this.trained 
        ? Math.max(-0.5, Math.min(1, this.predict(historicalGrowthRates.length + year - 1)))
        : mean(historicalGrowthRates);
      
      const projectedRevenue = lastRevenue * (1 + predictedGrowth);
      
      projections.push({
        year: new Date().getFullYear() + year,
        revenue: Math.round(projectedRevenue),
        growthRate: Math.round(predictedGrowth * 100) / 100,
        confidence: Math.round(this.r2 * 100) / 100
      });
      
      lastRevenue = projectedRevenue;
    }
    
    return projections;
  }
  
  getRSquared(): number {
    return this.r2;
  }
  
  isTrained(): boolean {
    return this.trained;
  }
}

/**
 * Decision Tree for industry classification
 */
export class DecisionTreeClassifier {
  private tree: TreeNode | null = null;
  private featureNames: string[] = [];
  
  /**
   * Build decision tree from training data
   */
  fit(
    features: Record<string, number>[],
    labels: string[]
  ): void {
    if (features.length === 0 || labels.length === 0) return;
    
    this.featureNames = Object.keys(features[0]);
    
    // Convert to array format
    const featureArrays = features.map(f => this.featureNames.map(name => f[name] || 0));
    
    // Build tree recursively
    this.tree = this.buildTree(featureArrays, labels, 0);
  }
  
  /**
   * Calculate Gini impurity
   */
  private giniImpurity(labels: string[]): number {
    if (labels.length === 0) return 0;
    
    const counts = new Map<string, number>();
    labels.forEach(l => counts.set(l, (counts.get(l) || 0) + 1));
    
    let impurity = 1;
    counts.forEach(count => {
      const prob = count / labels.length;
      impurity -= prob * prob;
    });
    
    return impurity;
  }
  
  /**
   * Find best split for a feature
   */
  private findBestSplit(
    features: number[][],
    labels: string[],
    featureIdx: number
  ): { threshold: number; left: number[]; right: number[] } | null {
    const values = features.map(f => f[featureIdx]).sort((a, b) => a - b);
    const thresholds: number[] = [];
    
    for (let i = 1; i < values.length; i++) {
      thresholds.push((values[i - 1] + values[i]) / 2);
    }
    
    let bestGini = Infinity;
    let bestSplit: { threshold: number; left: number[]; right: number[] } | null = null;
    
    for (const threshold of thresholds) {
      const left: number[] = [];
      const right: number[] = [];
      
      features.forEach((f, idx) => {
        if (f[featureIdx] <= threshold) {
          left.push(idx);
        } else {
          right.push(idx);
        }
      });
      
      if (left.length === 0 || right.length === 0) continue;
      
      const leftLabels = left.map(i => labels[i]);
      const rightLabels = right.map(i => labels[i]);
      
      const leftGini = this.giniImpurity(leftLabels);
      const rightGini = this.giniImpurity(rightLabels);
      
      const weightedGini = 
        (left.length * leftGini + right.length * rightGini) / labels.length;
      
      if (weightedGini < bestGini) {
        bestGini = weightedGini;
        bestSplit = { threshold, left, right };
      }
    }
    
    return bestSplit;
  }
  
  /**
   * Build tree recursively
   */
  private buildTree(
    features: number[][],
    labels: string[],
    depth: number,
    maxDepth: number = 10
  ): TreeNode {
    // Base cases
    if (depth >= maxDepth || labels.length === 0 || this.giniImpurity(labels) === 0) {
      // Return most common label
      const counts = new Map<string, number>();
      labels.forEach(l => counts.set(l, (counts.get(l) || 0) + 1));
      let majority = '';
      let maxCount = 0;
      counts.forEach((count, label) => {
        if (count > maxCount) {
          maxCount = count;
          majority = label;
        }
      });
      return { label: majority, isLeaf: true };
    }
    
    // Find best feature to split
    let bestFeature = 0;
    let bestSplit: { threshold: number; left: number[]; right: number[] } | null = null;
    let bestGini = Infinity;
    
    for (let i = 0; i < features[0].length; i++) {
      const split = this.findBestSplit(features, labels, i);
      if (split) {
        const leftLabels = split.left.map(j => labels[j]);
        const rightLabels = split.right.map(j => labels[j]);
        const gini = (
          split.left.length * this.giniImpurity(leftLabels) +
          split.right.length * this.giniImpurity(rightLabels)
        ) / labels.length;
        
        if (gini < bestGini) {
          bestGini = gini;
          bestFeature = i;
          bestSplit = split;
        }
      }
    }
    
    if (!bestSplit) {
      const counts = new Map<string, number>();
      labels.forEach(l => counts.set(l, (counts.get(l) || 0) + 1));
      let majority = '';
      let maxCount = 0;
      counts.forEach((count, label) => {
        if (count > maxCount) {
          maxCount = count;
          majority = label;
        }
      });
      return { label: majority, isLeaf: true };
    }
    
    // Recursively build children
    const leftFeatures = bestSplit.left.map(i => features[i]);
    const leftLabels = bestSplit.left.map(i => labels[i]);
    const rightFeatures = bestSplit.right.map(i => features[i]);
    const rightLabels = bestSplit.right.map(i => labels[i]);
    
    return {
      feature: this.featureNames[bestFeature],
      threshold: bestSplit.threshold,
      left: this.buildTree(leftFeatures, leftLabels, depth + 1, maxDepth),
      right: this.buildTree(rightFeatures, rightLabels, depth + 1, maxDepth),
      isLeaf: false
    };
  }
  
  /**
   * Predict class for a single sample
   */
  predict(sample: Record<string, number>): string {
    if (!this.tree) return 'Unknown';
    
    let node: TreeNode | undefined = this.tree;
    while (node && !node.isLeaf) {
      const featureName = node.feature || '';
      const value = sample[featureName] || 0;
      const threshold = node.threshold || 0;
      if (value <= threshold) {
        node = node.left;
      } else {
        node = node.right;
      }
    }
    
    return node?.label || 'Unknown';
  }
  
  /**
   * Predict industry for company based on financial metrics
   */
  classifyCompany(
    metrics: {
      revenue: number;
      marketCap: number;
      peRatio: number;
      ebitdaMargin: number;
      revenueGrowth: number;
      debtToEquity: number;
      roe: number;
    }
  ): { industry: string; confidence: number; alternatives: Array<{ industry: string; probability: number }> } {
    // Map metrics to features
    const features: Record<string, number> = {
      revenue: Math.log10(metrics.revenue || 1),
      marketCap: Math.log10(metrics.marketCap || 1),
      peRatio: metrics.peRatio || 0,
      ebitdaMargin: metrics.ebitdaMargin || 0,
      revenueGrowth: metrics.revenueGrowth || 0,
      debtToEquity: metrics.debtToEquity || 0,
      roe: metrics.roe || 0
    };
    
    const prediction = this.predict(features);
    
    // For confidence, we'd need probabilities - simplified here
    return {
      industry: prediction,
      confidence: 0.75, // Placeholder - would need probability calculation
      alternatives: []
    };
  }
}

interface TreeNode {
  feature?: string;
  threshold?: number;
  left?: TreeNode;
  right?: TreeNode;
  label?: string;
  isLeaf: boolean;
}

/**
 * Ensemble methods for better predictions
 */
export class EnsembleClassifier {
  private knn: KNNClassifier;
  private dt: DecisionTreeClassifier;
  
  constructor() {
    this.knn = new KNNClassifier(3);
    this.dt = new DecisionTreeClassifier();
  }
  
  /**
   * Vote between KNN and Decision Tree predictions
   */
  vote(
    queryFeatures: number[],
    dtFeatures: Record<string, number>,
    knnLabels: string[],
    dtLabel: string
  ): { prediction: string; confidence: number } {
    // Get KNN predictions
    const knnResults = this.knn.predictsimilarity(queryFeatures);
    
    // Count votes
    const votes = new Map<string, number>();
    knnResults.forEach(r => {
      votes.set(r.competitor, (votes.get(r.competitor) || 0) + r.similarity);
    });
    
    // Add Decision Tree vote
    votes.set(dtLabel, (votes.get(dtLabel) || 0) + 1);
    
    // Find winner
    let winner = '';
    let maxVotes = 0;
    votes.forEach((count, label) => {
      if (count > maxVotes) {
        maxVotes = count;
        winner = label;
      }
    });
    
    const totalVotes = Array.from(votes.values()).reduce((a, b) => a + b, 0);
    
    return {
      prediction: winner,
      confidence: totalVotes > 0 ? maxVotes / totalVotes : 0
    };
  }
}

/**
 * Calculate similarity score between two companies
 */
export function calculateCompanySimilarity(
  companyA: { revenue: number; marketCap: number; ebitdaMargin: number; peRatio: number; roe: number },
  companyB: { revenue: number; marketCap: number; ebitdaMargin: number; peRatio: number; roe: number }
): number {
  const metrics = ['revenue', 'marketCap', 'ebitdaMargin', 'peRatio', 'roe'] as const;
  
  let totalDiff = 0;
  
  for (const metric of metrics) {
    const a = companyA[metric] || 0;
    const b = companyB[metric] || 0;
    const max = Math.max(Math.abs(a), Math.abs(b), 1);
    totalDiff += Math.abs(a - b) / max;
  }
  
  // Convert to similarity (0-1)
  const similarity = 1 - (totalDiff / metrics.length);
  return Math.max(0, Math.min(1, similarity));
}

/**
 * Calculate growth rate from historical data
 */
export function calculateCAGR(startValue: number, endValue: number, periods: number): number {
  if (startValue <= 0 || endValue <= 0 || periods <= 0) return 0;
  return Math.pow(endValue / startValue, 1 / periods) - 1;
}

export default {
  KNNClassifier,
  LinearRegression,
  DecisionTreeClassifier,
  EnsembleClassifier,
  calculateCompanySimilarity,
  calculateCAGR
};
