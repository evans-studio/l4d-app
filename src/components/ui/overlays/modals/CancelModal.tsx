'use client'

import React, { useState, useEffect } from 'react'
import { Calendar, Clock, AlertTriangle, CheckCircle, XCircle } from 'lucide-react'
import { BaseModal } from '../BaseModal'
import { BaseOverlayProps } from '@/lib/overlay/types'
import { Button } from '@/components/ui/primitives/Button'

interface BookingDetails {
  id: string
  booking_reference: string
  scheduled_date: string
  scheduled_start_time: string
  total_price: number
  status: string
  service: {
    name: string
  }
}

interface CancellationPolicy {
  hoursUntilAppointment: number
  canCancelFree: boolean
  refundPercentage: number
  policy: string
}

interface CancelModalProps extends BaseOverlayProps {
  data: {
    bookingId: string
  }
}

export const CancelModal: React.FC<CancelModalProps> = ({
  isOpen,
  onClose,
  data,
  onConfirm
}) => {
  const [booking, setBooking] = useState<BookingDetails | null>(null)
  const [policy, setPolicy] = useState<CancellationPolicy | null>(null)
  const [reason, setReason] = useState('')
  const [isLoading, setIsLoading] = useState(true)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    if (isOpen && data?.bookingId) {
      loadBookingDetails()
    }
  }, [isOpen, data?.bookingId])

  const loadBookingDetails = async () => {
    try {
      setIsLoading(true)
      setError('')
      
      const response = await fetch(`/api/bookings/${data.bookingId}`)
      const result = await response.json()

      if (result.success) {
        const bookingData = result.data
        setBooking(bookingData)
        
        // Calculate cancellation policy
        const appointmentDate = new Date(`${bookingData.scheduled_date}T${bookingData.scheduled_start_time}`)
        const now = new Date()
        const hoursUntil = Math.ceil((appointmentDate.getTime() - now.getTime()) / (1000 * 60 * 60))
        
        // Define cancellation policy logic
        const canCancelFree = hoursUntil >= 24
        const refundPercentage = canCancelFree ? 100 : hoursUntil >= 12 ? 50 : 0
        
        setPolicy({
          hoursUntilAppointment: Math.max(0, hoursUntil),
          canCancelFree,
          refundPercentage,
          policy: canCancelFree 
            ? '24+ hours: Full refund' 
            : hoursUntil >= 12 
            ? '12-24 hours: 50% refund' 
            : 'Less than 12 hours: No refund'
        })
      } else {
        setError(result.error?.message || 'Failed to load booking details')
      }
    } catch (error) {
      setError('Network error occurred')
    } finally {
      setIsLoading(false)
    }
  }

  const handleCancel = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!reason.trim()) {
      setError('Please provide a reason for cancellation')
      return
    }

    try {
      setIsSubmitting(true)
      setError('')

      const response = await fetch(`/api/customer/bookings/${data.bookingId}/cancel`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
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
        setError(result.error?.message || 'Failed to cancel booking')
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
      month: 'long',
      year: 'numeric'
    })
  }

  const formatTime = (timeStr: string) => {
    const [hours, minutes] = timeStr.split(':')
    const hour = parseInt(hours || '0')
    const ampm = hour >= 12 ? 'PM' : 'AM'
    const displayHour = hour % 12 || 12
    return `${displayHour}:${minutes || '00'} ${ampm}`
  }

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('en-GB', {
      style: 'currency',
      currency: 'GBP'
    }).format(price)
  }

  return (
    <BaseModal
      isOpen={isOpen}
      onClose={onClose}
      title="Cancel Booking"
      size="md"
    >
      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-brand-600"></div>
        </div>
      ) : error && !booking ? (
        <div className="text-center py-12">
          <XCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
          <p className="text-red-600 mb-4">{error}</p>
          <Button onClick={loadBookingDetails} variant="outline">
            Try Again
          </Button>
        </div>
      ) : booking && policy ? (
        <form onSubmit={handleCancel} className="space-y-4 sm:space-y-6">
          {/* Cancellation Policy Alert */}
          <div className={`rounded-lg p-3 sm:p-4 border ${
            policy.canCancelFree 
              ? 'bg-green-50 border-green-200' 
              : policy.refundPercentage > 0 
              ? 'bg-yellow-50 border-yellow-200' 
              : 'bg-red-50 border-red-200'
          }`}>
            <div className="flex items-start gap-3">
              {policy.canCancelFree ? (
                <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
              ) : (
                <AlertTriangle className={`w-5 h-5 flex-shrink-0 mt-0.5 ${
                  policy.refundPercentage > 0 ? 'text-yellow-600' : 'text-red-600'
                }`} />
              )}
              <div className={`text-sm ${
                policy.canCancelFree 
                  ? 'text-green-800' 
                  : policy.refundPercentage > 0 
                  ? 'text-yellow-800' 
                  : 'text-red-800'
              }`}>
                <p className="font-medium mb-1">Cancellation Policy</p>
                <div className="space-y-1">
                  <p>Time until appointment: <strong>{policy.hoursUntilAppointment} hours</strong></p>
                  <p>Refund: <strong>{policy.refundPercentage}%</strong></p>
                  <p className="text-xs opacity-90">{policy.policy}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Booking Details */}
          <div className="bg-surface-secondary rounded-lg p-3 sm:p-4 border border-border-secondary">
            <h3 className="font-medium text-text-primary mb-3">Booking Details</h3>
            <div className="space-y-2 text-sm">
              <div className="flex items-center justify-between">
                <span className="text-text-secondary">Reference:</span>
                <span className="font-medium text-xs sm:text-sm">{booking.booking_reference}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-text-secondary">Service:</span>
                <span className="font-medium">{booking.service.name}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-text-secondary">Date:</span>
                <span className="font-medium">{formatDate(booking.scheduled_date)}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-text-secondary">Time:</span>
                <span className="font-medium">{formatTime(booking.scheduled_start_time)}</span>
              </div>
              <div className="flex items-center justify-between border-t border-border-primary pt-2 mt-2">
                <span className="text-text-secondary">Total:</span>
                <span className="font-bold text-lg">{formatPrice(booking.total_price)}</span>
              </div>
            </div>
          </div>

          {/* Reason */}
          <div>
            <label className="block text-sm font-medium text-text-primary mb-2">
              Reason for cancellation *
            </label>
            <textarea
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="Please tell us why you need to cancel..."
              rows={3}
              className="w-full px-3 py-2 border border-border-secondary rounded-lg resize-none focus:ring-2 focus:ring-brand-600/20 focus:border-brand-600 min-h-[80px] touch-manipulation"
              required
            />
          </div>

          {/* Refund Information */}
          {policy.refundPercentage > 0 && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 sm:p-4">
              <div className="flex items-start gap-3">
                <CheckCircle className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
                <div className="text-sm text-blue-800">
                  <p className="font-medium mb-1">Refund Information</p>
                  <p>
                    You will receive <strong>{formatPrice(booking.total_price * policy.refundPercentage / 100)}</strong> 
                    {' '}refund ({policy.refundPercentage}% of total amount).
                  </p>
                  <p className="text-xs mt-1 opacity-90">
                    Refunds are processed within 3-5 business days.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Error */}
          {error && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-red-800 text-sm">
              {error}
            </div>
          )}

          {/* Actions - Mobile optimized */}
          <div className="flex gap-3 pt-4 border-t border-border-secondary sticky bottom-0 bg-surface-primary">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              className="flex-1 min-h-[44px] sm:min-h-[40px]"
              disabled={isSubmitting}
            >
              Keep Booking
            </Button>
            <Button
              type="submit"
              variant="destructive"
              className="flex-1 min-h-[44px] sm:min-h-[40px]"
              disabled={!reason.trim() || isSubmitting}
            >
              {isSubmitting ? 'Cancelling...' : 'Confirm Cancellation'}
            </Button>
          </div>
        </form>
      ) : null}
    </BaseModal>
  )
}