'use client'

import { Button } from '@/components/ui/primitives/Button'
import { 
  XIcon,
  UserIcon,
  CarIcon,
  ClockIcon,
  PoundSterlingIcon,
  MailIcon,
  PhoneIcon,
  MapPinIcon,
  CheckCircleIcon,
  CircleIcon,
  EyeIcon,
  EyeOffIcon,
  TrashIcon,
  EditIcon
} from 'lucide-react'

interface TimeSlotData {
  id: string
  slot_date: string
  start_time: string
  is_available: boolean
  notes: string | null
  created_at: string
  booking?: {
    id: string
    booking_reference: string
    customer_id: string
    status: string
    scheduled_date: string
    scheduled_start_time: string
    scheduled_end_time: string
    total_price: number
    special_instructions: string | null
    customer_name: string | null
    customer_email: string | null
    customer_phone: string | null
    services: Array<{
      name: string
      description: string | null
    }>
  }
}

interface BookingOverlayProps {
  slot: TimeSlotData
  onClose: () => void
  onUpdate: () => void
}

export function BookingOverlay({ slot, onClose, onUpdate }: BookingOverlayProps) {
  const formatTime = (timeStr: string) => {
    const [hours, minutes] = timeStr.split(':')
    const hour = parseInt(hours || '0')
    const ampm = hour >= 12 ? 'PM' : 'AM'
    const displayHour = hour % 12 || 12
    return `${displayHour}:${minutes || '00'} ${ampm}`
  }

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr)
    return date.toLocaleDateString('en-GB', { 
      weekday: 'long', 
      month: 'long', 
      day: 'numeric' 
    })
  }

  const getEndTime = (startTime: string, duration: number = 90) => {
    const [hours, minutes] = startTime.split(':').map(Number)
    const totalMinutes = (hours || 0) * 60 + (minutes || 0) + duration
    const endHours = Math.floor(totalMinutes / 60)
    const endMinutes = totalMinutes % 60
    return `${endHours.toString().padStart(2, '0')}:${endMinutes.toString().padStart(2, '0')}`
  }

  const handleToggleAvailability = async () => {
    if (slot.booking) return // Can't toggle if booked
    
    try {
      const response = await fetch(`/api/admin/time-slots/${slot.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ is_available: !slot.is_available })
      })

      if (response.ok) {
        onUpdate()
      }
    } catch (error) {
      console.error('Error updating slot:', error)
    }
  }

  const handleDelete = async () => {
    if (!confirm('Delete this time slot?')) return

    try {
      const response = await fetch(`/api/admin/time-slots/${slot.id}`, {
        method: 'DELETE'
      })

      if (response.ok) {
        onUpdate()
      }
    } catch (error) {
      console.error('Error deleting slot:', error)
    }
  }

  const handleContactCustomer = () => {
    if (slot.booking?.customer_email) {
      window.open(`mailto:${slot.booking.customer_email}`)
    }
  }

  const handleCallCustomer = () => {
    if (slot.booking?.customer_phone) {
      window.open(`tel:${slot.booking.customer_phone}`)
    }
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-end sm:items-center justify-center z-50 p-4">
      <div className="bg-[var(--surface-primary)] border border-[var(--border-secondary)] rounded-lg w-full max-w-md max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-[var(--border-secondary)]">
          <h2 className="text-lg font-semibold text-[var(--text-primary)]">
            {formatDate(slot.slot_date)}
          </h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-[var(--surface-hover)] rounded-full transition-colors"
          >
            <XIcon className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-4 space-y-6">
          {/* Time Info */}
          <div className="text-center">
            <div className="text-2xl font-bold text-[var(--text-primary)] mb-1">
              {formatTime(slot.start_time)} - {formatTime(getEndTime(slot.start_time))}
            </div>
            <div className={`inline-flex items-center gap-2 px-3 py-1 rounded-full text-sm font-medium ${
              slot.booking 
                ? 'bg-blue-500/10 text-blue-600 border border-blue-500/20'
                : slot.is_available
                  ? 'bg-green-500/10 text-green-600 border border-green-500/20' 
                  : 'bg-gray-500/10 text-gray-600 border border-gray-500/20'
            }`}>
              {slot.booking ? (
                <>
                  <UserIcon className="w-4 h-4" />
                  Booked
                </>
              ) : slot.is_available ? (
                <>
                  <CheckCircleIcon className="w-4 h-4" />
                  Available
                </>
              ) : (
                <>
                  <CircleIcon className="w-4 h-4" />
                  Blocked
                </>
              )}
            </div>
          </div>

          {/* Booking Details */}
          {slot.booking ? (
            <div className="space-y-4">
              {/* Customer */}
              <div className="flex items-start gap-3">
                <UserIcon className="w-5 h-5 text-[var(--text-secondary)] mt-0.5" />
                <div>
                  <div className="font-semibold text-[var(--text-primary)]">
                    {slot.booking.customer_name}
                  </div>
                  <div className="text-sm text-[var(--text-secondary)]">Customer</div>
                </div>
              </div>

              {/* Service */}
              <div className="flex items-start gap-3">
                <ClockIcon className="w-5 h-5 text-[var(--text-secondary)] mt-0.5" />
                <div>
                  <div className="font-semibold text-[var(--text-primary)]">
                    {slot.booking.services.map(s => s.name).join(', ') || 'No services'}
                  </div>
                  <div className="text-sm text-[var(--text-secondary)]">Service</div>
                </div>
              </div>

              {/* Vehicle */}
              <div className="flex items-start gap-3">
                <CarIcon className="w-5 h-5 text-[var(--text-secondary)] mt-0.5" />
                <div>
                  <div className="font-semibold text-[var(--text-primary)]">
                    {slot.booking.booking_reference}
                  </div>
                  <div className="text-sm text-[var(--text-secondary)]">Vehicle</div>
                </div>
              </div>

              {/* Price */}
              <div className="flex items-start gap-3">
                <PoundSterlingIcon className="w-5 h-5 text-[var(--text-secondary)] mt-0.5" />
                <div>
                  <div className="font-semibold text-[var(--text-primary)] text-lg">
                    £{slot.booking.total_price}
                  </div>
                  <div className="text-sm text-[var(--text-secondary)]">Total Price</div>
                </div>
              </div>

              {/* Status */}
              <div className="flex items-start gap-3">
                <CheckCircleIcon className="w-5 h-5 text-green-600 mt-0.5" />
                <div>
                  <div className="font-semibold text-[var(--text-primary)]">
                    {slot.booking.status}
                  </div>
                  <div className="text-sm text-[var(--text-secondary)]">Booking Status</div>
                </div>
              </div>

              {/* Contact Info */}
              <div className="bg-[var(--surface-secondary)] border border-[var(--border-secondary)] rounded-lg p-4 space-y-3">
                <h4 className="font-semibold text-[var(--text-primary)]">Contact Information</h4>
                
                <div className="flex items-center gap-3">
                  <MailIcon className="w-4 h-4 text-[var(--text-secondary)]" />
                  <button
                    onClick={handleContactCustomer}
                    className="text-brand-600 hover:text-brand-500 text-sm"
                  >
                    {slot.booking.customer_email || 'No email'}
                  </button>
                </div>

                <div className="flex items-center gap-3">
                  <PhoneIcon className="w-4 h-4 text-[var(--text-secondary)]" />
                  <button
                    onClick={handleCallCustomer}
                    className="text-brand-600 hover:text-brand-500 text-sm"
                  >
                    {slot.booking.customer_phone || 'No phone'}
                  </button>
                </div>

                <div className="flex items-start gap-3">
                  <MapPinIcon className="w-4 h-4 text-[var(--text-secondary)] mt-0.5" />
                  <div className="text-sm text-[var(--text-secondary)]">
                    {slot.booking.special_instructions || 'No special instructions'}
                  </div>
                </div>
              </div>

              {/* Booking Actions */}
              <div className="flex gap-3">
                <Button
                  onClick={handleContactCustomer}
                  variant="outline"
                  className="flex-1"
                >
                  Email Customer
                </Button>
                <Button
                  onClick={handleCallCustomer}
                  className="flex-1"
                >
                  Call Customer
                </Button>
              </div>
            </div>
          ) : (
            /* Available Slot Actions */
            <div className="text-center space-y-4">
              <div className="text-[var(--text-secondary)]">
                {slot.is_available 
                  ? "This slot is available for booking"
                  : "This slot is currently blocked"
                }
              </div>

              <div className="flex flex-col gap-3">
                <Button
                  onClick={handleToggleAvailability}
                  variant="outline"
                  className="flex items-center justify-center gap-2"
                >
                  {slot.is_available ? (
                    <>
                      <EyeOffIcon className="w-4 h-4" />
                      Block Slot
                    </>
                  ) : (
                    <>
                      <EyeIcon className="w-4 h-4" />
                      Unblock Slot
                    </>
                  )}
                </Button>

                <Button
                  onClick={handleDelete}
                  variant="outline"
                  className="flex items-center justify-center gap-2 text-red-600 border-red-200 hover:bg-red-50"
                >
                  <TrashIcon className="w-4 h-4" />
                  Delete Slot
                </Button>
              </div>
            </div>
          )}

          {/* Slot Info */}
          {slot.notes && (
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
              <h4 className="font-semibold text-yellow-800 mb-1">Notes</h4>
              <p className="text-yellow-700 text-sm">{slot.notes}</p>
            </div>
          )}

          <div className="text-xs text-[var(--text-muted)] text-center">
            Created {new Date(slot.created_at).toLocaleDateString()}
          </div>
        </div>
      </div>
    </div>
  )
}