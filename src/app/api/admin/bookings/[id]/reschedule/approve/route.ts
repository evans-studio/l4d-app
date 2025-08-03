import { NextRequest } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase/direct'
import { ApiResponseHandler } from '@/lib/api/response'
import { EmailService } from '@/lib/services/email'
import { rescheduleBookingAtomic } from '@/lib/db/reschedule-atomic'
import { Booking } from '@/lib/utils/booking-types'

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { reschedule_request_id, new_date, new_time } = await request.json()
    const { id: bookingId } = await params
    
    if (!reschedule_request_id || !new_date || !new_time) {
      return ApiResponseHandler.badRequest('Reschedule request ID, new date and time are required')
    }

    const supabase = supabaseAdmin
    
    // Use the atomic reschedule function to handle all database operations in a single transaction
    const rescheduleResult = await rescheduleBookingAtomic(supabase, {
      bookingId,
      rescheduleRequestId: reschedule_request_id,
      newDate: new_date,
      newTime: new_time,
      adminResponse: 'Reschedule request approved'
    })

    if (!rescheduleResult.success) {
      return ApiResponseHandler.badRequest(rescheduleResult.error || 'Failed to reschedule booking')
    }

    // Get the updated booking for email notification
    const { data: booking, error: bookingError } = await supabase
      .from('bookings')
      .select(`
        id,
        booking_reference,
        status,
        customer_id,
        scheduled_date,
        scheduled_start_time,
        scheduled_end_time,
        time_slot_id,
        total_price,
        base_price,
        vehicle_size_multiplier,
        distance_surcharge,
        payment_status,
        created_at,
        updated_at
      `)
      .eq('id', bookingId)
      .single()

    if (bookingError || !booking) {
      console.error('Error fetching updated booking for email:', bookingError)
      // Still return success since the reschedule worked, just email notification failed
    }

    // Send approval notification email to customer
    if (booking) {
      const { data: customer } = await supabase
        .from('user_profiles')
        .select('email, first_name, last_name')
        .eq('id', booking.customer_id)
        .single()

        if (customer) {
          const emailService = new EmailService()
          const customerName = `${customer.first_name} ${customer.last_name}`
          
          // Get the original status from the atomic function result
          const originalStatus = rescheduleResult.data?.original_status || booking.status
          
          const emailResult = await emailService.sendBookingStatusUpdate(
            customer.email,
            customerName,
            { 
              ...booking, 
              scheduled_date: new_date,
              scheduled_start_time: new_time,
              status: 'rescheduled' 
            } as Booking,
            originalStatus, // FIXED: Use actual original status instead of 'rescheduled'
            `Great news! Your reschedule request has been approved. Your booking is now scheduled for ${new_date} at ${new_time}.`
          )
          
          if (!emailResult.success) {
            console.error('Failed to send approval notification email:', emailResult.error)
          }
        }
      }

    return ApiResponseHandler.success({
      message: 'Reschedule request approved successfully',
      ...rescheduleResult.data
    })

  } catch (error) {
    console.error('Approve reschedule request error:', error)
    return ApiResponseHandler.serverError('Failed to approve reschedule request')
  }
}