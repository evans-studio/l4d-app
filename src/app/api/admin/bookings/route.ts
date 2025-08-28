import { NextRequest } from 'next/server'
import { createClientFromRequest } from '@/lib/supabase/server'
import { ApiResponseHandler } from '@/lib/api/response'
import { authenticateAdmin } from '@/lib/api/auth-handler'
import { logger } from '@/lib/utils/logger'

export async function GET(request: NextRequest) {
  try {
    const authResult = await authenticateAdmin(request)
    if (!authResult.success) {
      return authResult.error
    }
    
    const supabase = createClientFromRequest(request)
    const { searchParams } = new URL(request.url)

    // Parse query parameters
    const dateFilter = searchParams.get('date')
    const sortBy = searchParams.get('sort') || 'created_at'

    // Build optimized query for admin bookings
    let query = supabase
      .from('bookings')
      .select(`
        id,
        booking_reference,
        customer_id,
        service_id,
        vehicle_id,
        address_id,
        scheduled_date,
        scheduled_start_time,
        scheduled_end_time,
        status,
        total_price,
        special_instructions,
        created_at
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
      logger.error('Admin bookings database error:', bookingsError)
      return ApiResponseHandler.serverError('Failed to fetch bookings: ' + bookingsError.message)
    }


    if (!bookings || bookings.length === 0) {
      return ApiResponseHandler.success([])
    }

    // Get additional data separately to avoid complex joins
    
    // Get customer profiles
    const customerIds = [...new Set(bookings.map(b => b.customer_id).filter(Boolean))]
    const { data: customers } = await supabase
      .from('user_profiles')
      .select('id, first_name, last_name, email, phone')
      .in('id', customerIds)

    // Get services
    const serviceIds = [...new Set(bookings.map(b => b.service_id).filter(Boolean))]
    const { data: services } = await supabase
      .from('services')
      .select('id, name, short_description')
      .in('id', serviceIds)

    // Get vehicles
    const vehicleIds = [...new Set(bookings.map(b => b.vehicle_id).filter(Boolean))]
    const { data: vehicles } = await supabase
      .from('customer_vehicles')
      .select('id, make, model, year, color')
      .in('id', vehicleIds)

    // Get addresses
    const addressIds = [...new Set(bookings.map(b => b.address_id).filter(Boolean))]
    const { data: addresses } = await supabase
      .from('customer_addresses')
      .select('id, address_line_1, city, postal_code')
      .in('id', addressIds)

    // Get pending reschedule requests for these bookings
    const bookingIds = bookings.map(b => b.id)
    const { data: rescheduleRequests } = await supabase
      .from('booking_reschedule_requests')
      .select('id, booking_id, requested_date, requested_time, reason, created_at')
      .in('booking_id', bookingIds)
      .eq('status', 'pending')


    // Create lookup maps
    const customerMap = new Map(customers?.map(c => [c.id, c]) || [])
    const serviceMap = new Map(services?.map(s => [s.id, s]) || [])
    const vehicleMap = new Map(vehicles?.map(v => [v.id, v]) || [])
    const addressMap = new Map(addresses?.map(a => [a.id, a]) || [])
    const rescheduleMap = new Map(rescheduleRequests?.map(r => [r.booking_id, r]) || [])

    // Transform the data for frontend consumption
    type CustomerLite = { id: string; first_name?: string; last_name?: string; email?: string; phone?: string }
    type ServiceLite = { id: string; name?: string; short_description?: string }
    type VehicleLite = { id: string; make?: string; model?: string; year?: number | null; color?: string }
    type AddressLite = { id: string; address_line_1?: string; city?: string; postal_code?: string }
    type RescheduleLite = { id: string; booking_id: string; requested_date: string; requested_time: string; reason?: string; created_at: string }

    const adminBookings = bookings.map((booking: { 
      id: string,
      customer_id: string, 
      service_id: string, 
      vehicle_id: string, 
      address_id: string, 
      booking_reference: string,
      scheduled_date: string,
      scheduled_start_time: string,
      status: string,
      total_price: number,
      special_instructions?: string,
      created_at: string
    }) => {
      const customer = (customerMap.get(booking.customer_id) as CustomerLite) || { id: booking.customer_id, first_name: '', last_name: '', email: '', phone: '' }
      const service = (serviceMap.get(booking.service_id) as ServiceLite) || { id: booking.service_id, name: '', short_description: '' }
      const vehicle = (vehicleMap.get(booking.vehicle_id) as VehicleLite) || { id: booking.vehicle_id, make: '', model: '', year: null, color: '' }
      const address = (addressMap.get(booking.address_id) as AddressLite) || { id: booking.address_id, address_line_1: '', city: '', postal_code: '' }
      const rescheduleRequest = rescheduleMap.get(booking.id) as RescheduleLite | undefined
      
      const customerName = [customer.first_name, customer.last_name]
        .filter(Boolean)
        .join(' ') || 'Customer'

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
        services: [{
          name: service.name || 'Vehicle Detailing Service',
          base_price: booking.total_price || 0
        }],
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
        created_at: booking.created_at,
        // Reschedule request data
        has_pending_reschedule: !!rescheduleRequest,
        reschedule_request: rescheduleRequest ? {
          id: rescheduleRequest.id,
          requested_date: rescheduleRequest.requested_date,
          requested_time: rescheduleRequest.requested_time,
          reason: rescheduleRequest.reason,
          created_at: rescheduleRequest.created_at
        } : null
      }
    })

    return ApiResponseHandler.success(adminBookings)

  } catch (error) {
    logger.error('Admin bookings error:', error instanceof Error ? error : undefined)
    return ApiResponseHandler.serverError('Failed to fetch bookings')
  }
}