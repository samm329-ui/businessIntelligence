'use client'

import type { AnalysisResponse } from '@/types/analysis'
import { Users, AlertCircle } from 'lucide-react'

interface InvestorsTabProps {
  analysis: AnalysisResponse | Record<string, unknown>
}

export default function InvestorsTab({ analysis }: InvestorsTabProps) {
  // Get real investor data from pipeline response
  const investors = (analysis as any)?.analysis?.investorHighlights 
    || (analysis as any)?.investorHighlights 
    || []
  
  const entityName = (analysis as any)?.entity?.name 
    || (analysis as any)?.entityName 
    || "this company"

  return (
    <div className="p-4">
      <h2 className="text-xl font-bold mb-4">
        Investor Information — {entityName}
      </h2>

      {investors.length === 0 ? (
        <div className="p-8 text-center border border-dashed rounded-lg text-gray-400">
          <Users className="h-12 w-12 mx-auto mb-4 text-gray-300" />
          <p className="text-lg">Shareholder data not available</p>
          <p className="text-sm mt-2 text-gray-500 max-w-md mx-auto">
            For listed Indian companies, shareholding data is fetched from NSE/BSE.
            This company may be unlisted or the data fetch failed.
          </p>
          <div className="mt-4 flex items-center justify-center gap-2 text-xs text-gray-400">
            <AlertCircle className="h-4 w-4" />
            <span>Try searching with the company ticker symbol (e.g., "RELIANCE")</span>
          </div>
        </div>
      ) : (
        <div className="space-y-3">
          {investors.map((highlight: string, i: number) => (
            <div key={i} className="p-4 border rounded-lg hover:bg-gray-50">
              <p className="text-sm">{highlight}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
