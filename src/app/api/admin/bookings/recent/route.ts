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

    // Get recent bookings with all related data
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
        customer_profiles!inner (
          first_name,
          last_name,
          email
        ),
        booking_services!inner (
          services!inner (
            name
          )
        ),
        customer_vehicles!inner (
          make,
          model,
          year
        ),
        customer_addresses!inner (
          address_line_1,
          address_line_2,
          city,
          postal_code
        )
      `)
      .order('created_at', { ascending: false })
      .limit(10)

    if (bookingsError) {
      console.error('Recent bookings error:', bookingsError)
      return ApiResponseHandler.serverError('Failed to fetch recent bookings')
    }

    // Transform the data for the frontend
    const recentBookings = bookings?.map(booking => ({
      id: booking.id,
      booking_reference: booking.booking_reference,
      customer_name: `${booking.customer_profiles?.first_name || ''} ${booking.customer_profiles?.last_name || ''}`.trim(),
      customer_email: booking.customer_profiles?.email || '',
      scheduled_date: booking.scheduled_date,
      start_time: booking.start_time,
      status: booking.status,
      total_price: booking.total_price,
      services: booking.booking_services?.map((bs: any) => ({
        name: bs.services?.name || 'Unknown Service'
      })) || [],
      vehicle: {
        make: booking.customer_vehicles?.make || '',
        model: booking.customer_vehicles?.model || '',
        year: booking.customer_vehicles?.year
      },
      address: {
        address_line_1: booking.customer_addresses?.address_line_1 || '',
        city: booking.customer_addresses?.city || '',
        postal_code: booking.customer_addresses?.postal_code || ''
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