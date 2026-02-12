// lib/crawlers/crawler-orchestrator.ts
// Orchestrates Python Playwright crawler and manages crawled data

import { spawn } from 'child_process'
import { resolve } from 'path'
import { supabase } from '../db'

export interface CrawlRequest {
  source: 'wikipedia' | 'mca' | 'nse' | 'website'
  query: string
  validate?: boolean
}

export interface CrawlResult {
  success: boolean
  data: any
  source: string
  query: string
  crawledAt: Date
  confidence: number
  error?: string
}

export class CrawlerOrchestrator {
  private pythonScriptPath: string

  constructor() {
    // Path to Python crawler script
    this.pythonScriptPath = resolve(process.cwd(), 'scripts', 'crawler.py')
  }

  /**
   * Execute Python crawler for a single query
   */
  async crawl(request: CrawlRequest): Promise<CrawlResult> {
    console.log(`[CrawlerOrchestrator] Starting crawl: ${request.source} - ${request.query}`)

    return new Promise((resolve, reject) => {
      const pythonProcess = spawn('python', [
        this.pythonScriptPath,
        request.source,
        request.query
      ])

      let output = ''
      let errorOutput = ''

      pythonProcess.stdout.on('data', (data) => {
        output += data.toString()
      })

      pythonProcess.stderr.on('data', (data) => {
        errorOutput += data.toString()
      })

      pythonProcess.on('close', async (code) => {
        if (code !== 0) {
          console.error(`[CrawlerOrchestrator] Python process exited with code ${code}`)
          resolve({
            success: false,
            data: null,
            source: request.source,
            query: request.query,
            crawledAt: new Date(),
            confidence: 0,
            error: errorOutput || 'Process failed'
          })
          return
        }

        try {
          // Parse JSON result from output
          const result = this.extractJsonFromOutput(output)
          
          if (result.error) {
            resolve({
              success: false,
              data: null,
              source: request.source,
              query: request.query,
              crawledAt: new Date(),
              confidence: 0,
              error: result.error
            })
            return
          }

          // Calculate confidence based on data completeness
          const confidence = this.calculateConfidence(result)

          const crawlResult: CrawlResult = {
            success: true,
            data: result,
            source: request.source,
            query: request.query,
            crawledAt: new Date(),
            confidence
          }

          // Store in database
          if (request.validate !== false) {
            await this.storeCrawlResult(crawlResult)
          }

          console.log(`[CrawlerOrchestrator] ✓ Crawl successful: ${request.query} (${confidence}% confidence)`)
          resolve(crawlResult)

        } catch (parseError) {
          resolve({
            success: false,
            data: null,
            source: request.source,
            query: request.query,
            crawledAt: new Date(),
            confidence: 0,
            error: 'Failed to parse crawler output'
          })
        }
      })
    })
  }

  /**
   * Crawl multiple sources in parallel
   */
  async crawlMultiple(requests: CrawlRequest[]): Promise<CrawlResult[]> {
    console.log(`[CrawlerOrchestrator] Starting ${requests.length} parallel crawls`)
    
    const results = await Promise.all(
      requests.map(req => this.crawl(req))
    )

    const successful = results.filter(r => r.success).length
    console.log(`[CrawlerOrchestrator] ✓ Completed: ${successful}/${requests.length} successful`)

    return results
  }

  /**
   * Extract JSON from crawler output
   */
  private extractJsonFromOutput(output: string): any {
    // Find JSON between RESULT markers or at end of output
    const resultMatch = output.match(/={60}\s*CRAWLER RESULT:\s*={60}\s*(\{[\s\S]*\})/)
    
    if (resultMatch) {
      return JSON.parse(resultMatch[1])
    }

    // Try to find any JSON object
    const jsonMatch = output.match(/\{[\s\S]*\}/)
    if (jsonMatch) {
      return JSON.parse(jsonMatch[0])
    }

    throw new Error('No JSON found in output')
  }

  /**
   * Calculate confidence score based on data completeness
   */
  private calculateConfidence(data: any): number {
    let score = 50 // Base score
    
    if (data.data && Object.keys(data.data).length > 0) {
      score += 30
    }
    
    if (data.summary || data.description) {
      score += 10
    }
    
    if (data.company_name || data.name) {
      score += 10
    }

    return Math.min(score, 100)
  }

  /**
   * Store crawl result in database
   */
  private async storeCrawlResult(result: CrawlResult): Promise<void> {
    try {
      await supabase.from('crawler_results').insert({
        source: result.source,
        query: result.query,
        data: result.data,
        confidence: result.confidence,
        crawled_at: result.crawledAt.toISOString(),
        success: result.success,
        error: result.error
      })
    } catch (error) {
      console.warn('[CrawlerOrchestrator] Failed to store result:', error)
    }
  }

  /**
   * Crawl company information from multiple sources
   */
  async crawlCompanyInfo(companyName: string): Promise<CrawlResult[]> {
    const requests: CrawlRequest[] = [
      { source: 'wikipedia', query: companyName },
      { source: 'website', query: `https://www.${companyName.toLowerCase().replace(/\s+/g, '')}.com` }
    ]

    return this.crawlMultiple(requests)
  }

  /**
   * Crawl stock information
   */
  async crawlStockInfo(ticker: string): Promise<CrawlResult> {
    return this.crawl({
      source: 'nse',
      query: ticker
    })
  }
}

export const crawlerOrchestrator = new CrawlerOrchestrator()
export default crawlerOrchestrator
