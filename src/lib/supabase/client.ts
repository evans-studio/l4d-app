'use client'
import { createBrowserClient } from '@supabase/ssr'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

// Browser client for client-side code with standard configuration
export const supabase = createBrowserClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    // Use standard session handling to match server
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true,
    flowType: 'pkce'
    // Remove custom storageKey to use defaults
  },
  global: {
    headers: {
      'X-Client-Info': 'love4detailing-web'
    }
  }
})