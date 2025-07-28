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
    const categoryId = searchParams.get('categoryId')
    const search = searchParams.get('search')
    const isActive = searchParams.get('isActive')

    // Temporary direct implementation until ServicesService TypeScript issues are resolved
    const { createAdminClient } = await import('@/lib/supabase/server')
    const supabase = createAdminClient()

    let query = supabase
      .from('services')
      .select(`
        *,
        category:service_categories(*)
      `)
      .order('display_order')

    // Apply filters
    if (categoryId) {
      query = query.eq('category_id', categoryId)
    }

    if (search) {
      query = query.or(`name.ilike.%${search}%,short_description.ilike.%${search}%`)
    }

    // Default to active services
    if (isActive === 'false') {
      query = query.eq('is_active', false)
    } else {
      query = query.eq('is_active', true)
    }

    const { data: services, error: servicesError } = await query

    if (servicesError) {
      console.error('Services query error:', servicesError)
      return ApiResponseHandler.serverError('Failed to fetch services')
    }

    // Get vehicle sizes for price calculation
    const { data: vehicleSizes, error: sizesError } = await supabase
      .from('vehicle_sizes')
      .select('*')
      .eq('is_active', true)
      .order('price_multiplier')

    if (sizesError) {
      console.error('Vehicle sizes error:', sizesError)
      return ApiResponseHandler.serverError('Failed to fetch vehicle sizes')
    }

    // Calculate price ranges
    const minMultiplier = vehicleSizes[0]?.price_multiplier || 1
    const maxMultiplier = vehicleSizes[vehicleSizes.length - 1]?.price_multiplier || 1

    const servicesWithPricing = services.map(service => ({
      ...service,
      priceRange: {
        min: Math.round(service.base_price * minMultiplier),
        max: Math.round(service.base_price * maxMultiplier),
      },
    }))

    return ApiResponseHandler.success(servicesWithPricing, {
      pagination: {
        page: 1,
        limit: servicesWithPricing.length,
        total: servicesWithPricing.length,
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