import { NextRequest } from 'next/server'
import { createClientFromRequest } from '@/lib/supabase/server'
import { ApiResponseHandler } from '@/lib/api/response'

export async function GET(request: NextRequest) {
  try {
    const supabase = createClientFromRequest(request)
    
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

    // Get all customer profiles with their booking statistics
    const { data: customerProfiles, error: profilesError } = await supabase
      .from('user_profiles')
      .select(`
        id,
        first_name,
        last_name,
        email,
        phone,
        created_at,
        role
      `)
      .eq('role', 'customer')
      .order('created_at', { ascending: false })

    if (profilesError) {
      console.error('Error fetching customer profiles:', profilesError)
      return ApiResponseHandler.serverError('Failed to fetch customers')
    }

    if (!customerProfiles || customerProfiles.length === 0) {
      return ApiResponseHandler.success([])
    }

    // Get customer IDs for bulk queries
    const customerIds = customerProfiles.map(p => p.id)

    // Get booking statistics for each customer
    const { data: bookingStats, error: statsError } = await supabase
      .from('bookings')
      .select(`
        customer_id,
        total_price,
        status,
        scheduled_date,
        created_at,
        booking_services(
          service_details
        )
      `)
      .in('customer_id', customerIds)
      .neq('status', 'cancelled')

    if (statsError) {
      console.error('Error fetching booking stats:', statsError)
    }

    // Get addresses for each customer
    const { data: addresses, error: addressError } = await supabase
      .from('customer_addresses')
      .select('*')
      .in('user_id', customerIds)

    if (addressError) {
      console.error('Error fetching addresses:', addressError)
    }

    // Get vehicles for each customer
    const { data: vehicles, error: vehicleError } = await supabase
      .from('customer_vehicles')
      .select('*')
      .in('user_id', customerIds)

    if (vehicleError) {
      console.error('Error fetching vehicles:', vehicleError)
    }

    // Process and combine all data
    const customers = customerProfiles.map(profile => {
      const customerBookings = bookingStats?.filter(b => b.customer_id === profile.id) || []
      const customerAddresses = addresses?.filter(a => a.user_id === profile.id) || []
      const customerVehicles = vehicles?.filter(v => v.user_id === profile.id) || []

      // Calculate statistics
      const totalBookings = customerBookings.length
      const totalSpent = customerBookings.reduce((sum, booking) => sum + (booking.total_price || 0), 0)
      const avgBookingValue = totalBookings > 0 ? Math.round(totalSpent / totalBookings) : 0
      
      // Get last booking date
      const lastBooking = customerBookings
        .sort((a, b) => new Date(b.scheduled_date).getTime() - new Date(a.scheduled_date).getTime())[0]
      
      // Determine customer status
      const daysSinceLastBooking = lastBooking 
        ? Math.floor((Date.now() - new Date(lastBooking.scheduled_date).getTime()) / (1000 * 60 * 60 * 24))
        : null
      
      let status = 'inactive'
      if (totalSpent >= 500) {
        status = 'vip'
      } else if (daysSinceLastBooking !== null && daysSinceLastBooking <= 90) {
        status = 'active'
      }

      // Get recent services
      const recentServices = customerBookings
        .slice(0, 5)
        .flatMap(booking => 
          booking.booking_services?.map(bs => ({
            name: bs.service_details?.name || 'Service',
            date: booking.scheduled_date
          })) || []
        )
        .slice(0, 5)

      return {
        id: profile.id,
        first_name: profile.first_name || 'Customer',
        last_name: profile.last_name || '',
        email: profile.email || '',
        phone: profile.phone,
        created_at: profile.created_at,
        last_booking_date: lastBooking?.scheduled_date,
        total_bookings: totalBookings,
        total_spent: totalSpent,
        avg_booking_value: avgBookingValue,
        status,
        addresses: customerAddresses.map(addr => ({
          id: addr.id,
          address_line_1: addr.address_line_1,
          city: addr.city,
          postcode: addr.postcode,
          is_primary: addr.is_primary
        })),
        vehicles: customerVehicles.map(vehicle => ({
          id: vehicle.id,
          make: vehicle.make,
          model: vehicle.model,
          year: vehicle.year,
          is_primary: vehicle.is_primary
        })),
        recent_services: recentServices
      }
    })

    return ApiResponseHandler.success(customers)

  } catch (error) {
    console.error('Admin customers error:', error)
    return ApiResponseHandler.serverError('Failed to fetch customers')
  }
}