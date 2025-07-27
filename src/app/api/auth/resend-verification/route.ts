import { NextRequest } from 'next/server'
import { supabase } from '@/lib/supabase'
import { ApiResponseHandler } from '@/lib/api/response'
import { z } from 'zod'

// Force Node.js runtime for email service compatibility
export const runtime = 'nodejs'

const resendVerificationSchema = z.object({
  email: z.string().email('Invalid email address')
})

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { email } = resendVerificationSchema.parse(body)

    console.log('Resend verification request for:', email.toLowerCase())
    
    // Check if user exists in our database
    const { data: existingUser, error: userError } = await supabase
      .from('user_profiles')
      .select('id, email, first_name')
      .eq('email', email.toLowerCase())
      .single()

    if (userError || !existingUser) {
      console.log('User not found in database')
      // Return success anyway for security (don't reveal if email exists)
      return ApiResponseHandler.success({
        message: 'If an account with this email exists, we\'ve sent a verification email.'
      })
    }

    // Resend verification email using Supabase
    const { error: resendError } = await supabase.auth.resend({
      type: 'signup',
      email: email.toLowerCase(),
      options: {
        emailRedirectTo: `${process.env.NEXT_PUBLIC_APP_URL || 'https://l4d-app.vercel.app'}/auth/verify-email`
      }
    })

    if (resendError) {
      console.error('Supabase resend error:', resendError)
      
      // Handle specific error cases
      if (resendError.message.includes('Email not confirmed') || 
          resendError.message.includes('already registered')) {
        return ApiResponseHandler.success({
          message: 'If an account with this email exists, we\'ve sent a verification email.'
        })
      }

      if (resendError.message.includes('rate limit')) {
        return ApiResponseHandler.error(
          'Please wait a moment before requesting another verification email.',
          'RATE_LIMIT_EXCEEDED',
          429
        )
      }
      
      return ApiResponseHandler.error(
        'Failed to send verification email', 
        'EMAIL_SEND_FAILED',
        500
      )
    }

    console.log('Verification email resent successfully to:', email)

    return ApiResponseHandler.success({
      message: 'If an account with this email exists, we\'ve sent a verification email.'
    })

  } catch (error) {
    console.error('Resend verification error:', error)
    
    if (error instanceof z.ZodError) {
      return ApiResponseHandler.validationError('Invalid email address')
    }

    return ApiResponseHandler.serverError('Failed to process verification request')
  }
}