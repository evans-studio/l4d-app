import { NextRequest } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase/direct'
import { ApiResponseHandler } from '@/lib/api/response'
import { EmailService } from '@/lib/services/email'

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { reschedule_request_id, decline_reason } = await request.json()
    const { id: bookingId } = await params
    
    if (!reschedule_request_id) {
      return ApiResponseHandler.badRequest('Reschedule request ID is required')
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
        total_price
      `)
      .eq('id', bookingId)
      .single()

    if (bookingError || !booking) {
      return ApiResponseHandler.notFound('Booking not found')
    }

    // Update the reschedule request status to rejected (matches DB constraint)
    const { error: updateRequestError } = await supabase
      .from('booking_reschedule_requests')
      .update({
        status: 'rejected',
        admin_response: decline_reason || 'Reschedule request declined by admin',
        updated_at: new Date().toISOString()
      })
      .eq('id', reschedule_request_id)

    if (updateRequestError) {
      console.error('Error updating reschedule request:', updateRequestError)
      return ApiResponseHandler.serverError('Failed to decline reschedule request')
    }

    // Add to booking history
    const historyNotes = [
      `Reschedule request declined`,
      `Original booking remains: ${booking.scheduled_date} ${booking.scheduled_start_time}`,
      rescheduleRequest.reason && `Customer reason: ${rescheduleRequest.reason}`,
      decline_reason && `Admin reason: ${decline_reason}`
    ].filter(Boolean).join('\n')

    const { error: historyError } = await supabase
      .from('booking_status_history')
      .insert({
        booking_id: bookingId,
        from_status: booking.status,
        to_status: booking.status, // Status remains the same
        changed_by: null, // TODO: Use actual admin user ID
        reason: 'Reschedule request declined by admin',
        notes: historyNotes,
        created_at: new Date().toISOString()
      })

    if (historyError) {
      console.error('Error adding to booking history:', historyError)
    }

    // Send decline notification email to customer
    const { data: customer } = await supabase
      .from('user_profiles')
      .select('email, first_name, last_name')
      .eq('id', booking.customer_id)
      .single()

    if (customer) {
      const emailService = new EmailService()
      const customerName = `${customer.first_name} ${customer.last_name}`
      
      // Send decline notification using reschedule response method
      const emailResult = await emailService.sendRescheduleRequestResponse(
        customer.email,
        customerName,
        booking as any,
        rescheduleRequest as any,
        'reject',
        decline_reason
      )
      
      if (!emailResult.success) {
        console.error('Failed to send decline notification email:', emailResult.error)
      }
    }

    return ApiResponseHandler.success({
      message: 'Reschedule request declined successfully',
      booking_id: bookingId,
      reschedule_request_id,
      decline_reason: decline_reason || null
    })

  } catch (error) {
    console.error('Decline reschedule request error:', error)
    return ApiResponseHandler.serverError('Failed to decline reschedule request')
  }
}