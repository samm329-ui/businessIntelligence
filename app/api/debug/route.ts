import { NextResponse } from 'next/server'

export async function GET() {
  const checks = {
    supabase: {
      url: !!process.env.NEXT_PUBLIC_SUPABASE_URL,
      anonKey: !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
      serviceKey: !!process.env.SUPABASE_SERVICE_ROLE_KEY
    },
    groq: {
      apiKey: !!process.env.GROQ_API_KEY
    },
    nodeEnv: process.env.NODE_ENV
  }
  
  const allConfigured = 
    checks.supabase.url && 
    checks.supabase.serviceKey && 
    checks.groq.apiKey
  
  return NextResponse.json({
    status: allConfigured ? 'configured' : 'missing_env_vars',
    checks,
    message: allConfigured 
      ? 'All environment variables are configured'
      : 'Some environment variables are missing. Check the checks object for details.'
  })
}
