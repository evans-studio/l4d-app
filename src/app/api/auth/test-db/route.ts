import { NextRequest } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { ApiResponseHandler } from '@/lib/api/response'

// Force Node.js runtime
export const runtime = 'nodejs'

export async function GET(request: NextRequest) {
  try {
    console.log('=== DATABASE CONNECTION TEST ===')
    
    // Check environment variables
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY
    
    console.log('Supabase URL exists:', !!supabaseUrl)
    console.log('Service key exists:', !!serviceKey)
    console.log('Service key length:', serviceKey?.length || 0)
    
    if (!supabaseUrl || !serviceKey) {
      return ApiResponseHandler.error('Missing environment variables', 'CONFIG_ERROR', 500)
    }

    // Create Supabase client
    const supabase = createClient(supabaseUrl, serviceKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    })

    // Test basic connection
    console.log('Testing basic query...')
    const { data: testData, error: testError } = await supabase
      .from('user_profiles')
      .select('count')
      .limit(1)

    if (testError) {
      console.error('❌ Database query failed:', testError)
      return ApiResponseHandler.error(
        `Database connection failed: ${testError.message}`,
        'DB_CONNECTION_FAILED',
        500
      )
    }

    console.log('✅ Database connection successful')

    // Test auth admin access
    console.log('Testing auth admin access...')
    const { data: authUsers, error: authError } = await supabase.auth.admin.listUsers()

    if (authError) {
      console.error('❌ Auth admin access failed:', authError)
      return ApiResponseHandler.error(
        `Auth admin access failed: ${authError.message}`,
        'AUTH_ADMIN_FAILED',
        500
      )
    }

    console.log('✅ Auth admin access successful')
    console.log('Current user count:', authUsers.users.length)

    return ApiResponseHandler.success({
      message: 'Database connection and auth admin access working',
      userCount: authUsers.users.length,
      envCheck: {
        supabaseUrl: !!supabaseUrl,
        serviceKey: !!serviceKey,
        serviceKeyLength: serviceKey?.length || 0
      }
    })

  } catch (error) {
    console.error('❌ Database test error:', error)
    const errorMessage = error instanceof Error ? error.message : 'Unknown error'
    return ApiResponseHandler.error(`Database test failed: ${errorMessage}`, 'TEST_ERROR', 500)
  }
}