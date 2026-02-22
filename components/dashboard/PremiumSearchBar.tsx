'use client'

import { useState } from 'react'
import { Search, Building2, Briefcase, Globe, Loader2 } from 'lucide-react'
import { cn } from '@/lib/utils'

export interface SearchParams {
    query: string
    searchType: 'all' | 'industry' | 'company'
}

interface PremiumSearchBarProps {
    onSearch: (params: SearchParams) => void
    loading?: boolean
}

export function PremiumSearchBar({ onSearch, loading }: PremiumSearchBarProps) {
    const [searchType, setSearchType] = useState<'all' | 'industry' | 'company'>('all')
    const [query, setQuery] = useState('')

    const tabs = [
        { id: 'all', label: 'All Entities', icon: Globe },
        { id: 'industry', label: 'Industries', icon: Briefcase },
        { id: 'company', label: 'Companies', icon: Building2 },
    ]

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault()
        if (!query.trim() || loading) return
        onSearch({ query: query.trim(), searchType })
    }

    return (
        <div className="w-full max-w-4xl mx-auto space-y-4">
            {/* Tabs - Professional Minimalist */}
            <div className="flex items-center gap-6 px-4">
                {tabs.map((tab) => (
                    <button
                        key={tab.id}
                        type="button"
                        onClick={() => setSearchType(tab.id as any)}
                        className={cn(
                            "flex items-center gap-2 py-2 text-sm font-bold uppercase tracking-wider transition-all duration-300 relative",
                            searchType === tab.id
                                ? "text-gold"
                                : "text-gray-500 hover:text-white"
                        )}
                    >
                        <tab.icon className="h-4 w-4" />
                        {tab.label}
                        {searchType === tab.id && (
                            <div className="absolute -bottom-[1px] left-0 right-0 h-[2px] bg-gold"
                                style={{ backgroundColor: 'var(--color-gold)' }} />
                        )}
                    </button>
                ))}
            </div>

            {/* Input Container - Corporate Executive Style */}
            <form onSubmit={handleSubmit} className="relative group">
                <div className="flex items-center gap-2 p-1.5 rounded-xl bg-mid/50 border border-white/10 group-focus-within:border-gold/40 transition-all shadow-2xl">
                    <div className="flex-1 flex items-center px-4">
                        <Search className="h-5 w-5 text-gray-500 group-focus-within:text-gold transition-colors mr-3" />
                        <input
                            type="text"
                            value={query}
                            onChange={(e) => setQuery(e.target.value)}
                            placeholder={
                                searchType === 'company' ? "Search for companies like TCS, Reliance..." :
                                    searchType === 'industry' ? "Search for industries like SaaS, Energy..." :
                                        "Search for industries or companies..."
                            }
                            className="bg-transparent border-none outline-none text-[#F3F4F6] placeholder-gray-600 w-full py-4 text-base font-medium"
                        />
                    </div>

                    <button
                        type="submit"
                        disabled={!query.trim() || loading}
                        className="h-14 px-10 rounded-lg font-bold text-sm bg-gold text-[#0B0F14] hover:brightness-110 active:scale-95 transition-all flex items-center gap-2 disabled:opacity-40 disabled:cursor-not-allowed"
                        style={{ backgroundColor: 'var(--color-gold)' }}
                    >
                        {loading ? (
                            <Loader2 className="h-5 w-5 animate-spin" />
                        ) : (
                            <Search className="h-5 w-5" />
                        )}
                        <span>Generate Intelligence</span>
                    </button>
                </div>
            </form>

            {/* Quick Suggestions */}
            <div className="flex items-center gap-3 px-4 pt-1 opacity-60">
                <span className="text-[10px] font-bold uppercase tracking-widest text-gray-500">Trending:</span>
                <div className="flex items-center gap-4">
                    {['TATA Motors', 'Nvidia AI', 'SaaS Growth', 'EV Market'].map(tag => (
                        <button
                            key={tag}
                            type="button"
                            onClick={() => setQuery(tag)}
                            className="text-[10px] font-bold uppercase tracking-wider text-gray-500 hover:text-gold transition-colors"
                        >
                            {tag}
                        </button>
                    ))}
                </div>
            </div>
        </div>
    )
}
