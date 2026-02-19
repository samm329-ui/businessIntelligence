'use client'

import { useState } from 'react'
import { Search, Building2, Tag, Briefcase, Users, Globe, Filter, X, Sparkles, ChevronDown } from 'lucide-react'

// Search type options with icons
const SEARCH_TYPES = [
  { value: 'company', label: 'Company', icon: Building2, placeholder: 'e.g., Reliance Industries, TCS, Infosys' },
  { value: 'brand', label: 'Brand', icon: Tag, placeholder: 'e.g., Zomato, Swiggy, Amazon' },
  { value: 'industry', label: 'Industry', icon: Briefcase, placeholder: 'e.g., IT Services, Banking, Pharma' },
  { value: 'competitor', label: 'Competitors', icon: Users, placeholder: 'e.g., Competitors of Netflix' },
]

// Common industries
const INDUSTRIES = [
  { value: '', label: 'All Industries' },
  { value: 'Technology', label: 'Technology' },
  { value: 'Financial Services', label: 'Financial Services' },
  { value: 'Healthcare', label: 'Healthcare' },
  { value: 'Automotive', label: 'Automotive' },
  { value: 'Oil & Gas', label: 'Oil & Gas' },
  { value: 'Manufacturing', label: 'Manufacturing' },
  { value: 'Retail', label: 'Retail' },
  { value: 'E-Commerce', label: 'E-Commerce' },
  { value: 'Telecom', label: 'Telecom' },
  { value: 'Pharmaceuticals', label: 'Pharmaceuticals' },
  { value: 'FMCG', label: 'FMCG' },
  { value: 'Real Estate', label: 'Real Estate' },
  { value: 'Media & Entertainment', label: 'Media & Entertainment' },
  { value: 'Logistics', label: 'Logistics' },
  { value: 'Education', label: 'Education' },
  { value: 'Food & Beverage', label: 'Food & Beverage' },
]

// Countries
const COUNTRIES = [
  { value: '', label: 'All Countries' },
  { value: 'India', label: '🇮🇳 India' },
  { value: 'USA', label: '🇺🇸 USA' },
  { value: 'United Kingdom', label: '🇬🇧 UK' },
  { value: 'Germany', label: '🇩🇪 Germany' },
  { value: 'Japan', label: '🇯🇵 Japan' },
  { value: 'China', label: '🇨🇳 China' },
  { value: 'Singapore', label: '🇸🇬 Singapore' },
  { value: 'Australia', label: '🇦🇺 Australia' },
]

interface StructuredSearchProps {
  onSearch: (params: SearchParams) => void
  loading?: boolean
}

export interface SearchParams {
  query: string
  searchType: 'company' | 'brand' | 'industry' | 'competitor' | 'general'
  industry?: string
  country?: string
  useAI?: boolean
  useWebSearch?: boolean
}

export function StructuredSearchBar({ onSearch, loading }: StructuredSearchProps) {
  const [searchType, setSearchType] = useState<SearchParams['searchType']>('company')
  const [query, setQuery] = useState('')
  const [industry, setIndustry] = useState('')
  const [country, setCountry] = useState('')
  const [useAI, setUseAI] = useState(true)
  const [useWebSearch, setUseWebSearch] = useState(false)
  const [showFilters, setShowFilters] = useState(false)

  const currentType = SEARCH_TYPES.find(t => t.value === searchType) || SEARCH_TYPES[0]

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!query.trim()) return

    onSearch({
      query: query.trim(),
      searchType,
      industry: industry || undefined,
      country: country || undefined,
      useAI,
      useWebSearch,
    })
  }

  const clearAll = () => {
    setQuery('')
    setIndustry('')
    setCountry('')
    setUseWebSearch(false)
  }

  return (
    <div className="w-full max-w-4xl mx-auto">
      <form onSubmit={handleSubmit} className="space-y-3">
        {/* Main Search Row */}
        <div className="flex gap-2 items-stretch">
          {/* Search Type Tabs */}
          <div className="flex flex-col gap-1">
            {SEARCH_TYPES.map((type) => {
              const Icon = type.icon
              const isActive = searchType === type.value
              return (
                <button
                  key={type.value}
                  type="button"
                  onClick={() => setSearchType(type.value as SearchParams['searchType'])}
                  className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-all ${
                    isActive 
                      ? 'bg-cyan-600 text-white' 
                      : 'bg-slate-800 text-slate-400 hover:bg-slate-700 hover:text-white'
                  }`}
                  title={type.label}
                >
                  <Icon className="h-4 w-4" />
                  <span className="hidden lg:inline">{type.label}</span>
                </button>
              )
            })}
          </div>

          {/* Main Input */}
          <div className="flex-1 flex flex-col gap-2">
            <div className="flex-1 relative">
              <input
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder={currentType.placeholder}
                className="w-full h-full min-h-[120px] px-4 py-3 pl-12 bg-slate-800 border border-slate-700 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-transparent text-lg"
              />
              <Search className="absolute left-4 top-4 h-5 w-5 text-slate-500" />
              
              {/* Quick Filters Row */}
              <div className="absolute bottom-3 left-12 flex gap-2">
                <button
                  type="button"
                  onClick={() => setShowFilters(!showFilters)}
                  className={`flex items-center gap-1 px-2 py-1 rounded-md text-xs transition-colors ${
                    showFilters || industry || country 
                      ? 'bg-cyan-600/20 text-cyan-400' 
                      : 'bg-slate-700/50 text-slate-400 hover:text-white'
                  }`}
                >
                  <Filter className="h-3 w-3" />
                  Filters
                  <ChevronDown className={`h-3 w-3 transition-transform ${showFilters ? 'rotate-180' : ''}`} />
                </button>
                
                <button
                  type="button"
                  onClick={() => setUseAI(!useAI)}
                  className={`flex items-center gap-1 px-2 py-1 rounded-md text-xs transition-colors ${
                    useAI 
                      ? 'bg-purple-600/20 text-purple-400' 
                      : 'bg-slate-700/50 text-slate-400 hover:text-white'
                  }`}
                >
                  <Sparkles className="h-3 w-3" />
                  AI
                </button>
                
                <button
                  type="button"
                  onClick={() => setUseWebSearch(!useWebSearch)}
                  className={`flex items-center gap-1 px-2 py-1 rounded-md text-xs transition-colors ${
                    useWebSearch 
                      ? 'bg-green-600/20 text-green-400' 
                      : 'bg-slate-700/50 text-slate-400 hover:text-white'
                  }`}
                >
                  <Globe className="h-3 w-3" />
                  Web
                </button>
              </div>
            </div>

            {/* Filters Panel */}
            {showFilters && (
              <div className="p-4 bg-slate-800/80 backdrop-blur border border-slate-700 rounded-xl space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-slate-300">Search Filters</span>
                  <button
                    type="button"
                    onClick={clearAll}
                    className="text-xs text-slate-500 hover:text-white"
                  >
                    Clear All
                  </button>
                </div>
                
                <div className="grid grid-cols-2 gap-3">
                  {/* Industry */}
                  <div>
                    <label className="block text-xs text-slate-400 mb-1">Industry</label>
                    <select
                      value={industry}
                      onChange={(e) => setIndustry(e.target.value)}
                      className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-white text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500"
                    >
                      {INDUSTRIES.map((ind) => (
                        <option key={ind.value} value={ind.value}>{ind.label}</option>
                      ))}
                    </select>
                  </div>

                  {/* Country */}
                  <div>
                    <label className="block text-xs text-slate-400 mb-1">Country</label>
                    <select
                      value={country}
                      onChange={(e) => setCountry(e.target.value)}
                      className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-white text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500"
                    >
                      {COUNTRIES.map((c) => (
                        <option key={c.value} value={c.value}>{c.label}</option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Search Button */}
          <button
            type="submit"
            disabled={!query.trim() || loading}
            className="px-8 py-4 bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 disabled:from-slate-700 disabled:to-slate-700 text-white font-semibold rounded-xl transition-all shadow-lg shadow-cyan-600/25 flex items-center gap-2"
          >
            {loading ? (
              <span className="animate-spin">⏳</span>
            ) : (
              <Search className="h-5 w-5" />
            )}
            <span className="hidden sm:inline">Search</span>
          </button>
        </div>

        {/* Active Filters Display */}
        {(industry || country || useWebSearch) && (
          <div className="flex flex-wrap items-center gap-2 pt-2">
            <span className="text-xs text-slate-500">Active:</span>
            {industry && (
              <span className="inline-flex items-center gap-1 px-3 py-1 bg-slate-800 text-cyan-400 text-xs rounded-full">
                <Briefcase className="h-3 w-3" />
                {industry}
                <button type="button" onClick={() => setIndustry('')}>
                  <X className="h-3 w-3 hover:text-white" />
                </button>
              </span>
            )}
            {country && (
              <span className="inline-flex items-center gap-1 px-3 py-1 bg-slate-800 text-cyan-400 text-xs rounded-full">
                <Globe className="h-3 w-3" />
                {country}
                <button type="button" onClick={() => setCountry('')}>
                  <X className="h-3 w-3 hover:text-white" />
                </button>
              </span>
            )}
            {useWebSearch && (
              <span className="inline-flex items-center gap-1 px-3 py-1 bg-slate-800 text-green-400 text-xs rounded-full">
                <Globe className="h-3 w-3" />
                Web Search
                <button type="button" onClick={() => setUseWebSearch(false)}>
                  <X className="h-3 w-3 hover:text-white" />
                </button>
              </span>
            )}
            <span className="text-xs text-slate-600 ml-auto">
              {searchType}: {query || 'Enter a search term...'}
            </span>
          </div>
        )}
      </form>
    </div>
  )
}
