import { NextRequest } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase/direct'
import { ApiResponseHandler } from '@/lib/api/response'
import { EmailService } from '@/lib/services/email'

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { reschedule_request_id, new_date, new_time } = await request.json()
    const { id: bookingId } = await params
    
    if (!reschedule_request_id || !new_date || !new_time) {
      return ApiResponseHandler.badRequest('Reschedule request ID, new date and time are required')
    }

    const supabase = supabaseAdmin
    
    // Get the reschedule request to verify it exists and is pending
    const { data: rescheduleRequest, error: rescheduleError } = await supabase
      .from('booking_reschedule_requests')
      .select('*')
      .eq('id', reschedule_request_id)
      .eq('booking_id', bookingId)
      .eq('status', 'pending')
      .single()

    if (rescheduleError || !rescheduleRequest) {
      return ApiResponseHandler.notFound('Reschedule request not found or already processed')
    }

    // Get the current booking
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
      .eq('id', bookingId)
      .single()

    if (bookingError || !booking) {
      return ApiResponseHandler.notFound('Booking not found')
    }

    // Only allow approving reschedules for active bookings
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
      .eq('slot_date', new_date)
      .eq('start_time', new_time)
      .eq('is_available', true)
      .single()

    if (slotError || !foundTimeSlot) {
      return ApiResponseHandler.badRequest('Selected time slot is not available or does not exist')
    }

    newTimeSlot = foundTimeSlot

    // Start transaction-like operations
    // 1. Update the reschedule request status to approved
    const { error: updateRequestError } = await supabase
      .from('booking_reschedule_requests')
      .update({
        status: 'approved',
        admin_response: 'Reschedule request approved',
        updated_at: new Date().toISOString()
      })
      .eq('id', reschedule_request_id)

    if (updateRequestError) {
      console.error('Error updating reschedule request:', updateRequestError)
      return ApiResponseHandler.serverError('Failed to approve reschedule request')
    }

    // 2. Update booking with new date, time, and link to new time slot
    const { error: updateBookingError } = await supabase
      .from('bookings')
      .update({
        scheduled_date: new_date,
        scheduled_start_time: new_time,
        status: 'rescheduled',
        time_slot_id: newTimeSlot.id,
        updated_at: new Date().toISOString()
      })
      .eq('id', bookingId)

    if (updateBookingError) {
      console.error('Error updating booking:', updateBookingError)
      // Rollback reschedule request status
      await supabase
        .from('booking_reschedule_requests')
        .update({ status: 'pending' })
        .eq('id', reschedule_request_id)
      
      return ApiResponseHandler.serverError('Failed to update booking')
    }

    // 3. Mark the new time slot as unavailable
    const { error: markSlotError } = await supabase
      .from('time_slots')
      .update({ is_available: false })
      .eq('id', newTimeSlot.id)

    if (markSlotError) {
      console.error('Error marking new time slot as unavailable:', markSlotError)
      // Rollback both booking and reschedule request
      await supabase
        .from('bookings')
        .update({
          scheduled_date: oldDate,
          scheduled_start_time: oldTime,
          status: booking.status,
          time_slot_id: booking.time_slot_id
        })
        .eq('id', bookingId)
      
      await supabase
        .from('booking_reschedule_requests')
        .update({ status: 'pending' })
        .eq('id', reschedule_request_id)
      
      return ApiResponseHandler.serverError('Failed to book new time slot')
    }

    // 4. Free up the old time slot if it was linked
    if (booking.time_slot_id) {
      const { error: freeSlotError } = await supabase
        .from('time_slots')
        .update({ is_available: true })
        .eq('id', booking.time_slot_id)

      if (freeSlotError) {
        console.error('Error freeing old time slot:', freeSlotError)
        // Don't rollback for this error, just log it
      }
    }

    // Add to booking history
    const rescheduleNotes = [
      `Reschedule request approved`,
      `Rescheduled from ${oldDate} ${oldTime} to ${new_date} ${new_time}`,
      rescheduleRequest.reason && `Customer reason: ${rescheduleRequest.reason}`
    ].filter(Boolean).join('\n')

    const { error: historyError } = await supabase
      .from('booking_status_history')
      .insert({
        booking_id: bookingId,
        from_status: booking.status,
        to_status: 'rescheduled',
        changed_by: null, // TODO: Use actual admin user ID
        reason: 'Reschedule request approved by admin',
        notes: rescheduleNotes,
        created_at: new Date().toISOString()
      })

    if (historyError) {
      console.error('Error adding to booking history:', historyError)
    }

    // Send approval notification email to customer
    const { data: customer } = await supabase
      .from('user_profiles')
      .select('email, first_name, last_name')
      .eq('id', booking.customer_id)
      .single()

    if (customer) {
      const emailService = new EmailService()
      const customerName = `${customer.first_name} ${customer.last_name}`
      
      const emailResult = await emailService.sendBookingStatusUpdate(
        customer.email,
        customerName,
        { 
          ...booking, 
          scheduled_date: new_date,
          scheduled_start_time: new_time,
          status: 'rescheduled' 
        } as any,
        'rescheduled',
        `Great news! Your reschedule request has been approved. Your booking is now scheduled for ${new_date} at ${new_time}.`
      )
      
      if (!emailResult.success) {
        console.error('Failed to send approval notification email:', emailResult.error)
      }
    }

    return ApiResponseHandler.success({
      message: 'Reschedule request approved successfully',
      booking_id: bookingId,
      reschedule_request_id,
      old_date: oldDate,
      old_time: oldTime,
      new_date,
      new_time
    })

  } catch (error) {
    console.error('Approve reschedule request error:', error)
    return ApiResponseHandler.serverError('Failed to approve reschedule request')
  }
}