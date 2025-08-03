import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase/direct'
import { ApiResponseHandler } from '@/lib/api/response'

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
      console.error('Services fetch error:', error)
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
        
        if (pricingData && !pricingError) {
          // Extract prices from the columns, filtering out null/zero values
          if (pricingData.small && pricingData.small > 0) {
            pricingOptions.push({ vehicleSize: 'Small', price: pricingData.small, sizeOrder: 1 })
          }
          if (pricingData.medium && pricingData.medium > 0) {
            pricingOptions.push({ vehicleSize: 'Medium', price: pricingData.medium, sizeOrder: 2 })
          }
          if (pricingData.large && pricingData.large > 0) {
            pricingOptions.push({ vehicleSize: 'Large', price: pricingData.large, sizeOrder: 3 })
          }
          if (pricingData.extra_large && pricingData.extra_large > 0) {
            pricingOptions.push({ vehicleSize: 'Extra Large', price: pricingData.extra_large, sizeOrder: 4 })
          }
        }

        // If no pricing data available, provide fallback pricing based on service name
        if (pricingOptions.length === 0) {
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
            // Generic fallback
            pricingOptions.push(
              { vehicleSize: 'Small', price: 25, sizeOrder: 1 },
              { vehicleSize: 'Medium', price: 30, sizeOrder: 2 },
              { vehicleSize: 'Large', price: 35, sizeOrder: 3 },
              { vehicleSize: 'Extra Large', price: 40, sizeOrder: 4 }
            )
          }
        }

        // Use the smallest price as base price
        const basePrice = pricingOptions.length > 0 
          ? Math.min(...pricingOptions.map(p => p.price))
          : 25

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
    console.error('Homepage services API error:', error)
    return ApiResponseHandler.error(
      'Internal server error', 
      'SERVER_ERROR',
      500,
      process.env.NODE_ENV === 'development' ? error : undefined
    )
  }
}