import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { ApiResponseHandler } from '@/lib/api/response'
import { BookingService } from '@/lib/services/booking'

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  }
)

export async function POST(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    // Get auth token from request headers or cookies
    const authHeader = request.headers.get('authorization')
    const authToken = authHeader?.replace('Bearer ', '') || 
                     request.cookies.get('sb-vwejbgfiddltdqwhfjmt-auth-token')?.value

    if (!authToken) {
      return ApiResponseHandler.error('Authentication required', 'AUTH_REQUIRED', 401)
    }

    // Verify the token and get user
    const { data: { user }, error: userError } = await supabaseAdmin.auth.getUser(authToken)
    
    if (userError || !user) {
      return ApiResponseHandler.error('Invalid authentication', 'AUTH_INVALID', 401)
    }

    const params = await context.params
    const bookingId = params.id
    const userId = user.id
    
    // Parse request body
    const body = await request.json()
    const { reason } = body

    // Verify the booking belongs to the user and can be cancelled
    const { data: booking, error: fetchError } = await supabaseAdmin
      .from('bookings')
      .select('id, status, customer_id, booking_reference')
      .eq('id', bookingId)
      .eq('customer_id', userId)
      .single()

    if (fetchError) {
      if (fetchError.code === 'PGRST116') {
        return ApiResponseHandler.error('Booking not found', 'NOT_FOUND', 404)
      }
      return ApiResponseHandler.error('Failed to fetch booking', 'FETCH_ERROR', 500)
    }

    // Check if booking can be cancelled
    if (booking.status === 'cancelled') {
      return ApiResponseHandler.error('Booking is already cancelled', 'ALREADY_CANCELLED', 400)
    }

    if (booking.status === 'completed') {
      return ApiResponseHandler.error('Cannot cancel completed booking', 'CANNOT_CANCEL_COMPLETED', 400)
    }

    if (booking.status === 'in_progress') {
      return ApiResponseHandler.error('Cannot cancel booking that is in progress', 'CANNOT_CANCEL_IN_PROGRESS', 400)
    }

    // Use BookingService to cancel the booking (includes email notifications)
    const bookingService = new BookingService()
    const result = await bookingService.cancelBooking(
      bookingId,
      userId,
      reason || 'Cancelled by customer'
    )

    if (!result.success) {
      return ApiResponseHandler.error(
        result.error?.message || 'Failed to cancel booking',
        'CANCEL_FAILED',
        500
      )
    }

    return ApiResponseHandler.success({
      booking: result.data,
      message: 'Booking cancelled successfully'
    })

  } catch (error) {
    console.error('Cancel booking API error:', error)
    return ApiResponseHandler.serverError('Failed to cancel booking')
  }
}