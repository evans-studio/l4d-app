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
  Clock as PendingIcon
} from 'lucide-react'
import { formatDistance } from 'date-fns'

interface BookingCardProps {
  booking: {
    id: string
    booking_reference: string
    scheduled_date: string
    start_time: string
    status: 'pending' | 'confirmed' | 'in_progress' | 'completed' | 'cancelled'
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
  }
} as const

export function BookingCard({ 
  booking, 
  variant = 'detailed', 
  showActions = true 
}: BookingCardProps) {
  const router = useRouter()
  const { initializeRebooking } = useBookingFlowStore()
  const { openOverlay } = useOverlay()
  const config = statusConfig[booking.status]
  const StatusIcon = config.icon

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
      onConfirm: async (result) => {
        // Refresh booking data or show success message
        console.log('Reschedule confirmed:', result)
        // You could trigger a refresh here
      }
    })
  }

  const handleCancel = () => {
    openOverlay({
      type: 'booking-cancel',
      data: { bookingId: booking.id, booking },
      onConfirm: async (result) => {
        // Refresh booking data or show success message
        console.log('Booking cancelled:', result)
        // You could trigger a refresh here
      }
    })
  }

  const dateInfo = formatDate(booking.scheduled_date)

  if (variant === 'compact') {
    return (
      <Card 
        className="cursor-pointer hover:shadow-md transition-shadow"
        onClick={handleViewDetails}
      >
        <CardContent className="p-4">
          <div className="flex items-center gap-3">
            {/* Status Icon */}
            <div className={`w-10 h-10 rounded-lg ${config.bgColor} flex items-center justify-center flex-shrink-0`}>
              <StatusIcon className={`w-5 h-5 ${config.textColor}`} />
            </div>

            {/* Booking Info */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <h3 className="font-semibold text-text-primary text-sm truncate">
                  {booking.services[0]?.name}
                  {booking.services.length > 1 && ` +${booking.services.length - 1} more`}
                </h3>
                <Badge variant={config.color as any} size="sm">
                  {config.label}
                </Badge>
              </div>
              <div className="flex items-center gap-4 text-xs text-text-secondary">
                <span className="flex items-center gap-1">
                  <Calendar className="w-3 h-3" />
                  {dateInfo.primary}
                </span>
                <span className="flex items-center gap-1">
                  <Clock className="w-3 h-3" />
                  {formatTime(booking.start_time)}
                </span>
              </div>
            </div>

            {/* Price */}
            <div className="text-right flex-shrink-0">
              <p className="font-bold text-text-primary">£{booking.total_price}</p>
              <p className="text-xs text-text-secondary">#{booking.booking_reference}</p>
            </div>
          </div>
        </CardContent>
      </Card>
    )
  }

  // Detailed variant
  return (
    <Card className="overflow-hidden">
      <CardContent className="p-6">
        <div className="flex flex-col lg:flex-row gap-6">
          {/* Main Content */}
          <div className="flex-1 space-y-4">
            {/* Header */}
            <div className="flex items-start justify-between">
              <div>
                <div className="flex items-center gap-3 mb-2">
                  <h3 className="text-lg font-semibold text-text-primary">
                    {booking.services[0]?.name}
                    {booking.services.length > 1 && ` +${booking.services.length - 1} more`}
                  </h3>
                  <Badge variant={config.color as any}>
                    {config.label}
                  </Badge>
                </div>
                <p className="text-sm text-text-secondary">
                  Booking #{booking.booking_reference}
                </p>
              </div>
              <div className="text-right">
                <p className="text-2xl font-bold text-text-primary">£{booking.total_price}</p>
                {dateInfo.secondary && (
                  <p className="text-sm text-brand-400 font-medium">{dateInfo.secondary}</p>
                )}
              </div>
            </div>

            {/* Details Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {/* Date & Time */}
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-brand-600/10 flex items-center justify-center">
                  <Calendar className="w-5 h-5 text-brand-400" />
                </div>
                <div>
                  <p className="font-medium text-text-primary">{dateInfo.primary}</p>
                  <p className="text-sm text-text-secondary">{formatTime(booking.start_time)}</p>
                </div>
              </div>

              {/* Vehicle */}
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-surface-tertiary flex items-center justify-center">
                  <Car className="w-5 h-5 text-text-secondary" />
                </div>
                <div>
                  <p className="font-medium text-text-primary">
                    {booking.vehicle.year} {booking.vehicle.make} {booking.vehicle.model}
                  </p>
                  {booking.vehicle.color && (
                    <p className="text-sm text-text-secondary">{booking.vehicle.color}</p>
                  )}
                </div>
              </div>

              {/* Location */}
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-surface-tertiary flex items-center justify-center">
                  <MapPin className="w-5 h-5 text-text-secondary" />
                </div>
                <div>
                  <p className="font-medium text-text-primary">{booking.address.address_line_1}</p>
                  <p className="text-sm text-text-secondary">
                    {booking.address.city}, {booking.address.postal_code}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Actions */}
          {showActions && (
            <div className="flex flex-row lg:flex-col gap-2 lg:min-w-[140px]">
              <Button
                onClick={handleViewDetails}
                variant="outline"
                size="sm"
                leftIcon={<Eye className="w-4 h-4" />}
                className="flex-1 lg:w-full"
              >
                <span className="lg:hidden">View</span>
                <span className="hidden lg:inline">View Details</span>
              </Button>
              
              {booking.status === 'pending' && (
                <Button
                  onClick={handleCancel}
                  variant="outline"
                  size="sm"
                  leftIcon={<X className="w-4 h-4" />}
                  className="flex-1 lg:w-full"
                >
                  <span className="lg:hidden">Cancel</span>
                  <span className="hidden lg:inline">Cancel</span>
                </Button>
              )}
              
              {['pending', 'confirmed'].includes(booking.status) && (
                <Button
                  onClick={handleReschedule}
                  variant="outline"
                  size="sm"
                  leftIcon={<RefreshCw className="w-4 h-4" />}
                  className="flex-1 lg:w-full"
                >
                  <span className="lg:hidden">Reschedule</span>
                  <span className="hidden lg:inline">Reschedule</span>
                </Button>
              )}
              
              {booking.status === 'completed' && (
                <Button
                  onClick={handleRebook}
                  variant="outline"
                  size="sm"
                  leftIcon={<RefreshCw className="w-4 h-4" />}
                  className="flex-1 lg:w-full"
                >
                  <span className="lg:hidden">Rebook</span>
                  <span className="hidden lg:inline">Book Again</span>
                </Button>
              )}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  )
}