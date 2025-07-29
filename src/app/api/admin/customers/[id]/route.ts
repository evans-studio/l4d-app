import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

// Create service client that bypasses RLS
const supabaseService = createClient(supabaseUrl, supabaseServiceKey)

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: customerId } = await params
    console.log('Customer detail API: Fetching data for customer:', customerId)

    // Get customer profile
    const { data: customer, error: customerError } = await supabaseService
      .from('user_profiles')
      .select(`
        id,
        first_name,
        last_name,
        email,
        phone,
        created_at,
        updated_at,
        role,
        is_active
      `)
      .eq('id', customerId)
      .eq('role', 'customer')
      .single()

    if (customerError || !customer) {
      console.error('Customer not found:', customerError)
      return NextResponse.json({
        success: false,
        error: { message: 'Customer not found', code: 'CUSTOMER_NOT_FOUND' }
      }, { status: 404 })
    }

    // Get customer's bookings
    const { data: bookings, error: bookingsError } = await supabaseService
      .from('bookings')
      .select(`
        id,
        booking_reference,
        scheduled_date,
        scheduled_start_time,
        status,
        total_price,
        booking_services (
          service_id,
          services (
            name,
            base_price
          )
        ),
        customer_vehicles (
          make,
          model,
          year
        ),
        customer_addresses (
          address_line_1,
          city,
          postal_code
        )
      `)
      .eq('customer_id', customerId)
      .order('scheduled_date', { ascending: false })

    // Get customer's vehicles
    const { data: vehicles, error: vehiclesError } = await supabaseService
      .from('customer_vehicles')
      .select(`
        id,
        make,
        model,
        year,
        color,
        license_plate,
        is_primary
      `)
      .eq('user_id', customerId)
      .order('is_primary', { ascending: false })

    // Get customer's addresses
    const { data: addresses, error: addressesError } = await supabaseService
      .from('customer_addresses')
      .select(`
        id,
        address_line_1,
        address_line_2,
        city,
        postal_code,
        is_primary
      `)
      .eq('user_id', customerId)
      .order('is_primary', { ascending: false })

    // Transform bookings data to match frontend interface
    const transformedBookings = (bookings || []).map(booking => ({
      id: booking.id,
      booking_reference: booking.booking_reference,
      scheduled_date: booking.scheduled_date,
      start_time: booking.scheduled_start_time,
      status: booking.status,
      total_price: booking.total_price,
      services: booking.booking_services?.map(bs => {
        const service = Array.isArray(bs.services) ? bs.services[0] : bs.services
        return {
          name: service?.name || 'Unknown Service',
          price: service?.base_price || 0
        }
      }) || [],
      vehicle: (() => {
        const vehicleData = booking.customer_vehicles
        if (vehicleData && Array.isArray(vehicleData) && vehicleData.length > 0) {
          const vehicle = vehicleData[0]
          return {
            make: vehicle?.make,
            model: vehicle?.model,
            year: vehicle?.year
          }
        }
        return undefined
      })(),
      address: (() => {
        const addressData = booking.customer_addresses
        if (addressData && Array.isArray(addressData) && addressData.length > 0) {
          const address = addressData[0]
          return {
            address_line_1: address?.address_line_1,
            city: address?.city,
            postal_code: address?.postal_code
          }
        }
        return undefined
      })()
    }))

    console.log('Customer detail API results:', {
      customer: !!customer,
      bookings: bookings?.length || 0,
      vehicles: vehicles?.length || 0,
      addresses: addresses?.length || 0,
      bookingsError,
      vehiclesError,
      addressesError
    })

    return NextResponse.json({
      success: true,
      data: {
        customer,
        bookings: transformedBookings,
        vehicles: vehicles || [],
        addresses: addresses || []
      }
    })

  } catch (error) {
    console.error('Customer detail API exception:', error)
    return NextResponse.json({
      success: false,
      error: { message: 'Internal server error' }
    }, { status: 500 })
  }
}