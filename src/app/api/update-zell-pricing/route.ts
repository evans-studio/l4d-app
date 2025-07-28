import { NextRequest } from 'next/server'
import { ApiResponseHandler } from '@/lib/api/response'
import { createAdminClient } from '@/lib/supabase/server'

// Update pricing to Zell's exact requirements (no auth required for development)
export async function POST(request: NextRequest) {
  try {
    const supabase = createAdminClient()

    // Update Full Valet base price to £55
    const { error: serviceError } = await supabase
      .from('services')
      .update({ base_price: 55.00 })
      .eq('name', 'Full Valet')

    if (serviceError) {
      return ApiResponseHandler.serverError(`Service update failed: ${serviceError.message}`)
    }

    // Update vehicle size multipliers for exact pricing
    // Small: £55 (1.0x), Medium: £60 (1.09x), Large: £65 (1.18x), Extra Large: £75 (1.36x)
    const updates = [
      { name: 'Small', multiplier: 1.0 },
      { name: 'Medium', multiplier: 60/55 },
      { name: 'Large', multiplier: 65/55 },
      { name: 'Extra Large', multiplier: 75/55 }
    ]

    for (const update of updates) {
      const { error } = await supabase
        .from('vehicle_sizes')
        .update({ price_multiplier: update.multiplier })
        .eq('name', update.name)
      
      if (error) {
        return ApiResponseHandler.serverError(`Failed to update ${update.name}: ${error.message}`)
      }
    }

    // Verify the pricing
    const { data: verification } = await supabase
      .from('services')
      .select(`
        name,
        base_price
      `)
      .eq('name', 'Full Valet')
      .single()

    const { data: sizes } = await supabase
      .from('vehicle_sizes')
      .select('name, price_multiplier')
      .order('display_order')

    const finalPricing = sizes?.map(size => ({
      size: size.name,
      price: Math.round((verification?.base_price || 55) * size.price_multiplier)
    }))

    return ApiResponseHandler.success({
      message: 'Pricing updated to Zell\'s requirements',
      fullValetBasePrice: verification?.base_price,
      finalPricing: finalPricing
    })

  } catch (error) {
    console.error('Update pricing error:', error)
    return ApiResponseHandler.serverError(`Pricing update failed: ${error}`)
  }
}