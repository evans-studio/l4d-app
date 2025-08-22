import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase/direct'
import { BookingFormData } from '@/types/booking'
import { EmailService } from '@/lib/services/email'
import { Database } from '@/lib/db/database.types'
import { calculatePostcodeDistance } from '@/lib/utils/postcode-distance'
import { ApiResponseHandler } from '@/lib/api/response'

// Admin emails that should get admin role
const ADMIN_EMAILS = [
  'zell@love4detailing.com',
  'paul@evans-studio.co.uk'
]

// Generate random password for new users
function generateRandomPassword(): string {
  return Math.random().toString(36).slice(-8) + Math.random().toString(36).slice(-8).toUpperCase()
}

// Generate secure token for password setup
function generatePasswordSetupToken(): string {
  return Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15) + Date.now().toString(36)
}

// Calculate distance surcharge based on distance from business
function calculateDistanceSurcharge(distanceKm: number): number {
  // Convert km to miles for the calculation
  const distanceMiles = distanceKm * 0.621371
  const FREE_RADIUS_MILES = 17.5
  
  if (distanceMiles <= FREE_RADIUS_MILES) return 0
  
  // Beyond free radius, charge per mile
  const excessMiles = distanceMiles - FREE_RADIUS_MILES
  const surcharge = excessMiles * 0.50 // £0.50 per mile
  
  // Apply minimum and maximum limits
  if (surcharge < 5) return 5 // Minimum £5
  if (surcharge > 25) return 25 // Maximum £25
  
  return Math.round(surcharge * 100) / 100
}


export async function POST(request: NextRequest) {
  try {
    const bookingData: BookingFormData = await request.json()

    // Validate required fields
    if (!bookingData.customer.email || !bookingData.customer.firstName || !bookingData.customer.lastName) {
      return ApiResponseHandler.validationError('Customer information is required', { code: 'MISSING_CUSTOMER_INFO' })
    }

    // Validate password for new users (when provided)
    if (bookingData.customer.password) {
      if (bookingData.customer.password.length < 8) {
        return ApiResponseHandler.validationError('Password must be at least 8 characters long', { code: 'INVALID_PASSWORD' })
      }
    }

    if (!bookingData.services || bookingData.services.length === 0) {
      return ApiResponseHandler.validationError('At least one service is required', { code: 'MISSING_SERVICES' })
    }

    // Determine user role
    const userRole = ADMIN_EMAILS.includes(bookingData.customer.email.toLowerCase()) ? 'admin' : 'customer'

    let userId: string
    let vehicleId: string
    let addressId: string
    let isNewCustomer = false
    let passwordSetupToken: string | null = null
    let userPassword: string | null = null

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
      isNewCustomer = true
      passwordSetupToken = generatePasswordSetupToken()
      
      // Create new auth user with provided password or temp password
      userPassword = bookingData.customer.password || generateRandomPassword()
      const needsPasswordSetup = !bookingData.customer.password
      
      const { data: authUser, error: authError } = await supabaseAdmin.auth.admin.createUser({
        email: bookingData.customer.email,
        password: userPassword,
        user_metadata: {
          first_name: bookingData.customer.firstName,
          last_name: bookingData.customer.lastName,
          phone: bookingData.customer.phone,
          role: userRole,
          password_setup_required: needsPasswordSetup,
          password_setup_token: needsPasswordSetup ? passwordSetupToken : null,
          password_setup_expires: needsPasswordSetup ? new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString() : null
        },
        email_confirm: false // Don't auto-confirm, user needs to verify email
      })

      if (authError || !authUser.user) {
        console.error('Auth user creation error:', authError)
        return ApiResponseHandler.serverError('Failed to create user account')
      }

      // Send verification email using Supabase's built-in system
      try {
        const redirectUrl = process.env.NODE_ENV === 'development' 
          ? 'http://localhost:3000/auth/callback?next=/dashboard'
          : `${process.env.NEXT_PUBLIC_APP_URL || 'https://l4d-app.vercel.app'}/auth/callback?next=/dashboard`
        
        // Use Supabase's resend method to send verification email
        const { error: verificationError } = await supabaseAdmin.auth.resend({
          type: 'signup',
          email: bookingData.customer.email,
          options: {
            emailRedirectTo: redirectUrl
          }
        })
        
        if (verificationError) {
          console.error('Failed to send Supabase verification email:', verificationError)
          // Continue anyway - user can resend verification if needed
        } 
      } catch (emailError) {
        console.error('Failed to send Supabase verification email:', emailError)
        // Continue anyway - user can resend verification if needed
      }

      // Check if profile already exists (might be created by triggers)
      const { data: existingProfile } = await supabaseAdmin
        .from('user_profiles')
        .select('id')
        .eq('id', authUser.user.id)
        .single()

      if (existingProfile) {
        // Profile already exists, just use it
        userId = existingProfile.id
      } else {
        // Create user profile
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
          return ApiResponseHandler.serverError(
            `Failed to create user profile: ${profileError?.message || 'Unknown error'}`
          )
        }

        userId = newProfile.id
      }

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

      // Store password setup token in database for security (only if needed)
      if (needsPasswordSetup && passwordSetupToken) {
        await supabaseAdmin
          .from('password_reset_tokens')
          .insert({
            user_id: authUser.user.id,
            token_hash: passwordSetupToken, // In production, this should be hashed
            expires_at: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
            created_at: new Date().toISOString()
          })
      }
    }

    // Step 2: Map vehicle size for pricing
    // Now using direct size mapping instead of database lookup
    const sizeMapping: Record<string, { name: string, multiplier: number }> = {
      'S': { name: 'Small', multiplier: 1.0 },
      'M': { name: 'Medium', multiplier: 1.2 },
      'L': { name: 'Large', multiplier: 1.4 },
      'XL': { name: 'Extra Large', multiplier: 1.6 }
    }
    
    const vehicleSizeInfo = sizeMapping[bookingData.vehicle.vehicleSize]
    if (!vehicleSizeInfo) {
      console.error('Invalid vehicle size:', bookingData.vehicle.vehicleSize)
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
    const distanceResult = await calculatePostcodeDistance(bookingData.address.postalCode)
    const distanceKm = distanceResult.distanceKm
    
    // Convert country name to 2-letter code if needed
    const getCountryCode = (countryName: string): string => {
      const countryMap: Record<string, string> = {
        'United Kingdom': 'GB',
        'United States': 'US',
        'Ireland': 'IE',
        'France': 'FR',
        'Germany': 'DE',
        'Spain': 'ES',
        'Italy': 'IT',
        'Netherlands': 'NL'
      }
      return countryMap[countryName] || 'GB' // Default to GB
    }

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
          country: getCountryCode(bookingData.address.country || 'United Kingdom'),
          latitude: null, // Will be populated by postcode API in production
          longitude: null,
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
          country: getCountryCode(bookingData.address.country || 'United Kingdom'),
          latitude: null, // Will be populated by postcode API in production
          longitude: null,
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
        console.error('Address data attempted:', {
          user_id: userId,
          address_line_1: bookingData.address.addressLine1,
          address_line_2: bookingData.address.addressLine2,
          city: bookingData.address.city,
          postal_code: bookingData.address.postalCode,
          county: bookingData.address.county,
          country: bookingData.address.country,
          latitude: null, // Will be populated by postcode API in production
          longitude: null,
          distance_from_business: distanceKm
        })
        return NextResponse.json({
          success: false,
          error: { 
            message: `Failed to create address: ${addressError?.message || 'Unknown error'}`, 
            code: 'ADDRESS_CREATION_FAILED',
            details: addressError
          }
        }, { status: 500 })
      }

      addressId = newAddress.id
    }

    // Step 5: Get service details with category and pricing
    const { data: service, error: serviceError } = await supabaseAdmin
      .from('services')
      .select(`
        id, name, duration_minutes
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
    
    // Get service pricing for the specific size
    const { data: servicePricing, error: pricingError } = await supabaseAdmin
      .from('service_pricing')
      .select('small, medium, large, extra_large')
      .eq('service_id', service.id)
      .single()
    
    if (pricingError || !servicePricing) {
      console.error('Service pricing error:', pricingError)
      return NextResponse.json({
        success: false,
        error: { message: 'Service pricing not found', code: 'PRICING_NOT_FOUND' }
      }, { status: 400 })
    }

    // Step 6: Calculate comprehensive pricing
    // Get the price for the specific vehicle size from service_pricing
    const sizePriceMap: Record<string, keyof typeof servicePricing> = {
      'S': 'small',
      'M': 'medium',
      'L': 'large',
      'XL': 'extra_large'
    }
    
    const priceColumn = sizePriceMap[bookingData.vehicle.vehicleSize]
    if (!priceColumn) {
      console.error('Invalid vehicle size for pricing:', bookingData.vehicle.vehicleSize)
      return NextResponse.json({
        success: false,
        error: { message: 'Invalid vehicle size for pricing', code: 'INVALID_SIZE_PRICING' }
      }, { status: 400 })
    }
    
    const servicePrice = servicePricing[priceColumn] as number
    
    if (servicePrice === null || servicePrice === undefined) {
      console.error('No price found for service and vehicle size:', { serviceId: service.id, vehicleSize: bookingData.vehicle.vehicleSize })
      return NextResponse.json({
        success: false,
        error: { message: 'Service pricing not configured for this vehicle size', code: 'PRICING_NOT_CONFIGURED' }
      }, { status: 400 })
    }
    
    const distanceSurcharge = calculateDistanceSurcharge(distanceKm)
    const totalPrice = servicePrice + distanceSurcharge

    const pricingBreakdown = {
      basePrice: servicePrice, // Using the actual service price for this vehicle size
      vehicleSize: vehicleSizeInfo.name,
      sizeMultiplier: vehicleSizeInfo.multiplier,
      servicePrice: servicePrice,
      subtotal: servicePrice,
      distanceKm: distanceKm,
      distanceSurcharge: distanceSurcharge,
      totalPrice: totalPrice,
      calculation: `£${servicePrice} + £${distanceSurcharge} = £${totalPrice}`
    }

    // Guard: Ensure requested time slot is still available before creating booking
    if (bookingData.timeSlot?.slotId) {
      const { data: slotCheck, error: slotCheckError } = await supabaseAdmin
        .from('time_slots')
        .select('id, is_available, slot_date, start_time')
        .eq('id', bookingData.timeSlot.slotId)
        .single()
      if (slotCheckError || !slotCheck) {
        return ApiResponseHandler.notFound('Selected time slot not found')
      }
      const slotDateTime = new Date(`${slotCheck.slot_date}T${slotCheck.start_time}`)
      if (slotDateTime <= new Date()) {
        return ApiResponseHandler.badRequest('Cannot book time slots in the past')
      }
      if (!slotCheck.is_available) {
        return ApiResponseHandler.conflict('Selected time slot is no longer available')
      }
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
        base_price: servicePrice, // Size-specific price from service_pricing table
        distance_surcharge: distanceSurcharge,
        total_price: totalPrice,
        pricing_breakdown: pricingBreakdown,
        distance_km: distanceKm,
        
        // Scheduling
        scheduled_date: bookingData.timeSlot.date,
        scheduled_start_time: bookingData.timeSlot.startTime,
        scheduled_end_time: (() => {
          // Calculate end time based on start time + service duration
          const timeParts = bookingData.timeSlot.startTime.split(':')
          const hours = parseInt(timeParts[0] || '0', 10)
          const minutes = parseInt(timeParts[1] || '0', 10)
          const startDate = new Date()
          startDate.setHours(hours, minutes, 0, 0)
          
          // Add service duration in minutes
          const endDate = new Date(startDate.getTime() + service.duration_minutes * 60 * 1000)
          
          // Format as HH:MM
          const endHours = endDate.getHours().toString().padStart(2, '0')
          const endMinutes = endDate.getMinutes().toString().padStart(2, '0')
          return `${endHours}:${endMinutes}`
        })(),
        estimated_duration: service.duration_minutes,
        
        // Status - Start as pending until payment is received
        status: 'pending' as Database["public"]["Enums"]["booking_status"],
        payment_status: 'pending',
        payment_deadline: new Date(Date.now() + 48 * 60 * 60 * 1000).toISOString(), // 48 hours from now
        
        // Notes
        special_instructions: bookingData.specialRequests,
        
        // Store vehicle and address details as JSON for snapshot
        vehicle_details: {
          make: bookingData.vehicle.make,
          model: bookingData.vehicle.model,
          year: bookingData.vehicle.year,
          color: bookingData.vehicle.color,
          registration: bookingData.vehicle.licenseNumber,
          size: vehicleSizeInfo.name
        },
        service_address: {
          address_line_1: bookingData.address.addressLine1,
          address_line_2: bookingData.address.addressLine2,
          city: bookingData.address.city,
          postal_code: bookingData.address.postalCode,
          county: bookingData.address.county,
          country: getCountryCode(bookingData.address.country || 'United Kingdom')
        },
        
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
          category: 'General',
          originalBasePrice: servicePrice, // Using the actual service price
          appliedPrice: servicePrice
        },
        price: servicePrice,
        estimated_duration: service.duration_minutes,
        created_at: new Date().toISOString()
      })

    // Step 9: Update time slot availability (if slot ID provided) with race protection
    if (bookingData.timeSlot.slotId) {
      const { data: updatedSlot, error: updateError } = await supabaseAdmin
        .from('time_slots')
        .update({ 
          is_available: false,
          booking_reference: bookingReference
        })
        .eq('id', bookingData.timeSlot.slotId)
        .eq('is_available', true)
        .select('id')
        .single()

      if (updateError || !updatedSlot) {
        // If we failed to reserve the slot, cancel the booking to avoid orphaned pending bookings
        try {
          await supabaseAdmin
            .from('bookings')
            .update({ status: 'cancelled', updated_at: new Date().toISOString(), admin_notes: 'Auto-cancelled due to slot race condition' })
            .eq('id', newBooking.id)
        } catch {}
        return ApiResponseHandler.conflict('Selected time slot was just booked by another user')
      }
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

    // Step 11: Send email notifications
    const emailService = new EmailService()
    
    // Check user notification settings
    const { data: notificationSettings } = await supabaseAdmin
      .from('user_notification_settings')
      .select('email_bookings')
      .eq('user_id', userId)
      .single()
    
    // Create booking object for email template (used for both customer and admin emails)
    const bookingForEmail = {
        booking_reference: bookingReference,
        scheduled_date: bookingData.timeSlot.date,
        scheduled_start_time: bookingData.timeSlot.startTime,
        status: 'pending' as Database["public"]["Enums"]["booking_status"],
        total_price: totalPrice,
        base_price: servicePrice,
        distance_surcharge: distanceSurcharge,
        distance_km: distanceKm,
        estimated_duration: service.duration_minutes,
        special_instructions: bookingData.specialRequests,
        vehicle_details: {
          make: bookingData.vehicle.make,
          model: bookingData.vehicle.model,
          year: bookingData.vehicle.year,
          color: bookingData.vehicle.color,
          registration: bookingData.vehicle.licenseNumber
        },
        service_address: {
          address_line_1: bookingData.address.addressLine1,
          address_line_2: bookingData.address.addressLine2,
          city: bookingData.address.city,
          postcode: bookingData.address.postalCode
        }
      }
    
    // Send customer email (differentiate between new user welcome vs existing user confirmation)
    const shouldSendCustomerEmail = notificationSettings?.email_bookings !== false // Default to true if no settings
    if (shouldSendCustomerEmail) {
      const customerName = `${bookingData.customer.firstName} ${bookingData.customer.lastName}`
      const needsVerification = isNewCustomer && !bookingData.customer.password
      
      try {
        if (isNewCustomer) {
          console.log('📧 Sending welcome booking email to new user:', bookingData.customer.email)
          // Send welcome email for new customers with verification reminder
          const customerEmailResult = await emailService.sendWelcomeBookingConfirmation(
            bookingData.customer.email,
            customerName,
            bookingForEmail as any,
            needsVerification // Pass whether they need to verify email
          )
          
          if (!customerEmailResult.success) {
            console.error('Failed to send welcome booking email:', customerEmailResult.error)
          }
        } else {
          console.log('📧 Sending standard booking confirmation to existing user:', bookingData.customer.email)
          // Send standard booking confirmation for existing customers
          const customerEmailResult = await emailService.sendBookingConfirmation(
            bookingData.customer.email,
            customerName,
            bookingForEmail as any
          )
          
          if (!customerEmailResult.success) {
            console.error('Failed to send standard booking confirmation:', customerEmailResult.error)
          }
        }
      } catch (emailError) {
        console.error('Error sending customer email:', emailError)
      }
    }
    
    // Send admin notification email
    try {
      const adminEmailResult = await emailService.sendAdminBookingNotification(
        bookingForEmail as any,
        bookingData.customer.email,
        `${bookingData.customer.firstName} ${bookingData.customer.lastName}`
      )
      
      if (!adminEmailResult.success) {
        console.error('Failed to send admin notification email:', adminEmailResult.error)
      }
    } catch (emailError) {
      console.error('Error sending admin notification email:', emailError)
    }

    // Note: Password setup will be handled via modal/page flow instead of email
    // The frontend will detect requiresPasswordSetup: true and show setup modal

    const hasPassword = isNewCustomer && bookingData.customer.password
    const needsVerificationForResponse = isNewCustomer && !bookingData.customer.password
    
    return ApiResponseHandler.success({
      bookingId: newBooking.id,
      bookingReference,
      customerId: userId,
      totalPrice: totalPrice,
      pricingBreakdown: pricingBreakdown,
      message: isNewCustomer 
        ? (hasPassword 
            ? 'Account created and booking confirmed! You can now log in with your credentials.'
            : 'Booking confirmed! Please check your email to verify your account and set up your password.')
        : 'Booking created successfully',
      redirectTo: isNewCustomer 
        ? (hasPassword 
            ? `/booking/success?ref=${bookingReference}&new=true&ready=true`
            : `/booking/success?ref=${bookingReference}&verify=true&new=true`)
        : `/booking/success?ref=${bookingReference}`,
      isNewCustomer: isNewCustomer,
      accountReady: hasPassword, // New field to indicate account is ready to use
      requiresEmailVerification: needsVerificationForResponse,
      requiresPasswordSetup: needsVerificationForResponse && passwordSetupToken !== null,
      passwordSetupToken: needsVerificationForResponse ? passwordSetupToken : null
    })

  } catch (error) {
    console.error('Booking creation error:', error)
    return ApiResponseHandler.serverError('Internal server error')
  }
}