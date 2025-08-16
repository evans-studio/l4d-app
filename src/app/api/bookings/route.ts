import { NextRequest, NextResponse } from 'next/server'
import { createClientFromRequest } from '@/lib/supabase/server'
import { ApiResponse } from '@/types/booking'

const ADMIN_EMAILS = [
  'zell@love4detailing.com',
  'paul@evans-studio.co.uk'
]

export async function GET(request: NextRequest): Promise<NextResponse<ApiResponse>> {
  try {
    const supabase = createClientFromRequest(request)
    
    // Parse query parameters first
    const { searchParams } = new URL(request.url)
    const reference = searchParams.get('reference')
    const status = searchParams.get('status')
    const dateFrom = searchParams.get('dateFrom')
    const dateTo = searchParams.get('dateTo')

    // Allow public access when querying by reference (for booking confirmation)
    let user = null
    let profile = null
    let isAdmin = false

    if (!reference) {
      // Get current user (this also validates the session)
      const { data: { user: authUser }, error: userError } = await supabase.auth.getUser()
      
      if (userError || !authUser) {
        return NextResponse.json({
          success: false,
          error: { message: 'Authentication required', code: 'UNAUTHORIZED' }
        }, { status: 401 })
      }

      user = authUser

      // Get user profile to check role
      const { data: userProfile, error: profileError } = await supabase
        .from('user_profiles')
        .select('id, email, role, is_active')
        .eq('id', user.id)
        .single()

      if (profileError || !userProfile || userProfile.is_active === false) {
        return NextResponse.json({
          success: false,
          error: { message: 'User account not found or inactive', code: 'USER_INACTIVE' }
        }, { status: 401 })
      }

      profile = userProfile
      // Determine if user is admin
      isAdmin = profile.role === 'admin' || ADMIN_EMAILS.includes(profile.email.toLowerCase())
    }

    // Build query
    let query = supabase
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
        special_instructions,
        pricing_breakdown,
        service_address,
        payment_status,
        payment_deadline,
        created_at,
        customer_vehicles (
          make,
          model,
          year,
          color,
          license_plate,
          registration
        ),
        customer_addresses (
          name,
          address_line_1,
          address_line_2,
          city,
          county,
          postal_code,
          country
        ),
        booking_services (
          service_id,
          service_details,
          price,
          estimated_duration
        )
      `)

    // If not admin and authenticated AND no reference, only show user's own bookings
    // Skip customer filter when querying by reference to allow public booking confirmation
    if (!isAdmin && profile && !reference) {
      query = query.eq('customer_id', profile.id)
    }

    // Apply filters
    if (reference) {
      query = query.eq('booking_reference', reference)
    }

    if (status) {
      const statusArray = status.split(',')
      query = query.in('status', statusArray)
    }

    if (dateFrom) {
      query = query.gte('scheduled_date', dateFrom)
    }

    if (dateTo) {
      query = query.lte('scheduled_date', dateTo)
    }

    // Order by creation date
    query = query.order('created_at', { ascending: false })

    const { data: bookings, error: bookingsError } = await query

    if (bookingsError) {
      console.error('Error fetching bookings:', bookingsError)
      return NextResponse.json({
        success: false,
        error: { message: 'Failed to fetch bookings', code: 'DATABASE_ERROR' }
      }, { status: 500 })
    }

    // Transform the data for frontend consumption
    const transformedBookings = bookings?.map((booking: any) => {
      const firstService = booking.booking_services?.[0]
      const vehicle = booking.customer_vehicles?.[0]
      const address = booking.customer_addresses?.[0]
      return {
        id: booking.id,
        booking_reference: booking.booking_reference,
        customer_id: booking.customer_id,
        scheduled_date: booking.scheduled_date,
        scheduled_start_time: booking.scheduled_start_time,
        scheduled_end_time: booking.scheduled_end_time,
        status: booking.status,
        total_price: booking.total_price,
        pricing_breakdown: booking.pricing_breakdown,
        special_instructions: booking.special_instructions,
        payment_status: booking.payment_status,
        payment_deadline: booking.payment_deadline,
        created_at: booking.created_at,
        service: firstService ? {
          name: firstService.service_details?.name || 'Vehicle Detailing Service',
          short_description: firstService.service_details?.short_description || '',
          category: firstService.service_details?.category || ''
        } : { name: 'Vehicle Detailing Service', short_description: '', category: '' },
        vehicle: vehicle ? {
          make: vehicle.make,
          model: vehicle.model,
          year: vehicle.year,
          color: vehicle.color
        } : null,
        address: address ? {
          name: address.name,
          address_line_1: address.address_line_1,
          address_line_2: address.address_line_2,
          city: address.city,
          county: address.county,
          postal_code: address.postal_code,
          country: address.country
        } : null
      }
    }) || []

    // If a booking reference was requested, return a single object for success page
    if (reference) {
      const single = transformedBookings[0]
      if (!single) {
        return NextResponse.json({
          success: false,
          error: { message: 'Booking not found', code: 'NOT_FOUND' }
        }, { status: 404 })
      }
      return NextResponse.json({ success: true, data: single })
    }

    // Otherwise return list
    return NextResponse.json({
      success: true,
      data: transformedBookings,
      metadata: {
        pagination: {
          page: 1,
          limit: transformedBookings.length,
          total: transformedBookings.length
        },
        timestamp: new Date().toISOString()
      }
    })

  } catch (error) {
    console.error('Admin bookings API error:', error)
    return NextResponse.json({
      success: false,
      error: { message: 'Internal server error', code: 'SERVER_ERROR' }
    }, { status: 500 })
  }
}