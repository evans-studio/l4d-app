import { NextRequest } from 'next/server'
import { ApiResponseHandler } from '@/lib/api/response'
import { CancellationService } from '@/lib/services/cancellation'
import { createClientFromRequest } from '@/lib/supabase/server'

export async function GET(
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

    // Verify booking belongs to user
    const { data: booking, error: fetchError } = await supabase
      .from('bookings')
      .select('id, customer_id')
      .eq('id', bookingId)
      .single()

    if (fetchError || !booking) {
      return ApiResponseHandler.notFound('Booking not found')
    }

    if (booking.customer_id !== session.user.id) {
      return ApiResponseHandler.forbidden('Access denied')
    }

    // Check cancellation policy
    const cancellationService = new CancellationService()
    const policyResult = await cancellationService.checkCancellationPolicy(bookingId)

    if (!policyResult.data) {
      return ApiResponseHandler.serverError(
        policyResult.error?.message || 'Failed to check cancellation policy'
      )
    }

    return ApiResponseHandler.success(policyResult.data)

  } catch (error) {
    console.error('Check cancellation policy error:', error)
    return ApiResponseHandler.serverError('Failed to check cancellation policy')
  }
}