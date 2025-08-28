import { NextRequest, NextResponse } from 'next/server'
import { createClientFromRequest } from '@/lib/supabase/server'
import { ApiResponse } from '@/types/booking'
import { logger } from '@/lib/utils/logger'
import { env } from '@/lib/config/environment'

export async function PUT(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
): Promise<NextResponse<ApiResponse>> {
  try {
    const supabase = createClientFromRequest(request)
    
    // Get current user (this also validates the session)
    const { data: { user }, error: userError } = await supabase.auth.getUser()
    
    if (userError || !user) {
      return NextResponse.json({
        success: false,
        error: { message: 'Authentication required', code: 'UNAUTHORIZED' }
      }, { status: 401 })
    }

    // Get user profile to check role
    const { data: profile, error: profileError } = await supabase
      .from('user_profiles')
      .select('id, email, role, is_active')
      .eq('id', user.id)
      .single()

    if (profileError || !profile || profile.is_active === false) {
      return NextResponse.json({
        success: false,
        error: { message: 'User account not found or inactive', code: 'USER_INACTIVE' }
      }, { status: 401 })
    }

    // Only admins can update booking status
    const isAdmin = profile.role === 'admin' || env.auth.adminEmails.includes(profile.email.toLowerCase())
    
    if (!isAdmin) {
      return NextResponse.json({
        success: false,
        error: { message: 'Admin access required', code: 'FORBIDDEN' }
      }, { status: 403 })
    }

    const params = await context.params
    const bookingId = params.id
    const body = await request.json()

    // Validate required fields
    if (!body.status) {
      return NextResponse.json({
        success: false,
        error: { message: 'Status is required', code: 'MISSING_STATUS' }
      }, { status: 400 })
    }

    // Update booking status
    const { data: updatedBooking, error: updateError } = await supabase
      .from('bookings')
      .update({
        status: body.status,
        updated_at: new Date().toISOString()
      })
      .eq('id', bookingId)
      .select('*')
      .single()

    if (updateError) {
      if (updateError.code === 'PGRST116') {
        return NextResponse.json({
          success: false,
          error: { message: 'Booking not found', code: 'NOT_FOUND' }
        }, { status: 404 })
      }
      logger.error('Error updating booking status', updateError instanceof Error ? updateError : undefined)
      return NextResponse.json({
        success: false,
        error: { message: 'Failed to update booking status', code: 'UPDATE_FAILED' }
      }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      data: updatedBooking
    })

  } catch (error) {
    logger.error('Update booking status API error', error instanceof Error ? error : undefined)
    return NextResponse.json({
      success: false,
      error: { message: 'Internal server error', code: 'SERVER_ERROR' }
    }, { status: 500 })
  }
}