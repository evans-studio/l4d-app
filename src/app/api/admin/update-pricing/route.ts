import { NextRequest } from 'next/server'
import { ApiResponseHandler } from '@/lib/api/response'
import { createAdminClient } from '@/lib/supabase/server'

// Update pricing to Zell's exact requirements
export async function POST(request: NextRequest) {
  try {
    const supabase = createAdminClient()

    // Full Valet pricing: Small: £55, Medium: £60, Large: £65, Extra Large: £75
    // Base price will be £55 (Small), multipliers calculated from that
    const fullValetBasePrice = 55.00

    // Calculate multipliers based on Zell's pricing
    // Small: £55 = 1.0x, Medium: £60 = 1.09x, Large: £65 = 1.18x, Extra Large: £75 = 1.36x
    const vehicleSizeUpdates = [
      { name: 'Small', price_multiplier: 1.0 },
      { name: 'Medium', price_multiplier: 60/55 }, // 1.09
      { name: 'Large', price_multiplier: 65/55 },  // 1.18  
      { name: 'Extra Large', price_multiplier: 75/55 } // 1.36
    ]

    // Update Full Valet service base price
    const { error: serviceUpdateError } = await supabase
      .from('services')
      .update({ base_price: fullValetBasePrice })
      .eq('name', 'Full Valet')

    if (serviceUpdateError) {
      return ApiResponseHandler.serverError(`Failed to update Full Valet price: ${serviceUpdateError.message}`)
    }

    // Update vehicle size multipliers
    const updatePromises = vehicleSizeUpdates.map(async (update) => {
      const { error } = await supabase
        .from('vehicle_sizes')
        .update({ price_multiplier: update.price_multiplier })
        .eq('name', update.name)
      
      if (error) {
        console.error(`Failed to update ${update.name}:`, error)
        return { name: update.name, success: false, error: error.message }
      }
      
      return { name: update.name, success: true, multiplier: update.price_multiplier }
    })

    const results = await Promise.all(updatePromises)

    // Calculate final pricing for verification
    const finalPricing = vehicleSizeUpdates.map(update => ({
      size: update.name,
      price: Math.round(fullValetBasePrice * update.price_multiplier),
      multiplier: update.price_multiplier
    }))

    return ApiResponseHandler.success({
      message: 'Pricing updated to Zell\'s requirements',
      fullValetBasePrice: fullValetBasePrice,
      vehicleSizeUpdates: results,
      finalPricing: finalPricing
    })

  } catch (error) {
    console.error('Update pricing error:', error)
    return ApiResponseHandler.serverError(`Pricing update failed: ${error}`)
  }
}