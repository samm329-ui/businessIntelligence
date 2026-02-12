// lib/integrations/api-rotator.ts
// API rotation strategy to bypass rate limits

import { DataSourceAdapter, DataQuery } from './index'

export interface APIStatus {
  name: string
  available: boolean
  remainingCalls: number
  lastCall: Date
  errorCount: number
}

export class APIRotator {
  private sources: DataSourceAdapter[]
  private currentIndex: number
  private status: Map<string, APIStatus>
  private cooldownPeriod: number // ms

  constructor(sources: DataSourceAdapter[], cooldownPeriod: number = 60000) {
    this.sources = sources
    this.currentIndex = 0
    this.cooldownPeriod = cooldownPeriod
    this.status = new Map()

    // Initialize status
    sources.forEach(source => {
      this.status.set(source.name, {
        name: source.name,
        available: true,
        remainingCalls: source.rateLimit,
        lastCall: new Date(0),
        errorCount: 0
      })
    })
  }

  /**
   * Fetch with rotation across multiple sources
   */
  async fetchWithRotation(query: DataQuery, retries: number = 3): Promise<any> {
    const startIndex = this.currentIndex

    for (let attempt = 0; attempt < this.sources.length * retries; attempt++) {
      const source = this.sources[this.currentIndex]
      const sourceStatus = this.status.get(source.name)!

      try {
        // Skip if source is in cooldown
        if (!sourceStatus.available) {
          const timeSinceLastCall = Date.now() - sourceStatus.lastCall.getTime()
          if (timeSinceLastCall < this.cooldownPeriod) {
            console.log(`[${source.name}] In cooldown, skipping...`)
            this.rotate()
            continue
          }
          // Reset availability after cooldown
          sourceStatus.available = true
          sourceStatus.errorCount = 0
        }

        // Check rate limit
        if (sourceStatus.remainingCalls <= 0) {
          console.log(`[${source.name}] Rate limit reached, rotating...`)
          this.rotate()
          continue
        }

        // Make the call
        console.log(`[${source.name}] Fetching data...`)
        const result = await source.fetch(query)

        // Update status on success
        sourceStatus.remainingCalls--
        sourceStatus.lastCall = new Date()
        sourceStatus.errorCount = 0

        // Rotate for next call
        this.rotate()

        return {
          ...result,
          _source: source.name,
          _sourceReliability: 'HIGH'
        }

      } catch (error: any) {
        console.error(`[${source.name}] Fetch failed:`, error.message)

        // Update status on failure
        sourceStatus.errorCount++
        sourceStatus.remainingCalls = Math.max(0, sourceStatus.remainingCalls - 1)

        // Check if it's a rate limit error
        if (this.isRateLimitError(error)) {
          console.log(`[${source.name}] Rate limit hit, cooling down...`)
          sourceStatus.available = false
          sourceStatus.lastCall = new Date()
        }

        // If too many errors, mark as unavailable
        if (sourceStatus.errorCount >= 3) {
          console.log(`[${source.name}] Too many errors, marking unavailable`)
          sourceStatus.available = false
          sourceStatus.lastCall = new Date()
        }

        // Rotate to next source
        this.rotate()

        // If we've tried all sources, wait and retry
        if (this.currentIndex === startIndex) {
          console.log('All sources exhausted, waiting before retry...')
          await this.delay(1000)
        }
      }
    }

    throw new Error('All API sources exhausted after maximum retries')
  }

  /**
   * Fetch from all available sources and aggregate
   */
  async fetchFromAllAvailable(query: DataQuery): Promise<any[]> {
    const results: any[] = []

    await Promise.all(
      this.sources.map(async source => {
        const status = this.status.get(source.name)!

        if (!status.available) return

        try {
          const result = await source.fetch(query)
          status.remainingCalls--
          status.lastCall = new Date()
          status.errorCount = 0

          results.push({
            ...result,
            _source: source.name
          })
        } catch (error) {
          status.errorCount++
          if (status.errorCount >= 3) {
            status.available = false
            status.lastCall = new Date()
          }
        }
      })
    )

    return results
  }

  /**
   * Get current status of all APIs
   */
  getStatus(): APIStatus[] {
    return Array.from(this.status.values())
  }

  /**
   * Reset all sources
   */
  reset(): void {
    this.status.forEach(status => {
      status.available = true
      status.remainingCalls = this.sources.find(s => s.name === status.name)?.rateLimit || 0
      status.errorCount = 0
    })
    this.currentIndex = 0
  }

  /**
   * Rotate to next source
   */
  private rotate(): void {
    this.currentIndex = (this.currentIndex + 1) % this.sources.length
  }

  /**
   * Check if error is rate limit related
   */
  private isRateLimitError(error: any): boolean {
    const rateLimitIndicators = [
      'rate limit',
      'too many requests',
      '429',
      'quota exceeded',
      'limit exceeded'
    ]

    const errorMessage = error?.message?.toLowerCase() || ''
    return rateLimitIndicators.some(indicator => errorMessage.includes(indicator))
  }

  /**
   * Delay helper
   */
  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms))
  }
}

// Pre-configured rotators for different regions
export const indiaAPIRotator = new APIRotator([
  // These would be actual adapter instances
  { name: 'NSE', rateLimit: 100, fetch: async () => ({}), isAvailable: async () => true },
  { name: 'BSE', rateLimit: 100, fetch: async () => ({}), isAvailable: async () => true },
  { name: 'Screener', rateLimit: 50, fetch: async () => ({}), isAvailable: async () => true }
] as DataSourceAdapter[])

export const globalAPIRotator = new APIRotator([
  { name: 'Yahoo Finance', rateLimit: 2000, fetch: async () => ({}), isAvailable: async () => true },
  { name: 'Alpha Vantage', rateLimit: 5, fetch: async () => ({}), isAvailable: async () => true },
  { name: 'FMP', rateLimit: 10, fetch: async () => ({}), isAvailable: async () => true }
] as DataSourceAdapter[], 60000) // 1 minute cooldown

export default APIRotator
