'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useBookingFlowStore } from '@/lib/store/bookingFlowStore'
import { useOverlay } from '@/lib/overlay/context'
import { useCustomerRealTimeBookings, type CustomerBooking } from '@/hooks/useCustomerRealTimeBookings'
import { Button } from '@/components/ui/primitives/Button'
import { CustomerLayout } from '@/components/layout/templates/CustomerLayout'
import { Container } from '@/components/layout/templates/PageLayout'
import { CustomerRoute } from '@/components/ProtectedRoute'
import { 
  Calendar, 
  Clock, 
  MapPin, 
  Car, 
  Eye,
  Edit,
  X,
  CheckCircle,
  AlertCircle,
  Clock as PendingIcon,
  Filter,
  Search
} from 'lucide-react'

// Use the type from the real-time hook
type DashboardBooking = CustomerBooking

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
  rescheduled: {
    label: 'Rescheduled',
    icon: Calendar,
    color: 'text-blue-400',
    bgColor: 'bg-blue-600/10',
    borderColor: 'border-blue-500/20'
  },
  declined: {
    label: 'Declined',
    icon: X,
    color: 'text-red-400',
    bgColor: 'bg-red-600/10',
    borderColor: 'border-red-500/20'
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

export default function MyBookingsPage() {
  const router = useRouter()
  const { openOverlay } = useOverlay()
  const { initializeRebooking } = useBookingFlowStore()
  const [activeFilter, setActiveFilter] = useState<'all' | 'upcoming' | 'completed' | 'cancelled'>('all')
  const [searchTerm, setSearchTerm] = useState('')
  const [rebookingBookingId, setRebookingBookingId] = useState<string | null>(null)

  // Real-time bookings hook
  const {
    bookings,
    isLoading,
    error: bookingsError,
    lastUpdated,
    refreshBookings,
    cancelBooking: realtimeCancelBooking,
    requestReschedule: realtimeRequestReschedule,
    getUpcomingBookings,
    getPastBookings,
    getBookingsByStatus
  } = useCustomerRealTimeBookings({
    enableRealTimeUpdates: true,
    pollInterval: 60000 // 60 seconds for customer dashboard
  })

  // Handle rebooking flow
  const handleRebook = async (bookingId: string) => {
    try {
      setRebookingBookingId(bookingId)
      await initializeRebooking(bookingId)
      // Redirect to booking page with pre-populated data
      router.push('/book')
    } catch (error) {
      console.error('Rebooking initialization failed:', error)
      // Could show an error toast here
      setRebookingBookingId(null)
    }
  }

  const formatTime = (time: string | undefined | null) => {
    if (!time) {
      return 'Time TBD'
    }
    
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

  const getFilteredBookings = () => {
    let filtered = bookings

    // Use real-time hook functions for better filtering
    if (activeFilter === 'upcoming') {
      filtered = getUpcomingBookings()
    } else if (activeFilter === 'completed') {
      filtered = getPastBookings().filter(b => b.status === 'completed')
    } else if (activeFilter === 'cancelled') {
      filtered = getBookingsByStatus('cancelled')
    }

    // Filter by search term
    if (searchTerm) {
      filtered = filtered.filter(booking =>
        booking.booking_reference.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (booking.vehicle?.make || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
        (booking.vehicle?.model || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
        (booking.service?.name || '').toLowerCase().includes(searchTerm.toLowerCase())
      )
    }

    return filtered.sort((a, b) => new Date(b.scheduled_date).getTime() - new Date(a.scheduled_date).getTime())
  }

  const filteredBookings = getFilteredBookings()

  const getFilterCount = (filter: typeof activeFilter) => {
    if (filter === 'all') return bookings.length
    if (filter === 'upcoming') return getUpcomingBookings().length
    if (filter === 'completed') return getBookingsByStatus('completed').length
    if (filter === 'cancelled') return getBookingsByStatus('cancelled').length
    return 0
  }

  if (isLoading) {
    return (
      <CustomerRoute>
        <CustomerLayout>
          <Container>
            <div className="flex items-center justify-center py-20">
              <div className="animate-spin w-8 h-8 border-4 border-brand-600 border-t-transparent rounded-full"></div>
            </div>
          </Container>
        </CustomerLayout>
      </CustomerRoute>
    )
  }

  return (
    <CustomerRoute>
      <CustomerLayout>
        <Container>
          {/* Header */}
          <div className="mb-8">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div>
                <h1 className="text-3xl font-bold text-text-primary">
                  My Bookings
                </h1>
                <div className="flex items-center gap-3">
                  <p className="text-text-secondary">
                    Manage your car detailing appointments
                  </p>
                  {lastUpdated && (
                    <div className="flex items-center gap-1 text-xs text-text-muted">
                      <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                      <span>Live • Updated {new Date(lastUpdated).toLocaleTimeString()}</span>
                    </div>
                  )}
                </div>
                {bookingsError && (
                  <div className="mt-2 text-sm text-red-600 bg-red-50 px-2 py-1 rounded">
                    {bookingsError}
                  </div>
                )}
              </div>
              
              <Button
                onClick={refreshBookings}
                variant="outline"
                size="sm"
                disabled={isLoading}
                className="min-h-[44px] touch-manipulation"
              >
                <Search className="w-4 h-4 mr-2" />
                Refresh
              </Button>
            </div>
          </div>

          {/* Search and Filters */}
          <div className="flex flex-col sm:flex-row gap-4 mb-8">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-text-muted" />
              <input
                type="text"
                placeholder="Search by booking reference or vehicle..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 bg-surface-secondary border border-border-secondary rounded-md text-text-primary placeholder-text-muted focus:border-brand-400 focus:outline-none focus:ring-2 focus:ring-brand-600/20 transition-colors"
              />
            </div>
            
            <div className="flex items-center gap-2">
              <Filter className="w-4 h-4 text-text-muted" />
              <div className="flex bg-surface-secondary rounded-lg p-1">
                {(['all', 'upcoming', 'completed', 'cancelled'] as const).map((filter) => (
                  <button
                    key={filter}
                    onClick={() => setActiveFilter(filter)}
                    className={`px-3 py-1 rounded-md text-sm font-medium transition-colors capitalize ${
                      activeFilter === filter
                        ? 'bg-brand-600 text-white'
                        : 'text-text-secondary hover:text-text-primary'
                    }`}
                  >
                    {filter} ({getFilterCount(filter)})
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Bookings List */}
          {filteredBookings.length === 0 ? (
            <div className="text-center py-12">
              <div className="bg-surface-secondary rounded-lg p-8 max-w-md mx-auto">
                <Calendar className="w-12 h-12 text-text-muted mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-text-primary mb-2">
                  {searchTerm ? 'No bookings found' : 
                   activeFilter === 'all' ? 'No bookings yet' : 
                   `No ${activeFilter} bookings`}
                </h3>
                <p className="text-text-secondary text-sm">
                  {searchTerm ? 'Try adjusting your search terms.' :
                   activeFilter === 'all' ? "You haven't made any bookings yet. Use the + button below to book your first detailing service!" :
                   `You don't have any ${activeFilter} bookings.`}
                </p>
              </div>
            </div>
          ) : (
            <div className="space-y-6">
              {filteredBookings.map((booking) => {
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
                                {formatTime(booking.scheduled_start_time)}
                              </p>
                            </div>
                          </div>

                          {/* Vehicle */}
                          <div className="flex items-center gap-3">
                            <Car className="w-5 h-5 text-brand-400" />
                            <div>
                              <p className="text-text-secondary text-xs">Vehicle</p>
                              <p className="text-text-primary font-medium">
                                {booking.vehicle ? `${booking.vehicle.make} ${booking.vehicle.model}` : 'Vehicle details pending'}
                              </p>
                              {booking.vehicle?.year && (
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
                                {booking.address?.city || 'City pending'}
                              </p>
                              <p className="text-text-secondary text-sm">
                                {booking.address?.postal_code || 'Postcode pending'}
                              </p>
                            </div>
                          </div>

                          {/* Services */}
                          <div>
                            <p className="text-text-secondary text-xs mb-1">Services</p>
                            <div className="space-y-1">
                              <p className="text-text-primary text-sm">
                                {booking.service?.name || 'Service details pending'}
                              </p>
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Actions */}
                      <div className="flex flex-row lg:flex-col gap-2">
                        <Button
                          onClick={() => openOverlay({
                            type: 'booking-view',
                            data: { bookingId: booking.id, booking }
                          })}
                          variant="outline"
                          size="sm"
                          leftIcon={<Eye className="w-4 h-4" />}
                        >
                          View Details
                        </Button>
                        
                        {['pending', 'confirmed'].includes(booking.status) && (
                          <Button
                            onClick={() => openOverlay({
                              type: 'booking-reschedule',
                              data: { bookingId: booking.id, booking }
                            })}
                            variant="outline"
                            size="sm"
                            leftIcon={<Edit className="w-4 h-4" />}
                          >
                            Reschedule
                          </Button>
                        )}
                        
                        {booking.status === 'completed' && (
                          <Button
                            onClick={() => handleRebook(booking.id)}
                            variant="outline"
                            size="sm"
                            leftIcon={rebookingBookingId === booking.id ? 
                              <div className="w-4 h-4 animate-spin rounded-full border-2 border-brand-400 border-t-transparent" /> :
                              <Calendar className="w-4 h-4" />
                            }
                            disabled={rebookingBookingId === booking.id}
                          >
                            {rebookingBookingId === booking.id ? 'Loading...' : 'Book Again'}
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