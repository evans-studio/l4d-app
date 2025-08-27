'use client'

import { useEffect, useState, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { Search, Calendar, Plus, CheckIcon, XIcon, CalendarIcon, ClockIcon, CopyIcon, CreditCard, Loader2 } from 'lucide-react'

// Real-time hooks
import { useRealTimeBookings, type AdminBooking } from '@/hooks/useRealTimeBookings'

// Status transition validation
import { validateTransition, type BookingStatus } from '@/lib/utils/status-transitions'

// UI Components
import { Button } from '@/components/ui/primitives/Button'
import { Input } from '@/components/ui/primitives/Input'
import { Card, CardContent, CardGrid } from '@/components/ui/composites/Card'
// Removed Tabs import - using custom tab implementation
import { Breadcrumb, BreadcrumbItem, BreadcrumbLink, BreadcrumbList, BreadcrumbPage, BreadcrumbSeparator } from '@/components/ui/breadcrumb'

// Layout Components
import { AdminLayout } from '@/components/layouts/AdminLayout'
import { AdminRoute } from '@/components/ProtectedRoute'
import { Container } from '@/components/layout/templates/PageLayout'
import { ConfirmBookingModal, DeclineBookingModal, RescheduleBookingModal, CancelBookingModal } from '@/components/admin/BookingActionModals'
import { useOverlay } from '@/lib/overlay/context'
import { MarkAsPaidModal } from '@/components/admin/MarkAsPaidModal'
import { PaymentSummary } from '@/components/admin/PaymentSummary'
import { logger } from '@/lib/utils/logger'
import { BookingCard as UnifiedBookingCard, type BookingData } from '@/components/ui/patterns/BookingCard'

// Use the booking type from the hook
type Booking = AdminBooking

function AdminBookingsContent() {
  const router = useRouter()
  const { openOverlay } = useOverlay()
  const searchParams = useSearchParams()
  
  // State
  const [filteredBookings, setFilteredBookings] = useState<Booking[]>([])
  const [searchTerm, setSearchTerm] = useState('')
  const [activeTab, setActiveTab] = useState<string>(searchParams?.get('status') || 'all')
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  
  // Check for error query param
  useEffect(() => {
    const error = searchParams?.get('error')
    if (error === 'booking-not-found') {
      setErrorMessage('The booking you tried to view no longer exists or has been removed.')
      // Clear the error from URL
      const newParams = new URLSearchParams(searchParams || undefined)
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
    pollInterval: 5000 // faster sync to reflect reschedules
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
  const [markAsPaidModal, setMarkAsPaidModal] = useState<{ isOpen: boolean; booking: Booking | null }>({
    isOpen: false,
    booking: null
  })
  const [actionLoading, setActionLoading] = useState(false)
  const [statusUpdateLoading, setStatusUpdateLoading] = useState<string | null>(null)
  const [confirmAction, setConfirmAction] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    action: () => Promise<void>;
    destructive?: boolean;
  }>({
    isOpen: false,
    title: '',
    message: '',
    action: async () => {},
    destructive: false
  })

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

  // Adapter: AdminBooking -> BookingData for unified card
  const toBookingData = (b: Booking): BookingData => {
    const [firstName, ...rest] = (b.customer_name || '').split(' ')
    const lastName = rest.join(' ').trim()
    return {
      id: b.id,
      bookingReference: b.booking_reference,
      status: b.status as BookingData['status'],
      scheduledDate: b.scheduled_date,
      scheduledStartTime: b.start_time,
      totalPrice: b.total_price,
      createdAt: b.created_at,
      services: (b.services || []).map((s, i) => ({ id: `${b.id}-svc-${i}`, name: s.name, price: s.base_price })),
      customer: {
        id: b.customer_id,
        firstName: firstName || b.customer_name,
        lastName: lastName || '',
        email: b.customer_email,
        phone: b.customer_phone,
      },
      vehicle: b.vehicle ? {
        make: b.vehicle.make,
        model: b.vehicle.model,
        year: b.vehicle.year,
        color: b.vehicle.color,
        size: undefined,
      } : undefined,
      address: b.address ? {
        addressLine1: b.address.address_line_1,
        addressLine2: undefined,
        city: b.address.city,
        postalCode: b.address.postal_code,
      } : undefined,
      specialInstructions: b.special_instructions,
      priority: 'normal',
    }
  }

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

  const handleMarkAsPaidClick = (booking: Booking) => {
    setMarkAsPaidModal({ isOpen: true, booking })
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
        logger.error('Failed to confirm booking')
      }
    } catch (error) {
      logger.error('Error confirming booking', error instanceof Error ? error : undefined)
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
        logger.error('Failed to decline booking', undefined, { apiError: data.error })
      }
    } catch (error) {
      logger.error('Error declining booking', error instanceof Error ? error : undefined)
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
        logger.error('Failed to reschedule booking')
        alert('Failed to reschedule booking. Please try again.')
      }
    } catch (error) {
      logger.error('Error rescheduling booking', error instanceof Error ? error : undefined)
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
        logger.error('Failed to cancel booking')
      }
    } catch (error) {
      logger.error('Error cancelling booking', error instanceof Error ? error : undefined)
    } finally {
      setActionLoading(false)
    }
  }

  const handleMarkAsPaidSuccess = async () => {
    // Refresh bookings to sync with real-time hook after successful payment marking
    await refreshBookings()
    setMarkAsPaidModal({ isOpen: false, booking: null })
  }

  // Update booking status using real-time hook with validation and confirmation
  const updateBookingStatus = async (bookingId: string, newStatus: string, skipValidation = false) => {
    const booking = bookings.find(b => b.id === bookingId)
    if (!booking) return

    // Validate transition if not skipped
    if (!skipValidation) {
      const validation = validateTransition(
        booking.status as BookingStatus, 
        newStatus as BookingStatus,
        booking.payment_status as 'pending' | 'completed' | 'failed' | undefined
      )

      if (!validation.valid) {
        setConfirmAction({
          isOpen: true,
          title: 'Invalid Status Change',
          message: validation.reason || 'This status change is not allowed.',
          action: async () => {}, // No action - just show error
          destructive: false
        })
        return
      }
    }

    const statusAction = async () => {
      setStatusUpdateLoading(bookingId)
      try {
        const success = await realtimeUpdateStatus(bookingId, newStatus as Booking['status'])
        if (!success) {
          throw new Error('Failed to update booking status')
        }
        // Success feedback could be added here
      } catch (error) {
        logger.error('Error updating booking status', error instanceof Error ? error : undefined)
        // Error feedback could be added here
      } finally {
        setStatusUpdateLoading(null)
      }
    }

    // Check if confirmation is required
    const validation = validateTransition(
      booking.status as BookingStatus, 
      newStatus as BookingStatus,
      booking.payment_status as 'pending' | 'completed' | 'failed' | undefined
    )

    if (validation.requiresConfirmation || ['cancelled', 'declined', 'payment_failed', 'completed'].includes(newStatus)) {
      const statusLabels: { [key: string]: string } = {
        confirmed: 'confirm',
        cancelled: 'cancel',
        completed: 'complete',
        payment_failed: 'mark payment as failed',
        in_progress: 'start service',
        declined: 'decline',
        processing: 'mark as processing',
        no_show: 'mark as no show'
      }

      setConfirmAction({
        isOpen: true,
        title: `${statusLabels[newStatus] ? statusLabels[newStatus].charAt(0).toUpperCase() + statusLabels[newStatus].slice(1) : 'Update'} Booking`,
        message: `${validation.warning ? validation.warning + '\n\n' : ''}Are you sure you want to ${statusLabels[newStatus] || 'update'} booking ${booking.booking_reference}?`,
        action: statusAction,
        destructive: ['cancelled', 'declined', 'payment_failed'].includes(newStatus)
      })
    } else {
      await statusAction()
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
      <Container size="xl" padding="none" className="space-y-6 overflow-x-hidden">
        {/* Header - Mobile First */}
        <div className="space-y-4">
          <Breadcrumb>
            <BreadcrumbList>
              <BreadcrumbItem>
                <BreadcrumbLink href="/admin">Admin</BreadcrumbLink>
              </BreadcrumbItem>
              <BreadcrumbSeparator />
              <BreadcrumbItem>
                <BreadcrumbPage>Bookings</BreadcrumbPage>
              </BreadcrumbItem>
            </BreadcrumbList>
          </Breadcrumb>
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-text-primary">Customer Bookings</h1>
            <div className="flex flex-col sm:flex-row sm:items-center gap-2 mt-2">
              <p className="text-text-secondary text-sm sm:text-base">Manage and track customer bookings</p>
              {lastUpdated && (
                <div className="flex items-center gap-1 text-xs text-text-muted">
                  <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                  <span>Live • Updated {new Date(lastUpdated).toLocaleTimeString()}</span>
                </div>
              )}
            </div>
            {bookingsError && (
              <div className="mt-3 text-sm text-red-600 bg-red-50 px-3 py-2 rounded-md border border-red-200">
                {bookingsError}
              </div>
            )}
            {errorMessage && (
              <div className="mt-3 text-sm text-yellow-700 bg-yellow-50 px-3 py-2 rounded-md border border-yellow-200 flex items-center gap-2">
                <span>{errorMessage}</span>
                <button 
                  onClick={() => setErrorMessage(null)}
                  className="text-yellow-600 hover:text-yellow-800 ml-auto min-h-[44px] min-w-[44px] flex items-center justify-center touch-manipulation"
                  aria-label="Dismiss error message"
                >
                  ×
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Search - Mobile First */}
        <div className="w-full min-w-0">
          <Input
            leftIcon={<Search className="w-4 h-4" />}
            placeholder="Search bookings..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="min-h-[48px] touch-manipulation w-full"
          />
        </div>

        {/* Status Filter - Mobile First Responsive */}
        <div className="w-full min-w-0">
          {/* Mobile: Select Dropdown */}
          <div className="lg:hidden">
            <select
              value={activeTab}
              onChange={(e) => setActiveTab(e.target.value)}
              className="w-full px-4 py-3 bg-surface-secondary border border-border-secondary rounded-lg text-text-primary focus:border-brand-400 focus:outline-none focus:ring-2 focus:ring-brand-600/20 min-h-[48px] touch-manipulation"
            >
              <option value="all">All Bookings ({bookings.length})</option>
              <option value="pending">Pending ({bookings.filter(b => b.status === 'pending').length})</option>
              <option value="processing">Processing ({bookings.filter(b => b.status === 'processing').length})</option>
              <option value="payment_failed">Payment Failed ({bookings.filter(b => b.status === 'payment_failed').length})</option>
              <option value="confirmed">Confirmed ({bookings.filter(b => b.status === 'confirmed').length})</option>
              <option value="rescheduled">Rescheduled ({bookings.filter(b => b.status === 'rescheduled').length})</option>
              <option value="in_progress">In Progress ({bookings.filter(b => b.status === 'in_progress').length})</option>
              <option value="completed">Completed ({bookings.filter(b => b.status === 'completed').length})</option>
              <option value="declined">Declined ({bookings.filter(b => b.status === 'declined').length})</option>
              <option value="cancelled">Cancelled ({bookings.filter(b => b.status === 'cancelled').length})</option>
              <option value="no_show">No Show ({bookings.filter(b => b.status === 'no_show').length})</option>
            </select>
          </div>

          {/* Desktop: Horizontal Tabs */}
          <div className="hidden lg:block">
            <div className="inline-flex h-12 items-center justify-center rounded-lg bg-surface-secondary p-1 border border-border-secondary">
              {['all', 'pending', 'processing', 'payment_failed', 'confirmed', 'rescheduled', 'in_progress', 'completed', 'declined', 'cancelled', 'no_show'].map((status) => (
                <button
                  key={status}
                  className={`inline-flex items-center justify-center whitespace-nowrap rounded-md px-4 py-2 text-sm font-medium transition-all duration-200 min-h-[44px] ${
                    activeTab === status 
                      ? 'bg-brand-600 text-white shadow-purple-sm' 
                      : 'text-text-secondary hover:text-text-primary hover:bg-surface-hover'
                  }`}
                  onClick={() => setActiveTab(status)}
                >
                  {status.charAt(0).toUpperCase() + status.slice(1)}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Payment Summary */}
        <PaymentSummary 
          bookings={bookings} 
          onRefreshBookings={refreshBookings} 
        />

        {/* Results */}
        <div className="w-full min-w-0">
          {filteredBookings.length === 0 ? (
            <Card className="text-center py-16">
              <CardContent>
                <Calendar className="w-16 h-16 text-text-muted mx-auto mb-4" />
                <h3 className="text-xl font-semibold text-text-primary mb-2">
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
              <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-2 mb-6">
                <p className="text-sm text-text-secondary">
                  {filteredBookings.length} booking{filteredBookings.length !== 1 ? 's' : ''} found
                  {(activeTab !== 'all' || searchTerm) && (
                    <span className="ml-2 text-text-primary font-medium">• Filtered</span>
                  )}
                </p>
              </div>

              <CardGrid columns={{ mobile: 1, tablet: 1, desktop: 1 }} gap="lg">
                {filteredBookings.map((booking, index) => {
                  const cardData = toBookingData(booking)
                  return (
                    <UnifiedBookingCard
                      key={`${booking.id}-${booking.booking_reference}-${index}`}
                      booking={cardData}
                      layout="detailed"
                      interactive
                      onView={() => openOverlay({ type: 'booking-view', data: { bookingId: booking.id, booking } })}
                      onConfirm={() => handleMarkAsPaidClick(booking)}
                      onCancel={() => setCancelModal({ isOpen: true, booking })}
                    />
                  )
                })}
              </CardGrid>
            </>
          )}
        </div>
      </Container>

      {/* Action Modals */}
      {markAsPaidModal.booking && (
        <MarkAsPaidModal
          booking={markAsPaidModal.booking}
          open={markAsPaidModal.isOpen}
          onClose={() => setMarkAsPaidModal({ isOpen: false, booking: null })}
          onSuccess={handleMarkAsPaidSuccess}
          isLoading={actionLoading}
        />
      )}

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

      {/* Confirmation Dialog */}
      {confirmAction.isOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-surface-primary rounded-lg shadow-xl max-w-md w-full p-6 border border-border-secondary">
            <h3 className="text-lg font-semibold text-text-primary mb-2">
              {confirmAction.title}
            </h3>
            <p className="text-text-secondary mb-6">
              {confirmAction.message}
            </p>
            <div className="flex gap-3 justify-end">
              <Button
                variant="outline"
                onClick={() => setConfirmAction({ ...confirmAction, isOpen: false })}
                className="min-w-[80px]"
              >
                Cancel
              </Button>
              <Button
                onClick={async () => {
                  await confirmAction.action()
                  setConfirmAction({ ...confirmAction, isOpen: false })
                }}
                className={`min-w-[80px] ${
                  confirmAction.destructive 
                    ? 'bg-red-600 hover:bg-red-700 text-white' 
                    : 'bg-brand-600 hover:bg-brand-700 text-white'
                }`}
                disabled={statusUpdateLoading !== null}
              >
                {statusUpdateLoading !== null ? (
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                ) : null}
                Confirm
              </Button>
            </div>
          </div>
        </div>
      )}
    </AdminLayout>
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