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

/**
 * Clean up stale locks (older than 2 minutes)
 * Call this before acquiring a lock
 */
async function cleanupStaleLocks(): Promise<void> {
  try {
    const twoMinutesAgo = new Date(Date.now() - 2 * 60 * 1000).toISOString()
    
    // Delete completed/failed jobs older than 1 hour
    await supabase
      .from('job_locks')
      .delete()
      .in('status', ['COMPLETED', 'FAILED'])
      .lt('locked_at', new Date(Date.now() - 60 * 60 * 1000).toISOString())
    
    // Update stale processing jobs to failed
    await supabase
      .from('job_locks')
      .update({
        status: 'FAILED',
        completed_at: new Date().toISOString(),
        error: 'Job timed out (stale lock)'
      })
      .eq('status', 'PROCESSING')
      .lt('locked_at', twoMinutesAgo)
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
  
  try {
    // First, clean up any stale locks
    await cleanupStaleLocks()
    
    // Check if job already exists and is processing
    const { data: existing, error: selectError } = await supabase
      .from('job_locks')
      .select('*')
      .eq('industry_name', normalizedName)
      .in('status', ['QUEUED', 'PROCESSING'])
      .maybeSingle()
    
    if (selectError) {
      console.error('Error checking job lock:', selectError)
      // If we can't check, assume we can proceed (fail open)
      return true
    }
    
    if (existing) {
      console.log(`Job already processing for: ${normalizedName}`)
      return false
    }
    
    // Try to acquire lock - first delete any old entry for this industry
    await supabase
      .from('job_locks')
      .delete()
      .eq('industry_name', normalizedName)
    
    // Then insert new lock
    const { error: insertError } = await supabase
      .from('job_locks')
      .insert({
        industry_name: normalizedName,
        status: 'PROCESSING',
        locked_at: new Date().toISOString(),
        locked_by: workerId,
        lock_type: 'analysis'
      })
    
    if (insertError) {
      console.error('Failed to acquire job lock:', insertError)
      // If we can't lock, assume we can proceed (fail open)
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
  
  try {
    const { error: updateError } = await supabase
      .from('job_locks')
      .update({
        status,
        completed_at: new Date().toISOString(),
        result: result ? JSON.stringify(result) : null,
        error
      })
      .eq('industry_name', normalizedName)
    
    if (updateError) {
      console.error('Failed to release job lock:', updateError)
    } else {
      console.log(`Lock released for: ${normalizedName} (${status})`)
    }
  } catch (err) {
    console.error('Exception in releaseJobLock:', err)
  }
}

/**
 * Force clear all locks (useful for debugging)
 */
export async function forceClearAllLocks(): Promise<void> {
  try {
    await supabase.from('job_locks').delete().neq('id', '00000000-0000-0000-0000-000000000000')
    console.log('All locks cleared')
  } catch (error) {
    console.error('Failed to clear locks:', error)
  }
}

/**
 * Get job status
 */
export async function getJobStatus(industryName: string): Promise<JobLock | null> {
  const normalizedName = industryName.toLowerCase().trim()
  
  try {
    const { data, error } = await supabase
      .from('job_locks')
      .select('*')
      .eq('industry_name', normalizedName)
      .maybeSingle()
    
    if (error) {
      console.error('Error getting job status:', error)
      return null
    }
    
    return data
  } catch (error) {
    console.error('Exception in getJobStatus:', error)
    return null
  }
}
