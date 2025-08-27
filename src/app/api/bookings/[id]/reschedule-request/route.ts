import { NextRequest } from 'next/server'
import { createClientFromRequest } from '@/lib/supabase/server'
import { ApiResponseHandler } from '@/lib/api/response'
import { EmailService } from '@/lib/services/email'
import { logger } from '@/lib/utils/logger'

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const body = await request.json()
    const { requestedDate, requestedTime, reason, customerNotes } = body
    const { id } = await params
    
    logger.debug('Reschedule request body:', body)
    logger.debug('Parsed values:', { requestedDate, requestedTime, reason })
    
    if (!requestedDate || !requestedTime || requestedDate.trim() === '' || requestedTime.trim() === '') {
      logger.debug('Validation failed - missing or empty date/time:', { requestedDate, requestedTime })
      return ApiResponseHandler.badRequest(`Requested date and time are required. Received: date="${requestedDate}", time="${requestedTime}"`)
    }

    const supabase = createClientFromRequest(request)
    
    // First, get the current booking to verify ownership and get details
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
      .eq('id', id)
      .single()

    if (bookingError || !booking) {
      return ApiResponseHandler.notFound('Booking not found')
    }

    // Only allow reschedule requests for confirmed, rescheduled, or in_progress bookings
    if (['cancelled', 'completed', 'declined'].includes(booking.status)) {
      return ApiResponseHandler.badRequest(`Cannot request reschedule for booking with status: ${booking.status}`)
    }

    // Check if there's already a pending reschedule request
    const { data: existingRequest } = await supabase
      .from('booking_reschedule_requests')
      .select('id, status')
      .eq('booking_id', id)
      .eq('status', 'pending')
      .single()

    if (existingRequest) {
      return ApiResponseHandler.badRequest('There is already a pending reschedule request for this booking')
    }

    // Create the reschedule request
    const { data: rescheduleRequest, error: requestError } = await supabase
      .from('booking_reschedule_requests')
      .insert({
        booking_id: id,
        requested_date: requestedDate,
        requested_time: requestedTime,
        reason: reason || null,
        customer_notes: customerNotes || null,
        original_date: booking.scheduled_date,
        original_time: booking.scheduled_start_time,
        status: 'pending',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .select('id')
      .single()

    if (requestError || !rescheduleRequest) {
      logger.error('Error creating reschedule request:', requestError)
      return ApiResponseHandler.serverError('Failed to create reschedule request')
    }

    // Send notification email to admin
    const { data: customer } = await supabase
      .from('user_profiles')
      .select('email, first_name, last_name')
      .eq('id', booking.customer_id)
      .single()

    if (customer) {
      const emailService = new EmailService()
      const customerName = `${customer.first_name} ${customer.last_name}`
      
      // Send admin notification about the reschedule request
      const adminNotification = await emailService.sendAdminRescheduleRequestNotification(
        booking,
        customerName,
        customer.email,
        requestedDate,
        requestedTime,
        reason
      )
      
      if (!adminNotification.success) {
        logger.error('Failed to send admin reschedule notification', undefined, { error: adminNotification.error })
        // Don't fail the request if email fails
      }
    }

    return ApiResponseHandler.success({
      message: 'Reschedule request submitted successfully',
      reschedule_request_id: rescheduleRequest.id,
      booking_id: id,
      requested_date: requestedDate,
      requested_time: requestedTime,
      status: 'pending'
    })

  } catch (error) {
    logger.error('Reschedule request error', error instanceof Error ? error : undefined)
    return ApiResponseHandler.serverError('Failed to submit reschedule request')
  }
}