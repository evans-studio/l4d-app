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

    // Build date filter
    let dateFilter = ''
    if (start && end) {
      dateFilter = `slot_date.gte.${start},slot_date.lte.${end}`
    }

    // Get total slots count
    let totalSlotsQuery = supabaseAdmin
      .from('time_slots')
      .select('id', { count: 'exact', head: true })

    if (start && end) {
      totalSlotsQuery = totalSlotsQuery.gte('slot_date', start).lte('slot_date', end)
    }

    const { count: totalSlots, error: totalSlotsError } = await totalSlotsQuery

    if (totalSlotsError) {
      console.error('Error fetching total slots:', totalSlotsError)
      return NextResponse.json(
        { success: false, error: { message: 'Failed to fetch schedule statistics' } },
        { status: 500 }
      )
    }

    // Get available slots count
    let availableSlotsQuery = supabaseAdmin
      .from('time_slots')
      .select('id', { count: 'exact', head: true })
      .eq('is_available', true)

    if (start && end) {
      availableSlotsQuery = availableSlotsQuery.gte('slot_date', start).lte('slot_date', end)
    }

    const { count: availableSlots, error: availableSlotsError } = await availableSlotsQuery

    if (availableSlotsError) {
      console.error('Error fetching available slots:', availableSlotsError)
      return NextResponse.json(
        { success: false, error: { message: 'Failed to fetch schedule statistics' } },
        { status: 500 }
      )
    }

    // Get booked slots with revenue calculation
    let bookedSlotsQuery = supabaseAdmin
      .from('bookings')
      .select(`
        id,
        total_price,
        time_slots!inner (
          slot_date
        )
      `)
      .neq('status', 'cancelled')

    if (start && end) {
      bookedSlotsQuery = bookedSlotsQuery.gte('time_slots.slot_date', start).lte('time_slots.slot_date', end)
    }

    const { data: bookedSlots, error: bookedSlotsError } = await bookedSlotsQuery

    if (bookedSlotsError) {
      console.error('Error fetching booked slots:', bookedSlotsError)
      return NextResponse.json(
        { success: false, error: { message: 'Failed to fetch schedule statistics' } },
        { status: 500 }
      )
    }

    // Calculate revenue
    const revenue = bookedSlots?.reduce((total, booking) => {
      return total + (parseFloat(booking.total_price?.toString() || '0'))
    }, 0) || 0

    const stats = {
      totalSlots: totalSlots || 0,
      availableSlots: availableSlots || 0,
      bookedSlots: bookedSlots?.length || 0,
      revenue: Math.round(revenue * 100) / 100 // Round to 2 decimal places
    }

    return NextResponse.json({
      success: true,
      data: stats,
      metadata: {
        date_range: start && end ? { start, end } : null,
        timestamp: new Date().toISOString()
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