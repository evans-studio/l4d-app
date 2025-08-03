import { NextRequest } from 'next/server'
import { ApiResponseHandler } from '@/lib/api/response'

export async function GET(request: NextRequest) {
  try {
    // Define vehicle sizes directly since table no longer exists (denormalized structure)
    const vehicleSizes = [
      { id: 'small', name: 'Small', display_order: 1 },
      { id: 'medium', name: 'Medium', display_order: 2 },
      { id: 'large', name: 'Large', display_order: 3 },
      { id: 'extra_large', name: 'Extra Large', display_order: 4 }
    ]

    return ApiResponseHandler.success(vehicleSizes)

  } catch (error) {
    console.error('Vehicle sizes fetch error:', error)
    return ApiResponseHandler.serverError(`Failed to fetch vehicle sizes: ${error instanceof Error ? error.message : 'Unknown error'}`)
  }
}