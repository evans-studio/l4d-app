'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/lib/auth/AuthContext'
import { Button } from '@/components/ui/primitives/Button'
import { CustomerLayout } from '@/components/layout/templates/CustomerLayout'
import { Container } from '@/components/layout/templates/PageLayout'
import { CustomerRoute } from '@/components/TempProtectedRoute'
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
  const { user, profile: authProfile, isLoading: authLoading } = useAuth()
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
        
        if (bookingsResponse.ok) {
          const bookingsData = await bookingsResponse.json()
          if (bookingsData.success) {
            setBookings(bookingsData.data)
          }
        }

      } catch (error) {
        console.error('Failed to fetch dashboard data:', error)
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
        {/* Header */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-text-primary">
              My Dashboard
            </h1>
            {authProfile && (
              <p className="text-text-secondary">
                Welcome back, {authProfile.first_name || 'Customer'}
              </p>
            )}
          </div>
          
          <Button
            variant="primary"
            onClick={() => router.push('/book')}
            leftIcon={<Plus className="w-4 h-4" />}
          >
            New Booking
          </Button>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-surface-secondary rounded-lg p-6 border border-border-secondary">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-text-secondary text-sm mb-1">Total Bookings</p>
                <p className="text-2xl font-bold text-text-primary">{bookings.length}</p>
              </div>
              <div className="bg-brand-600/10 rounded-lg p-3">
                <Calendar className="w-6 h-6 text-brand-400" />
              </div>
            </div>
          </div>

          <div className="bg-surface-secondary rounded-lg p-6 border border-border-secondary">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-text-secondary text-sm mb-1">Upcoming</p>
                <p className="text-2xl font-bold text-text-primary">{upcomingBookings.length}</p>
              </div>
              <div className="bg-brand-600/10 rounded-lg p-3">
                <Clock className="w-6 h-6 text-brand-400" />
              </div>
            </div>
          </div>

          <div className="bg-surface-secondary rounded-lg p-6 border border-border-secondary">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-text-secondary text-sm mb-1">Completed</p>
                <p className="text-2xl font-bold text-text-primary">{completedBookings.length}</p>
              </div>
              <div className="bg-brand-600/10 rounded-lg p-3">
                <CheckCircle className="w-6 h-6 text-brand-400" />
              </div>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex space-x-1 bg-surface-secondary rounded-lg p-1 mb-8 w-fit">
          <button
            onClick={() => setActiveTab('upcoming')}
            className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
              activeTab === 'upcoming'
                ? 'bg-brand-600 text-white'
                : 'text-text-secondary hover:text-text-primary'
            }`}
          >
            Upcoming ({upcomingBookings.length})
          </button>
          <button
            onClick={() => setActiveTab('completed')}
            className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
              activeTab === 'completed'
                ? 'bg-brand-600 text-white'
                : 'text-text-secondary hover:text-text-primary'
            }`}
          >
            History ({completedBookings.length})
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
                  ? "You don't have any upcoming appointments. Book your next detailing service today!"
                  : "Your booking history will appear here once you've completed some services."
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
                  className="bg-surface-secondary rounded-lg p-6 border border-border-secondary hover:border-border-primary transition-colors"
                >
                  <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
                    {/* Main Info */}
                    <div className="flex-1">
                      <div className="flex items-start justify-between mb-4">
                        <div>
                          <h3 className="text-lg font-semibold text-text-primary mb-1">
                            Booking #{booking.booking_reference}
                          </h3>
                          <div className={`inline-flex items-center gap-2 px-3 py-1 rounded-full text-sm border ${status.bgColor} ${status.borderColor}`}>
                            <StatusIcon className={`w-4 h-4 ${status.color}`} />
                            <span className={status.color}>{status.label}</span>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="text-2xl font-bold text-brand-400">£{booking.total_price}</p>
                        </div>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                        {/* Date & Time */}
                        <div className="flex items-center gap-3">
                          <Calendar className="w-5 h-5 text-brand-400" />
                          <div>
                            <p className="text-text-secondary text-xs">Date & Time</p>
                            <p className="text-text-primary font-medium">
                              {formatDate(booking.scheduled_date)}
                            </p>
                            <p className="text-text-primary text-sm">
                              {formatTime(booking.start_time)}
                            </p>
                          </div>
                        </div>

                        {/* Vehicle */}
                        <div className="flex items-center gap-3">
                          <Car className="w-5 h-5 text-brand-400" />
                          <div>
                            <p className="text-text-secondary text-xs">Vehicle</p>
                            <p className="text-text-primary font-medium">
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
                          <MapPin className="w-5 h-5 text-brand-400" />
                          <div>
                            <p className="text-text-secondary text-xs">Location</p>
                            <p className="text-text-primary font-medium">
                              {booking.address.city}
                            </p>
                            <p className="text-text-secondary text-sm">
                              {booking.address.postal_code}
                            </p>
                          </div>
                        </div>

                        {/* Services */}
                        <div>
                          <p className="text-text-secondary text-xs mb-1">Services</p>
                          <div className="space-y-1">
                            {booking.services.slice(0, 2).map((service, index) => (
                              <p key={index} className="text-text-primary text-sm">
                                {service.name}
                              </p>
                            ))}
                            {booking.services.length > 2 && (
                              <p className="text-text-muted text-xs">
                                +{booking.services.length - 2} more
                              </p>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex flex-row lg:flex-col gap-2">
                      <Button
                        onClick={() => router.push(`/dashboard/bookings/${booking.id}`)}
                        variant="outline"
                        size="sm"
                        leftIcon={<Eye className="w-4 h-4" />}
                      >
                        View Details
                      </Button>
                      
                      {booking.status === 'pending' && (
                        <Button
                          onClick={() => router.push(`/dashboard/bookings/${booking.id}`)}
                          variant="outline"
                          size="sm"
                          leftIcon={<Edit className="w-4 h-4" />}
                        >
                          Manage
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