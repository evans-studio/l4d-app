'use client'

import React, { useState } from 'react'
import { CheckCircle, XCircle } from 'lucide-react'
import { BaseModal } from '../BaseModal'
import { BaseOverlayProps } from '@/lib/overlay/types'
import { Button } from '@/components/ui/primitives/Button'

export const ConfirmBookingModal: React.FC<BaseOverlayProps> = ({
  isOpen,
  onClose,
  data,
  onConfirm
}) => {
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState('')

  const handleConfirm = async () => {
    try {
      setIsSubmitting(true)
      setError('')

      const response = await fetch(`/api/admin/bookings/${data?.bookingId}/confirm`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      })

      const result = await response.json()

      if (result.success) {
        if (onConfirm) {
          await onConfirm(result.data)
        }
        onClose()
      } else {
        setError(result.error?.message || 'Failed to confirm booking')
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
      title="Confirm Booking"
      size="md"
    >
      <div className="space-y-4">
        <div className="flex items-start gap-3">
          <div className="w-10 h-10 rounded-full bg-green-100 flex items-center justify-center flex-shrink-0">
            <CheckCircle className="w-5 h-5 text-green-600" />
          </div>
          <div className="flex-1">
            <h3 className="font-medium text-text-primary mb-2">
              Confirm this booking?
            </h3>
            <p className="text-sm text-text-secondary">
              This will confirm the booking and notify the customer via email. 
              The booking will appear in your schedule and the customer will receive 
              confirmation details.
            </p>
            {data?.bookingReference && (
              <p className="text-xs text-text-muted mt-2">
                Booking: {data.bookingReference}
              </p>
            )}
          </div>
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
            onClick={handleConfirm}
            variant="primary"
            className="flex-1"
            disabled={isSubmitting}
          >
            {isSubmitting ? 'Confirming...' : 'Confirm Booking'}
          </Button>
        </div>
      </div>
    </BaseModal>
  )
}