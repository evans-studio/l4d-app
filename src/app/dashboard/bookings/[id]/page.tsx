'use client'

import { useEffect, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { supabase } from '@/lib/supabase/client'
import { useAuth } from '@/lib/auth-compat'
import { Button } from '@/components/ui/primitives/Button'
import { CustomerLayout } from '@/components/layout/templates/CustomerLayout'
import { Container } from '@/components/layout/templates/PageLayout'
import { CustomerRoute } from '@/components/ProtectedRoute'
import { 
  ArrowLeft,
  Calendar,
  Clock,
  MapPin,
  Car,
  CreditCard,
  FileText,
  CheckCircle,
  AlertCircle,
  X,
  Clock as PendingIcon,
  Mail,
  Phone,
  Edit2
} from 'lucide-react'

interface BookingDetails {
  id: string
  booking_reference: string
  scheduled_date: string
  start_time: string
  end_time: string
  status: 'pending' | 'confirmed' | 'in_progress' | 'completed' | 'cancelled'
  total_price: number
  special_instructions?: string
  distance_km?: number
  estimated_duration: number
  created_at: string
  confirmed_at?: string
  completed_at?: string
  cancelled_at?: string
  cancellation_reason?: string
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
    color?: string
    registration?: string
  } | null
  address: {
    name: string
    address_line_1: string
    address_line_2?: string
    city: string
    postal_code: string
  } | null
}

const statusConfig = {
  pending: {
    label: 'Pending Confirmation',
    icon: PendingIcon,
    color: 'text-warning-400',
    bgColor: 'bg-warning-600/10',
    borderColor: 'border-warning-500/20'
  },
  confirmed: {
    label: 'Confirmed',
    icon: CheckCircle,
    color: 'text-success-400',
    bgColor: 'bg-success-600/10',
    borderColor: 'border-success-500/20'
  },
  in_progress: {
    label: 'In Progress',
    icon: AlertCircle,
    color: 'text-brand-400',
    bgColor: 'bg-brand-600/10',
    borderColor: 'border-brand-500/20'
  },
  completed: {
    label: 'Completed',
    icon: CheckCircle,
    color: 'text-success-400',
    bgColor: 'bg-success-600/10',
    borderColor: 'border-success-500/20'
  },
  cancelled: {
    label: 'Cancelled',
    icon: X,
    color: 'text-error-400',
    bgColor: 'bg-error-600/10',
    borderColor: 'border-error-500/20'
  }
}

export default function BookingDetailsPage({ params }: { params: Promise<{ id: string }> }) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { user, isLoading: authLoading } = useAuth()
  const [booking, setBooking] = useState<BookingDetails | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [showCancelModal, setShowCancelModal] = useState(false)
  const [isCancelling, setIsCancelling] = useState(false)
  const [bookingId, setBookingId] = useState<string | null>(null)
  const [showSuccessMessage, setShowSuccessMessage] = useState(false)

  useEffect(() => {
    const resolveParams = async () => {
      const resolvedParams = await params
      setBookingId(resolvedParams.id)
    }
    resolveParams()
  }, [params])

  // Check for success message from reschedule
  useEffect(() => {
    if (searchParams.get('rescheduled') === 'true') {
      setShowSuccessMessage(true)
      // Remove the query parameter from URL
      const newUrl = window.location.pathname
      window.history.replaceState({}, '', newUrl)
      
      // Auto-hide success message after 5 seconds
      setTimeout(() => {
        setShowSuccessMessage(false)
      }, 5000)
    }
  }, [searchParams])

  useEffect(() => {
    const fetchBookingDetails = async () => {
      if (authLoading || !user || !bookingId) {
        return
      }

      try {
        const { data: { session } } = await supabase.auth.getSession()
        
        if (!session?.access_token) {
          setIsLoading(false)
          return
        }

        const authHeaders = {
          'Authorization': `Bearer ${session.access_token}`,
          'Content-Type': 'application/json'
        }

        // Fetch single booking details
        const response = await fetch(`/api/customer/bookings/${bookingId}`, {
          headers: authHeaders
        })
        
        if (response.ok) {
          const data = await response.json()
          if (data.success) {
            setBooking(data.data)
          } else {
            console.error('Failed to fetch booking:', data.error)
            router.push('/dashboard')
          }
        } else if (response.status === 404) {
          router.push('/dashboard')
        }

      } catch (error) {
        console.error('Failed to fetch booking details:', error)
        router.push('/dashboard')
      } finally {
        setIsLoading(false)
      }
    }

    fetchBookingDetails()
  }, [user, authLoading, bookingId, router])

  const formatTime = (time: string) => {
    const [hours, minutes] = time.split(':')
    const hour = parseInt(hours || '0')
    const ampm = hour >= 12 ? 'PM' : 'AM'
    const displayHour = hour % 12 || 12
    return `${displayHour}:${minutes || '00'} ${ampm}`
  }

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr)
    return date.toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    })
  }

  const formatDateTime = (dateStr: string) => {
    const date = new Date(dateStr)
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
      hour12: true
    })
  }

  const handleCancelBooking = async () => {
    if (!booking) return

    setIsCancelling(true)
    try {
      const { data: { session } } = await supabase.auth.getSession()
      
      if (!session?.access_token) {
        return
      }

      const response = await fetch(`/api/customer/bookings/${booking.id}/cancel`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          reason: 'Cancelled by customer'
        })
      })

      if (response.ok) {
        const data = await response.json()
        if (data.success) {
          setBooking(prev => prev ? { ...prev, status: 'cancelled', cancellation_reason: 'Cancelled by customer' } : null)
          setShowCancelModal(false)
        }
      }
    } catch (error) {
      console.error('Failed to cancel booking:', error)
    } finally {
      setIsCancelling(false)
    }
  }

  if (authLoading || isLoading) {
    return (
      <CustomerLayout>
        <Container>
          <div className="flex items-center justify-center py-20">
            <div className="animate-spin w-8 h-8 border-4 border-brand-600 border-t-transparent rounded-full"></div>
          </div>
        </Container>
      </CustomerLayout>
    )
  }

  if (!booking) {
    return (
      <CustomerLayout>
        <Container>
          <div className="text-center py-20">
            <h1 className="text-2xl font-bold text-text-primary mb-4">Booking Not Found</h1>
            <Button onClick={() => router.push('/dashboard')}>
              Back to Dashboard
            </Button>
          </div>
        </Container>
      </CustomerLayout>
    )
  }

  const status = statusConfig[booking.status]
  const StatusIcon = status.icon
  const canCancel = booking.status === 'pending'
  const canReschedule = ['pending', 'confirmed'].includes(booking.status)

  return (
    <CustomerRoute>
      <CustomerLayout>
        <Container>
          {/* Success Message */}
          {showSuccessMessage && (
            <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg">
              <div className="flex items-center gap-2">
                <CheckCircle className="w-5 h-5 text-green-600" />
                <p className="text-green-800 font-medium">
                  Booking rescheduled successfully! We&apos;ll send you a confirmation email shortly.
                </p>
                <button
                  onClick={() => setShowSuccessMessage(false)}
                  className="ml-auto text-green-600 hover:text-green-700"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}

          {/* Header */}
          <div className="flex items-center justify-between mb-8">
            <div className="flex items-center gap-4">
              <Button
                onClick={() => router.push('/dashboard')}
                variant="outline"
                size="sm"
                leftIcon={<ArrowLeft className="w-4 h-4" />}
              >
                Back to Dashboard
              </Button>
              <div>
                <h1 className="text-3xl font-bold text-text-primary">
                  Booking #{booking.booking_reference}
                </h1>
                <div className={`inline-flex items-center gap-2 px-3 py-1 rounded-full text-sm border mt-2 ${status.bgColor} ${status.borderColor}`}>
                  <StatusIcon className={`w-4 h-4 ${status.color}`} />
                  <span className={status.color}>{status.label}</span>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-3">
              {canReschedule && (
                <Button
                  onClick={() => router.push(`/dashboard/bookings/${booking.id}/reschedule`)}
                  variant="outline"
                  className="flex items-center gap-2"
                >
                  <Edit2 className="w-4 h-4" />
                  Reschedule
                </Button>
              )}
              {canCancel && (
                <Button
                  onClick={() => setShowCancelModal(true)}
                  variant="outline"
                  className="text-error-400 border-error-400 hover:bg-error-600/10"
                >
                  Cancel Booking
                </Button>
              )}
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Main Details */}
            <div className="lg:col-span-2 space-y-6">
              {/* Appointment Details */}
              <div className="bg-surface-secondary rounded-lg p-6 border border-border-secondary">
                <h2 className="text-xl font-semibold text-text-primary mb-6">Appointment Details</h2>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="flex items-center gap-3">
                    <Calendar className="w-5 h-5 text-brand-400" />
                    <div>
                      <p className="text-text-secondary text-sm mb-1">Date</p>
                      <p className="text-text-primary font-medium">
                        {formatDate(booking.scheduled_date)}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <Clock className="w-5 h-5 text-brand-400" />
                    <div>
                      <p className="text-text-secondary text-sm mb-1">Time</p>
                      <p className="text-text-primary font-medium">
                        {formatTime(booking.start_time)}
                        {booking.end_time && ` - ${formatTime(booking.end_time)}`}
                      </p>
                      <p className="text-text-secondary text-sm">
                        Duration: {booking.estimated_duration} minutes
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Vehicle Details */}
              {booking.vehicle && (
                <div className="bg-surface-secondary rounded-lg p-6 border border-border-secondary">
                  <h2 className="text-xl font-semibold text-text-primary mb-6">Vehicle Details</h2>
                  
                  <div className="flex items-center gap-3 mb-4">
                    <Car className="w-5 h-5 text-brand-400" />
                    <div>
                      <p className="text-text-primary font-medium text-lg">
                        {booking.vehicle.make} {booking.vehicle.model}
                      </p>
                      {booking.vehicle.year && (
                        <p className="text-text-secondary">
                          {booking.vehicle.year}
                        </p>
                      )}
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    {booking.vehicle.color && (
                      <div>
                        <p className="text-text-secondary text-sm mb-1">Color</p>
                        <p className="text-text-primary">{booking.vehicle.color}</p>
                      </div>
                    )}
                    {booking.vehicle.registration && (
                      <div>
                        <p className="text-text-secondary text-sm mb-1">Registration</p>
                        <p className="text-text-primary font-mono">{booking.vehicle.registration}</p>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Service Address */}
              {booking.address && (
                <div className="bg-surface-secondary rounded-lg p-6 border border-border-secondary">
                  <h2 className="text-xl font-semibold text-text-primary mb-6">Service Address</h2>
                  
                  <div className="flex items-start gap-3">
                    <MapPin className="w-5 h-5 text-brand-400 mt-1" />
                    <div>
                      <p className="text-text-primary font-medium">
                        {booking.address.address_line_1}
                      </p>
                      {booking.address.address_line_2 && (
                        <p className="text-text-primary">
                          {booking.address.address_line_2}
                        </p>
                      )}
                      <p className="text-text-primary">
                        {booking.address.city}, {booking.address.postal_code}
                      </p>
                      {booking.distance_km && (
                        <p className="text-text-secondary text-sm mt-2">
                          Distance: {booking.distance_km} km from our base
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {/* Services */}
              <div className="bg-surface-secondary rounded-lg p-6 border border-border-secondary">
                <h2 className="text-xl font-semibold text-text-primary mb-6">Services</h2>
                
                <div className="space-y-4">
                  {booking.services.map((service, index) => (
                    <div key={index} className="flex items-center justify-between p-4 bg-surface-tertiary rounded-lg">
                      <div>
                        <p className="text-text-primary font-medium">{service.name}</p>
                        <p className="text-text-secondary text-sm">
                          Duration: {service.duration} minutes
                        </p>
                      </div>
                      <p className="text-brand-400 font-semibold">£{service.price}</p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Special Instructions */}
              {booking.special_instructions && (
                <div className="bg-surface-secondary rounded-lg p-6 border border-border-secondary">
                  <h2 className="text-xl font-semibold text-text-primary mb-6">Special Instructions</h2>
                  <div className="flex items-start gap-3">
                    <FileText className="w-5 h-5 text-brand-400 mt-1" />
                    <p className="text-text-primary">{booking.special_instructions}</p>
                  </div>
                </div>
              )}
            </div>

            {/* Sidebar */}
            <div className="space-y-6">
              {/* Pricing Summary */}
              <div className="bg-surface-secondary rounded-lg p-6 border-2 border-border-accent">
                <h3 className="text-xl font-semibold text-text-primary mb-6">
                  Pricing Summary
                </h3>

                <div className="space-y-4">
                  {booking.services.map((service, index) => (
                    <div key={index} className="flex justify-between items-center text-sm">
                      <span className="text-text-secondary">{service.name}</span>
                      <span className="font-medium text-text-primary">£{service.price}</span>
                    </div>
                  ))}

                  <div className="border-t border-border-secondary pt-4">
                    <div className="flex justify-between items-center">
                      <span className="text-lg font-semibold text-text-primary">Total</span>
                      <span className="text-2xl font-bold text-brand-400">
                        £{booking.total_price}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="mt-6 p-4 bg-info-bg border border-info rounded-md">
                  <div className="flex items-start gap-3">
                    <CreditCard className="w-5 h-5 text-info mt-0.5" />
                    <div>
                      <p className="text-info text-sm font-medium mb-1">
                        Payment on Completion
                      </p>
                      <p className="text-info text-xs">
                        Payment is due after service completion. We accept cash, card, and bank transfer.
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Contact Information */}
              <div className="bg-surface-secondary rounded-lg p-6 border border-border-secondary">
                <h3 className="text-lg font-semibold text-text-primary mb-4">
                  Need Help?
                </h3>
                
                <div className="space-y-3">
                  <div className="flex items-center gap-3">
                    <Mail className="w-4 h-4 text-brand-400" />
                    <a href="mailto:hello@love4detailing.co.uk" className="text-text-link hover:text-text-link-hover text-sm">
                      hello@love4detailing.co.uk
                    </a>
                  </div>
                  <div className="flex items-center gap-3">
                    <Phone className="w-4 h-4 text-brand-400" />
                    <a href="tel:+44123456789" className="text-text-link hover:text-text-link-hover text-sm">
                      +44 123 456 789
                    </a>
                  </div>
                </div>

                <p className="text-text-secondary text-xs mt-4">
                  Contact us if you need to make changes or have questions about your booking.
                </p>
              </div>

              {/* Booking Timeline */}
              <div className="bg-surface-secondary rounded-lg p-6 border border-border-secondary">
                <h3 className="text-lg font-semibold text-text-primary mb-4">
                  Booking Timeline
                </h3>
                
                <div className="space-y-4">
                  <div className="flex items-start gap-3">
                    <div className="w-2 h-2 bg-brand-400 rounded-full mt-2"></div>
                    <div>
                      <p className="text-text-primary text-sm font-medium">Booking Created</p>
                      <p className="text-text-secondary text-xs">
                        {formatDateTime(booking.created_at)}
                      </p>
                    </div>
                  </div>

                  {booking.confirmed_at && (
                    <div className="flex items-start gap-3">
                      <div className="w-2 h-2 bg-success-400 rounded-full mt-2"></div>
                      <div>
                        <p className="text-text-primary text-sm font-medium">Confirmed</p>
                        <p className="text-text-secondary text-xs">
                          {formatDateTime(booking.confirmed_at)}
                        </p>
                      </div>
                    </div>
                  )}

                  {booking.completed_at && (
                    <div className="flex items-start gap-3">
                      <div className="w-2 h-2 bg-success-400 rounded-full mt-2"></div>
                      <div>
                        <p className="text-text-primary text-sm font-medium">Completed</p>
                        <p className="text-text-secondary text-xs">
                          {formatDateTime(booking.completed_at)}
                        </p>
                      </div>
                    </div>
                  )}

                  {booking.cancelled_at && (
                    <div className="flex items-start gap-3">
                      <div className="w-2 h-2 bg-error-400 rounded-full mt-2"></div>
                      <div>
                        <p className="text-text-primary text-sm font-medium">Cancelled</p>
                        <p className="text-text-secondary text-xs">
                          {formatDateTime(booking.cancelled_at)}
                        </p>
                        {booking.cancellation_reason && (
                          <p className="text-text-secondary text-xs mt-1">
                            Reason: {booking.cancellation_reason}
                          </p>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Cancel Booking Modal */}
          {showCancelModal && (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
              <div className="bg-surface-primary rounded-lg max-w-md w-full p-6">
                <h3 className="text-lg font-semibold text-text-primary mb-4">
                  Cancel Booking
                </h3>
                <p className="text-text-secondary mb-6">
                  Are you sure you want to cancel this booking? This action cannot be undone.
                </p>
                <div className="flex gap-3 justify-end">
                  <Button
                    onClick={() => setShowCancelModal(false)}
                    variant="outline"
                    disabled={isCancelling}
                  >
                    Keep Booking
                  </Button>
                  <Button
                    onClick={handleCancelBooking}
                    variant="primary"
                    className="bg-error-500 hover:bg-error-600"
                    disabled={isCancelling}
                  >
                    {isCancelling ? 'Cancelling...' : 'Yes, Cancel Booking'}
                  </Button>
                </div>
              </div>
            </div>
          )}
        </Container>
      </CustomerLayout>
    </CustomerRoute>
  )
}