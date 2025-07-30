import { NextRequest } from 'next/server'
import { ServicesService } from '@/lib/services/services'
import { ApiResponseHandler } from '@/lib/api/response'
import { ApiValidation } from '@/lib/api/validation'
import { authenticateAdmin } from '@/lib/api/auth-handler'
import { z } from 'zod'

const updateVehicleSizeSchema = z.object({
  name: z.string().min(1).max(50).optional(),
  description: z.string().optional(),
  priceMultiplier: z.number().min(0.1).max(10).optional(),
  examples: z.array(z.string()).optional(),
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
    const result = await servicesService.getVehicleSizeById(params.id)

    if (!result.success) {
      if (result.error?.message?.includes('not found')) {
        return ApiResponseHandler.error('Vehicle size not found', 'VEHICLE_SIZE_NOT_FOUND', 404)
      }
      
      return ApiResponseHandler.error(
        result.error?.message || 'Failed to fetch vehicle size',
        'FETCH_VEHICLE_SIZE_FAILED'
      )
    }

    return ApiResponseHandler.success(result.data)

  } catch (error) {
    console.error('Get vehicle size error:', error)
    return ApiResponseHandler.serverError('Failed to fetch vehicle size')
  }
}

export async function PUT(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const params = await context.params
  try {
    // Require admin role for updating vehicle sizes
    const authResult = await authenticateAdmin(request)
    if (!authResult.success) {
      return authResult.error
    }

    const body = await request.json()
    const validation = await ApiValidation.validateBody(body, updateVehicleSizeSchema)
    if (!validation.success) {
      return validation.error
    }

    const updateData: any = {}
    if (validation.data.name !== undefined) updateData.name = validation.data.name
    if (validation.data.description !== undefined) updateData.description = validation.data.description
    if (validation.data.priceMultiplier !== undefined) updateData.price_multiplier = validation.data.priceMultiplier
    if (validation.data.examples !== undefined) updateData.examples = validation.data.examples
    if (validation.data.displayOrder !== undefined) updateData.display_order = validation.data.displayOrder
    if (validation.data.isActive !== undefined) updateData.is_active = validation.data.isActive

    const servicesService = new ServicesService()
    const result = await servicesService.updateVehicleSize(params.id, updateData)

    if (!result.success) {
      if (result.error?.message?.includes('not found')) {
        return ApiResponseHandler.error('Vehicle size not found', 'VEHICLE_SIZE_NOT_FOUND', 404)
      }
      
      return ApiResponseHandler.error(
        result.error?.message || 'Failed to update vehicle size',
        'UPDATE_VEHICLE_SIZE_FAILED'
      )
    }

    return ApiResponseHandler.success(result.data)

  } catch (error) {
    console.error('Update vehicle size error:', error)
    return ApiResponseHandler.serverError('Failed to update vehicle size')
  }
}

export async function DELETE(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const params = await context.params
  try {
    // Require admin role for deleting vehicle sizes
    const authResult = await authenticateAdmin(request)
    if (!authResult.success) {
      return authResult.error
    }

    const servicesService = new ServicesService()
    
    // Check if vehicle size is used by any customer vehicles before deleting
    // This would require a query to check customer_vehicles table
    // For now, we'll just soft delete by setting is_active to false
    const result = await servicesService.deleteVehicleSize(params.id)

    if (!result.success) {
      if (result.error?.message?.includes('not found')) {
        return ApiResponseHandler.error('Vehicle size not found', 'VEHICLE_SIZE_NOT_FOUND', 404)
      }
      
      return ApiResponseHandler.error(
        result.error?.message || 'Failed to delete vehicle size',
        'DELETE_VEHICLE_SIZE_FAILED'
      )
    }

    return ApiResponseHandler.success({ message: 'Vehicle size deleted successfully' })

  } catch (error) {
    console.error('Delete vehicle size error:', error)
    return ApiResponseHandler.serverError('Failed to delete vehicle size')
  }
}