import { NextRequest, NextResponse } from 'next/server'
import { ServicesService } from '@/lib/services/services'
import { ApiResponseHandler } from '@/lib/api/response'
import { ApiValidation } from '@/lib/api/validation'
import { authenticateAdmin } from '@/lib/api/auth-handler'
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
  estimatedDuration: z.number().min(0, 'Duration must be non-negative'),
  isActive: z.boolean().default(true),
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
      console.error('Services query error:', servicesError)
      return ApiResponseHandler.serverError('Failed to fetch services')
    }

    // Vehicle sizes table no longer exists - using service_pricing directly

    // Calculate price ranges from service_pricing table
    const servicesWithPricing = await Promise.all(
      services.map(async (service) => {
        // Get pricing for this service (single row with all vehicle size columns)
        const { data: pricingData, error: pricingError } = await supabase
          .from('service_pricing')
          .select('small, medium, large, extra_large')
          .eq('service_id', service.id)
          .single()

        if (pricingError || !pricingData) {
          // No pricing data available
          return {
            ...service,
            priceRange: null,
          }
        }

        // Extract prices from the columns, filtering out null/zero values
        const prices = [
          pricingData.small,
          pricingData.medium, 
          pricingData.large,
          pricingData.extra_large
        ].filter(price => price && price > 0)

        if (prices.length === 0) {
          return {
            ...service,
            priceRange: null,
          }
        }

        // Calculate min and max prices
        const minPrice = Math.min(...prices)
        const maxPrice = Math.max(...prices)

        return {
          ...service,
          priceRange: {
            min: minPrice,
            max: maxPrice,
          },
        }
      })
    )

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
    console.error('Get services error:', error)
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
    const validation = await ApiValidation.validateBody(body, createServiceSchema)
    if (!validation.success) {
      return validation.error
    }

    // Map frontend field names to database column names
    const serviceCreateData = {
      name: validation.data.name,
      short_description: validation.data.shortDescription,
      full_description: validation.data.longDescription, // Correct: full_description
      duration_minutes: validation.data.estimatedDuration, // Correct: duration_minutes
      is_active: validation.data.isActive,
      base_price: 0, // Legacy field - actual pricing comes from service_pricing table
      slug: validation.data.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '') // Generate slug from name
    }

    const servicesService = new ServicesService()
    const result = await servicesService.createService(serviceCreateData)

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