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

    // Check if user exists
    const { data: existingUser, error: userError } = await supabase
      .from('user_profiles')
      .select('id, email, first_name')
      .eq('email', email.toLowerCase())
      .single()

    // Don't reveal if user exists or not for security
    if (userError || !existingUser) {
      // Still return success to prevent email enumeration
      return ApiResponseHandler.success({
        message: 'If an account with this email exists, you will receive a password reset link.'
      })
    }

    // Generate reset token
    const resetToken = crypto.randomBytes(32).toString('hex')
    const resetTokenHash = crypto.createHash('sha256').update(resetToken).digest('hex')
    const expiresAt = new Date(Date.now() + 60 * 60 * 1000) // 1 hour from now

    // Store reset token in database
    const { error: tokenError } = await supabase
      .from('password_reset_tokens')
      .upsert({
        user_id: existingUser.id,
        token_hash: resetTokenHash,
        expires_at: expiresAt.toISOString(),
        created_at: new Date().toISOString()
      }, {
        onConflict: 'user_id'
      })

    if (tokenError) {
      console.error('Error storing reset token:', tokenError)
      return ApiResponseHandler.serverError('Failed to generate reset token')
    }

    // Send reset email
    try {
      const resetUrl = `${process.env.NEXT_PUBLIC_APP_URL}/auth/reset-password?token=${resetToken}`
      
      // Generate email template
      const emailTemplate = EmailService.generatePasswordReset({
        customerName: existingUser.first_name || 'Customer',
        resetUrl,
        email
      })

      // Send the email
      const emailSent = await EmailService.sendEmail(email, emailTemplate)
      
      if (!emailSent) {
        console.error('Failed to send password reset email to:', email)
        // Don't fail the request - this prevents email enumeration attacks
      } else {
        console.log('Password reset email sent successfully to:', email)
      }

    } catch (emailError) {
      console.error('Error sending reset email:', emailError)
      // Don't fail the request if email fails - user might try again
    }

    return ApiResponseHandler.success({
      message: 'If an account with this email exists, you will receive a password reset link.'
    })

  } catch (error) {
    console.error('Forgot password error:', error)
    
    if (error instanceof z.ZodError) {
      return ApiResponseHandler.validationError('Invalid email address')
    }

    return ApiResponseHandler.serverError('Failed to process password reset request')
  }
}