import { NextResponse } from 'next/server'
import { supabase } from '@/lib/db'

export async function GET() {
  try {
    // Check database connection
    const { error: dbError } = await supabase
      .from('industries')
      .select('count')
      .limit(1)
    
    const dbStatus = dbError ? 'disconnected' : 'connected'
    
    // Check Groq API
    const groqStatus = process.env.GROQ_API_KEY ? 'configured' : 'not_configured'
    
    return NextResponse.json({
      status: dbStatus === 'connected' ? 'healthy' : 'degraded',
      database: dbStatus,
      ai: groqStatus === 'configured' ? 'groq-connected' : 'groq-missing',
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
