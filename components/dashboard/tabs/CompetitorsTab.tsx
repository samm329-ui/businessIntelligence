'use client'

import { useMemo } from 'react'
import {
  AreaChart, Area, BarChart, Bar, LineChart, Line,
  XAxis, YAxis, ResponsiveContainer, Tooltip
} from 'recharts'
import { TrendingUp, Target, Shield, Zap, AlertTriangle } from 'lucide-react'

const PALETTE = {
  gold: '#F59E0B',
  teal: '#10B981',
  amber: '#D97706',
  gray: '#4B5563',
  dark: '#050B14'
}

const PEER_BENCHMARKS = [
  { company: 'TCS', marketCap: '$133B', roe: '51%', pe: '27.4x', ev: '22.1x', div: '1.8%', color: PALETTE.teal },
  { company: 'Infosys', marketCap: '$82B', roe: '30%', pe: '23.5x', ev: '18.4x', div: '2.3%', color: PALETTE.gold },
  { company: 'Wipro', marketCap: '$28B', roe: '15%', pe: '19.2x', ev: '14.9x', div: '0.4%', color: PALETTE.gray },
  { company: 'HCLTech', marketCap: '$47B', roe: '25%', pe: '21.7x', ev: '15.5x', div: '3.1%', color: PALETTE.teal },
  { company: 'Tech M', marketCap: '$10B', roe: '12%', pe: '17.1x', ev: '11.2x', div: '1.2%', color: PALETTE.amber },
]

const QUARTERLY_DATA = [
  { quarter: 'Q4 FY25', tcs: 60028, infy: 38994, wipro: 22284, hcl: 28057 },
  { quarter: 'Q3 FY26', tcs: 63000, infy: 40925, wipro: 22500, hcl: 29500 },
]

function CustomTooltip({ active, payload, label }: any) {
  if (!active || !payload?.length) return null
  return (
    <div className="bg-[#0B0F14] border border-white/10 rounded-lg p-3 shadow-2xl">
      <p className="text-[10px] text-gray-500 uppercase tracking-widest mb-2">{label}</p>
      {payload.map((p: any, i: number) => (
        <div key={i} className="flex items-center gap-4 justify-between mb-1 last:mb-0">
          <span className="text-[11px] font-bold" style={{ color: p.color || PALETTE.teal }}>{p.name}</span>
          <span className="text-[11px] font-mono text-white">{p.value.toLocaleString()}</span>
        </div>
      ))}
    </div>
  )
}

export function CompetitorsTab({ analysis }: { analysis: any }) {
  const entityName = useMemo(() =>
    analysis?.entity?.name || analysis?.entityName || 'Company', [analysis])

  return (
    <div className="space-y-8 animate-fade-up">

      {/* Header */}
      <div className="pb-6 border-b border-white/5">
        <h2 className="text-4xl font-bold tracking-tighter text-white mb-2" style={{ fontFamily: 'Manrope, Inter, sans-serif' }}>
          Peer Benchmarking
        </h2>
        <div className="flex items-center gap-3">
          <span className="text-[10px] font-bold uppercase tracking-[0.3em] text-gold">{entityName} Benchmarking Pool</span>
          <div className="w-[1px] h-3 bg-white/10" />
          <span className="text-[10px] uppercase tracking-[0.2em] text-gray-500">Industry Performance Index</span>
        </div>
      </div>

      {/* Competitor Overview Table */}
      <div className="premium-card overflow-hidden bg-mid/20">
        <div className="p-6 border-b border-white/5 flex items-center justify-between">
          <h3 className="text-sm font-bold uppercase tracking-widest text-[#F3F4F6]">Performance Comparison</h3>
          <span className="text-[8px] font-bold text-gray-500 uppercase tracking-widest opacity-60">Source: Industry Benchmarks</span>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-white/2">
                <th className="px-8 py-4 text-[10px] font-bold uppercase tracking-[0.2em] text-gray-500">Entity</th>
                <th className="px-6 py-4 text-[10px] font-bold uppercase tracking-[0.2em] text-gray-500 text-right">Market Cap</th>
                <th className="px-6 py-4 text-[10px] font-bold uppercase tracking-[0.2em] text-gray-500 text-right">ROE %</th>
                <th className="px-6 py-4 text-[10px] font-bold uppercase tracking-[0.2em] text-gray-500 text-right">P/E Ratio</th>
                <th className="px-6 py-4 text-[10px] font-bold uppercase tracking-[0.2em] text-gray-500 text-right">EV/EBITDA</th>
                <th className="px-8 py-4 text-[10px] font-bold uppercase tracking-[0.2em] text-gray-500 text-center">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/[0.03]">
              {PEER_BENCHMARKS.map((row, i) => {
                const isLeader = i === 0
                return (
                  <tr key={i} className="hover:bg-white/[0.02] transition-colors group">
                    <td className="px-8 py-5">
                      <div className="flex items-center gap-4">
                        <div className="w-8 h-8 rounded-lg bg-white/5 border border-white/10 flex items-center justify-center font-bold text-[10px] text-gray-400">
                          {row.company.substring(0, 2)}
                        </div>
                        <span className="font-bold text-sm text-[#F3F4F6]">{row.company}</span>
                      </div>
                    </td>
                    <td className="px-6 py-5 text-right font-mono text-xs font-bold text-teal">{row.marketCap}</td>
                    <td className="px-6 py-5 text-right font-mono text-xs font-bold text-gold">{row.roe}</td>
                    <td className="px-6 py-5 text-right font-mono text-xs text-gray-500">{row.pe}</td>
                    <td className="px-6 py-5 text-right font-mono text-xs text-gray-500">{row.ev}</td>
                    <td className="px-8 py-5 flex justify-center">
                      <span className={`px-3 py-1 rounded-[2px] text-[9px] font-bold tracking-[0.1em] border ${isLeader ? 'bg-teal/10 text-teal border-teal/20' : 'bg-white/5 text-gray-500 border-white/5'}`}>
                        {isLeader ? 'LEADER' : 'PEER'}
                      </span>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Comparison Grid */}
      <div className="grid lg:grid-cols-2 gap-6">
        {/* Growth & Volume Bars */}
        <div className="premium-card p-8 bg-mid/30">
          <h3 className="text-sm font-bold uppercase tracking-widest text-[#F3F4F6] mb-8">Growth Index YoY</h3>
          <div className="space-y-6">
            {[
              { name: 'TCS Limited', growth: 10.5, color: PALETTE.teal },
              { name: 'Infosys Corp', growth: 7.8, color: PALETTE.gold },
              { name: 'Wipro AI', growth: 4.2, color: PALETTE.amber },
              { name: 'HCL Tech', growth: 8.1, color: PALETTE.teal },
              { name: 'Tech Mahindra', growth: 5.6, color: PALETTE.gray },
            ].map((item, i) => (
              <div key={i} className="space-y-2">
                <div className="flex items-center justify-between text-[10px] font-bold uppercase tracking-wider text-gray-500">
                  <span>{item.name}</span>
                  <span className="font-mono text-white">{item.growth}%</span>
                </div>
                <div className="h-1.5 rounded-full bg-white/5 overflow-hidden">
                  <div className="h-full rounded-full transition-all duration-1000"
                    style={{ width: `${(item.growth / 12) * 100}%`, backgroundColor: item.color }} />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Quarterly Comparison Chart */}
        <div className="premium-card p-8 bg-mid/30">
          <h3 className="text-sm font-bold uppercase tracking-widest text-[#F3F4F6] mb-8">Quarterly Volume (Cr)</h3>
          <ResponsiveContainer width="100%" height={260}>
            <BarChart data={QUARTERLY_DATA} barGap={4}>
              <XAxis dataKey="quarter" tick={{ fill: '#4B5563', fontSize: 10, fontWeight: 700 }} axisLine={false} tickLine={false} />
              <YAxis hide />
              <Tooltip content={<CustomTooltip />} />
              <Bar dataKey="tcs" name="TCS" fill={PALETTE.teal} radius={[4, 4, 0, 0]} />
              <Bar dataKey="infy" name="Infosys" fill={PALETTE.gold} radius={[4, 4, 0, 0]} />
              <Bar dataKey="wipro" name="Wipro" fill={PALETTE.gray} radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* SWOT Section (Image 3 Inspiration) */}
      <div className="grid md:grid-cols-4 gap-4">
        <SwotCard title="Strengths" items={['Brand Equity', 'Market Share', 'R&D Edge']} color={PALETTE.teal} bg="bg-teal/5" />
        <SwotCard title="Weaknesses" items={['High Attrition', 'Debt Ratio', 'Margin Dip']} color={PALETTE.gold} bg="bg-gold/5" />
        <SwotCard title="Opportunities" items={['AI Integration', 'Cloud Shift', 'Global M&A']} color={PALETTE.teal} bg="bg-teal/5" />
        <SwotCard title="Threats" items={['Reg. Changes', 'Competitor M&A', 'FX Volatility']} color={PALETTE.amber} bg="bg-amber/5" />
      </div>
    </div>
  )
}

function SwotCard({ title, items, color, bg }: any) {
  return (
    <div className={`premium-card p-6 ${bg} border-white/5`}>
      <div className="flex items-center gap-3 mb-5">
        <h4 className="text-[10px] font-bold uppercase tracking-[0.3em] text-white">{title}</h4>
      </div>
      <ul className="space-y-3">
        {items.map((item: string, i: number) => (
          <li key={i} className="flex items-center gap-2">
            <div className="w-1 h-1 rounded-full bg-white/10" />
            <span className="text-[11px] font-bold text-gray-500">{item}</span>
          </li>
        ))}
      </ul>
    </div>
  )
}
