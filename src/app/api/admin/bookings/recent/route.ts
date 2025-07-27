import { NextRequest } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { ApiResponseHandler } from '@/lib/api/response'

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()
    
    // Get current user and verify admin role
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    
    if (authError || !user) {
      return ApiResponseHandler.unauthorized('Authentication required')
    }

    // Check user role
    const { data: profile } = await supabase
      .from('user_profiles')
      .select('role')
      .eq('id', user.id)
      .single()

    if (!profile || (profile.role !== 'admin' && profile.role !== 'super_admin')) {
      return ApiResponseHandler.forbidden('Admin access required')
    }

    // Get recent bookings (simplified query)
    const { data: bookings, error: bookingsError } = await supabase
      .from('bookings')
      .select(`
        id,
        booking_reference,
        scheduled_date,
        start_time,
        status,
        total_price,
        created_at,
        customer_id,
        vehicle_id,
        address_id
      `)
      .order('created_at', { ascending: false })
      .limit(10)

    if (bookingsError) {
      console.error('Recent bookings error:', bookingsError)
      return ApiResponseHandler.serverError('Failed to fetch recent bookings')
    }

    // Transform the data for the frontend (simplified - can be enhanced later)
    const recentBookings = bookings?.map(booking => ({
      id: booking.id,
      booking_reference: booking.booking_reference,
      customer_name: 'Customer', // Will be populated from separate query if needed
      customer_email: '',
      scheduled_date: booking.scheduled_date,
      start_time: booking.start_time,
      status: booking.status,
      total_price: booking.total_price,
      services: [{ name: 'Vehicle Detailing Service' }], // Simplified
      vehicle: {
        make: 'Vehicle',
        model: 'Details',
        year: undefined
      },
      address: {
        address_line_1: 'Service Location',
        city: 'City',
        postal_code: 'Postcode'
      },
      created_at: booking.created_at
    })) || []

    return ApiResponseHandler.success({
      bookings: recentBookings,
      total: recentBookings.length
    })

  } catch (error) {
    console.error('Recent bookings error:', error)
    return ApiResponseHandler.serverError('Failed to fetch recent bookings')
  }
}