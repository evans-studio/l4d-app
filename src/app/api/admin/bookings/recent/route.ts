import { NextRequest } from 'next/server'
import { createClientFromRequest } from '@/lib/supabase/server'
import { supabaseAdmin } from '@/lib/supabase/direct'
import { ApiResponseHandler } from '@/lib/api/response'
import { authenticateAdmin } from '@/lib/api/auth-handler'

export async function GET(request: NextRequest) {
  try {
    // Re-enable authentication for security
    const authResult = await authenticateAdmin(request)
    if (!authResult.success) {
      return authResult.error!
    }
    
    // Use admin client for database queries
    const supabase = supabaseAdmin

    // Get recent bookings with optimized query using joins and embedded data
    const { data: bookings, error: bookingsError } = await supabase
      .from('bookings')
      .select(`
        id,
        booking_reference,
        customer_id,
        address_id,
        scheduled_date,
        scheduled_start_time,
        status,
        total_price,
        vehicle_details,
        service_address,
        created_at,
        booking_services (
          id,
          service_details,
          price,
          service_id
        )
      `)
      .order('created_at', { ascending: false })
      .limit(10)

    if (bookingsError) {
      console.error('Recent bookings error:', bookingsError)
      console.error('Error details:', JSON.stringify(bookingsError, null, 2))
      return ApiResponseHandler.serverError(`Failed to fetch recent bookings: ${bookingsError.message}`)
    }

    console.log('Bookings fetched successfully:', bookings?.length || 0)

    // Get unique customer IDs and fetch user profiles separately (include phone)
    const customerIds = [...new Set(bookings?.map(b => b.customer_id).filter(Boolean))] as string[]
    let customerProfiles: any[] = []
    
    if (customerIds.length > 0) {
      const { data: profiles, error: profilesError } = await supabase
        .from('user_profiles')
        .select('id, email, first_name, last_name, phone')
        .in('id', customerIds)
      
      if (profilesError) {
        console.error('Error fetching customer profiles:', profilesError)
      } else {
        customerProfiles = profiles || []
      }
    }

    // Get addresses for bookings that reference customer_addresses
    const addressIds = [...new Set((bookings || []).map((b: any) => b.address_id).filter(Boolean))] as string[]
    let addressMap: Record<string, any> = {}
    if (addressIds.length > 0) {
      const { data: addresses, error: addressesError } = await supabase
        .from('customer_addresses')
        .select('id, address_line_1, address_line_2, city, postal_code, county, country')
        .in('id', addressIds)
      if (addressesError) {
        console.error('Error fetching addresses:', addressesError)
      } else {
        addressMap = (addresses || []).reduce((acc: Record<string, any>, a: any) => {
          acc[a.id] = a
          return acc
        }, {})
      }
    }

    // Transform the data for the frontend using embedded JSON and separate profile data
    const recentBookings = bookings?.map((booking: any) => {
      // Get customer info from separate profile data
      const customer = customerProfiles.find(p => p.id === booking.customer_id) || { first_name: '', last_name: '', email: '', phone: '' }
      const customerName = [customer.first_name, customer.last_name]
        .filter(Boolean)
        .join(' ') || 'Customer'
      
      // Get vehicle info from embedded JSON
      const vehicleData = booking.vehicle_details || { make: 'Unknown', model: 'Vehicle', year: null, color: null }
      const vehicle = {
        make: vehicleData.make || 'Unknown',
        model: vehicleData.model || 'Vehicle',
        year: vehicleData.year || null,
        color: vehicleData.color || null
      }
      
      // Get address from normalized table when available, otherwise embedded JSON fallback
      const fromAddressTable = booking.address_id ? addressMap[booking.address_id] : null
      // Merge normalized and embedded address to maximize filled fields
      const merged = {
        ...(booking.service_address || {}),
        ...(fromAddressTable || {})
      }
      const addressData = merged.address_line_1 || merged.city || merged.postal_code ? merged : { address_line_1: '', city: 'Unknown', postal_code: '' }
      const address = {
        address_line_1: addressData.address_line_1 || addressData.name || addressData.address || addressData.line1 || addressData.address1 || '',
        city: addressData.city || addressData.town || 'Unknown',
        postal_code: addressData.postal_code || addressData.postcode || ''
      }
      
      // Get services from booking_services relationship
      const services = booking.booking_services?.map((bs: any) => ({
        name: bs.service_details?.name || 'Vehicle Detailing Service'
      })) || [{ name: 'Vehicle Detailing Service' }]
      
      return {
        id: booking.id,
        booking_reference: booking.booking_reference,
        customer_name: customerName,
        customer_email: customer.email || '',
        customer_phone: customer.phone || '',
        scheduled_date: booking.scheduled_date,
        start_time: booking.scheduled_start_time,
        status: booking.status,
        total_price: booking.total_price,
        services: services,
        vehicle: {
          make: vehicle.make,
          model: vehicle.model,
          year: vehicle.year,
          color: vehicle.color
        },
        address: {
          city: address.city,
          postal_code: address.postal_code
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