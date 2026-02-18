import { getMetrics } from '@/lib/monitoring/metrics';

export async function GET() {
  const metrics = getMetrics();
  
  const output = Object.entries(metrics)
    .map(([key, value]) => `# HELP ebita_${key} EBITA platform metric\n# TYPE ebita_${key} counter\nebita_${key} ${value}`)
    .join('\n');

  return new Response(output, {
    headers: {
      'Content-Type': 'text/plain; charset=utf-8',
    },
  });
}
