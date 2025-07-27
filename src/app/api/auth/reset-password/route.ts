import { NextRequest } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { ApiResponseHandler } from '@/lib/api/response'
import { z } from 'zod'
import crypto from 'crypto'

const resetPasswordSchema = z.object({
  token: z.string().min(1, 'Token is required'),
  password: z.string().min(8, 'Password must be at least 8 characters long')
})

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { token, password } = resetPasswordSchema.parse(body)

    const supabase = await createClient()

    // Hash the provided token to compare with stored hash
    const tokenHash = crypto.createHash('sha256').update(token).digest('hex')

    // Find the reset token
    const { data: resetToken, error: tokenError } = await supabase
      .from('password_reset_tokens')
      .select('*')
      .eq('token_hash', tokenHash)
      .single()

    if (tokenError || !resetToken) {
      return ApiResponseHandler.error('Invalid reset token', 'INVALID_TOKEN', 400)
    }

    // Check if token has expired
    const now = new Date()
    const expiresAt = new Date(resetToken.expires_at)

    if (now > expiresAt) {
      // Clean up expired token
      await supabase
        .from('password_reset_tokens')
        .delete()
        .eq('token_hash', tokenHash)

      return ApiResponseHandler.error('Reset token has expired', 'TOKEN_EXPIRED', 400)
    }

    // Get user details
    const { data: user, error: userError } = await supabase
      .from('user_profiles')
      .select('id, email')
      .eq('id', resetToken.user_id)
      .single()

    if (userError || !user) {
      return ApiResponseHandler.notFound('User not found')
    }

    // Update user password using Supabase Auth Admin API
    const { error: updateError } = await supabase.auth.admin.updateUserById(
      user.id,
      { password }
    )

    if (updateError) {
      console.error('Error updating password:', updateError)
      return ApiResponseHandler.serverError('Failed to update password')
    }

    // Delete the used reset token
    const { error: deleteError } = await supabase
      .from('password_reset_tokens')
      .delete()
      .eq('token_hash', tokenHash)

    if (deleteError) {
      console.error('Error deleting reset token:', deleteError)
      // Don't fail the request if token deletion fails
    }

    // Update user profile with last password change
    await supabase
      .from('user_profiles')
      .update({
        updated_at: new Date().toISOString()
      })
      .eq('id', user.id)

    return ApiResponseHandler.success({
      message: 'Password has been successfully reset'
    })

  } catch (error) {
    console.error('Reset password error:', error)
    
    if (error instanceof z.ZodError) {
      const firstError = error.issues[0]
      return ApiResponseHandler.validationError(firstError?.message || 'Validation error')
    }

    return ApiResponseHandler.serverError('Failed to reset password')
  }
}