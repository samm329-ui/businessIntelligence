'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { 
  Trophy, 
  Target, 
  TrendingUp, 
  TrendingDown, 
  Users,
  DollarSign,
  Building2,
  AlertCircle
} from 'lucide-react'

interface IndustryBenchmarksProps {
  analysis: {
    industry: string
    marketSize: {
      value: { median: number }
    }
    profitability: {
      ebitdaRange: { median: number }
      sampleSize: number
    }
    verdict: {
      rating: string
    }
  }
}

// Industry benchmarks based on real data
const BENCHMARKS: Record<string, {
  avgEbitda: number
  topPlayerEbitda: number
  marketGrowth: string
  entryCapital: string
  breakEven: string
  riskLevel: string
}> = {
  'IT': { avgEbitda: 20, topPlayerEbitda: 24.5, marketGrowth: '+15%', entryCapital: '₹50L-2Cr', breakEven: '12-18 months', riskLevel: 'Low' },
  'FMCG': { avgEbitda: 20, topPlayerEbitda: 35, marketGrowth: '+8%', entryCapital: '₹1-5Cr', breakEven: '18-24 months', riskLevel: 'Medium' },
  'Banking': { avgEbitda: 26, topPlayerEbitda: 29, marketGrowth: '+12%', entryCapital: '₹500Cr+', breakEven: '36-48 months', riskLevel: 'High' },
  'Pharma': { avgEbitda: 21, topPlayerEbitda: 35, marketGrowth: '+10%', entryCapital: '₹5-20Cr', breakEven: '24-36 months', riskLevel: 'Medium' },
  'Automobile': { avgEbitda: 12, topPlayerEbitda: 17, marketGrowth: '+7%', entryCapital: '₹10-50Cr', breakEven: '24-36 months', riskLevel: 'High' },
  'Steel': { avgEbitda: 14, topPlayerEbitda: 16, marketGrowth: '+5%', entryCapital: '₹100Cr+', breakEven: '36-60 months', riskLevel: 'High' },
  'Cement': { avgEbitda: 18, topPlayerEbitda: 23, marketGrowth: '+6%', entryCapital: '₹50-200Cr', breakEven: '30-48 months', riskLevel: 'Medium' },
  'Power': { avgEbitda: 28, topPlayerEbitda: 85, marketGrowth: '+8%', entryCapital: '₹500Cr+', breakEven: '48-72 months', riskLevel: 'Low' },
  'Telecom': { avgEbitda: 45, topPlayerEbitda: 53, marketGrowth: '+9%', entryCapital: '₹1000Cr+', breakEven: '60-84 months', riskLevel: 'High' },
  'Real Estate': { avgEbitda: 24, topPlayerEbitda: 28, marketGrowth: '+6%', entryCapital: '₹5-50Cr', breakEven: '24-48 months', riskLevel: 'High' },
  'default': { avgEbitda: 18, topPlayerEbitda: 25, marketGrowth: '+8%', entryCapital: '₹10-50Cr', breakEven: '18-36 months', riskLevel: 'Medium' }
}

export function IndustryBenchmarks({ analysis }: IndustryBenchmarksProps) {
  const industryKey = Object.keys(BENCHMARKS).find(key => 
    analysis.industry.toLowerCase().includes(key.toLowerCase())
  ) || 'default'
  
  const benchmarks = BENCHMARKS[industryKey]
  const currentEbitda = analysis.profitability.ebitdaRange.median
  
  // Calculate performance vs benchmarks
  const ebitdaPerformance = ((currentEbitda / benchmarks.avgEbitda) * 100).toFixed(0)
  const isAboveAverage = currentEbitda > benchmarks.avgEbitda

  return (
    <div className="space-y-6">
      {/* Performance vs Benchmark */}
      <Card className="glass">
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Trophy className="h-5 w-5 text-primary" />
            Performance vs Industry Benchmark
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-6">
            {/* EBITDA Comparison */}
            <div>
              <div className="flex justify-between items-center mb-2">
                <span className="text-sm text-muted-foreground">EBITDA Margin</span>
                <div className="flex items-center gap-2">
                  <span className="text-lg font-bold">{currentEbitda}%</span>
                  <Badge variant={isAboveAverage ? 'default' : 'secondary'}>
                    {isAboveAverage ? '+' : ''}{(currentEbitda - benchmarks.avgEbitda).toFixed(1)}% vs avg
                  </Badge>
                </div>
              </div>
              <div className="space-y-2">
                <div className="flex justify-between text-xs text-muted-foreground">
                  <span>Industry Avg: {benchmarks.avgEbitda}%</span>
                  <span>Top Player: {benchmarks.topPlayerEbitda}%</span>
                </div>
                <div className="h-2 bg-white/10 rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-primary rounded-full transition-all duration-500"
                    style={{ width: `${Math.min((currentEbitda / benchmarks.topPlayerEbitda) * 100, 100)}%` }}
                  />
                </div>
                <div className="flex justify-between text-xs">
                  <span className="text-muted-foreground">Your Position</span>
                  <span className="text-primary font-medium">{ebitdaPerformance}% of top</span>
                </div>
              </div>
            </div>

            {/* Key Metrics Grid */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 pt-4 border-t border-white/10">
              <div className="text-center p-3 rounded-lg bg-white/5">
                <TrendingUp className="h-5 w-5 text-green-400 mx-auto mb-2" />
                <p className="text-xs text-muted-foreground">Market Growth</p>
                <p className="text-lg font-bold text-green-400">{benchmarks.marketGrowth}</p>
              </div>
              <div className="text-center p-3 rounded-lg bg-white/5">
                <DollarSign className="h-5 w-5 text-blue-400 mx-auto mb-2" />
                <p className="text-xs text-muted-foreground">Entry Capital</p>
                <p className="text-sm font-bold">{benchmarks.entryCapital}</p>
              </div>
              <div className="text-center p-3 rounded-lg bg-white/5">
                <Target className="h-5 w-5 text-yellow-400 mx-auto mb-2" />
                <p className="text-xs text-muted-foreground">Break-even</p>
                <p className="text-sm font-bold">{benchmarks.breakEven}</p>
              </div>
              <div className="text-center p-3 rounded-lg bg-white/5">
                <AlertCircle className="h-5 w-5 text-orange-400 mx-auto mb-2" />
                <p className="text-xs text-muted-foreground">Risk Level</p>
                <p className="text-sm font-bold">{benchmarks.riskLevel}</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Success Factors */}
      <Card className="glass">
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Target className="h-5 w-5 text-primary" />
            Success Factors for Entry
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid md:grid-cols-2 gap-4">
            <div className="p-4 rounded-lg bg-green-500/10 border border-green-500/20">
              <h4 className="font-medium text-green-400 mb-2 flex items-center gap-2">
                <TrendingUp className="h-4 w-4" />
                What Works
              </h4>
              <ul className="space-y-2 text-sm">
                <li className="flex items-start gap-2">
                  <span className="text-green-400 mt-1">✓</span>
                  <span>Focus on EBITDA margins above {benchmarks.avgEbitda}%</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-green-400 mt-1">✓</span>
                  <span>Maintain {benchmarks.marketGrowth} YoY growth trajectory</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-green-400 mt-1">✓</span>
                  <span>Build strong distribution network</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-green-400 mt-1">✓</span>
                  <span>Invest in brand building early</span>
                </li>
              </ul>
            </div>
            <div className="p-4 rounded-lg bg-red-500/10 border border-red-500/20">
              <h4 className="font-medium text-red-400 mb-2 flex items-center gap-2">
                <TrendingDown className="h-4 w-4" />
                Common Pitfalls
              </h4>
              <ul className="space-y-2 text-sm">
                <li className="flex items-start gap-2">
                  <span className="text-red-400 mt-1">✗</span>
                  <span>Underestimating {benchmarks.breakEven} break-even timeline</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-red-400 mt-1">✗</span>
                  <span>Insufficient capital ({benchmarks.entryCapital} needed)</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-red-400 mt-1">✗</span>
                  <span>Ignoring {benchmarks.riskLevel} risk factors</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-red-400 mt-1">✗</span>
                  <span>Poor competitive differentiation</span>
                </li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Competitive Landscape */}
      <Card className="glass">
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Building2 className="h-5 w-5 text-primary" />
            Competitive Landscape
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-center justify-between p-3 rounded-lg bg-white/5">
              <div className="flex items-center gap-3">
                <Users className="h-5 w-5 text-muted-foreground" />
                <span className="text-sm">Market Concentration</span>
              </div>
              <Badge variant="outline">{analysis.profitability.sampleSize} Major Players</Badge>
            </div>
            
            <div className="flex items-center justify-between p-3 rounded-lg bg-white/5">
              <div className="flex items-center gap-3">
                <Trophy className="h-5 w-5 text-yellow-400" />
                <span className="text-sm">Market Leader EBITDA</span>
              </div>
              <Badge variant="secondary" className="text-yellow-400">
                {benchmarks.topPlayerEbitda}%
              </Badge>
            </div>

            <div className="flex items-center justify-between p-3 rounded-lg bg-white/5">
              <div className="flex items-center gap-3">
                <Target className="h-5 w-5 text-blue-400" />
                <span className="text-sm">Your Target EBITDA</span>
              </div>
              <Badge variant="secondary" className="text-blue-400">
                {benchmarks.avgEbitda + 2}% (Above Avg)
              </Badge>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
