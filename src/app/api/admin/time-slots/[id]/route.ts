import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { createClientFromRequest } from '@/lib/supabase/server'
import { logger } from '@/lib/utils/logger'

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

interface RouteParams {
  params: Promise<{ id: string }>
}

export async function PATCH(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params
    const supabase = createClientFromRequest(request)
    // Get user from cookies/session
    const { data: { user }, error: userError } = await supabase.auth.getUser()
    if (userError || !user) {
      return NextResponse.json(
        { success: false, error: { message: 'Authentication required' } },
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
    const { slot_date, start_time, is_available, notes } = body

    // Validate UUID format
    if (!/^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/.test(id)) {
      return NextResponse.json(
        { success: false, error: { message: 'Invalid time slot ID format' } },
        { status: 400 }
      )
    }

    // Check if time slot exists and get current data
    const { data: existingSlot, error: fetchError } = await supabaseAdmin
      .from('time_slots')
      .select('*')
      .eq('id', id)
      .single()

    if (fetchError || !existingSlot) {
      return NextResponse.json(
        { success: false, error: { message: 'Time slot not found' } },
        { status: 404 }
      )
    }

    // Check if slot has bookings when trying to make it unavailable
    if (is_available === false) {
      const { data: bookings } = await supabaseAdmin
        .from('bookings')
        .select('id')
        .eq('time_slot_id', id)
        .neq('status', 'cancelled')

      if (bookings && bookings.length > 0) {
        return NextResponse.json(
          { success: false, error: { message: 'Cannot make slot unavailable - it has active bookings' } },
          { status: 409 }
        )
      }
    }

    // Prepare update data
    const updateData: Record<string, unknown> = {}
    
    if (slot_date !== undefined) {
      if (!/^\d{4}-\d{2}-\d{2}$/.test(slot_date)) {
        return NextResponse.json(
          { success: false, error: { message: 'Invalid date format. Use YYYY-MM-DD' } },
          { status: 400 }
        )
      }
      updateData.slot_date = slot_date
    }

    if (start_time !== undefined) {
      if (!/^\d{2}:\d{2}$/.test(start_time)) {
        return NextResponse.json(
          { success: false, error: { message: 'Invalid time format. Use HH:MM' } },
          { status: 400 }
        )
      }
      updateData.start_time = start_time
    }

    if (is_available !== undefined) {
      updateData.is_available = is_available
    }

    if (notes !== undefined) {
      updateData.notes = notes
    }

    // Check for conflicts if date/time is being changed
    if (updateData.slot_date || updateData.start_time) {
      const checkDate = updateData.slot_date || existingSlot.slot_date
      const checkTime = updateData.start_time || existingSlot.start_time

      const { data: conflictSlot } = await supabaseAdmin
        .from('time_slots')
        .select('id')
        .eq('slot_date', checkDate)
        .eq('start_time', checkTime)
        .neq('id', id)
        .single()

      if (conflictSlot) {
        return NextResponse.json(
          { success: false, error: { message: 'A time slot already exists for this date and time' } },
          { status: 409 }
        )
      }
    }

    // Update the time slot
    const { data: updatedSlot, error } = await supabaseAdmin
      .from('time_slots')
      .update(updateData)
      .eq('id', id)
      .select()
      .single()

    if (error) {
      logger.error('Database error:', error)
      return NextResponse.json(
        { success: false, error: { message: 'Failed to update time slot' } },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      data: updatedSlot
    })

  } catch (error) {
    logger.error('API error:', error instanceof Error ? error : undefined)
    return NextResponse.json(
      { success: false, error: { message: 'Internal server error' } },
      { status: 500 }
    )
  }
}

export async function DELETE(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params
    const supabase = createClientFromRequest(request)
    // Get user from cookies/session
    const { data: { user }, error: userError } = await supabase.auth.getUser()
    if (userError || !user) {
      return NextResponse.json(
        { success: false, error: { message: 'Authentication required' } },
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

    // Validate UUID format
    if (!/^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/.test(id)) {
      return NextResponse.json(
        { success: false, error: { message: 'Invalid time slot ID format' } },
        { status: 400 }
      )
    }

    // Check if slot has bookings
    const { data: bookings } = await supabaseAdmin
      .from('bookings')
      .select('id, status')
      .eq('time_slot_id', id)
      .neq('status', 'cancelled')

    if (bookings && bookings.length > 0) {
      return NextResponse.json(
        { success: false, error: { message: 'Cannot delete time slot - it has active bookings' } },
        { status: 409 }
      )
    }

    // Delete the time slot
    const { error } = await supabaseAdmin
      .from('time_slots')
      .delete()
      .eq('id', id)

    if (error) {
      logger.error('Database error:', error)
      return NextResponse.json(
        { success: false, error: { message: 'Failed to delete time slot' } },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      data: { message: 'Time slot deleted successfully' }
    })

  } catch (error) {
    logger.error('API error:', error instanceof Error ? error : undefined)
    return NextResponse.json(
      { success: false, error: { message: 'Internal server error' } },
      { status: 500 }
    )
  }
}