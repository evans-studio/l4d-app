import { NextRequest } from 'next/server'
import { PricingService } from '@/lib/services/pricing'
import { ApiResponseHandler } from '@/lib/api/response'

export async function GET(request: NextRequest) {
  try {
    const pricingService = new PricingService()
    const result = await pricingService.getPricingRules()

    if (!result.success) {
      return ApiResponseHandler.error(
        result.error?.message || 'Failed to fetch pricing rules',
        'FETCH_PRICING_RULES_FAILED'
      )
    }

    return ApiResponseHandler.success(result.data)

  } catch (error) {
    console.error('Get pricing rules error:', error)
    return ApiResponseHandler.serverError('Failed to fetch pricing rules')
  }
}