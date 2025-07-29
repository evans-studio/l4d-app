import { NextRequest, NextResponse } from 'next/server'
import { createClientFromRequest } from '@/lib/supabase/server'
import { ApiResponse } from '@/types/booking'

export async function GET(request: NextRequest): Promise<NextResponse<ApiResponse>> {
  try {
    const supabase = createClientFromRequest(request)
    
    // Get current user (this also validates the session)
    const { data: { user }, error: userError } = await supabase.auth.getUser()
    
    if (userError || !user) {
      return NextResponse.json({
        success: false,
        error: { message: 'Authentication required', code: 'UNAUTHORIZED' }
      }, { status: 401 })
    }

    // Get user profile to get the actual customer ID
    const { data: profile, error: profileError } = await supabase
      .from('user_profiles')
      .select('id, is_active')
      .eq('id', user.id)
      .single()

    if (profileError || !profile || profile.is_active === false) {
      return NextResponse.json({
        success: false,
        error: { message: 'User account not found or inactive', code: 'USER_INACTIVE' }
      }, { status: 401 })
    }

    // Fetch bookings with proper joins to the normalized schema
    const { data: bookings, error: bookingsError } = await supabase
      .from('bookings')
      .select(`
        id,
        booking_reference,
        scheduled_date,
        scheduled_start_time,
        scheduled_end_time,
        status,
        total_price,
        pricing_breakdown,
        special_instructions,
        created_at,
        confirmation_sent_at,
        customer_vehicles!vehicle_id (
          make,
          model,
          year,
          color,
          license_plate,
          vehicle_sizes!vehicle_size_id (
            name,
            price_multiplier
          )
        ),
        customer_addresses!address_id (
          address_line_1,
          address_line_2,
          city,
          county,
          postal_code,
          country,
          distance_from_business
        ),
        services!service_id (
          name,
          short_description,
          service_categories!category_id (
            name
          )
        ),
        booking_services!booking_id (
          service_details,
          price,
          estimated_duration
        )
      `)
      .eq('customer_id', profile.id)
      .order('created_at', { ascending: false })

    if (bookingsError) {
      console.error('Error fetching bookings:', bookingsError)
      return NextResponse.json({
        success: false,
        error: { message: 'Failed to fetch bookings', code: 'DATABASE_ERROR' }
      }, { status: 500 })
    }

    // Transform the data for frontend consumption
    const transformedBookings = bookings?.map((booking: any) => ({
      id: booking.id,
      booking_reference: booking.booking_reference,
      scheduled_date: booking.scheduled_date,
      scheduled_start_time: booking.scheduled_start_time,
      scheduled_end_time: booking.scheduled_end_time,
      status: booking.status,
      total_price: booking.total_price,
      pricing_breakdown: booking.pricing_breakdown,
      special_instructions: booking.special_instructions,
      created_at: booking.created_at,
      confirmation_sent_at: booking.confirmation_sent_at,
      
      // Service information from main service and booking services
      service: booking.services ? {
        name: booking.services.name,
        short_description: booking.services.short_description,
        category: booking.services.service_categories?.name || 'General'
      } : null,
      
      // Detailed service breakdown from booking_services
      booking_services: booking.booking_services?.map((service: any) => ({
        service_details: service.service_details,
        price: service.price,
        estimated_duration: service.estimated_duration
      })) || [],
      
      // Vehicle information with size details
      vehicle: booking.customer_vehicles ? {
        make: booking.customer_vehicles.make,
        model: booking.customer_vehicles.model,
        year: booking.customer_vehicles.year,
        color: booking.customer_vehicles.color,
        license_plate: booking.customer_vehicles.license_plate,
        vehicle_size: {
          name: booking.customer_vehicles.vehicle_sizes?.name || 'Unknown',
          price_multiplier: booking.customer_vehicles.vehicle_sizes?.price_multiplier || 1
        }
      } : null,
      
      // Address information with distance
      address: booking.customer_addresses ? {
        address_line_1: booking.customer_addresses.address_line_1,
        address_line_2: booking.customer_addresses.address_line_2,
        city: booking.customer_addresses.city,
        county: booking.customer_addresses.county,
        postal_code: booking.customer_addresses.postal_code,
        country: booking.customer_addresses.country,
        distance_from_business: booking.customer_addresses.distance_from_business
      } : null
    })) || []

    return NextResponse.json({
      success: true,
      data: transformedBookings
    })

  } catch (error) {
    console.error('Customer bookings API error:', error)
    return NextResponse.json({
      success: false,
      error: { message: 'Internal server error', code: 'SERVER_ERROR' }
    }, { status: 500 })
  }
}