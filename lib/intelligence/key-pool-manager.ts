/**
 * API Key Pool Manager
 * 
 * FIX 4: API Key Rotation
 * - Rate tracking per key
 * - Cooldown period
 * - Failure scoring
 * - Rotation priority (not random)
 */

export interface APIKeyStatus {
  key: string;
  name: string;
  requestsToday: number;
  failuresToday: number;
  failureRate: number;
  cooldownUntil?: Date;
  lastUsed?: Date;
  score: number; // 0-100, higher is better
}

export interface KeyPoolConfig {
  cooldownMinutes: number;
  maxFailureRate: number;
  maxRequestsPerDay: number;
  minScoreForUse: number;
}

const DEFAULT_CONFIG: KeyPoolConfig = {
  cooldownMinutes: 60,
  maxFailureRate: 0.4, // 40%
  maxRequestsPerDay: 1000,
  minScoreForUse: 30,
};

export class KeyPoolManager {
  private keys: Map<string, APIKeyStatus> = new Map();
  private config: KeyPoolConfig;
  
  constructor(config: Partial<KeyPoolConfig> = {}) {
    this.config = { ...DEFAULT_CONFIG, ...config };
    this.initializeKeys();
  }
  
  private initializeKeys(): void {
    // Financial Modeling Prep keys
    const fmpKeys = (process.env.FMP_API_KEYS || process.env.FMP_API_KEY || '').split(',').filter(k => k);
    for (let i = 0; i < fmpKeys.length; i++) {
      const key = fmpKeys[i].trim();
      if (key) {
        this.keys.set(`fmp_${i}`, {
          key,
          name: 'Financial Modeling Prep',
          requestsToday: 0,
          failuresToday: 0,
          failureRate: 0,
          score: 100,
        });
      }
    }
    
    // Twelve Data keys
    const tdKeys = (process.env.TWELVE_DATA_KEYS || process.env.TWELVE_DATA_KEY || '').split(',').filter(k => k);
    for (let i = 0; i < tdKeys.length; i++) {
      const key = tdKeys[i].trim();
      if (key) {
        this.keys.set(`td_${i}`, {
          key,
          name: 'Twelve Data',
          requestsToday: 0,
          failuresToday: 0,
          failureRate: 0,
          score: 100,
        });
      }
    }
    
    // Groq keys
    const groqKeys = (process.env.GROQ_API_KEYS || process.env.GROQ_API_KEY || '').split(',').filter(k => k);
    for (let i = 0; i < groqKeys.length; i++) {
      const key = groqKeys[i].trim();
      if (key) {
        this.keys.set(`groq_${i}`, {
          key,
          name: 'Groq',
          requestsToday: 0,
          failuresToday: 0,
          failureRate: 0,
          score: 100,
        });
      }
    }
    
    // OpenAI keys
    const openaiKeys = (process.env.OPENAI_API_KEYS || process.env.OPENAI_API_KEY || '').split(',').filter(k => k);
    for (let i = 0; i < openaiKeys.length; i++) {
      const key = openaiKeys[i].trim();
      if (key) {
        this.keys.set(`openai_${i}`, {
          key,
          name: 'OpenAI',
          requestsToday: 0,
          failuresToday: 0,
          failureRate: 0,
          score: 100,
        });
      }
    }
    
    console.log(`[KeyPool] Initialized ${this.keys.size} API keys`);
  }
  
  getKey(service: string): string | null {
    const availableKeys = Array.from(this.keys.values())
      .filter(k => k.name.toLowerCase().includes(service.toLowerCase()))
      .filter(k => !k.cooldownUntil || k.cooldownUntil < new Date())
      .filter(k => k.failureRate < this.config.maxFailureRate)
      .filter(k => k.score >= this.config.minScoreForUse)
      .filter(k => k.requestsToday < this.config.maxRequestsPerDay)
      .sort((a, b) => b.score - a.score || b.requestsToday - a.requestsToday);
    
    if (availableKeys.length === 0) {
      console.warn(`[KeyPool] No available keys for ${service}`);
      return null;
    }
    
    const selectedKey = availableKeys[0];
    selectedKey.requestsToday++;
    selectedKey.lastUsed = new Date();
    
    return selectedKey.key;
  }
  
  recordSuccess(serviceKey: string): void {
    const key = Array.from(this.keys.values()).find(k => k.key === serviceKey);
    if (key) {
      // Increase score for success
      key.score = Math.min(100, key.score + 2);
      console.log(`[KeyPool] Success recorded for ${key.name}, score: ${key.score}`);
    }
  }
  
  recordFailure(serviceKey: string): void {
    const key = Array.from(this.keys.values()).find(k => k.key === serviceKey);
    if (key) {
      key.failuresToday++;
      key.failureRate = key.failuresToday / Math.max(1, key.requestsToday);
      
      // Decrease score for failure
      key.score = Math.max(0, key.score - 10);
      
      // Apply cooldown if failure rate too high
      if (key.failureRate > this.config.maxFailureRate) {
        const cooldownUntil = new Date(Date.now() + this.config.cooldownMinutes * 60 * 1000);
        key.cooldownUntil = cooldownUntil;
        console.warn(`[KeyPool] ${key.name} key cooldown until ${cooldownUntil.toISOString()}`);
      }
      
      console.log(`[KeyPool] Failure recorded for ${key.name}, score: ${key.score}, rate: ${(key.failureRate * 100).toFixed(1)}%`);
    }
  }
  
  resetDailyCounters(): void {
    for (const key of this.keys.values()) {
      key.requestsToday = 0;
      key.failuresToday = 0;
      key.failureRate = 0;
    }
    console.log('[KeyPool] Daily counters reset');
  }
  
  getStatus(): APIKeyStatus[] {
    return Array.from(this.keys.values()).map(k => ({
      ...k,
      key: k.key.substring(0, 8) + '...', // Mask key for display
    }));
  }
  
  getStats(): { totalKeys: number; availableKeys: number; keysInCooldown: number } {
    const allKeys = Array.from(this.keys.values());
    return {
      totalKeys: allKeys.length,
      availableKeys: allKeys.filter(k => !k.cooldownUntil && k.failureRate < this.config.maxFailureRate).length,
      keysInCooldown: allKeys.filter(k => k.cooldownUntil && k.cooldownUntil > new Date()).length,
    };
  }
}

// Singleton instance
let keyPoolInstance: KeyPoolManager | null = null;

export function getKeyPool(): KeyPoolManager {
  if (!keyPoolInstance) {
    keyPoolInstance = new KeyPoolManager();
  }
  return keyPoolInstance;
}
