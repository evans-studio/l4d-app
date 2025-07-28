import { NextRequest, NextResponse } from 'next/server'
import { TokenManager } from './token-manager'
import { SessionManager } from './session-manager'
import { RateLimiter } from './rate-limiter'

export interface AuthResult {
  success: boolean
  user?: {
    id: string
    email: string
    role: string
  }
  session?: {
    id: string
    expiresAt: Date
  }
  newTokens?: {
    accessToken: string
    refreshToken: string
    expiresIn: number
  }
  error?: {
    message: string
    code: string
  }
}

export class AuthMiddleware {
  private static readonly REFRESH_THRESHOLD = 5 * 60 * 1000 // 5 minutes

  /**
   * Main authentication method for middleware
   */
  static async authenticate(request: NextRequest): Promise<AuthResult> {
    try {
      // Extract tokens from request
      const tokens = this.extractTokens(request)
      
      if (!tokens.accessToken) {
        return {
          success: false,
          error: {
            message: 'No access token provided',
            code: 'NO_TOKEN'
          }
        }
      }

      // Validate access token
      const tokenValidation = await this.validateAccessToken(tokens.accessToken)
      
      if (!tokenValidation.success) {
        // If access token is invalid but we have refresh token, try refresh
        if (tokens.refreshToken && tokenValidation.error?.code === 'TOKEN_EXPIRED') {
          return await this.handleTokenRefresh(tokens.refreshToken)
        }
        
        return tokenValidation
      }

      // Check if token needs refresh (within threshold of expiry)
      const expiresIn = tokenValidation.tokenPayload!.expiresAt * 1000 - Date.now()
      
      if (expiresIn < this.REFRESH_THRESHOLD && tokens.refreshToken) {
        const refreshResult = await this.handleTokenRefresh(tokens.refreshToken)
        
        // If refresh successful, return new tokens, otherwise continue with current valid token
        if (refreshResult.success) {
          return refreshResult
        }
      }

      // Update session activity
      await SessionManager.updateSessionActivity(tokenValidation.tokenPayload!.sessionId)

      return {
        success: true,
        user: tokenValidation.user!,
        session: tokenValidation.session!
      }

    } catch (error) {
      console.error('Authentication middleware error:', error)
      return {
        success: false,
        error: {
          message: 'Authentication failed',
          code: 'AUTH_ERROR'
        }
      }
    }
  }

  /**
   * Validate access token and return user/session info
   */
  private static async validateAccessToken(accessToken: string): Promise<AuthResult & {
    tokenPayload?: any
  }> {
    try {
      // Verify JWT token
      const tokenPayload = await TokenManager.verifyAccessToken(accessToken)
      
      // Validate session exists and is active
      const session = await SessionManager.validateSession(tokenPayload.sessionId)
      
      if (!session) {
        return {
          success: false,
          error: {
            message: 'Session not found or expired',
            code: 'SESSION_INVALID'
          }
        }
      }

      // Check if token is expired
      if (tokenPayload.expiresAt * 1000 <= Date.now()) {
        return {
          success: false,
          error: {
            message: 'Access token expired',
            code: 'TOKEN_EXPIRED'
          }
        }
      }

      return {
        success: true,
        user: {
          id: tokenPayload.userId,
          email: '', // Will be populated from profile if needed
          role: tokenPayload.role
        },
        session: {
          id: session.id,
          expiresAt: session.expiresAt
        },
        tokenPayload
      }

    } catch (error) {
      return {
        success: false,
        error: {
          message: 'Invalid access token',
          code: 'TOKEN_INVALID'
        }
      }
    }
  }

  /**
   * Handle token refresh flow
   */
  private static async handleTokenRefresh(refreshToken: string): Promise<AuthResult> {
    try {
      const refreshResult = await SessionManager.refreshSession(refreshToken)
      
      if (!refreshResult) {
        return {
          success: false,
          error: {
            message: 'Refresh token invalid or expired',
            code: 'REFRESH_FAILED'
          }
        }
      }

      // Decode new access token to get user info
      const newTokenPayload = await TokenManager.verifyAccessToken(refreshResult.tokens.accessToken)

      return {
        success: true,
        user: {
          id: newTokenPayload.userId,
          email: '', // Will be populated from profile if needed
          role: newTokenPayload.role
        },
        session: {
          id: refreshResult.session.id,
          expiresAt: refreshResult.session.expiresAt
        },
        newTokens: {
          accessToken: refreshResult.tokens.accessToken,
          refreshToken: refreshResult.tokens.refreshToken,
          expiresIn: refreshResult.tokens.expiresIn
        }
      }

    } catch (error) {
      console.error('Token refresh error:', error)
      return {
        success: false,
        error: {
          message: 'Token refresh failed',
          code: 'REFRESH_ERROR'
        }
      }
    }
  }

  /**
   * Extract tokens from request (cookies or headers)
   */
  private static extractTokens(request: NextRequest): {
    accessToken?: string
    refreshToken?: string
  } {
    // Try cookies first (production)
    const cookieTokens = TokenManager.extractTokensFromCookies(
      request.headers.get('cookie') || undefined
    )
    
    if (cookieTokens.accessToken) {
      return cookieTokens
    }

    // Try Authorization header (development/API)
    const bearerToken = TokenManager.extractTokenFromBearer(
      request.headers.get('authorization') || undefined
    )

    return {
      accessToken: bearerToken,
      refreshToken: undefined // Refresh tokens should only come from cookies
    }
  }

  /**
   * Create response with new auth cookies
   */
  static setAuthCookies(
    response: NextResponse,
    tokens: {
      accessToken: string
      refreshToken: string
      expiresIn: number
      refreshExpiresIn: number
    }
  ): NextResponse {
    // Set access token cookie
    response.cookies.set(
      'auth_access',
      tokens.accessToken,
      TokenManager.getSecureCookieOptions(tokens.expiresIn)
    )

    // Set refresh token cookie
    response.cookies.set(
      'auth_refresh',
      tokens.refreshToken,
      TokenManager.getSecureCookieOptions(tokens.refreshExpiresIn)
    )

    return response
  }

  /**
   * Clear auth cookies
   */
  static clearAuthCookies(response: NextResponse): NextResponse {
    response.cookies.delete('auth_access')
    response.cookies.delete('auth_refresh')
    return response
  }

  /**
   * Check rate limits for authentication endpoints
   */
  static async checkRateLimit(
    identifier: string,
    action: 'login' | 'refresh' | 'api' = 'login'
  ): Promise<{
    allowed: boolean
    remaining: number
    resetAt: number
    retryAfter?: number
  }> {
    return await RateLimiter.checkLimit(identifier, action)
  }

  /**
   * Get client IP address from request
   */
  static getClientIP(request: NextRequest): string {
    return (
      request.headers.get('x-forwarded-for')?.split(',')[0] ||
      request.headers.get('x-real-ip') ||
      request.headers.get('cf-connecting-ip') ||
      'unknown'
    )
  }

  /**
   * Extract user agent from request
   */
  static getUserAgent(request: NextRequest): string {
    return request.headers.get('user-agent') || 'unknown'
  }

  /**
   * Create standard API error response
   */
  static createErrorResponse(
    error: { message: string; code: string },
    status: number = 401
  ): NextResponse {
    return NextResponse.json(
      {
        success: false,
        error,
        metadata: {
          timestamp: new Date().toISOString()
        }
      },
      { status }
    )
  }

  /**
   * Create standard rate limit response
   */
  static createRateLimitResponse(rateLimit: {
    resetAt: number
    remaining: number
  }): NextResponse {
    return NextResponse.json(
      {
        success: false,
        error: {
          message: 'Too many requests',
          code: 'RATE_LIMITED'
        },
        metadata: {
          retryAfter: rateLimit.resetAt,
          remaining: rateLimit.remaining,
          timestamp: new Date().toISOString()
        }
      },
      { status: 429 }
    )
  }

  /**
   * Role-based authorization check
   */
  static hasRole(userRole: string, allowedRoles: string[]): boolean {
    return allowedRoles.includes(userRole)
  }

  /**
   * Admin role check
   */
  static isAdmin(userRole: string): boolean {
    return ['admin', 'super_admin'].includes(userRole)
  }
}