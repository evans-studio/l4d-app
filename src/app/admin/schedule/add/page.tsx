'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { AdminLayout } from '@/components/layouts/AdminLayout'
import { Button } from '@/components/ui/primitives/Button'
import { Card, CardHeader, CardContent } from '@/components/ui/composites/Card'
import { CalendarIcon, ClockIcon, PlusIcon, SaveIcon, ArrowLeftIcon } from 'lucide-react'

interface TimeSlot {
  start_time: string
  end_time: string
  is_available: boolean
}

interface DayInfo {
  date: string
  dayName: string
  dayNumber: number
  monthName: string
  isWeekend: boolean
}

export default function AddSchedulePage() {
  const router = useRouter()
  const [selectedDates, setSelectedDates] = useState<string[]>([])
  const [timeSlots, setTimeSlots] = useState<TimeSlot[]>([
    { start_time: '09:00', end_time: '11:00', is_available: true },
    { start_time: '11:00', end_time: '13:00', is_available: true },
    { start_time: '14:00', end_time: '16:00', is_available: true },
    { start_time: '16:00', end_time: '18:00', is_available: true }
  ])
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')


  const addTimeSlot = () => {
    setTimeSlots([...timeSlots, { start_time: '09:00', end_time: '11:00', is_available: true }])
  }

  const updateTimeSlot = (index: number, field: keyof TimeSlot, value: string | boolean) => {
    const updated = [...timeSlots]
    updated[index] = { ...updated[index], [field]: value } as TimeSlot
    setTimeSlots(updated)
  }

  const removeTimeSlot = (index: number) => {
    setTimeSlots(timeSlots.filter((_, i) => i !== index))
  }

  const handleDateChange = (date: string) => {
    if (selectedDates.includes(date)) {
      setSelectedDates(selectedDates.filter(d => d !== date))
    } else {
      setSelectedDates([...selectedDates, date])
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (selectedDates.length === 0) {
      setError('Please select at least one date')
      return
    }
    if (timeSlots.length === 0) {
      setError('Please add at least one time slot')
      return
    }

    setIsLoading(true)
    setError('')
    setSuccess('')

    try {
      const response = await fetch('/api/admin/time-slots/bulk', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          dates: selectedDates,
          timeSlots: timeSlots
        })
      })

      const data = await response.json()

      if (data.success) {
        setSuccess(`Successfully created time slots for ${selectedDates.length} date(s)`)
        setSelectedDates([])
        setTimeout(() => {
          router.push('/admin/schedule')
        }, 2000)
      } else {
        setError(data.error?.message || 'Failed to create time slots')
      }
    } catch (error) {
      console.error('Create time slots error:', error)
      setError('Failed to create time slots')
    } finally {
      setIsLoading(false)
    }
  }

  const getDaysInNextThreeMonths = (): DayInfo[] => {
    const days: DayInfo[] = []
    const current = new Date()
    const end = new Date()
    end.setMonth(end.getMonth() + 3)

    while (current <= end) {
      const dateStr = current.toISOString().split('T')[0] || ''
      days.push({
        date: dateStr,
        dayName: current.toLocaleDateString('en-GB', { weekday: 'short' }),
        dayNumber: current.getDate(),
        monthName: current.toLocaleDateString('en-GB', { month: 'short' }),
        isWeekend: current.getDay() === 0 || current.getDay() === 6
      })
      current.setDate(current.getDate() + 1)
    }
    return days
  }

  const days = getDaysInNextThreeMonths()

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <Button
              variant="outline"
              onClick={() => router.push('/admin/schedule')}
              leftIcon={<ArrowLeftIcon className="w-4 h-4" />}
            >
              Back to Schedule
            </Button>
            <div>
              <h1 className="text-2xl font-bold text-text-primary">Add Time Slots</h1>
              <p className="text-text-secondary">Create available time slots for multiple dates</p>
            </div>
          </div>
        </div>

        {error && (
          <div className="p-4 bg-red-50 border border-red-200 rounded-lg text-red-800">
            {error}
          </div>
        )}

        {success && (
          <div className="p-4 bg-green-50 border border-green-200 rounded-lg text-green-800">
            {success}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-8">
          {/* Date Selection */}
          <Card>
            <CardHeader>
              <h2 className="text-lg font-semibold text-text-primary flex items-center">
                <CalendarIcon className="w-5 h-5 mr-2" />
                Select Dates
              </h2>
              <p className="text-text-secondary">Choose the dates for which you want to create time slots</p>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-7 gap-2 max-h-64 overflow-y-auto">
                {days.map((day) => (
                  <button
                    key={day.date}
                    type="button"
                    onClick={() => handleDateChange(day.date)}
                    className={`
                      p-2 rounded-lg border text-center transition-colors
                      ${selectedDates.includes(day.date)
                        ? 'bg-brand-purple text-white border-brand-purple'
                        : day.isWeekend
                        ? 'bg-gray-50 text-gray-400 border-gray-200'
                        : 'bg-white text-text-primary border-border-secondary hover:bg-gray-50'
                      }
                    `}
                  >
                    <div className="text-xs font-medium">{day.dayName}</div>
                    <div className="text-sm">{day.dayNumber}</div>
                    <div className="text-xs">{day.monthName}</div>
                  </button>
                ))}
              </div>
              {selectedDates.length > 0 && (
                <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                  <p className="text-blue-800 font-medium">
                    {selectedDates.length} date{selectedDates.length > 1 ? 's' : ''} selected
                  </p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Time Slots */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-lg font-semibold text-text-primary flex items-center">
                    <ClockIcon className="w-5 h-5 mr-2" />
                    Time Slots
                  </h2>
                  <p className="text-text-secondary">Define the available time slots for the selected dates</p>
                </div>
                <Button
                  type="button"
                  variant="outline"
                  onClick={addTimeSlot}
                  leftIcon={<PlusIcon className="w-4 h-4" />}
                >
                  Add Slot
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {timeSlots.map((slot, index) => (
                  <div key={index} className="flex items-center space-x-4 p-4 border border-border-secondary rounded-lg">
                    <div className="flex-1">
                      <label className="block text-sm font-medium text-text-primary mb-1">
                        Start Time
                      </label>
                      <input
                        type="time"
                        value={slot.start_time}
                        onChange={(e) => updateTimeSlot(index, 'start_time', e.target.value)}
                        className="w-full px-3 py-2 border border-border-secondary rounded-md"
                        required
                      />
                    </div>
                    <div className="flex-1">
                      <label className="block text-sm font-medium text-text-primary mb-1">
                        End Time
                      </label>
                      <input
                        type="time"
                        value={slot.end_time}
                        onChange={(e) => updateTimeSlot(index, 'end_time', e.target.value)}
                        className="w-full px-3 py-2 border border-border-secondary rounded-md"
                        required
                      />
                    </div>
                    <div className="flex-1">
                      <label className="block text-sm font-medium text-text-primary mb-1">
                        Available
                      </label>
                      <select
                        value={slot.is_available ? 'true' : 'false'}
                        onChange={(e) => updateTimeSlot(index, 'is_available', e.target.value === 'true')}
                        className="w-full px-3 py-2 border border-border-secondary rounded-md"
                      >
                        <option value="true">Available</option>
                        <option value="false">Unavailable</option>
                      </select>
                    </div>
                    {timeSlots.length > 1 && (
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => removeTimeSlot(index)}
                        className="text-red-600 border-red-200 hover:bg-red-50"
                      >
                        Remove
                      </Button>
                    )}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Submit */}
          <div className="flex justify-end space-x-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => router.push('/admin/schedule')}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              variant="primary"
              disabled={isLoading || selectedDates.length === 0}
              leftIcon={isLoading ? undefined : <SaveIcon className="w-4 h-4" />}
            >
              {isLoading ? (
                <div className="flex items-center space-x-2">
                  <div className="animate-spin w-4 h-4 border-2 border-white border-t-transparent rounded-full"></div>
                  <span>Creating...</span>
                </div>
              ) : (
                'Create Time Slots'
              )}
            </Button>
          </div>
        </form>
      </div>
    </AdminLayout>
  )
}