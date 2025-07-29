import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

// Create service client that bypasses RLS
const supabaseService = createClient(supabaseUrl, supabaseServiceKey)

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const customerId = params.id
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
          services (
            name,
            base_price
          )
        ),
        vehicles (
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
      .from('vehicles')
      .select(`
        id,
        make,
        model,
        year,
        color,
        license_plate,
        is_primary
      `)
      .eq('customer_id', customerId)
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
      .eq('customer_id', customerId)
      .order('is_primary', { ascending: false })

    // Transform bookings data to match frontend interface
    const transformedBookings = (bookings || []).map(booking => ({
      id: booking.id,
      booking_reference: booking.booking_reference,
      scheduled_date: booking.scheduled_date,
      start_time: booking.scheduled_start_time,
      status: booking.status,
      total_price: booking.total_price,
      services: booking.booking_services?.map(bs => ({
        name: bs.services?.name || 'Unknown Service',
        price: bs.services?.base_price || 0
      })) || [],
      vehicle: booking.vehicles ? {
        make: booking.vehicles.make,
        model: booking.vehicles.model,
        year: booking.vehicles.year
      } : undefined,
      address: booking.customer_addresses ? {
        address_line_1: booking.customer_addresses.address_line_1,
        city: booking.customer_addresses.city,
        postal_code: booking.customer_addresses.postal_code
      } : undefined
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