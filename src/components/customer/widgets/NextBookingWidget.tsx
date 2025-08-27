'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useOverlay } from '@/lib/overlay/context'
import { Button } from '@/components/ui/primitives/Button'
import { Card, CardHeader, CardContent } from '@/components/ui/composites/Card'
import { isNewUIEnabled } from '@/lib/config/feature-flags'
import { 
  Calendar, 
  Clock, 
  MapPin, 
  Car, 
  Edit,
  X,
  ChevronRight
} from 'lucide-react'
import { formatDistance } from 'date-fns'

interface NextBookingWidgetProps {
  booking?: {
    id: string
    booking_reference: string
    scheduled_date: string
    scheduled_start_time: string
    status: 'pending' | 'confirmed' | 'in_progress' | 'completed' | 'cancelled' | 'rescheduled' | 'declined'
    service: {
      name: string
      short_description?: string
      category?: string
    } | null
    vehicle: {
      make: string
      model: string
      year?: number
      color?: string
    } | null
    address: {
      address_line_1: string
      address_line_2?: string
      city: string 
      postal_code: string
    } | null
  }
}

export function NextBookingWidget({ booking }: NextBookingWidgetProps) {
  const router = useRouter()
  const { openOverlay } = useOverlay()
  const [timeUntil, setTimeUntil] = useState<string>('')

  useEffect(() => {
    if (!booking) return

    const updateCountdown = () => {
      const now = new Date()
      const bookingDate = new Date(`${booking.scheduled_date}T${booking.scheduled_start_time}`)
      
      if (bookingDate > now) {
        const distance = formatDistance(bookingDate, now, { addSuffix: true })
        setTimeUntil(distance)
      } else {
        setTimeUntil('Starting soon')
      }
    }

    updateCountdown()
    const interval = setInterval(updateCountdown, 60000) // Update every minute

    return () => clearInterval(interval)
  }, [booking])

  const formatTime = (timeString: string | undefined | null) => {
    if (!timeString) {
      return 'Time TBD'
    }
    
    const [hours, minutes] = timeString.split(':')
    const hour = parseInt(hours || '0')
    const ampm = hour >= 12 ? 'PM' : 'AM'
    const displayHour = hour % 12 || 12
    return `${displayHour}:${minutes || '00'} ${ampm}`
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleDateString('en-GB', {
      weekday: 'short',
      day: 'numeric',
      month: 'short'
    })
  }

  if (!booking) {
    return (
      <Card className="h-full" data-ui={isNewUIEnabled() ? 'new' : 'old'}>
        <CardHeader>
          <h3 className="text-lg font-semibold text-text-primary flex items-center gap-2">
            <Calendar className="w-5 h-5 text-brand-400" />
            Next Booking
          </h3>
        </CardHeader>
        <CardContent className="flex-1 flex flex-col items-center justify-center text-center py-8">
          <div className="w-12 h-12 rounded-full bg-surface-tertiary flex items-center justify-center mb-4">
            <Calendar className="w-6 h-6 text-text-muted" />
          </div>
          <h4 className="font-medium text-text-primary mb-2">No upcoming bookings</h4>
          <p className="text-sm text-text-secondary text-center px-4">
            Your next booking will appear here. Use the floating book button to schedule a service.
          </p>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="h-full" data-ui={isNewUIEnabled() ? 'new' : 'old'}>
      <CardHeader>
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold text-text-primary flex items-center gap-2">
            <Calendar className="w-5 h-5 text-brand-400" />
            Next Booking
          </h3>
          <Button
            variant="ghost"
            size="icon"
            aria-label="View booking details"
            onClick={() => openOverlay({
              type: 'booking-view',
              data: { bookingId: booking.id, booking }
            })}
          >
            <ChevronRight className="w-4 h-4" />
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Countdown */}
        <div className="bg-brand-600/10 rounded-lg p-3 text-center border border-brand-600/20">
          <p className="text-sm text-text-secondary mb-1">Starting</p>
          <p className="text-lg font-bold text-brand-400">{timeUntil}</p>
        </div>

        {/* Booking Details */}
        <div className="space-y-3">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-surface-tertiary border border-border-secondary flex items-center justify-center">
              <Calendar className="w-4 h-4 text-brand-400" />
            </div>
            <div>
              <p className="font-medium text-text-primary">
                {formatDate(booking.scheduled_date)}
              </p>
              <p className="text-sm text-text-secondary">
                {formatTime(booking.scheduled_start_time)}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-surface-tertiary border border-border-secondary flex items-center justify-center">
              <Car className="w-4 h-4 text-brand-400" />
            </div>
            <div>
              <p className="font-medium text-text-primary">
                {booking.vehicle ? `${booking.vehicle.year || ''} ${booking.vehicle.make} ${booking.vehicle.model}`.trim() : 'Vehicle details pending'}
              </p>
              <p className="text-sm text-text-secondary">
                {booking.service?.name || 'Service details pending'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-surface-tertiary border border-border-secondary flex items-center justify-center">
              <MapPin className="w-4 h-4 text-brand-400" />
            </div>
            <div>
              <p className="font-medium text-text-primary">
                {booking.address?.address_line_1 || 'Address pending'}
              </p>
              <p className="text-sm text-text-secondary">
                {booking.address?.city || 'City pending'}
              </p>
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="flex flex-col sm:flex-row gap-2 pt-2">
          {booking.status !== 'in_progress' && (
            <Button
              variant="outline"
              size="sm"
              className="flex-1 min-h-[48px] touch-manipulation"
              onClick={() => openOverlay({
                type: 'booking-reschedule',
                data: { bookingId: booking.id, booking }
              })}
              fullWidth
            >
              Reschedule
            </Button>
          )}
          <Button
            variant="outline"
            size="sm"
            className="flex-1 min-h-[48px] touch-manipulation"
            onClick={() => openOverlay({
              type: 'booking-cancel',
              data: { bookingId: booking.id, booking }
            })}
            fullWidth
          >
            Cancel
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}