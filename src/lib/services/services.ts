import { BaseService, ServiceResponse } from './base'
import { Service, VehicleSize } from '@/lib/utils/database'

// Define ServiceCategory locally since it's no longer in database.ts
interface ServiceCategory {
  id: string
  name: string
  description?: string
  display_order: number
  is_active: boolean
  created_at: string
}

export interface ServiceFilters {
  categoryId?: string
  search?: string
  isActive?: boolean
}

export interface ServiceWithPricing extends Service {
  priceRange: {
    min: number
    max: number
  }
  category?: ServiceCategory // Optional since categories are no longer used
}

export class ServicesService extends BaseService {
  
  async getAllServices(filters: ServiceFilters = {}): Promise<ServiceResponse<ServiceWithPricing[]>> {
    return this.executeQuery(async () => {
      const supabase = this.supabase
      let query = supabase
        .from('services')
        .select(`*`)
        .order('display_order')

      // Apply filters
      if (filters.categoryId) {
        query = query.eq('category_id', filters.categoryId)
      }

      if (filters.search) {
        query = query.or(`name.ilike.%${filters.search}%,short_description.ilike.%${filters.search}%`)
      }

      // Default to active services if not specified
      if (filters.isActive !== undefined) {
        query = query.eq('is_active', filters.isActive)
      } else {
        query = query.eq('is_active', true)
      }

      const { data: services, error } = await query

      if (error) return { data: null, error }

      // Vehicle sizes table no longer exists - using service_pricing directly

      // Get service pricing data for all services
      const { data: servicePricingData, error: pricingError } = await supabase
        .from('service_pricing')
        .select('service_id, small, medium, large, extra_large')

      if (pricingError) {
        console.error('Service pricing error:', pricingError)
        return { data: null, error: pricingError }
      }

      // Create pricing lookup map
      const pricingLookup: Record<string, { small?: number; medium?: number; large?: number; extra_large?: number }> = {}
      servicePricingData?.forEach(pricing => {
        pricingLookup[pricing.service_id] = {
          small: pricing.small || undefined,
          medium: pricing.medium || undefined,
          large: pricing.large || undefined,
          extra_large: pricing.extra_large || undefined
        }
      })

      // Calculate price ranges for each service using actual pricing data
      const servicesWithPricing: ServiceWithPricing[] = services.map(service => {
        try {
          const servicePricing = pricingLookup[service.id]
          
          if (!servicePricing) {
            console.warn(`No pricing found for service: ${service.id}`)
            return {
              ...service,
              priceRange: { min: 0, max: 0 },
            }
          }

          // Get all prices from the service pricing
          const prices = [
            servicePricing.small,
            servicePricing.medium,
            servicePricing.large,
            servicePricing.extra_large
          ].filter((price): price is number => price !== undefined && price > 0)

          const minPrice = prices.length > 0 ? Math.min(...prices) : 0
          const maxPrice = prices.length > 0 ? Math.max(...prices) : 0

          return {
            ...service,
            priceRange: {
              min: Math.round(minPrice),
              max: Math.round(maxPrice),
            },
          }
        } catch (error) {
          console.error('Error processing service:', service.id, error)
          throw error
        }
      })

      return { data: servicesWithPricing, error: null }
    }, 'Failed to fetch services')
  }

  async getServiceById(id: string): Promise<ServiceResponse<ServiceWithPricing>> {
    return this.executeQuery(async () => {
      const supabase = this.supabase
      const { data: service, error } = await supabase
        .from('services')
        .select(`*`)
        .eq('id', id)
        .eq('is_active', true)
        .single()

      if (error) return { data: null, error }

      // Vehicle sizes table no longer exists - using service_pricing directly

      // Get service pricing data for this specific service
      const { data: servicePricing, error: pricingError } = await supabase
        .from('service_pricing')
        .select('small, medium, large, extra_large')
        .eq('service_id', id)
        .single()

      if (pricingError) {
        console.warn('Service pricing data missing for service:', id, pricingError)
        // Continue without pricing data - use base price as fallback
      }

      // Calculate price range from actual pricing data (if available)
      const prices = servicePricing ? [
        servicePricing.small,
        servicePricing.medium,
        servicePricing.large,
        servicePricing.extra_large
      ].filter((price): price is number => price !== undefined && price > 0) : []

      const minPrice = prices.length > 0 ? Math.min(...prices) : (service.base_price || 0)
      const maxPrice = prices.length > 0 ? Math.max(...prices) : (service.base_price || 0)

      const serviceWithPricing: ServiceWithPricing = {
        ...service,
        priceRange: {
          min: Math.round(minPrice),
          max: Math.round(maxPrice),
        },
      }

      return { data: serviceWithPricing, error: null }
    }, 'Failed to fetch service')
  }

  async getServiceCategories(): Promise<ServiceResponse<ServiceCategory[]>> {
    // Service categories table no longer exists - return empty array
    return {
      success: true,
      data: []
    }
  }

  async getVehicleSizes(): Promise<ServiceResponse<VehicleSize[]>> {
    // Vehicle sizes table no longer exists - return hardcoded categories
    return {
      success: true,
      data: [
        { id: 'small', name: 'Small', display_order: 1, is_active: true, price_multiplier: 1.0 },
        { id: 'medium', name: 'Medium', display_order: 2, is_active: true, price_multiplier: 1.0 },
        { id: 'large', name: 'Large', display_order: 3, is_active: true, price_multiplier: 1.0 },
        { id: 'extra_large', name: 'Extra Large', display_order: 4, is_active: true, price_multiplier: 1.0 }
      ] as VehicleSize[]
    }
  }

  async createService(serviceData: Partial<Service>): Promise<ServiceResponse<Service>> {
    return this.executeQuery(async () => {
      const supabase = this.supabase
      console.log('ServicesService: Creating service with data:', serviceData)
      
      const result = await supabase
        .from('services')
        .insert(serviceData)
        .select()
        .single()
      
      console.log('ServicesService: Database insert result:', result)
      
      if (result.error) {
        console.error('ServicesService: Database error details:', {
          message: result.error.message,
          code: result.error.code,
          details: result.error.details,
          hint: result.error.hint
        })
      }
      
      return result
    }, 'Failed to create service')
  }

  async updateService(id: string, serviceData: Partial<Service>): Promise<ServiceResponse<Service>> {
    return this.executeQuery(async () => {
      const supabase = this.supabase
      return supabase
        .from('services')
        .update(serviceData)
        .eq('id', id)
        .select()
        .single()
    }, 'Failed to update service')
  }

  async deleteService(id: string): Promise<ServiceResponse<void>> {
    return this.executeQuery(async () => {
      const supabase = this.supabase
      const result = await supabase
        .from('services')
        .update({ is_active: false })
        .eq('id', id)
      return { data: undefined, error: result.error }
    }, 'Failed to delete service')
  }

  // Service Category CRUD Methods - No longer available as table was removed
  async getServiceCategoryById(id: string): Promise<ServiceResponse<ServiceCategory>> {
    return {
      success: false,
      error: { message: 'Service categories are no longer available' }
    }
  }

  async createServiceCategory(categoryData: Partial<ServiceCategory>): Promise<ServiceResponse<ServiceCategory>> {
    return {
      success: false,
      error: { message: 'Service categories are no longer available' }
    }
  }

  async updateServiceCategory(id: string, categoryData: Partial<ServiceCategory>): Promise<ServiceResponse<ServiceCategory>> {
    return {
      success: false,
      error: { message: 'Service categories are no longer available' }
    }
  }

  async deleteServiceCategory(id: string): Promise<ServiceResponse<void>> {
    return {
      success: false,
      error: { message: 'Service categories are no longer available' }
    }
  }

  // Vehicle Size CRUD Methods - These now work with hardcoded data
  async getVehicleSizeById(id: string): Promise<ServiceResponse<VehicleSize>> {
    const sizes = [
      { id: 'small', name: 'Small', display_order: 1, is_active: true, price_multiplier: 1.0 },
      { id: 'medium', name: 'Medium', display_order: 2, is_active: true, price_multiplier: 1.0 },
      { id: 'large', name: 'Large', display_order: 3, is_active: true, price_multiplier: 1.0 },
      { id: 'extra_large', name: 'Extra Large', display_order: 4, is_active: true, price_multiplier: 1.0 }
    ] as VehicleSize[]
    
    const size = sizes.find(s => s.id === id)
    if (size) {
      return { success: true, data: size }
    } else {
      return { 
        success: false, 
        error: { message: 'Vehicle size not found' }
      }
    }
  }

  async createVehicleSize(vehicleSizeData: Partial<VehicleSize>): Promise<ServiceResponse<VehicleSize>> {
    // Vehicle sizes table no longer exists - return error
    return {
      success: false,
      error: { message: 'Vehicle sizes table no longer exists - use service_pricing instead' }
    }
  }

  async updateVehicleSize(id: string, vehicleSizeData: Partial<VehicleSize>): Promise<ServiceResponse<VehicleSize>> {
    // Vehicle sizes table no longer exists - return error
    return {
      success: false,
      error: { message: 'Vehicle sizes table no longer exists - use service_pricing instead' }
    }
  }

  async deleteVehicleSize(id: string): Promise<ServiceResponse<void>> {
    // Vehicle sizes table no longer exists - return error
    return {
      success: false,
      error: { message: 'Vehicle sizes table no longer exists - use service_pricing instead' }
    }
  }
}