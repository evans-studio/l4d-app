'use client'

import React, { useState, useEffect, useRef } from 'react'
import { Button } from '@/components/ui/primitives/Button'
import { DayCard } from './DayCard'
import { AddSlotModal } from './AddSlotModal'
import { BulkAddModal } from './BulkAddModal'
import { 
  ChevronLeftIcon,
  ChevronRightIcon,
  PlusIcon,
  CalendarPlusIcon,
  CalendarIcon
} from 'lucide-react'
import { safeConsole } from '@/lib/utils/logger'
import { isNewUIEnabled } from '@/lib/config/feature-flags'

interface TimeSlot {
  id: string
  slot_date: string
  start_time: string
  is_available: boolean
  notes: string | null
  created_at: string
  booking?: {
    id: string
    booking_reference: string
    customer_id: string
    status: string
    scheduled_date: string
    scheduled_start_time: string
    scheduled_end_time: string
    total_price: number
    special_instructions: string | null
    customer_name: string | null
    customer_email: string | null
    customer_phone: string | null
    services: Array<{
      name: string
      description: string | null
    }>
  }
}

interface DaySchedule {
  date: string
  dayName: string
  fullDate: string
  slots: TimeSlot[]
  stats: {
    total: number
    booked: number
    available: number
    completed: number
    cancelled: number
  }
}

interface ScheduleSwiperProps {
  timeSlots: TimeSlot[]
  onSlotsChange: () => void
  isLoading: boolean
}

export function ScheduleSwiper({ timeSlots, onSlotsChange, isLoading }: ScheduleSwiperProps) {
  // Feature-flag to safely enable view state preservation
  const IMPROVED_SLOT_STATE_ENABLED = typeof process !== 'undefined' &&
    (process.env.NEXT_PUBLIC_IMPROVED_SLOT_STATE_ENABLED === 'true' || true)

  // Sync derived state when time slots change
  React.useEffect(() => {
    // no-op; reserved for future derived state if needed
  }, [timeSlots])
  const [currentWeekStart, setCurrentWeekStart] = useState<Date>(() => {
    const today = new Date()
    const dayOfWeek = today.getDay()
    const mondayOffset = dayOfWeek === 0 ? -6 : 1 - dayOfWeek // Make Monday first day
    const monday = new Date(today)
    monday.setDate(today.getDate() + mondayOffset)
    return monday
  })
  
  const [currentDayIndex, setCurrentDayIndex] = useState(new Date().getDay() === 0 ? 6 : new Date().getDay() - 1)
  const [showAddModal, setShowAddModal] = useState(false)
  const [showBulkModal, setShowBulkModal] = useState(false)
  const [selectedDate, setSelectedDate] = useState<string>('')
  // Preserve view across data refreshes
  const lastViewedDateRef = useRef<string | null>(null)
  const pendingRefreshRef = useRef<boolean>(false)
  
  const swiperRef = useRef<HTMLDivElement>(null)
  const [touchStart, setTouchStart] = useState<number | null>(null)
  const [touchEnd, setTouchEnd] = useState<number | null>(null)
  const [isDragging, setIsDragging] = useState(false)

  // Generate 7 days starting from current week's Monday
  const generateWeekDays = (): DaySchedule[] => {
    const days: DaySchedule[] = []
    
    // Generate visible week summary
    
    for (let i = 0; i < 7; i++) {
      const date = new Date(currentWeekStart)
      date.setDate(currentWeekStart.getDate() + i)
      const dateStr = date.toISOString().split('T')[0]!
      
      // Get slots for this date
      const daySlots = timeSlots.filter(slot => slot.slot_date === dateStr)
      
      
      // Calculate stats based on database availability and booking status
      const availableSlots = daySlots.filter(slot => {
        // A slot is available if:
        // 1. Database says it's available (is_available = true)
        // 2. AND no active booking exists (or booking is cancelled/completed)
        return slot.is_available && (
          !slot.booking || 
          ['cancelled', 'completed'].includes(slot.booking.status)
        )
      })
      
      const bookedSlots = daySlots.filter(slot => {
        // A slot is booked if:
        // 1. Database says it's unavailable (is_available = false)
        // 2. OR there's an active booking (any status except cancelled/completed)
        return !slot.is_available || (
          slot.booking && !['cancelled', 'completed'].includes(slot.booking.status)
        )
      })
      
      const completedSlots = daySlots.filter(slot =>
        slot.booking?.status === 'completed'
      )
      const cancelledSlots = daySlots.filter(slot =>
        slot.booking?.status === 'cancelled'
      )
      
      days.push({
        date: dateStr,
        dayName: date.toLocaleDateString('en-GB', { weekday: 'long' }),
        fullDate: date.toLocaleDateString('en-GB', { 
          weekday: 'long', 
          month: 'long', 
          day: 'numeric' 
        }),
        slots: daySlots.sort((a, b) => a.start_time.localeCompare(b.start_time)),
        stats: {
          total: daySlots.length,
          booked: bookedSlots.length,
          available: availableSlots.length,
          completed: completedSlots.length,
          cancelled: cancelledSlots.length
        }
      })
    }
    
    return days
  }

  const weekDays = generateWeekDays()
  const currentDay = weekDays[currentDayIndex]

  // Helper: set view to a specific date string (yyyy-mm-dd)
  const setViewToDate = (dateStr: string) => {
    try {
      const target = new Date(dateStr)
      // Compute Monday of the week containing target
      const dayOfWeek = target.getDay()
      const mondayOffset = dayOfWeek === 0 ? -6 : 1 - dayOfWeek
      const monday = new Date(target)
      monday.setDate(target.getDate() + mondayOffset)
      // Determine index (0..6)
      const index = ((dayOfWeek === 0 ? 7 : dayOfWeek) - 1)
      // Avoid resetting to today inadvertently by batching updates
      setCurrentWeekStart(monday)
      setCurrentDayIndex(index)
      safeConsole.debug('ScheduleSwiper: setViewToDate', { dateStr, monday: monday.toISOString().split('T')[0], index })
    } catch {}
  }

  // After data updates, restore view if flagged
  useEffect(() => {
    if (!IMPROVED_SLOT_STATE_ENABLED) return
    if (pendingRefreshRef.current && lastViewedDateRef.current) {
      setViewToDate(lastViewedDateRef.current)
      // reset flags
      pendingRefreshRef.current = false
      lastViewedDateRef.current = null
    }
  }, [timeSlots])

  // Touch handlers for swipe navigation
  const onTouchStart = (e: React.TouchEvent) => {
    setTouchEnd(null)
    setTouchStart(e.targetTouches[0]?.clientX || 0)
    setIsDragging(true)
  }

  const onTouchMove = (e: React.TouchEvent) => {
    setTouchEnd(e.targetTouches[0]?.clientX || 0)
  }

  const onTouchEnd = () => {
    if (!touchStart || !touchEnd) return
    
    const distance = touchStart - touchEnd
    const isLeftSwipe = distance > 50
    const isRightSwipe = distance < -50

    if (isLeftSwipe && currentDayIndex < 6) {
      setCurrentDayIndex(prev => prev + 1)
    }
    if (isRightSwipe && currentDayIndex > 0) {
      setCurrentDayIndex(prev => prev - 1)
    }
    
    setIsDragging(false)
  }

  // Navigation functions
  const goToToday = () => {
    const today = new Date()
    const todayStr = today.toISOString().split('T')[0]!
    
    // Check if today is in current week
    const todayInCurrentWeek = weekDays.find(day => day.date === todayStr)
    
    if (todayInCurrentWeek) {
      const todayIndex = weekDays.findIndex(day => day.date === todayStr)
      setCurrentDayIndex(todayIndex)
    } else {
      // Navigate to week containing today
      const dayOfWeek = today.getDay()
      const mondayOffset = dayOfWeek === 0 ? -6 : 1 - dayOfWeek
      const monday = new Date(today)
      monday.setDate(today.getDate() + mondayOffset)
      setCurrentWeekStart(monday)
      setCurrentDayIndex(dayOfWeek === 0 ? 6 : dayOfWeek - 1)
    }
  }

  const navigateWeek = (direction: 'prev' | 'next') => {
    setCurrentWeekStart(prev => {
      const newDate = new Date(prev)
      newDate.setDate(prev.getDate() + (direction === 'prev' ? -7 : 7))
      return newDate
    })
    // Keep same day of week when navigating weeks
  }

  const navigateDay = (direction: 'prev' | 'next') => {
    if (direction === 'prev' && currentDayIndex > 0) {
      setCurrentDayIndex(prev => prev - 1)
    } else if (direction === 'next' && currentDayIndex < 6) {
      setCurrentDayIndex(prev => prev + 1)
    } else if (direction === 'prev' && currentDayIndex === 0) {
      // Go to previous week, last day
      navigateWeek('prev')
      setCurrentDayIndex(6)
    } else if (direction === 'next' && currentDayIndex === 6) {
      // Go to next week, first day
      navigateWeek('next')
      setCurrentDayIndex(0)
    }
  }

  const openAddModal = (date?: string) => {
    const targetDate = date || currentDay?.date || ''
    setSelectedDate(targetDate)
    // Persist the view immediately so even if data refreshes quickly, we keep the user on the intended day
    if (IMPROVED_SLOT_STATE_ENABLED && targetDate) {
      lastViewedDateRef.current = targetDate
      safeConsole.debug('ScheduleSwiper: openAddModal set lastViewedDateRef', { targetDate })
    }
    setShowAddModal(true)
  }

  const isToday = (dateStr: string) => {
    const today = new Date().toISOString().split('T')[0]
    return dateStr === today
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin w-8 h-8 border-4 border-[var(--primary)] border-t-transparent rounded-full"></div>
      </div>
    )
  }

  return (
    <div className="max-w-md mx-auto bg-[var(--surface-secondary)] rounded-xl border border-[var(--border-secondary)] overflow-hidden" data-ui={isNewUIEnabled() ? 'new' : 'old'}>
      {/* Header */}
      <div className="bg-[var(--surface-primary)] border-b border-[var(--border-secondary)] p-4">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-lg font-semibold text-[var(--text-primary)]">
            Schedule Manager
          </h2>
          <Button
            onClick={() => setShowBulkModal(true)}
            size="sm"
            className="text-xs"
          >
            Bulk Add
          </Button>
        </div>

        {/* Week Navigation */}
        <div className="flex items-center justify-between text-sm">
          <Button
            variant="outline"
            size="sm"
            onClick={() => navigateWeek('prev')}
            className="px-2"
          >
            Previous Week
          </Button>
          
          <div className="text-center">
            <div className="font-medium text-[var(--text-primary)]">
              {currentWeekStart.toLocaleDateString('en-GB', { 
                month: 'short',
                day: 'numeric'
              })} - {new Date(currentWeekStart.getTime() + 6 * 24 * 60 * 60 * 1000).toLocaleDateString('en-GB', { 
                month: 'short',
                day: 'numeric'
              })}
            </div>
            <div className="text-xs text-[var(--text-secondary)]">
              {currentWeekStart.getFullYear()}
            </div>
          </div>

          <Button
            variant="outline"
            size="sm"
            onClick={() => navigateWeek('next')}
            className="px-2"
          >
            Next Week
          </Button>
        </div>
      </div>

      {/* Current Day Display */}
      <div 
        className="relative overflow-hidden"
        ref={swiperRef}
        onTouchStart={onTouchStart}
        onTouchMove={onTouchMove}
        onTouchEnd={onTouchEnd}
      >
        {currentDay && (
          <DayCard
            day={currentDay}
            isToday={isToday(currentDay.date)}
            onAddSlot={() => openAddModal(currentDay.date)}
            onSlotUpdate={onSlotsChange}
          />
        )}
      </div>

      {/* Day Navigation Dots */}
      <div className="flex justify-center items-center gap-2 p-4 bg-[var(--surface-primary)] border-t border-[var(--border-secondary)]">
        {weekDays.map((day, index) => (
          <button
            key={day.date}
            onClick={() => setCurrentDayIndex(index)}
            className={`w-2 h-2 rounded-full transition-all ${
              index === currentDayIndex
                ? 'bg-[var(--primary)] scale-125'
                : 'bg-[var(--border-primary)] hover:bg-[var(--text-secondary)]'
            }`}
          />
        ))}
      </div>

      {/* Bottom Actions */}
      <div className="flex justify-between items-center p-4 bg-[var(--surface-primary)] border-t border-[var(--border-secondary)]">
        <Button
          variant="outline"
          size="sm"
          onClick={() => navigateDay('prev')}
          disabled={currentDayIndex === 0 && currentWeekStart <= new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)}
        >
          Previous Day
        </Button>

        <Button
          variant="outline"
          size="sm"
          onClick={goToToday}
          className="flex items-center gap-1"
        >
          Today
        </Button>

        <Button
          variant="outline"
          size="sm"
          onClick={() => navigateDay('next')}
        >
          Next Day
        </Button>
      </div>

      {/* Modals */}
      {showAddModal && (
        <AddSlotModal
          date={selectedDate}
          onClose={() => setShowAddModal(false)}
          onSuccess={() => {
            // Phase 2: Minimal fix — preserve current viewed date
            if (IMPROVED_SLOT_STATE_ENABLED) {
              const viewedDate = weekDays[currentDayIndex]?.date
              lastViewedDateRef.current = viewedDate || selectedDate
              pendingRefreshRef.current = true
              safeConsole.debug('ScheduleSwiper: preserving view before refresh', {
                viewedDate: lastViewedDateRef.current,
                selectedDate
              })
            }
            onSlotsChange()
            setShowAddModal(false)
          }}
        />
      )}

      {showBulkModal && (
        <BulkAddModal
          weekStart={currentWeekStart}
          onClose={() => setShowBulkModal(false)}
          onSuccess={() => {
            onSlotsChange()
            setShowBulkModal(false)
          }}
        />
      )}
    </div>
  )
}