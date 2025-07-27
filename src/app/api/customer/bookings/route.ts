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

    const userId = user.id

    // Fetch customer bookings with related data
    const { data: bookings, error: bookingsError } = await supabaseAdmin
      .from('bookings')
      .select(`
        id,
        booking_reference,
        scheduled_date,
        scheduled_start_time,
        scheduled_end_time,
        status,
        total_price,
        special_instructions,
        created_at,
        customer_vehicles!inner(make, model, year, color),
        customer_addresses!inner(address_line_1, city, postal_code),
        booking_services(
          id,
          price,
          estimated_duration,
          services!inner(name, duration_minutes)
        )
      `)
      .eq('customer_id', userId)
      .order('scheduled_date', { ascending: false })

    if (bookingsError) {
      console.error('Error fetching bookings:', bookingsError)
      return ApiResponseHandler.error('Failed to fetch bookings', 'FETCH_ERROR', 500)
    }

    // Transform the data for frontend consumption
    const transformedBookings = bookings.map((booking: any) => ({
      id: booking.id,
      booking_reference: booking.booking_reference,
      scheduled_date: booking.scheduled_date,
      start_time: booking.scheduled_start_time,
      status: booking.status,
      total_price: booking.total_price,
      services: booking.booking_services.map((service: any) => ({
        name: service.services?.name || 'Unknown Service',
        price: service.price,
        duration: service.estimated_duration
      })),
      vehicle: booking.customer_vehicles ? {
        make: booking.customer_vehicles.make,
        model: booking.customer_vehicles.model,
        year: booking.customer_vehicles.year,
        color: booking.customer_vehicles.color
      } : null,
      address: booking.customer_addresses ? {
        address_line_1: booking.customer_addresses.address_line_1,
        city: booking.customer_addresses.city,
        postal_code: booking.customer_addresses.postal_code
      } : null
    }))

    return ApiResponseHandler.success(transformedBookings)

  } catch (error) {
    console.error('Customer bookings API error:', error)
    return ApiResponseHandler.serverError('Failed to fetch customer bookings')
  }
}