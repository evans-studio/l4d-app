import { NextRequest } from 'next/server'
import { createClientFromRequest } from '@/lib/supabase/server'
import { ApiResponseHandler } from '@/lib/api/response'

export async function GET(request: NextRequest) {
  try {
    const supabase = createClientFromRequest(request)
    
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

    // Get recent bookings with complete data
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

    // Get customer information for each booking
    const customerIds = [...new Set(bookings?.map(b => b.customer_id) || [])]
    const { data: customers, error: customerError } = await supabase.auth.admin.listUsers()

    const customerMap = customers?.users?.reduce((acc, user) => {
      acc[user.id] = {
        name: user.user_metadata?.full_name || user.user_metadata?.first_name || 'Customer',
        email: user.email || ''
      }
      return acc
    }, {} as Record<string, { name: string; email: string }>) || {}

    // Transform the data for the frontend
    const recentBookings = bookings?.map(booking => {
      const customer = customerMap[booking.customer_id] || { name: 'Customer', email: '' }
      
      return {
        id: booking.id,
        booking_reference: booking.booking_reference,
        customer_name: customer.name,
        customer_email: customer.email,
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