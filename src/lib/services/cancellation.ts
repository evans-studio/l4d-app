/**
 * Cancellation Service with 24-Hour Policy
 * Handles booking cancellations with proper business logic, time slot management, and notifications
 */

import { BaseService, ServiceResponse } from './base'
import { EmailService } from './email'
import { supabaseAdmin } from '@/lib/supabase/direct'
import { logger } from '@/lib/utils/logger'

export interface CancellationPolicyCheck {
  canCancel: boolean
  isWithin24Hours: boolean
  hoursUntilAppointment: number
  refundEligible: boolean
  warningMessage?: string
}

export interface CancellationRequest {
  bookingId: string
  customerId: string
  reason: string
  acknowledgeNoRefund?: boolean // Required if within 24 hours
}

export interface CancellationResult {
  booking: {
    id: string
    booking_reference: string
    status: string
    cancelled_at?: string | null
    cancellation_reason?: string | null
  }
  policyInfo: CancellationPolicyCheck
  timeSlotFreed: boolean
  emailSent: boolean
  refundAmount?: number
}

export class CancellationService extends BaseService {

  /**
   * Check cancellation policy for a booking
   */
  async checkCancellationPolicy(bookingId: string): Promise<ServiceResponse<CancellationPolicyCheck>> {
    try {
      const { data: booking, error } = await supabaseAdmin
        .from('bookings')
        .select('id, scheduled_date, scheduled_start_time, status, total_price')
        .eq('id', bookingId)
        .single()

      if (error || !booking) {
        return {
                    success: false,
          data: undefined,
          error: { message: 'Booking not found' }
        }
      }

      // Check if booking can be cancelled based on status
      const cancellableStatuses = ['confirmed', 'pending', 'rescheduled']
      const canCancelByStatus = cancellableStatuses.includes(booking.status)

      if (!canCancelByStatus) {
        return {
                    success: false,
          data: {
            canCancel: false,
            isWithin24Hours: false,
            hoursUntilAppointment: 0,
            refundEligible: false,
            warningMessage: `Cannot cancel booking with status: ${booking.status}`
          }
        }
      }

      // Calculate hours until appointment
      const appointmentDateTime = new Date(`${booking.scheduled_date}T${booking.scheduled_start_time}`)
      const now = new Date()
      const millisecondsUntilAppointment = appointmentDateTime.getTime() - now.getTime()
      const hoursUntilAppointment = millisecondsUntilAppointment / (1000 * 60 * 60)

      const isWithin24Hours = hoursUntilAppointment <= 24
      const refundEligible = !isWithin24Hours

      let warningMessage: string | undefined
      if (isWithin24Hours) {
        if (hoursUntilAppointment <= 0) {
          warningMessage = 'This appointment has already started or passed. Cancellation may not be possible.'
        } else if (hoursUntilAppointment <= 2) {
          warningMessage = `This appointment is in ${hoursUntilAppointment.toFixed(1)} hours. Cancellation within 24 hours means no refund will be provided.`
        } else {
          warningMessage = `This appointment is in ${Math.floor(hoursUntilAppointment)} hours. Cancellation within 24 hours means no refund will be provided.`
        }
      }

      return {
        success: true,
        data: {
          canCancel: hoursUntilAppointment > 0, // Can't cancel past appointments
          isWithin24Hours,
          hoursUntilAppointment: Math.max(0, hoursUntilAppointment),
          refundEligible,
          warningMessage
        }
      }

    } catch (error) {
      return {
                  success: false,
        data: undefined,
        error: { message: `Failed to check cancellation policy: ${error instanceof Error ? error.message : 'Unknown error'}` }
      }
    }
  }

  /**
   * Cancel a booking with full business logic
   */
  async cancelBooking(request: CancellationRequest): Promise<ServiceResponse<CancellationResult>> {
    try {
      // First check the cancellation policy
      const policyCheck = await this.checkCancellationPolicy(request.bookingId)
      if (!policyCheck.data) {
        return {
                    success: false,
          data: undefined,
          error: policyCheck.error || { message: 'Failed to check cancellation policy' }
        }
      }

      const policy = policyCheck.data
      
      // If within 24 hours and user hasn't acknowledged no refund, reject
      if (policy.isWithin24Hours && !request.acknowledgeNoRefund) {
        return {
                    success: false,
          data: undefined,
          error: { 
            message: 'Cancellation within 24 hours requires acknowledgment of no refund policy' 
          }
        }
      }

      // If booking cannot be cancelled, reject
      if (!policy.canCancel) {
        return {
                    success: false,
          data: undefined,
          error: { message: policy.warningMessage || 'This booking cannot be cancelled' }
        }
      }

      // Perform the atomic cancellation
      const result = await this.performAtomicCancellation(request, policy)
      
      return result

    } catch (error) {
      return {
                  success: false,
          data: undefined,
        error: { message: `Failed to cancel booking: ${error instanceof Error ? error.message : 'Unknown error'}` }
      }
    }
  }

  /**
   * Perform atomic cancellation with all database updates
   */
  private async performAtomicCancellation(
    request: CancellationRequest,
    policy: CancellationPolicyCheck
  ): Promise<ServiceResponse<CancellationResult>> {
    try {
      // Begin transaction-like operations
      const now = new Date().toISOString()

      // 1. Get booking details before update
      const { data: originalBooking, error: fetchError } = await supabaseAdmin
        .from('bookings')
        .select(`
          id, booking_reference, customer_id, time_slot_id, status, 
          scheduled_date, scheduled_start_time, total_price,
          user_profiles!inner (email, first_name, last_name)
        `)
        .eq('id', request.bookingId)
        .eq('customer_id', request.customerId)
        .single()

      if (fetchError || !originalBooking) {
        return {
                    success: false,
          data: undefined,
          error: { message: 'Booking not found or access denied' }
        }
      }

      // 2. Update booking status to cancelled
      const { data: cancelledBooking, error: updateError } = await supabaseAdmin
        .from('bookings')
        .update({
          status: 'cancelled',
          cancelled_at: now,
          cancelled_by: request.customerId,
          cancellation_reason: request.reason,
          updated_at: now
        })
        .eq('id', request.bookingId)
        .select()
        .single()

      if (updateError) {
        return {
                    success: false,
          data: undefined,
          error: { message: `Failed to update booking: ${updateError.message}` }
        }
      }

      // 3. Free the time slot immediately
      let timeSlotFreed = false
      if (originalBooking.time_slot_id) {
        const { error: timeSlotError } = await supabaseAdmin
          .from('time_slots')
          .update({
            is_available: true,
            booking_reference: null,
            booking_status: null,
            updated_at: now
          })
          .eq('id', originalBooking.time_slot_id)

        if (!timeSlotError) {
          timeSlotFreed = true
        }
      }

      // 4. Add status history entry
      await supabaseAdmin
        .from('booking_status_history')
        .insert({
          booking_id: request.bookingId,
          from_status: originalBooking.status,
          to_status: 'cancelled',
          changed_by: request.customerId,
          reason: 'Customer cancellation',
          notes: `Cancelled by customer: ${request.reason}${policy.isWithin24Hours ? ' (No refund - within 24 hours)' : ''}`,
          created_at: now
        })

      // 5. Send confirmation email
      let emailSent = false
      try {
        const emailService = new EmailService()
        const userProfile = Array.isArray(originalBooking.user_profiles) ? originalBooking.user_profiles[0] : originalBooking.user_profiles
        if (userProfile) {
          const customerName = `${userProfile.first_name} ${userProfile.last_name}`
          
          const emailResult = await emailService.sendBookingStatusUpdate(
            userProfile.email,
            customerName,
            {
              ...cancelledBooking,
              booking_reference: originalBooking.booking_reference,
              scheduled_date: originalBooking.scheduled_date,
              scheduled_start_time: originalBooking.scheduled_start_time,
              total_price: originalBooking.total_price,
              status: 'cancelled'
            } as import('@/lib/utils/booking-types').Booking,
            originalBooking.status,
            request.reason
          )
        
          emailSent = emailResult.success
        }
      } catch (emailError) {
        logger.error('Failed to send cancellation email:', emailError)
      }

      // 6. Calculate refund amount (if eligible)
      const refundAmount = policy.refundEligible ? originalBooking.total_price : 0

      return {
        data: {
          booking: cancelledBooking,
          policyInfo: policy,
          timeSlotFreed,
          emailSent,
          refundAmount
        },
        success: true
      }

    } catch (error) {
      return {
                  success: false,
          data: undefined,
        error: { message: `Atomic cancellation failed: ${error instanceof Error ? error.message : 'Unknown error'}` }
      }
    }
  }

  /**
   * Admin cancellation (can override 24-hour policy)
   */
  async adminCancelBooking(
    bookingId: string,
    adminId: string,
    reason: string,
    refundAmount?: number
  ): Promise<ServiceResponse<unknown>> {
    try {
      const now = new Date().toISOString()

      // Get booking details
      const { data: booking, error: fetchError } = await supabaseAdmin
        .from('bookings')
        .select(`
          id, booking_reference, customer_id, time_slot_id, status,
          scheduled_date, scheduled_start_time, total_price,
          user_profiles!inner (email, first_name, last_name)
        `)
        .eq('id', bookingId)
        .single()

      if (fetchError || !booking) {
        return {
                    success: false,
          data: undefined,
          error: { message: 'Booking not found' }
        }
      }

      // Update booking
      const { data: cancelledBooking, error: updateError } = await supabaseAdmin
        .from('bookings')
        .update({
          status: 'cancelled',
          cancelled_at: now,
          cancelled_by: adminId,
          cancellation_reason: reason,
          updated_at: now
        })
        .eq('id', bookingId)
        .select()
        .single()

      if (updateError) {
        return {
                    success: false,
          data: undefined,
          error: { message: `Failed to cancel booking: ${updateError.message}` }
        }
      }

      // Free time slot
      if (booking.time_slot_id) {
        await supabaseAdmin
          .from('time_slots')
          .update({
            is_available: true,
            booking_reference: null,
            booking_status: null
          })
          .eq('id', booking.time_slot_id)
      }

      // Add status history
      await supabaseAdmin
        .from('booking_status_history')
        .insert({
          booking_id: bookingId,
          from_status: booking.status,
          to_status: 'cancelled',
          changed_by: adminId,
          reason: 'Admin cancellation',
          notes: `Admin cancelled: ${reason}${refundAmount ? ` (Refund: £${refundAmount})` : ''}`,
          created_at: now
        })

      // Send admin cancellation email
      try {
        const emailService = new EmailService()
        const userProfile = Array.isArray(booking.user_profiles) ? booking.user_profiles[0] : booking.user_profiles
        if (userProfile) {
          const customerName = `${userProfile.first_name} ${userProfile.last_name}`
          
          await emailService.sendAdminBookingNotification(
            {
              ...cancelledBooking,
              booking_reference: booking.booking_reference,
              scheduled_date: booking.scheduled_date,
              scheduled_start_time: booking.scheduled_start_time,
              total_price: booking.total_price,
              status: 'cancelled'
            } as Partial<import('@/lib/utils/booking-types').Booking>,
            userProfile.email,
            customerName
          )
        }
      } catch (emailError) {
        logger.error('Failed to send admin cancellation email:', emailError)
      }

      return {
        data: {
          booking: cancelledBooking,
          refundAmount,
          timeSlotFreed: true
        },
        success: true
      }

    } catch (error) {
      return {
                  success: false,
          data: undefined,
        error: { message: `Admin cancellation failed: ${error instanceof Error ? error.message : 'Unknown error'}` }
      }
    }
  }

  /**
   * Get cancellation statistics for admin dashboard
   */
  async getCancellationStats(dateFrom?: string, dateTo?: string): Promise<ServiceResponse<unknown>> {
    try {
      let query = supabaseAdmin
        .from('bookings')
        .select('id, cancelled_at, cancellation_reason, total_price, scheduled_date, scheduled_start_time')
        .eq('status', 'cancelled')

      if (dateFrom) {
        query = query.gte('cancelled_at', dateFrom)
      }
      
      if (dateTo) {
        query = query.lte('cancelled_at', dateTo)
      }

      const { data: cancellations, error } = await query.order('cancelled_at', { ascending: false })

      if (error) {
        return {           success: false,
          data: undefined, error: { message: error.message } }
      }

      // Calculate statistics
      const stats = {
        totalCancellations: cancellations.length,
        totalRefundAmount: 0,
        within24Hours: 0,
        outside24Hours: 0,
        reasonBreakdown: {} as Record<string, number>
      }

      cancellations.forEach(cancellation => {
        // Calculate if was within 24 hours
        const appointmentTime = new Date(`${cancellation.scheduled_date}T${cancellation.scheduled_start_time}`)
        const cancellationTime = new Date(cancellation.cancelled_at)
        const hoursUntilAppointment = (appointmentTime.getTime() - cancellationTime.getTime()) / (1000 * 60 * 60)
        
        if (hoursUntilAppointment <= 24) {
          stats.within24Hours++
        } else {
          stats.outside24Hours++
          stats.totalRefundAmount += cancellation.total_price || 0
        }

        // Count reasons
        const reason = cancellation.cancellation_reason || 'No reason provided'
        stats.reasonBreakdown[reason] = (stats.reasonBreakdown[reason] || 0) + 1
      })

      return {
        data: {
          ...stats,
          cancellations
        },
        success: true
      }

    } catch (error) {
      return {
                  success: false,
          data: undefined,
        error: { message: `Failed to get cancellation stats: ${error instanceof Error ? error.message : 'Unknown error'}` }
      }
    }
  }
}