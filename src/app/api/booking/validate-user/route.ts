import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase/direct'

export async function POST(request: NextRequest) {
  try {
    const { email, phone } = await request.json()

    if (!email || !phone) {
      return NextResponse.json({
        success: false,
        error: { 
          message: 'Email and phone are required',
          code: 'MISSING_FIELDS'
        }
      }, { status: 400 })
    }


    // Look for existing user by email
    const { data: userProfile, error: userError } = await supabaseAdmin
      .from('user_profiles')
      .select(`
        id,
        email,
        first_name,
        last_name,
        phone,
        is_active
      `)
      .eq('email', email.toLowerCase().trim())
      .eq('is_active', true)
      .single()

    if (userError && userError.code !== 'PGRST116') {
      console.error('Database error:', userError)
      return NextResponse.json({
        success: false,
        error: { 
          message: 'Failed to validate user',
          code: 'DATABASE_ERROR'
        }
      }, { status: 500 })
    }

    // If user not found, return new user response
    if (!userProfile) {
      return NextResponse.json({
        success: true,
        data: {
          isExistingUser: false,
          message: 'New customer - account will be created after booking'
        }
      })
    }

    // Verify phone number matches (basic check)
    const normalizedPhone = phone.replace(/\s+/g, '').replace(/^\+44/, '0')
    const normalizedUserPhone = userProfile.phone?.replace(/\s+/g, '').replace(/^\+44/, '0')
    
    if (normalizedPhone !== normalizedUserPhone) {
      return NextResponse.json({
        success: true,
        data: {
          isExistingUser: false,
          message: 'Phone number does not match our records'
        }
      })
    }

    // Load user's saved vehicles
    const { data: vehicles, error: vehiclesError } = await supabaseAdmin
      .from('customer_vehicles')
      .select(`
        id,
        make,
        model,
        year,
        color,
        license_plate,
        registration,
        is_primary,
        is_default
      `)
      .eq('user_id', userProfile.id)
      .eq('is_active', true)
      .order('is_primary', { ascending: false })
      .order('created_at', { ascending: false })

    if (vehiclesError) {
      console.error('Vehicles fetch error:', vehiclesError)
    }

    // Load user's saved addresses
    const { data: addresses, error: addressesError } = await supabaseAdmin
      .from('customer_addresses')
      .select(`
        id,
        address_line_1,
        address_line_2,
        city,
        postal_code,
        county,
        country,
        latitude,
        longitude,
        distance_from_business,
        is_primary,
        is_default
      `)
      .eq('user_id', userProfile.id)
      .eq('is_active', true)
      .order('is_primary', { ascending: false })
      .order('created_at', { ascending: false })

    if (addressesError) {
      console.error('Addresses fetch error:', addressesError)
    }

    // Load recent booking history (last 5 bookings for quick rebooking)
    const { data: recentBookings, error: bookingsError } = await supabaseAdmin
      .from('bookings')
      .select(`
        id,
        booking_reference,
        scheduled_date,
        status,
        total_price,
        vehicle_details,
        service_address,
        services!inner(
          id,
          name,
          short_description,
          category,
          base_price,
          estimated_duration
        ),
        time_slots(
          id,
          start_time,
          end_time
        )
      `)
      .eq('customer_id', userProfile.id)
      .in('status', ['completed', 'confirmed'])
      .order('scheduled_date', { ascending: false })
      .limit(5)

    if (bookingsError) {
      console.error('Bookings fetch error:', bookingsError)
    }

    return NextResponse.json({
      success: true,
      data: {
        isExistingUser: true,
        user: {
          id: userProfile.id,
          email: userProfile.email,
          name: `${userProfile.first_name} ${userProfile.last_name}`.trim(),
          phone: userProfile.phone
        },
        vehicles: vehicles || [],
        addresses: addresses || [],
        recentBookings: recentBookings || [],
        message: 'Welcome back! We found your existing account'
      }
    })

  } catch (error) {
    console.error('User validation error:', error)
    return NextResponse.json({
      success: false,
      error: { 
        message: 'Internal server error',
        code: 'INTERNAL_ERROR'
      }
    }, { status: 500 })
  }
}