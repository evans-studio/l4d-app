'use client'

import { useEffect, useState, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { Search, Calendar, Plus, CheckIcon, XIcon, CalendarIcon, ClockIcon } from 'lucide-react'

// Real-time hooks
import { useRealTimeBookings, type AdminBooking } from '@/hooks/useRealTimeBookings'

// UI Components
import { Button } from '@/components/ui/primitives/Button'
import { Input } from '@/components/ui/primitives/Input'
import { Card, CardContent, CardGrid } from '@/components/ui/composites/Card'
// Removed Tabs import - using custom tab implementation
import { StatusBadge } from '@/components/ui/patterns/StatusBadge'

// Layout Components
import { AdminLayout } from '@/components/layouts/AdminLayout'
import { AdminRoute } from '@/components/ProtectedRoute'
import { Container } from '@/components/layout/templates/PageLayout'
import { TodaysSchedule } from '@/components/admin/TodaysSchedule'
import { ConfirmBookingModal, DeclineBookingModal, RescheduleBookingModal, CancelBookingModal } from '@/components/admin/BookingActionModals'

// Use the booking type from the hook
type Booking = AdminBooking

function AdminBookingsContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  
  // State
  const [filteredBookings, setFilteredBookings] = useState<Booking[]>([])
  const [searchTerm, setSearchTerm] = useState('')
  const [activeTab, setActiveTab] = useState(searchParams.get('status') || 'all')
  const [viewMode, setViewMode] = useState<'today' | 'all'>('all')
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  
  // Check for error query param
  useEffect(() => {
    const error = searchParams.get('error')
    if (error === 'booking-not-found') {
      setErrorMessage('The booking you tried to view no longer exists or has been removed.')
      // Clear the error from URL
      const newParams = new URLSearchParams(searchParams)
      newParams.delete('error')
      router.replace(`/admin/bookings?${newParams.toString()}`)
    }
  }, [searchParams, router])
  
  // Real-time bookings hook
  const {
    bookings,
    isLoading,
    error: bookingsError,
    lastUpdated,
    refreshBookings,
    updateBookingStatus: realtimeUpdateStatus,
    confirmBooking: realtimeConfirmBooking,
    cancelBooking: realtimeCancelBooking,
    rescheduleBooking: realtimeRescheduleBooking
  } = useRealTimeBookings({
    enableRealTimeUpdates: true,
    pollInterval: 30000 // 30 seconds
  })
  
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
        booking.vehicle?.make?.toLowerCase().includes(searchLower) ||
        booking.vehicle?.model?.toLowerCase().includes(searchLower)
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
      const success = await realtimeConfirmBooking(confirmModal.booking.id, sendEmail)
      
      if (success) {
        // Refresh bookings to sync with real-time hook and prevent stale data
        await refreshBookings()
        setConfirmModal({ isOpen: false, booking: null })
      } else {
        console.error('Failed to confirm booking')
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
      // Use the existing API endpoint for decline (not available in hook yet)
      const response = await fetch(`/api/admin/bookings/${declineModal.booking.id}/decline`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reason, customReason, notes })
      })

      const data = await response.json()
      if (data.success) {
        // Refresh bookings to sync with real-time hook
        await refreshBookings()
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
      const success = await realtimeRescheduleBooking(rescheduleModal.booking.id, newDate, newTime, reason)
      
      if (success) {
        // Refresh bookings to sync with real-time hook and prevent stale data
        await refreshBookings()
        setRescheduleModal({ isOpen: false, booking: null })
      } else {
        console.error('Failed to reschedule booking')
        alert('Failed to reschedule booking. Please try again.')
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
      const success = await realtimeCancelBooking(cancelModal.booking.id, reason, refundAmount)
      
      if (success) {
        // Refresh bookings to sync with real-time hook and prevent stale data
        await refreshBookings()
        setCancelModal({ isOpen: false, booking: null })
      } else {
        console.error('Failed to cancel booking')
      }
    } catch (error) {
      console.error('Error cancelling booking:', error)
    } finally {
      setActionLoading(false)
    }
  }

  // Update booking status using real-time hook
  const updateBookingStatus = async (bookingId: string, newStatus: string) => {
    try {
      await realtimeUpdateStatus(bookingId, newStatus as Booking['status'])
    } catch (error) {
      console.error('Error updating booking status:', error)
    }
  }

  // Format helpers
  const formatTime = (time: string | undefined | null) => {
    if (!time) return 'No time'
    const [hours, minutes] = time.split(':')
    const hour = parseInt(hours || '0')
    const ampm = hour >= 12 ? 'PM' : 'AM'
    const displayHour = hour % 12 || 12
    return `${displayHour}:${minutes || '00'} ${ampm}`
  }

  const formatDate = (dateStr: string | undefined | null) => {
    if (!dateStr) return 'No date'
    const date = new Date(dateStr)
    if (isNaN(date.getTime())) return 'Invalid date'
    
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
      <Container size="2xl" padding="none" className="space-y-6">
        {/* Header - Mobile Optimized */}
        <div className="space-y-4">
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold text-text-primary">Bookings</h1>
              <div className="flex items-center gap-2">
                <p className="text-text-secondary text-sm sm:text-base">Manage and track customer bookings</p>
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
              {errorMessage && (
                <div className="mt-2 text-sm text-yellow-700 bg-yellow-50 px-3 py-2 rounded border border-yellow-200 flex items-center gap-2">
                  <span>{errorMessage}</span>
                  <button 
                    onClick={() => setErrorMessage(null)}
                    className="text-yellow-600 hover:text-yellow-800 ml-auto"
                  >
                    ×
                  </button>
                </div>
              )}
            </div>
            
            <div className="flex items-center gap-2 w-full md:w-auto">
              <Button
                onClick={refreshBookings}
                variant="outline"
                size="sm"
                className="flex-1 md:flex-none min-h-[44px] touch-manipulation"
                disabled={isLoading}
              >
                <Search className="w-4 h-4 mr-2" />
                <span className="hidden xs:inline">Refresh</span>
              </Button>
              <Button
                onClick={() => setViewMode(viewMode === 'today' ? 'all' : 'today')}
                variant="outline"
                size="sm"
                className="flex-1 md:flex-none min-h-[44px] touch-manipulation"
              >
                <Calendar className="w-4 h-4 mr-2" />
                <span className="hidden xs:inline">{viewMode === 'today' ? 'All Bookings' : "Today's Schedule"}</span>
                <span className="xs:hidden">{viewMode === 'today' ? 'All' : 'Today'}</span>
              </Button>
              <Button
                onClick={() => router.push('/admin')}
                variant="outline"
                size="sm"
                className="flex-1 md:flex-none min-h-[44px] touch-manipulation"
              >
                <span className="hidden xs:inline">Dashboard</span>
                <span className="xs:hidden">Home</span>
              </Button>
            </div>
          </div>
        </div>

        {/* Content */}
        {viewMode === 'today' ? (
          <TodaysSchedule 
            onRefresh={refreshBookings}
          />
        ) : (
          <>
            {/* Search - Mobile Optimized */}
            <div className="w-full max-w-md">
              <Input
                leftIcon={<Search className="w-4 h-4" />}
                placeholder="Search bookings..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="min-h-[44px] touch-manipulation"
              />
            </div>

            {/* Status Tabs - Mobile Responsive */}
            <div className="w-full">
              {/* Desktop Tabs */}
              <div className="hidden lg:block">
                <div className="inline-flex h-10 items-center justify-center rounded-md bg-gray-100 p-1 text-gray-500 w-fit">
                  {['all', 'pending', 'confirmed', 'rescheduled', 'completed', 'cancelled', 'declined'].map((status) => (
                    <button
                      key={status}
                      className={`inline-flex items-center justify-center whitespace-nowrap rounded-sm px-3 py-1.5 text-sm font-medium transition-all ${
                        activeTab === status 
                          ? 'bg-white text-gray-950 shadow-sm' 
                          : 'text-gray-600 hover:text-gray-900'
                      }`}
                      onClick={() => setActiveTab(status)}
                    >
                      {status.charAt(0).toUpperCase() + status.slice(1)}
                    </button>
                  ))}
                </div>
              </div>
              
              {/* Mobile Scrollable Tabs */}
              <div className="lg:hidden">
                <div className="flex overflow-x-auto gap-2 pb-2 -mx-4 px-4" style={{scrollbarWidth: 'none', msOverflowStyle: 'none'}}>
                  {[
                    { key: 'all', label: 'All', count: bookings.length },
                    { key: 'pending', label: 'Pending', count: bookings.filter(b => b.status === 'pending').length },
                    { key: 'confirmed', label: 'Confirmed', count: bookings.filter(b => b.status === 'confirmed').length },
                    { key: 'rescheduled', label: 'Rescheduled', count: bookings.filter(b => b.status === 'rescheduled').length },
                    { key: 'completed', label: 'Completed', count: bookings.filter(b => b.status === 'completed').length },
                    { key: 'cancelled', label: 'Cancelled', count: bookings.filter(b => b.status === 'cancelled').length },
                    { key: 'declined', label: 'Declined', count: bookings.filter(b => b.status === 'declined').length }
                  ].map((tab) => (
                    <button
                      key={tab.key}
                      className={`flex-shrink-0 min-h-[44px] px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 touch-manipulation ${
                        activeTab === tab.key
                          ? 'bg-brand-600 text-white shadow-purple-lg'
                          : 'bg-surface-secondary text-text-secondary hover:bg-surface-hover hover:text-text-primary border border-border-secondary'
                      }`}
                      onClick={() => setActiveTab(tab.key)}
                    >
                      <div className="flex flex-col items-center gap-1">
                        <span>{tab.label}</span>
                        <span className={`text-xs px-1.5 py-0.5 rounded-full ${
                          activeTab === tab.key
                            ? 'bg-white/20 text-white'
                            : 'bg-text-muted/10 text-text-muted'
                        }`}>
                          {tab.count}
                        </span>
                      </div>
                    </button>
                  ))}
                </div>
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
                      {filteredBookings.map((booking, index) => (
                        <BookingCard
                          key={`${booking.id}-${booking.booking_reference}-${index}`}
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
      </Container>

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
          <div className="space-y-3">
            {/* Primary Actions */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
              <Button
                onClick={onConfirm}
                size="sm"
                className="bg-green-600 hover:bg-green-700 text-white min-h-[44px] touch-manipulation"
              >
                <CheckIcon className="w-4 h-4 mr-2" />
                Confirm
              </Button>
              <Button
                onClick={onDecline}
                variant="outline"
                size="sm"
                className="text-red-600 border-red-200 hover:bg-red-50 min-h-[44px] touch-manipulation"
              >
                <XIcon className="w-4 h-4 mr-2" />
                Decline
              </Button>
            </div>
            {/* Secondary Actions */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
              <Button
                onClick={onReschedule}
                variant="outline"
                size="sm"
                className="text-blue-600 border-blue-200 hover:bg-blue-50 min-h-[44px] touch-manipulation"
              >
                <CalendarIcon className="w-4 h-4 mr-2" />
                Reschedule
              </Button>
              <Button
                onClick={onCancel}
                variant="outline"
                size="sm"
                className="text-red-600 border-red-200 hover:bg-red-50 min-h-[44px] touch-manipulation"
              >
                <XIcon className="w-4 h-4 mr-2" />
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
              className="w-full bg-blue-600 hover:bg-blue-700 text-white min-h-[44px] touch-manipulation"
            >
              <ClockIcon className="w-4 h-4 mr-2" />
              Start Service
            </Button>
            {/* Secondary Actions */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
              <Button
                onClick={onReschedule}
                variant="outline"
                size="sm"
                className="text-blue-600 border-blue-200 hover:bg-blue-50 min-h-[44px] touch-manipulation"
              >
                <CalendarIcon className="w-4 h-4 mr-2" />
                Reschedule
              </Button>
              <Button
                onClick={onCancel}
                variant="outline"
                size="sm"
                className="text-red-600 border-red-200 hover:bg-red-50 min-h-[44px] touch-manipulation"
              >
                <XIcon className="w-4 h-4 mr-2" />
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
              className="w-full bg-blue-600 hover:bg-blue-700 text-white min-h-[44px] touch-manipulation"
            >
              <ClockIcon className="w-4 h-4 mr-2" />
              Start Service
            </Button>
            {/* Secondary Actions */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
              <Button
                onClick={onReschedule}
                variant="outline"
                size="sm"
                className="text-blue-600 border-blue-200 hover:bg-blue-50 min-h-[44px] touch-manipulation"
              >
                <CalendarIcon className="w-4 h-4 mr-2" />
                <span className="hidden md:inline">Reschedule Again</span>
                <span className="md:hidden">Reschedule</span>
              </Button>
              <Button
                onClick={onCancel}
                variant="outline"
                size="sm"
                className="text-red-600 border-red-200 hover:bg-red-50 min-h-[44px] touch-manipulation"
              >
                <XIcon className="w-4 h-4 mr-2" />
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
              className="w-full bg-green-600 hover:bg-green-700 text-white min-h-[44px] touch-manipulation"
            >
              <CheckIcon className="w-4 h-4 mr-2" />
              Complete Service
            </Button>
            {/* Emergency Actions */}
            <Button
              onClick={onCancel}
              variant="outline"
              size="sm"
              className="w-full text-red-600 border-red-200 hover:bg-red-50 min-h-[44px] touch-manipulation"
            >
              <XIcon className="w-4 h-4 mr-2" />
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
              className="w-full text-orange-600 border-orange-200 hover:bg-orange-50 min-h-[44px] touch-manipulation"
            >
              <ClockIcon className="w-4 h-4 mr-2" />
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
              className="w-full text-orange-600 border-orange-200 hover:bg-orange-50 min-h-[44px] touch-manipulation"
            >
              <ClockIcon className="w-4 h-4 mr-2" />
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
              className="w-full text-orange-600 border-orange-200 hover:bg-orange-50 min-h-[44px] touch-manipulation"
            >
              <ClockIcon className="w-4 h-4 mr-2" />
              Reactivate
            </Button>
          </div>
        )
      default:
        return null
    }
  }

  return (
    <Card className="hover:shadow-md transition-shadow w-full min-w-0">
      <CardContent className="p-4 sm:p-6 min-w-0">
        {/* Header */}
        <div className="flex items-start justify-between mb-4 gap-3 min-w-0">
          <div className="flex-1 min-w-0">
            <h3 className="text-lg font-semibold text-text-primary mb-2 truncate">
              #{booking.booking_reference}
            </h3>
            <StatusBadge status={booking.status} />
          </div>
          <div className="text-right flex-shrink-0 min-w-0">
            <p className="text-xl font-bold text-brand-500 truncate">£{booking.total_price}</p>
            <p className="text-sm text-text-muted truncate">
              {booking.services?.length || 0} service{(booking.services?.length || 0) !== 1 ? 's' : ''}
            </p>
          </div>
        </div>

        {/* Date & Time */}
        <div className="flex flex-col md:flex-row md:items-center gap-2 md:gap-4 mb-4 text-text-primary min-w-0">
          <div className="flex items-center gap-2 min-w-0">
            <Calendar className="w-4 h-4 text-text-secondary flex-shrink-0" />
            <span className="font-medium truncate">{formatDate(booking.scheduled_date)}</span>
          </div>
          <div className="flex items-center gap-2 min-w-0">
            <span className="font-medium truncate">{formatTime(booking.start_time)}</span>
          </div>
        </div>

        {/* Customer & Vehicle Info - Mobile Optimized */}
        <div className="space-y-3 md:space-y-0 md:grid md:grid-cols-2 md:gap-4 mb-4">
          <div className="bg-surface-tertiary rounded-lg p-3 min-w-0">
            <p className="text-xs text-text-secondary mb-2 font-medium uppercase tracking-wide">Customer</p>
            <div className="space-y-1 min-w-0">
              <p className="font-semibold text-text-primary truncate">{booking.customer_name}</p>
              <p className="text-sm text-text-secondary truncate">{booking.customer_email}</p>
              {booking.customer_phone && (
                <p className="text-sm text-text-secondary break-words">{booking.customer_phone}</p>
              )}
            </div>
          </div>
          <div className="bg-surface-tertiary rounded-lg p-3 min-w-0">
            <p className="text-xs text-text-secondary mb-2 font-medium uppercase tracking-wide">Vehicle</p>
            <div className="space-y-1 min-w-0">
              <p className="font-semibold text-text-primary truncate">
                {booking.vehicle?.make && booking.vehicle?.model 
                  ? `${booking.vehicle.make} ${booking.vehicle.model}`
                  : 'No vehicle info'
                }
              </p>
              {booking.vehicle?.year && (
                <p className="text-sm text-text-secondary truncate">
                  {booking.vehicle.year}{booking.vehicle?.color ? ` • ${booking.vehicle.color}` : ''}
                </p>
              )}
            </div>
          </div>
        </div>

        {/* Services */}
        <div className="mb-4 min-w-0">
          <p className="text-xs text-text-secondary mb-2">Services</p>
          <div className="flex flex-wrap gap-1 min-w-0">
            {booking.services?.map((service, index) => (
              <span
                key={`${booking.id}-service-${index}-${service.name}`}
                className="px-2 py-1 bg-surface-tertiary rounded text-xs text-text-primary truncate max-w-full inline-block"
                title={service.name}
              >
                {service.name}
              </span>
            )) || <span className="text-text-muted text-xs">No services</span>}
          </div>
        </div>

        {/* Special Instructions */}
        {booking.special_instructions && (
          <div className="mb-4 p-3 bg-surface-tertiary rounded-md min-w-0">
            <p className="text-xs text-text-secondary mb-1">Special Instructions</p>
            <p className="text-sm text-text-primary break-words overflow-hidden">{booking.special_instructions}</p>
          </div>
        )}

        {/* Actions - Mobile Optimized */}
        <div className="space-y-3">
          <Button
            onClick={() => router.push(`/admin/bookings/${booking.id}`)}
            variant="outline"
            size="sm"
            className="w-full min-h-[44px] touch-manipulation"
          >
            View Details
          </Button>
          <div className="space-y-2">
            {getStatusActions()}
          </div>
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