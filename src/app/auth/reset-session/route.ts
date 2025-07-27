import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  const response = NextResponse.redirect(new URL('/auth/login', request.url))
  
  // Clear all possible Supabase cookies
  const cookiesToClear = [
    'sb-vwejbgfiddltdqwhfjmt-auth-token',
    'sb-vwejbgfiddltdqwhfjmt-auth-token.0',
    'sb-vwejbgfiddltdqwhfjmt-auth-token.1',
    'sb-vwejbgfiddltdqwhfjmt-auth-token-code-verifier',
    'sb-vwejbgfiddltdqwhfjmt-auth-token-hash',
    'sb-vwejbgfiddltdqwhfjmt-pkce-code-verifier'
  ]
  
  cookiesToClear.forEach(cookieName => {
    response.cookies.set(cookieName, '', {
      expires: new Date(0),
      path: '/',
      httpOnly: false
    })
  })
  
  return response
}