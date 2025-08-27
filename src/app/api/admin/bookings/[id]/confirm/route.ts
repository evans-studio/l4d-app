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

    const { sendEmail = true } = await request.json()
    const { id } = await params
    
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
        scheduled_date,
        scheduled_start_time,
        time_slot_id
      `)
      .eq('id', id)
      .single()

    if (bookingError || !booking) {
      return ApiResponseHandler.notFound('Booking not found')
    }

    // Check if booking is in pending status
    if (booking.status !== 'pending') {
      return ApiResponseHandler.badRequest(`Cannot confirm booking with status: ${booking.status}`)
    }

    // Update booking status to confirmed
    const { error: updateError } = await supabase
      .from('bookings')
      .update({
        status: 'confirmed',
        confirmed_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .eq('id', id)

    if (updateError) {
      logger.error('Error confirming booking:', updateError)
      return ApiResponseHandler.serverError('Failed to confirm booking')
    }

    // Add to booking status history
    const { error: historyError } = await supabase
      .from('booking_status_history')
      .insert({
        booking_id: id,
        from_status: 'pending',
        to_status: 'confirmed',
        changed_by: authResult.user!.id,
        reason: 'Admin confirmation',
        created_at: new Date().toISOString()
      })

    if (historyError) {
      logger.error('Error adding to booking history:', historyError)
      // Don't fail the request for history error, just log it
    }

    // Send confirmation email if requested
    if (sendEmail) {
      // Get customer details for email
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
          { ...booking, status: 'confirmed' } as Booking,
          'pending',
          'Admin confirmation'
        )
        
        if (!emailResult.success) {
          logger.error('Failed to send confirmation email:', emailResult.error ? new Error(emailResult.error) : undefined)
          // Don't fail the request if email fails
        }
      }
    }

    return ApiResponseHandler.success({
      message: 'Booking confirmed successfully',
      booking_id: id,
      new_status: 'confirmed',
      email_sent: sendEmail
    })

  } catch (error) {
    logger.error('Confirm booking error:', error instanceof Error ? error : undefined)
    return ApiResponseHandler.serverError('Failed to confirm booking')
  }
}