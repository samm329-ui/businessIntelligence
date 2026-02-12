'use client'

import { useState, useEffect } from 'react'
import { Database, HardDrive, Zap, Clock, RefreshCw, AlertCircle } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'

interface CacheStatsData {
  success: boolean
  cache: {
    status: string
    ttlDays: number
    autoCleanupHours: number
    directory: string
  }
  statistics: {
    totalEntries: number
    totalSizeMB: string
    compressedSizeMB: string
    compressionRatio: string
    hitRate: string
    oldestEntry: string | null
    newestEntry: string | null
    memoryUsageMB: string
  }
  formatted: {
    totalEntries: string
    totalSize: string
    compressedSize: string
    memoryUsage: string
  }
  timestamp: string
}

export function CacheStatus() {
  const [stats, setStats] = useState<CacheStatsData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchStats = async () => {
    try {
      setLoading(true)
      const response = await fetch('/api/cache')
      if (!response.ok) throw new Error('Failed to fetch')
      const data = await response.json()
      if (data.success) {
        setStats(data)
      }
    } catch (err) {
      setError('Cache unavailable')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchStats()
    // Refresh every 60 seconds
    const interval = setInterval(fetchStats, 60000)
    return () => clearInterval(interval)
  }, [])

  if (loading) {
    return (
      <Card className="w-full max-w-md mx-auto">
        <CardContent className="p-4">
          <div className="animate-pulse flex items-center gap-2">
            <div className="w-5 h-5 rounded-full bg-gray-300"></div>
            <div className="h-4 w-32 bg-gray-300 rounded"></div>
          </div>
        </CardContent>
      </Card>
    )
  }

  if (error || !stats) {
    return null
  }

  const { statistics, formatted, cache } = stats

  return (
    <Card className="w-full max-w-lg mx-auto mb-6">
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center justify-between text-sm">
          <div className="flex items-center gap-2">
            <Database className="w-4 h-4 text-blue-500" />
            <span>7-Day Cache Status</span>
          </div>
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={fetchStats}
            className="h-6 w-6 p-0"
          >
            <RefreshCw className="w-3 h-3" />
          </Button>
        </CardTitle>
      </CardHeader>
      <CardContent className="pt-0">
        {/* Cache Stats */}
        <div className="grid grid-cols-2 gap-3 mb-4">
          <div className="flex items-center gap-2 p-2 bg-blue-50 rounded-lg">
            <HardDrive className="w-4 h-4 text-blue-600" />
            <div>
              <p className="text-lg font-bold text-gray-900">{formatted.totalEntries}</p>
              <p className="text-xs text-gray-500">Cached Entries</p>
            </div>
          </div>
          
          <div className="flex items-center gap-2 p-2 bg-green-50 rounded-lg">
            <Zap className="w-4 h-4 text-green-600" />
            <div>
              <p className="text-lg font-bold text-gray-900">{statistics.compressionRatio}</p>
              <p className="text-xs text-gray-500">Compression</p>
            </div>
          </div>
          
          <div className="flex items-center gap-2 p-2 bg-purple-50 rounded-lg">
            <Database className="w-4 h-4 text-purple-600" />
            <div>
              <p className="text-lg font-bold text-gray-900">{formatted.compressedSize}</p>
              <p className="text-xs text-gray-500">Compressed Size</p>
            </div>
          </div>
          
          <div className="flex items-center gap-2 p-2 bg-yellow-50 rounded-lg">
            <Clock className="w-4 h-4 text-yellow-600" />
            <div>
              <p className="text-lg font-bold text-gray-900">{cache.ttlDays} days</p>
              <p className="text-xs text-gray-500">Cache TTL</p>
            </div>
          </div>
        </div>

        {/* Cache Performance */}
        <div className="p-3 bg-gray-50 rounded-lg text-sm">
          <div className="flex items-center justify-between mb-2">
            <span className="text-gray-600">Hit Rate</span>
            <span className="font-medium text-green-600">{statistics.hitRate}</span>
          </div>
          <div className="flex items-center justify-between mb-2">
            <span className="text-gray-600">Memory Usage</span>
            <span className="font-medium text-gray-900">{formatted.memoryUsage}</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-gray-600">Auto Cleanup</span>
            <span className="font-medium text-gray-900">Every {cache.autoCleanupHours}h</span>
          </div>
        </div>

        {/* Entry Ages */}
        {(statistics.oldestEntry || statistics.newestEntry) && (
          <div className="mt-3 pt-3 border-t text-xs text-gray-500">
            <div className="flex items-center justify-between">
              <span>Oldest Entry</span>
              <span className="text-gray-700">
                {statistics.oldestEntry 
                  ? new Date(statistics.oldestEntry).toLocaleDateString() 
                  : 'None'}
              </span>
            </div>
            <div className="flex items-center justify-between mt-1">
              <span>Newest Entry</span>
              <span className="text-gray-700">
                {statistics.newestEntry 
                  ? new Date(statistics.newestEntry).toLocaleDateString() 
                  : 'None'}
              </span>
            </div>
          </div>
        )}

        {/* Cache Actions */}
        <div className="mt-4 pt-4 border-t flex gap-2">
          <Button 
            size="sm" 
            variant="outline"
            className="flex-1 text-xs"
            onClick={async () => {
              await fetch('/api/cache', {
                method: 'POST',
                body: JSON.stringify({ action: 'cleanup' })
              })
              fetchStats()
            }}
          >
            <RefreshCw className="w-3 h-3 mr-1" />
            Cleanup Expired
          </Button>
          <Button 
            size="sm" 
            variant="outline"
            className="flex-1 text-xs"
            onClick={async () => {
              await fetch('/api/cache', {
                method: 'POST',
                body: JSON.stringify({ action: 'clear' })
              })
              fetchStats()
            }}
          >
            <AlertCircle className="w-3 h-3 mr-1" />
            Clear All
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}

export default CacheStatus
