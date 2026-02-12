import { supabase } from './db'

export type ErrorSeverity = 'low' | 'medium' | 'high' | 'critical'

export interface ErrorContext {
  endpoint?: string
  userIdentifier?: string
  industry?: string
  [key: string]: any
}

/**
 * Log error to database
 */
export async function logError(
  error: Error | string,
  context: ErrorContext = {},
  severity: ErrorSeverity = 'medium'
): Promise<void> {
  
  const errorMessage = error instanceof Error ? error.message : error
  const stackTrace = error instanceof Error ? error.stack : undefined
  
  try {
    await supabase
      .from('error_logs')
      .insert({
        error_type: context.endpoint || 'unknown',
        error_message: errorMessage,
        stack_trace: stackTrace,
        context,
        severity,
        timestamp: new Date().toISOString(),
        resolved: false
      })
  } catch (dbError) {
    // Failed to log error to database
    // Fall back to console
    console.error('Failed to log error to database:', dbError)
    console.error('Original error:', errorMessage, stackTrace)
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
  
  // Note: Sentry integration can be added here if needed
  // For now, errors are logged to the database only
}
