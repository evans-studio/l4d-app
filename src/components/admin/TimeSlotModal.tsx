'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/primitives/Button'
import { ClockIcon, XIcon, CalendarIcon, PlusIcon } from 'lucide-react'
import { logger } from '@/lib/utils/logger'

interface TimeSlotModalProps {
  isOpen: boolean
  onClose: () => void
  selectedDate: string
  onSuccess: () => void
}

interface TimeSlotForm {
  start_time: string
  duration_minutes: number
  notes: string
  create_multiple: boolean
  end_time: string
}

export function TimeSlotModal({ isOpen, onClose, selectedDate, onSuccess }: TimeSlotModalProps) {
  const [formData, setFormData] = useState<TimeSlotForm>({
    start_time: '09:00',
    duration_minutes: 60,
    notes: '',
    create_multiple: false,
    end_time: '17:00'
  })
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')

  if (!isOpen) return null

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError('')

    try {
      const payload = {
        slot_date: selectedDate,
        start_time: formData.start_time,
        duration_minutes: formData.duration_minutes,
        notes: formData.notes.trim() || undefined,
        create_multiple: formData.create_multiple,
        end_time: formData.create_multiple ? formData.end_time : undefined
      }

      const response = await fetch('/api/admin/time-slots', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(payload)
      })

      const result = await response.json()

      if (!result.success) {
        setError(result.error?.message || 'Failed to create time slot')
        return
      }

      // Success - close modal and refresh data
      onClose()
      onSuccess()
      
      // Reset form
      setFormData({
        start_time: '09:00',
        duration_minutes: 60,
        notes: '',
        create_multiple: false,
        end_time: '17:00'
      })

    } catch (error) {
      logger.error('Error creating time slot:', error)
      setError('Failed to create time slot. Please try again.')
    } finally {
      setIsLoading(false)
    }
  }

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr)
    return date.toLocaleDateString('en-GB', {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
      year: 'numeric'
    })
  }

  const generateTimeOptions = () => {
    const options = []
    for (let hour = 6; hour <= 22; hour++) {
      for (let minute = 0; minute < 60; minute += 30) {
        const timeStr = `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`
        options.push(timeStr)
      }
    }
    return options
  }

  const durationOptions = [
    { value: 30, label: '30 minutes' },
    { value: 60, label: '1 hour' },
    { value: 90, label: '1.5 hours' },
    { value: 120, label: '2 hours' },
    { value: 150, label: '2.5 hours' },
    { value: 180, label: '3 hours' }
  ]

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-surface-secondary rounded-lg shadow-xl w-full max-w-md border border-border-secondary">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-border-secondary">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-brand-100 rounded-lg">
              <CalendarIcon className="w-5 h-5 text-brand-600" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-text-primary">
                Create Time Slot
              </h3>
              <p className="text-sm text-text-secondary">
                {formatDate(selectedDate)}
              </p>
            </div>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={onClose}
            className="p-2"
          >
            <XIcon className="w-4 h-4" />
          </Button>
        </div>

        {/* Content */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {error && (
            <div className="bg-error-600/10 border border-error-500/20 rounded-md p-3">
              <p className="text-error-400 text-sm">{error}</p>
            </div>
          )}

          {/* Single vs Multiple Toggle */}
          <div className="space-y-3">
            <label className="block text-sm font-medium text-text-primary">
              Creation Mode
            </label>
            <div className="flex gap-4">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="radio"
                  name="mode"
                  checked={!formData.create_multiple}
                  onChange={() => setFormData(prev => ({ ...prev, create_multiple: false }))}
                  className="text-brand-600 focus:ring-brand-600"
                />
                <span className="text-sm text-text-primary">Single slot</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="radio"
                  name="mode"
                  checked={formData.create_multiple}
                  onChange={() => setFormData(prev => ({ ...prev, create_multiple: true }))}
                  className="text-brand-600 focus:ring-brand-600"
                />
                <span className="text-sm text-text-primary">Multiple slots</span>
              </label>
            </div>
          </div>

          {/* Start Time */}
          <div className="space-y-2">
            <label className="block text-sm font-medium text-text-primary">
              {formData.create_multiple ? 'Start Time' : 'Time'}
            </label>
            <div className="relative">
              <select
                value={formData.start_time}
                onChange={(e) => setFormData(prev => ({ ...prev, start_time: e.target.value }))}
                className="w-full pl-10 pr-4 py-2 bg-surface-primary border border-border-secondary rounded-md text-text-primary focus:border-brand-400 focus:outline-none focus:ring-2 focus:ring-brand-600/20"
                required
              >
                {generateTimeOptions().map(time => (
                  <option key={time} value={time}>{time}</option>
                ))}
              </select>
              <ClockIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-text-muted" />
            </div>
          </div>

          {/* End Time (for multiple slots) */}
          {formData.create_multiple && (
            <div className="space-y-2">
              <label className="block text-sm font-medium text-text-primary">
                End Time
              </label>
              <div className="relative">
                <select
                  value={formData.end_time}
                  onChange={(e) => setFormData(prev => ({ ...prev, end_time: e.target.value }))}
                  className="w-full pl-10 pr-4 py-2 bg-surface-primary border border-border-secondary rounded-md text-text-primary focus:border-brand-400 focus:outline-none focus:ring-2 focus:ring-brand-600/20"
                  required
                >
                  {generateTimeOptions().filter(time => time > formData.start_time).map(time => (
                    <option key={time} value={time}>{time}</option>
                  ))}
                </select>
                <ClockIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-text-muted" />
              </div>
            </div>
          )}

          {/* Duration */}
          <div className="space-y-2">
            <label className="block text-sm font-medium text-text-primary">
              Slot Duration
            </label>
            <select
              value={formData.duration_minutes}
              onChange={(e) => setFormData(prev => ({ ...prev, duration_minutes: parseInt(e.target.value) }))}
              className="w-full px-3 py-2 bg-surface-primary border border-border-secondary rounded-md text-text-primary focus:border-brand-400 focus:outline-none focus:ring-2 focus:ring-brand-600/20"
              required
            >
              {durationOptions.map(option => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>

          {/* Notes */}
          <div className="space-y-2">
            <label className="block text-sm font-medium text-text-primary">
              Notes (Optional)
            </label>
            <textarea
              value={formData.notes}
              onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
              className="w-full px-3 py-2 bg-surface-primary border border-border-secondary rounded-md text-text-primary placeholder-text-muted focus:border-brand-400 focus:outline-none focus:ring-2 focus:ring-brand-600/20 resize-none"
              rows={3}
              placeholder="Add any notes about this time slot..."
            />
          </div>

          {/* Preview */}
          {formData.create_multiple && (
            <div className="bg-surface-primary border border-border-secondary rounded-md p-3">
              <p className="text-xs text-text-secondary mb-2">Preview:</p>
              <p className="text-sm text-text-primary">
                {(() => {
                  const startHour = parseInt(formData.start_time.split(':')[0] || '0')
                  const startMinute = parseInt(formData.start_time.split(':')[1] || '0')
                  const endHour = parseInt(formData.end_time.split(':')[0] || '0')
                  const endMinute = parseInt(formData.end_time.split(':')[1] || '0')
                  
                  const startTotalMinutes = startHour * 60 + startMinute
                  const endTotalMinutes = endHour * 60 + endMinute
                  const slots = Math.floor((endTotalMinutes - startTotalMinutes) / formData.duration_minutes)
                  
                  return `${slots} slot${slots !== 1 ? 's' : ''} will be created`
                })()}
              </p>
            </div>
          )}

          {/* Actions */}
          <div className="flex gap-3 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              disabled={isLoading}
              className="flex-1"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={isLoading}
              className="flex-1"
              leftIcon={isLoading ? undefined : <PlusIcon className="w-4 h-4" />}
            >
              {isLoading ? (
                <div className="flex items-center gap-2">
                  <div className="animate-spin w-4 h-4 border-2 border-white border-t-transparent rounded-full"></div>
                  Creating...
                </div>
              ) : (
                `Create ${formData.create_multiple ? 'Slots' : 'Slot'}`
              )}
            </Button>
          </div>
        </form>
      </div>
    </div>
  )
}