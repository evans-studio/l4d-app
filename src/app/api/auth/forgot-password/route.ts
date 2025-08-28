import { NextRequest } from 'next/server'
import { supabase } from '@/lib/supabase'
import { supabaseAdmin } from '@/lib/supabase/direct'
import { ApiResponseHandler } from '@/lib/api/response'
import { ForgotPasswordRequestSchema } from '@/schemas/auth.schema'
import { Resend } from 'resend'
import { randomBytes, createHash } from 'crypto'
import { z } from 'zod'
import { logger } from '@/lib/utils/logger'

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

    if (process.env.NODE_ENV !== 'production') {
      logger.debug('Password reset request for', { email: email.toLowerCase() })
    }
    
    // Check if user exists (for logging purposes, but don't reveal to client)
    // Case-insensitive match using service role to bypass RLS for server-side password resets
    const { data: existingUser, error: userError } = await supabaseAdmin
      .from('user_profiles')
      .select('id, email, first_name')
      .ilike('email', email)
      .single()

    if (process.env.NODE_ENV !== 'production') {
      logger.debug('User lookup result:', { existingUser: !!existingUser, userError: !!userError })
    }

    // If user doesn't exist, still return success for security (don't reveal whether email exists)
    if (userError && userError.code === 'PGRST116') {
      if (process.env.NODE_ENV !== 'production') {
        logger.debug('User not found but returning success for security')
      }
      return ApiResponseHandler.success({
        message: 'If an account with this email exists, you will receive a password reset link.'
      })
    }

    // Only send email if user exists
    if (existingUser) {
      // First try our custom Resend approach
      try {
        if (process.env.NODE_ENV !== 'production') {
          logger.debug('Attempting custom email with Resend...')
        }
        
        // Check if we have required environment variables
        if (!process.env.RESEND_API_KEY) {
          logger.error('RESEND_API_KEY not configured, falling back to Supabase')
          throw new Error('Resend not configured')
        }

        // Check if password_reset_tokens table exists
        const { error: tableCheckError } = await supabaseAdmin
          .from('password_reset_tokens')
          .select('count')
          .limit(1)

        if (tableCheckError) {
          logger.error('password_reset_tokens table not found, falling back to Supabase', tableCheckError instanceof Error ? tableCheckError : undefined, { tableCheckError })
          throw new Error('Database table not ready')
        }

        // Generate a secure reset token using crypto
        const resetToken = randomBytes(32).toString('hex')
        const hashedToken = createHash('sha256').update(resetToken).digest('hex')
        const expiresAt = new Date(Date.now() + 60 * 60 * 1000) // 1 hour from now

        // Store the reset token in database (delete previous tokens for this user to avoid constraint issues)
        await supabaseAdmin
          .from('password_reset_tokens')
          .delete()
          .eq('user_id', existingUser.id)

        const { error: tokenError } = await supabaseAdmin
          .from('password_reset_tokens')
          .insert({
            user_id: existingUser.id,
            token_hash: hashedToken,
            expires_at: expiresAt.toISOString(),
            created_at: new Date().toISOString()
          })

        if (tokenError) {
          logger.error('Error storing reset token', tokenError instanceof Error ? tokenError : undefined, { tokenError })
          throw new Error('Failed to store reset token')
        }

        const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://love4detailing.com'
        const resetUrl = `${baseUrl}/auth/reset-password?token=${resetToken}`
        
        // Create email content
        const subject = 'Reset Your Password - Love 4 Detailing'
        const firstName = existingUser.first_name || 'there'
        
        const { EmailService } = await import('@/lib/services/email')
        const emailService = new EmailService()
        const html = emailService.createUnifiedEmail({
          title: 'Reset Your Password',
          header: { title: 'Reset Your Password', subtitle: 'Secure your account access', type: 'default' },
          content: `
            <div class="content-card">
              <div class="card-content">
                <p>Hi ${firstName},</p>
                <p>We received a request to reset your password for your Love 4 Detailing account. If you made this request, click the button below to set a new password.</p>
                <div style="text-align:center; margin:24px 0;">
                  <a href="${resetUrl}" class="button-primary">Reset My Password</a>
                </div>
                <p class="muted">This link will expire in 1 hour. If you didn’t request this, you can safely ignore this email.</p>
                <p class="muted">If the button doesn’t work, copy and paste this link into your browser:<br /><span>${resetUrl}</span></p>
              </div>
            </div>
          `
        })
        
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
          logger.error('❌ Resend email API error', emailError instanceof Error ? emailError : undefined, { emailError })
          throw new Error(`Resend API error: ${emailError.message || 'Unknown error'}`)
        }

        if (process.env.NODE_ENV !== 'production') {
          logger.debug('✅ Password reset email sent successfully via Resend')
          logger.debug('Email metadata', { id: data?.id, recipient: email, sender: process.env.NEXT_PUBLIC_FROM_EMAIL || 'zell@love4detailing.com', response: data })
        }
        
      } catch (customEmailError) {
        logger.error('Custom email system failed', customEmailError instanceof Error ? customEmailError : undefined)
        if (process.env.NODE_ENV !== 'production') {
          logger.debug('Falling back to Supabase built-in password reset...')
        }
        
        // Fallback to Supabase's built-in password reset
        try {
          const { error: supabaseResetError } = await supabase.auth.resetPasswordForEmail(email.toLowerCase(), {
            redirectTo: `${process.env.NEXT_PUBLIC_APP_URL || 'https://l4d-app.vercel.app'}/auth/reset-password`
          })

          if (supabaseResetError) {
            logger.error('Supabase reset also failed', supabaseResetError instanceof Error ? supabaseResetError : undefined)
            return ApiResponseHandler.error(
              'Failed to send reset email', 
              'EMAIL_SEND_FAILED',
              500
            )
          }

          if (process.env.NODE_ENV !== 'production') {
            logger.debug('Password reset email sent via Supabase fallback', { recipient: email })
          }
          
        } catch (fallbackError) {
          logger.error('Both email systems failed', fallbackError instanceof Error ? fallbackError : undefined)
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
    logger.error('Password reset error', error instanceof Error ? error : undefined)
    
    if (error instanceof z.ZodError) {
      return ApiResponseHandler.validationError('Invalid email address')
    }

    return ApiResponseHandler.serverError('Failed to process password reset request')
  }
}