// lib/monitoring/error-monitor.ts
// Comprehensive Error Logging & Monitoring System
// Tracks all errors for continuous improvement

import { supabase } from '../db'

export interface ErrorLogEntry {
  errorType: 'api_error' | 'validation_error' | 'resolution_error' | 'calculation_error' | 'ai_error' | 'system_error'
  severity: 'info' | 'warning' | 'error' | 'critical'
  component: string
  entityType?: string
  entityId?: string
  query?: string
  message: string
  details?: Record<string, any>
  stackTrace?: string
  userId?: string
  ipAddress?: string
}

export interface ErrorStats {
  totalErrors: number
  byType: Record<string, number>
  bySeverity: Record<string, number>
  byComponent: Record<string, number>
  topErrors: Array<{
    message: string
    count: number
    lastOccurred: Date
  }>
  trend: 'increasing' | 'decreasing' | 'stable'
}

export interface ResolutionFeedback {
  logId: string
  wasCorrect: boolean
  userNotes?: string
  correctEntityId?: string
}

class ErrorMonitor {
  /**
   * Log an error with full context
   */
  async logError(entry: ErrorLogEntry): Promise<string | null> {
    try {
      const { data, error } = await supabase.from('error_logs').insert({
        error_type: entry.errorType,
        severity: entry.severity,
        component: entry.component,
        entity_type: entry.entityType,
        entity_id: entry.entityId,
        query_text: entry.query,
        error_message: entry.message,
        error_details: entry.details,
        stack_trace: entry.stackTrace,
        user_id: entry.userId,
        source_ip: entry.ipAddress,
        resolved: false,
        created_at: new Date().toISOString()
      }).select()

      if (error) {
        console.error('[ErrorMonitor] Failed to log error:', error)
        return null
      }

      // Alert on critical errors
      if (entry.severity === 'critical') {
        await this.alertCriticalError(entry)
      }

      console.error(`[ErrorMonitor] Logged ${entry.severity} error in ${entry.component}: ${entry.message}`)
      return data[0]?.id

    } catch (e) {
      // If error logging fails, at least log to console
      console.error('[ErrorMonitor] Critical: Failed to log error:', e)
      console.error('Original error:', entry)
      return null
    }
  }

  /**
   * Log API error specifically
   */
  async logAPIError(
    apiName: string,
    endpoint: string,
    error: Error,
    requestParams?: any
  ): Promise<void> {
    await this.logError({
      errorType: 'api_error',
      severity: 'error',
      component: `API:${apiName}`,
      message: `${apiName} API error on ${endpoint}: ${error.message}`,
      details: {
        endpoint,
        requestParams,
        errorCode: (error as any).code,
        responseStatus: (error as any).status
      },
      stackTrace: error.stack
    })
  }

  /**
   * Log validation error
   */
  async logValidationError(
    field: string,
    value: any,
    rule: string,
    expected: any,
    actual: any
  ): Promise<void> {
    await this.logError({
      errorType: 'validation_error',
      severity: 'warning',
      component: 'ValidationEngine',
      message: `Validation failed for ${field}: ${rule}`,
      details: {
        field,
        value,
        rule,
        expected,
        actual
      }
    })
  }

  /**
   * Log entity resolution feedback
   * Note: entity_resolution_log not in Upgrade 2 schema
   */
  async logResolutionFeedback(feedback: ResolutionFeedback): Promise<void> {
    console.log(`[ErrorMonitor] Resolution feedback: ${feedback.wasCorrect ? 'correct' : 'incorrect'}`, feedback)
    
    // If resolution was wrong, log as error for improvement
    if (!feedback.wasCorrect) {
      await this.logError({
        errorType: 'resolution_error',
        severity: 'warning',
        component: 'EntityResolver',
        message: `Entity resolution was incorrect (log: ${feedback.logId})`,
        details: {
          logId: feedback.logId,
          correctEntityId: feedback.correctEntityId,
          notes: feedback.userNotes
        }
      })
    }
  }

  /**
   * Get error statistics
   * Note: error_logs not in Upgrade 2 schema - using api_fetch_log instead
   */
  async getErrorStats(days: number = 7): Promise<ErrorStats> {
    const startDate = new Date()
    startDate.setDate(startDate.getDate() - days)

    // Use api_fetch_log for error tracking (Upgrade 2 schema)
    const { data, error } = await supabase
      .from('api_fetch_log')
      .select('*')
      .eq('success', false)
      .gte('fetched_at', startDate.toISOString())

    if (error || !data) {
      return {
        totalErrors: 0,
        byType: {},
        bySeverity: {},
        byComponent: {},
        topErrors: [],
        trend: 'stable'
      }
    }

    // Group by type
    const byType: Record<string, number> = {}
    const bySeverity: Record<string, number> = {}
    const byComponent: Record<string, number> = {}
    const messageCounts: Record<string, { count: number; lastOccurred: Date }> = {}

    for (const log of data) {
      byType[log.error_type] = (byType[log.error_type] || 0) + 1
      bySeverity[log.severity] = (bySeverity[log.severity] || 0) + 1
      byComponent[log.component] = (byComponent[log.component] || 0) + 1

      const key = log.error_message.substring(0, 100) // Truncate for grouping
      if (!messageCounts[key]) {
        messageCounts[key] = { count: 0, lastOccurred: new Date(log.created_at) }
      }
      messageCounts[key].count++
      if (new Date(log.created_at) > messageCounts[key].lastOccurred) {
        messageCounts[key].lastOccurred = new Date(log.created_at)
      }
    }

    // Get top errors
    const topErrors = Object.entries(messageCounts)
      .sort((a, b) => b[1].count - a[1].count)
      .slice(0, 10)
      .map(([message, stats]) => ({
        message,
        count: stats.count,
        lastOccurred: stats.lastOccurred
      }))

    // Calculate trend
    const trend = await this.calculateTrend(days)

    return {
      totalErrors: data.length,
      byType,
      bySeverity,
      byComponent,
      topErrors,
      trend
    }
  }

  /**
   * Calculate error trend
   */
  private async calculateTrend(days: number): Promise<'increasing' | 'decreasing' | 'stable'> {
    const halfDays = Math.floor(days / 2)
    
    const firstHalfStart = new Date()
    firstHalfStart.setDate(firstHalfStart.getDate() - days)
    
    const secondHalfStart = new Date()
    secondHalfStart.setDate(secondHalfStart.getDate() - halfDays)

    const { data: firstHalf } = await supabase
      .from('api_fetch_log')
      .select('id', { count: 'exact' })
      .gte('created_at', firstHalfStart.toISOString())
      .lt('created_at', secondHalfStart.toISOString())

    const { data: secondHalf } = await supabase
      .from('api_fetch_log')
      .select('id', { count: 'exact' })
      .gte('created_at', secondHalfStart.toISOString())

    const firstCount = firstHalf?.length || 0
    const secondCount = secondHalf?.length || 0

    if (firstCount === 0) return secondCount > 0 ? 'increasing' : 'stable'

    const changePercent = ((secondCount - firstCount) / firstCount) * 100

    if (changePercent > 20) return 'increasing'
    if (changePercent < -20) return 'decreasing'
    return 'stable'
  }

  /**
   * Get unresolved errors
   */
  async getUnresolvedErrors(severity?: string): Promise<any[]> {
    let query = supabase
      .from('api_fetch_log')
      .select('*')
      .eq('resolved', false)
      .order('created_at', { ascending: false })

    if (severity) {
      query = query.eq('severity', severity)
    }

    const { data, error } = await query.limit(100)

    if (error || !data) return []
    return data
  }

  /**
   * Mark error as resolved
   */
  async resolveError(errorId: string, resolutionNotes: string): Promise<void> {
    await supabase
      .from('api_fetch_log')
      .update({
        resolved: true,
        resolution_notes: resolutionNotes,
        resolved_at: new Date().toISOString()
      })
      .eq('id', errorId)
  }

  /**
   * Alert on critical error
   */
  private async alertCriticalError(entry: ErrorLogEntry): Promise<void> {
    // In production, this would send alerts via email, Slack, PagerDuty, etc.
    console.error('🚨 CRITICAL ERROR ALERT 🚨')
    console.error(`Component: ${entry.component}`)
    console.error(`Message: ${entry.message}`)
    console.error(`Entity: ${entry.entityType} ${entry.entityId}`)
    console.error(`Query: ${entry.query}`)
    console.error('Details:', entry.details)

    // Store alert
    await supabase.from('error_logs').insert({
      error_type: 'system_error',
      severity: 'critical',
      component: 'AlertSystem',
      message: `Critical error alert sent for ${entry.component}`,
      error_details: { originalError: entry }
    })
  }

  /**
   * Get system health status
   */
  async getSystemHealth(): Promise<{
    status: 'healthy' | 'degraded' | 'critical'
    uptime: number
    errorRate: number
    apiStatus: Record<string, boolean>
  }> {
    // Get error rate in last hour
    const oneHourAgo = new Date()
    oneHourAgo.setHours(oneHourAgo.getHours() - 1)

    const { count: errorCount } = await supabase
      .from('api_fetch_log')
      .select('*', { count: 'exact', head: true })
      .gte('created_at', oneHourAgo.toISOString())

    const { count: totalRequests } = await supabase
      .from('analysis_cache')
      .select('*', { count: 'exact', head: true })
      .gte('created_at', oneHourAgo.toISOString())

    const errorRate = totalRequests && totalRequests > 0
      ? (errorCount || 0) / totalRequests * 100
      : 0

    // Check API statuses
    const apiStatus: Record<string, boolean> = {}
    const { data: sources } = await supabase.from('data_sources').select('name, is_active')
    if (sources) {
      for (const source of sources) {
        apiStatus[source.name] = source.is_active
      }
    }

    // Determine status
    let status: 'healthy' | 'degraded' | 'critical' = 'healthy'
    if (errorRate > 5) status = 'critical'
    else if (errorRate > 1) status = 'degraded'

    return {
      status,
      uptime: 99.9, // Placeholder - would need actual uptime tracking
      errorRate,
      apiStatus
    }
  }

  /**
   * Generate error report
   */
  async generateErrorReport(days: number = 7): Promise<string> {
    const stats = await this.getErrorStats(days)
    const unresolved = await this.getUnresolvedErrors('error')

    let report = `# Error Report - Last ${days} Days\n\n`
    report += `## Summary\n`
    report += `- Total Errors: ${stats.totalErrors}\n`
    report += `- Trend: ${stats.trend}\n`
    report += `- Unresolved Errors: ${unresolved.length}\n\n`

    report += `## By Type\n`
    for (const [type, count] of Object.entries(stats.byType)) {
      report += `- ${type}: ${count}\n`
    }

    report += `\n## By Severity\n`
    for (const [severity, count] of Object.entries(stats.bySeverity)) {
      report += `- ${severity}: ${count}\n`
    }

    report += `\n## Top Errors\n`
    for (const err of stats.topErrors.slice(0, 5)) {
      report += `- ${err.message.substring(0, 80)}... (${err.count} times)\n`
    }

    return report
  }
}

export const errorMonitor = new ErrorMonitor()
export default errorMonitor
