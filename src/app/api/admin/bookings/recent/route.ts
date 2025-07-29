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

    // Get recent bookings - start with basic data, then try joins
    let bookings
    let bookingsError

    // First try with joins
    try {
      const { data, error } = await supabase
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
          services(
            name
          ),
          customer_vehicles(
            make,
            model,
            year
          ),
          customer_addresses(
            address_line_1,
            city,
            postal_code
          )
        `)
        .order('created_at', { ascending: false })
        .limit(10)
      
      bookings = data
      bookingsError = error
    } catch (joinError) {
      console.log('Join query failed, trying basic query:', joinError)
      
      // Fallback to basic query without joins
      const { data, error } = await supabase
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
          customer_id
        `)
        .order('created_at', { ascending: false })
        .limit(10)
      
      bookings = data
      bookingsError = error
    }

    if (bookingsError) {
      console.error('Recent bookings error:', bookingsError)
      console.error('Error details:', JSON.stringify(bookingsError, null, 2))
      return ApiResponseHandler.serverError(`Failed to fetch recent bookings: ${bookingsError.message}`)
    }

    console.log('Bookings fetched successfully:', bookings?.length || 0)

    // Customer data is now included in the booking query via join

    // Transform the data for the frontend using proper relationships
    const recentBookings = bookings?.map((booking: any) => {
      // Use the proper relationship data
      const customer = booking.user_profiles || { first_name: null, last_name: null, email: null }
      const customerName = [customer.first_name, customer.last_name]
        .filter(Boolean)
        .join(' ') || 'Customer'
      
      // Get vehicle info from relationship or fallback to JSON field
      const vehicle = booking.customer_vehicles || {
        make: booking.vehicle_details?.make || 'Vehicle',
        model: booking.vehicle_details?.model || 'Details', 
        year: booking.vehicle_details?.year
      }
      
      // Get address info from relationship or fallback to JSON field
      const address = booking.customer_addresses || {
        address_line_1: booking.service_address?.address_line_1 || 'Service Location',
        city: booking.service_address?.city || 'City',
        postal_code: booking.service_address?.postal_code || booking.service_address?.postcode || 'Postcode'
      }
      
      // Get service info from relationship
      const serviceName = booking.services?.name || 'Vehicle Detailing Service'
      
      return {
        id: booking.id,
        booking_reference: booking.booking_reference,
        customer_name: customerName,
        customer_email: customer.email || '',
        scheduled_date: booking.scheduled_date,
        start_time: booking.scheduled_start_time,
        status: booking.status,
        total_price: booking.total_price,
        services: [{ name: serviceName }],
        vehicle: {
          make: vehicle.make || 'Vehicle',
          model: vehicle.model || 'Details',
          year: vehicle.year
        },
        address: {
          address_line_1: address.address_line_1 || 'Service Location',
          city: address.city || 'City',
          postal_code: address.postal_code || 'Postcode'
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