'use client'

import { useState, useEffect } from 'react'
import { useBookingFlowStore, useBookingStep } from '@/lib/store/bookingFlowStore'
import { useRealTimeAvailability } from '@/hooks/useRealTimeAvailability'
import { Button } from '@/components/ui/primitives/Button'
import { Card, CardHeader, CardContent, CardFooter } from '@/components/ui/composites/Card'
import { RealTimeAvailability } from '@/components/booking/RealTimeAvailability'
import { ChevronLeftIcon, ChevronRightIcon, CalendarIcon, ClockIcon, CheckCircleIcon, AlertCircleIcon } from 'lucide-react'
import { addDays, format, startOfWeek, endOfWeek, isSameDay, isAfter, startOfDay } from 'date-fns'

export function TimeSlotSelection() {
  const {
    formData,
    calculatedPrice,
    isLoading,
    error,
    setSlotSelection,
    loadAvailableSlots,
    previousStep,
    nextStep,
    canProceedToNextStep
  } = useBookingFlowStore()

  const { isCurrentStep } = useBookingStep(3)
  
  const [selectedDate, setSelectedDate] = useState<string>(
    formData.slot?.date || format(addDays(new Date(), 1), 'yyyy-MM-dd')
  )
  
  const [currentWeekStart, setCurrentWeekStart] = useState<Date>(
    startOfWeek(new Date(), { weekStartsOn: 1 }) // Monday start
  )

  const [showRealTimeView, setShowRealTimeView] = useState(false)

  // Real-time availability for selected date
  const {
    timeSlots,
    isLoading: slotsLoading,
    error: slotsError,
    refreshAvailability,
    bookSlot
  } = useRealTimeAvailability({
    date: selectedDate,
    pollInterval: 30000,
    enableRealTimeUpdates: true
  })

  // Load available slots when date changes
  useEffect(() => {
    if (isCurrentStep && formData.service && selectedDate) {
      loadAvailableSlots(selectedDate, formData.service.serviceId, formData.service.duration)
    }
  }, [isCurrentStep, selectedDate, formData.service, loadAvailableSlots])

  // Generate calendar weeks
  const generateCalendarWeeks = () => {
    const weeks = []
    const today = startOfDay(new Date())
    
    for (let week = 0; week < 4; week++) {
      const weekStart = addDays(currentWeekStart, week * 7)
      const weekEnd = endOfWeek(weekStart, { weekStartsOn: 1 })
      const days = []
      
      for (let day = 0; day < 7; day++) {
        const currentDay = addDays(weekStart, day)
        const dayString = format(currentDay, 'yyyy-MM-dd')
        const isPast = !isAfter(currentDay, today) && !isSameDay(currentDay, today)
        
        days.push({
          date: currentDay,
          dateString: dayString,
          isPast,
          isSelected: dayString === selectedDate,
          hasSlots: false // We'll update this with real data
        })
      }
      
      weeks.push(days)
    }
    
    return weeks
  }

  const handleDateSelect = (dateString: string) => {
    setSelectedDate(dateString)
    setShowRealTimeView(false) // Reset to calendar view when date changes
  }

  const handleSlotSelect = async (slotId: string) => {
    const slot = timeSlots.find(s => s.id === slotId)
    if (!slot) return

    try {
      // Book the slot using real-time availability
      const success = await bookSlot(slotId, `booking-${Date.now()}`)
      if (success) {
        setSlotSelection({
          slotId: slot.id,
          date: selectedDate,
          startTime: slot.start_time,
          endTime: slot.end_time,
          duration: formData.service?.duration || 60
        })
        
        // Auto-proceed to next step after successful slot selection
        setTimeout(() => {
          if (canProceedToNextStep()) {
            nextStep()
          }
        }, 1000)
      }
    } catch (error) {
      console.error('Failed to book slot:', error)
    }
  }

  const formatTime = (timeString: string) => {
    return new Date(`2000-01-01T${timeString}`).toLocaleTimeString('en-GB', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: false
    })
  }

  const formatDate = (date: Date) => {
    return format(date, 'EEEE, MMMM d')
  }

  const navigateWeek = (direction: 'prev' | 'next') => {
    const change = direction === 'next' ? 7 : -7
    setCurrentWeekStart(prev => addDays(prev, change))
  }

  if (!isCurrentStep) {
    return <div></div>
  }

  const calendarWeeks = generateCalendarWeeks()

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="text-center">
        <h2 className="text-3xl font-bold text-text-primary mb-2">
          Choose Date & Time
        </h2>
        <p className="text-text-secondary text-lg">
          Select your preferred appointment slot
        </p>
      </div>

      {/* Service & Pricing Summary */}
      {formData.service && calculatedPrice && (
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-semibold text-text-primary">{formData.service.name}</h3>
                <p className="text-sm text-text-secondary">
                  Duration: ~{Math.round(formData.service.duration / 60)} hours
                </p>
                {formData.vehicle && (
                  <p className="text-sm text-text-secondary">
                    {formData.vehicle.year} {formData.vehicle.make} {formData.vehicle.model} ({formData.vehicle.size})
                  </p>
                )}
              </div>
              <div className="text-right">
                <p className="text-2xl font-bold text-brand-400">£{calculatedPrice.finalPrice}</p>
                <p className="text-sm text-text-secondary">{calculatedPrice.currency}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Toggle between Calendar and Real-time view */}
      <div className="flex justify-center gap-2">
        <Button
          variant={!showRealTimeView ? 'primary' : 'outline'}
          onClick={() => setShowRealTimeView(false)}
          size="sm"
          leftIcon={<CalendarIcon className="w-4 h-4" />}
        >
          Calendar View
        </Button>
        <Button
          variant={showRealTimeView ? 'primary' : 'outline'}
          onClick={() => setShowRealTimeView(true)}
          size="sm"
          leftIcon={<ClockIcon className="w-4 h-4" />}
        >
          Real-Time Slots
        </Button>
      </div>

      {/* Calendar View */}
      {!showRealTimeView && (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold text-text-primary">Select Date</h3>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => navigateWeek('prev')}
                  leftIcon={<ChevronLeftIcon className="w-4 h-4" />}
                >
                  Previous
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => navigateWeek('next')}
                  rightIcon={<ChevronRightIcon className="w-4 h-4" />}
                >
                  Next
                </Button>
              </div>
            </div>
          </CardHeader>
          
          <CardContent>
            {/* Calendar Grid */}
            <div className="space-y-4">
              {/* Day headers */}
              <div className="grid grid-cols-7 gap-2 text-center text-sm font-medium text-text-secondary">
                <div>Mon</div>
                <div>Tue</div>
                <div>Wed</div>
                <div>Thu</div>
                <div>Fri</div>
                <div>Sat</div>
                <div>Sun</div>
              </div>
              
              {/* Calendar weeks */}
              {calendarWeeks.map((week, weekIndex) => (
                <div key={weekIndex} className="grid grid-cols-7 gap-2">
                  {week.map((day, dayIndex) => (
                    <button
                      key={dayIndex}
                      onClick={() => !day.isPast && handleDateSelect(day.dateString)}
                      disabled={day.isPast}
                      className={`
                        p-3 rounded-lg text-center transition-all duration-200 border
                        ${day.isPast 
                          ? 'bg-surface-tertiary text-text-muted border-border-secondary cursor-not-allowed' 
                          : day.isSelected
                            ? 'bg-brand-600 text-white border-brand-600 shadow-purple-lg'
                            : 'bg-surface-secondary border-border-secondary hover:border-brand-400 hover:bg-brand-600/5'
                        }
                      `}
                    >
                      <div className="text-lg font-semibold">
                        {format(day.date, 'd')}
                      </div>
                      <div className="text-xs">
                        {format(day.date, 'MMM')}
                      </div>
                    </button>
                  ))}
                </div>
              ))}
            </div>

            {/* Selected Date Display */}
            {selectedDate && (
              <div className="mt-6 p-4 bg-brand-600/5 border border-brand-200 rounded-lg">
                <div className="flex items-center gap-3">
                  <CalendarIcon className="w-5 h-5 text-brand-600" />
                  <div>
                    <p className="font-semibold text-text-primary">
                      {formatDate(new Date(selectedDate))}
                    </p>
                    <p className="text-sm text-text-secondary">
                      {timeSlots.length} slots available
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Available Slots for Selected Date */}
            {selectedDate && timeSlots.length > 0 && (
              <div className="mt-6">
                <h4 className="font-semibold text-text-primary mb-4">Available Times</h4>
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
                  {timeSlots.filter(slot => slot.is_available).map((slot) => (
                    <Button
                      key={slot.id}
                      variant={formData.slot?.slotId === slot.id ? 'primary' : 'outline'}
                      onClick={() => handleSlotSelect(slot.id)}
                      className="flex flex-col items-center p-4 h-auto"
                    >
                      <ClockIcon className="w-4 h-4 mb-1" />
                      <span className="text-sm font-medium">
                        {formatTime(slot.start_time)}
                      </span>
                      <span className="text-xs opacity-75">
                        {formatTime(slot.end_time)}
                      </span>
                    </Button>
                  ))}
                </div>
              </div>
            )}

            {/* No slots message */}
            {selectedDate && timeSlots.length === 0 && !slotsLoading && (
              <div className="mt-6 text-center p-8 bg-surface-tertiary rounded-lg">
                <AlertCircleIcon className="w-8 h-8 mx-auto mb-2 text-text-muted" />
                <p className="text-text-secondary">No available slots for this date</p>
                <p className="text-sm text-text-muted">Try selecting a different date</p>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Real-Time Availability View */}
      {showRealTimeView && (
        <RealTimeAvailability
          selectedDate={selectedDate}
          onSlotSelect={handleSlotSelect}
          showDebugInfo={false}
        />
      )}

      {/* Loading State */}
      {slotsLoading && (
        <Card>
          <CardContent className="p-8 text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-brand-600 mx-auto mb-4"></div>
            <p className="text-text-secondary">Loading available slots...</p>
          </CardContent>
        </Card>
      )}

      {/* Error Display */}
      {(error || slotsError) && (
        <Card className="border-red-500 bg-red-50">
          <CardContent>
            <div className="flex items-center gap-3">
              <AlertCircleIcon className="w-5 h-5 text-red-600" />
              <p className="text-red-600">{error || slotsError}</p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Selected Slot Summary */}
      {formData.slot && (
        <Card>
          <CardHeader>
            <h3 className="text-lg font-semibold text-text-primary">Selected Appointment</h3>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between bg-green-50 border border-green-200 rounded-lg p-4">
              <div className="flex items-center gap-3">
                <CheckCircleIcon className="w-6 h-6 text-green-600" />
                <div>
                  <p className="font-semibold text-text-primary">
                    {formatDate(new Date(formData.slot.date))}
                  </p>
                  <p className="text-sm text-text-secondary">
                    {formatTime(formData.slot.startTime)} - {formatTime(formData.slot.endTime)}
                  </p>
                  <p className="text-xs text-text-muted">
                    Duration: {Math.round(formData.slot.duration / 60)} hours
                  </p>
                </div>
              </div>
              <div className="text-right">
                <p className="text-sm text-green-700 font-medium">Slot Reserved</p>
                <p className="text-xs text-green-600">Ready to confirm booking</p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Navigation */}
      <div className="px-4 sm:px-0">
        {/* Mobile: Stacked */}
        <div className="sm:hidden space-y-3 pt-6">
          <Button
            onClick={nextStep}
            disabled={!canProceedToNextStep() || isLoading}
            size="lg"
            fullWidth
            rightIcon={<ChevronRightIcon className="w-4 h-4" />}
            className="min-h-[48px]"
          >
            Continue to Service Address
          </Button>
          <Button
            variant="outline"
            onClick={previousStep}
            leftIcon={<ChevronLeftIcon className="w-4 h-4" />}
            fullWidth
            className="min-h-[48px]"
          >
            Back to Vehicle Details
          </Button>
        </div>
        
        {/* Desktop: Side by side */}
        <div className="hidden sm:flex justify-between items-center pt-6">
          <Button
            variant="outline"
            onClick={previousStep}
            leftIcon={<ChevronLeftIcon className="w-4 h-4" />}
          >
            Back to Vehicle Details
          </Button>
          
          <Button
            onClick={nextStep}
            disabled={!canProceedToNextStep() || isLoading}
            size="lg"
            rightIcon={<ChevronRightIcon className="w-4 h-4" />}
          >
            Continue to Service Address
          </Button>
        </div>
      </div>
    </div>
  )
}