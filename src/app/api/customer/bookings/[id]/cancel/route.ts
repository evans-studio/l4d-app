import { NextRequest, NextResponse } from 'next/server'
import { ApiResponseHandler } from '@/lib/api/response'
import { CancellationService } from '@/lib/services/cancellation'
import { createClientFromRequest } from '@/lib/supabase/server'
import { logger } from '@/lib/utils/logger'

export async function POST(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = createClientFromRequest(request)
    
    // Get current session
    const { data: { session }, error: sessionError } = await supabase.auth.getSession()
    
    if (sessionError || !session?.user) {
      return ApiResponseHandler.unauthorized('Authentication required')
    }

    const params = await context.params
    const bookingId = params.id
    const userId = session.user.id
    
    // Parse request body
    const body = await request.json()
    const { reason, acknowledgeNoRefund } = body

    if (!reason) {
      return ApiResponseHandler.badRequest('Cancellation reason is required')
    }

    // Use CancellationService for full business logic including 24-hour policy
    const cancellationService = new CancellationService()
    const result = await cancellationService.cancelBooking({
      bookingId,
      customerId: userId,
      reason,
      acknowledgeNoRefund
    })

    if (!result.data) {
      return ApiResponseHandler.badRequest(
        result.error?.message || 'Failed to cancel booking'
      )
    }

    return ApiResponseHandler.success({
      booking: result.data.booking,
      policyInfo: result.data.policyInfo,
      refundAmount: result.data.refundAmount,
      message: result.data.policyInfo.refundEligible 
        ? `Booking cancelled successfully. Refund of £${result.data.refundAmount} will be processed within 3-5 business days.`
        : 'Booking cancelled successfully. No refund applicable due to 24-hour policy.'
    })

  } catch (error) {
    logger.error('Cancel booking API error', error instanceof Error ? error : undefined)
    return ApiResponseHandler.serverError('Failed to cancel booking')
  }
}