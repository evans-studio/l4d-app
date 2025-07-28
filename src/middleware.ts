import { NextResponse, type NextRequest } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function middleware(request: NextRequest) {
  const response = NextResponse.next()
  const path = request.nextUrl.pathname

  // Skip middleware for public routes, static files, and API routes
  if (
    path.startsWith('/_next') ||
    path.startsWith('/api') ||
    path.startsWith('/auth/callback') ||
    path === '/' ||
    path === '/book' ||
    path === '/booking-policies' ||
    path === '/booking-success' ||
    path.match(/\.(png|jpg|jpeg|gif|svg|ico|css|js)$/)
  ) {
    return response
  }

  // Simple auth check for protected routes
  if (path.startsWith('/dashboard') || path.startsWith('/admin')) {
    try {
      const supabase = await createClient()
      const { data: { session } } = await supabase.auth.getSession()
      
      console.log('Middleware auth check:', {
        path,
        hasSession: !!session,
        hasUser: !!session?.user,
        userId: session?.user?.id
      })
      
      if (!session?.user) {
        console.log('No session, redirecting to login')
        return NextResponse.redirect(new URL('/auth/login', request.url))
      }
      
      console.log('Auth check passed, allowing access to:', path)
    } catch (error) {
      console.error('Auth check error:', error)
      return NextResponse.redirect(new URL('/auth/login', request.url))
    }
  }

  return response
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}