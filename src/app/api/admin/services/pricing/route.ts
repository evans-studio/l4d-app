import { NextRequest } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { ApiResponseHandler } from '@/lib/api/response'
import { authenticateAdmin } from '@/lib/api/auth-handler'

export async function GET(request: NextRequest) {
  try {
    // Authenticate admin user
    const authResult = await authenticateAdmin(request)
    if (!authResult.success) {
      return authResult.error
    }

    const supabase = await createClient()

    // Get all service pricing data with new denormalized structure
    const { data: servicePricing, error: pricingError } = await supabase
      .from('service_pricing')
      .select(`
        service_id,
        small,
        medium,
        large,
        extra_large,
        service_description
      `)

    if (pricingError) {
      console.error('Error fetching service pricing:', pricingError)
      return ApiResponseHandler.serverError(`Failed to fetch pricing data: ${pricingError.message}`)
    }

    // Define vehicle sizes directly since table no longer exists (denormalized structure)
    const vehicleSizes = [
      { id: 'small', name: 'Small', display_order: 1 },
      { id: 'medium', name: 'Medium', display_order: 2 },
      { id: 'large', name: 'Large', display_order: 3 },
      { id: 'extra_large', name: 'Extra Large', display_order: 4 }
    ]

    // Create mapping from size names to IDs
    const sizeNameToId: Record<string, string> = {}
    vehicleSizes.forEach(size => {
      const normalizedName = size.name.toLowerCase().replace(/\s+/g, '_')
      sizeNameToId[normalizedName] = size.id
    })

    // Transform into matrix format for backward compatibility
    interface PricingMatrix {
      [serviceId: string]: {
        [vehicleSizeId: string]: {
          service_id: string
          vehicle_size_id: string
          price: number
        }
      }
    }
    
    const pricingMatrix: PricingMatrix = {}
    if (servicePricing && servicePricing.length > 0) {
      servicePricing.forEach(pricing => {
        if (pricing && pricing.service_id) {
          const serviceId = pricing.service_id
          pricingMatrix[serviceId] = {}
          
          // Map denormalized columns to vehicle size IDs
          const priceMap = {
            small: pricing.small || 0,
            medium: pricing.medium || 0,
            large: pricing.large || 0,
            extra_large: pricing.extra_large || 0
          }
          
          Object.entries(priceMap).forEach(([sizeName, price]) => {
            const vehicleSizeId = sizeNameToId[sizeName]
            if (vehicleSizeId && price > 0 && pricingMatrix[serviceId]) {
              pricingMatrix[serviceId][vehicleSizeId] = {
                service_id: serviceId,
                vehicle_size_id: vehicleSizeId,
                price: price
              }
            }
          })
        }
      })
    }

    return ApiResponseHandler.success(pricingMatrix)

  } catch (error) {
    console.error('Pricing data error:', error)
    return ApiResponseHandler.serverError(`Failed to fetch pricing data: ${error instanceof Error ? error.message : 'Unknown error'}`)
  }
}

export async function PUT(request: NextRequest) {
  try {
    // Authenticate admin user
    const authResult = await authenticateAdmin(request)
    if (!authResult.success) {
      return authResult.error
    }

    // Use admin client to bypass RLS for now
    const { createAdminClient } = await import('@/lib/supabase/server')
    const supabase = createAdminClient()
    
    const body = await request.json()
    const { serviceId, pricing } = body

    if (!serviceId || !pricing) {
      return ApiResponseHandler.badRequest('serviceId and pricing are required')
    }

    // Get vehicle sizes to map IDs to column names
    const { data: vehicleSizes, error: sizesError } = await supabase
      .from('vehicle_sizes')
      .select('id, name, display_order')
      .eq('is_active', true)
      .order('display_order')

    if (sizesError) {
      console.error('Error fetching vehicle sizes:', sizesError)
      return ApiResponseHandler.serverError('Failed to fetch vehicle sizes')
    }

    // Create mapping from vehicle size IDs to column names
    const sizeIdToColumn: Record<string, string> = {}
    vehicleSizes?.forEach(size => {
      const normalizedName = size.name.toLowerCase().replace(/\s+/g, '_')
      sizeIdToColumn[size.id] = normalizedName
    })

    // Build the pricing record with denormalized structure
    const pricingRecord: {
      service_id: string
      small?: number
      medium?: number
      large?: number
      extra_large?: number
      service_description?: string
    } = {
      service_id: serviceId
    }

    // Map vehicle size IDs to column names and set prices
    Object.entries(pricing as Record<string, number>).forEach(([vehicleSizeId, price]) => {
      const columnName = sizeIdToColumn[vehicleSizeId]
      if (columnName && price && Number(price) > 0) {
        if (columnName === 'small') {
          pricingRecord.small = Number(price)
        } else if (columnName === 'medium') {
          pricingRecord.medium = Number(price)
        } else if (columnName === 'large') {
          pricingRecord.large = Number(price)
        } else if (columnName === 'extra_large') {
          pricingRecord.extra_large = Number(price)
        }
      }
    })

    // Check if pricing record already exists for this service
    const { data: existingPricing, error: checkError } = await supabase
      .from('service_pricing')
      .select('id')
      .eq('service_id', serviceId)
      .single()

    if (checkError && checkError.code !== 'PGRST116') { // PGRST116 is "not found"
      console.error('Error checking existing pricing:', checkError)
      return ApiResponseHandler.serverError('Failed to check existing pricing')
    }

    let result
    if (existingPricing) {
      // Update existing record
      result = await supabase
        .from('service_pricing')
        .update(pricingRecord)
        .eq('service_id', serviceId)
    } else {
      // Insert new record
      result = await supabase
        .from('service_pricing')
        .insert(pricingRecord)
    }

    if (result.error) {
      console.error('Error updating/inserting pricing:', result.error)
      return ApiResponseHandler.serverError(`Failed to update pricing: ${result.error.message}`)
    }

    return ApiResponseHandler.success({ message: 'Pricing updated successfully' })

  } catch (error) {
    console.error('Pricing update error:', error)
    return ApiResponseHandler.serverError(`Failed to update pricing data: ${error instanceof Error ? error.message : 'Unknown error'}`)  
  }
}