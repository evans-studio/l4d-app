import { NextRequest } from 'next/server'
import { createClientFromRequest } from '@/lib/supabase/server'
import { ApiResponseHandler } from '@/lib/api/response'
import { z } from 'zod'
import { logger } from '@/lib/utils/logger'

const passwordUpdateSchema = z.object({
  currentPassword: z.string().min(1, 'Current password is required'),
  newPassword: z.string().min(8, 'New password must be at least 8 characters long'),
})

export async function PUT(request: NextRequest) {
  try {
    const supabase = createClientFromRequest(request)
    
    // Get current session
    const { data: { session }, error: sessionError } = await supabase.auth.getSession()
    
    if (sessionError || !session?.user) {
      return ApiResponseHandler.unauthorized('Authentication required')
    }

    // Get user profile to check admin role
    const { data: profile } = await supabase
      .from('user_profiles')
      .select('role')
      .eq('id', session.user.id)
      .single()

    if (!profile || (profile.role !== 'admin' && profile.role !== 'super_admin')) {
      return ApiResponseHandler.unauthorized('Admin access required')
    }

    // Validate request body
    const body = await request.json()
    const validatedData = passwordUpdateSchema.parse(body)

    // Create a temporary client to verify current password
    const { createClient } = require('@supabase/supabase-js')
    const verifyClient = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    )

    // Verify current password by attempting to sign in
    const { error: verifyError } = await verifyClient.auth.signInWithPassword({
      email: session.user.email!,
      password: validatedData.currentPassword
    })

    if (verifyError) {
      return ApiResponseHandler.error(
        'Current password is incorrect',
        'INVALID_PASSWORD',
        400
      )
    }

    // Update password using the authenticated client
    const { error: updateError } = await supabase.auth.updateUser({
      password: validatedData.newPassword
    })

    if (updateError) {
      logger.error('Admin password update error:', updateError)
      return ApiResponseHandler.serverError('Failed to update password')
    }

    // Update profile updated_at timestamp
    await supabase
      .from('user_profiles')
      .update({ updated_at: new Date().toISOString() })
      .eq('id', session.user.id)

    return ApiResponseHandler.success({
      message: 'Password updated successfully'
    })

  } catch (error) {
    logger.error('Admin password update error:', error instanceof Error ? error : undefined)
    
    if (error instanceof z.ZodError) {
      const firstError = error.issues[0]
      return ApiResponseHandler.validationError(firstError?.message || 'Validation error')
    }

    return ApiResponseHandler.serverError('Failed to update password')
  }
}