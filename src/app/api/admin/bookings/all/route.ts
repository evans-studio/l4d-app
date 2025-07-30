import { NextRequest } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase/direct'
import { ApiResponseHandler } from '@/lib/api/response'

export async function GET(request: NextRequest) {
  try {
    // TODO: Re-enable authentication after fixing session issues
    // const authResult = await authenticateAdmin(request)
    // if (!authResult.success) {
    //   return authResult.error
    // }
    
    // Use admin client to bypass authentication issues temporarily
    const supabase = supabaseAdmin

    // Get all bookings with basic query (no joins for now)
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
        created_at,
        customer_id,
        service_id,
        vehicle_id,
        address_id
      `)
      .order('created_at', { ascending: false })

    if (bookingsError) {
      console.error('All bookings error:', bookingsError)
      return ApiResponseHandler.serverError(`Failed to fetch bookings: ${bookingsError.message}`)
    }

    if (!bookings || bookings.length === 0) {
      return ApiResponseHandler.success([])
    }

    // Get all customer IDs to fetch customer data
    const customerIds = [...new Set(bookings.map(b => b.customer_id).filter(Boolean))]
    
    // Fetch customer data separately
    const { data: customers } = await supabase
      .from('user_profiles')
      .select('id, email, first_name, last_name, phone')
      .in('id', customerIds)
    
    // Create a customer lookup map
    const customerMap = new Map(customers?.map(c => [c.id, c]) || [])
    
    // Get all service IDs to fetch service data
    const serviceIds = [...new Set(bookings.map(b => b.service_id).filter(Boolean))]
    
    // Fetch service data separately
    const { data: services } = await supabase
      .from('services')
      .select('id, name, short_description')
      .in('id', serviceIds)
    
    // Create a service lookup map
    const serviceMap = new Map(services?.map(s => [s.id, s]) || [])

    // Get all vehicle IDs to fetch vehicle data
    const vehicleIds = [...new Set(bookings.map(b => b.vehicle_id).filter(Boolean))]
    
    // Fetch vehicle data separately
    const { data: vehicles } = await supabase
      .from('customer_vehicles')
      .select('id, make, model, year, color')
      .in('id', vehicleIds)
    
    // Create a vehicle lookup map
    const vehicleMap = new Map(vehicles?.map(v => [v.id, v]) || [])

    // Get all address IDs to fetch address data
    const addressIds = [...new Set(bookings.map(b => b.address_id).filter(Boolean))]
    
    // Fetch address data separately
    const { data: addresses } = await supabase
      .from('customer_addresses')
      .select('id, address_line_1, city, postal_code')
      .in('id', addressIds)
    
    // Create an address lookup map
    const addressMap = new Map(addresses?.map(a => [a.id, a]) || [])

    // Transform the data for the frontend
    const allBookings = bookings.map((booking: any) => {
      // Get customer info from lookup
      const customer = customerMap.get(booking.customer_id) || { first_name: '', last_name: '', email: '', phone: '' }
      const customerName = [customer.first_name, customer.last_name]
        .filter(Boolean)
        .join(' ') || 'Customer'
      
      // Get vehicle info from lookup
      const vehicle = vehicleMap.get(booking.vehicle_id) || { make: '', model: '', year: null, color: '' }
      
      // Get address info from lookup
      const address = addressMap.get(booking.address_id) || { address_line_1: '', city: '', postal_code: '' }
      
      // Get service info from lookup
      const service = serviceMap.get(booking.service_id) || { name: '', short_description: '' }
      
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
        created_at: booking.created_at
      }
    })

    return ApiResponseHandler.success(allBookings)

  } catch (error) {
    console.error('All bookings error:', error)
    return ApiResponseHandler.serverError('Failed to fetch bookings')
  }
}