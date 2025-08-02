'use client'

import React, { useState } from 'react'
import { CalendarCheckIcon, CalendarXIcon, ClockIcon, CalendarIcon } from 'lucide-react'
import { BaseModal } from '../BaseModal'
import { BaseOverlayProps } from '@/lib/overlay/types'
import { Button } from '@/components/ui/primitives/Button'

interface RescheduleActionModalProps extends BaseOverlayProps {
  data?: {
    bookingId: string
    booking: any
    rescheduleRequest: {
      id: string
      requested_date: string
      requested_time: string
      reason: string
      created_at: string
    }
  }
  overlayType?: 'reschedule-approve' | 'reschedule-decline'
}

export const RescheduleActionModal: React.FC<RescheduleActionModalProps> = ({
  isOpen,
  onClose,
  data,
  onConfirm,
  overlayType
}) => {
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState('')
  const [declineNotes, setDeclineNotes] = useState('')

  const isApprove = overlayType === 'reschedule-approve'
  const booking = data?.booking
  const rescheduleRequest = data?.rescheduleRequest

  const formatTime = (time: string) => {
    if (!time) return ''
    const [hours, minutes] = time.split(':')
    const hour = parseInt(hours || '0')
    const ampm = hour >= 12 ? 'PM' : 'AM'
    const displayHour = hour % 12 || 12
    return `${displayHour}:${minutes || '00'} ${ampm}`
  }

  const formatDate = (dateStr: string) => {
    if (!dateStr) return ''
    return new Date(dateStr).toLocaleDateString('en-GB', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    })
  }

  const handleAction = async () => {
    if (!data?.bookingId || !rescheduleRequest?.id) return

    try {
      setIsSubmitting(true)
      setError('')

      const endpoint = isApprove 
        ? `/api/admin/bookings/${data.bookingId}/reschedule/approve`
        : `/api/admin/bookings/${data.bookingId}/reschedule/decline`

      const payload = isApprove
        ? {
            reschedule_request_id: rescheduleRequest.id,
            new_date: rescheduleRequest.requested_date,
            new_time: rescheduleRequest.requested_time
          }
        : {
            reschedule_request_id: rescheduleRequest.id,
            decline_reason: declineNotes
          }

      const response = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      })

      const result = await response.json()

      if (result.success) {
        if (onConfirm) {
          await onConfirm(result.data)
        }
        onClose()
      } else {
        setError(result.error?.message || `Failed to ${isApprove ? 'approve' : 'decline'} reschedule request`)
      }
    } catch (error) {
      setError('Network error occurred')
    } finally {
      setIsSubmitting(false)
    }
  }

  if (!booking || !rescheduleRequest) {
    return null
  }

  return (
    <BaseModal
      isOpen={isOpen}
      onClose={onClose}
      title={isApprove ? 'Approve Reschedule Request' : 'Decline Reschedule Request'}
      size="lg"
    >
      <div className="space-y-6">
        {/* Action Header */}
        <div className="flex items-start gap-3">
          <div className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 ${
            isApprove 
              ? 'bg-green-100 text-green-600' 
              : 'bg-red-100 text-red-600'
          }`}>
            {isApprove ? (
              <CalendarCheckIcon className="w-5 h-5" />
            ) : (
              <CalendarXIcon className="w-5 h-5" />
            )}
          </div>
          <div className="flex-1">
            <h3 className="font-medium text-text-primary mb-2">
              {isApprove ? 'Approve' : 'Decline'} reschedule request for booking #{booking.booking_reference}
            </h3>
            <p className="text-sm text-text-secondary">
              {isApprove 
                ? 'This will update the booking to the new date and time requested by the customer.'
                : 'This will decline the reschedule request and notify the customer that the original booking remains unchanged.'
              }
            </p>
          </div>
        </div>

        {/* Current vs Requested Times */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Current Booking */}
          <div className="bg-surface-tertiary rounded-lg p-4 border border-border-secondary">
            <h4 className="font-medium text-text-primary mb-3 text-sm">Current Booking</h4>
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-sm">
                <CalendarIcon className="w-4 h-4 text-text-secondary" />
                <span className="text-text-primary">
                  {formatDate(booking.scheduled_date)}
                </span>
              </div>
              <div className="flex items-center gap-2 text-sm">
                <ClockIcon className="w-4 h-4 text-text-secondary" />
                <span className="text-text-primary">
                  {formatTime(booking.start_time)}
                </span>
              </div>
            </div>
          </div>

          {/* Requested Time */}
          <div className={`rounded-lg p-4 border ${
            isApprove 
              ? 'bg-green-50 border-green-200' 
              : 'bg-yellow-50 border-yellow-200'
          }`}>
            <h4 className="font-medium text-text-primary mb-3 text-sm">Requested Change</h4>
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-sm">
                <CalendarIcon className="w-4 h-4 text-text-secondary" />
                <span className="text-text-primary">
                  {formatDate(rescheduleRequest.requested_date)}
                </span>
              </div>
              <div className="flex items-center gap-2 text-sm">
                <ClockIcon className="w-4 h-4 text-text-secondary" />
                <span className="text-text-primary">
                  {formatTime(rescheduleRequest.requested_time)}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Customer Reason */}
        {rescheduleRequest.reason && (
          <div className="bg-surface-tertiary rounded-lg p-4 border border-border-secondary">
            <h4 className="font-medium text-text-primary mb-2 text-sm">Customer's Reason</h4>
            <p className="text-sm text-text-secondary italic">
              "{rescheduleRequest.reason}"
            </p>
            <p className="text-xs text-text-muted mt-2">
              Requested on {new Date(rescheduleRequest.created_at).toLocaleDateString('en-GB')}
            </p>
          </div>
        )}

        {/* Decline Notes (only for decline action) */}
        {!isApprove && (
          <div className="space-y-3">
            <div className="space-y-2">
              <label className="text-sm font-medium text-text-primary">
                Decline Reason (Optional)
              </label>
              <textarea
                value={declineNotes}
                onChange={(e) => setDeclineNotes(e.target.value)}
                placeholder="Explain why this reschedule request cannot be accommodated..."
                rows={3}
                className="flex w-full rounded-md border border-border-secondary bg-surface-card px-3 py-2 text-sm text-text-primary placeholder:text-text-muted focus-visible:outline-none focus-visible:border-brand-500 focus-visible:ring-2 focus-visible:ring-brand-500/20 hover:border-border-hover transition-all duration-200 resize-none"
              />
              <p className="text-xs text-text-secondary">
                This message will be sent to the customer
              </p>
            </div>
          </div>
        )}

        {/* Error Display */}
        {error && (
          <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-red-800 text-sm">
            {error}
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex gap-3 pt-4 border-t border-border-secondary">
          <Button
            onClick={onClose}
            variant="outline"
            className="flex-1"
            disabled={isSubmitting}
          >
            Cancel
          </Button>
          <Button
            onClick={handleAction}
            variant={isApprove ? "primary" : "outline"}
            className={`flex-1 ${
              isApprove 
                ? 'bg-green-600 hover:bg-green-700 text-white' 
                : 'text-red-600 border-red-200 hover:bg-red-50'
            }`}
            disabled={isSubmitting}
          >
            {isSubmitting 
              ? (isApprove ? 'Approving...' : 'Declining...')
              : (isApprove ? 'Approve Reschedule' : 'Decline Request')
            }
          </Button>
        </div>
      </div>
    </BaseModal>
  )
}