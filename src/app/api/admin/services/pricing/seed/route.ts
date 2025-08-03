import { NextRequest } from 'next/server'
import { createAdminClient } from '@/lib/supabase/server'
import { ApiResponseHandler } from '@/lib/api/response'

/**
 * Seed missing service pricing data
 * This endpoint creates pricing rows for services that don't have them
 */
export async function POST(request: NextRequest) {
  try {
    const supabase = createAdminClient()
    
    // Get all services that don't have pricing data
    const { data: services, error: servicesError } = await supabase
      .from('services')
      .select('id, name, base_price')
      .eq('is_active', true)
    
    if (servicesError) {
      console.error('Error fetching services:', servicesError)
      return ApiResponseHandler.serverError('Failed to fetch services')
    }
    
    if (!services || services.length === 0) {
      return ApiResponseHandler.success({ message: 'No services found', created: 0 })
    }
    
    // Get existing pricing data
    const { data: existingPricing, error: pricingError } = await supabase
      .from('service_pricing')
      .select('service_id')
    
    if (pricingError) {
      console.error('Error fetching existing pricing:', pricingError)
      return ApiResponseHandler.serverError('Failed to fetch existing pricing')
    }
    
    const existingServiceIds = new Set(existingPricing?.map(p => p.service_id) || [])
    
    // Find services without pricing
    const servicesWithoutPricing = services.filter(service => 
      !existingServiceIds.has(service.id)
    )
    
    if (servicesWithoutPricing.length === 0) {
      return ApiResponseHandler.success({ 
        message: 'All services already have pricing data', 
        created: 0 
      })
    }
    
    // Create pricing data for missing services
    const pricingData = servicesWithoutPricing.map(service => {
      const basePrice = service.base_price || 50 // Default fallback
      
      return {
        service_id: service.id,
        service_description: service.name,
        small: Math.round(basePrice * 0.8),      // 20% discount for small
        medium: basePrice,                       // Base price for medium
        large: Math.round(basePrice * 1.2),      // 20% markup for large
        extra_large: Math.round(basePrice * 1.4) // 40% markup for extra large
      }
    })
    
    // Insert the pricing data
    const { data: insertedPricing, error: insertError } = await supabase
      .from('service_pricing')
      .insert(pricingData)
      .select('service_id')
    
    if (insertError) {
      console.error('Error inserting pricing data:', insertError)
      return ApiResponseHandler.serverError(`Failed to insert pricing data: ${insertError.message}`)
    }
    
    console.log(`Successfully created pricing for ${insertedPricing?.length || 0} services`)
    
    return ApiResponseHandler.success({
      message: `Successfully created pricing data for ${insertedPricing?.length || 0} services`,
      created: insertedPricing?.length || 0,
      services: servicesWithoutPricing.map(s => ({ id: s.id, name: s.name }))
    })
    
  } catch (error) {
    console.error('Pricing seed error:', error)
    return ApiResponseHandler.serverError('Failed to seed pricing data')
  }
}