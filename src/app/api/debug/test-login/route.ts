import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { SessionManager } from '@/lib/auth/session-manager'
import { AuthMiddleware } from '@/lib/auth/auth-middleware'
import { TokenManager } from '@/lib/auth/token-manager'

export async function POST(request: NextRequest) {
  try {
    const { email, password } = await request.json()

    if (!email || !password) {
      return NextResponse.json({
        success: false,
        error: 'Email and password are required'
      }, { status: 400 })
    }

    const debugLog: any[] = []
    
    debugLog.push({ step: 'Starting login process', email })

    // Authenticate with Supabase
    const supabase = await createClient()
    debugLog.push({ step: 'Created Supabase client' })

    const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
      email,
      password
    })
    
    debugLog.push({ 
      step: 'Supabase auth result', 
      success: !!authData.user,
      hasUser: !!authData.user,
      hasSession: !!authData.session,
      error: authError?.message || null
    })

    if (authError || !authData.user) {
      return NextResponse.json({
        success: false,
        error: authError?.message || 'Authentication failed',
        debug: debugLog
      }, { status: 401 })
    }

    // Get user profile
    const { data: profile, error: profileError } = await supabase
      .from('user_profiles')
      .select('*')
      .eq('id', authData.user.id)
      .single()

    debugLog.push({ 
      step: 'Profile lookup', 
      success: !!profile,
      error: profileError?.message || null,
      profileData: profile ? { id: profile.id, email: profile.email, role: profile.role } : null
    })

    if (profileError || !profile) {
      return NextResponse.json({
        success: false,
        error: 'User profile not found',
        debug: debugLog
      }, { status: 404 })
    }

    // Create enterprise session
    const deviceInfo = {
      fingerprint: TokenManager.generateDeviceFingerprint(request),
      userAgent: AuthMiddleware.getUserAgent(request),
      platform: 'test-platform',
      browser: 'test-browser',
      isMobile: false
    }

    debugLog.push({ step: 'Device info created', deviceInfo })

    let sessionResult
    let sessionError
    
    try {
      sessionResult = await SessionManager.createSession(
        authData.user,
        {
          rememberMe: false,
          deviceInfo: {
            ...deviceInfo,
            fingerprint: deviceInfo.fingerprint
          }
        }
      )
      debugLog.push({ 
        step: 'Session creation success', 
        sessionId: sessionResult?.session?.id,
        hasTokens: !!sessionResult?.tokens
      })
    } catch (error) {
      sessionError = String(error)
      debugLog.push({ step: 'Session creation failed', error: sessionError })
      
      return NextResponse.json({
        success: false,
        error: `Session creation failed: ${sessionError}`,
        debug: debugLog
      }, { status: 500 })
    }

    // Test token validation
    let tokenTest = null
    if (sessionResult?.tokens?.accessToken) {
      try {
        const tokenPayload = await TokenManager.verifyAccessToken(sessionResult.tokens.accessToken)
        tokenTest = {
          valid: true,
          userId: tokenPayload.userId,
          sessionId: tokenPayload.sessionId,
          role: tokenPayload.role
        }
      } catch (error) {
        tokenTest = {
          valid: false,
          error: String(error)
        }
      }
      debugLog.push({ step: 'Token validation', result: tokenTest })
    }

    // Clean up test session
    if (sessionResult?.session?.id) {
      await SessionManager.revokeSession(sessionResult.session.id, 'test_cleanup')
      debugLog.push({ step: 'Test session cleaned up' })
    }

    return NextResponse.json({
      success: true,
      message: 'Login test completed successfully',
      debug: debugLog
    })

  } catch (error) {
    return NextResponse.json({
      success: false,
      error: String(error),
      step: 'Global error handler'
    }, { status: 500 })
  }
}