// Simple auth utilities for API routes
export { AuthHandler as auth, authenticateAdmin, type AuthResult, type AuthenticatedUser } from './auth-handler'

// For backward compatibility
export const getUser = (request: unknown) => {
  const { AuthHandler } = require('./auth-handler')
  return AuthHandler.getUserFromHeaders(request) || AuthHandler.getUserFromRequest(request)
}

// ApiAuth class for backward compatibility with existing API routes
import type { NextRequest } from 'next/server'

export class ApiAuth {
  static async getUserFromRequest(request: NextRequest) {
    const { AuthHandler } = await import('./auth-handler')
    return AuthHandler.getUserFromRequest(request)
  }

  static async authenticateUser(request: NextRequest) {
    try {
      const { AuthHandler } = await import('./auth-handler')
      const { NextResponse } = await import('next/server')
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
      
      return {
        success: true,
        user
      }
    } catch (error) {
      const { NextResponse } = await import('next/server')
      return {
        success: false,
        error: NextResponse.json({
          success: false,
          error: { message: 'Authentication failed', code: 'AUTH_ERROR' }
        }, { status: 500 })
      }
    }
  }

  static async authenticateAdmin(request: NextRequest) {
    const { authenticateAdmin } = await import('./auth-handler')
    return authenticateAdmin(request)
  }

  static isAdmin(user: { role?: string } | null | undefined): boolean {
    return (user?.role || '').toLowerCase() === 'admin'
  }

  static isCustomer(user: { role?: string } | null | undefined): boolean {
    return (user?.role || '').toLowerCase() === 'customer'
  }

  // Legacy authenticate method (without request parameter)
  static async authenticate() {
    // This method was used in the old system, but now we need the request object
    // Return an error since this method is deprecated
    const { NextResponse } = await import('next/server')
    return {
      auth: null,
      error: NextResponse.json({
        success: false,
        error: { message: 'Authentication method deprecated - use authenticateUser(request) or authenticateAdmin(request)', code: 'DEPRECATED' }
      }, { status: 500 })
    }
  }

  // Legacy requireRole method
  static async requireRole(roles: string[]) {
    // This method was used in the old system, but now we need the request object
    // Return an error since this method is deprecated
    const { NextResponse } = await import('next/server')
    return {
      auth: null,
      error: NextResponse.json({
        success: false,
        error: { message: 'requireRole method deprecated - use authenticateAdmin(request)', code: 'DEPRECATED' }
      }, { status: 500 })
    }
  }
}