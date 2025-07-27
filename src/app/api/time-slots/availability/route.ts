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
    
    const validation = ApiValidation.validateQuery(queryParams, availabilityQuerySchema)
    if (!validation.success) {
      return validation.error
    }

    const bookingService = new BookingService()
    const result = await bookingService.getAvailabilityForDateRange(
      validation.data.date_from,
      validation.data.date_to
    )

    if (!result.success) {
      return ApiResponseHandler.error(
        result.error?.message || 'Failed to fetch availability',
        'FETCH_AVAILABILITY_FAILED'
      )
    }

    return ApiResponseHandler.success({
      availability: result.data,
      query: {
        date_from: validation.data.date_from,
        date_to: validation.data.date_to,
        total_days: result.data?.length || 0,
      }
    })

  } catch (error) {
    console.error('Get availability error:', error)
    return ApiResponseHandler.serverError('Failed to fetch availability')
  }
}