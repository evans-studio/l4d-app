'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/primitives/Button'
import { logger } from '@/lib/utils/logger'
import {
  CalendarIcon, 
  ClockIcon, 
  XIcon, 
  PlusIcon, 
  CopyIcon,
  AlertCircleIcon,
  CheckCircleIcon
} from 'lucide-react'

interface BulkScheduleModalProps {
  isOpen: boolean
  onClose: () => void
  onSuccess: () => void
}

interface BulkScheduleForm {
  start_date: string
  end_date: string
  days_of_week: string[]
  time_slots: Array<{
    start_time: string
    duration_minutes: number
  }>
  exclude_dates: string[]
}

const DAYS_OF_WEEK = [
  { value: '1', label: 'Monday' },
  { value: '2', label: 'Tuesday' },
  { value: '3', label: 'Wednesday' },
  { value: '4', label: 'Thursday' },
  { value: '5', label: 'Friday' },
  { value: '6', label: 'Saturday' },
  { value: '0', label: 'Sunday' }
]

const PRESET_SCHEDULES = {
  weekdays_9to5: {
    name: "Weekdays 9-5",
    days: ['1', '2', '3', '4', '5'],
    slots: [
      { start_time: '09:00', duration_minutes: 120 },
      { start_time: '11:30', duration_minutes: 120 },
      { start_time: '14:00', duration_minutes: 120 },
      { start_time: '16:30', duration_minutes: 90 }
    ]
  },
  weekends_only: {
    name: "Weekends Only",
    days: ['6', '0'],
    slots: [
      { start_time: '08:00', duration_minutes: 150 },
      { start_time: '11:00', duration_minutes: 150 },
      { start_time: '14:00', duration_minutes: 150 },
      { start_time: '17:00', duration_minutes: 120 }
    ]
  },
  full_week: {
    name: "Full Week",
    days: ['1', '2', '3', '4', '5', '6', '0'],
    slots: [
      { start_time: '09:00', duration_minutes: 120 },
      { start_time: '12:00', duration_minutes: 120 },
      { start_time: '15:00', duration_minutes: 120 }
    ]
  }
}

export function BulkScheduleModal({ isOpen, onClose, onSuccess }: BulkScheduleModalProps) {
  const [formData, setFormData] = useState<BulkScheduleForm>({
    start_date: new Date().toISOString().split('T')[0] || '',
    end_date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0] || '', // 30 days from now
    days_of_week: ['1', '2', '3', '4', '5'], // Weekdays default
    time_slots: [
      { start_time: '09:00', duration_minutes: 120 },
      { start_time: '12:00', duration_minutes: 120 },
      { start_time: '15:00', duration_minutes: 120 }
    ],
    exclude_dates: []
  })
  
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')
  const [preview, setPreview] = useState<{ total_slots: number; dates: string[] } | null>(null)

  if (!isOpen) return null

  const handlePresetSelect = (presetKey: keyof typeof PRESET_SCHEDULES) => {
    const preset = PRESET_SCHEDULES[presetKey]
    setFormData(prev => ({
      ...prev,
      days_of_week: preset.days,
      time_slots: preset.slots
    }))
  }

  const handleDayToggle = (day: string) => {
    setFormData(prev => ({
      ...prev,
      days_of_week: prev.days_of_week.includes(day)
        ? prev.days_of_week.filter(d => d !== day)
        : [...prev.days_of_week, day]
    }))
  }

  const handleAddTimeSlot = () => {
    setFormData(prev => ({
      ...prev,
      time_slots: [...prev.time_slots, { start_time: '09:00', duration_minutes: 120 }]
    }))
  }

  const handleRemoveTimeSlot = (index: number) => {
    setFormData(prev => ({
      ...prev,
      time_slots: prev.time_slots.filter((_, i) => i !== index)
    }))
  }

  const handleTimeSlotChange = (index: number, field: 'start_time' | 'duration_minutes', value: string | number) => {
    setFormData(prev => ({
      ...prev,
      time_slots: prev.time_slots.map((slot, i) => 
        i === index ? { ...slot, [field]: value } : slot
      )
    }))
  }

  const generatePreview = async () => {
    try {
      const response = await fetch('/api/admin/time-slots/preview', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      })

      if (response.ok) {
        const data = await response.json()
        if (data.success) {
          setPreview(data.data)
        }
      }
    } catch (error) {
      logger.error('Preview generation failed:', error)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError('')

    try {
      const response = await fetch('/api/admin/time-slots/bulk', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      })

      const data = await response.json()

      if (data.success) {
        onSuccess()
        onClose()
      } else {
        setError(data.error?.message || 'Failed to create time slots')
      }
    } catch (error) {
      setError('Failed to create time slots')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-surface-secondary rounded-lg border border-border-primary w-full max-w-4xl max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-6 border-b border-border-secondary">
          <h2 className="text-xl font-semibold text-text-primary">Bulk Schedule Creation</h2>
          <Button variant="outline" size="sm" onClick={onClose}>
            <XIcon className="w-4 h-4" />
          </Button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {error && (
            <div className="p-4 bg-red-50 border border-red-200 rounded-lg text-red-800 flex items-center">
              <AlertCircleIcon className="w-5 h-5 mr-2" />
              {error}
            </div>
          )}

          {/* Quick Presets */}
          <div>
            <label className="block text-sm font-medium text-text-primary mb-3">Quick Presets</label>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              {Object.entries(PRESET_SCHEDULES).map(([key, preset]) => (
                <Button
                  key={key}
                  type="button"
                  variant="outline"
                  onClick={() => handlePresetSelect(key as keyof typeof PRESET_SCHEDULES)}
                  className="p-4 h-auto flex-col"
                >
                  <CopyIcon className="w-4 h-4 mb-1" />
                  <span className="font-medium">{preset.name}</span>
                  <span className="text-xs text-text-secondary">
                    {preset.slots.length} slots/day
                  </span>
                </Button>
              ))}
            </div>
          </div>

          {/* Date Range */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-text-primary mb-2">Start Date</label>
              <input
                type="date"
                value={formData.start_date}
                onChange={(e) => setFormData(prev => ({ ...prev, start_date: e.target.value }))}
                className="w-full px-4 py-2 border border-border-secondary rounded-lg bg-surface-primary text-text-primary"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-text-primary mb-2">End Date</label>
              <input
                type="date"
                value={formData.end_date}
                onChange={(e) => setFormData(prev => ({ ...prev, end_date: e.target.value }))}
                className="w-full px-4 py-2 border border-border-secondary rounded-lg bg-surface-primary text-text-primary"
                required
              />
            </div>
          </div>

          {/* Days of Week */}
          <div>
            <label className="block text-sm font-medium text-text-primary mb-3">Days of Week</label>
            <div className="grid grid-cols-4 md:grid-cols-7 gap-2">
              {DAYS_OF_WEEK.map((day) => (
                <label
                  key={day.value}
                  className={`flex items-center justify-center p-3 rounded-lg border cursor-pointer transition-colors ${
                    formData.days_of_week.includes(day.value)
                      ? 'bg-brand-purple/10 border-brand-purple text-brand-purple'
                      : 'bg-surface-primary border-border-secondary text-text-secondary hover:bg-surface-hover'
                  }`}
                >
                  <input
                    type="checkbox"
                    checked={formData.days_of_week.includes(day.value)}
                    onChange={() => handleDayToggle(day.value)}
                    className="sr-only"
                  />
                  <span className="text-sm font-medium">{day.label}</span>
                </label>
              ))}
            </div>
          </div>

          {/* Time Slots */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <label className="block text-sm font-medium text-text-primary">Daily Time Slots</label>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={handleAddTimeSlot}
              >
                <PlusIcon className="w-4 h-4 mr-1" />
                Add Slot
              </Button>
            </div>
            
            <div className="space-y-3">
              {formData.time_slots.map((slot, index) => (
                <div key={index} className="flex items-center gap-3 p-3 bg-surface-primary rounded-lg border border-border-secondary">
                  <div className="flex items-center gap-2">
                    <ClockIcon className="w-4 h-4 text-text-secondary" />
                    <input
                      type="time"
                      value={slot.start_time}
                      onChange={(e) => handleTimeSlotChange(index, 'start_time', e.target.value)}
                      className="px-2 py-1 border border-border-secondary rounded bg-surface-secondary text-text-primary"
                    />
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-text-secondary">Duration:</span>
                    <select
                      value={slot.duration_minutes}
                      onChange={(e) => handleTimeSlotChange(index, 'duration_minutes', parseInt(e.target.value))}
                      className="px-2 py-1 border border-border-secondary rounded bg-surface-secondary text-text-primary"
                    >
                      <option value={60}>1 hour</option>
                      <option value={90}>1.5 hours</option>
                      <option value={120}>2 hours</option>
                      <option value={150}>2.5 hours</option>
                      <option value={180}>3 hours</option>
                    </select>
                  </div>
                  {formData.time_slots.length > 1 && (
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => handleRemoveTimeSlot(index)}
                      className="text-red-600 border-red-200 hover:bg-red-50"
                    >
                      <XIcon className="w-3 h-3" />
                    </Button>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Preview */}
          <div className="flex items-center gap-3">
            <Button
              type="button"
              variant="outline"
              onClick={generatePreview}
            >
              Generate Preview
            </Button>
            {preview && (
              <div className="flex items-center text-sm text-text-secondary">
                <CheckCircleIcon className="w-4 h-4 mr-1 text-green-600" />
                Will create {preview.total_slots} time slots across {preview.dates.length} dates
              </div>
            )}
          </div>

          {/* Submit */}
          <div className="flex items-center justify-end gap-3 pt-4 border-t border-border-secondary">
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
              disabled={isLoading || formData.time_slots.length === 0 || formData.days_of_week.length === 0}
            >
              {isLoading ? (
                <>
                  <div className="animate-spin w-4 h-4 border-2 border-white border-t-transparent rounded-full mr-2"></div>
                  Creating...
                </>
              ) : (
                <>
                  <CalendarIcon className="w-4 h-4 mr-2" />
                  Create Schedule
                </>
              )}
            </Button>
          </div>
        </form>
      </div>
    </div>
  )
}