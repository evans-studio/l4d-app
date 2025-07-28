import { NextRequest } from 'next/server'
import { ServicesService } from '@/lib/services/services'
import { ApiResponseHandler } from '@/lib/api/response'
import { ApiValidation } from '@/lib/api/validation'
import { ApiAuth } from '@/lib/api/auth'
import { z } from 'zod'

const updateServiceSchema = z.object({
  name: z.string().min(1).optional(),
  shortDescription: z.string().min(1).optional(),
  longDescription: z.string().optional(),
  basePrice: z.number().min(0).optional(),
  categoryId: z.string().uuid().optional(),
  estimatedDuration: z.number().min(0).optional(),
  isActive: z.boolean().optional(),
  displayOrder: z.number().min(0).optional(),
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
    console.error('Get service error:', error)
    return ApiResponseHandler.serverError('Failed to fetch service')
  }
}

export async function PUT(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const params = await context.params
  try {
    // Require admin role for updating services
    const { auth, error: authError } = await ApiAuth.requireRole(['admin', 'super_admin'])
    if (authError) {
      return authError
    }

    const body = await request.json()
    const validation = await ApiValidation.validateBody(body, updateServiceSchema)
    if (!validation.success) {
      return validation.error
    }

    const servicesService = new ServicesService()
    const result = await servicesService.updateService(params.id, validation.data)

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
    console.error('Update service error:', error)
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
    const { auth, error: authError } = await ApiAuth.requireRole(['admin', 'super_admin'])
    if (authError) {
      return authError
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
    console.error('Delete service error:', error)
    return ApiResponseHandler.serverError('Failed to delete service')
  }
}