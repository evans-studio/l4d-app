/**
 * Utility functions for time slot validation and buffer time handling
 */

export const BOOKING_BUFFER_MINUTES = 30 // Minimum notice period for bookings

/**
 * Check if a time slot is in the past with optional buffer time
 */
export function isTimeSlotPast(
  slotDate: string, 
  slotTime: string, 
  bufferMinutes: number = 0
): boolean {
  const now = new Date()
  const slotDateTime = new Date(`${slotDate}T${slotTime}`)
  
  // Add buffer time to current time
  const bufferTime = bufferMinutes * 60 * 1000 // Convert to milliseconds
  return slotDateTime.getTime() < (now.getTime() + bufferTime)
}

/**
 * Get the minimum bookable time (current time + buffer)
 */
export function getMinimumBookableTime(): { date: string; time: string } {
  const now = new Date()
  now.setMinutes(now.getMinutes() + BOOKING_BUFFER_MINUTES)
  
  return {
    date: now.toISOString().split('T')[0] || now.toISOString().substring(0, 10),
    time: now.toTimeString().slice(0, 5) // HH:MM format
  }
}

/**
 * Format time string to 24-hour format (HH:MM)
 */
export function formatTimeString(timeStr: string): string {
  const [hours, minutes] = timeStr.split(':')
  return `${(hours || '00').padStart(2, '0')}:${(minutes || '00').padStart(2, '0')}`
}

/**
 * Compare if a datetime is after the minimum bookable time
 */
export function isAfterMinimumBookableTime(date: string, time: string): boolean {
  const minimum = getMinimumBookableTime()
  
  // If date is after minimum date, it's definitely bookable
  if (date > minimum.date) return true
  
  // If date is before minimum date, it's not bookable
  if (date < minimum.date) return false
  
  // Same date, compare times
  return time >= minimum.time
}

/**
 * Get a SQL-friendly filter for excluding past time slots
 */
export function getPastSlotFilter(bufferMinutes: number = 0) {
  const now = new Date()
  now.setMinutes(now.getMinutes() + bufferMinutes)
  
  const currentDate = now.toISOString().split('T')[0]
  const currentTime = now.toTimeString().slice(0, 5)
  
  return {
    date: currentDate,
    time: currentTime,
    filterString: `slot_date.gt.${currentDate},and(slot_date.eq.${currentDate},start_time.gt.${currentTime})`
  }
}