'use client'

import React, { useState, useEffect } from 'react'
import { Calendar, Clock, MapPin, Car, User, Phone, Mail, CheckCircle, AlertCircle, XCircle, Clock as PendingIcon, FileText, RefreshCw, DollarSign, UserX } from 'lucide-react'
import { BaseModal } from '../BaseModal'
import { BaseOverlayProps } from '@/lib/overlay/types'
import { Button } from '@/components/ui/primitives/Button'
import { Badge } from '@/components/ui/primitives/Badge'

interface BookingDetails {
  id: string
  booking_reference: string
  scheduled_date: string
  scheduled_start_time: string
  estimated_duration: number
  total_price: number
  status: 'draft' | 'pending' | 'confirmed' | 'rescheduled' | 'in_progress' | 'completed' | 'paid' | 'cancelled' | 'no_show'
  created_at: string
  service: {
    name: string
    description?: string
    estimated_duration: number
  }
  vehicle: {
    make: string
    model: string
    year?: number
    color?: string
    registration?: string
  }
  address: {
    address_line_1: string
    address_line_2?: string
    city: string
    postal_code: string
    special_instructions?: string
  }
  customer: {
    first_name: string
    last_name: string
    email: string
    phone?: string
  }
  notes?: string
}

const statusConfig = {
  draft: {
    label: 'Draft',
    icon: FileText,
    color: 'secondary',
    bgColor: 'bg-gray-600/10',
    textColor: 'text-gray-600'
  },
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
    color: 'secondary',
    bgColor: 'bg-success-600/5',
    textColor: 'text-success-700'
  },
  rescheduled: {
    label: 'Rescheduled',
    icon: RefreshCw,
    color: 'brand',
    bgColor: 'bg-brand-600/10',
    textColor: 'text-brand-600'
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
    color: 'secondary',
    bgColor: 'bg-success-600/5',
    textColor: 'text-success-700'
  },
  paid: {
    label: 'Paid',
    icon: DollarSign,
    color: 'secondary',
    bgColor: 'bg-success-600/5',
    textColor: 'text-success-700'
  },
  cancelled: {
    label: 'Cancelled',
    icon: XCircle,
    color: 'error',
    bgColor: 'bg-error-600/10',
    textColor: 'text-error-600'
  },
  no_show: {
    label: 'No Show',
    icon: UserX,
    color: 'error',
    bgColor: 'bg-error-600/10',
    textColor: 'text-error-600'
  }
} as const

export const BookingDetailsModal: React.FC<BaseOverlayProps> = ({
  isOpen,
  onClose,
  data
}) => {
  const [booking, setBooking] = useState<BookingDetails | null>(data?.booking || null)
  const [isLoading, setIsLoading] = useState(!data?.booking)
  const [error, setError] = useState('')

  useEffect(() => {
    if (isOpen && data?.bookingId && !data?.booking) {
      loadBookingDetails()
    }
  }, [isOpen, data?.bookingId])

  const loadBookingDetails = async () => {
    try {
      setIsLoading(true)
      setError('')
      
      const response = await fetch(`/api/bookings/${data.bookingId}`)
      const result = await response.json()

      if (result.success) {
        setBooking(result.data)
      } else {
        setError(result.error?.message || 'Failed to load booking details')
      }
    } catch (error) {
      setError('Network error occurred')
    } finally {
      setIsLoading(false)
    }
  }

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr)
    return date.toLocaleDateString('en-GB', {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
      year: 'numeric'
    })
  }

  const formatTime = (timeStr: string) => {
    const [hours, minutes] = timeStr.split(':')
    const hour = parseInt(hours || '0')
    const ampm = hour >= 12 ? 'PM' : 'AM'
    const displayHour = hour % 12 || 12
    return `${displayHour}:${minutes || '00'} ${ampm}`
  }

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('en-GB', {
      style: 'currency',
      currency: 'GBP'
    }).format(price)
  }

  const formatDuration = (minutes: number) => {
    const hours = Math.floor(minutes / 60)
    const remainingMinutes = minutes % 60
    if (hours === 0) return `${remainingMinutes}min`
    if (remainingMinutes === 0) return `${hours}h`
    return `${hours}h ${remainingMinutes}min`
  }

  const formatDateTime = (dateStr: string) => {
    const date = new Date(dateStr)
    return date.toLocaleDateString('en-GB', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  if (isLoading) {
    return (
      <BaseModal
        isOpen={isOpen}
        onClose={onClose}
        title="Booking Details"
        size="lg"
      >
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-brand-600"></div>
        </div>
      </BaseModal>
    )
  }

  if (error || !booking) {
    return (
      <BaseModal
        isOpen={isOpen}
        onClose={onClose}
        title="Booking Details"
        size="lg"
      >
        <div className="text-center py-12">
          <XCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
          <p className="text-red-600 mb-4">{error || 'Booking not found'}</p>
          {data?.bookingId && (
            <Button onClick={loadBookingDetails} variant="outline">
              Try Again
            </Button>
          )}
        </div>
      </BaseModal>
    )
  }

  const config = statusConfig[booking.status] || statusConfig.pending
  const StatusIcon = config.icon

  return (
    <BaseModal
      isOpen={isOpen}
      onClose={onClose}
      title="Booking Details"
      size="lg"
    >
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-start justify-between">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <h3 className="text-xl font-semibold text-text-primary">
                {booking.service?.name || 'Service Details'}
              </h3>
              <Badge variant={config.color as any}>
                <StatusIcon className="w-3 h-3 mr-1" />
                {config.label}
              </Badge>
            </div>
            <p className="text-sm text-text-secondary">
              Booking #{booking.booking_reference}
            </p>
            <p className="text-xs text-text-muted">
              Booked on {formatDateTime(booking.created_at)}
            </p>
          </div>
          <div className="text-right">
            <p className="text-2xl font-bold text-text-primary">{formatPrice(booking.total_price)}</p>
          </div>
        </div>

        {/* Service Details */}
        <div className="bg-surface-secondary rounded-lg p-3 sm:p-4 border border-border-secondary">
          <h4 className="font-medium text-text-primary mb-3 flex items-center gap-2">
            <Calendar className="w-4 h-4" />
            Appointment Details
          </h4>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
            <div>
              <p className="text-sm text-text-secondary mb-1">Date</p>
              <p className="font-medium text-text-primary">{formatDate(booking.scheduled_date)}</p>
            </div>
            <div>
              <p className="text-sm text-text-secondary mb-1">Time</p>
              <p className="font-medium text-text-primary">{formatTime(booking.scheduled_start_time)}</p>
            </div>
            <div>
              <p className="text-sm text-text-secondary mb-1">Duration</p>
              <p className="font-medium text-text-primary">{formatDuration(booking.estimated_duration || booking.service?.estimated_duration || 120)}</p>
            </div>
            <div>
              <p className="text-sm text-text-secondary mb-1">Service</p>
              <p className="font-medium text-text-primary">{booking.service?.name || 'Service Details'}</p>
            </div>
          </div>
          {(booking.service?.description) && (
            <div className="mt-4 pt-4 border-t border-border-primary">
              <p className="text-sm text-text-secondary mb-1">Service Description</p>
              <p className="text-sm text-text-primary">{booking.service?.description}</p>
            </div>
          )}
        </div>

        {/* Vehicle Details */}
        <div className="bg-surface-secondary rounded-lg p-3 sm:p-4 border border-border-secondary">
          <h4 className="font-medium text-text-primary mb-3 flex items-center gap-2">
            <Car className="w-4 h-4" />
            Vehicle Details
          </h4>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
            <div>
              <p className="text-sm text-text-secondary mb-1">Vehicle</p>
              <p className="font-medium text-text-primary">
                {booking.vehicle?.year || ''} {booking.vehicle?.make || ''} {booking.vehicle?.model || 'Vehicle Details'}
              </p>
            </div>
            {booking.vehicle?.color && (
              <div>
                <p className="text-sm text-text-secondary mb-1">Color</p>
                <p className="font-medium text-text-primary">{booking.vehicle.color}</p>
              </div>
            )}
            {booking.vehicle?.registration && (
              <div>
                <p className="text-sm text-text-secondary mb-1">Registration</p>
                <p className="font-medium text-text-primary">{booking.vehicle.registration}</p>
              </div>
            )}
          </div>
        </div>

        {/* Location Details */}
        <div className="bg-surface-secondary rounded-lg p-3 sm:p-4 border border-border-secondary">
          <h4 className="font-medium text-text-primary mb-3 flex items-center gap-2">
            <MapPin className="w-4 h-4" />
            Service Location
          </h4>
          <div className="space-y-2">
            <p className="font-medium text-text-primary">{booking.address?.address_line_1 || 'Address not available'}</p>
            {booking.address?.address_line_2 && (
              <p className="text-text-primary">{booking.address.address_line_2}</p>
            )}
            <p className="text-text-primary">{booking.address?.city || ''}{booking.address?.postal_code ? `, ${booking.address.postal_code}` : ''}</p>
            {booking.address?.special_instructions && (
              <div className="mt-3 pt-3 border-t border-border-primary">
                <p className="text-sm text-text-secondary mb-1">Special Instructions</p>
                <p className="text-sm text-text-primary">{booking.address.special_instructions}</p>
              </div>
            )}
          </div>
        </div>

        {/* Customer Details */}
        <div className="bg-surface-secondary rounded-lg p-3 sm:p-4 border border-border-secondary">
          <h4 className="font-medium text-text-primary mb-3 flex items-center gap-2">
            <User className="w-4 h-4" />
            Customer Details
          </h4>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
            <div>
              <p className="text-sm text-text-secondary mb-1">Name</p>
              <p className="font-medium text-text-primary">
                {booking.customer?.first_name || 'Customer'} {booking.customer?.last_name || ''}
              </p>
            </div>
            <div>
              <p className="text-sm text-text-secondary mb-1">Email</p>
              <p className="font-medium text-text-primary flex items-center gap-2">
                <Mail className="w-3 h-3" />
                {booking.customer?.email || 'Not available'}
              </p>
            </div>
            {booking.customer?.phone && (
              <div className="sm:col-span-2">
                <p className="text-sm text-text-secondary mb-1">Phone</p>
                <p className="font-medium text-text-primary flex items-center gap-2">
                  <Phone className="w-3 h-3" />
                  {booking.customer?.phone}
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Additional Notes */}
        {booking.notes && (
          <div className="bg-surface-secondary rounded-lg p-3 sm:p-4 border border-border-secondary">
            <h4 className="font-medium text-text-primary mb-3">Additional Notes</h4>
            <p className="text-sm text-text-primary">{booking.notes}</p>
          </div>
        )}

        {/* Actions - Mobile optimized */}
        <div className="flex gap-3 pt-4 border-t border-border-secondary sticky bottom-0 bg-surface-primary">
          <Button
            onClick={onClose}
            variant="outline"
            className="flex-1 min-h-[44px] sm:min-h-[40px]"
          >
            Close
          </Button>
        </div>
      </div>
    </BaseModal>
  )
}