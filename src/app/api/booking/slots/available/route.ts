import { NextRequest } from 'next/server'
import { ApiResponseHandler } from '@/lib/api/response'
import { createClientFromRequest } from '@/lib/supabase/server'

export async function GET(request: NextRequest) {
  try {
    const supabase = createClientFromRequest(request)
    const { searchParams } = new URL(request.url)
    
    // Parse query parameters
    const date = searchParams.get('date')
    const serviceId = searchParams.get('serviceId')
    const duration = searchParams.get('duration')
    
    // Validate required parameters
    if (!date || !serviceId || !duration) {
      return ApiResponseHandler.badRequest('Missing required parameters: date, serviceId, duration')
    }
    
    // Validate date format (YYYY-MM-DD)
    const dateRegex = /^\d{4}-\d{2}-\d{2}$/
    if (!dateRegex.test(date)) {
      return ApiResponseHandler.badRequest('Invalid date format. Use YYYY-MM-DD')
    }
    
    // Validate duration is a number
    const durationMinutes = parseInt(duration, 10)
    if (isNaN(durationMinutes) || durationMinutes <= 0) {
      return ApiResponseHandler.badRequest('Duration must be a positive number')
    }
    
    // Get available slots for the date
    const { data: availableSlots, error: slotsError } = await supabase
      .from('available_slots')
      .select('*')
      .eq('slot_date', date)
      .eq('is_available', true)
      .order('start_time')
    
    if (slotsError) {
      console.error('Error fetching available slots:', slotsError)
      return ApiResponseHandler.serverError('Failed to fetch available slots')
    }
    
    // Get existing bookings for the date to check conflicts
    const { data: existingBookings, error: bookingsError } = await supabase
      .from('bookings')
      .select('scheduled_start_time, scheduled_end_time, time_slot_id')
      .eq('scheduled_date', date)
      .in('status', ['confirmed', 'in_progress'])
    
    if (bookingsError) {
      console.error('Error fetching existing bookings:', bookingsError)
      return ApiResponseHandler.serverError('Failed to check existing bookings')
    }
    
    // Process slots to check availability considering service duration
    const processedSlots = availableSlots.map(slot => {
      const slotStart = new Date(`${date}T${slot.start_time}`)
      const slotEnd = new Date(`${date}T${slot.end_time}`)
      const serviceEnd = new Date(slotStart.getTime() + durationMinutes * 60000)
      
      // Check if service would fit within the slot
      const fitsInSlot = serviceEnd <= slotEnd
      
      // Check for conflicts with existing bookings
      const hasConflict = existingBookings.some(booking => {
        if (booking.time_slot_id === slot.id) return true
        
        const bookingStart = new Date(`${date}T${booking.scheduled_start_time}`)
        const bookingEnd = new Date(`${date}T${booking.scheduled_end_time}`)
        
        // Check for overlap
        return (slotStart < bookingEnd && serviceEnd > bookingStart)
      })
      
      // Check if slot has reached max bookings
      const currentBookings = existingBookings.filter(b => b.time_slot_id === slot.id).length
      const hasCapacity = currentBookings < slot.max_bookings
      
      return {
        id: slot.id,
        date: date,
        startTime: slot.start_time,
        endTime: slot.end_time,
        isAvailable: fitsInSlot && !hasConflict && hasCapacity && slot.is_available,
        currentBookings,
        maxBookings: slot.max_bookings,
      }
    })
    
    // Filter to only return available slots
    const availableOnly = processedSlots.filter(slot => slot.isAvailable)
    
    return ApiResponseHandler.success({
      slots: availableOnly,
      requestParams: {
        date,
        serviceId,
        duration: durationMinutes,
      }
    })
  } catch (error) {
    console.error('Unexpected error in slots availability:', error)
    return ApiResponseHandler.serverError('An unexpected error occurred')
  }
}