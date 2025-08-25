import { NextRequest } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase/direct'
import { ApiResponseHandler } from '@/lib/api/response'
import { EmailService } from '@/lib/services/email'

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { action, adminResponse, adminNotes, proposedDate, proposedTime } = await request.json()
    const { id } = await params
    
    if (!action || !['approve', 'reject', 'propose'].includes(action)) {
      return ApiResponseHandler.badRequest('Valid action is required (approve, reject, propose)')
    }

    // Use admin client to bypass authentication temporarily
    const supabase = supabaseAdmin
    
    // First, get the reschedule request with booking details
    const { data: rescheduleRequest, error: requestError } = await supabase
      .from('booking_reschedule_requests')
      .select(`
        id,
        booking_id,
        requested_date,
        requested_time,
        reason,
        status,
        original_date,
        original_time,
        bookings!booking_id (
          id,
          booking_reference,
          status,
          customer_id,
          scheduled_date,
          scheduled_start_time,
          time_slot_id,
          user_profiles!customer_id (
            email,
            first_name,
            last_name
          )
        )
      `)
      .eq('id', id)
      .single()

    if (requestError || !rescheduleRequest) {
      return ApiResponseHandler.notFound('Reschedule request not found')
    }

    if (rescheduleRequest.status !== 'pending') {
      return ApiResponseHandler.badRequest('Can only respond to pending reschedule requests')
    }

    const booking = rescheduleRequest.bookings as any
    const customer = booking?.user_profiles

    let newStatus = action === 'approve' ? 'approved' : action === 'reject' ? 'rejected' : 'pending'
    let responseMessage = adminResponse
    
    if (action === 'propose' && proposedDate && proposedTime) {
      responseMessage = `Alternative time proposed: ${proposedDate} at ${proposedTime}. ${adminResponse || ''}`
    }

    // Update the reschedule request
    const { error: updateError } = await supabase
      .from('booking_reschedule_requests')
      .update({
        status: newStatus,
        admin_response: responseMessage,
        admin_notes: adminNotes || null,
        responded_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .eq('id', id)
      .eq('status', 'pending')

    if (updateError) {
      console.error('Error updating reschedule request:', updateError)
      return ApiResponseHandler.serverError('Failed to update reschedule request')
    }

    // If no rows were updated (already processed), try to load it again to surface state
    const { data: afterUpdate } = await supabase
      .from('booking_reschedule_requests')
      .select('id, status')
      .eq('id', id)
      .single()

    // If approved, update the actual booking
    if (action === 'approve' && booking) {
      const newDate = rescheduleRequest.requested_date
      const newTime = rescheduleRequest.requested_time

      // Update booking with new date and time and set status to rescheduled
      const { error: bookingUpdateError } = await supabase
        .from('bookings')
        .update({
          scheduled_date: newDate,
          scheduled_start_time: newTime,
          status: 'rescheduled',
          time_slot_id: null, // Clear existing time slot link
          updated_at: new Date().toISOString()
        })
        .eq('id', booking.id)

      if (bookingUpdateError) {
        console.error('Error updating booking:', bookingUpdateError)
        return ApiResponseHandler.serverError('Failed to update booking')
      }

      // Free up the old time slot if it was linked
      if (booking.time_slot_id) {
        const { error: slotError } = await supabase
          .from('time_slots')
          .update({
            is_available: true
          })
          .eq('id', booking.time_slot_id)

        if (slotError) {
          console.error('Error freeing old time slot:', slotError)
          // Don't fail the request, but log the error
        }
      }

      // Add to booking status history
      const historyNotes = [
        `Customer reschedule request approved`,
        `Rescheduled from ${rescheduleRequest.original_date} ${rescheduleRequest.original_time} to ${newDate} ${newTime}`,
        rescheduleRequest.reason && `Customer reason: ${rescheduleRequest.reason}`,
        adminResponse && `Admin response: ${adminResponse}`
      ].filter(Boolean).join('\n')

      const { error: historyError } = await supabase
        .from('booking_status_history')
        .insert({
          booking_id: booking.id,
          from_status: booking.status,
          to_status: 'rescheduled',
          changed_by: null, // TODO: Use actual admin user ID from headers
          reason: 'Customer reschedule request approved',
          notes: historyNotes,
          created_at: new Date().toISOString()
        })

      if (historyError) {
        console.error('Error adding to booking history:', historyError)
        // Don't fail the request for history error, just log it
      }
    }

    // Send notification email to customer
    if (customer) {
      const emailService = new EmailService()
      const customerName = `${customer.first_name} ${customer.last_name}`
      
      const emailResult = await emailService.sendRescheduleRequestResponse(
        customer.email,
        customerName,
        booking!,
        rescheduleRequest,
        action,
        responseMessage,
        proposedDate,
        proposedTime
      )
      
      if (!emailResult.success) {
        console.error('Failed to send reschedule response email:', emailResult.error)
        // Don't fail the request if email fails
      }
    }

    return ApiResponseHandler.success({
      message: `Reschedule request ${action}d successfully`,
      reschedule_request_id: id,
      booking_id: rescheduleRequest.booking_id,
      action: action,
      new_status: newStatus,
      booking_updated: action === 'approve'
    })

  } catch (error) {
    console.error('Respond to reschedule request error:', error)
    return ApiResponseHandler.serverError('Failed to respond to reschedule request')
  }
}