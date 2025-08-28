import { NextRequest, NextResponse } from 'next/server'
import { createClientFromRequest } from '@/lib/supabase/server'
import { supabaseAdmin } from '@/lib/supabase/direct'
import { ApiResponse } from '@/types/booking'
import { logger } from '@/lib/utils/logger'
import { env } from '@/lib/config/environment'

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
    const isAdmin = profile.role === 'admin' || env.auth.adminEmails.includes(profile.email.toLowerCase())
    
    // Use admin client for admin users to bypass RLS, user client for regular users
    const dbClient = isAdmin ? supabaseAdmin : supabase

    // First, try to fetch booking without joins to see if it exists
    const { data: booking, error: bookingError } = await dbClient
      .from('bookings')
      .select('*')
      .eq('id', bookingId)
      .single()

    if (bookingError) {
      logger.error('Error fetching booking (basic query):', bookingError)
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


    // Now fetch related data separately to avoid join issues
    type CustomerProfileLite = { id: string; first_name?: string | null; last_name?: string | null; email?: string | null; phone?: string | null }
    type VehicleLite = { make?: string | null; model?: string | null; year?: number | null; color?: string | null; license_plate?: string | null; registration?: string | null }
    type AddressLoose = Record<string, unknown>
    type ServiceLite = { name?: string; price?: number; duration?: number }

    let vehicle: VehicleLite | null = null
    let address: AddressLoose | null = null
    let services: ServiceLite[] = []
    let customer: CustomerProfileLite | null = null

    // Get vehicle if vehicle_id exists, otherwise use embedded vehicle_details
    if (booking.vehicle_id) {
      const { data: vehicleData } = await dbClient
        .from('customer_vehicles')
        .select('make, model, year, color, license_plate, registration, name')
        .eq('id', booking.vehicle_id)
        .single()
      vehicle = vehicleData
    } else if (booking.vehicle_details) {
      // Use embedded vehicle data
      vehicle = {
        make: booking.vehicle_details.make,
        model: booking.vehicle_details.model,
        year: booking.vehicle_details.year,
        color: booking.vehicle_details.color,
        license_plate: booking.vehicle_details.registration
      }
    }

    // Merge address: prefer normalized table, but fill missing fields from embedded service_address
    const embeddedAddress = booking.service_address || null
    if (booking.address_id) {
      const { data: addressData } = await dbClient
        .from('customer_addresses')
        .select('name, address_line_1, address_line_2, city, county, postal_code, country, special_instructions')
        .eq('id', booking.address_id)
        .single()
      // Merge fields
      address = {
        ...(embeddedAddress || {}),
        ...(addressData || {})
      }
    } else if (embeddedAddress) {
      address = embeddedAddress
    }

    // Get customer data
    if (booking.customer_id) {
      const { data: customerData } = await dbClient
        .from('user_profiles')
        .select('id, first_name, last_name, email, phone')
        .eq('id', booking.customer_id)
        .single()
      customer = (customerData as CustomerProfileLite) || null
    }

    // Get booking services (avoid broken foreign key relationships)
    const { data: bookingServices } = await dbClient
      .from('booking_services')
      .select(`
        service_id,
        service_details,
        price,
        estimated_duration
      `)
      .eq('booking_id', bookingId)

    if (bookingServices) {
      services = bookingServices.map((service) => ({
        name: service?.service_details?.name || 'Vehicle Detailing Service',
        price: service?.price,
        duration: service?.estimated_duration
      })) as ServiceLite[]
    }

    // Check access permissions
    if (!isAdmin && booking.customer_id !== profile.id) {
      return NextResponse.json({
        success: false,
        error: { message: 'Access denied', code: 'FORBIDDEN' }
      }, { status: 403 })
    }

    // Get reschedule request data if any
    const { data: rescheduleRequest } = await dbClient
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
      customer_name: customer ? `${customer.first_name || ''} ${customer.last_name || ''}`.trim() : 'Unknown Customer',
      customer_email: customer?.email || '',
      customer_phone: customer?.phone || '',
      scheduled_date: booking.scheduled_date,
      start_time: booking.scheduled_start_time, // Admin page expects 'start_time' not 'scheduled_start_time'
      end_time: booking.scheduled_end_time,
      estimated_duration: booking.estimated_duration,
      status: booking.status,
      payment_status: booking.payment_status,
      payment_method: booking.payment_method,
      total_price: booking.total_price,
      special_instructions: booking.special_instructions,
      admin_notes: booking.admin_notes,
      created_at: booking.created_at,
      updated_at: booking.updated_at,
      services: services.map((service) => ({
        name: service?.name,
        base_price: service?.price,
        quantity: 1, // Default quantity for compatibility
        total_price: service?.price
      })),
      vehicle: vehicle ? {
        make: vehicle.make || 'Unknown',
        model: vehicle.model || 'Vehicle',
        year: vehicle.year || undefined,
        color: vehicle.color || undefined,
        license_plate: vehicle.license_plate || vehicle.registration || undefined
      } : null,
      address: address ? {
        // Prefer explicit street line; fall back to saved name or common alternate keys
        address_line_1: (
          (address['address_line_1'] as string) ||
          (address['name'] as string) ||
          (address['address'] as string) ||
          (address['line1'] as string) ||
          (address['address1'] as string) ||
          ''
        ),
        address_line_2: (address['address_line_2'] as string) || (address['line2'] as string) || null,
        city: (address['city'] as string) || (address['town'] as string) || 'Unknown',
        postal_code: (address['postal_code'] as string) || (address['postcode'] as string) || ''
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
    logger.error('Admin booking details API error', error instanceof Error ? error : undefined)
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
    const isAdmin = profile.role === 'admin' || env.auth.adminEmails.includes(profile.email.toLowerCase())
    
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
      logger.error('Error updating booking:', updateError)
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
    logger.error('Update booking API error', error instanceof Error ? error : undefined)
    return NextResponse.json({
      success: false,
      error: { message: 'Internal server error', code: 'SERVER_ERROR' }
    }, { status: 500 })
  }
}