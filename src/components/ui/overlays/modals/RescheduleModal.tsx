'use client'

import React, { useState, useEffect } from 'react'
import { Calendar, Clock, ChevronRight, AlertCircle } from 'lucide-react'
import { BaseModal } from '../BaseModal'
import { BaseOverlayProps } from '@/lib/overlay/types'
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
  restrictions: {
    minimumNoticeHours: number
    maximumAdvanceDays: number
  }
}

interface RescheduleModalProps extends BaseOverlayProps {
  data: {
    bookingId: string
  }
}

export const RescheduleModal: React.FC<RescheduleModalProps> = ({
  isOpen,
  onClose,
  data,
  onConfirm
}) => {
  const [availableSlots, setAvailableSlots] = useState<AvailableSlotsData | null>(null)
  const [selectedSlot, setSelectedSlot] = useState<TimeSlot | null>(null)
  const [reason, setReason] = useState('')
  const [isLoading, setIsLoading] = useState(true)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    if (isOpen && data?.bookingId) {
      loadAvailableSlots()
    }
  }, [isOpen, data?.bookingId])

  const loadAvailableSlots = async () => {
    try {
      setIsLoading(true)
      setError('')
      
      const response = await fetch(`/api/bookings/${data.bookingId}/available-slots`)
      const result = await response.json()

      if (result.success) {
        setAvailableSlots(result.data)
      } else {
        setError(result.error?.message || 'Failed to load available slots')
      }
    } catch (error) {
      setError('Network error occurred')
    } finally {
      setIsLoading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!selectedSlot || !reason.trim()) {
      setError('Please select a time slot and provide a reason')
      return
    }

    try {
      setIsSubmitting(true)
      setError('')

      const response = await fetch(`/api/bookings/${data.bookingId}/reschedule-request`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          requestedDate: selectedSlot.date,
          requestedTime: selectedSlot.start_time,
          reason: reason.trim()
        })
      })

      const result = await response.json()

      if (result.success) {
        if (onConfirm) {
          await onConfirm(result.data)
        }
        onClose()
      } else {
        setError(result.error?.message || 'Failed to submit reschedule request')
      }
    } catch (error) {
      setError('Network error occurred')
    } finally {
      setIsSubmitting(false)
    }
  }

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr)
    return date.toLocaleDateString('en-GB', {
      weekday: 'long',
      day: 'numeric',
      month: 'long'
    })
  }

  const formatTime = (timeStr: string) => {
    const [hours, minutes] = timeStr.split(':')
    const hour = parseInt(hours || '0')
    const ampm = hour >= 12 ? 'PM' : 'AM'
    const displayHour = hour % 12 || 12
    return `${displayHour}:${minutes || '00'} ${ampm}`
  }

  return (
    <BaseModal
      isOpen={isOpen}
      onClose={onClose}
      title="Reschedule Booking"
      size="lg"
    >
      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-brand-600"></div>
        </div>
      ) : error && !availableSlots ? (
        <div className="text-center py-12">
          <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
          <p className="text-red-600 mb-4">{error}</p>
          <Button onClick={loadAvailableSlots} variant="outline">
            Try Again
          </Button>
        </div>
      ) : availableSlots ? (
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Current Booking Info */}
          <div className="bg-surface-secondary rounded-lg p-4 border border-border-secondary">
            <h3 className="font-medium text-text-primary mb-2">Current Booking</h3>
            <div className="text-sm text-text-secondary space-y-1">
              <div className="flex items-center gap-2">
                <Calendar className="w-4 h-4" />
                {formatDate(availableSlots.booking.currentDate)}
              </div>
              <div className="flex items-center gap-2">
                <Clock className="w-4 h-4" />
                {formatTime(availableSlots.booking.currentTime)}
              </div>
              <div>{availableSlots.booking.serviceName}</div>
            </div>
          </div>

          {/* Available Slots */}
          <div>
            <h3 className="font-medium text-text-primary mb-4">Select New Time</h3>
            
            {Object.keys(availableSlots.availableSlots).length === 0 ? (
              <div className="text-center py-8 text-text-secondary">
                <Clock className="w-12 h-12 mx-auto mb-4 opacity-50" />
                <p>No available slots found</p>
                <p className="text-sm mt-2">
                  Please try again later or contact us for assistance
                </p>
              </div>
            ) : (
              <div className="space-y-4 max-h-64 overflow-y-auto">
                {Object.entries(availableSlots.availableSlots).map(([date, slots]) => (
                  <div key={date} className="space-y-2">
                    <h4 className="font-medium text-text-primary">
                      {formatDate(date)}
                    </h4>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      {slots.map((slot) => (
                        <button
                          key={slot.id}
                          type="button"
                          onClick={() => setSelectedSlot(slot)}
                          className={`p-3 text-left border rounded-lg transition-colors ${
                            selectedSlot?.id === slot.id
                              ? 'border-brand-600 bg-brand-50 text-brand-700'
                              : 'border-border-secondary hover:border-brand-300 hover:bg-surface-hover'
                          }`}
                        >
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <Clock className="w-4 h-4" />
                              <span className="font-medium">
                                {formatTime(slot.start_time)} - {formatTime(slot.end_time)}
                              </span>
                            </div>
                            <ChevronRight className="w-4 h-4 opacity-50" />
                          </div>
                        </button>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Reason */}
          <div>
            <label className="block text-sm font-medium text-text-primary mb-2">
              Reason for reschedule *
            </label>
            <textarea
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="Please explain why you need to reschedule..."
              rows={3}
              className="w-full px-3 py-2 border border-border-secondary rounded-lg resize-none focus:ring-2 focus:ring-brand-600/20 focus:border-brand-600"
              required
            />
          </div>

          {/* Notice */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <div className="flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
              <div className="text-sm text-blue-800">
                <p className="font-medium mb-1">Please note:</p>
                <ul className="space-y-1 text-xs">
                  <li>• Your reschedule request will be reviewed by our team</li>
                  <li>• You will receive a confirmation email once approved</li>
                  <li>• Minimum {availableSlots.restrictions.minimumNoticeHours} hours notice required</li>
                </ul>
              </div>
            </div>
          </div>

          {/* Error */}
          {error && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-red-800 text-sm">
              {error}
            </div>
          )}

          {/* Actions */}
          <div className="flex gap-3 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              className="flex-1"
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              variant="primary"
              className="flex-1"
              disabled={!selectedSlot || !reason.trim() || isSubmitting}
            >
              {isSubmitting ? 'Submitting...' : 'Request Reschedule'}
            </Button>
          </div>
        </form>
      ) : null}
    </BaseModal>
  )
}