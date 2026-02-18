import { NextResponse } from 'next/server';

const metrics: Record<string, number> = {
  collector_crawl_success_total: 0,
  collector_crawl_fail_total: 0,
  collector_pdf_success_total: 0,
  collector_pdf_fail_total: 0,
  consensus_build_total: 0,
  consensus_confidence_sum: 0,
  ai_analysis_total: 0,
  ai_hallucination_count: 0,
  api_key_failures_total: 0,
  source_disabled_total: 0,
  cache_hits_total: 0,
  cache_misses_total: 0,
};

export function incrementMetric(name: string, value: number = 1): void {
  if (metrics[name] !== undefined) {
    metrics[name] += value;
  }
}

export function setMetric(name: string, value: number): void {
  metrics[name] = value;
}

export function getMetrics(): Record<string, number> {
  return { ...metrics };
}

export async function GET() {
  const output = Object.entries(metrics)
    .map(([key, value]) => `# HELP ebita_${key} EBITA platform metric\n# TYPE ebita_${key} counter\nebita_${key} ${value}`)
    .join('\n');

  return new NextResponse(output, {
    headers: {
      'Content-Type': 'text/plain; charset=utf-8',
    },
  });
}
