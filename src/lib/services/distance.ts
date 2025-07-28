// Enhanced distance calculation service with multiple providers and caching

interface DistanceResult {
  distance: number // in kilometers
  duration: number // in minutes
  success: boolean
  provider: 'google' | 'mapbox' | 'haversine'
  error?: string
}

interface Coordinates {
  lat: number
  lng: number
}

// Cache for distance calculations to avoid repeated API calls
const distanceCache = new Map<string, { result: DistanceResult; timestamp: number }>()
const CACHE_DURATION = 24 * 60 * 60 * 1000 // 24 hours

/**
 * Calculate distance between two postcodes using multiple providers
 * Falls back to haversine formula if APIs fail
 */
export async function calculateDistance(
  fromPostcode: string,
  toPostcode: string
): Promise<DistanceResult> {
  const cacheKey = `${fromPostcode}-${toPostcode}`
  
  // Check cache first
  const cached = distanceCache.get(cacheKey)
  if (cached && Date.now() - cached.timestamp < CACHE_DURATION) {
    return cached.result
  }

  try {
    // Try Google Maps API first (most accurate)
    let result = await calculateWithGoogle(fromPostcode, toPostcode)
    
    if (!result.success) {
      // Fallback to Mapbox
      result = await calculateWithMapbox(fromPostcode, toPostcode)
    }
    
    if (!result.success) {
      // Final fallback to haversine formula
      result = await calculateWithHaversine(fromPostcode, toPostcode)
    }

    // Cache the result
    distanceCache.set(cacheKey, { result, timestamp: Date.now() })
    
    return result
  } catch (error) {
    console.error('Distance calculation error:', error)
    return {
      distance: 0,
      duration: 0,
      success: false,
      provider: 'haversine',
      error: 'Failed to calculate distance'
    }
  }
}

/**
 * Calculate distance using Google Maps Distance Matrix API
 */
async function calculateWithGoogle(
  fromPostcode: string,
  toPostcode: string
): Promise<DistanceResult> {
  const apiKey = process.env.GOOGLE_MAPS_API_KEY
  
  if (!apiKey) {
    return {
      distance: 0,
      duration: 0,
      success: false,
      provider: 'google',
      error: 'Google Maps API key not configured'
    }
  }

  try {
    const response = await fetch(
      `https://maps.googleapis.com/maps/api/distancematrix/json?` +
      `origins=${encodeURIComponent(fromPostcode)}&` +
      `destinations=${encodeURIComponent(toPostcode)}&` +
      `units=metric&` +
      `mode=driving&` +
      `key=${apiKey}`,
      { 
        method: 'GET',
        headers: {
          'Accept': 'application/json'
        }
      }
    )

    if (!response.ok) {
      throw new Error(`Google API error: ${response.status}`)
    }

    const data = await response.json()
    
    if (data.status !== 'OK' || !data.rows[0]?.elements[0]) {
      throw new Error(`Google API status: ${data.status}`)
    }

    const element = data.rows[0].elements[0]
    
    if (element.status !== 'OK') {
      throw new Error(`Element status: ${element.status}`)
    }

    return {
      distance: Math.round(element.distance.value / 1000 * 10) / 10, // Convert to km, 1 decimal
      duration: Math.round(element.duration.value / 60), // Convert to minutes
      success: true,
      provider: 'google'
    }
  } catch (error) {
    console.warn('Google Maps distance calculation failed:', error)
    return {
      distance: 0,
      duration: 0,
      success: false,
      provider: 'google',
      error: error instanceof Error ? error.message : 'Unknown error'
    }
  }
}

/**
 * Calculate distance using Mapbox Matrix API
 */
async function calculateWithMapbox(
  fromPostcode: string,
  toPostcode: string
): Promise<DistanceResult> {
  const apiKey = process.env.MAPBOX_ACCESS_TOKEN
  
  if (!apiKey) {
    return {
      distance: 0,
      duration: 0,
      success: false,
      provider: 'mapbox',
      error: 'Mapbox API key not configured'
    }
  }

  try {
    // First geocode the postcodes
    const [fromCoords, toCoords] = await Promise.all([
      geocodeWithMapbox(fromPostcode, apiKey),
      geocodeWithMapbox(toPostcode, apiKey)
    ])

    if (!fromCoords || !toCoords) {
      throw new Error('Failed to geocode postcodes')
    }

    // Then calculate driving distance
    const response = await fetch(
      `https://api.mapbox.com/directions/v5/mapbox/driving/` +
      `${fromCoords.lng},${fromCoords.lat};${toCoords.lng},${toCoords.lat}?` +
      `access_token=${apiKey}&geometries=geojson`,
      { 
        method: 'GET',
        headers: {
          'Accept': 'application/json'
        }
      }
    )

    if (!response.ok) {
      throw new Error(`Mapbox API error: ${response.status}`)
    }

    const data = await response.json()
    
    if (!data.routes || data.routes.length === 0) {
      throw new Error('No routes found')
    }

    const route = data.routes[0]
    
    return {
      distance: Math.round(route.distance / 1000 * 10) / 10, // Convert to km
      duration: Math.round(route.duration / 60), // Convert to minutes
      success: true,
      provider: 'mapbox'
    }
  } catch (error) {
    console.warn('Mapbox distance calculation failed:', error)
    return {
      distance: 0,
      duration: 0,
      success: false,
      provider: 'mapbox',
      error: error instanceof Error ? error.message : 'Unknown error'
    }
  }
}

/**
 * Geocode a postcode using Mapbox Geocoding API
 */
async function geocodeWithMapbox(postcode: string, apiKey: string): Promise<Coordinates | null> {
  try {
    const response = await fetch(
      `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(postcode)}.json?` +
      `country=GB&types=postcode&access_token=${apiKey}`,
      { 
        method: 'GET',
        headers: {
          'Accept': 'application/json'
        }
      }
    )

    if (!response.ok) {
      throw new Error(`Geocoding error: ${response.status}`)
    }

    const data = await response.json()
    
    if (!data.features || data.features.length === 0) {
      throw new Error('No geocoding results')
    }

    const [lng, lat] = data.features[0].geometry.coordinates
    return { lat, lng }
  } catch (error) {
    console.warn('Mapbox geocoding failed:', error)
    return null
  }
}

/**
 * Calculate distance using Haversine formula (fallback)
 * Less accurate but doesn't require API calls
 */
async function calculateWithHaversine(
  fromPostcode: string,
  toPostcode: string
): Promise<DistanceResult> {
  try {
    // Use UK postcode to coordinates lookup (simplified)
    const fromCoords = await geocodePostcodeUK(fromPostcode)
    const toCoords = await geocodePostcodeUK(toPostcode)

    if (!fromCoords || !toCoords) {
      throw new Error('Failed to geocode postcodes')
    }

    const distance = haversineDistance(fromCoords, toCoords)
    const estimatedDuration = Math.round(distance * 2) // Rough estimate: 2 minutes per km

    return {
      distance: Math.round(distance * 10) / 10,
      duration: estimatedDuration,
      success: true,
      provider: 'haversine'
    }
  } catch (error) {
    console.warn('Haversine calculation failed:', error)
    return {
      distance: 0,
      duration: 0,
      success: false,
      provider: 'haversine',
      error: error instanceof Error ? error.message : 'Unknown error'
    }
  }
}

/**
 * Simple UK postcode to coordinates lookup
 * In production, this should use a proper postcode database
 */
async function geocodePostcodeUK(postcode: string): Promise<Coordinates | null> {
  try {
    // Use a free UK postcode API
    const response = await fetch(
      `https://api.postcodes.io/postcodes/${encodeURIComponent(postcode)}`,
      { 
        method: 'GET',
        headers: {
          'Accept': 'application/json'
        }
      }
    )

    if (!response.ok) {
      throw new Error(`Postcode API error: ${response.status}`)
    }

    const data = await response.json()
    
    if (data.status !== 200 || !data.result) {
      throw new Error('Invalid postcode')
    }

    return {
      lat: data.result.latitude,
      lng: data.result.longitude
    }
  } catch (error) {
    console.warn('UK postcode geocoding failed:', error)
    return null
  }
}

/**
 * Calculate distance between two coordinates using Haversine formula
 */
function haversineDistance(coord1: Coordinates, coord2: Coordinates): number {
  const R = 6371 // Earth's radius in kilometers
  const dLat = toRad(coord2.lat - coord1.lat)
  const dLon = toRad(coord2.lng - coord1.lng)
  
  const lat1 = toRad(coord1.lat)
  const lat2 = toRad(coord2.lat)

  const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.sin(dLon / 2) * Math.sin(dLon / 2) * Math.cos(lat1) * Math.cos(lat2)
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
  
  return R * c
}

/**
 * Convert degrees to radians
 */
function toRad(degrees: number): number {
  return degrees * (Math.PI / 180)
}

/**
 * Calculate travel surcharge based on distance
 */
export function calculateTravelSurcharge(distance: number): number {
  const baseDistance = 10 // Free travel within 10km
  
  if (distance <= baseDistance) {
    return 0
  }
  
  const extraDistance = distance - baseDistance
  const surchargePerKm = 2.50 // £2.50 per km beyond base distance
  
  return Math.round(extraDistance * surchargePerKm * 100) / 100 // Round to 2 decimal places
}

/**
 * Check if location is within service area
 */
export function isWithinServiceArea(distance: number, maxDistance: number = 50): boolean {
  return distance <= maxDistance
}