'use client'

import { useState, useMemo } from 'react'
import { Sidebar } from './Sidebar'
import { OverviewTab } from './tabs/OverviewTab'
import { CompetitorsTab } from './tabs/CompetitorsTab'
import { StrategiesTab } from './tabs/StrategiesTab'
import InvestorsTab from './tabs/InvestorsTab'
import { getResolvedData } from '@/lib/industry-database'
import type { AnalysisResponse } from '@/types/analysis'

interface AnalysisDashboardProps {
  analysis: AnalysisResponse | Record<string, unknown>
}

export function AnalysisDashboard({ analysis }: AnalysisDashboardProps) {
  const [activeTab, setActiveTab] = useState('dashboard')
  const [showDebug, setShowDebug] = useState(false)

  // Extract entity info with fallback for typed/legacy field names
  const entityName = useMemo(() => {
    return (analysis as any).entity?.name 
      || (analysis as any).entityName 
      || (analysis as any).query 
      || 'Unknown'
  }, [analysis])

  const industry = useMemo(() => {
    return (analysis as any).entity?.industry 
      || (analysis as any).industry 
      || (analysis as any).industryName 
      || 'Unknown'
  }, [analysis])

  const industryData = useMemo(() =>
    getResolvedData(industry),
    [industry]
  )

  // Get confidence score with fallback
  const confidence = useMemo(() => {
    return (analysis as any).data?.confidence 
      || (analysis as any).analysis?.confidence 
      || (analysis as any).confidence 
      || (analysis as any).metadata?.dataConfidenceScore 
      || 0
  }, [analysis])

  // Check if in development mode
  const isDev = process.env.NODE_ENV === 'development'

  return (
    <div className="flex min-h-screen bg-background text-foreground font-sans">

      {/* Debug Panel - Only in Development */}
      {isDev && (
        <div className="fixed bottom-4 right-4 z-50">
          <button
            onClick={() => setShowDebug(!showDebug)}
            className="bg-yellow-500 hover:bg-yellow-600 text-black px-3 py-1 rounded text-sm font-mono"
          >
            {showDebug ? 'Hide Debug' : 'Debug'}
          </button>
          
          {showDebug && (
            <div className="absolute bottom-10 right-0 w-[500px] max-h-[400px] overflow-auto bg-gray-900 text-green-400 p-4 rounded-lg font-mono text-xs border-2 border-yellow-500">
              <div className="flex justify-between items-center mb-2">
                <span className="text-yellow-400 font-bold">Raw API Response (Dev Only)</span>
                <button 
                  onClick={() => setShowDebug(false)}
                  className="text-gray-400 hover:text-white"
                >
                  ✕
                </button>
              </div>
              <pre className="whitespace-pre-wrap">
                {JSON.stringify(analysis, null, 2)}
              </pre>
            </div>
          )}
        </div>
      )}

      {/* Sidebar Navigation */}
      <Sidebar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        industryName={industry}
        analysis={analysis}
      />

      {/* Main Content Area */}
      <main className="flex-1 lg:ml-64 transition-all duration-300">
        <div className="container mx-auto px-4 py-8 lg:px-8 lg:py-10 max-w-[1600px]">

          {/* Header Area (Optional, can be used for breadcrumbs or actions) */}
          <header className="mb-8 flex items-center justify-between lg:hidden">
            {/* Mobile spacing/header if needed, usually handled by Sidebar's mobile toggle */}
          </header>

          {/* Dynamic Content */}
          <div className="min-h-[80vh]">
            {activeTab === 'dashboard' && <OverviewTab analysis={analysis} />}
            {activeTab === 'market' && <CompetitorsTab analysis={analysis} />}
            {activeTab === 'strategies' && <StrategiesTab analysis={analysis} />}
            {activeTab === 'investors' && <InvestorsTab analysis={analysis} />}
          </div>
        </div>
      </main>
    </div>
  )
}
