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
        start_time,
        status,
        total_price,
        special_instructions,
        created_at,
        updated_at,
        customer_id,
        vehicle_id,
        address_id
      `)
      .order('created_at', { ascending: false })

    if (bookingsError) {
      console.error('Admin bookings error:', bookingsError)
      return ApiResponseHandler.serverError('Failed to fetch bookings')
    }

    if (!bookings || bookings.length === 0) {
      return ApiResponseHandler.success([])
    }

    // Get unique customer IDs, vehicle IDs, and address IDs
    const customerIds = [...new Set(bookings.map(b => b.customer_id))]
    const vehicleIds = [...new Set(bookings.map(b => b.vehicle_id))]
    const addressIds = [...new Set(bookings.map(b => b.address_id))]

    // Fetch customer details
    const { data: customers } = await supabase
      .from('user_profiles')
      .select('id, first_name, last_name, email, phone')
      .in('id', customerIds)

    // Fetch vehicle details
    const { data: vehicles } = await supabase
      .from('vehicles')
      .select('id, make, model, year, color, license_plate')
      .in('id', vehicleIds)

    // Fetch address details
    const { data: addresses } = await supabase
      .from('addresses')
      .select('id, address_line_1, address_line_2, city, postal_code')
      .in('id', addressIds)

    // Create lookup maps
    const customerMap = new Map(customers?.map(c => [c.id, c]) || [])
    const vehicleMap = new Map(vehicles?.map(v => [v.id, v]) || [])
    const addressMap = new Map(addresses?.map(a => [a.id, a]) || [])

    // Transform the data for frontend consumption
    const adminBookings = bookings.map(booking => {
      const customer = customerMap.get(booking.customer_id)
      const vehicle = vehicleMap.get(booking.vehicle_id)
      const address = addressMap.get(booking.address_id)
      const services = [{ name: 'Vehicle Detailing Service', base_price: booking.total_price || 0 }]

      return {
        id: booking.id,
        booking_reference: booking.booking_reference,
        customer_id: booking.customer_id,
        customer_name: customer ? `${customer.first_name || ''} ${customer.last_name || ''}`.trim() || 'Customer' : 'Customer',
        customer_email: customer?.email || '',
        customer_phone: customer?.phone || '',
        scheduled_date: booking.scheduled_date,
        start_time: booking.start_time,
        status: booking.status,
        total_price: booking.total_price || 0,
        special_instructions: booking.special_instructions,
        services,
        vehicle: {
          make: vehicle?.make || 'Vehicle',
          model: vehicle?.model || 'Details',
          year: vehicle?.year,
          color: vehicle?.color,
          license_plate: vehicle?.license_plate
        },
        address: {
          address_line_1: address?.address_line_1 || 'Service Location',
          address_line_2: address?.address_line_2,
          city: address?.city || 'City',
          postal_code: address?.postal_code || 'Postcode'
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