import { NextResponse } from 'next/server'
import { compressedCache } from '@/lib/cache/compressed-cache'

export async function GET() {
  try {
    const [stats, compression] = await Promise.all([
      compressedCache.getStats(),
      compressedCache.getCompressionStats()
    ])

    // Calculate TTL info
    const ttlDays = 7
    const hoursUntilCleanup = 24

    return NextResponse.json({
      success: true,
      cache: {
        status: 'active',
        ttlDays,
        autoCleanupHours: hoursUntilCleanup,
        directory: '.cache'
      },
      statistics: {
        totalEntries: stats.totalEntries,
        totalSizeMB: stats.totalSizeMB.toFixed(2),
        compressedSizeMB: stats.compressedSizeMB.toFixed(2),
        compressionRatio: `${compression.ratio.toFixed(1)}%`,
        hitRate: `${stats.hitRate.toFixed(1)}%`,
        oldestEntry: stats.oldestEntry,
        newestEntry: stats.newestEntry,
        memoryUsageMB: stats.memoryUsageMB.toFixed(2)
      },
      formatted: {
        totalEntries: stats.totalEntries.toLocaleString(),
        totalSize: formatBytes(stats.totalSizeMB * 1024 * 1024),
        compressedSize: formatBytes(stats.compressedSizeMB * 1024 * 1024),
        memoryUsage: formatBytes(stats.memoryUsageMB * 1024 * 1024)
      },
      timestamp: new Date().toISOString()
    })
  } catch (error) {
    console.error('Cache Stats Error:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to get cache statistics' },
      { status: 500 }
    )
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { action, query } = body

    switch (action) {
      case 'clear':
        await compressedCache.clear()
        return NextResponse.json({
          success: true,
          message: 'Cache cleared successfully'
        })

      case 'delete':
        if (!query) {
          return NextResponse.json(
            { success: false, error: 'Query is required for delete action' },
            { status: 400 }
          )
        }
        const deleted = await compressedCache.delete(query)
        return NextResponse.json({
          success: true,
          message: deleted ? 'Cache entry deleted' : 'Cache entry not found',
          query
        })

      case 'cleanup':
        const result = await compressedCache.cleanup()
        return NextResponse.json({
          success: true,
          message: `Cleaned up ${result.deleted} expired entries`,
          freedMB: result.freedMB.toFixed(2)
        })

      case 'warmup':
        const commonQueries = [
          'Technology',
          'Banking',
          'Healthcare',
          'FMCG',
          'Automobile',
          'Energy',
          'TCS',
          'HDFC Bank',
          'Reliance',
          'Infosys'
        ]
        await compressedCache.warmup(commonQueries)
        return NextResponse.json({
          success: true,
          message: 'Cache warming initiated',
          queries: commonQueries
        })

      default:
        return NextResponse.json(
          { success: false, error: 'Invalid action' },
          { status: 400 }
        )
    }
  } catch (error) {
    console.error('Cache Action Error:', error)
    return NextResponse.json(
      { success: false, error: 'Cache operation failed' },
      { status: 500 }
    )
  }
}

function formatBytes(bytes: number): string {
  if (bytes === 0) return '0 Bytes'
  const k = 1024
  const sizes = ['Bytes', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
}
