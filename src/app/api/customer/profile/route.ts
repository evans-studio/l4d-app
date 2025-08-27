import { NextRequest } from 'next/server'
import { ApiResponseHandler } from '@/lib/api/response'
import { createClientFromRequest } from '@/lib/supabase/server'
import { z } from 'zod'
import { logger } from '@/lib/utils/logger'

const profileUpdateSchema = z.object({
  firstName: z.string().min(1, 'First name is required').max(100),
  lastName: z.string().min(1, 'Last name is required').max(100),
  email: z.string().email('Invalid email address'),
  phone: z.string().optional(),
})

export async function PUT(request: NextRequest) {
  try {
    const supabase = createClientFromRequest(request)
    
    // Get current session
    const { data: { session }, error: sessionError } = await supabase.auth.getSession()
    
    if (sessionError || !session?.user) {
      return ApiResponseHandler.unauthorized('Authentication required')
    }

    // Validate request body
    const body = await request.json()
    const validatedData = profileUpdateSchema.parse(body)

    // Check if email is already taken by another user
    if (validatedData.email !== session.user.email) {
      const { data: existingUser } = await supabase
        .from('user_profiles')
        .select('id')
        .eq('email', validatedData.email.toLowerCase())
        .neq('id', session.user.id)
        .single()

      if (existingUser) {
        return ApiResponseHandler.error(
          'Email address is already in use',
          'EMAIL_TAKEN',
          409
        )
      }
    }

    // Update user profile
    const { data: updatedProfile, error: updateError } = await supabase
      .from('user_profiles')
      .update({
        first_name: validatedData.firstName,
        last_name: validatedData.lastName,
        email: validatedData.email.toLowerCase(),
        phone: validatedData.phone || null,
        updated_at: new Date().toISOString()
      })
      .eq('id', session.user.id)
      .select()
      .single()

    if (updateError) {
      logger.error('Profile update error', updateError instanceof Error ? updateError : undefined)
      return ApiResponseHandler.serverError('Failed to update profile')
    }

    // Note: Email updates in auth should be handled through proper auth flow
    // For now, we just update the profile table

    return ApiResponseHandler.success({
      profile: {
        id: updatedProfile.id,
        firstName: updatedProfile.first_name,
        lastName: updatedProfile.last_name,
        email: updatedProfile.email,
        phone: updatedProfile.phone,
        role: updatedProfile.role,
        createdAt: updatedProfile.created_at,
        updatedAt: updatedProfile.updated_at
      },
      message: 'Profile updated successfully'
    })

  } catch (error) {
    logger.error('Profile update error', error instanceof Error ? error : undefined)
    
    if (error instanceof z.ZodError) {
      const firstError = error.issues[0]
      return ApiResponseHandler.validationError(firstError?.message || 'Validation error')
    }

    return ApiResponseHandler.serverError('Failed to update profile')
  }
}

export async function GET(request: NextRequest) {
  try {
    const supabase = createClientFromRequest(request)
    
    // Get current session
    const { data: { session }, error: sessionError } = await supabase.auth.getSession()
    
    if (sessionError || !session?.user) {
      return ApiResponseHandler.unauthorized('Authentication required')
    }

    // Get user profile
    const { data: profile, error: profileError } = await supabase
      .from('user_profiles')
      .select('*')
      .eq('id', session.user.id)
      .single()

    if (profileError || !profile) {
      return ApiResponseHandler.notFound('Profile not found')
    }

    return ApiResponseHandler.success({
      id: profile.id,
      first_name: profile.first_name,
      last_name: profile.last_name,
      email: profile.email,
      phone: profile.phone,
      role: profile.role,
      created_at: profile.created_at,
      updated_at: profile.updated_at
    })

  } catch (error) {
    logger.error('Profile fetch error', error instanceof Error ? error : undefined)
    return ApiResponseHandler.serverError('Failed to fetch profile')
  }
}