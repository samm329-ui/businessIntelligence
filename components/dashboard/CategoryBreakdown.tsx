'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid
} from 'recharts'
import {
  Layers,
  TrendingUp,
  DollarSign,
  Building2,
  ArrowRight,
  Sparkles,
  Target
} from 'lucide-react'
import { CategoryData } from '@/lib/fetchers/industryCategories'

interface CategoryBreakdownProps {
  categories: CategoryData[]
  industry: string
}

const COLORS = ['#3b82f6', '#22c55e', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899', '#14b8a6', '#f97316']

export function CategoryBreakdown({ categories, industry }: CategoryBreakdownProps) {
  // Prepare data for pie chart
  const pieData = categories.map((cat, index) => ({
    name: cat.name,
    value: cat.marketShare,
    color: COLORS[index % COLORS.length],
    growth: cat.growthRate,
    margin: cat.avgMargin
  }))

  // Prepare data for growth comparison
  const growthData = categories.map(cat => ({
    name: cat.name.length > 15 ? cat.name.substring(0, 15) + '...' : cat.name,
    growth: cat.growthRate,
    margin: cat.avgMargin
  })).sort((a, b) => b.growth - a.growth)

  // Get trending categories
  const trending = categories.filter(c => c.growthRate > 20).slice(0, 3)

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Layers className="h-6 w-6 text-primary" />
          <div>
            <h2 className="text-2xl font-bold">{industry} Categories</h2>
            <p className="text-muted-foreground">Segment-wise breakdown and opportunities</p>
          </div>
        </div>
        <Badge variant="outline" className="text-primary">
          {categories.length} Segments
        </Badge>
      </div>

      {/* Top Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="glass">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-2">
              <Layers className="h-4 w-4 text-blue-400" />
              <span className="text-xs text-muted-foreground">Total Segments</span>
            </div>
            <p className="text-2xl font-bold">{categories.length}</p>
          </CardContent>
        </Card>
        <Card className="glass">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-2">
              <TrendingUp className="h-4 w-4 text-green-400" />
              <span className="text-xs text-muted-foreground">Avg Growth</span>
            </div>
            <p className="text-2xl font-bold text-green-400">
              +{Math.round(categories.reduce((a, b) => a + b.growthRate, 0) / categories.length)}%
            </p>
          </CardContent>
        </Card>
        <Card className="glass">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-2">
              <DollarSign className="h-4 w-4 text-yellow-400" />
              <span className="text-xs text-muted-foreground">Avg Margin</span>
            </div>
            <p className="text-2xl font-bold text-yellow-400">
              {Math.round(categories.reduce((a, b) => a + b.avgMargin, 0) / categories.length)}%
            </p>
          </CardContent>
        </Card>
        <Card className="glass">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-2">
              <Building2 className="h-4 w-4 text-purple-400" />
              <span className="text-xs text-muted-foreground">Top Players</span>
            </div>
            <p className="text-2xl font-bold">{categories[0]?.keyPlayers.length || 0}</p>
          </CardContent>
        </Card>
      </div>

      {/* Charts Row */}
      <div className="grid lg:grid-cols-2 gap-6">
        {/* Market Share Pie Chart */}
        <Card className="glass">
          <CardHeader>
            <CardTitle className="text-lg">Market Share by Category</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={pieData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={100}
                    paddingAngle={2}
                    dataKey="value"
                  >
                    {pieData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{
                      backgroundColor: 'rgba(23, 27, 34, 0.95)',
                      border: '1px solid rgba(255,255,255,0.1)',
                      borderRadius: '8px',
                      color: '#fff'
                    }}
                    formatter={(value: number | undefined, name: string | undefined) => [`${value ?? 0}%`, name ?? '']}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="grid grid-cols-2 gap-2 mt-4">
              {pieData.map((item, index) => (
                <div key={index} className="flex items-center gap-2 text-sm">
                  <div
                    className="w-3 h-3 rounded-full"
                    style={{ backgroundColor: item.color }}
                  />
                  <span className="text-muted-foreground truncate">{item.name}</span>
                  <span className="font-medium">{item.value}%</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Growth vs Margin Comparison */}
        <Card className="glass">
          <CardHeader>
            <CardTitle className="text-lg">Growth vs Profitability</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={growthData} layout="vertical" margin={{ left: 20 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.02)" vertical={false} />
                  <XAxis type="number" stroke="rgba(255,255,255,0.5)" />
                  <YAxis
                    dataKey="name"
                    type="category"
                    stroke="rgba(255,255,255,0.5)"
                    width={100}
                    tick={{ fontSize: 11 }}
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: 'rgba(23, 27, 34, 0.95)',
                      border: '1px solid rgba(255,255,255,0.1)',
                      borderRadius: '8px',
                      color: '#fff'
                    }}
                  />
                  <Bar dataKey="growth" fill="#22c55e" name="Growth %" radius={[0, 4, 4, 0]} />
                  <Bar dataKey="margin" fill="#3b82f6" name="EBITDA %" radius={[0, 4, 4, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Trending Categories */}
      {trending.length > 0 && (
        <Card className="glass border-green-500/30 bg-green-500/5">
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-green-400" />
              🚀 Trending Categories (High Growth)
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid md:grid-cols-3 gap-4">
              {trending.map((cat, index) => (
                <div
                  key={index}
                  className="p-4 rounded-xl bg-white/5 border border-white/10 hover:border-green-500/30 transition-all"
                >
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="font-semibold">{cat.name}</h4>
                    <Badge className="bg-green-500/20 text-green-400">
                      +{cat.growthRate}%
                    </Badge>
                  </div>
                  <p className="text-xs text-muted-foreground mb-3">{cat.description}</p>
                  <div className="space-y-2">
                    <div className="flex justify-between text-xs">
                      <span className="text-muted-foreground">Market Share</span>
                      <span>{cat.marketShare}%</span>
                    </div>
                    <Progress value={cat.marketShare} className="h-1" />
                    <div className="flex justify-between text-xs">
                      <span className="text-muted-foreground">Avg Margin</span>
                      <span className="text-yellow-400">{cat.avgMargin}%</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Category Details */}
      <div className="grid gap-4">
        <h3 className="text-lg font-semibold flex items-center gap-2">
          <Target className="h-5 w-5 text-primary" />
          Category Deep Dive
        </h3>
        {categories.map((category, index) => (
          <Card key={index} className="glass hover:border-primary/30 transition-all">
            <CardContent className="p-5">
              <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <h4 className="text-lg font-semibold">{category.name}</h4>
                    <Badge variant="outline">{category.marketShare}% Share</Badge>
                    {category.growthRate > 20 && (
                      <Badge className="bg-green-500/20 text-green-400">
                        <TrendingUp className="h-3 w-3 mr-1" />
                        High Growth
                      </Badge>
                    )}
                  </div>
                  <p className="text-sm text-muted-foreground mb-3">{category.description}</p>

                  {/* Key Metrics */}
                  <div className="flex flex-wrap gap-4 text-sm">
                    <div className="flex items-center gap-2">
                      <TrendingUp className="h-4 w-4 text-green-400" />
                      <span className="text-muted-foreground">Growth:</span>
                      <span className="font-medium text-green-400">+{category.growthRate}%</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <DollarSign className="h-4 w-4 text-yellow-400" />
                      <span className="text-muted-foreground">Margin:</span>
                      <span className="font-medium text-yellow-400">{category.avgMargin}%</span>
                    </div>
                  </div>
                </div>

                {/* Key Players */}
                <div className="lg:w-1/3">
                  <p className="text-xs text-muted-foreground mb-2">Key Players:</p>
                  <div className="flex flex-wrap gap-2">
                    {category.keyPlayers.slice(0, 4).map((player, idx) => (
                      <Badge key={idx} variant="secondary" className="text-xs">
                        {player}
                      </Badge>
                    ))}
                  </div>
                </div>
              </div>

              {/* Market Share Bar */}
              <div className="mt-4 pt-4 border-t border-white/10">
                <div className="flex items-center gap-4">
                  <span className="text-xs text-muted-foreground whitespace-nowrap">Market Share</span>
                  <div className="flex-1">
                    <Progress value={category.marketShare} className="h-2" />
                  </div>
                  <span className="text-sm font-medium">{category.marketShare}%</span>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Entry Recommendation */}
      <Card className="glass border-primary/30 bg-primary/5">
        <CardContent className="p-6">
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 rounded-xl bg-primary/20 flex items-center justify-center shrink-0">
              <Target className="h-6 w-6 text-primary" />
            </div>
            <div>
              <h3 className="text-lg font-semibold mb-2">Category-Based Entry Recommendation</h3>
              <p className="text-muted-foreground mb-4">
                Based on category analysis, we recommend focusing on high-growth segments with manageable competition.
              </p>
              <div className="grid md:grid-cols-3 gap-3">
                <div className="p-3 rounded-lg bg-white/5">
                  <p className="text-xs text-muted-foreground mb-1">Best Opportunity</p>
                  <p className="font-medium text-green-400">
                    {categories.sort((a, b) => (b.growthRate * b.avgMargin) - (a.growthRate * a.avgMargin))[0]?.name}
                  </p>
                </div>
                <div className="p-3 rounded-lg bg-white/5">
                  <p className="text-xs text-muted-foreground mb-1">Highest Margin</p>
                  <p className="font-medium text-yellow-400">
                    {categories.sort((a, b) => b.avgMargin - a.avgMargin)[0]?.name}
                  </p>
                </div>
                <div className="p-3 rounded-lg bg-white/5">
                  <p className="text-xs text-muted-foreground mb-1">Fastest Growing</p>
                  <p className="font-medium text-blue-400">
                    {categories.sort((a, b) => b.growthRate - a.growthRate)[0]?.name}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
