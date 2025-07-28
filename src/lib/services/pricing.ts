import { BaseService, ServiceResponse } from './base'

export interface PricingCalculationRequest {
  serviceId: string
  vehicleSizeId: string
  distanceKm?: number
  customPostcode?: string
}

export interface PricingCalculation {
  serviceId: string
  serviceName: string
  vehicleSizeId: string
  vehicleSizeName: string
  basePrice: number
  vehicleMultiplier: number
  subtotal: number
  distanceSurcharge: number
  totalPrice: number
  distanceKm?: number
  breakdown: {
    basePrice: number
    vehicleAdjustment: number
    distanceSurcharge: number
  }
}

export interface DistanceCalculationResult {
  distanceKm: number
  surcharge: number
  freeDeliveryRadius: number
  surchargePerKm: number
}

export class PricingService extends BaseService {
  
  private readonly FREE_DELIVERY_RADIUS_KM = 5
  private readonly DISTANCE_SURCHARGE_PER_KM = 1.50
  private readonly BUSINESS_POSTCODE = 'NG5 1FB' // Nottingham base

  async calculateServicePrice(request: PricingCalculationRequest): Promise<ServiceResponse<PricingCalculation>> {
    return this.executeQuery(async () => {
      const supabase = await this.supabase

      // Get service details
      const { data: service, error: serviceError } = await supabase
        .from('services')
        .select('*')
        .eq('id', request.serviceId)
        .eq('is_active', true)
        .single()

      if (serviceError) return { data: null, error: serviceError }

      // Get vehicle size details
      const { data: vehicleSize, error: sizeError } = await supabase
        .from('vehicle_sizes')
        .select('*')
        .eq('id', request.vehicleSizeId)
        .eq('is_active', true)
        .single()

      if (sizeError) return { data: null, error: sizeError }

      // Calculate base pricing
      const basePrice = service.base_price
      const vehicleMultiplier = vehicleSize.price_multiplier
      const subtotal = Math.round(basePrice * vehicleMultiplier)

      // Calculate distance surcharge
      let distanceSurcharge = 0
      let distanceKm = request.distanceKm

      if (request.customPostcode && !distanceKm) {
        const distanceResult = await this.calculateDistance(request.customPostcode)
        if (distanceResult.success && distanceResult.data) {
          distanceKm = distanceResult.data.distanceKm
          distanceSurcharge = distanceResult.data.surcharge
        }
      } else if (distanceKm) {
        distanceSurcharge = this.calculateDistanceSurcharge(distanceKm)
      }

      const totalPrice = subtotal + distanceSurcharge

      const calculation: PricingCalculation = {
        serviceId: service.id,
        serviceName: service.name,
        vehicleSizeId: vehicleSize.id,
        vehicleSizeName: vehicleSize.name,
        basePrice,
        vehicleMultiplier,
        subtotal,
        distanceSurcharge,
        totalPrice,
        distanceKm,
        breakdown: {
          basePrice,
          vehicleAdjustment: subtotal - basePrice,
          distanceSurcharge,
        },
      }

      return { data: calculation, error: null }
    }, 'Failed to calculate service price')
  }

  async calculateMultipleServices(
    serviceIds: string[],
    vehicleSizeId: string,
    distanceKm?: number,
    customPostcode?: string
  ): Promise<ServiceResponse<PricingCalculation[]>> {
    return this.executeQuery(async () => {
      const calculations: PricingCalculation[] = []

      for (const serviceId of serviceIds) {
        const result = await this.calculateServicePrice({
          serviceId,
          vehicleSizeId,
          distanceKm,
          customPostcode,
        })

        if (!result.success || !result.data) {
          return { data: null, error: result.error || new Error(`Failed to calculate price for service ${serviceId}`) }
        }

        calculations.push(result.data)
      }

      return { data: calculations, error: null }
    }, 'Failed to calculate multiple service prices')
  }

  async calculateDistance(postcode: string): Promise<ServiceResponse<DistanceCalculationResult>> {
    return this.executeQuery(async () => {
      // For now, we'll use a simple mock distance calculation
      // In production, you would integrate with a real geocoding/distance API
      // like Google Maps API, Mapbox, or UK Postcode API
      
      const mockDistanceKm = this.mockCalculateDistance(postcode)
      const surcharge = this.calculateDistanceSurcharge(mockDistanceKm)

      const result: DistanceCalculationResult = {
        distanceKm: mockDistanceKm,
        surcharge,
        freeDeliveryRadius: this.FREE_DELIVERY_RADIUS_KM,
        surchargePerKm: this.DISTANCE_SURCHARGE_PER_KM,
      }

      return { data: result, error: null }
    }, 'Failed to calculate distance')
  }

  private calculateDistanceSurcharge(distanceKm: number): number {
    if (distanceKm <= this.FREE_DELIVERY_RADIUS_KM) {
      return 0
    }

    const extraDistance = distanceKm - this.FREE_DELIVERY_RADIUS_KM
    return Math.round(extraDistance * this.DISTANCE_SURCHARGE_PER_KM * 100) / 100
  }

  private mockCalculateDistance(postcode: string): number {
    // Mock distance calculation based on postcode patterns
    // This is a temporary implementation for development
    const cleanPostcode = postcode.replace(/\s/g, '').toUpperCase()
    
    // Mock distances based on common UK postcode areas around Nottingham
    const postcodeDistances: Record<string, number> = {
      'NG1': 3,
      'NG2': 4,
      'NG3': 6,
      'NG4': 8,
      'NG5': 2, // Business location
      'NG6': 7,
      'NG7': 5,
      'NG8': 9,
      'DE1': 15, // Derby
      'LE1': 25, // Leicester
      'S1': 35,  // Sheffield
      'M1': 45,  // Manchester
    }

    // Extract area code (first 2-3 characters)
    for (const [area, distance] of Object.entries(postcodeDistances)) {
      if (cleanPostcode.startsWith(area)) {
        return distance
      }
    }

    // Default to 10km for unknown postcodes
    return 10
  }

  async getPricingRules(): Promise<ServiceResponse<{
    freeDeliveryRadius: number
    distanceSurchargePerKm: number
    businessPostcode: string
  }>> {
    return this.executeQuery(async () => {
      const rules = {
        freeDeliveryRadius: this.FREE_DELIVERY_RADIUS_KM,
        distanceSurchargePerKm: this.DISTANCE_SURCHARGE_PER_KM,
        businessPostcode: this.BUSINESS_POSTCODE,
      }

      return { data: rules, error: null }
    }, 'Failed to get pricing rules')
  }

  async getServicePriceRange(serviceId: string): Promise<ServiceResponse<{
    serviceId: string
    serviceName: string
    minPrice: number
    maxPrice: number
    basePrice: number
    vehicleSizes: Array<{
      id: string
      name: string
      price: number
      multiplier: number
    }>
  }>> {
    return this.executeQuery(async () => {
      const supabase = await this.supabase

      // Get service
      const { data: service, error: serviceError } = await supabase
        .from('services')
        .select('*')
        .eq('id', serviceId)
        .eq('is_active', true)
        .single()

      if (serviceError) return { data: null, error: serviceError }

      // Get all vehicle sizes
      const { data: vehicleSizes, error: sizesError } = await supabase
        .from('vehicle_sizes')
        .select('*')
        .eq('is_active', true)
        .order('price_multiplier')

      if (sizesError) return { data: null, error: sizesError }

      const basePrice = service.base_price
      const vehiclePrices = vehicleSizes.map(size => ({
        id: size.id,
        name: size.name,
        price: Math.round(basePrice * size.price_multiplier),
        multiplier: size.price_multiplier,
      }))

      const minPrice = vehiclePrices[0]?.price || basePrice
      const maxPrice = vehiclePrices[vehiclePrices.length - 1]?.price || basePrice

      const result = {
        serviceId: service.id,
        serviceName: service.name,
        minPrice,
        maxPrice,
        basePrice,
        vehicleSizes: vehiclePrices,
      }

      return { data: result, error: null }
    }, 'Failed to get service price range')
  }
}