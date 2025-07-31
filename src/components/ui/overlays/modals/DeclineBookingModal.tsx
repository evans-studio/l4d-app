'use client'

import React, { useState } from 'react'
import { XCircle } from 'lucide-react'
import { BaseModal } from '../BaseModal'
import { BaseOverlayProps } from '@/lib/overlay/types'
import { Button } from '@/components/ui/primitives/Button'

export const DeclineBookingModal: React.FC<BaseOverlayProps> = ({
  isOpen,
  onClose,
  data,
  onConfirm
}) => {
  const [reason, setReason] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState('')

  const handleDecline = async () => {
    if (!reason.trim()) {
      setError('Please provide a reason for declining this booking')
      return
    }

    try {
      setIsSubmitting(true)
      setError('')

      const response = await fetch(`/api/admin/bookings/${data?.bookingId}/decline`, {
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
        setError(result.error?.message || 'Failed to decline booking')
      }
    } catch (error) {
      setError('Network error occurred')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <BaseModal
      isOpen={isOpen}
      onClose={onClose}
      title="Decline Booking"
      size="md"
    >
      <div className="space-y-4">
        <div className="flex items-start gap-3">
          <div className="w-10 h-10 rounded-full bg-red-100 flex items-center justify-center flex-shrink-0">
            <XCircle className="w-5 h-5 text-red-600" />
          </div>
          <div className="flex-1">
            <h3 className="font-medium text-text-primary mb-2">
              Decline this booking?
            </h3>
            <p className="text-sm text-text-secondary">
              This will decline the booking and notify the customer via email. 
              Please provide a reason so the customer understands why their 
              booking cannot be accommodated.
            </p>
            {data?.bookingReference && (
              <p className="text-xs text-text-muted mt-2">
                Booking: {data.bookingReference}
              </p>
            )}
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-text-primary mb-2">
            Reason for declining *
          </label>
          <textarea
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            placeholder="Please explain why this booking cannot be accommodated..."
            rows={3}
            className="w-full px-3 py-2 border border-border-secondary rounded-lg resize-none focus:ring-2 focus:ring-brand-600/20 focus:border-brand-600"
            required
          />
        </div>

        {error && (
          <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-red-800 text-sm">
            {error}
          </div>
        )}

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
            onClick={handleDecline}
            variant="destructive"
            className="flex-1"
            disabled={!reason.trim() || isSubmitting}
          >
            {isSubmitting ? 'Declining...' : 'Decline Booking'}
          </Button>
        </div>
      </div>
    </BaseModal>
  )
}