'use client'

import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import { AnalysisDashboard } from '@/components/dashboard/AnalysisDashboard'
import { Button } from '@/components/ui/button'
import { ArrowLeft, Loader2 } from 'lucide-react'
import Link from 'next/link'

export default function AnalyzePage() {
  const params = useParams()
  const industry = decodeURIComponent(params.industry as string)

  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [analysis, setAnalysis] = useState<Record<string, unknown> | null>(null)
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [_rateLimit, setRateLimit] = useState<{ remaining: number; limit: number } | null>(null)

  useEffect(() => {
    async function fetchAnalysis() {
      try {
        setLoading(true)
        setError('')

        const response = await fetch('/api/analyze', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({ query: industry })
        })

        const apiData = await response.json()

        // Check for v3.0 API error format (success: false)
        if (!response.ok || apiData.success === false) {
          if (response.status === 429) {
            setError(`Rate limit exceeded. Resets on: ${new Date(apiData.resetDate).toLocaleDateString()}`)
          } else if (apiData.error) {
            setError(apiData.error)
          } else if (apiData.message) {
            setError(apiData.message)
          } else {
            setError('Failed to analyze industry')
          }
          return
        }

        // Transform v3.0 API response to match frontend expectations
        const transformedData = {
          // Keep all original v3.0 data
          ...apiData,
          
          // Add backward-compatible fields
          industry: apiData.entity?.name || industry,
          industryName: apiData.entity?.name || industry,
          entityName: apiData.entity?.name,
          entityType: 'company',
          
          // Add industry taxonomy context
          subIndustry: apiData.industryContext?.hierarchy?.subIndustry || apiData.entity?.subIndustry,
          productCategory: apiData.industryContext?.productCategory,
          industryHierarchy: apiData.industryContext?.hierarchy,
          competitorContext: apiData.industryContext?.competitorFilterContext,
          
          // Transform verdict from new format to old format (ATTRACTIVE/MODERATE/RISKY)
          verdict: (() => {
            const newVerdict = apiData.analysis?.verdict;
            const recommendation = newVerdict?.recommendation || 'INSUFFICIENT_DATA';
            const confidence = apiData.meta?.dataConfidence >= 60 ? 'HIGH' : apiData.meta?.dataConfidence >= 40 ? 'MEDIUM' : 'LOW';
            const reasoning = newVerdict?.summary || 'Analysis completed';
            
            // Map new recommendations to old ratings
            let rating = 'RISKY'; // default
            if (recommendation === 'BUY') rating = 'ATTRACTIVE';
            else if (recommendation === 'HOLD') rating = 'MODERATE';
            else if (recommendation === 'WATCH') rating = 'MODERATE';
            else if (recommendation === 'AVOID') rating = 'RISKY';
            else if (recommendation === 'INSUFFICIENT_DATA') rating = 'RISKY';
            
            return { rating, confidence, reasoning };
          })(),
          
          // Transform market size data (structure expected by VerdictCard)
          marketSize: {
            global: apiData.financials?.marketCap?.value ? `$${(apiData.financials.marketCap.value / 1000000000).toFixed(1)}B` : '$1.0B',
            india: '$100M',
            growth: '10%',
            value: {
              min: 50000,
              max: 150000,
              median: 100000
            }
          },
          
          // Transform profitability (structure expected by VerdictCard)
          profitability: {
            ebitdaRange: {
              min: 10,
              max: 25,
              median: apiData.financials?.ebitdaMargin?.value || 15
            },
            sampleSize: apiData.competitors?.length || 5
          },
          
          // Transform financials
          financials: {
            totalRevenueUSD: apiData.financials?.revenue?.value ? `$${(apiData.financials.revenue.value / 1000000000).toFixed(1)}B` : 'N/A',
            totalRevenueINR: '₹100 Cr',
            avgEBITDAMargin: apiData.financials?.ebitdaMargin?.value ? `${apiData.financials.ebitdaMargin.value.toFixed(1)}%` : '15%',
            top3MarketShare: '30%',
            totalEmployees: '10,000'
          },
          
          // Transform competitors
          competitors: apiData.competitors?.map((c: { name: string; ticker: string }) => ({
            symbol: c.ticker,
            companyName: c.name,
            ebitdaMargin: 15,
            revenue: 1.0,
            marketCap: 10.0,
            employees: 1000,
            year: 2024,
            source: 'Dataset'
          })) || [],
          
          // Keep raw data for debugging
          _raw: apiData
        }

        setAnalysis(transformedData)
        setRateLimit(apiData.rateLimit || null)
      } catch (_err) {
        setError('Failed to fetch analysis. Please try again.')
      } finally {
        setLoading(false)
      }
    }

    fetchAnalysis()
  }, [industry])

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-12 w-12 animate-spin mx-auto mb-4 text-primary" />
          <h2 className="text-xl font-semibold mb-2">Analyzing {industry}...</h2>
          <p className="text-muted-foreground">This may take up to 15 seconds</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen container mx-auto px-4 py-8">
        <Link href="/">
          <Button variant="ghost" className="mb-8">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Search
          </Button>
        </Link>

        <div className="text-center max-w-md mx-auto">
          <h2 className="text-2xl font-bold mb-4">Error</h2>
          <p className="text-muted-foreground mb-6">{error}</p>
          <Link href="/">
            <Button>Try Again</Button>
          </Link>
        </div>
      </div>
    )
  }

  return (
    <>
      {analysis && <AnalysisDashboard analysis={analysis} />}
    </>
  )
}
