import { NextRequest, NextResponse } from 'next/server'
import { createClientFromRequest } from '@/lib/supabase/server'
import { ApiResponse } from '@/types/booking'
import { logger } from '@/lib/utils/logger'

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

    // Get user profile to get the actual customer ID and customer info
    const { data: profile, error: profileError } = await supabase
      .from('user_profiles')
      .select('id, first_name, last_name, email, phone, is_active')
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
        customer_vehicles!vehicle_id (
          make,
          model,
          year,
          color,
          license_plate,
          registration
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
          short_description
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
      logger.error('Error fetching bookings:', bookingsError)
      return NextResponse.json({
        success: false,
        error: { message: 'Failed to fetch bookings', code: 'DATABASE_ERROR' }
      }, { status: 500 })
    }

    // Transform the data for frontend consumption
    type CustomerVehicleLite = {
      make?: string
      model?: string
      year?: number
      color?: string
      license_plate?: string
      registration?: string
    }
    type CustomerAddressLite = {
      address_line_1?: string
      address_line_2?: string | null
      city?: string
      county?: string | null
      postal_code?: string
      country?: string
      distance_from_business?: number | null
    }
    type ServiceLite = {
      name?: string
      short_description?: string
      category?: string
    }
    type BookingServiceLite = {
      service_details?: unknown
      price?: number
      estimated_duration?: number
    }
    type BookingRowLite = {
      id: string
      booking_reference: string
      scheduled_date: string
      scheduled_start_time: string
      scheduled_end_time: string
      status: string
      total_price: number
      pricing_breakdown?: unknown
      special_instructions?: string | null
      created_at: string
      customer_vehicles?: CustomerVehicleLite[] | null
      customer_addresses?: CustomerAddressLite[] | null
      services?: ServiceLite | ServiceLite[] | null
      booking_services?: BookingServiceLite[] | null
    }

    const transformedBookings = bookings?.map((booking: BookingRowLite) => ({
      id: booking?.id,
      booking_reference: booking?.booking_reference,
      scheduled_date: booking?.scheduled_date,
      scheduled_start_time: booking?.scheduled_start_time,
      scheduled_end_time: booking?.scheduled_end_time,
      status: booking?.status,
      total_price: booking?.total_price,
      pricing_breakdown: booking?.pricing_breakdown,
      special_instructions: booking?.special_instructions,
      created_at: booking?.created_at,
      
      // Customer information - include the customer's own details for consistency with admin view
      customer_id: profile.id,
      customer_name: profile.first_name && profile.last_name 
        ? `${profile.first_name} ${profile.last_name}` 
        : profile.first_name || profile.last_name || 'Customer',
      customer_email: profile.email || '',
      customer_phone: profile.phone || '',
      
      // Service information from main service and booking services
      service: booking?.services ? (() => {
        const svc = Array.isArray(booking.services) ? booking.services[0] : booking.services
        return svc ? {
          name: svc.name,
          short_description: svc.short_description,
          category: 'General'
        } : null
      })() : null,
      
      // Detailed service breakdown from booking_services
      booking_services: (booking?.booking_services || []).map((service: BookingServiceLite) => ({
        service_details: service?.service_details,
        price: service?.price,
        estimated_duration: service?.estimated_duration
      })),
      
      // Vehicle information (no longer includes size details from deleted table)
      vehicle: (booking?.customer_vehicles && booking.customer_vehicles[0]) ? {
        make: booking.customer_vehicles[0]?.make,
        model: booking.customer_vehicles[0]?.model,
        year: booking.customer_vehicles[0]?.year,
        color: booking.customer_vehicles[0]?.color,
        license_plate: booking.customer_vehicles[0]?.license_plate || booking.customer_vehicles[0]?.registration,
        registration: booking.customer_vehicles[0]?.registration || booking.customer_vehicles[0]?.license_plate
      } : null,
      
      // Address information with distance
      address: (booking?.customer_addresses && booking.customer_addresses[0]) ? {
        address_line_1: booking.customer_addresses[0]?.address_line_1,
        address_line_2: booking.customer_addresses[0]?.address_line_2 ?? null,
        city: booking.customer_addresses[0]?.city,
        county: booking.customer_addresses[0]?.county ?? null,
        postal_code: booking.customer_addresses[0]?.postal_code,
        country: booking.customer_addresses[0]?.country,
        distance_from_business: booking.customer_addresses[0]?.distance_from_business ?? null
      } : null
    })) || []

    return NextResponse.json({
      success: true,
      data: transformedBookings
    })

  } catch (error) {
    logger.error('Customer bookings API error', error instanceof Error ? error : undefined)
    return NextResponse.json({
      success: false,
      error: { message: 'Internal server error', code: 'SERVER_ERROR' }
    }, { status: 500 })
  }
}