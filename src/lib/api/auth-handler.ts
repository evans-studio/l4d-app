import { NextRequest } from 'next/server'
import { createClientFromRequest } from '@/lib/supabase/server'
import { ApiResponseHandler } from '@/lib/api/response'

export interface AuthResult {
  success: boolean
  user?: any
  profile?: any
  error?: any
}

export async function authenticateAdmin(request: NextRequest): Promise<AuthResult> {
  try {
    const supabase = createClientFromRequest(request)
    
    // Try to get user with current session
    let { data: { user }, error: authError } = await supabase.auth.getUser()
    
    // If we get a refresh token error, try to refresh the session
    if (authError?.message?.includes('Invalid Refresh Token') || authError?.message?.includes('Refresh Token Not Found')) {
      console.log('Attempting session refresh due to:', authError.message)
      
      const { data: { session }, error: refreshError } = await supabase.auth.refreshSession()
      
      if (refreshError || !session) {
        console.log('Session refresh failed:', refreshError?.message)
        return {
          success: false,
          error: ApiResponseHandler.unauthorized('Session expired. Please log in again.')
        }
      }
      
      // Try to get user again with refreshed session
      const { data: { user: refreshedUser }, error: userError } = await supabase.auth.getUser()
      
      if (userError || !refreshedUser) {
        return {
          success: false,
          error: ApiResponseHandler.unauthorized('Authentication failed after refresh')
        }
      }
      
      user = refreshedUser
    } else if (authError || !user) {
      console.log('Authentication failed:', authError?.message)
      return {
        success: false,
        error: ApiResponseHandler.unauthorized('Authentication required')
      }
    }

    // Get user profile and verify admin role
    const { data: profile, error: profileError } = await supabase
      .from('user_profiles')
      .select('role, email, first_name, last_name')
      .eq('id', user.id)
      .single()

    if (profileError) {
      console.log('Profile fetch error:', profileError.message)
      return {
        success: false,
        error: ApiResponseHandler.serverError('Failed to fetch user profile')
      }
    }

    if (!profile || (profile.role !== 'admin' && profile.role !== 'super_admin')) {
      console.log('Access denied - user role:', profile?.role)
      return {
        success: false,
        error: ApiResponseHandler.forbidden('Admin access required')
      }
    }

    return {
      success: true,
      user,
      profile
    }

  } catch (error) {
    console.error('Authentication handler error:', error)
    return {
      success: false,
      error: ApiResponseHandler.serverError('Authentication failed')
    }
  }
}