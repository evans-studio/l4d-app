import { NextRequest } from 'next/server'
import { ApiResponseHandler } from '@/lib/api/response'
import { authenticateAdmin } from '@/lib/api/auth-handler'
import { paymentReminderService } from '@/lib/services/payment-reminders'
import { logger } from '@/lib/utils/logger'

export async function POST(request: NextRequest) {
  try {
    // Authenticate admin access
    const authResult = await authenticateAdmin(request)
    if (!authResult.success) {
      return authResult.error!
    }

    // Process payment reminders
    const result = await paymentReminderService.processPaymentReminders()

    if (!result.success) {
      return ApiResponseHandler.error('Failed to process payment reminders', 'PAYMENT_REMINDER_ERROR', 500, {
        errors: result.errors
      })
    }

    return ApiResponseHandler.success({
      message: 'Payment reminders processed successfully',
      processed: result.processed,
      sent: result.sent,
      errors: result.errors
    })

  } catch (error) {
    logger.error('Payment reminders API error:', error instanceof Error ? error : undefined)
    return ApiResponseHandler.serverError('Failed to process payment reminders')
  }
}

export async function GET(request: NextRequest) {
  try {
    // Authenticate admin access  
    const authResult = await authenticateAdmin(request)
    if (!authResult.success) {
      return authResult.error!
    }

    // Get overdue payments
    const result = await paymentReminderService.getOverduePayments()

    if (!result.success) {
      return ApiResponseHandler.serverError('Failed to get overdue payments')
    }

    return ApiResponseHandler.success({
      overduePayments: result.data || [],
      count: result.data?.length || 0
    })

  } catch (error) {
    logger.error('Get overdue payments API error:', error instanceof Error ? error : undefined)
    return ApiResponseHandler.serverError('Failed to get overdue payments')
  }
}