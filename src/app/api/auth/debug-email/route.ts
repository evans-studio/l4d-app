import { NextRequest } from 'next/server'
import { ApiResponseHandler } from '@/lib/api/response'
import { Resend } from 'resend'
import { z } from 'zod'

// Force Node.js runtime
export const runtime = 'nodejs'

const testEmailSchema = z.object({
  email: z.string().email('Invalid email address')
})

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { email } = testEmailSchema.parse(body)

    console.log('=== DETAILED EMAIL DEBUG ===')
    console.log('Target email:', email)
    console.log('RESEND_API_KEY exists:', !!process.env.RESEND_API_KEY)
    console.log('RESEND_API_KEY starts with:', process.env.RESEND_API_KEY?.substring(0, 10) + '...')
    console.log('From email:', process.env.NEXT_PUBLIC_FROM_EMAIL || 'zell@love4detailing.com')
    console.log('Current time:', new Date().toISOString())

    if (!process.env.RESEND_API_KEY) {
      return ApiResponseHandler.error('RESEND_API_KEY not configured', 'MISSING_API_KEY', 500)
    }

    const resend = new Resend(process.env.RESEND_API_KEY)

    // Try to send a very simple test email
    console.log('Attempting to send test email...')
    
    try {
      const result = await resend.emails.send({
        from: `Love 4 Detailing Test <${process.env.NEXT_PUBLIC_FROM_EMAIL || 'zell@love4detailing.com'}>`,
        to: [email],
        subject: `Email Test - ${new Date().toLocaleTimeString()}`,
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h1 style="color: #6366f1;">Email System Test</h1>
            <p>This is a test email to debug the email system.</p>
            <div style="background: #f3f4f6; padding: 20px; border-radius: 8px; margin: 20px 0;">
              <h3>Debug Information:</h3>
              <ul>
                <li><strong>Sent at:</strong> ${new Date().toISOString()}</li>
                <li><strong>To:</strong> ${email}</li>
                <li><strong>From:</strong> ${process.env.NEXT_PUBLIC_FROM_EMAIL || 'zell@love4detailing.com'}</li>
                <li><strong>API Key Length:</strong> ${process.env.RESEND_API_KEY?.length} characters</li>
                <li><strong>Environment:</strong> ${process.env.NODE_ENV || 'unknown'}</li>
              </ul>
            </div>
            <p style="color: #6b7280; font-size: 12px;">
              If you received this email, the Resend integration is working correctly.
            </p>
          </div>
        `,
        text: `
Email System Test

This is a test email sent at ${new Date().toISOString()}

Debug Info:
- To: ${email}
- From: ${process.env.NEXT_PUBLIC_FROM_EMAIL || 'zell@love4detailing.com'}
- API Key Length: ${process.env.RESEND_API_KEY?.length} characters

If you received this email, the Resend integration is working correctly.
        `.trim()
      })

      console.log('✅ Resend API call successful')
      console.log('Response:', JSON.stringify(result, null, 2))

      if (result.error) {
        console.error('❌ Resend returned error:', result.error)
        return ApiResponseHandler.error(
          `Resend API error: ${result.error.message}`,
          'RESEND_API_ERROR',
          400
        )
      }

      if (result.data) {
        console.log('✅ Email sent successfully')
        console.log('Email ID:', result.data.id)

        // Additional debug information
        const debugInfo = {
          emailId: result.data.id,
          recipient: email,
          sender: process.env.NEXT_PUBLIC_FROM_EMAIL || 'zell@love4detailing.com',
          timestamp: new Date().toISOString(),
          apiKeyLength: process.env.RESEND_API_KEY?.length,
          apiKeyPrefix: process.env.RESEND_API_KEY?.substring(0, 10) + '...',
          environment: process.env.NODE_ENV || 'unknown'
        }

        return ApiResponseHandler.success({
          message: 'Test email sent successfully',
          debug: debugInfo,
          resendResponse: result.data
        })
      }

      return ApiResponseHandler.error('Unexpected response from Resend', 'UNEXPECTED_RESPONSE', 500)

    } catch (resendError: any) {
      console.error('❌ Resend API call failed:', resendError)
      
      let errorMessage = 'Unknown error'
      let errorCode = 'RESEND_ERROR'
      
      if (resendError.message) {
        errorMessage = resendError.message
      }
      
      if (resendError.code) {
        errorCode = resendError.code
      }

      // Check for common Resend errors
      if (errorMessage.includes('unauthorized') || errorMessage.includes('401')) {
        errorMessage = 'Invalid Resend API key - check your RESEND_API_KEY environment variable'
        errorCode = 'INVALID_API_KEY'
      } else if (errorMessage.includes('domain') || errorMessage.includes('verified')) {
        errorMessage = 'Domain not verified in Resend - check your domain verification'
        errorCode = 'DOMAIN_NOT_VERIFIED'
      } else if (errorMessage.includes('rate limit')) {
        errorMessage = 'Rate limited by Resend - try again later'
        errorCode = 'RATE_LIMITED'
      }

      return ApiResponseHandler.error(errorMessage, errorCode, 500)
    }

  } catch (error) {
    console.error('❌ Debug email error:', error)
    
    if (error instanceof z.ZodError) {
      return ApiResponseHandler.validationError('Invalid email address')
    }

    return ApiResponseHandler.serverError('Failed to send debug email')
  }
}