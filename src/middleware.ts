import { NextResponse, type NextRequest } from 'next/server'

export async function middleware(request: NextRequest) {
  // Basic routing only - no authentication checks for now
  return NextResponse.next()
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}