import { NextRequest, NextResponse } from 'next/server'
import { createClientFromRequest } from '@/lib/supabase/server'
import { ApiResponse } from '@/types/booking'

const ADMIN_EMAILS = [
  'zell@love4detailing.com',
  'paul@evans-studio.co.uk'
]

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

    // Get user profile to check role
    const { data: profile, error: profileError } = await supabase
      .from('user_profiles')
      .select('id, email, role, is_active')
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

    // Determine if user is admin
    const isAdmin = profile.role === 'admin' || ADMIN_EMAILS.includes(profile.email.toLowerCase())

    // Fetch booking with proper joins
    const { data: booking, error: bookingError } = await supabase
      .from('bookings')
      .select(`
        id,
        booking_reference,
        customer_id,
        scheduled_date,
        scheduled_start_time,
        scheduled_end_time,
        status,
        total_price,
        special_requests,
        created_at,
        customer_vehicles (
          make,
          model,
          year,
          color,
          license_number,
          vehicle_size
        ),
        customer_addresses (
          label,
          address_line_1,
          address_line_2,
          city,
          county,
          postal_code,
          country
        ),
        booking_services (
          service_id,
          service_name,
          price,
          duration
        )
      `)
      .eq('id', bookingId)
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

    // Check access permissions
    if (!isAdmin && booking.customer_id !== profile.id) {
      return NextResponse.json({
        success: false,
        error: { message: 'Access denied', code: 'FORBIDDEN' }
      }, { status: 403 })
    }

    // Transform the data for frontend consumption
    const transformedBooking = {
      id: booking.id,
      booking_reference: booking.booking_reference,
      customer_id: booking.customer_id,
      scheduled_date: booking.scheduled_date,
      start_time: booking.scheduled_start_time,
      end_time: booking.scheduled_end_time,
      status: booking.status,
      total_price: booking.total_price,
      special_requests: booking.special_requests,
      created_at: booking.created_at,
      services: booking.booking_services?.map((service: any) => ({
        name: service.service_name,
        price: service.price,
        duration: service.duration
      })) || [],
      vehicle: booking.customer_vehicles && booking.customer_vehicles.length > 0 ? {
        make: booking.customer_vehicles[0]?.make,
        model: booking.customer_vehicles[0]?.model,
        year: booking.customer_vehicles[0]?.year,
        color: booking.customer_vehicles[0]?.color,
        license_number: booking.customer_vehicles[0]?.license_number,
        vehicle_size: booking.customer_vehicles[0]?.vehicle_size
      } : null,
      address: booking.customer_addresses && booking.customer_addresses.length > 0 ? {
        label: booking.customer_addresses[0]?.label,
        address_line_1: booking.customer_addresses[0]?.address_line_1,
        address_line_2: booking.customer_addresses[0]?.address_line_2,
        city: booking.customer_addresses[0]?.city,
        county: booking.customer_addresses[0]?.county,
        postal_code: booking.customer_addresses[0]?.postal_code,
        country: booking.customer_addresses[0]?.country
      } : null
    }

    return NextResponse.json({
      success: true,
      data: transformedBooking
    })

  } catch (error) {
    console.error('Admin booking details API error:', error)
    return NextResponse.json({
      success: false,
      error: { message: 'Internal server error', code: 'SERVER_ERROR' }
    }, { status: 500 })
  }
}

export async function PUT(
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

    // Get user profile to check role
    const { data: profile, error: profileError } = await supabase
      .from('user_profiles')
      .select('id, email, role, is_active')
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
    const body = await request.json()

    // Only admins can update bookings via this route
    const isAdmin = profile.role === 'admin' || ADMIN_EMAILS.includes(profile.email.toLowerCase())
    
    if (!isAdmin) {
      return NextResponse.json({
        success: false,
        error: { message: 'Admin access required', code: 'FORBIDDEN' }
      }, { status: 403 })
    }

    // Update booking
    const { data: updatedBooking, error: updateError } = await supabase
      .from('bookings')
      .update({
        status: body.status,
        special_requests: body.special_requests,
        updated_at: new Date().toISOString()
      })
      .eq('id', bookingId)
      .select('*')
      .single()

    if (updateError) {
      console.error('Error updating booking:', updateError)
      return NextResponse.json({
        success: false,
        error: { message: 'Failed to update booking', code: 'UPDATE_FAILED' }
      }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      data: updatedBooking
    })

  } catch (error) {
    console.error('Update booking API error:', error)
    return NextResponse.json({
      success: false,
      error: { message: 'Internal server error', code: 'SERVER_ERROR' }
    }, { status: 500 })
  }
}