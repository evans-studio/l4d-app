import { NextRequest } from 'next/server'
import { ApiAuth } from '@/lib/api/auth'
import { ApiResponseHandler } from '@/lib/api/response'

export async function GET(request: NextRequest) {
  try {
    const { auth, error } = await ApiAuth.authenticate(request)

    if (error) {
      return error
    }

    return ApiResponseHandler.success({
      user: {
        id: auth!.profile.id as string,
        email: auth!.profile.email as string,
        firstName: auth!.profile.first_name as string,
        lastName: auth!.profile.last_name as string,
        phone: auth!.profile.phone as string,
        role: auth!.profile.role as string,
        isActive: auth!.profile.is_active as boolean,
        createdAt: auth!.profile.created_at as string,
      },
    })

  } catch (error) {
    console.error('Get user error:', error)
    return ApiResponseHandler.serverError('Failed to get user information')
  }
}