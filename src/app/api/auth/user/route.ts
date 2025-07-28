import { NextRequest } from 'next/server'
import { createClientFromRequest } from '@/lib/supabase/server'
import { ApiResponseHandler } from '@/lib/api/response'

export async function GET(request: NextRequest) {
  try {
    const supabase = createClientFromRequest(request)
    
    // Get current session
    const { data: { session }, error: sessionError } = await supabase.auth.getSession()
    
    if (sessionError || !session?.user) {
      return ApiResponseHandler.success({
        authenticated: false,
        user: null
      })
    }

    // Get user profile
    const { data: profile, error: profileError } = await supabase
      .from('user_profiles')
      .select('*')
      .eq('id', session.user.id)
      .single()

    if (profileError) {
      return ApiResponseHandler.success({
        authenticated: true,
        user: {
          id: session.user.id,
          email: session.user.email,
          first_name: null,
          last_name: null,
          role: 'customer'
        }
      })
    }

    return ApiResponseHandler.success({
      authenticated: true,
      user: {
        id: profile.id,
        email: profile.email,
        first_name: profile.first_name,
        last_name: profile.last_name,
        phone: profile.phone,
        role: profile.role
      }
    })

  } catch (error) {
    console.error('Auth user check error:', error)
    return ApiResponseHandler.success({
      authenticated: false,
      user: null
    })
  }
}