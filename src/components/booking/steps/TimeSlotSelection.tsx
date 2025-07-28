'use client'

import { useState, useEffect } from 'react'
import { BookingFlowData, TimeSlot, BookingCalendarDay } from '@/lib/utils/booking-types'
import { Button } from '@/components/ui/primitives/Button'
import { ChevronLeftIcon, ChevronRightIcon, CalendarIcon, ClockIcon } from 'lucide-react'

interface TimeSlotSelectionProps {
  bookingData: BookingFlowData
  updateBookingData: (updates: Partial<BookingFlowData>) => void
  onNext: () => void
  onPrev: () => void
  isLoading: boolean
  setIsLoading: (loading: boolean) => void
}

export function TimeSlotSelection({ 
  bookingData, 
  updateBookingData, 
  onNext, 
  onPrev,
  isLoading, 
  setIsLoading 
}: TimeSlotSelectionProps) {
  const [availabilityData, setAvailabilityData] = useState<BookingCalendarDay[]>([])
  const [selectedDate, setSelectedDate] = useState<string>(bookingData.selectedDate || '')
  const [selectedSlot, setSelectedSlot] = useState<{ id: string; start_time: string; date: string } | null>(null)
  const [currentWeekStart, setCurrentWeekStart] = useState<Date>(new Date())

  // Initialize selected slot from booking data
  useEffect(() => {
    if (bookingData.selectedTimeSlot && bookingData.selectedDate) {
      const dayData = availabilityData.find(day => day.date === bookingData.selectedDate)
      const existingSlot = dayData?.available_slots.find(slot => 
        slot.start_time === bookingData.selectedTimeSlot?.start_time
      )
      if (existingSlot) {
        setSelectedSlot({
          id: existingSlot.id,
          start_time: existingSlot.start_time,
          date: bookingData.selectedDate
        })
        setSelectedDate(bookingData.selectedDate)
      }
    }
  }, [availabilityData, bookingData.selectedDate, bookingData.selectedTimeSlot])

  // Fetch available time slots with real-time updates
  useEffect(() => {
    const fetchAvailableSlots = async () => {
      setIsLoading(true)
      try {
        // Get slots for the next 14 days
        const today = new Date()
        const endDate = new Date(today)
        endDate.setDate(today.getDate() + 14)

        const response = await fetch(`/api/time-slots/availability?date_from=${today.toISOString().split('T')[0]}&date_to=${endDate.toISOString().split('T')[0]}&include_booking_count=true`)
        const data = await response.json()
        
        if (data.success) {
          // The API response has the data nested under 'availability'
          setAvailabilityData(data.data.availability || [])
        } else {
          console.error('Failed to load availability data:', data.error)
          setAvailabilityData([])
        }
      } catch (error) {
        console.error('Failed to fetch available slots:', error)
        setAvailabilityData([])
      } finally {
        setIsLoading(false)
      }
    }

    fetchAvailableSlots()
    
    // Set up polling for real-time updates every 30 seconds
    const interval = setInterval(fetchAvailableSlots, 30000)
    
    return () => clearInterval(interval)
  }, [setIsLoading])

  // Get current week's dates
  const getWeekDates = (startDate: Date) => {
    const dates = []
    for (let i = 0; i < 7; i++) {
      const date = new Date(startDate)
      date.setDate(startDate.getDate() + i)
      dates.push(date)
    }
    return dates
  }

  // Navigate weeks
  const nextWeek = () => {
    const newStart = new Date(currentWeekStart)
    newStart.setDate(currentWeekStart.getDate() + 7)
    setCurrentWeekStart(newStart)
  }

  const prevWeek = () => {
    const today = new Date()
    const newStart = new Date(currentWeekStart)
    newStart.setDate(currentWeekStart.getDate() - 7)
    
    // Don't go before today
    if (newStart >= today) {
      setCurrentWeekStart(newStart)
    }
  }

  // Handle slot selection
  const handleSlotSelect = (slot: { id: string; start_time: string }, date: string) => {
    const selectedSlotData = {
      id: slot.id,
      start_time: slot.start_time,
      date: date
    }
    setSelectedSlot(selectedSlotData)
    setSelectedDate(date)
    updateBookingData({
      selectedDate: date,
      selectedTimeSlot: {
        start_time: slot.start_time,
        end_time: slot.start_time // Will be calculated based on service duration
      },
      selectedTimeSlotId: slot.id // Store the actual time slot ID for booking creation
    })
  }

  const handleNext = () => {
    if (selectedSlot && selectedDate) {
      onNext()
    }
  }

  // Create map for quick lookup of availability data by date
  const availabilityByDate = availabilityData.reduce((acc, day) => {
    acc[day.date] = day
    return acc
  }, {} as Record<string, BookingCalendarDay>)

  // Get current week dates
  const weekDates = getWeekDates(currentWeekStart)
  const today = new Date()
  const canGoPrevWeek = currentWeekStart > today

  // Format time display
  const formatTime = (time: string) => {
    const [hours, minutes] = time.split(':')
    const hour = parseInt(hours || '0')
    const ampm = hour >= 12 ? 'PM' : 'AM'
    const displayHour = hour % 12 || 12
    return `${displayHour}:${minutes || '00'} ${ampm}`
  }

  // Format date display
  const formatDate = (date: Date) => {
    const options: Intl.DateTimeFormatOptions = { 
      weekday: 'short', 
      month: 'short', 
      day: 'numeric' 
    }
    return date.toLocaleDateString('en-US', options)
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="text-center">
        <h2 className="text-3xl font-bold text-[var(--text-primary)] mb-2">
          Select Date & Time
        </h2>
        <p className="text-[var(--text-secondary)] text-lg">
          Choose when you&apos;d like your vehicle detailed
        </p>
      </div>

      {/* Week Navigation */}
      <div className="flex items-center justify-between bg-[var(--surface-secondary)] rounded-lg p-4">
        <Button
          onClick={prevWeek}
          disabled={!canGoPrevWeek}
          variant="outline"
          size="sm"
        >
          <ChevronLeftIcon className="w-4 h-4" />
        </Button>
        
        <div className="flex items-center gap-2">
          <CalendarIcon className="w-5 h-5 text-[var(--primary)]" />
          <span className="font-semibold text-[var(--text-primary)]">
            {formatDate(weekDates[0] as Date)} - {formatDate(weekDates[6] as Date)}
          </span>
        </div>
        
        <Button
          onClick={nextWeek}
          variant="outline"
          size="sm"
        >
          <ChevronRightIcon className="w-4 h-4" />
        </Button>
      </div>

      {/* Availability Legend */}
      <div className="bg-[var(--surface-secondary)] rounded-lg p-4">
        <div className="flex flex-wrap items-center justify-center gap-6 text-sm">
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 bg-[var(--surface-secondary)] border-2 border-[var(--border-secondary)] rounded"></div>
            <span className="text-[var(--text-secondary)]">Available</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 bg-orange-50 border-2 border-orange-300 rounded"></div>
            <span className="text-[var(--text-secondary)]">Filling Up</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 bg-gray-100 border-2 border-gray-300 rounded"></div>
            <span className="text-[var(--text-secondary)]">Full</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 bg-[var(--primary)] border-2 border-[var(--primary)] rounded"></div>
            <span className="text-[var(--text-secondary)]">Selected</span>
          </div>
        </div>
      </div>

      {/* Calendar Grid */}
      {isLoading ? (
        <div className="grid grid-cols-7 gap-4">
          {[...Array(7)].map((_, i) => (
            <div key={i} className="space-y-4">
              <div className="h-6 bg-[var(--surface-tertiary)] rounded animate-pulse"></div>
              {[...Array(3)].map((_, j) => (
                <div key={j} className="h-12 bg-[var(--surface-secondary)] rounded animate-pulse"></div>
              ))}
            </div>
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-7 gap-4">
          {weekDates.map((date) => {
            const dateStr = date.toISOString().split('T')[0]
            const dayData = dateStr ? availabilityByDate[dateStr] : null
            const daySlots = dayData?.available_slots || []
            const isToday = dateStr === today.toISOString().split('T')[0]
            const isPast = date < today
            
            return (
              <div key={dateStr} className="space-y-3">
                {/* Date Header */}
                <div className="text-center">
                  <div className={`text-sm font-medium ${isToday ? 'text-[var(--primary)]' : 'text-[var(--text-primary)]'}`}>
                    {formatDate(date)}
                  </div>
                  {isToday && (
                    <div className="text-xs text-[var(--primary)] font-medium">Today</div>
                  )}
                </div>

                {/* Time Slots */}
                <div className="space-y-2">
                  {isPast ? (
                    <div className="text-center py-4 text-[var(--text-muted)] text-sm">
                      Past
                    </div>
                  ) : daySlots.length === 0 ? (
                    <div className="text-center py-4 text-[var(--text-muted)] text-sm">
                      No slots
                    </div>
                  ) : (
                    daySlots
                      .sort((a, b) => a.start_time.localeCompare(b.start_time))
                      .map((slot) => {
                        const isSelected = selectedSlot?.id === slot.id && selectedSlot?.date === dateStr
                        const isNearlyFull = slot.booking_count && slot.booking_count >= 2
                        const isFull = !slot.available
                        
                        return (
                          <button
                            key={slot.id}
                            onClick={() => !isFull && handleSlotSelect(slot, dateStr!)}
                            disabled={isFull}
                            className={`
                              w-full px-3 py-2 rounded-md text-sm font-medium transition-all duration-200 border-2 relative
                              ${isFull
                                ? 'bg-gray-100 border-gray-300 text-gray-400 cursor-not-allowed'
                                : isSelected 
                                ? 'bg-[var(--primary)] border-[var(--primary)] text-white' 
                                : isNearlyFull
                                ? 'bg-orange-50 border-orange-300 text-orange-700 hover:border-orange-400'
                                : 'bg-[var(--surface-secondary)] border-[var(--border-secondary)] text-[var(--text-primary)] hover:border-[var(--border-primary)] hover:bg-[var(--surface-hover)]'
                              }
                            `}
                          >
                            <div className="flex flex-col items-center gap-1">
                              <div className="flex items-center gap-1">
                                <ClockIcon className="w-3 h-3" />
                                {formatTime(slot.start_time)}
                              </div>
                              {slot.booking_count !== undefined && (
                                <div className="text-xs opacity-75">
                                  {isFull ? 'Full' : isNearlyFull ? 'Filling up' : 'Available'}
                                </div>
                              )}
                            </div>
                          </button>
                        )
                      })
                  )}
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* Selected Slot Summary */}
      {selectedSlot && (
        <div className="bg-[var(--surface-secondary)] rounded-lg p-6 border border-[var(--border-primary)]">
          <h3 className="text-lg font-semibold text-[var(--text-primary)] mb-4">
            Selected Appointment
          </h3>
          <div className="flex items-center gap-6">
            <div className="flex items-center gap-2">
              <CalendarIcon className="w-5 h-5 text-[var(--primary)]" />
              <span className="text-[var(--text-primary)] font-medium">
                {new Date(selectedDate).toLocaleDateString('en-US', { 
                  weekday: 'long', 
                  year: 'numeric', 
                  month: 'long', 
                  day: 'numeric' 
                })}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <ClockIcon className="w-5 h-5 text-[var(--primary)]" />
              <span className="text-[var(--text-primary)] font-medium">
                {formatTime(selectedSlot.start_time)}
              </span>
            </div>
          </div>
          
          <div className="mt-4 p-4 bg-[var(--info-bg)] border border-[var(--info)] rounded-md">
            <p className="text-[var(--info)] text-sm">
              💡 Your appointment will be confirmed by our team within 24 hours. 
              We&apos;ll contact you to confirm the exact timing and any special requirements.
            </p>
          </div>
        </div>
      )}

      {/* No Slots Available Message */}
      {!isLoading && availabilityData.length === 0 && (
        <div className="text-center py-12">
          <div className="bg-[var(--warning-bg)] border border-[var(--warning)] rounded-lg p-6 max-w-md mx-auto">
            <CalendarIcon className="w-12 h-12 text-[var(--warning)] mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-[var(--text-primary)] mb-2">
              No Slots Available
            </h3>
            <p className="text-[var(--text-secondary)] text-sm mb-4">
              We&apos;re currently fully booked for the next 2 weeks. Please contact us directly to discuss alternative arrangements.
            </p>
            <Button variant="outline" size="sm">
              Contact Us
            </Button>
          </div>
        </div>
      )}

      {/* Navigation */}
      <div className="flex justify-between items-center pt-6">
        <Button
          onClick={onPrev}
          variant="outline"
          className="flex items-center gap-2"
          size="lg"
        >
          <ChevronLeftIcon className="w-4 h-4" />
          Back to Address
        </Button>
        
        <Button
          onClick={handleNext}
          disabled={!selectedSlot}
          className="flex items-center gap-2"
          size="lg"
        >
          Continue to Confirmation
          <ChevronRightIcon className="w-4 h-4" />
        </Button>
      </div>
    </div>
  )
}