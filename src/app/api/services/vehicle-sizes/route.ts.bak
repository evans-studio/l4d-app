import { NextRequest, NextResponse } from 'next/server'
import { ServicesService } from '@/lib/services/services'
import { ApiResponseHandler } from '@/lib/api/response'
import { ApiValidation } from '@/lib/api/validation'
import { ApiAuth } from '@/lib/api/auth'
import { z } from 'zod'

const createVehicleSizeSchema = z.object({
  name: z.string().min(1, 'Name is required').max(50, 'Name must be less than 50 characters'),
  description: z.string().optional(),
  priceMultiplier: z.number().min(0.1).max(10, 'Price multiplier must be between 0.1 and 10'),
  examples: z.array(z.string()).optional(),
  displayOrder: z.number().min(0).default(0),
  isActive: z.boolean().default(true),
})

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

export async function POST(request: NextRequest) {
  try {
    // Require admin role for creating vehicle sizes
    const { auth, error: authError } = await ApiAuth.requireRole(request, ['admin', 'super_admin'])
    if (authError) {
      return authError
    }

    const body = await request.json()
    const validation = await ApiValidation.validateBody(body, createVehicleSizeSchema)
    if (!validation.success) {
      return validation.error
    }

    const servicesService = new ServicesService()
    const result = await servicesService.createVehicleSize({
      name: validation.data.name,
      description: validation.data.description,
      price_multiplier: validation.data.priceMultiplier,
      examples: validation.data.examples,
      display_order: validation.data.displayOrder,
      is_active: validation.data.isActive,
    })

    if (!result.success) {
      return ApiResponseHandler.error(
        result.error?.message || 'Failed to create vehicle size',
        'CREATE_VEHICLE_SIZE_FAILED'
      )
    }

    return NextResponse.json({
      success: true,
      data: result.data,
      metadata: {
        timestamp: new Date().toISOString()
      }
    }, { status: 201 })

  } catch (error) {
    console.error('Create vehicle size error:', error)
    return ApiResponseHandler.serverError('Failed to create vehicle size')
  }
}