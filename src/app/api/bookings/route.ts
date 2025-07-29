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

    if (profileError || !profile?.is_active) {
      return NextResponse.json({
        success: false,
        error: { message: 'User account not found or inactive', code: 'USER_INACTIVE' }
      }, { status: 401 })
    }

    // Determine if user is admin
    const isAdmin = profile.role === 'admin' || ADMIN_EMAILS.includes(profile.email.toLowerCase())

    // Parse query parameters
    const { searchParams } = new URL(request.url)
    const status = searchParams.get('status')
    const dateFrom = searchParams.get('dateFrom')
    const dateTo = searchParams.get('dateTo')

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

    // If not admin, only show user's own bookings
    if (!isAdmin) {
      query = query.eq('customer_id', profile.id)
    }

    // Apply filters
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
    const transformedBookings = bookings?.map((booking: any) => ({
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
    })) || []

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