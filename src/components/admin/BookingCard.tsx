'use client'

import { useRouter } from 'next/navigation'
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
  AlertCircleIcon
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
    status: 'pending' | 'confirmed' | 'rescheduled' | 'in_progress' | 'completed' | 'cancelled'
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
  }
  onStatusUpdate?: (bookingId: string, newStatus: string) => Promise<void>
  showActions?: boolean
  variant?: 'dashboard' | 'full'
}

const statusConfig = {
  pending: {
    label: 'Pending',
    icon: ClockIcon,
    color: 'text-yellow-700',
    bgColor: 'bg-yellow-50',
    borderColor: 'border-yellow-200'
  },
  confirmed: {
    label: 'Confirmed',
    icon: CheckCircleIcon,
    color: 'text-blue-700',
    bgColor: 'bg-blue-50',
    borderColor: 'border-blue-200'
  },
  rescheduled: {
    label: 'Rescheduled',
    icon: CalendarIcon,
    color: 'text-purple-700',
    bgColor: 'bg-purple-50',
    borderColor: 'border-purple-200'
  },
  in_progress: {
    label: 'In Progress',
    icon: AlertCircleIcon,
    color: 'text-purple-700',
    bgColor: 'bg-purple-50',
    borderColor: 'border-purple-200'
  },
  completed: {
    label: 'Completed',
    icon: CheckCircleIcon,
    color: 'text-green-700',
    bgColor: 'bg-green-50',
    borderColor: 'border-green-200'
  },
  cancelled: {
    label: 'Cancelled',
    icon: XCircleIcon,
    color: 'text-red-700',
    bgColor: 'bg-red-50',
    borderColor: 'border-red-200'
  }
}

export function BookingCard({ 
  booking, 
  onStatusUpdate, 
  showActions = true,
  variant = 'full'
}: BookingCardProps) {
  const router = useRouter()
  const statusInfo = statusConfig[booking.status]
  const StatusIcon = statusInfo.icon

  const formatTime = (time: string) => {
    const [hours, minutes] = time.split(':')
    const hour = parseInt(hours || '0')
    const ampm = hour >= 12 ? 'PM' : 'AM'
    const displayHour = hour % 12 || 12
    return `${displayHour}:${minutes || '00'} ${ampm}`
  }

  const formatDate = (dateStr: string) => {
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
    // Compact dashboard variant
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
            <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium border ${statusInfo.bgColor} ${statusInfo.borderColor} ${statusInfo.color}`}>
              <StatusIcon className="w-3 h-3 mr-1" />
              {statusInfo.label}
            </span>
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
            <Button
              onClick={() => router.push(`/admin/bookings/${booking.id}`)}
              variant="outline"
              size="sm"
              className="w-full text-xs"
            >
              <EyeIcon className="w-3 h-3 mr-1" />
              View Details
            </Button>
          </div>
        )}
      </div>
    )
  }

  // Full variant for bookings page
  return (
    <div className="bg-surface-secondary rounded-lg border border-border-secondary hover:border-border-primary transition-colors overflow-hidden">
      {/* Header */}
      <div className="p-4 border-b border-border-secondary">
        <div className="flex items-start justify-between mb-3">
          <div className="flex-1 min-w-0">
            <h3 className="text-lg font-semibold text-text-primary mb-1 truncate">
              #{booking.booking_reference}
            </h3>
            <span className={`inline-flex items-center gap-2 px-3 py-1 rounded-full text-sm border ${statusInfo.bgColor} ${statusInfo.borderColor}`}>
              <StatusIcon className={`w-4 h-4 ${statusInfo.color}`} />
              <span className={statusInfo.color}>{statusInfo.label}</span>
            </span>
          </div>
          <div className="text-right ml-3">
            <p className="text-xl font-bold text-brand-purple">£{booking.total_price}</p>
            <p className="text-text-muted text-xs">
              {booking.services.length} service{booking.services.length !== 1 ? 's' : ''}
            </p>
          </div>
        </div>
        
        {/* Date/Time - Prominent */}
        <div className="flex items-center gap-2 text-text-primary">
          <CalendarIcon className="w-4 h-4 text-text-secondary" />
          <span className="font-medium">{formatDate(booking.scheduled_date)}</span>
          <ClockIcon className="w-4 h-4 text-text-secondary ml-2" />
          <span className="font-medium">{formatTime(booking.start_time)}</span>
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
              {booking.vehicle.make} {booking.vehicle.model}
            </p>
            {booking.vehicle.year && (
              <p className="text-text-secondary text-xs">
                {booking.vehicle.year} • {booking.vehicle.color}
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
                key={index}
                className="px-2 py-1 bg-surface-tertiary rounded text-xs text-text-primary"
              >
                {service.name}
              </span>
            ))}
          </div>
        </div>

        {/* Special Instructions */}
        {booking.special_instructions && (
          <div className="bg-surface-tertiary rounded-md p-3">
            <p className="text-text-secondary text-xs mb-1">Special Instructions</p>
            <p className="text-text-primary text-sm">{booking.special_instructions}</p>
          </div>
        )}
      </div>

      {/* Actions Footer */}
      {showActions && (
        <div className="p-4 border-t border-border-secondary space-y-2">
          <Button
            onClick={() => router.push(`/admin/bookings/${booking.id}`)}
            variant="outline"
            size="sm"
            className="w-full flex items-center justify-center gap-2"
          >
            <EyeIcon className="w-4 h-4" />
            View Details
          </Button>

          {booking.status === 'pending' && onStatusUpdate && (
            <div className="grid grid-cols-2 gap-2">
              <Button
                onClick={() => handleStatusUpdate('confirmed')}
                size="sm"
                className="flex items-center justify-center gap-1 bg-green-600 hover:bg-green-700"
              >
                <CheckCircleIcon className="w-3 h-3" />
                Confirm
              </Button>
              <Button
                onClick={() => handleStatusUpdate('cancelled')}
                variant="outline"
                size="sm"
                className="flex items-center justify-center gap-1 text-red-600 border-red-200 hover:bg-red-50"
              >
                <XCircleIcon className="w-3 h-3" />
                Cancel
              </Button>
            </div>
          )}

          {booking.status === 'confirmed' && onStatusUpdate && (
            <Button
              onClick={() => handleStatusUpdate('in_progress')}
              size="sm"
              className="w-full flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700"
            >
              <ClockIcon className="w-4 h-4" />
              Start Service
            </Button>
          )}

          {booking.status === 'rescheduled' && onStatusUpdate && (
            <Button
              onClick={() => handleStatusUpdate('in_progress')}
              size="sm"
              className="w-full flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700"
            >
              <ClockIcon className="w-4 h-4" />
              Start Service
            </Button>
          )}

          {booking.status === 'in_progress' && onStatusUpdate && (
            <Button
              onClick={() => handleStatusUpdate('completed')}
              size="sm"
              className="w-full flex items-center justify-center gap-2"
            >
              <CheckCircleIcon className="w-4 h-4" />
              Complete
            </Button>
          )}
        </div>
      )}
    </div>
  )
}