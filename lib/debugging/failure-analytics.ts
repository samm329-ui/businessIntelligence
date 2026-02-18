import * as fs from 'fs';
import * as path from 'path';

interface FailureEvent {
  timestamp: string;
  category: 'api' | 'crawl' | 'ai' | 'entity_resolution' | 'pdf' | 'consensus';
  source: string;
  error: string;
  input?: string;
  durationMs?: number;
  recovered: boolean;
}

interface SuccessEvent {
  timestamp: string;
  category: 'api' | 'crawl' | 'ai' | 'entity_resolution' | 'pdf' | 'consensus';
  source: string;
  input?: string;
  durationMs?: number;
}

interface AnalyticsSnapshot {
  period: string;
  totalRequests: number;
  failures: number;
  successes: number;
  failureRate: number;
  byCategory: Record<string, { total: number; failures: number; rate: number }>;
  recentFailures: FailureEvent[];
  avgResponseTimeMs: Record<string, number>;
}

const ANALYTICS_DIR = path.join(process.cwd(), 'data', 'analytics');
const FAILURES_FILE = path.join(ANALYTICS_DIR, 'failures.jsonl');
const SUCCESSES_FILE = path.join(ANALYTICS_DIR, 'successes.jsonl');
const DISABLED_SOURCES_FILE = path.join(ANALYTICS_DIR, 'disabled-sources.json');
const FAILURE_THRESHOLD = 0.4; // 40% failure rate threshold

function ensureDir(): void {
  if (!fs.existsSync(ANALYTICS_DIR)) {
    fs.mkdirSync(ANALYTICS_DIR, { recursive: true });
  }
}

function appendToFile(filePath: string, data: any): void {
  ensureDir();
  fs.appendFileSync(filePath, JSON.stringify(data) + '\n');
}

function readLines(filePath: string, limit: number = 1000): any[] {
  if (!fs.existsSync(filePath)) return [];
  try {
    const lines = fs.readFileSync(filePath, 'utf-8').trim().split('\n');
    return lines.slice(-limit).map(line => {
      try { return JSON.parse(line); } catch { return null; }
    }).filter(Boolean);
  } catch {
    return [];
  }
}

export function trackFailure(
  category: FailureEvent['category'],
  source: string,
  error: string,
  opts?: { input?: string; durationMs?: number; recovered?: boolean }
): void {
  const event: FailureEvent = {
    timestamp: new Date().toISOString(),
    category,
    source,
    error: error.substring(0, 500),
    input: opts?.input,
    durationMs: opts?.durationMs,
    recovered: opts?.recovered ?? false,
  };
  appendToFile(FAILURES_FILE, event);
  console.warn(`[Analytics] FAILURE: ${category}/${source} - ${error.substring(0, 100)}`);
}

export function trackSuccess(
  category: SuccessEvent['category'],
  source: string,
  opts?: { input?: string; durationMs?: number }
): void {
  const event: SuccessEvent = {
    timestamp: new Date().toISOString(),
    category,
    source,
    input: opts?.input,
    durationMs: opts?.durationMs,
  };
  appendToFile(SUCCESSES_FILE, event);
}

export function getAnalyticsSnapshot(hoursBack: number = 24): AnalyticsSnapshot {
  const cutoff = new Date(Date.now() - hoursBack * 60 * 60 * 1000);

  const allFailures = readLines(FAILURES_FILE).filter(
    (e: FailureEvent) => new Date(e.timestamp) >= cutoff
  );
  const allSuccesses = readLines(SUCCESSES_FILE).filter(
    (e: SuccessEvent) => new Date(e.timestamp) >= cutoff
  );

  const totalRequests = allFailures.length + allSuccesses.length;
  const failureRate = totalRequests > 0 ? allFailures.length / totalRequests : 0;

  const categories = new Set([
    ...allFailures.map((e: FailureEvent) => e.category),
    ...allSuccesses.map((e: SuccessEvent) => e.category),
  ]);

  const byCategory: Record<string, { total: number; failures: number; rate: number }> = {};
  for (const cat of categories) {
    const catFailures = allFailures.filter((e: FailureEvent) => e.category === cat).length;
    const catSuccesses = allSuccesses.filter((e: SuccessEvent) => e.category === cat).length;
    const catTotal = catFailures + catSuccesses;
    byCategory[cat] = {
      total: catTotal,
      failures: catFailures,
      rate: catTotal > 0 ? catFailures / catTotal : 0,
    };
  }

  const avgResponseTimeMs: Record<string, number> = {};
  for (const cat of categories) {
    const times = [
      ...allSuccesses.filter((e: SuccessEvent) => e.category === cat && e.durationMs).map((e: SuccessEvent) => e.durationMs!),
      ...allFailures.filter((e: FailureEvent) => e.category === cat && e.durationMs).map((e: FailureEvent) => e.durationMs!),
    ];
    if (times.length > 0) {
      avgResponseTimeMs[cat] = Math.round(times.reduce((a, b) => a + b, 0) / times.length);
    }
  }

  return {
    period: `${hoursBack}h`,
    totalRequests,
    failures: allFailures.length,
    successes: allSuccesses.length,
    failureRate: Math.round(failureRate * 1000) / 10,
    byCategory,
    recentFailures: allFailures.slice(-10),
    avgResponseTimeMs,
  };
}

export function getFailureReport(): string {
  const snapshot = getAnalyticsSnapshot(24);

  let report = `\nFailure Analytics Report (Last 24h)\n`;
  report += `${'='.repeat(50)}\n`;
  report += `Total Requests: ${snapshot.totalRequests}\n`;
  report += `Failures: ${snapshot.failures} (${snapshot.failureRate}%)\n`;
  report += `Successes: ${snapshot.successes}\n\n`;

  report += `By Category:\n`;
  for (const [cat, stats] of Object.entries(snapshot.byCategory)) {
    report += `  ${cat}: ${stats.failures}/${stats.total} failures (${Math.round(stats.rate * 100)}%)`;
    if (snapshot.avgResponseTimeMs[cat]) {
      report += ` | avg: ${snapshot.avgResponseTimeMs[cat]}ms`;
    }
    report += `\n`;
  }

  if (snapshot.recentFailures.length > 0) {
    report += `\nRecent Failures:\n`;
    for (const f of snapshot.recentFailures.slice(-5)) {
      report += `  [${f.timestamp}] ${f.category}/${f.source}: ${f.error.substring(0, 80)}\n`;
    }
  }

  return report;
}

export interface SourceFailureStats {
  source: string;
  category: string;
  total: number;
  failures: number;
  successes: number;
  failureRate: number;
  disabled: boolean;
}

function getDisabledSources(): Record<string, boolean> {
  try {
    if (fs.existsSync(DISABLED_SOURCES_FILE)) {
      return JSON.parse(fs.readFileSync(DISABLED_SOURCES_FILE, 'utf-8'));
    }
  } catch {}
  return {};
}

function saveDisabledSources(disabled: Record<string, boolean>): void {
  ensureDir();
  fs.writeFileSync(DISABLED_SOURCES_FILE, JSON.stringify(disabled, null, 2));
}

export function getSourceFailureStats(hoursBack: number = 168): SourceFailureStats[] {
  const cutoff = new Date(Date.now() - hoursBack * 60 * 60 * 1000);
  
  const allFailures = readLines(FAILURES_FILE).filter(
    (e: FailureEvent) => new Date(e.timestamp) >= cutoff
  );
  const allSuccesses = readLines(SUCCESSES_FILE).filter(
    (e: SuccessEvent) => new Date(e.timestamp) >= cutoff
  );
  
  const disabledSources = getDisabledSources();
  const sourceMap = new Map<string, { failures: number; successes: number; category: string }>();
  
  for (const f of allFailures) {
    const key = `${f.category}:${f.source}`;
    const existing = sourceMap.get(key) || { failures: 0, successes: 0, category: f.category };
    existing.failures++;
    sourceMap.set(key, existing);
  }
  
  for (const s of allSuccesses) {
    const key = `${s.category}:${s.source}`;
    const existing = sourceMap.get(key) || { failures: 0, successes: 0, category: s.category };
    existing.successes++;
    sourceMap.set(key, existing);
  }
  
  const stats: SourceFailureStats[] = [];
  for (const [key, data] of sourceMap) {
    const [category, source] = key.split(':');
    const total = data.failures + data.successes;
    const failureRate = total > 0 ? data.failures / total : 0;
    stats.push({
      source,
      category,
      total,
      failures: data.failures,
      successes: data.successes,
      failureRate,
      disabled: disabledSources[key] || false,
    });
  }
  
  return stats.sort((a, b) => b.failureRate - a.failureRate);
}

export function checkAndDisableFailingSources(): { disabled: string[]; enabled: string[] } {
  const stats = getSourceFailureStats(168); // Last 7 days
  const disabledSources = getDisabledSources();
  const toDisable: string[] = [];
  const toEnable: string[] = [];
  
  for (const stat of stats) {
    const key = `${stat.category}:${stat.source}`;
    const shouldBeDisabled = stat.failureRate > FAILURE_THRESHOLD && stat.total >= 5;
    
    if (shouldBeDisabled && !disabledSources[key]) {
      disabledSources[key] = true;
      toDisable.push(key);
    } else if (!shouldBeDisabled && disabledSources[key]) {
      delete disabledSources[key];
      toEnable.push(key);
    }
  }
  
  if (toDisable.length > 0 || toEnable.length > 0) {
    saveDisabledSources(disabledSources);
    console.log(`[FailureAnalytics] Auto-disabled sources: ${toDisable.join(', ')}`);
    console.log(`[FailureAnalytics] Re-enabled sources: ${toEnable.join(', ')}`);
  }
  
  return { disabled: toDisable, enabled: toEnable };
}

export function isSourceEnabled(category: string, source: string): boolean {
  const disabled = getDisabledSources();
  return !disabled[`${category}:${source}`];
}

// FIX 6: Adaptive Weighting - adjust weights based on failure rate
export function getAdaptiveWeight(baseWeight: number, source: string, category: string = 'api'): number {
  const stats = getSourceFailureStats(168); // Last 7 days
  const key = `${category}:${source}`;
  
  const stat = stats.find(s => `${s.category}:${s.source}` === key);
  
  if (!stat || stat.total < 3) {
    return baseWeight; // Not enough data, use base weight
  }
  
  // Adjust weight based on failure rate
  // 30% failure -> weight reduced by 30%
  // 60% failure -> weight reduced by 60%
  const adjustedWeight = baseWeight * (1 - stat.failureRate);
  
  console.log(`[FailureAnalytics] Adaptive weight for ${key}: ${baseWeight} -> ${adjustedWeight.toFixed(2)} (failure rate: ${(stat.failureRate * 100).toFixed(1)}%)`);
  
  return Math.max(adjustedWeight, baseWeight * 0.1); // Never reduce below 10%
}

// FIX 7: Explicit Uncertainty Output
export interface UncertaintyReport {
  confidence: number;
  level: 'high' | 'medium' | 'low' | 'very_low';
  reasons: string[];
  dataGaps: string[];
  sourceConcerns: string[];
  recommendation: string;
}

export function generateUncertaintyReport(consensus: any): UncertaintyReport {
  const reasons: string[] = [];
  const dataGaps: string[] = [];
  const sourceConcerns: string[] = [];
  
  const confidence = consensus.overallConfidence || 0;
  const sourceCount = consensus.sourcesUsed?.length || 0;
  
  // Analyze sources
  if (sourceCount < 2) {
    sourceConcerns.push(`Only ${sourceCount} source(s) - insufficient for reliable consensus`);
  }
  
  // Check for official filings
  const hasOfficialFiling = consensus.sourcesUsed?.some((s: string) => 
    s.includes('nse') || s.includes('bse') || s.includes('sec')
  );
  if (!hasOfficialFiling) {
    sourceConcerns.push('No official exchange filings found');
  }
  
  // Check data freshness
  const fetchedAt = consensus.fetchedAt ? new Date(consensus.fetchedAt) : null;
  if (fetchedAt) {
    const ageInMonths = (Date.now() - fetchedAt.getTime()) / (1000 * 60 * 60 * 24 * 30);
    if (ageInMonths > 6) {
      dataGaps.push(`Data age: ${ageInMonths.toFixed(1)} months (recommended < 6 months)`);
    }
  }
  
  // Check data completeness
  const dataGapsList = consensus.dataGaps || [];
  if (dataGapsList.length > 5) {
    dataGaps.push(`${dataGapsList.length} metrics unavailable`);
  }
  
  // Build reasons
  if (confidence >= 70 && sourceCount >= 2 && hasOfficialFiling) {
    reasons.push('Multiple reliable financial sources');
    if (hasOfficialFiling) reasons.push('Official exchange filings present');
  } else if (confidence >= 50) {
    reasons.push('Moderate confidence - more sources recommended');
  } else {
    reasons.push('Low confidence - analysis may be unreliable');
  }
  
  // Determine level
  let level: UncertaintyReport['level'];
  if (confidence >= 70) level = 'high';
  else if (confidence >= 50) level = 'medium';
  else if (confidence >= 30) level = 'low';
  else level = 'very_low';
  
  // Recommendation
  let recommendation: string;
  if (level === 'high') {
    recommendation = 'Analysis can proceed with normal confidence';
  } else if (level === 'medium') {
    recommendation = 'Verify key metrics with additional sources before making decisions';
  } else {
    recommendation = 'Do not rely on this analysis - collect more reliable data first';
  }
  
  return {
    confidence,
    level,
    reasons,
    dataGaps,
    sourceConcerns,
    recommendation,
  };
}
