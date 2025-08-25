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

    const { reason, refundAmount, notes } = await request.json()
    const { id } = await params
    
    if (!reason) {
      return ApiResponseHandler.badRequest('Cancellation reason is required')
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
        time_slot_id,
        scheduled_date,
        scheduled_start_time,
        total_price
      `)
      .eq('id', id)
      .single()

    if (bookingError || !booking) {
      return ApiResponseHandler.notFound('Booking not found')
    }

    // Don't allow cancelling already cancelled bookings
    if (booking.status === 'cancelled') {
      return ApiResponseHandler.badRequest('Booking is already cancelled')
    }

    // Prepare cancellation notes
    const cancellationNotes = [
      `Reason: ${reason}`,
      refundAmount && `Refund Amount: £${refundAmount}`,
      notes && `Notes: ${notes}`
    ].filter(Boolean).join('\n')

    // Update booking status to cancelled
    const { error: updateError } = await supabase
      .from('bookings')
      .update({
        status: 'cancelled',
        cancelled_at: new Date().toISOString(),
        cancellation_reason: reason,
        refund_amount: refundAmount || null,
        admin_notes: cancellationNotes,
        time_slot_id: null, // Unlink from time slot
        updated_at: new Date().toISOString()
      })
      .eq('id', id)

    if (updateError) {
      console.error('Error cancelling booking:', updateError)
      return ApiResponseHandler.serverError('Failed to cancel booking')
    }

    // Free up the time slot if it was linked
    if (booking.time_slot_id) {
      const { error: slotError } = await supabase
        .from('time_slots')
        .update({
          is_available: true
        })
        .eq('id', booking.time_slot_id)

      if (slotError) {
        console.error('Error freeing time slot:', slotError)
        // Don't fail the request, but log the error
      }
    }

    // Add to booking status history
    const { error: historyError } = await supabase
      .from('booking_status_history')
      .insert({
        booking_id: id,
        from_status: booking.status,
        to_status: 'cancelled',
        changed_by: authResult.user!.id,
        reason: `Cancelled: ${reason}`,
        notes: cancellationNotes,
        created_at: new Date().toISOString()
      })

    if (historyError) {
      console.error('Error adding to booking history:', historyError)
      // Don't fail the request for history error, just log it
    }

    // Send cancellation notification email to customer
    const { data: customer } = await supabase
      .from('user_profiles')
      .select('email, first_name, last_name')
      .eq('id', booking.customer_id)
      .single()

    if (customer) {
      const emailService = new EmailService()
      const customerName = `${customer.first_name} ${customer.last_name}`
      
      // Use the existing status update email with cancellation details
      const emailUpdateReason = [
        `Your booking has been cancelled. Reason: ${reason}`,
        refundAmount && `A refund of £${refundAmount} will be processed.`,
        notes && `Additional information: ${notes}`
      ].filter(Boolean).join(' ')
      
      const emailResult = await emailService.sendBookingStatusUpdate(
        customer.email,
        customerName,
        { ...booking, status: 'cancelled' } as any,
        booking.status,
        emailUpdateReason
      )
      
      if (!emailResult.success) {
        console.error('Failed to send cancellation notification email:', emailResult.error)
        // Don't fail the request if email fails
      }
    }

    return ApiResponseHandler.success({
      message: 'Booking cancelled successfully',
      booking_id: id,
      new_status: 'cancelled',
      reason: reason,
      refund_amount: refundAmount || null,
      time_slot_freed: !!booking.time_slot_id
    })

  } catch (error) {
    console.error('Cancel booking error:', error)
    return ApiResponseHandler.serverError('Failed to cancel booking')
  }
}