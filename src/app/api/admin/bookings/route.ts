import { NextRequest } from 'next/server'
import { createClientFromRequest } from '@/lib/supabase/server'
import { ApiResponseHandler } from '@/lib/api/response'

export async function GET(request: NextRequest) {
  try {
    const supabase = createClientFromRequest(request)
    const { searchParams } = new URL(request.url)
    
    // Get current user and verify admin role
    const { data: { session }, error: sessionError } = await supabase.auth.getSession()
    
    if (sessionError || !session?.user) {
      return ApiResponseHandler.unauthorized('Authentication required')
    }

    // Check user role
    const { data: profile } = await supabase
      .from('user_profiles')
      .select('role')
      .eq('id', session.user.id)
      .single()

    if (!profile || (profile.role !== 'admin' && profile.role !== 'super_admin')) {
      return ApiResponseHandler.forbidden('Admin access required')
    }

    // Parse query parameters
    const dateFilter = searchParams.get('date')
    const sortBy = searchParams.get('sort') || 'created_at'

    // Build query with customer data included
    let query = supabase
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
        created_at,
        updated_at,
        customer_id,
        user_profiles(
          email,
          first_name,
          last_name,
          phone
        ),
        booking_services(
          id,
          service_details,
          price
        )
      `)

    // Apply date filter if provided
    if (dateFilter) {
      query = query.eq('scheduled_date', dateFilter)
    }

    // Apply sorting
    if (sortBy === 'time') {
      query = query.order('scheduled_date', { ascending: true })
                   .order('scheduled_start_time', { ascending: true })
    } else {
      query = query.order('created_at', { ascending: false })
    }

    const { data: bookings, error: bookingsError } = await query

    if (bookingsError) {
      console.error('Admin bookings error:', bookingsError)
      return ApiResponseHandler.serverError('Failed to fetch bookings')
    }

    if (!bookings || bookings.length === 0) {
      return ApiResponseHandler.success([])
    }

    // Customer data is now included via database join

    // Transform the data for frontend consumption
    const adminBookings = bookings.map(booking => {
      const customer = booking.user_profiles?.[0] || { first_name: null, last_name: null, email: null, phone: null }
      const customerName = [customer.first_name, customer.last_name]
        .filter(Boolean)
        .join(' ') || 'Customer'
      
      // Define booking service interface for transformation
      interface BookingServiceData {
        service_details?: {
          name?: string
        }
        price?: number
      }
      
      const services = booking.booking_services?.map((service: BookingServiceData) => ({
        name: service.service_details?.name || 'Service',
        base_price: service.price || 0
      })) || [{ name: 'Vehicle Detailing Service', base_price: booking.total_price || 0 }]

      return {
        id: booking.id,
        booking_reference: booking.booking_reference,
        customer_id: booking.customer_id,
        customer_name: customerName,
        customer_email: customer.email || '',
        customer_phone: customer.phone || '',
        scheduled_date: booking.scheduled_date,
        start_time: booking.scheduled_start_time,
        scheduled_start_time: booking.scheduled_start_time,
        scheduled_end_time: booking.scheduled_end_time,
        status: booking.status,
        total_price: booking.total_price || 0,
        special_instructions: booking.special_instructions,
        services,
        vehicle: {
          make: booking.vehicle_details?.make || 'Vehicle',
          model: booking.vehicle_details?.model || 'Details',
          year: booking.vehicle_details?.year,
          color: booking.vehicle_details?.color,
          license_plate: booking.vehicle_details?.registration
        },
        address: {
          address_line_1: booking.service_address?.address_line_1 || 'Service Location',
          address_line_2: booking.service_address?.address_line_2,
          city: booking.service_address?.city || 'City',
          postal_code: booking.service_address?.postcode || 'Postcode'
        },
        created_at: booking.created_at,
        updated_at: booking.updated_at
      }
    })

    return ApiResponseHandler.success(adminBookings)

  } catch (error) {
    console.error('Admin bookings error:', error)
    return ApiResponseHandler.serverError('Failed to fetch bookings')
  }
}