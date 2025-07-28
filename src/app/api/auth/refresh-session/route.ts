import { NextRequest } from 'next/server'
import { createClientFromRequest } from '@/lib/supabase/server'
import { ApiResponseHandler } from '@/lib/api/response'

export async function POST(request: NextRequest) {
  try {
    const supabase = createClientFromRequest(request)
    
    // Try to refresh the session
    const { data: { session }, error } = await supabase.auth.refreshSession()
    
    if (error || !session) {
      return ApiResponseHandler.unauthorized('Session refresh failed')
    }
    
    return ApiResponseHandler.success({
      sessionRefreshed: true,
      user: {
        id: session.user.id,
        email: session.user.email
      },
      expiresAt: session.expires_at
    })
    
  } catch (error) {
    console.error('Session refresh error:', error)
    return ApiResponseHandler.serverError('Failed to refresh session')
  }
}