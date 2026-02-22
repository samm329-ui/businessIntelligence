'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { PremiumSearchBar, type SearchParams } from '@/components/dashboard/PremiumSearchBar'
import { ArrowRight, Zap, Cpu, Leaf, Activity, Globe, Bitcoin, TrendingUp, Shield, Settings } from 'lucide-react'

export default function Home() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)

  const handleSearch = async (params: SearchParams) => {
    setLoading(true)
    const searchQuery = params.query
    router.push(`/analyze/${encodeURIComponent(searchQuery)}`)
  }

  return (
    <div className="min-h-screen relative overflow-hidden font-sans" style={{ background: '#0B0F14' }}>

      {/* Subtle Matte Texture Overlay (Handled in globals.css, but ensuring clean div here) */}
      <div className="absolute inset-0 pointer-events-none opacity-[0.03]"
        style={{ backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.65' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E")` }} />

      {/* TOP NAV - Executive Minimalist */}
      <nav className="relative z-20 flex items-center justify-between px-10 py-8">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full flex items-center justify-center font-bold text-lg bg-transparent border border-gold/40"
            style={{ color: 'var(--color-gold)', boxShadow: 'inset 0 0 10px rgba(230, 181, 102, 0.1)' }}>
            N
          </div>
          <div>
            <p className="text-xs font-bold uppercase tracking-widest text-[#F3F4F6]">NAT Platform</p>
            <p className="text-[10px] uppercase tracking-[0.3em] text-gray-500">Intelligence Engine</p>
          </div>
        </div>

        <div className="flex items-center gap-6">
          <button className="text-[10px] font-bold uppercase tracking-widest text-gray-400 hover:text-gold transition-colors">Documentation</button>
          <button className="text-[10px] font-bold uppercase tracking-widest text-gray-400 hover:text-gold transition-colors">API Access</button>
          <div className="w-[1px] h-4 bg-white/10 mx-2" />
          <div className="w-10 h-10 rounded-lg flex items-center justify-center cursor-pointer border border-white/5 hover:border-gold/30 transition-all bg-white/2">
            <Settings className="h-4 w-4 text-gray-500 hover:text-gold transition-colors" />
          </div>
        </div>
      </nav>

      {/* HERO SECTION - Executive Command Center */}
      <section className="relative z-10 pt-16 pb-20 px-4">
        <div className="container mx-auto text-center max-w-5xl">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-gold/20 bg-gold/5 mb-8 animate-fade-up">
            <div className="w-1.5 h-1.5 rounded-full bg-gold animate-pulse" />
            <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-gold">Verified Investor Intelligence</span>
          </div>

          <h1 className="text-6xl md:text-7xl lg:text-[100px] font-bold mb-8 leading-[0.9] animate-fade-up tracking-tighter"
            style={{ fontFamily: 'Manrope, Inter, sans-serif', color: '#F3F4F6' }}>
            Drive Strategy with<br /><span className="text-gradient-gold">Precision Data</span>
          </h1>

          <p className="text-lg md:text-xl mb-16 max-w-2xl mx-auto leading-relaxed text-gray-400 animate-fade-up"
            style={{ animationDelay: '0.1s' }}>
            The definitive workspace for institutional grade market analysis, competitive intelligence, and strategic financial foresight.
          </p>

          {/* Search Card Refined */}
          <div className="max-w-4xl mx-auto animate-fade-up" style={{ animationDelay: '0.2s' }}>
            <PremiumSearchBar onSearch={handleSearch} loading={loading} />
          </div>
        </div>
      </section>

      {/* EXPLORE SECTION - Corporate Columns */}
      <section className="relative z-10 py-12 container mx-auto px-4">
        <div className="flex flex-col md:flex-row items-end justify-between mb-16 max-w-6xl mx-auto px-4">
          <div className="text-left">
            <p className="text-[10px] font-bold uppercase tracking-[0.3em] text-gold mb-3">Market Scopes</p>
            <h2 className="text-4xl font-bold tracking-tight"
              style={{ fontFamily: 'Manrope, Inter, sans-serif', color: '#F3F4F6' }}>
              Explore Major Industries
            </h2>
          </div>
          <p className="text-gray-500 text-sm max-w-xs text-right opacity-80 border-l border-white/10 pl-6 mt-4 md:mt-0">
            Real-time benchmarking and sentiment analysis across 40+ global market segments.
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-6 max-w-6xl mx-auto">
          <IndustryCard
            title="Finance & Fintech"
            icon={<Activity className="w-4 h-4" />}
            items={[
              { name: 'Goldman Sachs', metric: '₹548cr', positive: true },
              { name: 'JPMorgan', metric: '+1,92cr', positive: true },
              { name: 'HDFC Bank', metric: '-341cr', positive: false },
            ]}
          />
          <IndustryCard
            title="Enterprise SaaS"
            icon={<Cpu className="w-4 h-4" />}
            items={[
              { name: 'Salesforce', metric: '₹924cr', positive: true },
              { name: 'Freshworks', metric: '+499cr', positive: true },
              { name: 'Zoho Corp', metric: '+997cr', positive: true },
            ]}
          />
          <IndustryCard
            title="Energy & EV"
            icon={<Leaf className="w-4 h-4" />}
            items={[
              { name: 'TATA Motors', metric: '+825cr', positive: true },
              { name: 'Reliance Industries', metric: '+327cr', positive: true },
              { name: 'Adani Green', metric: '-1.5%', positive: false },
            ]}
          />
        </div>
      </section>

      {/* TRENDING SECTION - Financials Grid */}
      <section className="relative z-10 py-24 container mx-auto px-4 max-w-6xl">
        <div className="flex items-center justify-between mb-12">
          <h2 className="text-3xl font-bold tracking-tight"
            style={{ fontFamily: 'Manrope, Inter, sans-serif', color: '#F3F4F6' }}>
            Trending Growth Sectors
          </h2>
          <button className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest text-gold hover:opacity-80 transition-all">
            See All Metrics <ArrowRight className="h-3 w-3" />
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          <TrendingCard title="Electric Vehicles" value="₹ 3,344cr" metric="+9.9%" icon={<Zap className="w-3.5 h-3.5" />} color="var(--color-teal)" />
          <TrendingCard title="Deep Tech AI" value="₹ 7,944cr" metric="+12.7%" icon={<Cpu className="w-3.5 h-3.5" />} color="var(--color-gold)" />
          <TrendingCard title="Green Hydrogen" value="₹ 9,254cr" metric="+9.9%" icon={<Leaf className="w-3.5 h-3.5" />} color="var(--color-teal)" />
          <TrendingCard title="Cloud Infra" value="₹ 7,254cr" metric="+6.0%" icon={<Cpu className="w-3.5 h-3.5" />} color="var(--color-teal)" />
          <TrendingCard title="Blockchain" value="₹ 1,898cr" metric="+1.0%" icon={<Bitcoin className="w-3.5 h-3.5" />} color="var(--color-amber)" />
          <TrendingCard title="Biotech" value="₹ 25.75cr" metric="+3.3%" icon={<Shield className="w-3.5 h-3.5" />} color="var(--color-gold)" />
          <TrendingCard title="Payments" value="₹ 1,176cr" metric="+11.0%" icon={<Activity className="w-3.5 h-3.5" />} color="var(--color-gold)" />
          <TrendingCard title="Aerospace" value="₹ 1.58cr" metric="+5.5%" icon={<Globe className="w-3.5 h-3.5" />} color="var(--color-teal)" />
        </div>
      </section>

      {/* FOOTER - Minimal Executive */}
      <footer className="relative z-10 py-16 px-10 flex flex-col md:flex-row items-center justify-between gap-10 border-t border-white/5 bg-black/20">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm border border-white/10 text-gray-500">N</div>
          <div>
            <p className="text-[10px] font-bold uppercase tracking-widest text-[#F3F4F6]">NAT Intelligence</p>
            <p className="text-[9px] uppercase tracking-[0.2em] text-gray-600">Decision Support Systems</p>
          </div>
        </div>

      </footer>
    </div>
  )
}

// Industry card component - Executive list style
function IndustryCard({
  title, icon, items
}: {
  title: string
  icon: React.ReactNode
  items: { name: string; metric: string; positive: boolean }[]
}) {
  return (
    <div className="premium-card p-6 flex flex-col h-full bg-mid/30">
      <div className="flex items-center gap-3 mb-8">
        <div className="p-2.5 rounded-lg bg-white/5 border border-white/10 text-gold shadow-inner">
          {icon}
        </div>
        <h3 className="font-bold text-lg tracking-tight text-[#F3F4F6]">{title}</h3>
      </div>

      <div className="space-y-5 flex-1">
        {items.map((item, i) => (
          <div key={i} className="flex items-center justify-between group/item cursor-pointer border-b border-white/[0.03] pb-2 last:border-0">
            <span className="text-sm font-medium text-gray-400 group-hover/item:text-gold transition-colors">
              {item.name}
            </span>
            <div className="flex items-center gap-2">
              <span className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded ${item.positive ? 'text-teal bg-teal/5' : 'text-red-400 bg-red-400/5'}`}>
                {item.metric}
              </span>
            </div>
          </div>
        ))}
      </div>

      <div className="mt-8 pt-4 border-t border-white/5">
        <div className="flex items-center justify-between">
          <span className="text-[10px] font-bold uppercase tracking-widest text-gray-600">Performance</span>
          <div className="h-4 w-24 opacity-20">
            <svg viewBox="0 0 100 20" className="w-full h-full">
              <path d="M0,15 Q25,5 50,12 T100,8" fill="none"
                stroke="var(--color-gold)" strokeWidth="2" />
            </svg>
          </div>
        </div>
      </div>
    </div>
  )
}

// Trending card component - Professional Metric style
function TrendingCard({ title, value, metric, icon, color }: {
  title: string; value: string; metric: string; icon: React.ReactNode; color: string
}) {
  return (
    <div className="premium-card p-6 group cursor-pointer bg-mid/40">
      <div className="flex items-start justify-between mb-6">
        <div className="p-2 rounded-lg bg-white/5 border border-white/10 text-gray-500 group-hover:text-gold transition-colors">
          {icon}
        </div>
        <div className="h-6 w-16 opacity-20">
          <svg viewBox="0 0 40 12" className="w-full h-full">
            <path d="M0,8 Q10,2 20,6 T40,2" fill="none" stroke={color} strokeWidth="1.5" />
          </svg>
        </div>
      </div>

      <div>
        <p className="text-[10px] uppercase tracking-[0.2em] font-bold mb-2 text-gray-500">{title}</p>
        <div className="flex items-baseline justify-between gap-2">
          <p className="text-2xl font-bold tracking-tight text-[#F3F4F6]">{value}</p>
          <p className="text-xs font-bold" style={{ color: color }}>{metric}</p>
        </div>
      </div>
    </div>
  )
}
