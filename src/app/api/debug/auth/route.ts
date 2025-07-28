import { NextRequest } from 'next/server'
import { createClientFromRequest } from '@/lib/supabase/server'
import { ApiResponseHandler } from '@/lib/api/response'

export async function GET(request: NextRequest) {
  try {
    const supabase = createClientFromRequest(request)
    
    // Debug: Check cookies
    const cookies = request.cookies.getAll()
    const authCookies = cookies.filter(c => 
      c.name.includes('supabase') || c.name.includes('sb-')
    )
    
    // Debug: Try to get user
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    
    let profile = null
    if (user && !authError) {
      const { data: profileData } = await supabase
        .from('user_profiles')
        .select('role, email, first_name, last_name')
        .eq('id', user.id)
        .single()
      profile = profileData
    }
    
    return ApiResponseHandler.success({
      debug: {
        hasAuthCookies: authCookies.length > 0,
        authCookieNames: authCookies.map(c => c.name),
        authError: authError?.message || null,
        hasUser: !!user,
        userId: user?.id || null,
        userEmail: user?.email || null,
        profile: profile,
        timestamp: new Date().toISOString()
      }
    })
    
  } catch (error) {
    console.error('Debug auth error:', error)
    return ApiResponseHandler.serverError('Debug failed')
  }
}