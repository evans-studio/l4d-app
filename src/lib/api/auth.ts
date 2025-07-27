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
    // TODO: Implement simple auth check
    // For now, return null to disable auth temporarily
    return null
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