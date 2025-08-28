import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { createClientFromRequest } from '@/lib/supabase/server'
import { ApiResponseHandler } from '@/lib/api/response'
import { logger } from '@/lib/utils/logger'

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function GET(request: NextRequest) {
  try {
    const supabase = createClientFromRequest(request)
    
    // Get the authenticated user using secure method
    const { data: { user }, error: userError } = await supabase.auth.getUser()
    
    if (userError || !user) {
      return ApiResponseHandler.unauthorized('Authentication required')
    }

    // Get the user profile
    const { data: profile, error: profileError } = await supabase
      .from('user_profiles')
      .select('*')
      .eq('id', user.id)
      .single()

    if (profileError || !profile) {
      return ApiResponseHandler.unauthorized('User profile not found')
    }

    // Check admin permissions
    if (profile.role !== 'admin' && profile.role !== 'super_admin') {
      return ApiResponseHandler.forbidden('Admin access required')
    }

    const { searchParams } = new URL(request.url)
    const start = searchParams.get('start')
    const end = searchParams.get('end')

    logger.debug(`Admin API: Fetching time slots with date range: start=${start}, end=${end}`)
    
    // Get current date and time for filtering
    const now = new Date()
    const currentDate = now.toISOString().split('T')[0]
    const currentTime = now.toTimeString().slice(0, 5) // HH:MM format
    
    let query = supabaseAdmin
      .from('time_slots')
      .select(`
        id,
        slot_date,
        start_time,
        is_available,
        notes,
        created_at,
        bookings!time_slot_id (
          id,
          booking_reference,
          status,
          total_price,
          special_instructions,
          booking_services (
            service:services (
              name,
              short_description
            )
          )
        )
      `)
      .order('slot_date', { ascending: true })
      .order('start_time', { ascending: true })

    if (start && end) {
      query = query.gte('slot_date', start).lte('slot_date', end)
    }

    // Filter out past slots - admin can see all slots by default
    // To filter past slots, add ?excludePast=true to the request
    if (searchParams.get('excludePast') === 'true') {
      query = query.or(`slot_date.gt.${currentDate},and(slot_date.eq.${currentDate},start_time.gt.${currentTime})`)
    }

    const { data: timeSlots, error } = await query

    if (error) {
      logger.error('Database error:', error)
      return ApiResponseHandler.serverError('Failed to fetch time slots')
    }

    logger.debug(`Admin API: Database returned ${timeSlots?.length || 0} time slots`)
    
    // Simplified transformation to avoid complex nested object issues
    const transformedSlots = timeSlots?.map(slot => {
      const booking = slot.bookings?.[0]
      
      // Debug log for first few slots
      if (timeSlots.indexOf(slot) < 3) {
        logger.debug(`Admin API: Slot ${slot.id} - Date: ${slot.slot_date}, Time: ${slot.start_time}, Available: ${slot.is_available}, Booking: ${booking ? 'Yes' : 'No'}`)
      }
      
      return {
        id: slot.id,
        slot_date: slot.slot_date,
        start_time: slot.start_time,
        is_available: slot.is_available,
        notes: slot.notes,
        created_at: slot.created_at,
        booking: booking ? {
          id: booking.id,
          booking_reference: booking.booking_reference,
          status: booking.status,
          total_price: booking.total_price,
          special_instructions: booking.special_instructions,
          services: (booking.booking_services as Array<{ service?: { name?: string; short_description?: string } }> | undefined)?.map((bs) => ({
            name: bs.service?.name || 'Unknown Service',
            description: bs.service?.short_description || null
          })) || []
        } : null
      }
    }) || []

    logger.debug(`Admin API: Returning ${transformedSlots.length} time slots for date range ${start || 'no-start'} to ${end || 'no-end'}`)

    return ApiResponseHandler.success(transformedSlots)

  } catch (error) {
    logger.error('API error:', error instanceof Error ? error : undefined)
    return ApiResponseHandler.serverError('Internal server error')
  }
}

export async function POST(request: NextRequest) {
  try {
    const supabase = createClientFromRequest(request)
    
    // Get the authenticated user using secure method
    const { data: { user }, error: userError } = await supabase.auth.getUser()
    
    if (userError || !user) {
      return ApiResponseHandler.unauthorized('Authentication required')
    }

    // Get the user profile
    const { data: profile, error: profileError } = await supabase
      .from('user_profiles')
      .select('*')
      .eq('id', user.id)
      .single()

    if (profileError || !profile) {
      return ApiResponseHandler.unauthorized('User profile not found')
    }

    // Check admin permissions
    if (profile.role !== 'admin' && profile.role !== 'super_admin') {
      return ApiResponseHandler.forbidden('Admin access required')
    }

    const body = await request.json()
    const { slot_date, start_time, notes, is_available = true } = body

    // Validate required fields
    if (!slot_date || !start_time) {
      return ApiResponseHandler.badRequest('Date and start time are required')
    }

    // Validate date format (YYYY-MM-DD)
    if (!/^\d{4}-\d{2}-\d{2}$/.test(slot_date)) {
      return ApiResponseHandler.badRequest('Invalid date format. Use YYYY-MM-DD')
    }

    // Validate time format (HH:MM)
    if (!/^\d{2}:\d{2}$/.test(start_time)) {
      return ApiResponseHandler.badRequest('Invalid time format. Use HH:MM')
    }

    // Check if the slot time is in the past
    const slotDateTime = new Date(`${slot_date}T${start_time}`)
    const now = new Date()
    
    if (slotDateTime <= now) {
      logger.debug(`Admin API POST: Rejecting past slot - ${slot_date}T${start_time} is before ${now.toISOString()}`)
      return ApiResponseHandler.badRequest('Cannot create time slots for past dates and times')
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
    logger.debug(`Admin API POST: Checking for existing slots on ${slot_date} at time ${start_time}`)
    
    const { data: existingSlots, error: checkError } = await supabaseAdmin
      .from('time_slots')
      .select('slot_date, start_time')
      .eq('slot_date', slot_date)
      .in('start_time', slotsToCreate.map(s => s.start_time))

    if (checkError) {
      logger.error('Error checking existing slots:', checkError)
    } else {
      logger.debug(`Admin API POST: Found ${existingSlots?.length || 0} existing slots`)
    }

    if (existingSlots && existingSlots.length > 0) {
      const duplicates = existingSlots.map(s => s.start_time).join(', ')
      logger.debug(`Admin API POST: Duplicate slots found for times: ${duplicates}`)
      return ApiResponseHandler.conflict(`Time slots already exist for: ${duplicates}`)
    }

    // Insert the time slots
    const { data: createdSlots, error } = await supabaseAdmin
      .from('time_slots')
      .insert(slotsToCreate)
      .select()

    if (error) {
      logger.error('Database error:', error)
      return ApiResponseHandler.serverError('Failed to create time slots')
    }

    return ApiResponseHandler.success({
      data: createdSlots,
      metadata: {
        created_count: createdSlots?.length || 0
      }
    })

  } catch (error) {
    logger.error('API error:', error instanceof Error ? error : undefined)
    return ApiResponseHandler.serverError('Internal server error')
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const supabase = createClientFromRequest(request)
    
    // Get the authenticated user using secure method
    const { data: { user }, error: userError } = await supabase.auth.getUser()
    
    if (userError || !user) {
      return ApiResponseHandler.unauthorized('Authentication required')
    }

    // Get the user profile
    const { data: profile, error: profileError } = await supabase
      .from('user_profiles')
      .select('*')
      .eq('id', user.id)
      .single()

    if (profileError || !profile) {
      return ApiResponseHandler.unauthorized('User profile not found')
    }

    // Check admin permissions
    if (profile.role !== 'admin' && profile.role !== 'super_admin') {
      return ApiResponseHandler.forbidden('Admin access required')
    }

    const { searchParams } = new URL(request.url)
    const action = searchParams.get('action')

    if (action === 'clear-unbooked') {
      logger.debug('Admin API DELETE: Clearing all unbooked time slots')
      
      // First, get all time slot IDs that have bookings
      const { data: bookedSlots, error: bookedError } = await supabaseAdmin
        .from('bookings')
        .select('time_slot_id')
        .not('time_slot_id', 'is', null)

      if (bookedError) {
        logger.error('Database error fetching booked slots:', bookedError)
        return ApiResponseHandler.serverError('Failed to identify booked time slots')
      }

      const bookedSlotIds = bookedSlots?.map(b => b.time_slot_id).filter(Boolean) || []
      logger.debug(`Admin API DELETE: Found ${bookedSlotIds.length} booked time slots to preserve`)

      // Delete all time slots that are not in the booked list
      const { data: deletedSlots, error } = await supabaseAdmin
        .from('time_slots')
        .delete()
        .not('id', 'in', bookedSlotIds.length > 0 ? bookedSlotIds : ['']) // Handle empty array case
        .select()

      if (error) {
        logger.error('Database error:', error)
        return ApiResponseHandler.serverError('Failed to delete unbooked time slots')
      }

      logger.debug(`Admin API DELETE: Removed ${deletedSlots?.length || 0} unbooked time slots`)

      return ApiResponseHandler.success({
        deleted_count: deletedSlots?.length || 0,
        preserved_booked_slots: bookedSlotIds.length,
        message: `Successfully removed ${deletedSlots?.length || 0} unbooked time slots (preserved ${bookedSlotIds.length} booked slots)`
      })
    }

    return ApiResponseHandler.badRequest('Invalid action. Use ?action=clear-unbooked')

  } catch (error) {
    logger.error('API error:', error instanceof Error ? error : undefined)
    return ApiResponseHandler.serverError('Internal server error')
  }
}