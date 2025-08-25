import React, { useEffect, useState } from 'react'
import { Calendar, Clock, AlertCircle } from 'lucide-react'
import { Button } from '@/components/ui/primitives/Button'

interface TimeSlot {
  id: string
  date: string
  start_time: string
  end_time: string
  duration_minutes: number
  is_available: boolean
}

interface AvailableSlotsData {
  booking: {
    id: string
    currentDate: string
    currentTime: string
    serviceName: string
    serviceDuration: number
  }
  availableSlots: Record<string, TimeSlot[]>
}

export const AdminReschedulePanel: React.FC<{ bookingId: string, onDone?: () => void }> = ({ bookingId, onDone }) => {
  const [data, setData] = useState<AvailableSlotsData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [selected, setSelected] = useState<{ date: string, time: string } | null>(null)
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true)
        setError('')
        const res = await fetch(`/api/bookings/${bookingId}/available-slots`, { cache: 'no-store' })
        const json = await res.json()
        if (json.success) {
          setData(json.data)
        } else {
          setError(json.error?.message || 'Failed to load available slots')
        }
      } catch (e) {
        setError('Network error occurred')
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [bookingId])

  const handleReschedule = async () => {
    if (!selected) return
    try {
      setSubmitting(true)
      const res = await fetch(`/api/admin/bookings/${bookingId}/reschedule`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ newDate: selected.date, newTime: selected.time, reason: 'Admin reschedule' })
      })
      const json = await res.json()
      if (!res.ok || !json?.success) {
        setError(json?.error?.message || 'Failed to reschedule booking')
        return
      }
      if (onDone) onDone()
    } catch (_) {
      setError('Network error occurred')
    } finally {
      setSubmitting(false)
    }
  }

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr)
    return date.toLocaleDateString('en-GB', { weekday: 'short', day: 'numeric', month: 'short' })
  }
  const formatTime = (timeStr: string) => {
    const [hours, minutes] = timeStr.split(':')
    const hour = parseInt(hours || '0')
    const ampm = hour >= 12 ? 'PM' : 'AM'
    const displayHour = hour % 12 || 12
    return `${displayHour}:${minutes || '00'} ${ampm}`
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-brand-600"></div>
      </div>
    )
  }
  if (error && !data) {
    return (
      <div className="text-center py-8">
        <AlertCircle className="w-10 h-10 text-red-500 mx-auto mb-3" />
        <p className="text-red-600 text-sm mb-3">{error}</p>
        <Button onClick={() => location.reload()} variant="outline">Retry</Button>
      </div>
    )
  }
  if (!data) return null

  return (
    <div className="space-y-4">
      <div className="bg-surface-secondary border border-border-secondary rounded-lg p-4">
        <div className="flex items-center gap-2 mb-2">
          <Calendar className="w-4 h-4 text-brand-600" />
          <span className="text-sm font-medium text-text-primary">Current</span>
        </div>
        <div className="text-sm text-text-secondary">{formatDate(data.booking.currentDate)} at {formatTime(data.booking.currentTime)}</div>
      </div>

      <div className="space-y-3 max-h-72 overflow-y-auto">
        {Object.entries(data.availableSlots).map(([date, slots]) => (
          <div key={date}>
            <div className="font-medium text-text-primary text-sm mb-2">{formatDate(date)}</div>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {slots.filter(s => s.is_available).map(slot => (
                <button
                  key={slot.id}
                  type="button"
                  onClick={() => setSelected({ date, time: slot.start_time })}
                  className={`p-3 border rounded-lg text-sm ${selected?.date === date && selected?.time === slot.start_time ? 'border-brand-600 bg-brand-50 text-brand-700' : 'border-border-secondary hover:border-brand-300 hover:bg-surface-hover'}`}
                >
                  <div className="flex items-center gap-2"><Clock className="w-4 h-4" /> {formatTime(slot.start_time)}</div>
                </button>
              ))}
            </div>
          </div>
        ))}
      </div>

      {error && (
        <div className="p-3 bg-red-50 border border-red-200 rounded text-red-700 text-sm">{error}</div>
      )}

      <div className="flex gap-2 justify-end">
        <Button variant="outline" onClick={onDone} className="min-h-[44px]">Close</Button>
        <Button onClick={handleReschedule} disabled={!selected || submitting} className="min-h-[44px]">
          {submitting ? 'Rescheduling...' : 'Confirm Reschedule'}
        </Button>
      </div>
    </div>
  )
}
