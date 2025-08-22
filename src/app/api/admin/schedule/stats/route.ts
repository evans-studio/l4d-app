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

    // Compute statistics in code to correctly exclude past slots and avoid stale is_available
    const now = new Date()
    const nowIso = now.toISOString()
    const currentDate = (nowIso.split('T')[0]) || ''
    const currentTime = now.toTimeString().slice(0,5) || '00:00'

    // Fetch candidate slots within the range (or all) to compute totals
    let slotsQuery = supabaseAdmin
      .from('time_slots')
      .select('id, slot_date, start_time, is_available')

    if (start && end) {
      slotsQuery = slotsQuery.gte('slot_date', start).lte('slot_date', end)
    }

    const { data: allSlots, error: slotsError } = await slotsQuery

    if (slotsError) {
      console.error('Error fetching slots for stats:', slotsError)
      return NextResponse.json(
        { success: false, error: { message: 'Failed to fetch schedule statistics' } },
        { status: 500 }
      )
    }

    const futureSlots = (allSlots || []).filter(s =>
      s.slot_date > currentDate || (s.slot_date === currentDate && s.start_time > currentTime)
    )

    // Get booked slots with revenue calculation (respect range)
    let bookedSlotsQuery = supabaseAdmin
      .from('bookings')
      .select(`
        id,
        time_slot_id,
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

    // Build sets to compute counts quickly
    const bookedSlotIds = new Set((bookedSlots || []).map((b: any) => b.time_slot_id).filter(Boolean))

    const totalSlots = futureSlots.length
    const bookedCount = futureSlots.filter(s => bookedSlotIds.has(s.id)).length
    const availableCount = futureSlots.filter(s => s.is_available === true && !bookedSlotIds.has(s.id)).length

    const stats = {
      totalSlots,
      availableSlots: availableCount,
      bookedSlots: bookedCount,
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