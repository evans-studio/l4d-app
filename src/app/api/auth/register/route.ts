import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase/direct'
import { RegisterRequestSchema, AuthResponseSchema } from '@/schemas/auth.schema'
import { EmailService } from '@/lib/services/email'
import { ApiResponseHandler } from '@/lib/api/response'

// Admin emails that should get admin role
const ADMIN_EMAILS = [
  'zell@love4detailing.com',
  'paul@evans-studio.co.uk'
]

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()

    // Validate request with Zod
    const validation = RegisterRequestSchema.safeParse(body)
    
    if (!validation.success) {
      return ApiResponseHandler.validationError(
        'Validation failed',
        {
          code: 'INVALID_INPUT',
          validationErrors: validation.error.flatten().fieldErrors
        }
      )
    }

    const { email, password, firstName, lastName, phone } = validation.data

    // Determine role based on email
    const role = ADMIN_EMAILS.includes(email.toLowerCase()) ? 'admin' : 'customer'

    // Create user with Supabase Auth - require email verification
    const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
      email,
      password,
      user_metadata: {
        first_name: firstName,
        last_name: lastName,
        phone: phone,
        role: role
      },
      email_confirm: false // Will send verification email manually below
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

    // Send verification email using Supabase's built-in system
    try {
      const redirectUrl = process.env.NODE_ENV === 'development' 
        ? 'http://localhost:3000/auth/verify-email'
        : `${process.env.NEXT_PUBLIC_APP_URL || 'https://l4d-app.vercel.app'}/auth/verify-email`
      
      // Use Supabase's resend method instead of generateLink for existing users
      const { error: verificationError } = await supabaseAdmin.auth.resend({
        type: 'signup',
        email: email,
        options: {
          emailRedirectTo: redirectUrl
        }
      })
      
      if (verificationError) {
        console.error('Failed to send verification email:', verificationError)
        // Continue anyway - user can resend verification if needed
      } else {
        console.log('Verification email sent to:', email)
      }
    } catch (emailError) {
      console.error('Failed to send verification email:', emailError)
      // Continue anyway - user can resend verification if needed
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
        message: 'Registration successful! Please check your email to verify your account.',
        redirectTo: `/auth/verify-email?email=${encodeURIComponent(email)}`,
        requiresVerification: true
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