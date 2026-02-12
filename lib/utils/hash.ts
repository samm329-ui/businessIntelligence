import crypto from 'crypto'

/**
 * Generate SHA256 hash of input
 * Used for cache keys and IP hashing
 */
export function sha256(input: string): string {
  return crypto.createHash('sha256').update(input).digest('hex')
}

/**
 * Generate cache key for industry analysis
 * Ensures consistency by sorting parameters
 */
export function generateCacheKey(
  industry: string,
  params: Record<string, any> = {}
): string {
  // Normalize industry name
  const normalizedIndustry = industry.toLowerCase().trim()
  
  // Sort params for consistency
  const sortedParams = Object.keys(params)
    .sort()
    .reduce((acc, key) => {
      acc[key] = params[key]
      return acc
    }, {} as Record<string, any>)
  
  // Create deterministic JSON string
  const payload = JSON.stringify({
    industry: normalizedIndustry,
    ...sortedParams
  })
  
  return sha256(payload)
}

/**
 * Hash IP address for privacy
 * Use this for rate limiting
 */
export function hashIP(ip: string): string {
  return sha256(ip)
}

/**
 * Get client IP from request headers
 * Works with Vercel, Cloudflare, and other proxies
 */
export function getClientIP(headers: Headers): string {
  // Try Vercel's header first
  const forwardedFor = headers.get('x-forwarded-for')
  if (forwardedFor) {
    return forwardedFor.split(',')[0].trim()
  }
  
  // Try Cloudflare
  const cfConnectingIP = headers.get('cf-connecting-ip')
  if (cfConnectingIP) {
    return cfConnectingIP
  }
  
  // Fallback to real IP
  const realIP = headers.get('x-real-ip')
  if (realIP) {
    return realIP
  }
  
  // Default (shouldn't reach here in production)
  return 'unknown'
}
