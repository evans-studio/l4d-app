import { NextRequest } from 'next/server'
import { createClientFromRequest } from '@/lib/supabase/server'
import { ApiResponseHandler } from '@/lib/api/response'
import { BookingService } from '@/lib/services/booking'
import { z } from 'zod'
import { logger } from '@/lib/utils/logger'

const statusUpdateSchema = z.object({
  status: z.enum(['pending', 'processing', 'payment_failed', 'confirmed', 'rescheduled', 'in_progress', 'completed', 'declined', 'cancelled', 'no_show'])
})

function getStatusMessage(status: string): string {
  const messages = {
    pending: 'Your booking has been received and is being reviewed.',
    processing: 'Your booking is currently being processed. Please complete payment to confirm.',
    payment_failed: 'Payment was unsuccessful. Please try again or contact us for assistance.',
    confirmed: 'Your booking has been confirmed! We look forward to servicing your vehicle.',
    rescheduled: 'Your booking has been rescheduled. Check your email for the new details.',
    in_progress: 'Our team has started working on your vehicle.',
    completed: 'Your vehicle detailing service has been completed!',
    declined: 'Your booking request has been declined. We will contact you with alternative options.',
    cancelled: 'Your booking has been cancelled. If you have any questions, please contact us.',
    no_show: 'We were unable to complete your booking due to customer unavailability.'
  }
  return messages[status as keyof typeof messages] || 'Your booking status has been updated.'
}

export async function PUT(
  request: NextRequest, 
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params
    const supabase = createClientFromRequest(request)
    
    // Get current session and verify admin role
    const { data: { session }, error: sessionError } = await supabase.auth.getSession()
    
    if (sessionError || !session?.user) {
      return ApiResponseHandler.unauthorized('Authentication required')
    }

    // Check user role
    const { data: profile } = await supabase
      .from('user_profiles')
      .select('role')
      .eq('id', session.user.id)
      .single()

    if (!profile || (profile.role !== 'admin' && profile.role !== 'super_admin')) {
      return ApiResponseHandler.forbidden('Admin access required')
    }

    // Validate request body
    const body = await request.json()
    const { status } = statusUpdateSchema.parse(body)
    const { reason, notes } = body

    // Use BookingService to update status (includes email notifications)
    const bookingService = new BookingService()
    const result = await bookingService.updateBookingStatus(
      id,
      status,
      session.user.id,
      reason || `Status updated to ${status} by admin`,
      notes
    )

    if (!result.success) {
      return ApiResponseHandler.serverError(
        result.error?.message || 'Failed to update booking status'
      )
    }

    return ApiResponseHandler.success({
      booking: result.data,
      message: `Booking status updated to ${status}`,
      emailSent: true
    })

  } catch (error) {
    logger.error('Booking status update error:', error instanceof Error ? error : undefined)
    
    if (error instanceof z.ZodError) {
      const firstError = error.issues[0]
      return ApiResponseHandler.validationError(firstError?.message || 'Invalid status')
    }

    return ApiResponseHandler.serverError('Failed to update booking status')
  }
}