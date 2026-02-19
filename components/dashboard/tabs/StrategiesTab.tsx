'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Lightbulb, TrendingUp, ShieldCheck, AlertTriangle } from 'lucide-react'
import type { AnalysisResponse } from '@/types/analysis'

interface StrategiesTabProps {
  analysis: AnalysisResponse | Record<string, unknown>
}

export function StrategiesTab({ analysis }: StrategiesTabProps) {
  // Get real data from pipeline response
  const recommendations = (analysis as any)?.analysis?.strategicRecommendations 
    || (analysis as any)?.strategicRecommendations 
    || []
  
  const opportunities = (analysis as any)?.analysis?.opportunities 
    || (analysis as any)?.opportunities 
    || []
  
  const risks = (analysis as any)?.analysis?.risks 
    || (analysis as any)?.risks 
    || []
  
  const entityName = (analysis as any)?.entity?.name 
    || (analysis as any)?.entityName 
    || "this company"

  const hasAnyData = recommendations.length > 0 || opportunities.length > 0 || risks.length > 0

  // No data state - show honest empty state
  if (!hasAnyData) {
    return (
      <div className="p-8 text-center">
        <h2 className="text-xl font-bold mb-4">Strategic Analysis</h2>
        <div className="p-8 border border-dashed rounded-lg text-gray-400">
          <p className="text-lg">No strategic analysis available for {entityName}</p>
          <p className="text-sm mt-2 text-gray-500">
            Confidence was too low to generate recommendations.
          </p>
          <p className="text-sm mt-4 text-gray-500">
            Try searching with the company ticker symbol for better results.
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="p-4 space-y-6">
      <h2 className="text-xl font-bold mb-4">Strategic Analysis for {entityName}</h2>
      
      {recommendations.length > 0 && (
        <section>
          <h3 className="font-bold text-lg mb-3 flex items-center gap-2">
            <Lightbulb className="h-5 w-5 text-blue-500" />
            Strategic Recommendations
          </h3>
          <div className="space-y-3">
            {recommendations.map((r: string, i: number) => (
              <div key={i} className="p-4 border-l-4 border-blue-500 bg-blue-50 rounded-r">
                <p className="text-sm">{r}</p>
              </div>
            ))}
          </div>
        </section>
      )}
      
      {opportunities.length > 0 && (
        <section>
          <h3 className="font-bold text-lg mb-3 flex items-center gap-2">
            <TrendingUp className="h-5 w-5 text-green-500" />
            Growth Opportunities
          </h3>
          <div className="space-y-3">
            {opportunities.map((o: string, i: number) => (
              <div key={i} className="p-4 bg-green-50 border border-green-200 rounded">
                <p className="text-sm">{o}</p>
              </div>
            ))}
          </div>
        </section>
      )}
      
      {risks.length > 0 && (
        <section>
          <h3 className="font-bold text-lg mb-3 flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-red-500" />
            Key Risks
          </h3>
          <div className="space-y-3">
            {risks.map((r: string, i: number) => (
              <div key={i} className="p-4 bg-red-50 border border-red-200 rounded">
                <p className="text-sm">{r}</p>
              </div>
            ))}
          </div>
        </section>
      )}
    </div>
  )
}
