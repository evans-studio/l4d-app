import { NextRequest } from 'next/server'
import { ApiResponseHandler } from '@/lib/api/response'
import { createClientFromRequest, createAdminClient } from '@/lib/supabase/server'

export async function GET(request: NextRequest) {
  try {
    const supabase = createClientFromRequest(request)
    
    // Get current session
    const { data: { session }, error: sessionError } = await supabase.auth.getSession()
    
    if (sessionError || !session?.user) {
      return ApiResponseHandler.unauthorized('Authentication required')
    }

    const userId = session.user.id
    console.log('Fetching bookings for user:', userId)

    // Fetch bookings for the authenticated user
    try {
      const { data: bookings, error: bookingsError } = await supabase
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
        .eq('customer_id', userId)
        .order('created_at', { ascending: false })

      if (bookingsError) {
        console.error('Error fetching bookings:', bookingsError)
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
  } catch (error) {
    console.error('Customer bookings API error:', error)
    return ApiResponseHandler.serverError('Failed to fetch customer bookings')
  }
}