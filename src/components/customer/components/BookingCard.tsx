'use client'

import { useRouter } from 'next/navigation'
import { useBookingFlowStore } from '@/lib/store/bookingFlowStore'
import { useOverlay } from '@/lib/overlay/context'
import { Button } from '@/components/ui/primitives/Button'
import { Badge } from '@/components/ui/primitives/Badge'
import { Card, CardContent } from '@/components/ui/composites/Card'
import { 
  Calendar, 
  Clock, 
  MapPin, 
  Car, 
  Eye,
  Edit,
  X,
  RefreshCw,
  CheckCircle,
  AlertCircle,
  Clock as PendingIcon,
  CreditCard,
  AlertTriangle,
  Copy,
  ExternalLink
} from 'lucide-react'
import { formatDistance } from 'date-fns'

interface BookingCardProps {
  booking: {
    id: string
    booking_reference: string
    scheduled_date: string
    start_time: string
    status: 'pending' | 'confirmed' | 'in_progress' | 'completed' | 'cancelled' | 'payment_failed'
    payment_status?: 'pending' | 'paid' | 'failed' | 'refunded'
    payment_method?: string
    payment_deadline?: string
    payment_link?: string
    total_price: number
    services: Array<{
      name: string
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
  }
  variant?: 'compact' | 'detailed'
  showActions?: boolean
}

const statusConfig = {
  pending: {
    label: 'Pending',
    icon: PendingIcon,
    color: 'warning',
    bgColor: 'bg-warning-600/10',
    textColor: 'text-warning-600'
  },
  confirmed: {
    label: 'Confirmed',
    icon: CheckCircle,
    color: 'success',
    bgColor: 'bg-success-600/10',
    textColor: 'text-success-600'
  },
  in_progress: {
    label: 'In Progress',
    icon: AlertCircle,
    color: 'brand',
    bgColor: 'bg-brand-600/10',
    textColor: 'text-brand-600'
  },
  completed: {
    label: 'Completed',
    icon: CheckCircle,
    color: 'success',
    bgColor: 'bg-success-600/10',
    textColor: 'text-success-600'
  },
  cancelled: {
    label: 'Cancelled',
    icon: X,
    color: 'error',
    bgColor: 'bg-error-600/10',
    textColor: 'text-error-600'
  },
  rescheduled: {
    label: 'Rescheduled',
    icon: Calendar,
    color: 'warning',
    bgColor: 'bg-warning-600/10',
    textColor: 'text-warning-600'
  },
  no_show: {
    label: 'No Show',
    icon: X,
    color: 'error',
    bgColor: 'bg-error-600/10',
    textColor: 'text-error-600'
  },
  payment_failed: {
    label: 'Payment Failed',
    icon: X,
    color: 'error',
    bgColor: 'bg-error-600/10',
    textColor: 'text-error-600'
  },
  processing: {
    label: 'Processing',
    icon: PendingIcon,
    color: 'info',
    bgColor: 'bg-info-600/10',
    textColor: 'text-info-600'
  },
  declined: {
    label: 'Declined',
    icon: X,
    color: 'error',
    bgColor: 'bg-error-600/10',
    textColor: 'text-error-600'
  }
} as const

// Default fallback status config
const defaultStatusConfig = {
  label: 'Unknown',
  icon: AlertCircle,
  color: 'neutral',
  bgColor: 'bg-neutral-600/10',
  textColor: 'text-neutral-600'
}

export function BookingCard({ 
  booking, 
  variant = 'detailed', 
  showActions = true 
}: BookingCardProps) {
  const router = useRouter()
  const { initializeRebooking } = useBookingFlowStore()
  const { openOverlay } = useOverlay()
  const config = statusConfig[booking.status as keyof typeof statusConfig] || defaultStatusConfig
  const StatusIcon = config.icon

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

  const formatTime = (timeString: string) => {
    const [hours, minutes] = timeString.split(':')
    const hour = parseInt(hours || '0')
    const ampm = hour >= 12 ? 'PM' : 'AM'
    const displayHour = hour % 12 || 12
    return `${displayHour}:${minutes || '00'} ${ampm}`
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    const now = new Date()
    
    // For upcoming bookings, show relative time
    if (['pending', 'confirmed', 'in_progress'].includes(booking.status) && date > now) {
      const distance = formatDistance(date, now, { addSuffix: true })
      return {
        primary: date.toLocaleDateString('en-GB', {
          weekday: 'short',
          day: 'numeric',
          month: 'short'
        }),
        secondary: distance
      }
    }
    
    // For past bookings, show standard format
    return {
      primary: date.toLocaleDateString('en-GB', {
        weekday: 'short',
        day: 'numeric',
        month: 'short',
        year: date.getFullYear() !== now.getFullYear() ? 'numeric' : undefined
      }),
      secondary: null
    }
  }

  const handleRebook = async () => {
    try {
      await initializeRebooking(booking.id)
      router.push('/book')
    } catch (error) {
      console.error('Rebooking failed:', error)
    }
  }

  const handleViewDetails = () => {
    openOverlay({
      type: 'booking-view',
      data: { bookingId: booking.id, booking }
    })
  }

  const handleReschedule = () => {
    openOverlay({
      type: 'booking-reschedule',
      data: { bookingId: booking.id, booking },
      onConfirm: async () => {
        // Optionally trigger a refresh from parent
      }
    })
  }

  const handleCancel = () => {
    openOverlay({
      type: 'booking-cancel',
      data: { bookingId: booking.id, booking },
      onConfirm: async () => {
        // Optionally trigger a refresh from parent
      }
    })
  }

  const dateInfo = formatDate(booking.scheduled_date)

  if (variant === 'compact') {
    return (
      <Card 
        className="cursor-pointer hover:shadow-purple-md hover:border-brand-400 transition-all duration-300"
        onClick={handleViewDetails}
      >
        <CardContent className="p-5">
          <div className="flex items-start gap-4">
            {/* Status Icon */}
            <div className={`w-12 h-12 rounded-lg ${config.bgColor} flex items-center justify-center flex-shrink-0 shadow-sm`}>
              <StatusIcon className={`w-6 h-6 ${config.textColor}`} />
            </div>

            {/* Booking Info */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-2">
                <h3 className="font-semibold text-text-primary text-base truncate">
                  {booking.services[0]?.name}
                  {booking.services.length > 1 && ` +${booking.services.length - 1} more`}
                </h3>
                <Badge variant={config.color as any} size="sm">
                  {config.label}
                </Badge>
              </div>
              
              {/* Date and Time Row */}
              <div className="flex items-center gap-3 text-sm text-text-secondary mb-2">
                <span className="flex items-center gap-1">
                  <Calendar className="w-4 h-4" />
                  {dateInfo.primary}
                </span>
                <span className="flex items-center gap-1">
                  <Clock className="w-4 h-4" />
                  {formatTime(booking.start_time)}
                </span>
              </div>

              {/* Payment Warning Row - Only show if urgent */}
              {(isPaymentOverdue() || (booking.payment_status && booking.payment_status === 'failed')) && (
                <div className="flex items-center gap-2">
                  {isPaymentOverdue() && (
                    <Badge variant="error" size="sm" className="animate-pulse">
                      <AlertTriangle className="w-3 h-3 mr-1" />
                      Payment Overdue
                    </Badge>
                  )}
                  {booking.payment_status === 'failed' && (
                    <Badge variant="error" size="sm">
                      <CreditCard className="w-3 h-3 mr-1" />
                      Payment Failed
                    </Badge>
                  )}
                </div>
              )}
            </div>

            {/* Price & Reference */}
            <div className="text-right flex-shrink-0">
              <p className="font-bold text-brand-500 text-xl drop-shadow-sm">£{booking.total_price}</p>
              <p className="text-xs text-text-secondary font-medium mt-1">#{booking.booking_reference}</p>
            </div>
          </div>
        </CardContent>
      </Card>
    )
  }

  // Detailed variant
  return (
    <Card className="overflow-hidden hover:shadow-purple-lg hover:border-brand-400 transition-all duration-300">
      <CardContent className="p-6">
        <div className="flex flex-col lg:flex-row gap-6">
          {/* Main Content */}
          <div className="flex-1 space-y-4">
            {/* Header */}
            <div className="flex items-start justify-between">
              <div className="min-w-0">
                {/* Mobile minimal header */}
                <div className="flex items-center justify-between sm:hidden mb-1">
                  <h3 className="text-base font-semibold text-text-primary truncate">#{booking.booking_reference}</h3>
                  <span className="text-base font-bold text-brand-500 ml-3">£{booking.total_price}</span>
                </div>
                <div className="sm:hidden flex items-center gap-2 mb-2">
                  <Badge variant={config.color as any} size="sm">{config.label}</Badge>
                  {(booking.payment_status === 'failed' || isPaymentOverdue()) && (
                    <Badge variant="error" size="sm">{booking.payment_status === 'failed' ? 'Payment Failed' : 'Overdue'}</Badge>
                  )}
                </div>
                <div className="sm:hidden text-sm text-text-secondary truncate mb-2">
                  {dateInfo.primary} • {formatTime(booking.start_time)}
                </div>

                {/* Desktop rich header */}
                <div className="hidden sm:flex items-center gap-3 mb-2">
                  <h3 className="text-lg font-semibold text-text-primary">
                    {booking.services[0]?.name}
                    {booking.services.length > 1 && ` +${booking.services.length - 1} more`}
                  </h3>
                  <Badge variant={config.color as any} className="shadow-sm">
                    {config.label}
                  </Badge>
                  {booking.payment_status && (
                    <Badge variant={booking.payment_status === 'paid' ? 'success' : booking.payment_status === 'failed' ? 'error' : 'warning'} className="shadow-sm">
                      {booking.payment_status === 'paid' ? 'Paid' : booking.payment_status === 'failed' ? 'Payment Failed' : 'Payment Pending'}
                    </Badge>
                  )}
                  {isPaymentOverdue() && (
                    <Badge variant="error" className="shadow-sm">OVERDUE</Badge>
                  )}
                </div>
                <p className="hidden sm:block text-sm text-text-secondary">Booking #{booking.booking_reference}</p>
              </div>
              <div className="hidden sm:block text-right">
                <p className="text-3xl font-bold text-brand-500 drop-shadow-sm">£{booking.total_price}</p>
                {dateInfo.secondary && (
                  <p className="text-sm text-brand-400 font-medium">{dateInfo.secondary}</p>
                )}
              </div>
            </div>

            {/* Payment Status Information - Show for pending bookings (desktop only) */}
            {booking.status === 'pending' && (
              <div className={`rounded-xl p-5 border ${ 
                isPaymentOverdue() 
                  ? 'bg-red-50 border-red-200' 
                  : 'bg-blue-50 border-blue-200'
              } hidden sm:block`}>
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <CreditCard className={`w-5 h-5 ${
                      isPaymentOverdue() ? 'text-red-600' : 'text-blue-600'
                    }`} />
                    <h4 className={`font-semibold ${
                      isPaymentOverdue() ? 'text-red-700' : 'text-blue-700'
                    }`}>
                      {isPaymentOverdue() ? 'Payment Overdue' : 'Payment Required'}
                    </h4>
                  </div>
                  {(() => {
                    const deadlineInfo = getPaymentDeadlineDisplay()
                    return deadlineInfo && (
                      <Badge variant={isPaymentOverdue() ? 'error' : 'warning'} size="sm">
                        {deadlineInfo.text}
                      </Badge>
                    )
                  })()}
                </div>
                
                <p className={`text-sm mb-4 ${
                  isPaymentOverdue() ? 'text-red-700' : 'text-blue-700'
                }`}>
                  {isPaymentOverdue() 
                    ? 'Complete payment to secure your booking.' 
                    : 'Complete payment to confirm your appointment.'}
                </p>
                
                {booking.payment_link && (
                  <div className="flex gap-3">
                    <Button
                      onClick={copyPaymentLink}
                      variant="outline"
                      size="sm"
                      className="text-brand-600 border-brand-300 hover:bg-brand-50 hover:border-brand-400"
                    >
                      <Copy className="w-4 h-4 mr-2" />
                      Copy Link
                    </Button>
                    <a 
                      href={booking.payment_link} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="flex-1"
                    >
                      <Button
                        size="sm"
                        className="w-full bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-600 hover:to-emerald-700 text-white"
                      >
                        <ExternalLink className="w-4 h-4 mr-2" />
                        Pay £{booking.total_price}
                      </Button>
                    </a>
                  </div>
                )}
              </div>
            )}

            {/* Details Grid (desktop only) */}
            <div className="hidden sm:grid grid-cols-1 sm:grid-cols-2 gap-6">
              {/* Date & Time */}
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-xl bg-brand-600/10 flex items-center justify-center">
                  <Calendar className="w-6 h-6 text-brand-400" />
                </div>
                <div>
                  <p className="font-semibold text-text-primary text-base">{dateInfo.primary}</p>
                  <p className="text-sm text-text-secondary">{formatTime(booking.start_time)}</p>
                </div>
              </div>

              {/* Vehicle */}
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-xl bg-surface-tertiary flex items-center justify-center">
                  <Car className="w-6 h-6 text-text-secondary" />
                </div>
                <div>
                  <p className="font-semibold text-text-primary text-base">
                    {booking.vehicle.year} {booking.vehicle.make} {booking.vehicle.model}
                  </p>
                  {booking.vehicle.color && (
                    <p className="text-sm text-text-secondary">{booking.vehicle.color}</p>
                  )}
                </div>
              </div>

              {/* Location - Full width for address */}
              <div className="flex items-center gap-4 sm:col-span-2">
                <div className="w-12 h-12 rounded-xl bg-surface-tertiary flex items-center justify-center">
                  <MapPin className="w-6 h-6 text-text-secondary" />
                </div>
                <div>
                  <p className="font-semibold text-text-primary text-base">{booking.address.address_line_1}</p>
                  <p className="text-sm text-text-secondary">
                    {booking.address.city}, {booking.address.postal_code}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Actions */}
          {showActions && (
            <div className="flex flex-col gap-3 lg:min-w-[160px]">
              {/* Mobile single CTA */}
              <div className="sm:hidden">
                <Button
                  onClick={handleViewDetails}
                  size="sm"
                  className="w-full bg-white/10 hover:bg-white/20 text-white border border-white/20 h-11 px-4 rounded-lg"
                >
                  View Details
                </Button>
              </div>
              {/* Desktop actions */}
              <div className="hidden sm:flex flex-row lg:flex-col gap-3">
                <Button
                  onClick={handleViewDetails}
                  variant="outline"
                  size="sm"
                  className="flex-1 lg:w-full border-brand-300 text-brand-600 hover:bg-brand-50 hover:border-brand-400 hover:shadow-purple-sm transition-all duration-300 font-medium min-h-[44px] touch-manipulation"
                >
                  View Details
                </Button>
                {booking.status === 'pending' && (
                  <Button
                    onClick={handleCancel}
                    variant="outline"
                    size="sm"
                    className="flex-1 lg:w-full border-red-300 text-red-600 hover:bg-red-50 hover:border-red-400 hover:shadow-red-sm transition-all duration-300 font-medium min-h-[44px] touch-manipulation"
                  >
                    Cancel
                  </Button>
                )}
                {['pending', 'confirmed'].includes(booking.status) && (
                  <Button
                    onClick={handleReschedule}
                    variant="outline"
                    size="sm"
                    className="flex-1 lg:w-full border-brand-300 text-brand-600 hover:bg-brand-50 hover:border-brand-400 hover:shadow-purple-sm transition-all duration-300 font-medium min-h-[44px] touch-manipulation"
                  >
                    Reschedule
                  </Button>
                )}
                {booking.status === 'completed' && (
                  <Button
                    onClick={handleRebook}
                    variant="outline"
                    size="sm"
                    className="flex-1 lg:w-full border-emerald-300 text-emerald-600 hover:bg-emerald-50 hover:border-emerald-400 hover:shadow-emerald-sm transition-all duration-300 font-medium min-h-[44px] touch-manipulation"
                  >
                    Book Again
                  </Button>
                )}
              </div>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  )
}