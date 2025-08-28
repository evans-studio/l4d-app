import { NextRequest } from 'next/server'
import { supabase } from '@/lib/supabase'
import { ApiResponseHandler } from '@/lib/api/response'
import { z } from 'zod'
import { logger } from '@/lib/utils/logger'

// Force Node.js runtime
export const runtime = 'nodejs'

const passwordUpdateSchema = z.object({
  currentPassword: z.string().min(1, 'Current password is required'),
  newPassword: z.string().min(8, 'New password must be at least 8 characters long'),
})

export async function PUT(request: NextRequest) {
  try {
    // Get current user session
    const { data: { session }, error: authError } = await supabase.auth.getSession()
    
    if (authError || !session?.user) {
      return ApiResponseHandler.unauthorized('Authentication required')
    }

    const user = session.user

    // Validate request body
    const body = await request.json()
    const validatedData = passwordUpdateSchema.parse(body)

    // Verify current password by attempting to sign in
    const { error: verifyError } = await supabase.auth.signInWithPassword({
      email: user.email!,
      password: validatedData.currentPassword
    })

    if (verifyError) {
      return ApiResponseHandler.error(
        'Current password is incorrect',
        'INVALID_PASSWORD',
        400
      )
    }

    // Update password
    const { error: updateError } = await supabase.auth.updateUser({
      password: validatedData.newPassword
    })

    if (updateError) {
      logger.error('Password update error', updateError instanceof Error ? updateError : undefined)
      return ApiResponseHandler.serverError('Failed to update password')
    }

    // Update profile updated_at timestamp
    await supabase
      .from('user_profiles')
      .update({ updated_at: new Date().toISOString() })
      .eq('id', user.id)

    return ApiResponseHandler.success({
      message: 'Password updated successfully'
    })

  } catch (error) {
    logger.error('Password update error', error instanceof Error ? error : undefined)
    
    if (error instanceof z.ZodError) {
      const firstError = error.issues[0]
      return ApiResponseHandler.validationError(firstError?.message || 'Validation error')
    }

    return ApiResponseHandler.serverError('Failed to update password')
  }
}