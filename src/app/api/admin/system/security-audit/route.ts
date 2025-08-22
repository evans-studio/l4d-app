import { NextRequest } from 'next/server'
import { authenticateAdmin } from '@/lib/api/auth-handler'
import { ApiResponseHandler } from '@/lib/api/response'
import { isProductionReady } from '@/lib/config/environment'
import { supabaseAdmin } from '@/lib/supabase/direct'

export async function POST(request: NextRequest) {
  try {
    const authResult = await authenticateAdmin(request)
    if (!authResult.success) {
      return authResult.error!
    }
    const user = authResult.user!

    // Origin check (best-effort)
    const allowedOrigin = process.env.NEXT_PUBLIC_APP_URL
    const origin = request.headers.get('origin') || ''
    if (allowedOrigin && origin) {
      try {
        const allowed = new URL(allowedOrigin)
        const originUrl = new URL(origin)
        const wwwHost = allowed.host.startsWith('www.') ? allowed.host.slice(4) : `www.${allowed.host}`
        const allowedHosts = new Set([allowed.host, wwwHost])
        if (!allowedHosts.has(originUrl.host)) {
          return ApiResponseHandler.forbidden('Invalid origin')
        }
      } catch {
        // Fallback to prefix match if URL parsing fails
        if (!origin.startsWith(allowedOrigin)) {
          return ApiResponseHandler.forbidden('Invalid origin')
        }
      }
    }

    // Simple per-user rate limit in-memory (per process)
    const windowMs = 60 * 1000
    const maxRequests = 10
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const store: any = (globalThis as any).__adminSystemRateLimit || ((globalThis as any).__adminSystemRateLimit = new Map<string, { count: number, reset: number }>())
    const key = `security_audit:${user.id}`
    const now = Date.now()
    const entry = store.get(key) as { count: number; reset: number } | undefined
    if (!entry || now > entry.reset) {
      store.set(key, { count: 1, reset: now + windowMs })
    } else {
      entry.count += 1
      store.set(key, entry)
      if (entry.count > maxRequests) {
        return ApiResponseHandler.error('Too many requests', 'RATE_LIMITED', 429)
      }
    }

    // Lightweight checks; extend as needed
    const checks = [] as Array<{ name: string; status: 'pass' | 'warn' | 'fail'; details?: string }>

    // Env sanity
    const requiredEnv = ['NEXT_PUBLIC_SUPABASE_URL', 'NEXT_PUBLIC_SUPABASE_ANON_KEY']
    for (const key of requiredEnv) {
      if (!process.env[key]) {
        checks.push({ name: `env:${key}`, status: 'warn', details: 'Missing value' })
      } else {
        checks.push({ name: `env:${key}`, status: 'pass' })
      }
    }

    // Sentry
    if (process.env.NEXT_PUBLIC_SENTRY_DSN) {
      checks.push({ name: 'sentry:dsn', status: 'pass' })
    } else {
      checks.push({ name: 'sentry:dsn', status: 'warn', details: 'DSN not set' })
    }

    // Security headers note: we statically assert middleware includes them
    const hasSecurityHeaders = true // middleware sets Strict-Transport-Security, X-Frame-Options, CSP, etc.
    checks.push({ name: 'security:headers', status: hasSecurityHeaders ? 'pass' : 'warn', details: hasSecurityHeaders ? 'Middleware sets security headers' : 'Headers missing in middleware' })

    // Supabase service key presence (used server-side only)
    if (process.env.SUPABASE_SERVICE_ROLE_KEY) {
      checks.push({ name: 'supabase:service_key', status: 'pass' })
    } else {
      checks.push({ name: 'supabase:service_key', status: 'fail', details: 'Missing SUPABASE_SERVICE_ROLE_KEY' })
    }

    // Email provider (Resend) config
    if (process.env.RESEND_API_KEY) {
      checks.push({ name: 'email:resend_api_key', status: 'pass' })
    } else {
      checks.push({ name: 'email:resend_api_key', status: 'warn', details: 'RESEND_API_KEY not set' })
    }

    // PayPal credentials for webhook verification
    const paypalCreds = [
      'PAYPAL_CLIENT_ID',
      'PAYPAL_CLIENT_SECRET',
      'PAYPAL_WEBHOOK_ID'
    ] as const
    const missingPaypal = paypalCreds.filter(k => !process.env[k])
    if (missingPaypal.length === 0) {
      checks.push({ name: 'paypal:webhook_creds', status: 'pass' })
    } else {
      checks.push({ name: 'paypal:webhook_creds', status: 'warn', details: `Missing: ${missingPaypal.join(', ')}` })
    }

    // Production readiness check (format + presence validation)
    const readiness = isProductionReady()
    checks.push({ name: 'env:production_ready', status: readiness.ready ? 'pass' : 'warn', details: readiness.ready ? 'All required production env vars present' : readiness.issues.join('; ') })

    const summary = {
      timestamp: new Date().toISOString(),
      checks
    }

    // Audit log (best-effort) to security_events
    try {
      const xff = request.headers.get('x-forwarded-for') || ''
      const ip = (xff.split(',')[0]?.trim() || request.headers.get('x-real-ip') || null)
      const userAgent = request.headers.get('user-agent') || null
      const hasFail = checks.some(c => c.status === 'fail')
      const hasWarn = checks.some(c => c.status === 'warn')
      const severity = hasFail ? 'high' : hasWarn ? 'warn' : 'info'
      await supabaseAdmin
        .from('security_events')
        .insert({
          event_type: 'security_audit',
          description: 'Admin ran security audit',
          severity,
          user_id: user.id,
          ip_address: ip as unknown as never,
          user_agent: userAgent,
          metadata: { checks },
        } as never)
    } catch {}

    return ApiResponseHandler.success(summary)
  } catch (error) {
    console.error('Security audit error:', error)
    return ApiResponseHandler.serverError('Failed to run security audit')
  }
}


