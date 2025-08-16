'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/primitives/Button'
import { Modal, ModalContent, ModalHeader, ModalBody, ModalFooter } from '@/components/ui/composites/Modal'
import { 
  ClockIcon,
  CalendarIcon,
  PlusIcon,
  LoaderIcon
} from 'lucide-react'

interface AddSlotModalProps {
  date: string
  onClose: () => void
  onSuccess: () => void
}

export function AddSlotModal({ date, onClose, onSuccess }: AddSlotModalProps) {
  const [startTime, setStartTime] = useState('09:00')
  const [duration, setDuration] = useState(90) // minutes
  const [notes, setNotes] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr)
    return date.toLocaleDateString('en-GB', { 
      weekday: 'long', 
      month: 'long', 
      day: 'numeric' 
    })
  }

  const formatTime = (timeStr: string) => {
    const [hours, minutes] = timeStr.split(':')
    const hour = parseInt(hours || '0')
    const ampm = hour >= 12 ? 'PM' : 'AM'
    const displayHour = hour % 12 || 12
    return `${displayHour}:${minutes || '00'} ${ampm}`
  }

  const getEndTime = (startTime: string, durationMinutes: number) => {
    const [hours, minutes] = startTime.split(':').map(Number)
    const totalMinutes = (hours || 0) * 60 + (minutes || 0) + durationMinutes
    const endHours = Math.floor(totalMinutes / 60)
    const endMinutes = totalMinutes % 60
    return `${endHours.toString().padStart(2, '0')}:${endMinutes.toString().padStart(2, '0')}`
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError('')

    try {
      const response = await fetch('/api/admin/time-slots', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          slot_date: date,
          start_time: startTime,
          is_available: true,
          notes: notes.trim() || null
        })
      })

      const data = await response.json()

      if (data.success) {
        onSuccess()
      } else {
        setError(data.error?.message || 'Failed to create time slot')
      }
    } catch (error) {
      console.error('Error creating time slot:', error)
      setError('Failed to create time slot. Please try again.')
    } finally {
      setIsLoading(false)
    }
  }

  const durationOptions = [
    { value: 60, label: '1 hour' },
    { value: 90, label: '1.5 hours' },
    { value: 120, label: '2 hours' },
    { value: 150, label: '2.5 hours' },
    { value: 180, label: '3 hours' }
  ]

  const timeSlots: string[] = []
  for (let hour = 8; hour <= 18; hour++) {
    for (let minute = 0; minute < 60; minute += 30) {
      const timeStr = `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`
      timeSlots.push(timeStr)
    }
  }

  return (
    <Modal open={true} onClose={onClose}>
      <ModalContent size="md" position="center" mobile="fullscreen" onClose={onClose}>
        <ModalHeader 
          title="Add Time Slot"
          subtitle="Create a new available booking slot"
        />
        
        <form onSubmit={handleSubmit} className="flex flex-col max-h-full sm:max-h-[90vh]">
          <ModalBody scrollable className="space-y-6 flex-1 overflow-y-auto">
            {/* Date Display */}
            <div className="flex items-center gap-3 p-4 bg-[var(--surface-secondary)] border border-[var(--border-secondary)] rounded-lg">
              <CalendarIcon className="w-5 h-5 text-[var(--text-muted)]" />
              <div>
                <div className="font-semibold text-[var(--text-primary)]">
                  {formatDate(date)}
                </div>
                <div className="text-sm text-[var(--text-secondary)]">Selected date</div>
              </div>
            </div>

            {/* Start Time */}
            <div className="space-y-2">
              <label className="block text-sm font-medium text-[var(--text-primary)]">
                Start Time
              </label>
              <select
                value={startTime}
                onChange={(e) => setStartTime(e.target.value)}
                className="w-full px-3 py-2 border border-[var(--border-secondary)] rounded-lg bg-[var(--surface-primary)] text-[var(--text-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--primary)] focus:border-[var(--primary)]"
                required
              >
                {timeSlots.map(time => (
                  <option key={time} value={time}>
                    {formatTime(time)}
                  </option>
                ))}
              </select>
            </div>

            {/* Duration */}
            <div className="space-y-2">
              <label className="block text-sm font-medium text-[var(--text-primary)]">
                Duration
              </label>
              <select
                value={duration}
                onChange={(e) => setDuration(Number(e.target.value))}
                className="w-full px-3 py-2 border border-[var(--border-secondary)] rounded-lg bg-[var(--surface-primary)] text-[var(--text-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--primary)] focus:border-[var(--primary)]"
              >
                {durationOptions.map(option => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>

            {/* Time Preview */}
            <div className="flex items-center gap-3 p-4 bg-blue-50 border border-blue-200 rounded-lg">
              <ClockIcon className="w-5 h-5 text-blue-600" />
              <div>
                <div className="font-semibold text-blue-900">
                  {formatTime(startTime)} - {formatTime(getEndTime(startTime, duration))}
                </div>
                <div className="text-sm text-blue-700">
                  {duration} minutes duration
                </div>
              </div>
            </div>

            {/* Notes */}
            <div className="space-y-2">
              <label className="block text-sm font-medium text-[var(--text-primary)]">
                Notes (optional)
              </label>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Add any notes about this time slot..."
                rows={3}
                className="w-full px-3 py-2 border border-[var(--border-secondary)] rounded-lg bg-[var(--surface-primary)] text-[var(--text-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--primary)] focus:border-[var(--primary)] placeholder:text-[var(--text-muted)]"
              />
            </div>

            {/* Error Message */}
            {error && (
              <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
                <p className="text-sm text-red-700">{error}</p>
              </div>
            )}
          </ModalBody>

          <ModalFooter className="bg-[var(--surface-primary)]">
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
              disabled={isLoading}
              loading={isLoading}
              leftIcon={isLoading ? <LoaderIcon className="w-4 h-4 animate-spin" /> : <PlusIcon className="w-4 h-4" />}
            >
              {isLoading ? 'Adding...' : 'Add Slot'}
            </Button>
          </ModalFooter>
        </form>
      </ModalContent>
    </Modal>
  )
}