import { NextRequest } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase/direct'
import { ApiResponseHandler } from '@/lib/api/response'
import { EmailService } from '@/lib/services/email'
import { authenticateAdmin } from '@/lib/api/auth-handler'

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Re-enable authentication for security
    const authResult = await authenticateAdmin(request)
    if (!authResult.success) {
      return authResult.error!
    }

    const { newDate, newTime, reason } = await request.json()
    const { id } = await params
    
    if (!newDate || !newTime) {
      return ApiResponseHandler.badRequest('New date and time are required')
    }

    // Use admin client for database queries
    const supabase = supabaseAdmin
    
    // First, get the current booking to verify it exists
    const { data: booking, error: bookingError } = await supabase
      .from('bookings')
      .select(`
        id,
        booking_reference,
        status,
        customer_id,
        scheduled_date,
        scheduled_start_time,
        time_slot_id,
        total_price
      `)
      .eq('id', id)
      .single()

    if (bookingError || !booking) {
      return ApiResponseHandler.notFound('Booking not found')
    }

    // Only allow rescheduling for active bookings
    if (['cancelled', 'completed', 'declined'].includes(booking.status)) {
      return ApiResponseHandler.badRequest(`Cannot reschedule booking with status: ${booking.status}`)
    }

    const oldDate = booking.scheduled_date
    const oldTime = booking.scheduled_start_time
    let newTimeSlot: any = null

    // Find the new time slot that matches the requested date and time
    const { data: foundTimeSlot, error: slotError } = await supabase
      .from('time_slots')
      .select('id, is_available')
      .eq('slot_date', newDate)
      .eq('start_time', newTime)
      .eq('is_available', true)
      .single()

    if (slotError || !foundTimeSlot) {
      return ApiResponseHandler.badRequest('Selected time slot is not available or does not exist')
    }

    newTimeSlot = foundTimeSlot

    // Update booking with new date, time, and link to new time slot
    const { error: updateError } = await supabase
      .from('bookings')
      .update({
        scheduled_date: newDate,
        scheduled_start_time: newTime,
        status: 'rescheduled',
        time_slot_id: newTimeSlot.id, // Link to new time slot
        updated_at: new Date().toISOString()
      })
      .eq('id', id)

    if (updateError) {
      console.error('Error rescheduling booking:', updateError)
      return ApiResponseHandler.serverError('Failed to reschedule booking')
    }

    // Mark the new time slot as unavailable
    const { error: markSlotError } = await supabase
      .from('time_slots')
      .update({
        is_available: false
      })
      .eq('id', newTimeSlot.id)

    if (markSlotError) {
      console.error('Error marking new time slot as unavailable:', markSlotError)
      // Rollback booking update
      await supabase
        .from('bookings')
        .update({
          scheduled_date: oldDate,
          scheduled_start_time: oldTime,
          status: booking.status,
          time_slot_id: booking.time_slot_id
        })
        .eq('id', id)
      
      return ApiResponseHandler.serverError('Failed to book new time slot')
    }

    // Verify the update was successful by fetching the updated booking
    const { data: updatedBooking, error: fetchError } = await supabase
      .from('bookings')
      .select('scheduled_date, scheduled_start_time')
      .eq('id', id)
      .single()

    if (fetchError) {
      console.error('Error fetching updated booking:', fetchError)
    } else {
      console.log('Updated booking confirmed:', updatedBooking)
    }

    // Free up the old time slot if it was linked (do this after successful booking update)
    if (booking.time_slot_id) {
      const { error: freeSlotError } = await supabase
        .from('time_slots')
        .update({
          is_available: true
        })
        .eq('id', booking.time_slot_id)

      if (freeSlotError) {
        console.error('Error freeing old time slot:', freeSlotError)
        // Rollback the entire reschedule operation
        await supabase
          .from('bookings')
          .update({
            scheduled_date: oldDate,
            scheduled_start_time: oldTime,
            status: booking.status,
            time_slot_id: booking.time_slot_id
          })
          .eq('id', id)
        
        await supabase
          .from('time_slots')
          .update({ is_available: true })
          .eq('id', newTimeSlot.id)
        
        return ApiResponseHandler.serverError('Failed to free old time slot')
      }
    }

    // Add to booking status history
    const rescheduleNotes = [
      `Rescheduled from ${oldDate} ${oldTime} to ${newDate} ${newTime}`,
      reason && `Additional reason: ${reason}`
    ].filter(Boolean).join('\n')

    const { error: historyError } = await supabase
      .from('booking_status_history')
      .insert({
        booking_id: id,
        from_status: booking.status,
        to_status: 'rescheduled', // Status changes to rescheduled
        changed_by: null, // TODO: Use actual admin user ID from headers
        reason: 'Booking rescheduled by admin',
        notes: rescheduleNotes,
        created_at: new Date().toISOString()
      })

    if (historyError) {
      console.error('Error adding to booking history:', historyError)
      // Don't fail the request for history error, just log it
    }

    // If there is a pending reschedule request for this booking matching the new date/time, mark it approved for consistency
    try {
      const { data: pendingReq } = await supabase
        .from('booking_reschedule_requests')
        .select('id')
        .eq('booking_id', id)
        .eq('requested_date', newDate)
        .eq('requested_time', newTime)
        .eq('status', 'pending')
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle()

      if (pendingReq?.id) {
        await supabase
          .from('booking_reschedule_requests')
          .update({ status: 'approved', responded_at: new Date().toISOString(), updated_at: new Date().toISOString() })
          .eq('id', pendingReq.id)
          .eq('status', 'pending')
      }
    } catch (e) {
      console.error('Failed to mark reschedule request approved after direct reschedule', e)
    }

    // Send reschedule notification email to customer
    const { data: customer } = await supabase
      .from('user_profiles')
      .select('email, first_name, last_name')
      .eq('id', booking.customer_id)
      .single()

    if (customer) {
      const emailService = new EmailService()
      const customerName = `${customer.first_name} ${customer.last_name}`
      
      // Use the existing status update email with reschedule details
      const emailResult = await emailService.sendBookingStatusUpdate(
        customer.email,
        customerName,
        { 
          ...booking, 
          scheduled_date: newDate,
          scheduled_start_time: newTime,
          status: booking.status 
        } as any,
        booking.status,
        `Your booking has been rescheduled to ${newDate} at ${newTime}${reason ? `. Reason: ${reason}` : ''}`
      )
      
      if (!emailResult.success) {
        console.error('Failed to send reschedule notification email:', emailResult.error)
        // Don't fail the request if email fails
      }
    }

    return ApiResponseHandler.success({
      message: 'Booking rescheduled successfully',
      booking_id: id,
      old_date: oldDate,
      old_time: oldTime,
      new_date: newDate,
      new_time: newTime,
      reason: reason || null
    })

  } catch (error) {
    console.error('Reschedule booking error:', error)
    return ApiResponseHandler.serverError('Failed to reschedule booking')
  }
}