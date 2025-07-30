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
      const supabase = this.supabase

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

      // Get service pricing from new denormalized table
      const { data: servicePricing, error: pricingError } = await supabase
        .from('service_pricing')
        .select('small, medium, large, extra_large')
        .eq('service_id', request.serviceId)
        .single()

      if (pricingError) {
        console.error('Service pricing not found:', pricingError)
        return { data: null, error: new Error('Service pricing not configured') }
      }

      // Map vehicle size name to pricing column
      const sizeNameToColumn: Record<string, keyof typeof servicePricing> = {
        'Small': 'small',
        'Medium': 'medium', 
        'Large': 'large',
        'Extra Large': 'extra_large'
      }

      const pricingColumn = sizeNameToColumn[vehicleSize.name]
      if (!pricingColumn || !servicePricing[pricingColumn]) {
        return { data: null, error: new Error(`No pricing found for vehicle size: ${vehicleSize.name}`) }
      }

      const servicePrice = servicePricing[pricingColumn]
      const subtotal = Math.round(servicePrice)

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
        basePrice: servicePrice, // Use actual service price instead of base_price
        vehicleMultiplier: 1, // No longer using multipliers 
        subtotal,
        distanceSurcharge,
        totalPrice,
        distanceKm,
        breakdown: {
          basePrice: servicePrice,
          vehicleAdjustment: 0, // No adjustment needed with direct pricing
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
      const supabase = this.supabase

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
        .order('display_order')

      if (sizesError) return { data: null, error: sizesError }

      // Get service pricing from denormalized table
      const { data: servicePricing, error: pricingError } = await supabase
        .from('service_pricing')
        .select('small, medium, large, extra_large')
        .eq('service_id', serviceId)
        .single()

      if (pricingError) {
        console.error('Service pricing not found:', pricingError)
        return { data: null, error: new Error('Service pricing not configured') }
      }

      // Map vehicle sizes to their actual prices
      const sizeNameToColumn: Record<string, keyof typeof servicePricing> = {
        'Small': 'small',
        'Medium': 'medium',
        'Large': 'large', 
        'Extra Large': 'extra_large'
      }

      const vehiclePrices = vehicleSizes.map(size => {
        const pricingColumn = sizeNameToColumn[size.name]
        const price = pricingColumn ? (servicePricing[pricingColumn] || 0) : 0
        
        return {
          id: size.id,
          name: size.name,
          price: Math.round(price),
          multiplier: 1, // No longer using multipliers
        }
      }).filter(item => item.price > 0) // Only include sizes with pricing

      const prices = vehiclePrices.map(vp => vp.price)
      const minPrice = Math.min(...prices) || 0
      const maxPrice = Math.max(...prices) || 0

      const result = {
        serviceId: service.id,
        serviceName: service.name,
        minPrice,
        maxPrice,
        basePrice: minPrice, // Use minimum price as "base" for compatibility
        vehicleSizes: vehiclePrices,
      }

      return { data: result, error: null }
    }, 'Failed to get service price range')
  }
}