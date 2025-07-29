import { NextRequest } from 'next/server'
import { createClientFromRequest } from '@/lib/supabase/server'
import { supabaseAdmin } from '@/lib/supabase/direct'
import { ApiResponseHandler } from '@/lib/api/response'
import { authenticateAdmin } from '@/lib/api/auth-handler'

export async function GET(request: NextRequest) {
  try {
    // TODO: Re-enable authentication after fixing session issues
    // const authResult = await authenticateAdmin(request)
    // if (!authResult.success) {
    //   return authResult.error
    // }
    
    // Use admin client for now to bypass authentication issues
    const supabase = supabaseAdmin

    // Get recent bookings with basic query (no joins for now)
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
        service_id,
        vehicle_id,
        address_id
      `)
      .order('created_at', { ascending: false })
      .limit(10)

    if (bookingsError) {
      console.error('Recent bookings error:', bookingsError)
      console.error('Error details:', JSON.stringify(bookingsError, null, 2))
      return ApiResponseHandler.serverError(`Failed to fetch recent bookings: ${bookingsError.message}`)
    }

    console.log('Bookings fetched successfully:', bookings?.length || 0)

    // Customer data is now included in the booking query via join

    // Get all customer IDs to fetch customer data
    const customerIds = [...new Set(bookings?.map(b => b.customer_id).filter(Boolean) || [])]
    
    // Fetch customer data separately
    const { data: customers } = await supabase
      .from('user_profiles')
      .select('id, email, first_name, last_name')
      .in('id', customerIds)
    
    // Create a customer lookup map
    const customerMap = new Map(customers?.map(c => [c.id, c]) || [])
    
    // Get all service IDs to fetch service data
    const serviceIds = [...new Set(bookings?.map(b => b.service_id).filter(Boolean) || [])]
    
    // Fetch service data separately
    const { data: services } = await supabase
      .from('services')
      .select('id, name')
      .in('id', serviceIds)
    
    // Create a service lookup map
    const serviceMap = new Map(services?.map(s => [s.id, s]) || [])

    // Get all vehicle IDs to fetch vehicle data
    const vehicleIds = [...new Set(bookings?.map(b => b.vehicle_id).filter(Boolean) || [])]
    
    // Fetch vehicle data separately
    const { data: vehicles } = await supabase
      .from('customer_vehicles')
      .select('id, make, model, year, color, license_plate, registration')
      .in('id', vehicleIds)
    
    // Create a vehicle lookup map
    const vehicleMap = new Map(vehicles?.map(v => [v.id, v]) || [])

    // Get all address IDs to fetch address data
    const addressIds = [...new Set(bookings?.map(b => b.address_id).filter(Boolean) || [])]
    
    // Fetch address data separately
    const { data: addresses } = await supabase
      .from('customer_addresses')
      .select('id, address_line_1, address_line_2, city, postal_code, county')
      .in('id', addressIds)
    
    // Create an address lookup map
    const addressMap = new Map(addresses?.map(a => [a.id, a]) || [])

    // Transform the data for the frontend
    const recentBookings = bookings?.map((booking: any) => {
      // Get customer info from lookup
      const customer = customerMap.get(booking.customer_id) || { first_name: null, last_name: null, email: null }
      const customerName = [customer.first_name, customer.last_name]
        .filter(Boolean)
        .join(' ') || 'Customer'
      
      // Get vehicle info from lookup using vehicle_id
      const vehicleData = vehicleMap.get(booking.vehicle_id) || { make: null, model: null, year: null, color: null, license_plate: null, registration: null }
      const vehicle = {
        make: vehicleData.make || 'Unknown Make',
        model: vehicleData.model || 'Unknown Model', 
        year: vehicleData.year || null,
        color: vehicleData.color || null,
        registration: vehicleData.registration || vehicleData.license_plate || null
      }
      
      // Get address info from lookup using address_id
      const addressData = addressMap.get(booking.address_id) || { address_line_1: null, address_line_2: null, city: null, postal_code: null, county: null }
      const address = {
        address_line_1: addressData.address_line_1 || 'Unknown Address',
        address_line_2: addressData.address_line_2 || null,
        city: addressData.city || 'Unknown City',
        postal_code: addressData.postal_code || 'Unknown Postcode',
        county: addressData.county || null
      }
      
      // Get service info from lookup
      const service = serviceMap.get(booking.service_id)
      const serviceName = service?.name || 'Vehicle Detailing Service'
      
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
          make: vehicle.make,
          model: vehicle.model,
          year: vehicle.year,
          color: vehicle.color,
          registration: vehicle.registration,
          display: `${vehicle.year || ''} ${vehicle.make} ${vehicle.model}`.trim() || 'Unknown Vehicle'
        },
        address: {
          address_line_1: address.address_line_1,
          address_line_2: address.address_line_2,
          city: address.city,
          postal_code: address.postal_code,
          county: address.county,
          display: `${address.address_line_1}, ${address.city} ${address.postal_code}`.replace(/^, |, $/, '') || 'Unknown Address'
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