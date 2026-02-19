import { supabase } from './db'

export type ErrorSeverity = 'low' | 'medium' | 'high' | 'critical'

export interface ErrorContext {
  endpoint?: string
  userIdentifier?: string
  industry?: string
  entityId?: string
  entityName?: string
  component?: string
  operation?: string
  metadata?: Record<string, any>
  [key: string]: any
}

/**
 * Structured error log entry
 */
interface ErrorLogEntry {
  timestamp: string
  severity: ErrorSeverity
  message: string
  stack?: string
  context: ErrorContext
  requestId?: string
}

// In-memory buffer for batching error logs
const errorBuffer: ErrorLogEntry[] = []
const BUFFER_FLUSH_SIZE = 10
const BUFFER_FLUSH_INTERVAL_MS = 30000 // 30 seconds

let flushInterval: NodeJS.Timeout | null = null

/**
 * Initialize error logger with periodic flush
 */
function initErrorLogger(): void {
  if (flushInterval) return
  
  flushInterval = setInterval(() => {
    if (errorBuffer.length > 0) {
      flushErrors()
    }
  }, BUFFER_FLUSH_INTERVAL_MS)
}

/**
 * Flush buffered errors to database
 */
async function flushErrors(): Promise<void> {
  if (errorBuffer.length === 0) return
  
  const errorsToFlush = [...errorBuffer]
  errorBuffer.length = 0 // Clear buffer
  
  try {
    // Log to api_fetch_log for tracking
    const logEntries = errorsToFlush.map(err => ({
      entity_id: err.context.entityId,
      entity_name: err.context.entityName,
      source_name: err.context.component || 'error_logger',
      success: false,
      error_message: `${err.severity.toUpperCase()}: ${err.message}`,
      fetched_at: err.timestamp,
      metadata: {
        stack: err.stack,
        operation: err.context.operation,
        endpoint: err.context.endpoint,
        ...err.context.metadata
      }
    }))
    
    await supabase.from('api_fetch_log').insert(logEntries)
    
    // Also log to dedicated error_logs table if it exists
    try {
      await supabase.from('error_logs').insert(errorsToFlush.map(err => ({
        timestamp: err.timestamp,
        severity: err.severity,
        message: err.message,
        stack_trace: err.stack,
        component: err.context.component || 'unknown',
        operation: err.context.operation,
        entity_id: err.context.entityId,
        entity_name: err.context.entityName,
        endpoint: err.context.endpoint,
        metadata: err.context.metadata || {}
      })))
    } catch {
      // error_logs table may not exist, that's ok
    }
  } catch (dbError) {
    // Fall back to console
    console.error('[ErrorLogger] Failed to flush errors to database:', dbError)
    errorsToFlush.forEach(err => console.error(`[${err.severity.toUpperCase()}] ${err.message}`, err.context))
  }
}

/**
 * Log error to database (using api_fetch_log for tracking)
 * Buffers errors and flushes in batches for performance
 */
export async function logError(
  error: Error | string,
  context: ErrorContext = {},
  severity: ErrorSeverity = 'medium'
): Promise<void> {
  
  initErrorLogger()
  
  const errorMessage = error instanceof Error ? error.message : error
  const stackTrace = error instanceof Error ? error.stack : undefined
  
  const entry: ErrorLogEntry = {
    timestamp: new Date().toISOString(),
    severity,
    message: errorMessage,
    stack: stackTrace,
    context,
    requestId: context.requestId || `req_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`
  }
  
  // Add to buffer
  errorBuffer.push(entry)
  
  // Log to console immediately for debugging
  console.error(`[${severity.toUpperCase()}] ${errorMessage}`, context)
  
  // Flush immediately for critical errors
  if (severity === 'critical') {
    await flushErrors()
  }
  
  // Flush if buffer is full
  if (errorBuffer.length >= BUFFER_FLUSH_SIZE) {
    await flushErrors()
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

/**
 * Log warning
 */
export async function logWarning(
  message: string,
  context: ErrorContext = {}
): Promise<void> {
  await logError(message, context, 'low')
}

/**
 * Log info (for tracking operations)
 */
export async function logInfo(
  message: string,
  context: ErrorContext = {}
): Promise<void> {
  // Info level logs go to console only, not database
  console.log(`[INFO] ${message}`, context)
}

/**
 * Force flush all buffered errors
 */
export async function flushErrorBuffer(): Promise<void> {
  await flushErrors()
}

/**
 * Shutdown error logger (flush remaining errors)
 */
export async function shutdownErrorLogger(): Promise<void> {
  if (flushInterval) {
    clearInterval(flushInterval)
    flushInterval = null
  }
  await flushErrors()
}
