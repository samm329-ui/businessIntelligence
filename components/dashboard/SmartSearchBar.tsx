'use client'

import { useState, useEffect } from 'react'
import { Search, X } from 'lucide-react'

// Intent detection - runs client-side before the API call
const SEARCH_INTENTS = [
  { 
    keywords: ['petroleum', 'petrol', 'bpcl', 'hpcl', 'iocl', 'ongc', 'oil refin', 'bharat petroleum', 'indian oil'],
    sector: 'Energy', 
    industry: 'Oil & Gas', 
    icon: '⛽', 
    color: 'orange' 
  },
  { 
    keywords: ['bank', 'hdfc', 'icici', 'sbi', 'kotak', 'axis bank', 'yes bank', 'pnb'],
    sector: 'Financial Services', 
    industry: 'Banking', 
    icon: '🏦', 
    color: 'blue' 
  },
  { 
    keywords: ['pharma', 'cipla', 'sun pharma', 'biocon', 'medicine', 'drug', 'lupin', 'aurobindo'],
    sector: 'Healthcare', 
    industry: 'Pharmaceuticals', 
    icon: '💊', 
    color: 'green' 
  },
  { 
    keywords: ['tcs', 'infosys', 'wipro', 'hcl', 'tech mahindra', 'software', 'it services'],
    sector: 'Technology', 
    industry: 'IT Services', 
    icon: '💻', 
    color: 'purple' 
  },
  { 
    keywords: ['reliance', 'jio', 'mukesh ambani'],
    sector: 'Conglomerate', 
    industry: 'Diversified', 
    icon: '🏢', 
    color: 'gray' 
  },
  { 
    keywords: ['steel', 'tata steel', 'jsw', 'sail', 'hindalco', 'jindal'],
    sector: 'Materials', 
    industry: 'Steel & Metals', 
    icon: '🔩', 
    color: 'slate' 
  },
  { 
    keywords: ['auto', 'maruti', 'tata motors', 'mahindra', 'hero', 'bajaj auto', 'car', 'vehicle'],
    sector: 'Automotive', 
    industry: 'Automobile', 
    icon: '🚗', 
    color: 'yellow' 
  },
  { 
    keywords: ['cement', 'ultratech', 'shree cement', 'ambuja', 'acc'],
    sector: 'Materials', 
    industry: 'Cement', 
    icon: '🏗️', 
    color: 'stone' 
  },
  { 
    keywords: ['fmcg', 'hul', 'itc', 'nestle', 'britannia', 'dabur', 'consumer goods'],
    sector: 'Consumer Goods', 
    industry: 'FMCG', 
    icon: '🛒', 
    color: 'teal' 
  },
  { 
    keywords: ['telecom', 'airtel', 'vodafone', 'jio', 'bsnl', 'mobile'],
    sector: 'Communication', 
    industry: 'Telecom', 
    icon: '📱', 
    color: 'indigo' 
  },
  { 
    keywords: ['zepto', 'blinkit', 'instamart', 'quick commerce', 'delivery'],
    sector: 'Consumer', 
    industry: 'Retail', 
    icon: '🛵', 
    color: 'pink' 
  },
]

function detectIntent(query: string) {
  const lower = query.toLowerCase()
  for (const intent of SEARCH_INTENTS) {
    if (intent.keywords.some(k => lower.includes(k))) return intent
  }
  return null
}

interface SmartSearchBarProps {
  onSearch: (query: string, hints?: { sector?: string; industry?: string }) => void
  loading?: boolean
}

export function SmartSearchBar({ onSearch, loading }: SmartSearchBarProps) {
  const [query, setQuery] = useState('')
  const [intent, setIntent] = useState<typeof SEARCH_INTENTS[0] | null>(null)
  const [showHint, setShowHint] = useState(false)

  useEffect(() => {
    if (query.length > 2) {
      const detected = detectIntent(query)
      setIntent(detected)
      setShowHint(!!detected)
    } else {
      setIntent(null)
      setShowHint(false)
    }
  }, [query])

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!query.trim()) return
    // Pass detected intent as hints to help the backend classifier
    onSearch(query, intent ? { sector: intent.sector, industry: intent.industry } : undefined)
  }

  return (
    <form onSubmit={handleSubmit} className="relative w-full max-w-2xl">
      <div className="relative">
        <input
          type="text"
          value={query}
          onChange={e => setQuery(e.target.value)}
          placeholder="Search any company, industry, or sector..."
          className="w-full px-4 py-3 pr-32 border-2 border-gray-200 rounded-xl
                     focus:border-blue-500 focus:outline-none text-base"
          disabled={loading}
        />
        <button 
          type="submit" 
          disabled={loading || !query.trim()}
          className="absolute right-2 top-2 px-4 py-1.5 bg-blue-600
                     text-white rounded-lg text-sm font-medium
                     disabled:opacity-50 hover:bg-blue-700 flex items-center gap-2"
        >
          {loading ? (
            <>
              <div className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full" />
              Analyzing...
            </>
          ) : (
            <>
              <Search className="h-4 w-4" />
              Analyze
            </>
          )}
        </button>
      </div>

      {/* Intent annotation badge */}
      {showHint && intent && (
        <div className="absolute top-full mt-2 left-0 flex items-center gap-2
                        bg-white border border-gray-200 rounded-lg px-3 py-2 shadow-sm z-10">
          <span className="text-lg">{intent.icon}</span>
          <span className="text-xs text-gray-500">Detected:</span>
          <span className="text-xs font-medium text-blue-600">
            {intent.sector} › {intent.industry}
          </span>
          <button 
            onClick={() => setShowHint(false)}
            className="text-gray-300 hover:text-gray-500 ml-1"
          >
            <X className="h-3 w-3" />
          </button>
        </div>
      )}

      <p className="text-xs text-gray-400 mt-3 ml-1">
        Examples: &quot;Bharat Petroleum&quot;, &quot;BPCL&quot;, &quot;Indian banking sector&quot;, &quot;Zepto quick commerce&quot;
      </p>
    </form>
  )
}
