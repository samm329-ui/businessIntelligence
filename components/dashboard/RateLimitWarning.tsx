'use client'

import { useState, useEffect } from 'react'
import { AlertTriangle, Zap, CheckCircle, RefreshCw } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'

interface RateLimitStatus {
  apis: {
    alphaVantage: {
      dailyLimit: number
      hourlyLimit: number
      remainingToday: number
      remainingThisHour: number
    }
    fmp: {
      dailyLimit: number
      hourlyLimit: number
      remainingToday: number
      remainingThisHour: number
    }
    newsApi: {
      dailyLimit: number
      remainingToday: number
    }
    groq: {
      dailyLimit: number
      remainingToday: number
    }
  }
  capacity: {
    searchesRemainingToday: number
    searchesRemainingThisHour: number
    limitingApi: string
    breakdown: Record<string, number>
  }
  warning: string | null
}

export function RateLimitWarning() {
  const [status, setStatus] = useState<RateLimitStatus | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchStatus = async () => {
    try {
      setLoading(true)
      const response = await fetch('/api/rate-limits')
      if (!response.ok) throw new Error('Failed to fetch')
      const data = await response.json()
      if (data.success) {
        setStatus(data)
      }
    } catch (err) {
      setError('Unable to check API limits')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchStatus()
    // Refresh every 30 seconds
    const interval = setInterval(fetchStatus, 30000)
    return () => clearInterval(interval)
  }, [])

  if (loading) {
    return (
      <Card className="w-full max-w-md mx-auto mb-6 animate-pulse">
        <CardContent className="p-4">
          <div className="flex items-center gap-2">
            <div className="w-5 h-5 rounded-full bg-gray-300"></div>
            <div className="h-4 w-48 bg-gray-300 rounded"></div>
          </div>
        </CardContent>
      </Card>
    )
  }

  if (error || !status) {
    return null // Silently fail - don't show error to users
  }

  const { capacity, warning, apis } = status
  const searchesPerHour = capacity.searchesRemainingThisHour

  // Determine status color and icon
  let StatusIcon = CheckCircle
  let statusColor = 'text-green-500'
  let bgColor = 'bg-green-50 border-green-200'
  let statusText = 'API Status: Good'

  if (searchesPerHour < 3) {
    StatusIcon = AlertTriangle
    statusColor = 'text-red-500'
    bgColor = 'bg-red-50 border-red-200'
    statusText = 'API Rate Limit Critical'
  } else if (searchesPerHour < 10) {
    StatusIcon = Zap
    statusColor = 'text-yellow-500'
    bgColor = 'bg-yellow-50 border-yellow-200'
    statusText = 'API Rate Limit Warning'
  }

  return (
    <Card className={`w-full max-w-2xl mx-auto mb-6 border-2 ${bgColor}`}>
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center justify-between text-sm">
          <div className="flex items-center gap-2">
            <StatusIcon className={`w-5 h-5 ${statusColor}`} />
            <span className={statusColor}>{statusText}</span>
          </div>
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={fetchStatus}
            className="h-8 w-8 p-0"
          >
            <RefreshCw className="w-4 h-4" />
          </Button>
        </CardTitle>
      </CardHeader>
      <CardContent className="pt-0">
        {/* Main Stats */}
        <div className="grid grid-cols-2 gap-4 mb-4">
          <div className="text-center p-3 bg-white rounded-lg border">
            <p className="text-2xl font-bold text-gray-900">{searchesPerHour}</p>
            <p className="text-xs text-gray-500">Searches This Hour</p>
          </div>
          <div className="text-center p-3 bg-white rounded-lg border">
            <p className="text-2xl font-bold text-gray-900">{capacity.searchesRemainingToday}</p>
            <p className="text-xs text-gray-500">Searches Today</p>
          </div>
        </div>

        {/* Warning Message */}
        {warning && (
          <div className="mb-4 p-3 bg-red-100 border border-red-300 rounded-lg text-sm text-red-800">
            {warning}
          </div>
        )}

        {/* API Breakdown */}
        <div className="space-y-2 text-sm">
          <p className="font-medium text-gray-700">API Breakdown (calls remaining):</p>
          <div className="grid grid-cols-2 gap-2">
            <div className="flex justify-between p-2 bg-white rounded border">
              <span>Alpha Vantage</span>
              <span className="font-medium">{apis.alphaVantage.remainingThisHour}/{apis.alphaVantage.hourlyLimit}/hr</span>
            </div>
            <div className="flex justify-between p-2 bg-white rounded border">
              <span>FMP</span>
              <span className="font-medium">{apis.fmp.remainingThisHour}/{apis.fmp.hourlyLimit}/hr</span>
            </div>
            <div className="flex justify-between p-2 bg-white rounded border">
              <span>News API</span>
              <span className="font-medium">{apis.newsApi.remainingToday}/{apis.newsApi.dailyLimit}/day</span>
            </div>
            <div className="flex justify-between p-2 bg-white rounded border">
              <span>Groq AI</span>
              <span className="font-medium">{apis.groq.remainingToday}/{apis.groq.dailyLimit}/day</span>
            </div>
          </div>
        </div>

        {/* Limiting Factor */}
        <div className="mt-4 p-2 bg-blue-50 rounded border border-blue-200 text-xs text-blue-800">
          <span className="font-medium">Current limiting factor:</span> {capacity.limitingApi} is limiting searches to {searchesPerHour}/hour
        </div>

        {/* Info */}
        <div className="mt-3 text-xs text-gray-500 text-center">
          Each search uses ~3 API calls. Using cached data when APIs are rate-limited.
        </div>
      </CardContent>
    </Card>
  )
}

export default RateLimitWarning
