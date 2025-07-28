import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function POST(request: NextRequest) {
  try {
    const { email, password } = await request.json()

    if (!email || !password) {
      return NextResponse.json({
        success: false,
        error: 'Email and password required'
      }, { status: 400 })
    }

    const supabase = await createClient()
    
    // Test signup
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          first_name: 'Test',
          last_name: 'User',
          role: 'customer'
        }
      }
    })

    const debug = {
      authError: authError?.message || null,
      user: authData.user ? {
        id: authData.user.id,
        email: authData.user.email,
        email_confirmed_at: authData.user.email_confirmed_at,
        confirmation_sent_at: authData.user.confirmation_sent_at,
        created_at: authData.user.created_at,
        app_metadata: authData.user.app_metadata,
        user_metadata: authData.user.user_metadata
      } : null,
      session: authData.session ? {
        access_token: !!authData.session.access_token,
        refresh_token: !!authData.session.refresh_token,
        expires_at: authData.session.expires_at,
        token_type: authData.session.token_type
      } : null
    }

    return NextResponse.json({
      success: true,
      data: debug
    })

  } catch (error) {
    return NextResponse.json({
      success: false,
      error: {
        message: String(error),
        code: 'SIGNUP_TEST_ERROR'
      }
    }, { status: 500 })
  }
}