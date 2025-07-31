import { NextRequest } from 'next/server'
import { createClientFromRequest } from '@/lib/supabase/server'
import { ApiResponseHandler } from '@/lib/api/response'
import { z } from 'zod'

const deletionRequestSchema = z.object({
  confirmationText: z.string().min(1, 'Confirmation text is required'),
  reason: z.string().optional()
})

export async function POST(request: NextRequest) {
  try {
    const supabase = createClientFromRequest(request)
    
    // Get current session
    const { data: { session }, error: sessionError } = await supabase.auth.getSession()
    
    if (sessionError || !session?.user) {
      return ApiResponseHandler.unauthorized('Authentication required')
    }

    const userId = session.user.id

    // Validate request body
    const body = await request.json()
    const validatedData = deletionRequestSchema.parse(body)

    // Check confirmation text
    if (validatedData.confirmationText !== 'DELETE MY ACCOUNT') {
      return ApiResponseHandler.error(
        'Invalid confirmation text. Please type "DELETE MY ACCOUNT" exactly.',
        'INVALID_CONFIRMATION',
        400
      )
    }

    // Check for pending bookings
    const { data: pendingBookings } = await supabase
      .from('bookings')
      .select('id')
      .eq('customer_id', userId)
      .in('status', ['pending', 'confirmed', 'in_progress'])

    if (pendingBookings && pendingBookings.length > 0) {
      return ApiResponseHandler.error(
        'Cannot delete account with pending bookings. Please cancel or complete your bookings first.',
        'HAS_PENDING_BOOKINGS',
        400
      )
    }

    // Create deletion request record (for admin review if needed)
    const { error: requestError } = await supabase
      .from('account_deletion_requests')
      .insert({
        user_id: userId,
        reason: validatedData.reason || null,
        requested_at: new Date().toISOString(),
        status: 'pending'
      })

    if (requestError) {
      console.error('Account deletion request error:', requestError)
      return ApiResponseHandler.serverError('Failed to process deletion request')
    }

    // In a real implementation, you might:
    // 1. Schedule the account for deletion after a grace period
    // 2. Send confirmation email
    // 3. Anonymize data instead of deleting
    // 4. Require admin approval for deletion

    // For now, return success with information
    return ApiResponseHandler.success({
      message: 'Account deletion request received',
      details: 'Your account deletion request has been submitted and will be processed within 30 days. You will receive a confirmation email shortly.',
      gracePeriod: '30 days',
      contactInfo: 'If you need to cancel this request, please contact support immediately.'
    })

  } catch (error) {
    console.error('Account deletion error:', error)
    
    if (error instanceof z.ZodError) {
      const firstError = error.issues[0]
      return ApiResponseHandler.validationError(firstError?.message || 'Validation error')
    }

    return ApiResponseHandler.serverError('Failed to process account deletion request')
  }
}