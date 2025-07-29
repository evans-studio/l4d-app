'use client'

import { useEffect, useState, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { Button } from '@/components/ui/primitives/Button'
import { AdminLayout } from '@/components/layouts/AdminLayout'
import { AdminRoute } from '@/components/ProtectedRoute'
import { TodaysSchedule } from '@/components/admin/TodaysSchedule'
import { 
  CalendarIcon, 
  ClockIcon,
  SearchIcon,
  CheckIcon,
  XIcon,
  EyeIcon,
  PhoneIcon,
  MailIcon,
  AlertCircleIcon,
  CheckCircleIcon,
  ClockIcon as PendingIcon,
  LayoutDashboardIcon,
  ListIcon
} from 'lucide-react'

interface AdminBooking {
  id: string
  booking_reference: string
  customer_id: string
  customer_name: string
  customer_email: string
  customer_phone: string
  scheduled_date: string
  start_time: string
  status: 'pending' | 'confirmed' | 'in_progress' | 'completed' | 'cancelled'
  total_price: number
  special_instructions?: string
  services: Array<{
    name: string
    base_price: number
  }>
  vehicle: {
    make: string
    model: string
    year?: number
    color?: string
    license_plate?: string
  }
  address: {
    address_line_1: string
    address_line_2?: string
    city: string
    postal_code: string
  }
  created_at: string
}

const statusConfig = {
  pending: {
    label: 'Pending',
    icon: PendingIcon,
    color: 'text-[var(--warning)]',
    bgColor: 'bg-[var(--warning-bg)]',
    borderColor: 'border-[var(--warning)]'
  },
  confirmed: {
    label: 'Confirmed',
    icon: CheckCircleIcon,
    color: 'text-[var(--success)]',
    bgColor: 'bg-[var(--success-bg)]',
    borderColor: 'border-[var(--success)]'
  },
  in_progress: {
    label: 'In Progress',
    icon: AlertCircleIcon,
    color: 'text-[var(--info)]',
    bgColor: 'bg-[var(--info-bg)]',
    borderColor: 'border-[var(--info)]'
  },
  completed: {
    label: 'Completed',
    icon: CheckCircleIcon,
    color: 'text-[var(--success)]',
    bgColor: 'bg-[var(--success-bg)]',
    borderColor: 'border-[var(--success)]'
  },
  cancelled: {
    label: 'Cancelled',
    icon: XIcon,
    color: 'text-[var(--error)]',
    bgColor: 'bg-[var(--error-bg)]',
    borderColor: 'border-[var(--error)]'
  }
}

function AdminBookingsContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [bookings, setBookings] = useState<AdminBooking[]>([])
  const [filteredBookings, setFilteredBookings] = useState<AdminBooking[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState<string>(searchParams.get('status') || 'all')
  const [dateFilter, setDateFilter] = useState('all')
  const [viewMode, setViewMode] = useState<'today' | 'all'>('today')

  useEffect(() => {
    const fetchBookings = async () => {
      try {
        const response = await fetch('/api/admin/bookings')
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

  // Filter bookings based on search and filters
  useEffect(() => {
    let filtered = bookings

    // Search filter
    if (searchTerm) {
      filtered = filtered.filter(booking => 
        booking.booking_reference.toLowerCase().includes(searchTerm.toLowerCase()) ||
        booking.customer_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        booking.customer_email.toLowerCase().includes(searchTerm.toLowerCase()) ||
        booking.vehicle.make.toLowerCase().includes(searchTerm.toLowerCase()) ||
        booking.vehicle.model.toLowerCase().includes(searchTerm.toLowerCase())
      )
    }

    // Status filter
    if (statusFilter !== 'all') {
      filtered = filtered.filter(booking => booking.status === statusFilter)
    }

    // Date filter
    if (dateFilter !== 'all') {
      const today = new Date()
      
      switch (dateFilter) {
        case 'today':
          filtered = filtered.filter(booking => {
            const scheduledDate = new Date(booking.scheduled_date)
            return scheduledDate.toDateString() === today.toDateString()
          })
          break
        case 'week':
          const weekFromNow = new Date(today.getTime() + 7 * 24 * 60 * 60 * 1000)
          filtered = filtered.filter(booking => {
            const scheduledDate = new Date(booking.scheduled_date)
            return scheduledDate >= today && scheduledDate <= weekFromNow
          })
          break
        case 'month':
          const monthFromNow = new Date(today.getTime() + 30 * 24 * 60 * 60 * 1000)
          filtered = filtered.filter(booking => {
            const scheduledDate = new Date(booking.scheduled_date)
            return scheduledDate >= today && scheduledDate <= monthFromNow
          })
          break
      }
    }

    // Sort by date (newest first for recent, oldest first for upcoming)
    filtered.sort((a, b) => {
      const dateA = new Date(a.scheduled_date + ' ' + a.start_time)
      const dateB = new Date(b.scheduled_date + ' ' + b.start_time)
      return dateA.getTime() - dateB.getTime()
    })

    setFilteredBookings(filtered)
  }, [bookings, searchTerm, statusFilter, dateFilter])

  const updateBookingStatus = async (bookingId: string, newStatus: string) => {
    try {
      const response = await fetch(`/api/admin/bookings/${bookingId}/status`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus })
      })

      const data = await response.json()
      if (data.success) {
        // Update local state
        setBookings(prev => prev.map(booking => 
          booking.id === bookingId 
            ? { ...booking, status: newStatus as AdminBooking['status'] }
            : booking
        ))
      }
    } catch (error) {
      console.error('Failed to update booking status:', error)
    }
  }

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

  if (isLoading) {
    return (
      <AdminLayout>
        <div className="flex items-center justify-center min-h-96">
          <div className="animate-spin w-8 h-8 border-4 border-[var(--primary)] border-t-transparent rounded-full"></div>
        </div>
      </AdminLayout>
    )
  }

  return (
    <AdminLayout>
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-[var(--text-primary)] mb-2">
              Booking Management
            </h1>
            <p className="text-[var(--text-secondary)]">
              Manage and track all customer bookings
            </p>
          </div>
          
          <div className="flex items-center gap-3 mt-4 sm:mt-0">
            {/* View Toggle */}
            <div className="flex bg-[var(--surface-secondary)] rounded-lg p-1 border border-[var(--border-secondary)]">
              <Button
                onClick={() => setViewMode('today')}
                variant={viewMode === 'today' ? 'primary' : 'ghost'}
                size="sm"
                className="flex items-center gap-2"
              >
                <LayoutDashboardIcon className="w-4 h-4" />
                Today&apos;s Schedule
              </Button>
              <Button
                onClick={() => setViewMode('all')}
                variant={viewMode === 'all' ? 'primary' : 'ghost'}
                size="sm"
                className="flex items-center gap-2"
              >
                <ListIcon className="w-4 h-4" />
                All Bookings
              </Button>
            </div>
            
            <Button
              onClick={() => router.push('/admin')}
              variant="outline"
            >
              Back to Dashboard
            </Button>
          </div>
        </div>

        {/* Content based on view mode */}
        {viewMode === 'today' ? (
          <TodaysSchedule onRefresh={() => {
            // Fetch bookings again to refresh all data
            const fetchBookings = async () => {
              try {
                const response = await fetch('/api/admin/bookings')
                const data = await response.json()
                
                if (data.success) {
                  setBookings(data.data)
                }
              } catch (error) {
                console.error('Failed to fetch bookings:', error)
              }
            }
            fetchBookings()
          }} />
        ) : (
          <>
            {/* Filters */}
            <div className="bg-[var(--surface-secondary)] rounded-lg p-6 mb-8 border border-[var(--border-secondary)]">
              <div className="flex flex-col lg:flex-row gap-4">
                {/* Search */}
                <div className="flex-1">
                  <div className="relative">
                    <SearchIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-[var(--text-muted)]" />
                    <input
                      type="text"
                      placeholder="Search by reference, customer, or vehicle..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="w-full pl-10 pr-4 py-2 bg-[var(--input-bg)] border border-[var(--input-border)] rounded-md text-[var(--input-text)] placeholder-[var(--input-placeholder)] focus:border-[var(--input-border-focus)] focus:outline-none transition-colors"
                    />
                  </div>
                </div>

                {/* Status Filter */}
                <div>
                  <select
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value)}
                    className="px-4 py-2 bg-[var(--input-bg)] border border-[var(--input-border)] rounded-md text-[var(--input-text)] focus:border-[var(--input-border-focus)] focus:outline-none transition-colors"
                  >
                    <option value="all">All Status</option>
                    <option value="pending">Pending</option>
                    <option value="confirmed">Confirmed</option>
                    <option value="in_progress">In Progress</option>
                    <option value="completed">Completed</option>
                    <option value="cancelled">Cancelled</option>
                  </select>
                </div>

                {/* Date Filter */}
                <div>
                  <select
                    value={dateFilter}
                    onChange={(e) => setDateFilter(e.target.value)}
                    className="px-4 py-2 bg-[var(--input-bg)] border border-[var(--input-border)] rounded-md text-[var(--input-text)] focus:border-[var(--input-border-focus)] focus:outline-none transition-colors"
                  >
                    <option value="all">All Dates</option>
                    <option value="today">Today</option>
                    <option value="week">This Week</option>
                    <option value="month">This Month</option>
                  </select>
                </div>
              </div>

              {/* Quick Stats */}
              <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mt-6 pt-4 border-t border-[var(--border-secondary)]">
                {Object.entries(statusConfig).map(([status, config]) => {
                  const count = bookings.filter(b => b.status === status).length
                  return (
                    <div key={status} className="text-center">
                      <p className="text-sm text-[var(--text-secondary)] mb-1">{config.label}</p>
                      <p className={`text-lg font-bold ${config.color}`}>{count}</p>
                    </div>
                  )
                })}
              </div>
            </div>

            {/* Bookings List */}
            {filteredBookings.length === 0 ? (
              <div className="text-center py-12">
                <div className="bg-[var(--surface-secondary)] rounded-lg p-8 max-w-md mx-auto">
                  <CalendarIcon className="w-12 h-12 text-[var(--text-muted)] mx-auto mb-4" />
                  <h3 className="text-lg font-semibold text-[var(--text-primary)] mb-2">
                    No Bookings Found
                  </h3>
                  <p className="text-[var(--text-secondary)] text-sm">
                    No bookings match your current filters.
                  </p>
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                {filteredBookings.map((booking) => {
                  const status = statusConfig[booking.status]
                  const StatusIcon = status.icon
                  
                  return (
                    <div
                      key={booking.id}
                      className="bg-[var(--surface-secondary)] rounded-lg p-6 border border-[var(--border-secondary)] hover:border-[var(--border-primary)] transition-colors"
                    >
                      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
                        {/* Main Info */}
                        <div className="flex-1">
                          <div className="flex items-start justify-between mb-4">
                            <div>
                              <h3 className="text-lg font-semibold text-[var(--text-primary)] mb-1">
                                #{booking.booking_reference}
                              </h3>
                              <div className={`inline-flex items-center gap-2 px-3 py-1 rounded-full text-sm border ${status.bgColor} ${status.borderColor}`}>
                                <StatusIcon className={`w-4 h-4 ${status.color}`} />
                                <span className={status.color}>{status.label}</span>
                              </div>
                            </div>
                            <div className="text-right">
                              <p className="text-2xl font-bold text-[var(--primary)]">£{booking.total_price}</p>
                              <p className="text-[var(--text-muted)] text-sm">
                                {booking.services.length} service{booking.services.length !== 1 ? 's' : ''}
                              </p>
                            </div>
                          </div>

                          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
                            {/* Customer */}
                            <div>
                              <p className="text-[var(--text-secondary)] text-xs mb-1">Customer</p>
                              <p className="text-[var(--text-primary)] font-medium">{booking.customer_name}</p>
                              <div className="flex items-center gap-2 mt-1">
                                <a 
                                  href={`tel:${booking.customer_phone}`}
                                  className="text-[var(--text-link)] hover:text-[var(--text-link-hover)]"
                                >
                                  <PhoneIcon className="w-3 h-3" />
                                </a>
                                <a 
                                  href={`mailto:${booking.customer_email}`}
                                  className="text-[var(--text-link)] hover:text-[var(--text-link-hover)]"
                                >
                                  <MailIcon className="w-3 h-3" />
                                </a>
                              </div>
                            </div>

                            {/* Date & Time */}
                            <div>
                              <p className="text-[var(--text-secondary)] text-xs mb-1">Date & Time</p>
                              <p className="text-[var(--text-primary)] font-medium">
                                {formatDate(booking.scheduled_date)}
                              </p>
                              <p className="text-[var(--text-primary)] text-sm">
                                {formatTime(booking.start_time)}
                              </p>
                            </div>

                            {/* Vehicle */}
                            <div>
                              <p className="text-[var(--text-secondary)] text-xs mb-1">Vehicle</p>
                              <p className="text-[var(--text-primary)] font-medium">
                                {booking.vehicle.make} {booking.vehicle.model}
                              </p>
                              {booking.vehicle.year && (
                                <p className="text-[var(--text-secondary)] text-sm">
                                  {booking.vehicle.year} • {booking.vehicle.color}
                                </p>
                              )}
                            </div>

                            {/* Location */}
                            <div>
                              <p className="text-[var(--text-secondary)] text-xs mb-1">Location</p>
                              <p className="text-[var(--text-primary)] font-medium">
                                {booking.address.city}
                              </p>
                              <p className="text-[var(--text-secondary)] text-sm">
                                {booking.address.postal_code}
                              </p>
                            </div>
                          </div>

                          {/* Services */}
                          <div className="mb-4">
                            <p className="text-[var(--text-secondary)] text-xs mb-2">Services</p>
                            <div className="flex flex-wrap gap-2">
                              {booking.services.map((service, index) => (
                                <span
                                  key={index}
                                  className="px-2 py-1 bg-[var(--surface-tertiary)] rounded text-xs text-[var(--text-primary)]"
                                >
                                  {service.name} (£{service.base_price})
                                </span>
                              ))}
                            </div>
                          </div>

                          {/* Special Instructions */}
                          {booking.special_instructions && (
                            <div className="bg-[var(--surface-tertiary)] rounded-md p-3">
                              <p className="text-[var(--text-secondary)] text-xs mb-1">Special Instructions</p>
                              <p className="text-[var(--text-primary)] text-sm">{booking.special_instructions}</p>
                            </div>
                          )}
                        </div>

                        {/* Actions */}
                        <div className="flex flex-col gap-2 min-w-[160px]">
                          <Button
                            onClick={() => router.push(`/admin/bookings/${booking.id}`)}
                            variant="outline"
                            size="sm"
                            className="flex items-center gap-2"
                          >
                            <EyeIcon className="w-4 h-4" />
                            View Details
                          </Button>

                          {booking.status === 'pending' && (
                            <div className="flex gap-2">
                              <Button
                                onClick={() => updateBookingStatus(booking.id, 'confirmed')}
                                size="sm"
                                className="flex-1 flex items-center gap-1"
                              >
                                <CheckIcon className="w-3 h-3" />
                                Confirm
                              </Button>
                              <Button
                                onClick={() => updateBookingStatus(booking.id, 'cancelled')}
                                variant="outline"
                                size="sm"
                                className="flex-1 flex items-center gap-1"
                              >
                                <XIcon className="w-3 h-3" />
                                Cancel
                              </Button>
                            </div>
                          )}

                          {booking.status === 'confirmed' && (
                            <Button
                              onClick={() => updateBookingStatus(booking.id, 'in_progress')}
                              size="sm"
                              className="flex items-center gap-2"
                            >
                              <ClockIcon className="w-4 h-4" />
                              Start Service
                            </Button>
                          )}

                          {booking.status === 'in_progress' && (
                            <Button
                              onClick={() => updateBookingStatus(booking.id, 'completed')}
                              size="sm"
                              className="flex items-center gap-2"
                            >
                              <CheckCircleIcon className="w-4 h-4" />
                              Complete
                            </Button>
                          )}
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </>
        )}
      </div>
    </AdminLayout>
  )
}

export default function AdminBookingsPage() {
  return (
    <AdminRoute>
      <Suspense fallback={
        <AdminLayout>
          <div className="flex items-center justify-center min-h-96">
            <div className="animate-spin w-8 h-8 border-4 border-[var(--primary)] border-t-transparent rounded-full"></div>
          </div>
        </AdminLayout>
      }>
        <AdminBookingsContent />
      </Suspense>
    </AdminRoute>
  )
}