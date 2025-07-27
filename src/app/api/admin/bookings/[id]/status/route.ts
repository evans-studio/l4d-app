import { NextRequest } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { ApiResponseHandler } from '@/lib/api/response'
import { EmailService } from '@/lib/services/email-service'
import { z } from 'zod'

const statusUpdateSchema = z.object({
  status: z.enum(['pending', 'confirmed', 'in_progress', 'completed', 'cancelled'])
})

function getStatusMessage(status: string): string {
  const messages = {
    pending: 'Your booking is pending confirmation.',
    confirmed: 'Your booking has been confirmed! We look forward to servicing your vehicle.',
    in_progress: 'Our team has started working on your vehicle.',
    completed: 'Your vehicle detailing service has been completed!',
    cancelled: 'Your booking has been cancelled. If you have any questions, please contact us.'
  }
  return messages[status as keyof typeof messages] || 'Your booking status has been updated.'
}

export async function PUT(
  request: NextRequest, 
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params
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
      .select(`
        id,
        booking_reference,
        status,
        customer_id,
        scheduled_date,
        start_time,
        total_price,
        special_instructions,
        vehicle_id,
        address_id
      `)
      .eq('id', id)
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
      .eq('id', id)
      .select()
      .single()

    if (updateError) {
      console.error('Booking status update error:', updateError)
      return ApiResponseHandler.serverError('Failed to update booking status')
    }

    // Send email notification to customer about status change (simplified for now)
    try {
      if (status !== existingBooking.status) {
        // Get customer details
        const { data: customer } = await supabase
          .from('user_profiles')
          .select('first_name, last_name, email')
          .eq('id', existingBooking.customer_id)
          .single()

        if (customer?.email) {
          const customerName = `${customer.first_name || ''} ${customer.last_name || ''}`.trim()
          
          // Simple status update email - can be enhanced later with full booking details
          const emailTemplate = EmailService.generateStatusUpdate({
            customerName,
            bookingReference: existingBooking.booking_reference,
            scheduledDate: existingBooking.scheduled_date,
            startTime: existingBooking.start_time,
            totalPrice: existingBooking.total_price,
            services: [{ name: 'Vehicle Detailing Service', base_price: existingBooking.total_price }],
            vehicle: { make: 'Vehicle', model: '', year: undefined },
            address: { address_line_1: 'Service Location', address_line_2: '', city: '', postal_code: '' },
            specialInstructions: existingBooking.special_instructions,
            status,
            statusMessage: getStatusMessage(status)
          })

          await EmailService.sendEmail(customer.email, emailTemplate)
        }
      }
    } catch (emailError) {
      console.error('Failed to send status update email:', emailError)
      // Don't fail the request if email fails
    }

    return ApiResponseHandler.success({
      booking: updatedBooking,
      message: `Booking status updated to ${status}`,
      emailSent: true
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