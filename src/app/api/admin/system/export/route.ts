import { NextRequest } from 'next/server'
import { authenticateAdmin } from '@/lib/api/auth-handler'
import { ApiResponseHandler } from '@/lib/api/response'
import { supabaseAdmin } from '@/lib/supabase/direct'
import { logger } from '@/lib/utils/logger'

export async function GET(request: NextRequest) {
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
        if (!origin.startsWith(allowedOrigin)) {
          return ApiResponseHandler.forbidden('Invalid origin')
        }
      }
    }

    // Simple per-user rate limit in-memory (per process)
    const windowMs = 60 * 1000
    const maxRequests = 5
    const g = globalThis as unknown as { __adminSystemRateLimit?: Map<string, { count: number; reset: number }> }
    const store = g.__adminSystemRateLimit ?? (g.__adminSystemRateLimit = new Map<string, { count: number, reset: number }>())
    const key = `system_export:${user.id}`
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

    const supabase = supabaseAdmin

    const [bookings, customers, services, categories, vehicleSizes] = await Promise.all([
      supabase.from('bookings').select('*'),
      supabase.from('user_profiles').select('*'),
      supabase.from('services').select('*'),
      supabase.from('service_categories').select('*'),
      supabase.from('vehicle_sizes').select('*')
    ])

    const anyError = bookings.error || customers.error || services.error || categories.error || vehicleSizes.error
    if (anyError) {
      logger.error('System export error:', anyError)
      return ApiResponseHandler.serverError('Failed to export data')
    }

    const payload = {
      exported_at: new Date().toISOString(),
      bookings: bookings.data || [],
      customers: customers.data || [],
      services: services.data || [],
      service_categories: categories.data || [],
      vehicle_sizes: vehicleSizes.data || []
    }

    // Audit log (best-effort) to security_events
    try {
      const xff = request.headers.get('x-forwarded-for') || ''
      const ip = (xff.split(',')[0]?.trim() || request.headers.get('x-real-ip') || null)
      const userAgent = request.headers.get('user-agent') || null
      await supabase
        .from('security_events')
        .insert({
          event_type: 'system_export',
          description: 'Admin exported system data',
          severity: 'info',
          user_id: user.id,
          ip_address: ip as unknown as never,
          user_agent: userAgent,
          metadata: {
            counts: {
              bookings: (bookings.data || []).length,
              customers: (customers.data || []).length,
              services: (services.data || []).length,
            }
          },
        } as never)
    } catch {}

    return new Response(JSON.stringify({ success: true, data: payload }), {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        'Content-Disposition': `attachment; filename="system-export-${new Date().toISOString().slice(0,10)}.json"`
      }
    })
  } catch (error) {
    logger.error('System export exception:', error instanceof Error ? error : undefined)
    return ApiResponseHandler.serverError('Failed to export data')
  }
}


