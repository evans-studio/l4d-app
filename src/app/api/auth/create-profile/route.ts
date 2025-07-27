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

const createProfileSchema = z.object({
  userId: z.string().uuid(),
  email: z.string().email(),
  firstName: z.string().optional(),
  lastName: z.string().optional(),
  phone: z.string().optional(),
  role: z.enum(['customer', 'admin', 'super_admin']).default('customer')
})

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { userId, email, firstName, lastName, phone, role } = createProfileSchema.parse(body)

    console.log('Creating profile for user:', { userId, email, role })

    // Check if profile already exists
    const { data: existingProfile } = await supabaseAdmin
      .from('user_profiles')
      .select('id')
      .eq('id', userId)
      .single()

    if (existingProfile) {
      return ApiResponseHandler.success({
        message: 'Profile already exists',
        profile: existingProfile
      })
    }

    // Create the profile
    const { data: newProfile, error: profileError } = await supabaseAdmin
      .from('user_profiles')
      .insert({
        id: userId,
        email: email.toLowerCase(),
        first_name: firstName || '',
        last_name: lastName || '',
        phone: phone || null,
        role: role,
        is_active: true
      })
      .select()
      .single()

    if (profileError) {
      console.error('Error creating profile:', profileError)
      return ApiResponseHandler.error(
        `Failed to create profile: ${profileError.message}`,
        'PROFILE_CREATE_FAILED',
        500
      )
    }

    console.log('✅ Profile created successfully:', newProfile)

    return ApiResponseHandler.success({
      message: 'Profile created successfully',
      profile: newProfile
    })

  } catch (error) {
    console.error('Create profile error:', error)
    
    if (error instanceof z.ZodError) {
      return ApiResponseHandler.validationError('Invalid profile data')
    }

    return ApiResponseHandler.serverError('Failed to create profile')
  }
}

// Also add a GET endpoint to fix existing users
export async function GET(request: NextRequest) {
  try {
    console.log('=== FIXING MISSING USER PROFILES ===')

    // Get all auth users
    const { data: authUsers, error: authError } = await supabaseAdmin.auth.admin.listUsers()
    
    if (authError) {
      console.error('Error fetching auth users:', authError)
      return ApiResponseHandler.error('Failed to fetch users', 'FETCH_ERROR', 500)
    }

    // Get existing profiles
    const { data: profiles, error: profilesError } = await supabaseAdmin
      .from('user_profiles')
      .select('id')

    if (profilesError) {
      console.error('Error fetching profiles:', profilesError)
      return ApiResponseHandler.error('Failed to fetch profiles', 'FETCH_ERROR', 500)
    }

    const existingProfileIds = new Set(profiles.map(p => p.id))
    const missingProfiles = authUsers.users.filter(user => !existingProfileIds.has(user.id))

    console.log(`Found ${missingProfiles.length} users without profiles`)

    const createdProfiles = []
    const errors = []

    // Create missing profiles
    for (const user of missingProfiles) {
      try {
        const { data: newProfile, error: createError } = await supabaseAdmin
          .from('user_profiles')
          .insert({
            id: user.id,
            email: user.email!,
            first_name: user.user_metadata?.first_name || '',
            last_name: user.user_metadata?.last_name || '',
            phone: user.user_metadata?.phone || null,
            role: user.user_metadata?.role || 'customer',
            is_active: true
          })
          .select()
          .single()

        if (createError) {
          console.error(`Failed to create profile for ${user.email}:`, createError)
          errors.push(`${user.email}: ${createError.message}`)
        } else {
          console.log(`✅ Created profile for ${user.email}`)
          createdProfiles.push(newProfile)
        }
      } catch (userError: unknown) {
        console.error(`Error creating profile for ${user.email}:`, userError)
        const errorMessage = userError instanceof Error ? userError.message : String(userError)
        errors.push(`${user.email}: ${errorMessage}`)
      }
    }

    return ApiResponseHandler.success({
      message: `Created ${createdProfiles.length} missing profiles`,
      created: createdProfiles.length,
      errors: errors,
      profiles: createdProfiles
    })

  } catch (error) {
    console.error('Fix profiles error:', error)
    return ApiResponseHandler.serverError('Failed to fix profiles')
  }
}