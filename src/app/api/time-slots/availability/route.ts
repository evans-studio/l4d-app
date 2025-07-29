import { NextRequest } from 'next/server'
import { createClientFromRequest } from '@/lib/supabase/server'
import { BookingService } from '@/lib/services/booking'
import { ApiResponseHandler } from '@/lib/api/response'
import { ApiValidation } from '@/lib/api/validation'
import { z } from 'zod'

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
    const supabase = createClientFromRequest(request)

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

    // Fetch available time slots for the date
    const { data: timeSlots, error } = await supabase
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

    if (error) {
      console.error('Error fetching time slots:', error)
      return ApiResponseHandler.serverError('Failed to fetch availability')
    }

    // Transform data for frontend consumption
    const transformedSlots = timeSlots?.map(slot => ({
      id: slot.id,
      date: slot.slot_date,
      start_time: slot.start_time,
      is_available: slot.is_available,
      last_updated: slot.created_at,
      notes: slot.notes,
      booking_reference: slot.bookings?.[0]?.booking_reference || null,
      booking_status: slot.bookings?.[0]?.status || null
    })) || []

    return ApiResponseHandler.success(transformedSlots, `Found ${transformedSlots.length} time slots for ${date}`)

  } catch (error) {
    console.error('Single date availability error:', error)
    return ApiResponseHandler.serverError('Failed to fetch availability')
  }
}