/**
 * Authentication Test Helpers
 * 
 * Utilities for handling authentication in API tests,
 * including session tokens and role-based access testing.
 */

import { testDb, TestUser } from './test-database'
import request from 'supertest'

export interface AuthenticatedRequest {
  headers: {
    authorization?: string
    cookie?: string
    [key: string]: string | undefined
  }
}

export class AuthHelper {
  private static authenticatedUsers: Map<string, TestUser> = new Map()
  private static sessionTokens: Map<string, string> = new Map()

  /**
   * Create and authenticate a test customer
   */
  static async createAuthenticatedCustomer(): Promise<{ user: TestUser; token: string; request: AuthenticatedRequest }> {
    const user = await testDb.createTestUser({ role: 'customer' })
    const token = await testDb.getSessionToken(user.id)
    
    this.authenticatedUsers.set(user.id, user)
    this.sessionTokens.set(user.id, token)

    return {
      user,
      token,
      request: {
        headers: {
          authorization: `Bearer ${token}`,
          'content-type': 'application/json'
        }
      }
    }
  }

  /**
   * Create and authenticate a test admin
   */
  static async createAuthenticatedAdmin(): Promise<{ user: TestUser; token: string; request: AuthenticatedRequest }> {
    const user = await testDb.createTestAdmin()
    const token = await testDb.getSessionToken(user.id)
    
    this.authenticatedUsers.set(user.id, user)
    this.sessionTokens.set(user.id, token)

    return {
      user,
      token,
      request: {
        headers: {
          authorization: `Bearer ${token}`,
          'content-type': 'application/json'
        }
      }
    }
  }

  /**
   * Make an authenticated API request
   */
  static async makeAuthenticatedRequest(
    app: any,
    method: 'get' | 'post' | 'put' | 'patch' | 'delete',
    path: string,
    user: TestUser,
    data?: unknown
  ) {
    const token = this.sessionTokens.get(user.id)
    if (!token) {
      throw new Error(`No session token found for user ${user.id}`)
    }

    let req = request(app)[method](path)
      .set('Authorization', `Bearer ${token}`)
      .set('Content-Type', 'application/json')

    if (data && (method === 'post' || method === 'put' || method === 'patch')) {
      req = req.send(data)
    }

    return req
  }

  /**
   * Test authentication required scenarios
   */
  static async testAuthenticationRequired(
    app: any,
    method: 'get' | 'post' | 'put' | 'patch' | 'delete',
    path: string,
    data?: unknown
  ) {
    let req = request(app)[method](path)
      .set('Content-Type', 'application/json')

    if (data && (method === 'post' || method === 'put' || method === 'patch')) {
      req = req.send(data)
    }

    const response = await req
    
    expect(response.status).toBe(401)
    expect(response.body).toHaveProperty('success', false)
    expect(response.body.error.code).toBe('UNAUTHORIZED')
    
    return response
  }

  /**
   * Test admin access required scenarios
   */
  static async testAdminAccessRequired(
    app: any,
    method: 'get' | 'post' | 'put' | 'patch' | 'delete',
    path: string,
    data?: unknown
  ) {
    // Test with customer user (should fail)
    const { user: customer } = await this.createAuthenticatedCustomer()
    
    let response = await this.makeAuthenticatedRequest(app, method, path, customer, data)
    
    expect([401, 403]).toContain(response.status)
    expect(response.body).toHaveProperty('success', false)
    expect(['UNAUTHORIZED', 'FORBIDDEN', 'ADMIN_REQUIRED']).toContain(response.body.error.code)
    
    return response
  }

  /**
   * Test invalid token scenarios
   */
  static async testInvalidToken(
    app: any,
    method: 'get' | 'post' | 'put' | 'patch' | 'delete',
    path: string,
    data?: unknown
  ) {
    let req = request(app)[method](path)
      .set('Authorization', 'Bearer invalid-token-here')
      .set('Content-Type', 'application/json')

    if (data && (method === 'post' || method === 'put' || method === 'patch')) {
      req = req.send(data)
    }

    const response = await req
    
    expect(response.status).toBe(401)
    expect(response.body).toHaveProperty('success', false)
    expect(response.body.error.code).toBe('UNAUTHORIZED')
    
    return response
  }

  /**
   * Test role-based access control
   */
  static async testRoleAccess(
    app: any,
    method: 'get' | 'post' | 'put' | 'patch' | 'delete',
    path: string,
    allowedRoles: Array<'customer' | 'admin' | 'super_admin'>,
    data?: unknown
  ) {
    const results: Record<string, any> = {}

    // Test each role
    if (allowedRoles.includes('customer') || !allowedRoles.includes('customer')) {
      const { user: customer } = await this.createAuthenticatedCustomer()
      const customerResponse = await this.makeAuthenticatedRequest(app, method, path, customer, data)
      results.customer = customerResponse
      
      if (allowedRoles.includes('customer')) {
        expect([200, 201]).toContain(customerResponse.status)
      } else {
        expect([401, 403]).toContain(customerResponse.status)
      }
    }

    if (allowedRoles.includes('admin') || !allowedRoles.includes('admin')) {
      const { user: admin } = await this.createAuthenticatedAdmin()
      const adminResponse = await this.makeAuthenticatedRequest(app, method, path, admin, data)
      results.admin = adminResponse
      
      if (allowedRoles.includes('admin')) {
        expect([200, 201]).toContain(adminResponse.status)
      } else {
        expect([401, 403]).toContain(adminResponse.status)
      }
    }

    return results
  }

  /**
   * Clean up authentication data
   */
  static cleanup() {
    this.authenticatedUsers.clear()
    this.sessionTokens.clear()
  }

  /**
   * Get stored user by ID
   */
  static getUser(userId: string): TestUser | undefined {
    return this.authenticatedUsers.get(userId)
  }

  /**
   * Get stored token by user ID
   */
  static getToken(userId: string): string | undefined {
    return this.sessionTokens.get(userId)
  }
}

/**
 * Common authentication test patterns
 */
export const authTestPatterns = {
  /**
   * Test complete authentication flow for an endpoint
   */
  async testEndpointAuthentication(
    app: any,
    method: 'get' | 'post' | 'put' | 'patch' | 'delete',
    path: string,
    data?: unknown
  ) {
    describe('Authentication', () => {
      it('should require authentication', async () => {
        await AuthHelper.testAuthenticationRequired(app, method, path, data)
      })

      it('should reject invalid tokens', async () => {
        await AuthHelper.testInvalidToken(app, method, path, data)
      })
    })
  },

  /**
   * Test admin-only endpoint access
   */
  async testAdminOnlyEndpoint(
    app: any,
    method: 'get' | 'post' | 'put' | 'patch' | 'delete',
    path: string,
    data?: unknown
  ) {
    describe('Admin Authorization', () => {
      it('should require authentication', async () => {
        await AuthHelper.testAuthenticationRequired(app, method, path, data)
      })

      it('should require admin access', async () => {
        await AuthHelper.testAdminAccessRequired(app, method, path, data)
      })

      it('should allow admin access', async () => {
        const { user: admin } = await AuthHelper.createAuthenticatedAdmin()
        const response = await AuthHelper.makeAuthenticatedRequest(app, method, path, admin, data)
        expect([200, 201]).toContain(response.status)
      })
    })
  },

  /**
   * Test customer access endpoint
   */
  async testCustomerEndpoint(
    app: any,
    method: 'get' | 'post' | 'put' | 'patch' | 'delete',
    path: string,
    data?: unknown
  ) {
    describe('Customer Authorization', () => {
      it('should require authentication', async () => {
        await AuthHelper.testAuthenticationRequired(app, method, path, data)
      })

      it('should allow customer access', async () => {
        const { user: customer } = await AuthHelper.createAuthenticatedCustomer()
        const response = await AuthHelper.makeAuthenticatedRequest(app, method, path, customer, data)
        expect([200, 201]).toContain(response.status)
      })
    })
  }
}

export { TestUser }