import { NextRequest } from 'next/server'
import { createClientFromRequest } from '@/lib/supabase/server'
import { ApiResponseHandler } from '@/lib/api/response'
import { sendBookingConfirmation } from '@/lib/services/email-notifications'

export const runtime = 'nodejs'

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = createClientFromRequest(request)
    const { id: slotId } = await params
    const { booking_id } = await request.json()

    if (!booking_id) {
      return ApiResponseHandler.badRequest('Booking ID is required')
    }

    // Get current session and verify authentication
    const { data: { session }, error: sessionError } = await supabase.auth.getSession()
    
    if (sessionError || !session?.user) {
      return ApiResponseHandler.unauthorized('Authentication required')
    }

    // Start a transaction to ensure atomicity
    const { data: slot, error: slotError } = await supabase
      .from('time_slots')
      .select('*')
      .eq('id', slotId)
      .single()

    if (slotError) {
      console.error('Error fetching time slot:', slotError)
      return ApiResponseHandler.serverError('Failed to fetch time slot')
    }

    if (!slot) {
      return ApiResponseHandler.notFound('Time slot not found')
    }

    // Check if slot is still available
    if (!slot.is_available) {
      return ApiResponseHandler.conflict('Time slot is no longer available')
    }

    // Check if slot is in the past
    const slotDateTime = new Date(`${slot.slot_date}T${slot.start_time}`)
    const now = new Date()
    
    if (slotDateTime <= now) {
      return ApiResponseHandler.badRequest('Cannot book time slots in the past')
    }

    // Update the time slot to mark as booked
    const { data: updatedSlot, error: updateError } = await supabase
      .from('time_slots')
      .update({
        is_available: false,
        booking_reference: booking_id
      })
      .eq('id', slotId)
      .eq('is_available', true) // Ensure it's still available (race condition protection)
      .select()
      .single()

    if (updateError) {
      console.error('Error updating time slot:', updateError)
      
      // Check if it's a race condition (slot was booked by someone else)
      if (updateError.code === 'PGRST116') { // No rows updated
        return ApiResponseHandler.conflict('Time slot was just booked by another user')
      }
      
      return ApiResponseHandler.serverError('Failed to book time slot')
    }

    if (!updatedSlot) {
      return ApiResponseHandler.conflict('Time slot was just booked by another user')
    }

    // Get booking details for email notification
    try {
      const { data: booking } = await supabase
        .from('bookings')
        .select(`
          *,
          booking_services(
            service_details
          )
        `)
        .eq('id', booking_id)
        .single()

      if (booking) {
        // Get customer details
        const { data: customer } = await supabase
          .from('user_profiles')
          .select('first_name, last_name, email')
          .eq('id', booking.customer_id)
          .single()

        if (customer) {
          // Send confirmation email
          const emailData = {
            customerName: `${customer.first_name} ${customer.last_name}`,
            customerEmail: customer.email,
            bookingReference: booking.booking_reference,
            serviceName: booking.booking_services?.[0]?.service_details?.name || 'Vehicle Detailing',
            scheduledDate: slot.slot_date,
            scheduledTime: slot.start_time,
            totalPrice: booking.total_price,
            address: booking.service_address?.address_line_1 || '',
            vehicleDetails: `${booking.vehicle_details?.make} ${booking.vehicle_details?.model}`,
            specialInstructions: booking.special_instructions,
            businessName: 'Love 4 Detailing',
            businessPhone: process.env.BUSINESS_PHONE || ''
          }

          // Send email in background (don't wait for it)
          sendBookingConfirmation(emailData).catch(error => {
            console.error('Failed to send booking confirmation email:', error)
          })
        }
      }
    } catch (emailError) {
      // Log email error but don't fail the booking
      console.error('Error preparing confirmation email:', emailError)
    }

    // Log the booking action for audit trail
    try {
      await supabase
        .from('booking_audit_log')
        .insert({
          booking_id: booking_id,
          action: 'slot_booked',
          details: {
            slot_id: slotId,
            slot_date: slot.slot_date,
            slot_time: slot.start_time,
            booked_by: session.user.id
          },
          created_at: new Date().toISOString()
        })
    } catch (error) {
      console.error('Failed to log booking action:', error)
      // Don't fail the request for audit logging errors
    }

    return ApiResponseHandler.success(updatedSlot, 'Time slot booked successfully')

  } catch (error) {
    console.error('Book time slot error:', error)
    return ApiResponseHandler.serverError('Failed to book time slot')
  }
}