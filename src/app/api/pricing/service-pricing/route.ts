import { NextRequest } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { ApiResponseHandler } from '@/lib/api/response'
import { logger } from '@/lib/utils/logger'

/**
 * Get pricing for services based on vehicle sizes
 * Used by the booking flow to display accurate prices
 */
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()
    
    const { searchParams } = new URL(request.url)
    const serviceId = searchParams.get('serviceId') || searchParams.get('service_id')
    const vehicleSizeId = searchParams.get('vehicleSizeId')
    const sizeColumn = searchParams.get('size') // New direct column access
    
    // Build the query for the new denormalized structure
    let query = supabase
      .from('service_pricing')
      .select(`
        service_id,
        small,
        medium,
        large,
        extra_large,
        services!inner(name)
      `)
    
    // Filter by service if provided
    if (serviceId) {
      query = query.eq('service_id', serviceId)
    }
    
    const { data: pricingData, error } = await query
    
    if (error) {
      logger.error('Error fetching service pricing:', error)
      return ApiResponseHandler.serverError('Failed to fetch pricing data')
    }
    
    // If no pricing data found
    if (!pricingData || pricingData.length === 0) {
      return ApiResponseHandler.success([])
    }
    
    // Handle direct column access for pricing calculator
    if (sizeColumn && serviceId && pricingData.length > 0) {
      const pricingRecord = pricingData[0] as {
        small?: number
        medium?: number
        large?: number
        extra_large?: number
        services?: { name?: string } | { name?: string }[]
        [key: string]: unknown
      }
      if (pricingRecord) {
        const price = pricingRecord[sizeColumn as keyof typeof pricingRecord] as number | undefined
        logger.debug(`🔍 Service pricing API: service_id=${serviceId}, size=${sizeColumn}, price=${price}`)
        
        return ApiResponseHandler.success({
          service_id: serviceId,
          [sizeColumn]: price,
          // Include all size data for debugging
          small: pricingRecord.small,
          medium: pricingRecord.medium,
          large: pricingRecord.large,
          extra_large: pricingRecord.extra_large,
          service_name: Array.isArray(pricingRecord.services) 
            ? pricingRecord.services[0]?.name 
            : (pricingRecord.services as { name?: string } | undefined)?.name
        })
      }
    }

    // Create a mapping for vehicle sizes - no longer from database
    // Using standard size mapping: S=Small, M=Medium, L=Large, XL=Extra Large
    const sizeMapping: Record<string, string> = {
      'S': 'Small',
      'M': 'Medium', 
      'L': 'Large',
      'XL': 'Extra Large'
    }
    
    // Create reverse mapping for API responses
    const sizeNameToLetter: Record<string, string> = {
      'Small': 'S',
      'Medium': 'M',
      'Large': 'L',
      'Extra Large': 'XL'
    }
    
    // Transform denormalized data back to individual pricing records for compatibility
    type TransformedRecord = {
      serviceId: string
      vehicleSize: 'S' | 'M' | 'L' | 'XL'
      vehicleSizeName: keyof typeof sizeNameToLetter
      price: number
      serviceName?: string
    }
    const transformedData: TransformedRecord[] = []
    
    pricingData.forEach((item: { service_id: string; small?: number; medium?: number; large?: number; extra_large?: number; services?: { name?: string } | { name?: string }[] }) => {
      const priceMap = {
        'Small': item.small,
        'Medium': item.medium,
        'Large': item.large,
        'Extra Large': item.extra_large
      }

      Object.entries(priceMap).forEach(([sizeName, price]) => {
        if (price && price > 0) {
          const sizeLetter = sizeNameToLetter[sizeName as keyof typeof sizeNameToLetter] as 'S' | 'M' | 'L' | 'XL'
          if (sizeLetter) {
            transformedData.push({
              serviceId: item.service_id,
              vehicleSize: sizeLetter, // Changed from vehicleSizeId to vehicleSize (letter)
              vehicleSizeName: sizeName as keyof typeof sizeNameToLetter,
              price: price,
              serviceName: Array.isArray(item.services) 
                ? item.services[0]?.name 
                : (item.services as { name?: string } | undefined)?.name
            })
          }
        }
      })
    })

    // Filter by vehicle size if provided
    // Convert vehicleSizeId parameter to size letter if needed
    let filteredData = transformedData
    
    if (vehicleSizeId) {
      // Check if it's already a size letter (S, M, L, XL)
      if (['S', 'M', 'L', 'XL'].includes(vehicleSizeId)) {
        filteredData = transformedData.filter(item => item.vehicleSize === vehicleSizeId)
      } else {
        // Legacy support: might be getting old UUID, just return all data
        logger.warn('Received legacy vehicle size ID', { vehicleSizeId })
      }
    }
    
    return ApiResponseHandler.success(filteredData)
    
  } catch (error) {
    logger.error('Service pricing API error', error instanceof Error ? error : undefined)
    return ApiResponseHandler.serverError('Failed to fetch service pricing')
  }
}