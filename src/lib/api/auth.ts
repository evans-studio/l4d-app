import { createClient } from '@/lib/supabase/server'
import { ApiResponseHandler } from './response'

// Temporary auth utility for API routes
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

// Simple ApiAuth class to satisfy existing imports
export class ApiAuth {
  static async authenticateRequest(request: Request): Promise<AuthenticatedRequest | null> {
    try {
      const supabase = await createClient()
      
      // Get the current session
      const { data: { session }, error: sessionError } = await supabase.auth.getSession()
      
      if (sessionError || !session?.user) {
        return null
      }

      // Get the user profile
      const { data: profile, error: profileError } = await supabase
        .from('user_profiles')
        .select('*')
        .eq('id', session.user.id)
        .single()

      if (profileError || !profile) {
        console.error('Failed to fetch user profile:', profileError)
        return null
      }

      return {
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
    } catch (error) {
      console.error('Auth authentication error:', error)
      return null
    }
  }

  static async authenticate(request: Request) {
    const auth = await this.authenticateRequest(request)
    return { auth, error: null }
  }

  static async requireAuth(request: Request) {
    const auth = await this.authenticateRequest(request)
    if (!auth) {
      return { auth: null, error: ApiResponseHandler.unauthorized('Authentication required') }
    }
    return { auth, error: null }
  }

  static async requireRole(request: Request, allowedRoles: string[]) {
    const auth = await this.authenticateRequest(request)
    if (!auth) {
      return { auth: null, error: ApiResponseHandler.unauthorized('Authentication required') }
    }
    if (!allowedRoles.includes(auth.profile.role)) {
      return { auth: null, error: ApiResponseHandler.forbidden('Insufficient permissions') }
    }
    return { auth, error: null }
  }
}