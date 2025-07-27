import { NextRequest } from 'next/server'
import { ServicesService } from '@/lib/services/services'
import { ApiResponseHandler } from '@/lib/api/response'

export async function GET(request: NextRequest) {
  try {
    const servicesService = new ServicesService()
    const result = await servicesService.getVehicleSizes()

    if (!result.success) {
      return ApiResponseHandler.error(
        result.error?.message || 'Failed to fetch vehicle sizes',
        'FETCH_VEHICLE_SIZES_FAILED'
      )
    }

    return ApiResponseHandler.success(result.data, {
      pagination: {
        page: 1,
        limit: result.data?.length || 0,
        total: result.data?.length || 0,
        totalPages: 1
      }
    })

  } catch (error) {
    console.error('Get vehicle sizes error:', error)
    return ApiResponseHandler.serverError('Failed to fetch vehicle sizes')
  }
}