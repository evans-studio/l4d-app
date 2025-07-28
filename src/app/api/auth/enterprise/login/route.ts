import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { SessionManager } from '@/lib/auth/session-manager'
import { AuthMiddleware } from '@/lib/auth/auth-middleware'
import { RateLimiter } from '@/lib/auth/rate-limiter'
import { TokenManager } from '@/lib/auth/token-manager'

export async function POST(request: NextRequest) {
  try {
    const { email, password, rememberMe = false } = await request.json()

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

    // Rate limiting
    const clientIP = AuthMiddleware.getClientIP(request)
    const emailRateLimit = await RateLimiter.checkLimit(email, 'login')
    const ipRateLimit = await RateLimiter.checkLimit(clientIP, 'login')

    if (!emailRateLimit.allowed) {
      return AuthMiddleware.createRateLimitResponse(emailRateLimit)
    }

    if (!ipRateLimit.allowed) {
      return AuthMiddleware.createRateLimitResponse(ipRateLimit)
    }

    // Authenticate with Supabase
    const supabase = await createClient()
    const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
      email,
      password
    })

    if (authError || !authData.user) {
      // Log failed attempt
      await logFailedLogin(email, clientIP, request, authError?.message || 'Invalid credentials')

      return NextResponse.json(
        {
          success: false,
          error: {
            message: getErrorMessage(authError?.message || 'Invalid credentials'),
            code: 'LOGIN_FAILED'
          }
        },
        { status: 401 }
      )
    }

    // Get user profile
    const { data: profile, error: profileError } = await supabase
      .from('user_profiles')
      .select('*')
      .eq('id', authData.user.id)
      .single()

    if (profileError || !profile) {
      return NextResponse.json(
        {
          success: false,
          error: {
            message: 'User profile not found',
            code: 'PROFILE_NOT_FOUND'
          }
        },
        { status: 404 }
      )
    }

    // Check if user account is active
    if (profile.is_active === false) {
      return NextResponse.json(
        {
          success: false,
          error: {
            message: 'Account is inactive. Please contact support.',
            code: 'ACCOUNT_INACTIVE'
          }
        },
        { status: 403 }
      )
    }

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

    // Log successful login
    await logSuccessfulLogin(authData.user.id, clientIP, request, deviceInfo)

    // Create response
    const response = NextResponse.json({
      success: true,
      data: {
        user: {
          id: profile.id,
          email: profile.email,
          firstName: profile.first_name,
          lastName: profile.last_name,
          role: profile.role
        },
        session: {
          id: session.id,
          expiresAt: session.expiresAt.toISOString()
        }
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

  } catch (error) {
    console.error('Login error:', error)
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
async function logFailedLogin(
  email: string,
  ipAddress: string,
  request: NextRequest,
  reason: string
) {
  try {
    const supabase = await createClient()
    
    await supabase
      .from('security_events')
      .insert({
        event_type: 'login_failed',
        severity: 'medium',
        description: `Failed login attempt for ${email}`,
        metadata: {
          email,
          reason,
          userAgent: AuthMiddleware.getUserAgent(request)
        },
        ip_address: ipAddress,
        user_agent: AuthMiddleware.getUserAgent(request)
      })
  } catch (error) {
    console.error('Failed to log failed login:', error)
  }
}

async function logSuccessfulLogin(
  userId: string,
  ipAddress: string,
  request: NextRequest,
  deviceInfo: any
) {
  try {
    const supabase = await createClient()
    
    await supabase
      .from('security_events')
      .insert({
        user_id: userId,
        event_type: 'login_success',
        severity: 'low',
        description: 'Successful login',
        metadata: {
          deviceInfo,
          userAgent: AuthMiddleware.getUserAgent(request)
        },
        ip_address: ipAddress,
        user_agent: AuthMiddleware.getUserAgent(request)
      })
  } catch (error) {
    console.error('Failed to log successful login:', error)
  }
}

function getErrorMessage(supabaseError: string): string {
  if (supabaseError.includes('Invalid login credentials')) {
    return 'Invalid email or password. Please check your credentials and try again.'
  } else if (supabaseError.includes('Email not confirmed')) {
    return 'Please verify your email address before signing in. Check your inbox for a verification link.'
  } else if (supabaseError.includes('Too many requests')) {
    return 'Too many login attempts. Please wait a moment before trying again.'
  } else {
    return 'Login failed. Please try again.'
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