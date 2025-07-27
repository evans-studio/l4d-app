// Phase 3: Booking Flow & Customer Experience Types

export type BookingStatus = 
  | 'draft'
  | 'pending' 
  | 'confirmed'
  | 'in_progress'
  | 'completed'
  | 'paid'
  | 'cancelled'
  | 'no_show'

export interface CustomerAddress {
  id: string
  user_id: string
  name?: string
  address_line_1: string
  address_line_2?: string
  city: string
  postal_code: string
  county?: string
  country: string
  latitude?: number
  longitude?: number
  distance_from_base?: number
  distance_from_business?: number
  is_primary: boolean
  is_default?: boolean
  is_verified: boolean
  created_at: string
  updated_at: string
}

export interface CustomerVehicle {
  id: string
  user_id: string
  vehicle_size_id: string
  name?: string
  make?: string
  model?: string
  year?: number
  color?: string
  license_plate?: string
  registration?: string
  notes?: string
  is_primary: boolean
  is_default?: boolean
  created_at: string
  updated_at: string
  vehicle_size?: Record<string, unknown>
}

export interface TimeSlot {
  id: string
  slot_date: string // YYYY-MM-DD format
  start_time: string // HH:MM format
  is_available: boolean
  notes?: string
  created_by?: string
  created_at: string
}

export interface Booking {
  id: string
  booking_reference: string
  customer_id: string
  service_id?: string
  vehicle_id?: string
  address_id?: string
  time_slot_id?: string
  
  // Pricing
  base_price: number
  vehicle_size_multiplier: number
  distance_surcharge: number
  total_price: number
  
  // Additional fields for our booking flow
  vehicle_details?: any
  service_address?: any
  distance_km?: number
  estimated_duration?: number
  pricing_breakdown?: PricingBreakdown
  
  // Status and Notes
  status: BookingStatus
  special_instructions?: string
  admin_notes?: string
  internal_notes?: string
  
  // Scheduling
  scheduled_date: string
  scheduled_start_time: string
  scheduled_end_time: string
  actual_start_time?: string
  actual_end_time?: string
  confirmed_start_time?: string
  confirmed_duration?: number
  
  // Payment
  payment_method?: string
  payment_status: string
  payment_reference?: string
  
  // Metadata
  created_at: string
  updated_at: string
  confirmed_at?: string
  completed_at?: string
  cancelled_at?: string
  cancelled_by?: string
  cancellation_reason?: string
}

export interface BookingService {
  id: string
  booking_id: string
  service_id: string
  service_details: {
    name: string
    short_description: string
    base_price: number
    estimated_duration: number
    category_name: string
  }
  price: number
  estimated_duration: number
  created_at: string
}

export interface BookingStatusHistory {
  id: string
  booking_id: string
  from_status?: BookingStatus
  to_status: BookingStatus
  changed_by?: string
  reason?: string
  notes?: string
  created_at: string
}

export interface BookingMessage {
  id: string
  booking_id: string
  sender_id: string
  recipient_id?: string
  message_type: string
  subject?: string
  message: string
  is_internal: boolean
  read_at?: string
  created_at: string
}

export interface PricingBreakdown {
  services: Array<{
    service_id: string
    service_name: string
    base_price: number
    vehicle_adjustment: number
    final_price: number
  }>
  subtotal: number
  vehicle_multiplier: number
  distance_surcharge: number
  total: number
}

// Booking Flow Steps
export interface BookingFlowData {
  // Step 1: Service Selection
  selectedServices?: string[]
  
  // Step 2: Vehicle Details
  selectedVehicle?: CustomerVehicle
  vehicleDetails?: {
    make: string
    model: string
    year?: number
    color?: string
    registration?: string
    size_id: string
    notes?: string
  }
  
  // Step 3: Address
  selectedAddress?: CustomerAddress
  addressDetails?: {
    name: string
    address_line_1: string
    address_line_2?: string
    city: string
    postcode: string
  }
  
  // Step 4: Time Slot
  selectedDate?: string
  selectedTimeSlot?: {
    start_time: string
    end_time: string
  }
  
  // Step 5: Pricing & Confirmation
  pricingCalculation?: PricingBreakdown
  customerNotes?: string
  
  // Current step
  currentStep: number
  totalSteps: number
}

// API Request/Response Types
export interface CreateBookingRequest {
  services: string[] // Service IDs
  vehicle: {
    size_id: string
    make: string
    model: string
    year?: number
    color?: string
    registration?: string
    notes?: string
  }
  address: {
    name: string
    address_line_1: string
    address_line_2?: string
    city: string
    postcode: string
  }
  scheduled_date: string
  time_slot_id: string
  customer_notes?: string
}

export interface AvailableTimeSlot {
  date: string
  slots: Array<{
    start_time: string
    end_time: string
    available: boolean
    booking_count: number
    max_bookings: number
  }>
}

export interface BookingCalendarDay {
  date: string
  day_of_week: number
  available_slots: Array<{
    id: string
    start_time: string
    end_time: string
    available: boolean
    booking_count: number
  }>
  is_available: boolean
}

// Customer Dashboard Types
export interface CustomerDashboardData {
  upcoming_bookings: Booking[]
  past_bookings: Booking[]
  saved_vehicles: CustomerVehicle[]
  saved_addresses: CustomerAddress[]
  booking_stats: {
    total_bookings: number
    completed_bookings: number
    cancelled_bookings: number
    total_spent: number
  }
}

// Admin Dashboard Types
export interface AdminBookingOverview {
  today_bookings: Booking[]
  upcoming_bookings: Booking[]
  pending_bookings: Booking[]
  recent_completions: Booking[]
  stats: {
    today_count: number
    week_count: number
    month_revenue: number
    pending_count: number
  }
}

// Re-export existing types for convenience
export type { Service, ServiceCategory } from './database'
export type { VehicleSize } from './database'