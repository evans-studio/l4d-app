'use client'

import { useEffect, useState, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { Search, Calendar, Plus } from 'lucide-react'

// UI Components
import { Button } from '@/components/ui/primitives/Button'
import { Input } from '@/components/ui/primitives/Input'
import { Card, CardContent, CardGrid } from '@/components/ui/composites/Card'
// Removed Tabs import - using custom tab implementation
import { StatusBadge } from '@/components/ui/patterns/StatusBadge'

// Layout Components
import { AdminLayout } from '@/components/layouts/AdminLayout'
import { AdminRoute } from '@/components/ProtectedRoute'
import { TodaysSchedule } from '@/components/admin/TodaysSchedule'
import { ConfirmBookingModal, DeclineBookingModal, RescheduleBookingModal, CancelBookingModal } from '@/components/admin/BookingActionModals'

interface Booking {
  id: string
  booking_reference: string
  customer_id: string
  customer_name: string
  customer_email: string
  customer_phone?: string
  scheduled_date: string
  start_time: string
  status: 'pending' | 'confirmed' | 'rescheduled' | 'in_progress' | 'completed' | 'cancelled' | 'declined'
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
  }
  address: {
    address_line_1: string
    city: string
    postal_code: string
  }
  created_at: string
}

function AdminBookingsContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  
  // State
  const [bookings, setBookings] = useState<Booking[]>([])
  const [filteredBookings, setFilteredBookings] = useState<Booking[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [activeTab, setActiveTab] = useState(searchParams.get('status') || 'all')
  const [viewMode, setViewMode] = useState<'today' | 'all'>('all')
  
  // Modal states
  const [confirmModal, setConfirmModal] = useState<{ isOpen: boolean; booking: Booking | null }>({
    isOpen: false,
    booking: null
  })
  const [declineModal, setDeclineModal] = useState<{ isOpen: boolean; booking: Booking | null }>({
    isOpen: false,
    booking: null
  })
  const [rescheduleModal, setRescheduleModal] = useState<{ isOpen: boolean; booking: Booking | null }>({
    isOpen: false,
    booking: null
  })
  const [cancelModal, setCancelModal] = useState<{ isOpen: boolean; booking: Booking | null }>({
    isOpen: false,
    booking: null
  })
  const [actionLoading, setActionLoading] = useState(false)

  // Fetch bookings
  useEffect(() => {
    const fetchBookings = async () => {
      try {
        const response = await fetch('/api/admin/bookings/all')
        const data = await response.json()
        
        if (data.success) {
          setBookings(data.data || [])
        } else {
          setBookings([])
        }
      } catch (error) {
        setBookings([])
      } finally {
        setIsLoading(false)
      }
    }

    fetchBookings()
  }, [])

  // Filter bookings
  useEffect(() => {
    let filtered = bookings

    // Search filter
    if (searchTerm) {
      const searchLower = searchTerm.toLowerCase()
      filtered = filtered.filter(booking => 
        booking.booking_reference.toLowerCase().includes(searchLower) ||
        booking.customer_name.toLowerCase().includes(searchLower) ||
        booking.customer_email.toLowerCase().includes(searchLower) ||
        booking.customer_phone?.toLowerCase().includes(searchLower) ||
        booking.vehicle.make.toLowerCase().includes(searchLower) ||
        booking.vehicle.model.toLowerCase().includes(searchLower)
      )
    }

    // Status filter
    if (activeTab !== 'all') {
      filtered = filtered.filter(booking => booking.status === activeTab)
    }

    // Sort by scheduled date (newest first)
    filtered.sort((a, b) => {
      const dateA = new Date(a.scheduled_date + ' ' + a.start_time)
      const dateB = new Date(b.scheduled_date + ' ' + b.start_time)
      return dateB.getTime() - dateA.getTime()
    })

    setFilteredBookings(filtered)
  }, [bookings, searchTerm, activeTab])

  // Modal handlers
  const handleConfirmClick = (booking: Booking) => {
    setConfirmModal({ isOpen: true, booking })
  }

  const handleDeclineClick = (booking: Booking) => {
    setDeclineModal({ isOpen: true, booking })
  }

  const handleRescheduleClick = (booking: Booking) => {
    setRescheduleModal({ isOpen: true, booking })
  }

  const handleCancelClick = (booking: Booking) => {
    setCancelModal({ isOpen: true, booking })
  }

  const handleConfirmBooking = async (sendEmail: boolean) => {
    if (!confirmModal.booking) return

    setActionLoading(true)
    try {
      const response = await fetch(`/api/admin/bookings/${confirmModal.booking.id}/confirm`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sendEmail })
      })

      const data = await response.json()
      if (data.success) {
        // Update local state optimistically
        setBookings(prev => prev.map(booking => 
          booking.id === confirmModal.booking!.id 
            ? { ...booking, status: 'confirmed' as Booking['status'] }
            : booking
        ))
        setConfirmModal({ isOpen: false, booking: null })
      } else {
        console.error('Failed to confirm booking:', data.error)
      }
    } catch (error) {
      console.error('Error confirming booking:', error)
    } finally {
      setActionLoading(false)
    }
  }

  const handleDeclineBooking = async (reason: string, customReason?: string, notes?: string) => {
    if (!declineModal.booking) return

    setActionLoading(true)
    try {
      const response = await fetch(`/api/admin/bookings/${declineModal.booking.id}/decline`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reason, customReason, notes })
      })

      const data = await response.json()
      if (data.success) {
        // Update local state optimistically
        setBookings(prev => prev.map(booking => 
          booking.id === declineModal.booking!.id 
            ? { ...booking, status: 'declined' as Booking['status'] }
            : booking
        ))
        setDeclineModal({ isOpen: false, booking: null })
      } else {
        console.error('Failed to decline booking:', data.error)
      }
    } catch (error) {
      console.error('Error declining booking:', error)
    } finally {
      setActionLoading(false)
    }
  }

  const handleRescheduleBooking = async (newDate: string, newTime: string, reason?: string) => {
    if (!rescheduleModal.booking) return

    setActionLoading(true)
    try {
      const response = await fetch(`/api/admin/bookings/${rescheduleModal.booking.id}/reschedule`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ newDate, newTime, reason })
      })

      const data = await response.json()
      if (data.success) {
        // Update local state optimistically
        setBookings(prev => prev.map(booking => 
          booking.id === rescheduleModal.booking!.id 
            ? { ...booking, scheduled_date: newDate, start_time: newTime, status: 'rescheduled' as Booking['status'] }
            : booking
        ))
        setRescheduleModal({ isOpen: false, booking: null })
      } else {
        console.error('Failed to reschedule booking:', data.error)
        console.error('Response status:', response.status)
        console.error('Full response:', data)
        alert(`Failed to reschedule booking: ${data.error?.message || 'Unknown error'}`)
      }
    } catch (error) {
      console.error('Error rescheduling booking:', error)
    } finally {
      setActionLoading(false)
    }
  }

  const handleCancelBooking = async (reason: string, refundAmount?: number, notes?: string) => {
    if (!cancelModal.booking) return

    setActionLoading(true)
    try {
      const response = await fetch(`/api/admin/bookings/${cancelModal.booking.id}/cancel`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reason, refundAmount, notes })
      })

      const data = await response.json()
      if (data.success) {
        // Update local state optimistically
        setBookings(prev => prev.map(booking => 
          booking.id === cancelModal.booking!.id 
            ? { ...booking, status: 'cancelled' as Booking['status'] }
            : booking
        ))
        setCancelModal({ isOpen: false, booking: null })
      } else {
        console.error('Failed to cancel booking:', data.error)
      }
    } catch (error) {
      console.error('Error cancelling booking:', error)
    } finally {
      setActionLoading(false)
    }
  }

  // Update booking status (legacy - keeping for other status updates)
  const updateBookingStatus = async (bookingId: string, newStatus: string) => {
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
            ? { ...booking, status: newStatus as Booking['status'] }
            : booking
        ))
      }
    } catch (error) {
      // Silent error handling
    }
  }

  // Format helpers
  const formatTime = (time: string) => {
    const [hours, minutes] = time.split(':')
    const hour = parseInt(hours || '0')
    const ampm = hour >= 12 ? 'PM' : 'AM'
    const displayHour = hour % 12 || 12
    return `${displayHour}:${minutes || '00'} ${ampm}`
  }

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr)
    const today = new Date()
    const tomorrow = new Date(today)
    tomorrow.setDate(today.getDate() + 1)
    
    if (date.toDateString() === today.toDateString()) {
      return 'Today'
    } else if (date.toDateString() === tomorrow.toDateString()) {
      return 'Tomorrow'
    } else {
      return date.toLocaleDateString('en-GB', {
        day: 'numeric',
        month: 'short',
        year: 'numeric'
      })
    }
  }

  if (isLoading) {
    return (
      <AdminLayout>
        <div className="flex items-center justify-center min-h-96">
          <div className="animate-spin w-8 h-8 border-4 border-brand-500 border-t-transparent rounded-full"></div>
        </div>
      </AdminLayout>
    )
  }

  return (
    <AdminLayout>
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-text-primary">Bookings</h1>
            <p className="text-text-secondary">Manage and track customer bookings</p>
          </div>
          
          <div className="flex items-center gap-3">
            <Button
              onClick={() => setViewMode(viewMode === 'today' ? 'all' : 'today')}
              variant="outline"
              size="sm"
            >
              <Calendar className="w-4 h-4 mr-2" />
              {viewMode === 'today' ? 'All Bookings' : "Today's Schedule"}
            </Button>
            <Button
              onClick={() => router.push('/admin')}
              variant="outline"
              size="sm"
            >
              Dashboard
            </Button>
          </div>
        </div>

        {/* Content */}
        {viewMode === 'today' ? (
          <TodaysSchedule 
            onRefresh={() => {
              // Refresh bookings
              const fetchBookings = async () => {
                try {
                  const response = await fetch('/api/admin/bookings/all')
                  const data = await response.json()
                  if (data.success) {
                    setBookings(data.data)
                  }
                } catch (error) {
                  // Silent error handling
                }
              }
              fetchBookings()
            }} 
          />
        ) : (
          <>
            {/* Search */}
            <div className="max-w-md">
              <Input
                leftIcon={<Search className="w-4 h-4" />}
                placeholder="Search bookings..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>

            {/* Status Tabs */}
            <div className="w-full">
              <div className="inline-flex h-10 items-center justify-center rounded-md bg-gray-100 p-1 text-gray-500 w-full lg:w-fit">
                <button
                  className={`inline-flex items-center justify-center whitespace-nowrap rounded-sm px-3 py-1.5 text-sm font-medium transition-all ${
                    activeTab === 'all' 
                      ? 'bg-white text-gray-950 shadow-sm' 
                      : 'text-gray-600 hover:text-gray-900'
                  }`}
                  onClick={() => setActiveTab('all')}
                >
                  All
                </button>
                <button
                  className={`inline-flex items-center justify-center whitespace-nowrap rounded-sm px-3 py-1.5 text-sm font-medium transition-all ${
                    activeTab === 'pending' 
                      ? 'bg-white text-gray-950 shadow-sm' 
                      : 'text-gray-600 hover:text-gray-900'
                  }`}
                  onClick={() => setActiveTab('pending')}
                >
                  Pending
                </button>
                <button
                  className={`inline-flex items-center justify-center whitespace-nowrap rounded-sm px-3 py-1.5 text-sm font-medium transition-all ${
                    activeTab === 'confirmed' 
                      ? 'bg-white text-gray-950 shadow-sm' 
                      : 'text-gray-600 hover:text-gray-900'
                  }`}
                  onClick={() => setActiveTab('confirmed')}
                >
                  Confirmed
                </button>
                <button
                  className={`inline-flex items-center justify-center whitespace-nowrap rounded-sm px-3 py-1.5 text-sm font-medium transition-all ${
                    activeTab === 'rescheduled' 
                      ? 'bg-white text-gray-950 shadow-sm' 
                      : 'text-gray-600 hover:text-gray-900'
                  }`}
                  onClick={() => setActiveTab('rescheduled')}
                >
                  Rescheduled
                </button>
                <button
                  className={`inline-flex items-center justify-center whitespace-nowrap rounded-sm px-3 py-1.5 text-sm font-medium transition-all ${
                    activeTab === 'completed' 
                      ? 'bg-white text-gray-950 shadow-sm' 
                      : 'text-gray-600 hover:text-gray-900'
                  }`}
                  onClick={() => setActiveTab('completed')}
                >
                  Completed
                </button>
                <button
                  className={`inline-flex items-center justify-center whitespace-nowrap rounded-sm px-3 py-1.5 text-sm font-medium transition-all ${
                    activeTab === 'cancelled' 
                      ? 'bg-white text-gray-950 shadow-sm' 
                      : 'text-gray-600 hover:text-gray-900'
                  }`}
                  onClick={() => setActiveTab('cancelled')}
                >
                  Cancelled
                </button>
                <button
                  className={`inline-flex items-center justify-center whitespace-nowrap rounded-sm px-3 py-1.5 text-sm font-medium transition-all ${
                    activeTab === 'declined' 
                      ? 'bg-white text-gray-950 shadow-sm' 
                      : 'text-gray-600 hover:text-gray-900'
                  }`}
                  onClick={() => setActiveTab('declined')}
                >
                  Declined
                </button>
              </div>

              {/* Results */}
              <div className="mt-6">
                {filteredBookings.length === 0 ? (
                  <Card className="text-center py-12">
                    <CardContent>
                      <Calendar className="w-12 h-12 text-text-muted mx-auto mb-4" />
                      <h3 className="text-lg font-semibold text-text-primary mb-2">
                        No Bookings Found
                      </h3>
                      <p className="text-text-secondary">
                        {searchTerm || activeTab !== 'all' 
                          ? 'No bookings match your current filters.' 
                          : 'No bookings have been created yet.'
                        }
                      </p>
                    </CardContent>
                  </Card>
                ) : (
                  <>
                    <div className="flex justify-between items-center mb-4">
                      <p className="text-sm text-text-secondary">
                        {filteredBookings.length} booking{filteredBookings.length !== 1 ? 's' : ''} found
                        {(activeTab !== 'all' || searchTerm) && (
                          <span className="ml-2 text-text-primary">• Filtered</span>
                        )}
                      </p>
                    </div>

                    <CardGrid columns={{ mobile: 1, tablet: 1, desktop: 1 }} gap="md">
                      {filteredBookings.map((booking) => (
                        <BookingCard
                          key={booking.id}
                          booking={booking}
                          onStatusUpdate={updateBookingStatus}
                          onConfirm={() => handleConfirmClick(booking)}
                          onDecline={() => handleDeclineClick(booking)}
                          onReschedule={() => handleRescheduleClick(booking)}
                          onCancel={() => handleCancelClick(booking)}
                          formatTime={formatTime}
                          formatDate={formatDate}
                        />
                      ))}
                    </CardGrid>
                  </>
                )}
              </div>
            </div>
          </>
        )}
      </div>

      {/* Action Modals */}
      {confirmModal.booking && (
        <ConfirmBookingModal
          booking={confirmModal.booking}
          open={confirmModal.isOpen}
          onClose={() => setConfirmModal({ isOpen: false, booking: null })}
          onConfirm={handleConfirmBooking}
          isLoading={actionLoading}
        />
      )}

      {declineModal.booking && (
        <DeclineBookingModal
          booking={declineModal.booking}
          open={declineModal.isOpen}
          onClose={() => setDeclineModal({ isOpen: false, booking: null })}
          onDecline={handleDeclineBooking}
          isLoading={actionLoading}
        />
      )}

      {rescheduleModal.booking && (
        <RescheduleBookingModal
          booking={rescheduleModal.booking}
          open={rescheduleModal.isOpen}
          onClose={() => setRescheduleModal({ isOpen: false, booking: null })}
          onReschedule={handleRescheduleBooking}
          isLoading={actionLoading}
        />
      )}

      {cancelModal.booking && (
        <CancelBookingModal
          booking={cancelModal.booking}
          open={cancelModal.isOpen}
          onClose={() => setCancelModal({ isOpen: false, booking: null })}
          onCancel={handleCancelBooking}
          isLoading={actionLoading}
        />
      )}
    </AdminLayout>
  )
}

// Booking Card Component
interface BookingCardProps {
  booking: Booking
  onStatusUpdate: (bookingId: string, newStatus: string) => Promise<void>
  onConfirm?: () => void
  onDecline?: () => void
  onReschedule?: () => void
  onCancel?: () => void
  formatTime: (time: string) => string
  formatDate: (dateStr: string) => string
}

function BookingCard({ booking, onStatusUpdate, onConfirm, onDecline, onReschedule, onCancel, formatTime, formatDate }: BookingCardProps) {
  const router = useRouter()

  const getStatusActions = () => {
    switch (booking.status) {
      case 'pending':
        return (
          <div className="space-y-2">
            {/* Primary Actions */}
            <div className="grid grid-cols-2 gap-2">
              <Button
                onClick={onConfirm}
                size="sm"
                className="bg-green-600 hover:bg-green-700"
              >
                Confirm
              </Button>
              <Button
                onClick={onDecline}
                variant="outline"
                size="sm"
                className="text-red-600 border-red-200 hover:bg-red-50"
              >
                Decline
              </Button>
            </div>
            {/* Secondary Actions */}
            <div className="grid grid-cols-2 gap-2">
              <Button
                onClick={onReschedule}
                variant="outline"
                size="sm"
                className="text-blue-600 border-blue-200 hover:bg-blue-50"
              >
                Reschedule
              </Button>
              <Button
                onClick={onCancel}
                variant="outline"
                size="sm"
                className="text-red-600 border-red-200 hover:bg-red-50"
              >
                Cancel
              </Button>
            </div>
          </div>
        )
      case 'confirmed':
        return (
          <div className="space-y-2">
            {/* Primary Action */}
            <Button
              onClick={() => onStatusUpdate(booking.id, 'in_progress')}
              size="sm"
              className="w-full bg-blue-600 hover:bg-blue-700"
            >
              Start Service
            </Button>
            {/* Secondary Actions */}
            <div className="grid grid-cols-2 gap-2">
              <Button
                onClick={onReschedule}
                variant="outline"
                size="sm"
                className="text-blue-600 border-blue-200 hover:bg-blue-50"
              >
                Reschedule
              </Button>
              <Button
                onClick={onCancel}
                variant="outline"
                size="sm"
                className="text-red-600 border-red-200 hover:bg-red-50"
              >
                Cancel
              </Button>
            </div>
          </div>
        )
      case 'rescheduled':
        return (
          <div className="space-y-2">
            {/* Primary Action */}
            <Button
              onClick={() => onStatusUpdate(booking.id, 'in_progress')}
              size="sm"
              className="w-full bg-blue-600 hover:bg-blue-700"
            >
              Start Service
            </Button>
            {/* Secondary Actions */}
            <div className="grid grid-cols-2 gap-2">
              <Button
                onClick={onReschedule}
                variant="outline"
                size="sm"
                className="text-blue-600 border-blue-200 hover:bg-blue-50"
              >
                Reschedule Again
              </Button>
              <Button
                onClick={onCancel}
                variant="outline"
                size="sm"
                className="text-red-600 border-red-200 hover:bg-red-50"
              >
                Cancel
              </Button>
            </div>
          </div>
        )
      case 'in_progress':
        return (
          <div className="space-y-2">
            {/* Primary Action */}
            <Button
              onClick={() => onStatusUpdate(booking.id, 'completed')}
              size="sm"
              className="w-full bg-green-600 hover:bg-green-700"
            >
              Complete Service
            </Button>
            {/* Emergency Actions */}
            <Button
              onClick={onCancel}
              variant="outline"
              size="sm"
              className="w-full text-red-600 border-red-200 hover:bg-red-50"
            >
              Emergency Cancel
            </Button>
          </div>
        )
      case 'completed':
        return (
          <div className="space-y-2">
            {/* Status Change Actions */}
            <Button
              onClick={() => onStatusUpdate(booking.id, 'in_progress')}
              variant="outline"
              size="sm"
              className="w-full text-orange-600 border-orange-200 hover:bg-orange-50"
            >
              Mark In Progress
            </Button>
          </div>
        )
      case 'cancelled':
        return (
          <div className="space-y-2">
            {/* Reactivation Actions */}
            <Button
              onClick={() => onStatusUpdate(booking.id, 'pending')}
              variant="outline"
              size="sm"
              className="w-full text-orange-600 border-orange-200 hover:bg-orange-50"
            >
              Reactivate
            </Button>
          </div>
        )
      case 'declined':
        return (
          <div className="space-y-2">
            {/* Reactivation Actions */}
            <Button
              onClick={() => onStatusUpdate(booking.id, 'pending')}
              variant="outline"
              size="sm"
              className="w-full text-orange-600 border-orange-200 hover:bg-orange-50"
            >
              Reactivate
            </Button>
          </div>
        )
      default:
        return null
    }
  }

  return (
    <Card className="hover:shadow-md transition-shadow">
      <CardContent className="p-6">
        {/* Header */}
        <div className="flex items-start justify-between mb-4">
          <div className="flex-1">
            <h3 className="text-lg font-semibold text-text-primary mb-2">
              #{booking.booking_reference}
            </h3>
            <StatusBadge status={booking.status} />
          </div>
          <div className="text-right">
            <p className="text-xl font-bold text-brand-500">£{booking.total_price}</p>
            <p className="text-sm text-text-muted">
              {booking.services.length} service{booking.services.length !== 1 ? 's' : ''}
            </p>
          </div>
        </div>

        {/* Date & Time */}
        <div className="flex items-center gap-4 mb-4 text-text-primary">
          <div className="flex items-center gap-2">
            <Calendar className="w-4 h-4 text-text-secondary" />
            <span className="font-medium">{formatDate(booking.scheduled_date)}</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="font-medium">{formatTime(booking.start_time)}</span>
          </div>
        </div>

        {/* Customer & Vehicle Info */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
          <div>
            <p className="text-xs text-text-secondary mb-1">Customer</p>
            <p className="font-medium text-text-primary">{booking.customer_name}</p>
            <p className="text-sm text-text-secondary">{booking.customer_email}</p>
          </div>
          <div>
            <p className="text-xs text-text-secondary mb-1">Vehicle</p>
            <p className="font-medium text-text-primary">
              {booking.vehicle.make} {booking.vehicle.model}
            </p>
            {booking.vehicle.year && (
              <p className="text-sm text-text-secondary">
                {booking.vehicle.year} • {booking.vehicle.color}
              </p>
            )}
          </div>
        </div>

        {/* Services */}
        <div className="mb-4">
          <p className="text-xs text-text-secondary mb-2">Services</p>
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

        {/* Special Instructions */}
        {booking.special_instructions && (
          <div className="mb-4 p-3 bg-surface-tertiary rounded-md">
            <p className="text-xs text-text-secondary mb-1">Special Instructions</p>
            <p className="text-sm text-text-primary">{booking.special_instructions}</p>
          </div>
        )}

        {/* Actions */}
        <div className="space-y-2">
          <Button
            onClick={() => router.push(`/admin/bookings/${booking.id}`)}
            variant="outline"
            size="sm"
            className="w-full"
          >
            View Details
          </Button>
          {getStatusActions()}
        </div>
      </CardContent>
    </Card>
  )
}

export default function AdminBookingsPage() {
  return (
    <AdminRoute>
      <Suspense fallback={
        <AdminLayout>
          <div className="flex items-center justify-center min-h-96">
            <div className="animate-spin w-8 h-8 border-4 border-brand-500 border-t-transparent rounded-full"></div>
          </div>
        </AdminLayout>
      }>
        <AdminBookingsContent />
      </Suspense>
    </AdminRoute>
  )
}