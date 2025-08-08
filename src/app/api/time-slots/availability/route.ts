import { NextRequest } from 'next/server'
import { createClientFromRequest } from '@/lib/supabase/server'
import { supabaseAdmin } from '@/lib/supabase/direct'
import { BookingService } from '@/lib/services/booking'
import { ApiResponseHandler } from '@/lib/api/response'
import { ApiValidation } from '@/lib/api/validation'
import { z } from 'zod'
import { BOOKING_BUFFER_MINUTES, isTimeSlotPast, getPastSlotFilter } from '@/lib/utils/time-validation'

const availabilityQuerySchema = z.object({
  date_from: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Invalid date format'),
  date_to: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Invalid date format'),
})

export const runtime = 'nodejs'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const queryParams = Object.fromEntries(searchParams.entries())
    
    // Check if this is a single date request (for real-time hook)
    const singleDate = queryParams.date
    if (singleDate) {
      return handleSingleDateRequest(request, singleDate)
    }
    
    // Handle date range requests (existing functionality)
    const today = new Date().toISOString().split('T')[0]
    const endDate = (() => {
      const end = new Date()
      end.setDate(end.getDate() + 14)
      return end.toISOString().split('T')[0]
    })()

    const dateFrom = queryParams.date_from || today
    const dateTo = queryParams.date_to || endDate

    // Validate date format if provided
    if (queryParams.date_from || queryParams.date_to) {
      const validation = ApiValidation.validateQuery({ 
        date_from: dateFrom!, 
        date_to: dateTo! 
      }, availabilityQuerySchema)
      if (!validation.success) {
        return validation.error
      }
    }

    const bookingService = new BookingService()
    const result = await bookingService.getAvailabilityForDateRange(dateFrom!, dateTo!)

    if (!result.success) {
      return ApiResponseHandler.error(
        result.error?.message || 'Failed to fetch availability',
        'FETCH_AVAILABILITY_FAILED'
      )
    }

    return ApiResponseHandler.success({
      availability: result.data,
      query: {
        date_from: dateFrom!,
        date_to: dateTo!,
        total_days: result.data?.length || 0,
      }
    })

  } catch (error) {
    console.error('Get availability error:', error)
    return ApiResponseHandler.serverError('Failed to fetch availability')
  }
}

async function handleSingleDateRequest(request: NextRequest, date: string) {
  try {
    // Use admin client to bypass RLS for time slot queries
    const supabase = supabaseAdmin

    // Validate date format
    const dateRegex = /^\d{4}-\d{2}-\d{2}$/
    if (!dateRegex.test(date)) {
      return ApiResponseHandler.badRequest('Invalid date format. Use YYYY-MM-DD')
    }

    // Check if date is in the past
    const requestedDate = new Date(date)
    const today = new Date()
    today.setHours(0, 0, 0, 0)

    if (requestedDate < today) {
      return ApiResponseHandler.badRequest('Cannot fetch availability for past dates')
    }

    // Get filter for past slots with buffer time
    const pastSlotFilter = getPastSlotFilter(BOOKING_BUFFER_MINUTES)

    // Fetch available time slots for the date
    let query = supabase
      .from('time_slots')
      .select(`
        id,
        slot_date,
        start_time,
        is_available,
        created_by,
        notes,
        created_at,
        bookings!time_slot_id(
          id,
          booking_reference,
          status
        )
      `)
      .eq('slot_date', date)
      .order('start_time', { ascending: true })

    // If requesting today's slots, filter out past times with buffer
    if (date === pastSlotFilter.date) {
      query = query.gt('start_time', pastSlotFilter.time)
    }

    const { data: timeSlots, error } = await query

    if (error) {
      console.error('Error fetching time slots:', error)
      return ApiResponseHandler.serverError('Failed to fetch availability')
    }

    
    
    // Transform data to match admin API format for consistency
    const transformedSlots = timeSlots?.map(slot => {
      const booking = slot.bookings?.[0]
      
      
      
      return {
        id: slot.id,
        slot_date: slot.slot_date, // Keep consistent with admin API
        start_time: slot.start_time,
        is_available: slot.is_available,
        notes: slot.notes,
        created_at: slot.created_at, // Keep consistent with admin API
        booking: booking ? {
          id: booking.id,
          booking_reference: booking.booking_reference,
          status: booking.status
        } : null
      }
    }) || []

    

    return ApiResponseHandler.success(transformedSlots, `Found ${transformedSlots.length} time slots for ${date}`)

  } catch (error) {
    console.error('Single date availability error:', error)
    return ApiResponseHandler.serverError('Failed to fetch availability')
  }
}