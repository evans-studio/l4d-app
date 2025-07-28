import { NextRequest } from 'next/server'
import { createClientFromRequest } from '@/lib/supabase/server'
import { ApiResponseHandler } from '@/lib/api/response'
import { sendBookingCancellation } from '@/lib/services/email-notifications'

export const runtime = 'nodejs'

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = createClientFromRequest(request)
    const { id: slotId } = await params
    const { cancellation_reason } = await request.json()

    // Get current user and verify authentication
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    
    if (authError || !user) {
      return ApiResponseHandler.unauthorized('Authentication required')
    }

    // Get the current time slot with booking details
    const { data: slot, error: slotError } = await supabase
      .from('time_slots')
      .select(`
        *,
        bookings(
          id,
          booking_reference,
          customer_id,
          total_price,
          special_instructions,
          service_address,
          vehicle_details,
          booking_services(
            service_details
          )
        )
      `)
      .eq('id', slotId)
      .single()

    if (slotError) {
      console.error('Error fetching time slot:', slotError)
      return ApiResponseHandler.serverError('Failed to fetch time slot')
    }

    if (!slot) {
      return ApiResponseHandler.notFound('Time slot not found')
    }

    // Check if slot is actually booked
    if (slot.is_available || !slot.booking_id) {
      return ApiResponseHandler.badRequest('Time slot is not currently booked')
    }

    // Store booking details for email notification
    const booking = slot.bookings?.[0]
    let customerDetails = null

    if (booking) {
      // Get customer details for email
      const { data: customer } = await supabase
        .from('user_profiles')
        .select('first_name, last_name, email')
        .eq('id', booking.customer_id)
        .single()

      customerDetails = customer
    }

    // Release the time slot
    const { data: updatedSlot, error: updateError } = await supabase
      .from('time_slots')
      .update({
        is_available: true,
        booking_id: null,
        updated_at: new Date().toISOString()
      })
      .eq('id', slotId)
      .eq('is_available', false) // Ensure it's still booked (race condition protection)
      .select()
      .single()

    if (updateError) {
      console.error('Error releasing time slot:', updateError)
      
      // Check if it's a race condition (slot was already released)
      if (updateError.code === 'PGRST116') { // No rows updated
        return ApiResponseHandler.conflict('Time slot was already released')
      }
      
      return ApiResponseHandler.serverError('Failed to release time slot')
    }

    if (!updatedSlot) {
      return ApiResponseHandler.conflict('Time slot was already released')
    }

    // Update booking status to cancelled
    if (booking) {
      try {
        await supabase
          .from('bookings')
          .update({
            status: 'cancelled',
            cancelled_at: new Date().toISOString(),
            cancellation_reason: cancellation_reason || 'Slot released'
          })
          .eq('id', booking.id)
      } catch (error) {
        console.error('Failed to update booking status:', error)
        // Don't fail the request for booking update errors
      }

      // Send cancellation email
      if (customerDetails) {
        const emailData = {
          customerName: `${customerDetails.first_name} ${customerDetails.last_name}`,
          customerEmail: customerDetails.email,
          bookingReference: booking.booking_reference,
          serviceName: booking.booking_services?.[0]?.service_details?.name || 'Vehicle Detailing',
          scheduledDate: slot.date,
          scheduledTime: slot.start_time,
          totalPrice: booking.total_price,
          address: booking.service_address?.address_line_1 || '',
          vehicleDetails: `${booking.vehicle_details?.make} ${booking.vehicle_details?.model}`,
          cancellationReason: cancellation_reason,
          businessName: 'Love 4 Detailing',
          businessPhone: process.env.BUSINESS_PHONE || ''
        }

        // Send email in background (don't wait for it)
        sendBookingCancellation(emailData).catch(error => {
          console.error('Failed to send cancellation email:', error)
        })
      }
    }

    // Log the release action for audit trail
    try {
      await supabase
        .from('booking_audit_log')
        .insert({
          booking_id: slot.booking_id,
          action: 'slot_released',
          details: {
            slot_id: slotId,
            slot_date: slot.date,
            slot_time: slot.start_time,
            released_by: user.id,
            cancellation_reason: cancellation_reason
          },
          created_at: new Date().toISOString()
        })
    } catch (error) {
      console.error('Failed to log release action:', error)
      // Don't fail the request for audit logging errors
    }

    return ApiResponseHandler.success(updatedSlot, 'Time slot released successfully')

  } catch (error) {
    console.error('Release time slot error:', error)
    return ApiResponseHandler.serverError('Failed to release time slot')
  }
}