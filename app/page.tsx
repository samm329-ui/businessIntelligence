'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { StructuredSearchBar, type SearchParams } from '@/components/dashboard/StructuredSearchBar'
import { BarChart3, TrendingUp, Shield, Zap, Layers, ArrowRight, Activity, Globe, Cpu, Leaf, Bitcoin } from 'lucide-react'

export default function Home() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)

  const handleSearch = async (params: SearchParams) => {
    setLoading(true)
    console.log('[Search] Starting search with params:', params)
    
    // Use the query as the main search term for the existing analyze page
    // Build the query - include type, industry, country for N.A.T. context
    let searchQuery = params.query
    if (params.industry) searchQuery += ` in ${params.industry}`
    if (params.country) searchQuery += ` ${params.country}`
    
    // Navigate to existing analyze page (path-based for backward compatibility)
    router.push(`/analyze/${encodeURIComponent(searchQuery)}`)
  }

  return (
    <div className="min-h-screen bg-background relative overflow-hidden font-sans selection:bg-primary/30">

      {/* Background Ambience */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[1000px] h-[600px] bg-primary/10 blur-[120px] rounded-full mix-blend-screen opacity-20" />
        <div className="absolute bottom-0 right-0 w-[800px] h-[600px] bg-secondary/5 blur-[100px] rounded-full mix-blend-screen opacity-10" />
        <div className="absolute inset-0 bg-[url('/noise.png')] opacity-[0.03] mix-blend-overlay" />
      </div>

      {/* Hero Section */}
      <section className="relative pt-32 pb-20 px-4">
        <div className="container mx-auto text-center max-w-5xl">

          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full glass border-primary/20 mb-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-primary"></span>
            </span>
            <span className="text-xs font-medium text-primary tracking-wide uppercase">Live Market Intelligence</span>
          </div>

          <h1 className="text-5xl md:text-7xl font-bold mb-6 font-heading tracking-tight leading-tight animate-in fade-in slide-in-from-bottom-6 duration-700 delay-100">
            Make <span className="text-gradient-gold">Smarter Business</span> Decisions
          </h1>

          <p className="text-lg md:text-xl text-muted-foreground mb-12 max-w-2xl mx-auto leading-relaxed animate-in fade-in slide-in-from-bottom-8 duration-700 delay-200">
            Backed by real market intelligence. Access accurate, real-time business data and insights to drive your strategy forward with confidence.
          </p>

          <div className="animate-in fade-in slide-in-from-bottom-10 duration-700 delay-300">
            <StructuredSearchBar onSearch={handleSearch} loading={loading} />
          </div>
        </div>
      </section>

      {/* Industries & Categories */}
      <section className="py-20 container mx-auto px-4 relative z-10">
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-4xl font-bold mb-4 font-heading">Explore All Industries & Categories</h2>
          <div className="h-1 w-24 bg-gradient-to-r from-transparent via-primary to-transparent mx-auto opacity-50" />
          <p className="mt-4 text-muted-foreground">Browse verified industries, companies, and market insights.</p>
        </div>

        <div className="grid md:grid-cols-3 gap-6">
          <IndustryCard
            title="Market Overview"
            icon={<Activity className="w-5 h-5 text-emerald-400" />}
            companies={[
              { name: "Goldman Sachs", change: "+12%" },
              { name: "JPMorgan", change: "-2.4%" },
              { name: "Aon", change: "+5.1%" }
            ]}
          />
          <IndustryCard
            title="SaaS & Tech"
            icon={<Cpu className="w-5 h-5 text-blue-400" />}
            companies={[
              { name: "Salesforce", change: "+8.2%" },
              { name: "HubSpot", change: "+15%" },
              { name: "Zoom", change: "-1.2%" }
            ]}
          />
          <IndustryCard
            title="Energy & EV"
            icon={<Leaf className="w-5 h-5 text-green-400" />}
            companies={[
              { name: "Tesla", change: "+4.5%" },
              { name: "NextEra", change: "+2.1%" },
              { name: "Enphase", change: "-5.8%" }
            ]}
          />
        </div>
      </section>

      {/* Trending Categories */}
      <section className="py-20 bg-black/20 relative z-10 border-t border-white/5">
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-between mb-12">
            <h2 className="text-2xl md:text-3xl font-bold font-heading">Trending High-Growth Categories</h2>
            <button className="flex items-center gap-2 text-sm text-primary hover:text-primary/80 transition-colors">
              Browse All Categories <ArrowRight className="w-4 h-4" />
            </button>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <TrendingCard title="EV Vehicles" metric="+157%" icon={<Zap className="w-4 h-4" />} />
            <TrendingCard title="Cloud Computing" metric="+42%" icon={<Cpu className="w-4 h-4" />} />
            <TrendingCard title="Renewable Energy" metric="+89%" icon={<Leaf className="w-4 h-4" />} />
            <TrendingCard title="AI Technology" metric="+210%" icon={<Cpu className="w-4 h-4" />} />
            <TrendingCard title="Cryptocurrency" metric="+12%" icon={<Bitcoin className="w-4 h-4" />} />
            <TrendingCard title="Fintech" metric="+35%" icon={<Activity className="w-4 h-4" />} />
            <TrendingCard title="HealthTech" metric="+28%" icon={<Activity className="w-4 h-4" />} />
            <TrendingCard title="Space Tech" metric="+15%" icon={<Globe className="w-4 h-4" />} />
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 border-t border-white/10 bg-card/20">
        <div className="container mx-auto px-4 text-center">
          <p className="text-sm text-muted-foreground">© 2024 Business Intelligence Platform. All rights reserved.</p>
        </div>
      </footer>
    </div>
  )
}

function IndustryCard({ title, icon, companies }: { title: string, icon: React.ReactNode, companies: { name: string, change: string }[] }) {
  return (
    <div className="glass-card rounded-2xl p-6 group cursor-pointer relative overflow-hidden">
      <div className="absolute top-0 left-0 w-full h-[1px] bg-gradient-to-r from-transparent via-white/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />

      <div className="flex items-center gap-3 mb-6">
        <div className="p-2 rounded-lg bg-white/5 border border-white/10 group-hover:border-primary/30 transition-colors">
          {icon}
        </div>
        <h3 className="font-semibold text-lg">{title}</h3>
      </div>

      <div className="space-y-4">
        {companies.map((company, i) => (
          <div key={i} className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground group-hover:text-foreground transition-colors">{company.name}</span>
            <span className={`font-mono ${company.change.startsWith('+') ? 'text-green-400' : 'text-red-400'}`}>
              {company.change}
            </span>
          </div>
        ))}
      </div>
    </div>
  )
}

function TrendingCard({ title, metric, icon }: { title: string, metric: string, icon: React.ReactNode }) {
  return (
    <div className="glass-card rounded-xl p-4 flex flex-col gap-2 hover:-translate-y-1 transition-transform cursor-pointer group">
      <div className="flex items-center justify-between">
        <div className="p-1.5 rounded-md bg-white/5 text-muted-foreground group-hover:text-foreground transition-colors">
          {icon}
        </div>
        <div className="h-[20px] w-[60px] opacity-30 grayscale group-hover:grayscale-0 transition-all">
          {/* Mini chart placeholder */}
          <svg viewBox="0 0 60 20" className="w-full h-full stroke-primary fill-none stroke-2">
            <path d="M0,20 Q10,15 20,10 T40,5 T60,0" />
          </svg>
        </div>
      </div>
      <div>
        <h4 className="font-medium text-sm text-muted-foreground group-hover:text-foreground transition-colors">{title}</h4>
        <p className="text-xs font-mono text-primary">{metric} Growth</p>
      </div>
    </div>
  )
}

function FeatureCard({ icon, title, description }: { icon: React.ReactNode; title: string; description: string }) {
  return (
    <div className="glass rounded-lg p-6 text-center">
      <div className="flex justify-center mb-4">{icon}</div>
      <h3 className="font-semibold mb-2">{title}</h3>
      <p className="text-sm text-muted-foreground">{description}</p>
    </div>
  )
}

function StepCard({ number, title, description }: { number: string; title: string; description: string }) {
  return (
    <div className="text-center">
      <div className="w-12 h-12 rounded-full bg-primary/20 flex items-center justify-center mx-auto mb-4">
        <span className="text-xl font-bold text-primary">{number}</span>
      </div>
      <h3 className="font-semibold mb-2">{title}</h3>
      <p className="text-sm text-muted-foreground">{description}</p>
    </div>
  )
}

function StatCard({ number, label }: { number: string; label: string }) {
  return (
    <div className="text-center p-4 rounded-lg bg-white/5">
      <p className="text-3xl font-bold text-primary">{number}</p>
      <p className="text-sm text-muted-foreground mt-1">{label}</p>
    </div>
  )
}
