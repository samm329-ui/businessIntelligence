// lib/patterns/singleton.ts
// ============================================================================
// SINGLETON PATTERN - One instance per service
// ============================================================================

export abstract class Singleton<T> {
  protected static instances: Map<string, any> = new Map()
  
  static getInstance<T>(this: new () => T): T {
    const name = this.name
    if (!Singleton.instances.has(name)) {
      Singleton.instances.set(name, new this())
    }
    return Singleton.instances.get(name)
  }
}

export class ServiceLocator {
  private static services: Map<string, any> = new Map()
  
  static register<T>(name: string, service: T): void {
    ServiceLocator.services.set(name, service)
  }
  
  static get<T>(name: string): T | null {
    return ServiceLocator.services.get(name)
  }
}

// ============================================================================
// FACTORY PATTERN - Create objects with consistent structure
// ============================================================================

export interface FactoryProduct {
  id: string
  source: string
  timestamp: Date
  data: any
}

export abstract class Factory<T> {
  abstract create(data: any): T
  
  fromCache(data: any, meta: { age: number; hitCount: number }): T {
    return this.create({ ...data, _metadata: { ...meta, source: 'cache' } })
  }
  
  fromAPI(data: any): T {
    return this.create({ ...data, _metadata: { source: 'api', timestamp: new Date() } })
  }
}

// ============================================================================
// BUILDER PATTERN - Complex object construction
// ============================================================================

export interface AnalysisConfig {
  industry?: string
  company?: string
  includeCompetitors?: boolean
  includeBenchmarks?: boolean
  includeRecommendations?: boolean
  detailLevel?: 'basic' | 'detailed' | 'comprehensive'
}

export class AnalysisBuilder {
  private config: AnalysisConfig = {
    includeCompetitors: true,
    includeBenchmarks: true,
    includeRecommendations: true,
    detailLevel: 'detailed'
  }
  
  setIndustry(industry: string): this {
    this.config.industry = industry
    return this
  }
  
  setCompany(company: string): this {
    this.config.company = company
    return this
  }
  
  excludeCompetitors(): this {
    this.config.includeCompetitors = false
    return this
  }
  
  excludeBenchmarks(): this {
    this.config.includeBenchmarks = false
    return this
  }
  
  setDetailLevel(level: 'basic' | 'detailed' | 'comprehensive'): this {
    this.config.detailLevel = level
    return this
  }
  
  build(): AnalysisConfig {
    return { ...this.config }
  }
}

// ============================================================================
// STRATEGY PATTERN - Switch algorithms at runtime
// ============================================================================

export type DataSource = 'cache' | 'csv' | 'hardcoded' | 'api'

export interface DataStrategy {
  name: string
  priority: number
  fetch<T>(key: string): Promise<T | null>
}

export class StrategySelector {
  private strategies: DataStrategy[] = []
  
  addStrategy(strategy: DataStrategy): void {
    this.strategies.push(strategy)
    this.strategies.sort((a, b) => a.priority - b.priority)
  }
  
  async execute<T>(key: string): Promise<{ data: T | null; strategy: string }> {
    for (const strategy of this.strategies) {
      const data = await strategy.fetch<T>(key)
      if (data) {
        return { data, strategy: strategy.name }
      }
    }
    return { data: null, strategy: 'none' }
  }
}

// ============================================================================
// DECORATOR PATTERN - Add functionality dynamically
// ============================================================================

export function cached<T extends (...args: any[]) => Promise<any>>(
  fn: T,
  ttlSeconds: number = 300
): (...args: Parameters<T>) => Promise<ReturnType<T>> {
  const cache = new Map<string, { result: any; expires: number }>()
  
  return async (...args: Parameters<T>) => {
    const key = JSON.stringify(args)
    const cached = cache.get(key)
    
    if (cached && Date.now() < cached.expires) {
      return cached.result
    }
    
    const result = await fn(...args)
    cache.set(key, { result, expires: Date.now() + ttlSeconds * 1000 })
    
    return result
  }
}

export function timed<T extends (...args: any[]) => Promise<any>>(
  fn: T,
  label?: string
): (...args: Parameters<T>) => Promise<ReturnType<T>> {
  return async (...args: Parameters<T>) => {
    const start = Date.now()
    const result = await fn(...args)
    const duration = Date.now() - start
    console.log(`[TIMED] ${label || fn.name}: ${duration}ms`)
    return result
  }
}

export function retry<T extends (...args: any[]) => Promise<any>>(
  fn: T,
  maxRetries: number = 3,
  delayMs: number = 1000
): (...args: Parameters<T>) => Promise<ReturnType<T>> {
  return async (...args: Parameters<T>) => {
    let lastError: Error | null = null
    
    for (let i = 0; i < maxRetries; i++) {
      try {
        return await fn(...args)
      } catch (e) {
        lastError = e as Error
        if (i < maxRetries - 1) {
          await new Promise(r => setTimeout(r, delayMs * (i + 1)))
        }
      }
    }
    
    throw lastError
  }
}

// ============================================================================
// ADAPTER PATTERN - Make incompatible interfaces work together
// ============================================================================

export class AdapterRegistry {
  private adapters: Map<string, any> = new Map()
  
  register(from: string, adapter: any): void {
    this.adapters.set(from, adapter)
  }
  
  get(from: string): any {
    return this.adapters.get(from)
  }
  
  adapt<T>(from: string, data: any): T | null {
    const adapter = this.adapters.get(from)
    if (!adapter) return null
    
    if (typeof adapter.adapt === 'function') {
      return adapter.adapt(data)
    }
    
    return adapter(data)
  }
}

// ============================================================================
// OBSERVER PATTERN - Event handling
// ============================================================================

type EventHandler = (...args: any[]) => void

export class EventEmitter {
  private events: Map<string, Set<EventHandler>> = new Map()
  
  on(event: string, handler: EventHandler): void {
    if (!this.events.has(event)) {
      this.events.set(event, new Set())
    }
    this.events.get(event)!.add(handler)
  }
  
  off(event: string, handler: EventHandler): void {
    this.events.get(event)?.delete(handler)
  }
  
  emit(event: string, ...args: any[]): void {
    this.events.get(event)?.forEach(handler => handler(...args))
  }
  
  once(event: string, handler: EventHandler): void {
    const wrapper = (...args: any[]) => {
      handler(...args)
      this.off(event, wrapper)
    }
    this.on(event, wrapper)
  }
}

// ============================================================================
// CONFIGURATION - Centralized settings
// ============================================================================

export const CONFIG = {
  // Cache
  cache: {
    ttlDays: 7,
    cleanupIntervalHours: 24,
    compressionLevel: 6,
    maxSizeMB: 500
  },
  
  // API
  api: {
    maxCallsPerRequest: 2,
    timeoutMs: 5000,
    retryAttempts: 3,
    retryDelayMs: 1000
  },
  
  // Search
  search: {
    debounceMs: 150,
    maxResults: 10,
    minQueryLength: 2,
    cacheResults: true,
    cacheTTL: 24 * 60 * 60 // 1 day
  },
  
  // Data
  data: {
    maxCompaniesPerIndustry: 50,
    maxCompetitors: 20,
    includeHistorical: false,
    benchmarkYears: [2022, 2023, 2024]
  }
}

export default CONFIG
