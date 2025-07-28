import { NextRequest } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { ApiResponseHandler } from '@/lib/api/response'

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = await createClient()
    const resolvedParams = await params
    const bookingId = resolvedParams.id
    
    // Get current user
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    
    if (authError || !user) {
      return ApiResponseHandler.unauthorized('Authentication required')
    }

    // Parse request body
    const { new_date, new_start_time, new_end_time, time_slot_id, reason } = await request.json()

    if (!new_date || !new_start_time || !time_slot_id || !reason) {
      return ApiResponseHandler.badRequest('Missing required fields')
    }

    // Verify booking belongs to user and can be rescheduled
    const { data: booking, error: bookingError } = await supabase
      .from('bookings')
      .select('id, customer_id, status, booking_reference, scheduled_date, scheduled_start_time')
      .eq('id', bookingId)
      .eq('customer_id', user.id)
      .single()

    if (bookingError || !booking) {
      return ApiResponseHandler.notFound('Booking not found')
    }

    // Check if booking can be rescheduled
    if (!['pending', 'confirmed'].includes(booking.status)) {
      return ApiResponseHandler.badRequest('Booking cannot be rescheduled')
    }

    // Check if the new time slot is still available
    const { data: timeSlot, error: timeSlotError } = await supabase
      .from('time_slots')
      .select('id, start_time, end_time, date, is_available')
      .eq('id', time_slot_id)
      .eq('is_available', true)
      .single()

    if (timeSlotError || !timeSlot) {
      return ApiResponseHandler.badRequest('Selected time slot is no longer available')
    }

    // Verify the time slot matches the provided data
    if (timeSlot.date !== new_date || timeSlot.start_time !== new_start_time) {
      return ApiResponseHandler.badRequest('Time slot data mismatch')
    }

    // Begin transaction: Update booking and mark old/new time slots
    const { error: updateError } = await supabase.rpc('reschedule_booking', {
      p_booking_id: bookingId,
      p_new_date: new_date,
      p_new_start_time: new_start_time,
      p_new_end_time: new_end_time || timeSlot.end_time,
      p_new_time_slot_id: time_slot_id,
      p_reschedule_reason: reason,
      p_old_date: booking.scheduled_date,
      p_old_start_time: booking.scheduled_start_time
    })

    if (updateError) {
      console.error('Error rescheduling booking:', updateError)
      return ApiResponseHandler.serverError('Failed to reschedule booking')
    }

    // Log the reschedule action
    const { error: logError } = await supabase
      .from('booking_history')
      .insert({
        booking_id: bookingId,
        action: 'rescheduled',
        details: {
          old_date: booking.scheduled_date,
          old_start_time: booking.scheduled_start_time,
          new_date: new_date,
          new_start_time: new_start_time,
          reason: reason
        },
        created_by: user.id,
        created_at: new Date().toISOString()
      })

    if (logError) {
      console.error('Error logging reschedule action:', logError)
      // Don't fail the request if logging fails
    }

    // Send notification email (optional - implement based on your email service)
    try {
      await fetch('/api/email/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          to: user.email,
          template: 'booking_rescheduled',
          data: {
            booking_reference: booking.booking_reference,
            old_date: booking.scheduled_date,
            old_time: booking.scheduled_start_time,
            new_date: new_date,
            new_time: new_start_time,
            reason: reason
          }
        })
      })
    } catch (emailError) {
      console.error('Failed to send reschedule notification:', emailError)
      // Don't fail the request if email fails
    }

    return ApiResponseHandler.success({
      message: 'Booking rescheduled successfully',
      booking_id: bookingId,
      new_date: new_date,
      new_start_time: new_start_time
    })

  } catch (error) {
    console.error('Reschedule booking error:', error)
    return ApiResponseHandler.serverError('Failed to reschedule booking')
  }
}