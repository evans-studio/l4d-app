import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase/direct'

interface PasswordSetupRequest {
  token: string
  password: string
}

export async function POST(request: NextRequest) {
  try {
    const { token, password }: PasswordSetupRequest = await request.json()

    // Validate input
    if (!token || !password) {
      return NextResponse.json({
        success: false,
        error: { 
          message: 'Token and password are required', 
          code: 'MISSING_FIELDS' 
        }
      }, { status: 400 })
    }

    // Validate password strength
    const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{8,}$/
    if (!passwordRegex.test(password)) {
      return NextResponse.json({
        success: false,
        error: { 
          message: 'Password must be at least 8 characters with uppercase, lowercase, and number', 
          code: 'WEAK_PASSWORD' 
        }
      }, { status: 400 })
    }

    // Find the password setup token
    const { data: tokenRecord, error: tokenError } = await supabaseAdmin
      .from('password_reset_tokens')
      .select('user_id, expires_at, created_at')
      .eq('token_hash', token)
      .single()

    if (tokenError || !tokenRecord) {
      return NextResponse.json({
        success: false,
        error: { 
          message: 'Invalid or expired password setup token', 
          code: 'INVALID_TOKEN' 
        }
      }, { status: 400 })
    }

    // Check if token has expired (24 hours)
    const tokenExpiry = new Date(tokenRecord.expires_at)
    const now = new Date()
    
    if (now > tokenExpiry) {
      // Clean up expired token
      await supabaseAdmin
        .from('password_reset_tokens')
        .delete()
        .eq('token_hash', token)

      return NextResponse.json({
        success: false,
        error: { 
          message: 'Password setup token has expired. Please contact support.', 
          code: 'TOKEN_EXPIRED' 
        }
      }, { status: 400 })
    }

    // Update the user's password in Supabase Auth
    const { data: authUser, error: updateError } = await supabaseAdmin.auth.admin.updateUserById(
      tokenRecord.user_id,
      {
        password: password,
        user_metadata: {
          password_setup_required: false,
          password_setup_completed_at: new Date().toISOString()
        }
      }
    )

    if (updateError || !authUser.user) {
      console.error('Password update error:', updateError)
      return NextResponse.json({
        success: false,
        error: { 
          message: 'Failed to update password. Please try again.', 
          code: 'PASSWORD_UPDATE_FAILED' 
        }
      }, { status: 500 })
    }

    // Remove the used token
    await supabaseAdmin
      .from('password_reset_tokens')
      .delete()
      .eq('token_hash', token)

    // Log security event
    await supabaseAdmin
      .from('security_events')
      .insert({
        user_id: tokenRecord.user_id,
        event_type: 'password_setup_completed',
        severity: 'low',
        description: 'User completed password setup after booking',
        metadata: {
          setup_method: 'booking_flow',
          token_age_minutes: Math.floor((now.getTime() - new Date(tokenRecord.created_at).getTime()) / (1000 * 60))
        },
        ip_address: request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || null,
        user_agent: request.headers.get('user-agent') || null,
        created_at: new Date().toISOString()
      })

    // Create a sign-in session for the user
    const { data: sessionData, error: sessionError } = await supabaseAdmin.auth.admin.generateLink({
      type: 'magiclink',
      email: authUser.user.email!
    })

    return NextResponse.json({
      success: true,
      data: {
        message: 'Password set successfully',
        userId: authUser.user.id,
        redirectTo: '/dashboard',
        sessionUrl: sessionData?.properties?.action_link || null
      },
      metadata: {
        timestamp: new Date().toISOString()
      }
    })

  } catch (error) {
    console.error('Password setup error:', error)
    return NextResponse.json({
      success: false,
      error: { 
        message: 'Internal server error', 
        code: 'SERVER_ERROR' 
      }
    }, { status: 500 })
  }
}