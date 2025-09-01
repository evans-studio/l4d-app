import { NextRequest } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase/direct'
import { ApiResponseHandler } from '@/lib/api/response'
import { authenticateAdmin } from '@/lib/api/auth-handler'
import { z } from 'zod'
import { logger } from '@/lib/utils/logger'

const bodySchema = z.object({
  payment_status: z.enum(['pending', 'awaiting_payment', 'paid', 'payment_failed', 'refunded']),
  reason: z.string().optional(),
  notes: z.string().optional(),
})

export async function PUT(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params

    const auth = await authenticateAdmin(request)
    if (!auth.success) return auth.error!

    const supabase = supabaseAdmin
    const body = await request.json()
    const { payment_status, reason, notes } = bodySchema.parse(body)

    // Update payment_status (and derive status if toggling back to pending/failed)
    const update: Record<string, unknown> = {
      payment_status,
      updated_at: new Date().toISOString(),
    }

    // If marking paid, do not change status here (use mark-paid endpoint for auto-confirm + emails)
    if (payment_status === 'payment_failed') {
      // Don't auto-cancel; leave business decision to admin via status update
    }

    const { data: booking, error } = await supabase
      .from('bookings')
      .update(update)
      .eq('id', id)
      .select()
      .single()

    if (error) {
      logger.error('Payment status admin update error:', error)
      return ApiResponseHandler.serverError('Failed to update payment status')
    }

    // Log audit trail in booking_status_history as a note-only entry
    try {
      await supabase.from('booking_status_history').insert({
        booking_id: id,
        from_status: booking.status,
        to_status: booking.status,
        changed_by: auth.user!.id,
        reason: reason || `Payment status set to ${payment_status} by admin`,
        notes,
        created_at: new Date().toISOString(),
      })
    } catch (e) {
      logger.warn('Payment status history insert warning:', e as any)
    }

    return ApiResponseHandler.success({ booking, message: 'Payment status updated' })
  } catch (err) {
    logger.error('Payment status route error:', err instanceof Error ? err : undefined)
    if (err instanceof z.ZodError) {
      const first = err.issues[0]
      return ApiResponseHandler.validationError(first?.message || 'Invalid body')
    }
    return ApiResponseHandler.serverError('Failed to update payment status')
  }
}


