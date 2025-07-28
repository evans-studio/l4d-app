import { NextRequest, NextResponse } from 'next/server'
import { AuthMiddleware } from '@/lib/auth/auth-middleware'
import { createClient } from '@/lib/supabase/server'

export async function GET(request: NextRequest) {
  try {
    // Use enterprise authentication
    const authResult = await AuthMiddleware.authenticate(request)

    if (!authResult.success) {
      return AuthMiddleware.createErrorResponse(
        authResult.error || { message: 'Authentication failed', code: 'AUTH_FAILED' },
        401
      )
    }

    // Get full user profile
    const supabase = await createClient()
    const { data: profile, error: profileError } = await supabase
      .from('user_profiles')
      .select('*')
      .eq('id', authResult.user!.id)
      .single()

    if (profileError || !profile) {
      return NextResponse.json(
        {
          success: false,
          error: {
            message: 'User profile not found',
            code: 'PROFILE_NOT_FOUND'
          }
        },
        { status: 404 }
      )
    }

    // Create response
    const response = NextResponse.json({
      success: true,
      data: {
        user: {
          id: profile.id,
          email: profile.email,
          firstName: profile.first_name,
          lastName: profile.last_name,
          phone: profile.phone,
          role: profile.role,
          isActive: profile.is_active
        },
        session: {
          id: authResult.session!.id,
          expiresAt: authResult.session!.expiresAt.toISOString()
        }
      }
    })

    // If we have new tokens from refresh, set them in cookies
    if (authResult.newTokens) {
      AuthMiddleware.setAuthCookies(response, {
        accessToken: authResult.newTokens.accessToken,
        refreshToken: authResult.newTokens.refreshToken,
        expiresIn: authResult.newTokens.expiresIn,
        refreshExpiresIn: 7 * 24 * 60 * 60 // 7 days
      })
    }

    return response

  } catch (error) {
    console.error('Session validation error:', error)
    return NextResponse.json(
      {
        success: false,
        error: {
          message: 'Session validation failed',
          code: 'VALIDATION_ERROR'
        }
      },
      { status: 500 }
    )
  }
}