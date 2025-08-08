import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase/direct'
import { ApiResponseHandler } from '@/lib/api/response'
import { EmailService } from '@/lib/services/email'

/**
 * Automated cron job to check for payment deadlines and mark overdue bookings as payment_failed
 * This endpoint should be called every hour by Vercel cron or similar service
 */
export async function GET(request: NextRequest) {
  try {
    console.log('🔄 Running payment deadline check...')
    
    // Get all pending bookings with passed payment deadlines
    const now = new Date().toISOString()
    
    const { data: overdueBookings, error: fetchError } = await supabaseAdmin
      .from('bookings')
      .select(`
        id,
        booking_reference,
        payment_deadline,
        status,
        payment_status,
        total_price,
        scheduled_date,
        scheduled_start_time,
        customer_id,
        admin_notes,
        user_profiles!bookings_customer_id_fkey (
          id,
          email,
          first_name,
          last_name,
          phone
        ),
        services (
          id,
          name
        ),
        customer_vehicles!bookings_vehicle_id_fkey (
          make,
          model,
          year,
          color
        )
      `)
      .eq('status', 'pending')
      .eq('payment_status', 'pending')
      .lt('payment_deadline', now)
      .order('created_at', { ascending: true })

    if (fetchError) {
      console.error('❌ Error fetching overdue bookings:', fetchError)
      return ApiResponseHandler.serverError('Failed to fetch overdue bookings')
    }

    if (!overdueBookings || overdueBookings.length === 0) {
      console.log('✅ No overdue bookings found')
      return ApiResponseHandler.success({
        message: 'No overdue bookings found',
        processedCount: 0,
        overdueBookings: []
      })
    }

    console.log(`⏰ Found ${overdueBookings.length} overdue booking(s), processing...`)

    const emailService = new EmailService()
    const processedBookings = []
    const failedBookings = []

    // Process each overdue booking
    for (const booking of overdueBookings) {
      try {
        console.log(`📋 Processing overdue booking: ${booking.booking_reference}`)
        
        // Update booking status to payment_failed
        const { data: updatedBooking, error: updateError } = await supabaseAdmin
          .from('bookings')
          .update({
            status: 'payment_failed',
            payment_status: 'failed',
            admin_notes: `${booking.admin_notes || ''}\n\n[${new Date().toISOString()}] Auto-marked as payment failed - deadline exceeded`.trim(),
            updated_at: new Date().toISOString()
          })
          .eq('id', booking.id)
          .select()
          .single()

        if (updateError) {
          console.error(`❌ Failed to update booking ${booking.booking_reference}:`, updateError)
          failedBookings.push({
            bookingId: booking.id,
            reference: booking.booking_reference,
            error: updateError.message
          })
          continue
        }

        // Add status history entry
        await supabaseAdmin
          .from('booking_status_history')
          .insert({
            booking_id: booking.id,
            from_status: 'pending',
            to_status: 'payment_failed',
            changed_by: null, // System change
            reason: 'Automatic status change - payment deadline exceeded (48 hours)',
            created_at: new Date().toISOString()
          })

        // Send notification emails  
        const userProfile = Array.isArray(booking.user_profiles) ? booking.user_profiles[0] : booking.user_profiles
        const customerName = `${userProfile?.first_name || ''} ${userProfile?.last_name || ''}`.trim()
        
        try {
          // Send customer notification about payment failure
          await emailService.sendPaymentFailedNotification(
            userProfile?.email || '',
            customerName,
            {
              ...booking,
              status: 'payment_failed',
              payment_status: 'failed'
            } as any
          )

          // Send admin notification about automatic status change
          await emailService.sendAdminPaymentFailedNotification(
            {
              ...booking,
              status: 'payment_failed',
              payment_status: 'failed'
            } as any,
            userProfile?.email || '',
            customerName
          )

          console.log(`✅ Processed booking ${booking.booking_reference} - marked as payment failed and notifications sent`)
        } catch (emailError) {
          console.error(`⚠️  Updated booking ${booking.booking_reference} but failed to send notifications:`, emailError)
        }

        processedBookings.push({
          bookingId: booking.id,
          reference: booking.booking_reference,
          customerEmail: userProfile?.email || '',
          deadline: booking.payment_deadline,
          updatedAt: new Date().toISOString()
        })

      } catch (error) {
        console.error(`❌ Error processing booking ${booking.booking_reference}:`, error)
        failedBookings.push({
          bookingId: booking.id,
          reference: booking.booking_reference,
          error: error instanceof Error ? error.message : 'Unknown error'
        })
      }
    }

    console.log(`✅ Payment deadline check completed: ${processedBookings.length} processed, ${failedBookings.length} failed`)

    return ApiResponseHandler.success({
      message: `Payment deadline check completed`,
      processedCount: processedBookings.length,
      failedCount: failedBookings.length,
      processedBookings,
      failedBookings,
      executedAt: new Date().toISOString()
    })

  } catch (error) {
    console.error('❌ Payment deadline check failed:', error)
    return ApiResponseHandler.serverError('Payment deadline check failed')
  }
}

/**
 * Manual trigger endpoint (for testing or admin use)
 * Requires admin authentication
 */
export async function POST(request: NextRequest) {
  try {
    // Get current session and verify admin role
    const authHeader = request.headers.get('authorization')
    if (!authHeader?.startsWith('Bearer ')) {
      return ApiResponseHandler.unauthorized('Authentication required')
    }

    // For manual trigger, we'll run the same logic as GET
    return await GET(request)
  } catch (error) {
    console.error('❌ Manual payment deadline check failed:', error)
    return ApiResponseHandler.serverError('Manual payment deadline check failed')
  }
}