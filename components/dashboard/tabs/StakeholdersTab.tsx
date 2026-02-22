'use client'

import { useMemo } from 'react'
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts'
import { Globe, MapPin, Building2, UserCheck, ShieldCheck } from 'lucide-react'
import RotatingEarth from '@/components/wireframe-dotted-globe'

const PALETTE = {
  gold: '#F59E0B',
  teal: '#10B981',
  amber: '#D97706',
  gray: '#4B5563',
  dark: '#050B14'
}

const SHAREHOLDING = [
  { name: 'Promoters', value: 71.77, color: PALETTE.teal },
  { name: 'FII / FPI', value: 12.43, color: PALETTE.gold },
  { name: 'DII', value: 7.38, color: PALETTE.gray },
  { name: 'Public', value: 5.63, color: PALETTE.teal + '80' },
  { name: 'Other', value: 2.79, color: PALETTE.gold + '80' },
]

const STAKEHOLDER_TABLE = [
  { company: 'Life Insurance Corp.', holding: '8.67%', role: 'Anchor Partner', status: 'Increased', color: PALETTE.teal },
  { company: 'SBI Mutual Fund', holding: '3.24%', role: 'Institutional', status: 'Maintained', color: PALETTE.gold },
  { company: 'HDFC Mutual Fund', holding: '2.89%', role: 'Institutional', status: 'Maintained', color: PALETTE.teal },
  { company: 'Nippon India MF', holding: '1.47%', role: 'Strategic', status: 'Maintained', color: PALETTE.gray },
  { company: 'Axis Mutual Fund', holding: '1.12%', role: 'High Growth', status: 'Increased', color: PALETTE.gold },
]

function CustomTooltip({ active, payload }: any) {
  if (!active || !payload?.length) return null
  return (
    <div className="bg-[#0B0F14] border border-white/10 rounded-lg p-3 shadow-2xl">
      <div className="flex items-center gap-3">
        <div className="w-2 h-2 rounded-full" style={{ backgroundColor: payload[0].payload.color }} />
        <p className="text-[11px] font-bold text-white uppercase tracking-widest">{payload[0].name}</p>
      </div>
      <p className="text-[14px] font-mono text-white mt-1">{payload[0].value}%</p>
    </div>
  )
}

export function StakeholdersTab({ analysis }: { analysis: any }) {
  const entityName = useMemo(() =>
    analysis?.entity?.name || analysis?.entityName || 'Company', [analysis])

  const IT_HUB_MARKERS = useMemo(() => [
    { lat: 12.9716, lng: 77.5946, label: 'Bangalore HQ', color: PALETTE.teal },
    { lat: 19.0760, lng: 72.8777, label: 'Mumbai Hub', color: PALETTE.gold },
    { lat: 40.7128, lng: -74.0060, label: 'New York', color: PALETTE.teal },
    { lat: 51.5074, lng: -0.1276, label: 'London', color: PALETTE.gold },
    { lat: 37.7749, lng: -122.4194, label: 'San Francisco', color: PALETTE.teal },
    { lat: 48.1351, lng: 11.5820, label: 'Munich', color: PALETTE.gray },
    { lat: 1.3521, lng: 103.8198, label: 'Singapore', color: PALETTE.gold },
  ], [])

  return (
    <div className="space-y-8 animate-fade-up">

      {/* Header */}
      <div className="pb-6 border-b border-white/5">
        <h2 className="text-4xl font-bold tracking-tighter text-white mb-2" style={{ fontFamily: 'Manrope, Inter, sans-serif' }}>
          Stakeholder Intelligence
        </h2>
        <div className="flex items-center gap-3">
          <span className="text-[10px] font-bold uppercase tracking-[0.3em] text-gold">{entityName} Ownership Context</span>
          <div className="w-[1px] h-3 bg-white/10" />
          <span className="text-[10px] uppercase tracking-[0.2em] text-gray-500">Global Governance & Capital Structure</span>
        </div>
      </div>

      {/* Main Row: Donut + World Map */}
      <div className="grid lg:grid-cols-5 gap-6">

        {/* Shareholding Donut - Image 5 style */}
        <div className="lg:col-span-2 premium-card p-8 flex flex-col items-center bg-mid/20">
          <div className="self-start mb-8 text-left">
            <h3 className="text-sm font-bold uppercase tracking-widest text-[#F3F4F6]">Equity Pattern</h3>
            <p className="text-[10px] text-gray-500 uppercase tracking-wider mt-1">Capital Distribution • <span className="text-[8px] opacity-60">Source: Shareholding Filings</span></p>
          </div>

          <div className="relative mb-8">
            <ResponsiveContainer width={240} height={240}>
              <PieChart>
                <Pie
                  data={SHAREHOLDING}
                  cx="50%" cy="50%"
                  innerRadius={80}
                  outerRadius={105}
                  paddingAngle={2}
                  dataKey="value"
                  stroke="none"
                >
                  {SHAREHOLDING.map((entry, i) => (
                    <Cell key={i} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip content={<CustomTooltip />} />
              </PieChart>
            </ResponsiveContainer>
            <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
              <span className="text-[9px] font-bold text-gray-500 uppercase tracking-[0.3em]">Promoters</span>
              <span className="text-4xl font-bold text-white tracking-tighter">71.77%</span>
            </div>
          </div>

          <div className="w-full space-y-4 pt-4 border-t border-white/5">
            {SHAREHOLDING.slice(0, 3).map((item, i) => (
              <div key={i} className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: item.color }} />
                  <span className="text-[11px] font-bold text-gray-400 uppercase tracking-widest">{item.name}</span>
                </div>
                <span className="font-mono text-[11px] font-bold text-white">{item.value}%</span>
              </div>
            ))}
          </div>
        </div>

        {/* Global Presence Map - Rotating Globe */}
        <div className="lg:col-span-3 premium-card p-8 relative overflow-hidden flex flex-col bg-mid/30">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h3 className="text-sm font-bold uppercase tracking-widest text-[#F3F4F6]">Operational Footprint</h3>
              <p className="text-[10px] text-gray-500 uppercase tracking-wider mt-1">Strategic Global Nodes • <span className="text-[8px] opacity-60">Source: Corporate Registry</span></p>
            </div>
            <div className="flex items-center gap-4 px-4 py-1.5 bg-black/20 rounded-lg border border-white/5">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-teal" />
                <span className="text-[9px] font-bold uppercase tracking-widest text-gray-500">HQ</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-gold" />
                <span className="text-[9px] font-bold uppercase tracking-widest text-gray-500">Hub</span>
              </div>
            </div>
          </div>

          <div className="flex-1 relative flex items-center justify-center min-h-[400px]">
            <RotatingEarth
              width={500}
              height={400}
              markers={IT_HUB_MARKERS}
              className="w-full h-full"
            />
          </div>

          <div className="mt-8 grid grid-cols-3 gap-8">
            <div className="space-y-1">
              <p className="text-[9px] font-bold uppercase tracking-widest text-gray-600">Total Offices</p>
              <p className="text-2xl font-bold text-white">1,450+</p>
            </div>
            <div className="space-y-1">
              <p className="text-[9px] font-bold uppercase tracking-widest text-gray-600">Cloud Regions</p>
              <p className="text-2xl font-bold text-teal">42</p>
            </div>
            <div className="space-y-1">
              <p className="text-[9px] font-bold uppercase tracking-widest text-gray-600">Headcount</p>
              <p className="text-2xl font-bold text-gold">225K</p>
            </div>
          </div>
        </div>
      </div>

      {/* Institutional Table */}
      <div className="premium-card overflow-hidden bg-mid/20">
        <div className="p-8 border-b border-white/5 flex items-center justify-between">
          <h3 className="text-sm font-bold uppercase tracking-widest text-[#F3F4F6]">Institutional Holdings</h3>
          <span className="text-[8px] font-bold text-gray-500 uppercase tracking-widest opacity-60">Source: Exchange Data</span>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-white/2">
                <th className="px-8 py-4 text-[10px] font-bold uppercase tracking-[0.2em] text-gray-500">Entity</th>
                <th className="px-6 py-4 text-[10px] font-bold uppercase tracking-[0.2em] text-gray-500 text-right">Holding %</th>
                <th className="px-6 py-4 text-[10px] font-bold uppercase tracking-[0.2em] text-gray-500 text-right">Alignment</th>
                <th className="px-8 py-4 text-[10px] font-bold uppercase tracking-[0.2em] text-gray-500 text-center">Inflow Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/[0.03]">
              {STAKEHOLDER_TABLE.map((row, i) => (
                <tr key={i} className="hover:bg-white/[0.02] transition-colors group">
                  <td className="px-8 py-5">
                    <div className="flex items-center gap-4">
                      <div className="w-9 h-9 rounded-lg bg-white/5 border border-white/10 flex items-center justify-center font-bold text-[11px] text-gray-400">
                        {row.company.charAt(0)}
                      </div>
                      <span className="font-bold text-sm text-[#F3F4F6]">{row.company}</span>
                    </div>
                  </td>
                  <td className="px-6 py-5 text-right font-mono text-xs font-bold text-teal">{row.holding}</td>
                  <td className="px-6 py-5 text-right text-[11px] font-bold text-gray-500 uppercase tracking-widest">{row.role}</td>
                  <td className="px-8 py-5 flex justify-center">
                    <span className={`px-3 py-1 rounded-[2px] text-[9px] font-bold tracking-[0.1em] border ${row.status === 'Increased' ? 'bg-teal/10 text-teal border-teal/20' : 'bg-white/5 text-gray-500 border-white/5'}`}>
                      {row.status.toUpperCase()}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
