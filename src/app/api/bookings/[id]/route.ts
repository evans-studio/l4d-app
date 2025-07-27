import { NextRequest } from 'next/server'
import { BookingService } from '@/lib/services/booking'
import { ApiResponseHandler } from '@/lib/api/response'
import { ApiValidation } from '@/lib/api/validation'
import { ApiAuth } from '@/lib/api/auth'
import { z } from 'zod'

const updateBookingSchema = z.object({
  special_instructions: z.string().optional(),
  admin_notes: z.string().optional(),
  internal_notes: z.string().optional(),
  scheduled_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  time_slot_id: z.string().uuid().optional(),
})

const updateStatusSchema = z.object({
  status: z.enum(['pending', 'confirmed', 'in_progress', 'completed', 'paid', 'cancelled', 'no_show']),
  reason: z.string().optional(),
  admin_notes: z.string().optional(),
})

const confirmBookingSchema = z.object({
  scheduled_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  scheduled_start_time: z.string().regex(/^\d{2}:\d{2}$/),
  scheduled_end_time: z.string().regex(/^\d{2}:\d{2}$/),
  admin_notes: z.string().optional(),
})

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const params = await context.params
  try {
    const { auth, error: authError } = await ApiAuth.authenticate(request)
    if (authError) {
      return authError
    }

    const bookingService = new BookingService()
    const result = await bookingService.getBookingById(params.id)

    if (!result.success) {
      if (result.error?.message?.includes('not found')) {
        return ApiResponseHandler.error('Booking not found', 'BOOKING_NOT_FOUND', 404)
      }
      
      return ApiResponseHandler.error(
        result.error?.message || 'Failed to fetch booking',
        'FETCH_BOOKING_FAILED'
      )
    }

    // Check if user can access this booking
    const booking = result.data!
    if (!['admin', 'super_admin'].includes(auth!.profile.role as string) && 
        booking.customer_id !== (auth!.profile.id as string)) {
      return ApiResponseHandler.forbidden('Access denied')
    }

    return ApiResponseHandler.success(result.data)

  } catch (error) {
    console.error('Get booking error:', error)
    return ApiResponseHandler.serverError('Failed to fetch booking')
  }
}

export async function PUT(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const params = await context.params
  try {
    const { auth, error: authError } = await ApiAuth.authenticate(request)
    if (authError) {
      return authError
    }

    const body = await request.json()
    const validation = await ApiValidation.validateBody(body, updateBookingSchema)
    if (!validation.success) {
      return validation.error
    }

    const bookingService = new BookingService()
    
    // Get existing booking to check permissions
    const existingResult = await bookingService.getBookingById(params.id)
    if (!existingResult.success) {
      return ApiResponseHandler.error('Booking not found', 'BOOKING_NOT_FOUND', 404)
    }

    const booking = existingResult.data!
    
    // Check permissions
    const isAdmin = ['admin', 'super_admin'].includes(auth!.profile.role as string)
    const isOwner = booking.customer_id === (auth!.profile.id as string)
    
    if (!isAdmin && !isOwner) {
      return ApiResponseHandler.forbidden('Access denied')
    }

    // Customers can only update special_instructions
    if (!isAdmin && Object.keys(validation.data).some(key => key !== 'special_instructions')) {
      return ApiResponseHandler.forbidden('Customers can only update special instructions')
    }

    // Update booking
    const result = await bookingService.updateBooking(params.id, validation.data)

    if (!result.success) {
      return ApiResponseHandler.error(
        result.error?.message || 'Failed to update booking',
        'UPDATE_BOOKING_FAILED'
      )
    }

    return ApiResponseHandler.success(result.data)

  } catch (error) {
    console.error('Update booking error:', error)
    return ApiResponseHandler.serverError('Failed to update booking')
  }
}

export async function DELETE(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const params = await context.params
  try {
    const { auth, error: authError } = await ApiAuth.requireRole(request, ['admin', 'super_admin'])
    if (authError) {
      return authError
    }

    const bookingService = new BookingService()
    const result = await bookingService.cancelBooking(
      params.id,
      auth!.profile.id as string,
      'Cancelled by admin'
    )

    if (!result.success) {
      if (result.error?.message?.includes('not found')) {
        return ApiResponseHandler.error('Booking not found', 'BOOKING_NOT_FOUND', 404)
      }
      
      return ApiResponseHandler.error(
        result.error?.message || 'Failed to cancel booking',
        'CANCEL_BOOKING_FAILED'
      )
    }

    return ApiResponseHandler.success({ message: 'Booking cancelled successfully' })

  } catch (error) {
    console.error('Cancel booking error:', error)
    return ApiResponseHandler.serverError('Failed to cancel booking')
  }
}