import { NextRequest } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { ApiResponseHandler } from '@/lib/api/response'
import { ApiValidation } from '@/lib/api/validation'
import { z } from 'zod'

// Force Node.js runtime for Supabase compatibility
export const runtime = 'nodejs'

const loginSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(1, 'Password is required'),
})

export async function POST(request: NextRequest) {
  try {
    // Validate request body
    const requestBody = await request.json()
    const validation = await ApiValidation.validateBody(
      requestBody,
      loginSchema
    )

    if (!validation.success) {
      return validation.error
    }

    const body = validation.data

    const supabase = await createClient()

    console.log('Login attempt for:', body.email)

    // Authenticate user
    const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
      email: body.email,
      password: body.password,
    })

    if (authError) {
      console.error('Login auth error:', authError)
      return ApiResponseHandler.unauthorized('Invalid email or password')
    }

    if (!authData.user || !authData.session) {
      return ApiResponseHandler.serverError('Authentication failed')
    }

    // Get user profile
    const { data: profile, error: profileError } = await supabase
      .from('user_profiles')
      .select('*')
      .eq('id', authData.user.id)
      .single()

    if (profileError || !profile) {
      return ApiResponseHandler.serverError('User profile not found')
    }

    // Check if user is active
    if (!profile.is_active) {
      return ApiResponseHandler.forbidden('Account is deactivated')
    }

    return ApiResponseHandler.success({
      user: {
        id: authData.user.id,
        email: authData.user.email,
        firstName: profile.first_name,
        lastName: profile.last_name,
        role: profile.role,
      },
      session: {
        accessToken: authData.session.access_token,
        refreshToken: authData.session.refresh_token,
        expiresAt: authData.session.expires_at,
      },
    })

  } catch (error) {
    console.error('Login error:', error)
    return ApiResponseHandler.serverError('Login failed')
  }
}