import { NextResponse, type NextRequest } from 'next/server'

export async function middleware(request: NextRequest) {
  const response = NextResponse.next()
  
  // Get all cookies and filter for Supabase auth cookies
  const allCookies = request.cookies.getAll()
  const supabaseCookies = allCookies.filter(c => 
    c.name.startsWith('sb-') && c.name.includes('auth-token')
  )
  
  // Look for the main session cookies that Supabase typically uses
  const sessionCookies = allCookies.filter(c => 
    c.name.includes('auth-token') && 
    !c.name.includes('code-verifier') &&
    c.value && c.value.length > 10 // Valid tokens should be substantial
  )
  
  // Check for valid session indicators
  const hasValidSession = sessionCookies.length > 0 || 
    supabaseCookies.some(c => c.value && c.value.length > 50) // JWT tokens are long
  
  const isAuthenticated = hasValidSession
  const path = request.nextUrl.pathname

  // Only log for auth and dashboard routes to avoid spam
  if (path.startsWith('/auth/') || path.startsWith('/dashboard')) {
    console.log('Middleware check:', {
      path,
      isAuthenticated,
      hasValidSession,
      sessionCookieCount: sessionCookies.length,
      supabaseCookieCount: supabaseCookies.length,
      cookieNames: supabaseCookies.map(c => c.name)
    })
  }

  // Redirect authenticated users away from auth pages (except callback)
  if (path.startsWith('/auth/') && !path.startsWith('/auth/callback') && isAuthenticated) {
    console.log('Redirecting authenticated user from auth page to dashboard')
    return NextResponse.redirect(new URL('/dashboard', request.url))
  }

  // Protect admin routes - require authentication
  if (path.startsWith('/admin') && !isAuthenticated) {
    return NextResponse.redirect(new URL('/auth/login', request.url))
  }

  // Protect dashboard routes - require authentication  
  if (path.startsWith('/dashboard') && !isAuthenticated) {
    console.log('Redirecting unauthenticated user from dashboard to login')
    return NextResponse.redirect(new URL('/auth/login', request.url))
  }

  return response
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}