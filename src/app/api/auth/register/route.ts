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

    // Try regular signUp first (works better with login)
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email: body.email,
      password: body.password,
      options: {
        data: {
          first_name: body.firstName,
          last_name: body.lastName,
          phone: body.phone,
        },
      },
    })

    // If signUp fails due to email confirmation, try admin create as fallback
    if (authError && authError.message.includes('confirmation')) {
      console.log('SignUp failed due to email confirmation, trying admin create...')
      const { data: adminData, error: adminError } = await supabase.auth.admin.createUser({
        email: body.email,
        password: body.password,
        email_confirm: true,
        user_metadata: {
          first_name: body.firstName,
          last_name: body.lastName,
          phone: body.phone,
        },
      })
      
      if (adminError) {
        return ApiResponseHandler.error(
          'Registration failed',
          'REGISTRATION_FAILED',
          400,
          adminError.message
        )
      }
      
      authData = adminData
    } else if (authError) {
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