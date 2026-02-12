import { NextResponse } from 'next/server'
import { apiRateLimiter } from '@/lib/api/rate-limiter'

export async function GET() {
  try {
    const status = apiRateLimiter.getStatus()
    const capacity = apiRateLimiter.calculateSearchCapacity()
    const warning = apiRateLimiter.getWarning()

    return NextResponse.json({
      success: true,
      apis: status,
      capacity: {
        searchesRemainingToday: capacity.totalSearchesPossible,
        searchesRemainingThisHour: capacity.searchesPerHour,
        limitingApi: capacity.limitingFactor,
        breakdown: capacity.apiBreakdown
      },
      warning,
      timestamp: new Date().toISOString()
    })
  } catch (error) {
    console.error('Rate Limit API Error:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to fetch rate limit status' },
      { status: 500 }
    )
  }
}

// Reset rate limits (admin only - for testing)
export async function POST(request: Request) {
  try {
    const { reset } = await request.json()
    
    if (reset === true) {
      apiRateLimiter.reset()
      return NextResponse.json({
        success: true,
        message: 'Rate limits reset successfully'
      })
    }

    return NextResponse.json(
      { success: false, error: 'Invalid request' },
      { status: 400 }
    )
  } catch (error) {
    console.error('Rate Limit Reset Error:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to reset rate limits' },
      { status: 500 }
    )
  }
}
