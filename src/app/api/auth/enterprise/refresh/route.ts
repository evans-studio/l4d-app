import { NextRequest, NextResponse } from 'next/server'
import { AuthMiddleware } from '@/lib/auth/auth-middleware'
import { SessionManager } from '@/lib/auth/session-manager'
import { TokenManager } from '@/lib/auth/token-manager'
import { RateLimiter } from '@/lib/auth/rate-limiter'

export async function POST(request: NextRequest) {
  try {
    // Rate limiting
    const clientIP = AuthMiddleware.getClientIP(request)
    const rateLimit = await RateLimiter.checkLimit(clientIP, 'refresh')

    if (!rateLimit.allowed) {
      return AuthMiddleware.createRateLimitResponse(rateLimit)
    }

    // Extract refresh token from cookies
    const tokens = TokenManager.extractTokensFromCookies(
      request.headers.get('cookie') || undefined
    )

    if (!tokens.refreshToken) {
      return NextResponse.json(
        {
          success: false,
          error: {
            message: 'Refresh token not provided',
            code: 'NO_REFRESH_TOKEN'
          }
        },
        { status: 401 }
      )
    }

    // Refresh session
    const refreshResult = await SessionManager.refreshSession(tokens.refreshToken)

    if (!refreshResult) {
      // Clear invalid cookies
      const response = NextResponse.json(
        {
          success: false,
          error: {
            message: 'Refresh token invalid or expired',
            code: 'REFRESH_FAILED'
          }
        },
        { status: 401 }
      )

      AuthMiddleware.clearAuthCookies(response)
      return response
    }

    // Get user profile for response
    const tokenPayload = await TokenManager.verifyAccessToken(refreshResult.tokens.accessToken)
    
    // Create response
    const response = NextResponse.json({
      success: true,
      data: {
        user: {
          id: tokenPayload.userId,
          role: tokenPayload.role
        },
        session: {
          id: refreshResult.session.id,
          expiresAt: refreshResult.session.expiresAt.toISOString()
        },
        expiresIn: refreshResult.tokens.expiresIn
      }
    })

    // Set new cookies
    AuthMiddleware.setAuthCookies(response, {
      accessToken: refreshResult.tokens.accessToken,
      refreshToken: refreshResult.tokens.refreshToken,
      expiresIn: refreshResult.tokens.expiresIn,
      refreshExpiresIn: refreshResult.tokens.refreshExpiresIn
    })

    return response

  } catch (error) {
    console.error('Token refresh error:', error)
    
    const response = NextResponse.json(
      {
        success: false,
        error: {
          message: 'Token refresh failed',
          code: 'REFRESH_ERROR'
        }
      },
      { status: 500 }
    )

    // Clear potentially invalid cookies
    AuthMiddleware.clearAuthCookies(response)
    return response
  }
}