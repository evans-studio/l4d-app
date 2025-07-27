import { NextRequest } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { ApiResponseHandler } from '@/lib/api/response'
import { z } from 'zod'

const statusUpdateSchema = z.object({
  status: z.enum(['pending', 'confirmed', 'in_progress', 'completed', 'cancelled'])
})

interface RouteParams {
  params: {
    id: string
  }
}

export async function PUT(request: NextRequest, { params }: RouteParams) {
  try {
    const supabase = await createClient()
    
    // Get current user and verify admin role
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    
    if (authError || !user) {
      return ApiResponseHandler.unauthorized('Authentication required')
    }

    // Check user role
    const { data: profile } = await supabase
      .from('user_profiles')
      .select('role')
      .eq('id', user.id)
      .single()

    if (!profile || (profile.role !== 'admin' && profile.role !== 'super_admin')) {
      return ApiResponseHandler.forbidden('Admin access required')
    }

    // Validate request body
    const body = await request.json()
    const { status } = statusUpdateSchema.parse(body)

    // Check if booking exists
    const { data: existingBooking, error: bookingError } = await supabase
      .from('bookings')
      .select('id, status, customer_id')
      .eq('id', params.id)
      .single()

    if (bookingError || !existingBooking) {
      return ApiResponseHandler.notFound('Booking not found')
    }

    // Update booking status
    const { data: updatedBooking, error: updateError } = await supabase
      .from('bookings')
      .update({
        status,
        updated_at: new Date().toISOString()
      })
      .eq('id', params.id)
      .select()
      .single()

    if (updateError) {
      console.error('Booking status update error:', updateError)
      return ApiResponseHandler.serverError('Failed to update booking status')
    }

    // TODO: Send email notification to customer about status change
    // This would use the EmailService to notify the customer

    return ApiResponseHandler.success({
      booking: updatedBooking,
      message: `Booking status updated to ${status}`
    })

  } catch (error) {
    console.error('Booking status update error:', error)
    
    if (error instanceof z.ZodError) {
      const firstError = error.issues[0]
      return ApiResponseHandler.validationError(firstError?.message || 'Invalid status')
    }

    return ApiResponseHandler.serverError('Failed to update booking status')
  }
}