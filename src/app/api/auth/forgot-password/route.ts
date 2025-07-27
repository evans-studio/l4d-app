import { NextRequest } from 'next/server'
import { supabase } from '@/lib/supabase'
import { ApiResponseHandler } from '@/lib/api/response'
import { z } from 'zod'

// Force Node.js runtime for email service compatibility
export const runtime = 'nodejs'

const forgotPasswordSchema = z.object({
  email: z.string().email('Invalid email address')
})

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { email } = forgotPasswordSchema.parse(body)

    console.log('Password reset request for:', email.toLowerCase())
    
    // Check if user exists (for logging purposes, but don't reveal to client)
    const { data: existingUser, error: userError } = await supabase
      .from('user_profiles')
      .select('id, email, first_name')
      .eq('email', email.toLowerCase())
      .single()

    console.log('User lookup result:', { existingUser: !!existingUser, userError: !!userError })

    // Use Supabase's built-in password reset (regardless of whether user exists)
    const { error: resetError } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${process.env.NEXT_PUBLIC_APP_URL || 'https://l4d-app.vercel.app'}/auth/reset-password`
    })

    if (resetError) {
      console.error('Supabase reset error:', resetError)
      
      // If user doesn't exist, still return success for security
      if (resetError.message.includes('User not found')) {
        console.log('User not found but returning success for security')
        return ApiResponseHandler.success({
          message: 'If an account with this email exists, you will receive a password reset link.'
        })
      }
      
      return ApiResponseHandler.error(
        'Failed to send reset email', 
        'EMAIL_SEND_FAILED',
        500
      )
    }

    console.log('Password reset email sent successfully via Supabase to:', email)

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