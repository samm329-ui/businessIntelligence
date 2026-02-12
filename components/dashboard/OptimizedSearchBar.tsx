'use client'

import { useState, useRef, useEffect, useCallback, useMemo } from 'react'
import { Search, X, Building2, Factory, Layers, Zap, TrendingUp, Clock, Globe, ChevronDown } from 'lucide-react'
import { unifiedDataSource, CompanyData } from '@/lib/data-sources/unified-data-source'

// ============================================================================
// CONFIG - Single place for all UI constants
// ============================================================================

const SEARCH_CONFIG = {
  debounceMs: 150,              // Debounce input
  maxSuggestions: 8,              // Max suggestions shown
  minQueryLength: 1,              // Start searching at this length
  keyboardNavigation: true,       // Enable arrow keys
  showRecent: true,               // Show recent searches
  recentCount: 4,                // Recent searches count
  showTrending: true,             // Show trending categories
  cacheTTL: 7 * 24 * 60 * 60    // 7 days
} as const

// Trending categories
const TRENDING_CATEGORIES = [
  { name: 'AI Technology', icon: '🤖' },
  { name: 'EV Vehicles', icon: '🚗' },
  { name: 'Cloud Computing', icon: '☁️' },
  { name: 'Fintech', icon: '💳' },
  { name: 'Health Tech', icon: '🏥' },
  { name: 'Renewable Energy', icon: '⚡' }
]

// Quick industries
const QUICK_INDUSTRIES = [
  'Technology',
  'Banking',
  'Healthcare',
  'FMCG',
  'Automobile',
  'Energy'
]

// ============================================================================
// TYPES - Single source of truth
// ============================================================================

interface SearchSuggestion {
  type: 'company' | 'industry' | 'category'
  name: string
  subtitle?: string
  icon: string
  score: number
}

interface SearchBarProps {
  onSearch: (term: string) => void
  loading?: boolean
  recentSearches?: string[]
}

// ============================================================================
// UTILITY FUNCTIONS - Reusable helpers
// ============================================================================

// Calculate relevance score
const calculateScore = (query: string, name: string): number => {
  const q = query.toLowerCase().trim()
  const n = name.toLowerCase()
  
  if (q === n) return 100           // Exact match
  if (n.startsWith(q)) return 80     // Starts with
  if (n.includes(q)) return 60       // Contains
  return 0
}

// Parse query to normalized form
const normalizeQuery = (query: string): string => 
  query.toLowerCase().trim().replace(/\s+/g, ' ')

// ============================================================================
// MAIN COMPONENT
// ============================================================================

export function SearchBar({ onSearch, loading, recentSearches = [] }: SearchBarProps) {
  // State
  const [query, setQuery] = useState('')
  const [suggestions, setSuggestions] = useState<SearchSuggestion[]>([])
  const [isOpen, setIsOpen] = useState(false)
  const [highlightedIndex, setHighlightedIndex] = useState(-1)
  const [isSearching, setIsSearching] = useState(false)
  
  // Refs
  const inputRef = useRef<HTMLInputElement>(null)
  const dropdownRef = useRef<HTMLDivElement>(null)
  const debounceRef = useRef<NodeJS.Timeout | null>(null)

  // =========================================================================
  // SEARCH LOGIC - Unified search with caching
  // =========================================================================
  
  const performSearch = useCallback(async (searchQuery: string) => {
    if (searchQuery.length < SEARCH_CONFIG.minQueryLength) {
      setSuggestions([])
      return
    }

    setIsSearching(true)
    
    try {
      const normalized = normalizeQuery(searchQuery)
      const results: SearchSuggestion[] = []
      const added = new Set<string>()

      // Search using unified data source (checks cache first!)
      const companies = await unifiedDataSource.searchCompanies(normalized, SEARCH_CONFIG.maxSuggestions)

      for (const company of companies) {
        const key = `${company.name}-${company.industry}`.toLowerCase()
        if (!added.has(key)) {
          added.add(key)
          results.push({
            type: 'company',
            name: company.name,
            subtitle: `${company.industry} • ${company.country}`,
            icon: '🏢',
            score: calculateScore(normalized, company.name)
          })
        }
      }

      // Add industry matches
      for (const industry of QUICK_INDUSTRIES) {
        const key = `ind-${industry}`.toLowerCase()
        if (!added.has(key) && industry.toLowerCase().includes(normalized)) {
          added.add(key)
          results.push({
            type: 'industry',
            name: industry,
            subtitle: 'Industry',
            icon: '🏭',
            score: calculateScore(normalized, industry) - 10
          })
        }
      }

      // Sort by score and limit
      const sorted = results
        .sort((a, b) => b.score - a.score)
        .slice(0, SEARCH_CONFIG.maxSuggestions)

      setSuggestions(sorted)
      setIsOpen(true)
    } finally {
      setIsSearching(false)
    }
  }, [])

  // =========================================================================
  // DEBOUNCE - Prevent excessive searches
  // =========================================================================
  
  useEffect(() => {
    if (debounceRef.current) {
      clearTimeout(debounceRef.current)
    }
    
    if (query.length >= SEARCH_CONFIG.minQueryLength) {
      debounceRef.current = setTimeout(() => {
        performSearch(query)
      }, SEARCH_CONFIG.debounceMs)
    }
    
    return () => {
      if (debounceRef.current) {
        clearTimeout(debounceRef.current)
      }
    }
  }, [query, performSearch])

  // =========================================================================
  // KEYBOARD NAVIGATION
  // =========================================================================
  
  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (!SEARCH_CONFIG.keyboardNavigation) return

    const totalItems = suggestions.length + (SEARCH_CONFIG.showRecent ? SEARCH_CONFIG.recentCount : 0) + TRENDING_CATEGORIES.length

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault()
        setHighlightedIndex(prev => Math.min(prev + 1, totalItems - 1))
        break
      case 'ArrowUp':
        e.preventDefault()
        setHighlightedIndex(prev => Math.max(prev - 1, 0))
        break
      case 'Enter':
        e.preventDefault()
        if (highlightedIndex >= 0 && suggestions[highlightedIndex]) {
          handleSelect(suggestions[highlightedIndex].name)
        } else if (query.trim()) {
          handleSubmit()
        }
        break
      case 'Escape':
        setIsOpen(false)
        break
    }
  }, [query, suggestions, highlightedIndex])

  // =========================================================================
  // EVENT HANDLERS
  // =========================================================================
  
  const handleSelect = useCallback((term: string) => {
    setQuery(term)
    setIsOpen(false)
    setSuggestions([])
    setHighlightedIndex(-1)
    
    // Small delay to prevent state conflicts
    setTimeout(() => onSearch(term), 10)
  }, [onSearch])

  const handleSubmit = useCallback(() => {
    if (query.trim()) {
      setIsOpen(false)
      setTimeout(() => onSearch(query.trim()), 10)
    }
  }, [query, onSearch])

  const clearSearch = useCallback(() => {
    setQuery('')
    setSuggestions([])
    setIsOpen(false)
    inputRef.current?.focus()
  }, [])

  // =========================================================================
  // CLICK OUTSIDE
  // =========================================================================
  
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setIsOpen(false)
      }
    }
    
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  // =========================================================================
  // RENDER HELPERS
  // =========================================================================
  
  const getSuggestionIcon = (type: string): React.ReactNode => {
    switch (type) {
      case 'company': return <Building2 className="w-4 h-4 text-blue-400" />
      case 'industry': return <Factory className="w-4 h-4 text-emerald-400" />
      case 'category': return <Layers className="w-4 h-4 text-yellow-400" />
      default: return <TrendingUp className="w-4 h-4 text-gray-400" />
    }
  }

  const getTypeBadge = (type: string): React.ReactNode => {
    const colors: Record<string, string> = {
      company: 'bg-blue-500/20 text-blue-400',
      industry: 'bg-emerald-500/20 text-emerald-400',
      category: 'bg-yellow-500/20 text-yellow-400'
    }
    
    return (
      <span className={`text-[10px] px-1.5 py-0.5 rounded ${colors[type] || 'bg-gray-500/20 text-gray-400'}`}>
        {type}
      </span>
    )
  }

  // =========================================================================
  // RENDER
  // =========================================================================
  
  return (
    <div className="w-full max-w-2xl mx-auto relative z-10">
      <form 
        onSubmit={(e) => { e.preventDefault(); handleSubmit() }}
        className="relative"
      >
        {/* Search Input */}
        <div className={`
          relative flex items-center h-14 rounded-full 
          glass border transition-all duration-300
          ${isOpen ? 'ring-2 ring-primary/30 border-primary/30' : 'border-white/10 hover:border-white/20'}
        `}>
          <div className="pl-4 text-muted-foreground">
            <Search className="w-5 h-5" />
          </div>

          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onFocus={() => setIsOpen(true)}
            onKeyDown={handleKeyDown}
            placeholder={isSearching ? 'Searching...' : 'Search companies, industries, markets...'}
            className="flex-1 h-full bg-transparent border-none outline-none px-3 text-base text-foreground placeholder:text-muted-foreground/50"
            autoComplete="off"
          />

          {query && (
            <button
              type="button"
              onClick={clearSearch}
              className="p-2 mr-2 text-muted-foreground hover:text-foreground transition-colors rounded-full hover:bg-white/5"
            >
              <X className="w-4 h-4" />
            </button>
          )}

          <button
            type="submit"
            disabled={loading || !query.trim()}
            className={`
              h-10 px-6 mr-2 rounded-full font-medium text-sm transition-all
              ${!query.trim()
                ? 'bg-muted text-muted-foreground opacity-50 cursor-not-allowed'
                : 'bg-gradient-to-r from-primary to-emerald-400 hover:shadow-lg hover:scale-105 cursor-pointer'
              }
            `}
          >
            {loading ? (
              <Zap className="w-4 h-4 animate-spin" />
            ) : (
              'Search'
            )}
          </button>
        </div>

        {/* Dropdown */}
        {isOpen && (
          <div
            ref={dropdownRef}
            className="absolute top-full left-0 right-0 mt-2 rounded-xl glass border border-white/10 shadow-2xl overflow-hidden z-50"
          >
            {/* Suggestions */}
            {suggestions.length > 0 ? (
              <div className="p-2">
                <div className="flex items-center justify-between px-3 py-2 text-xs text-muted-foreground">
                  <span>Suggestions</span>
                  <span className="flex items-center gap-1">
                    <Zap className="w-3 h-3" />
                    Cached
                  </span>
                </div>
                
                {suggestions.map((suggestion, index) => (
                  <button
                    key={`${suggestion.type}-${suggestion.name}`}
                    type="button"
                    onClick={() => handleSelect(suggestion.name)}
                    onMouseEnter={() => setHighlightedIndex(index)}
                    className={`
                      w-full flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all
                      ${highlightedIndex === index ? 'bg-white/10' : 'hover:bg-white/5'}
                    `}
                  >
                    {getSuggestionIcon(suggestion.type)}
                    <div className="flex-1 text-left">
                      <span className="text-sm font-medium block">{suggestion.name}</span>
                      {suggestion.subtitle && (
                        <span className="text-xs text-muted-foreground">{suggestion.subtitle}</span>
                      )}
                    </div>
                    {getTypeBadge(suggestion.type)}
                  </button>
                ))}
              </div>
            ) : query.length === 0 ? (
              /* Initial State */
              <div className="p-4">
                {/* Recent Searches */}
                {SEARCH_CONFIG.showRecent && recentSearches.length > 0 && (
                  <div className="mb-4">
                    <div className="flex items-center gap-2 px-2 mb-2 text-xs text-muted-foreground">
                      <Clock className="w-3 h-3" />
                      Recent
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {recentSearches.slice(0, SEARCH_CONFIG.recentCount).map((search) => (
                        <button
                          key={search}
                          type="button"
                          onClick={() => handleSelect(search)}
                          className="px-3 py-1.5 rounded-full text-xs bg-white/5 hover:bg-white/10 transition-colors"
                        >
                          {search}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {/* Trending */}
                {SEARCH_CONFIG.showTrending && (
                  <div className="mb-4">
                    <div className="flex items-center gap-2 px-2 mb-2 text-xs text-muted-foreground">
                      <TrendingUp className="w-3 h-3" />
                      Trending
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      {TRENDING_CATEGORIES.map((category) => (
                        <button
                          key={category.name}
                          type="button"
                          onClick={() => handleSelect(category.name)}
                          className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm hover:bg-white/5 transition-colors"
                        >
                          <span>{category.icon}</span>
                          <span>{category.name}</span>
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {/* Quick Industries */}
                <div>
                  <div className="flex items-center gap-2 px-2 mb-2 text-xs text-muted-foreground">
                    <Factory className="w-3 h-3" />
                    Industries
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {QUICK_INDUSTRIES.map((industry) => (
                      <button
                        key={industry}
                        type="button"
                        onClick={() => handleSelect(industry)}
                        className="px-3 py-1.5 rounded-full text-xs bg-primary/10 text-primary hover:bg-primary/20 transition-colors"
                      >
                        {industry}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            ) : isSearching ? (
              /* Searching State */
              <div className="p-8 text-center text-muted-foreground">
                <Zap className="w-6 h-6 animate-spin mx-auto mb-2" />
                <span className="text-sm">Searching...</span>
              </div>
            ) : null}
          </div>
        )}
      </form>

      {/* Info Text */}
      <div className="text-center mt-3">
        <p className="text-xs text-muted-foreground">
          {isSearching ? (
            <span className="flex items-center justify-center gap-2">
              <Zap className="w-3 h-3" />
              Searching cached data...
            </span>
          ) : (
            <>Cached • 7-day storage • Instant responses</>
          )}
        </p>
      </div>
    </div>
  )
}

export default SearchBar
