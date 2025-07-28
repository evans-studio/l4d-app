import { NextRequest, NextResponse } from 'next/server'
import { BookingService } from '@/lib/services/booking'
import { ApiResponseHandler } from '@/lib/api/response'
import { ApiValidation } from '@/lib/api/validation'
import { ApiAuth } from '@/lib/api/auth'
import { z } from 'zod'

const createTimeSlotSchema = z.object({
  slot_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Invalid date format'),
  start_time: z.string().regex(/^\d{2}:\d{2}$/, 'Invalid time format'),
  notes: z.string().optional(),
})

const timeSlotsQuerySchema = z.object({
  date_from: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  date_to: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  available_only: z.enum(['true', 'false']).optional().transform(val => val === 'true'),
})

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const queryParams = Object.fromEntries(searchParams.entries())
    
    const validation = ApiValidation.validateQuery(queryParams, timeSlotsQuerySchema)
    if (!validation.success) {
      return validation.error
    }

    const bookingService = new BookingService()
    
    // If date range provided, get availability calendar
    if (validation.data.date_from && validation.data.date_to) {
      const result = await bookingService.getAvailabilityForDateRange(
        validation.data.date_from,
        validation.data.date_to
      )

      if (!result.success) {
        return ApiResponseHandler.error(
          result.error?.message || 'Failed to fetch availability',
          'FETCH_AVAILABILITY_FAILED'
        )
      }

      return ApiResponseHandler.success(result.data)
    }

    // Otherwise get basic time slots
    const result = await bookingService.getAvailableTimeSlots()

    if (!result.success) {
      return ApiResponseHandler.error(
        result.error?.message || 'Failed to fetch time slots',
        'FETCH_TIME_SLOTS_FAILED'
      )
    }

    let timeSlots = result.data || []

    // Filter to available only if requested
    if (validation.data.available_only) {
      timeSlots = timeSlots.filter((slot: { is_available: boolean }) => slot.is_available)
    }

    return ApiResponseHandler.success(timeSlots, {
      pagination: {
        page: 1,
        limit: timeSlots.length,
        total: timeSlots.length,
        totalPages: 1
      }
    })

  } catch (error) {
    console.error('Get time slots error:', error)
    return ApiResponseHandler.serverError('Failed to fetch time slots')
  }
}

export async function POST(request: NextRequest) {
  try {
    const { auth, error: authError } = await ApiAuth.requireRole(['admin', 'super_admin'])
    if (authError) {
      return authError
    }

    const body = await request.json()
    const validation = await ApiValidation.validateBody(body, createTimeSlotSchema)
    if (!validation.success) {
      return validation.error
    }

    const bookingService = new BookingService()
    const result = await bookingService.createTimeSlot(
      validation.data.slot_date,
      validation.data.start_time,
      auth!.profile.id as string,
      validation.data.notes
    )

    if (!result.success) {
      return ApiResponseHandler.error(
        result.error?.message || 'Failed to create time slot',
        'CREATE_TIME_SLOT_FAILED'
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
    console.error('Create time slot error:', error)
    return ApiResponseHandler.serverError('Failed to create time slot')
  }
}