import { NextRequest, NextResponse } from 'next/server'
import { ServicesService } from '@/lib/services/services'
import { ApiResponseHandler } from '@/lib/api/response'
import { ApiValidation } from '@/lib/api/validation'
import { authenticateAdmin } from '@/lib/api/auth-handler'
import { z } from 'zod'

const createCategorySchema = z.object({
  name: z.string().min(1, 'Name is required').max(100, 'Name must be less than 100 characters'),
  description: z.string().optional(),
  displayOrder: z.number().min(0).default(0),
  isActive: z.boolean().default(true),
})

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

export async function POST(request: NextRequest) {
  try {
    // Require admin role for creating categories
    const authResult = await authenticateAdmin(request)
    if (!authResult.success) {
      return authResult.error
    }

    const body = await request.json()
    const validation = await ApiValidation.validateBody(body, createCategorySchema)
    if (!validation.success) {
      return validation.error
    }

    const servicesService = new ServicesService()
    const result = await servicesService.createServiceCategory({
      name: validation.data.name,
      description: validation.data.description,
      display_order: validation.data.displayOrder,
      is_active: validation.data.isActive,
    })

    if (!result.success) {
      return ApiResponseHandler.error(
        result.error?.message || 'Failed to create service category',
        'CREATE_CATEGORY_FAILED'
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
    console.error('Create service category error:', error)
    return ApiResponseHandler.serverError('Failed to create service category')
  }
}