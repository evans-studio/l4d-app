'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { CustomerLayout } from '@/components/layouts/CustomerLayout'
import { Button } from '@/components/ui/primitives/Button'
import { 
  ArrowLeftIcon,
  CalendarIcon,
  ClockIcon,
  AlertCircleIcon,
  CheckCircleIcon,
  LoaderIcon,
  MapPinIcon,
  CarIcon
} from 'lucide-react'

interface BookingDetails {
  id: string
  booking_reference: string
  scheduled_date: string
  scheduled_start_time: string
  status: string
  total_price: number
  services: Array<{
    id: string
    name: string
    price: number
    duration: number
  }>
  vehicle: {
    make: string
    model: string
    year?: number
  } | null
  address: {
    address_line_1: string
    city: string
    postal_code: string
  } | null
}

interface TimeSlot {
  id: string
  start_time: string
  end_time: string
  date: string
  is_available: boolean
}

interface AvailableDate {
  date: string
  slots: TimeSlot[]
}

export default function RescheduleBookingPage({ params }: { params: Promise<{ id: string }> }) {
  const router = useRouter()
  const [bookingId, setBookingId] = useState<string | null>(null)
  const [booking, setBooking] = useState<BookingDetails | null>(null)
  const [availableDates, setAvailableDates] = useState<AvailableDate[]>([])
  const [selectedDate, setSelectedDate] = useState<string>('')
  const [selectedTimeSlot, setSelectedTimeSlot] = useState<TimeSlot | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isLoadingSlots, setIsLoadingSlots] = useState(false)
  const [isRescheduling, setIsRescheduling] = useState(false)
  const [error, setError] = useState('')
  const [rescheduleReason, setRescheduleReason] = useState('')

  // Resolve params
  useEffect(() => {
    const resolveParams = async () => {
      const resolvedParams = await params
      setBookingId(resolvedParams.id)
    }
    resolveParams()
  }, [params])

  // Load booking details
  useEffect(() => {
    const loadBookingDetails = async () => {
      if (!bookingId) return

      try {
        setIsLoading(true)
        const response = await fetch(`/api/customer/bookings/${bookingId}`)
        const data = await response.json()

        if (data.success) {
          setBooking(data.data)
          // Load available dates for the next 30 days
          await loadAvailableDates()
        } else {
          setError('Failed to load booking details')
        }
      } catch (error) {
        console.error('Failed to load booking:', error)
        setError('Failed to load booking details')
      } finally {
        setIsLoading(false)
      }
    }

    loadBookingDetails()
  }, [bookingId])

  const loadAvailableDates = async () => {
    try {
      setIsLoadingSlots(true)
      
      // Get dates for the next 30 days
      const dates = []
      const today = new Date()
      
      for (let i = 1; i <= 30; i++) {
        const date = new Date(today)
        date.setDate(today.getDate() + i)
        dates.push(date.toISOString().split('T')[0])
      }

      const availabilityPromises = dates.map(async (date) => {
        const response = await fetch(`/api/time-slots/availability?date=${date}`)
        const data = await response.json()
        
        if (data.success && data.data.available_slots.length > 0) {
          return {
            date,
            slots: data.data.available_slots.map((slot: any) => ({
              id: slot.id,
              start_time: slot.start_time,
              end_time: slot.end_time,
              date,
              is_available: true
            }))
          }
        }
        return null
      })

      const results = await Promise.all(availabilityPromises)
      const validDates = results.filter(Boolean) as AvailableDate[]
      setAvailableDates(validDates)
      
    } catch (error) {
      console.error('Failed to load available dates:', error)
      setError('Failed to load available time slots')
    } finally {
      setIsLoadingSlots(false)
    }
  }

  const handleReschedule = async () => {
    if (!booking || !selectedTimeSlot || !rescheduleReason.trim()) {
      setError('Please select a time slot and provide a reason for rescheduling')
      return
    }

    try {
      setIsRescheduling(true)
      setError('')

      const response = await fetch(`/api/customer/bookings/${booking.id}/reschedule`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          new_date: selectedTimeSlot.date,
          new_start_time: selectedTimeSlot.start_time,
          new_end_time: selectedTimeSlot.end_time,
          time_slot_id: selectedTimeSlot.id,
          reason: rescheduleReason
        })
      })

      const data = await response.json()

      if (data.success) {
        // Redirect back to booking details with success message
        router.push(`/dashboard/bookings/${booking.id}?rescheduled=true`)
      } else {
        setError(data.error?.message || 'Failed to reschedule booking')
      }
    } catch (error) {
      console.error('Failed to reschedule booking:', error)
      setError('Failed to reschedule booking. Please try again.')
    } finally {
      setIsRescheduling(false)
    }
  }

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr)
    return date.toLocaleDateString('en-GB', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    })
  }

  const formatTime = (timeStr: string) => {
    const [hours, minutes] = timeStr.split(':')
    const hour = parseInt(hours || '0')
    const ampm = hour >= 12 ? 'PM' : 'AM'
    const displayHour = hour % 12 || 12
    return `${displayHour}:${minutes || '00'} ${ampm}`
  }

  if (isLoading) {
    return (
      <CustomerLayout>
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-brand-purple"></div>
        </div>
      </CustomerLayout>
    )
  }

  if (!booking) {
    return (
      <CustomerLayout>
        <div className="max-w-4xl mx-auto p-6">
          <div className="text-center py-12">
            <h1 className="text-2xl font-bold text-text-primary mb-4">Booking Not Found</h1>
            <Button
              variant="outline"
              onClick={() => router.push('/dashboard/bookings')}
            >
              Back to Bookings
            </Button>
          </div>
        </div>
      </CustomerLayout>
    )
  }

  if (booking.status !== 'pending' && booking.status !== 'confirmed') {
    return (
      <CustomerLayout>
        <div className="max-w-4xl mx-auto p-6">
          <div className="text-center py-12">
            <AlertCircleIcon className="w-12 h-12 text-yellow-600 mx-auto mb-4" />
            <h1 className="text-2xl font-bold text-text-primary mb-4">Cannot Reschedule</h1>
            <p className="text-text-secondary mb-6">
              This booking cannot be rescheduled as it is {booking.status}.
            </p>
            <Button
              variant="outline"
              onClick={() => router.push(`/dashboard/bookings/${booking.id}`)}
            >
              Back to Booking Details
            </Button>
          </div>
        </div>
      </CustomerLayout>
    )
  }

  return (
    <CustomerLayout>
      <div className="max-w-6xl mx-auto p-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-4">
            <Button
              variant="outline"
              onClick={() => router.push(`/dashboard/bookings/${booking.id}`)}
            >
              <ArrowLeftIcon className="w-4 h-4 mr-2" />
              Back to Booking
            </Button>
            <div>
              <h1 className="text-2xl font-bold text-text-primary">
                Reschedule Booking #{booking.booking_reference}
              </h1>
              <p className="text-text-secondary">
                Select a new date and time for your appointment
              </p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Current Booking Details */}
          <div className="lg:col-span-1">
            <div className="bg-surface-secondary rounded-lg p-6 border border-border-primary sticky top-6">
              <h3 className="text-lg font-semibold text-text-primary mb-4">Current Booking</h3>
              
              <div className="space-y-4">
                {/* Current Date & Time */}
                <div className="flex items-center gap-3">
                  <CalendarIcon className="w-5 h-5 text-text-secondary" />
                  <div>
                    <p className="text-text-secondary text-sm">Current Date</p>
                    <p className="text-text-primary font-medium">
                      {formatDate(booking.scheduled_date)}
                    </p>
                    <p className="text-text-primary text-sm">
                      {formatTime(booking.scheduled_start_time)}
                    </p>
                  </div>
                </div>

                {/* Vehicle */}
                {booking.vehicle && (
                  <div className="flex items-center gap-3">
                    <CarIcon className="w-5 h-5 text-text-secondary" />
                    <div>
                      <p className="text-text-secondary text-sm">Vehicle</p>
                      <p className="text-text-primary font-medium">
                        {booking.vehicle.make} {booking.vehicle.model}
                        {booking.vehicle.year && ` (${booking.vehicle.year})`}
                      </p>
                    </div>
                  </div>
                )}

                {/* Address */}
                {booking.address && (
                  <div className="flex items-center gap-3">
                    <MapPinIcon className="w-5 h-5 text-text-secondary" />
                    <div>
                      <p className="text-text-secondary text-sm">Location</p>
                      <p className="text-text-primary font-medium">
                        {booking.address.city}, {booking.address.postal_code}
                      </p>
                    </div>
                  </div>
                )}

                {/* Services */}
                <div>
                  <p className="text-text-secondary text-sm mb-2">Services</p>
                  <div className="space-y-1">
                    {booking.services.map((service, index) => (
                      <p key={index} className="text-text-primary text-sm">
                        {service.name}
                      </p>
                    ))}
                  </div>
                </div>

                {/* Total */}
                <div className="border-t border-border-secondary pt-4">
                  <div className="flex justify-between items-center">
                    <span className="text-text-secondary">Total</span>
                    <span className="text-lg font-bold text-brand-purple">
                      £{booking.total_price}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Reschedule Form */}
          <div className="lg:col-span-2">
            <div className="bg-surface-secondary rounded-lg p-6 border border-border-primary">
              <h3 className="text-lg font-semibold text-text-primary mb-6">
                Select New Date & Time
              </h3>

              {error && (
                <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
                  <div className="flex items-center gap-2">
                    <AlertCircleIcon className="w-5 h-5 text-red-600" />
                    <p className="text-red-800">{error}</p>
                  </div>
                </div>
              )}

              {isLoadingSlots ? (
                <div className="flex items-center justify-center py-12">
                  <LoaderIcon className="w-6 h-6 animate-spin text-brand-purple" />
                  <span className="ml-2 text-text-secondary">Loading available time slots...</span>
                </div>
              ) : (
                <>
                  {/* Date Selection */}
                  <div className="mb-6">
                    <label className="block text-sm font-medium text-text-primary mb-3">
                      Select Date
                    </label>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                      {availableDates.map((dateOption) => (
                        <button
                          key={dateOption.date}
                          onClick={() => {
                            setSelectedDate(dateOption.date)
                            setSelectedTimeSlot(null)
                          }}
                          className={`p-3 rounded-lg border text-left transition-colors ${
                            selectedDate === dateOption.date
                              ? 'border-brand-purple bg-brand-purple/10 text-brand-purple'
                              : 'border-border-secondary hover:border-border-primary text-text-primary'
                          }`}
                        >
                          <div className="font-medium">
                            {formatDate(dateOption.date)}
                          </div>
                          <div className="text-sm text-text-secondary">
                            {dateOption.slots.length} slots available
                          </div>
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Time Slot Selection */}
                  {selectedDate && (
                    <div className="mb-6">
                      <label className="block text-sm font-medium text-text-primary mb-3">
                        Select Time Slot
                      </label>
                      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
                        {availableDates
                          .find(d => d.date === selectedDate)
                          ?.slots.map((slot) => (
                            <button
                              key={slot.id}
                              onClick={() => setSelectedTimeSlot(slot)}
                              className={`p-3 rounded-lg border text-center transition-colors ${
                                selectedTimeSlot?.id === slot.id
                                  ? 'border-brand-purple bg-brand-purple/10 text-brand-purple'
                                  : 'border-border-secondary hover:border-border-primary text-text-primary'
                              }`}
                            >
                              <div className="font-medium">
                                {formatTime(slot.start_time)}
                              </div>
                              <div className="text-xs text-text-secondary">
                                {formatTime(slot.end_time)}
                              </div>
                            </button>
                          ))
                        }
                      </div>
                    </div>
                  )}

                  {/* Reason for Rescheduling */}
                  <div className="mb-6">
                    <label className="block text-sm font-medium text-text-primary mb-2">
                      Reason for Rescheduling *
                    </label>
                    <textarea
                      value={rescheduleReason}
                      onChange={(e) => setRescheduleReason(e.target.value)}
                      placeholder="Please let us know why you need to reschedule..."
                      rows={3}
                      className="w-full px-3 py-2 bg-surface-primary border border-border-secondary rounded-md text-text-primary placeholder-text-muted focus:border-brand-400 focus:outline-none focus:ring-2 focus:ring-brand-600/20"
                      required
                    />
                  </div>

                  {/* Action Buttons */}
                  <div className="flex flex-col sm:flex-row gap-3 justify-end">
                    <Button
                      variant="outline"
                      onClick={() => router.push(`/dashboard/bookings/${booking.id}`)}
                    >
                      Cancel
                    </Button>
                    <Button
                      onClick={handleReschedule}
                      disabled={!selectedTimeSlot || !rescheduleReason.trim() || isRescheduling}
                      className="flex items-center gap-2"
                    >
                      {isRescheduling ? (
                        <>
                          <LoaderIcon className="w-4 h-4 animate-spin" />
                          Rescheduling...
                        </>
                      ) : (
                        <>
                          <CheckCircleIcon className="w-4 h-4" />
                          Confirm Reschedule
                        </>
                      )}
                    </Button>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      </div>
    </CustomerLayout>
  )
}