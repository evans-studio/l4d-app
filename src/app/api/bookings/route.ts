import { NextRequest, NextResponse } from 'next/server'
import { BookingService } from '@/lib/services/booking'
import { ApiResponseHandler } from '@/lib/api/response'
import { ApiValidation } from '@/lib/api/validation'
import { ApiAuth } from '@/lib/api/auth'
import { z } from 'zod'

const bookingsQuerySchema = z.object({
  status: z.string().optional(),
  dateFrom: z.string().optional(),
  dateTo: z.string().optional(),
  search: z.string().optional(),
})

const createBookingSchema = z.object({
  services: z.array(z.string().uuid()).min(1, 'At least one service is required'),
  vehicle: z.object({
    size_id: z.string().uuid('Invalid vehicle size ID'),
    make: z.string().min(1, 'Vehicle make is required'),
    model: z.string().min(1, 'Vehicle model is required'),
    year: z.number().optional(),
    color: z.string().optional(),
    license_plate: z.string().optional(),
    notes: z.string().optional(),
  }),
  address: z.object({
    name: z.string().min(1, 'Address name is required'),
    address_line_1: z.string().min(1, 'Address line 1 is required'),
    address_line_2: z.string().optional(),
    city: z.string().min(1, 'City is required'),
    postal_code: z.string().min(1, 'Postal code is required'),
  }),
  scheduled_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Invalid date format'),
  time_slot_id: z.string().uuid('Invalid time slot ID'),
  special_instructions: z.string().optional(),
})

export async function GET(request: NextRequest) {
  try {
    const { auth, error: authError } = await ApiAuth.authenticate(request)
    if (authError) {
      return authError
    }

    const { searchParams } = new URL(request.url)
    const queryParams = Object.fromEntries(searchParams.entries())
    
    const validation = ApiValidation.validateQuery(queryParams, bookingsQuerySchema)
    if (!validation.success) {
      return validation.error
    }

    const bookingService = new BookingService()
    
    // Parse status filter
    const filters: Record<string, unknown> = { ...validation.data }
    if (filters.status && typeof filters.status === 'string') {
      filters.status = filters.status.split(',')
    }
    
    // If not admin, only show user's own bookings
    if (!['admin', 'super_admin'].includes(auth!.profile.role as string)) {
      filters.userId = auth!.profile.id as string
    }

    const result = await bookingService.getBookings(filters)

    if (!result.success) {
      return ApiResponseHandler.error(
        result.error?.message || 'Failed to fetch bookings',
        'FETCH_BOOKINGS_FAILED'
      )
    }

    return ApiResponseHandler.success(result.data, {
      pagination: {
        page: 1,
        limit: result.data?.length || 0,
        total: result.data?.length || 0,
        totalPages: 1
      }
    })

  } catch (error) {
    console.error('Get bookings error:', error)
    return ApiResponseHandler.serverError('Failed to fetch bookings')
  }
}

export async function POST(request: NextRequest) {
  try {
    const { auth, error: authError } = await ApiAuth.authenticate(request)
    if (authError) {
      return authError
    }

    const body = await request.json()
    const validation = await ApiValidation.validateBody(body, createBookingSchema)
    if (!validation.success) {
      return validation.error
    }

    const bookingService = new BookingService()
    
    // Transform postal_code to postcode for the booking service
    const bookingData = {
      ...validation.data,
      address: {
        ...validation.data.address,
        postcode: validation.data.address.postal_code
      }
    }
    
    const result = await bookingService.createBooking(auth!.profile.id as string, bookingData)

    if (!result.success) {
      return ApiResponseHandler.error(
        result.error?.message || 'Failed to create booking',
        'CREATE_BOOKING_FAILED'
      )
    }

    return NextResponse.json({
      success: true,
      data: result.data,
      metadata: {
        timestamp: new Date().toISOString()
      }
    }, { status: 201 })

  } catch (error) {
    console.error('Create booking error:', error)
    return ApiResponseHandler.serverError('Failed to create booking')
  }
}