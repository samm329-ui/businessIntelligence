/**
 * Comprehensive ML Module - EBITA Intelligence
 * 
 * Complete Machine Learning Suite:
 * - K-Means Clustering
 * - Hierarchical Clustering  
 * - Mean Shift Clustering
 * - DBSCAN (Density-Based)
 * - Naive Bayes (Sentiment Analysis)
 * - Neural Network (Prediction)
 * - PCA (Dimensionality Reduction)
 * - Feature Selection/Extraction
 * 
 * Version: 2.0 - Complete ML Suite
 * Date: February 21, 2026
 */

import { mean, variance } from 'mathjs';

function correlationCoeff(x: number[], y: number[]): number {
  const n = x.length;
  const meanX = mean1D(x);
  const meanY = mean1D(y);
  
  let num = 0;
  let denX = 0;
  let denY = 0;
  
  for (let i = 0; i < n; i++) {
    const dx = x[i] - meanX;
    const dy = y[i] - meanY;
    num += dx * dy;
    denX += dx * dx;
    denY += dy * dy;
  }
  
  const den = Math.sqrt(denX * denY);
  return den === 0 ? 0 : num / den;
}

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

function mean1D(arr: number[]): number {
  return arr.reduce((a, b) => a + b, 0) / arr.length;
}

function std1D(arr: number[]): number {
  const m = mean1D(arr);
  const sqDiffs = arr.map(x => Math.pow(x - m, 2));
  return Math.sqrt(mean1D(sqDiffs));
}

function normalize(arr: number[]): number[] {
  const m = mean1D(arr);
  const s = std1D(arr) || 1;
  return arr.map(x => (x - m) / s);
}

function euclideanDistance(a: number[], b: number[]): number {
  if (a.length !== b.length) throw new Error('Dimension mismatch');
  return Math.sqrt(a.reduce((sum, val, i) => sum + Math.pow(val - b[i], 2), 0));
}

function manhattanDistance(a: number[], b: number[]): number {
  if (a.length !== b.length) throw new Error('Dimension mismatch');
  return a.reduce((sum, val, i) => sum + Math.abs(val - b[i]), 0);
}

function dotProduct(a: number[], b: number[]): number {
  return a.reduce((sum, val, i) => sum + val * b[i], 0);
}

function transpose(matrix: number[][]): number[][] {
  if (matrix.length === 0) return [];
  return matrix[0].map((_, colIndex) => matrix.map(row => row[colIndex]));
}

function matrixMultiply(A: number[][], B: number[][]): number[][] {
  const rowsA = A.length;
  const colsA = A[0].length;
  const colsB = B[0].length;
  
  const result: number[][] = [];
  for (let i = 0; i < rowsA; i++) {
    result[i] = [];
    for (let j = 0; j < colsB; j++) {
      let sum = 0;
      for (let k = 0; k < colsA; k++) {
        sum += A[i][k] * B[k][j];
      }
      result[i][j] = sum;
    }
  }
  return result;
}

function matrixSubtract(A: number[][], B: number[][]): number[][] {
  return A.map((row, i) => row.map((val, j) => val - B[i][j]));
}

function matrixAdd(A: number[][], B: number[][]): number[][] {
  return A.map((row, i) => row.map((val, j) => val + B[i][j]));
}

function scalarMultiply(matrix: number[][], scalar: number): number[][] {
  return matrix.map(row => row.map(val => val * scalar));
}

// ============================================================================
// K-MEANS CLUSTERING
// ============================================================================

export class KMeansClustering {
  private k: number;
  private maxIterations: number;
  private centroids: number[][] = [];
  private labels: number[] = [];
  private converged: boolean = false;
  
  constructor(k: number = 5, maxIterations: number = 100) {
    this.k = k;
    this.maxIterations = maxIterations;
  }
  
  /**
   * Initialize centroids using k-means++ algorithm
   */
  private initializeCentroids(data: number[][]): void {
    if (data.length === 0 || data[0].length === 0) return;
    
    // First centroid: random data point
    this.centroids = [data[Math.floor(Math.random() * data.length)]];
    
    // Remaining centroids: weighted probability
    for (let i = 1; i < this.k; i++) {
      const distances = data.map(point => {
        const minDist = Math.min(...this.centroids.map(c => euclideanDistance(point, c)));
        return minDist * minDist;
      });
      
      const totalDist = distances.reduce((a, b) => a + b, 0);
      let r = Math.random() * totalDist;
      
      for (let j = 0; j < data.length; j++) {
        r -= distances[j];
        if (r <= 0) {
          this.centroids.push(data[j]);
          break;
        }
      }
    }
  }
  
  /**
   * Assign points to nearest centroid
   */
  private assignClusters(data: number[][]): number[] {
    return data.map(point => {
      let minDist = Infinity;
      let cluster = 0;
      
      this.centroids.forEach((centroid, idx) => {
        const dist = euclideanDistance(point, centroid);
        if (dist < minDist) {
          minDist = dist;
          cluster = idx;
        }
      });
      
      return cluster;
    });
  }
  
  /**
   * Update centroids based on cluster assignments
   */
  private updateCentroids(data: number[][], labels: number[]): boolean {
    const newCentroids: number[][] = [];
    let changed = false;
    
    for (let i = 0; i < this.k; i++) {
      const clusterPoints = data.filter((_, idx) => labels[idx] === i);
      
      if (clusterPoints.length > 0) {
        const numFeatures = clusterPoints[0].length;
        const newCentroid: number[] = [];
        
        for (let f = 0; f < numFeatures; f++) {
          const sum = clusterPoints.reduce((acc, p) => acc + p[f], 0);
          newCentroid.push(sum / clusterPoints.length);
        }
        
        newCentroids.push(newCentroid);
      } else {
        // Reinitialize empty cluster
        newCentroids.push(data[Math.floor(Math.random() * data.length)]);
      }
    }
    
    // Check convergence
    for (let i = 0; i < this.k; i++) {
      if (euclideanDistance(this.centroids[i], newCentroids[i]) > 0.001) {
        changed = true;
        break;
      }
    }
    
    this.centroids = newCentroids;
    return changed;
  }
  
  /**
   * Train K-Means model
   */
  fit(data: number[][]): void {
    if (data.length < this.k) {
      console.warn('K-Means: Not enough data points for k clusters');
      this.labels = data.map((_, i) => i % data.length);
      return;
    }
    
    this.initializeCentroids(data);
    
    for (let iter = 0; iter < this.maxIterations; iter++) {
      this.labels = this.assignClusters(data);
      const changed = this.updateCentroids(data, this.labels);
      
      if (!changed) {
        this.converged = true;
        break;
      }
    }
  }
  
  /**
   * Predict cluster labels for new data
   */
  predict(data: number[][]): number[] {
    return this.assignClusters(data);
  }
  
  /**
   * Segment companies into groups based on financial metrics
   */
  segmentCompanies(
    companies: Array<{
      name: string;
      revenue: number;
      marketCap: number;
      ebitdaMargin: number;
      peRatio: number;
      revenueGrowth: number;
    }>,
    numSegments: number = 4
  ): Array<{ company: string; segment: number; metrics: any }> {
    // Extract features
    const features = companies.map(c => [
      Math.log10(c.revenue || 1),
      Math.log10(c.marketCap || 1),
      c.ebitdaMargin || 0,
      c.peRatio || 0,
      c.revenueGrowth || 0
    ]);
    
    // Normalize features
    const normalized = features[0].map((_, col) => 
      normalize(features.map(row => row[col]))
    ).map(col => Array.from(col));
    
    // Transpose back
    const normalizedData = transpose(normalized);
    
    // Fit K-Means
    this.k = numSegments;
    this.fit(normalizedData);
    
    // Return results
    return companies.map((c, i) => ({
      company: c.name,
      segment: this.labels[i],
      metrics: {
        revenue: c.revenue,
        marketCap: c.marketCap,
        ebitdaMargin: c.ebitdaMargin,
        peRatio: c.peRatio,
        revenueGrowth: c.revenueGrowth
      }
    }));
  }
  
  /**
   * Get cluster statistics
   */
  getClusterStats(data: number[][]): Array<{ centroid: number[]; size: number; variance: number }> {
    return this.centroids.map((centroid, i) => {
      const clusterPoints = data.filter((_, idx) => this.labels[idx] === i);
      const size = clusterPoints.length;
      
      let variance = 0;
      if (size > 0) {
        const distances = clusterPoints.map(p => euclideanDistance(p, centroid));
        variance = mean1D(distances.map(d => d * d));
      }
      
      return { centroid, size, variance };
    });
  }
  
  isConverged(): boolean {
    return this.converged;
  }
  
  getLabels(): number[] {
    return this.labels;
  }
}

// ============================================================================
// HIERARCHICAL CLUSTERING
// ============================================================================

export class HierarchicalClustering {
  private linkage: 'single' | 'complete' | 'average';
  private dendrogram: any[] = [];
  private clusters: number[][] = [];
  
  constructor(linkage: 'single' | 'complete' | 'average' = 'average') {
    this.linkage = linkage;
  }
  
  /**
   * Calculate linkage distance between two clusters
   */
  private calculateLinkageDistance(cluster1Indices: number[], cluster2Indices: number[]): number {
    const points1 = cluster1Indices.map(i => this.clusters[i]);
    const points2 = cluster2Indices.map(i => this.clusters[i]);
    
    if (this.linkage === 'single') {
      // Minimum distance
      let minDist = Infinity;
      for (const p1 of points1) {
        for (const p2 of points2) {
          const dist = euclideanDistance(p1, p2);
          if (dist < minDist) minDist = dist;
        }
      }
      return minDist;
    } else if (this.linkage === 'complete') {
      // Maximum distance
      let maxDist = 0;
      for (const p1 of points1) {
        for (const p2 of points2) {
          const dist = euclideanDistance(p1, p2);
          if (dist > maxDist) maxDist = dist;
        }
      }
      return maxDist;
    } else {
      // Average distance
      let totalDist = 0;
      let count = 0;
      for (const p1 of points1) {
        for (const p2 of points2) {
          totalDist += euclideanDistance(p1, p2);
          count++;
        }
      }
      return count > 0 ? totalDist / count : 0;
    }
  }
  
  /**
   * Build hierarchical clustering dendrogram
   */
  fit(data: number[][]): void {
    if (data.length === 0) return;
    
    this.clusters = data.map((_, i) => [i]);
    this.dendrogram = [];
    
    let activeClusters: number[][] = data.map((_, i) => [i]);
    
    while (activeClusters.length > 1) {
      let minDist = Infinity;
      let merge1 = 0, merge2 = 1;
      
      // Find closest pair of clusters
      for (let i = 0; i < activeClusters.length; i++) {
        for (let j = i + 1; j < activeClusters.length; j++) {
          const dist = this.calculateLinkageDistance(
            activeClusters[i],
            activeClusters[j]
          );
          
          if (dist < minDist) {
            minDist = dist;
            merge1 = i;
            merge2 = j;
          }
        }
      }
      
      // Record merge
      this.dendrogram.push({
        cluster1: activeClusters[merge1][0],
        cluster2: activeClusters[merge2][0],
        distance: minDist,
        level: this.dendrogram.length
      });
      
      // Merge clusters
      const newCluster = [...activeClusters[merge1], ...activeClusters[merge2]];
      activeClusters.splice(merge2, 1);
      activeClusters.splice(merge1, 1);
      activeClusters.push(newCluster);
    }
  }
  
  /**
   * Get clusters at specific cut level
   */
  getClustersAtLevel(data: number[][], numClusters: number): number[][] {
    if (this.dendrogram.length === 0) return [];
    
    // Build cluster map from dendrogram
    const clusterMap = new Map<number, number[]>();
    data.forEach((_, i) => clusterMap.set(i, [i]));
    
    // Merge until we have the right number of clusters
    let numCurrentClusters = data.length;
    
    for (const merge of this.dendrogram) {
      if (numCurrentClusters <= numClusters) break;
      
      const c1 = merge.cluster1;
      const c2 = merge.cluster2;
      
      // Find and merge
      const cluster1 = clusterMap.get(c1) || [c1];
      const cluster2 = clusterMap.get(c2) || [c2];
      
      clusterMap.delete(c1);
      clusterMap.delete(c2);
      clusterMap.set(this.dendrogram.indexOf(merge) + data.length, [...cluster1, ...cluster2]);
      
      numCurrentClusters--;
    }
    
    return Array.from(clusterMap.values());
  }
  
  /**
   * Create industry/sector dendrogram for companies
   */
  createSectorDendrogram(
    companies: Array<{ name: string; sector: string; metrics: number[] }>
  ): { dendrogram: any[]; sectors: string[] } {
    const data = companies.map(c => c.metrics);
    this.fit(data);
    
    const sectorsSet = new Set(companies.map(c => c.sector));
    const sectors = Array.from(sectorsSet);
    
    return {
      dendrogram: this.dendrogram,
      sectors
    };
  }
  
  getDendrogram(): any[] {
    return this.dendrogram;
  }
}

// ============================================================================
// MEAN SHIFT CLUSTERING
// ============================================================================

export class MeanShiftClustering {
  private bandwidth: number;
  private maxIterations: number;
  private cluster_centers: number[][] = [];
  
  constructor(bandwidth: number = 1.0, maxIterations: number = 100) {
    this.bandwidth = bandwidth;
    this.maxIterations = maxIterations;
  }
  
  /**
   * Gaussian kernel for density estimation
   */
  private gaussianKernel(distance: number): number {
    return Math.exp(-(distance * distance) / (2 * this.bandwidth * this.bandwidth));
  }
  
  /**
   * Shift a point towards the mean of its neighborhood
   */
  private shiftPoint(point: number[], data: number[][]): number[] {
    let numerator = new Array(point.length).fill(0);
    let denominator = 0;
    
    for (const other of data) {
      const dist = euclideanDistance(point, other);
      const weight = this.gaussianKernel(dist);
      
      for (let i = 0; i < point.length; i++) {
        numerator[i] += weight * other[i];
      }
      denominator += weight;
    }
    
    if (denominator === 0) return point;
    
    return numerator.map(n => n / denominator);
  }
  
  /**
   * Train Mean Shift model
   */
  fit(data: number[][]): void {
    if (data.length === 0) return;
    
    let points = data.map(p => [...p]);
    
    for (let iter = 0; iter < this.maxIterations; iter++) {
      let changed = false;
      
      for (let i = 0; i < points.length; i++) {
        const shifted = this.shiftPoint(points[i], data);
        
        if (euclideanDistance(points[i], shifted) > 0.001) {
          points[i] = shifted;
          changed = true;
        }
      }
      
      if (!changed) break;
    }
    
    // Cluster centers are unique points
    this.cluster_centers = this.getUniqueCentroids(points);
  }
  
  /**
   * Get unique cluster centers
   */
  private getUniqueCentroids(points: number[][]): number[][] {
    const centers: number[][] = [];
    const threshold = this.bandwidth * 0.5;
    
    for (const point of points) {
      const isDuplicate = centers.some(c => euclideanDistance(c, point) < threshold);
      if (!isDuplicate) {
        centers.push(point);
      }
    }
    
    return centers;
  }
  
  /**
   * Predict clusters for data
   */
  predict(data: number[][]): number[] {
    return data.map(point => {
      let minDist = Infinity;
      let cluster = 0;
      
      this.cluster_centers.forEach((center, idx) => {
        const dist = euclideanDistance(point, center);
        if (dist < minDist) {
          minDist = dist;
          cluster = idx;
        }
      });
      
      return cluster;
    });
  }
  
  /**
   * Auto-segment companies using Mean Shift
   */
  autoSegment(data: number[][]): Array<{ cluster: number; points: number[][] }> {
    this.fit(data);
    
    const clusters = new Map<number, number[][]>();
    
    const labels = this.predict(data);
    labels.forEach((label, idx) => {
      if (!clusters.has(label)) {
        clusters.set(label, []);
      }
      clusters.get(label)!.push(data[idx]);
    });
    
    return Array.from(clusters.entries()).map(([cluster, points]) => ({
      cluster,
      points
    }));
  }
  
  getClusterCenters(): number[][] {
    return this.cluster_centers;
  }
}

// ============================================================================
// DBSCAN (Density-Based Clustering)
// ============================================================================

export class DBSCAN {
  private epsilon: number;
  private minPts: number;
  private labels: number[] = [];
  private noise: number = -1;
  private clusterId: number = 0;
  
  constructor(epsilon: number = 0.5, minPts: number = 3) {
    this.epsilon = epsilon;
    this.minPts = minPts;
  }
  
  /**
   * Find all neighbors within epsilon distance
   */
  private getNeighbors(data: number[][], pointIdx: number): number[] {
    const neighbors: number[] = [];
    const point = data[pointIdx];
    
    for (let i = 0; i < data.length; i++) {
      if (i === pointIdx) continue;
      if (euclideanDistance(point, data[i]) <= this.epsilon) {
        neighbors.push(i);
      }
    }
    
    return neighbors;
  }
  
  /**
   * Expand cluster from a seed point
   */
  private expandCluster(data: number[][], pointIdx: number, neighbors: number[]): void {
    this.labels[pointIdx] = this.clusterId;
    
    let seedSet = [...neighbors];
    let idx = 0;
    
    while (idx < seedSet.length) {
      const currentPoint = seedSet[idx];
      idx++;
      
      if (this.labels[currentPoint] === this.noise) {
        this.labels[currentPoint] = this.clusterId;
      }
      
      if (this.labels[currentPoint] !== -1 && this.labels[currentPoint] !== this.noise) {
        continue;
      }
      
      this.labels[currentPoint] = this.clusterId;
      
      const currentNeighbors = this.getNeighbors(data, currentPoint);
      
      if (currentNeighbors.length >= this.minPts) {
        const combined = seedSet.concat(currentNeighbors);
        const unique = Array.from(new Set(combined));
        seedSet = unique;
      }
    }
  }
  
  /**
   * Train DBSCAN model
   */
  fit(data: number[][]): void {
    this.labels = new Array(data.length).fill(-1);
    this.clusterId = 0;
    
    for (let i = 0; i < data.length; i++) {
      if (this.labels[i] !== -1) continue;
      
      const neighbors = this.getNeighbors(data, i);
      
      if (neighbors.length < this.minPts) {
        this.labels[i] = this.noise;
      } else {
        this.clusterId++;
        this.expandCluster(data, i, neighbors);
      }
    }
  }
  
  /**
   * Identify outliers/anomalies in company data
   */
  findAnomalies(
    companies: Array<{ name: string; metrics: number[] }>
  ): Array<{ company: string; isAnomaly: boolean; cluster: number }> {
    const data = companies.map(c => c.metrics);
    this.fit(data);
    
    return companies.map((c, i) => ({
      company: c.name,
      isAnomaly: this.labels[i] === this.noise,
      cluster: this.labels[i]
    }));
  }
  
  /**
   * Get cluster statistics
   */
  getClusterStats(): Map<number, number> {
    const stats = new Map<number, number>();
    
    for (const label of this.labels) {
      stats.set(label, (stats.get(label) || 0) + 1);
    }
    
    return stats;
  }
  
  getLabels(): number[] {
    return this.labels;
  }
}

// ============================================================================
// NAIVE BAYES (Sentiment Analysis)
// ============================================================================

export class NaiveBayesClassifier {
  private classes: Set<string> = new Set();
  private wordCounts: Map<string, Map<string, number>> = new Map();
  private classCounts: Map<string, number> = new Map();
  private vocabulary: Set<string> = new Set();
  private totalDocs: number = 0;
  private smoothing: number = 1;
  
  /**
   * Tokenize text into words
   */
  private tokenize(text: string): string[] {
    return text.toLowerCase()
      .replace(/[^\w\s]/g, '')
      .split(/\s+/)
      .filter(word => word.length > 2);
  }
  
  /**
   * Train on labeled text data
   */
  fit(texts: string[], labels: string[]): void {
    this.classes = new Set(labels);
    this.totalDocs = texts.length;
    this.wordCounts = new Map();
    this.classCounts = new Map();
    this.vocabulary = new Set();
    
    // Initialize class counts
    const classesArray = Array.from(this.classes);
    for (const cls of classesArray) {
      this.classCounts.set(cls, 0);
      this.wordCounts.set(cls, new Map());
    }
    
    // Count words per class
    texts.forEach((text, idx) => {
      const label = labels[idx];
      this.classCounts.set(label, (this.classCounts.get(label) || 0) + 1);
      
      const words = this.tokenize(text);
      const wordCount = this.wordCounts.get(label)!;
      
      for (const word of words) {
        this.vocabulary.add(word);
        wordCount.set(word, (wordCount.get(word) || 0) + 1);
      }
    });
  }
  
  getClasses(): string[] {
    return Array.from(this.classes);
  }
  
  /**
   * Calculate log probability of a class
   */
  private logProbability(word: string, cls: string): number {
    const wordCount = this.wordCounts.get(cls)?.get(word) || 0;
    const totalWords = Array.from(this.wordCounts.get(cls)?.values() || []).reduce((a, b) => a + b, 0);
    const vocabSize = this.vocabulary.size;
    
    return Math.log((wordCount + this.smoothing) / (totalWords + this.smoothing * vocabSize));
  }
  
  /**
   * Predict class for new text
   */
  predict(text: string): { label: string; probabilities: Map<string, number> } {
    const words = this.tokenize(text);
    const probabilities = new Map<string, number>();
    const classesArray = Array.from(this.classes);
    
    for (const cls of classesArray) {
      // Prior probability
      let logProb = Math.log((this.classCounts.get(cls) || 0) / this.totalDocs);
      
      // Add word probabilities
      for (const word of words) {
        logProb += this.logProbability(word, cls);
      }
      
      probabilities.set(cls, Math.exp(logProb));
    }
    
    // Normalize
    const total = Array.from(probabilities.values()).reduce((a, b) => a + b, 0);
    probabilities.forEach((prob, cls) => {
      probabilities.set(cls, prob / total);
    });
    
    // Find best class
    let bestLabel = '';
    let bestProb = -1;
    probabilities.forEach((prob, label) => {
      if (prob > bestProb) {
        bestProb = prob;
        bestLabel = label;
      }
    });
    
    return { label: bestLabel, probabilities };
  }
  
  /**
   * Analyze sentiment of news/analyst reports
   */
  analyzeSentiment(texts: string[]): Array<{ text: string; sentiment: string; confidence: number }> {
    // Train on example data if not trained
    if (this.totalDocs === 0) {
      const trainTexts = [
        'great earnings growth strong buy',
        'excellent results positive outlook',
        'good performance recommended',
        'bad losses negative guidance',
        'poor results decline warning',
        'weak performance sell rating'
      ];
      const trainLabels = ['positive', 'positive', 'positive', 'negative', 'negative', 'negative'];
      this.fit(trainTexts, trainLabels);
    }
    
    return texts.map(text => {
      const { label, probabilities } = this.predict(text);
      const confidence = Math.max(...Array.from(probabilities.values()));
      
      return { text: text.slice(0, 100), sentiment: label, confidence };
    });
  }
}

// ============================================================================
// NEURAL NETWORK
// ============================================================================

export class NeuralNetwork {
  private layers: number[];
  private weights: number[][][] = [];
  private biases: number[][] = [];
  private learningRate: number;
  private activation: string;
  
  constructor(
    layers: number[],
    options: { learningRate?: number; activation?: string } = {}
  ) {
    this.layers = layers;
    this.learningRate = options.learningRate || 0.01;
    this.activation = options.activation || 'relu';
    
    this.initializeWeights();
  }
  
  /**
   * Initialize weights with Xavier initialization
   */
  private initializeWeights(): void {
    this.weights = [];
    this.biases = [];
    
    for (let i = 0; i < this.layers.length - 1; i++) {
      const inputSize = this.layers[i];
      const outputSize = this.layers[i + 1];
      
      // Xavier initialization
      const scale = Math.sqrt(2 / (inputSize + outputSize));
      
      const layerWeights: number[][] = [];
      for (let j = 0; j < outputSize; j++) {
        const row: number[] = [];
        for (let k = 0; k < inputSize; k++) {
          row.push((Math.random() - 0.5) * 2 * scale);
        }
        layerWeights.push(row);
      }
      
      this.weights.push(layerWeights);
      this.biases.push(new Array(outputSize).fill(0));
    }
  }
  
  /**
   * Activation functions
   */
  private relu(x: number): number {
    return Math.max(0, x);
  }
  
  private reluDerivative(x: number): number {
    return x > 0 ? 1 : 0;
  }
  
  private sigmoid(x: number): number {
    return 1 / (1 + Math.exp(-Math.min(Math.max(x, -500), 500)));
  }
  
  private sigmoidDerivative(x: number): number {
    return x * (1 - x);
  }
  
  private tanh(x: number): number {
    return Math.tanh(x);
  }
  
  private tanhDerivative(x: number): number {
    return 1 - x * x;
  }
  
  /**
   * Forward propagation
   */
  private forward(input: number[]): { outputs: number[][]; activations: number[][] } {
    const activations: number[][] = [input];
    let current = input;
    
    for (let i = 0; i < this.weights.length; i++) {
      // Matrix multiply + bias
      const next: number[] = [];
      for (let j = 0; j < this.weights[i].length; j++) {
        let sum = this.biases[i][j];
        for (let k = 0; k < current.length; k++) {
          sum += current[k] * this.weights[i][j][k];
        }
        
        // Apply activation
        if (this.activation === 'sigmoid') {
          next.push(this.sigmoid(sum));
        } else if (this.activation === 'tanh') {
          next.push(this.tanh(sum));
        } else {
          next.push(this.relu(sum));
        }
      }
      
      activations.push(next);
      current = next;
    }
    
    return { outputs: this.weights.map((_, i) => activations[i + 1]), activations };
  }
  
  /**
   * Train the neural network
   */
  train(inputs: number[][], outputs: number[][], epochs: number = 1000): void {
    for (let epoch = 0; epoch < epochs; epoch++) {
      for (let i = 0; i < inputs.length; i++) {
        const { outputs: layerOutputs, activations } = this.forward(inputs[i]);
        const target = outputs[i];
        
        // Backpropagation
        let errors: number[][] = [];
        
        // Output layer error
        const outputError = target.map((t, j) => t - (layerOutputs[layerOutputs.length - 1][j] || 0));
        errors.unshift(outputError);
        
        // Hidden layer errors
        for (let l = this.weights.length - 2; l >= 0; l--) {
          const hiddenError: number[] = [];
          for (let j = 0; j < this.weights[l].length; j++) {
            let error = 0;
            for (let k = 0; k < errors[0].length; k++) {
              error += errors[0][k] * this.weights[l + 1][k][j];
            }
            hiddenError.push(error);
          }
          errors.unshift(hiddenError);
        }
        
        // Update weights
        for (let l = 0; l < this.weights.length; l++) {
          const activationDerivative = this.activation === 'sigmoid' 
            ? this.sigmoidDerivative 
            : this.activation === 'tanh' 
              ? this.tanhDerivative 
              : this.reluDerivative;
          
          for (let j = 0; j < this.weights[l].length; j++) {
            for (let k = 0; k < this.weights[l][j].length; k++) {
              const delta = this.learningRate * errors[l][j] * activationDerivative(activations[l + 1][j]);
              this.weights[l][j][k] += delta * activations[l][k];
            }
            this.biases[l][j] += this.learningRate * errors[l][j];
          }
        }
      }
      
      // Learning rate decay
      if (epoch % 100 === 0) {
        this.learningRate *= 0.99;
      }
    }
  }
  
  /**
   * Predict output for input
   */
  predict(inputs: number[]): number[] {
    const { outputs } = this.forward(inputs);
    return outputs[outputs.length - 1];
  }
  
  /**
   * Predict credit risk / default probability
   */
  predictCreditRisk(
    features: {
      debtToEquity: number;
      currentRatio: number;
      profitMargin: number;
      revenueGrowth: number;
      ebitdaCoverage: number;
    }
  ): { risk: string; probability: number } {
    const input = [
      features.debtToEquity,
      features.currentRatio,
      features.profitMargin,
      features.revenueGrowth,
      features.ebitdaCoverage
    ];
    
    const output = this.predict(input);
    const probability = output[0] || 0.5;
    
    return {
      risk: probability > 0.7 ? 'HIGH' : probability > 0.3 ? 'MEDIUM' : 'LOW',
      probability: Math.round(probability * 100) / 100
    };
  }
  
  /**
   * Predict stock price movement
   */
  predictPriceMovement(
    historicalMetrics: number[]
  ): { direction: 'UP' | 'DOWN' | 'FLAT'; confidence: number } {
    const output = this.predict(historicalMetrics);
    const value = output[0] || 0.5;
    
    return {
      direction: value > 0.55 ? 'UP' : value < 0.45 ? 'DOWN' : 'FLAT',
      confidence: Math.abs(value - 0.5) * 2
    };
  }
}

// ============================================================================
// PCA (Principal Component Analysis)
// ============================================================================

export class PCA {
  private components: number[][] = [];
  private explainedVariance: number[] = [];
  private mean: number[] = [];
  private std: number[] = [];
  private nComponents: number = 0;
  
  /**
   * Standardize data
   */
  private standardize(data: number[][]): number[][] {
    if (data.length === 0) return [];
    
    const nFeatures = data[0].length;
    this.mean = new Array(nFeatures).fill(0);
    this.std = new Array(nFeatures).fill(1);
    
    // Calculate mean
    for (let j = 0; j < nFeatures; j++) {
      this.mean[j] = mean1D(data.map(row => row[j]));
    }
    
    // Calculate std
    for (let j = 0; j < nFeatures; j++) {
      const col = data.map(row => row[j]);
      this.std[j] = std1D(col) || 1;
    }
    
    // Standardize
    return data.map(row => 
      row.map((val, j) => (val - this.mean[j]) / this.std[j])
    );
  }
  
  /**
   * Calculate covariance matrix
   */
  private covarianceMatrix(data: number[][]): number[][] {
    const n = data.length;
    const nFeatures = data[0].length;
    const cov: number[][] = [];
    
    for (let i = 0; i < nFeatures; i++) {
      cov[i] = [];
      for (let j = 0; j < nFeatures; j++) {
        let sum = 0;
        for (let k = 0; k < n; k++) {
          sum += (data[k][i] - this.mean[i]) * (data[k][j] - this.mean[j]);
        }
        cov[i][j] = sum / (n - 1);
      }
    }
    
    return cov;
  }
  
  /**
   * Power iteration for dominant eigenvalue
   */
  private powerIteration(matrix: number[][], numIterations: number = 1000): { eigenvalue: number; eigenvector: number[] } {
    let vector = new Array(matrix.length).fill(0).map(() => Math.random());
    
    for (let iter = 0; iter < numIterations; iter++) {
      // Matrix-vector multiply
      const newVector = new Array(matrix.length).fill(0);
      for (let i = 0; i < matrix.length; i++) {
        for (let j = 0; j < matrix.length; j++) {
          newVector[i] += matrix[i][j] * vector[j];
        }
      }
      
      // Normalize
      const norm = Math.sqrt(newVector.reduce((s, v) => s + v * v, 0));
      vector = newVector.map(v => v / norm);
    }
    
    // Calculate eigenvalue
    const Av = new Array(matrix.length).fill(0);
    for (let i = 0; i < matrix.length; i++) {
      for (let j = 0; j < matrix.length; j++) {
        Av[i] += matrix[i][j] * vector[j];
      }
    }
    
    const eigenvalue = dotProduct(vector, Av);
    
    return { eigenvalue, eigenvector: vector };
  }
  
  /**
   * Fit PCA model
   */
  fit(data: number[][], nComponents?: number): void {
    if (data.length === 0 || data[0].length === 0) return;
    
    const standardized = this.standardize(data);
    const cov = this.covarianceMatrix(standardized);
    
    this.nComponents = nComponents || Math.min(data.length, data[0].length);
    this.components = [];
    this.explainedVariance = [];
    
    // Find principal components
    let remainingCov = cov;
    
    for (let i = 0; i < this.nComponents; i++) {
      const { eigenvalue, eigenvector } = this.powerIteration(remainingCov);
      
      this.components.push(eigenvector);
      this.explainedVariance.push(eigenvalue);
      
      // Deflate covariance matrix
      const eigMatrix = eigenvector.map(v => eigenvector.map(v2 => v * v2 * eigenvalue));
      remainingCov = matrixSubtract(remainingCov, eigMatrix);
    }
    
    // Normalize explained variance
    const total = this.explainedVariance.reduce((a, b) => a + b, 0);
    this.explainedVariance = this.explainedVariance.map(v => v / total);
  }
  
  /**
   * Transform data to principal components
   */
  transform(data: number[][]): number[][] {
    const standardized = data.map(row => 
      row.map((val, j) => (val - this.mean[j]) / this.std[j])
    );
    
    return standardized.map(row => 
      this.components.map(component => dotProduct(row, component))
    );
  }
  
  /**
   * Reduce financial metrics to principal components
   */
  reduceFinancialMetrics(
    companies: Array<{ name: string; metrics: number[] }>,
    nComponents: number = 2
  ): Array<{ name: string; pc1: number; pc2: number; variance: number[] }> {
    const data = companies.map(c => c.metrics);
    
    this.fit(data, nComponents);
    
    const transformed = this.transform(data);
    
    return companies.map((c, i) => ({
      name: c.name,
      pc1: transformed[i][0] || 0,
      pc2: transformed[i][1] || 0,
      variance: this.explainedVariance
    }));
  }
  
  getComponents(): number[][] {
    return this.components;
  }
  
  getExplainedVariance(): number[] {
    return this.explainedVariance;
  }
}

// ============================================================================
// FEATURE SELECTION & EXTRACTION
// ============================================================================

export class FeatureSelector {
  /**
   * Calculate correlation matrix
   */
  static correlationMatrix(data: number[][], featureNames: string[]): Map<string, Map<string, number>> {
    const matrix = new Map<string, Map<string, number>>();
    
    for (let i = 0; i < featureNames.length; i++) {
      matrix.set(featureNames[i], new Map());
      
      for (let j = 0; j < featureNames.length; j++) {
        const col1 = data.map(row => row[i]);
        const col2 = data.map(row => row[j]);
        
        const corr = correlationCoeff(col1, col2);
        matrix.get(featureNames[i])!.set(featureNames[j], corr);
      }
    }
    
    return matrix;
  }
  
  /**
   * Select features with low correlation to each other
   */
  static selectUncorrelatedFeatures(
    data: number[][],
    featureNames: string[],
    threshold: number = 0.7
  ): string[] {
    const corrMatrix = this.correlationMatrix(data, featureNames);
    const selected: string[] = [];
    
    for (const feature of featureNames) {
      let isCorrelated = false;
      
      for (const selectedFeature of selected) {
        const corr = Math.abs(corrMatrix.get(feature)?.get(selectedFeature) || 0);
        if (corr > threshold) {
          isCorrelated = true;
          break;
        }
      }
      
      if (!isCorrelated) {
        selected.push(feature);
      }
    }
    
    return selected;
  }
  
  /**
   * Calculate feature importance using variance
   */
  static featureImportance(data: number[][], featureNames: string[]): Array<{ feature: string; importance: number }> {
    return featureNames.map((name, idx) => {
      const col = data.map(row => row[idx]);
      const colVariance = variance(col as any) as number;
      return { feature: name, importance: colVariance };
    }).sort((a, b) => b.importance - a.importance);
  }
}

export class FeatureExtractor {
  /**
   * Create ratio features from raw financial data
   */
  static createRatioFeatures(company: {
    revenue: number;
    netIncome: number;
    ebitda: number;
    totalDebt: number;
    equity: number;
    assets: number;
    cash: number;
  }): Record<string, number> {
    return {
      profitMargin: company.netIncome / company.revenue || 0,
      ebitdaMargin: company.ebitda / company.revenue || 0,
      debtToEquity: company.totalDebt / company.equity || 0,
      debtToAssets: company.totalDebt / company.assets || 0,
      currentRatio: company.cash / company.totalDebt || 0,
      roe: company.netIncome / company.equity || 0,
      roa: company.netIncome / company.assets || 0,
      assetTurnover: company.revenue / company.assets || 0,
      equityMultiplier: company.assets / company.equity || 0,
    };
  }
  
  /**
   * Create growth features
   */
  static createGrowthFeatures(historicalData: number[]): Record<string, number> {
    if (historicalData.length < 2) {
      return { cagr: 0, volatility: 0, trend: 0 };
    }
    
    // CAGR
    const start = historicalData[0];
    const end = historicalData[historicalData.length - 1];
    const years = historicalData.length - 1;
    const cagr = Math.pow(end / start, 1 / years) - 1;
    
    // Volatility (standard deviation of returns)
    const returns: number[] = [];
    for (let i = 1; i < historicalData.length; i++) {
      returns.push((historicalData[i] - historicalData[i - 1]) / historicalData[i - 1]);
    }
    const volatility = std1D(returns);
    
    // Trend (linear regression slope)
    const lr = new LinearRegressionFit();
    lr.fit(historicalData.map((v, i) => [i, v]));
    
    return {
      cagr,
      volatility,
      trend: lr.getSlope(),
      momentum: returns.length > 0 ? returns[returns.length - 1] : 0
    };
  }
}

// ============================================================================
// LINEAR REGRESSION (Simple - for feature extraction)
// ============================================================================

export class LinearRegressionFit {
  private slope: number = 0;
  private intercept: number = 0;
  private trained: boolean = false;
  
  fit(data: number[][]): void {
    if (data.length < 2) return;
    
    const x = data.map(d => d[0]);
    const y = data.map(d => d[1]);
    
    const xMean = mean1D(x);
    const yMean = mean1D(y);
    
    let numerator = 0;
    let denominator = 0;
    
    for (let i = 0; i < data.length; i++) {
      numerator += (x[i] - xMean) * (y[i] - yMean);
      denominator += (x[i] - xMean) ** 2;
    }
    
    this.slope = denominator !== 0 ? numerator / denominator : 0;
    this.intercept = yMean - this.slope * xMean;
    this.trained = true;
  }
  
  predict(x: number): number {
    return this.slope * x + this.intercept;
  }
  
  getSlope(): number {
    return this.slope;
  }
  
  getIntercept(): number {
    return this.intercept;
  }
}

// ============================================================================
// EXPORT ALL
// ============================================================================

export default {
  KMeansClustering,
  HierarchicalClustering,
  MeanShiftClustering,
  DBSCAN,
  NaiveBayesClassifier,
  NeuralNetwork,
  PCA,
  FeatureSelector,
  FeatureExtractor,
  LinearRegressionFit
};
