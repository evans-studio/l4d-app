import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { ApiResponseHandler } from '@/lib/api/response'
import { z } from 'zod'
import { logger } from '@/lib/utils/logger'

const createProfileSchema = z.object({
  user_id: z.string().uuid('Invalid user ID'),
  email: z.string().email('Invalid email address'),
  first_name: z.string().min(1, 'First name is required').max(100),
  last_name: z.string().min(1, 'Last name is required').max(100),
  phone: z.string().max(20).optional(),
  role: z.enum(['customer', 'admin', 'super_admin']).default('customer'),
})

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    
    // Validate request data
    const validation = createProfileSchema.safeParse(body)
    if (!validation.success) {
      return ApiResponseHandler.error(
        'Validation failed',
        'VALIDATION_ERROR',
        400
      )
    }

    const { user_id, email, first_name, last_name, phone, role } = validation.data

    const supabase = await createClient()

    // Check if profile already exists
    const { data: existingProfile, error: checkError } = await supabase
      .from('user_profiles')
      .select('id')
      .eq('id', user_id)
      .single()

    if (existingProfile) {
      return ApiResponseHandler.error(
        'Profile already exists for this user',
        'PROFILE_EXISTS',
        409
      )
    }

    if (checkError && checkError.code !== 'PGRST116') {
      logger.error('Error checking existing profile:', checkError)
      return ApiResponseHandler.serverError('Failed to check existing profile')
    }

    // Create the profile
    const { data: profile, error: createError } = await supabase
      .from('user_profiles')
      .insert({
        id: user_id,
        email,
        first_name,
        last_name,
        phone,
        role,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .select()
      .single()

    if (createError) {
      logger.error('Error creating profile:', createError)
      return ApiResponseHandler.error(
        'Failed to create user profile',
        'CREATE_PROFILE_FAILED',
        500
      )
    }

    logger.debug(`Profile created successfully for user ${email}`)
    
    return NextResponse.json({
      success: true,
      data: profile,
      metadata: {
        timestamp: new Date().toISOString()
      }
    }, { status: 201 })

  } catch (error) {
    logger.error('Create profile error', error instanceof Error ? error : undefined)
    return ApiResponseHandler.serverError('Failed to create profile')
  }
}