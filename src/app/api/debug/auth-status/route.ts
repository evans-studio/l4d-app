import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { TokenManager } from '@/lib/auth/token-manager'
import { SessionManager } from '@/lib/auth/session-manager'

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()
    
    // Extract tokens from cookies
    const accessToken = request.cookies.get('access_token')?.value
    const refreshToken = request.cookies.get('refresh_token')?.value
    
    const debug = {
      cookies: {
        hasAccessToken: !!accessToken,
        hasRefreshToken: !!refreshToken,
        accessTokenLength: accessToken?.length || 0,
        refreshTokenLength: refreshToken?.length || 0
      },
      database: {
        sessions: { count: 0, active: 0 },
        profiles: { count: 0 }
      },
      token: {
        valid: false,
        payload: null as any,
        error: null as any
      },
      session: {
        valid: false,
        data: null as any,
        error: null as any
      }
    }
    
    // Check database tables
    const { data: sessions, error: sessionsError } = await supabase
      .from('user_sessions')
      .select('*')
      .eq('revoked_at', null)
    
    if (sessions) {
      debug.database.sessions.count = sessions.length
      debug.database.sessions.active = sessions.filter(s => new Date(s.expires_at) > new Date()).length
    }
    
    const { data: profiles, error: profilesError } = await supabase
      .from('user_profiles')
      .select('id, email, role')
    
    if (profiles) {
      debug.database.profiles.count = profiles.length
    }
    
    // Test token validation if we have one
    if (accessToken) {
      try {
        const tokenPayload = await TokenManager.verifyAccessToken(accessToken)
        debug.token.valid = true
        debug.token.payload = {
          userId: tokenPayload.userId,
          sessionId: tokenPayload.sessionId,
          role: tokenPayload.role,
          expiresAt: new Date(tokenPayload.expiresAt * 1000).toISOString(),
          isExpired: tokenPayload.expiresAt * 1000 <= Date.now()
        }
        
        // Test session validation
        try {
          const sessionData = await SessionManager.validateSession(tokenPayload.sessionId)
          debug.session.valid = !!sessionData
          debug.session.data = sessionData ? {
            id: sessionData.id,
            userId: sessionData.userId,
            expiresAt: sessionData.expiresAt.toISOString(),
            isExpired: sessionData.expiresAt < new Date()
          } : null
        } catch (sessionError) {
          debug.session.error = String(sessionError)
        }
        
      } catch (tokenError) {
        debug.token.error = String(tokenError)
      }
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
        code: 'DEBUG_ERROR'
      }
    }, { status: 500 })
  }
}