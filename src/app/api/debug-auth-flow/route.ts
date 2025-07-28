import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/middleware'

export async function GET(request: NextRequest) {
  try {
    const response = NextResponse.next()
    const supabase = createClient(request, response)
    
    // Check session
    const { data: { session }, error } = await supabase.auth.getSession()
    
    // Get all cookies
    const allCookies = request.cookies.getAll()
    const authCookies = allCookies.filter(c => 
      c.name.includes('supabase') || c.name.includes('sb-')
    )
    
    return NextResponse.json({
      success: true,
      timestamp: new Date().toISOString(),
      session: {
        exists: !!session,
        userId: session?.user?.id || null,
        email: session?.user?.email || null,
        expiresAt: session?.expires_at || null,
      },
      cookies: {
        total: allCookies.length,
        authCookies: authCookies.map(c => ({
          name: c.name,
          hasValue: !!c.value,
          valueLength: c.value?.length || 0
        })),
        allCookieNames: allCookies.map(c => c.name)
      },
      environment: {
        hasSupabaseUrl: !!process.env.NEXT_PUBLIC_SUPABASE_URL,
        hasAnonKey: !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
        appUrl: process.env.NEXT_PUBLIC_APP_URL,
      },
      error: error?.message || null
    })
  } catch (error) {
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString()
    }, { status: 500 })
  }
}