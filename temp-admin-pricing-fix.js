// Temporary fix for admin pricing API
// Use this if you're still getting authentication errors

// Option 1: Check your service role key configuration
// Add this to your .env.local file if missing:
/*
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key_here
*/

// Option 2: Temporary bypass for testing (REMOVE IN PRODUCTION)
// Replace the admin pricing API with this simplified version:

/*
// src/app/api/admin/services/pricing/route.ts
import { NextRequest } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { ApiResponseHandler } from '@/lib/api/response'

export async function GET(request: NextRequest) {
  try {
    // TEMPORARY: Skip auth check for testing
    // TODO: Re-enable authentication after RLS is fixed
    
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
      return ApiResponseHandler.serverError('Failed to fetch pricing data: ' + pricingError.message)
    }

    // Get vehicle sizes to map names to IDs for compatibility
    const { data: vehicleSizes, error: sizesError } = await supabase
      .from('vehicle_sizes')
      .select('id, name, display_order')
      .eq('is_active', true)
      .order('display_order')

    if (sizesError) {
      console.error('Error fetching vehicle sizes:', sizesError)
      return ApiResponseHandler.serverError('Failed to fetch vehicle sizes: ' + sizesError.message)
    }

    // Create mapping from size names to IDs
    const sizeNameToId = {}
    vehicleSizes?.forEach(size => {
      const normalizedName = size.name.toLowerCase().replace(/\s+/g, '_')
      sizeNameToId[normalizedName] = size.id
    })

    // Transform into matrix format for backward compatibility
    const pricingMatrix = {}
    if (servicePricing && servicePricing.length > 0) {
      servicePricing.forEach(pricing => {
        if (pricing && pricing.service_id) {
          pricingMatrix[pricing.service_id] = {}
          
          // Map denormalized columns to vehicle size IDs
          const priceMap = {
            small: pricing.small || 0,
            medium: pricing.medium || 0,
            large: pricing.large || 0,
            extra_large: pricing.extra_large || 0
          }
          
          Object.entries(priceMap).forEach(([sizeName, price]) => {
            const vehicleSizeId = sizeNameToId[sizeName]
            if (vehicleSizeId && price > 0) {
              pricingMatrix[pricing.service_id][vehicleSizeId] = {
                service_id: pricing.service_id,
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
    return ApiResponseHandler.serverError('Failed to fetch pricing data: ' + error.message)
  }
}

export async function PUT(request: NextRequest) {
  try {
    // TEMPORARY: Skip auth check for testing
    // TODO: Re-enable authentication after RLS is fixed
    
    const supabase = await createClient()
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
    const sizeIdToColumn = {}
    vehicleSizes?.forEach(size => {
      const normalizedName = size.name.toLowerCase().replace(/\s+/g, '_')
      sizeIdToColumn[size.id] = normalizedName
    })

    // Build the pricing record with denormalized structure
    const pricingRecord = {
      service_id: serviceId
    }

    // Map vehicle size IDs to column names and set prices
    Object.entries(pricing).forEach(([vehicleSizeId, price]) => {
      const columnName = sizeIdToColumn[vehicleSizeId]
      if (columnName && price && Number(price) > 0) {
        pricingRecord[columnName] = Number(price)
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
      return ApiResponseHandler.serverError('Failed to update pricing: ' + result.error.message)
    }

    return ApiResponseHandler.success({ message: 'Pricing updated successfully' })

  } catch (error) {
    console.error('Pricing update error:', error)
    return ApiResponseHandler.serverError('Failed to update pricing data: ' + error.message)
  }
}
*/

console.log('Temporary admin pricing fix code created. See the file for implementation details.');