import { NextRequest } from 'next/server'
import { PricingService } from '@/lib/services/pricing'
import { ApiResponseHandler } from '@/lib/api/response'

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const params = await context.params
  try {
    const pricingService = new PricingService()
    const result = await pricingService.getServicePriceRange(params.id)

    if (!result.success) {
      if (result.error?.message?.includes('not found')) {
        return ApiResponseHandler.error('Service not found', 'SERVICE_NOT_FOUND', 404)
      }
      
      return ApiResponseHandler.error(
        result.error?.message || 'Failed to fetch service pricing',
        'FETCH_SERVICE_PRICING_FAILED'
      )
    }

    return ApiResponseHandler.success(result.data)

  } catch (error) {
    console.error('Get service pricing error:', error)
    return ApiResponseHandler.serverError('Failed to fetch service pricing')
  }
}