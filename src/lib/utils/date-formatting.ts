/**
 * Safe date formatting utilities for booking system
 * Handles timezone-safe date parsing and consistent formatting
 */

import { format, parseISO } from 'date-fns'

/**
 * Safely format a date string to avoid timezone issues
 * Treats date strings as local dates, not UTC
 */
export function formatDate(dateString: string | null | undefined): string {
  if (!dateString) return 'Date not available'
  
  try {
    // For ISO date strings like "2024-01-15", parse directly
    if (dateString.match(/^\d{4}-\d{2}-\d{2}$/)) {
      const date = parseISO(dateString)
      return format(date, 'EEEE, MMMM d, yyyy')
    }
    
    // For other formats, try parsing normally
    const date = new Date(dateString)
    if (isNaN(date.getTime())) {
      return 'Invalid date'
    }
    
    return format(date, 'EEEE, MMMM d, yyyy')
  } catch (error) {
    console.warn('Date formatting error:', error, 'for date:', dateString)
    return 'Invalid date'
  }
}

/**
 * Safely format a time string (HH:mm format)
 * Returns formatted time with AM/PM or fallback message
 */
export function formatTime(timeString: string | null | undefined): string {
  if (!timeString) return 'Time not available'
  
  try {
    // Handle HH:mm format (24-hour)
    const timeMatch = timeString.match(/^(\d{1,2}):(\d{2})/)
    if (timeMatch) {
      const hours = parseInt(timeMatch[1] || '0', 10)
      const minutes = parseInt(timeMatch[2] || '0', 10)
      
      if (hours >= 0 && hours <= 23 && minutes >= 0 && minutes <= 59) {
        const ampm = hours >= 12 ? 'PM' : 'AM'
        const displayHour = hours % 12 || 12
        return `${displayHour}:${minutes.toString().padStart(2, '0')} ${ampm}`
      }
    }
    
    // Fallback: try parsing as full datetime and extract time
    const date = new Date(`2000-01-01T${timeString}`)
    if (!isNaN(date.getTime())) {
      return format(date, 'h:mm a')
    }
    
    return 'Invalid time'
  } catch (error) {
    console.warn('Time formatting error:', error, 'for time:', timeString)
    return 'Invalid time'
  }
}

/**
 * Format date for email templates with safe parsing
 * Uses British date format
 */
export function formatDateForEmail(dateString: string | null | undefined): string {
  if (!dateString) return 'Date not available'
  
  try {
    // For ISO date strings like "2024-01-15", parse directly
    if (dateString.match(/^\d{4}-\d{2}-\d{2}$/)) {
      const date = parseISO(dateString)
      return date.toLocaleDateString('en-GB', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      })
    }
    
    // For other formats, try parsing normally but be careful about timezone
    const date = new Date(dateString)
    if (isNaN(date.getTime())) {
      return 'Invalid date'
    }
    
    return date.toLocaleDateString('en-GB', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    })
  } catch (error) {
    console.warn('Email date formatting error:', error, 'for date:', dateString)
    return 'Invalid date'
  }
}

/**
 * Format time for email templates with safe parsing
 */
export function formatTimeForEmail(timeString: string | null | undefined): string {
  if (!timeString) return 'Time not available'
  
  try {
    // Handle HH:mm format (24-hour)
    const timeMatch = timeString.match(/^(\d{1,2}):(\d{2})/)
    if (timeMatch) {
      const hours = parseInt(timeMatch[1] || '0', 10)
      const minutes = parseInt(timeMatch[2] || '0', 10)
      
      if (hours >= 0 && hours <= 23 && minutes >= 0 && minutes <= 59) {
        const ampm = hours >= 12 ? 'PM' : 'AM'
        const displayHour = hours % 12 || 12
        return `${displayHour}:${minutes.toString().padStart(2, '0')} ${ampm}`
      }
    }
    
    return 'Invalid time'
  } catch (error) {
    console.warn('Email time formatting error:', error, 'for time:', timeString)
    return 'Invalid time'
  }
}

/**
 * Get a time slot's start_time from the database row
 * Handles both string and object formats
 */
export function getSlotStartTime(slot: any): string {
  if (!slot) return ''
  
  // If slot has start_time property (from database)
  if (slot.start_time) return slot.start_time
  
  // If slot has startTime property (from form data)
  if (slot.startTime) return slot.startTime
  
  return ''
}

/**
 * Calculate end time from start time and duration
 */
export function calculateEndTime(startTime: string, durationMinutes: number): string {
  try {
    const timeMatch = startTime.match(/^(\d{1,2}):(\d{2})/)
    if (!timeMatch) return startTime
    
    const hours = parseInt(timeMatch[1] || '0', 10)
    const minutes = parseInt(timeMatch[2] || '0', 10)
    
    const totalMinutes = hours * 60 + minutes + durationMinutes
    const endHours = Math.floor(totalMinutes / 60) % 24
    const endMinutes = totalMinutes % 60
    
    return `${endHours.toString().padStart(2, '0')}:${endMinutes.toString().padStart(2, '0')}`
  } catch (error) {
    console.warn('End time calculation error:', error)
    return startTime
  }
}