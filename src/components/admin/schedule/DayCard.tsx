'use client'

import { useState } from 'react'
import { TimeSlot } from './TimeSlot'
import { BookingOverlay } from './BookingOverlay'
import { Button } from '@/components/ui/primitives/Button'
import { 
  PlusIcon,
  CalendarIcon,
  ClockIcon,
  UsersIcon,
  CheckCircleIcon
} from 'lucide-react'

interface TimeSlotData {
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
  slots: TimeSlotData[]
  stats: {
    total: number
    booked: number
    available: number
    completed: number
    cancelled: number
  }
}

interface DayCardProps {
  day: DaySchedule
  isToday: boolean
  onAddSlot: () => void
  onSlotUpdate: () => void
}

export function DayCard({ day, isToday, onAddSlot, onSlotUpdate }: DayCardProps) {
  const [selectedSlot, setSelectedSlot] = useState<TimeSlotData | null>(null)
  const [showOverlay, setShowOverlay] = useState(false)

  const handleSlotClick = (slot: TimeSlotData) => {
    setSelectedSlot(slot)
    setShowOverlay(true)
  }

  const handleSlotUpdate = async (slotId: string, updates: Partial<TimeSlotData>) => {
    try {
      const response = await fetch(`/api/admin/time-slots/${slotId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updates)
      })

      if (response.ok) {
        onSlotUpdate()
      }
    } catch (error) {
      console.error('Error updating slot:', error)
    }
  }

  const handleSlotDelete = async (slotId: string) => {
    if (!confirm('Delete this time slot?')) return

    try {
      const response = await fetch(`/api/admin/time-slots/${slotId}`, {
        method: 'DELETE'
      })

      if (response.ok) {
        onSlotUpdate()
      }
    } catch (error) {
      console.error('Error deleting slot:', error)
    }
  }

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr)
    return date.toLocaleDateString('en-GB', { 
      weekday: 'long', 
      month: 'long', 
      day: 'numeric' 
    })
  }

  const isPastDate = (dateStr: string) => {
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    return new Date(dateStr) < today
  }

  const isSlotPast = (dateStr: string, timeStr: string) => {
    const now = new Date()
    const slotDateTime = new Date(`${dateStr}T${timeStr}`)
    
    // Add 5-minute buffer to consider slots "past" slightly before their actual time
    // This prevents clicking on slots that are about to start
    const bufferTime = 5 * 60 * 1000 // 5 minutes in milliseconds
    return slotDateTime.getTime() <= (now.getTime() + bufferTime)
  }

  return (
    <>
      <div className="p-6 min-h-[500px]">
        {/* Day Header */}
        <div className={`text-center mb-6 pb-4 border-b border-[var(--border-secondary)] ${
          isToday ? 'border-[var(--primary)]' : ''
        }`}>
          <div className={`text-2xl font-bold mb-1 ${
            isToday ? 'text-[var(--primary)]' : 'text-[var(--text-primary)]'
          }`}>
            {formatDate(day.date)}
          </div>
          {isToday && (
            <div className="text-sm text-[var(--primary)] font-medium mb-2">
              Today
            </div>
          )}
          <div className="text-sm text-[var(--text-secondary)] flex items-center justify-center gap-4">
            <span className="flex items-center gap-1">
              <ClockIcon className="w-4 h-4" />
              {day.stats.total} slots
            </span>
            <span className="flex items-center gap-1">
              <UsersIcon className="w-4 h-4" />
              {day.stats.booked} booked
            </span>
            {day.stats.completed > 0 && (
              <span className="flex items-center gap-1">
                <CheckCircleIcon className="w-4 h-4" />
                {day.stats.completed} done
              </span>
            )}
          </div>
        </div>

        {/* Add Slot Button */}
        <div className="mb-4">
          <Button
            onClick={onAddSlot}
            variant="outline"
            className="w-full"
            disabled={isPastDate(day.date)}
          >
            <PlusIcon className="w-4 h-4 mr-2" />
            Add Time Slot
          </Button>
        </div>

        {/* Time Slots */}
        <div className="space-y-3">
          {day.slots.length === 0 ? (
            <div className="text-center py-12">
              <CalendarIcon className="w-12 h-12 text-[var(--text-muted)] mx-auto mb-4" />
              <h3 className="text-lg font-medium text-[var(--text-primary)] mb-2">
                No time slots scheduled
              </h3>
              <p className="text-[var(--text-secondary)] mb-4">
                Add time slots to make this day available for booking
              </p>
              {!isPastDate(day.date) && (
                <Button onClick={onAddSlot} size="sm">
                  <PlusIcon className="w-4 h-4 mr-2" />
                  Add Time Slots
                </Button>
              )}
            </div>
          ) : (
            day.slots.map(slot => (
              <TimeSlot
                key={slot.id}
                slot={slot}
                onClick={() => handleSlotClick(slot)}
                onUpdate={(updates) => handleSlotUpdate(slot.id, updates)}
                onDelete={() => handleSlotDelete(slot.id)}
                isPast={isSlotPast(slot.slot_date, slot.start_time)}
              />
            ))
          )}
        </div>

        {/* Day Summary */}
        {day.slots.length > 0 && (
          <div className="mt-6 pt-4 border-t border-[var(--border-secondary)]">
            <div className="grid grid-cols-4 gap-3 text-center">
              <div className="space-y-1">
                <div className="text-xl font-bold text-[var(--text-primary)]">
                  {day.stats.total}
                </div>
                <div className="text-xs text-[var(--text-secondary)]">Total</div>
              </div>
              <div className="space-y-1">
                <div className="text-xl font-bold text-green-600">
                  {day.stats.available}
                </div>
                <div className="text-xs text-[var(--text-secondary)]">Available</div>
              </div>
              <div className="space-y-1">
                <div className="text-xl font-bold text-blue-600">
                  {day.stats.booked}
                </div>
                <div className="text-xs text-[var(--text-secondary)]">Active</div>
              </div>
              <div className="space-y-1">
                <div className="text-xl font-bold text-purple-600">
                  {day.stats.completed}
                </div>
                <div className="text-xs text-[var(--text-secondary)]">Done</div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Booking Detail Overlay */}
      {showOverlay && selectedSlot && (
        <BookingOverlay
          slot={selectedSlot}
          onClose={() => {
            setShowOverlay(false)
            setSelectedSlot(null)
          }}
          onUpdate={() => {
            onSlotUpdate()
            setShowOverlay(false)
            setSelectedSlot(null)
          }}
        />
      )}
    </>
  )
}