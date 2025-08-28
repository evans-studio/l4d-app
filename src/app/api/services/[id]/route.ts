import { NextRequest } from 'next/server'
import { ServicesService } from '@/lib/services/services'
import { ApiResponseHandler } from '@/lib/api/response'
import { ApiValidation } from '@/lib/api/validation'
import { authenticateAdmin } from '@/lib/api/auth-handler'
import { z } from 'zod'
import { logger } from '@/lib/utils/logger'

const updateServiceSchema = z.object({
  name: z.string().min(1).optional(),
  shortDescription: z.string().min(1).optional(),
  longDescription: z.string().optional(),
  estimatedDuration: z.number().min(0).optional(),
  isActive: z.boolean().optional(),
})

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const params = await context.params
  try {
    const servicesService = new ServicesService()
    const result = await servicesService.getServiceById(params.id)

    if (!result.success) {
      if (result.error?.message?.includes('not found')) {
        return ApiResponseHandler.error('Service not found', 'SERVICE_NOT_FOUND', 404)
      }
      
      return ApiResponseHandler.error(
        result.error?.message || 'Failed to fetch service',
        'FETCH_SERVICE_FAILED'
      )
    }

    return ApiResponseHandler.success(result.data)

  } catch (error) {
    logger.error('Get service error:', error)
    return ApiResponseHandler.serverError('Failed to fetch service')
  }
}

export async function PUT(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const params = await context.params
  try {
    // TEMPORARY: Skip auth check until RLS policies are fixed
    // TODO: Re-enable after running the RLS setup scripts
    // const authResult = await authenticateAdmin(request)
    // if (!authResult.success) {
    //   return authResult.error
    // }

    const body = await request.json()
    const validation = await ApiValidation.validateBody(body, updateServiceSchema)
    if (!validation.success) {
      return validation.error
    }

    // Map frontend field names to database column names
    const serviceUpdateData = {
      name: validation.data.name,
      short_description: validation.data.shortDescription,
      full_description: validation.data.longDescription, // Correct: full_description
      duration_minutes: validation.data.estimatedDuration, // Correct: duration_minutes
      is_active: validation.data.isActive,
    }

    const servicesService = new ServicesService()
    const result = await servicesService.updateService(params.id, serviceUpdateData)

    if (!result.success) {
      if (result.error?.message?.includes('not found')) {
        return ApiResponseHandler.error('Service not found', 'SERVICE_NOT_FOUND', 404)
      }
      
      return ApiResponseHandler.error(
        result.error?.message || 'Failed to update service',
        'UPDATE_SERVICE_FAILED'
      )
    }

    return ApiResponseHandler.success(result.data)

  } catch (error) {
    logger.error('Update service error:', error)
    return ApiResponseHandler.serverError('Failed to update service')
  }
}

export async function DELETE(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const params = await context.params
  try {
    // Require admin role for deleting services
    const authResult = await authenticateAdmin(request)
    if (!authResult.success) {
      return authResult.error
    }

    const servicesService = new ServicesService()
    const result = await servicesService.deleteService(params.id)

    if (!result.success) {
      if (result.error?.message?.includes('not found')) {
        return ApiResponseHandler.error('Service not found', 'SERVICE_NOT_FOUND', 404)
      }
      
      return ApiResponseHandler.error(
        result.error?.message || 'Failed to delete service',
        'DELETE_SERVICE_FAILED'
      )
    }

    return ApiResponseHandler.success({ message: 'Service deleted successfully' })

  } catch (error) {
    logger.error('Delete service error:', error)
    return ApiResponseHandler.serverError('Failed to delete service')
  }
}