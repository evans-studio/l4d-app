// Temporary database types for services
export interface Service {
  id: string
  name: string
  short_description?: string
  base_price: number
  duration_minutes: number
  is_active?: boolean
  // category_id removed as service_categories table no longer exists
}

export interface VehicleSize {
  id: string
  name: string
  description?: string
  price_multiplier: number
  examples?: string[]
  display_order: number
  is_active: boolean
  created_at: string
}

// ServiceCategory interface removed as service_categories table no longer exists

// ServiceWithCategory interface removed as categories no longer exist

export interface UserProfile {
  id: string
  email: string
  first_name?: string
  last_name?: string
  phone?: string
  role: string
}