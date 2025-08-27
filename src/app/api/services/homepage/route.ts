import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase/direct'
import { ApiResponseHandler } from '@/lib/api/response'
import { logger } from '@/lib/utils/logger'

export async function GET(request: NextRequest) {
  try {
    // Fetch services for homepage display (pricing fetched individually)
    const { data: services, error } = await supabaseAdmin
      .from('services')
      .select(`
        id,
        name,
        short_description,
        duration_minutes,
        is_active
      `)
      .eq('is_active', true)
      .order('display_order', { ascending: true })

    if (error) {
      logger.error('Services fetch error:', error)
      return ApiResponseHandler.error('Failed to fetch services', 'FETCH_ERROR')
    }

    // Use the same proven pricing fetch pattern as the booking API
    const transformedServices = await Promise.all(
      services.map(async (service) => {
        // Get pricing for this service using individual query (same as booking API)
        const { data: pricingData, error: pricingError } = await supabaseAdmin
          .from('service_pricing')
          .select('small, medium, large, extra_large')
          .eq('service_id', service.id)
          .single()

        // Build pricing array from the pricing columns
        const pricingOptions = []
        let hasPricingData = false
        
        if (pricingData && !pricingError) {
          hasPricingData = true
          // Extract prices from the columns, allowing zero values for testing
          if (pricingData.small !== null && pricingData.small !== undefined) {
            pricingOptions.push({ vehicleSize: 'Small', price: pricingData.small, sizeOrder: 1 })
          }
          if (pricingData.medium !== null && pricingData.medium !== undefined) {
            pricingOptions.push({ vehicleSize: 'Medium', price: pricingData.medium, sizeOrder: 2 })
          }
          if (pricingData.large !== null && pricingData.large !== undefined) {
            pricingOptions.push({ vehicleSize: 'Large', price: pricingData.large, sizeOrder: 3 })
          }
          if (pricingData.extra_large !== null && pricingData.extra_large !== undefined) {
            pricingOptions.push({ vehicleSize: 'Extra Large', price: pricingData.extra_large, sizeOrder: 4 })
          }
        }

        // Conditional fallback system
        let basePrice = 0
        
        if (!hasPricingData) {
          // No pricing row exists - use fallback pricing based on service name
          if (service.name.toLowerCase().includes('full valet')) {
            pricingOptions.push(
              { vehicleSize: 'Small', price: 35, sizeOrder: 1 },
              { vehicleSize: 'Medium', price: 45, sizeOrder: 2 },
              { vehicleSize: 'Large', price: 55, sizeOrder: 3 },
              { vehicleSize: 'Extra Large', price: 65, sizeOrder: 4 }
            )
          } else if (service.name.toLowerCase().includes('inside')) {
            pricingOptions.push(
              { vehicleSize: 'Small', price: 25, sizeOrder: 1 },
              { vehicleSize: 'Medium', price: 30, sizeOrder: 2 },
              { vehicleSize: 'Large', price: 35, sizeOrder: 3 },
              { vehicleSize: 'Extra Large', price: 40, sizeOrder: 4 }
            )
          } else if (service.name.toLowerCase().includes('outside')) {
            pricingOptions.push(
              { vehicleSize: 'Small', price: 20, sizeOrder: 1 },
              { vehicleSize: 'Medium', price: 25, sizeOrder: 2 },
              { vehicleSize: 'Large', price: 30, sizeOrder: 3 },
              { vehicleSize: 'Extra Large', price: 35, sizeOrder: 4 }
            )
          } else {
            // Generic fallback for services without pricing data
            pricingOptions.push(
              { vehicleSize: 'Small', price: 25, sizeOrder: 1 },
              { vehicleSize: 'Medium', price: 30, sizeOrder: 2 },
              { vehicleSize: 'Large', price: 35, sizeOrder: 3 },
              { vehicleSize: 'Extra Large', price: 40, sizeOrder: 4 }
            )
          }
          basePrice = Math.min(...pricingOptions.map(p => p.price))
        } else {
          // Pricing data exists - use actual values (including 0 for testing)
          const prices = pricingOptions.map(p => p.price).filter(price => price >= 0)
          basePrice = prices.length > 0 ? Math.min(...prices) : 0
        }

        return {
          id: service.id,
          name: service.name,
          description: service.short_description,
          duration: service.duration_minutes,
          basePrice,
          pricing: pricingOptions
        }
      })
    )

    return ApiResponseHandler.success(transformedServices)

  } catch (error) {
    logger.error('Homepage services API error:', error)
    return ApiResponseHandler.error(
      'Internal server error', 
      'SERVER_ERROR',
      500,
      process.env.NODE_ENV === 'development' ? error : undefined
    )
  }
}