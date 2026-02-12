'use client'

import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { 
  CheckCircle2, 
  XCircle, 
  AlertTriangle, 
  ArrowRight,
  TrendingUp,
  Building2,
  Users,
  DollarSign,
  Target
} from 'lucide-react'

interface VerdictCardProps {
  analysis: {
    verdict: {
      rating: string
      confidence: string
      reasoning: string
    }
    marketSize: {
      value: { min: number; max: number; median: number }
    }
    profitability: {
      ebitdaRange: { min: number; max: number; median: number }
      sampleSize: number
    }
    industry: string
  }
}

export function VerdictCard({ analysis }: VerdictCardProps) {
  const isAttractive = analysis.verdict.rating === 'ATTRACTIVE'
  const isModerate = analysis.verdict.rating === 'MODERATE'
  const isRisky = analysis.verdict.rating === 'RISKY'

  const getVerdictColor = () => {
    if (isAttractive) return 'from-green-500/20 to-emerald-500/20 border-green-500/30'
    if (isModerate) return 'from-yellow-500/20 to-orange-500/20 border-yellow-500/30'
    return 'from-red-500/20 to-pink-500/20 border-red-500/30'
  }

  const getVerdictIcon = () => {
    if (isAttractive) return <CheckCircle2 className="h-12 w-12 text-green-400" />
    if (isModerate) return <AlertTriangle className="h-12 w-12 text-yellow-400" />
    return <XCircle className="h-12 w-12 text-red-400" />
  }

  const getRecommendation = () => {
    if (isAttractive) {
      return {
        title: '✅ RECOMMENDED: Enter This Market',
        subtitle: 'Strong fundamentals indicate excellent opportunity',
        points: [
          'Market size is substantial with healthy growth',
          'Profit margins are above industry average',
          'Competitive landscape allows for new entrants',
          'Barriers to entry are manageable'
        ],
        action: 'Proceed with Market Entry',
        color: 'text-green-400'
      }
    }
    if (isModerate) {
      return {
        title: '⚠️ CAUTION: Evaluate Carefully',
        subtitle: 'Mixed signals require strategic positioning',
        points: [
          'Market is viable but competitive',
          'Profitability is decent but not exceptional',
          'Differentiation will be key to success',
          'Consider niche segments within the industry'
        ],
        action: 'Conduct Detailed Feasibility Study',
        color: 'text-yellow-400'
      }
    }
    return {
      title: '❌ NOT RECOMMENDED: High Risk',
      subtitle: 'Multiple challenges suggest avoiding entry',
      points: [
        'Market may be saturated or declining',
        'Margins are compressed or volatile',
        'High barriers to entry exist',
        'Better opportunities in other sectors'
      ],
      action: 'Explore Alternative Industries',
      color: 'text-red-400'
    }
  }

  const recommendation = getRecommendation()

  return (
    <Card className={`glass border-2 bg-gradient-to-br ${getVerdictColor()}`}>
      <CardContent className="p-6">
        <div className="flex flex-col lg:flex-row gap-6">
          {/* Left: Verdict */}
          <div className="flex-1">
            <div className="flex items-start gap-4 mb-6">
              <div className="p-3 rounded-xl bg-white/5">
                {getVerdictIcon()}
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-2">
                  <h2 className={`text-3xl font-bold ${recommendation.color}`}>
                    {analysis.verdict.rating}
                  </h2>
                  <Badge variant={isAttractive ? 'default' : isModerate ? 'secondary' : 'destructive'}>
                    {analysis.verdict.confidence} Confidence
                  </Badge>
                </div>
                <p className="text-muted-foreground">{analysis.verdict.reasoning}</p>
              </div>
            </div>

            {/* Key Metrics */}
            <div className="grid grid-cols-3 gap-4 mb-6">
              <div className="p-3 rounded-lg bg-white/5">
                <div className="flex items-center gap-2 text-muted-foreground mb-1">
                  <Building2 className="h-4 w-4" />
                  <span className="text-xs">Market Size</span>
                </div>
                <p className="text-lg font-bold">₹{(analysis.marketSize.value.median / 1000).toFixed(0)}K Cr</p>
              </div>
              <div className="p-3 rounded-lg bg-white/5">
                <div className="flex items-center gap-2 text-muted-foreground mb-1">
                  <DollarSign className="h-4 w-4" />
                  <span className="text-xs">Avg EBITDA</span>
                </div>
                <p className="text-lg font-bold">{analysis.profitability.ebitdaRange.median}%</p>
              </div>
              <div className="p-3 rounded-lg bg-white/5">
                <div className="flex items-center gap-2 text-muted-foreground mb-1">
                  <Users className="h-4 w-4" />
                  <span className="text-xs">Companies</span>
                </div>
                <p className="text-lg font-bold">{analysis.profitability.sampleSize}</p>
              </div>
            </div>
          </div>

          {/* Right: Recommendation */}
          <div className="flex-1 lg:border-l lg:border-white/10 lg:pl-6">
            <div className="flex items-center gap-2 mb-4">
              <Target className="h-5 w-5 text-primary" />
              <h3 className="text-lg font-semibold">Our Recommendation</h3>
            </div>
            
            <div className="mb-4">
              <h4 className={`text-xl font-bold mb-1 ${recommendation.color}`}>
                {recommendation.title}
              </h4>
              <p className="text-sm text-muted-foreground">{recommendation.subtitle}</p>
            </div>

            <ul className="space-y-2 mb-6">
              {recommendation.points.map((point, index) => (
                <li key={index} className="flex items-start gap-2 text-sm">
                  <ArrowRight className="h-4 w-4 text-primary mt-0.5 shrink-0" />
                  <span>{point}</span>
                </li>
              ))}
            </ul>

            <Button 
              className={`w-full ${isAttractive ? 'bg-green-600 hover:bg-green-700' : isModerate ? 'bg-yellow-600 hover:bg-yellow-700' : 'bg-red-600 hover:bg-red-700'}`}
            >
              {recommendation.action}
              <TrendingUp className="ml-2 h-4 w-4" />
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
