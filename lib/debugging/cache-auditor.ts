/**
 * Cache Auditor - Cache Behavior Monitoring and Validation
 * 
 * This module ensures:
 * - Cache expiry is enforced
 * - Cache freshness is validated
 * - Real-time data overrides stale cache
 * - Cache transparency in output
 */

import * as fs from 'fs';
import * as path from 'path';

export interface CacheEntry {
  entity: string;
  data: any;
  timestamp: string;
  expiryHours: number;
  source: string;
  isStale: boolean;
}

export interface CacheAuditResult {
  entity: string;
  cacheExists: boolean;
  cacheAge: number; // hours
  isStale: boolean;
  shouldUseCache: boolean;
  reason: string;
  lastUpdated: string | null;
}

const CACHE_DIR = path.resolve(process.cwd(), 'data', 'cache');
const DEFAULT_EXPIRY_HOURS = parseInt(process.env.CACHE_DURATION_HOURS || '24');

export class CacheAuditor {
  private auditLog: CacheAuditResult[] = [];

  constructor() {
    this.ensureCacheDir();
  }

  private ensureCacheDir(): void {
    if (!fs.existsSync(CACHE_DIR)) {
      fs.mkdirSync(CACHE_DIR, { recursive: true });
    }
  }

  getCacheFilePath(entity: string): string {
    const normalized = entity.toLowerCase().replace(/[^a-z0-9]/g, '_');
    return path.join(CACHE_DIR, `${normalized}_cache.json`);
  }

  auditCache(entity: string, forceRealtime: boolean = false): CacheAuditResult {
    const cacheFile = this.getCacheFilePath(entity);
    const now = new Date();

    // Check if cache exists
    if (!fs.existsSync(cacheFile)) {
      const result: CacheAuditResult = {
        entity,
        cacheExists: false,
        cacheAge: 0,
        isStale: true,
        shouldUseCache: false,
        reason: 'No cache exists',
        lastUpdated: null,
      };
      this.auditLog.push(result);
      return result;
    }

    // Read cache
    let cache: CacheEntry;
    try {
      const content = fs.readFileSync(cacheFile, 'utf-8');
      cache = JSON.parse(content);
    } catch (error) {
      const result: CacheAuditResult = {
        entity,
        cacheExists: true,
        cacheAge: 0,
        isStale: true,
        shouldUseCache: false,
        reason: 'Cache file corrupted',
        lastUpdated: null,
      };
      this.auditLog.push(result);
      return result;
    }

    // Calculate cache age
    const cacheTime = new Date(cache.timestamp);
    const ageMs = now.getTime() - cacheTime.getTime();
    const ageHours = ageMs / (1000 * 60 * 60);

    // Determine if stale
    const isStale = ageHours > cache.expiryHours;

    // Determine if should use cache
    let shouldUseCache = !isStale && !forceRealtime;
    let reason = isStale ? 'Cache expired' : 'Cache valid';

    if (forceRealtime) {
      shouldUseCache = false;
      reason = 'Realtime priority mode enabled';
    }

    const result: CacheAuditResult = {
      entity,
      cacheExists: true,
      cacheAge: ageHours,
      isStale,
      shouldUseCache,
      reason,
      lastUpdated: cache.timestamp,
    };

    this.auditLog.push(result);

    console.log(`[CacheAuditor] ${entity}: ${result.cacheExists ? 'EXISTS' : 'MISS'} | Age: ${ageHours.toFixed(1)}h | ${result.shouldUseCache ? 'USE' : 'FETCH'} | ${result.reason}`);

    return result;
  }

  writeCache(entity: string, data: any, expiryHours: number = DEFAULT_EXPIRY_HOURS): void {
    const cacheFile = this.getCacheFilePath(entity);
    
    const cache: CacheEntry = {
      entity,
      data,
      timestamp: new Date().toISOString(),
      expiryHours,
      source: 'api_realtime',
      isStale: false,
    };

    try {
      fs.writeFileSync(cacheFile, JSON.stringify(cache, null, 2));
      console.log(`[CacheAuditor] Cached ${entity} (expires in ${expiryHours}h)`);
    } catch (error) {
      console.error(`[CacheAuditor] Failed to cache ${entity}:`, error);
    }
  }

  invalidateCache(entity: string): void {
    const cacheFile = this.getCacheFilePath(entity);
    if (fs.existsSync(cacheFile)) {
      try {
        fs.unlinkSync(cacheFile);
        console.log(`[CacheAuditor] Invalidated cache for ${entity}`);
      } catch (error) {
        console.error(`[CacheAuditor] Failed to invalidate cache for ${entity}:`, error);
      }
    }
  }

  getStaleCaches(): string[] {
    const staleCaches: string[] = [];
    
    if (!fs.existsSync(CACHE_DIR)) return staleCaches;

    const files = fs.readdirSync(CACHE_DIR);
    const now = new Date();

    for (const file of files) {
      if (!file.endsWith('_cache.json')) continue;

      try {
        const content = fs.readFileSync(path.join(CACHE_DIR, file), 'utf-8');
        const cache: CacheEntry = JSON.parse(content);
        
        const cacheTime = new Date(cache.timestamp);
        const ageHours = (now.getTime() - cacheTime.getTime()) / (1000 * 60 * 60);

        if (ageHours > cache.expiryHours) {
          staleCaches.push(cache.entity);
        }
      } catch (error) {
        // Ignore corrupted files
      }
    }

    return staleCaches;
  }

  cleanupStaleCaches(): number {
    const staleCaches = this.getStaleCaches();
    
    for (const entity of staleCaches) {
      this.invalidateCache(entity);
    }

    console.log(`[CacheAuditor] Cleaned up ${staleCaches.length} stale caches`);
    return staleCaches.length;
  }

  getCacheTransparency(entity: string): { source: string; timestamp: string; freshness: string } | null {
    const audit = this.auditCache(entity);
    
    if (!audit.cacheExists) {
      return null;
    }

    const freshness = audit.isStale 
      ? `Stale (${audit.cacheAge.toFixed(1)}h old)` 
      : `Fresh (${audit.cacheAge.toFixed(1)}h old)`;

    return {
      source: audit.shouldUseCache ? 'cache' : 'realtime',
      timestamp: audit.lastUpdated || '',
      freshness,
    };
  }

  generateAuditReport(): string {
    const total = this.auditLog.length;
    const cacheHits = this.auditLog.filter(a => a.shouldUseCache).length;
    const cacheMisses = total - cacheHits;
    const staleCaches = this.auditLog.filter(a => a.isStale).length;

    return `
=== Cache Audit Report ===
Total Audits: ${total}
Cache Hits: ${cacheHits} (${((cacheHits/total)*100).toFixed(1)}%)
Cache Misses: ${cacheMisses} (${((cacheMisses/total)*100).toFixed(1)}%)
Stale Caches: ${staleCaches}
Average Cache Age: ${(this.auditLog.reduce((sum, a) => sum + a.cacheAge, 0) / total).toFixed(1)}h
    `.trim();
  }
}

// Singleton instance
export const cacheAuditor = new CacheAuditor();

export default CacheAuditor;
