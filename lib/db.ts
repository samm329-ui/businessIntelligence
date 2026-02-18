import { createClient, SupabaseClient } from '@supabase/supabase-js'

let supabaseInstance: SupabaseClient | null = null
let supabaseClientInstance: SupabaseClient | null = null

function getEnvVars() {
  return {
    url: process.env.NEXT_PUBLIC_SUPABASE_URL,
    serviceKey: process.env.SUPABASE_SERVICE_ROLE_KEY,
    anonKey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  }
}

// Service role client (full access, use on server only)
function getSupabase(): SupabaseClient {
  if (supabaseInstance) return supabaseInstance
  
  const { url, serviceKey } = getEnvVars()
  
  if (!url || !serviceKey) {
    throw new Error(
      'Missing Supabase environment variables. ' +
      'Please set NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY'
    )
  }
  
  supabaseInstance = createClient(url, serviceKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  })
  
  return supabaseInstance
}

// Anon client (for client-side, limited access)
function getSupabaseClient(): SupabaseClient {
  if (supabaseClientInstance) return supabaseClientInstance
  
  const { url, anonKey } = getEnvVars()
  
  if (!url || !anonKey) {
    throw new Error(
      'Missing Supabase environment variables. ' +
      'Please set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY'
    )
  }
  
  supabaseClientInstance = createClient(url, anonKey)
  return supabaseClientInstance
}

// Export singleton instances (lazy-loaded)
export const supabase = new Proxy({} as SupabaseClient, {
  get: (target, prop) => {
    const client = getSupabase()
    return client[prop as keyof SupabaseClient]
  }
})

export const supabaseClient = new Proxy({} as SupabaseClient, {
  get: (target, prop) => {
    const client = getSupabaseClient()
    return client[prop as keyof SupabaseClient]
  }
})

// Test connection
export async function testConnection() {
  try {
    const { data, error } = await supabase
      .from('entity_intelligence')
      .select('count')
      .limit(1)
    
    if (error) throw error
    return { success: true, message: 'Database connected' }
  } catch (error) {
    return { success: false, message: `Connection failed: ${error}` }
  }
}
