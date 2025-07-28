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

    // Get all bookings with full details
    const { data: bookings, error: bookingsError } = await supabase
      .from('bookings')
      .select(`
        id,
        booking_reference,
        scheduled_date,
        scheduled_start_time,
        status,
        total_price,
        special_instructions,
        vehicle_details,
        service_address,
        created_at,
        updated_at,
        customer_id,
        booking_services(
          id,
          service_details,
          price
        )
      `)
      .order('created_at', { ascending: false })

    if (bookingsError) {
      console.error('Admin bookings error:', bookingsError)
      return ApiResponseHandler.serverError('Failed to fetch bookings')
    }

    if (!bookings || bookings.length === 0) {
      return ApiResponseHandler.success([])
    }

    // Get customer details for each booking
    const customerIds = [...new Set(bookings.map(b => b.customer_id))]
    const { data: customers, error: customerError } = await supabase.auth.admin.listUsers()

    const customerMap = customers?.users?.reduce((acc, user) => {
      acc[user.id] = {
        name: user.user_metadata?.full_name || 
              (user.user_metadata?.first_name && user.user_metadata?.last_name 
                ? `${user.user_metadata.first_name} ${user.user_metadata.last_name}` 
                : user.user_metadata?.first_name || 'Customer'),
        email: user.email || '',
        phone: user.user_metadata?.phone || user.phone || ''
      }
      return acc
    }, {} as Record<string, { name: string; email: string; phone: string }>) || {}

    // Transform the data for frontend consumption
    const adminBookings = bookings.map(booking => {
      const customer = customerMap[booking.customer_id] || { name: 'Customer', email: '', phone: '' }
      
      const services = booking.booking_services?.map((service: any) => ({
        name: service.service_details?.name || 'Service',
        base_price: service.price || 0
      })) || [{ name: 'Vehicle Detailing Service', base_price: booking.total_price || 0 }]

      return {
        id: booking.id,
        booking_reference: booking.booking_reference,
        customer_id: booking.customer_id,
        customer_name: customer.name,
        customer_email: customer.email,
        customer_phone: customer.phone,
        scheduled_date: booking.scheduled_date,
        start_time: booking.scheduled_start_time,
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