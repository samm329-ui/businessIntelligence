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
          body: JSON.stringify({ industry })
        })

        const data = await response.json()

        if (!response.ok) {
          if (response.status === 429) {
            setError(`Rate limit exceeded. Resets on: ${new Date(data.resetDate).toLocaleDateString()}`)
          } else {
            setError(data.message || 'Failed to analyze industry')
          }
          return
        }

        setAnalysis(data)
        setRateLimit(data.rateLimit)
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
