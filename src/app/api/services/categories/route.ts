import { NextRequest } from 'next/server'
import { ServicesService } from '@/lib/services/services'
import { ApiResponseHandler } from '@/lib/api/response'

export async function GET(request: NextRequest) {
  try {
    const servicesService = new ServicesService()
    const result = await servicesService.getServiceCategories()

    if (!result.success) {
      return ApiResponseHandler.error(
        result.error?.message || 'Failed to fetch service categories',
        'FETCH_CATEGORIES_FAILED'
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
    console.error('Get service categories error:', error)
    return ApiResponseHandler.serverError('Failed to fetch service categories')
  }
}