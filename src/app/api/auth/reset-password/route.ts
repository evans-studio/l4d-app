import { NextRequest } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase/direct'
import { ApiResponseHandler } from '@/lib/api/response'
import { ResetPasswordRequestSchema } from '@/schemas/auth.schema'
import { createHash } from 'crypto'
import { z } from 'zod'

// Force Node.js runtime
export const runtime = 'nodejs'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const validation = ResetPasswordRequestSchema.safeParse(body)
    
    if (!validation.success) {
      return ApiResponseHandler.error('Validation failed', 'INVALID_INPUT', 400, {
        validationErrors: validation.error.flatten().fieldErrors
      })
    }
    
    const { token, password } = validation.data

    console.log('Password reset attempt with token')

    // Hash the provided token to compare with stored hash
    const hashedToken = createHash('sha256').update(token).digest('hex')

    // Find the reset token in database
    const { data: resetTokenData, error: tokenError } = await supabaseAdmin
      .from('password_reset_tokens')
      .select('*')
      .eq('token_hash', hashedToken)
      .single()

    if (tokenError || !resetTokenData) {
      console.error('Token not found:', tokenError)
      return ApiResponseHandler.error(
        'Invalid or expired reset token',
        'INVALID_TOKEN',
        400
      )
    }

    // Check if token has expired
    const now = new Date()
    const expiresAt = new Date(resetTokenData.expires_at)
    
    if (now > expiresAt) {
      console.log('Token expired at:', expiresAt)
      
      // Clean up expired token
      await supabaseAdmin
        .from('password_reset_tokens')
        .delete()
        .eq('id', resetTokenData.id)
      
      return ApiResponseHandler.error(
        'Reset token has expired',
        'TOKEN_EXPIRED',
        400
      )
    }

    console.log('Token verified for user:', resetTokenData.user_id)

    // Get user details
    const { data: user, error: userError } = await supabaseAdmin
      .from('user_profiles')
      .select('id, email')
      .eq('id', resetTokenData.user_id)
      .single()

    if (userError || !user) {
      console.error('User not found:', userError)
      return ApiResponseHandler.error(
        'User not found',
        'USER_NOT_FOUND',
        404
      )
    }

    // Update the user's password using Supabase
    try {
      const { error: updateError } = await supabaseAdmin.auth.admin.updateUserById(
        resetTokenData.user_id,
        { password: password }
      )

      if (updateError) {
        console.error('Password update error:', updateError)
        return ApiResponseHandler.error(
          'Failed to update password',
          'PASSWORD_UPDATE_FAILED',
          500
        )
      }

      console.log('Password updated successfully for user:', resetTokenData.user_id)

      // Delete the used reset token
      await supabaseAdmin
        .from('password_reset_tokens')
        .delete()
        .eq('id', resetTokenData.id)

      // Update the user profile timestamp
      await supabaseAdmin
        .from('user_profiles')
        .update({ updated_at: new Date().toISOString() })
        .eq('id', resetTokenData.user_id)

      return ApiResponseHandler.success({
        message: 'Password updated successfully'
      })

    } catch (updateError) {
      console.error('Password update failed:', updateError)
      return ApiResponseHandler.error(
        'Failed to update password',
        'PASSWORD_UPDATE_FAILED',
        500
      )
    }

  } catch (error) {
    console.error('Password reset error:', error)
    
    if (error instanceof z.ZodError) {
      const firstError = error.issues[0]
      return ApiResponseHandler.validationError(firstError?.message || 'Validation error')
    }

    return ApiResponseHandler.serverError('Failed to reset password')
  }
}