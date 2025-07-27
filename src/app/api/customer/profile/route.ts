import { NextRequest } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { ApiResponseHandler } from '@/lib/api/response'
import { z } from 'zod'

const profileUpdateSchema = z.object({
  firstName: z.string().min(1, 'First name is required').max(100),
  lastName: z.string().min(1, 'Last name is required').max(100),
  email: z.string().email('Invalid email address'),
  phone: z.string().optional(),
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
    const validatedData = profileUpdateSchema.parse(body)

    // Check if email is already taken by another user
    if (validatedData.email !== user.email) {
      const { data: existingUser } = await supabase
        .from('user_profiles')
        .select('id')
        .eq('email', validatedData.email.toLowerCase())
        .neq('id', user.id)
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
      .eq('id', user.id)
      .select()
      .single()

    if (updateError) {
      console.error('Profile update error:', updateError)
      return ApiResponseHandler.serverError('Failed to update profile')
    }

    // If email changed, update auth user email too
    if (validatedData.email !== user.email) {
      const { error: emailUpdateError } = await supabase.auth.updateUser({
        email: validatedData.email
      })

      if (emailUpdateError) {
        console.error('Auth email update error:', emailUpdateError)
        // Don't fail the request, just log the error
      }
    }

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
    console.error('Profile update error:', error)
    
    if (error instanceof z.ZodError) {
      const firstError = error.issues[0]
      return ApiResponseHandler.validationError(firstError?.message || 'Validation error')
    }

    return ApiResponseHandler.serverError('Failed to update profile')
  }
}

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()
    
    // Get current user
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    
    if (authError || !user) {
      return ApiResponseHandler.unauthorized('Authentication required')
    }

    // Get user profile
    const { data: profile, error: profileError } = await supabase
      .from('user_profiles')
      .select('*')
      .eq('id', user.id)
      .single()

    if (profileError || !profile) {
      return ApiResponseHandler.notFound('Profile not found')
    }

    return ApiResponseHandler.success({
      profile: {
        id: profile.id,
        firstName: profile.first_name,
        lastName: profile.last_name,
        email: profile.email,
        phone: profile.phone,
        role: profile.role,
        createdAt: profile.created_at,
        updatedAt: profile.updated_at
      }
    })

  } catch (error) {
    console.error('Profile fetch error:', error)
    return ApiResponseHandler.serverError('Failed to fetch profile')
  }
}