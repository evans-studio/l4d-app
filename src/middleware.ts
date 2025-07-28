import { NextResponse, type NextRequest } from 'next/server'
import { AuthMiddleware } from '@/lib/auth/auth-middleware'

export async function middleware(request: NextRequest) {
  const path = request.nextUrl.pathname

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
    '/api/auth/reset-password',
    '/api/auth/verify-email',
    '/api/debug/auth-status',
    '/api/debug/test-session-creation',
    '/api/debug/test-login',
    '/api/debug/env-check',
    '/api/admin/cleanup-users',
    '/api/admin/simple-cleanup',
    '/api/admin/direct-cleanup',
    '/api/auth/enterprise/register'
  ]

  // Skip auth check for public routes
  if (publicRoutes.includes(path)) {
    return NextResponse.next()
  }

  // Skip auth check for public API routes
  if (publicApiRoutes.some(route => path.startsWith(route))) {
    return NextResponse.next()
  }

  // Rate limiting for auth endpoints
  if (path.startsWith('/api/auth/')) {
    const clientIP = AuthMiddleware.getClientIP(request)
    const rateLimit = await AuthMiddleware.checkRateLimit(clientIP, 'api')
    
    if (!rateLimit.allowed) {
      return AuthMiddleware.createRateLimitResponse(rateLimit)
    }
  }

  // Enterprise authentication for protected routes
  const authResult = await AuthMiddleware.authenticate(request)

  // Handle API routes
  if (path.startsWith('/api/')) {
    if (!authResult.success) {
      return AuthMiddleware.createErrorResponse(
        authResult.error || { message: 'Authentication required', code: 'UNAUTHORIZED' },
        401
      )
    }

    // Create response with user context
    const response = NextResponse.next()
    
    // Add user context to response headers for API routes to access
    response.headers.set('x-user-id', authResult.user!.id)
    response.headers.set('x-user-role', authResult.user!.role)
    response.headers.set('x-session-id', authResult.session!.id)

    // If we have new tokens from refresh, set them in cookies
    if (authResult.newTokens) {
      AuthMiddleware.setAuthCookies(response, {
        accessToken: authResult.newTokens.accessToken,
        refreshToken: authResult.newTokens.refreshToken,
        expiresIn: authResult.newTokens.expiresIn,
        refreshExpiresIn: 7 * 24 * 60 * 60 // 7 days
      })
    }

    return response
  }

  // Handle page routes
  if (!authResult.success) {
    // Clear any invalid cookies
    const response = NextResponse.redirect(new URL('/auth/login', request.url))
    AuthMiddleware.clearAuthCookies(response)
    return response
  }

  // Check role-based access for admin routes
  if (path.startsWith('/admin/')) {
    if (!AuthMiddleware.isAdmin(authResult.user!.role)) {
      return NextResponse.redirect(new URL('/dashboard', request.url))
    }
  }

  // Create successful response
  const response = NextResponse.next()

  // If we have new tokens from refresh, set them in cookies
  if (authResult.newTokens) {
    AuthMiddleware.setAuthCookies(response, {
      accessToken: authResult.newTokens.accessToken,
      refreshToken: authResult.newTokens.refreshToken,
      expiresIn: authResult.newTokens.expiresIn,
      refreshExpiresIn: 7 * 24 * 60 * 60 // 7 days
    })
  }

  return response
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}