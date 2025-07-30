import { NextRequest } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase/direct'
import { ApiResponseHandler } from '@/lib/api/response'
import { EmailService } from '@/lib/services/email'

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { sendEmail = true } = await request.json()
    const { id } = await params
    
    // Use admin client to bypass authentication temporarily
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
      console.error('Error confirming booking:', updateError)
      return ApiResponseHandler.serverError('Failed to confirm booking')
    }

    // Add to booking status history
    const { error: historyError } = await supabase
      .from('booking_status_history')
      .insert({
        booking_id: id,
        old_status: 'pending',
        new_status: 'confirmed',
        changed_by: 'admin', // TODO: Use actual admin user ID
        change_reason: 'Admin confirmation',
        created_at: new Date().toISOString()
      })

    if (historyError) {
      console.error('Error adding to booking history:', historyError)
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
          { ...booking, status: 'confirmed' } as any,
          'pending',
          'Admin confirmation'
        )
        
        if (!emailResult.success) {
          console.error('Failed to send confirmation email:', emailResult.error)
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
    console.error('Confirm booking error:', error)
    return ApiResponseHandler.serverError('Failed to confirm booking')
  }
}