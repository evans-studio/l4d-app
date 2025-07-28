import { NextRequest } from 'next/server'
import { BookingService } from '@/lib/services/booking'
import { ApiResponseHandler } from '@/lib/api/response'
import { ApiValidation } from '@/lib/api/validation'
import { ApiAuth } from '@/lib/api/auth'
import { z } from 'zod'

const confirmBookingSchema = z.object({
  scheduled_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Invalid date format'),
  scheduled_start_time: z.string().regex(/^\d{2}:\d{2}$/, 'Invalid time format'),
  scheduled_end_time: z.string().regex(/^\d{2}:\d{2}$/, 'Invalid time format'),
  admin_notes: z.string().optional(),
})

export async function POST(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const params = await context.params
  try {
    const { auth, error: authError } = await ApiAuth.requireRole(request, ['admin', 'super_admin'])
    if (authError) {
      return authError
    }

    const body = await request.json()
    const validation = await ApiValidation.validateBody(body, confirmBookingSchema)
    if (!validation.success) {
      return validation.error
    }

    const bookingService = new BookingService()
    const result = await bookingService.confirmBooking(
      params.id,
      validation.data.scheduled_date,
      validation.data.scheduled_start_time,
      validation.data.scheduled_end_time,
      auth!.profile.id as string,
      validation.data.admin_notes
    )

    if (!result.success) {
      if (result.error?.message?.includes('not found')) {
        return ApiResponseHandler.error('Booking not found', 'BOOKING_NOT_FOUND', 404)
      }
      
      return ApiResponseHandler.error(
        result.error?.message || 'Failed to confirm booking',
        'CONFIRM_BOOKING_FAILED'
      )
    }

    return ApiResponseHandler.success(result.data)

  } catch (error) {
    console.error('Confirm booking error:', error)
    return ApiResponseHandler.serverError('Failed to confirm booking')
  }
}