// lib/api/rate-limiter.ts
// API Rate Limit Tracking and Management System
// Monitors usage across all external APIs and enforces limits

export interface ApiRateLimits {
  alphaVantage: {
    dailyLimit: number
    hourlyLimit: number
    usedToday: number
    usedThisHour: number
    remainingToday: number
    remainingThisHour: number
    resetTime: Date
  }
  fmp: {
    dailyLimit: number
    hourlyLimit: number
    usedToday: number
    usedThisHour: number
    remainingToday: number
    remainingThisHour: number
    resetTime: Date
  }
  newsApi: {
    dailyLimit: number
    usedToday: number
    remainingToday: number
    resetTime: Date
  }
  groq: {
    dailyLimit: number
    usedToday: number
    remainingToday: number
    resetTime: Date
  }
}

// In-memory store for rate limits (in production, use Redis)
const rateLimitStore: Map<string, { count: number; resetTime: Date }> = new Map()

// API Configuration
const API_CONFIG = {
  alphaVantage: {
    dailyLimit: 500,
    hourlyLimit: 25, // Conservative estimate
    name: 'Alpha Vantage'
  },
  fmp: {
    dailyLimit: 250,
    hourlyLimit: 15, // Conservative estimate
    name: 'Financial Modeling Prep'
  },
  newsApi: {
    dailyLimit: 100,
    name: 'News API'
  },
  groq: {
    dailyLimit: 1440, // ~1 per minute on free tier
    name: 'Groq AI'
  }
}

class ApiRateLimiter {
  private getKey(apiName: string, period: 'day' | 'hour'): string {
    const now = new Date()
    const date = now.toISOString().split('T')[0]
    const hour = now.getHours()
    return `${apiName}:${period}:${date}${period === 'hour' ? `:${hour}` : ''}`
  }

  private getResetTime(period: 'day' | 'hour'): Date {
    const now = new Date()
    if (period === 'hour') {
      now.setHours(now.getHours() + 1, 0, 0, 0)
    } else {
      now.setDate(now.getDate() + 1)
      now.setHours(0, 0, 0, 0)
    }
    return now
  }

  // Check if we can make an API call
  canMakeCall(apiName: keyof typeof API_CONFIG): { allowed: boolean; reason?: string } {
    const config = API_CONFIG[apiName]
    
    // Check daily limit
    const dayKey = this.getKey(apiName, 'day')
    const dayData = rateLimitStore.get(dayKey)
    const dailyUsed = dayData?.count || 0
    
    if (dailyUsed >= config.dailyLimit) {
      return { 
        allowed: false, 
        reason: `${config.name} daily limit (${config.dailyLimit}) exceeded. Resets at ${dayData?.resetTime.toLocaleTimeString()}` 
      }
    }

    // Check hourly limit (if applicable)
    if ('hourlyLimit' in config) {
      const hourKey = this.getKey(apiName, 'hour')
      const hourData = rateLimitStore.get(hourKey)
      const hourlyUsed = hourData?.count || 0
      
      if (hourlyUsed >= config.hourlyLimit) {
        return { 
          allowed: false, 
          reason: `${config.name} hourly limit (${config.hourlyLimit}) exceeded. Resets at ${hourData?.resetTime.toLocaleTimeString()}` 
        }
      }
    }

    return { allowed: true }
  }

  // Record an API call
  recordCall(apiName: keyof typeof API_CONFIG): void {
    const now = new Date()
    
    // Record daily
    const dayKey = this.getKey(apiName, 'day')
    const dayData = rateLimitStore.get(dayKey)
    if (!dayData || dayData.resetTime < now) {
      rateLimitStore.set(dayKey, {
        count: 1,
        resetTime: this.getResetTime('day')
      })
    } else {
      dayData.count++
    }

    // Record hourly (if applicable)
    if ('hourlyLimit' in API_CONFIG[apiName]) {
      const hourKey = this.getKey(apiName, 'hour')
      const hourData = rateLimitStore.get(hourKey)
      if (!hourData || hourData.resetTime < now) {
        rateLimitStore.set(hourKey, {
          count: 1,
          resetTime: this.getResetTime('hour')
        })
      } else {
        hourData.count++
      }
    }
  }

  // Get current rate limit status
  getStatus(): ApiRateLimits {
    const now = new Date()
    
    const getStatusForApi = (apiName: keyof typeof API_CONFIG) => {
      const config = API_CONFIG[apiName]
      const dayKey = this.getKey(apiName, 'day')
      const dayData = rateLimitStore.get(dayKey)
      const dailyUsed = dayData?.count || 0
      
      const baseStatus = {
        dailyLimit: config.dailyLimit,
        usedToday: dailyUsed,
        remainingToday: Math.max(0, config.dailyLimit - dailyUsed),
        resetTime: dayData?.resetTime || this.getResetTime('day')
      }

      if ('hourlyLimit' in config) {
        const hourKey = this.getKey(apiName, 'hour')
        const hourData = rateLimitStore.get(hourKey)
        const hourlyUsed = hourData?.count || 0
        
        return {
          ...baseStatus,
          hourlyLimit: config.hourlyLimit,
          usedThisHour: hourlyUsed,
          remainingThisHour: Math.max(0, config.hourlyLimit - hourlyUsed)
        }
      }

      return baseStatus
    }

    return {
      alphaVantage: getStatusForApi('alphaVantage') as ApiRateLimits['alphaVantage'],
      fmp: getStatusForApi('fmp') as ApiRateLimits['fmp'],
      newsApi: getStatusForApi('newsApi') as ApiRateLimits['newsApi'],
      groq: getStatusForApi('groq') as ApiRateLimits['groq']
    }
  }

  // Calculate how many searches we can perform
  calculateSearchCapacity(): { 
    totalSearchesPossible: number
    searchesPerHour: number
    limitingFactor: string
    apiBreakdown: Record<string, number>
  } {
    const status = this.getStatus()
    
    // Each search uses approximately:
    // - 1 Alpha Vantage call (company overview)
    // - 1 FMP call (financial statements)
    // - 0.5 News API calls (industry news)
    // - 0.2 Groq calls (AI analysis)
    
    const alphaVantageCapacity = Math.floor(status.alphaVantage.remainingThisHour / 1)
    const fmpCapacity = Math.floor(status.fmp.remainingThisHour / 1)
    const newsApiCapacity = Math.floor(status.newsApi.remainingToday / 0.5)
    const groqCapacity = Math.floor(status.groq.remainingToday / 0.2)

    const capacities = {
      'Alpha Vantage': alphaVantageCapacity,
      'FMP': fmpCapacity,
      'News API': newsApiCapacity,
      'Groq AI': groqCapacity
    }

    const minCapacity = Math.min(...Object.values(capacities))
    const limitingApi = Object.entries(capacities).find(([_, cap]) => cap === minCapacity)?.[0] || 'Unknown'

    return {
      totalSearchesPossible: Math.min(
        status.alphaVantage.remainingToday,
        status.fmp.remainingToday,
        Math.floor(status.newsApi.remainingToday / 0.5),
        Math.floor(status.groq.remainingToday / 0.2)
      ),
      searchesPerHour: minCapacity,
      limitingFactor: limitingApi,
      apiBreakdown: capacities
    }
  }

  // Reset all counters (for testing)
  reset(): void {
    rateLimitStore.clear()
  }

  // Get warning message if approaching limits
  getWarning(): string | null {
    const status = this.getStatus()
    const capacity = this.calculateSearchCapacity()
    
    if (capacity.searchesPerHour < 3) {
      return `⚠️ API Rate Limit Critical: Only ${capacity.searchesPerHour} searches remaining this hour. ${capacity.limitingFactor} is the limiting factor.`
    }
    
    if (capacity.searchesPerHour < 10) {
      return `⚡ API Rate Limit Warning: ${capacity.searchesPerHour} searches remaining this hour.`
    }
    
    return null
  }
}

// Export singleton instance
export const apiRateLimiter = new ApiRateLimiter()

// Helper function to safely make API calls with rate limiting
export async function safeApiCall<T>(
  apiName: keyof typeof API_CONFIG,
  apiCall: () => Promise<T>,
  fallback: T
): Promise<{ data: T; fromCache: boolean; rateLimited: boolean }> {
  const check = apiRateLimiter.canMakeCall(apiName)
  
  if (!check.allowed) {
    console.warn(`[Rate Limiter] Blocked ${apiName}: ${check.reason}`)
    return { data: fallback, fromCache: true, rateLimited: true }
  }

  try {
    const data = await apiCall()
    apiRateLimiter.recordCall(apiName)
    return { data, fromCache: false, rateLimited: false }
  } catch (error) {
    console.error(`[Rate Limiter] API call failed for ${apiName}:`, error)
    return { data: fallback, fromCache: true, rateLimited: false }
  }
}

export default apiRateLimiter
