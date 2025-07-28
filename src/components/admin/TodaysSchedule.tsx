'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/primitives/Button'
import { 
  CalendarIcon,
  ClockIcon,
  MapPinIcon,
  PhoneIcon,
  CarIcon,
  CheckIcon,
  XIcon,
  PlayIcon,
  CheckCircleIcon,
  AlertCircleIcon,
  RefreshCwIcon
} from 'lucide-react'

interface TodaysBooking {
  id: string
  booking_reference: string
  customer_name: string
  customer_phone: string
  scheduled_start_time: string
  scheduled_end_time: string
  status: 'pending' | 'confirmed' | 'in_progress' | 'completed' | 'cancelled'
  total_price: number
  services: Array<{
    name: string
  }>
  vehicle: {
    make: string
    model: string
    color?: string
  }
  address: {
    address_line_1: string
    city: string
    postal_code: string
  }
  special_instructions?: string
}

interface TodaysScheduleProps {
  onRefresh?: () => void
}

const statusConfig = {
  pending: {
    label: 'Pending',
    color: 'text-yellow-600',
    bgColor: 'bg-yellow-50',
    borderColor: 'border-yellow-200',
    icon: AlertCircleIcon
  },
  confirmed: {
    label: 'Confirmed',
    color: 'text-blue-600',
    bgColor: 'bg-blue-50',
    borderColor: 'border-blue-200',
    icon: CheckCircleIcon
  },
  in_progress: {
    label: 'In Progress',
    color: 'text-purple-600',
    bgColor: 'bg-purple-50',
    borderColor: 'border-purple-200',
    icon: PlayIcon
  },
  completed: {
    label: 'Completed',
    color: 'text-green-600',
    bgColor: 'bg-green-50',
    borderColor: 'border-green-200',
    icon: CheckCircleIcon
  },
  cancelled: {
    label: 'Cancelled',
    color: 'text-red-600',
    bgColor: 'bg-red-50',
    borderColor: 'border-red-200',
    icon: XIcon
  }
}

export function TodaysSchedule({ onRefresh }: TodaysScheduleProps) {
  const [bookings, setBookings] = useState<TodaysBooking[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isUpdating, setIsUpdating] = useState<string | null>(null)

  const fetchTodaysBookings = async () => {
    try {
      const today = new Date().toISOString().split('T')[0]
      const response = await fetch(`/api/admin/bookings?date=${today}&sort=time`)
      const data = await response.json()
      
      if (data.success) {
        setBookings(data.data)
      }
    } catch (error) {
      console.error('Failed to fetch today\'s bookings:', error)
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    fetchTodaysBookings()
  }, [])

  const updateBookingStatus = async (bookingId: string, newStatus: string) => {
    setIsUpdating(bookingId)
    try {
      const response = await fetch(`/api/admin/bookings/${bookingId}/status`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus })
      })

      const data = await response.json()
      if (data.success) {
        setBookings(prev => prev.map(booking => 
          booking.id === bookingId 
            ? { ...booking, status: newStatus as TodaysBooking['status'] }
            : booking
        ))
        onRefresh?.()
      }
    } catch (error) {
      console.error('Failed to update booking status:', error)
    } finally {
      setIsUpdating(null)
    }
  }

  const formatTime = (time: string) => {
    const [hours, minutes] = time.split(':')
    const hour = parseInt(hours || '0')
    const ampm = hour >= 12 ? 'PM' : 'AM'
    const displayHour = hour % 12 || 12
    return `${displayHour}:${minutes || '00'} ${ampm}`
  }

  const getTodayFormatted = () => {
    return new Date().toLocaleDateString('en-GB', {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
      year: 'numeric'
    })
  }

  const getNextBooking = () => {
    const now = new Date()
    const currentTime = now.getHours() * 60 + now.getMinutes()
    
    return bookings
      .filter(booking => ['confirmed', 'in_progress'].includes(booking.status))
      .find(booking => {
        const [hours, minutes] = booking.scheduled_start_time.split(':')
        const bookingTime = parseInt(hours || '0') * 60 + parseInt(minutes || '0')
        return bookingTime >= currentTime
      })
  }

  const getStats = () => {
    const total = bookings.length
    const completed = bookings.filter(b => b.status === 'completed').length
    const inProgress = bookings.filter(b => b.status === 'in_progress').length
    const pending = bookings.filter(b => b.status === 'pending').length
    const revenue = bookings
      .filter(b => b.status === 'completed')
      .reduce((sum, b) => sum + b.total_price, 0)

    return { total, completed, inProgress, pending, revenue }
  }

  if (isLoading) {
    return (
      <div className="bg-surface-secondary rounded-lg border border-border-primary p-6">
        <div className="flex items-center justify-center h-32">
          <div className="animate-spin w-6 h-6 border-2 border-brand-purple border-t-transparent rounded-full"></div>
        </div>
      </div>
    )
  }

  const nextBooking = getNextBooking()
  const stats = getStats()

  return (
    <div className="bg-surface-secondary rounded-lg border border-border-primary">
      {/* Header */}
      <div className="flex items-center justify-between p-6 border-b border-border-secondary">
        <div>
          <h2 className="text-xl font-semibold text-text-primary flex items-center gap-2">
            <CalendarIcon className="w-5 h-5" />
            Today&apos;s Schedule
          </h2>
          <p className="text-text-secondary text-sm mt-1">
            {getTodayFormatted()}
          </p>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={() => {
            fetchTodaysBookings()
            onRefresh?.()
          }}
        >
          <RefreshCwIcon className="w-4 h-4 mr-1" />
          Refresh
        </Button>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4 p-6 border-b border-border-secondary">
        <div className="text-center">
          <p className="text-2xl font-bold text-text-primary">{stats.total}</p>
          <p className="text-xs text-text-secondary">Total</p>
        </div>
        <div className="text-center">
          <p className="text-2xl font-bold text-yellow-600">{stats.pending}</p>
          <p className="text-xs text-text-secondary">Pending</p>
        </div>
        <div className="text-center">
          <p className="text-2xl font-bold text-purple-600">{stats.inProgress}</p>
          <p className="text-xs text-text-secondary">In Progress</p>
        </div>
        <div className="text-center">
          <p className="text-2xl font-bold text-green-600">{stats.completed}</p>
          <p className="text-xs text-text-secondary">Completed</p>
        </div>
        <div className="text-center">
          <p className="text-2xl font-bold text-brand-purple">£{stats.revenue}</p>
          <p className="text-xs text-text-secondary">Revenue</p>
        </div>
      </div>

      {/* Next Booking Alert */}
      {nextBooking && (
        <div className="p-4 mx-6 mt-6 bg-blue-50 border border-blue-200 rounded-lg">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-100 rounded-full">
              <ClockIcon className="w-4 h-4 text-blue-600" />
            </div>
            <div className="flex-1">
              <p className="text-sm font-medium text-blue-900">
                Next: {nextBooking.customer_name} at {formatTime(nextBooking.scheduled_start_time)}
              </p>
              <p className="text-xs text-blue-700">
                {nextBooking.vehicle.make} {nextBooking.vehicle.model} • {nextBooking.address.city}
              </p>
            </div>
            <div className="flex gap-1">
              <a
                href={`tel:${nextBooking.customer_phone}`}
                className="p-1 text-blue-600 hover:text-blue-800"
              >
                <PhoneIcon className="w-4 h-4" />
              </a>
            </div>
          </div>
        </div>
      )}

      {/* Bookings List */}
      <div className="p-6">
        {bookings.length === 0 ? (
          <div className="text-center py-8">
            <CalendarIcon className="w-12 h-12 text-text-muted mx-auto mb-3" />
            <p className="text-text-secondary">No bookings scheduled for today</p>
            <p className="text-text-muted text-sm">Enjoy your day off!</p>
          </div>
        ) : (
          <div className="space-y-3">
            {bookings.map((booking) => {
              const status = statusConfig[booking.status]
              const StatusIcon = status.icon
              
              return (
                <div
                  key={booking.id}
                  className={`p-4 rounded-lg border ${status.bgColor} ${status.borderColor}`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <div className="flex items-center gap-2">
                          <ClockIcon className="w-4 h-4 text-text-secondary" />
                          <span className="font-medium text-text-primary">
                            {formatTime(booking.scheduled_start_time)}
                          </span>
                        </div>
                        <div className={`flex items-center gap-1 px-2 py-1 rounded-full text-xs ${status.bgColor} ${status.borderColor} border`}>
                          <StatusIcon className={`w-3 h-3 ${status.color}`} />
                          <span className={status.color}>{status.label}</span>
                        </div>
                      </div>
                      
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-sm">
                        <div className="flex items-center gap-2">
                          <div className="w-4 h-4 bg-text-muted rounded-full flex items-center justify-center">
                            <span className="text-xs text-white font-bold">
                              {booking.customer_name.charAt(0)}
                            </span>
                          </div>
                          <span className="text-text-primary font-medium">
                            {booking.customer_name}
                          </span>
                        </div>
                        
                        <div className="flex items-center gap-2">
                          <CarIcon className="w-4 h-4 text-text-secondary" />
                          <span className="text-text-secondary">
                            {booking.vehicle.make} {booking.vehicle.model}
                          </span>
                        </div>
                        
                        <div className="flex items-center gap-2">
                          <MapPinIcon className="w-4 h-4 text-text-secondary" />
                          <span className="text-text-secondary">
                            {booking.address.city}
                          </span>
                        </div>
                      </div>
                      
                      <div className="mt-2">
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
                    </div>

                    {/* Quick Actions */}
                    <div className="flex flex-col gap-1 ml-4">
                      {booking.status === 'pending' && (
                        <>
                          <Button
                            size="sm"
                            onClick={() => updateBookingStatus(booking.id, 'confirmed')}
                            disabled={isUpdating === booking.id}
                            className="text-xs px-2 py-1 h-7"
                          >
                            <CheckIcon className="w-3 h-3 mr-1" />
                            Confirm
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => updateBookingStatus(booking.id, 'cancelled')}
                            disabled={isUpdating === booking.id}
                            className="text-xs px-2 py-1 h-7"
                          >
                            <XIcon className="w-3 h-3 mr-1" />
                            Cancel
                          </Button>
                        </>
                      )}
                      
                      {booking.status === 'confirmed' && (
                        <Button
                          size="sm"
                          onClick={() => updateBookingStatus(booking.id, 'in_progress')}
                          disabled={isUpdating === booking.id}
                          className="text-xs px-2 py-1 h-7"
                        >
                          <PlayIcon className="w-3 h-3 mr-1" />
                          Start
                        </Button>
                      )}
                      
                      {booking.status === 'in_progress' && (
                        <Button
                          size="sm"
                          onClick={() => updateBookingStatus(booking.id, 'completed')}
                          disabled={isUpdating === booking.id}
                          className="text-xs px-2 py-1 h-7"
                        >
                          <CheckCircleIcon className="w-3 h-3 mr-1" />
                          Complete
                        </Button>
                      )}

                      <a
                        href={`tel:${booking.customer_phone}`}
                        className="flex items-center justify-center w-7 h-7 text-text-secondary hover:text-text-primary border border-border-secondary rounded hover:bg-surface-hover transition-colors"
                      >
                        <PhoneIcon className="w-3 h-3" />
                      </a>
                    </div>
                  </div>
                  
                  {booking.special_instructions && (
                    <div className="mt-3 p-2 bg-surface-primary rounded text-xs">
                      <p className="text-text-secondary font-medium mb-1">Special Instructions:</p>
                      <p className="text-text-primary">{booking.special_instructions}</p>
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}