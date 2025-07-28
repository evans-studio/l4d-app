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
    '/component-showcase'
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
    
    console.log('Middleware auth check:', {
      path,
      hasSession: !!session,
      hasUser: !!session?.user,
      userId: session?.user?.id,
      error: error?.message,
      cookies: request.cookies.getAll().map(c => c.name)
    })
    
    if (error) {
      console.error('Middleware auth error:', error)
      return NextResponse.redirect(new URL('/auth/login', request.url))
    }

    // No session found - check for auth cookies before redirecting
    if (!session) {
      console.log('Middleware: No session found')
      
      // Check if we have any Supabase auth cookies 
      const authCookies = request.cookies.getAll().filter(c => 
        c.name.includes('supabase') || c.name.includes('sb-')
      )
      
      if (authCookies.length > 0) {
        console.log('Found auth cookies but no session - allowing access:', authCookies.map(c => c.name))
        // Allow access if auth cookies exist (session might be loading)
        return response
      } else {
        console.log('No auth cookies found, redirecting to login')
        return NextResponse.redirect(new URL('/auth/login', request.url))
      }
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