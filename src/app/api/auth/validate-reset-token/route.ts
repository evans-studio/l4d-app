import { NextRequest } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { ApiResponseHandler } from '@/lib/api/response'
import { z } from 'zod'
import crypto from 'crypto'

const validateTokenSchema = z.object({
  token: z.string().min(1, 'Token is required')
})

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { token } = validateTokenSchema.parse(body)

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

    // Token is valid
    return ApiResponseHandler.success({
      message: 'Token is valid',
      user_id: resetToken.user_id
    })

  } catch (error) {
    console.error('Validate reset token error:', error)
    
    if (error instanceof z.ZodError) {
      return ApiResponseHandler.validationError('Invalid token format')
    }

    return ApiResponseHandler.serverError('Failed to validate reset token')
  }
}