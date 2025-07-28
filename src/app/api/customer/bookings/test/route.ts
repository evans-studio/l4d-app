import { NextRequest } from 'next/server'
import { ApiResponseHandler } from '@/lib/api/response'
import { createClient } from '@supabase/supabase-js'

// Force Node.js runtime
export const runtime = 'nodejs'

// Use service role for server-side operations
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  }
)

export async function GET(request: NextRequest) {
  try {
    // Get auth token from request headers or cookies
    const authHeader = request.headers.get('authorization')
    const authToken = authHeader?.replace('Bearer ', '') || 
                     request.cookies.get('sb-vwejbgfiddltdqwhfjmt-auth-token')?.value

    if (!authToken) {
      return ApiResponseHandler.error('Authentication required', 'AUTH_REQUIRED', 401)
    }

    // Verify the token and get user
    const { data: { user }, error: userError } = await supabaseAdmin.auth.getUser(authToken)
    
    if (userError || !user) {
      return ApiResponseHandler.error('Invalid authentication', 'AUTH_INVALID', 401)
    }

    // Test database connection and table existence
    const tests = {
      userInfo: {
        id: user.id,
        email: user.email
      },
      tables: {}
    }

    // Test if bookings table exists and is accessible
    try {
      const { data: bookingsTest, error: bookingsTestError } = await supabaseAdmin
        .from('bookings')
        .select('id')
        .limit(1)
      
      tests.tables = {
        ...tests.tables,
        bookings: {
          exists: !bookingsTestError,
          error: bookingsTestError?.message,
          sampleCount: bookingsTest?.length || 0
        }
      }
    } catch (error) {
      tests.tables = {
        ...tests.tables,
        bookings: {
          exists: false,
          error: String(error)
        }
      }
    }

    // Test booking_services table
    try {
      const { data: servicesTest, error: servicesTestError } = await supabaseAdmin
        .from('booking_services')
        .select('id')
        .limit(1)
      
      tests.tables = {
        ...tests.tables,
        booking_services: {
          exists: !servicesTestError,
          error: servicesTestError?.message,
          sampleCount: servicesTest?.length || 0
        }
      }
    } catch (error) {
      tests.tables = {
        ...tests.tables,
        booking_services: {
          exists: false,
          error: String(error)
        }
      }
    }

    // Test user's bookings specifically
    try {
      const { data: userBookings, error: userBookingsError } = await supabaseAdmin
        .from('bookings')
        .select('id, booking_reference, status')
        .eq('customer_id', user.id)
        .limit(5)
      
      tests.tables = {
        ...tests.tables,
        userBookings: {
          count: userBookings?.length || 0,
          error: userBookingsError?.message,
          sample: userBookings
        }
      }
    } catch (error) {
      tests.tables = {
        ...tests.tables,
        userBookings: {
          error: String(error)
        }
      }
    }

    return ApiResponseHandler.success(tests)

  } catch (error) {
    console.error('Test API error:', error)
    return ApiResponseHandler.serverError('Test failed')
  }
}