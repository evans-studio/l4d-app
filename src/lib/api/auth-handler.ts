import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'
import { logger } from '@/lib/utils/logger'

export interface AuthenticatedUser {
  id: string
  email: string
  role: string
}

export class AuthHandler {
  /**
   * Get authenticated user from request headers (set by middleware)
   */
  static getUserFromHeaders(request: NextRequest): AuthenticatedUser | null {
    const userId = request.headers.get('x-user-id')
    const userRole = request.headers.get('x-user-role')
    
    if (!userId || !userRole) {
      return null
    }

    return {
      id: userId,
      email: '', // Email not available in headers, would need to fetch from DB
      role: userRole
    }
  }

  /**
   * Get authenticated user from cookies directly
   */
  static async getUserFromRequest(request: NextRequest): Promise<AuthenticatedUser | null> {
    try {
      // Create regular client for auth check
      const supabase = createServerClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        {
          cookies: {
            get(name: string) {
              return request.cookies.get(name)?.value
            },
            set() {
              // Not used in this context
            },
            remove() {
              // Not used in this context
            },
          },
        }
      )

      const { data: { session } } = await supabase.auth.getSession()
      
      if (!session?.user) {
        return null
      }

      // Create service client to bypass RLS for role lookup
      const supabaseService = createServerClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.SUPABASE_SERVICE_ROLE_KEY!,
        {
          cookies: {
            get(name: string) {
              return request.cookies.get(name)?.value
            },
            set() {},
            remove() {},
          },
          auth: {
            autoRefreshToken: false,
            persistSession: false
          }
        }
      )

      // Get user profile for role using service client (bypasses RLS)
      const { data: profile } = await supabaseService
        .from('user_profiles')
        .select('role')
        .eq('id', session.user.id)
        .single()

      return {
        id: session.user.id,
        email: session.user.email || '',
        role: profile?.role || 'customer'
      }
    } catch (error) {
      logger.error('Auth error:', error instanceof Error ? error : undefined)
      return null
    }
  }

  /**
   * Check if user has admin role
   */
  static isAdmin(user: AuthenticatedUser): boolean {
    return user.role === 'admin' || user.role === 'super_admin'
  }

  /**
   * Check if user has customer role
   */
  static isCustomer(user: AuthenticatedUser): boolean {
    return user.role === 'customer'
  }
}

export interface AuthResult {
  success: boolean
  user?: AuthenticatedUser
  error?: NextResponse
}

/**
 * Authenticate admin user from request
 * For backward compatibility with existing API routes
 */
export async function authenticateAdmin(request: NextRequest): Promise<AuthResult> {
  try {
    const user = await AuthHandler.getUserFromRequest(request)
    
    if (!user) {
      return {
        success: false,
        error: NextResponse.json({
          success: false,
          error: { message: 'Authentication required', code: 'UNAUTHORIZED' }
        }, { status: 401 })
      }
    }
    
    if (!AuthHandler.isAdmin(user)) {
      return {
        success: false,
        error: NextResponse.json({
          success: false,
          error: { message: 'Admin access required', code: 'FORBIDDEN' }
        }, { status: 403 })
      }
    }
    
    return {
      success: true,
      user
    }
  } catch (error) {
    return {
      success: false,
      error: NextResponse.json({
        success: false,
        error: { message: 'Authentication failed', code: 'AUTH_ERROR' }
      }, { status: 500 })
    }
  }
}