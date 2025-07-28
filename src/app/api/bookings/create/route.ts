import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { cookies } from 'next/headers'
import { BookingService } from '@/lib/services/booking'
import { EmailService } from '@/lib/services/email'
import { CreateBookingRequest } from '@/lib/utils/booking-types'
import { getUserProfile, getDisplayName } from '@/lib/utils/user-helpers'

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function POST(request: NextRequest) {
  try {
    const cookieStore = await cookies()
    const allCookies = cookieStore.getAll()
    
    // Check for authentication
    const accessToken = allCookies.find(c => c.name.includes('access_token'))?.value
    if (!accessToken) {
      return NextResponse.json(
        { success: false, error: { message: 'Authentication required' } },
        { status: 401 }
      )
    }

    // Get user from token
    const { data: { user }, error: userError } = await supabaseAdmin.auth.getUser(accessToken)
    if (userError || !user) {
      return NextResponse.json(
        { success: false, error: { message: 'Invalid authentication' } },
        { status: 401 }
      )
    }

    // Parse request body
    const body = await request.json()
    
    // Validate required fields
    const requiredFields = ['services', 'vehicle', 'address', 'scheduled_date', 'time_slot_id']
    for (const field of requiredFields) {
      if (!body[field]) {
        return NextResponse.json(
          { success: false, error: { message: `Missing required field: ${field}` } },
          { status: 400 }
        )
      }
    }

    // Validate services array
    if (!Array.isArray(body.services) || body.services.length === 0) {
      return NextResponse.json(
        { success: false, error: { message: 'At least one service must be selected' } },
        { status: 400 }
      )
    }

    // Validate vehicle data
    if (!body.vehicle.size_id || !body.vehicle.make || !body.vehicle.model) {
      return NextResponse.json(
        { success: false, error: { message: 'Vehicle make, model, and size are required' } },
        { status: 400 }
      )
    }

    // Validate address data
    if (!body.address.address_line_1 || !body.address.city || !body.address.postcode) {
      return NextResponse.json(
        { success: false, error: { message: 'Address line 1, city, and postcode are required' } },
        { status: 400 }
      )
    }

    // Validate time slot ID format
    if (!/^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/.test(body.time_slot_id)) {
      return NextResponse.json(
        { success: false, error: { message: 'Invalid time slot ID format' } },
        { status: 400 }
      )
    }

    // Create booking request object
    const bookingRequest: CreateBookingRequest = {
      services: body.services,
      vehicle: {
        size_id: body.vehicle.size_id,
        make: body.vehicle.make,
        model: body.vehicle.model,
        year: body.vehicle.year,
        color: body.vehicle.color,
        registration: body.vehicle.registration,
        notes: body.vehicle.notes
      },
      address: {
        name: body.address.name || 'Service Address',
        address_line_1: body.address.address_line_1,
        address_line_2: body.address.address_line_2,
        city: body.address.city,
        postcode: body.address.postcode
      },
      scheduled_date: body.scheduled_date,
      time_slot_id: body.time_slot_id,
      customer_notes: body.customer_notes
    }

    // Create booking using service
    const bookingService = new BookingService()
    const result = await bookingService.createBooking(user.id, bookingRequest)

    if (!result.success) {
      return NextResponse.json(
        { success: false, error: { message: result.error?.message || 'Failed to create booking' } },
        { status: 400 }
      )
    }

    // Send email notifications (don't fail the booking if emails fail)
    if (result.data) {
      const emailService = new EmailService()
      
      // Get user profile for personalized emails
      const userProfile = await getUserProfile(user.id)
      if (userProfile) {
        const customerName = getDisplayName(userProfile)
        
        // Send customer confirmation email
        try {
          await emailService.sendBookingConfirmation(
            userProfile.email,
            customerName,
            result.data
          )
          console.log('Customer confirmation email sent successfully')
        } catch (emailError) {
          console.error('Failed to send customer confirmation email:', emailError)
          // Don't fail the booking creation for email errors
        }
        
        // Send admin notification email
        try {
          await emailService.sendAdminBookingNotification(
            result.data,
            userProfile.email,
            customerName
          )
          console.log('Admin notification email sent successfully')
        } catch (emailError) {
          console.error('Failed to send admin notification email:', emailError)
          // Don't fail the booking creation for email errors
        }
      }
    }

    // Return success response with booking data
    return NextResponse.json({
      success: true,
      data: {
        booking: result.data,
        message: 'Booking created successfully'
      },
      metadata: {
        booking_reference: result.data?.booking_reference,
        scheduled_date: result.data?.scheduled_date,
        scheduled_time: result.data?.scheduled_start_time,
        total_price: result.data?.total_price,
        status: result.data?.status
      }
    })

  } catch (error) {
    console.error('Create booking error:', error)
    return NextResponse.json(
      { success: false, error: { message: 'Internal server error' } },
      { status: 500 }
    )
  }
}