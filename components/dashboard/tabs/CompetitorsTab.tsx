'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import type { AnalysisResponse } from '@/types/analysis'

interface CompetitorsTabProps {
  analysis: AnalysisResponse | Record<string, unknown>
}

export function CompetitorsTab({ analysis }: CompetitorsTabProps) {
  // Get real competitors from pipeline response
  const competitors = (analysis as any)?.analysis?.competitors 
    || (analysis as any)?.competitors 
    || []
  
  const entityName = (analysis as any)?.entity?.name 
    || (analysis as any)?.entityName 
    || "Unknown"
  
  const industry = (analysis as any)?.entity?.industry 
    || (analysis as any)?.industry 
    || "Unknown"

  // No data state - show honest empty state instead of hardcoded data
  if (!competitors || competitors.length === 0) {
    return (
      <div className="p-8 text-center">
        <h2 className="text-xl font-bold mb-4">Competitors in {industry}</h2>
        <div className="p-8 border border-dashed rounded-lg text-gray-400">
          <p className="text-lg font-medium">No competitor data found for {entityName}</p>
          <p className="text-sm mt-2 text-gray-500">
            Industry: {industry}
          </p>
          <p className="text-sm mt-4 text-gray-500">
            Try searching with more detail, e.g. "Bharat Petroleum BPCL"
          </p>
          <p className="text-xs mt-6 text-gray-400">
            Competitors are extracted from web search results and analyst reports
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="p-4">
      <h2 className="text-xl font-bold mb-4">
        Competitors in {industry}
      </h2>
      <div className="space-y-3">
        {competitors.map((name: string, i: number) => (
          <div key={i} className="flex items-center p-4 border rounded-lg hover:bg-gray-50">
            <span className="text-gray-400 w-8 font-mono">#{i + 1}</span>
            <span className="font-medium flex-1">{name}</span>
            <Badge variant="outline" className="text-xs">
              From analysis
            </Badge>
          </div>
        ))}
      </div>
      <p className="text-xs text-gray-400 mt-4">
        {competitors.length} competitors identified from search and data sources
      </p>
    </div>
  )
}
