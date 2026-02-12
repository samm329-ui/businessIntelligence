'use client'

import { useState } from 'react'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { 
  Search, 
  Layers, 
  TrendingUp, 
  Building2,
  ArrowRight,
  Sparkles,
  ChevronRight
} from 'lucide-react'
import { INDUSTRY_CATEGORIES } from '@/lib/fetchers/industryCategories'
import { useRouter } from 'next/navigation'

export function CategoryBrowser() {
  const router = useRouter()
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedIndustry, setSelectedIndustry] = useState<string | null>(null)

  // Get all industries with their categories
  const allIndustries = Object.entries(INDUSTRY_CATEGORIES).map(([industry, categories]) => ({
    industry,
    categories,
    totalMarketShare: categories.reduce((sum, c) => sum + c.marketShare, 0),
    avgGrowth: Math.round(categories.reduce((sum, c) => sum + c.growthRate, 0) / categories.length),
    categoryCount: categories.length
  }))

  // Filter industries based on search
  const filteredIndustries = allIndustries.filter(({ industry, categories }) => {
    const query = searchQuery.toLowerCase()
    const matchesIndustry = industry.toLowerCase().includes(query)
    const matchesCategory = categories.some(c => 
      c.name.toLowerCase().includes(query) ||
      c.description.toLowerCase().includes(query)
    )
    return matchesIndustry || matchesCategory
  })

  const handleCategoryClick = (industry: string, categoryName: string) => {
    // Navigate to analysis with category context
    router.push(`/analyze/${encodeURIComponent(industry)}?category=${encodeURIComponent(categoryName)}`)
  }

  return (
    <div className="w-full max-w-6xl mx-auto">
      {/* Search Header */}
      <div className="text-center mb-8">
        <h2 className="text-3xl font-bold mb-3">Browse All Categories</h2>
        <p className="text-muted-foreground max-w-2xl mx-auto">
          Explore {Object.keys(INDUSTRY_CATEGORIES).length} industries and their sub-categories. 
          Find niche segments, emerging opportunities, and detailed market insights.
        </p>
      </div>

      {/* Search Bar */}
      <div className="relative max-w-2xl mx-auto mb-8">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
        <Input
          type="text"
          placeholder="Search industries or categories (e.g., 'Software', 'Healthcare', 'EV')..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-12 h-14 text-lg bg-card/60 backdrop-blur-xl"
        />
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        <Card className="glass">
          <CardContent className="p-4 text-center">
            <p className="text-3xl font-bold text-primary">{Object.keys(INDUSTRY_CATEGORIES).length}</p>
            <p className="text-xs text-muted-foreground">Industries</p>
          </CardContent>
        </Card>
        <Card className="glass">
          <CardContent className="p-4 text-center">
            <p className="text-3xl font-bold text-green-400">
              {Object.values(INDUSTRY_CATEGORIES).reduce((acc, cats) => acc + cats.length, 0)}
            </p>
            <p className="text-xs text-muted-foreground">Categories</p>
          </CardContent>
        </Card>
        <Card className="glass">
          <CardContent className="p-4 text-center">
            <p className="text-3xl font-bold text-yellow-400">1000+</p>
            <p className="text-xs text-muted-foreground">Companies</p>
          </CardContent>
        </Card>
        <Card className="glass">
          <CardContent className="p-4 text-center">
            <p className="text-3xl font-bold text-blue-400">100%</p>
            <p className="text-xs text-muted-foreground">Free Access</p>
          </CardContent>
        </Card>
      </div>

      {/* Industry Grid */}
      <div className="space-y-6">
        {filteredIndustries.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-lg text-muted-foreground">No industries found matching &quot;{searchQuery}&quot;</p>
            <p className="text-sm text-muted-foreground mt-2">Try searching for: IT, FMCG, Healthcare, EV, etc.</p>
          </div>
        ) : (
          filteredIndustries.map(({ industry, categories, avgGrowth, categoryCount }) => (
            <Card key={industry} className="glass overflow-hidden">
              <CardContent className="p-0">
                {/* Industry Header */}
                <div className="p-6 border-b border-white/10 bg-gradient-to-r from-primary/5 to-transparent">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 rounded-xl bg-primary/20 flex items-center justify-center">
                        <Building2 className="h-6 w-6 text-primary" />
                      </div>
                      <div>
                        <h3 className="text-xl font-bold">{industry}</h3>
                        <div className="flex items-center gap-3 text-sm text-muted-foreground">
                          <span className="flex items-center gap-1">
                            <Layers className="h-4 w-4" />
                            {categoryCount} Categories
                          </span>
                          <span className="flex items-center gap-1 text-green-400">
                            <TrendingUp className="h-4 w-4" />
                            +{avgGrowth}% avg growth
                          </span>
                        </div>
                      </div>
                    </div>
                    <Button 
                      variant="ghost" 
                      onClick={() => router.push(`/analyze/${encodeURIComponent(industry)}`)}
                    >
                      Analyze Industry
                      <ArrowRight className="ml-2 h-4 w-4" />
                    </Button>
                  </div>
                </div>

                {/* Categories Grid */}
                <div className="p-6">
                  <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {categories.map((category, idx) => (
                      <div
                        key={idx}
                        onClick={() => handleCategoryClick(industry, category.name)}
                        className="group p-4 rounded-xl bg-white/5 border border-white/10 
                                 hover:border-primary/50 hover:bg-white/10 
                                 transition-all cursor-pointer"
                      >
                        <div className="flex items-start justify-between mb-2">
                          <h4 className="font-semibold group-hover:text-primary transition-colors">
                            {category.name}
                          </h4>
                          <ChevronRight className="h-4 w-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
                        </div>
                        <p className="text-xs text-muted-foreground mb-3 line-clamp-2">
                          {category.description}
                        </p>
                        <div className="flex items-center gap-3 text-xs">
                          <Badge variant="secondary" className="text-xs">
                            {category.marketShare}% share
                          </Badge>
                          <span className={`flex items-center gap-1 ${category.growthRate > 20 ? 'text-green-400' : 'text-muted-foreground'}`}>
                            <TrendingUp className="h-3 w-3" />
                            +{category.growthRate}%
                          </span>
                        </div>
                        
                        {/* Key Players Preview */}
                        <div className="mt-3 pt-3 border-t border-white/10">
                          <p className="text-xs text-muted-foreground mb-2">Key Players:</p>
                          <div className="flex flex-wrap gap-1">
                            {category.keyPlayers.slice(0, 3).map((player, pidx) => (
                              <span key={pidx} className="text-xs px-2 py-1 rounded bg-white/5 text-muted-foreground">
                                {player}
                              </span>
                            ))}
                            {category.keyPlayers.length > 3 && (
                              <span className="text-xs px-2 py-1 rounded bg-white/5 text-muted-foreground">
                                +{category.keyPlayers.length - 3}
                              </span>
                            )}
                          </div>
                        </div>

                        {/* Margin Indicator */}
                        <div className="mt-3">
                          <div className="flex justify-between text-xs mb-1">
                            <span className="text-muted-foreground">Avg Margin</span>
                            <span className="font-medium">{category.avgMargin}%</span>
                          </div>
                          <div className="h-1.5 bg-white/10 rounded-full overflow-hidden">
                            <div 
                              className="h-full bg-gradient-to-r from-primary to-primary/60 rounded-full"
                              style={{ width: `${Math.min(category.avgMargin * 2, 100)}%` }}
                            />
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>

      {/* Trending Categories Section */}
      <div className="mt-12">
        <div className="flex items-center gap-2 mb-6">
          <Sparkles className="h-5 w-5 text-yellow-400" />
          <h3 className="text-xl font-bold">🔥 Trending High-Growth Categories</h3>
        </div>
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
          {allIndustries
            .flatMap(i => i.categories.map(c => ({ ...c, industry: i.industry })))
            .filter(c => c.growthRate > 25)
            .sort((a, b) => b.growthRate - a.growthRate)
            .slice(0, 8)
            .map((category, idx) => (
              <Card 
                key={idx} 
                className="glass hover:border-green-500/50 transition-all cursor-pointer"
                onClick={() => handleCategoryClick(category.industry, category.name)}
              >
                <CardContent className="p-4">
                  <Badge className="mb-2 bg-green-500/20 text-green-400">
                    +{category.growthRate}% Growth
                  </Badge>
                  <h4 className="font-semibold mb-1">{category.name}</h4>
                  <p className="text-xs text-muted-foreground mb-2">{category.industry}</p>
                  <p className="text-xs text-muted-foreground line-clamp-2">{category.description}</p>
                </CardContent>
              </Card>
            ))}
        </div>
      </div>
    </div>
  )
}
