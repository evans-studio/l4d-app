import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase/direct'
import { BookingFormData, ApiResponse } from '@/types/booking'

// Admin emails that should get admin role
const ADMIN_EMAILS = [
  'zell@love4detailing.com',
  'paul@evans-studio.co.uk'
]

// Generate random password for new users
function generateRandomPassword(): string {
  return Math.random().toString(36).slice(-8) + Math.random().toString(36).slice(-8).toUpperCase()
}

// Calculate distance surcharge based on distance from business
function calculateDistanceSurcharge(distanceKm: number): number {
  if (distanceKm <= 10) return 0
  if (distanceKm <= 20) return 5
  if (distanceKm <= 30) return 10
  return 15
}

// Mock geocoding function - replace with real implementation
async function geocodeAddress(address: any): Promise<{ latitude: number, longitude: number }> {
  // For now, return mock coordinates
  return { latitude: 51.5074, longitude: -0.1278 }
}

// Calculate distance between two points (Haversine formula)
function calculateDistance(point1: { lat: number, lng: number }, point2: { latitude: number, longitude: number }): number {
  const R = 6371 // Earth's radius in km
  const dLat = (point2.latitude - point1.lat) * Math.PI / 180
  const dLon = (point2.longitude - point1.lng) * Math.PI / 180
  const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.cos(point1.lat * Math.PI / 180) * Math.cos(point2.latitude * Math.PI / 180) *
    Math.sin(dLon/2) * Math.sin(dLon/2)
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a))
  return R * c
}

export async function POST(request: NextRequest): Promise<NextResponse<ApiResponse>> {
  try {
    const bookingData: BookingFormData = await request.json()

    // Validate required fields
    if (!bookingData.customer.email || !bookingData.customer.firstName || !bookingData.customer.lastName) {
      return NextResponse.json({
        success: false,
        error: { message: 'Customer information is required', code: 'MISSING_CUSTOMER_INFO' }
      }, { status: 400 })
    }

    if (!bookingData.services || bookingData.services.length === 0) {
      return NextResponse.json({
        success: false,
        error: { message: 'At least one service is required', code: 'MISSING_SERVICES' }
      }, { status: 400 })
    }

    // Determine user role
    const userRole = ADMIN_EMAILS.includes(bookingData.customer.email.toLowerCase()) ? 'admin' : 'customer'

    let userId: string
    let vehicleId: string
    let addressId: string

    // Step 1: Create or get user
    const { data: existingProfile } = await supabaseAdmin
      .from('user_profiles')
      .select('id')
      .eq('email', bookingData.customer.email)
      .single()

    if (existingProfile) {
      userId = existingProfile.id
      
      // Update user profile info
      await supabaseAdmin
        .from('user_profiles')
        .update({
          first_name: bookingData.customer.firstName,
          last_name: bookingData.customer.lastName,
          phone: bookingData.customer.phone,
          updated_at: new Date().toISOString()
        })
        .eq('id', userId)
    } else {
      // Create new auth user first
      const { data: authUser, error: authError } = await supabaseAdmin.auth.admin.createUser({
        email: bookingData.customer.email,
        password: generateRandomPassword(),
        user_metadata: {
          first_name: bookingData.customer.firstName,
          last_name: bookingData.customer.lastName,
          phone: bookingData.customer.phone,
          role: userRole
        },
        email_confirm: true
      })

      if (authError || !authUser.user) {
        console.error('Auth user creation error:', authError)
        return NextResponse.json({
          success: false,
          error: { message: 'Failed to create user account', code: 'AUTH_CREATION_FAILED' }
        }, { status: 500 })
      }

      // Create user profile (database trigger should handle this, but let's be explicit)
      const { data: newProfile, error: profileError } = await supabaseAdmin
        .from('user_profiles')
        .insert({
          id: authUser.user.id, // Same ID as auth.users
          email: bookingData.customer.email,
          first_name: bookingData.customer.firstName,
          last_name: bookingData.customer.lastName,
          phone: bookingData.customer.phone,
          role: userRole,
          is_active: true,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .select('id')
        .single()

      if (profileError || !newProfile) {
        console.error('Profile creation error:', profileError)
        return NextResponse.json({
          success: false,
          error: { message: 'Failed to create user profile', code: 'PROFILE_CREATION_FAILED' }
        }, { status: 500 })
      }

      userId = newProfile.id

      // Create default notification settings
      await supabaseAdmin
        .from('user_notification_settings')
        .insert({
          user_id: authUser.user.id, // FK to auth.users.id
          email_bookings: true,
          email_reminders: true,
          sms_bookings: false,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
    }

    // Step 2: Get vehicle size for pricing
    const { data: vehicleSize, error: vehicleSizeError } = await supabaseAdmin
      .from('vehicle_sizes')
      .select('id, name, price_multiplier')
      .eq('name', bookingData.vehicle.vehicleSize)
      .eq('is_active', true)
      .single()

    if (vehicleSizeError || !vehicleSize) {
      console.error('Vehicle size error:', vehicleSizeError)
      return NextResponse.json({
        success: false,
        error: { message: 'Invalid vehicle size', code: 'INVALID_VEHICLE_SIZE' }
      }, { status: 400 })
    }

    // Step 3: Create or get vehicle (using user_id, not customer_id)
    const { data: existingVehicle } = await supabaseAdmin
      .from('customer_vehicles')
      .select('id')
      .eq('user_id', userId) // Note: user_id, not customer_id
      .eq('make', bookingData.vehicle.make)
      .eq('model', bookingData.vehicle.model)
      .eq('year', bookingData.vehicle.year)
      .single()

    if (existingVehicle) {
      vehicleId = existingVehicle.id
      
      // Update vehicle info
      await supabaseAdmin
        .from('customer_vehicles')
        .update({
          color: bookingData.vehicle.color,
          license_plate: bookingData.vehicle.licenseNumber,
          vehicle_size_id: vehicleSize.id,
          notes: bookingData.vehicle.notes,
          updated_at: new Date().toISOString()
        })
        .eq('id', vehicleId)
    } else {
      // Create new vehicle
      const { data: newVehicle, error: vehicleError } = await supabaseAdmin
        .from('customer_vehicles')
        .insert({
          user_id: userId, // FK to user_profiles.id
          vehicle_size_id: vehicleSize.id, // FK to vehicle_sizes.id
          make: bookingData.vehicle.make,
          model: bookingData.vehicle.model,
          year: bookingData.vehicle.year,
          color: bookingData.vehicle.color,
          license_plate: bookingData.vehicle.licenseNumber,
          notes: bookingData.vehicle.notes,
          is_primary: false,
          is_default: false,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .select('id')
        .single()

      if (vehicleError || !newVehicle) {
        console.error('Vehicle creation error:', vehicleError)
        return NextResponse.json({
          success: false,
          error: { message: 'Failed to create vehicle', code: 'VEHICLE_CREATION_FAILED' }
        }, { status: 500 })
      }

      vehicleId = newVehicle.id
    }

    // Step 4: Create or get address with distance calculation
    const businessLocation = { lat: 51.5074, lng: -0.1278 } // Replace with actual business coordinates
    const customerLocation = await geocodeAddress(bookingData.address)
    const distanceKm = calculateDistance(businessLocation, customerLocation)

    const { data: existingAddress } = await supabaseAdmin
      .from('customer_addresses')
      .select('id')
      .eq('user_id', userId) // Note: user_id, not customer_id
      .eq('address_line_1', bookingData.address.addressLine1)
      .eq('city', bookingData.address.city)
      .eq('postal_code', bookingData.address.postalCode)
      .single()

    if (existingAddress) {
      addressId = existingAddress.id
      
      // Update address info
      await supabaseAdmin
        .from('customer_addresses')
        .update({
          address_line_2: bookingData.address.addressLine2,
          county: bookingData.address.county,
          country: bookingData.address.country,
          latitude: customerLocation.latitude,
          longitude: customerLocation.longitude,
          distance_from_business: distanceKm,
          updated_at: new Date().toISOString()
        })
        .eq('id', addressId)
    } else {
      // Create new address
      const { data: newAddress, error: addressError } = await supabaseAdmin
        .from('customer_addresses')
        .insert({
          user_id: userId, // FK to user_profiles.id
          address_line_1: bookingData.address.addressLine1,
          address_line_2: bookingData.address.addressLine2,
          city: bookingData.address.city,
          postal_code: bookingData.address.postalCode,
          county: bookingData.address.county,
          country: bookingData.address.country,
          latitude: customerLocation.latitude,
          longitude: customerLocation.longitude,
          distance_from_business: distanceKm,
          is_primary: false,
          is_default: false,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .select('id')
        .single()

      if (addressError || !newAddress) {
        console.error('Address creation error:', addressError)
        return NextResponse.json({
          success: false,
          error: { message: 'Failed to create address', code: 'ADDRESS_CREATION_FAILED' }
        }, { status: 500 })
      }

      addressId = newAddress.id
    }

    // Step 5: Get service details with category
    const { data: service, error: serviceError } = await supabaseAdmin
      .from('services')
      .select(`
        id, name, base_price, duration_minutes,
        service_categories!category_id (name)
      `)
      .eq('id', bookingData.services[0]!.serviceId)
      .eq('is_active', true)
      .single()

    if (serviceError || !service) {
      console.error('Service error:', serviceError)
      return NextResponse.json({
        success: false,
        error: { message: 'Invalid service', code: 'INVALID_SERVICE' }
      }, { status: 400 })
    }

    // Step 6: Calculate comprehensive pricing
    const basePrice = service.base_price
    const sizeMultiplier = vehicleSize.price_multiplier
    const distanceSurcharge = calculateDistanceSurcharge(distanceKm)
    const totalPrice = (basePrice * sizeMultiplier) + distanceSurcharge

    const pricingBreakdown = {
      basePrice: basePrice,
      vehicleSize: vehicleSize.name,
      sizeMultiplier: sizeMultiplier,
      subtotal: basePrice * sizeMultiplier,
      distanceKm: distanceKm,
      distanceSurcharge: distanceSurcharge,
      totalPrice: totalPrice,
      calculation: `(£${basePrice} × ${sizeMultiplier}) + £${distanceSurcharge} = £${totalPrice}`
    }

    // Step 7: Create booking record
    const bookingReference = `LFD-${Date.now().toString().slice(-8)}`
    
    const { data: newBooking, error: bookingError } = await supabaseAdmin
      .from('bookings')
      .insert({
        booking_reference: bookingReference,
        customer_id: userId, // FK to user_profiles.id
        vehicle_id: vehicleId, // FK to customer_vehicles.id
        address_id: addressId, // FK to customer_addresses.id
        service_id: service.id, // FK to services.id
        time_slot_id: bookingData.timeSlot.slotId, // FK to time_slots.id
        
        // Pricing breakdown
        base_price: basePrice,
        vehicle_size_multiplier: sizeMultiplier,
        distance_surcharge: distanceSurcharge,
        total_price: totalPrice,
        pricing_breakdown: pricingBreakdown,
        
        // Scheduling
        scheduled_date: bookingData.timeSlot.date,
        scheduled_start_time: bookingData.timeSlot.startTime,
        scheduled_end_time: bookingData.timeSlot.endTime,
        estimated_duration: service.duration_minutes,
        
        // Status
        status: 'pending',
        payment_status: 'pending',
        
        // Notes
        special_instructions: bookingData.specialRequests,
        
        // Timestamps
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .select('id')
      .single()

    if (bookingError || !newBooking) {
      console.error('Booking creation error:', bookingError)
      return NextResponse.json({
        success: false,
        error: { message: 'Failed to create booking', code: 'BOOKING_CREATION_FAILED' }
      }, { status: 500 })
    }

    // Step 8: Create booking service snapshot
    await supabaseAdmin
      .from('booking_services')
      .insert({
        booking_id: newBooking.id,
        service_id: service.id,
        service_details: {
          name: service.name,
          category: service.service_categories?.[0]?.name || 'General',
          originalBasePrice: service.base_price,
          appliedPrice: basePrice * sizeMultiplier
        },
        price: basePrice * sizeMultiplier,
        estimated_duration: service.duration_minutes,
        created_at: new Date().toISOString()
      })

    // Step 9: Update time slot availability (if slot ID provided)
    if (bookingData.timeSlot.slotId) {
      await supabaseAdmin
        .from('time_slots')
        .update({ is_available: false })
        .eq('id', bookingData.timeSlot.slotId)
    }

    // Step 10: Create audit trail
    await supabaseAdmin
      .from('booking_status_history')
      .insert({
        booking_id: newBooking.id,
        from_status: null,
        to_status: 'pending',
        changed_by: userId,
        reason: 'Booking created by customer',
        created_at: new Date().toISOString()
      })

    await supabaseAdmin
      .from('booking_history')
      .insert({
        booking_id: newBooking.id,
        action: 'created',
        details: {
          formData: bookingData,
          pricingBreakdown: pricingBreakdown,
          createdVia: 'customer_booking_form'
        },
        created_by: userId,
        created_at: new Date().toISOString()
      })

    // Step 11: Handle notifications (simplified for now)
    // TODO: Check user_notification_settings and send confirmation email

    return NextResponse.json({
      success: true,
      data: {
        bookingId: newBooking.id,
        bookingReference,
        customerId: userId,
        totalPrice: totalPrice,
        pricingBreakdown: pricingBreakdown,
        message: 'Booking created successfully',
        redirectTo: userRole === 'admin' ? '/admin' : '/dashboard'
      }
    })

  } catch (error) {
    console.error('Booking creation error:', error)
    return NextResponse.json({
      success: false,
      error: { message: 'Internal server error', code: 'SERVER_ERROR' }
    }, { status: 500 })
  }
}