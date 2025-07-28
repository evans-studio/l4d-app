import { NextRequest } from 'next/server'
import { ApiResponseHandler } from '@/lib/api/response'
import { createClientFromRequest } from '@/lib/supabase/server'
import { z } from 'zod'

// Validation schema
const calculatePriceSchema = z.object({
  serviceId: z.string().uuid('Invalid service ID format'),
  vehicleSize: z.enum(['small', 'medium', 'large', 'extra_large'])
})

export async function POST(request: NextRequest) {
  try {
    const supabase = createClientFromRequest(request)
    const body = await request.json()
    
    // Validate request body
    const validation = calculatePriceSchema.safeParse(body)
    if (!validation.success) {
      return ApiResponseHandler.badRequest('Invalid request data', {
        errors: validation.error.issues
      })
    }
    
    const { serviceId, vehicleSize } = validation.data
    
    // Get service details
    const { data: service, error: serviceError } = await supabase
      .from('services')
      .select('id, name, base_price, duration_minutes')
      .eq('id', serviceId)
      .eq('is_active', true)
      .single()
    
    if (serviceError || !service) {
      console.error('Error fetching service:', serviceError)
      return ApiResponseHandler.notFound('Service not found or inactive')
    }
    
    // Get vehicle size details
    const { data: vehicleSizeData, error: sizeError } = await supabase
      .from('vehicle_sizes')
      .select('id, name, price_multiplier')
      .eq('name', vehicleSize)
      .eq('is_active', true)
      .single()
    
    if (sizeError || !vehicleSizeData) {
      console.error('Error fetching vehicle size:', sizeError)
      return ApiResponseHandler.notFound('Vehicle size not found or inactive')
    }
    
    // Check for specific service pricing for this vehicle size
    const { data: servicePricing, error: pricingError } = await supabase
      .from('service_pricing')
      .select('price_adjustment')
      .eq('service_id', serviceId)
      .eq('vehicle_size_id', vehicleSizeData.id)
      .single()
    
    // Calculate pricing
    const basePrice = service.base_price
    let sizeMultiplier = vehicleSizeData.price_multiplier
    
    // If there's a specific pricing adjustment for this service/size combination, use it
    if (servicePricing && !pricingError) {
      sizeMultiplier = servicePricing.price_adjustment
    }
    
    const finalPrice = Math.round(basePrice * sizeMultiplier * 100) / 100 // Round to 2 decimal places
    
    // Create pricing breakdown
    const breakdown = {
      services: [{
        service_id: serviceId,
        service_name: service.name,
        base_price: basePrice,
        vehicle_adjustment: sizeMultiplier,
        final_price: finalPrice
      }],
      subtotal: basePrice,
      vehicle_multiplier: sizeMultiplier,
      distance_surcharge: 0, // TODO: Implement distance-based pricing
      total: finalPrice
    }
    
    return ApiResponseHandler.success({
      basePrice,
      sizeMultiplier,
      finalPrice,
      currency: 'GBP', // TODO: Make currency configurable
      breakdown,
      serviceDetails: {
        name: service.name,
        duration: service.duration_minutes,
      },
      vehicleSizeDetails: {
        name: vehicleSizeData.name,
        multiplier: sizeMultiplier,
      },
      requestParams: {
        serviceId,
        vehicleSize,
      }
    })
    
  } catch (error) {
    console.error('Unexpected error in price calculation:', error)
    return ApiResponseHandler.serverError('An unexpected error occurred')
  }
}