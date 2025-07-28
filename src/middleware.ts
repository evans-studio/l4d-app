import { NextResponse, type NextRequest } from 'next/server'
import { createClient } from '@/lib/supabase/middleware'

export async function middleware(request: NextRequest) {
  const response = NextResponse.next()
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
    '/component-showcase',
    '/dashboard-bypass',
    '/dashboard-test',
    '/dashboard-simple',
    '/auth/login-redirect-test'
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
    '/api/debug/cookies'
  ]

  // Skip auth check for public routes
  if (publicRoutes.includes(path)) {
    return response
  }

  // Skip auth check for public API routes
  if (publicApiRoutes.some(route => path.startsWith(route))) {
    return response
  }

  // For protected routes and API routes, validate the session
  const supabase = createClient(request, response)

  try {
    // Get the session and refresh if needed
    const { data: { session }, error } = await supabase.auth.getSession()

    // If it's an API route and no valid session, return 401
    if (path.startsWith('/api/')) {
      if (error || !session?.user) {
        console.log('API route authentication failed:', { path, error: error?.message })
        return NextResponse.json(
          { 
            success: false, 
            error: { 
              message: 'Authentication required', 
              code: 'UNAUTHORIZED' 
            },
            metadata: { timestamp: new Date().toISOString() }
          }, 
          { status: 401 }
        )
      }
      
      // Valid session, allow API access
      return response
    }

    // For protected pages, redirect to login if no session
    if (error || !session?.user) {
      console.log('Page authentication failed, redirecting to login:', { path, error: error?.message })
      return NextResponse.redirect(new URL('/auth/login', request.url))
    }

    // Valid session, allow page access
    return response

  } catch (error) {
    console.error('Middleware authentication error:', error)
    
    // If it's an API route, return 401
    if (path.startsWith('/api/')) {
      return NextResponse.json(
        { 
          success: false, 
          error: { 
            message: 'Authentication error', 
            code: 'AUTH_ERROR' 
          },
          metadata: { timestamp: new Date().toISOString() }
        }, 
        { status: 401 }
      )
    }
    
    // If it's a page, redirect to login
    return NextResponse.redirect(new URL('/auth/login', request.url))
  }
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}