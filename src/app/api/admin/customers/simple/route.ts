import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { logger } from '@/lib/utils/logger'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

// Create service client that bypasses RLS
const supabaseService = createClient(supabaseUrl, supabaseServiceKey)

export async function GET(request: NextRequest) {
  try {
    logger.debug('Simple customers API: Fetching customer profiles...')

    // Get all customer profiles - simple and direct
    const { data: customerProfiles, error: profilesError } = await supabaseService
      .from('user_profiles')
      .select(`
        id,
        first_name,
        last_name,
        email,
        phone,
        created_at,
        updated_at,
        role,
        is_active
      `)
      .eq('role', 'customer')
      .eq('is_active', true)
      .order('created_at', { ascending: false })

    logger.debug('Simple customers API result:', { 
      count: customerProfiles?.length || 0, 
      error: profilesError 
    })

    if (profilesError) {
      logger.error('Error fetching customer profiles:', profilesError)
      return NextResponse.json({
        success: false,
        error: { message: 'Failed to fetch customers', code: profilesError.code }
      }, { status: 500 })
    }

    // Return the simple customer list
    return NextResponse.json({
      success: true,
      data: customerProfiles || []
    })

  } catch (error) {
    logger.error('Simple customers API exception:', error instanceof Error ? error : undefined)
    return NextResponse.json({
      success: false,
      error: { message: 'Internal server error' }
    }, { status: 500 })
  }
}