import { NextResponse, type NextRequest } from 'next/server'

export async function middleware(request: NextRequest) {
  // Simple cookie-based authentication check to avoid Supabase SSR in Edge Runtime
  const authToken = request.cookies.get('sb-vwejbgfiddltdqwhfjmt-auth-token')
  const hasAuth = !!authToken?.value

  // Redirect authenticated users away from auth pages  
  if (request.nextUrl.pathname.startsWith('/auth') && hasAuth) {
    // Default redirect to dashboard - role checking will happen client-side
    return NextResponse.redirect(new URL('/dashboard', request.url))
  }

  // Protect admin routes - basic protection, detailed auth will be handled by pages
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