import { NextRequest } from 'next/server'
import { BookingService } from '@/lib/services/booking'
import { ApiResponseHandler } from '@/lib/api/response'
import { ApiValidation } from '@/lib/api/validation'
import { ApiAuth } from '@/lib/api/auth'
import { z } from 'zod'

const updateStatusSchema = z.object({
  status: z.enum(['pending', 'confirmed', 'in_progress', 'completed', 'paid', 'cancelled', 'no_show']),
  reason: z.string().optional(),
  notes: z.string().optional(),
})

export async function PUT(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const params = await context.params
  try {
    const { auth, error: authError } = await ApiAuth.requireRole(['admin', 'super_admin'])
    if (authError) {
      return authError
    }

    const body = await request.json()
    const validation = await ApiValidation.validateBody(body, updateStatusSchema)
    if (!validation.success) {
      return validation.error
    }

    const bookingService = new BookingService()
    const result = await bookingService.updateBookingStatus(
      params.id,
      validation.data.status,
      auth!.profile.id as string,
      validation.data.reason,
      validation.data.notes
    )

    if (!result.success) {
      if (result.error?.message?.includes('not found')) {
        return ApiResponseHandler.error('Booking not found', 'BOOKING_NOT_FOUND', 404)
      }
      
      return ApiResponseHandler.error(
        result.error?.message || 'Failed to update booking status',
        'UPDATE_STATUS_FAILED'
      )
    }

    return ApiResponseHandler.success(result.data)

  } catch (error) {
    console.error('Update booking status error:', error)
    return ApiResponseHandler.serverError('Failed to update booking status')
  }
}