import { NextRequest } from 'next/server'
import { supabase } from '@/lib/supabase'
import { ApiResponseHandler } from '@/lib/api/response'
import { ForgotPasswordRequestSchema } from '@/schemas/auth.schema'
import { Resend } from 'resend'
import { randomBytes, createHash } from 'crypto'
import { z } from 'zod'

// Force Node.js runtime for email service compatibility
export const runtime = 'nodejs'

// Initialize Resend
const resend = new Resend(process.env.RESEND_API_KEY)

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const validation = ForgotPasswordRequestSchema.safeParse(body)
    
    if (!validation.success) {
      return ApiResponseHandler.error('Validation failed', 'INVALID_INPUT', 400, {
        validationErrors: validation.error.flatten().fieldErrors
      })
    }
    
    const { email } = validation.data

    console.log('Password reset request for:', email.toLowerCase())
    
    // Check if user exists (for logging purposes, but don't reveal to client)
    const { data: existingUser, error: userError } = await supabase
      .from('user_profiles')
      .select('id, email, first_name')
      .eq('email', email.toLowerCase())
      .single()

    console.log('User lookup result:', { existingUser: !!existingUser, userError: !!userError })

    // If user doesn't exist, still return success for security (don't reveal whether email exists)
    if (userError && userError.code === 'PGRST116') {
      console.log('User not found but returning success for security')
      return ApiResponseHandler.success({
        message: 'If an account with this email exists, you will receive a password reset link.'
      })
    }

    // Only send email if user exists
    if (existingUser) {
      // First try our custom Resend approach
      try {
        console.log('Attempting custom email with Resend...')
        
        // Check if we have required environment variables
        if (!process.env.RESEND_API_KEY) {
          console.error('RESEND_API_KEY not configured, falling back to Supabase')
          throw new Error('Resend not configured')
        }

        // Check if password_reset_tokens table exists
        const { error: tableCheckError } = await supabase
          .from('password_reset_tokens')
          .select('count')
          .limit(1)

        if (tableCheckError) {
          console.error('password_reset_tokens table not found, falling back to Supabase:', tableCheckError)
          throw new Error('Database table not ready')
        }

        // Generate a secure reset token using crypto
        const resetToken = randomBytes(32).toString('hex')
        const hashedToken = createHash('sha256').update(resetToken).digest('hex')
        const expiresAt = new Date(Date.now() + 60 * 60 * 1000) // 1 hour from now

        // Store the reset token in database
        const { error: tokenError } = await supabase
          .from('password_reset_tokens')
          .upsert({
            user_id: existingUser.id,
            email: email.toLowerCase(),
            token_hash: hashedToken,
            expires_at: expiresAt.toISOString(),
            created_at: new Date().toISOString()
          }, {
            onConflict: 'user_id'
          })

        if (tokenError) {
          console.error('Error storing reset token:', tokenError)
          throw new Error('Failed to store reset token')
        }

        const resetUrl = `${process.env.NEXT_PUBLIC_APP_URL || 'https://l4d-app.vercel.app'}/auth/reset-password?token=${resetToken}`
        
        // Create email content
        const subject = 'Reset Your Password - Love 4 Detailing'
        const firstName = existingUser.first_name || 'there'
        
        const html = `
          <!DOCTYPE html>
          <html>
          <head>
            <meta charset="utf-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>Reset Your Password</title>
          </head>
          <body style="margin: 0; padding: 0; font-family: Arial, sans-serif; background-color: #f5f5f5;">
            <div style="max-width: 600px; margin: 0 auto; background-color: #ffffff;">
              <div style="background: linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%); padding: 40px 20px; text-align: center;">
                <h1 style="color: #ffffff; margin: 0; font-size: 28px; font-weight: bold;">Love 4 Detailing</h1>
                <p style="color: #e0e7ff; margin: 10px 0 0 0; font-size: 16px;">Password Reset Request</p>
              </div>
              
              <div style="padding: 40px 20px;">
                <h2 style="color: #1f2937; margin: 0 0 20px 0; font-size: 24px;">Hi ${firstName}!</h2>
                
                <p style="color: #4b5563; font-size: 16px; line-height: 1.6; margin: 0 0 20px 0;">
                  We received a request to reset your password for your Love 4 Detailing account. If you made this request, click the button below to set a new password:
                </p>
                
                <div style="text-align: center; margin: 30px 0;">
                  <a href="${resetUrl}" style="display: inline-block; background: linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%); color: #ffffff; text-decoration: none; padding: 15px 30px; border-radius: 8px; font-weight: bold; font-size: 16px;">Reset My Password</a>
                </div>
                
                <p style="color: #6b7280; font-size: 14px; line-height: 1.6; margin: 20px 0;">
                  This link will expire in 1 hour for security reasons. If you didn't request this password reset, you can safely ignore this email.
                </p>
                
                <p style="color: #6b7280; font-size: 14px; line-height: 1.6; margin: 20px 0;">
                  If the button doesn't work, you can copy and paste this link into your browser:<br>
                  <span style="word-break: break-all; color: #6366f1;">${resetUrl}</span>
                </p>
              </div>
              
              <div style="background-color: #f9fafb; padding: 20px; text-align: center; border-top: 1px solid #e5e7eb;">
                <p style="color: #6b7280; font-size: 12px; margin: 0;">
                  Love 4 Detailing - Professional Mobile Car Detailing<br>
                  This email was sent because you requested a password reset.
                </p>
              </div>
            </div>
          </body>
          </html>
        `
        
        const text = `
          Hi ${firstName}!
          
          We received a request to reset your password for your Love 4 Detailing account.
          
          Click this link to reset your password: ${resetUrl}
          
          This link will expire in 1 hour for security reasons.
          
          If you didn't request this password reset, you can safely ignore this email.
          
          Love 4 Detailing
          Professional Mobile Car Detailing
        `

        // Send email via Resend
        const { data, error: emailError } = await resend.emails.send({
          from: `Love 4 Detailing <${process.env.NEXT_PUBLIC_FROM_EMAIL || 'zell@love4detailing.com'}>`,
          to: [email.toLowerCase()],
          subject,
          html,
          text,
        })

        if (emailError) {
          console.error('❌ Resend email API error:', emailError)
          console.error('Error details:', JSON.stringify(emailError, null, 2))
          throw new Error(`Resend API error: ${emailError.message || 'Unknown error'}`)
        }

        console.log('✅ Password reset email sent successfully via Resend')
        console.log('Email ID:', data?.id)
        console.log('Recipient:', email)
        console.log('Sender:', process.env.NEXT_PUBLIC_FROM_EMAIL || 'zell@love4detailing.com')
        console.log('Full Resend response:', JSON.stringify(data, null, 2))
        
      } catch (customEmailError) {
        console.error('Custom email system failed:', customEmailError)
        console.log('Falling back to Supabase built-in password reset...')
        
        // Fallback to Supabase's built-in password reset
        try {
          const { error: supabaseResetError } = await supabase.auth.resetPasswordForEmail(email.toLowerCase(), {
            redirectTo: `${process.env.NEXT_PUBLIC_APP_URL || 'https://l4d-app.vercel.app'}/auth/reset-password`
          })

          if (supabaseResetError) {
            console.error('Supabase reset also failed:', supabaseResetError)
            return ApiResponseHandler.error(
              'Failed to send reset email', 
              'EMAIL_SEND_FAILED',
              500
            )
          }

          console.log('Password reset email sent via Supabase fallback to:', email)
          
        } catch (fallbackError) {
          console.error('Both email systems failed:', fallbackError)
          return ApiResponseHandler.error(
            'Failed to send reset email', 
            'EMAIL_SEND_FAILED',
            500
          )
        }
      }
    }

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