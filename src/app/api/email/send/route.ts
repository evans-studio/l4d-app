import { NextRequest } from 'next/server'
import { ApiResponseHandler } from '@/lib/api/response'
import { Resend } from 'resend'
import { z } from 'zod'

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
      console.error('RESEND_API_KEY environment variable is not set')
      return ApiResponseHandler.serverError('Email service not configured')
    }

    console.log('=== SENDING EMAIL VIA RESEND ===')
    console.log('To:', to)
    console.log('Subject:', subject)
    console.log('From: Love 4 Detailing <zell@love4detailing.com>')
    console.log('===============================')

    try {
      // Send email using Resend
      const { data, error } = await resend.emails.send({
        from: 'Love 4 Detailing <zell@love4detailing.com>',
        to: [to],
        subject,
        html,
        text,
      })

      if (error) {
        console.error('Resend API error:', error)
        return ApiResponseHandler.serverError(`Email send failed: ${error.message}`)
      }

      console.log('✅ Email sent successfully via Resend')
      console.log('Email ID:', data?.id)
      console.log('Full Resend Response:', data)

      return ApiResponseHandler.success({
        message: 'Email sent successfully',
        recipient: to,
        subject,
        emailId: data?.id
      })

    } catch (resendError) {
      console.error('Resend send error:', resendError)
      return ApiResponseHandler.serverError('Failed to send email via Resend')
    }

  } catch (error) {
    console.error('Email send error:', error)
    
    if (error instanceof z.ZodError) {
      const firstError = error.issues[0]
      return ApiResponseHandler.validationError(firstError?.message || 'Validation error')
    }

    return ApiResponseHandler.serverError('Failed to send email')
  }
}