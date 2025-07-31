'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/primitives/Button'
import { Modal, ModalContent, ModalHeader, ModalBody, ModalFooter } from '@/components/ui/composites/Modal'
import { 
  ClockIcon,
  CalendarIcon,
  PlusIcon,
  LoaderIcon,
  TrashIcon
} from 'lucide-react'

interface BulkAddModalProps {
  weekStart: Date
  onClose: () => void
  onSuccess: () => void
}

interface TimeSlotTemplate {
  id: string
  time: string
  duration: number
}

export function BulkAddModal({ weekStart, onClose, onSuccess }: BulkAddModalProps) {
  const [selectedDays, setSelectedDays] = useState<string[]>(['monday', 'tuesday', 'wednesday', 'thursday', 'friday'])
  const [timeSlots, setTimeSlots] = useState<TimeSlotTemplate[]>([
    { id: '1', time: '09:00', duration: 90 },
    { id: '2', time: '10:30', duration: 90 },
    { id: '3', time: '14:00', duration: 90 },
    { id: '4', time: '15:30', duration: 90 }
  ])
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')

  const dayOptions = [
    { key: 'monday', label: 'Mon', fullLabel: 'Monday' },
    { key: 'tuesday', label: 'Tue', fullLabel: 'Tuesday' },
    { key: 'wednesday', label: 'Wed', fullLabel: 'Wednesday' },
    { key: 'thursday', label: 'Thu', fullLabel: 'Thursday' },
    { key: 'friday', label: 'Fri', fullLabel: 'Friday' },
    { key: 'saturday', label: 'Sat', fullLabel: 'Saturday' },
    { key: 'sunday', label: 'Sun', fullLabel: 'Sunday' }
  ]

  const formatTime = (timeStr: string) => {
    const [hours, minutes] = timeStr.split(':')
    const hour = parseInt(hours || '0')
    const ampm = hour >= 12 ? 'PM' : 'AM'
    const displayHour = hour % 12 || 12
    return `${displayHour}:${minutes || '00'} ${ampm}`
  }

  const formatDateRange = () => {
    const weekEnd = new Date(weekStart)
    weekEnd.setDate(weekStart.getDate() + 6)
    
    return `${weekStart.toLocaleDateString('en-GB', { 
      month: 'short', 
      day: 'numeric' 
    })} - ${weekEnd.toLocaleDateString('en-GB', { 
      month: 'short', 
      day: 'numeric' 
    })}`
  }

  const toggleDay = (dayKey: string) => {
    setSelectedDays(prev => 
      prev.includes(dayKey) 
        ? prev.filter(d => d !== dayKey)
        : [...prev, dayKey]
    )
  }

  const addTimeSlot = () => {
    const newSlot: TimeSlotTemplate = {
      id: Date.now().toString(),
      time: '09:00',
      duration: 90
    }
    setTimeSlots(prev => [...prev, newSlot])
  }

  const updateTimeSlot = (id: string, field: 'time' | 'duration', value: string | number) => {
    setTimeSlots(prev => prev.map(slot => 
      slot.id === id ? { ...slot, [field]: value } : slot
    ))
  }

  const removeTimeSlot = (id: string) => {
    setTimeSlots(prev => prev.filter(slot => slot.id !== id))
  }

  const calculateTotalSlots = () => {
    return selectedDays.length * timeSlots.length
  }

  const timeOptions: string[] = []
  for (let hour = 8; hour <= 18; hour++) {
    for (let minute = 0; minute < 60; minute += 30) {
      const timeStr = `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`
      timeOptions.push(timeStr)
    }
  }

  const durationOptions = [
    { value: 60, label: '1 hour' },
    { value: 90, label: '1.5 hours' },
    { value: 120, label: '2 hours' },
    { value: 150, label: '2.5 hours' },
    { value: 180, label: '3 hours' }
  ]

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (selectedDays.length === 0) {
      setError('Please select at least one day')
      return
    }
    
    if (timeSlots.length === 0) {
      setError('Please add at least one time slot')
      return
    }

    setIsLoading(true)
    setError('')

    try {
      // Convert selected days to day-of-week numbers (0=Sunday, 1=Monday, etc.)
      const dayOfWeekMap: Record<string, number> = {
        'sunday': 0,
        'monday': 1,
        'tuesday': 2,
        'wednesday': 3,
        'thursday': 4,
        'friday': 5,
        'saturday': 6
      }
      
      const daysOfWeek = selectedDays.map(dayKey => (dayOfWeekMap[dayKey] ?? 0).toString())
      
      // Calculate week range
      const weekEnd = new Date(weekStart)
      weekEnd.setDate(weekStart.getDate() + 6)
      
      const startDate = weekStart.toISOString().split('T')[0]!
      const endDate = weekEnd.toISOString().split('T')[0]!
      
      // Convert time slots to the expected format
      const timeSlotsFormatted = timeSlots.map(slot => ({
        start_time: slot.time,
        duration_minutes: slot.duration
      }))

      // Send bulk create request using existing API format
      const response = await fetch('/api/admin/time-slots/bulk', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          start_date: startDate,
          end_date: endDate,
          days_of_week: daysOfWeek,
          time_slots: timeSlotsFormatted,
          exclude_dates: []
        })
      })

      const data = await response.json()

      if (data.success) {
        onSuccess()
      } else {
        setError(data.error?.message || 'Failed to create time slots')
      }
    } catch (error) {
      console.error('Error creating time slots:', error)
      setError('Failed to create time slots. Please try again.')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Modal open={true} onClose={onClose}>
      <ModalContent size="lg" mobile="drawer" onClose={onClose}>
        <ModalHeader 
          title="Bulk Add Time Slots"
          subtitle="Create multiple booking slots across selected days"
        />
        
        <form onSubmit={handleSubmit}>
          <ModalBody className="space-y-6" scrollable maxHeight="70vh">
            {/* Week Display */}
            <div className="flex items-center gap-3 p-4 bg-[var(--surface-secondary)] border border-[var(--border-secondary)] rounded-lg">
              <CalendarIcon className="w-5 h-5 text-[var(--text-muted)]" />
              <div>
                <div className="font-semibold text-[var(--text-primary)]">
                  Week: {formatDateRange()}
                </div>
                <div className="text-sm text-[var(--text-secondary)]">
                  {weekStart.getFullYear()}
                </div>
              </div>
            </div>

            {/* Day Selection */}
            <div className="space-y-3">
              <label className="block text-sm font-medium text-[var(--text-primary)]">
                Select Days
              </label>
              <div className="grid grid-cols-7 gap-2">
                {dayOptions.map(day => (
                  <button
                    key={day.key}
                    type="button"
                    onClick={() => toggleDay(day.key)}
                    className={`p-2 rounded-lg border text-sm font-medium transition-colors ${
                      selectedDays.includes(day.key)
                        ? 'bg-[var(--primary)] text-white border-[var(--primary)]'
                        : 'bg-[var(--surface-primary)] text-[var(--text-primary)] border-[var(--border-secondary)] hover:bg-[var(--surface-secondary)]'
                    }`}
                  >
                    {day.label}
                  </button>
                ))}
              </div>
              <div className="text-xs text-[var(--text-secondary)]">
                Selected: {selectedDays.map(key => 
                  dayOptions.find(d => d.key === key)?.fullLabel
                ).join(', ')}
              </div>
            </div>

            {/* Time Slots */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <label className="block text-sm font-medium text-[var(--text-primary)]">
                  Time Slots
                </label>
                <Button
                  type="button"
                  onClick={addTimeSlot}
                  size="sm"
                  variant="outline"
                  leftIcon={<PlusIcon className="w-4 h-4" />}
                >
                  Add Time
                </Button>
              </div>

              <div className="space-y-3">
                {timeSlots.map(slot => (
                  <div key={slot.id} className="flex items-center gap-2 p-3 bg-[var(--surface-secondary)] rounded-lg">
                    <div className="flex-1">
                      <select
                        value={slot.time}
                        onChange={(e) => updateTimeSlot(slot.id, 'time', e.target.value)}
                        className="w-full px-2 py-1 text-sm border border-[var(--border-secondary)] rounded bg-[var(--surface-primary)] text-[var(--text-primary)]"
                      >
                        {timeOptions.map(time => (
                          <option key={time} value={time}>
                            {formatTime(time)}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div className="flex-1">
                      <select
                        value={slot.duration}
                        onChange={(e) => updateTimeSlot(slot.id, 'duration', Number(e.target.value))}
                        className="w-full px-2 py-1 text-sm border border-[var(--border-secondary)] rounded bg-[var(--surface-primary)] text-[var(--text-primary)]"
                      >
                        {durationOptions.map(option => (
                          <option key={option.value} value={option.value}>
                            {option.label}
                          </option>
                        ))}
                      </select>
                    </div>
                    <button
                      type="button"
                      onClick={() => removeTimeSlot(slot.id)}
                      className="p-1 text-red-600 hover:bg-red-100 rounded transition-colors"
                    >
                      <TrashIcon className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            </div>

            {/* Summary */}
            <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
              <div className="flex items-center gap-2 mb-2">
                <ClockIcon className="w-4 h-4 text-blue-600" />
                <span className="font-semibold text-blue-900">Summary</span>
              </div>
              <div className="text-sm text-blue-700">
                This will create <strong>{calculateTotalSlots()} slots</strong> across {selectedDays.length} days
              </div>
              <div className="text-xs text-blue-600 mt-1">
                {timeSlots.length} time slots × {selectedDays.length} days
              </div>
            </div>

            {/* Error Message */}
            {error && (
              <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
                <p className="text-sm text-red-700">{error}</p>
              </div>
            )}
          </ModalBody>

          <ModalFooter>
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              disabled={isLoading}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={isLoading || calculateTotalSlots() === 0}
              loading={isLoading}
              leftIcon={isLoading ? <LoaderIcon className="w-4 h-4 animate-spin" /> : <PlusIcon className="w-4 h-4" />}
            >
              {isLoading ? 'Creating...' : 'Create All'}
            </Button>
          </ModalFooter>
        </form>
      </ModalContent>
    </Modal>
  )
}