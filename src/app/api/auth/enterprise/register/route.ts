import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { SessionManager } from '@/lib/auth/session-manager'
import { AuthMiddleware } from '@/lib/auth/auth-middleware'
import { RateLimiter } from '@/lib/auth/rate-limiter'
import { TokenManager } from '@/lib/auth/token-manager'

// Admin emails that should get admin role
const ADMIN_EMAILS = [
  'zell@love4detailing.com',
  'paul@evans-studio.co.uk'
]

export async function POST(request: NextRequest) {
  try {
    const { 
      email, 
      password, 
      firstName, 
      lastName, 
      phone,
      rememberMe = false 
    } = await request.json()

    // Validation
    if (!email || !password) {
      return NextResponse.json(
        {
          success: false,
          error: {
            message: 'Email and password are required',
            code: 'MISSING_CREDENTIALS'
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

    // Rate limiting - temporarily disabled to avoid 401 errors
    // TODO: Re-enable after fixing rate_limits table RLS policies
    const clientIP = AuthMiddleware.getClientIP(request)
    // const emailRateLimit = await RateLimiter.checkLimit(email, 'register')
    // const ipRateLimit = await RateLimiter.checkLimit(clientIP, 'register')

    // if (!emailRateLimit.allowed) {
    //   return AuthMiddleware.createRateLimitResponse(emailRateLimit)
    // }

    // if (!ipRateLimit.allowed) {
    //   return AuthMiddleware.createRateLimitResponse(ipRateLimit)
    // }

    // Determine role based on email
    const role = ADMIN_EMAILS.includes(email.toLowerCase()) ? 'admin' : 'customer'
    
    // Create user with Supabase Auth
    const supabase = await createClient()
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          first_name: firstName,
          last_name: lastName,
          phone: phone,
          role: role
        },
        emailRedirectTo: `${process.env.NEXT_PUBLIC_APP_URL}/auth/callback`
      }
    })

    // If user was created but needs confirmation, auto-confirm them using admin client
    if (authData.user && !authData.user.email_confirmed_at && authData.user.confirmation_sent_at) {
      try {
        const { supabaseAdmin } = await import('@/lib/supabase/direct')
        const { error: confirmError } = await supabaseAdmin.auth.admin.updateUserById(
          authData.user.id,
          { email_confirm: true }
        )
        
        if (confirmError) {
          console.error('Auto-confirm error:', confirmError)
        } else {
          console.log('User auto-confirmed:', authData.user.id)
          // Update the user object to reflect confirmation
          authData.user.email_confirmed_at = new Date().toISOString()
        }
      } catch (autoConfirmError) {
        console.error('Auto-confirm failed:', autoConfirmError)
      }
    }

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
    const { error: profileError } = await supabase
      .from('user_profiles')
      .insert({
        id: authData.user.id,
        email: email,
        first_name: firstName || null,
        last_name: lastName || null,
        phone: phone || null,
        role: role,
        is_active: true,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })

    if (profileError) {
      console.error('Profile creation error:', profileError)
      // Continue anyway - profile will be created on first login if needed
    }

    // Check if user is confirmed or if email confirmation was sent
    console.log('User confirmation status:', {
      email_confirmed_at: authData.user.email_confirmed_at,
      confirmation_sent_at: authData.user.confirmation_sent_at,
      confirmed_at: authData.user.confirmed_at
    })

    // If email is confirmed, create session immediately
    if (authData.user.email_confirmed_at) {
      // Create enterprise session
      const deviceInfo = {
        fingerprint: TokenManager.generateDeviceFingerprint(request),
        userAgent: AuthMiddleware.getUserAgent(request),
        platform: getPlatform(request),
        browser: getBrowser(request),
        isMobile: isMobileDevice(request)
      }

      const { session, tokens } = await SessionManager.createSession(
        authData.user,
        {
          rememberMe,
          deviceInfo: {
            ...deviceInfo,
            fingerprint: deviceInfo.fingerprint
          }
        }
      )

      // Log successful registration
      await logSuccessfulRegistration(authData.user.id, clientIP, request, { role, deviceInfo })

      // Create response
      const response = NextResponse.json({
        success: true,
        data: {
          user: {
            id: authData.user.id,
            email: email,
            firstName: firstName,
            lastName: lastName,
            role: role
          },
          session: {
            id: session.id,
            expiresAt: session.expiresAt.toISOString()
          },
          redirectTo: role === 'admin' ? '/admin' : '/dashboard'
        }
      })

      // Set secure cookies
      AuthMiddleware.setAuthCookies(response, {
        accessToken: tokens.accessToken,
        refreshToken: tokens.refreshToken,
        expiresIn: tokens.expiresIn,
        refreshExpiresIn: tokens.refreshExpiresIn
      })

      return response
    } else {
      // Email confirmation required
      console.log('Email confirmation required for user:', authData.user.id)
      
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
          emailConfirmationRequired: true,
          message: 'Registration successful! Please check your email to confirm your account.',
          redirectTo: '/auth/verify-email',
          confirmationSent: !!authData.user.confirmation_sent_at
        }
      })
    }

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

// Helper functions
async function logSuccessfulRegistration(
  userId: string,
  ipAddress: string,
  request: NextRequest,
  metadata: any
) {
  try {
    const supabase = await createClient()
    
    await supabase
      .from('security_events')
      .insert({
        user_id: userId,
        event_type: 'user_registered',
        severity: 'low',
        description: 'New user registration completed',
        metadata: {
          ...metadata,
          userAgent: AuthMiddleware.getUserAgent(request)
        },
        ip_address: ipAddress,
        user_agent: AuthMiddleware.getUserAgent(request)
      })
  } catch (error) {
    console.error('Failed to log registration:', error)
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

function getPlatform(request: NextRequest): string {
  const userAgent = request.headers.get('user-agent') || ''
  
  if (userAgent.includes('Windows')) return 'Windows'
  if (userAgent.includes('Macintosh')) return 'macOS'
  if (userAgent.includes('Linux')) return 'Linux'
  if (userAgent.includes('iPhone')) return 'iOS'
  if (userAgent.includes('Android')) return 'Android'
  
  return 'Unknown'
}

function getBrowser(request: NextRequest): string {
  const userAgent = request.headers.get('user-agent') || ''
  
  if (userAgent.includes('Chrome')) return 'Chrome'
  if (userAgent.includes('Firefox')) return 'Firefox'
  if (userAgent.includes('Safari')) return 'Safari'
  if (userAgent.includes('Edge')) return 'Edge'
  
  return 'Unknown'
}

function isMobileDevice(request: NextRequest): boolean {
  const userAgent = request.headers.get('user-agent') || ''
  return /Mobile|Android|iPhone|iPad/.test(userAgent)
}