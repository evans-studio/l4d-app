import { createClient } from '@/lib/supabase/server'
import { supabaseAdmin } from '@/lib/supabase/direct'

export interface RateLimitResult {
  allowed: boolean
  remaining: number
  resetAt: number
  attempts: number
  blockedUntil?: number
}

export class RateLimiter {
  private static readonly limits = {
    login: { window: 15, max: 5 }, // 5 attempts per 15 minutes
    refresh: { window: 60, max: 20 }, // 20 refreshes per hour
    api: { window: 1, max: 100 }, // 100 requests per minute
    register: { window: 60, max: 3 }, // 3 registrations per hour
    password_reset: { window: 60, max: 3 } // 3 password resets per hour
  } as const

  /**
   * Check rate limit for an identifier and action
   */
  static async checkLimit(
    identifier: string,
    action: keyof typeof this.limits
  ): Promise<RateLimitResult> {
    try {
      // Use admin client to bypass RLS for system operations
      const supabase = supabaseAdmin
      const limit = RateLimiter.limits[action]

      // Call the database function to check/update rate limit
      const { data, error } = await supabase.rpc('check_rate_limit', {
        identifier_param: identifier,
        action_type_param: action,
        max_attempts: limit.max,
        window_minutes: limit.window
      })

      if (error) {
        console.error('Rate limit check error:', error)
        // On error, allow the request but log it
        return {
          allowed: true,
          remaining: limit.max,
          resetAt: Date.now() + (limit.window * 60 * 1000),
          attempts: 0
        }
      }

      const result = data as {
        allowed: boolean
        attempts: number
        remaining: number
        blocked_until: string | null
        reset_at: string
      }

      return {
        allowed: result.allowed,
        remaining: Math.max(0, result.remaining),
        resetAt: new Date(result.reset_at).getTime(),
        attempts: result.attempts,
        blockedUntil: result.blocked_until ? new Date(result.blocked_until).getTime() : undefined
      }

    } catch (error) {
      console.error('Rate limiter error:', error)
      // On error, allow the request
      const limit = RateLimiter.limits[action]
      return {
        allowed: true,
        remaining: limit.max,
        resetAt: Date.now() + (limit.window * 60 * 1000),
        attempts: 0
      }
    }
  }

  /**
   * Check multiple rate limits at once
   */
  static async checkMultipleLimits(
    checks: Array<{ identifier: string; action: keyof typeof RateLimiter.limits }>
  ): Promise<{ [key: string]: RateLimitResult }> {
    const results: { [key: string]: RateLimitResult } = {}

    // Run all checks in parallel
    const promises = checks.map(async (check) => {
      const key = `${check.action}:${check.identifier}`
      results[key] = await this.checkLimit(check.identifier, check.action)
    })

    await Promise.all(promises)
    return results
  }

  /**
   * Reset rate limit for an identifier and action
   */
  static async resetLimit(
    identifier: string,
    action: keyof typeof RateLimiter.limits
  ): Promise<void> {
    try {
      // Use admin client to bypass RLS for system operations
      const supabase = supabaseAdmin

      await supabase
        .from('rate_limits')
        .delete()
        .eq('identifier', identifier)
        .eq('action_type', action)

    } catch (error) {
      console.error('Rate limit reset error:', error)
    }
  }

  /**
   * Get current rate limit status without incrementing
   */
  static async getStatus(
    identifier: string,
    action: keyof typeof RateLimiter.limits
  ): Promise<RateLimitResult | null> {
    try {
      // Use admin client to bypass RLS for system operations
      const supabase = supabaseAdmin
      const limit = RateLimiter.limits[action]

      const { data: rateLimitRecord, error } = await supabase
        .from('rate_limits')
        .select('*')
        .eq('identifier', identifier)
        .eq('action_type', action)
        .single()

      if (error || !rateLimitRecord) {
        return {
          allowed: true,
          remaining: limit.max,
          resetAt: Date.now() + (limit.window * 60 * 1000),
          attempts: 0
        }
      }

      const windowStart = new Date(rateLimitRecord.window_start).getTime()
      const now = Date.now()
      const windowEnd = windowStart + (limit.window * 60 * 1000)

      // Check if window has expired
      if (now > windowEnd) {
        return {
          allowed: true,
          remaining: limit.max,
          resetAt: now + (limit.window * 60 * 1000),
          attempts: 0
        }
      }

      const isBlocked = rateLimitRecord.blocked_until && 
        new Date(rateLimitRecord.blocked_until).getTime() > now

      return {
        allowed: !isBlocked && rateLimitRecord.attempts <= limit.max,
        remaining: Math.max(0, limit.max - rateLimitRecord.attempts),
        resetAt: windowEnd,
        attempts: rateLimitRecord.attempts,
        blockedUntil: rateLimitRecord.blocked_until ? 
          new Date(rateLimitRecord.blocked_until).getTime() : undefined
      }

    } catch (error) {
      console.error('Rate limit status check error:', error)
      return null
    }
  }

  /**
   * Clean up old rate limit records
   */
  static async cleanup(): Promise<number> {
    try {
      // Use admin client to bypass RLS for system operations
      const supabase = supabaseAdmin

      // Remove records older than 24 hours
      const { data } = await supabase
        .from('rate_limits')
        .delete()
        .lt('window_start', new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString())
        .select('id')

      return data?.length || 0

    } catch (error) {
      console.error('Rate limit cleanup error:', error)
      return 0
    }
  }

  /**
   * Get rate limit configuration
   */
  static getLimitConfig(action: keyof typeof RateLimiter.limits) {
    return RateLimiter.limits[action]
  }

  /**
   * Block an identifier for a specific duration
   */
  static async blockIdentifier(
    identifier: string,
    action: keyof typeof RateLimiter.limits,
    durationMinutes: number = 60
  ): Promise<void> {
    try {
      // Use admin client to bypass RLS for system operations
      const supabase = supabaseAdmin
      const blockedUntil = new Date(Date.now() + (durationMinutes * 60 * 1000))
      const limit = RateLimiter.limits[action]

      await supabase
        .from('rate_limits')
        .upsert({
          identifier,
          action_type: action,
          attempts: limit.max + 1, // Exceed limit
          window_start: new Date().toISOString(),
          blocked_until: blockedUntil.toISOString()
        })

    } catch (error) {
      console.error('Identifier blocking error:', error)
    }
  }

  /**
   * Unblock an identifier
   */
  static async unblockIdentifier(
    identifier: string,
    action: keyof typeof RateLimiter.limits
  ): Promise<void> {
    try {
      // Use admin client to bypass RLS for system operations
      const supabase = supabaseAdmin

      await supabase
        .from('rate_limits')
        .update({ blocked_until: null })
        .eq('identifier', identifier)
        .eq('action_type', action)

    } catch (error) {
      console.error('Identifier unblocking error:', error)
    }
  }

  /**
   * Get blocked identifiers
   */
  static async getBlockedIdentifiers(
    action?: keyof typeof RateLimiter.limits
  ): Promise<Array<{
    identifier: string
    action: string
    blockedUntil: Date
    attempts: number
  }>> {
    try {
      // Use admin client to bypass RLS for system operations
      const supabase = supabaseAdmin
      
      let query = supabase
        .from('rate_limits')
        .select('*')
        .not('blocked_until', 'is', null)
        .gt('blocked_until', new Date().toISOString())

      if (action) {
        query = query.eq('action_type', action)
      }

      const { data, error } = await query

      if (error || !data) {
        return []
      }

      return data.map(record => ({
        identifier: record.identifier,
        action: record.action_type,
        blockedUntil: new Date(record.blocked_until),
        attempts: record.attempts
      }))

    } catch (error) {
      console.error('Get blocked identifiers error:', error)
      return []
    }
  }
}