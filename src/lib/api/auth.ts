import { createClient } from '@/lib/supabase/server'
import { ApiResponseHandler } from './response'

export interface UserProfile {
  id: string
  email: string
  first_name?: string
  last_name?: string
  phone?: string
  role: string
}

export interface AuthenticatedRequest {
  user: {
    id: string
    email: string
  }
  profile: UserProfile
}

// Simple auth helper for API routes
export class ApiAuth {
  static async authenticate() {
    try {
      const supabase = await createClient()
      
      // Get the current session
      const { data: { session }, error: sessionError } = await supabase.auth.getSession()
      
      if (sessionError || !session?.user) {
        return { 
          auth: null, 
          error: ApiResponseHandler.unauthorized('Authentication required') 
        }
      }

      // Get the user profile
      const { data: profile, error: profileError } = await supabase
        .from('user_profiles')
        .select('*')
        .eq('id', session.user.id)
        .single()

      if (profileError || !profile) {
        return { 
          auth: null, 
          error: ApiResponseHandler.unauthorized('User profile not found') 
        }
      }

      const auth: AuthenticatedRequest = {
        user: {
          id: session.user.id,
          email: session.user.email!
        },
        profile: {
          id: profile.id,
          email: profile.email,
          first_name: profile.first_name,
          last_name: profile.last_name,
          phone: profile.phone,
          role: profile.role
        }
      }

      return { auth, error: null }
    } catch (error) {
      console.error('API auth error:', error)
      return { 
        auth: null, 
        error: ApiResponseHandler.serverError('Authentication failed') 
      }
    }
  }

  static async requireRole(allowedRoles: string[]) {
    const { auth, error } = await this.authenticate()
    
    if (error) {
      return { auth: null, error }
    }
    
    if (!allowedRoles.includes(auth!.profile.role)) {
      return { 
        auth: null, 
        error: ApiResponseHandler.forbidden('Insufficient permissions') 
      }
    }
    
    return { auth, error: null }
  }
}