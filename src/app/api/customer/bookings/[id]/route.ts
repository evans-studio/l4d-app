import { NextRequest, NextResponse } from 'next/server'
import { createClientFromRequest } from '@/lib/supabase/server'
import { ApiResponse } from '@/types/booking'

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
): Promise<NextResponse<ApiResponse>> {
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

    const params = await context.params
    const bookingId = params.id

    // Fetch single booking with proper joins to the normalized schema
    const { data: booking, error: bookingError } = await supabase
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
        vehicle_details,
        service_address,
        created_at,
        confirmation_sent_at,
        confirmed_at,
        customer_id,
        user_profiles!customer_id (
          email,
          first_name,
          last_name,
          phone
        ),
        customer_vehicles!vehicle_id (
          make,
          model,
          year,
          color,
          license_plate,
          vehicle_sizes!vehicle_size_id (
            id,
            size,
            multiplier
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
          id,
          name,
          short_description,
          category,
          base_price,
          estimated_duration
        ),
        time_slots!time_slot_id (
          id,
          start_time,
          end_time
        ),
        booking_services!booking_id (
          service_details,
          price,
          estimated_duration
        )
      `)
      .eq('id', bookingId)
      .eq('customer_id', profile.id)
      .single()

    if (bookingError) {
      if (bookingError.code === 'PGRST116') {
        return NextResponse.json({
          success: false,
          error: { message: 'Booking not found', code: 'NOT_FOUND' }
        }, { status: 404 })
      }
      console.error('Error fetching booking:', bookingError)
      return NextResponse.json({
        success: false,
        error: { message: 'Failed to fetch booking', code: 'DATABASE_ERROR' }
      }, { status: 500 })
    }

    // Transform the data for frontend consumption (format expected by rebooking)
    const transformedBooking = {
      id: booking.id,
      booking_reference: booking.booking_reference,
      scheduled_date: booking.scheduled_date,
      total_price: booking.total_price,
      
      // Customer information
      customer: booking.user_profiles?.[0] ? {
        id: booking.customer_id,
        email: booking.user_profiles[0].email,
        first_name: booking.user_profiles[0].first_name,
        last_name: booking.user_profiles[0].last_name,
        phone: booking.user_profiles[0].phone
      } : null,
      
      // Vehicle details (use stored JSON first, fallback to joined data)
      vehicle_details: booking.vehicle_details || (booking.customer_vehicles?.[0] ? {
        make: booking.customer_vehicles[0].make,
        model: booking.customer_vehicles[0].model,
        year: booking.customer_vehicles[0].year,
        size: booking.customer_vehicles[0].vehicle_sizes?.[0]?.size || 'M',
        color: booking.customer_vehicles[0].color,
        license_plate: booking.customer_vehicles[0].license_plate
      } : null),
      
      // Service address (use stored JSON first, fallback to joined data)
      service_address: booking.service_address || (booking.customer_addresses?.[0] ? {
        address_line_1: booking.customer_addresses[0].address_line_1,
        address_line_2: booking.customer_addresses[0].address_line_2,
        city: booking.customer_addresses[0].city,
        county: booking.customer_addresses[0].county,
        postal_code: booking.customer_addresses[0].postal_code,
        country: booking.customer_addresses[0].country
      } : null),
      
      // Service information
      services: booking.services?.[0] ? {
        id: booking.services[0].id,
        name: booking.services[0].name,
        short_description: booking.services[0].short_description,
        category: booking.services[0].category,
        base_price: booking.services[0].base_price,
        estimated_duration: booking.services[0].estimated_duration
      } : null,
      
      // Time slot information  
      time_slots: booking.time_slots?.[0] ? {
        id: booking.time_slots[0].id,
        start_time: booking.time_slots[0].start_time,
        end_time: booking.time_slots[0].end_time
      } : null,
      
      // Keep original fields for backwards compatibility
      scheduled_start_time: booking.scheduled_start_time,
      scheduled_end_time: booking.scheduled_end_time,
      status: booking.status,
      pricing_breakdown: booking.pricing_breakdown,
      special_instructions: booking.special_instructions,
      created_at: booking.created_at,
      confirmation_sent_at: booking.confirmation_sent_at,
      confirmed_at: booking.confirmed_at,
      
      // Detailed service breakdown from booking_services
      booking_services: booking.booking_services?.map((service: any) => ({
        service_details: service.service_details,
        price: service.price,
        estimated_duration: service.estimated_duration
      })) || []
    }

    return NextResponse.json({
      success: true,
      data: transformedBooking
    })

  } catch (error) {
    console.error('Customer booking details API error:', error)
    return NextResponse.json({
      success: false,
      error: { message: 'Internal server error', code: 'SERVER_ERROR' }
    }, { status: 500 })
  }
}