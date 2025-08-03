// Core booking types for the streamlined application

export interface CustomerInfo {
  firstName: string
  lastName: string
  email: string
  phone: string
  password?: string // Optional password for new users during booking
}

export interface VehicleInfo {
  make: string
  model: string
  year: number
  color: string
  licenseNumber?: string
  vehicleSize: 'small' | 'medium' | 'large' | 'xl'
  notes?: string
}

export interface ServiceAddress {
  label: string // e.g., "Home", "Work", "Other"
  addressLine1: string
  addressLine2?: string
  city: string
  county?: string
  postalCode: string
  country: string
  accessInstructions?: string
}

export interface ServiceSelection {
  serviceId: string
  serviceName: string
  duration: number
  basePrice: number
  vehicleSizeMultiplier: number
}

export interface TimeSlot {
  date: string // YYYY-MM-DD format
  startTime: string // HH:MM format
  endTime: string // HH:MM format
  slotId?: string
}

export interface BookingFormData {
  customer: CustomerInfo
  vehicle: VehicleInfo
  address: ServiceAddress
  services: ServiceSelection[]
  timeSlot: TimeSlot
  specialRequests?: string
  totalPrice: number
}

// Database entity types matching actual schema
export interface UserProfile {
  id: string // Same as auth.users.id
  email: string
  first_name: string
  last_name: string
  phone?: string
  role: 'customer' | 'admin' | 'super_admin'
  is_active: boolean
  created_at: string
  updated_at: string
}

export interface UserNotificationSettings {
  id: string
  user_id: string // FK to auth.users.id
  email_bookings: boolean
  email_reminders: boolean
  sms_bookings: boolean
  created_at: string
  updated_at: string
}

export interface VehicleSize {
  id: string
  name: string
  description: string
  price_multiplier: number
  examples: string[]
  display_order: number
  is_active: boolean
}

export interface CustomerVehicle {
  id: string
  user_id: string // FK to user_profiles.id (NOT customer_id)
  vehicle_size_id: string // FK to vehicle_sizes.id
  make: string
  model: string
  year: number
  color: string
  license_plate?: string
  registration?: string
  notes?: string
  is_primary: boolean
  is_default: boolean
  created_at: string
  updated_at: string
}

export interface CustomerAddress {
  id: string
  user_id: string // FK to user_profiles.id (NOT customer_id)
  address_line_1: string
  address_line_2?: string
  city: string
  postal_code: string
  county?: string
  country: string
  latitude?: number
  longitude?: number
  distance_from_business?: number
  is_primary: boolean
  is_default: boolean
  created_at: string
  updated_at: string
}

export interface ServiceCategory {
  id: string
  name: string
  description: string
  display_order: number
  is_active: boolean
  created_at: string
  updated_at: string
}

export interface Service {
  id: string
  category_id: string // FK to service_categories.id
  name: string
  slug: string
  short_description: string
  full_description: string
  base_price: number
  duration_minutes: number
  is_mobile_only: boolean
  requires_water_source: boolean
  requires_power_source: boolean
  max_vehicles_per_slot: number
  display_order: number
  is_active: boolean
  created_at: string
  updated_at: string
}

export interface TimeSlot {
  id: string
  slot_date: string
  start_time: string
  is_available: boolean
  notes?: string
  created_by: string // FK to user_profiles.id
  created_at: string
}

export interface Booking {
  id: string
  booking_reference: string
  customer_id: string // FK to user_profiles.id
  vehicle_id: string // FK to customer_vehicles.id
  address_id: string // FK to customer_addresses.id
  service_id: string // FK to services.id
  time_slot_id: string // FK to time_slots.id
  
  // Pricing breakdown
  base_price: number
  vehicle_size_multiplier: number
  distance_surcharge: number
  total_price: number
  pricing_breakdown: {
    basePrice: number
    vehicleSize: string
    sizeMultiplier: number
    subtotal: number
    distanceKm?: number
    distanceSurcharge: number
    totalPrice: number
    calculation: string
  }
  
  // Scheduling
  scheduled_date: string
  scheduled_start_time: string
  scheduled_end_time: string
  estimated_duration: number
  
  // Status
  status: 'pending' | 'confirmed' | 'in_progress' | 'completed' | 'cancelled'
  payment_status: 'pending' | 'paid' | 'failed' | 'refunded'
  payment_method?: string
  payment_reference?: string
  
  // Notes
  special_instructions?: string
  internal_notes?: string
  admin_notes?: string
  
  // Timestamps
  created_at: string
  updated_at: string
  confirmed_at?: string
  confirmation_sent_at?: string
  completed_at?: string
  cancelled_at?: string
  cancelled_by?: string
}

export interface BookingService {
  id: string
  booking_id: string // FK to bookings.id
  service_id: string // FK to services.id
  service_details: {
    name: string
    category: string
    originalBasePrice: number
    appliedPrice: number
  }
  price: number
  estimated_duration: number
  created_at: string
}

// Audit trail types
export interface BookingStatusHistory {
  id: string
  booking_id: string // FK to bookings.id
  from_status: string | null
  to_status: string
  changed_by: string // FK to user_profiles.id
  reason: string
  notes?: string
  created_at: string
}

export interface BookingHistory {
  id: string
  booking_id: string // FK to bookings.id
  action: string
  details: Record<string, any> // JSONB field
  created_by: string // FK to user_profiles.id
  created_at: string
}

export interface BookingMessage {
  id: string
  booking_id: string // FK to bookings.id
  sender_id: string // FK to user_profiles.id
  recipient_id: string // FK to user_profiles.id
  message_type: 'customer_inquiry' | 'admin_response' | 'system_notification'
  subject?: string
  message: string
  is_internal: boolean
  read_at?: string
  created_at: string
}

// API Response types
export interface ApiResponse<T = any> {
  success: boolean
  data?: T
  error?: {
    message: string
    code: string
  }
  metadata?: {
    pagination?: {
      page: number
      limit: number
      total: number
    }
    timestamp?: string
  }
}

// Dashboard types
export interface DashboardBooking {
  id: string
  booking_reference: string
  scheduled_date: string
  scheduled_start_time: string
  status: Booking['status']
  total_price: number
  pricing_breakdown: Booking['pricing_breakdown']
  vehicle: {
    make: string
    model: string
    year: number
    color: string
    license_plate?: string
    vehicle_size: {
      name: string
      price_multiplier: number
    }
  }
  address: {
    address_line_1: string
    address_line_2?: string
    city: string
    postal_code: string
    distance_from_business?: number
  }
  service: {
    name: string
    category: string
    short_description: string
  }
  booking_services: Array<{
    service_details: BookingService['service_details']
    price: number
    estimated_duration: number
  }>
  created_at: string
  confirmation_sent_at?: string
}

export interface SavedVehicle extends CustomerVehicle {
  vehicle_size: VehicleSize
  booking_count: number
  last_used: string
}

export interface SavedAddress extends CustomerAddress {
  booking_count: number
  last_used: string
}