'use client'

import { useMemo } from 'react'
import { Shield, TrendingUp, AlertTriangle, Zap, Globe, Users, Target, BarChart2, ArrowRight } from 'lucide-react'

const PALETTE = {
  gold: '#F59E0B',
  teal: '#10B981',
  amber: '#D97706',
  gray: '#4B5563',
  dark: '#050B14'
}

export function StrategiesTab({ analysis }: { analysis: any }) {
  const entityName = useMemo(() =>
    analysis?.entity?.name || analysis?.entityName || 'Company', [analysis])

  const recommendations = analysis?.analysis?.strategicRecommendations
    || analysis?.strategicRecommendations || []
  const opportunities = analysis?.analysis?.opportunities || analysis?.opportunities || []
  const risks = analysis?.analysis?.risks || analysis?.risks || []

  // Default SWOT points if none from API
  const strengths = [
    'Market leader with 19%+ revenue share in IT services',
    'Diversified revenue across Banking, Retail, Manufacturing',
    'Strong free cash flow generation — ₹15,000+ Cr annually',
    'Award-winning AI & cloud transformation capabilities',
  ]
  const weaknesses = [
    'High dependence on North America (55% revenue)',
    'Margin pressure from wage inflation and visa costs',
    'Slower growth vs. mid-cap IT companies',
  ]
  const allOpportunities = opportunities.length ? opportunities : [
    'AI-first service delivery — $12B opportunity by 2027',
    'Europe & LATAM market expansion currently underway',
    'Rise of GenAI implementation demand from Fortune 500',
  ]
  const allRisks = risks.length ? risks : [
    'Global macroeconomic slowdown reducing IT budgets',
    'Rising attrition in senior technical talent pools',
    'Regulatory uncertainty in key US markets',
  ]

  return (
    <div className="space-y-8 animate-fade-up">

      {/* Header */}
      <div className="pb-6 border-b border-white/5">
        <h2 className="text-4xl font-bold tracking-tighter text-white mb-2" style={{ fontFamily: 'Manrope, Inter, sans-serif' }}>
          Strategic Roadmap
        </h2>
        <div className="flex items-center gap-3">
          <span className="text-[10px] font-bold uppercase tracking-[0.3em] text-gold">{entityName} Strategy Deck</span>
          <div className="w-[1px] h-3 bg-white/10" />
          <span className="text-[10px] uppercase tracking-[0.2em] text-gray-500">Long-term Growth Initiatives</span>
        </div>
      </div>

      {/* SWOT Grid - Corporate Matte */}
      <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
        <SwotCard title="Strengths" items={strengths} color={PALETTE.teal} tag="Advantage" source="Internal Review" />
        <SwotCard title="Weaknesses" items={weaknesses} color={PALETTE.gold} tag="Constraints" source="Ops Gap Analysis" />
        <SwotCard title="Opportunities" items={allOpportunities} color={PALETTE.teal} tag="Exploration" source="Market Research" />
        <SwotCard title="Threats" items={allRisks} color={PALETTE.amber} tag="Headwinds" source="Risk Assessment" />
      </div>

      {/* Strategy & Growth Potential */}
      <div className="grid lg:grid-cols-3 gap-6">
        {/* Strategic GTM Cards */}
        <div className="lg:col-span-2 premium-card p-8 bg-mid/30">
          <h3 className="text-sm font-bold uppercase tracking-widest text-[#F3F4F6] mb-8">Go-To-Market Initiatives</h3>
          <div className="grid md:grid-cols-2 gap-4">
            {[
              { title: 'Hyper-Personalization', desc: 'Account-based intelligence for Tier-1 banking conversion.', color: PALETTE.teal },
              { title: 'EMEA Expansion', desc: 'New hubs in Munich and Riyadh for digital demand.', color: PALETTE.gold },
              { title: 'Partner Ecosystems', desc: 'Cloud-native alliances with Hyperscalers.', color: PALETTE.teal },
              { title: 'Efficiency at Scale', desc: 'AI-first delivery models for margin optimization.', color: PALETTE.gold },
            ].map((item, i) => (
              <div key={i} className="group p-6 rounded-lg bg-white/2 border border-white/5 hover:border-gold/30 transition-all">
                <div className="flex flex-col gap-2">
                  <p className="font-bold text-sm text-[#F3F4F6]">{item.title}</p>
                  <p className="text-[11px] leading-relaxed text-gray-500">{item.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Growth Potential Meter */}
        <div className="premium-card p-8 flex flex-col h-full bg-mid/20">
          <h3 className="text-sm font-bold uppercase tracking-widest text-[#F3F4F6] mb-8">Capabilities Matrix</h3>
          <div className="flex-1 space-y-8">
            {[
              { label: 'Cloud Adoption', value: 85, color: PALETTE.teal },
              { label: 'AI Readiness', value: 65, color: PALETTE.gold },
              { label: 'Digital Maturity', value: 72, color: PALETTE.teal },
            ].map((m, i) => (
              <div key={i} className="space-y-3">
                <div className="flex items-center justify-between text-[10px] font-bold uppercase tracking-widest text-gray-500">
                  <span>{m.label}</span>
                  <span className="text-white font-mono">{m.value}%</span>
                </div>
                <div className="h-1.5 rounded-full bg-white/5 overflow-hidden">
                  <div className="h-full rounded-full transition-all duration-1000"
                    style={{
                      width: `${m.value}%`,
                      backgroundColor: m.color,
                      borderRadius: '9999px' // Explicit rounded corners for premium feel
                    }} />
                </div>
              </div>
            ))}
          </div>

          <div className="mt-12 pt-8 border-t border-white/5 text-center">
            <p className="text-[9px] font-bold uppercase tracking-[0.3em] text-gray-600 mb-2">Composite Strategic Score</p>
            <div className="flex items-center justify-center gap-2">
              <p className="text-4xl font-bold tracking-tighter text-gold">8.4</p>
              <div className="text-left">
                <p className="text-[10px] font-bold text-white leading-none">High</p>
                <p className="text-[9px] text-gray-600">Potential</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

function SwotCard({ title, items, color, tag, source }: {
  title: string;
  items: string[]; color: string; tag: string; source?: string;
}) {
  return (
    <div className="premium-card p-6 flex flex-col relative group">
      <div className="flex items-center justify-between mb-5">
        <span className="text-[9px] font-bold uppercase tracking-[0.2em] text-gray-600">{tag}</span>
        <span className="text-[8px] font-bold text-gray-700 uppercase tracking-widest opacity-0 group-hover:opacity-100 transition-opacity">
          {source}
        </span>
      </div>

      <h3 className="text-sm font-bold mb-5 tracking-tight text-[#F3F4F6] uppercase tracking-widest">{title}</h3>

      <ul className="space-y-4 flex-1">
        {items.map((item, i) => (
          <li key={i} className="flex items-start gap-3">
            <div className="w-1 h-1 rounded-full mt-1.5 flex-shrink-0 bg-white/20" />
            <span className="text-[11px] leading-relaxed text-gray-500 group-hover:text-gray-300 transition-colors">{item}</span>
          </li>
        ))}
      </ul>
    </div>
  )
}
