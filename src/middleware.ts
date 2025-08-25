import { NextResponse, type NextRequest } from 'next/server'
// Server Sentry is initialized via app/instrumentation.ts
import { createServerClient } from '@supabase/ssr'
import { logger } from '@/lib/utils/logger'

export async function middleware(request: NextRequest) {
  const path = request.nextUrl.pathname
  const response = NextResponse.next()

  // Security Headers applied to every response
  const securityHeaders: Record<string, string> = {
    'Strict-Transport-Security': 'max-age=63072000; includeSubDomains; preload',
    'X-Frame-Options': 'DENY',
    'X-Content-Type-Options': 'nosniff',
    'Referrer-Policy': 'strict-origin-when-cross-origin',
    // Allow required domains; adjust if additional CDNs/providers used
    'Content-Security-Policy': [
      "default-src 'self'",
      "img-src 'self' data: blob: https:",
      "script-src 'self' 'unsafe-inline' 'unsafe-eval' https:",
      "style-src 'self' 'unsafe-inline' https:",
      "connect-src 'self' https: http:",
      "font-src 'self' data: https:",
      "frame-ancestors 'none'",
    ].join('; '),
    // A conservative baseline; enable specific features as needed
    'Permissions-Policy': [
      'geolocation=()','microphone=()','camera=()','payment=()','fullscreen=(self)'
    ].join(', '),
  }
  Object.entries(securityHeaders).forEach(([k, v]) => response.headers.set(k, v))

  // Public routes that don't require authentication
  const publicRoutes = [
    '/',
    '/auth/login',
    '/auth/register', 
    '/auth/forgot-password',
    '/auth/reset-password',
    '/auth/verify-email',
    '/auth/callback',
    '/book',
    '/booking-policies',
    '/brand-showcase',
    '/component-library',
    '/component-showcase'
  ]

  // Public API routes that don't require authentication
  const publicApiRoutes = [
    '/api/services',
    '/api/services/homepage',
    '/api/vehicle-sizes',
    '/api/vehicle-data',
    '/api/time-slots/availability',
    
    '/api/booking/calculate-price',
    '/api/booking/validate-user',
    '/api/bookings/create',
    '/api/auth/register',
    '/api/auth/forgot-password',
    '/api/auth/reset-password',
    '/api/auth/login',
    // Removed dev-only admin maintenance routes from public list
    '/api/admin/stats',
    '/api/admin/bookings/recent',
    '/api/admin/bookings/all',
    '/api/admin/bookings',
    '/api/debug/auth-status'
    // Note: /api/bookings/create now public to support new user bookings
    // Note: /api/booking/validate-user now public to support new user validation
    // - /api/booking/create (deprecated, use /api/bookings/create)
    // - /api/auth/setup-password (deprecated)
  ]

  // Special handling for auth routes: if already authenticated, redirect away to avoid flicker
  if (path.startsWith('/auth/')) {
    try {
      const supabase = createServerClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        {
          cookies: {
            get(name: string) {
              return request.cookies.get(name)?.value
            },
            set(name: string, value: string, options: any) {
              response.cookies.set(name, value, options)
            },
            remove(name: string, options: any) {
              response.cookies.set(name, '', { ...options, maxAge: 0 })
            },
          },
        }
      )

      const { data: { user } } = await supabase.auth.getUser()
      const isVerified = user && user.email_confirmed_at

      if (isVerified) {
        // If a redirect param is present, honor it to preserve the exact page
        const redirectTarget = request.nextUrl.searchParams.get('redirect')
        if (redirectTarget && redirectTarget.startsWith('/')) {
          return NextResponse.redirect(new URL(redirectTarget, request.url))
        }

        // Determine role to choose destination
        const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY
        const supabaseService = createServerClient(
          process.env.NEXT_PUBLIC_SUPABASE_URL!,
          serviceKey!,
          {
            cookies: { get: () => null, set: () => {}, remove: () => {} },
            auth: { autoRefreshToken: false, persistSession: false }
          }
        )

        const { data: profile } = await supabaseService
          .from('user_profiles')
          .select('role')
          .eq('id', user.id)
          .single()

        const userRole = profile?.role || 'customer'
        const dest = (userRole === 'admin' || userRole === 'super_admin') ? '/admin' : '/dashboard'
        return NextResponse.redirect(new URL(dest, request.url))
      }
    } catch (_) {
      // Fail-open to the auth page if any issue occurs
    }
    return response
  }

  // Skip auth check for other public routes
  if (publicRoutes.includes(path)) {
    return response
  }

  // Skip auth check for public API routes
  if (publicApiRoutes.some(route => path.startsWith(route))) {
    return response
  }

  // Create Supabase client for server-side auth
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return request.cookies.get(name)?.value
        },
        set(name: string, value: string, options: any) {
          response.cookies.set(name, value, options)
        },
        remove(name: string, options: any) {
          response.cookies.set(name, '', { ...options, maxAge: 0 })
        },
      },
    }
  )

  // Get current user (more secure than getSession)
  const { data: { user }, error } = await supabase.auth.getUser()
  
  // Only consider users with verified emails as authenticated
  const isVerified = user && user.email_confirmed_at
  
  // Create service client for profile lookup (bypasses RLS completely)
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!serviceKey) {
    logger.error('SUPABASE_SERVICE_ROLE_KEY is not defined in middleware!')
  }
  
  const supabaseService = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    serviceKey!,
    {
      cookies: {
        get: () => null,  // No cookies for service client
        set: () => {},    // No cookie setting
        remove: () => {}  // No cookie removal
      },
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    }
  )

  // Handle API routes - basic rate limit + require verified authentication
  if (path.startsWith('/api/')) {
    try {
      const ipHeader = request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || ''
      const ip = ipHeader.split(',')[0]?.trim() || 'unknown'
      const key = `${ip}:global`
      const now = Date.now()
      const windowMs = 5 * 60 * 1000 // 5 minutes
      const maxRequests = 200
      // Use global store to persist within a single server process
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const store: any = (globalThis as any).__rateLimitStore || ((globalThis as any).__rateLimitStore = new Map<string, { count: number, reset: number }>())
      const entry = store.get(key) as { count: number, reset: number } | undefined
      if (!entry || now > entry.reset) {
        store.set(key, { count: 1, reset: now + windowMs })
      } else {
        entry.count += 1
        store.set(key, entry)
        if (entry.count > maxRequests) {
          return NextResponse.json({ success: false, error: { message: 'Too many requests', code: 'RATE_LIMITED' } }, { status: 429 })
        }
      }
    } catch (_) {
      // Fail-open on rate limit storage issues
    }
    if (!isVerified) {
      return NextResponse.json(
        { success: false, error: { message: 'Email verification required', code: 'EMAIL_NOT_VERIFIED' } },
        { status: 401 }
      )
    }

    // Get user profile for role information using service client (bypasses RLS)
    const { data: profile, error: profileError } = await supabaseService
      .from('user_profiles')
      .select('role')  
      .eq('id', user.id)
      .single()
      
    if (profileError) {
      logger.error('Middleware API profile fetch error', profileError, {
        userId: user.id,
        errorCode: profileError.code
      })
      
      // If we get infinite recursion error, return 500 to prevent further issues
      if (profileError.code === '42P17') {
        return NextResponse.json({
          success: false, 
          error: { message: 'Database configuration error - please contact administrator', code: 'DB_CONFIG_ERROR' }
        }, { status: 500 })
      }
    }

    // Add user context to response headers for API routes
    response.headers.set('x-user-id', user.id)
    response.headers.set('x-user-role', profile?.role || 'customer')

    return response
  }

  // Handle page routes - redirect to login if not authenticated
  if (!isVerified) {
    const loginUrl = new URL('/auth/login', request.url)
    loginUrl.searchParams.set('redirect', request.nextUrl.pathname + request.nextUrl.search)
    return NextResponse.redirect(loginUrl)
  }

  // Get user profile for role-based routing using service client (bypasses RLS)
  const { data: profile, error: profileError } = await supabaseService
    .from('user_profiles')
    .select('role')
    .eq('id', user.id)
    .single()
    
  if (profileError) {
    logger.error('Middleware profile fetch error', profileError, {
      userId: user.id,
      errorCode: profileError.code
    })
    
    // If we get infinite recursion error, redirect to a safe page
    if (profileError.code === '42P17') {
      logger.error('Database RLS recursion detected - redirecting to login for safety')
      return NextResponse.redirect(new URL('/auth/login?error=db-config', request.url))
    }
  }

  const userRole = profile?.role || 'customer'
  
  // Debug: Log the role information (dev only)
  logger.debug('Middleware role check', {
    userId: user.id,
    email: user.email,
    profileData: profile,
    userRole,
    path,
    isAdminPath: path.startsWith('/admin/')
  })

  // Role-based access control
  if (path.startsWith('/admin/')) {
    // Temporarily bypass middleware check - let AdminRoute handle it
    logger.debug('Middleware: Temporarily bypassing admin check', { userRole })
    
    // if (userRole !== 'admin' && userRole !== 'super_admin') {
    //   logger.debug('Middleware: Redirecting to dashboard - role not allowed', { userRole })
    //   return NextResponse.redirect(new URL('/dashboard', request.url))
    // }
    
    logger.debug('Middleware: Admin access granted (bypassed)', { userRole })
  }

  // If user is admin trying to access /dashboard, redirect to /admin
  if (path.startsWith('/dashboard/') && (userRole === 'admin' || userRole === 'super_admin')) {
    return NextResponse.redirect(new URL('/admin', request.url))
  }

  return response
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}