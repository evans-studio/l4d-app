'use client'

import { useEffect, useState, Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { Card, CardHeader, CardContent } from '@/components/ui/composites/Card'
import { Button } from '@/components/ui/primitives/Button'
import { PricingBreakdown } from '@/components/ui/patterns/PricingBreakdown'
import { StatusBadge } from '@/components/ui/patterns/StatusBadge'
import { 
  CheckCircle, 
  Calendar, 
  Clock, 
  MapPin, 
  Car, 
  Mail, 
  Phone,
  Download,
  ArrowRight 
} from 'lucide-react'

interface BookingDetails {
  id: string
  booking_reference: string
  scheduled_date: string
  scheduled_start_time: string
  scheduled_end_time: string
  status: string
  total_price: number
  pricing_breakdown: any
  service: {
    name: string
    short_description: string
    category: string
  }
  vehicle: {
    make: string
    model: string
    year: number
    color: string
    vehicle_size: {
      name: string
      price_multiplier: number
    }
  }
  address: {
    address_line_1: string
    address_line_2?: string
    city: string
    postal_code: string
    county?: string
  }
  confirmation_sent_at?: string
}

function BookingSuccessContent() {
  const searchParams = useSearchParams()
  const bookingRef = searchParams.get('ref')
  const needsVerification = searchParams.get('verify') === 'true'
  const isNewCustomer = searchParams.get('new') === 'true'
  const [booking, setBooking] = useState<BookingDetails | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (bookingRef) {
      fetchBookingDetails(bookingRef)
    } else {
      setError('No booking reference provided')
      setLoading(false)
    }
  }, [bookingRef])

  const fetchBookingDetails = async (reference: string) => {
    try {
      const response = await fetch(`/api/bookings?reference=${reference}`)
      const data = await response.json()
      
      if (data.success && data.data) {
        setBooking(data.data)
      } else {
        setError('Booking not found')
      }
    } catch (err) {
      setError('Failed to load booking details')
    } finally {
      setLoading(false)
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-GB', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    })
  }

  const formatTime = (timeString: string) => {
    return new Date(`2000-01-01T${timeString}`).toLocaleTimeString('en-GB', {
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const downloadReceipt = () => {
    // TODO: Implement PDF generation
  }

  const addToCalendar = () => {
    if (!booking) return
    
    const startDate = new Date(`${booking.scheduled_date}T${booking.scheduled_start_time}`)
    const endDate = new Date(`${booking.scheduled_date}T${booking.scheduled_end_time}`)
    
    const event = {
      title: `${booking.service.name} - Love4Detailing`,
      start: startDate.toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z',
      end: endDate.toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z',
      description: `Vehicle detailing service for ${booking.vehicle.make} ${booking.vehicle.model}`,
      location: `${booking.address.address_line_1}, ${booking.address.city}, ${booking.address.postal_code}`
    }

    const googleCalendarUrl = `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${encodeURIComponent(event.title)}&dates=${event.start}/${event.end}&details=${encodeURIComponent(event.description)}&location=${encodeURIComponent(event.location)}`
    
    window.open(googleCalendarUrl, '_blank')
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-surface-primary flex items-center justify-center">
        <div className="animate-spin w-8 h-8 border-4 border-brand-600 border-t-transparent rounded-full"></div>
      </div>
    )
  }

  if (error || !booking) {
    return (
      <div className="min-h-screen bg-surface-primary flex items-center justify-center">
        <Card className="max-w-md w-full mx-4">
          <CardContent className="p-8 text-center">
            <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <CheckCircle className="w-8 h-8 text-red-600" />
            </div>
            <h1 className="text-2xl font-bold text-text-primary mb-2">
              Booking Not Found
            </h1>
            <p className="text-text-secondary mb-6">
              {error || 'We couldn\'t find your booking details.'}
            </p>
            <Link href="/book">
              <Button className="w-full">
                Book New Service
              </Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-surface-primary">
      <div className="max-w-4xl mx-auto px-4 py-8">
        {/* Success Header */}
        <div className="text-center mb-8">
          <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <CheckCircle className="w-10 h-10 text-green-600" />
          </div>
          <h1 className="text-3xl font-bold text-text-primary mb-2">
            Booking Confirmed!
          </h1>
          <p className="text-lg text-text-secondary">
            Thank you for choosing Love4Detailing. Your booking has been successfully created.
          </p>
          
          {/* Email Verification Notice for New Customers */}
          {needsVerification && isNewCustomer && (
            <div className="mt-6 p-4 bg-brand-50 border border-brand-200 rounded-lg max-w-2xl mx-auto">
              <div className="flex items-start gap-3">
                <Mail className="w-5 h-5 text-brand-600 mt-0.5 flex-shrink-0" />
                <div className="text-left">
                  <h3 className="font-semibold text-brand-800 mb-1">
                    Please verify your email to complete your account setup
                  </h3>
                  <p className="text-sm text-brand-700 mb-3">
                    We've sent a verification email with your booking confirmation and account setup instructions. 
                    Please check your inbox and follow the link to set up your password and access your customer dashboard.
                  </p>
                  <div className="text-xs text-brand-600">
                    • Access your booking details and manage appointments<br/>
                    • Save vehicle information for faster future bookings<br/>
                    • Track service history and receive updates
                  </div>
                </div>
              </div>
            </div>
          )}
          
          {/* Email Verification for Existing Users */}
          {needsVerification && !isNewCustomer && (
            <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg max-w-2xl mx-auto">
              <div className="flex items-start gap-3">
                <Mail className="w-5 h-5 text-blue-600 mt-0.5 flex-shrink-0" />
                <div className="text-left">
                  <h3 className="font-semibold text-blue-800 mb-1">
                    Email verification sent
                  </h3>
                  <p className="text-sm text-blue-700">
                    We've sent you a verification email with your booking confirmation. 
                    Please check your inbox to verify your email address.
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Booking Details */}
          <div className="lg:col-span-2 space-y-6">
            {/* Booking Reference */}
            <Card>
              <CardHeader>
                <h2 className="text-xl font-semibold text-text-primary">
                  Booking Details
                </h2>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-text-secondary">Booking Reference</span>
                  <span className="font-mono font-semibold text-brand-600 text-lg">
                    {booking.booking_reference}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <StatusBadge status={booking.status as any} />
                  {booking.confirmation_sent_at && (
                    <span className="text-xs text-text-tertiary">
                      Confirmation sent
                    </span>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Service & Vehicle Details */}
            <Card>
              <CardHeader>
                <h3 className="text-lg font-semibold text-text-primary">
                  Service & Vehicle
                </h3>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <h4 className="font-medium text-text-primary mb-2">Service</h4>
                    <p className="text-text-secondary text-sm">
                      {booking.service.name}
                    </p>
                    <p className="text-text-tertiary text-xs">
                      {booking.service.category}
                    </p>
                  </div>
                  <div>
                    <h4 className="font-medium text-text-primary mb-2">Vehicle</h4>
                    <div className="flex items-center gap-2">
                      <Car className="w-4 h-4 text-text-tertiary" />
                      <span className="text-text-secondary text-sm">
                        {booking.vehicle ? `${booking.vehicle.color || ''} ${booking.vehicle.year || ''} ${booking.vehicle.make || ''} ${booking.vehicle.model || ''}`.trim() : 'Vehicle details not provided'}
                      </span>
                    </div>
                    {booking.vehicle && (booking as any).vehicle?.vehicle_size?.name && (
                      <p className="text-text-tertiary text-xs">
                        {(booking as any).vehicle.vehicle_size.name} vehicle
                      </p>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Date & Time */}
            <Card>
              <CardHeader>
                <h3 className="text-lg font-semibold text-text-primary">
                  Appointment Details
                </h3>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="flex items-center gap-3">
                    <Calendar className="w-5 h-5 text-brand-600" />
                    <div>
                      <p className="font-medium text-text-primary">
                        {formatDate(booking.scheduled_date)}
                      </p>
                      <p className="text-text-tertiary text-sm">Date</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <Clock className="w-5 h-5 text-brand-600" />
                    <div>
                      <p className="font-medium text-text-primary">
                        {formatTime(booking.scheduled_start_time)} - {formatTime(booking.scheduled_end_time)}
                      </p>
                      <p className="text-text-tertiary text-sm">Time</p>
                    </div>
                  </div>
                </div>
                
                <div className="flex items-start gap-3">
                  <MapPin className="w-5 h-5 text-brand-600 mt-0.5" />
                  <div>
                    <p className="font-medium text-text-primary">
                      {booking.address.address_line_1}
                    </p>
                    {booking.address.address_line_2 && (
                      <p className="text-text-secondary text-sm">
                        {booking.address.address_line_2}
                      </p>
                    )}
                    <p className="text-text-secondary text-sm">
                      {booking.address.city}, {booking.address.postal_code}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Pricing Breakdown */}
            {booking.pricing_breakdown && (
              <PricingBreakdown breakdown={booking.pricing_breakdown} />
            )}

            {/* Quick Actions */}
            <Card>
              <CardHeader>
                <h3 className="text-lg font-semibold text-text-primary">
                  Quick Actions
                </h3>
              </CardHeader>
              <CardContent className="space-y-3">
                <Button 
                  variant="outline" 
                  className="w-full justify-start"
                  onClick={addToCalendar}
                >
                  <Calendar className="w-4 h-4 mr-2" />
                  Add to Calendar
                </Button>
                <Button 
                  variant="outline" 
                  className="w-full justify-start"
                  onClick={downloadReceipt}
                >
                  <Download className="w-4 h-4 mr-2" />
                  Download Receipt
                </Button>
                <Link href="/dashboard/bookings">
                  <Button variant="outline" className="w-full justify-start">
                    <ArrowRight className="w-4 h-4 mr-2" />
                    View All Bookings
                  </Button>
                </Link>
              </CardContent>
            </Card>

            {/* Contact Info */}
            <Card>
              <CardHeader>
                <h3 className="text-lg font-semibold text-text-primary">
                  Need Help?
                </h3>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-center gap-3">
                  <Mail className="w-4 h-4 text-brand-600" />
                  <span className="text-text-secondary text-sm">
                    hello@love4detailing.com
                  </span>
                </div>
                <div className="flex items-center gap-3">
                  <Phone className="w-4 h-4 text-brand-600" />
                  <span className="text-text-secondary text-sm">
                    +44 (0) 123 456 789
                  </span>
                </div>
                <p className="text-text-tertiary text-xs mt-4">
                  {needsVerification 
                    ? "Check your email for booking confirmation and account setup instructions."
                    : "We'll send you a confirmation email and reminder before your appointment."
                  }
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  )
}

export default function BookingSuccessPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-surface-primary flex items-center justify-center">
        <div className="animate-spin w-8 h-8 border-4 border-brand-600 border-t-transparent rounded-full"></div>
      </div>
    }>
      <BookingSuccessContent />
    </Suspense>
  )
}