import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase/direct'
import { createClientFromRequest } from '@/lib/supabase/server'
import { ApiResponseHandler } from '@/lib/api/response'

/**
 * Admin-only endpoint to align existing bookings with new payment status flow
 * This endpoint will:
 * 1. Set status = 'pending' for bookings where payment_status = 'pending' AND status = 'confirmed'
 * 2. Ensure payment deadlines are set for existing pending bookings
 * 3. Update status history records for these changes
 */
export async function POST(request: NextRequest) {
  try {
    const supabase = createClientFromRequest(request)
    
    // Get current session and verify admin role
    const { data: { session }, error: sessionError } = await supabase.auth.getSession()
    
    if (sessionError || !session?.user) {
      return ApiResponseHandler.unauthorized('Authentication required')
    }

    // Check user role
    const { data: profile } = await supabase
      .from('user_profiles')
      .select('role')
      .eq('id', session.user.id)
      .single()

    if (!profile || (profile.role !== 'admin' && profile.role !== 'super_admin')) {
      return ApiResponseHandler.forbidden('Admin access required')
    }

    console.log('🔄 Starting booking status alignment migration...')

    // Step 1: Find bookings that need status alignment
    const { data: bookingsToAlign, error: fetchError } = await supabaseAdmin
      .from('bookings')
      .select(`
        id,
        booking_reference,
        status,
        payment_status,
        payment_deadline,
        created_at,
        customer_id,
        admin_notes
      `)
      .eq('status', 'confirmed')
      .eq('payment_status', 'pending')

    if (fetchError) {
      console.error('❌ Error fetching bookings to align:', fetchError)
      return ApiResponseHandler.serverError('Failed to fetch bookings for alignment')
    }

    if (!bookingsToAlign || bookingsToAlign.length === 0) {
      console.log('✅ No bookings need status alignment')
      return ApiResponseHandler.success({
        message: 'No bookings required alignment',
        alignedCount: 0,
        bookingsProcessed: []
      })
    }

    console.log(`📋 Found ${bookingsToAlign.length} bookings that need status alignment`)

    const alignedBookings = []
    const failedBookings = []

    // Step 2: Process each booking that needs alignment
    for (const booking of bookingsToAlign) {
      try {
        console.log(`📝 Processing booking: ${booking.booking_reference}`)

        // Calculate payment deadline if not set (48 hours from creation)
        let paymentDeadline = booking.payment_deadline
        if (!paymentDeadline) {
          const createdAt = new Date(booking.created_at)
          paymentDeadline = new Date(createdAt.getTime() + 48 * 60 * 60 * 1000).toISOString()
        }

        // Update booking status and ensure payment deadline is set
        const { data: updatedBooking, error: updateError } = await supabaseAdmin
          .from('bookings')
          .update({
            status: 'pending',
            payment_deadline: paymentDeadline,
            admin_notes: `${booking.admin_notes || ''}\\n\\n[${new Date().toISOString()}] Status aligned to new payment flow - changed from confirmed to pending (awaiting payment)`.trim(),
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

        // Add status history entry for the alignment
        await supabaseAdmin
          .from('booking_status_history')
          .insert({
            booking_id: booking.id,
            from_status: 'confirmed',
            to_status: 'pending',
            changed_by: session.user.id,
            reason: 'Status alignment migration - booking status corrected to reflect pending payment',
            created_at: new Date().toISOString()
          })

        console.log(`✅ Successfully aligned booking: ${booking.booking_reference}`)
        alignedBookings.push({
          bookingId: booking.id,
          reference: booking.booking_reference,
          previousStatus: 'confirmed',
          newStatus: 'pending',
          paymentDeadline: paymentDeadline
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

    console.log(`✅ Booking status alignment completed: ${alignedBookings.length} aligned, ${failedBookings.length} failed`)

    return ApiResponseHandler.success({
      message: `Booking status alignment completed`,
      alignedCount: alignedBookings.length,
      failedCount: failedBookings.length,
      alignedBookings,
      failedBookings,
      executedAt: new Date().toISOString()
    })

  } catch (error) {
    console.error('❌ Booking status alignment migration failed:', error)
    return ApiResponseHandler.serverError('Booking status alignment migration failed')
  }
}

/**
 * Get preview of bookings that would be affected by alignment
 */
export async function GET(request: NextRequest) {
  try {
    const supabase = createClientFromRequest(request)
    
    // Get current session and verify admin role
    const { data: { session }, error: sessionError } = await supabase.auth.getSession()
    
    if (sessionError || !session?.user) {
      return ApiResponseHandler.unauthorized('Authentication required')
    }

    // Check user role
    const { data: profile } = await supabase
      .from('user_profiles')
      .select('role')
      .eq('id', session.user.id)
      .single()

    if (!profile || (profile.role !== 'admin' && profile.role !== 'super_admin')) {
      return ApiResponseHandler.forbidden('Admin access required')
    }

    // Find bookings that would be affected by alignment
    const { data: bookingsToAlign, error: fetchError } = await supabaseAdmin
      .from('bookings')
      .select(`
        id,
        booking_reference,
        status,
        payment_status,
        payment_deadline,
        created_at,
        total_price,
        scheduled_date,
        user_profiles!bookings_customer_id_fkey (
          first_name,
          last_name,
          email
        )
      `)
      .eq('status', 'confirmed')
      .eq('payment_status', 'pending')
      .order('created_at', { ascending: false })

    if (fetchError) {
      console.error('Error fetching bookings preview:', fetchError)
      return ApiResponseHandler.serverError('Failed to fetch bookings preview')
    }

    return ApiResponseHandler.success({
      message: `Found ${bookingsToAlign?.length || 0} bookings that need status alignment`,
      bookingsToAlign: bookingsToAlign || [],
      previewGenerated: new Date().toISOString()
    })

  } catch (error) {
    console.error('Booking alignment preview failed:', error)
    return ApiResponseHandler.serverError('Failed to generate alignment preview')
  }
}