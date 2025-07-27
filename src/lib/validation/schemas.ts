import { z } from 'zod'

// User schemas
export const userProfileSchema = z.object({
  firstName: z.string().min(1, 'First name is required').max(100),
  lastName: z.string().min(1, 'Last name is required').max(100),
  email: z.string().email('Invalid email address'),
  phone: z.string().optional(),
})

// Address schemas
export const addressSchema = z.object({
  addressLine1: z.string().min(1, 'Address line 1 is required').max(255),
  addressLine2: z.string().optional(),
  city: z.string().min(1, 'City is required').max(100),
  postalCode: z.string().min(1, 'Postal code is required').max(20),
  county: z.string().optional().default(''),
  country: z.string().length(2).default('GB'),
})

// Vehicle schemas
export const vehicleSchema = z.object({
  vehicleSizeId: z.string().uuid('Invalid vehicle size'),
  make: z.string().min(1, 'Make is required').max(50),
  model: z.string().min(1, 'Model is required').max(50),
  year: z.number().min(1900).max(new Date().getFullYear() + 1),
  color: z.string().min(1, 'Color is required').max(30),
  licensePlate: z.string().optional(),
  notes: z.string().optional(),
})

// Booking schemas
export const bookingSchema = z.object({
  serviceId: z.string().uuid('Invalid service ID'),
  vehicleId: z.string().uuid('Invalid vehicle ID'),
  addressId: z.string().uuid('Invalid address ID'),
  timeSlotId: z.string().uuid('Invalid time slot ID'),
  specialInstructions: z.string().optional(),
})

// Time slot schemas
export const timeSlotSchema = z.object({
  slotDate: z.string().refine((date) => {
    const parsedDate = new Date(date)
    return parsedDate >= new Date() && !isNaN(parsedDate.getTime())
  }, 'Invalid date or date in the past'),
  startTime: z.string().regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, 'Invalid time format'),
  endTime: z.string().regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, 'Invalid time format'),
  maxBookings: z.number().min(1).default(1),
  notes: z.string().optional(),
})

// API response schemas
export const apiResponseSchema = z.object({
  success: z.boolean(),
  data: z.any().optional(),
  error: z.object({
    message: z.string(),
    code: z.string().optional(),
  }).optional(),
  metadata: z.object({
    pagination: z.object({
      page: z.number(),
      limit: z.number(),
      total: z.number(),
      totalPages: z.number(),
    }).optional(),
    timestamp: z.string().optional(),
  }).optional(),
})