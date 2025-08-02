import { NextRequest } from 'next/server'
import { createClientFromRequest } from '@/lib/supabase/server'
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

    // Get recent bookings with optimized query using joins and embedded data
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
        vehicle_details,
        service_address,
        created_at,
        user_profiles!customer_id (
          id,
          email,
          first_name,
          last_name
        ),
        booking_services (
          id,
          service_details,
          price,
          services (
            id,
            name
          )
        )
      `)
      .order('created_at', { ascending: false })
      .limit(10)

    if (bookingsError) {
      console.error('Recent bookings error:', bookingsError)
      console.error('Error details:', JSON.stringify(bookingsError, null, 2))
      return ApiResponseHandler.serverError(`Failed to fetch recent bookings: ${bookingsError.message}`)
    }

    console.log('Bookings fetched successfully:', bookings?.length || 0)

    // Transform the data for the frontend using joined data and embedded JSON
    const recentBookings = bookings?.map((booking: any) => {
      // Get customer info from joined data
      const customer = booking.user_profiles || { first_name: '', last_name: '', email: '' }
      const customerName = [customer.first_name, customer.last_name]
        .filter(Boolean)
        .join(' ') || 'Customer'
      
      // Get vehicle info from embedded JSON
      const vehicleData = booking.vehicle_details || { make: 'Unknown', model: 'Vehicle', year: null, color: null }
      const vehicle = {
        make: vehicleData.make || 'Unknown',
        model: vehicleData.model || 'Vehicle',
        year: vehicleData.year || null,
        color: vehicleData.color || null
      }
      
      // Get address info from embedded JSON
      const addressData = booking.service_address || { address_line_1: '', city: 'Unknown', postal_code: '' }
      const address = {
        address_line_1: addressData.address_line_1 || '',
        city: addressData.city || 'Unknown',
        postal_code: addressData.postal_code || ''
      }
      
      // Get services from booking_services relationship
      const services = booking.booking_services?.map((bs: any) => ({
        name: bs.services?.name || bs.service_details?.name || 'Vehicle Detailing Service'
      })) || [{ name: 'Vehicle Detailing Service' }]
      
      return {
        id: booking.id,
        booking_reference: booking.booking_reference,
        customer_name: customerName,
        customer_email: customer.email || '',
        scheduled_date: booking.scheduled_date,
        start_time: booking.scheduled_start_time,
        status: booking.status,
        total_price: booking.total_price,
        services: services,
        vehicle: {
          make: vehicle.make,
          model: vehicle.model,
          year: vehicle.year,
          color: vehicle.color
        },
        address: {
          city: address.city,
          postal_code: address.postal_code
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