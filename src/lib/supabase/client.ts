import { createBrowserClient } from '@supabase/ssr'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

// Browser client for client-side code with improved configuration
export const supabase = createBrowserClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    // Improve session handling
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true,
    flowType: 'pkce',
    // Set storage key for session persistence
    storageKey: 'love4detailing-auth-token'
  },
  global: {
    // Add timeout and retry configuration
    headers: {
      'X-Client-Info': 'love4detailing-web'
    }
  },
  // Configure realtime if needed
  realtime: {
    params: {
      eventsPerSecond: 10
    }
  }
})