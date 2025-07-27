import { Database } from '@/lib/supabase/types'

// Type aliases for easier use
export type Tables<T extends keyof Database['public']['Tables']> = Database['public']['Tables'][T]['Row']
export type Enums<T extends keyof Database['public']['Enums']> = Database['public']['Enums'][T]

// Common database types (placeholder - replace with generated types)
export type UserProfile = Record<string, unknown>
export type Service = Record<string, unknown>
export type ServiceCategory = Record<string, unknown>
export type VehicleSize = Record<string, unknown>
export type Booking = Record<string, unknown>
export type CustomerAddress = Record<string, unknown>
export type CustomerVehicle = Record<string, unknown>
export type TimeSlot = Record<string, unknown>
export type Testimonial = Record<string, unknown>
export type FAQItem = Record<string, unknown>
export type SiteSetting = Record<string, unknown>

// Enums
export type BookingStatus = Enums<'booking_status'>

// Extended types with relationships
export interface BookingWithDetails extends Booking {
  customer?: UserProfile
  service?: Service
  vehicle?: CustomerVehicle & {
    vehicle_size?: VehicleSize
  }
  address?: CustomerAddress
  time_slot?: TimeSlot
}

export interface ServiceWithCategory extends Service {
  category?: ServiceCategory
}

// Transform functions for API responses
export function transformBookingForAPI(booking: BookingWithDetails): Record<string, unknown> {
  return {
    id: booking.id,
    bookingReference: booking.booking_reference,
    status: booking.status,
    totalPrice: booking.total_price,
    scheduledDate: booking.scheduled_date,
    scheduledStartTime: booking.scheduled_start_time,
    scheduledEndTime: booking.scheduled_end_time,
    specialInstructions: booking.special_instructions,
    customer: booking.customer ? {
      id: booking.customer.id,
      firstName: booking.customer.first_name,
      lastName: booking.customer.last_name,
      email: booking.customer.email,
      phone: booking.customer.phone,
    } : null,
    service: booking.service ? {
      id: booking.service.id,
      name: booking.service.name,
      duration: booking.service.duration_minutes,
    } : null,
    vehicle: booking.vehicle ? {
      id: booking.vehicle.id,
      make: booking.vehicle.make,
      model: booking.vehicle.model,
      year: booking.vehicle.year,
      color: booking.vehicle.color,
      size: booking.vehicle.vehicle_size?.name,
    } : null,
    address: booking.address ? {
      id: booking.address.id,
      addressLine1: booking.address.address_line_1,
      addressLine2: booking.address.address_line_2,
      city: booking.address.city,
      postalCode: booking.address.postal_code,
      county: booking.address.county,
    } : null,
  }
}