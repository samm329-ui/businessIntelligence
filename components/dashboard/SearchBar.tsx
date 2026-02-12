import { Search, Loader2, Building2, Layers, TrendingUp, Factory, Clock, X, Globe, Building } from 'lucide-react'
import { useState, useRef, useEffect, useCallback } from 'react'
import { INDUSTRIES } from '@/lib/industry-database'
import { CompanyRecord } from '@/lib/datasets/company-database'
import { StringUtils } from '@/lib/utils/consolidated-utils'

interface SearchBarProps {
  onSearch: (term: string) => void
  loading?: boolean
  recentSearches?: string[]
}

interface SearchResult {
  type: 'industry' | 'company' | 'category'
  name: string
  parent?: string
  country?: string
  subIndustry?: string
  relevance: number
}

const TRENDING_CATEGORIES = [
  'EV Vehicles',
  'Cloud Computing',
  'Renewable Energy',
  'AI Technology',
  'Fintech',
  'Health Tech'
]

const QUICK_CATEGORIES = [
  'Technology',
  'Automobile',
  'FMCG',
  'Healthcare',
  'Financial Services'
]

// Comprehensive keyword mappings for better search
const KEYWORD_MAPPINGS: Record<string, string[]> = {
  'Technology': ['tech', 'software', 'it', 'digital', 'saas', 'cloud', 'ai', 'artificial intelligence', 'machine learning', 'cybersecurity', 'fintech'],
  'Automobile': ['auto', 'car', 'vehicle', 'ev', 'electric vehicle', 'automotive', 'motor', 'bike', 'scooter', 'transport'],
  'FMCG': ['consumer goods', 'fast moving', 'retail', 'grocery', 'beverage', 'food', 'personal care', 'home care', 'detergent', 'soap'],
  'Healthcare': ['pharma', 'pharmaceutical', 'medical', 'hospital', 'health', 'biotech', 'drug', 'medicine', 'diagnostic', 'clinic'],
  'Financial Services': ['bank', 'finance', 'insurance', 'nbfc', 'mutual fund', 'stock', 'trading', 'investment', 'payment', 'fintech'],
  'Energy': ['power', 'renewable', 'solar', 'wind', 'electricity', 'oil', 'gas', 'petroleum', 'green energy'],
  'Real Estate': ['property', 'housing', 'construction', 'builder', 'infrastructure', 'commercial', 'residential'],
  'Telecom': ['telecommunication', 'mobile', 'broadband', 'internet', '5g', '4g', 'wireless', 'network'],
  'Manufacturing': ['factory', 'industrial', 'steel', 'cement', 'chemical', 'textile', 'production', 'engineering'],
  'E-commerce': ['online shopping', 'marketplace', 'delivery', 'logistics', 'digital commerce', 'webstore']
}

// Calculate relevance score for search results - CONSOLIDATED with StringUtils
function calculateRelevance(query: string, name: string, type: string): number {
  const normalizedQuery = StringUtils.normalize(query)
  const normalizedName = StringUtils.normalize(name)
  let score = 0

  if (normalizedName === normalizedQuery) score += 100
  else if (normalizedName.startsWith(normalizedQuery)) score += 80
  else if (normalizedName.includes(` ${normalizedQuery} `) || normalizedName.includes(`(${normalizedQuery})`)) score += 60
  else if (normalizedName.includes(normalizedQuery)) score += 40

  if (type === 'industry') score += 10

  return score
}

export function SearchBar({ onSearch, loading, recentSearches = [] }: SearchBarProps) {
  const [term, setTerm] = useState('')
  const [isFocused, setIsFocused] = useState(false)
  const [showDropdown, setShowDropdown] = useState(false)
  const [suggestions, setSuggestions] = useState<SearchResult[]>([])
  const [highlightedIndex, setHighlightedIndex] = useState(-1)
  const [dbStats, setDbStats] = useState<{ totalCompanies: number; totalIndustries: number } | null>(null)
  const inputRef = useRef<HTMLInputElement>(null)
  const dropdownRef = useRef<HTMLDivElement>(null)

  // Fetch database stats on mount
  useEffect(() => {
    const fetchStats = async () => {
      try {
        const response = await fetch('/api/companies?action=stats')
        if (response.ok) {
          const data = await response.json()
          if (data.success) {
            setDbStats({
              totalCompanies: data.totalCompanies,
              totalIndustries: data.totalIndustries
            })
          }
        }
      } catch (error) {
        console.warn('Failed to fetch database stats:', error)
      }
    }
    fetchStats()
  }, [])

  // Search function that queries local industries + API
  const performSearch = useCallback(async (query: string): Promise<SearchResult[]> => {
    if (!query || query.length < 1) return []
    
    const results: SearchResult[] = []
    const addedNames = new Set<string>()
    const lowerQuery = query.toLowerCase()

    // 1. Search via API for CSV database results
    try {
      const response = await fetch(`/api/companies?action=search&query=${encodeURIComponent(query)}&limit=10`)
      if (response.ok) {
        const data = await response.json()
        if (data.success && data.results) {
          data.results.forEach((company: CompanyRecord) => {
            const key = `csv-${company.companyName}`.toLowerCase()
            if (!addedNames.has(key)) {
              const relevance = calculateRelevance(query, company.companyName, 'company')
              results.push({
                type: 'company',
                name: company.companyName,
                parent: company.industryName,
                country: company.country,
                subIndustry: company.subIndustry,
                relevance: relevance + 5
              })
              addedNames.add(key)
            }
          })
        }
      }
    } catch (error) {
      console.warn('API search failed:', error)
    }

    // 2. Search in local INDUSTRIES database
    Object.values(INDUSTRIES).forEach(industry => {
      // Industry match
      if (industry.name.toLowerCase().includes(lowerQuery)) {
        const key = `local-${industry.name}`.toLowerCase()
        if (!addedNames.has(key)) {
          const relevance = calculateRelevance(query, industry.name, 'industry')
          results.push({
            type: 'industry',
            name: industry.name,
            relevance
          })
          addedNames.add(key)
        }
      }

      // Subcategory match
      Object.entries(industry.subcategories).forEach(([subName, subData]) => {
        if (subName.toLowerCase().includes(lowerQuery)) {
          const key = `local-sub-${subName}`.toLowerCase()
          if (!addedNames.has(key)) {
            results.push({
              type: 'category',
              name: subName,
              parent: industry.name,
              relevance: calculateRelevance(query, subName, 'category')
            })
            addedNames.add(key)
          }
        }

        // Company match
        subData.companies.forEach(company => {
          if (company.name.toLowerCase().includes(lowerQuery)) {
            const key = `local-comp-${company.name}`.toLowerCase()
            if (!addedNames.has(key)) {
              results.push({
                type: 'company',
                name: company.name,
                parent: subName,
                relevance: calculateRelevance(query, company.name, 'company')
              })
              addedNames.add(key)
            }
          }
        })
      })
    })

    // 3. Keyword mappings
    for (const [industryName, keywords] of Object.entries(KEYWORD_MAPPINGS)) {
      if (keywords.some(keyword => keyword.includes(lowerQuery) || lowerQuery.includes(keyword))) {
        const key = `kw-${industryName}`.toLowerCase()
        if (!addedNames.has(key)) {
          results.push({
            type: 'industry',
            name: industryName,
            relevance: 50
          })
          addedNames.add(key)
        }
      }
    }

    // Sort by relevance and return top results
    return results
      .sort((a, b) => b.relevance - a.relevance)
      .slice(0, 12)
  }, [])

  // Debounced search effect
  useEffect(() => {
    const timeoutId = setTimeout(async () => {
      if (term.length >= 1) {
        const results = await performSearch(term)
        setSuggestions(results)
        setShowDropdown(true)
      } else {
        setSuggestions([])
        setShowDropdown(isFocused && term.length === 0)
      }
    }, 150) // 150ms debounce

    return () => clearTimeout(timeoutId)
  }, [term, isFocused, performSearch])

  // Handle click outside to close dropdown
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node) &&
        inputRef.current && !inputRef.current.contains(event.target as Node)) {
        setShowDropdown(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (term.trim()) {
      onSearch(term.trim())
      setShowDropdown(false)
    }
  }

  const handleSuggestionClick = (suggestion: SearchResult, event?: React.MouseEvent) => {
    if (event) {
      event.preventDefault()
      event.stopPropagation()
    }

    const searchTerm = suggestion.name
    setTerm(searchTerm)
    setShowDropdown(false)
    setSuggestions([])
    setHighlightedIndex(-1)

    // Small delay to ensure state updates before triggering search
    setTimeout(() => {
      onSearch(searchTerm)
    }, 10)
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    const totalItems = suggestions.length > 0 ? suggestions.length : TRENDING_CATEGORIES.length

    if (e.key === 'ArrowDown') {
      e.preventDefault()
      setHighlightedIndex(prev => (prev + 1) % totalItems)
    } else if (e.key === 'ArrowUp') {
      e.preventDefault()
      setHighlightedIndex(prev => (prev - 1 + totalItems) % totalItems)
    } else if (e.key === 'Enter' && highlightedIndex >= 0) {
      e.preventDefault()
      if (suggestions.length > 0) {
        handleSuggestionClick(suggestions[highlightedIndex])
      } else {
        const trendingItem = TRENDING_CATEGORIES[highlightedIndex]
        setTerm(trendingItem)
        onSearch(trendingItem)
        setShowDropdown(false)
      }
    } else if (e.key === 'Escape') {
      setShowDropdown(false)
    }
  }

  const getIcon = (type: string) => {
    switch (type) {
      case 'industry': return <Factory className="h-3.5 w-3.5 text-primary" />
      case 'company': return <Building2 className="h-3.5 w-3.5 text-blue-400" />
      case 'category': return <Layers className="h-3.5 w-3.5 text-yellow-400" />
      default: return <TrendingUp className="h-3.5 w-3.5 text-muted-foreground" />
    }
  }

  const clearSearch = () => {
    setTerm('')
    setSuggestions([])
    inputRef.current?.focus()
  }

  return (
    <div className="w-full max-w-3xl mx-auto relative z-10 font-sans">
      <form onSubmit={handleSubmit} className="relative group">
        <div
          className={`
            relative flex items-center w-full h-16 rounded-full 
            glass transition-all duration-300
            ${isFocused ? 'ring-1 ring-primary/50 shadow-[0_0_30px_-5px_var(--primary)] border-primary/30' : 'border-white/10 hover:border-white/20'}
          `}
        >
          <div className="pl-6 text-muted-foreground group-focus-within:text-primary transition-colors">
            <Search className="w-6 h-6" />
          </div>

          <input
            ref={inputRef}
            type="text"
            value={term}
            onChange={(e) => setTerm(e.target.value)}
            onFocus={() => { setIsFocused(true); setShowDropdown(true) }}
            onBlur={() => setIsFocused(false)}
            onKeyDown={handleKeyDown}
            placeholder={dbStats 
              ? `Search ${dbStats.totalCompanies}+ companies, industries, brands...` 
              : 'Search companies, industries, brands...'}
            className="w-full h-full bg-transparent border-none outline-none px-4 text-lg text-foreground placeholder:text-muted-foreground/50"
            disabled={loading}
            autoComplete="off"
          />

          {term && (
            <button
              type="button"
              onClick={clearSearch}
              className="p-2 text-muted-foreground hover:text-foreground transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          )}

          <div className="pr-2">
            <button
              type="submit"
              disabled={loading || !term.trim()}
              className={`
                h-12 px-8 rounded-full font-medium text-primary-foreground transition-all duration-300 cursor-pointer
                ${loading || !term.trim()
                  ? 'bg-muted text-muted-foreground cursor-not-allowed opacity-50'
                  : 'bg-gradient-to-r from-primary to-emerald-400 hover:shadow-[0_0_20px_-5px_var(--primary)] hover:scale-105 active:scale-95'
                }
              `}
            >
              {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : "Search"}
            </button>
          </div>
        </div>

        {/* Autocomplete Dropdown */}
        {showDropdown && (
          <div
            ref={dropdownRef}
            className="absolute top-full left-0 right-0 mt-2 rounded-xl glass border border-white/10 shadow-2xl overflow-hidden z-50 animate-in fade-in slide-in-from-top-2 duration-200"
          >
            {suggestions.length > 0 ? (
              <div className="p-2 max-h-[400px] overflow-y-auto">
                <div className="flex items-center justify-between px-3 py-1">
                  <p className="text-[10px] text-muted-foreground uppercase tracking-wider">
                    {suggestions.length} Results Found
                  </p>
                  {dbStats && (
                    <p className="text-[10px] text-muted-foreground">
                      From {dbStats.totalCompanies}+ companies
                    </p>
                  )}
                </div>
                {suggestions.map((suggestion, index) => (
                  <button
                    key={`${suggestion.type}-${suggestion.name}-${index}`}
                    type="button"
                    onMouseDown={(e) => handleSuggestionClick(suggestion, e)}
                    className={`
                      w-full flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors text-left cursor-pointer
                      ${highlightedIndex === index ? 'bg-white/10' : 'hover:bg-white/5'}
                    `}
                  >
                    {getIcon(suggestion.type)}
                    <div className="flex-1 min-w-0">
                      <span className="text-sm font-medium block truncate">{suggestion.name}</span>
                      <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        {suggestion.parent && (
                          <span className="truncate">{suggestion.parent}</span>
                        )}
                        {suggestion.subIndustry && (
                          <span className="truncate">• {suggestion.subIndustry}</span>
                        )}
                        {suggestion.country && (
                          <span className="flex items-center gap-1">
                            <Globe className="h-3 w-3" />
                            {suggestion.country}
                          </span>
                        )}
                      </div>
                    </div>
                    <span className={`text-[10px] px-2 py-0.5 rounded flex-shrink-0 ${
                      suggestion.type === 'industry' ? 'bg-primary/20 text-primary' :
                      suggestion.type === 'company' ? 'bg-blue-500/20 text-blue-400' :
                        'bg-yellow-500/20 text-yellow-400'
                      }`}>
                      {suggestion.type}
                    </span>
                  </button>
                ))}
              </div>
            ) : term.length === 0 ? (
              <div className="p-4">
                {/* Recent Searches */}
                {recentSearches.length > 0 && (
                  <div className="mb-4">
                    <p className="text-[10px] text-muted-foreground uppercase tracking-wider px-1 mb-2 flex items-center gap-1">
                      <Clock className="h-3 w-3" /> Recent
                    </p>
                    <div className="flex flex-wrap gap-2">
                      {recentSearches.slice(0, 4).map((search) => (
                        <button
                          key={search}
                          type="button"
                          onClick={() => { setTerm(search); onSearch(search); setShowDropdown(false) }}
                          className="px-3 py-1.5 rounded-full text-xs bg-white/5 hover:bg-white/10 transition-colors"
                        >
                          {search}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {/* Trending Categories */}
                <div>
                  <p className="text-[10px] text-muted-foreground uppercase tracking-wider px-1 mb-2 flex items-center gap-1">
                    <TrendingUp className="h-3 w-3" /> Trending
                  </p>
                  <div className="grid grid-cols-2 gap-2">
                    {TRENDING_CATEGORIES.slice(0, 6).map((category, index) => (
                      <button
                        key={category}
                        type="button"
                        onClick={() => { setTerm(category); onSearch(category); setShowDropdown(false) }}
                        className={`
                          flex items-center gap-2 px-3 py-2 rounded-lg text-left transition-colors
                          ${highlightedIndex === index ? 'bg-white/10' : 'hover:bg-white/5'}
                        `}
                      >
                        <TrendingUp className="h-3 w-3 text-green-400" />
                        <span className="text-sm">{category}</span>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Popular Industries */}
                <div className="mt-4 pt-4 border-t border-white/10">
                  <p className="text-[10px] text-muted-foreground uppercase tracking-wider px-1 mb-2">Popular Industries</p>
                  <div className="flex flex-wrap gap-2">
                    {Object.values(INDUSTRIES).slice(0, 5).map((industry) => (
                      <button
                        key={industry.name}
                        type="button"
                        onClick={() => { setTerm(industry.name); onSearch(industry.name); setShowDropdown(false) }}
                        className="flex items-center gap-2 px-3 py-1.5 rounded-full text-xs bg-primary/10 text-primary hover:bg-primary/20 transition-colors"
                      >
                        <span>{industry.icon}</span>
                        <span>{industry.name}</span>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Database Status */}
                {dbStats && (
                  <div className="mt-4 pt-4 border-t border-white/10">
                    <p className="text-[10px] text-muted-foreground flex items-center gap-1">
                      <Building className="h-3 w-3" />
                      Database: {dbStats.totalCompanies} companies across {dbStats.totalIndustries} industries
                    </p>
                  </div>
                )}
              </div>
            ) : null}
          </div>
        )}
      </form>

      {/* Trust Text */}
      <div className="text-center mt-3 mb-6">
        <p className="text-xs text-muted-foreground">
          {dbStats 
            ? `Access to ${dbStats.totalCompanies} real companies across ${dbStats.totalIndustries} industries` 
            : 'Free to use. No credit card required.'}
        </p>
      </div>

      {/* Quick Category Pills */}
      <div className="flex flex-wrap justify-center gap-2 animate-in fade-in slide-in-from-bottom-4 duration-700 delay-100">
        {QUICK_CATEGORIES.map((cat) => (
          <button
            key={cat}
            onClick={() => onSearch(cat)}
            className="px-4 py-2 rounded-full text-sm font-medium glass border-white/5 hover:bg-white/5 hover:border-primary/30 hover:text-primary transition-all duration-300 cursor-pointer"
          >
            {cat}
          </button>
        ))}
      </div>
    </div>
  )
}
