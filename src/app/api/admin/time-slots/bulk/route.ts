import { NextRequest, NextResponse } from 'next/server'
import { ApiAuth } from '@/lib/api/auth'
import { ApiResponseHandler } from '@/lib/api/response'
import { BookingService } from '@/lib/services/booking'
import { z } from 'zod'

const bulkTimeSlotSchema = z.object({
  start_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  end_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  days_of_week: z.array(z.string().regex(/^[0-6]$/)).min(1),
  time_slots: z.array(z.object({
    start_time: z.string().regex(/^\d{2}:\d{2}$/),
    duration_minutes: z.number().min(30).max(480)
  })).min(1),
  exclude_dates: z.array(z.string().regex(/^\d{4}-\d{2}-\d{2}$/)).optional()
})

export async function POST(request: NextRequest) {
  try {
    const { auth, error: authError } = await ApiAuth.authenticate(request)
    if (authError) return authError

    // Check admin permissions
    if (auth!.profile.role !== 'admin' && auth!.profile.role !== 'super_admin') {
      return ApiResponseHandler.forbidden('Admin access required')
    }

    const body = await request.json()
    const validatedData = bulkTimeSlotSchema.parse(body)

    const bookingService = new BookingService()
    
    // Generate dates based on criteria
    const dates = generateDatesInRange(
      validatedData.start_date,
      validatedData.end_date,
      validatedData.days_of_week,
      validatedData.exclude_dates || []
    )

    // Create all time slots
    const slotsToCreate = []
    for (const date of dates) {
      for (const timeSlot of validatedData.time_slots) {
        slotsToCreate.push({
          slot_date: date,
          start_time: timeSlot.start_time,
          duration_minutes: timeSlot.duration_minutes,
          is_available: true,
          created_by: auth!.user.id
        })
      }
    }

    // Batch create slots
    const result = await bookingService.createTimeSlotsBulk(slotsToCreate)
    
    if (!result.success) {
      return ApiResponseHandler.error(result.error?.message || 'Failed to create time slots')
    }

    return ApiResponseHandler.success({
      created_slots: result.data?.length || 0,
      dates_covered: dates.length,
      message: `Successfully created ${result.data?.length || 0} time slots across ${dates.length} dates`
    })

  } catch (error) {
    if (error instanceof z.ZodError) {
      return ApiResponseHandler.badRequest('Invalid request data', error.issues)
    }
    
    console.error('Bulk time slot creation error:', error)
    return ApiResponseHandler.serverError('Failed to create time slots')
  }
}

function generateDatesInRange(
  startDate: string,
  endDate: string,
  daysOfWeek: string[],
  excludeDates: string[]
): string[] {
  const dates: string[] = []
  const start = new Date(startDate)
  const end = new Date(endDate)
  
  // Convert days of week to numbers (0 = Sunday, 1 = Monday, etc.)
  const targetDays = daysOfWeek.map(d => parseInt(d))
  
  for (let current = new Date(start); current <= end; current.setDate(current.getDate() + 1)) {
    const dayOfWeek = current.getDay()
    const dateStr = current.toISOString().split('T')[0]
    
    if (dateStr && targetDays.includes(dayOfWeek) && !excludeDates.includes(dateStr)) {
      dates.push(dateStr)
    }
  }
  
  return dates
}