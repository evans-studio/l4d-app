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
      console.error('No authentication token found')
      return ApiResponseHandler.error('Authentication required', 'AUTH_REQUIRED', 401)
    }

    // Verify the token and get user
    const { data: { user }, error: userError } = await supabaseAdmin.auth.getUser(authToken)
    
    if (userError) {
      console.error('Auth error:', userError)
      return ApiResponseHandler.error('Invalid authentication', 'AUTH_INVALID', 401)
    }
    
    if (!user) {
      console.error('No user found for token')
      return ApiResponseHandler.error('Invalid authentication', 'AUTH_INVALID', 401)
    }

    const userId = user.id
    console.log('Fetching bookings for user:', userId)

    // First try to fetch bookings with a simple query
    let bookings, bookingsError
    
    try {
      const simpleQuery = await supabaseAdmin
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
          vehicle_details,
          service_address,
          distance_km,
          estimated_duration,
          created_at,
          confirmed_at,
          completed_at,
          cancelled_at,
          cancellation_reason
        `)
        .eq('customer_id', userId)
        .order('created_at', { ascending: false })
      
      bookings = simpleQuery.data
      bookingsError = simpleQuery.error
      
      // If basic query works, try to get services separately
      if (bookings && !bookingsError) {
        for (const booking of bookings) {
          try {
            const { data: services } = await supabaseAdmin
              .from('booking_services')
              .select(`
                id,
                service_id,
                service_details,
                price,
                estimated_duration
              `)
              .eq('booking_id', booking.id)
            
            ;(booking as unknown as { booking_services: unknown[] }).booking_services = services || []
          } catch (serviceError) {
            console.warn(`Failed to fetch services for booking ${booking.id}:`, serviceError)
            ;(booking as unknown as { booking_services: unknown[] }).booking_services = []
          }
        }
      }
    } catch (error) {
      console.error('Error in booking query:', error)
      bookingsError = error
      bookings = null
    }

    if (bookingsError) {
      console.error('Error fetching bookings:', bookingsError)
      // Return empty array instead of error to allow dashboard to load
      console.log('Returning empty bookings array due to database error')
      return ApiResponseHandler.success([])
    }

    console.log(`Found ${bookings?.length || 0} bookings for user ${userId}`)

    // Transform the data for frontend consumption
    interface BookingWithServices {
      id: string
      booking_reference: string
      scheduled_date: string
      scheduled_start_time: string
      scheduled_end_time: string
      status: string
      total_price: number
      special_instructions?: string
      distance_km?: number
      estimated_duration?: number
      created_at: string
      confirmed_at?: string
      completed_at?: string
      cancelled_at?: string
      cancellation_reason?: string
      booking_services?: Array<{
        service_id: string
        service_details?: { name?: string }
        price: number
        estimated_duration: number
      }>
      vehicle_details?: {
        make?: string
        model?: string
        year?: number
        color?: string
        registration?: string
        size_name?: string
      }
      service_address?: {
        name?: string
        address_line_1?: string
        address_line_2?: string
        city?: string
        postcode?: string
      }
    }
    const transformedBookings = bookings?.map((booking: BookingWithServices) => ({
      id: booking.id,
      booking_reference: booking.booking_reference,
      scheduled_date: booking.scheduled_date,
      start_time: booking.scheduled_start_time,
      end_time: booking.scheduled_end_time,
      status: booking.status,
      total_price: booking.total_price,
      special_instructions: booking.special_instructions,
      distance_km: booking.distance_km,
      estimated_duration: booking.estimated_duration,
      created_at: booking.created_at,
      confirmed_at: booking.confirmed_at,
      completed_at: booking.completed_at,
      cancelled_at: booking.cancelled_at,
      cancellation_reason: booking.cancellation_reason,
      services: booking.booking_services?.map((service) => ({
        id: service.service_id,
        name: service.service_details?.name || 'Service',
        price: service.price,
        duration: service.estimated_duration
      })) || [],
      vehicle: booking.vehicle_details ? {
        make: booking.vehicle_details.make || '',
        model: booking.vehicle_details.model || '',
        year: booking.vehicle_details.year,
        color: booking.vehicle_details.color,
        registration: booking.vehicle_details.registration
      } : null,
      address: booking.service_address ? {
        name: booking.service_address.name || '',
        address_line_1: booking.service_address.address_line_1 || '',
        address_line_2: booking.service_address.address_line_2,
        city: booking.service_address.city || '',
        postal_code: booking.service_address.postcode || ''
      } : null
    })) || []

    return ApiResponseHandler.success(transformedBookings)

  } catch (error) {
    console.error('Customer bookings API error:', error)
    return ApiResponseHandler.serverError('Failed to fetch customer bookings')
  }
}