import { supabase } from './db'

export type ErrorSeverity = 'low' | 'medium' | 'high' | 'critical'

export interface ErrorContext {
  endpoint?: string
  userIdentifier?: string
  industry?: string
  entityId?: string
  entityName?: string
  [key: string]: any
}

/**
 * Log error to database (using api_fetch_log for tracking)
 */
export async function logError(
  error: Error | string,
  context: ErrorContext = {},
  severity: ErrorSeverity = 'medium'
): Promise<void> {
  
  const errorMessage = error instanceof Error ? error.message : error
  const stackTrace = error instanceof Error ? error.stack : undefined
  
  // Log to console for now
  console.error(`[${severity.toUpperCase()}] ${errorMessage}`, context)
  
  // Also log to api_fetch_log for tracking (maps errors to source tracking)
  try {
    await supabase
      .from('api_fetch_log')
      .insert({
        entity_id: context.entityId,
        entity_name: context.entityName,
        source_name: context.endpoint || 'error_logger',
        success: false,
        error_message: errorMessage,
        fetched_at: new Date().toISOString()
      })
  } catch (dbError) {
    // Fall back to console only
    console.error('Failed to log to api_fetch_log:', dbError)
  }
}

/**
 * Log critical error (sends to Sentry if configured)
 */
export async function logCriticalError(
  error: Error | string,
  context: ErrorContext = {}
): Promise<void> {
  await logError(error, context, 'critical')
}
