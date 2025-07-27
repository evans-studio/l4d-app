import { NextResponse, type NextRequest } from 'next/server'

export async function middleware(request: NextRequest) {
  // Simple token-based auth check from cookies
  const authToken = request.cookies.get('sb-vwejbgfiddltdqwhfjmt-auth-token')
  const refreshToken = request.cookies.get('sb-vwejbgfiddltdqwhfjmt-auth-token.0')  
  const hasAuth = !!(authToken?.value || refreshToken?.value)

  // Redirect authenticated users away from auth pages
  if (request.nextUrl.pathname.startsWith('/auth') && hasAuth) {
    return NextResponse.redirect(new URL('/dashboard', request.url))
  }

  // Protect admin routes
  if (request.nextUrl.pathname.startsWith('/admin') && !hasAuth) {
    return NextResponse.redirect(new URL('/auth/login', request.url))
  }

  // Protect customer dashboard
  if (request.nextUrl.pathname.startsWith('/dashboard') && !hasAuth) {
    return NextResponse.redirect(new URL('/auth/login', request.url))
  }

  return NextResponse.next()
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}