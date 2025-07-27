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

    // Check if booking exists and get full booking details for email
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
        customer_profiles!inner (
          first_name,
          last_name,
          email
        ),
        booking_services!inner (
          services!inner (
            name,
            base_price
          )
        ),
        customer_vehicles!inner (
          make,
          model,
          year
        ),
        customer_addresses!inner (
          address_line_1,
          address_line_2,
          city,
          postal_code
        )
      `)
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

    // Send email notification to customer about status change
    try {
      const customerName = `${existingBooking.customer_profiles?.first_name || ''} ${existingBooking.customer_profiles?.last_name || ''}`.trim()
      const customerEmail = existingBooking.customer_profiles?.email

      if (customerEmail && status !== existingBooking.status) {
        // Transform booking data for email template
        const bookingEmailData = {
          customerName,
          bookingReference: existingBooking.booking_reference,
          scheduledDate: existingBooking.scheduled_date,
          startTime: existingBooking.start_time,
          totalPrice: existingBooking.total_price,
          services: existingBooking.booking_services?.map((bs: any) => ({
            name: bs.services?.name || 'Service',
            base_price: bs.services?.base_price || 0
          })) || [],
          vehicle: {
            make: existingBooking.customer_vehicles?.make || '',
            model: existingBooking.customer_vehicles?.model || '',
            year: existingBooking.customer_vehicles?.year
          },
          address: {
            address_line_1: existingBooking.customer_addresses?.address_line_1 || '',
            address_line_2: existingBooking.customer_addresses?.address_line_2,
            city: existingBooking.customer_addresses?.city || '',
            postal_code: existingBooking.customer_addresses?.postal_code || ''
          },
          specialInstructions: existingBooking.special_instructions
        }

        // Generate appropriate email based on status
        let emailTemplate
        const statusMessage = getStatusMessage(status)
        
        if (status === 'confirmed') {
          emailTemplate = EmailService.generateBookingConfirmation(bookingEmailData)
        } else {
          emailTemplate = EmailService.generateStatusUpdate({
            ...bookingEmailData,
            status,
            statusMessage
          })
        }

        // Send the email
        await EmailService.sendEmail(customerEmail, emailTemplate)
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