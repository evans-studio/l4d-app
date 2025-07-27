import { NextRequest } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { ApiResponseHandler } from './response'
import { UserProfile } from '@/lib/utils/database'

export interface AuthenticatedRequest {
  user: {
    id: string
    email: string
    role: string
  }
  profile: UserProfile
}

export class ApiAuth {
  static async authenticate(
    request: NextRequest
  ): Promise<{ auth: AuthenticatedRequest; error: null } | { auth: null; error: Response }> {
    try {
      const supabase = await createClient()
      
      // Get user from session
      const { data: { user }, error: userError } = await supabase.auth.getUser()
      
      if (userError || !user) {
        return {
          auth: null,
          error: ApiResponseHandler.unauthorized('Authentication required')
        }
      }

      // Get user profile
      const { data: profile, error: profileError } = await supabase
        .from('user_profiles')
        .select('*')
        .eq('id', user.id)
        .single()

      if (profileError || !profile) {
        return {
          auth: null,
          error: ApiResponseHandler.unauthorized('User profile not found')
        }
      }

      return {
        auth: {
          user: {
            id: user.id,
            email: user.email!,
            role: profile.role,
          },
          profile,
        },
        error: null,
      }
    } catch (error) {
      console.error('Authentication error:', error)
      return {
        auth: null,
        error: ApiResponseHandler.serverError('Authentication failed')
      }
    }
  }

  static async requireRole(
    request: NextRequest,
    allowedRoles: string[]
  ): Promise<{ auth: AuthenticatedRequest; error: null } | { auth: null; error: Response }> {
    const { auth, error } = await this.authenticate(request)
    
    if (error) {
      return { auth: null, error }
    }

    if (!allowedRoles.includes(auth!.user.role)) {
      return {
        auth: null,
        error: ApiResponseHandler.forbidden(`Access denied. Required roles: ${allowedRoles.join(', ')}`)
      }
    }

    return { auth, error: null }
  }

  static async requireAdmin(
    request: NextRequest
  ): Promise<{ auth: AuthenticatedRequest; error: null } | { auth: null; error: Response }> {
    return this.requireRole(request, ['admin', 'super_admin'])
  }

  static async requireCustomer(
    request: NextRequest
  ): Promise<{ auth: AuthenticatedRequest; error: null } | { auth: null; error: Response }> {
    return this.requireRole(request, ['customer', 'admin', 'super_admin'])
  }
}