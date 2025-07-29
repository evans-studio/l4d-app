import { NextRequest } from 'next/server'
import { AuthHandler } from '@/lib/api/auth-handler'

export async function GET(request: NextRequest) {
  try {
    const user = await AuthHandler.getUserFromRequest(request)
    
    return Response.json({
      success: true,
      data: {
        isAuthenticated: !!user,
        user: user,
        isAdmin: user ? AuthHandler.isAdmin(user) : false,
        isCustomer: user ? AuthHandler.isCustomer(user) : false
      }
    })
  } catch (error) {
    return Response.json({
      success: false,
      error: {
        message: 'Failed to check auth status',
        details: error instanceof Error ? error.message : 'Unknown error'
      }
    })
  }
}