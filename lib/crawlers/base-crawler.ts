// lib/crawlers/base-crawler.ts
// Base interface for all data crawlers

export interface CrawlResult {
  success: boolean
  data: any
  source: string
  timestamp: Date
  error?: string
  confidence: number
}

export interface CrawlerConfig {
  timeout: number
  retries: number
  rateLimitDelay: number
  userAgent: string
}

export abstract class BaseCrawler {
  protected config: CrawlerConfig
  protected name: string

  constructor(name: string, config?: Partial<CrawlerConfig>) {
    this.name = name
    this.config = {
      timeout: config?.timeout || 10000,
      retries: config?.retries || 3,
      rateLimitDelay: config?.rateLimitDelay || 1000,
      userAgent: config?.userAgent || 'EBITA-Intelligence-Bot/1.0 (Research Purposes)'
    }
  }

  abstract crawl(query: string): Promise<CrawlResult>

  protected async fetchWithRetry(url: string, options?: RequestInit): Promise<Response> {
    let lastError: Error | null = null
    
    for (let i = 0; i < this.config.retries; i++) {
      try {
        const controller = new AbortController()
        const timeoutId = setTimeout(() => controller.abort(), this.config.timeout)
        
        const response = await fetch(url, {
          ...options,
          signal: controller.signal,
          headers: {
            'User-Agent': this.config.userAgent,
            'Accept': 'application/json',
            ...options?.headers
          }
        })
        
        clearTimeout(timeoutId)
        
        if (response.ok) {
          return response
        }
        
        throw new Error(`HTTP ${response.status}: ${response.statusText}`)
      } catch (error) {
        lastError = error as Error
        console.warn(`[${this.name}] Attempt ${i + 1} failed:`, lastError.message)
        
        if (i < this.config.retries - 1) {
          await this.delay(this.config.rateLimitDelay * (i + 1))
        }
      }
    }
    
    throw lastError || new Error('All retry attempts failed')
  }

  protected delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms))
  }

  protected createSuccessResult(data: any, confidence: number): CrawlResult {
    return {
      success: true,
      data,
      source: this.name,
      timestamp: new Date(),
      confidence
    }
  }

  protected createErrorResult(error: string): CrawlResult {
    return {
      success: false,
      data: null,
      source: this.name,
      timestamp: new Date(),
      error,
      confidence: 0
    }
  }
}

export default BaseCrawler
