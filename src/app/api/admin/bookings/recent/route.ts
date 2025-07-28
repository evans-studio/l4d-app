import { NextRequest } from 'next/server'
import { createClientFromRequest } from '@/lib/supabase/server'
import { ApiResponseHandler } from '@/lib/api/response'
import { authenticateAdmin } from '@/lib/api/auth-handler'

export async function GET(request: NextRequest) {
  try {
    // Use the new authentication handler with session refresh
    const authResult = await authenticateAdmin(request)
    
    if (!authResult.success) {
      return authResult.error
    }
    
    const supabase = createClientFromRequest(request)

    // Get recent bookings with complete data including customer info
    const { data: bookings, error: bookingsError } = await supabase
      .from('bookings')
      .select(`
        id,
        booking_reference,
        scheduled_date,
        scheduled_start_time,
        status,
        total_price,
        vehicle_details,
        service_address,
        created_at,
        customer_id,
        user_profiles(
          email,
          first_name,
          last_name
        ),
        booking_services(
          id,
          service_details
        )
      `)
      .order('created_at', { ascending: false })
      .limit(10)

    if (bookingsError) {
      console.error('Recent bookings error:', bookingsError)
      return ApiResponseHandler.serverError('Failed to fetch recent bookings')
    }

    // Customer data is now included in the booking query via join

    // Transform the data for the frontend
    const recentBookings = bookings?.map(booking => {
      const customer = booking.user_profiles?.[0] || { first_name: null, last_name: null, email: null }
      const customerName = [customer.first_name, customer.last_name]
        .filter(Boolean)
        .join(' ') || 'Customer'
      
      return {
        id: booking.id,
        booking_reference: booking.booking_reference,
        customer_name: customerName,
        customer_email: customer.email || '',
        scheduled_date: booking.scheduled_date,
        start_time: booking.scheduled_start_time,
        status: booking.status,
        total_price: booking.total_price,
        services: booking.booking_services?.map((service: { service_details?: { name?: string } }) => ({
          name: service.service_details?.name || 'Service'
        })) || [{ name: 'Vehicle Detailing Service' }],
        vehicle: {
          make: booking.vehicle_details?.make || 'Vehicle',
          model: booking.vehicle_details?.model || 'Details',
          year: booking.vehicle_details?.year
        },
        address: {
          address_line_1: booking.service_address?.address_line_1 || 'Service Location',
          city: booking.service_address?.city || 'City',
          postal_code: booking.service_address?.postcode || 'Postcode'
        },
        created_at: booking.created_at
      }
    }) || []

    return ApiResponseHandler.success({
      bookings: recentBookings,
      total: recentBookings.length
    })

  } catch (error) {
    console.error('Recent bookings error:', error)
    return ApiResponseHandler.serverError('Failed to fetch recent bookings')
  }
}