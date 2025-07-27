import { NextResponse, type NextRequest } from 'next/server'

export async function middleware(request: NextRequest) {
  const response = NextResponse.next()
  
  // Get all cookies to debug
  const allCookies = request.cookies.getAll()
  const supabaseCookies = allCookies.filter(c => c.name.includes('sb-vwejbgfiddltdqwhfjmt'))
  
  // Get Supabase session from cookies - try multiple possible cookie names
  const accessToken = request.cookies.get('sb-vwejbgfiddltdqwhfjmt-auth-token')?.value ||
                     request.cookies.get('sb-vwejbgfiddltdqwhfjmt-auth-token-code-verifier')?.value
  
  const refreshToken = request.cookies.get('sb-vwejbgfiddltdqwhfjmt-auth-token.0')?.value || 
                      request.cookies.get('sb-vwejbgfiddltdqwhfjmt-auth-token.1')?.value ||
                      request.cookies.get('sb-vwejbgfiddltdqwhfjmt-auth-token-code-verifier')?.value
  
  // If we have any Supabase auth cookies, consider authenticated
  const isAuthenticated = supabaseCookies.length > 0 && (accessToken || refreshToken)
  const path = request.nextUrl.pathname

  // Only log for auth and dashboard routes to avoid spam
  if (path.startsWith('/auth/') || path.startsWith('/dashboard')) {
    console.log('Middleware check:', {
      path,
      isAuthenticated,
      hasAccessToken: !!accessToken,
      hasRefreshToken: !!refreshToken,
      supabaseCookieCount: supabaseCookies.length,
      cookieNames: supabaseCookies.map(c => c.name)
    })
  }

  // Redirect authenticated users away from auth pages
  if (path.startsWith('/auth/') && isAuthenticated) {
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