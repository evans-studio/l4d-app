import { NextRequest } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase/direct'
import { ApiResponseHandler } from '@/lib/api/response'
import { EmailService } from '@/lib/services/email'
import { authenticateAdmin } from '@/lib/api/auth-handler'
import { logger } from '@/lib/utils/logger'
import { Booking } from '@/lib/utils/booking-types'

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

    const { reason, customReason, notes } = await request.json()
    const { id } = await params
    
    if (!reason) {
      return ApiResponseHandler.badRequest('Decline reason is required')
    }

    // Use admin client for database queries
    const supabase = supabaseAdmin
    
    // First, get the current booking to verify it exists and is pending
    const { data: booking, error: bookingError } = await supabase
      .from('bookings')
      .select(`
        id,
        booking_reference,
        status,
        customer_id,
        time_slot_id,
        scheduled_date,
        scheduled_start_time
      `)
      .eq('id', id)
      .single()

    if (bookingError || !booking) {
      return ApiResponseHandler.notFound('Booking not found')
    }

    // Check if booking is in pending status
    if (booking.status !== 'pending') {
      return ApiResponseHandler.badRequest(`Cannot decline booking with status: ${booking.status}`)
    }

    // Prepare decline notes
    const declineNotes = [
      `Reason: ${reason}`,
      customReason && `Details: ${customReason}`,
      notes && `Notes: ${notes}`
    ].filter(Boolean).join('\n')

    // Start transaction-like operations
    // 1. Update booking status to declined
    const { error: updateError } = await supabase
      .from('bookings')
      .update({
        status: 'declined', 
        declined_at: new Date().toISOString(),
        decline_reason: reason,
        internal_notes: declineNotes,
        time_slot_id: null, // Unlink from time slot
        updated_at: new Date().toISOString()
      })
      .eq('id', id)

    if (updateError) {
      logger.error('Error declining booking:', updateError)
      return ApiResponseHandler.serverError('Failed to decline booking')
    }

    // 2. Free up the time slot if it was linked
    if (booking.time_slot_id) {
      const { error: slotError } = await supabase
        .from('time_slots')
        .update({
          is_available: true,
          updated_at: new Date().toISOString()
        })
        .eq('id', booking.time_slot_id)

      if (slotError) {
        logger.error('Error freeing time slot:', slotError)
        // Don't fail the request, but log the error
      }
    }

    // 3. Add to booking status history
    const { error: historyError } = await supabase
      .from('booking_status_history')
      .insert({
        booking_id: id,
        from_status: 'pending',
        to_status: 'declined',
        changed_by: authResult.user!.id,
        reason: `Declined: ${reason}`,
        notes: declineNotes,
        created_at: new Date().toISOString()
      })

    if (historyError) {
      logger.error('Error adding to booking history:', historyError)
      // Don't fail the request for history error, just log it
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
      
      const emailResult = await emailService.sendBookingDeclineNotification(
        customer.email,
        customerName,
        { ...booking, status: 'declined' } as Booking,
        reason,
        notes
      )
      
      if (!emailResult.success) {
        logger.error('Failed to send decline notification email:', emailResult.error ? new Error(emailResult.error) : undefined)
        // Don't fail the request if email fails
      }
    }

    return ApiResponseHandler.success({
      message: 'Booking declined successfully',
      booking_id: id,
      new_status: 'declined',
      reason: reason,
      time_slot_freed: !!booking.time_slot_id
    })

  } catch (error) {
    logger.error('Decline booking error:', error instanceof Error ? error : undefined)
    return ApiResponseHandler.serverError('Failed to decline booking')
  }
}