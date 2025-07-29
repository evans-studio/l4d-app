import { NextResponse, type NextRequest } from 'next/server'
import { createServerClient } from '@supabase/ssr'

export async function middleware(request: NextRequest) {
  const path = request.nextUrl.pathname
  const response = NextResponse.next()

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
    '/api/booking/slots',
    '/api/booking/calculate-price',
    '/api/booking/validate-user',
    '/api/booking/create',
    '/api/auth/register',
    '/api/auth/login',
    '/api/admin/cleanup-users',
    '/api/admin/simple-cleanup',
    '/api/admin/direct-cleanup',
    '/api/admin/drop-enterprise-tables'
  ]

  // Skip auth check for public routes
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

  // Get current session
  const { data: { session }, error } = await supabase.auth.getSession()

  // Handle API routes - require authentication
  if (path.startsWith('/api/')) {
    if (!session?.user) {
      return NextResponse.json(
        { success: false, error: { message: 'Authentication required', code: 'UNAUTHORIZED' } },
        { status: 401 }
      )
    }

    // Get user profile for role information
    const { data: profile } = await supabase
      .from('user_profiles')
      .select('role')
      .eq('id', session.user.id)
      .single()

    // Add user context to response headers for API routes
    response.headers.set('x-user-id', session.user.id)
    response.headers.set('x-user-role', profile?.role || 'customer')

    return response
  }

  // Handle page routes - redirect to login if not authenticated
  if (!session?.user) {
    return NextResponse.redirect(new URL('/auth/login', request.url))
  }

  // Get user profile for role-based routing
  const { data: profile } = await supabase
    .from('user_profiles')
    .select('role')
    .eq('id', session.user.id)
    .single()

  const userRole = profile?.role || 'customer'

  // Role-based access control
  if (path.startsWith('/admin/')) {
    if (userRole !== 'admin' && userRole !== 'super_admin') {
      return NextResponse.redirect(new URL('/dashboard', request.url))
    }
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