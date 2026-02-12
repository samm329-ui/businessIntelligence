// components/charts/CompetitorHeatmap.tsx
'use client'

import { useMemo } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Competitor } from '@/lib/services/competitor-intelligence'

interface HeatmapProps {
  competitors: Competitor[]
  metrics?: string[]
}

const DEFAULT_METRICS = [
  'marketCap',
  'growthRate',
  'ebitdaMargin',
  'roe',
  'debtToEquity',
  'currentRatio',
  'peRatio',
  'beta'
]

const METRIC_LABELS: Record<string, string> = {
  marketCap: 'Market Cap',
  growthRate: 'Growth',
  ebitdaMargin: 'EBITDA %',
  roe: 'ROE %',
  debtToEquity: 'D/E',
  currentRatio: 'Current',
  peRatio: 'P/E',
  beta: 'Beta'
}

export function CompetitorHeatmap({ competitors, metrics = DEFAULT_METRICS }: HeatmapProps) {
  const heatmapData = useMemo(() => {
    return generateHeatmap(competitors, metrics)
  }, [competitors, metrics])

  const formatValue = (value: number, metric: string): string => {
    if (metric === 'marketCap') {
      return `$${(value / 1000).toFixed(1)}B`
    }
    if (['ebitdaMargin', 'roe', 'growthRate'].includes(metric)) {
      return `${value.toFixed(1)}%`
    }
    if (['debtToEquity', 'currentRatio', 'beta'].includes(metric)) {
      return value.toFixed(2)
    }
    return value.toFixed(1)
  }

  return (
    <Card className="glass-card">
      <CardHeader>
        <CardTitle className="text-base font-medium">Competitor Heatmap</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          <div className="min-w-[800px]">
            {/* Header Row */}
            <div className="flex border-b border-white/10">
              <div className="w-32 p-2 text-xs font-medium text-muted-foreground">Company</div>
              {metrics.map(metric => (
                <div
                  key={metric}
                  className="flex-1 p-2 text-xs font-medium text-muted-foreground text-center"
                >
                  {METRIC_LABELS[metric] || metric}
                </div>
              ))}
            </div>

            {/* Data Rows */}
            {heatmapData.map(({ company, metrics: companyMetrics }) => (
              <div key={company} className="flex border-b border-white/5 last:border-0">
                <div className="w-32 p-2 text-xs font-medium truncate">
                  {company}
                </div>
                {metrics.map(metric => {
                  const cell = companyMetrics[metric]
                  return (
                    <div
                      key={metric}
                      className="flex-1 p-2 text-center text-xs font-mono transition-all"
                      style={{
                        backgroundColor: cell?.color || 'transparent',
                        color: cell && cell.normalizedScore > 50 ? 'white' : 'inherit'
                      }}
                      title={`${METRIC_LABELS[metric]}: ${formatValue(cell?.value || 0, metric)}`}
                    >
                      {formatValue(cell?.value || 0, metric)}
                    </div>
                  )
                })}
              </div>
            ))}

            {/* Legend */}
            <div className="flex items-center gap-4 mt-4 pt-4 border-t border-white/10">
              <span className="text-xs text-muted-foreground">Scale:</span>
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 rounded" style={{ backgroundColor: '#ef4444' }} />
                <span className="text-xs">Low</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 rounded" style={{ backgroundColor: '#f97316' }} />
                <span className="text-xs">Below Avg</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 rounded" style={{ backgroundColor: '#eab308' }} />
                <span className="text-xs">Avg</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 rounded" style={{ backgroundColor: '#22c55e' }} />
                <span className="text-xs">High</span>
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

function generateHeatmap(
  competitors: Competitor[],
  metrics: string[]
): Array<{
  company: string
  metrics: Record<string, { value: number; normalizedScore: number; color: string }>
}> {
  return competitors.map(company => {
    const metricData: Record<string, { value: number; normalizedScore: number; color: string }> = {}

    metrics.forEach(metric => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const value = ((company as Record<string, any>)[metric] as number) || 0
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const allValues = competitors.map(c => ((c as Record<string, any>)[metric] as number) || 0).filter(v => v !== 0)

      if (allValues.length === 0) {
        metricData[metric] = { value, normalizedScore: 50, color: 'transparent' }
        return
      }

      const min = Math.min(...allValues)
      const max = Math.max(...allValues)
      const range = max - min || 1

      // For some metrics, lower is better
      const lowerIsBetter = ['debtToEquity', 'beta'].includes(metric)
      let normalizedScore = ((value - min) / range) * 100
      if (lowerIsBetter) {
        normalizedScore = 100 - normalizedScore
      }

      metricData[metric] = {
        value,
        normalizedScore,
        color: getHeatColor(normalizedScore)
      }
    })

    return {
      company: company.name,
      metrics: metricData
    }
  })
}

function getHeatColor(score: number): string {
  // Score is 0-100, where 100 is best
  if (score >= 75) return '#22c55e' // Green
  if (score >= 50) return '#eab308' // Yellow
  if (score >= 25) return '#f97316' // Orange
  return '#ef4444' // Red
}

export default CompetitorHeatmap
