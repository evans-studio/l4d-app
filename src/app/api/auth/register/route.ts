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
    console.log('=== REGISTRATION REQUEST START ===')
    
    // Check environment variables first
    if (!process.env.NEXT_PUBLIC_SUPABASE_URL) {
      console.error('❌ Missing NEXT_PUBLIC_SUPABASE_URL')
      return ApiResponseHandler.error('Server configuration error', 'CONFIG_ERROR', 500)
    }
    
    if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
      console.error('❌ Missing SUPABASE_SERVICE_ROLE_KEY')
      return ApiResponseHandler.error('Server configuration error', 'CONFIG_ERROR', 500)
    }

    const body = await request.json()
    console.log('Raw request body:', body)
    
    const { email, password, firstName, lastName, phone } = registerSchema.parse(body)

    console.log('Parsed data:')
    console.log('- Email:', email.toLowerCase())
    console.log('- Name:', firstName, lastName)
    console.log('- Phone:', phone || 'not provided')

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
      console.log('Creating profile for user:', authUser.user.id)
      
      const profileData = {
        id: authUser.user.id,
        email: email.toLowerCase(),
        first_name: firstName,
        last_name: lastName,
        phone: phone || null,
        role: 'customer',
        is_active: true
      }
      
      console.log('Profile data to insert:', profileData)
      
      const { data: profile, error: profileError } = await supabaseAdmin
        .from('user_profiles')
        .insert(profileData)
        .select()
        .single()

      if (profileError) {
        console.error('❌ Profile creation failed:')
        console.error('Error code:', profileError.code)
        console.error('Error message:', profileError.message)
        console.error('Error details:', profileError.details)
        console.error('Error hint:', profileError.hint)
        
        // Clean up the auth user if profile creation fails
        try {
          await supabaseAdmin.auth.admin.deleteUser(authUser.user.id)
          console.log('🧹 Cleaned up auth user after profile creation failure')
        } catch (cleanupError) {
          console.error('❌ Failed to cleanup auth user:', cleanupError)
        }
        
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
      console.error('❌ Profile creation exception:')
      console.error('Exception type:', typeof profileError)
      console.error('Exception details:', profileError)
      
      // Clean up the auth user
      try {
        await supabaseAdmin.auth.admin.deleteUser(authUser.user.id)
        console.log('🧹 Cleaned up auth user after profile creation exception')
      } catch (cleanupError) {
        console.error('❌ Failed to cleanup auth user:', cleanupError)
      }
      
      const errorMessage = profileError instanceof Error ? profileError.message : 'Unknown error creating profile'
      
      return ApiResponseHandler.error(
        `Failed to create user profile: ${errorMessage}`,
        'PROFILE_CREATION_EXCEPTION',
        500
      )
    }

  } catch (error) {
    console.error('❌ Registration error:')
    console.error('Error type:', typeof error)
    console.error('Error details:', error)
    
    if (error instanceof z.ZodError) {
      console.error('❌ Validation error:', error.issues)
      const firstError = error.issues[0]
      return ApiResponseHandler.validationError(firstError?.message || 'Invalid input data')
    }

    const errorMessage = error instanceof Error ? error.message : 'Unknown registration error'
    return ApiResponseHandler.error(`Registration failed: ${errorMessage}`, 'REGISTRATION_ERROR', 500)
  }
}