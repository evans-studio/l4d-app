import { NextRequest } from 'next/server'
import { createAdminClient } from '@/lib/supabase/server'
import { ApiResponseHandler } from '@/lib/api/response'

export async function GET(request: NextRequest) {
  try {
    // Vehicle sizes are public data needed for pricing calculation
    const supabase = createAdminClient()

    // Get vehicle sizes from database
    const { data: vehicleSizes, error: vehicleSizesError } = await supabase
      .from('vehicle_sizes')
      .select(`
        id,
        name,
        description,
        price_multiplier,
        examples,
        display_order,
        is_active
      `)
      .eq('is_active', true)
      .order('display_order', { ascending: true })

    if (vehicleSizesError) {
      console.error('Error fetching vehicle sizes:', vehicleSizesError)
      
      // Fallback to hardcoded data if database query fails
      return ApiResponseHandler.success([
        {
          id: '1',
          name: 'Small',
          description: 'City cars and small hatchbacks',
          price_multiplier: 1.0,
          examples: ['Ford Fiesta', 'Volkswagen Polo', 'Toyota Yaris'],
          display_order: 1,
          is_active: true
        },
        {
          id: '2', 
          name: 'Medium',
          description: 'Family saloons and medium SUVs',
          price_multiplier: 1.25,
          examples: ['Ford Focus', 'Volkswagen Golf', 'Toyota Corolla'],
          display_order: 2,
          is_active: true
        },
        {
          id: '3',
          name: 'Large', 
          description: 'Large saloons and SUVs',
          price_multiplier: 1.5,
          examples: ['BMW 5 Series', 'Audi A6', 'Ford Mondeo'],
          display_order: 3,
          is_active: true
        },
        {
          id: '4',
          name: 'Extra Large',
          description: 'Luxury cars and large SUVs', 
          price_multiplier: 2.0,
          examples: ['BMW X5', 'Audi Q7', 'Range Rover'],
          display_order: 4,
          is_active: true
        }
      ])
    }

    return ApiResponseHandler.success(vehicleSizes || [])

  } catch (error) {
    console.error('Vehicle sizes error:', error)
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred'
    return ApiResponseHandler.serverError(`Vehicle sizes API error: ${errorMessage}`)
  }
}