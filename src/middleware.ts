import { NextResponse, type NextRequest } from 'next/server'

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

  // For protected routes, check for Supabase auth cookies
  const authCookies = request.cookies.getAll().filter(c => 
    c.name.includes('supabase') || c.name.includes('sb-')
  )

  // If no auth cookies, redirect to login
  if (authCookies.length === 0) {
    console.log('No auth cookies found, redirecting to login')
    return NextResponse.redirect(new URL('/auth/login', request.url))
  }

  // Allow access - authentication will be handled by individual pages
  return response
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}