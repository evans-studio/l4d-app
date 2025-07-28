import { createClient } from '@/lib/supabase/server'
import { TokenManager, TokenPair } from './token-manager'
import { User } from '@supabase/supabase-js'

export interface SessionData {
  id: string
  userId: string
  sessionToken: string
  refreshTokenFamily: string
  deviceInfo: DeviceInfo
  ipAddress?: string
  userAgent?: string
  expiresAt: Date
  createdAt: Date
  lastActivity: Date
}

export interface DeviceInfo {
  fingerprint: string
  userAgent?: string
  platform?: string
  browser?: string
  isMobile?: boolean
}

export interface CreateSessionOptions {
  rememberMe?: boolean
  deviceInfo?: Partial<DeviceInfo>
}

export class SessionManager {
  private static readonly MAX_SESSIONS_PER_USER = 5
  private static readonly SESSION_TIMEOUT = 24 * 60 * 60 * 1000 // 24 hours
  
  /**
   * Create a new session for a user
   */
  static async createSession(
    user: User,
    options: CreateSessionOptions = {}
  ): Promise<{ session: SessionData; tokens: TokenPair }> {
    const supabase = await createClient()
    
    // Get user profile for role information
    const { data: profile } = await supabase
      .from('user_profiles')
      .select('role')
      .eq('id', user.id)
      .single()
    
    if (!profile) {
      throw new Error('User profile not found')
    }
    
    // Generate device fingerprint if not provided
    const deviceInfo: DeviceInfo = {
      fingerprint: options.deviceInfo?.fingerprint || this.generateDefaultFingerprint(),
      userAgent: options.deviceInfo?.userAgent,
      platform: options.deviceInfo?.platform,
      browser: options.deviceInfo?.browser,
      isMobile: options.deviceInfo?.isMobile || false
    }
    
    // Calculate session expiry
    const sessionDuration = options.rememberMe 
      ? 30 * 24 * 60 * 60 * 1000 // 30 days
      : this.SESSION_TIMEOUT // 24 hours
    
    const expiresAt = new Date(Date.now() + sessionDuration)
    
    // Check and cleanup old sessions
    await this.enforceSessionLimit(user.id)
    
    // Create session record
    const sessionId = crypto.randomUUID()
    const refreshTokenFamily = this.generateTokenFamily()
    
    const { data: sessionRecord, error: sessionError } = await supabase
      .from('user_sessions')
      .insert({
        id: sessionId,
        user_id: user.id,
        session_token: TokenManager.hashToken(sessionId),
        refresh_token_family: refreshTokenFamily,
        device_info: deviceInfo,
        expires_at: expiresAt.toISOString(),
        last_activity: new Date().toISOString()
      })
      .select()
      .single()
    
    if (sessionError) {
      throw new Error(`Failed to create session: ${sessionError.message}`)
    }
    
    // Generate token pair
    const tokens = await TokenManager.generateTokenPair(
      user.id,
      sessionId,
      profile.role,
      refreshTokenFamily
    )
    
    // Log security event
    await this.logSecurityEvent({
      userId: user.id,
      eventType: 'session_created',
      severity: 'low',
      description: 'New session created',
      metadata: {
        sessionId,
        deviceInfo,
        rememberMe: options.rememberMe
      }
    })
    
    return {
      session: {
        id: sessionRecord.id,
        userId: sessionRecord.user_id,
        sessionToken: sessionRecord.session_token,
        refreshTokenFamily: sessionRecord.refresh_token_family,
        deviceInfo: sessionRecord.device_info as DeviceInfo,
        ipAddress: sessionRecord.ip_address,
        userAgent: sessionRecord.user_agent,
        expiresAt: new Date(sessionRecord.expires_at),
        createdAt: new Date(sessionRecord.created_at),
        lastActivity: new Date(sessionRecord.last_activity)
      },
      tokens
    }
  }
  
  /**
   * Validate an existing session
   */
  static async validateSession(sessionId: string): Promise<SessionData | null> {
    const supabase = await createClient()
    
    const { data: session, error } = await supabase
      .from('user_sessions')
      .select('*')
      .eq('id', sessionId)
      .eq('revoked_at', null)
      .single()
    
    if (error || !session) {
      return null
    }
    
    // Check if session is expired
    if (new Date(session.expires_at) < new Date()) {
      await this.revokeSession(sessionId, 'expired')
      return null
    }
    
    // Update last activity
    await this.updateSessionActivity(sessionId)
    
    return {
      id: session.id,
      userId: session.user_id,
      sessionToken: session.session_token,
      refreshTokenFamily: session.refresh_token_family,
      deviceInfo: session.device_info as DeviceInfo,
      ipAddress: session.ip_address,
      userAgent: session.user_agent,
      expiresAt: new Date(session.expires_at),
      createdAt: new Date(session.created_at),
      lastActivity: new Date(session.last_activity)
    }
  }
  
  /**
   * Refresh a session with new tokens
   */
  static async refreshSession(
    refreshToken: string
  ): Promise<{ session: SessionData; tokens: TokenPair } | null> {
    const supabase = await createClient()
    
    try {
      // Verify refresh token
      const refreshPayload = await TokenManager.verifyRefreshToken(refreshToken)
      
      // Get session
      const session = await this.validateSession(refreshPayload.sessionId)
      if (!session) {
        throw new Error('Session not found or invalid')
      }
      
      // Verify token family matches (prevents token reuse attacks)
      if (session.refreshTokenFamily !== refreshPayload.tokenFamily) {
        await this.revokeSession(refreshPayload.sessionId, 'token_reuse_detected')
        await this.logSecurityEvent({
          userId: refreshPayload.userId,
          eventType: 'token_reuse_detected',
          severity: 'critical',
          description: 'Refresh token reuse detected - session revoked',
          metadata: { sessionId: refreshPayload.sessionId }
        })
        throw new Error('Token reuse detected - session revoked for security')
      }
      
      // Record token usage
      await supabase
        .from('refresh_token_usage')
        .insert({
          session_id: refreshPayload.sessionId,
          token_hash: TokenManager.hashToken(refreshToken),
          used_at: new Date().toISOString()
        })
      
      // Get user profile for new tokens
      const { data: profile } = await supabase
        .from('user_profiles')
        .select('role')
        .eq('id', refreshPayload.userId)
        .single()
      
      if (!profile) {
        throw new Error('User profile not found')
      }
      
      // Generate new token pair with same family
      const newTokens = await TokenManager.generateTokenPair(
        refreshPayload.userId,
        refreshPayload.sessionId,
        profile.role,
        refreshPayload.tokenFamily
      )
      
      // Update session activity
      await this.updateSessionActivity(refreshPayload.sessionId)
      
      await this.logSecurityEvent({
        userId: refreshPayload.userId,
        eventType: 'session_refreshed',
        severity: 'low',
        description: 'Session tokens refreshed',
        metadata: { sessionId: refreshPayload.sessionId }
      })
      
      return { session, tokens: newTokens }
      
    } catch (error) {
      console.error('Session refresh error:', error)
      return null
    }
  }
  
  /**
   * Revoke a session
   */
  static async revokeSession(sessionId: string, reason: string = 'manual'): Promise<void> {
    const supabase = await createClient()
    
    const { error } = await supabase
      .from('user_sessions')
      .update({
        revoked_at: new Date().toISOString(),
        revocation_reason: reason
      })
      .eq('id', sessionId)
    
    if (error) {
      console.error('Failed to revoke session:', error)
    }
  }
  
  /**
   * Revoke all sessions for a user
   */
  static async revokeUserSessions(userId: string, reason: string = 'manual'): Promise<number> {
    const supabase = await createClient()
    
    const { data } = await supabase.rpc('revoke_user_sessions', {
      target_user_id: userId,
      reason
    })
    
    await this.logSecurityEvent({
      userId,
      eventType: 'all_sessions_revoked',
      severity: 'medium',
      description: `All user sessions revoked: ${reason}`,
      metadata: { reason, revokedCount: data }
    })
    
    return data || 0
  }
  
  /**
   * Update session last activity
   */
  static async updateSessionActivity(sessionId: string): Promise<void> {
    const supabase = await createClient()
    
    await supabase
      .from('user_sessions')
      .update({ last_activity: new Date().toISOString() })
      .eq('id', sessionId)
  }
  
  /**
   * Enforce maximum sessions per user
   */
  private static async enforceSessionLimit(userId: string): Promise<void> {
    const supabase = await createClient()
    
    // Get active sessions count
    const { data: sessions } = await supabase
      .from('user_sessions')
      .select('id, created_at')
      .eq('user_id', userId)
      .is('revoked_at', null)
      .order('created_at', { ascending: true })
    
    if (!sessions || sessions.length < this.MAX_SESSIONS_PER_USER) {
      return
    }
    
    // Revoke oldest sessions to make room
    const sessionsToRevoke = sessions.slice(0, sessions.length - this.MAX_SESSIONS_PER_USER + 1)
    
    for (const session of sessionsToRevoke) {
      await this.revokeSession(session.id, 'session_limit_exceeded')
    }
  }
  
  /**
   * Generate a unique token family for refresh token rotation
   */
  private static generateTokenFamily(): string {
    return crypto.randomUUID()
  }
  
  /**
   * Generate a default device fingerprint
   */
  private static generateDefaultFingerprint(): string {
    return crypto.randomUUID().slice(0, 16)
  }
  
  /**
   * Log security events
   */
  private static async logSecurityEvent(event: {
    userId: string
    eventType: string
    severity: 'low' | 'medium' | 'high' | 'critical'
    description: string
    metadata?: any
    ipAddress?: string
    userAgent?: string
  }): Promise<void> {
    const supabase = await createClient()
    
    await supabase
      .from('security_events')
      .insert({
        user_id: event.userId,
        event_type: event.eventType,
        severity: event.severity,
        description: event.description,
        metadata: event.metadata || {},
        ip_address: event.ipAddress,
        user_agent: event.userAgent
      })
  }
  
  /**
   * Clean up expired sessions
   */
  static async cleanupExpiredSessions(): Promise<number> {
    const supabase = await createClient()
    
    const { data } = await supabase.rpc('cleanup_expired_sessions')
    return data || 0
  }
  
  /**
   * Get active sessions for a user
   */
  static async getUserSessions(userId: string): Promise<SessionData[]> {
    const supabase = await createClient()
    
    const { data: sessions, error } = await supabase
      .from('user_sessions')
      .select('*')
      .eq('user_id', userId)
      .is('revoked_at', null)
      .order('last_activity', { ascending: false })
    
    if (error || !sessions) {
      return []
    }
    
    return sessions.map(session => ({
      id: session.id,
      userId: session.user_id,
      sessionToken: session.session_token,
      refreshTokenFamily: session.refresh_token_family,
      deviceInfo: session.device_info as DeviceInfo,
      ipAddress: session.ip_address,
      userAgent: session.user_agent,
      expiresAt: new Date(session.expires_at),
      createdAt: new Date(session.created_at),
      lastActivity: new Date(session.last_activity)
    }))
  }
}