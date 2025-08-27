import { NextRequest, NextResponse } from 'next/server'
import { ApiAuth } from '@/lib/api/auth'
import { ApiResponseHandler } from '@/lib/api/response'
import { z } from 'zod'
import { logger } from '@/lib/utils/logger'

const previewSchema = z.object({
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
    const authResult = await ApiAuth.authenticateAdmin(request)
    if (!authResult.success) return authResult.error

    const body = await request.json()
    const validatedData = previewSchema.parse(body)

    // Generate dates based on criteria
    const dates = generateDatesInRange(
      validatedData.start_date,
      validatedData.end_date,
      validatedData.days_of_week,
      validatedData.exclude_dates || []
    )

    const totalSlots = dates.length * validatedData.time_slots.length
    
    // Group dates by month for better preview
    const datesByMonth = dates.reduce((acc, date) => {
      const month = new Date(date).toLocaleDateString('en-GB', { 
        year: 'numeric', 
        month: 'long' 
      })
      if (!acc[month]) acc[month] = []
      acc[month].push(date)
      return acc
    }, {} as Record<string, string[]>)

    return ApiResponseHandler.success({
      total_slots: totalSlots,
      total_dates: dates.length,
      dates,
      dates_by_month: datesByMonth,
      slots_per_day: validatedData.time_slots.length,
      preview_slots: validatedData.time_slots.map(slot => ({
        start_time: slot.start_time,
        end_time: calculateEndTime(slot.start_time, slot.duration_minutes),
        duration_minutes: slot.duration_minutes
      }))
    })

  } catch (error) {
    if (error instanceof z.ZodError) {
      return ApiResponseHandler.badRequest('Invalid request data', error.issues)
    }
    
    logger.error('Schedule preview error:', error instanceof Error ? error : undefined)
    return ApiResponseHandler.serverError('Failed to generate preview')
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

function calculateEndTime(startTime: string, durationMinutes: number): string {
  const [hours, minutes] = startTime.split(':').map(Number)
  const startDate = new Date()
  startDate.setHours(hours || 0, minutes || 0, 0, 0)
  
  const endDate = new Date(startDate.getTime() + durationMinutes * 60000)
  
  return endDate.toTimeString().slice(0, 5)
}