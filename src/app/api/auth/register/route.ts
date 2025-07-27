import { NextRequest } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { ApiResponseHandler } from '@/lib/api/response'
import { z } from 'zod'

// Force Node.js runtime
export const runtime = 'nodejs'

// Use service role for admin operations
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

const registerSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
  firstName: z.string().min(1, 'First name is required'),
  lastName: z.string().min(1, 'Last name is required'),
  phone: z.string().optional()
})

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { email, password, firstName, lastName, phone } = registerSchema.parse(body)

    console.log('=== REGISTRATION REQUEST ===')
    console.log('Email:', email.toLowerCase())
    console.log('Name:', firstName, lastName)
    console.log('Phone:', phone || 'not provided')

    // Step 1: Create user in auth.users
    const { data: authUser, error: authError } = await supabaseAdmin.auth.admin.createUser({
      email: email.toLowerCase(),
      password: password,
      email_confirm: false, // Since email confirmation is disabled
      user_metadata: {
        first_name: firstName,
        last_name: lastName,
        phone: phone || null,
        role: 'customer'
      }
    })

    if (authError) {
      console.error('❌ Auth user creation failed:', authError)
      
      if (authError.message.includes('already registered')) {
        return ApiResponseHandler.error(
          'An account with this email already exists',
          'EMAIL_ALREADY_EXISTS',
          400
        )
      }
      
      return ApiResponseHandler.error(
        `Registration failed: ${authError.message}`,
        'AUTH_ERROR',
        500
      )
    }

    if (!authUser.user) {
      console.error('❌ No user returned from auth creation')
      return ApiResponseHandler.error(
        'Failed to create user account',
        'USER_CREATION_FAILED',
        500
      )
    }

    console.log('✅ Auth user created:', authUser.user.id)

    // Step 2: Create corresponding profile in user_profiles
    try {
      const { data: profile, error: profileError } = await supabaseAdmin
        .from('user_profiles')
        .insert({
          id: authUser.user.id,
          email: email.toLowerCase(),
          first_name: firstName,
          last_name: lastName,
          phone: phone || null,
          role: 'customer',
          is_active: true
        })
        .select()
        .single()

      if (profileError) {
        console.error('❌ Profile creation failed:', profileError)
        
        // Clean up the auth user if profile creation fails
        await supabaseAdmin.auth.admin.deleteUser(authUser.user.id)
        console.log('🧹 Cleaned up auth user after profile creation failure')
        
        return ApiResponseHandler.error(
          `Profile creation failed: ${profileError.message}`,
          'PROFILE_CREATION_FAILED',
          500
        )
      }

      console.log('✅ User profile created:', profile)

      // Step 3: Return success response
      return ApiResponseHandler.success({
        message: 'Account created successfully',
        user: {
          id: authUser.user.id,
          email: authUser.user.email,
          profile: {
            firstName: profile.first_name,
            lastName: profile.last_name,
            phone: profile.phone,
            role: profile.role
          }
        },
        redirectTo: '/auth/login'
      })

    } catch (profileError: unknown) {
      console.error('❌ Profile creation exception:', profileError)
      
      // Clean up the auth user
      await supabaseAdmin.auth.admin.deleteUser(authUser.user.id)
      console.log('🧹 Cleaned up auth user after profile creation exception')
      
      return ApiResponseHandler.error(
        'Failed to create user profile',
        'PROFILE_CREATION_EXCEPTION',
        500
      )
    }

  } catch (error) {
    console.error('❌ Registration error:', error)
    
    if (error instanceof z.ZodError) {
      const firstError = error.issues[0]
      return ApiResponseHandler.validationError(firstError?.message || 'Invalid input data')
    }

    return ApiResponseHandler.serverError('Registration failed')
  }
}