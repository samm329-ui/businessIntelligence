import { supabase } from './db'
import { hashIP, getClientIP } from './utils/hash'

interface RateLimitResult {
  allowed: boolean
  remaining: number
  resetAt: Date
  used: number
  limit: number
}

/**
 * Check rate limit for user
 * Uses database (persistent across restarts)
 * 
 * @param userIdentifier - Hashed IP address
 * @param limit - Maximum requests allowed
 * @param windowDays - Time window in days
 */
export async function checkRateLimit(
  userIdentifier: string,
  limit: number = 30,
  windowDays: number = 30
): Promise<RateLimitResult> {
  
  // Calculate window start
  const windowStart = new Date()
  windowStart.setDate(windowStart.getDate() - windowDays)
  
  // Count requests in window
  const { count, error } = await supabase
    .from('api_usage')
    .select('*', { count: 'exact', head: true })
    .eq('user_identifier', userIdentifier)
    .gte('request_timestamp', windowStart.toISOString())
  
  if (error) {
    console.error('Rate limit check error:', error)
    // Fail open (allow request) on database error
    return {
      allowed: true,
      remaining: limit,
      resetAt: new Date(Date.now() + windowDays * 24 * 60 * 60 * 1000),
      used: 0,
      limit
    }
  }
  
  const used = count || 0
  const remaining = Math.max(0, limit - used)
  
  // Check if limit exceeded
  if (used >= limit) {
    // Find oldest request to calculate reset date
    const { data: oldest } = await supabase
      .from('api_usage')
      .select('request_timestamp')
      .eq('user_identifier', userIdentifier)
      .gte('request_timestamp', windowStart.toISOString())
      .order('request_timestamp', { ascending: true })
      .limit(1)
      .single()
    
    const resetAt = oldest?.request_timestamp 
      ? new Date(new Date(oldest.request_timestamp).getTime() + windowDays * 24 * 60 * 60 * 1000)
      : new Date(Date.now() + windowDays * 24 * 60 * 60 * 1000)
    
    return {
      allowed: false,
      remaining: 0,
      resetAt,
      used,
      limit
    }
  }
  
  // Allow and log request
  const { error: insertError } = await supabase
    .from('api_usage')
    .insert({
      user_identifier: userIdentifier,
      endpoint: '/analyze',
      request_timestamp: new Date().toISOString(),
      success: true,
      cache_hit: false // Will be updated later
    })
  
  if (insertError) {
    console.error('Failed to log API usage:', insertError)
  }
  
  return {
    allowed: true,
    remaining: remaining - 1,
    resetAt: new Date(Date.now() + windowDays * 24 * 60 * 60 * 1000),
    used: used + 1,
    limit
  }
}

/**
 * Get rate limit for request
 * Convenience wrapper
 */
export async function getRateLimitForRequest(
  headers: Headers
): Promise<RateLimitResult> {
  const ip = getClientIP(headers)
  const userIdentifier = hashIP(ip)
  return checkRateLimit(userIdentifier)
}
