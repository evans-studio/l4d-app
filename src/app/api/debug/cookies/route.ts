import { NextRequest } from 'next/server'
import { createClientFromRequest } from '@/lib/supabase/server'
import { ApiResponseHandler } from '@/lib/api/response'

export async function GET(request: NextRequest) {
  try {
    // Get all cookies
    const allCookies = request.cookies.getAll()
    const supabaseCookies = allCookies.filter(c => 
      c.name.includes('supabase') || c.name.includes('sb-')
    )

    // Try to get session with server client
    const supabase = createClientFromRequest(request)
    
    let sessionResult = null
    let userResult = null
    let sessionError = null
    let userError = null

    try {
      const { data: { session }, error } = await supabase.auth.getSession()
      sessionResult = {
        hasSession: !!session,
        hasUser: !!session?.user,
        userEmail: session?.user?.email
      }
      sessionError = error?.message
    } catch (error) {
      sessionError = error instanceof Error ? error.message : 'Unknown session error'
    }

    try {
      const { data: { user }, error } = await supabase.auth.getUser()
      userResult = {
        hasUser: !!user,
        userEmail: user?.email
      }
      userError = error?.message
    } catch (error) {
      userError = error instanceof Error ? error.message : 'Unknown user error'
    }

    return ApiResponseHandler.success({
      cookies: {
        total: allCookies.length,
        supabaseCount: supabaseCookies.length,
        supabaseCookies: supabaseCookies.map(c => ({ name: c.name, hasValue: !!c.value }))
      },
      session: sessionResult,
      sessionError,
      user: userResult, 
      userError,
      requestHeaders: {
        authorization: request.headers.get('authorization') ? 'Present' : 'Missing',
        cookie: request.headers.get('cookie') ? 'Present' : 'Missing'
      }
    })

  } catch (error) {
    console.error('Cookie debug error:', error)
    return ApiResponseHandler.serverError('Cookie debug failed')
  }
}