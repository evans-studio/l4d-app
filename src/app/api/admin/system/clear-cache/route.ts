import { NextRequest } from 'next/server'
import { authenticateAdmin } from '@/lib/api/auth-handler'
import { ApiResponseHandler } from '@/lib/api/response'
import { revalidatePath, revalidateTag } from 'next/cache'
import { supabaseAdmin } from '@/lib/supabase/direct'
import { logger } from '@/lib/utils/logger'

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
        if (!origin.startsWith(allowedOrigin)) {
          return ApiResponseHandler.forbidden('Invalid origin')
        }
      }
    }

    // Simple per-user rate limit in-memory (per process)
    const windowMs = 60 * 1000
    const maxRequests = 20
    const g = globalThis as unknown as { __adminSystemRateLimit?: Map<string, { count: number; reset: number }> }
    const store = g.__adminSystemRateLimit ?? (g.__adminSystemRateLimit = new Map<string, { count: number, reset: number }>())
    const key = `clear_cache:${user.id}`
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

    // Optional: accept JSON body with paths/tags
    let body: { paths?: string[]; tags?: string[] } | undefined
    try {
      body = await request.json()
    } catch {
      body = undefined
    }

    const paths = body?.paths || ['/','/admin','/dashboard']
    const tags = body?.tags || []

    for (const p of paths) revalidatePath(p)
    for (const t of tags) revalidateTag(t)

    // Audit log (best-effort) to security_events
    try {
      const xff = request.headers.get('x-forwarded-for') || ''
      const ipCandidate = xff ? xff.split(',')[0]?.trim() : ''
      const ip = (ipCandidate || request.headers.get('x-real-ip') || null) as string | null
      const userAgent = request.headers.get('user-agent') || null
      await supabaseAdmin
        .from('security_events')
        .insert({
          event_type: 'clear_cache',
          description: 'Admin cleared cache',
          severity: 'info',
          user_id: user.id,
          ip_address: ip as unknown as never,
          user_agent: userAgent,
          metadata: { revalidated: { paths, tags } },
        } as never)
    } catch {}

    return ApiResponseHandler.success({ revalidated: { paths, tags } }, 'Cache cleared')
  } catch (error) {
    logger.error('Clear cache error:', error instanceof Error ? error : undefined)
    return ApiResponseHandler.serverError('Failed to clear cache')
  }
}


