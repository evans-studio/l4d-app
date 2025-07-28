import { NextRequest } from 'next/server'
import { ApiResponseHandler } from '@/lib/api/response'
import { createClient } from '@supabase/supabase-js'
import { z } from 'zod'

// Force Node.js runtime
export const runtime = 'nodejs'

// Use service role for server-side operations
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  }
)

const profileUpdateSchema = z.object({
  firstName: z.string().min(1, 'First name is required').max(100),
  lastName: z.string().min(1, 'Last name is required').max(100),
  email: z.string().email('Invalid email address'),
  phone: z.string().optional(),
})

export async function PUT(request: NextRequest) {
  try {
    // Get auth token from request headers or cookies
    const authHeader = request.headers.get('authorization')
    const authToken = authHeader?.replace('Bearer ', '') || 
                     request.cookies.get('sb-vwejbgfiddltdqwhfjmt-auth-token')?.value

    if (!authToken) {
      return ApiResponseHandler.error('Authentication required', 'AUTH_REQUIRED', 401)
    }

    // Verify the token and get user
    const { data: { user }, error: userError } = await supabaseAdmin.auth.getUser(authToken)
    
    if (userError || !user) {
      return ApiResponseHandler.error('Invalid authentication', 'AUTH_INVALID', 401)
    }

    // Validate request body
    const body = await request.json()
    const validatedData = profileUpdateSchema.parse(body)

    // Check if email is already taken by another user
    if (validatedData.email !== user.email) {
      const { data: existingUser } = await supabaseAdmin
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
    const { data: updatedProfile, error: updateError } = await supabaseAdmin
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
      const { error: emailUpdateError } = await supabaseAdmin.auth.admin.updateUserById(user.id, {
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
    // Get auth token from request headers or cookies
    const authHeader = request.headers.get('authorization')
    const authToken = authHeader?.replace('Bearer ', '') || 
                     request.cookies.get('sb-vwejbgfiddltdqwhfjmt-auth-token')?.value

    if (!authToken) {
      return ApiResponseHandler.error('Authentication required', 'AUTH_REQUIRED', 401)
    }

    // Verify the token and get user
    const { data: { user }, error: userError } = await supabaseAdmin.auth.getUser(authToken)
    
    if (userError || !user) {
      return ApiResponseHandler.error('Invalid authentication', 'AUTH_INVALID', 401)
    }

    const userId = user.id

    // Get user profile
    const { data: profile, error: profileError } = await supabaseAdmin
      .from('user_profiles')
      .select('*')
      .eq('id', userId)
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
    console.error('Profile fetch error:', error)
    return ApiResponseHandler.serverError('Failed to fetch profile')
  }
}