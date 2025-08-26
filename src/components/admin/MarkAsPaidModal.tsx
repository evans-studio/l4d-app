'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/primitives/Button'
import { Input } from '@/components/ui/primitives/Input'
import { Modal, ModalContent, ModalHeader, ModalBody, ModalFooter } from '@/components/ui/composites/Modal'
import { CreditCard, Banknote, Smartphone, Building2, Loader2, CheckCircle } from 'lucide-react'

interface MarkAsPaidModalProps {
  booking: {
    id: string
    booking_reference: string
    customer_name: string
    total_price: number
    payment_status?: string
  }
  open: boolean
  onClose: () => void
  onSuccess?: () => void
  isLoading?: boolean
}

const paymentMethods = [
  {
    id: 'paypal' as const,
    label: 'PayPal',
    icon: Smartphone,
    description: 'PayPal.me payment received'
  }
]

export function MarkAsPaidModal({ 
  booking, 
  open, 
  onClose, 
  onSuccess,
  isLoading = false
}: MarkAsPaidModalProps) {
  const [selectedMethod, setSelectedMethod] = useState<'paypal'>('paypal')
  const [paymentReference, setPaymentReference] = useState(booking.booking_reference)
  const [adminNotes, setAdminNotes] = useState('')
  const [sendConfirmationEmail, setSendConfirmationEmail] = useState(true)
  const [submitLoading, setSubmitLoading] = useState(false)
  const [submitError, setSubmitError] = useState<string | null>(null)

  const handleSubmit = async () => {
    if (submitLoading) return

    setSubmitLoading(true)
    setSubmitError(null)

    try {
      const response = await fetch(`/api/admin/bookings/${booking.id}/mark-paid`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          paymentMethod: selectedMethod,
          paymentReference: paymentReference.trim() || booking.booking_reference,
          adminNotes: adminNotes.trim() || undefined,
          sendConfirmationEmail
        })
      })

      const data = await response.json()

      if (!response.ok || !data.success) {
        throw new Error(data.error?.message || 'Failed to mark booking as paid')
      }

      console.log('✅ Booking marked as paid successfully:', data)
      
      // Reset form
      setPaymentReference(booking.booking_reference)
      setAdminNotes('')
      setSendConfirmationEmail(true)
      
      // Call success callback
      if (onSuccess) {
        onSuccess()
      }
      
      // Close modal
      onClose()

    } catch (error) {
      console.error('❌ Error marking booking as paid:', error)
      setSubmitError(error instanceof Error ? error.message : 'Failed to mark booking as paid')
    } finally {
      setSubmitLoading(false)
    }
  }

  const handleClose = () => {
    if (submitLoading) return // Prevent closing during submission
    setSubmitError(null)
    onClose()
  }

  const selectedMethodInfo = paymentMethods.find(method => method.id === selectedMethod)
  const SelectedMethodIcon = selectedMethodInfo?.icon || CreditCard

  return (
    <Modal open={open} onClose={handleClose} className="z-[60]">
      <ModalContent size="lg" position="center" mobile="fullscreen" onClose={handleClose}>
        <ModalHeader>
          <div>
            <h2 className="text-xl font-semibold text-text-primary">Mark Booking as Paid</h2>
            <p className="text-text-secondary text-sm">
              {booking.booking_reference} • {booking.customer_name} • £{booking.total_price}
            </p>
          </div>
        </ModalHeader>

        <ModalBody>

          {submitError && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-md">
              <p className="text-sm text-red-800">{submitError}</p>
            </div>
          )}

          <div className="space-y-6">
            {/* Payment Method - PayPal Only */}
            <div>
              <label className="block text-sm font-medium text-text-primary mb-3">
                Payment Method
              </label>
              <div className="p-4 border border-border-secondary bg-surface-secondary rounded-lg">
                <div className="flex items-start gap-3">
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-sm text-text-primary">PayPal</p>
                    <p className="text-xs mt-1 text-text-secondary">PayPal.me payment received</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Payment Reference */}
            <div>
              <label className="block text-sm font-medium text-text-primary mb-2">
                Payment Reference
                <span className="text-text-muted font-normal ml-1">(Auto-filled)</span>
              </label>
              <Input
                value={paymentReference}
                onChange={(e) => setPaymentReference(e.target.value)}
                placeholder="Transaction ID, Receipt number, etc."
                disabled={submitLoading}
                className="w-full"
              />
              <p className="text-xs text-text-muted mt-1">
                Pre-filled with booking reference. Update if you have a specific payment reference.
              </p>
            </div>

            {/* Admin Notes */}
            <div>
              <label className="block text-sm font-medium text-text-primary mb-2">
                Admin Notes
                <span className="text-text-muted font-normal ml-1">(Optional)</span>
              </label>
              <textarea
                value={adminNotes}
                onChange={(e) => setAdminNotes(e.target.value)}
                placeholder="Additional notes about the payment..."
                disabled={submitLoading}
                rows={3}
                className="w-full px-3 py-2 border border-border-secondary rounded-md bg-surface-secondary text-text-primary placeholder-text-muted focus:border-brand-400 focus:outline-none focus:ring-2 focus:ring-brand-600/20 disabled:opacity-50 disabled:cursor-not-allowed resize-none"
              />
            </div>

            {/* Confirmation Email */}
            <div className="flex items-center gap-3">
              <input
                type="checkbox"
                id="send-confirmation"
                checked={sendConfirmationEmail}
                onChange={(e) => setSendConfirmationEmail(e.target.checked)}
                disabled={submitLoading}
                className="w-4 h-4 text-brand-600 border-border-secondary rounded focus:ring-brand-600/20 disabled:opacity-50"
              />
              <label htmlFor="send-confirmation" className="text-sm text-text-primary cursor-pointer">
                Send payment confirmation email to customer
              </label>
            </div>
          </div>
        </ModalBody>

        <ModalFooter className="sticky bottom-0 bg-surface-primary">
          <Button
            onClick={handleClose}
            variant="outline"
            disabled={submitLoading}
          >
            Cancel
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={submitLoading || isLoading}
          >
            {submitLoading || isLoading ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Processing...
              </>
            ) : (
              <>Mark as Paid</>
            )}
          </Button>
        </ModalFooter>

        
        {/* Payment Method Summary */}
        <div className="mt-4 p-3 bg-surface-secondary rounded-lg border border-border-secondary">
          <div className="flex items-center gap-2 text-sm">
            <span className="text-text-secondary">
              This will confirm the booking and mark PayPal payment as received
              {sendConfirmationEmail && ', then send confirmation email to customer'}
            </span>
          </div>
        </div>
      </ModalContent>
    </Modal>
  )
}