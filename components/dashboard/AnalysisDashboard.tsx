'use client'

import { useState } from 'react'
import { Sidebar } from './Sidebar'
import { OverviewTab } from './tabs/OverviewTab'
import { CompetitorsTab } from './tabs/CompetitorsTab'
import { StrategiesTab } from './tabs/StrategiesTab'
import InvestorsTab from './tabs/InvestorsTab'
import { getResolvedData } from '@/lib/industry-database'
import { useMemo } from 'react'

// eslint-disable-next-line @typescript-eslint/no-explicit-any
interface AnalysisDashboardProps {
  analysis: Record<string, any>
}

export function AnalysisDashboard({ analysis }: AnalysisDashboardProps) {
  const [activeTab, setActiveTab] = useState('dashboard')

  const industryData = useMemo(() =>
    getResolvedData(analysis.industryName || analysis.industry),
    [analysis.industryName, analysis.industry]
  )

  return (
    <div className="flex min-h-screen bg-background text-foreground font-sans">

      {/* Sidebar Navigation */}
      <Sidebar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        industryName={analysis.industry}
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
            {activeTab === 'investors' && <InvestorsTab data={industryData} searchQuery={analysis.query || analysis.industry} />}
          </div>
        </div>
      </main>
    </div>
  )
}
