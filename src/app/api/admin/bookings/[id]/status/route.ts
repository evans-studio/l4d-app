import { NextRequest } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { ApiResponseHandler } from '@/lib/api/response'
import { BookingService } from '@/lib/services/booking'
import { z } from 'zod'

const statusUpdateSchema = z.object({
  status: z.enum(['pending', 'confirmed', 'in_progress', 'completed', 'cancelled'])
})

function getStatusMessage(status: string): string {
  const messages = {
    pending: 'Your booking is pending confirmation.',
    confirmed: 'Your booking has been confirmed! We look forward to servicing your vehicle.',
    in_progress: 'Our team has started working on your vehicle.',
    completed: 'Your vehicle detailing service has been completed!',
    cancelled: 'Your booking has been cancelled. If you have any questions, please contact us.'
  }
  return messages[status as keyof typeof messages] || 'Your booking status has been updated.'
}

export async function PUT(
  request: NextRequest, 
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params
    const supabase = await createClient()
    
    // Get current user and verify admin role
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    
    if (authError || !user) {
      return ApiResponseHandler.unauthorized('Authentication required')
    }

    // Check user role
    const { data: profile } = await supabase
      .from('user_profiles')
      .select('role')
      .eq('id', user.id)
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
      user.id,
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
    console.error('Booking status update error:', error)
    
    if (error instanceof z.ZodError) {
      const firstError = error.issues[0]
      return ApiResponseHandler.validationError(firstError?.message || 'Invalid status')
    }

    return ApiResponseHandler.serverError('Failed to update booking status')
  }
}