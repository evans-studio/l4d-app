import { NextRequest } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { ApiResponseHandler } from '@/lib/api/response'
import { z } from 'zod'

const passwordUpdateSchema = z.object({
  currentPassword: z.string().min(1, 'Current password is required'),
  newPassword: z.string().min(8, 'New password must be at least 8 characters long'),
})

export async function PUT(request: NextRequest) {
  try {
    const supabase = await createClient()
    
    // Get current user
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    
    if (authError || !user) {
      return ApiResponseHandler.unauthorized('Authentication required')
    }

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
      console.error('Password update error:', updateError)
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
    console.error('Password update error:', error)
    
    if (error instanceof z.ZodError) {
      const firstError = error.issues[0]
      return ApiResponseHandler.validationError(firstError?.message || 'Validation error')
    }

    return ApiResponseHandler.serverError('Failed to update password')
  }
}