import { NextRequest } from 'next/server'
import { PricingService } from '@/lib/services/pricing'
import { ApiResponseHandler } from '@/lib/api/response'
import { ApiValidation } from '@/lib/api/validation'
import { z } from 'zod'
import { logger } from '@/lib/utils/logger'

const pricingCalculationSchema = z.object({
  serviceId: z.string().uuid('Invalid service ID'),
  vehicleSize: z.enum(['S', 'M', 'L', 'XL']),
  distanceKm: z.number().min(0).optional(),
  customPostcode: z.string().optional(),
})

const multiplePricingSchema = z.object({
  serviceIds: z.array(z.string().uuid()).min(1, 'At least one service ID is required'),
  vehicleSize: z.enum(['S', 'M', 'L', 'XL']),
  distanceKm: z.number().min(0).optional(),
  customPostcode: z.string().optional(),
})

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    
    // Check if this is a multiple services calculation
    if (body.serviceIds && Array.isArray(body.serviceIds)) {
      const validation = await ApiValidation.validateBody(body, multiplePricingSchema)
      if (!validation.success) {
        return validation.error
      }

      const pricingService = new PricingService()
      const result = await pricingService.calculateMultipleServices(
        validation.data.serviceIds,
        validation.data.vehicleSize,
        validation.data.distanceKm,
        validation.data.customPostcode
      )

      if (!result.success) {
        return ApiResponseHandler.error(
          result.error?.message || 'Failed to calculate pricing',
          'PRICING_CALCULATION_FAILED'
        )
      }

      type Calc = { totalPrice?: number; distanceSurcharge?: number; distanceKm?: number }
      const totalPrice = result.data?.reduce((sum: number, calc: Calc) => sum + (calc?.totalPrice || 0), 0) || 0
      const totalDistanceSurcharge = result.data?.[0]?.distanceSurcharge || 0

      return ApiResponseHandler.success({
        calculations: result.data,
        summary: {
          totalServices: result.data?.length || 0,
          totalPrice,
          totalDistanceSurcharge,
          distanceKm: result.data?.[0]?.distanceKm,
        },
      })
    } else {
      // Single service calculation
      const validation = await ApiValidation.validateBody(body, pricingCalculationSchema)
      if (!validation.success) {
        return validation.error
      }

      logger.debug('💰 Single service pricing calculation requested', { request: validation.data })
      
      const pricingService = new PricingService()
      const result = await pricingService.calculateServicePrice(validation.data)

      logger.debug('📊 Pricing service result', { result })

      if (!result.success) {
        logger.error('❌ Pricing calculation failed', result.error instanceof Error ? result.error : undefined)
        return ApiResponseHandler.error(
          result.error?.message || 'Failed to calculate pricing',
          'PRICING_CALCULATION_FAILED'
        )
      }

      logger.debug('✅ Returning pricing data', { data: result.data })
      return ApiResponseHandler.success(result.data)
    }

  } catch (error) {
    logger.error('Pricing calculation error', error instanceof Error ? error : undefined)
    return ApiResponseHandler.serverError('Failed to calculate pricing')
  }
}