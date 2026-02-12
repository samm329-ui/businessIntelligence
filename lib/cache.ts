import { supabase } from './db'
import { generateCacheKey } from './utils/hash'

/**
 * Get cached analysis
 * Returns null if not found or expired
 */
export async function getFromCache(
  industry: string,
  params: Record<string, any> = {}
): Promise<any | null> {
  
  const cacheKey = generateCacheKey(industry, params)
  
  const { data, error } = await supabase
    .from('analysis_cache')
    .select('*')
    .eq('cache_key', cacheKey)
    .gt('expires_at', new Date().toISOString())
    .single()
  
  if (error || !data) {
    return null
  }
  
  // Update access tracking (fire and forget)
  Promise.resolve(
    supabase
      .from('analysis_cache')
      .update({
        access_count: (data.access_count || 0) + 1,
        last_accessed: new Date().toISOString()
      })
      .eq('id', data.id)
  ).catch(err => console.error('Failed to update cache access:', err))
  
  return data.analysis_data
}

/**
 * Store analysis in cache
 */
export async function setCache(
  industry: string,
  params: Record<string, any> = {},
  data: any,
  ttlDays: number = 7
): Promise<void> {
  
  const cacheKey = generateCacheKey(industry, params)
  const expiresAt = new Date()
  expiresAt.setDate(expiresAt.getDate() + ttlDays)
  
  const sizeBytes = Buffer.byteLength(JSON.stringify(data))
  
  const { error } = await supabase
    .from('analysis_cache')
    .upsert({
      cache_key: cacheKey,
      industry_name: industry.toLowerCase().trim(),
      analysis_data: data,
      expires_at: expiresAt.toISOString(),
      size_bytes: sizeBytes,
      access_count: 0,
      version: 1
    }, {
      onConflict: 'cache_key'
    })
  
  if (error) {
    console.error('Failed to cache analysis:', error)
    // Don't throw - caching failure shouldn't break the request
  }
}

/**
 * Delete expired cache entries
 * Run this periodically (daily via GitHub Actions)
 */
export async function cleanupExpiredCache(): Promise<number> {
  const { data, error } = await supabase
    .from('analysis_cache')
    .delete()
    .lt('expires_at', new Date().toISOString())
    .select('id')
  
  if (error) {
    console.error('Cache cleanup error:', error)
    return 0
  }
  
  return data?.length || 0
}
