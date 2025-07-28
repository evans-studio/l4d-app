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
    '/tailwind-test',
    '/tailwind-verify',
    '/simple-test',
    '/simple-tailwind-test',
    '/debug-tailwind',
    '/component-test',
    '/test-api'
  ]

  // Skip auth check for public routes and API routes
  if (publicRoutes.includes(path) || path.startsWith('/api/')) {
    return response
  }

  try {
    // Create SSR client to properly handle session cookies
    const supabase = createClient(request, response)
    
    // Get session from cookies
    const { data: { session }, error } = await supabase.auth.getSession()
    
    if (error) {
      console.error('Middleware auth error:', error)
      return NextResponse.redirect(new URL('/auth/login', request.url))
    }

    // No session found - redirect to login
    if (!session) {
      console.log('Middleware: No session found, redirecting to login')
      return NextResponse.redirect(new URL('/auth/login', request.url))
    }

    // Admin routes require admin role
    if (path.startsWith('/admin')) {
      // Get user profile to check role
      const { data: profile } = await supabase
        .from('user_profiles')
        .select('role')
        .eq('id', session.user.id)
        .single()

      if (!profile || !['admin', 'super_admin'].includes(profile.role)) {
        console.log('Middleware: Non-admin trying to access admin route')
        return NextResponse.redirect(new URL('/dashboard', request.url))
      }
    }

    console.log('Middleware: Valid session, allowing access to:', path)
    return response

  } catch (error) {
    console.error('Middleware error:', error)
    return NextResponse.redirect(new URL('/auth/login', request.url))
  }
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}