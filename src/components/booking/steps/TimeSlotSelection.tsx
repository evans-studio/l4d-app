'use client'

import { useState, useEffect } from 'react'
import { useBookingFlowStore, useBookingStep } from '@/lib/store/bookingFlowStore'
import { Button } from '@/components/ui/primitives/Button'
import AppointmentPicker from '@/components/booking/AppointmentPicker'
import { isNewUIEnabled } from '@/lib/config/feature-flags'
import { Card, CardHeader, CardContent, CardFooter } from '@/components/ui/composites/Card'
import { ChevronLeftIcon, ChevronRightIcon, CalendarIcon, ClockIcon, CheckCircleIcon, AlertCircleIcon } from 'lucide-react'
import { addDays, format, startOfWeek, endOfWeek, isSameDay, isAfter, startOfDay, startOfMonth, endOfMonth, addMonths, isSameMonth } from 'date-fns'
import { safeConsole } from '@/lib/utils/logger'

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
    formData.slot?.slot_date || format(addDays(new Date(), 1), 'yyyy-MM-dd')
  )
  
  const [currentMonth, setCurrentMonth] = useState<Date>(() => {
    // Start from next month for booking (users can't book same day)
    const today = new Date()
    return startOfMonth(addDays(today, 1))
  })

  const [timeSlots, setTimeSlots] = useState<any[]>([])
  const [slotsLoading, setSlotsLoading] = useState(false)
  const [slotsError, setSlotsError] = useState<string | null>(null)

  // Fetch time slots for a specific date
  const fetchTimeSlots = async (date: string) => {
    try {
      setSlotsLoading(true)
      setSlotsError(null)
      
      const response = await fetch(`/api/time-slots/availability?date=${date}`)
      const result = await response.json()
      
      if (result.success) {
        setTimeSlots(result.data || [])
      } else {
        setSlotsError(result.error?.message || 'Failed to load time slots')
        setTimeSlots([])
      }
    } catch (error) {
      setSlotsError('Failed to load time slots')
      setTimeSlots([])
      safeConsole.error('Error fetching time slots', error as Error)
    } finally {
      setSlotsLoading(false)
    }
  }

  // Load time slots when date changes
  useEffect(() => {
    if (isCurrentStep && selectedDate) {
      fetchTimeSlots(selectedDate)
    }
  }, [isCurrentStep, selectedDate])

  // Generate standard calendar month view (6 weeks to accommodate all months)
  const generateCalendarWeeks = () => {
    const weeks = []
    const today = startOfDay(new Date())
    const monthStart = startOfMonth(currentMonth)
    const monthEnd = endOfMonth(currentMonth)
    
    // Start from the Monday of the week containing the first day of the month
    const calendarStart = startOfWeek(monthStart, { weekStartsOn: 1 })
    
    // Generate 6 weeks to ensure we always show complete month
    for (let week = 0; week < 6; week++) {
      const weekStart = addDays(calendarStart, week * 7)
      const days = []
      
      for (let day = 0; day < 7; day++) {
        const currentDay = addDays(weekStart, day)
        const dayString = format(currentDay, 'yyyy-MM-dd')
        const isPast = !isAfter(currentDay, today) && !isSameDay(currentDay, today)
        const isCurrentMonth = isSameMonth(currentDay, currentMonth)
        const isToday = isSameDay(currentDay, today)
        
        days.push({
          date: currentDay,
          dateString: dayString,
          isPast,
          isSelected: dayString === selectedDate,
          isCurrentMonth, // Track if date belongs to current viewing month
          isToday,
          hasSlots: false // We'll update this with real data
        })
      }
      
      weeks.push(days)
    }
    
    return weeks
  }

  const handleDateSelect = (dateString: string) => {
    setSelectedDate(dateString)
  }

  const handleSlotSelect = async (slotId: string) => {
    const slot = timeSlots.find(s => s.id === slotId)
    if (!slot) return
    
    // Check if slot is already booked
    if (!slot.is_available) {
      return
    }

    // Calculate end time (assuming slots have a consistent duration based on service)
    const startTime = slot.start_time
    const serviceDuration = formData.service?.duration || 60 // duration in minutes
    const endTime = calculateEndTime(startTime, serviceDuration)

    // Select the slot for booking (actual booking happens on form submission)
    setSlotSelection({
      slotId: slot.id,
      slot_date: selectedDate,
      startTime: startTime,
      endTime: endTime,
      duration: serviceDuration
    })
    
    // Proceed to next step immediately after selection
    if (canProceedToNextStep()) {
      nextStep()
    }
  }

  // New UI: handle selection payload directly from AppointmentPicker
  const handlePickerSlotSelect = async (payload: { id: string; date: string; start: string; end: string }) => {
    const serviceDuration = formData.service?.duration || 60
    setSlotSelection({
      slotId: payload.id,
      slot_date: payload.date,
      startTime: payload.start,
      endTime: payload.end || calculateEndTime(payload.start, serviceDuration),
      duration: serviceDuration,
    })
    // Do not auto-advance; allow user to review and click Continue
  }

  // Helper function to calculate end time
  const calculateEndTime = (startTime: string, durationMinutes: number) => {
    const [hours, minutes] = startTime.split(':').map(Number)
    const startDate = new Date()
    startDate.setHours(hours || 0, minutes || 0, 0, 0)
    
    const endDate = new Date(startDate.getTime() + (durationMinutes * 60000))
    return `${endDate.getHours().toString().padStart(2, '0')}:${endDate.getMinutes().toString().padStart(2, '0')}`
  }

  const formatTime = (timeString: string) => {
    try {
      const [hours, minutes] = timeString.split(':')
      if (!hours || !minutes) return timeString
      
      return new Date(`2000-01-01T${timeString}`).toLocaleTimeString('en-GB', {
        hour: '2-digit',
        minute: '2-digit',
        hour12: false
      })
    } catch {
      return timeString
    }
  }

  const isSlotInPast = (slotDate: string, slotTime: string) => {
    const now = new Date()
    const slotDateTime = new Date(`${slotDate}T${slotTime}`)
    // Add 30-minute buffer for booking notice
    const bufferTime = 30 * 60 * 1000 // 30 minutes in milliseconds
    return slotDateTime.getTime() < (now.getTime() + bufferTime)
  }

  const formatDate = (date: Date) => {
    return format(date, 'EEEE, MMMM d')
  }

  const navigateMonth = (direction: 'prev' | 'next') => {
    setCurrentMonth(prev => {
      const newMonth = addMonths(prev, direction === 'next' ? 1 : -1)
      // Don't allow navigation to months in the past
      const today = new Date()
      const currentMonthStart = startOfMonth(today)
      
      if (direction === 'prev' && newMonth < currentMonthStart) {
        return currentMonthStart // Don't go before current month
      }
      
      return newMonth
    })
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

      {/* Calendar View: new UI only */}
      <AppointmentPicker
        initialDate={new Date()}
        onSelect={(s) => handlePickerSlotSelect(s)}
        selectedSlotId={formData.slot?.slotId}
      />

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
        <Card className="border-[var(--border-secondary)] bg-[var(--surface-secondary)]">
          <CardHeader>
            <h3 className="text-lg font-semibold text-[var(--text-primary)]">Selected Appointment</h3>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between rounded-lg p-4 border border-[var(--border-secondary)] bg-[color:rgba(151,71,255,0.08)]">
              <div className="flex items-center gap-3">
                <CheckCircleIcon className="w-6 h-6 text-[var(--primary)]" />
                <div>
                  <p className="font-semibold text-[var(--text-primary)]">
                    {formatDate(new Date(formData.slot.slot_date))}
                  </p>
                  <p className="text-sm text-[var(--text-secondary)]">
                    {formatTime(formData.slot.startTime)} - {formatTime(formData.slot.endTime)}
                  </p>
                  <p className="text-xs text-[var(--text-muted)]">
                    Duration: {Math.round(formData.slot.duration / 60)} hours
                  </p>
                </div>
              </div>
              <div className="text-right">
                <p className="text-sm font-medium text-[var(--primary)]">Slot Reserved</p>
                <p className="text-xs text-[var(--text-secondary)]">Ready to confirm booking</p>
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
            Continue
          </Button>
          <Button
            variant="outline"
            onClick={previousStep}
            leftIcon={<ChevronLeftIcon className="w-4 h-4" />}
            fullWidth
            className="min-h-[48px]"
          >
            Back
          </Button>
        </div>
        
        {/* Desktop: Side by side */}
        <div className="hidden sm:flex justify-between items-center pt-6">
          <Button
            variant="outline"
            onClick={previousStep}
            leftIcon={<ChevronLeftIcon className="w-4 h-4" />}
          >
            Back
          </Button>
          
          <Button
            onClick={nextStep}
            disabled={!canProceedToNextStep() || isLoading}
            size="lg"
            rightIcon={<ChevronRightIcon className="w-4 h-4" />}
          >
            Continue
          </Button>
        </div>
      </div>
    </div>
  )
}