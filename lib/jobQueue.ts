import { supabase } from './db'

export type JobStatus = 'QUEUED' | 'PROCESSING' | 'COMPLETED' | 'FAILED'

interface JobLock {
  id: string
  industry_name: string
  status: JobStatus
  locked_at: string
  locked_by?: string
  result?: any
  error?: string
}

// In-memory fallback for job locks (if database unavailable)
const memoryLocks = new Map<string, JobLock>()

/**
 * Clean up stale locks (older than 2 minutes)
 * Call this before acquiring a lock
 */
async function cleanupStaleLocks(): Promise<void> {
  try {
    const twoMinutesAgo = new Date(Date.now() - 2 * 60 * 1000).toISOString()
    
    // Delete completed/failed jobs older than 1 hour
    await supabase
      .from('intelligence_cache')
      .delete()
      .eq('cache_layer', 'job_lock')
      .lt('last_accessed_at', new Date(Date.now() - 60 * 60 * 1000).toISOString())
    
    // Note: Cannot update stale processing jobs in intelligence_cache easily
    // Using memory fallback instead
  } catch (error) {
    console.error('Cleanup stale locks error:', error)
  }
}

/**
 * Acquire job lock
 * Returns true if lock acquired, false if already processing
 */
export async function acquireJobLock(
  industryName: string,
  workerId: string = 'default'
): Promise<boolean> {
  
  const normalizedName = industryName.toLowerCase().trim()
  const lockKey = `job_lock_${normalizedName}`
  
  try {
    // First, clean up any stale locks
    await cleanupStaleLocks()
    
    // Check if job already exists and is processing
    const { data: existing, error: selectError } = await supabase
      .from('intelligence_cache')
      .select('*')
      .eq('cache_key', lockKey)
      .eq('cache_layer', 'job_lock')
      .gt('expires_at', new Date().toISOString())
      .maybeSingle()
    
    if (selectError) {
      console.error('Error checking job lock:', selectError)
      // Fall back to memory
      if (memoryLocks.has(normalizedName)) {
        const memLock = memoryLocks.get(normalizedName)!
        if (memLock.status === 'PROCESSING' || memLock.status === 'QUEUED') {
          return false
        }
      }
      memoryLocks.set(normalizedName, {
        id: `mem_${Date.now()}`,
        industry_name: normalizedName,
        status: 'PROCESSING',
        locked_at: new Date().toISOString(),
        locked_by: workerId
      })
      return true
    }
    
    if (existing) {
      console.log(`Job already processing for: ${normalizedName}`)
      return false
    }
    
    // Try to acquire lock
    const expiresAt = new Date()
    expiresAt.setMinutes(expiresAt.getMinutes() + 10) // 10 minute lock
    
    const { error: insertError } = await supabase
      .from('intelligence_cache')
      .upsert({
        cache_key: lockKey,
        cache_layer: 'job_lock',
        entity_name: normalizedName,
        cache_data: {
          status: 'PROCESSING',
          locked_by: workerId
        },
        expires_at: expiresAt.toISOString(),
        ttl_seconds: 600,
        hit_count: 0
      }, {
        onConflict: 'cache_key'
      })
    
    if (insertError) {
      console.error('Failed to acquire job lock:', insertError)
      // Fall back to memory
      memoryLocks.set(normalizedName, {
        id: `mem_${Date.now()}`,
        industry_name: normalizedName,
        status: 'PROCESSING',
        locked_at: new Date().toISOString(),
        locked_by: workerId
      })
      return true
    }
    
    console.log(`Lock acquired for: ${normalizedName}`)
    return true
  } catch (error) {
    console.error('Exception in acquireJobLock:', error)
    // Fail open - allow processing if lock system fails
    return true
  }
}

/**
 * Release job lock
 */
export async function releaseJobLock(
  industryName: string,
  status: 'COMPLETED' | 'FAILED',
  result?: any,
  error?: string
): Promise<void> {
  
  const normalizedName = industryName.toLowerCase().trim()
  const lockKey = `job_lock_${normalizedName}`
  
  try {
    const { error: updateError } = await supabase
      .from('intelligence_cache')
      .update({
        cache_data: {
          status,
          result,
          error,
          completed_at: new Date().toISOString()
        }
      })
      .eq('cache_key', lockKey)
      .eq('cache_layer', 'job_lock')
    
    if (updateError) {
      console.error('Failed to release job lock:', updateError)
    } else {
      console.log(`Lock released for: ${normalizedName} (${status})`)
    }
    
    // Also clear memory lock
    memoryLocks.delete(normalizedName)
  } catch (err) {
    console.error('Exception in releaseJobLock:', err)
    memoryLocks.delete(normalizedName)
  }
}

/**
 * Force clear all locks (useful for debugging)
 */
export async function forceClearAllLocks(): Promise<void> {
  try {
    await supabase
      .from('intelligence_cache')
      .delete()
      .eq('cache_layer', 'job_lock')
    memoryLocks.clear()
    console.log('All locks cleared')
  } catch (error) {
    console.error('Failed to clear locks:', error)
    memoryLocks.clear()
  }
}

/**
 * Get job status
 */
export async function getJobStatus(industryName: string): Promise<JobLock | null> {
  const normalizedName = industryName.toLowerCase().trim()
  const lockKey = `job_lock_${normalizedName}`
  
  try {
    const { data, error } = await supabase
      .from('intelligence_cache')
      .select('*')
      .eq('cache_key', lockKey)
      .eq('cache_layer', 'job_lock')
      .maybeSingle()
    
    if (error) {
      console.error('Error getting job status:', error)
      // Fall back to memory
      return memoryLocks.get(normalizedName) || null
    }
    
    if (!data) {
      return memoryLocks.get(normalizedName) || null
    }
    
    return {
      id: data.id,
      industry_name: normalizedName,
      status: data.cache_data?.status || 'UNKNOWN',
      locked_at: data.created_at,
      locked_by: data.cache_data?.locked_by,
      result: data.cache_data?.result,
      error: data.cache_data?.error
    }
  } catch (error) {
    console.error('Exception in getJobStatus:', error)
    return memoryLocks.get(normalizedName) || null
  }
}
