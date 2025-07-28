import { NextRequest, NextResponse } from 'next/server'
import { ServicesService } from '@/lib/services/services'
import { ApiResponseHandler } from '@/lib/api/response'
import { ApiValidation } from '@/lib/api/validation'
import { ApiAuth } from '@/lib/api/auth'
import { z } from 'zod'

const servicesQuerySchema = z.object({
  categoryId: z.string().optional(),
  search: z.string().optional(),
  isActive: z.enum(['true', 'false']).optional().transform(val => val === 'true'),
})

const createServiceSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  shortDescription: z.string().min(1, 'Short description is required'),
  longDescription: z.string().optional(),
  basePrice: z.number().min(0, 'Base price must be non-negative'),
  categoryId: z.string().uuid('Invalid category ID'),
  estimatedDuration: z.number().min(0, 'Duration must be non-negative'),
  isActive: z.boolean().default(true),
  displayOrder: z.number().min(0).default(0),
})

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const queryParams = Object.fromEntries(searchParams.entries())
    
    const validation = await ApiValidation.validateQuery(queryParams, servicesQuerySchema)
    if (!validation.success) {
      return validation.error
    }

    const servicesService = new ServicesService()
    const result = await servicesService.getAllServices(validation.data)

    if (!result.success) {
      return ApiResponseHandler.error(
        result.error?.message || 'Failed to fetch services',
        'FETCH_SERVICES_FAILED'
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
    console.error('Get services error:', error)
    return ApiResponseHandler.serverError('Failed to fetch services')
  }
}

export async function POST(request: NextRequest) {
  try {
    // Require admin role for creating services
    const { auth, error: authError } = await ApiAuth.requireRole(['admin', 'super_admin'])
    if (authError) {
      return authError
    }

    const body = await request.json()
    const validation = await ApiValidation.validateBody(body, createServiceSchema)
    if (!validation.success) {
      return validation.error
    }

    const servicesService = new ServicesService()
    const result = await servicesService.createService(validation.data)

    if (!result.success) {
      return ApiResponseHandler.error(
        result.error?.message || 'Failed to create service',
        'CREATE_SERVICE_FAILED'
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
    console.error('Create service error:', error)
    return ApiResponseHandler.serverError('Failed to create service')
  }
}