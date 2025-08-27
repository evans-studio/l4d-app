import { NextRequest } from 'next/server'
import { ApiResponseHandler } from '@/lib/api/response'
import { Resend } from 'resend'
import { z } from 'zod'
import { logger } from '@/lib/utils/logger'

// Force Node.js runtime for email service compatibility
export const runtime = 'nodejs'

const emailSchema = z.object({
  to: z.string().email('Invalid recipient email'),
  subject: z.string().min(1, 'Subject is required'),
  html: z.string().min(1, 'HTML content is required'),
  text: z.string().min(1, 'Text content is required')
})

// Initialize Resend with API key
const resend = new Resend(process.env.RESEND_API_KEY)

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { to, subject, html, text } = emailSchema.parse(body)

    // Validate Resend API key
    if (!process.env.RESEND_API_KEY) {
      logger.error('RESEND_API_KEY environment variable is not set')
      return ApiResponseHandler.serverError('Email service not configured')
    }

    if (process.env.NODE_ENV !== 'production') {
      logger.debug('RESEND_API_KEY exists', { exists: !!process.env.RESEND_API_KEY })
      logger.debug('RESEND_API_KEY length', { length: process.env.RESEND_API_KEY?.length || 0 })
      logger.debug('=== SENDING EMAIL VIA RESEND ===')
      logger.debug('Email metadata', { to, subject, from: `Love 4 Detailing <${process.env.NEXT_PUBLIC_FROM_EMAIL || 'zell@love4detailing.com'}>` })
      logger.debug('===============================')
    }

    try {
      // Send email using Resend
      const { data, error } = await resend.emails.send({
        from: `Love 4 Detailing <${process.env.NEXT_PUBLIC_FROM_EMAIL || 'zell@love4detailing.com'}>`,
        to: [to],
        subject,
        html,
        text,
      })

      if (error) {
        logger.error('Resend API error', error instanceof Error ? error : undefined)
        return ApiResponseHandler.serverError(`Email send failed: ${error.message}`)
      }

      if (process.env.NODE_ENV !== 'production') {
        logger.debug('✅ Email sent successfully via Resend')
        logger.debug('Email result', { id: data?.id, response: data })
      }

      return ApiResponseHandler.success({
        message: 'Email sent successfully',
        recipient: to,
        subject,
        emailId: data?.id
      })

    } catch (resendError) {
      logger.error('Resend send error', resendError instanceof Error ? resendError : undefined)
      return ApiResponseHandler.serverError('Failed to send email via Resend')
    }

  } catch (error) {
    logger.error('Email send error', error instanceof Error ? error : undefined)
    
    if (error instanceof z.ZodError) {
      const firstError = error.issues[0]
      return ApiResponseHandler.validationError(firstError?.message || 'Validation error')
    }

    return ApiResponseHandler.serverError('Failed to send email')
  }
}