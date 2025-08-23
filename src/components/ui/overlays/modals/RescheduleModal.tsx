'use client'

import React, { useState, useEffect } from 'react'
import { Calendar, Clock, ChevronRight, AlertCircle } from 'lucide-react'
import { Dialog, DialogHeader, DialogTitle, DialogBody } from '@/components/ui/overlays/Dialog'
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
  const [requestSubmitted, setRequestSubmitted] = useState(false)
  const [submittedRequestData, setSubmittedRequestData] = useState<{
    date: string
    time: string
    reason: string
    message: string
  } | null>(null)

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

    // Debug logging (dev only)
    if (process.env.NODE_ENV !== 'production') {
      // eslint-disable-next-line no-console
      console.log('Selected slot:', selectedSlot)
      // eslint-disable-next-line no-console
      console.log('Reason:', reason)
    }
    
    const requestData = {
      date: selectedSlot.date,
      time: selectedSlot.start_time,
      reason: reason.trim()
    }
    
    if (process.env.NODE_ENV !== 'production') {
      // eslint-disable-next-line no-console
      console.log('Request data being sent:', requestData)
    }

    try {
      setIsSubmitting(true)
      setError('')

      const response = await fetch(`/api/customer/bookings/${data.bookingId}/reschedule`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(requestData)
      })

      const result = await response.json()

      if (result.success) {
        // Show success state instead of immediately closing
        setRequestSubmitted(true)
        setSubmittedRequestData({
          date: selectedSlot.date,
          time: selectedSlot.start_time,
          reason: reason.trim(),
          message: result.data.note || 'Your reschedule request has been submitted successfully!'
        })
        
        if (onConfirm) {
          await onConfirm(result.data)
        }
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
    <Dialog open={isOpen} onOpenChange={(o) => !o && onClose()}>
      <DialogHeader>
        <DialogTitle>Reschedule Booking</DialogTitle>
      </DialogHeader>
      <DialogBody>
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
          ) : requestSubmitted && submittedRequestData ? (
            <div className="text-center py-12">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
                <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <h3 className="text-xl font-semibold text-text-primary mb-4">
                Reschedule Request Submitted!
              </h3>
              <div className="space-y-4 text-left max-w-md mx-auto">
                <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                  <p className="text-green-800 text-sm mb-3">{submittedRequestData.message}</p>
                  <div className="space-y-2 text-sm">
                    <div className="flex items-center justify-between">
                      <span className="text-green-700">Requested Date:</span>
                      <span className="font-medium text-green-900">{formatDate(submittedRequestData.date)}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-green-700">Requested Time:</span>
                      <span className="font-medium text-green-900">{formatTime(submittedRequestData.time)}</span>
                    </div>
                    <div className="pt-2 border-t border-green-200">
                      <span className="text-green-700 block mb-1">Your Reason:</span>
                      <p className="text-green-800 italic">"{submittedRequestData.reason}"</p>
                    </div>
                  </div>
                </div>
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <div className="flex items-start gap-3">
                    <div className="w-5 h-5 text-blue-600 mt-0.5">
                      <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                    </div>
                    <div>
                      <h4 className="font-medium text-blue-900 mb-1">What happens next?</h4>
                      <p className="text-blue-800 text-sm">
                        Our team will review your request within 24 hours and send you an email confirmation once approved or if we need to discuss alternative times.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
              <Button 
                onClick={onClose} 
                className="mt-6"
                variant="primary"
              >
                Done
              </Button>
            </div>
          ) : availableSlots ? (
            <form onSubmit={handleSubmit} className="space-y-4 sm:space-y-6">
              {/* Current Booking Info */}
              <div className="bg-surface-secondary rounded-lg p-3 sm:p-4 border border-border-secondary">
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
                  <div className="space-y-3 sm:space-y-4 max-h-64 sm:max-h-72 overflow-y-auto">
                    {Object.entries(availableSlots.availableSlots).map(([date, slots]) => (
                      <div key={date} className="space-y-2">
                        <h4 className="font-medium text-text-primary text-sm sm:text-base">
                          {formatDate(date)}
                        </h4>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                          {slots.map((slot) => (
                            <button
                              key={slot.id}
                              type="button"
                              onClick={() => setSelectedSlot(slot)}
                              className={`p-3 sm:p-3 text-left border rounded-lg transition-colors min-h-[52px] sm:min-h-[48px] touch-manipulation ${
                                selectedSlot?.id === slot.id
                                  ? 'border-brand-600 bg-brand-50 text-brand-700'
                                  : 'border-border-secondary hover:border-brand-300 hover:bg-surface-hover active:bg-surface-hover'
                              }`}
                            >
                              <div className="flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                  <Clock className="w-4 h-4 flex-shrink-0" />
                                  <span className="font-medium text-sm sm:text-base">
                                    {formatTime(slot.start_time)} - {formatTime(slot.end_time)}
                                  </span>
                                </div>
                                <ChevronRight className="w-4 h-4 opacity-50 flex-shrink-0" />
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
                  className="w-full px-3 py-2 border border-border-secondary rounded-lg resize-none focus:ring-2 focus:ring-brand-600/20 focus:border-brand-600 min-h-[80px] touch-manipulation bg-surface-primary text-text-primary placeholder:text-text-muted"
                  required
                />
              </div>
              
              {/* Notice */}
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 sm:p-4">
                <div className="flex items-start gap-3">
                  <AlertCircle className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
                  <div className="text-sm text-blue-800">
                    <p className="font-medium mb-1">Please note:</p>
                    <ul className="space-y-1 text-xs leading-relaxed">
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
              
              {/* Actions - Mobile optimized */}
              <div className="flex gap-3 pt-4 border-t border-border-secondary">
                <Button
                  type="button"
                  variant="outline"
                  onClick={onClose}
                  className="flex-1 min-h-[44px] sm:min-h-[40px]"
                  disabled={isSubmitting}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  variant="primary"
                  className="flex-1 min-h-[44px] sm:min-h-[40px]"
                  disabled={!selectedSlot || !reason.trim() || isSubmitting}
                >
                  {isSubmitting ? 'Submitting...' : 'Request Reschedule'}
                </Button>
              </div>
            </form>
          ) : null}
      </DialogBody>
    </Dialog>
  )
}