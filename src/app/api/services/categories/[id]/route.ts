import { NextRequest } from 'next/server'
import { ServicesService } from '@/lib/services/services'
import { ApiResponseHandler } from '@/lib/api/response'
import { ApiValidation } from '@/lib/api/validation'
import { ApiAuth } from '@/lib/api/auth'
import { z } from 'zod'

const updateCategorySchema = z.object({
  name: z.string().min(1).max(100).optional(),
  description: z.string().optional(),
  displayOrder: z.number().min(0).optional(),
  isActive: z.boolean().optional(),
})

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const params = await context.params
  try {
    const servicesService = new ServicesService()
    const result = await servicesService.getServiceCategoryById(params.id)

    if (!result.success) {
      if (result.error?.message?.includes('not found')) {
        return ApiResponseHandler.error('Service category not found', 'CATEGORY_NOT_FOUND', 404)
      }
      
      return ApiResponseHandler.error(
        result.error?.message || 'Failed to fetch service category',
        'FETCH_CATEGORY_FAILED'
      )
    }

    return ApiResponseHandler.success(result.data)

  } catch (error) {
    console.error('Get service category error:', error)
    return ApiResponseHandler.serverError('Failed to fetch service category')
  }
}

export async function PUT(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const params = await context.params
  try {
    // Require admin role for updating categories
    const { auth, error: authError } = await ApiAuth.requireRole(['admin', 'super_admin'])
    if (authError) {
      return authError
    }

    const body = await request.json()
    const validation = await ApiValidation.validateBody(body, updateCategorySchema)
    if (!validation.success) {
      return validation.error
    }

    const updateData: any = {}
    if (validation.data.name !== undefined) updateData.name = validation.data.name
    if (validation.data.description !== undefined) updateData.description = validation.data.description
    if (validation.data.displayOrder !== undefined) updateData.display_order = validation.data.displayOrder
    if (validation.data.isActive !== undefined) updateData.is_active = validation.data.isActive

    const servicesService = new ServicesService()
    const result = await servicesService.updateServiceCategory(params.id, updateData)

    if (!result.success) {
      if (result.error?.message?.includes('not found')) {
        return ApiResponseHandler.error('Service category not found', 'CATEGORY_NOT_FOUND', 404)
      }
      
      return ApiResponseHandler.error(
        result.error?.message || 'Failed to update service category',
        'UPDATE_CATEGORY_FAILED'
      )
    }

    return ApiResponseHandler.success(result.data)

  } catch (error) {
    console.error('Update service category error:', error)
    return ApiResponseHandler.serverError('Failed to update service category')
  }
}

export async function DELETE(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const params = await context.params
  try {
    // Require admin role for deleting categories
    const { auth, error: authError } = await ApiAuth.requireRole(['admin', 'super_admin'])
    if (authError) {
      return authError
    }

    const servicesService = new ServicesService()
    
    // Check if category has services before deleting
    const servicesResult = await servicesService.getAllServices({ categoryId: params.id })
    if (servicesResult.success && servicesResult.data && servicesResult.data.length > 0) {
      return ApiResponseHandler.error(
        'Cannot delete category with existing services. Please move or delete services first.',
        'CATEGORY_HAS_SERVICES',
        400
      )
    }

    const result = await servicesService.deleteServiceCategory(params.id)

    if (!result.success) {
      if (result.error?.message?.includes('not found')) {
        return ApiResponseHandler.error('Service category not found', 'CATEGORY_NOT_FOUND', 404)
      }
      
      return ApiResponseHandler.error(
        result.error?.message || 'Failed to delete service category',
        'DELETE_CATEGORY_FAILED'
      )
    }

    return ApiResponseHandler.success({ message: 'Service category deleted successfully' })

  } catch (error) {
    console.error('Delete service category error:', error)
    return ApiResponseHandler.serverError('Failed to delete service category')
  }
}