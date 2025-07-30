import { NextRequest } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { ApiResponseHandler } from '@/lib/api/response'

/**
 * Get pricing for services based on vehicle sizes
 * Used by the booking flow to display accurate prices
 */
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()
    
    const { searchParams } = new URL(request.url)
    const serviceId = searchParams.get('serviceId')
    const vehicleSizeId = searchParams.get('vehicleSizeId')
    
    // Build the query for the new denormalized structure
    let query = supabase
      .from('service_pricing')
      .select(`
        service_id,
        small,
        medium,
        large,
        extra_large,
        services!inner(name),
        vehicle_sizes!inner(id, name)
      `)
    
    // Filter by service if provided
    if (serviceId) {
      query = query.eq('service_id', serviceId)
    }
    
    const { data: pricingData, error } = await query
    
    if (error) {
      console.error('Error fetching service pricing:', error)
      return ApiResponseHandler.serverError('Failed to fetch pricing data')
    }
    
    // If no pricing data found
    if (!pricingData || pricingData.length === 0) {
      return ApiResponseHandler.success([])
    }

    // Get vehicle sizes for mapping
    const { data: vehicleSizes, error: sizesError } = await supabase
      .from('vehicle_sizes')
      .select('id, name')
      .eq('is_active', true)
      .order('display_order')

    if (sizesError) {
      console.error('Error fetching vehicle sizes:', sizesError)
      return ApiResponseHandler.serverError('Failed to fetch vehicle sizes')
    }

    // Create size name to ID mapping
    const sizeNameToId: Record<string, string> = {}
    vehicleSizes?.forEach(size => {
      sizeNameToId[size.name] = size.id
    })
    
    // Transform denormalized data back to individual pricing records for compatibility
    const transformedData: any[] = []
    
    pricingData.forEach((item: any) => {
      const priceMap = {
        'Small': item.small,
        'Medium': item.medium,
        'Large': item.large,
        'Extra Large': item.extra_large
      }

      Object.entries(priceMap).forEach(([sizeName, price]) => {
        if (price && price > 0) {
          const vehicleSizeIdForSize = sizeNameToId[sizeName]
          if (vehicleSizeIdForSize) {
            transformedData.push({
              serviceId: item.service_id,
              vehicleSizeId: vehicleSizeIdForSize,
              price: price,
              serviceName: item.services?.name,
              vehicleSizeName: sizeName
            })
          }
        }
      })
    })

    // Filter by vehicle size if provided
    const filteredData = vehicleSizeId 
      ? transformedData.filter(item => item.vehicleSizeId === vehicleSizeId)
      : transformedData
    
    return ApiResponseHandler.success(filteredData)
    
  } catch (error) {
    console.error('Service pricing API error:', error)
    return ApiResponseHandler.serverError('Failed to fetch service pricing')
  }
}