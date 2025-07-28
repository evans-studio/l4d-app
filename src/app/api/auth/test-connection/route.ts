import { NextRequest } from 'next/server'
import { ApiResponseHandler } from '@/lib/api/response'
import { createClient } from '@supabase/supabase-js'

// Force Node.js runtime
export const runtime = 'nodejs'

// Test with both service role and anon key
const supabaseService = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  }
)

const supabaseAnon = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

export async function GET(request: NextRequest) {
  try {
    const tests = {
      environment: {
        hasSupabaseUrl: !!process.env.NEXT_PUBLIC_SUPABASE_URL,
        hasAnonKey: !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
        hasServiceKey: !!process.env.SUPABASE_SERVICE_ROLE_KEY,
        supabaseUrl: process.env.NEXT_PUBLIC_SUPABASE_URL?.substring(0, 30) + '...'
      },
      connections: {}
    }

    // Test service role connection
    try {
      const start = Date.now()
      const { data, error } = await Promise.race([
        supabaseService.from('user_profiles').select('id').limit(1),
        new Promise((_, reject) => setTimeout(() => reject(new Error('Timeout')), 10000))
      ]) as { data: unknown; error: unknown }
      
      const duration = Date.now() - start
      
      tests.connections = {
        ...tests.connections,
        serviceRole: {
          success: !error,
          duration: `${duration}ms`,
          error: error ? (error as Error).message : null,
          recordCount: Array.isArray(data) ? data.length : 0
        }
      }
    } catch (error: any) {
      tests.connections = {
        ...tests.connections,
        serviceRole: {
          success: false,
          error: error.message,
          timeout: error.message.includes('Timeout')
        }
      }
    }

    // Test anon key connection
    try {
      const start = Date.now()
      const { data, error } = await Promise.race([
        supabaseAnon.from('services').select('id').limit(1),
        new Promise((_, reject) => setTimeout(() => reject(new Error('Timeout')), 10000))
      ]) as { data: unknown; error: unknown }
      
      const duration = Date.now() - start
      
      tests.connections = {
        ...tests.connections,
        anonKey: {
          success: !error,
          duration: `${duration}ms`,
          error: error ? (error as Error).message : null,
          recordCount: Array.isArray(data) ? data.length : 0
        }
      }
    } catch (error: any) {
      tests.connections = {
        ...tests.connections,
        anonKey: {
          success: false,
          error: error.message,
          timeout: error.message.includes('Timeout')
        }
      }
    }

    // Test auth endpoint specifically
    try {
      const start = Date.now()
      const response = await fetch(`${process.env.NEXT_PUBLIC_SUPABASE_URL}/auth/v1/health`, {
        headers: {
          'apikey': process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
        }
      })
      const duration = Date.now() - start
      
      tests.connections = {
        ...tests.connections,
        authEndpoint: {
          success: response.ok,
          status: response.status,
          duration: `${duration}ms`
        }
      }
    } catch (error: any) {
      tests.connections = {
        ...tests.connections,
        authEndpoint: {
          success: false,
          error: error.message
        }
      }
    }

    return ApiResponseHandler.success(tests)

  } catch (error: any) {
    console.error('Connection test error:', error)
    return ApiResponseHandler.serverError(`Connection test failed: ${error.message}`)
  }
}