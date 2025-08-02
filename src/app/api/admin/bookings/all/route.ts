import { NextRequest } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase/direct'
import { ApiResponseHandler } from '@/lib/api/response'
import { authenticateAdmin } from '@/lib/api/auth-handler'

export async function GET(request: NextRequest) {
  try {
    // Re-enable authentication for security
    const authResult = await authenticateAdmin(request)
    if (!authResult.success) {
      return authResult.error!
    }
    
    // Use admin client for database queries
    const supabase = supabaseAdmin

    // Get all bookings with optimized query using joins and embedded data
    const { data: bookings, error: bookingsError } = await supabase
      .from('bookings')
      .select(`
        id,
        booking_reference,
        customer_id,
        scheduled_date,
        scheduled_start_time,
        status,
        total_price,
        special_instructions,
        vehicle_details,
        service_address,
        pricing_breakdown,
        created_at,
        user_profiles!customer_id (
          id,
          email,
          first_name,
          last_name,
          phone
        ),
        booking_services (
          id,
          service_details,
          price,
          services (
            id,
            name,
            short_description
          )
        )
      `)
      .order('created_at', { ascending: false })

    if (bookingsError) {
      console.error('All bookings error:', bookingsError)
      return ApiResponseHandler.serverError(`Failed to fetch bookings: ${bookingsError.message}`)
    }

    if (!bookings || bookings.length === 0) {
      return ApiResponseHandler.success([])
    }

    // Transform the data for the frontend using joined data and embedded JSON
    const allBookings = bookings.map((booking: any) => {
      // Get customer info from joined data
      const customer = booking.user_profiles || { first_name: '', last_name: '', email: '', phone: '' }
      const customerName = [customer.first_name, customer.last_name]
        .filter(Boolean)
        .join(' ') || 'Customer'
      
      // Get vehicle info from embedded JSON
      const vehicle = booking.vehicle_details || { make: 'Unknown', model: 'Vehicle', year: null, color: '' }
      
      // Get address info from embedded JSON
      const address = booking.service_address || { address_line_1: '', city: 'Unknown', postal_code: '' }
      
      // Get services from booking_services relationship
      const services = booking.booking_services?.map((bs: any) => ({
        name: bs.services?.name || bs.service_details?.name || 'Vehicle Detailing Service',
        base_price: bs.price || 0
      })) || [{
        name: 'Vehicle Detailing Service',
        base_price: booking.total_price || 0
      }]
      
      return {
        id: booking.id,
        booking_reference: booking.booking_reference,
        customer_id: booking.customer_id,
        customer_name: customerName,
        customer_email: customer.email || '',
        customer_phone: customer.phone || '',
        scheduled_date: booking.scheduled_date,
        start_time: booking.scheduled_start_time,
        status: booking.status,
        total_price: booking.total_price || 0,
        special_instructions: booking.special_instructions,
        services: services,
        vehicle: {
          make: vehicle.make || 'Unknown',
          model: vehicle.model || 'Vehicle',
          year: vehicle.year,
          color: vehicle.color
        },
        address: {
          address_line_1: address.address_line_1 || '',
          city: address.city || 'Unknown',
          postal_code: address.postal_code || ''
        },
        created_at: booking.created_at
      }
    })

    return ApiResponseHandler.success(allBookings)

  } catch (error) {
    console.error('All bookings error:', error)
    return ApiResponseHandler.serverError('Failed to fetch bookings')
  }
}