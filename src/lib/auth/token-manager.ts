import { SignJWT, jwtVerify } from 'jose'
import { createHash, randomBytes } from 'crypto'

export interface TokenPair {
  accessToken: string
  refreshToken: string
  expiresIn: number
  refreshExpiresIn: number
}

export interface TokenPayload {
  userId: string
  sessionId: string
  role: string
  issuedAt: number
  expiresAt: number
}

export interface RefreshTokenPayload {
  userId: string
  sessionId: string
  tokenFamily: string
  issuedAt: number
  expiresAt: number
}

export class TokenManager {
  private static readonly ACCESS_TOKEN_EXPIRY = 15 * 60 // 15 minutes
  private static readonly REFRESH_TOKEN_EXPIRY = 7 * 24 * 60 * 60 // 7 days
  private static readonly ALGORITHM = 'HS256'

  // Environment-based secrets (should be in environment variables)
  private static get accessTokenSecret(): Uint8Array {
    const secret = process.env.ACCESS_TOKEN_SECRET
    if (!secret) throw new Error('ACCESS_TOKEN_SECRET not configured')
    return new TextEncoder().encode(secret)
  }

  private static get refreshTokenSecret(): Uint8Array {
    const secret = process.env.REFRESH_TOKEN_SECRET
    if (!secret) throw new Error('REFRESH_TOKEN_SECRET not configured')
    return new TextEncoder().encode(secret)
  }

  /**
   * Generate a new token pair for a user session
   */
  static async generateTokenPair(
    userId: string,
    sessionId: string,
    role: string,
    tokenFamily?: string
  ): Promise<TokenPair> {
    const now = Math.floor(Date.now() / 1000)
    const accessExpiresAt = now + this.ACCESS_TOKEN_EXPIRY
    const refreshExpiresAt = now + this.REFRESH_TOKEN_EXPIRY

    // Generate access token
    const accessToken = await new SignJWT({
      userId,
      sessionId,
      role,
      issuedAt: now,
      expiresAt: accessExpiresAt
    })
      .setProtectedHeader({ alg: this.ALGORITHM })
      .setIssuedAt(now)
      .setExpirationTime(accessExpiresAt)
      .setSubject(userId)
      .sign(this.accessTokenSecret)

    // Generate refresh token with family for rotation tracking
    const refreshTokenFamily = tokenFamily || this.generateTokenFamily()
    const refreshToken = await new SignJWT({
      userId,
      sessionId,
      tokenFamily: refreshTokenFamily,
      issuedAt: now,
      expiresAt: refreshExpiresAt
    })
      .setProtectedHeader({ alg: this.ALGORITHM })
      .setIssuedAt(now)
      .setExpirationTime(refreshExpiresAt)
      .setSubject(userId)
      .sign(this.refreshTokenSecret)

    return {
      accessToken,
      refreshToken,
      expiresIn: this.ACCESS_TOKEN_EXPIRY,
      refreshExpiresIn: this.REFRESH_TOKEN_EXPIRY
    }
  }

  /**
   * Verify and decode an access token
   */
  static async verifyAccessToken(token: string): Promise<TokenPayload> {
    try {
      const { payload } = await jwtVerify(token, this.accessTokenSecret)
      
      return {
        userId: payload.userId as string,
        sessionId: payload.sessionId as string,
        role: payload.role as string,
        issuedAt: payload.issuedAt as number,
        expiresAt: payload.expiresAt as number
      }
    } catch (error) {
      throw new Error('Invalid access token')
    }
  }

  /**
   * Verify and decode a refresh token
   */
  static async verifyRefreshToken(token: string): Promise<RefreshTokenPayload> {
    try {
      const { payload } = await jwtVerify(token, this.refreshTokenSecret)
      
      return {
        userId: payload.userId as string,
        sessionId: payload.sessionId as string,
        tokenFamily: payload.tokenFamily as string,
        issuedAt: payload.issuedAt as number,
        expiresAt: payload.expiresAt as number
      }
    } catch (error) {
      throw new Error('Invalid refresh token')
    }
  }

  /**
   * Check if a token is close to expiring (within threshold)
   */
  static isTokenExpiringSoon(
    tokenPayload: TokenPayload, 
    thresholdMinutes: number = 5
  ): boolean {
    const now = Math.floor(Date.now() / 1000)
    const threshold = now + (thresholdMinutes * 60)
    return tokenPayload.expiresAt <= threshold
  }

  /**
   * Generate a unique token family identifier for refresh token rotation
   */
  private static generateTokenFamily(): string {
    return randomBytes(32).toString('hex')
  }

  /**
   * Create a secure hash of a token for storage/comparison
   */
  static hashToken(token: string): string {
    return createHash('sha256').update(token).digest('hex')
  }

  /**
   * Extract tokens from HTTP cookies
   */
  static extractTokensFromCookies(cookieHeader?: string): {
    accessToken?: string
    refreshToken?: string
  } {
    if (!cookieHeader) return {}

    const cookies = this.parseCookies(cookieHeader)
    return {
      accessToken: cookies.auth_access,
      refreshToken: cookies.auth_refresh
    }
  }

  /**
   * Extract tokens from Authorization header (Bearer token)
   */
  static extractTokenFromBearer(authHeader?: string): string | undefined {
    if (!authHeader?.startsWith('Bearer ')) return undefined
    return authHeader.slice(7)
  }

  /**
   * Parse cookie string into object
   */
  private static parseCookies(cookieString: string): Record<string, string> {
    const cookies: Record<string, string> = {}
    
    cookieString.split(';').forEach(cookie => {
      const [name, ...rest] = cookie.trim().split('=')
      if (name && rest.length > 0) {
        cookies[name] = rest.join('=')
      }
    })
    
    return cookies
  }

  /**
   * Create secure cookie options for production
   */
  static getSecureCookieOptions(maxAge: number) {
    return {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict' as const,
      maxAge: maxAge * 1000, // Convert to milliseconds
      path: '/',
      domain: process.env.NODE_ENV === 'production' ? process.env.COOKIE_DOMAIN : undefined
    }
  }

  /**
   * Generate device fingerprint from request headers
   */
  static generateDeviceFingerprint(request: {
    headers: { get(name: string): string | null }
    ip?: string
  }): string {
    const components = [
      request.headers.get('user-agent') || '',
      request.headers.get('accept-language') || '',
      request.headers.get('accept-encoding') || '',
      request.ip || request.headers.get('x-forwarded-for') || '',
    ]
    
    return createHash('sha256')
      .update(components.join('|'))
      .digest('hex')
      .slice(0, 16) // Use first 16 chars for fingerprint
  }
}