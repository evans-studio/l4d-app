import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { parseUserProfile } from '@/schemas/auth.schema'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

// Create service client that bypasses RLS
const supabaseService = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
})

const ADMIN_EMAILS = ['zell@love4detailing.com', 'paul@evans-studio.co.uk']

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const userId = searchParams.get('userId')

    if (!userId) {
      return NextResponse.json({
        success: false,
        error: { message: 'User ID is required' }
      }, { status: 400 })
    }

    console.log('API: Fetching profile for user:', userId)

    // Use service role to bypass RLS
    const { data, error } = await supabaseService
      .from('user_profiles')
      .select('id, email, first_name, last_name, phone, role, is_active, created_at, updated_at')
      .eq('id', userId)
      .eq('is_active', true)
      .single()

    if (error) {
      console.error('API: Profile fetch error:', error)
      
      if (error.code === 'PGRST116') {
        return NextResponse.json({
          success: false,
          error: { message: 'Profile not found', code: 'PROFILE_NOT_FOUND' }
        }, { status: 404 })
      }

      return NextResponse.json({
        success: false,
        error: { message: error.message, code: error.code }
      }, { status: 500 })
    }

    const profile = parseUserProfile(data)
    if (!profile) {
      return NextResponse.json({
        success: false,
        error: { message: 'Invalid profile data' }
      }, { status: 500 })
    }

    console.log('API: Profile fetched successfully:', profile)

    return NextResponse.json({
      success: true,
      data: profile
    })

  } catch (error) {
    console.error('API: Profile fetch exception:', error)
    return NextResponse.json({
      success: false,
      error: { message: 'Internal server error' }
    }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { userId, email, firstName, lastName, phone } = body

    if (!userId || !email) {
      return NextResponse.json({
        success: false,
        error: { message: 'User ID and email are required' }
      }, { status: 400 })
    }

    const role = ADMIN_EMAILS.includes(email.toLowerCase()) ? 'admin' : 'customer'

    console.log('API: Creating profile:', { userId, email, firstName, lastName, phone, role })

    const profileData = {
      id: userId,
      email: email.toLowerCase(),
      first_name: firstName || '',
      last_name: lastName || '',
      phone: phone || null,
      role: role,
      is_active: true
    }

    // Use service role to bypass RLS
    const { data, error } = await supabaseService
      .from('user_profiles')
      .upsert(profileData)
      .select()
      .single()

    if (error) {
      console.error('API: Profile creation error:', error)
      return NextResponse.json({
        success: false,
        error: { message: error.message, code: error.code }
      }, { status: 500 })
    }

    const profile = parseUserProfile(data)
    if (!profile) {
      return NextResponse.json({
        success: false,
        error: { message: 'Invalid profile data after creation' }
      }, { status: 500 })
    }

    console.log('API: Profile created successfully:', profile)

    return NextResponse.json({
      success: true,
      data: profile
    })

  } catch (error) {
    console.error('API: Profile creation exception:', error)
    return NextResponse.json({
      success: false,
      error: { message: 'Internal server error' }
    }, { status: 500 })
  }
}