import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase/direct'

// Admin emails that should get admin role
const ADMIN_EMAILS = [
  'zell@love4detailing.com',
  'paul@evans-studio.co.uk'
]

export async function POST(request: NextRequest) {
  try {
    const { email, password, firstName, lastName, phone } = await request.json()

    // Basic validation
    if (!email || !password || !firstName || !lastName) {
      return NextResponse.json(
        {
          success: false,
          error: {
            message: 'Email, password, first name, and last name are required',
            code: 'MISSING_FIELDS'
          }
        },
        { status: 400 }
      )
    }

    if (password.length < 8) {
      return NextResponse.json(
        {
          success: false,
          error: {
            message: 'Password must be at least 8 characters long',
            code: 'WEAK_PASSWORD'
          }
        },
        { status: 400 }
      )
    }

    // Determine role based on email
    const role = ADMIN_EMAILS.includes(email.toLowerCase()) ? 'admin' : 'customer'

    // Create user with Supabase Auth using admin client for auto-confirmation
    const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
      email,
      password,
      user_metadata: {
        first_name: firstName,
        last_name: lastName,
        phone: phone,
        role: role
      },
      email_confirm: true // Auto-confirm email to avoid confirmation flow
    })

    if (authError || !authData.user) {
      return NextResponse.json(
        {
          success: false,
          error: {
            message: getSignupErrorMessage(authError?.message || 'Registration failed'),
            code: 'SIGNUP_FAILED'
          }
        },
        { status: 400 }
      )
    }

    // Create user profile
    const { error: profileError } = await supabaseAdmin
      .from('user_profiles')
      .insert({
        id: authData.user.id,
        email: email,
        first_name: firstName,
        last_name: lastName,
        phone: phone || null,
        role: role,
        is_active: true,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })

    if (profileError) {
      console.error('Profile creation error:', profileError)
      // Continue anyway - profile can be created on first login if needed
    }

    return NextResponse.json({
      success: true,
      data: {
        user: {
          id: authData.user.id,
          email: email,
          firstName: firstName,
          lastName: lastName,
          role: role
        },
        message: 'Registration successful! You can now sign in.',
        redirectTo: role === 'admin' ? '/admin' : '/dashboard'
      }
    })

  } catch (error) {
    console.error('Registration error:', error)
    return NextResponse.json(
      {
        success: false,
        error: {
          message: 'Internal server error',
          code: 'SERVER_ERROR'
        }
      },
      { status: 500 }
    )
  }
}

function getSignupErrorMessage(supabaseError: string): string {
  if (supabaseError.includes('User already registered')) {
    return 'An account with this email already exists. Please try signing in instead.'
  } else if (supabaseError.includes('Password should be at least')) {
    return 'Password must be at least 8 characters long.'
  } else if (supabaseError.includes('Unable to validate email address')) {
    return 'Please enter a valid email address.'
  } else if (supabaseError.includes('Signup is disabled')) {
    return 'New registrations are currently disabled. Please contact support.'
  } else {
    return 'Registration failed. Please try again.'
  }
}