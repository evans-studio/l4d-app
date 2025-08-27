import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/server'
import { ApiResponseHandler } from '@/lib/api/response'
import { logger } from '@/lib/utils/logger'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { bookingReference, paymentStatus } = body

    if (!bookingReference) {
      return ApiResponseHandler.badRequest('Booking reference is required')
    }

    const supabase = createAdminClient()

    // Find the booking by reference
    const { data: booking, error: findError } = await supabase
      .from('bookings')
      .select('id, status, payment_status')
      .eq('booking_reference', bookingReference)
      .single()

    if (findError || !booking) {
      logger.error('Booking not found:', findError)
      return ApiResponseHandler.error('Booking not found', 'BOOKING_NOT_FOUND')
    }

    // Update payment status and booking status if payment was successful
    const updates: Record<string, unknown> = {
      payment_status: paymentStatus
    }

    // If payment is successful and booking is still pending, confirm it
    if (paymentStatus === 'paid' && booking.status === 'pending') {
      updates.status = 'confirmed'
    }

    const { error: updateError } = await supabase
      .from('bookings')
      .update(updates)
      .eq('id', booking.id)

    if (updateError) {
      logger.error('Failed to update booking', updateError instanceof Error ? updateError : undefined)
      return ApiResponseHandler.serverError('Failed to update booking status')
    }

    // TODO: Send confirmation email if payment was successful

    return ApiResponseHandler.success({
      bookingId: booking.id,
      bookingReference: bookingReference,
      paymentStatus: paymentStatus,
      bookingStatus: updates.status || booking.status
    })

  } catch (error) {
    logger.error('Payment completion error', error instanceof Error ? error : undefined)
    return ApiResponseHandler.serverError('Failed to process payment completion')
  }
}