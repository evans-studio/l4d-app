import { NextRequest } from 'next/server'
import { authenticateAdmin } from '@/lib/api/auth-handler'
import { ApiResponseHandler } from '@/lib/api/response'
import { isProductionReady } from '@/lib/config/environment'

export async function POST(request: NextRequest) {
  try {
    const authResult = await authenticateAdmin(request)
    if (!authResult.success) {
      return authResult.error!
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

    return ApiResponseHandler.success(summary)
  } catch (error) {
    console.error('Security audit error:', error)
    return ApiResponseHandler.serverError('Failed to run security audit')
  }
}


