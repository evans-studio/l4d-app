'use client'

import { useState, useEffect } from 'react'
import { BookingFlowData, TimeSlot } from '@/lib/utils/booking-types'
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
  const [availableSlots, setAvailableSlots] = useState<TimeSlot[]>([])
  const [selectedDate, setSelectedDate] = useState<string>(bookingData.selectedDate || '')
  const [selectedSlot, setSelectedSlot] = useState<TimeSlot | null>(null)
  const [currentWeekStart, setCurrentWeekStart] = useState<Date>(new Date())

  // Initialize selected slot from booking data
  useEffect(() => {
    if (bookingData.selectedTimeSlot && bookingData.selectedDate) {
      const existingSlot = availableSlots.find(slot => 
        slot.slot_date === bookingData.selectedDate && 
        slot.start_time === bookingData.selectedTimeSlot?.start_time
      )
      if (existingSlot) {
        setSelectedSlot(existingSlot)
        setSelectedDate(bookingData.selectedDate)
      }
    }
  }, [availableSlots, bookingData.selectedDate, bookingData.selectedTimeSlot])

  // Fetch available time slots
  useEffect(() => {
    const fetchAvailableSlots = async () => {
      setIsLoading(true)
      try {
        // Get slots for the next 14 days
        const today = new Date()
        const endDate = new Date(today)
        endDate.setDate(today.getDate() + 14)

        const response = await fetch(`/api/time-slots/availability?date_from=${today.toISOString().split('T')[0]}&date_to=${endDate.toISOString().split('T')[0]}`)
        const data = await response.json()
        
        if (data.success) {
          // Extract all available slots from the calendar data
          const allSlots: TimeSlot[] = []
          data.data.forEach((day: { date: string; available_slots: Array<{ id: string; start_time: string; available: boolean }> }) => {
            day.available_slots.forEach((slot) => {
              if (slot.available) {
                allSlots.push({
                  id: slot.id,
                  slot_date: day.date,
                  start_time: slot.start_time,
                  is_available: true,
                  created_at: new Date().toISOString()
                })
              }
            })
          })
          setAvailableSlots(allSlots)
        }
      } catch (error) {
        console.error('Failed to fetch available slots:', error)
      } finally {
        setIsLoading(false)
      }
    }

    fetchAvailableSlots()
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
  const handleSlotSelect = (slot: TimeSlot) => {
    setSelectedSlot(slot)
    setSelectedDate(slot.slot_date)
    updateBookingData({
      selectedDate: slot.slot_date,
      selectedTimeSlot: {
        start_time: slot.start_time,
        end_time: slot.start_time // Will be calculated based on service duration
      }
    })
  }

  const handleNext = () => {
    if (selectedSlot && selectedDate) {
      onNext()
    }
  }

  // Group slots by date
  const slotsByDate = availableSlots.reduce((acc, slot) => {
    const dateKey = slot.slot_date
    if (!acc[dateKey]) {
      acc[dateKey] = []
    }
    acc[dateKey]!.push(slot)
    return acc
  }, {} as Record<string, TimeSlot[]>)

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
            const daySlots = (dateStr && slotsByDate[dateStr]) || []
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
                      .sort((a: TimeSlot, b: TimeSlot) => a.start_time.localeCompare(b.start_time))
                      .map((slot: TimeSlot) => {
                        const isSelected = selectedSlot?.id === slot.id
                        
                        return (
                          <button
                            key={slot.id}
                            onClick={() => handleSlotSelect(slot)}
                            className={`
                              w-full px-3 py-2 rounded-md text-sm font-medium transition-all duration-200 border-2
                              ${isSelected 
                                ? 'bg-[var(--primary)] border-[var(--primary)] text-white' 
                                : 'bg-[var(--surface-secondary)] border-[var(--border-secondary)] text-[var(--text-primary)] hover:border-[var(--border-primary)] hover:bg-[var(--surface-hover)]'
                              }
                            `}
                          >
                            <div className="flex items-center justify-center gap-1">
                              <ClockIcon className="w-3 h-3" />
                              {formatTime(slot.start_time)}
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
      {!isLoading && availableSlots.length === 0 && (
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