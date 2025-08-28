// Comprehensive pricing calculator for Love4Detailing booking flow
// Handles service pricing, vehicle size multipliers, and travel surcharges

import { calculatePostcodeDistance } from '@/lib/utils/postcode-distance'
import { logger } from '@/lib/utils/logger'

export type VehicleSize = 'S' | 'M' | 'L' | 'XL'

export interface ServiceDetails {
  id: string
  name: string
  basePrice: number
  duration: number // minutes
  category?: string
}

export interface VehicleDetails {
  make: string
  model: string
  year?: number
  size: VehicleSize
  registration?: string
}

export interface AddressDetails {
  addressLine1: string
  addressLine2?: string
  city: string
  postcode: string
}

export interface PriceBreakdown {
  serviceBasePrice: number
  vehicleSize: VehicleSize
  vehicleSizeMultiplier: number
  servicePrice: number // base price × size multiplier
  travelDistance?: number
  travelSurcharge: number
  totalPrice: number
  breakdown: {
    service: {
      name: string
      basePrice: number
      size: VehicleSize
      multiplier: number
      subtotal: number
    }
    travel: {
      distance?: number
      withinFreeRadius: boolean
      surcharge: number
      description: string
    }
    total: number
  }
}

export interface BookingCalculation {
  service: ServiceDetails
  vehicle: VehicleDetails
  address: AddressDetails
  pricing: PriceBreakdown
  isValid: boolean
  errors: string[]
}

// Legacy multipliers removed - now using direct pricing from service_pricing table

/**
 * Get pricing from service_pricing table for specific service and vehicle size
 */
export async function getServicePricing(serviceId: string, vehicleSize: VehicleSize): Promise<number | null> {
  try {
    logger.debug(`🔍 Fetching service pricing for: serviceId=${serviceId}, vehicleSize=${vehicleSize}`)
    
    // Map vehicle size to service_pricing column
    const sizeColumnMap: Record<VehicleSize, string> = {
      'S': 'small',
      'M': 'medium', 
      'L': 'large',
      'XL': 'extra_large'
    }
    
    const sizeColumn = sizeColumnMap[vehicleSize]
    if (!sizeColumn) {
      logger.error('❌ Invalid vehicle size for pricing:', vehicleSize)
      return null
    }
    
    // Get pricing directly from service_pricing table
    const apiUrl = `/api/pricing/service-pricing?service_id=${serviceId}&size=${sizeColumn}`
    logger.debug(`🌐 Making API call to: ${apiUrl}`)
    
    const pricingResponse = await fetch(apiUrl)
    if (!pricingResponse.ok) {
      logger.error(`❌ Pricing API returned ${pricingResponse.status} for service ${serviceId}`)
      const errorText = await pricingResponse.text()
      logger.error('❌ Error response:', errorText)
      return null
    }
    
    const pricingData = await pricingResponse.json()
    logger.debug('📊 Pricing API response:', pricingData)
    
    if (!pricingData.success || !pricingData.data) {
      logger.error(`❌ No pricing data returned for service ${serviceId} size ${sizeColumn}`)
      logger.error('❌ Full response:', pricingData)
      return null
    }
    
    // Return the price for the specific vehicle size
    const price = pricingData.data[sizeColumn] as number
    logger.debug(`💰 Extracted price: ${price} for size ${sizeColumn}`)
    
    if (price && price > 0) {
      logger.debug(`✅ Valid price found: £${price}`)
      return price
    } else {
      logger.error(`❌ Invalid price: ${price} for service ${serviceId} size ${vehicleSize}`)
      return null
    }
  } catch (error) {
    logger.error('❌ Error fetching service pricing:', error instanceof Error ? error : undefined)
    return null
  }
}

// Vehicle size multipliers removed - using direct pricing only

/**
 * Calculate service price from service_pricing table
 */
export async function calculateServicePrice(serviceId: string, basePrice: number, vehicleSize: VehicleSize): Promise<number> {
  // Get price directly from service_pricing table
  const databasePrice = await getServicePricing(serviceId, vehicleSize)
  if (databasePrice !== null && databasePrice > 0) {
    return databasePrice
  }
  
  // If no database pricing found, use base price as fallback (this is expected for some services)
  logger.warn(`No pricing found for service ${serviceId} with vehicle size ${vehicleSize}, using base price: £${basePrice}`)
  return basePrice
}

/**
 * Calculate complete booking price including travel surcharge
 */
export async function calculateBookingPrice(
  service: ServiceDetails,
  vehicle: VehicleDetails,
  address: AddressDetails
): Promise<PriceBreakdown> {
  try {
    logger.debug('💰 calculateBookingPrice called with:', { service, vehicle, address })
    
    // Calculate service price from service_pricing table
    const servicePrice = await calculateServicePrice(service.id, service.basePrice, vehicle.size)
    logger.debug('💰 Service price calculated', { servicePrice })
    
    // Calculate travel surcharge based on postcode
    const distanceResult = await calculatePostcodeDistance(address.postcode)
    logger.debug('💰 Distance result', { distanceResult })
    
    // Calculate total price
    const totalPrice = servicePrice + distanceResult.surchargeAmount
    logger.debug('💰 Total price calculation', {
      servicePrice,
      surchargeAmount: distanceResult.surchargeAmount,
      totalPrice: `${servicePrice} + ${distanceResult.surchargeAmount} = ${totalPrice}`
    })
    
    const priceBreakdown = {
      serviceBasePrice: servicePrice,
      vehicleSize: vehicle.size,
      vehicleSizeMultiplier: 1, // Direct pricing - no multiplier used
      servicePrice,
      travelDistance: distanceResult.distanceMiles,
      travelSurcharge: distanceResult.surchargeAmount,
      totalPrice,
      breakdown: {
        service: {
          name: service.name,
          basePrice: servicePrice,
          size: vehicle.size,
          multiplier: 1, // Direct pricing - no multiplier
          subtotal: servicePrice
        },
        travel: {
          distance: distanceResult.distanceMiles,
          withinFreeRadius: distanceResult.withinFreeRadius,
          surcharge: distanceResult.surchargeAmount,
          description: distanceResult.withinFreeRadius 
            ? `${distanceResult.distanceMiles} miles - No travel charge`
            : `${distanceResult.distanceMiles} miles - £${distanceResult.surchargeAmount} travel charge`
        },
        total: totalPrice
      }
    }
    
    logger.debug('💰 Final PriceBreakdown object', { priceBreakdown })
    return priceBreakdown
  } catch (error) {
    logger.error('Error calculating booking price:', error instanceof Error ? error : undefined)
    
    // Fallback - return base price without travel surcharge
    return {
      serviceBasePrice: service.basePrice,
      vehicleSize: vehicle.size,
      vehicleSizeMultiplier: 1,
      servicePrice: service.basePrice,
      travelSurcharge: 0,
      totalPrice: service.basePrice,
      breakdown: {
        service: {
          name: service.name,
          basePrice: service.basePrice,
          size: vehicle.size,
          multiplier: 1,
          subtotal: service.basePrice
        },
        travel: {
          withinFreeRadius: true,
          surcharge: 0,
          description: 'Travel calculation unavailable'
        },
        total: service.basePrice
      }
    }
  }
}

/**
 * Validate booking calculation inputs
 */
export function validateBookingInputs(
  service: ServiceDetails | null,
  vehicle: VehicleDetails | null,
  address: AddressDetails | null
): { isValid: boolean; errors: string[] } {
  const errors: string[] = []
  
  // Validate service
  if (!service) {
    errors.push('Service selection is required')
  } else {
    if (!service.id || !service.name) {
      errors.push('Invalid service selection')
    }
    if (!service.basePrice || service.basePrice <= 0) {
      errors.push('Service must have a valid price')
    }
    if (!service.duration || service.duration <= 0) {
      errors.push('Service must have a valid duration')
    }
  }
  
  // Validate vehicle
  if (!vehicle) {
    errors.push('Vehicle details are required')
  } else {
    if (!vehicle.make || !vehicle.model) {
      errors.push('Vehicle make and model are required')
    }
    if (!vehicle.size || !['S', 'M', 'L', 'XL'].includes(vehicle.size)) {
      errors.push('Valid vehicle size is required')
    }
  }
  
  // Validate address
  if (!address) {
    errors.push('Service address is required')
  } else {
    if (!address.addressLine1) {
      errors.push('Address line 1 is required')
    }
    if (!address.city) {
      errors.push('City is required')
    }
    if (!address.postcode) {
      errors.push('Postcode is required')
    } else {
      // Basic UK postcode validation
      const postcodeRegex = /^[A-Z]{1,2}[0-9]{1,2}[A-Z]?\s?[0-9][A-Z]{2}$/i
      if (!postcodeRegex.test(address.postcode)) {
        errors.push('Valid UK postcode is required')
      }
    }
  }
  
  return {
    isValid: errors.length === 0,
    errors
  }
}

/**
 * Create a complete booking calculation with validation
 */
export async function createBookingCalculation(
  service: ServiceDetails | null,
  vehicle: VehicleDetails | null,
  address: AddressDetails | null
): Promise<BookingCalculation> {
  const validation = validateBookingInputs(service, vehicle, address)
  
  if (!validation.isValid || !service || !vehicle || !address) {
    return {
      service: service || {} as ServiceDetails,
      vehicle: vehicle || {} as VehicleDetails,
      address: address || {} as AddressDetails,
      pricing: {} as PriceBreakdown,
      isValid: false,
      errors: validation.errors
    }
  }
  
  const pricing = await calculateBookingPrice(service, vehicle, address)
  
  return {
    service,
    vehicle,
    address,
    pricing,
    isValid: true,
    errors: []
  }
}

/**
 * Format price for display
 */
export function formatPrice(price: number): string {
  return `£${price.toFixed(2)}`
}

/**
 * Get vehicle size description
 */
export function getVehicleSizeDescription(size: VehicleSize): string {
  const descriptions = {
    S: 'Small (e.g., Fiesta, Polo)',
    M: 'Medium (e.g., Golf, Focus)', 
    L: 'Large (e.g., BMW 5 Series, Audi A6)',
    XL: 'Extra Large (e.g., Range Rover, Large SUVs)'
  }
  
  return descriptions[size] || size
}

/**
 * Calculate estimated time including travel
 */
export function calculateEstimatedDuration(
  serviceDurationMinutes: number,
  travelDistanceMiles?: number
): number {
  const baseServiceTime = serviceDurationMinutes
  
  // Add travel time if distance is known (assume 30mph average)
  if (travelDistanceMiles) {
    const travelTimeMinutes = Math.round((travelDistanceMiles / 30) * 60 * 2) // Round trip
    return baseServiceTime + travelTimeMinutes
  }
  
  return baseServiceTime
}

/**
 * Export constants for use in components
 */
export const PRICING_CONFIG = {
  FREE_TRAVEL_RADIUS_MILES: 17.5,
  BUSINESS_POSTCODE: 'SW9'
} as const