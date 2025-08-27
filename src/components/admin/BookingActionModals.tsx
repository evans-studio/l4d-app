'use client'

import { useState } from 'react'
import { X, Check, AlertCircle, Mail, Calendar, Clock, CheckCircle } from 'lucide-react'
import { Button } from '@/components/ui/primitives/Button'
import { Modal, ModalContent, ModalHeader, ModalBody, ModalFooter } from '@/components/ui/composites/Modal'
import { Checkbox } from '@/components/ui/primitives/Checkbox'
import { Textarea, Input } from '@/components/ui/primitives/Input'
import { logger } from '@/lib/utils/logger'

interface Booking {
  id: string
  booking_reference: string
  customer_id: string
  customer_name: string
  customer_email: string
  customer_phone?: string
  scheduled_date: string
  start_time: string
  status: 'pending' | 'processing' | 'payment_failed' | 'confirmed' | 'rescheduled' | 'in_progress' | 'completed' | 'cancelled' | 'declined' | 'no_show'
  total_price: number
  special_instructions?: string
  services: Array<{
    name: string
    base_price: number
  }>
  vehicle: {
    make: string
    model: string
    year?: number
    color?: string
  }
  address: {
    address_line_1: string
    city: string
    postal_code: string
  }
  created_at: string
}

interface ConfirmModalProps {
  booking: Booking
  open: boolean
  onClose: () => void
  onConfirm: (sendEmail: boolean) => Promise<void>
  isLoading?: boolean
}

export function ConfirmBookingModal({
  booking,
  open,
  onClose,
  onConfirm,
  isLoading = false
}: ConfirmModalProps) {
  const [sendEmail, setSendEmail] = useState(true)

  const formatTime = (time?: string) => {
    if (!time || typeof time !== 'string') return ''
    const [hours, minutes] = time.split(':')
    const hour = parseInt(hours || '0')
    const ampm = hour >= 12 ? 'PM' : 'AM'
    const displayHour = hour % 12 || 12
    return `${displayHour}:${minutes || '00'} ${ampm}`
  }

  const formatDate = (dateStr?: string) => {
    if (!dateStr) return ''
    const date = new Date(dateStr)
    const today = new Date()
    const tomorrow = new Date(today)
    tomorrow.setDate(today.getDate() + 1)
    
    if (date.toDateString() === today.toDateString()) {
      return 'Today'
    } else if (date.toDateString() === tomorrow.toDateString()) {
      return 'Tomorrow'
    } else {
      return date.toLocaleDateString('en-GB', {
        weekday: 'short',
        month: 'short',
        day: 'numeric'
      })
    }
  }

  const handleConfirm = async () => {
    await onConfirm(sendEmail)
  }

  return (
    <Modal open={open} onClose={onClose}>
      <ModalContent size="md" onClose={onClose} className="bg-surface-primary border border-border-secondary max-h-[90vh] overflow-y-auto">
        <ModalHeader title="Confirm Booking?" className="border-border-secondary" />
        <ModalBody className="bg-surface-primary">
          <div className="space-y-6">
        {/* Booking Details */}
        <div className="bg-surface-secondary border border-border-secondary rounded-lg p-4 space-y-3">
          <div className="flex justify-between items-start">
            <span className="text-sm text-text-secondary">Booking:</span>
            <span className="font-medium text-text-primary">#{booking.booking_reference || booking.id}</span>
          </div>
          
          <div className="flex justify-between items-start">
            <span className="text-sm text-text-secondary">Customer:</span>
            <span className="font-medium text-text-primary">{booking.customer_name}</span>
          </div>
          
          <div className="flex justify-between items-start">
            <span className="text-sm text-text-secondary">Service:</span>
            <span className="font-medium text-text-primary">{booking.services?.[0]?.name || ''}</span>
          </div>
          
          <div className="flex justify-between items-start">
            <span className="text-sm text-text-secondary">Vehicle:</span>
            <span className="font-medium text-text-primary">
              {booking.vehicle?.make && booking.vehicle?.model
                ? `${booking.vehicle.make} ${booking.vehicle.model}`
                : ''}
            </span>
          </div>
          
          <div className="flex justify-between items-start">
            <span className="text-sm text-text-secondary">Date:</span>
            <span className="font-medium text-text-primary">
              {formatDate(booking.scheduled_date)} at {formatTime(booking.start_time)}
            </span>
          </div>
        </div>

        {/* Email Option */}
        <div className="flex items-center space-x-3">
          <Checkbox
            checked={sendEmail}
            onCheckedChange={setSendEmail}
            id="send-confirmation-email"
          />
          <label 
            htmlFor="send-confirmation-email"
            className="text-sm text-text-primary flex items-center gap-2 cursor-pointer"
          >
            <Mail className="w-4 h-4" />
            Send confirmation email to customer
          </label>
        </div>

          </div>
        </ModalBody>
        <ModalFooter className="bg-surface-primary border-border-secondary">
          <Button
            onClick={onClose}
            variant="outline"
            disabled={isLoading}
            className="border-border-secondary text-text-primary hover:bg-surface-hover"
          >
            Back
          </Button>
          <Button
            onClick={handleConfirm}
            className="bg-success-600 hover:bg-success-700 text-white"
            disabled={isLoading}
          >
            {isLoading ? (
              <div className="flex items-center gap-2">
                <div className="animate-spin w-4 h-4 border-2 border-white border-t-transparent rounded-full" />
                Confirming...
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <Check className="w-4 h-4" />
                Confirm Booking
              </div>
            )}
          </Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  )
}

interface DeclineModalProps {
  booking: Booking
  open: boolean
  onClose: () => void
  onDecline: (reason: string, customReason?: string, notes?: string) => Promise<void>
  isLoading?: boolean
}

export function DeclineBookingModal({
  booking,
  open,
  onClose,
  onDecline,
  isLoading = false
}: DeclineModalProps) {
  const [selectedReason, setSelectedReason] = useState('')
  const [customReason, setCustomReason] = useState('')
  const [additionalNotes, setAdditionalNotes] = useState('')

  const declineReasons = [
    { value: 'no_availability', label: 'No availability' },
    { value: 'service_unavailable', label: 'Service not available' },
    { value: 'location_too_far', label: 'Location too far' },
    { value: 'weather_conditions', label: 'Weather conditions' },
    { value: 'other', label: 'Other' }
  ]

  const handleDecline = async () => {
    if (!selectedReason) return
    
    const finalReason = selectedReason === 'other' ? customReason : 
      declineReasons.find(r => r.value === selectedReason)?.label || selectedReason
    
    await onDecline(finalReason, customReason, additionalNotes)
  }

  const isValid = selectedReason && (selectedReason !== 'other' || customReason.trim())

  return (
    <Modal open={open} onClose={onClose}>
      <ModalContent size="md" onClose={onClose} className="max-h-[90vh] overflow-y-auto">
        <ModalHeader title="Decline Booking?" />
        <ModalBody>
          <div className="space-y-6">
        {/* Warning */}
        <div className="flex items-start gap-3 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
          <AlertCircle className="w-5 h-5 text-yellow-600 flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-medium text-yellow-800">
              This will decline booking #{booking.booking_reference}
            </p>
            <p className="text-xs text-yellow-700 mt-1">
              The customer will be notified and the time slot will become available again.
            </p>
          </div>
        </div>

        {/* Reason Selection */}
        <div className="space-y-3">
          <label className="text-sm font-medium text-text-primary">
            Please provide a reason: <span className="text-red-500">*</span>
          </label>
          
          <div className="space-y-2">
            {declineReasons.map((reason) => (
              <label key={reason.value} className="flex items-center space-x-3 cursor-pointer py-2 px-3 rounded-lg hover:bg-surface-hover transition-colors min-h-[44px] touch-manipulation">
                <input
                  type="radio"
                  name="decline-reason"
                  value={reason.value}
                  checked={selectedReason === reason.value}
                  onChange={(e) => setSelectedReason(e.target.value)}
                  className="w-4 h-4 text-brand-500 border-gray-300 focus:ring-brand-500"
                />
                <span className="text-sm text-text-primary">{reason.label}</span>
              </label>
            ))}
          </div>

          {/* Custom Reason Input */}
          {selectedReason === 'other' && (
            <div className="mt-3">
              <input
                type="text"
                placeholder="Please specify..."
                value={customReason}
                onChange={(e) => setCustomReason(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:ring-brand-500 focus:border-brand-500"
                autoFocus
              />
            </div>
          )}
        </div>

        {/* Additional Notes */}
        <div className="space-y-2">
          <label className="text-sm font-medium text-text-primary">
            Additional notes (optional):
          </label>
          <Textarea
            value={additionalNotes}
            onChange={(e) => setAdditionalNotes(e.target.value)}
            placeholder="Any additional information for the customer..."
            rows={3}
            className="resize-none"
          />
        </div>

          </div>
        </ModalBody>
        <ModalFooter>
          <Button
            onClick={onClose}
            variant="outline"
            disabled={isLoading}
          >
            Back
          </Button>
          <Button
            onClick={handleDecline}
            variant="outline"
            className="text-red-600 border-red-200 hover:bg-red-50"
            disabled={isLoading || !isValid}
          >
            {isLoading ? (
              <div className="flex items-center gap-2">
                <div className="animate-spin w-4 h-4 border-2 border-red-600 border-t-transparent rounded-full" />
                Declining...
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <X className="w-4 h-4" />
                Decline Booking
              </div>
            )}
          </Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  )
}

interface RescheduleModalProps {
  booking: Booking
  open: boolean
  onClose: () => void
  onReschedule: (newDate: string, newTime: string, reason?: string) => Promise<void>
  isLoading?: boolean
}

export function RescheduleBookingModal({
  booking,
  open,
  onClose,
  onReschedule,
  isLoading = false
}: RescheduleModalProps) {
  const [selectedDate, setSelectedDate] = useState('')
  const [selectedSlot, setSelectedSlot] = useState<{id: string, time: string} | null>(null)
  const [availableSlots, setAvailableSlots] = useState<any[]>([])
  const [slotsLoading, setSlotsLoading] = useState(false)
  const [reason, setReason] = useState('')

  const formatTime = (time: string) => {
    const [hours, minutes] = time.split(':')
    const hour = parseInt(hours || '0')
    const ampm = hour >= 12 ? 'PM' : 'AM'
    const displayHour = hour % 12 || 12
    return `${displayHour}:${minutes || '00'} ${ampm}`
  }

  const formatDate = (dateStr: string): string => {
    const date = new Date(dateStr)
    const today = new Date()
    const tomorrow = new Date(today)
    tomorrow.setDate(today.getDate() + 1)
    
    if (date.toDateString() === today.toDateString()) {
      return 'Today'
    } else if (date.toDateString() === tomorrow.toDateString()) {
      return 'Tomorrow'
    } else {
      return date.toLocaleDateString('en-GB', {
        weekday: 'short',
        month: 'short',
        day: 'numeric'
      }) || dateStr
    }
  }

  const fetchAvailableSlots = async (date: string) => {
    setSlotsLoading(true)
    try {
      const response = await fetch(`/api/time-slots/availability?date=${date}`)
      const data = await response.json()
      
      if (data.success && data.data) {
        setAvailableSlots(data.data)
      } else {
        setAvailableSlots([])
      }
    } catch (error) {
      logger.error('Error fetching slots:', error)
      setAvailableSlots([])
    } finally {
      setSlotsLoading(false)
    }
  }

  const handleDateChange = (date: string) => {
    setSelectedDate(date)
    setSelectedSlot(null)
    if (date) {
      fetchAvailableSlots(date)
    }
  }

  const handleSlotSelect = (slotId: string, startTime: string) => {
    setSelectedSlot({ id: slotId, time: startTime })
  }

  const handleReschedule = async () => {
    if (!selectedDate || !selectedSlot) return
    await onReschedule(selectedDate, selectedSlot.time, reason)
  }

  const isValid = selectedDate && selectedSlot

  // Generate next 14 days for date selection
  const generateDateOptions = () => {
    const dates = []
    const today = new Date()
    
    for (let i = 1; i <= 14; i++) {
      const date = new Date(today)
      date.setDate(today.getDate() + i)
      const dateString = date.toISOString().split('T')[0]!
      
      dates.push({
        value: dateString,
        label: formatDate(dateString),
        shortLabel: date.toLocaleDateString('en-GB', { 
          day: 'numeric', 
          month: 'short' 
        }) || dateString
      })
    }
    
    return dates
  }

  const dateOptions = generateDateOptions()

  return (
    <Modal open={open} onClose={onClose}>
      <ModalContent size="lg" onClose={onClose} className="bg-surface-primary border border-border-secondary max-h-[90vh] overflow-y-auto">
        <ModalHeader title="Reschedule Booking" className="border-border-secondary" />
        <ModalBody className="bg-surface-primary">
          <div className="space-y-6">
            {/* Current Booking Details */}
            <div className="bg-surface-secondary border border-border-secondary rounded-xl p-5">
              <div className="flex items-start gap-3">
                <div className="p-2 bg-brand-600/10 rounded-lg border border-brand-600/20">
                  <Calendar className="w-5 h-5 text-brand-600" />
                </div>
                <div className="flex-1">
                  <h4 className="font-semibold text-text-primary mb-2">Current Appointment</h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
                    <div>
                      <span className="text-text-secondary">Date & Time:</span>
                      <p className="font-medium text-text-primary">
                        {formatDate(booking.scheduled_date || (booking as unknown as { date?: string }).date || '')} at {formatTime(booking.start_time || (booking as unknown as { startTime?: string }).startTime || '')}
                      </p>
                    </div>
                    <div>
                      <span className="text-text-secondary">Customer:</span>
                      <p className="font-medium text-text-primary">{booking.customer_name}</p>
                    </div>
                    <div>
                      <span className="text-text-secondary">Reference:</span>
                      <p className="font-medium text-text-primary">#{booking.booking_reference || booking.id}</p>
                    </div>
                    <div>
                      <span className="text-text-secondary">Service:</span>
                      <p className="font-medium text-text-primary">{booking.services?.[0]?.name || ''}</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* New Date Selection */}
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <Calendar className="w-5 h-5 text-brand-600" />
                <h4 className="font-semibold text-text-primary">Select New Date</h4>
                <span className="text-error-500 text-sm">*</span>
              </div>
              
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
                {dateOptions.map((date) => (
                  <button
                    key={date.value}
                    onClick={() => handleDateChange(date.value)}
                    className={`p-3 rounded-lg border text-center transition-all duration-200 ${
                      selectedDate === date.value
                        ? 'bg-brand-600 text-white border-brand-600 shadow-purple-lg'
                        : 'bg-surface-secondary border-border-secondary hover:border-brand-400 hover:bg-brand-600/10 text-text-primary'
                    }`}
                  >
                    <div className="text-sm font-medium">{date.shortLabel}</div>
                    <div className="text-xs opacity-75">{date.value.split('-')[2]}</div>
                  </button>
                ))}
              </div>
            </div>

            {/* Available Time Slots */}
            {selectedDate && (
              <div className="space-y-4">
                <div className="flex items-center gap-2">
                  <Clock className="w-5 h-5 text-brand-600" />
                  <h4 className="font-semibold text-text-primary">Available Time Slots</h4>
                  <span className="text-error-500 text-sm">*</span>
                </div>

                {slotsLoading ? (
                  <div className="flex items-center justify-center py-8">
                    <div className="animate-spin w-6 h-6 border-2 border-brand-600 border-t-transparent rounded-full" />
                    <span className="ml-3 text-text-secondary">Loading available slots...</span>
                  </div>
                ) : availableSlots.length > 0 ? (
                  <div>
                    <div className="mb-3 text-sm text-text-secondary">
                      {availableSlots.filter(slot => slot.is_available === true).length} available slots
                    </div>
                    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
                      {availableSlots
                        .filter(slot => slot.is_available === true)
                        .map((slot) => (
                          <button
                            key={slot.id}
                            onClick={() => handleSlotSelect(slot.id, slot.start_time)}
                            className={`p-4 rounded-lg border text-center transition-all duration-200 ${
                              selectedSlot?.id === slot.id
                                ? 'bg-success-600 text-white border-success-600 shadow-lg'
                                : 'bg-surface-secondary border-border-secondary hover:border-success-400 hover:bg-success-600/10 text-text-primary'
                            }`}
                          >
                            <Clock className="w-4 h-4 mx-auto mb-1" />
                            <div className="text-sm font-medium">
                              {formatTime(slot.start_time)}
                            </div>
                          </button>
                        ))}
                    </div>
                    {availableSlots.filter(slot => slot.is_available === true).length === 0 && (
                      <div className="text-center py-4 bg-surface-secondary rounded-lg border border-border-secondary">
                        <p className="text-text-secondary">All slots are booked for this date</p>
                        <p className="text-xs text-text-muted">Try selecting a different date</p>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="text-center py-8 bg-surface-secondary rounded-lg border border-border-secondary">
                    <AlertCircle className="w-8 h-8 mx-auto mb-2 text-text-muted" />
                    <p className="text-text-secondary">No available slots for this date</p>
                    <p className="text-sm text-text-muted">Please try selecting a different date</p>
                  </div>
                )}
              </div>
            )}

            {/* Selected Slot Preview */}
            {selectedDate && selectedSlot && (
              <div className="bg-success-600/10 border border-success-600/20 rounded-lg p-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-success-600/10 rounded-lg border border-success-600/20">
                    <CheckCircle className="w-5 h-5 text-success-600" />
                  </div>
                  <div>
                    <p className="font-semibold text-text-primary">New Appointment Selected</p>
                    <p className="text-sm text-text-secondary">
                      {formatDate(selectedDate)} at {formatTime(selectedSlot.time)}
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Reason for Reschedule */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-text-primary flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-text-muted" />
                Reason for reschedule (optional):
              </label>
              <Textarea
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                placeholder="e.g., Schedule conflict, weather conditions, customer request..."
                rows={3}
                className="resize-none bg-surface-secondary border-border-secondary text-text-primary placeholder:text-text-muted focus:border-brand-600 focus:ring-brand-600/20"
              />
            </div>

            {/* Warning Notice */}
            <div className="flex items-start gap-3 p-4 bg-warning-600/10 border border-warning-600/20 rounded-lg">
              <AlertCircle className="w-5 h-5 text-warning-600 flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-medium text-text-primary">
                  Customer notification
                </p>
                <p className="text-xs text-text-secondary mt-1">
                  The customer will receive an email notification about the new appointment time. The original time slot will be freed up for other bookings.
                </p>
              </div>
            </div>
          </div>
        </ModalBody>
        <ModalFooter className="bg-surface-primary border-border-secondary">
          <Button
            onClick={onClose}
            variant="outline"
            disabled={isLoading}
            className="border-border-secondary text-text-primary hover:bg-surface-hover"
          >
            Cancel
          </Button>
          <Button
            onClick={handleReschedule}
            className="bg-brand-600 hover:bg-brand-700 text-white shadow-purple-lg"
            disabled={isLoading || !isValid}
          >
            {isLoading ? (
              <div className="flex items-center gap-2">
                <div className="animate-spin w-4 h-4 border-2 border-white border-t-transparent rounded-full" />
                Rescheduling...
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <Calendar className="w-4 h-4" />
                Reschedule Booking
              </div>
            )}
          </Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  )
}

interface CancelModalProps {
  booking: Booking
  open: boolean
  onClose: () => void
  onCancel: (reason: string, refundAmount?: number, notes?: string) => Promise<void>
  isLoading?: boolean
}

export function CancelBookingModal({
  booking,
  open,
  onClose,
  onCancel,
  isLoading = false
}: CancelModalProps) {
  const [reason, setReason] = useState('')
  const [customReason, setCustomReason] = useState('')
  const [refundAmount, setRefundAmount] = useState<number | undefined>()
  const [additionalNotes, setAdditionalNotes] = useState('')

  const cancelReasons = [
    { value: 'customer_request', label: 'Customer requested cancellation' },
    { value: 'weather_conditions', label: 'Unsuitable weather conditions' },
    { value: 'vehicle_issues', label: 'Vehicle access issues' },
    { value: 'emergency', label: 'Emergency situation' },
    { value: 'no_show', label: 'Customer no-show' },
    { value: 'other', label: 'Other' }
  ]

  const handleCancel = async () => {
    if (!reason) return
    
    const finalReason = reason === 'other' ? customReason : 
      cancelReasons.find(r => r.value === reason)?.label || reason
    
    await onCancel(finalReason, refundAmount, additionalNotes)
  }

  const isValid = reason && (reason !== 'other' || customReason.trim())

  return (
    <Modal open={open} onClose={onClose}>
      <ModalContent size="md" onClose={onClose} className="max-h-[90vh] overflow-y-auto">
        <ModalHeader title="Cancel Booking?" />
        <ModalBody>
          <div className="space-y-6">
            {/* Warning */}
            <div className="flex items-start gap-3 p-4 bg-red-50 border border-red-200 rounded-lg">
              <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-medium text-red-800">
                  This will cancel booking #{booking.booking_reference}
                </p>
                <p className="text-xs text-red-700 mt-1">
                  The customer will be notified and the time slot will become available again.
                </p>
              </div>
            </div>

            {/* Booking Summary */}
            <div className="bg-surface-secondary rounded-lg p-4 space-y-2">
              <h4 className="font-medium text-text-primary">Booking Summary</h4>
              <div className="text-sm text-text-secondary">
                <p><span className="font-medium">Customer:</span> {booking.customer_name}</p>
                <p><span className="font-medium">Service:</span> {booking.services?.[0]?.name || ''}</p>
                <p><span className="font-medium">Vehicle:</span> {
                  booking.vehicle?.make && booking.vehicle?.model
                    ? `${booking.vehicle.make} ${booking.vehicle.model}`
                    : ''
                }</p>
              </div>
            </div>

            {/* Cancellation Reason */}
            <div className="space-y-3">
              <label className="text-sm font-medium text-text-primary">
                Reason for cancellation: <span className="text-red-500">*</span>
              </label>
              
              <div className="space-y-2">
                {cancelReasons.map((cancelReason) => (
                  <label key={cancelReason.value} className="flex items-center space-x-3 cursor-pointer">
                    <input
                      type="radio"
                      name="cancel-reason"
                      value={cancelReason.value}
                      checked={reason === cancelReason.value}
                      onChange={(e) => setReason(e.target.value)}
                      className="w-4 h-4 text-brand-500 border-gray-300 focus:ring-brand-500"
                    />
                    <span className="text-sm text-text-primary">{cancelReason.label}</span>
                  </label>
                ))}
              </div>

              {/* Custom Reason Input */}
              {reason === 'other' && (
                <div className="mt-3">
                  <Input
                    type="text"
                    placeholder="Please specify..."
                    value={customReason}
                    onChange={(e) => setCustomReason(e.target.value)}
                    className="w-full"
                    autoFocus
                  />
                </div>
              )}
            </div>

            {/* Refund Amount */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-text-primary">
                Refund amount (optional):
              </label>
              <Input
                type="number"
                placeholder="0.00"
                value={refundAmount || ''}
                onChange={(e) => setRefundAmount(e.target.value ? parseFloat(e.target.value) : undefined)}
                className="w-full"
                min="0"
                max={booking.total_price}
                step="0.01"
              />
              <p className="text-xs text-text-secondary">
                Leave empty for no refund. Maximum: £{booking.total_price}
              </p>
            </div>

            {/* Additional Notes */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-text-primary">
                Additional notes (optional):
              </label>
              <Textarea
                value={additionalNotes}
                onChange={(e) => setAdditionalNotes(e.target.value)}
                placeholder="Any additional information for the customer or internal records..."
                rows={3}
                className="resize-none"
              />
            </div>
          </div>
        </ModalBody>
        <ModalFooter>
          <Button
            onClick={onClose}
            variant="outline"
            disabled={isLoading}
          >
            Back
          </Button>
          <Button
            onClick={handleCancel}
            variant="outline"
            className="text-red-600 border-red-200 hover:bg-red-50"
            disabled={isLoading || !isValid}
          >
            {isLoading ? (
              <div className="flex items-center gap-2">
                <div className="animate-spin w-4 h-4 border-2 border-red-600 border-t-transparent rounded-full" />
                Cancelling...
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <X className="w-4 h-4" />
                Cancel Booking
              </div>
            )}
          </Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  )
}

interface CompleteModalProps {
  booking: Booking
  open: boolean
  onClose: () => void
  onComplete: (notes: string) => Promise<void>
  isLoading?: boolean
}

export function CompleteBookingModal({
  booking,
  open,
  onClose,
  onComplete,
  isLoading = false
}: CompleteModalProps) {
  const [notes, setNotes] = useState('')

  const handleComplete = async () => {
    await onComplete(notes || '')
  }

  return (
    <Modal open={open} onClose={onClose}>
      <ModalContent size="md" onClose={onClose} className="max-h-[90vh] overflow-y-auto">
        <ModalHeader title="Complete Booking" />
        <ModalBody>
          <div className="space-y-6">
            <div className="bg-surface-secondary rounded-lg p-4 space-y-2">
              <h4 className="font-medium text-text-primary">Completion Details</h4>
              <div className="text-sm text-text-secondary">
                <p><span className="font-medium">Customer:</span> {booking.customer_name}</p>
                <p><span className="font-medium">Service:</span> {booking.services?.[0]?.name || ''}</p>
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-text-primary" htmlFor="completion-notes">
                Completion Notes
              </label>
              <Textarea
                id="completion-notes"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Add any notes about the completed service..."
                rows={3}
                className="resize-none"
              />
            </div>
          </div>
        </ModalBody>
        <ModalFooter>
          <Button onClick={onClose} variant="outline" disabled={isLoading}>
            Cancel
          </Button>
          <Button onClick={handleComplete} disabled={isLoading}>
            {isLoading ? (
              <div className="flex items-center gap-2">
                <div className="animate-spin w-4 h-4 border-2 border-white border-t-transparent rounded-full" />
                Completing...
              </div>
            ) : (
              'Complete Booking'
            )}
          </Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  )
}

// Aggregator component expected by tests
export interface BookingActionModalsProps {
  booking: Booking
  isConfirmOpen?: boolean
  isCancelOpen?: boolean
  isRescheduleOpen?: boolean
  isCompleteOpen?: boolean
  onClose: () => void
  onConfirm: (bookingId: string) => void | Promise<void>
  onCancel: (bookingId: string, reason: string) => void | Promise<void>
  onReschedule: (bookingId: string, payload: { date: string; time: string }) => void | Promise<void>
  onComplete: (bookingId: string, notes: string) => void | Promise<void>
}

export function BookingActionModals({
  booking,
  isConfirmOpen = false,
  isCancelOpen = false,
  isRescheduleOpen = false,
  isCompleteOpen = false,
  onClose,
  onConfirm,
  onCancel,
  onReschedule,
  onComplete,
}: BookingActionModalsProps) {
  return (
    <>
      <ConfirmBookingModal
        booking={booking}
        open={isConfirmOpen}
        onClose={onClose}
        onConfirm={async () => { await onConfirm(booking.id) }}
      />

      <CancelBookingModal
        booking={booking}
        open={isCancelOpen}
        onClose={onClose}
        onCancel={async (reason: string) => { await onCancel(booking.id, reason) }}
      />

      <RescheduleBookingModal
        booking={booking}
        open={isRescheduleOpen}
        onClose={onClose}
        onReschedule={async (newDate: string, newTime: string) => {
          await onReschedule(booking.id, { date: newDate, time: newTime })
        }}
      />

      <CompleteBookingModal
        booking={booking}
        open={isCompleteOpen}
        onClose={onClose}
        onComplete={async (notes: string) => { await onComplete(booking.id, notes) }}
      />
    </>
  )
}