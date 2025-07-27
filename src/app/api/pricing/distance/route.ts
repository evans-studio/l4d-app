import { NextRequest } from 'next/server'
import { PricingService } from '@/lib/services/pricing'
import { ApiResponseHandler } from '@/lib/api/response'
import { ApiValidation } from '@/lib/api/validation'
import { z } from 'zod'

const distanceCalculationSchema = z.object({
  postcode: z.string().min(1, 'Postcode is required'),
})

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const validation = await ApiValidation.validateBody(body, distanceCalculationSchema)
    if (!validation.success) {
      return validation.error
    }

    const pricingService = new PricingService()
    const result = await pricingService.calculateDistance(validation.data.postcode)

    if (!result.success) {
      return ApiResponseHandler.error(
        result.error?.message || 'Failed to calculate distance',
        'DISTANCE_CALCULATION_FAILED'
      )
    }

    return ApiResponseHandler.success(result.data)

  } catch (error) {
    console.error('Distance calculation error:', error)
    return ApiResponseHandler.serverError('Failed to calculate distance')
  }
}