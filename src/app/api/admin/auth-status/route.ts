import { NextRequest } from 'next/server'
import { createClientFromRequest } from '@/lib/supabase/server'
import { ApiResponseHandler } from '@/lib/api/response'

export async function GET(request: NextRequest) {
  try {
    const supabase = createClientFromRequest(request)
    
    // Get current user and verify admin role
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    
    if (authError || !user) {
      return ApiResponseHandler.success({
        authenticated: false,
        isAdmin: false,
        error: authError?.message || 'No user found'
      })
    }

    // Check user role
    const { data: profile, error: profileError } = await supabase
      .from('user_profiles')
      .select('role, email, first_name, last_name')
      .eq('id', user.id)
      .single()

    const isAdmin = profile && (profile.role === 'admin' || profile.role === 'super_admin')

    return ApiResponseHandler.success({
      authenticated: true,
      isAdmin,
      user: {
        id: user.id,
        email: user.email,
        role: profile?.role || null,
        name: profile ? `${profile.first_name || ''} ${profile.last_name || ''}`.trim() : null
      },
      profileError: profileError?.message || null
    })

  } catch (error) {
    console.error('Auth status error:', error)
    return ApiResponseHandler.serverError('Failed to check auth status')
  }
}