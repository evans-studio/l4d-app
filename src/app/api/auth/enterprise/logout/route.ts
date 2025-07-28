import { NextRequest, NextResponse } from 'next/server'
import { AuthMiddleware } from '@/lib/auth/auth-middleware'
import { SessionManager } from '@/lib/auth/session-manager'
import { TokenManager } from '@/lib/auth/token-manager'
import { createClient } from '@/lib/supabase/server'

export async function POST(request: NextRequest) {
  try {
    // Extract tokens
    const tokens = TokenManager.extractTokensFromCookies(
      request.headers.get('cookie') || undefined
    )

    let userId: string | undefined
    let sessionId: string | undefined

    // If we have a valid access token, extract user and session info
    if (tokens.accessToken) {
      try {
        const tokenPayload = await TokenManager.verifyAccessToken(tokens.accessToken)
        userId = tokenPayload.userId
        sessionId = tokenPayload.sessionId
      } catch (error) {
        // Token invalid, but we'll still clear cookies
        console.log('Invalid access token during logout:', error)
      }
    }

    // Revoke session if we have session ID
    if (sessionId) {
      await SessionManager.revokeSession(sessionId, 'user_logout')
    }

    // Log security event if we have user ID
    if (userId) {
      await logLogoutEvent(userId, request)
    }

    // Revoke Supabase session
    const supabase = await createClient()
    await supabase.auth.signOut()

    // Create response and clear cookies
    const response = NextResponse.json({
      success: true,
      data: {
        message: 'Logged out successfully'
      }
    })

    AuthMiddleware.clearAuthCookies(response)

    return response

  } catch (error) {
    console.error('Logout error:', error)
    
    // Even if there's an error, clear cookies
    const response = NextResponse.json(
      {
        success: false,
        error: {
          message: 'Logout failed',
          code: 'LOGOUT_ERROR'
        }
      },
      { status: 500 }
    )

    AuthMiddleware.clearAuthCookies(response)
    return response
  }
}

async function logLogoutEvent(userId: string, request: NextRequest) {
  try {
    const supabase = await createClient()
    
    await supabase
      .from('security_events')
      .insert({
        user_id: userId,
        event_type: 'logout',
        severity: 'low',
        description: 'User logged out',
        metadata: {
          userAgent: AuthMiddleware.getUserAgent(request)
        },
        ip_address: AuthMiddleware.getClientIP(request),
        user_agent: AuthMiddleware.getUserAgent(request)
      })
  } catch (error) {
    console.error('Failed to log logout event:', error)
  }
}