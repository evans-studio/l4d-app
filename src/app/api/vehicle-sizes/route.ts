import { NextRequest } from 'next/server'
import { createAdminClient } from '@/lib/supabase/server'
import { ApiResponseHandler } from '@/lib/api/response'

export async function GET(request: NextRequest) {
  try {
    // IMPORTANT: vehicle_sizes table has been deleted
    // System now uses service_pricing table exclusively with fields: small, medium, large, extra_large
    // This API returns standardized vehicle categories for frontend compatibility
    
    const vehicleCategories = [
      {
        id: 'small',
        name: 'Small',
        description: 'City cars and small hatchbacks',
        examples: ['Ford Fiesta', 'Volkswagen Polo', 'Toyota Yaris'],
        display_order: 1,
        is_active: true
      },
      {
        id: 'medium', 
        name: 'Medium',
        description: 'Family saloons and medium SUVs',
        examples: ['Ford Focus', 'Volkswagen Golf', 'Toyota Corolla'],
        display_order: 2,
        is_active: true
      },
      {
        id: 'large',
        name: 'Large', 
        description: 'Large saloons and SUVs',
        examples: ['BMW 5 Series', 'Audi A6', 'Ford Mondeo', 'Range Rover Evoque'],
        display_order: 3,
        is_active: true
      },
      {
        id: 'extra_large',
        name: 'Extra Large',
        description: 'Luxury cars and large SUVs', 
        examples: ['BMW X5', 'Audi Q7', 'Range Rover Sport'],
        display_order: 4,
        is_active: true
      }
    ]

    return ApiResponseHandler.success(vehicleCategories)

  } catch (error) {
    console.error('Vehicle categories error:', error)
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred'
    return ApiResponseHandler.serverError(`Vehicle categories API error: ${errorMessage}`)
  }
}