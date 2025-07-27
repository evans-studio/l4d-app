import { createClient } from '@/lib/supabase/server'
import { ApiResponseHandler } from '@/lib/api/response'

export async function POST() {
  try {
    const supabase = await createClient()

    const { error } = await supabase.auth.signOut()

    if (error) {
      console.error('Logout error:', error)
      return ApiResponseHandler.error('Logout failed', 'LOGOUT_FAILED', 400)
    }

    return ApiResponseHandler.success({
      message: 'Successfully logged out',
    })

  } catch (error) {
    console.error('Logout error:', error)
    return ApiResponseHandler.serverError('Logout failed')
  }
}