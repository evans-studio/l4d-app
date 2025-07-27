'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/primitives/Button'
import { CustomerLayout } from '@/components/layout/templates/CustomerLayout'
import { Container } from '@/components/layout/templates/PageLayout'
import { CustomerRoute } from '@/components/auth/ProtectedRoute'
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
  Clock as PendingIcon,
  Filter,
  Search
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
    base_price: number
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

export default function MyBookingsPage() {
  const router = useRouter()
  const [bookings, setBookings] = useState<DashboardBooking[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [activeFilter, setActiveFilter] = useState<'all' | 'upcoming' | 'completed' | 'cancelled'>('all')
  const [searchTerm, setSearchTerm] = useState('')

  useEffect(() => {
    const fetchBookings = async () => {
      try {
        const response = await fetch('/api/customer/bookings')
        const data = await response.json()
        
        if (data.success) {
          setBookings(data.data)
        }
      } catch (error) {
        console.error('Failed to fetch bookings:', error)
      } finally {
        setIsLoading(false)
      }
    }

    fetchBookings()
  }, [])

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

  const getFilteredBookings = () => {
    let filtered = bookings

    // Filter by status
    if (activeFilter === 'upcoming') {
      filtered = filtered.filter(booking => 
        ['pending', 'confirmed', 'in_progress'].includes(booking.status)
      )
    } else if (activeFilter === 'completed') {
      filtered = filtered.filter(booking => booking.status === 'completed')
    } else if (activeFilter === 'cancelled') {
      filtered = filtered.filter(booking => booking.status === 'cancelled')
    }

    // Filter by search term
    if (searchTerm) {
      filtered = filtered.filter(booking =>
        booking.booking_reference.toLowerCase().includes(searchTerm.toLowerCase()) ||
        booking.vehicle.make.toLowerCase().includes(searchTerm.toLowerCase()) ||
        booking.vehicle.model.toLowerCase().includes(searchTerm.toLowerCase())
      )
    }

    return filtered.sort((a, b) => new Date(b.scheduled_date).getTime() - new Date(a.scheduled_date).getTime())
  }

  const filteredBookings = getFilteredBookings()

  const getFilterCount = (filter: typeof activeFilter) => {
    if (filter === 'all') return bookings.length
    if (filter === 'upcoming') return bookings.filter(b => ['pending', 'confirmed', 'in_progress'].includes(b.status)).length
    if (filter === 'completed') return bookings.filter(b => b.status === 'completed').length
    if (filter === 'cancelled') return bookings.filter(b => b.status === 'cancelled').length
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
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-8">
            <div>
              <h1 className="text-3xl font-bold text-text-primary">
                My Bookings
              </h1>
              <p className="text-text-secondary">
                Manage your car detailing appointments
              </p>
            </div>
            
            <Button
              variant="primary"
              onClick={() => router.push('/book')}
              leftIcon={<Plus className="w-4 h-4" />}
            >
              New Booking
            </Button>
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
                <p className="text-text-secondary text-sm mb-6">
                  {searchTerm ? 'Try adjusting your search terms.' :
                   activeFilter === 'all' ? "You haven't made any bookings yet. Book your first detailing service!" :
                   `You don't have any ${activeFilter} bookings.`}
                </p>
                {!searchTerm && activeFilter === 'all' && (
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
                          onClick={() => router.push(`/booking/${booking.id}`)}
                          variant="outline"
                          size="sm"
                          leftIcon={<Eye className="w-4 h-4" />}
                        >
                          View Details
                        </Button>
                        
                        {booking.status === 'pending' && (
                          <Button
                            onClick={() => router.push(`/booking/${booking.id}/edit`)}
                            variant="outline"
                            size="sm"
                            leftIcon={<Edit className="w-4 h-4" />}
                          >
                            Edit
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