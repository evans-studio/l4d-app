import { NextRequest } from 'next/server'
import { BookingService } from '@/lib/services/booking'
import { ApiResponseHandler } from '@/lib/api/response'
import { ApiValidation } from '@/lib/api/validation'
import { z } from 'zod'

const availabilityQuerySchema = z.object({
  date_from: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Invalid date format'),
  date_to: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Invalid date format'),
})

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const queryParams = Object.fromEntries(searchParams.entries())
    
    // Set defaults if no dates provided
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