// lib/cache/compressed-cache.ts
// High-performance compressed cache with 7-day TTL
// Uses zlib compression and filesystem storage

import { promises as fs } from 'fs'
import { join } from 'path'
import { createHash } from 'crypto'
import * as zlib from 'zlib'

// Cache configuration
const CACHE_CONFIG = {
  directory: join(process.cwd(), '.cache'),
  ttlDays: 7,
  maxSizeMB: 500,
  cleanupIntervalHours: 24
}

// Types
export interface CacheEntry<T> {
  data: T
  metadata: {
    key: string
    createdAt: Date
    expiresAt: Date
    sizeBytes: number
    compressedSizeBytes: number
    hitCount: number
    lastAccessed: Date
  }
}

export interface CacheStats {
  totalEntries: number
  totalSizeMB: number
  compressedSizeMB: number
  hitRate: number
  oldestEntry: Date | null
  newestEntry: Date | null
  memoryUsageMB: number
}

export interface CacheResult<T> {
  data: T | null
  fromCache: boolean
  metadata: {
    age: number // seconds
    hitCount: number
    sizeBytes: number
  }
}

// In-memory index for fast lookups
const cacheIndex: Map<string, CacheEntryMetadata> = new Map()

interface CacheEntryMetadata {
  key: string
  createdAt: number // timestamp
  expiresAt: number // timestamp
  sizeBytes: number
  compressedSizeBytes: number
  hitCount: number
  lastAccessed: number // timestamp
}

class CompressedCache {
  private initialized = false
  private cleanupTimer: NodeJS.Timeout | null = null

  /**
   * Initialize cache directory and load index
   */
  async initialize(): Promise<void> {
    if (this.initialized) return

    try {
      // Create cache directory if not exists
      await fs.mkdir(CACHE_CONFIG.directory, { recursive: true })
      
      // Load existing index from disk
      await this.loadIndex()
      
      // Start periodic cleanup
      this.startCleanupTimer()
      
      this.initialized = true
      console.log(`[Cache] Initialized at ${CACHE_CONFIG.directory}`)
    } catch (error) {
      console.error('[Cache] Initialization failed:', error)
    }
  }

  /**
   * Generate cache key from query
   */
  private generateKey(query: string): string {
    const normalized = query.toLowerCase().trim().replace(/\s+/g, ' ')
    return createHash('sha256').update(normalized).digest('hex').substring(0, 16)
  }

  /**
   * Get full file path for a cache key
   */
  private getFilePath(key: string): string {
    return join(CACHE_CONFIG.directory, `${key}.cache.gz`)
  }

  /**
   * Get index file path
   */
  private getIndexPath(): string {
    return join(CACHE_CONFIG.directory, 'cache-index.json')
  }

  /**
   * Compress data using gzip
   */
  private async compress<T>(data: T): Promise<Buffer> {
    const json = JSON.stringify(data)
    const input = Buffer.from(json, 'utf-8')
    return new Promise((resolve, reject) => {
      zlib.gzip(input, (err, result) => {
        if (err) reject(err)
        else resolve(result)
      })
    })
  }

  /**
   * Decompress data using gzip
   */
  private async decompress<T>(buffer: Buffer): Promise<T> {
    return new Promise((resolve, reject) => {
      zlib.gunzip(buffer, (err, output) => {
        if (err) reject(err)
        else {
          try {
            const result = JSON.parse(output.toString('utf-8')) as T
            resolve(result)
          } catch (e) {
            reject(e)
          }
        }
      })
    })
  }

  /**
   * Store data in cache
   */
  async set<T>(query: string, data: T): Promise<void> {
    if (!this.initialized) await this.initialize()

    const key = this.generateKey(query)
    const now = Date.now()
    const expiresAt = now + (CACHE_CONFIG.ttlDays * 24 * 60 * 60 * 1000)

    try {
      // Compress the data
      const compressed = await this.compress(data)
      const compressedSize = compressed.length
      const originalSize = Buffer.byteLength(JSON.stringify(data), 'utf-8')

      // Write compressed file
      const filePath = this.getFilePath(key)
      await fs.writeFile(filePath, compressed)

      // Update index
      const metadata: CacheEntryMetadata = {
        key,
        createdAt: now,
        expiresAt,
        sizeBytes: originalSize,
        compressedSizeBytes: compressedSize,
        hitCount: 0,
        lastAccessed: now
      }

      cacheIndex.set(key, metadata)
      
      // Save index to disk
      await this.saveIndex()

      // Log compression ratio
      const ratio = originalSize > 0 ? ((1 - compressedSize / originalSize) * 100).toFixed(1) : '0'
      console.log(`[Cache] Stored "${query}" (${ratio}% compression, ${(originalSize/1024).toFixed(1)}KB → ${(compressedSize/1024).toFixed(1)}KB)`)
    } catch (error) {
      console.error('[Cache] Failed to store:', error)
    }
  }

  /**
   * Retrieve data from cache
   */
  async get<T>(query: string): Promise<CacheResult<T>> {
    if (!this.initialized) await this.initialize()

    const key = this.generateKey(query)
    const metadata = cacheIndex.get(key)

    // Cache miss
    if (!metadata) {
      return { data: null, fromCache: false, metadata: { age: 0, hitCount: 0, sizeBytes: 0 } }
    }

    // Check if expired
    if (Date.now() > metadata.expiresAt) {
      await this.delete(key)
      return { data: null, fromCache: false, metadata: { age: 0, hitCount: 0, sizeBytes: 0 } }
    }

    try {
      // Read compressed file
      const filePath = this.getFilePath(key)
      const compressed = await fs.readFile(filePath)
      
      // Decompress
      const data = await this.decompress<T>(compressed)

      // Update access stats
      metadata.hitCount++
      metadata.lastAccessed = Date.now()
      await this.saveIndex()

      const age = (Date.now() - metadata.createdAt) / 1000 // seconds

      return {
        data,
        fromCache: true,
        metadata: {
          age,
          hitCount: metadata.hitCount,
          sizeBytes: metadata.sizeBytes
        }
      }
    } catch (error) {
      console.error('[Cache] Failed to retrieve:', error)
      return { data: null, fromCache: false, metadata: { age: 0, hitCount: 0, sizeBytes: 0 } }
    }
  }

  /**
   * Check if query is cached and valid
   */
  async has(query: string): Promise<boolean> {
    if (!this.initialized) await this.initialize()

    const key = this.generateKey(query)
    const metadata = cacheIndex.get(key)

    if (!metadata) return false
    if (Date.now() > metadata.expiresAt) return false

    return true
  }

  /**
   * Delete specific cache entry
   */
  async delete(query: string): Promise<boolean> {
    const key = this.generateKey(query)

    try {
      // Delete file
      const filePath = this.getFilePath(key)
      await fs.unlink(filePath).catch(() => {})

      // Remove from index
      cacheIndex.delete(key)
      await this.saveIndex()

      return true
    } catch (error) {
      console.error('[Cache] Delete failed:', error)
      return false
    }
  }

  /**
   * Clear all cache entries
   */
  async clear(): Promise<void> {
    try {
      // Delete all cache files
      const files = await fs.readdir(CACHE_CONFIG.directory)
      const deletePromises = files
        .filter(f => f.endsWith('.cache.gz'))
        .map(f => fs.unlink(join(CACHE_CONFIG.directory, f)))

      await Promise.all(deletePromises)
      cacheIndex.clear()
      await this.saveIndex()

      console.log(`[Cache] Cleared ${files.length} entries`)
    } catch (error) {
      console.error('[Cache] Clear failed:', error)
    }
  }

  /**
   * Clean up expired entries
   */
  async cleanup(): Promise<{ deleted: number; freedMB: number }> {
    const now = Date.now()
    let deleted = 0
    let freedBytes = 0

    const keysToDelete: string[] = []
    
    for (const [key, metadata] of cacheIndex.entries()) {
      if (now > metadata.expiresAt) {
        keysToDelete.push(key)
      }
    }

    for (const key of keysToDelete) {
      try {
        const filePath = this.getFilePath(key)
        const stat = await fs.stat(filePath)
        freedBytes += stat.size
        await fs.unlink(filePath)
        cacheIndex.delete(key)
        deleted++
      } catch {
        cacheIndex.delete(key)
      }
    }

    if (deleted > 0) {
      await this.saveIndex()
      console.log(`[Cache] Cleaned up ${deleted} expired entries (${(freedBytes/1024/1024).toFixed(2)}MB freed)`)
    }

    return { deleted, freedMB: freedBytes / 1024 / 1024 }
  }

  /**
   * Get cache statistics
   */
  async getStats(): Promise<CacheStats> {
    let totalSize = 0
    let compressedSize = 0
    let hitCount = 0
    let oldestTimestamp = Infinity
    let newestTimestamp = 0

    for (const metadata of cacheIndex.values()) {
      totalSize += metadata.sizeBytes
      compressedSize += metadata.compressedSizeBytes
      hitCount += metadata.hitCount
      
      if (metadata.createdAt < oldestTimestamp) {
        oldestTimestamp = metadata.createdAt
      }
      if (metadata.createdAt > newestTimestamp) {
        newestTimestamp = metadata.createdAt
      }
    }

    // Calculate memory usage
    const memoryUsage = process.memoryUsage()
    const heapUsed = memoryUsage.heapUsed / 1024 / 1024

    return {
      totalEntries: cacheIndex.size,
      totalSizeMB: totalSize / 1024 / 1024,
      compressedSizeMB: compressedSize / 1024 / 1024,
      hitRate: hitCount > 0 ? (hitCount / (hitCount + cacheIndex.size)) * 100 : 0,
      oldestEntry: oldestTimestamp === Infinity ? null : new Date(oldestTimestamp),
      newestEntry: newestTimestamp === 0 ? null : new Date(newestTimestamp),
      memoryUsageMB: heapUsed
    }
  }

  /**
   * Get cache statistics for specific query
   */
  async getEntryStats(query: string): Promise<CacheEntryMetadata | null> {
    const key = this.generateKey(query)
    return cacheIndex.get(key) || null
  }

  /**
   * Start periodic cleanup timer
   */
  private startCleanupTimer(): void {
    if (this.cleanupTimer) {
      clearInterval(this.cleanupTimer)
    }

    this.cleanupTimer = setInterval(() => {
      this.cleanup().catch(console.error)
    }, CACHE_CONFIG.cleanupIntervalHours * 60 * 60 * 1000)

    // Run initial cleanup on start
    this.cleanup().catch(console.error)
  }

  /**
   * Save index to disk
   */
  private async saveIndex(): Promise<void> {
    try {
      const indexPath = this.getIndexPath()
      const indexData = Array.from(cacheIndex.entries()).map(([, meta]) => ({
        key: meta.key,
        createdAt: meta.createdAt,
        expiresAt: meta.expiresAt,
        sizeBytes: meta.sizeBytes,
        compressedSizeBytes: meta.compressedSizeBytes,
        hitCount: meta.hitCount,
        lastAccessed: meta.lastAccessed
      }))
      await fs.writeFile(indexPath, JSON.stringify(indexData, null, 2))
    } catch (error) {
      console.error('[Cache] Failed to save index:', error)
    }
  }

  /**
   * Load index from disk
   */
  private async loadIndex(): Promise<void> {
    try {
      const indexPath = this.getIndexPath()
      const data = await fs.readFile(indexPath, 'utf-8')
      const indexData = JSON.parse(data)
      
      cacheIndex.clear()
      let validEntries = 0

      for (const entry of indexData) {
        // Verify file still exists
        const filePath = this.getFilePath(entry.key)
        try {
          await fs.access(filePath)
          
          // Check if expired
          if (Date.now() < entry.expiresAt) {
            cacheIndex.set(entry.key, {
              key: entry.key,
              createdAt: entry.createdAt,
              expiresAt: entry.expiresAt,
              sizeBytes: entry.sizeBytes,
              compressedSizeBytes: entry.compressedSizeBytes,
              hitCount: entry.hitCount || 0,
              lastAccessed: entry.lastAccessed || entry.createdAt
            })
            validEntries++
          }
        } catch {
          // File doesn't exist, skip
        }
      }

      console.log(`[Cache] Loaded ${validEntries} valid entries from index`)
    } catch (error) {
      console.log('[Cache] No existing index found, starting fresh')
    }
  }

  /**
   * Pre-warm cache with common queries
   */
  async warmup(queries: string[]): Promise<void> {
    console.log(`[Cache] Warming up with ${queries.length} common queries...`)
    
    for (const query of queries) {
      if (!(await this.has(query))) {
        console.log(`[Cache] Pre-warming: ${query}`)
      }
    }
  }

  /**
   * Get compression statistics
   */
  async getCompressionStats(): Promise<{ ratio: number; totalOriginal: number; totalCompressed: number }> {
    let totalOriginal = 0
    let totalCompressed = 0

    for (const metadata of cacheIndex.values()) {
      totalOriginal += metadata.sizeBytes
      totalCompressed += metadata.compressedSizeBytes
    }

    const ratio = totalOriginal > 0 ? ((1 - totalCompressed / totalOriginal) * 100) : 0

    return { ratio, totalOriginal, totalCompressed }
  }
}

// Export singleton
export const compressedCache = new CompressedCache()

// Helper function to cache with automatic compression
export async function cacheSet<T>(
  query: string,
  data: T,
  cache: CompressedCache = compressedCache
): Promise<void> {
  await cache.set(query, data)
}

// Helper function to get from cache
export async function cacheGet<T>(
  query: string,
  cache: CompressedCache = compressedCache
): Promise<CacheResult<T>> {
  return cache.get<T>(query)
}

export default compressedCache
