'use client'

import React, { useState, useEffect } from 'react'
import { Calendar, Clock, MapPin, Car, User, Phone, Mail, CheckCircle, AlertCircle, XCircle, Clock as PendingIcon, FileText, RefreshCw, DollarSign, UserX } from 'lucide-react'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { BaseOverlayProps } from '@/lib/overlay/types'
import { Button } from '@/components/ui/primitives/Button'
import { AdminReschedulePanel } from '@/components/ui/overlays/modals/RescheduleAdminPanel'
import { Badge } from '@/components/ui/primitives/Badge'

interface BookingDetails {
  id: string
  booking_reference: string
  scheduled_date: string
  scheduled_start_time?: string
  start_time?: string
  estimated_duration: number
  total_price: number
  status: 'draft' | 'pending' | 'confirmed' | 'rescheduled' | 'in_progress' | 'completed' | 'paid' | 'cancelled' | 'no_show'
  payment_status?: 'pending' | 'paid' | 'failed' | 'refunded'
  created_at: string
  // Support both API response formats
  service?: {
    name: string
    description?: string
    estimated_duration: number
  }
  services?: Array<{
    name: string
    base_price: number
    quantity: number
    total_price: number
  }>
  vehicle?: {
    make: string
    model: string
    year?: number
    color?: string
    registration?: string
    license_plate?: string
  }
  address?: {
    address_line_1: string
    address_line_2?: string
    city: string
    postal_code: string
    special_instructions?: string
  }
  // Support both API response formats
  customer?: {
    first_name: string
    last_name: string
    email: string
    phone?: string
  }
  customer_name?: string
  customer_email?: string
  customer_phone?: string
  notes?: string
}

const statusConfig = {
  draft: {
    label: 'Draft',
    icon: FileText,
    className: 'bg-gray-500/10 text-gray-600 border border-gray-500/20'
  },
  pending: {
    label: 'Pending Payment',
    icon: PendingIcon,
    className: 'bg-amber-500/10 text-amber-600 border border-amber-500/20'
  },
  confirmed: {
    label: 'Confirmed',
    icon: CheckCircle,
    className: 'bg-emerald-500/10 text-emerald-600 border border-emerald-500/20'
  },
  rescheduled: {
    label: 'Rescheduled',
    icon: RefreshCw,
    className: 'bg-blue-500/10 text-blue-600 border border-blue-500/20'
  },
  in_progress: {
    label: 'In Progress',
    icon: AlertCircle,
    className: 'bg-blue-500/10 text-blue-600 border border-blue-500/20'
  },
  completed: {
    label: 'Completed',
    icon: CheckCircle,
    className: 'bg-green-500/10 text-green-600 border border-green-500/20'
  },
  paid: {
    label: 'Paid',
    icon: DollarSign,
    className: 'bg-emerald-500/10 text-emerald-600 border border-emerald-500/20'
  },
  cancelled: {
    label: 'Cancelled',
    icon: XCircle,
    className: 'bg-red-500/10 text-red-600 border border-red-500/20'
  },
  no_show: {
    label: 'No Show',
    icon: UserX,
    className: 'bg-red-500/10 text-red-600 border border-red-500/20'
  }
} as const

export const BookingDetailsModal: React.FC<BaseOverlayProps> = ({
  isOpen,
  onClose,
  data
}) => {
  const [booking, setBooking] = useState<BookingDetails | null>(data?.booking || null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState('')
  const [actionLoading, setActionLoading] = useState<string | null>(null)
  const [showReschedule, setShowReschedule] = useState(false)
  const [showCancelPrompt, setShowCancelPrompt] = useState(false)
  const [cancelReason, setCancelReason] = useState('')


  // Helper function to normalize customer data from different formats
  const getCustomerData = (booking: BookingDetails) => {
    // Check if we have the flattened format (API response format)
    if (booking.customer_name && booking.customer_email !== undefined) {
      return {
        name: booking.customer_name,
        email: booking.customer_email || 'Email not available',
        phone: booking.customer_phone || 'Not provided'
      }
    }
    
    // Check if we have the nested customer object format
    if (booking.customer) {
      const fullName = booking.customer.first_name && booking.customer.last_name 
        ? `${booking.customer.first_name} ${booking.customer.last_name}`
        : booking.customer.first_name || booking.customer.last_name || 'Customer details unavailable'
      
      return {
        name: fullName,
        email: booking.customer.email || 'Email not available',
        phone: booking.customer.phone || 'Not provided'
      }
    }
    
    // Fallback - no customer data available
    return {
      name: 'Customer details unavailable',
      email: 'Email not available', 
      phone: 'Not provided'
    }
  }

  // Admin action helpers (status transitions)
  const updateStatus = async (newStatus: string, body: Record<string, any> = {}) => {
    if (!booking?.id) return
    setActionLoading(newStatus)
    try {
      const response = await fetch(`/api/admin/bookings/${booking.id}/status`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus, ...body })
      })
      const result = await response.json()
      if (result?.success && result?.booking) {
        setBooking(result.booking)
        setError('')
      } else {
        setError(result?.error?.message || 'Failed to update status')
      }
    } catch (e) {
      setError('Network error occurred')
    } finally {
      setActionLoading(null)
    }
  }

  // Mark-as-paid is disabled in this dialog; only available from booking card

  const submitCancellation = async () => {
    if (!cancelReason.trim()) return
    try {
      setActionLoading('cancelled')
      const response = await fetch(`/api/admin/bookings/${booking!.id}/cancel`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reason: cancelReason })
      })
      const result = await response.json()
      if (response.ok && result?.success) {
        setError('')
        setShowCancelPrompt(false)
        setCancelReason('')
        // Refresh booking view state
        await loadBookingDetails()
        return
      }
      setError(result?.error?.message || 'Failed to cancel booking')
    } catch (_) {
      setError('Network error occurred')
    } finally {
      setActionLoading(null)
    }
  }

  useEffect(() => {
    if (!isOpen || !data?.bookingId) {
      setIsLoading(false)
      return
    }
    const minimal = data?.booking as any | undefined
    const needsHydration = !minimal || !minimal.address || !minimal.address.address_line_1 || !minimal.customer_phone
    if (needsHydration) {
      loadBookingDetails()
    } else {
      setBooking(minimal as BookingDetails)
      setIsLoading(false)
    }
  }, [isOpen, data?.bookingId])

  const loadBookingDetails = async () => {
    try {
      setIsLoading(true)
      setError('')
      
      const response = await fetch(`/api/bookings/${data.bookingId}`)
      const result = await response.json()

      if (result.success) {
        setBooking(result.data)
      } else {
        setError(result.error?.message || 'Failed to load booking details')
      }
    } catch (error) {
      setError('Network error occurred')
    } finally {
      setIsLoading(false)
    }
  }

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr)
    return date.toLocaleDateString('en-GB', {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
      year: 'numeric'
    })
  }

  const formatTime = (timeStr: string | undefined) => {
    if (!timeStr) return 'Time not available'
    const [hours, minutes] = timeStr.split(':')
    const hour = parseInt(hours || '0')
    const ampm = hour >= 12 ? 'PM' : 'AM'
    const displayHour = hour % 12 || 12
    return `${displayHour}:${minutes || '00'} ${ampm}`
  }

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('en-GB', {
      style: 'currency',
      currency: 'GBP'
    }).format(price)
  }

  const formatDuration = (minutes: number) => {
    const hours = Math.floor(minutes / 60)
    const remainingMinutes = minutes % 60
    if (hours === 0) return `${remainingMinutes}min`
    if (remainingMinutes === 0) return `${hours}h`
    return `${hours}h ${remainingMinutes}min`
  }

  const formatDateTime = (dateStr: string) => {
    const date = new Date(dateStr)
    return date.toLocaleDateString('en-GB', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  if (isLoading) {
    return (
      <Dialog open={isOpen} onOpenChange={(o) => { if (!o) onClose?.() }}>
        <DialogContent className="sm:max-w-[720px]">
          <DialogHeader>
            <DialogTitle>Booking Details</DialogTitle>
          </DialogHeader>
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-brand-600"></div>
          </div>
        </DialogContent>
      </Dialog>
    )
  }

  if (error || !booking) {
    return (
      <Dialog open={isOpen} onOpenChange={(o) => { if (!o) onClose?.() }}>
        <DialogContent className="sm:max-w-[720px]">
          <DialogHeader>
            <DialogTitle>Booking Details</DialogTitle>
          </DialogHeader>
          <div className="text-center py-12">
            <XCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
            <p className="text-red-600 mb-4">{error || 'Booking not found'}</p>
            {data?.bookingId && (
              <Button onClick={loadBookingDetails} variant="outline">
                Try Again
              </Button>
            )}
          </div>
        </DialogContent>
      </Dialog>
    )
  }

  const config = statusConfig[booking.status] || statusConfig.pending
  const StatusIcon = config.icon
  const customerData = getCustomerData(booking)

  return (
    <>
    <Dialog open={isOpen} onOpenChange={(o) => { if (!o) onClose?.() }}>
      <DialogContent className="sm:max-w-[720px]">
        <DialogHeader>
          <DialogTitle>Booking Details</DialogTitle>
        </DialogHeader>
        <div className="max-h-[75vh] overflow-y-auto pr-1">
          <div className="space-y-6">
            {/* Header */}
            <div className="pb-6 border-b border-border-secondary">
              <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <h2 className="text-2xl font-semibold text-text-primary truncate">
                    {booking.services?.[0]?.name || booking.service?.name || 'Service Details'}
                  </h2>
                  <div className="mt-1 flex flex-wrap items-center gap-2 text-sm">
                    <span className="font-mono text-text-secondary">#{booking.booking_reference}</span>
                    <span className="hidden sm:inline text-text-muted">•</span>
                    <span className="text-text-muted">Booked on {formatDateTime(booking.created_at)}</span>
                  </div>
                </div>
                <div className="sm:text-right text-left">
                  <p className="text-[11px] uppercase tracking-wide text-text-secondary mb-1">Total</p>
                  <p className="text-3xl font-semibold text-text-primary leading-tight">{formatPrice(booking.total_price)}</p>
                  <div className={`mt-3 inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border ${config.className}`}>
                    <StatusIcon className="w-3.5 h-3.5" />
                    {config.label}
                  </div>
                </div>
              </div>
            </div>

            {/* Appointment Details */}
            <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-lg p-6 text-left">
          <h3 className="text-lg font-semibold text-text-primary mb-4 flex items-center gap-2">
            <Calendar className="w-5 h-5 text-brand-400" />
            Appointment Details
          </h3>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="space-y-4">
              <div>
                <p className="text-sm font-medium text-text-secondary mb-2">Date & Time</p>
                <p className="text-lg font-semibold text-text-primary">{formatDate(booking.scheduled_date)}</p>
                <p className="text-base text-text-primary">{formatTime(booking.start_time || booking.scheduled_start_time)}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-text-secondary mb-2">Duration</p>
                <p className="text-base font-medium text-text-primary">{formatDuration(booking.estimated_duration || booking.service?.estimated_duration || 120)}</p>
              </div>
            </div>
            <div className="space-y-4">
              <div>
                <p className="text-sm font-medium text-text-secondary mb-2">Service</p>
                <p className="text-base font-semibold text-text-primary">{booking.services?.[0]?.name || booking.service?.name || 'Service Details'}</p>
                {(booking.service?.description) && (
                  <p className="text-sm text-text-secondary mt-2">{booking.service?.description}</p>
                )}
              </div>
            </div>
          </div>
            </div>

            {/* Vehicle Details */}
            <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-lg p-6 text-left">
          <h3 className="text-lg font-semibold text-text-primary mb-4 flex items-center gap-2">
            <Car className="w-5 h-5 text-brand-400" />
            Vehicle Details
          </h3>
          <div className="space-y-4">
            <div>
              <p className="text-sm font-medium text-text-secondary mb-2">Vehicle</p>
              <p className="text-lg font-semibold text-text-primary">
                {booking.vehicle?.year || ''} {booking.vehicle?.make || ''} {booking.vehicle?.model || 'Vehicle Details'}
              </p>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {booking.vehicle?.color && (
                <div>
                  <p className="text-sm font-medium text-text-secondary mb-1">Color</p>
                  <p className="text-base text-text-primary">{booking.vehicle.color}</p>
                </div>
              )}
              {(booking.vehicle?.registration || booking.vehicle?.license_plate) && (
                <div>
                  <p className="text-sm font-medium text-text-secondary mb-1">Registration</p>
                  <p className="text-base font-mono text-text-primary">{booking.vehicle.registration || booking.vehicle.license_plate}</p>
                </div>
              )}
            </div>
          </div>
            </div>

            {/* Service Location */}
            <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-lg p-6 text-left">
          <h3 className="text-lg font-semibold text-text-primary mb-4 flex items-center gap-2">
            <MapPin className="w-5 h-5 text-brand-400" />
            Service Location
          </h3>
          <div className="space-y-3">
            <div>
              <p className="text-base font-semibold text-text-primary">{booking.address?.address_line_1 || 'Address not available'}</p>
              {booking.address?.address_line_2 && (
                <p className="text-base text-text-primary mt-1">{booking.address.address_line_2}</p>
              )}
              <p className="text-base text-text-secondary mt-1">
                {booking.address?.city || ''}{booking.address?.postal_code ? `, ${booking.address.postal_code}` : ''}
              </p>
            </div>
            {booking.address?.special_instructions && (
              <div className="mt-4 pt-4 border-t border-border-primary">
                <p className="text-sm font-medium text-text-secondary mb-2">Special Instructions</p>
                <p className="text-base text-text-primary leading-relaxed">{booking.address.special_instructions}</p>
              </div>
            )}
          </div>
            </div>

            {/* Payment Information */}
            {booking.payment_status && (
              <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-lg p-6">
            <h3 className="text-lg font-semibold text-text-primary mb-4 flex items-center gap-2">
              <DollarSign className="w-5 h-5 text-brand-400" />
              Payment Information
            </h3>
            <div className="space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
                <div className="flex-1 text-left">
                  <p className="text-sm font-medium text-text-secondary mb-2">Payment Status</p>
                  <div className={`inline-flex items-center gap-2 px-3 py-2 rounded-full text-sm font-medium border min-h-[44px] touch-manipulation ${
                    booking.payment_status === 'paid' ? 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20' :
                    booking.payment_status === 'failed' ? 'bg-red-500/10 text-red-600 border-red-500/20' :
                    booking.payment_status === 'refunded' ? 'bg-gray-500/10 text-gray-700 border-gray-500/20' :
                    'bg-amber-500/10 text-amber-700 border-amber-500/20'
                  }`}>
                    {booking.payment_status === 'paid' ? 'Payment Completed' :
                     booking.payment_status === 'failed' ? 'Payment Failed' :
                     booking.payment_status === 'refunded' ? 'Payment Refunded' :
                     'Awaiting Payment'}
                  </div>
                </div>
                <div className="sm:text-right text-left">
                  <p className="text-sm font-medium text-text-secondary mb-1">Total Amount</p>
                  <p className="text-2xl sm:text-3xl font-bold text-text-primary">{formatPrice(booking.total_price)}</p>
                </div>
              </div>
            </div>
              </div>
            )}

            {/* Customer Details */}
            <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-lg p-6">
          <h3 className="text-lg font-semibold text-text-primary mb-4 flex items-center gap-2">
            <User className="w-5 h-5 text-brand-400" />
            Customer Details
          </h3>
          <div className="space-y-4">
            <div>
              <p className="text-sm font-medium text-text-secondary mb-2">Customer Name</p>
              <p className="text-lg font-semibold text-text-primary">
                {customerData.name}
              </p>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              <div className="space-y-1">
                <p className="text-sm font-medium text-text-secondary">Email Address</p>
                <p className="text-base text-text-primary break-all">
                  {customerData.email}
                </p>
              </div>
              <div className="space-y-1">
                <p className="text-sm font-medium text-text-secondary">Phone Number</p>
                <p className="text-base text-text-primary break-all">
                  {customerData.phone}
                </p>
              </div>
            </div>
          </div>
            </div>

            {/* Additional Notes */}
            {booking.notes && (
              <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-lg p-6">
            <h3 className="text-lg font-semibold text-text-primary mb-4 flex items-center gap-2">
              <FileText className="w-5 h-5 text-brand-400" />
              Additional Notes
            </h3>
            <p className="text-base text-text-primary leading-relaxed">{booking.notes}</p>
              </div>
            )}
          </div>
        </div>
        <div className="sticky bottom-0 bg-surface-primary mt-4 pt-4 border-t border-border-secondary flex flex-wrap gap-3">
          {['pending', 'confirmed', 'rescheduled'].includes(booking.status) && (
            <>
              <Button
                onClick={() => setShowReschedule(true)}
                variant="primary"
                size="lg"
                className="flex-1 min-h-[48px] touch-manipulation"
              >
                Reschedule
              </Button>
              <Button
                onClick={() => setShowCancelPrompt(true)}
                variant="outline"
                size="lg"
                className="flex-1 min-h-[48px] touch-manipulation"
                loading={actionLoading === 'cancelled'}
              >
                Cancel Booking
              </Button>
            </>
          )}
          {booking.status === 'confirmed' && (
            <Button
              onClick={() => updateStatus('in_progress')}
              size="lg"
              className="flex-1 min-h-[48px] touch-manipulation bg-blue-600 hover:bg-blue-700 text-white"
              loading={actionLoading === 'in_progress'}
            >
              Start Service
            </Button>
          )}
          {booking.status === 'in_progress' && (
            <>
              <Button
                onClick={() => updateStatus('no_show', { reason: 'Marked no-show from modal' })}
                variant="outline"
                size="lg"
                className="flex-1 min-h-[48px] touch-manipulation"
                loading={actionLoading === 'no_show'}
              >
                No Show
              </Button>
              <Button
                onClick={() => updateStatus('completed')}
                size="lg"
                className="flex-1 min-h-[48px] touch-manipulation bg-blue-600 hover:bg-blue-700 text-white"
                loading={actionLoading === 'completed'}
              >
                Complete Service
              </Button>
            </>
          )}
          {['cancelled', 'completed'].includes(booking.status) && (
            <Button
              onClick={onClose}
              variant="outline"
              size="lg"
              className="flex-1 min-h-[48px] touch-manipulation"
            >
              Close
            </Button>
          )}
        </div>
      </DialogContent>
    </Dialog>

    {/* Mark as Paid intentionally disabled in this dialog. Use booking card Confirm action. */}

    {/* Cancel Prompt */}
    <Dialog open={showCancelPrompt} onOpenChange={(o) => { if (!o) setShowCancelPrompt(false) }}>
      <DialogContent className="sm:max-w-[520px]">
        <DialogHeader>
          <DialogTitle>Cancel Booking</DialogTitle>
        </DialogHeader>
        <div>
          <div className="space-y-4">
            <p className="text-text-secondary text-sm">Please provide a reason for cancelling this booking. The reason may be included in customer notifications.</p>
            <textarea
              value={cancelReason}
              onChange={(e) => setCancelReason(e.target.value)}
              placeholder="e.g. Customer requested cancellation, double booking, unavailable, etc."
              className="w-full min-h-[100px] rounded-md border border-border-secondary bg-surface-secondary p-3 text-text-primary placeholder:text-text-muted focus:outline-none focus:ring-2 focus:ring-brand-600"
            />
          </div>
        </div>
        <div className="mt-4 flex justify-end gap-2">
          <Button variant="outline" onClick={() => setShowCancelPrompt(false)} className="min-h-[44px]">Back</Button>
          <Button onClick={submitCancellation} disabled={!cancelReason.trim()} className="min-h-[44px] bg-red-600 hover:bg-red-700 text-white">Confirm Cancel</Button>
        </div>
      </DialogContent>
    </Dialog>

    {/* Admin Reschedule */}
    <Dialog open={showReschedule} onOpenChange={(o) => { if (!o) setShowReschedule(false) }}>
      <DialogContent className="sm:max-w-[720px]">
        <DialogHeader>
          <DialogTitle>Reschedule Booking (Admin)</DialogTitle>
        </DialogHeader>
        <div className="py-2">
          <p className="text-sm text-text-secondary mb-4">Choose a new slot for this booking. Customer will be notified.</p>
          <AdminReschedulePanel
            bookingId={booking.id}
            currentDate={booking.scheduled_date}
            currentTime={(booking.start_time || booking.scheduled_start_time) as string}
            onDone={async () => {
              setShowReschedule(false)
              await loadBookingDetails()
            }}
          />
        </div>
      </DialogContent>
    </Dialog>
    </>
  )
}