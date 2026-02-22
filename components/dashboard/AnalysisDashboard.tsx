'use client'

import { useState, useMemo, lazy, Suspense } from 'react'
import { Sidebar } from './Sidebar'
import Silk from '@/components/Silk'
import { getResolvedData } from '@/lib/industry-database'
import type { AnalysisResponse } from '@/types/analysis'

// Lazy load tabs for better performance
const OverviewTab = lazy(() => import('./tabs/OverviewTab').then(m => ({ default: m.OverviewTab })))
const CompetitorsTab = lazy(() => import('./tabs/CompetitorsTab').then(m => ({ default: m.CompetitorsTab })))
const StrategiesTab = lazy(() => import('./tabs/StrategiesTab').then(m => ({ default: m.StrategiesTab })))
const StakeholdersTab = lazy(() => import('./tabs/StakeholdersTab').then(m => ({ default: m.StakeholdersTab })))

interface AnalysisDashboardProps {
  analysis: AnalysisResponse | Record<string, unknown>
}

export function AnalysisDashboard({ analysis }: AnalysisDashboardProps) {
  const [activeTab, setActiveTab] = useState('dashboard')
  const [showDebug, setShowDebug] = useState(false)

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

  const isDev = process.env.NODE_ENV === 'development'

  return (
    <div className="flex min-h-screen relative" style={{ background: '#050B14', fontFamily: 'Inter, Manrope, sans-serif' }}>
      {/* Silk Background */}
      <div className="fixed inset-0 z-0 pointer-events-none overflow-hidden">
        <Silk
          speed={7}
          scale={0.7}
          color="#412907"
          noiseIntensity={0}
          rotation={0}
        />
      </div>

      {/* Subtle overlay to dampen the color if needed, ensuring text readability */}
      <div className="fixed inset-0 z-[1] bg-black/40 pointer-events-none" />

      {/* Dev Debug Panel */}
      {isDev && (
        <div className="fixed bottom-4 right-4 z-50">
          <button
            onClick={() => setShowDebug(!showDebug)}
            className="px-3 py-1 rounded-lg text-sm font-mono text-black"
            style={{ background: '#FFD28E' }}
          >
            {showDebug ? 'Hide Debug' : 'Debug'}
          </button>
          {showDebug && (
            <div className="absolute bottom-10 right-0 w-[500px] max-h-[400px] overflow-auto rounded-xl font-mono text-xs p-4"
              style={{ background: '#0D1825', border: '2px solid #FFD28E', color: '#26E07A' }}>
              <div className="flex justify-between items-center mb-2">
                <span style={{ color: '#FFD28E', fontWeight: 700 }}>Raw API Response (Dev Only)</span>
                <button onClick={() => setShowDebug(false)} style={{ color: '#9DB3BD' }}>✕</button>
              </div>
              <pre className="whitespace-pre-wrap">{JSON.stringify(analysis, null, 2)}</pre>
            </div>
          )}
        </div>
      )}

      {/* Sidebar */}
      <Sidebar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        industryName={entityName}
        analysis={analysis}
      />


      {/* Main Content */}
      <main className="flex-1 lg:ml-72 relative z-10">
        <div className="container mx-auto px-4 py-8 lg:px-8 lg:py-10 max-w-[1500px]">
          {/* Mobile header spacer */}
          <div className="h-12 lg:h-0" />

          {/* Tab Content */}
          <div className="min-h-[80vh]">
            <Suspense fallback={
              <div className="flex items-center justify-center min-h-[40vh]">
                <div className="flex flex-col items-center gap-4">
                  <div className="w-10 h-10 border-4 border-gold/20 border-t-gold rounded-full animate-spin" />
                  <p className="text-[10px] font-bold uppercase tracking-[0.3em] text-gold/60 animate-pulse">
                    Synchronizing Intelligence...
                  </p>
                </div>
              </div>
            }>
              {activeTab === 'dashboard' && <OverviewTab analysis={analysis} />}
              {activeTab === 'market' && <CompetitorsTab analysis={analysis} />}
              {activeTab === 'strategies' && <StrategiesTab analysis={analysis} />}
              {activeTab === 'stakeholders' && <StakeholdersTab analysis={analysis} />}
            </Suspense>
          </div>
        </div>
      </main>
    </div>
  )
}
