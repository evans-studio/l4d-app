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

    console.log('Booking API: Fetching booking ID:', bookingId)
    console.log('User profile:', { id: profile.id, email: profile.email, role: profile.role })

    // Determine if user is admin
    const isAdmin = profile.role === 'admin' || ADMIN_EMAILS.includes(profile.email.toLowerCase())
    console.log('Is admin:', isAdmin)

    // First, try to fetch booking without joins to see if it exists
    const { data: booking, error: bookingError } = await supabase
      .from('bookings')
      .select('*')
      .eq('id', bookingId)
      .single()

    if (bookingError) {
      console.error('Error fetching booking (basic query):', bookingError)
      if (bookingError.code === 'PGRST116') {
        return NextResponse.json({
          success: false,
          error: { message: 'Booking not found', code: 'NOT_FOUND' }
        }, { status: 404 })
      }
      return NextResponse.json({
        success: false,
        error: { message: 'Failed to fetch booking', code: 'DATABASE_ERROR' }
      }, { status: 500 })
    }

    console.log('Booking found:', { id: booking.id, reference: booking.booking_reference, customer_id: booking.customer_id })

    // Now fetch related data separately to avoid join issues
    let vehicle: any = null
    let address: any = null
    let services: any[] = []
    let customer: any = null

    // Get vehicle if vehicle_id exists
    if (booking.vehicle_id) {
      const { data: vehicleData } = await supabase
        .from('customer_vehicles')
        .select('make, model, year, color, license_plate, registration, name')
        .eq('id', booking.vehicle_id)
        .single()
      vehicle = vehicleData
    }

    // Get address if address_id exists  
    if (booking.address_id) {
      const { data: addressData } = await supabase
        .from('customer_addresses')
        .select('name, address_line_1, address_line_2, city, county, postal_code, country, special_instructions')
        .eq('id', booking.address_id)
        .single()
      address = addressData
    }

    // Get customer data
    if (booking.customer_id) {
      const { data: customerData } = await supabase
        .from('user_profiles')
        .select('id, first_name, last_name, email, phone')
        .eq('id', booking.customer_id)
        .single()
      customer = customerData
    }

    // Get booking services
    const { data: bookingServices } = await supabase
      .from('booking_services')
      .select(`
        service_id,
        price,
        estimated_duration,
        service:services!service_id (
          name
        )
      `)
      .eq('booking_id', bookingId)

    if (bookingServices) {
      services = bookingServices.map((service: any) => ({
        name: service.service?.name || 'Unknown Service',
        price: service.price,
        duration: service.estimated_duration
      }))
    }

    // Check access permissions
    if (!isAdmin && booking.customer_id !== profile.id) {
      return NextResponse.json({
        success: false,
        error: { message: 'Access denied', code: 'FORBIDDEN' }
      }, { status: 403 })
    }

    // Get reschedule request data if any
    const { data: rescheduleRequest } = await supabase
      .from('booking_reschedule_requests')
      .select('*')
      .eq('booking_id', bookingId)
      .eq('status', 'pending')
      .single()

    // Transform the data for frontend consumption - matching admin page expectations
    const transformedBooking = {
      id: booking.id,
      booking_reference: booking.booking_reference,
      customer_id: booking.customer_id,
      customer_name: customer ? `${customer.first_name} ${customer.last_name}` : 'Unknown Customer',
      customer_email: customer?.email || '',
      customer_phone: customer?.phone || '',
      scheduled_date: booking.scheduled_date,
      start_time: booking.scheduled_start_time, // Admin page expects 'start_time' not 'scheduled_start_time'
      end_time: booking.scheduled_end_time,
      estimated_duration: booking.estimated_duration,
      status: booking.status,
      total_price: booking.total_price,
      special_instructions: booking.special_instructions,
      admin_notes: booking.admin_notes,
      created_at: booking.created_at,
      updated_at: booking.updated_at,
      services: services.map(service => ({
        name: service.name,
        base_price: service.price,
        quantity: 1, // Default quantity for compatibility
        total_price: service.price
      })),
      vehicle: vehicle ? {
        make: vehicle.make || 'Unknown',
        model: vehicle.model || 'Vehicle',
        year: vehicle.year,
        color: vehicle.color,
        license_plate: vehicle.license_plate || vehicle.registration
      } : null,
      address: address ? {
        address_line_1: address.address_line_1 || '',
        address_line_2: address.address_line_2,
        city: address.city || 'Unknown',
        postal_code: address.postal_code || ''
      } : null,
      // Include reschedule request data if present
      has_pending_reschedule: !!rescheduleRequest,
      reschedule_request: rescheduleRequest ? {
        id: rescheduleRequest.id,
        requested_date: rescheduleRequest.requested_date,
        requested_time: rescheduleRequest.requested_time,
        reason: rescheduleRequest.reason,
        created_at: rescheduleRequest.created_at
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
        special_instructions: body.special_instructions,
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