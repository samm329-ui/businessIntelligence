import { NextResponse } from 'next/server'
import { supabase } from '@/lib/db'
import { initializeIntelligenceSystem, getInitializationStatus } from '@/lib/intelligence/init'

export async function GET() {
  try {
    // Check database connection
    let dbStatus = 'unknown'
    try {
      const { error: dbError } = await supabase
        .from('entity_intelligence')
        .select('count')
        .limit(1)
      dbStatus = dbError ? 'disconnected' : 'connected'
    } catch {
      dbStatus = 'error'
    }
    
    // Check Groq API
    const groqStatus = process.env.GROQ_API_KEY ? 'configured' : 'not_configured'
    
    // Check Intelligence System
    let intelligenceStatus = getInitializationStatus()
    if (!intelligenceStatus) {
      try {
        intelligenceStatus = await initializeIntelligenceSystem()
      } catch {
        intelligenceStatus = null
      }
    }
    
    const isHealthy = dbStatus === 'connected' || (intelligenceStatus?.ready ?? false)
    
    return NextResponse.json({
      status: isHealthy ? 'healthy' : 'degraded',
      database: dbStatus,
      ai: groqStatus === 'configured' ? 'groq-connected' : 'groq-missing',
      intelligence: intelligenceStatus ? {
        ready: intelligenceStatus.ready,
        datasets: {
          excel: intelligenceStatus.datasets.excel.loaded ? `${intelligenceStatus.datasets.excel.count} companies` : 'not loaded',
          csv: intelligenceStatus.datasets.csv.loaded ? 'loaded' : 'not loaded',
          dynamic: intelligenceStatus.datasets.dynamic.loaded ? `${intelligenceStatus.datasets.dynamic.count} entities` : 'not loaded',
        },
        apis: intelligenceStatus.apis,
      } : 'initializing',
      timestamp: new Date().toISOString()
    })
  } catch (error) {
    return NextResponse.json({
      status: 'unhealthy',
      error: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString()
    }, { status: 500 })
  }
}
