import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { ApiResponseHandler } from '@/lib/api/response'

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

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
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

    const params = await context.params
    const bookingId = params.id
    const userId = user.id

    // Fetch single booking with all details
    const { data: booking, error: bookingError } = await supabaseAdmin
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
        cancellation_reason,
        booking_services(
          id,
          service_id,
          service_details,
          price,
          estimated_duration
        )
      `)
      .eq('id', bookingId)
      .eq('customer_id', userId)
      .single()

    if (bookingError) {
      if (bookingError.code === 'PGRST116') {
        return ApiResponseHandler.error('Booking not found', 'NOT_FOUND', 404)
      }
      console.error('Error fetching booking:', bookingError)
      return ApiResponseHandler.error('Failed to fetch booking', 'FETCH_ERROR', 500)
    }

    // Transform the data for frontend consumption
    const transformedBooking = {
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
      services: booking.booking_services?.map((service: any) => ({
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
    }

    return ApiResponseHandler.success(transformedBooking)

  } catch (error) {
    console.error('Customer booking details API error:', error)
    return ApiResponseHandler.serverError('Failed to fetch booking details')
  }
}