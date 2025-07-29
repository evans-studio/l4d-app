'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase/client'
import { useAuth } from '@/lib/auth-compat'
import { Button } from '@/components/ui/primitives/Button'
import { CustomerLayout } from '@/components/layout/templates/CustomerLayout'
import { Container } from '@/components/layout/templates/PageLayout'
import { CustomerRoute } from '@/components/ProtectedRoute'
import { 
  Calendar, 
  Clock, 
  MapPin, 
  Car, 
  Plus,
  Eye,
  Edit,
  X,
  CheckCircle,
  AlertCircle,
  Clock as PendingIcon
} from 'lucide-react'

interface DashboardBooking {
  id: string
  booking_reference: string
  scheduled_date: string
  start_time: string
  status: 'pending' | 'confirmed' | 'in_progress' | 'completed' | 'cancelled'
  total_price: number
  services: Array<{
    name: string
    price: number
    duration: number
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

export default function DashboardPage() {
  const router = useRouter()
  const { user, profile, isLoading: authLoading } = useAuth()
  const [bookings, setBookings] = useState<DashboardBooking[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [activeTab, setActiveTab] = useState<'upcoming' | 'completed'>('upcoming')

  useEffect(() => {
    const fetchDashboardData = async () => {
      if (authLoading || !user) {
        return
      }

      try {
        const { data: { session } } = await supabase.auth.getSession()
        
        if (!session?.access_token) {
          console.error('No access token available')
          setIsLoading(false)
          return
        }

        const authHeaders = {
          'Authorization': `Bearer ${session.access_token}`,
          'Content-Type': 'application/json'
        }

        // Fetch bookings
        const bookingsResponse = await fetch('/api/customer/bookings', {
          headers: authHeaders
        })
        
        if (!bookingsResponse.ok) {
          const errorText = await bookingsResponse.text()
          console.error('Bookings API error:', bookingsResponse.status, errorText)
          throw new Error(`Failed to load dashboard data: ${bookingsResponse.status}`)
        }

        const bookingsData = await bookingsResponse.json()
        if (bookingsData.success) {
          setBookings(bookingsData.data || [])
        } else {
          console.error('Bookings data error:', bookingsData.error)
          throw new Error(bookingsData.error?.message || 'Failed to load bookings')
        }

      } catch (error) {
        console.error('Dashboard data error:', error)
        // You can show a user-friendly error message here if needed
        // For now, we'll just leave bookings as empty array
        setBookings([])
      } finally {
        setIsLoading(false)
      }
    }

    fetchDashboardData()
  }, [user, authLoading])

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
      weekday: 'short',
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    })
  }

  const upcomingBookings = bookings.filter(booking => 
    ['pending', 'confirmed', 'in_progress'].includes(booking.status)
  )

  const completedBookings = bookings.filter(booking => 
    ['completed', 'cancelled'].includes(booking.status)
  )

  const displayBookings = activeTab === 'upcoming' ? upcomingBookings : completedBookings

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

  return (
    <CustomerRoute>
      <CustomerLayout>
        <Container>
        {/* Header - Mobile First Responsive */}
        <div className="flex flex-col space-y-4 sm:flex-row sm:items-center sm:justify-between sm:space-y-0 mb-6 sm:mb-8">
          <div className="flex-1">
            <h1 className="text-2xl sm:text-3xl font-bold text-text-primary mb-1">
              My Dashboard
            </h1>
            {profile && (
              <p className="text-text-secondary text-sm sm:text-base">
                Welcome back, {profile.first_name || 'Customer'}
              </p>
            )}
          </div>
          
          <Button
            variant="primary"
            onClick={() => router.push('/book')}
            leftIcon={<Plus className="w-4 h-4" />}
            className="w-full sm:w-auto"
          >
            <span className="sm:hidden">Book Service</span>
            <span className="hidden sm:inline">New Booking</span>
          </Button>
        </div>

        {/* Stats Cards - Mobile First Responsive */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-6 mb-6 sm:mb-8">
          <div className="bg-surface-secondary rounded-lg p-4 sm:p-6 border border-border-secondary">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-text-secondary text-xs sm:text-sm mb-1">Total Bookings</p>
                <p className="text-xl sm:text-2xl font-bold text-text-primary">{bookings.length}</p>
              </div>
              <div className="bg-brand-600/10 rounded-lg p-2 sm:p-3">
                <Calendar className="w-5 h-5 sm:w-6 sm:h-6 text-brand-400" />
              </div>
            </div>
          </div>

          <div className="bg-surface-secondary rounded-lg p-4 sm:p-6 border border-border-secondary">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-text-secondary text-xs sm:text-sm mb-1">Upcoming</p>
                <p className="text-xl sm:text-2xl font-bold text-text-primary">{upcomingBookings.length}</p>
              </div>
              <div className="bg-brand-600/10 rounded-lg p-2 sm:p-3">
                <Clock className="w-5 h-5 sm:w-6 sm:h-6 text-brand-400" />
              </div>
            </div>
          </div>

          <div className="bg-surface-secondary rounded-lg p-4 sm:p-6 border border-border-secondary">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-text-secondary text-xs sm:text-sm mb-1">Completed</p>
                <p className="text-xl sm:text-2xl font-bold text-text-primary">{completedBookings.length}</p>
              </div>
              <div className="bg-brand-600/10 rounded-lg p-2 sm:p-3">
                <CheckCircle className="w-5 h-5 sm:w-6 sm:h-6 text-brand-400" />
              </div>
            </div>
          </div>
        </div>

        {/* Tabs - Mobile First Responsive */}
        <div className="flex space-x-1 bg-surface-secondary rounded-lg p-1 mb-6 sm:mb-8 w-full sm:w-fit">
          <button
            onClick={() => setActiveTab('upcoming')}
            className={`flex-1 sm:flex-none px-3 sm:px-4 py-2 rounded-md text-sm font-medium transition-colors ${
              activeTab === 'upcoming'
                ? 'bg-brand-600 text-white'
                : 'text-text-secondary hover:text-text-primary'
            }`}
          >
            <span className="sm:hidden">Upcoming</span>
            <span className="hidden sm:inline">Upcoming ({upcomingBookings.length})</span>
          </button>
          <button
            onClick={() => setActiveTab('completed')}
            className={`flex-1 sm:flex-none px-3 sm:px-4 py-2 rounded-md text-sm font-medium transition-colors ${
              activeTab === 'completed'
                ? 'bg-brand-600 text-white'
                : 'text-text-secondary hover:text-text-primary'
            }`}
          >
            <span className="sm:hidden">History</span>
            <span className="hidden sm:inline">History ({completedBookings.length})</span>
          </button>
        </div>

        {/* Bookings List */}
        {displayBookings.length === 0 ? (
          <div className="text-center py-12">
            <div className="bg-surface-secondary rounded-lg p-8 max-w-md mx-auto">
              <Calendar className="w-12 h-12 text-text-muted mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-text-primary mb-2">
                {activeTab === 'upcoming' ? 'No Upcoming Bookings' : 'No Booking History'}
              </h3>
              <p className="text-text-secondary text-sm mb-6">
                {activeTab === 'upcoming' 
                  ? "You don&apos;t have any upcoming appointments. Book your next detailing service today!"
                  : "Your booking history will appear here once you&apos;ve completed some services."
                }
              </p>
              {activeTab === 'upcoming' && (
                <Button
                  variant="primary"
                  onClick={() => router.push('/book')}
                  leftIcon={<Plus className="w-4 h-4" />}
                >
                  Book Now
                </Button>
              )}
            </div>
          </div>
        ) : (
          <div className="space-y-6">
            {displayBookings.map((booking) => {
              const status = statusConfig[booking.status]
              const StatusIcon = status.icon
              
              return (
                <div
                  key={booking.id}
                  className="bg-surface-secondary rounded-lg p-4 sm:p-6 border border-border-secondary hover:border-border-primary transition-colors"
                >
                  {/* Mobile-First Layout */}
                  <div className="flex flex-col space-y-4 lg:flex-row lg:items-center lg:justify-between lg:space-y-0 lg:gap-6">
                    {/* Main Info */}
                    <div className="flex-1">
                      {/* Header - Mobile Optimized */}
                      <div className="flex items-start justify-between mb-4">
                        <div className="flex-1 min-w-0">
                          <h3 className="text-lg font-semibold text-text-primary mb-2 truncate">
                            #{booking.booking_reference}
                          </h3>
                          <div className={`inline-flex items-center gap-2 px-3 py-1 rounded-full text-sm border ${status.bgColor} ${status.borderColor}`}>
                            <StatusIcon className={`w-4 h-4 ${status.color}`} />
                            <span className={status.color}>{status.label}</span>
                          </div>
                        </div>
                        <div className="text-right ml-3">
                          <p className="text-xl sm:text-2xl font-bold text-brand-400">£{booking.total_price}</p>
                        </div>
                      </div>

                      {/* Mobile-First Info Grid */}
                      <div className="space-y-3 sm:space-y-0 sm:grid sm:grid-cols-2 lg:grid-cols-4 sm:gap-4">
                        {/* Date & Time - Priority on mobile */}
                        <div className="flex items-center gap-3 p-3 sm:p-0 bg-surface-tertiary sm:bg-transparent rounded-lg sm:rounded-none">
                          <Calendar className="w-5 h-5 text-brand-400 flex-shrink-0" />
                          <div className="min-w-0">
                            <p className="text-text-secondary text-xs">Date & Time</p>
                            <p className="text-text-primary font-medium text-sm sm:text-base truncate">
                              {formatDate(booking.scheduled_date)}
                            </p>
                            <p className="text-text-primary text-sm">
                              {formatTime(booking.start_time)}
                            </p>
                          </div>
                        </div>

                        {/* Vehicle */}
                        <div className="flex items-center gap-3">
                          <Car className="w-5 h-5 text-brand-400 flex-shrink-0" />
                          <div className="min-w-0">
                            <p className="text-text-secondary text-xs">Vehicle</p>
                            <p className="text-text-primary font-medium text-sm sm:text-base truncate">
                              {booking.vehicle.make} {booking.vehicle.model}
                            </p>
                            {booking.vehicle.year && (
                              <p className="text-text-secondary text-sm">
                                {booking.vehicle.year}
                              </p>
                            )}
                          </div>
                        </div>

                        {/* Location */}
                        <div className="flex items-center gap-3">
                          <MapPin className="w-5 h-5 text-brand-400 flex-shrink-0" />
                          <div className="min-w-0">
                            <p className="text-text-secondary text-xs">Location</p>
                            <p className="text-text-primary font-medium text-sm sm:text-base truncate">
                              {booking.address.city}
                            </p>
                            <p className="text-text-secondary text-sm">
                              {booking.address.postal_code}
                            </p>
                          </div>
                        </div>

                        {/* Services - Compact on mobile */}
                        <div className="sm:col-span-2 lg:col-span-1">
                          <p className="text-text-secondary text-xs mb-2">Services</p>
                          <div className="flex flex-wrap gap-1 sm:block sm:space-y-1">
                            {booking.services.slice(0, 2).map((service, index) => (
                              <span key={index} className="inline-block px-2 py-1 bg-surface-tertiary rounded text-xs sm:bg-transparent sm:p-0 sm:text-sm text-text-primary">
                                {service.name}
                              </span>
                            ))}
                            {booking.services.length > 2 && (
                              <span className="inline-block px-2 py-1 bg-surface-tertiary rounded text-xs sm:bg-transparent sm:p-0 text-text-muted">
                                +{booking.services.length - 2} more
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Actions - Mobile Responsive */}
                    <div className="flex flex-col sm:flex-row lg:flex-col gap-2 lg:min-w-[140px]">
                      <Button
                        onClick={() => router.push(`/dashboard/bookings/${booking.id}`)}
                        variant="outline"
                        size="sm"
                        leftIcon={<Eye className="w-4 h-4" />}
                        className="w-full sm:flex-1 lg:w-full"
                      >
                        <span className="sm:hidden lg:inline">View Details</span>
                        <span className="hidden sm:inline lg:hidden">View</span>
                      </Button>
                      
                      {booking.status === 'pending' && (
                        <Button
                          onClick={() => router.push(`/dashboard/bookings/${booking.id}`)}
                          variant="outline"
                          size="sm"
                          leftIcon={<Edit className="w-4 h-4" />}
                          className="w-full sm:flex-1 lg:w-full"
                        >
                          <span className="sm:hidden lg:inline">Manage</span>
                          <span className="hidden sm:inline lg:hidden">Edit</span>
                        </Button>
                      )}
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        )}
        </Container>
      </CustomerLayout>
    </CustomerRoute>
  )
}