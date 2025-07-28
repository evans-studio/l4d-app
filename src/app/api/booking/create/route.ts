import { NextRequest } from 'next/server'
import { ApiResponseHandler } from '@/lib/api/response'
import { createClientFromRequest, createAdminClient } from '@/lib/supabase/server'
import { z } from 'zod'
import { randomUUID } from 'crypto'

// Validation schemas
const userSchema = z.object({
  email: z.string().email('Invalid email format'),
  phone: z.string().min(10, 'Phone number must be at least 10 characters'),
  name: z.string().min(1, 'Name is required'),
  isNewUser: z.boolean()
})

const vehicleSchema = z.object({
  make: z.string().min(1, 'Vehicle make is required'),
  model: z.string().min(1, 'Vehicle model is required'),
  year: z.number().int().min(1900).max(new Date().getFullYear() + 1),
  size: z.enum(['small', 'medium', 'large', 'extra_large']),
  color: z.string().optional(),
  registration: z.string().optional(),
  notes: z.string().optional()
})

const newAddressSchema = z.object({
  street: z.string().min(1, 'Street address is required'),
  city: z.string().min(1, 'City is required'),
  state: z.string().min(1, 'State is required'),
  zipCode: z.string().min(1, 'Zip code is required')
})

const bookingSchema = z.object({
  slotId: z.string().uuid('Invalid slot ID'),
  serviceId: z.string().uuid('Invalid service ID'),
  addressId: z.string().uuid().optional(),
  newAddress: newAddressSchema.optional(),
  specialInstructions: z.string().optional()
}).refine(data => data.addressId || data.newAddress, {
  message: 'Either addressId or newAddress must be provided'
})

const createBookingSchema = z.object({
  user: userSchema,
  vehicle: vehicleSchema,
  booking: bookingSchema
})

export async function POST(request: NextRequest) {
  try {
    const supabase = createClientFromRequest(request)
    const adminSupabase = createAdminClient()
    const body = await request.json()
    
    // Validate request body
    const validation = createBookingSchema.safeParse(body)
    if (!validation.success) {
      return ApiResponseHandler.badRequest('Invalid request data', {
        errors: validation.error.issues
      })
    }
    
    const { user, vehicle, booking } = validation.data
    
    // Start a transaction by using the admin client
    const response = await adminSupabase.rpc('create_booking_transaction', {
      p_user_data: user,
      p_vehicle_data: vehicle,
      p_booking_data: booking
    })
    
    if (response.error) {
      console.error('Transaction failed:', response.error)
      
      // If the RPC doesn't exist, fall back to manual transaction
      return await createBookingManually(adminSupabase, user, vehicle, booking)
    }
    
    return ApiResponseHandler.success(response.data)
    
  } catch (error) {
    console.error('Unexpected error in booking creation:', error)
    return ApiResponseHandler.serverError('An unexpected error occurred')
  }
}

// Fallback manual transaction implementation
async function createBookingManually(
  supabase: any,
  userData: z.infer<typeof userSchema>,
  vehicleData: z.infer<typeof vehicleSchema>,
  bookingData: z.infer<typeof bookingSchema>
) {
  try {
    let userId: string
    let vehicleId: string
    let addressId: string
    
    // Step 1: Handle user creation/retrieval
    if (userData.isNewUser) {
      // Create new user profile
      const newUserId = randomUUID()
      const { error: userError } = await supabase
        .from('user_profiles')
        .insert({
          id: newUserId,
          email: userData.email,
          phone: userData.phone,
          first_name: userData.name.split(' ')[0],
          last_name: userData.name.split(' ').slice(1).join(' ') || null,
          role: 'customer',
          is_active: true,
          email_verified: false,
          phone_verified: false
        })
      
      if (userError) {
        console.error('Error creating user:', userError)
        return ApiResponseHandler.serverError('Failed to create user profile')
      }
      
      userId = newUserId
    } else {
      // Find existing user
      const { data: existingUser, error: userError } = await supabase
        .from('user_profiles')
        .select('id')
        .or(`email.eq.${userData.email},phone.eq.${userData.phone}`)
        .single()
      
      if (userError || !existingUser) {
        console.error('Error finding existing user:', userError)
        return ApiResponseHandler.notFound('User not found')
      }
      
      userId = existingUser.id
    }
    
    // Step 2: Get vehicle size ID
    const { data: vehicleSize, error: sizeError } = await supabase
      .from('vehicle_sizes')
      .select('id, price_multiplier')
      .eq('name', vehicleData.size)
      .eq('is_active', true)
      .single()
    
    if (sizeError || !vehicleSize) {
      console.error('Error finding vehicle size:', sizeError)
      return ApiResponseHandler.badRequest('Invalid vehicle size')
    }
    
    // Step 3: Create/get vehicle
    const { data: newVehicle, error: vehicleError } = await supabase
      .from('customer_vehicles')
      .insert({
        user_id: userId,
        vehicle_size_id: vehicleSize.id,
        make: vehicleData.make,
        model: vehicleData.model,
        year: vehicleData.year,
        color: vehicleData.color,
        registration: vehicleData.registration,
        notes: vehicleData.notes,
        is_primary: false // TODO: Handle primary vehicle logic
      })
      .select('id')
      .single()
    
    if (vehicleError || !newVehicle) {
      console.error('Error creating vehicle:', vehicleError)
      return ApiResponseHandler.serverError('Failed to create vehicle')
    }
    
    vehicleId = newVehicle.id
    
    // Step 4: Handle address
    if (bookingData.addressId) {
      addressId = bookingData.addressId
    } else if (bookingData.newAddress) {
      const { data: newAddress, error: addressError } = await supabase
        .from('customer_addresses')
        .insert({
          user_id: userId,
          address_line_1: bookingData.newAddress.street,
          city: bookingData.newAddress.city,
          postal_code: bookingData.newAddress.zipCode,
          country: 'UK', // TODO: Make configurable
          is_primary: false,
          is_verified: false
        })
        .select('id')
        .single()
      
      if (addressError || !newAddress) {
        console.error('Error creating address:', addressError)
        return ApiResponseHandler.serverError('Failed to create address')
      }
      
      addressId = newAddress.id
    } else {
      return ApiResponseHandler.badRequest('Address information is required')
    }
    
    // Step 5: Get service details and time slot
    const [serviceResult, slotResult] = await Promise.all([
      supabase
        .from('services')
        .select('id, name, base_price, duration_minutes')
        .eq('id', bookingData.serviceId)
        .eq('is_active', true)
        .single(),
      
      supabase
        .from('time_slots')
        .select('*')
        .eq('id', bookingData.slotId)
        .eq('is_available', true)
        .single()
    ])
    
    if (serviceResult.error || !serviceResult.data) {
      console.error('Error fetching service:', serviceResult.error)
      return ApiResponseHandler.notFound('Service not found')
    }
    
    if (slotResult.error || !slotResult.data) {
      console.error('Error fetching time slot:', slotResult.error)
      return ApiResponseHandler.notFound('Time slot not available')
    }
    
    const service = serviceResult.data
    const slot = slotResult.data
    
    // Step 6: Calculate pricing
    const basePrice = service.base_price
    const finalPrice = Math.round(basePrice * vehicleSize.price_multiplier * 100) / 100
    
    // Step 7: Create booking
    const bookingReference = `L4D-${Date.now()}-${Math.random().toString(36).substr(2, 6).toUpperCase()}`
    
    const { data: newBooking, error: bookingError } = await supabase
      .from('bookings')
      .insert({
        booking_reference: bookingReference,
        customer_id: userId,
        service_id: bookingData.serviceId,
        vehicle_id: vehicleId,
        address_id: addressId,
        time_slot_id: bookingData.slotId,
        base_price: basePrice,
        vehicle_size_multiplier: vehicleSize.price_multiplier,
        distance_surcharge: 0,
        total_price: finalPrice,
        vehicle_details: {
          make: vehicleData.make,
          model: vehicleData.model,
          year: vehicleData.year,
          color: vehicleData.color,
          registration: vehicleData.registration,
          size_name: vehicleData.size,
          size_multiplier: vehicleSize.price_multiplier,
          notes: vehicleData.notes
        },
        service_address: bookingData.newAddress ? {
          name: userData.name,
          address_line_1: bookingData.newAddress.street,
          city: bookingData.newAddress.city,
          postcode: bookingData.newAddress.zipCode,
          country: 'UK'
        } : null,
        status: 'pending',
        special_instructions: bookingData.specialInstructions,
        scheduled_date: slot.slot_date,
        scheduled_start_time: slot.start_time,
        scheduled_end_time: slot.start_time, // Note: time_slots doesn't have end_time, will need to calculate
        payment_status: 'pending'
      })
      .select('id')
      .single()
    
    if (bookingError || !newBooking) {
      console.error('Error creating booking:', bookingError)
      return ApiResponseHandler.serverError('Failed to create booking')
    }
    
    // Step 8: Create booking service record
    const { error: bookingServiceError } = await supabase
      .from('booking_services')
      .insert({
        booking_id: newBooking.id,
        service_id: bookingData.serviceId,
        service_details: {
          name: service.name,
          short_description: service.short_description || '',
          base_price: service.base_price,
          estimated_duration: service.duration_minutes,
          category_name: 'Detailing' // TODO: Get from service category
        },
        price: finalPrice,
        estimated_duration: service.duration_minutes
      })
    
    if (bookingServiceError) {
      console.error('Error creating booking service:', bookingServiceError)
      // Don't fail the whole transaction for this
    }
    
    // Step 9: Update slot availability (mark as unavailable)
    const { error: slotUpdateError } = await supabase
      .from('time_slots')
      .update({
        is_available: false
      })
      .eq('id', bookingData.slotId)
    
    if (slotUpdateError) {
      console.error('Error updating slot:', slotUpdateError)
      // Don't fail the transaction for this
    }
    
    // Step 10: Create status history
    const { error: historyError } = await supabase
      .from('booking_status_history')
      .insert({
        booking_id: newBooking.id,
        from_status: null,
        to_status: 'pending',
        reason: 'Booking created'
      })
    
    if (historyError) {
      console.error('Error creating status history:', historyError)
      // Don't fail the transaction for this
    }
    
    return ApiResponseHandler.success({
      bookingId: newBooking.id,
      confirmationNumber: bookingReference,
      userId: userId,
      requiresPassword: userData.isNewUser,
      bookingDetails: {
        totalPrice: finalPrice,
        currency: 'GBP'
      }
    })
    
  } catch (error) {
    console.error('Error in manual booking creation:', error)
    return ApiResponseHandler.serverError('Failed to create booking')
  }
}