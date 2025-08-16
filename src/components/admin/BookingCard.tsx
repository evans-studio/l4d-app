'use client'

import { useRouter } from 'next/navigation'
import { useOverlay } from '@/lib/overlay/context'
import { Button } from '@/components/ui/primitives/Button'
import { 
  CheckCircleIcon,
  XCircleIcon,
  EyeIcon,
  ClockIcon,
  CalendarIcon,
  UsersIcon,
  PhoneIcon,
  MailIcon,
  AlertCircleIcon,
  CalendarCheckIcon,
  CalendarXIcon,
  CreditCard,
  AlertTriangle,
  Copy
} from 'lucide-react'

interface BookingCardProps {
  booking: {
    id: string
    booking_reference: string
    customer_name: string
    customer_email: string
    customer_phone?: string
    scheduled_date: string
    start_time: string
    status: 'pending' | 'confirmed' | 'rescheduled' | 'in_progress' | 'completed' | 'cancelled' | 'no_show' | 'processing' | 'payment_failed' | 'declined'
    payment_status?: 'pending' | 'paid' | 'failed' | 'refunded'
    payment_method?: string
    payment_deadline?: string
    payment_link?: string
    total_price: number
    services: Array<{
      name: string
      base_price?: number
    }>
    vehicle: {
      make: string
      model: string
      year?: number
      color?: string
    }
    address?: {
      city: string
      postal_code: string
    }
    special_instructions?: string
    has_pending_reschedule?: boolean
    reschedule_request?: {
      id: string
      requested_date: string
      requested_time: string
      reason: string
      created_at: string
    } | null
  }
  onStatusUpdate?: (bookingId: string, newStatus: string) => Promise<void>
  onMarkAsPaid?: (booking: BookingCardProps['booking']) => void
  onConfirm?: () => void
  onDecline?: () => void
  onReschedule?: () => void
  onCancel?: () => void
  formatTime?: (time: string) => string
  formatDate?: (date: string) => string
  statusUpdateLoading?: string | null
  showActions?: boolean
  variant?: 'dashboard' | 'full'
}

const statusConfig = {
  pending: {
    label: 'Pending Payment',
    icon: ClockIcon,
    color: 'text-brand-600',
    bgColor: 'bg-brand-50',
    borderColor: 'border-brand-200',
    shadowColor: 'shadow-purple-sm'
  },
  confirmed: {
    label: 'Confirmed',
    icon: CheckCircleIcon,
    color: 'text-emerald-600',
    bgColor: 'bg-emerald-50',
    borderColor: 'border-emerald-200',
    shadowColor: 'shadow-emerald-sm'
  },
  rescheduled: {
    label: 'Rescheduled',
    icon: CalendarIcon,
    color: 'text-brand-600',
    bgColor: 'bg-brand-50',
    borderColor: 'border-brand-200',
    shadowColor: 'shadow-purple-sm'
  },
  in_progress: {
    label: 'In Progress',
    icon: AlertCircleIcon,
    color: 'text-brand-600',
    bgColor: 'bg-brand-50',
    borderColor: 'border-brand-200',
    shadowColor: 'shadow-purple-sm animate-purple-pulse'
  },
  completed: {
    label: 'Completed',
    icon: CheckCircleIcon,
    color: 'text-emerald-600',
    bgColor: 'bg-emerald-50',
    borderColor: 'border-emerald-200',
    shadowColor: 'shadow-emerald-sm'
  },
  cancelled: {
    label: 'Cancelled',
    icon: XCircleIcon,
    color: 'text-red-600',
    bgColor: 'bg-red-50',
    borderColor: 'border-red-200',
    shadowColor: 'shadow-red-sm'
  },
  no_show: {
    label: 'No Show',
    icon: XCircleIcon,
    color: 'text-red-600',
    bgColor: 'bg-red-50',
    borderColor: 'border-red-200',
    shadowColor: 'shadow-red-sm'
  },
  processing: {
    label: 'Processing',
    icon: ClockIcon,
    color: 'text-brand-600',
    bgColor: 'bg-brand-50',
    borderColor: 'border-brand-200',
    shadowColor: 'shadow-purple-sm'
  },
  payment_failed: {
    label: 'Payment Failed',
    icon: XCircleIcon,
    color: 'text-red-600',
    bgColor: 'bg-red-50',
    borderColor: 'border-red-200',
    shadowColor: 'shadow-red-sm'
  },
  declined: {
    label: 'Declined',
    icon: XCircleIcon,
    color: 'text-red-600',
    bgColor: 'bg-red-50',
    borderColor: 'border-red-200',
    shadowColor: 'shadow-red-sm'
  }
} as const

// Default fallback status config
const defaultStatusConfig = {
  label: 'Unknown',
  icon: AlertCircleIcon,
  color: 'text-gray-700',
  bgColor: 'bg-gray-50',
  borderColor: 'border-gray-200'
}

export function BookingCard({ 
  booking, 
  onStatusUpdate, 
  onMarkAsPaid,
  onConfirm,
  onDecline,
  onReschedule,
  onCancel,
  formatTime: formatTimeProp,
  formatDate: formatDateProp,
  statusUpdateLoading,
  showActions = true,
  variant = 'full'
}: BookingCardProps) {
  const router = useRouter()
  const { openOverlay } = useOverlay()
  const statusInfo = statusConfig[booking.status as keyof typeof statusConfig] || defaultStatusConfig
  const StatusIcon = statusInfo.icon

  // Payment deadline helpers
  const isPaymentOverdue = () => {
    if (!booking.payment_deadline || booking.status !== 'pending') return false
    return new Date(booking.payment_deadline) < new Date()
  }

  const getPaymentDeadlineDisplay = () => {
    if (!booking.payment_deadline) return null
    const deadline = new Date(booking.payment_deadline)
    const now = new Date()
    const hoursUntilDeadline = Math.ceil((deadline.getTime() - now.getTime()) / (1000 * 60 * 60))
    
    if (hoursUntilDeadline <= 0) {
      return {
        text: 'Payment Overdue',
        isOverdue: true,
        color: 'text-red-700',
        bgColor: 'bg-red-50',
        borderColor: 'border-red-200'
      }
    } else if (hoursUntilDeadline <= 24) {
      return {
        text: `Payment due in ${hoursUntilDeadline}h`,
        isOverdue: false,
        color: 'text-orange-700',
        bgColor: 'bg-orange-50', 
        borderColor: 'border-orange-200'
      }
    } else {
      return {
        text: `Payment due ${deadline.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}`,
        isOverdue: false,
        color: 'text-blue-700',
        bgColor: 'bg-blue-50',
        borderColor: 'border-blue-200'
      }
    }
  }

  const copyPaymentLink = async () => {
    if (booking.payment_link) {
      try {
        await navigator.clipboard.writeText(booking.payment_link)
        // Could add toast notification here
      } catch (error) {
        console.error('Failed to copy payment link:', error)
      }
    }
  }

  const formatTime = (time: string | undefined | null) => {
    if (formatTimeProp) return formatTimeProp(time || '')
    if (!time) return 'No time'
    const [hours, minutes] = time.split(':')
    const hour = parseInt(hours || '0')
    const ampm = hour >= 12 ? 'PM' : 'AM'
    const displayHour = hour % 12 || 12
    return `${displayHour}:${minutes || '00'} ${ampm}`
  }

  const formatDate = (dateStr: string | undefined | null) => {
    if (formatDateProp) return formatDateProp(dateStr || '')
    if (!dateStr) return 'No date'
    const date = new Date(dateStr)
    if (isNaN(date.getTime())) return 'Invalid date'
    
    const today = new Date()
    const tomorrow = new Date(today)
    tomorrow.setDate(today.getDate() + 1)
    
    if (date.toDateString() === today.toDateString()) {
      return 'Today'
    } else if (date.toDateString() === tomorrow.toDateString()) {
      return 'Tomorrow'
    } else {
      return date.toLocaleDateString('en-GB', {
        day: 'numeric',
        month: 'short'
      })
    }
  }

  const handleStatusUpdate = async (newStatus: string) => {
    if (onStatusUpdate) {
      await onStatusUpdate(booking.id, newStatus)
    }
  }

  if (variant === 'dashboard') {
    // Compact dashboard variant with payment integration
    return (
      <div className="bg-surface-primary rounded-lg border border-border-secondary p-4 hover:border-border-primary transition-colors">
        {/* Header - Booking reference, price, and status */}
        <div className="flex items-start justify-between mb-3">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-2">
              <span className="font-medium text-text-primary text-sm">
                {booking.booking_reference}
              </span>
              <span className="text-text-primary font-bold">
                £{booking.total_price}
              </span>
            </div>
            <div className="flex flex-wrap items-center gap-1">
              <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium border ${statusInfo.bgColor} ${statusInfo.borderColor} ${statusInfo.color}`}>
                <StatusIcon className="w-3 h-3 mr-1" />
                {statusInfo.label}
              </span>
              {/* Payment indicator: only show failure on dashboard; do not show Paid (redundant) */}
              {booking.payment_status === 'failed' && (
                <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium border bg-red-50 text-red-700 border-red-200">
                  <CreditCard className="w-3 h-3" />
                  Payment Failed
                </span>
              )}
              {isPaymentOverdue() && (
                <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-red-50 border border-red-200 text-red-700">
                  <AlertTriangle className="w-3 h-3" />
                  OVERDUE
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Customer name */}
        <div className="mb-2">
          <span className="text-text-primary font-medium text-sm">
            {booking.customer_name}
          </span>
        </div>

        {/* Date, time, and service */}
        <div className="text-text-secondary text-sm">
          <div className="flex items-center gap-1 mb-1">
            <span>{formatDate(booking.scheduled_date)} at {formatTime(booking.start_time)}</span>
          </div>
          <div className="truncate">
            {booking.services.map(s => s.name).join(', ')}
          </div>
        </div>

        {/* Action button */}
        {showActions && (
          <div className="mt-3 pt-3 border-t border-border-secondary">
            <div className="flex flex-wrap items-center gap-2 sm:gap-3">
              <Button
                onClick={() => openOverlay({
                type: 'booking-view',
                data: { bookingId: booking.id, booking }
              })}
                variant="outline"
                size="sm"
                className="text-xs"
              >
                <EyeIcon className="w-3 h-3 mr-1" />
                View Details
              </Button>
              {/* Dashboard variant payment actions */}
              {booking.status === 'pending' && onMarkAsPaid && (
                <Button
                  onClick={() => onMarkAsPaid(booking)}
                  size="sm"
                  className="text-xs bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-600 hover:to-emerald-700 text-white shadow-emerald-sm hover:shadow-emerald-md transition-all duration-300 font-medium min-h-[44px] touch-manipulation"
                >
                  <CreditCard className="w-3 h-3 mr-1" />
                  Mark as Paid
                </Button>
              )}
            </div>
          </div>
        )}
      </div>
    )
  }

  // Full variant for bookings page with enhanced payment tracking
  return (
    <div className="bg-surface-secondary rounded-xl border border-border-secondary hover:border-brand-400 hover:shadow-purple-md transition-all duration-300 overflow-hidden">
      {/* Header */}
      <div className="p-4 border-b border-border-secondary">
        <div className="flex items-start justify-between mb-3">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <h3 className="text-lg font-semibold text-text-primary truncate">
                #{booking.booking_reference}
              </h3>
              {booking.has_pending_reschedule && (
                <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-yellow-50 border border-yellow-200 text-yellow-700">
                  <CalendarIcon className="w-3 h-3" />
                  Reschedule Request
                </span>
              )}
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <span className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-sm font-medium border transition-all ${statusInfo.bgColor} ${statusInfo.borderColor} ${statusInfo.shadowColor || ''}`}>
                <StatusIcon className={`w-4 h-4 ${statusInfo.color}`} />
                <span className={statusInfo.color}>{statusInfo.label}</span>
              </span>
              {/* Payment indicator: show failed; do not show paid alongside confirmed */}
              {booking.payment_status === 'failed' && (
                <span className="inline-flex items-center gap-1.5 px-2 py-1 rounded-full text-xs font-medium border bg-red-50 text-red-700 border-red-200">
                  <CreditCard className="w-3 h-3" />
                  Payment Failed
                </span>
              )}
              {/* Payment Overdue Warning */}
              {isPaymentOverdue() && (
                <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-red-50 border border-red-200 text-red-700">
                  <AlertTriangle className="w-3 h-3" />
                  OVERDUE
                </span>
              )}
            </div>
          </div>
          <div className="text-right ml-3">
            <p className="text-2xl font-bold text-brand-500 drop-shadow-sm">£{booking.total_price}</p>
            <p className="text-text-secondary text-sm font-medium">
              {booking.services.length} service{booking.services.length !== 1 ? 's' : ''}
            </p>
          </div>
        </div>
        
        {/* Date/Time and Payment Deadline */}
        <div className="space-y-2">
          <div className="flex items-center gap-2 text-text-primary">
            <CalendarIcon className="w-4 h-4 text-text-secondary" />
            <span className="font-medium">{formatDate(booking.scheduled_date)}</span>
            <ClockIcon className="w-4 h-4 text-text-secondary ml-2" />
            <span className="font-medium">{formatTime(booking.start_time)}</span>
          </div>
          {/* Payment deadline for pending bookings */}
          {booking.status === 'pending' && (() => {
            const deadlineInfo = getPaymentDeadlineDisplay()
            return deadlineInfo && (
              <div className={`flex items-center gap-2 text-xs px-2 py-1 rounded-md border ${deadlineInfo.bgColor} ${deadlineInfo.borderColor}`}>
                <CreditCard className={`w-3 h-3 ${deadlineInfo.color}`} />
                <span className={deadlineInfo.color}>{deadlineInfo.text}</span>
                {deadlineInfo.isOverdue && (
                  <AlertTriangle className="w-3 h-3 text-red-600 ml-1" />
                )}
              </div>
            )
          })()}
        </div>
      </div>

      {/* Content */}
      <div className="p-4 space-y-4">
        {/* Customer Info */}
        <div>
          <p className="text-text-secondary text-xs mb-1">Customer</p>
          <p className="text-text-primary font-medium mb-1">{booking.customer_name}</p>
          <div className="flex items-center gap-3">
            {booking.customer_phone && (
              <a 
                href={`tel:${booking.customer_phone}`}
                className="flex items-center gap-1 text-text-link hover:text-text-link-hover text-sm"
              >
                <PhoneIcon className="w-4 h-4" />
                <span className="hidden sm:inline">Call</span>
              </a>
            )}
            <a 
              href={`mailto:${booking.customer_email}`}
              className="flex items-center gap-1 text-text-link hover:text-text-link-hover text-sm"
            >
              <MailIcon className="w-4 h-4" />
              <span className="hidden sm:inline">Email</span>
            </a>
          </div>
        </div>

        {/* Vehicle & Location */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <p className="text-text-secondary text-xs mb-1">Vehicle</p>
            <p className="text-text-primary font-medium text-sm">
              {booking.vehicle?.make && booking.vehicle?.model 
                ? `${booking.vehicle.make} ${booking.vehicle.model}`
                : 'No vehicle info'
              }
            </p>
            {booking.vehicle?.year && (
              <p className="text-text-secondary text-xs">
                {booking.vehicle.year}{booking.vehicle?.color ? ` • ${booking.vehicle.color}` : ''}
              </p>
            )}
          </div>
          {booking.address && (
            <div>
              <p className="text-text-secondary text-xs mb-1">Location</p>
              <p className="text-text-primary font-medium text-sm">
                {booking.address.city}
              </p>
              <p className="text-text-secondary text-xs">
                {booking.address.postal_code}
              </p>
            </div>
          )}
        </div>

        {/* Services */}
        <div>
          <p className="text-text-secondary text-xs mb-2">Services</p>
          <div className="flex flex-wrap gap-1">
            {booking.services.map((service, index) => (
              <span
                key={`${booking.id}-service-${index}-${service.name}`}
                className="px-2 py-1 bg-surface-tertiary rounded text-xs text-text-primary"
              >
                {service.name}
              </span>
            ))}
          </div>
        </div>

        {/* Payment notice is shown once near date/time above; no second box here to avoid duplication */}

        {/* Special Instructions */}
        {booking.special_instructions && (
          <div className="bg-surface-tertiary rounded-md p-3">
            <p className="text-text-secondary text-xs mb-1">Special Instructions</p>
            <p className="text-text-primary text-sm">{booking.special_instructions}</p>
          </div>
        )}

        {/* Reschedule Request Details */}
        {booking.has_pending_reschedule && booking.reschedule_request && (
          <div className="bg-yellow-50 border border-yellow-200 rounded-md p-3">
            <div className="flex items-start justify-between mb-2">
              <p className="text-yellow-800 text-xs font-medium mb-1">Pending Reschedule Request</p>
              <span className="text-yellow-600 text-xs">
                {new Date(booking.reschedule_request.created_at).toLocaleDateString()}
              </span>
            </div>
            <div className="space-y-1">
              <div className="flex items-center gap-4 text-sm">
                <div className="flex items-center gap-1">
                  <CalendarIcon className="w-3 h-3 text-yellow-600" />
                  <span className="text-yellow-800">
                    {new Date(booking.reschedule_request.requested_date).toLocaleDateString('en-GB', {
                      day: 'numeric',
                      month: 'short'
                    })}
                  </span>
                </div>
                <div className="flex items-center gap-1">
                  <ClockIcon className="w-3 h-3 text-yellow-600" />
                  <span className="text-yellow-800">
                    {formatTime(booking.reschedule_request.requested_time)}
                  </span>
                </div>
              </div>
              {booking.reschedule_request.reason && (
                <p className="text-yellow-700 text-xs italic">
                  "{booking.reschedule_request.reason}"
                </p>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Actions Footer */}
      {showActions && (
        <div className="p-4 border-t border-border-secondary space-y-2">
          <Button
            onClick={() => openOverlay({
              type: 'booking-view',
              data: { bookingId: booking.id, booking }
            })}
            variant="outline"
            size="sm"
            className="flex items-center justify-center gap-2 border-brand-300 text-brand-600 hover:bg-brand-50 hover:border-brand-400 hover:shadow-purple-sm transition-all duration-300 font-medium min-h-[44px] touch-manipulation"
          >
            <EyeIcon className="w-4 h-4" />
            View Details
          </Button>

          {/* Reschedule Request Actions - Priority */}
          {booking.has_pending_reschedule && booking.reschedule_request && (
            <div className="grid grid-cols-2 gap-2">
              <Button
                onClick={() => openOverlay({
                  type: 'reschedule-approve',
                  data: { 
                    bookingId: booking.id, 
                    booking,
                    rescheduleRequest: booking.reschedule_request 
                  }
                })}
                size="sm"
                className="flex items-center justify-center gap-1 bg-green-600 hover:bg-green-700 text-white"
              >
                <CalendarCheckIcon className="w-3 h-3" />
                Approve
              </Button>
              <Button
                onClick={() => openOverlay({
                  type: 'reschedule-decline',
                  data: { 
                    bookingId: booking.id, 
                    booking,
                    rescheduleRequest: booking.reschedule_request 
                  }
                })}
                variant="outline"
                size="sm"
                className="flex items-center justify-center gap-1 text-red-600 border-red-200 hover:bg-red-50"
              >
                <CalendarXIcon className="w-3 h-3" />
                Decline
              </Button>
            </div>
          )}

          {/* Payment Actions for Pending Bookings */}
          {!booking.has_pending_reschedule && booking.status === 'pending' && (
            <div className="space-y-3">
              {/* Primary Action - Mark as Paid */}
              <Button
                onClick={() => onMarkAsPaid ? onMarkAsPaid(booking) : handleStatusUpdate('confirmed')}
                size="sm"
                className="flex items-center justify-center gap-2 bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-600 hover:to-emerald-700 text-white shadow-emerald-md hover:shadow-emerald-lg transition-all duration-300 font-semibold min-h-[44px] touch-manipulation"
              >
                <CreditCard className="w-4 h-4" />
                Mark as Paid
              </Button>
              {/* Secondary Actions */}
              <div className="flex flex-wrap items-center gap-2">
                <Button
                  onClick={() => handleStatusUpdate('payment_failed')}
                  variant="outline"
                  size="sm"
                  className="flex items-center justify-center gap-1 text-red-600 border-red-300 hover:bg-red-50 hover:border-red-400 hover:shadow-red-sm transition-all duration-300 min-h-[44px] touch-manipulation"
                >
                  <XCircleIcon className="w-4 h-4" />
                  Payment Failed
                </Button>
                <Button
                  onClick={() => handleStatusUpdate('cancelled')}
                  variant="outline"
                  size="sm"
                  className="flex items-center justify-center gap-1 text-red-600 border-red-300 hover:bg-red-50 hover:border-red-400 hover:shadow-red-sm transition-all duration-300 min-h-[44px] touch-manipulation"
                >
                  <XCircleIcon className="w-4 h-4" />
                  Cancel Booking
                </Button>
              </div>
            </div>
          )}

          {/* Payment Failed Actions */}
          {booking.status === 'payment_failed' && (
            <div className="space-y-3">
              <Button
                onClick={() => onMarkAsPaid ? onMarkAsPaid(booking) : handleStatusUpdate('confirmed')}
                size="sm"
                className="flex items-center justify-center gap-2 bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-600 hover:to-emerald-700 text-white shadow-emerald-md hover:shadow-emerald-lg transition-all duration-300 font-semibold min-h-[44px] touch-manipulation"
              >
                <CreditCard className="w-4 h-4" />
                Mark as Paid
              </Button>
              <div className="flex flex-wrap items-center gap-2">
                <Button
                  onClick={() => handleStatusUpdate('pending')}
                  variant="outline"
                  size="sm"
                  className="flex items-center justify-center gap-1 text-brand-600 border-brand-300 hover:bg-brand-50 hover:border-brand-400 hover:shadow-purple-sm transition-all duration-300 min-h-[44px] touch-manipulation"
                >
                  <ClockIcon className="w-4 h-4" />
                  Retry Payment
                </Button>
                <Button
                  onClick={() => handleStatusUpdate('cancelled')}
                  variant="outline"
                  size="sm"
                  className="flex items-center justify-center gap-1 text-red-600 border-red-300 hover:bg-red-50 hover:border-red-400 hover:shadow-red-sm transition-all duration-300 min-h-[44px] touch-manipulation"
                >
                  <XCircleIcon className="w-4 h-4" />
                  Cancel Booking
                </Button>
              </div>
            </div>
          )}

          {booking.status === 'confirmed' && onStatusUpdate && (
            <Button
              onClick={() => handleStatusUpdate('in_progress')}
              size="sm"
              className="flex items-center justify-center gap-2 bg-gradient-to-r from-brand-500 to-brand-600 hover:from-brand-600 hover:to-brand-700 text-white shadow-purple-md hover:shadow-purple-lg transition-all duration-300 font-semibold min-h-[44px] touch-manipulation"
            >
              <ClockIcon className="w-4 h-4" />
              Start Service
            </Button>
          )}

          {booking.status === 'rescheduled' && onStatusUpdate && (
            <Button
              onClick={() => handleStatusUpdate('in_progress')}
              size="sm"
              className="flex items-center justify-center gap-2 bg-gradient-to-r from-brand-500 to-brand-600 hover:from-brand-600 hover:to-brand-700 text-white shadow-purple-md hover:shadow-purple-lg transition-all duration-300 font-semibold min-h-[44px] touch-manipulation"
            >
              <ClockIcon className="w-4 h-4" />
              Start Service
            </Button>
          )}

          {booking.status === 'in_progress' && onStatusUpdate && (
            <div className="space-y-3">
              <Button
                onClick={() => handleStatusUpdate('completed')}
                size="sm"
                className="flex items-center justify-center gap-2 bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-600 hover:to-emerald-700 text-white shadow-emerald-md hover:shadow-emerald-lg transition-all duration-300 font-semibold min-h-[44px] touch-manipulation"
              >
                <CheckCircleIcon className="w-4 h-4" />
                Complete Service
              </Button>
              <Button
                onClick={() => handleStatusUpdate('no_show')}
                variant="outline"
                size="sm"
                className="flex items-center justify-center gap-2 text-red-600 border-red-300 hover:bg-red-50 hover:border-red-400 hover:shadow-red-sm transition-all duration-300 min-h-[44px] touch-manipulation"
              >
                <XCircleIcon className="w-4 h-4" />
                Mark No Show
              </Button>
            </div>
          )}
        </div>
      )}
    </div>
  )
}