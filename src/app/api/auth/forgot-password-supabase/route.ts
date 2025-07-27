import { NextRequest } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { ApiResponseHandler } from '@/lib/api/response'
import { EmailService } from '@/lib/services/email-service'
import { z } from 'zod'
import crypto from 'crypto'

const forgotPasswordSchema = z.object({
  email: z.string().email('Invalid email address')
})

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { email } = forgotPasswordSchema.parse(body)

    const supabase = await createClient()

    console.log('Password reset request for:', email.toLowerCase())
    
    // Check if user exists
    const { data: existingUser, error: userError } = await supabase
      .from('user_profiles')
      .select('id, email, first_name')
      .eq('email', email.toLowerCase())
      .single()

    console.log('User lookup result:', { existingUser: !!existingUser, userError: !!userError })

    // Don't reveal if user exists or not for security
    if (userError || !existingUser) {
      console.log('User not found or error occurred, but still return success for security')
      return ApiResponseHandler.success({
        message: 'If an account with this email exists, you will receive a password reset link.'
      })
    }

    console.log('User found, generating reset token for:', existingUser.email)

    // Generate a simple reset token (we'll use Supabase's built-in session for the actual reset)
    const resetToken = crypto.randomBytes(32).toString('hex')
    
    // Generate reset URL that will trigger Supabase's password reset flow
    const resetUrl = `${process.env.NEXT_PUBLIC_APP_URL || 'https://l4d-app.vercel.app'}/auth/reset-password?email=${encodeURIComponent(email)}`
    
    console.log('Reset URL generated:', resetUrl)
    
    // Generate email template using our existing email service
    const emailTemplate = EmailService.generatePasswordReset({
      customerName: existingUser.first_name || 'Customer',
      resetUrl,
      email
    })

    console.log('Generated email template, now calling EmailService.sendEmail...')

    // Send the email using our Resend service
    const emailSent = await EmailService.sendEmail(email, emailTemplate)
    
    console.log('EmailService.sendEmail returned:', emailSent)
    
    if (!emailSent) {
      console.error('Failed to send password reset email to:', email)
      return ApiResponseHandler.error(
        'Failed to send reset email', 
        'EMAIL_SEND_FAILED',
        500
      )
    }

    console.log('Password reset email sent successfully via Resend to:', email)

    return ApiResponseHandler.success({
      message: 'If an account with this email exists, you will receive a password reset link.'
    })

  } catch (error) {
    console.error('Password reset error:', error)
    
    if (error instanceof z.ZodError) {
      return ApiResponseHandler.validationError('Invalid email address')
    }

    return ApiResponseHandler.serverError('Failed to process password reset request')
  }
}