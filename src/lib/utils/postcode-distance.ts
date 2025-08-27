// Postcode distance calculation for Love4Detailing
// Business location: SW9 (South West London)
// Travel surcharge applies beyond 17.5 miles from SW9

interface PostcodeCoordinates {
  latitude: number
  longitude: number
}

interface DistanceResult {
  distanceKm: number
  distanceMiles: number
  withinFreeRadius: boolean
  surchargeAmount: number
}

// SW9 approximate center coordinates (Stockwell/Brixton area)
const BUSINESS_LOCATION: PostcodeCoordinates = {
  latitude: 51.4719,
  longitude: -0.1162
}

const FREE_RADIUS_MILES = 17.5
const SURCHARGE_RATES = {
  // Beyond free radius, charge per mile or fixed rates
  perMileRate: 0.50, // £0.50 per mile beyond free radius
  minimumSurcharge: 5.00, // Minimum £5 surcharge
  maximumSurcharge: 25.00 // Maximum £25 surcharge
}

/**
 * Calculate distance between two points using Haversine formula
 */
function calculateDistance(
  point1: PostcodeCoordinates,
  point2: PostcodeCoordinates
): number {
  const R = 6371 // Earth's radius in kilometers
  const dLat = (point2.latitude - point1.latitude) * Math.PI / 180
  const dLon = (point2.longitude - point1.longitude) * Math.PI / 180
  
  const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.cos(point1.latitude * Math.PI / 180) * Math.cos(point2.latitude * Math.PI / 180) *
    Math.sin(dLon/2) * Math.sin(dLon/2)
  
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a))
  return R * c // Distance in kilometers
}

/**
 * Convert kilometers to miles
 */
function kmToMiles(km: number): number {
  return km * 0.621371
}

/**
 * Calculate travel surcharge based on distance
 */
function calculateSurcharge(distanceMiles: number): number {
  if (distanceMiles <= FREE_RADIUS_MILES) {
    return 0
  }
  
  const excessMiles = distanceMiles - FREE_RADIUS_MILES
  const calculatedSurcharge = excessMiles * SURCHARGE_RATES.perMileRate
  
  // Apply minimum and maximum limits
  if (calculatedSurcharge < SURCHARGE_RATES.minimumSurcharge) {
    return SURCHARGE_RATES.minimumSurcharge
  }
  
  if (calculatedSurcharge > SURCHARGE_RATES.maximumSurcharge) {
    return SURCHARGE_RATES.maximumSurcharge
  }
  
  return Math.round(calculatedSurcharge * 100) / 100 // Round to 2 decimal places
}

/**
 * Get approximate coordinates for a UK postcode
 * This is a simplified implementation - in production, you'd use a proper postcode API
 */
async function getPostcodeCoordinates(postcode: string): Promise<PostcodeCoordinates | null> {
  try {
    // Clean and format postcode
    const cleanPostcode = postcode.replace(/\s+/g, '').toUpperCase()
    
    // For demo purposes, we'll use some common London postcodes
    // In production, integrate with postcodes.io or similar service
    const knownPostcodes: Record<string, PostcodeCoordinates> = {
      // Central London
      'SW1A1AA': { latitude: 51.5014, longitude: -0.1419 }, // Westminster
      'EC1A1BB': { latitude: 51.5174, longitude: -0.0930 }, // City of London
      'W1A0AX': { latitude: 51.5154, longitude: -0.1447 }, // Oxford Street
      
      // South London (closer to SW9)
      'SW81DT': { latitude: 51.4875, longitude: -0.1687 }, // Battersea
      'SE11PB': { latitude: 51.4754, longitude: -0.0638 }, // Bermondsey
      'SW21AD': { latitude: 51.4552, longitude: -0.1756 }, // Brixton
      
      // North London (further from SW9)
      'N11AA': { latitude: 51.5514, longitude: -0.1167 }, // Camden
      'N193DL': { latitude: 51.5656, longitude: -0.2126 }, // Hampstead
      
      // East London
      'E11AA': { latitude: 51.5099, longitude: -0.0059 }, // City fringe
      'E145AB': { latitude: 51.5254, longitude: 0.0417 }, // Stratford
      
      // West London
      'W21DT': { latitude: 51.5074, longitude: -0.2297 }, // Paddington
      'SW71AA': { latitude: 51.4924, longitude: -0.1615 }, // South Kensington
      
      // Outer London (beyond free radius)
      'CR01AA': { latitude: 51.3791, longitude: -0.0648 }, // Croydon
      'UB11AA': { latitude: 51.5046, longitude: -0.4804 }, // Southall
      'RM11AA': { latitude: 51.5755, longitude: 0.1426 }, // Romford
      'KT11AA': { latitude: 51.4085, longitude: -0.3064 } // Kingston upon Thames
    }
    
    // Try exact match first
    if (knownPostcodes[cleanPostcode]) {
      return knownPostcodes[cleanPostcode]
    }
    
    // Try area match (first part of postcode)
    const area = cleanPostcode.substring(0, 2)
    const areaMatch = Object.keys(knownPostcodes).find(pc => pc.startsWith(area))
    if (areaMatch) {
      return knownPostcodes[areaMatch] || null
    }
    
    // If using a real API, call it here:
    /*
    const response = await fetch(`https://api.postcodes.io/postcodes/${cleanPostcode}`)
    const data = await response.json()
    
    if (data.status === 200) {
      return {
        latitude: data.result.latitude,
        longitude: data.result.longitude
      }
    }
    */
    
    return null
  } catch (error) {
    const { logger } = await import('@/lib/utils/logger')
    logger.warn('Error geocoding postcode', error instanceof Error ? error : undefined)
    return null
  }
}

/**
 * Main function to calculate distance and surcharge from postcode
 */
export async function calculatePostcodeDistance(postcode: string): Promise<DistanceResult> {
  try {
    const coordinates = await getPostcodeCoordinates(postcode)
    
    if (!coordinates) {
      // If we can't geocode the postcode, assume it's outside free radius for safety
      return {
        distanceKm: 50, // Assume far distance
        distanceMiles: 31.1, // Beyond free radius
        withinFreeRadius: false,
        surchargeAmount: SURCHARGE_RATES.minimumSurcharge
      }
    }
    
    const distanceKm = calculateDistance(BUSINESS_LOCATION, coordinates)
    const distanceMiles = kmToMiles(distanceKm)
    const withinFreeRadius = distanceMiles <= FREE_RADIUS_MILES
    const surchargeAmount = calculateSurcharge(distanceMiles)
    
    return {
      distanceKm: Math.round(distanceKm * 100) / 100,
      distanceMiles: Math.round(distanceMiles * 100) / 100,
      withinFreeRadius,
      surchargeAmount
    }
  } catch (error) {
    const { logger } = await import('@/lib/utils/logger')
    logger.error('Error calculating postcode distance', error instanceof Error ? error : undefined)
    
    // Fallback - assume outside free radius
    return {
      distanceKm: 50,
      distanceMiles: 31.1,
      withinFreeRadius: false,
      surchargeAmount: SURCHARGE_RATES.minimumSurcharge
    }
  }
}

/**
 * Validate UK postcode format
 */
export function validateUKPostcode(postcode: string): boolean {
  // UK postcode regex pattern
  const postcodeRegex = /^[A-Z]{1,2}[0-9]{1,2}[A-Z]?\s?[0-9][A-Z]{2}$/i
  return postcodeRegex.test(postcode.trim())
}

/**
 * Format UK postcode consistently
 */
export function formatUKPostcode(postcode: string): string {
  const clean = postcode.replace(/\s+/g, '').toUpperCase()
  
  // Add space before last 3 characters
  if (clean.length >= 3) {
    return clean.slice(0, -3) + ' ' + clean.slice(-3)
  }
  
  return clean
}

/**
 * Get human-readable distance description
 */
export function getDistanceDescription(result: DistanceResult): string {
  if (result.withinFreeRadius) {
    return `${result.distanceMiles} miles from SW9 - No travel charge`
  } else {
    const excessMiles = result.distanceMiles - FREE_RADIUS_MILES
    return `${result.distanceMiles} miles from SW9 - £${result.surchargeAmount} travel charge (${excessMiles.toFixed(1)} miles beyond free radius)`
  }
}

/**
 * Configuration for easy adjustment
 */
export const DISTANCE_CONFIG = {
  BUSINESS_POSTCODE: 'SW9',
  FREE_RADIUS_MILES,
  SURCHARGE_RATES
} as const