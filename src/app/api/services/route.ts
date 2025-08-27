import { NextRequest, NextResponse } from 'next/server'
import { ServicesService } from '@/lib/services/services'
import { ApiResponseHandler } from '@/lib/api/response'
import { ApiValidation } from '@/lib/api/validation'
import { authenticateAdmin } from '@/lib/api/auth-handler'
import { z } from 'zod'
import { logger } from '@/lib/utils/logger'

const servicesQuerySchema = z.object({
  categoryId: z.string().optional(),
  search: z.string().optional(),
  isActive: z.enum(['true', 'false']).optional().transform(val => val === 'true'),
})

const createServiceSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  shortDescription: z.string().min(1, 'Short description is required'),
  longDescription: z.string().optional(),
  estimatedDuration: z.number().min(0, 'Duration must be non-negative'),
  isActive: z.boolean().default(true),
  displayOrder: z.number().default(0),
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
      .select(`*`)
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
      logger.error('Services query error:', servicesError)
      return ApiResponseHandler.serverError('Failed to fetch services')
    }

    // Vehicle sizes table no longer exists - using service_pricing directly

    // Calculate price ranges with a bulk query instead of N+1
    const serviceIds = services.map(s => s.id)
    let pricingByServiceId: Record<string, { small: number | null; medium: number | null; large: number | null; extra_large: number | null }> = {}
    if (serviceIds.length > 0) {
      const { data: pricingRows, error: pricingBulkError } = await supabase
        .from('service_pricing')
        .select('service_id, small, medium, large, extra_large')
        .in('service_id', serviceIds)

      if (pricingBulkError) {
        logger.warn('Service pricing bulk query failed, proceeding without pricing')
      } else if (pricingRows) {
        pricingByServiceId = pricingRows.reduce((acc, row) => {
          acc[row.service_id as string] = {
            small: row.small as number | null,
            medium: row.medium as number | null,
            large: row.large as number | null,
            extra_large: row.extra_large as number | null,
          }
          return acc
        }, {} as Record<string, { small: number | null; medium: number | null; large: number | null; extra_large: number | null }>)
      }
    }

    const servicesWithPricing = services.map((service) => {
      const pricing = pricingByServiceId[service.id]
      if (!pricing) {
        return { ...service, priceRange: null }
      }
      const prices = [pricing.small, pricing.medium, pricing.large, pricing.extra_large]
        .filter((p): p is number => p !== null && p !== undefined)
      if (prices.length === 0) {
        return { ...service, priceRange: null }
      }
      const minPrice = Math.min(...prices)
      const maxPrice = Math.max(...prices)
      return {
        ...service,
        priceRange: { min: minPrice, max: maxPrice },
      }
    })

    // Return all services, but mark those without pricing
    return ApiResponseHandler.success(servicesWithPricing, {
      pagination: {
        page: 1,
        limit: servicesWithPricing.length,
        total: servicesWithPricing.length,
        totalPages: 1
      }
    })

  } catch (error) {
    logger.error('Get services error:', error)
    return ApiResponseHandler.serverError('Failed to fetch services')
  }
}

export async function POST(request: NextRequest) {
  try {
    // Authenticate admin user
    const authResult = await authenticateAdmin(request)
    if (!authResult.success) {
      return authResult.error
    }

    const body = await request.json()
    logger.debug('Service creation request body:', body)

    const validation = await ApiValidation.validateBody(body, createServiceSchema)
    if (!validation.success) {
      logger.error('Service validation failed:', validation.error)
      return validation.error
    }

    logger.debug('Validated service data:', validation.data)

    // Map frontend field names to database column names
    const serviceCreateData = {
      name: validation.data.name,
      short_description: validation.data.shortDescription,
      full_description: validation.data.longDescription || null,
      duration_minutes: validation.data.estimatedDuration,
      is_active: validation.data.isActive,
      display_order: validation.data.displayOrder,
      slug: validation.data.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '')
    }

    logger.debug('Mapped service data for database:', serviceCreateData)

    const servicesService = new ServicesService()
    const result = await servicesService.createService(serviceCreateData)

    logger.debug('Service creation result:', result)

    if (!result.success) {
      logger.error('Service creation failed:', result.error)
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
    logger.error('Create service error:', error)
    return ApiResponseHandler.serverError('Failed to create service')
  }
}