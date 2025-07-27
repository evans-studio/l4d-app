import { NextRequest } from 'next/server'
import { createAdminClient } from '@/lib/supabase/server'
import { ApiResponseHandler } from '@/lib/api/response'
import { ApiValidation } from '@/lib/api/validation'
import { z } from 'zod'

const registerSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
  firstName: z.string().min(1, 'First name is required').max(100),
  lastName: z.string().min(1, 'Last name is required').max(100),
  phone: z.string().optional(),
})

export async function POST(request: NextRequest) {
  try {
    // Validate request body
    const requestBody = await request.json()
    const validation = await ApiValidation.validateBody(
      requestBody,
      registerSchema
    )

    if (!validation.success) {
      return validation.error
    }

    const body = validation.data


    const supabase = createAdminClient()

    // Debug environment variables
    console.log('Environment check:', {
      hasServiceRole: !!process.env.SUPABASE_SERVICE_ROLE_KEY,
      serviceRoleLength: process.env.SUPABASE_SERVICE_ROLE_KEY?.length || 0,
      hasAnonKey: !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
      hasUrl: !!process.env.NEXT_PUBLIC_SUPABASE_URL
    })

    // Create auth user using admin API (bypasses email confirmation)
    const { data: authData, error: authError } = await supabase.auth.admin.createUser({
      email: body.email,
      password: body.password,
      email_confirm: true, // Skip email confirmation
      user_metadata: {
        first_name: body.firstName,
        last_name: body.lastName,
        phone: body.phone,
      },
    })

    if (authError) {
      if (authError.message.includes('already registered')) {
        return ApiResponseHandler.error(
          'An account with this email already exists',
          'EMAIL_ALREADY_EXISTS',
          409
        )
      }
      
      return ApiResponseHandler.error(
        'Registration failed',
        'REGISTRATION_FAILED',
        400,
        authError.message
      )
    }

    if (!authData.user) {
      return ApiResponseHandler.serverError('User creation failed')
    }

    // Create user profile
    const { error: profileError } = await supabase
      .from('user_profiles')
      .insert({
        id: authData.user.id,
        email: body.email,
        first_name: body.firstName,
        last_name: body.lastName,
        phone: body.phone,
        role: 'customer',
      })
      .select()
      .single()

    if (profileError) {
      console.error('Profile creation error:', profileError)
      // Note: User was created in auth, but profile failed
      // In production, you might want to handle this with a cleanup process
    }

    return ApiResponseHandler.success({
      user: {
        id: authData.user.id,
        email: authData.user.email,
      },
      requiresEmailConfirmation: false, // Admin created users don't need confirmation
      message: 'Registration successful. You can now log in to your account.',
    })

  } catch (error) {
    console.error('Registration error:', error)
    return ApiResponseHandler.serverError('Registration failed')
  }
}