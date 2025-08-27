import { logger } from '@/lib/utils/logger'
/**
 * Unified vehicle size detection utility
 * Uses the same logic as the booking flow for consistency
 */

interface VehicleModel {
  model: string
  size: 'S' | 'M' | 'L' | 'XL'
  years: number[]
}

interface VehicleMake {
  make: string
  models: VehicleModel[]
}

interface VehicleDataResponse {
  vehicles: VehicleMake[]
}

// Cache for vehicle data to avoid repeated file reads
let vehicleDataCache: VehicleDataResponse | null = null
let vehicleDataPromise: Promise<VehicleDataResponse> | null = null

/**
 * Load vehicle data from JSON file
 */
async function loadVehicleData(): Promise<VehicleDataResponse> {
  if (vehicleDataCache) {
    return vehicleDataCache
  }

  if (vehicleDataPromise) {
    return vehicleDataPromise
  }

  vehicleDataPromise = (async () => {
    try {
      const fs = await import('fs/promises')
      const path = await import('path')
      
      const dataPath = path.join(process.cwd(), 'src/data/vehicle-size-data.json')
      const fileContents = await fs.readFile(dataPath, 'utf8')
      const data = JSON.parse(fileContents) as VehicleDataResponse
      
      vehicleDataCache = data
      return data
    } catch (error) {
      logger.error('❌ Error loading vehicle data:', error)
      // Return empty structure on error
      return { vehicles: [] }
    }
  })()

  return vehicleDataPromise
}

/**
 * Detect vehicle size based on make and model using vehicle data JSON
 */
export async function getVehicleSize(make: string, model: string): Promise<'S' | 'M' | 'L' | 'XL'> {
  try {
    logger.debug(`🔍 Getting vehicle size for: ${make} ${model}`)
    
    if (!make || !model) {
      logger.debug('❌ Missing make or model for size detection')
      return 'M' // Default fallback
    }

    const vehicleData = await loadVehicleData()
    
    if (!vehicleData?.vehicles) {
      logger.debug('❌ No vehicle data available for size detection')
      return 'M' // Default fallback
    }
    
    const vehicleMake = vehicleData.vehicles.find(v => v.make === make)
    logger.debug(`🔍 Found vehicle make: ${vehicleMake ? 'yes' : 'no'}`)
    
    if (vehicleMake?.models) {
      const vehicleModel = vehicleMake.models.find(m => m.model === model)
      logger.debug(`🔍 Found vehicle model: ${vehicleModel ? 'yes' : 'no'}`)
      
      if (vehicleModel?.size) {
        const size = vehicleModel.size as 'S' | 'M' | 'L' | 'XL'
        logger.debug(`✅ Detected vehicle size: ${size} for ${make} ${model}`)
        return size
      } else {
        logger.debug(`❌ No size found for model: ${model}`)
      }
    }
  } catch (error) {
    logger.error('❌ Error getting vehicle size:', error)
  }
  
  logger.debug(`🔧 Using default size 'M' for ${make} ${model}`)
  return 'M' // Default fallback
}

/**
 * Synchronous fallback detection using hardcoded patterns
 * Used when async detection fails or in client-side contexts
 */
export function detectVehicleSizeSync(make: string, model: string): 'S' | 'M' | 'L' | 'XL' {
  const makeModel = `${make} ${model}`.toLowerCase()
  
  // Small vehicles
  if (
    makeModel.includes('mini') ||
    makeModel.includes('smart') ||
    makeModel.includes('fiat 500') ||
    makeModel.includes('toyota aygo') ||
    makeModel.includes('ford ka') ||
    makeModel.includes('citroen c1') ||
    makeModel.includes('peugeot 108') ||
    makeModel.includes('hyundai i10') ||
    makeModel.includes('volkswagen up') ||
    model.toLowerCase().includes('hatchback')
  ) {
    return 'S'
  }
  
  // Large vehicles
  if (
    makeModel.includes('range rover') ||
    makeModel.includes('bmw x5') ||
    makeModel.includes('bmw x6') ||
    makeModel.includes('bmw x7') ||
    makeModel.includes('audi q7') ||
    makeModel.includes('audi q8') ||
    makeModel.includes('mercedes gle') ||
    makeModel.includes('mercedes gls') ||
    makeModel.includes('mercedes g-class') ||
    makeModel.includes('volvo xc90') ||
    makeModel.includes('porsche cayenne') ||
    makeModel.includes('estate') ||
    makeModel.includes('touring') ||
    model.toLowerCase().includes('suv') ||
    model.toLowerCase().includes('4x4')
  ) {
    return 'L'
  }
  
  // Extra large vehicles
  if (
    makeModel.includes('van') ||
    makeModel.includes('transit') ||
    makeModel.includes('sprinter') ||
    makeModel.includes('mercedes v-class') ||
    makeModel.includes('volkswagen crafter') ||
    makeModel.includes('iveco daily') ||
    makeModel.includes('bentley') ||
    makeModel.includes('rolls royce') ||
    makeModel.includes('ferrari') ||
    makeModel.includes('lamborghini') ||
    makeModel.includes('maserati') ||
    makeModel.includes('aston martin')
  ) {
    return 'XL'
  }
  
  // Default to medium for everything else (saloons, standard cars)
  return 'M'
}

/**
 * Get size configuration and pricing information
 */
export const sizeConfig = {
  S: { label: 'Small', color: 'text-green-600', examples: 'Hatchbacks, Mini', multiplier: 1.0 },
  M: { label: 'Medium', color: 'text-blue-600', examples: 'Saloons, Compact SUVs', multiplier: 1.2 },
  L: { label: 'Large', color: 'text-orange-600', examples: 'Estates, Large SUVs', multiplier: 1.4 },
  XL: { label: 'Extra Large', color: 'text-red-600', examples: 'Vans, Luxury Cars', multiplier: 1.6 }
} as const

/**
 * Get size information including pricing multiplier
 */
export function getSizeInfo(sizeName: 'S' | 'M' | 'L' | 'XL') {
  return sizeConfig[sizeName]
}

/**
 * Map price multiplier to size name (for legacy data)
 */
export function getSizeNameFromMultiplier(multiplier: number): 'S' | 'M' | 'L' | 'XL' {
  if (multiplier <= 1.0) return 'S'
  if (multiplier <= 1.3) return 'M'
  if (multiplier <= 1.6) return 'L'
  return 'XL'
}