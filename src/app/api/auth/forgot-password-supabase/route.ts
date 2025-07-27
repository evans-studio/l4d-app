import { NextRequest } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { ApiResponseHandler } from '@/lib/api/response'
import { z } from 'zod'

const forgotPasswordSchema = z.object({
  email: z.string().email('Invalid email address')
})

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { email } = forgotPasswordSchema.parse(body)

    const supabase = await createClient()

    console.log('Supabase password reset request for:', email)

    // Use Supabase's built-in password reset
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${process.env.NEXT_PUBLIC_APP_URL || 'https://l4d-app.vercel.app'}/auth/reset-password`
    })

    if (error) {
      console.error('Supabase password reset error:', error)
      return ApiResponseHandler.error(
        'Failed to send reset email', 
        'PASSWORD_RESET_FAILED',
        400,
        error.message
      )
    }

    console.log('Password reset email sent successfully via Supabase')

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