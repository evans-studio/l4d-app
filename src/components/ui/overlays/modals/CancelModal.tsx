'use client'

import React, { useState, useEffect } from 'react'
import { Calendar, Clock, AlertTriangle, CheckCircle, XCircle } from 'lucide-react'
import { Modal, ModalContent, ModalHeader, ModalBody, ModalFooter } from '@/components/ui/composites/Modal'
import { BaseOverlayProps } from '@/lib/overlay/types'
import { Button } from '@/components/ui/primitives/Button'
import { Alert, AlertDescription } from '@/components/ui/primitives/Alert'

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
  const [acknowledgeNoRefund, setAcknowledgeNoRefund] = useState(false)

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

    // Require explicit acknowledgment if within 24 hours (no refund)
    const requiresNoRefundAck = policy ? !policy.canCancelFree : false
    if (requiresNoRefundAck && !acknowledgeNoRefund) {
      setError('Please acknowledge the 24-hour no-refund policy to continue')
      return
    }

    try {
      setIsSubmitting(true)
      setError('')

      const response = await fetch(`/api/customer/bookings/${data.bookingId}/cancel`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          reason: reason.trim(),
          acknowledgeNoRefund: requiresNoRefundAck ? acknowledgeNoRefund : false
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
    <Modal open={isOpen} onClose={onClose}>
      <ModalContent size="md" mobile="fullscreen" onClose={onClose}>
        <ModalHeader title="Cancel Booking" />
        
        <ModalBody scrollable maxHeight="60vh">
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-brand-600"></div>
            </div>
          ) : error && !booking ? (
            <div className="text-center py-12">
              <Alert variant="error">
                <AlertDescription>
                  <div className="flex flex-col items-center space-y-4">
                    <XCircle className="w-12 h-12 text-red-500" />
                    <p>{error}</p>
                    <Button onClick={loadBookingDetails} variant="outline">
                      Try Again
                    </Button>
                  </div>
                </AlertDescription>
              </Alert>
            </div>
          ) : booking && policy ? (
            <form id="cancel-form" onSubmit={handleCancel} className="space-y-4 sm:space-y-6">
              {/* Cancellation Policy Alert */}
              <Alert variant={policy.canCancelFree ? 'success' : policy.refundPercentage > 0 ? 'warning' : 'error'}>
                <AlertDescription>
                  <div className="space-y-2">
                    <p className="font-medium">Cancellation Policy</p>
                    <div className="space-y-1 text-sm">
                      <p>Time until appointment: <strong>{policy.hoursUntilAppointment} hours</strong></p>
                      <p>Refund: <strong>{policy.refundPercentage}%</strong></p>
                      <p className="text-xs opacity-90">{policy.policy}</p>
                    </div>
                  </div>
                </AlertDescription>
              </Alert>

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
                <Alert variant="info">
                  <AlertDescription>
                    <div className="space-y-2">
                      <p className="font-medium">Refund Information</p>
                      <p>
                        You will receive <strong>{formatPrice(booking.total_price * policy.refundPercentage / 100)}</strong> 
                        {' '}refund ({policy.refundPercentage}% of total amount).
                      </p>
                      <p className="text-xs opacity-90">
                        Refunds are processed within 3-5 business days.
                      </p>
                    </div>
                  </AlertDescription>
                </Alert>
              )}

              {/* 24-hour policy acknowledgment */}
              {!policy.canCancelFree && (
                <div className="p-3 border border-yellow-200 bg-yellow-50 rounded-md">
                  <label className="flex items-start gap-3 text-sm">
                    <input
                      type="checkbox"
                      className="mt-1 w-4 h-4"
                      checked={acknowledgeNoRefund}
                      onChange={(e) => setAcknowledgeNoRefund(e.target.checked)}
                    />
                    <span className="text-yellow-800">
                      I understand this booking is within 24 hours and no refund will be provided upon cancellation.
                    </span>
                  </label>
                </div>
              )}

              {/* Error */}
              {error && (
                <Alert variant="error">
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}

            </form>
          ) : null}
        </ModalBody>

        {/* Footer with actions only when booking is loaded */}
        {booking && policy && (
          <ModalFooter className="sticky bottom-0 bg-surface-primary">
            <Button
              variant="outline"
              onClick={onClose}
              disabled={isSubmitting}
              fullWidth
              className="sm:w-auto"
            >
              Keep Booking
            </Button>
            <Button
              type="submit"
              form="cancel-form"
              variant="destructive"
              disabled={!reason.trim() || isSubmitting}
              loading={isSubmitting}
              loadingText="Cancelling..."
              fullWidth
              className="sm:w-auto"
            >
              Confirm Cancellation
            </Button>
          </ModalFooter>
        )}
      </ModalContent>
    </Modal>
  )
}