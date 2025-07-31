import { NextRequest } from 'next/server'
import { createClientFromRequest } from '@/lib/supabase/server'
import { ApiResponseHandler } from '@/lib/api/response'

// Helper function to calculate end time
function calculateEndTime(startTime: string, durationMinutes: number): string {
  const [hoursStr, minutesStr] = startTime.split(':')
  const hours = parseInt(hoursStr || '0', 10)
  const minutes = parseInt(minutesStr || '0', 10)
  
  const startDate = new Date()
  startDate.setHours(hours, minutes, 0, 0)
  
  const endDate = new Date(startDate.getTime() + durationMinutes * 60000)
  return `${endDate.getHours().toString().padStart(2, '0')}:${endDate.getMinutes().toString().padStart(2, '0')}`
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = createClientFromRequest(request)
    
    // Get current session
    const { data: { session }, error: sessionError } = await supabase.auth.getSession()
    
    if (sessionError || !session?.user) {
      return ApiResponseHandler.unauthorized('Authentication required')
    }

    const { id: bookingId } = await params

    // Get the current booking to check ownership and get service details
    const { data: booking, error: bookingError } = await supabase
      .from('bookings')
      .select(`
        *,
        service:services(*)
      `)
      .eq('id', bookingId)
      .single()

    if (bookingError || !booking) {
      return ApiResponseHandler.notFound('Booking not found')
    }

    // Check if user owns this booking
    if (booking.customer_id !== session.user.id) {
      return ApiResponseHandler.unauthorized('Not authorized to reschedule this booking')
    }

    // Check if booking can be rescheduled (not completed or cancelled)
    if (['completed', 'cancelled'].includes(booking.status)) {
      return ApiResponseHandler.error(
        'This booking cannot be rescheduled',
        'BOOKING_NOT_RESCHEDULABLE',
        400
      )
    }

    // Get available time slots from 24 hours from now onwards
    const minDate = new Date()
    minDate.setHours(minDate.getHours() + 24) // 24 hour minimum notice

    const maxDate = new Date()
    maxDate.setDate(maxDate.getDate() + 90) // 90 days maximum advance

    // Get all available time slots - use correct field names from database schema
    const { data: availableSlots, error: slotsError } = await supabase
      .from('time_slots')
      .select('id, slot_date, start_time, is_available')
      .eq('is_available', true)
      .gte('slot_date', minDate.toISOString().split('T')[0])
      .lte('slot_date', maxDate.toISOString().split('T')[0])
      .order('slot_date', { ascending: true })
      .order('start_time', { ascending: true })

    if (slotsError) {
      console.error('Error fetching available slots:', slotsError)
      return ApiResponseHandler.serverError('Failed to fetch available slots')
    }

    // Group slots by date for better UI presentation
    const slotsByDate: Record<string, any[]> = {}
    
    if (availableSlots) {
      availableSlots.forEach(slot => {
        const date = slot.slot_date
        if (!slotsByDate[date]) {
          slotsByDate[date] = []
        }
        // Transform slot to match expected format
        slotsByDate[date]?.push({
          id: slot.id,
          date: slot.slot_date,
          start_time: slot.start_time,
          end_time: calculateEndTime(slot.start_time, booking.service?.duration_minutes || 120),
          duration_minutes: booking.service?.duration_minutes || 120,
          is_available: slot.is_available
        })
      })
    }

    return ApiResponseHandler.success({
      booking: {
        id: booking.id,
        currentDate: booking.scheduled_date,
        currentTime: booking.scheduled_start_time,
        serviceName: booking.service?.name,
        serviceDuration: booking.service?.duration_minutes || 120
      },
      availableSlots: slotsByDate,
      restrictions: {
        minimumNoticeHours: 24,
        maximumAdvanceDays: 90
      }
    })

  } catch (error) {
    console.error('Available slots error:', error)
    return ApiResponseHandler.serverError('Failed to fetch available slots')
  }
}