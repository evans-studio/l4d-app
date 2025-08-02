import { NextRequest } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { ApiResponseHandler } from '@/lib/api/response'
import { EmailService } from '@/lib/services/email'

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

    // Parse request body - using different field names to match the frontend
    const { date, time, reason } = await request.json()

    if (!date || !time || !reason) {
      return ApiResponseHandler.badRequest('Missing required fields: date, time, and reason are required')
    }

    // Verify booking belongs to user and can be rescheduled
    const { data: booking, error: bookingError } = await supabase
      .from('bookings')
      .select('id, customer_id, status, booking_reference, scheduled_date, scheduled_start_time')
      .eq('id', bookingId)
      .eq('customer_id', user.id)
      .single()

    if (bookingError || !booking) {
      return ApiResponseHandler.notFound('Booking not found or you do not have access to it')
    }

    // Check if booking can be rescheduled
    if (!['pending', 'confirmed'].includes(booking.status)) {
      return ApiResponseHandler.badRequest(`Booking cannot be rescheduled. Current status: ${booking.status}`)
    }

    // Check if there's already a pending reschedule request for this booking
    const { data: existingRequest, error: existingError } = await supabase
      .from('booking_reschedule_requests')
      .select('id, status')
      .eq('booking_id', bookingId)
      .eq('status', 'pending')
      .single()

    if (existingRequest) {
      return ApiResponseHandler.badRequest('There is already a pending reschedule request for this booking')
    }

    // Verify the requested time slot is available
    const { data: timeSlot, error: timeSlotError } = await supabase
      .from('time_slots')
      .select('id, start_time, end_time, slot_date, is_available')
      .eq('slot_date', date)
      .eq('start_time', time)
      .eq('is_available', true)
      .single()

    if (timeSlotError || !timeSlot) {
      return ApiResponseHandler.badRequest('The requested time slot is not available. Please choose a different time.')
    }

    // Create reschedule request instead of immediately rescheduling
    const { data: rescheduleRequest, error: createRequestError } = await supabase
      .from('booking_reschedule_requests')
      .insert({
        booking_id: bookingId,
        customer_id: user.id,
        requested_date: date,
        requested_time: time,
        requested_end_time: timeSlot.end_time,
        time_slot_id: timeSlot.id,
        reason: reason,
        status: 'pending',
        created_at: new Date().toISOString()
      })
      .select('id')
      .single()

    if (createRequestError) {
      console.error('Error creating reschedule request:', createRequestError)
      return ApiResponseHandler.serverError('Failed to submit reschedule request')
    }

    // Get customer profile for email notification
    const { data: customerProfile, error: profileError } = await supabase
      .from('user_profiles')
      .select('first_name, last_name, email')
      .eq('id', user.id)
      .single()

    // Log the reschedule request action
    const { error: logError } = await supabase
      .from('booking_history')
      .insert({
        booking_id: bookingId,
        action: 'reschedule_requested',
        details: {
          old_date: booking.scheduled_date,
          old_start_time: booking.scheduled_start_time,
          requested_date: date,
          requested_time: time,
          reason: reason,
          request_id: rescheduleRequest.id
        },
        created_by: user.id,
        created_at: new Date().toISOString()
      })

    if (logError) {
      console.error('Error logging reschedule request action:', logError)
      // Don't fail the request if logging fails
    }

    // Send confirmation email to customer
    if (customerProfile) {
      try {
        const emailService = new EmailService()
        const customerName = `${customerProfile.first_name} ${customerProfile.last_name}`
        
        // Send customer confirmation email
        await emailService.sendBookingStatusUpdate(
          customerProfile.email,
          customerName,
          {
            ...booking,
            booking_reference: booking.booking_reference
          } as any,
          'reschedule_requested',
          `We've received your reschedule request for ${date} at ${time}. Our team will review your request and get back to you within 24 hours.`
        )

        // TODO: Send notification to admin about new reschedule request
        // This could be implemented later as part of admin notification system
        
      } catch (emailError) {
        console.error('Failed to send reschedule request confirmation:', emailError)
        // Don't fail the request if email fails
      }
    }

    return ApiResponseHandler.success({
      message: 'Reschedule request submitted successfully',
      request_id: rescheduleRequest.id,
      booking_id: bookingId,
      requested_date: date,
      requested_time: time,
      status: 'pending',
      note: 'Your reschedule request has been submitted and is pending admin approval. You will receive an email notification once it has been reviewed.'
    })

  } catch (error) {
    console.error('Submit reschedule request error:', error)
    return ApiResponseHandler.serverError('Failed to submit reschedule request')
  }
}