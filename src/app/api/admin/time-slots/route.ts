import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { cookies } from 'next/headers'

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function GET(request: NextRequest) {
  try {
    const cookieStore = await cookies()
    const allCookies = cookieStore.getAll()
    
    // Check for authentication
    const accessToken = allCookies.find(c => c.name.includes('access_token'))?.value
    if (!accessToken) {
      return NextResponse.json(
        { success: false, error: { message: 'Authentication required' } },
        { status: 401 }
      )
    }

    // Get user from token
    const { data: { user }, error: userError } = await supabaseAdmin.auth.getUser(accessToken)
    if (userError || !user) {
      return NextResponse.json(
        { success: false, error: { message: 'Invalid authentication' } },
        { status: 401 }
      )
    }

    // Check if user is admin
    const { data: profile } = await supabaseAdmin
      .from('user_profiles')
      .select('role')
      .eq('id', user.id)
      .single()

    if (!profile || !['admin', 'super_admin'].includes(profile.role)) {
      return NextResponse.json(
        { success: false, error: { message: 'Admin access required' } },
        { status: 403 }
      )
    }

    const { searchParams } = new URL(request.url)
    const start = searchParams.get('start')
    const end = searchParams.get('end')

    let query = supabaseAdmin
      .from('time_slots')
      .select(`
        id,
        slot_date,
        start_time,
        is_available,
        notes,
        bookings!time_slot_id (
          id,
          booking_reference,
          customer_id,
          user_profiles!customer_id (
            first_name,
            last_name
          ),
          services (
            name
          )
        )
      `)
      .order('slot_date', { ascending: true })
      .order('start_time', { ascending: true })

    if (start && end) {
      query = query.gte('slot_date', start).lte('slot_date', end)
    }

    const { data: timeSlots, error } = await query

    if (error) {
      console.error('Database error:', error)
      return NextResponse.json(
        { success: false, error: { message: 'Failed to fetch time slots' } },
        { status: 500 }
      )
    }

    // Transform data to include booking information
    const transformedSlots = timeSlots?.map(slot => {
      const booking = slot.bookings?.[0]
      const userProfile = Array.isArray(booking?.user_profiles) ? booking.user_profiles[0] : booking?.user_profiles
      const service = Array.isArray(booking?.services) ? booking.services[0] : booking?.services
      
      return {
        id: slot.id,
        slot_date: slot.slot_date,
        start_time: slot.start_time,
        is_available: slot.is_available,
        notes: slot.notes,
        booking_id: booking?.id || null,
        customer_name: userProfile 
          ? `${userProfile.first_name} ${userProfile.last_name}`
          : null,
        service_name: service?.name || null
      }
    }) || []

    return NextResponse.json({
      success: true,
      data: transformedSlots
    })

  } catch (error) {
    console.error('API error:', error)
    return NextResponse.json(
      { success: false, error: { message: 'Internal server error' } },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const cookieStore = await cookies()
    const allCookies = cookieStore.getAll()
    
    // Check for authentication
    const accessToken = allCookies.find(c => c.name.includes('access_token'))?.value
    if (!accessToken) {
      return NextResponse.json(
        { success: false, error: { message: 'Authentication required' } },
        { status: 401 }
      )
    }

    // Get user from token
    const { data: { user }, error: userError } = await supabaseAdmin.auth.getUser(accessToken)
    if (userError || !user) {
      return NextResponse.json(
        { success: false, error: { message: 'Invalid authentication' } },
        { status: 401 }
      )
    }

    // Check if user is admin
    const { data: profile } = await supabaseAdmin
      .from('user_profiles')
      .select('role')
      .eq('id', user.id)
      .single()

    if (!profile || !['admin', 'super_admin'].includes(profile.role)) {
      return NextResponse.json(
        { success: false, error: { message: 'Admin access required' } },
        { status: 403 }
      )
    }

    const body = await request.json()
    const { slot_date, start_time, notes, is_available = true } = body

    // Validate required fields
    if (!slot_date || !start_time) {
      return NextResponse.json(
        { success: false, error: { message: 'Date and start time are required' } },
        { status: 400 }
      )
    }

    // Validate date format (YYYY-MM-DD)
    if (!/^\d{4}-\d{2}-\d{2}$/.test(slot_date)) {
      return NextResponse.json(
        { success: false, error: { message: 'Invalid date format. Use YYYY-MM-DD' } },
        { status: 400 }
      )
    }

    // Validate time format (HH:MM)
    if (!/^\d{2}:\d{2}$/.test(start_time)) {
      return NextResponse.json(
        { success: false, error: { message: 'Invalid time format. Use HH:MM' } },
        { status: 400 }
      )
    }

    // Create single slot
    const slotsToCreate = [{
      slot_date,
      start_time,
      is_available,
      created_by: user.id,
      notes: notes || null
    }]

    // Check for existing slots to avoid duplicates
    const { data: existingSlots } = await supabaseAdmin
      .from('time_slots')
      .select('slot_date, start_time')
      .eq('slot_date', slot_date)
      .in('start_time', slotsToCreate.map(s => s.start_time))

    if (existingSlots && existingSlots.length > 0) {
      const duplicates = existingSlots.map(s => s.start_time).join(', ')
      return NextResponse.json(
        { success: false, error: { message: `Time slots already exist for: ${duplicates}` } },
        { status: 409 }
      )
    }

    // Insert the time slots
    const { data: createdSlots, error } = await supabaseAdmin
      .from('time_slots')
      .insert(slotsToCreate)
      .select()

    if (error) {
      console.error('Database error:', error)
      return NextResponse.json(
        { success: false, error: { message: 'Failed to create time slots' } },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      data: createdSlots,
      metadata: {
        created_count: createdSlots?.length || 0
      }
    })

  } catch (error) {
    console.error('API error:', error)
    return NextResponse.json(
      { success: false, error: { message: 'Internal server error' } },
      { status: 500 }
    )
  }
}