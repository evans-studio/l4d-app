// Temporary database types for services
export interface Service {
  id: string
  name: string
  short_description?: string
  base_price: number
  duration_minutes: number
  is_active?: boolean
  category_id?: string
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

export interface ServiceCategory {
  id: string
  name: string
  description?: string
  display_order: number
  is_active: boolean
  created_at: string
}

export interface ServiceWithCategory extends Service {
  category?: ServiceCategory
}

export interface UserProfile {
  id: string
  email: string
  first_name?: string
  last_name?: string
  phone?: string
  role: string
}