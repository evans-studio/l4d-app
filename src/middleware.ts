import { NextResponse, type NextRequest } from 'next/server'

export async function middleware(request: NextRequest) {
  const response = NextResponse.next()
  
  // Get Supabase session from cookies
  const accessToken = request.cookies.get('sb-vwejbgfiddltdqwhfjmt-auth-token')?.value
  const refreshToken = request.cookies.get('sb-vwejbgfiddltdqwhfjmt-auth-token.0')?.value || 
                      request.cookies.get('sb-vwejbgfiddltdqwhfjmt-auth-token.1')?.value
  
  const isAuthenticated = !!(accessToken && refreshToken)
  const path = request.nextUrl.pathname

  // Redirect authenticated users away from auth pages
  if (path.startsWith('/auth/') && isAuthenticated) {
    return NextResponse.redirect(new URL('/dashboard', request.url))
  }

  // Protect admin routes - require authentication
  if (path.startsWith('/admin') && !isAuthenticated) {
    return NextResponse.redirect(new URL('/auth/login', request.url))
  }

  // Protect dashboard routes - require authentication  
  if (path.startsWith('/dashboard') && !isAuthenticated) {
    return NextResponse.redirect(new URL('/auth/login', request.url))
  }

  return response
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}