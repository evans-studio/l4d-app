import { NextRequest } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase/direct'
import { ApiResponseHandler } from '@/lib/api/response'
import { authenticateAdmin } from '@/lib/api/auth-handler'
import { z } from 'zod'

const markPaidSchema = z.object({
  paymentMethod: z.enum(['paypal', 'cash', 'card', 'bank_transfer']).default('paypal'),
  paymentReference: z.string().optional(),
  adminNotes: z.string().optional(),
  sendConfirmationEmail: z.boolean().default(true)
})

export async function PUT(
  request: NextRequest, 
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params
    
    // Authenticate admin user
    const authResult = await authenticateAdmin(request)
    if (!authResult.success) {
      return authResult.error!
    }
    
    // Use admin client for database queries (bypasses RLS)
    const supabase = supabaseAdmin

    // Validate request body
    const body = await request.json()
    const { paymentMethod, paymentReference, adminNotes, sendConfirmationEmail } = markPaidSchema.parse(body)

    console.log('🔍 Mark Paid - Looking for booking with ID:', id)
    
    // First get the booking to verify it exists (using admin client to bypass RLS)
    const { data: booking, error: bookingError } = await supabase
      .from('bookings')
      .select('*')
      .eq('id', id)
      .single()

    if (bookingError) {
      console.error('❌ Mark Paid - Booking query error:', bookingError)
      return ApiResponseHandler.notFound(`Booking not found: ${bookingError.message}`)
    }

    if (!booking) {
      console.error('❌ Mark Paid - No booking data returned for ID:', id)
      return ApiResponseHandler.notFound('Booking not found - no data returned')
    }

    console.log('✅ Mark Paid - Found booking:', {
      id: booking.id,
      reference: booking.booking_reference,
      status: booking.status,
      payment_status: booking.payment_status,
      customer_id: booking.customer_id
    })

    // Get customer details separately
    let userProfile = null
    if (booking.customer_id) {
      const { data: profile, error: profileError } = await supabase
        .from('user_profiles')
        .select('id, email, first_name, last_name, phone')
        .eq('id', booking.customer_id)
        .single()

      if (profileError) {
        console.error('❌ Mark Paid - Customer profile query error:', profileError)
        return ApiResponseHandler.notFound(`Customer profile not found: ${profileError.message}`)
      }

      userProfile = profile
      console.log('✅ Mark Paid - Found customer profile:', {
        id: profile.id,
        email: profile.email,
        name: `${profile.first_name} ${profile.last_name}`
      })
    } else {
      console.error('❌ Mark Paid - No customer_id in booking')
      return ApiResponseHandler.validationError('Booking has no associated customer')
    }

    // Check if booking is in a payable state
    if (!['pending', 'processing', 'payment_failed'].includes(booking.status)) {
      return ApiResponseHandler.validationError('Booking cannot be marked as paid in current status')
    }

    // Verify payment status allows marking as paid
    if (booking.payment_status === 'paid') {
      return ApiResponseHandler.validationError('Booking payment is already marked as paid')
    }

    // Update payment status and booking status
    const updateData = {
      payment_status: 'paid',
      payment_method: paymentMethod,
      payment_reference: paymentReference || booking.booking_reference,
      status: 'confirmed', // Auto-confirm when payment is received
      admin_notes: adminNotes ? `${booking.admin_notes || ''}\n\n[${new Date().toISOString()}] Payment confirmed by admin: ${adminNotes}`.trim() : booking.admin_notes,
      updated_at: new Date().toISOString()
    }

    const { data: updatedBooking, error: updateError } = await supabase
      .from('bookings')
      .update(updateData)
      .eq('id', id)
      .select()
      .single()

    if (updateError) {
      console.error('Payment status update error:', updateError)
      return ApiResponseHandler.serverError('Failed to update payment status')
    }

    // Add status history entry for status change
    if (booking.status !== 'confirmed') {
      await supabase
        .from('booking_status_history')
        .insert({
          booking_id: booking.id,
          from_status: booking.status,
          to_status: 'confirmed',
          changed_by: authResult.user!.id,
          reason: `Payment confirmed via ${paymentMethod} - booking automatically confirmed`,
          created_at: new Date().toISOString()
        })
    }

    // Send confirmation email to customer if requested
    if (sendConfirmationEmail) {
      try {
        const { EmailService } = await import('@/lib/services/email')
        const emailService = new EmailService()

        const customerName = `${userProfile.first_name} ${userProfile.last_name}`.trim()
        await emailService.sendPaymentConfirmation(
          userProfile.email,
          customerName,
          {
            ...booking,
            payment_status: 'paid',
            payment_method: paymentMethod,
            status: 'confirmed'
          } as any,
          paymentMethod,
          paymentReference || booking.booking_reference
        )
      } catch (emailError) {
        console.error('Payment confirmation email error:', emailError)
        // Don't fail the whole operation if email fails
      }
    }

    // Also send admin notification about payment received
    try {
      const { EmailService } = await import('@/lib/services/email')
      const emailService = new EmailService()
      
      await emailService.sendAdminPaymentNotification(
        updatedBooking,
        userProfile.email,
        `${userProfile.first_name} ${userProfile.last_name}`.trim(),
        paymentMethod,
        paymentReference || booking.booking_reference
      )
    } catch (emailError) {
      console.error('Admin payment notification error:', emailError)
    }

    return ApiResponseHandler.success({
      booking: updatedBooking,
      message: `Payment confirmed for booking ${booking.booking_reference}`,
      paymentMethod,
      paymentReference: paymentReference || booking.booking_reference,
      emailSent: sendConfirmationEmail
    })

  } catch (error) {
    console.error('Mark paid error:', error)
    
    if (error instanceof z.ZodError) {
      const firstError = error.issues[0]
      return ApiResponseHandler.validationError(firstError?.message || 'Invalid payment data')
    }

    return ApiResponseHandler.serverError('Failed to mark booking as paid')
  }
}