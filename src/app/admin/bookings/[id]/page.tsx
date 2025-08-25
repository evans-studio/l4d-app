'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { Button } from '@/components/ui/primitives/Button'
import { MarkAsPaidModal } from '@/components/admin/MarkAsPaidModal'
import { Breadcrumb, BreadcrumbItem, BreadcrumbLink, BreadcrumbList, BreadcrumbPage, BreadcrumbSeparator } from '@/components/ui/breadcrumb'
import { Badge } from '@/components/ui/badge'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'
import { isNewUIEnabled } from '@/lib/config/feature-flags'
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/primitives/Alert'
import { ConfirmDialog } from '@/components/ui/overlays/modals/ConfirmDialog'
import { AdminLayout } from '@/components/layouts/AdminLayout'
import { AdminRoute } from '@/components/ProtectedRoute'
// BookingStatus imported but not used - removed
import { 
  CalendarIcon, 
  ClockIcon,
  CheckIcon,
  XIcon,
  PhoneIcon,
  MailIcon,
  MapPinIcon,
  CarIcon,
  CreditCardIcon,
  MessageSquareIcon,
  ArrowLeftIcon,
  EditIcon,
  AlertCircleIcon,
  CheckCircleIcon,
  CalendarCheckIcon,
  CalendarXIcon
} from 'lucide-react'

interface BookingDetails {
  id: string
  booking_reference: string
  customer_id: string
  customer_name: string
  customer_email: string
  customer_phone: string
  scheduled_date: string
  start_time: string
  end_time?: string
  status: 'pending' | 'confirmed' | 'in_progress' | 'completed' | 'cancelled'
  payment_status?: 'pending' | 'awaiting_payment' | 'paid' | 'payment_failed' | 'refunded'
  total_price: number
  special_instructions?: string
  admin_notes?: string
  services: Array<{
    name: string
    base_price: number
    quantity: number
    total_price: number
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
  updated_at: string
  // Reschedule request fields
  has_pending_reschedule?: boolean
  reschedule_request?: {
    id: string
    requested_date: string
    requested_time: string
    reason: string
    created_at: string
  }
}

const statusConfig = {
  pending: {
    label: 'Pending',
    icon: ClockIcon,
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
  },
  rescheduled: {
    label: 'Rescheduled',
    icon: CalendarIcon,
    color: 'text-[var(--info)]',
    bgColor: 'bg-[var(--info-bg)]',
    borderColor: 'border-[var(--info)]'
  }
}

function AdminBookingDetailsPage() {
  const params = useParams() as Record<string, string> | null
  const bookingId = params?.id as string | undefined
  const router = useRouter()
  const [booking, setBooking] = useState<BookingDetails | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isUpdating, setIsUpdating] = useState(false)
  const [adminNotes, setAdminNotes] = useState('')
  const [markPaidOpen, setMarkPaidOpen] = useState(false)
  const [approveOpen, setApproveOpen] = useState(false)
  const [declineOpen, setDeclineOpen] = useState(false)

  useEffect(() => {
    const fetchBooking = async () => {
      try {
        // Use the regular booking API route with admin authentication
        const response = await fetch(`/api/bookings/${bookingId}`)
        if (!response.ok) {
          throw new Error(`HTTP ${response.status}: ${response.statusText}`)
        }
        
        const data = await response.json()
        
        if (data.success) {
          setBooking(data.data)
          setAdminNotes(data.data.admin_notes || '')
        } else {
          console.error('Failed to fetch booking:', data.error)
          console.error('Booking ID:', bookingId)
          console.error('Response status:', response.status)
        }
      } catch (error) {
        console.error('Failed to fetch booking:', error)
        console.error('Booking ID:', bookingId)
        
        // Check if it's a 404 error (booking not found)
        if (error instanceof Error && error.message.includes('404')) {
          // The booking doesn't exist - redirect back to bookings list
          console.warn('Booking not found, redirecting to bookings list')
          router.push('/admin/bookings?error=booking-not-found')
          return
        }
      } finally {
        setIsLoading(false)
      }
    }

    if (bookingId) {
      fetchBooking()
    }
  }, [bookingId])

  const updateBookingStatus = async (newStatus: string) => {
    if (!booking) return
    
    setIsUpdating(true)
    try {
      const response = await fetch(`/api/admin/bookings/${booking.id}/status`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus })
      })

      const data = await response.json()
      if (data.success) {
        setBooking(prev => prev ? { ...prev, status: newStatus as "pending" | "confirmed" | "in_progress" | "completed" | "cancelled" } : null)
      }
    } catch (error) {
      console.error('Failed to update booking status:', error)
    } finally {
      setIsUpdating(false)
    }
  }

  const updateAdminNotes = async () => {
    if (!booking) return
    
    try {
      const response = await fetch(`/api/bookings/${booking.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ admin_notes: adminNotes })
      })

      const data = await response.json()
      if (data.success) {
        setBooking(prev => prev ? { ...prev, admin_notes: adminNotes } : null)
      }
    } catch (error) {
      console.error('Failed to update admin notes:', error)
    }
  }

  const handleMarkPaidSuccess = async () => {
    // After marking paid, re-fetch booking to reflect new payment_status and status
    try {
      const response = await fetch(`/api/bookings/${booking!.id}`)
      const data = await response.json()
      if (data.success) {
        setBooking(data.data)
      }
    } catch (_) {}
    setMarkPaidOpen(false)
  }

  const handleApproveReschedule = async (rescheduleRequest: NonNullable<BookingDetails['reschedule_request']>) => {
    if (!booking) return
    setIsUpdating(true)
    try {
      const response = await fetch(`/api/admin/reschedule-requests/${rescheduleRequest.id}/respond`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'approve', adminResponse: '', adminNotes: '' })
      })
      const data = await response.json()
      if (data.success) {
        // Refresh booking data to show updated status/time
        window.location.reload()
      } else {
        console.error('Failed to approve reschedule:', data.error)
        alert('Failed to approve reschedule request: ' + (data.error?.message || 'Unknown error'))
      }
    } catch (error) {
      console.error('Failed to approve reschedule:', error)
      alert('Failed to approve reschedule request')
    } finally {
      setIsUpdating(false)
    }
  }

  const handleDeclineReschedule = async (rescheduleRequest: NonNullable<BookingDetails['reschedule_request']>) => {
    if (!booking) return
    const declineReason = window.prompt('Optional: Provide a reason for declining this reschedule request:')
    setIsUpdating(true)
    try {
      const response = await fetch(`/api/admin/reschedule-requests/${rescheduleRequest.id}/respond`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'reject', adminResponse: declineReason || '', adminNotes: '' })
      })
      const data = await response.json()
      if (data.success) {
        window.location.reload()
      } else {
        console.error('Failed to decline reschedule:', data.error)
        alert('Failed to decline reschedule request: ' + (data.error?.message || 'Unknown error'))
      }
    } catch (error) {
      console.error('Failed to decline reschedule:', error)
      alert('Failed to decline reschedule request')
    } finally {
      setIsUpdating(false)
    }
  }

  const formatTime = (time: string) => {
    if (!time) return ''
    const [hours, minutes] = time.split(':')
    const hour = parseInt(hours || '0')
    const ampm = hour >= 12 ? 'PM' : 'AM'
    const displayHour = hour % 12 || 12
    return `${displayHour}:${minutes || '00'} ${ampm}`
  }

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr)
    return date.toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
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

  if (!booking) {
    return (
      <AdminLayout>
        <div className="text-center py-12">
          <div className="bg-[var(--surface-secondary)] rounded-lg p-8 max-w-md mx-auto">
            <AlertCircleIcon className="w-12 h-12 text-[var(--error)] mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-[var(--text-primary)] mb-2">
              Booking Not Found
            </h3>
            <p className="text-[var(--text-secondary)] text-sm mb-4">
              The booking you&apos;re looking for doesn&apos;t exist or has been removed.
            </p>
            <Button onClick={() => router.push('/admin/bookings')} variant="outline">
              Back to Bookings
            </Button>
          </div>
        </div>
      </AdminLayout>
    )
  }

  const status = statusConfig[booking.status] || statusConfig.pending
  const StatusIcon = status.icon

  const renderPaymentBadge = () => {
    const ps = booking.payment_status || 'pending'
    const map: Record<string, { label: string; className: string }> = {
      pending: { label: 'Payment Pending', className: 'bg-[var(--warning-bg)] border border-[var(--warning)] text-[var(--warning)]' },
      awaiting_payment: { label: 'Awaiting Payment', className: 'bg-[var(--warning-bg)] border border-[var(--warning)] text-[var(--warning)]' },
      paid: { label: 'Paid', className: 'bg-[var(--success-bg)] border border-[var(--success)] text-[var(--success)]' },
      payment_failed: { label: 'Payment Failed', className: 'bg-[var(--error-bg)] border border-[var(--error)] text-[var(--error)]' },
      refunded: { label: 'Refunded', className: 'bg-[var(--info-bg)] border border-[var(--info)] text-[var(--info)]' },
    }
    const cfg = (map[ps] as { label: string; className: string }) || map['pending']
    return <Badge variant="outline" className={cfg!.className}>{cfg!.label}</Badge>
  }

  return (
    <AdminLayout>
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        {isNewUIEnabled() ? (
          <div className="mb-6 space-y-3">
            <Breadcrumb>
              <BreadcrumbList>
                <BreadcrumbItem>
                  <BreadcrumbLink href="/admin/bookings">Bookings</BreadcrumbLink>
                </BreadcrumbItem>
                <BreadcrumbSeparator />
                <BreadcrumbItem>
                  <BreadcrumbPage>#{booking.booking_reference}</BreadcrumbPage>
                </BreadcrumbItem>
              </BreadcrumbList>
            </Breadcrumb>
            <div className="flex items-center justify-between">
              <h1 className="text-2xl sm:text-3xl font-bold text-[var(--text-primary)]">
                Booking 
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <button
                        type="button"
                        onClick={() => navigator.clipboard.writeText(booking.booking_reference)}
                        className="underline-offset-4 hover:underline ml-1 text-[var(--text-link)] hover:text-[var(--text-link-hover)]"
                        aria-label="Copy booking reference"
                      >
                        #{booking.booking_reference}
                      </button>
                    </TooltipTrigger>
                    <TooltipContent>Click to copy</TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              </h1>
              <div className="flex items-center gap-2">
                <div className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full border ${status.bgColor} ${status.borderColor}`}>
                  <StatusIcon className={`w-4 h-4 ${status.color}`} />
                  <span className={`text-sm font-medium ${status.color}`}>{status.label}</span>
                </div>
              </div>
            </div>
            <p className="text-[var(--text-secondary)]">Created {formatDate(booking.created_at)}</p>
          </div>
        ) : (
          <div className="flex items-center justify-between mb-8">
            <div className="flex items-center gap-4">
              <Button
                onClick={() => router.push('/admin/bookings')}
                variant="outline"
                size="sm"
              >
                Back
              </Button>
              <div>
                <h1 className="text-3xl font-bold text-[var(--text-primary)]">
                  Booking #{booking.booking_reference}
                </h1>
                <p className="text-[var(--text-secondary)]">
                  Created {formatDate(booking.created_at)}
                </p>
              </div>
            </div>
            
            <div className={`inline-flex items-center gap-2 px-4 py-2 rounded-full border ${status.bgColor} ${status.borderColor}`}>
              <StatusIcon className={`w-5 h-5 ${status.color}`} />
              <span className={`font-medium ${status.color}`}>{status.label}</span>
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Customer Information */}
            <div className="bg-[var(--surface-secondary)] rounded-lg p-6 border border-[var(--border-secondary)]">
              <h2 className="text-xl font-semibold text-[var(--text-primary)] mb-4 flex items-center gap-2">
                <PhoneIcon className="w-5 h-5" />
                Customer Information
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <p className="text-[var(--text-secondary)] text-sm mb-1">Name</p>
                  <p className="text-[var(--text-primary)] font-medium">{booking.customer_name}</p>
                </div>
                <div>
                  <p className="text-[var(--text-secondary)] text-sm mb-1">Email</p>
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <a 
                          href={`mailto:${booking.customer_email}`}
                          className="text-[var(--text-link)] hover:text-[var(--text-link-hover)] flex items-center gap-2"
                        >
                          <MailIcon className="w-4 h-4" />
                          {booking.customer_email}
                        </a>
                      </TooltipTrigger>
                      <TooltipContent>Click to email</TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                </div>
                {booking.customer_phone && (
                  <div>
                    <p className="text-[var(--text-secondary)] text-sm mb-1">Phone</p>
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <a 
                            href={`tel:${booking.customer_phone}`}
                            className="text-[var(--text-link)] hover:text-[var(--text-link-hover)] flex items-center gap-2"
                          >
                            <PhoneIcon className="w-4 h-4" />
                            {booking.customer_phone}
                          </a>
                        </TooltipTrigger>
                        <TooltipContent>Tap to call</TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  </div>
                )}
              </div>
            </div>

            {/* Schedule Information */}
            <div className="bg-[var(--surface-secondary)] rounded-lg p-6 border border-[var(--border-secondary)]">
              <h2 className="text-xl font-semibold text-[var(--text-primary)] mb-4 flex items-center gap-2">
                <CalendarIcon className="w-5 h-5" />
                Schedule
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <p className="text-[var(--text-secondary)] text-sm mb-1">Date</p>
                  <p className="text-[var(--text-primary)] font-medium">{formatDate(booking.scheduled_date)}</p>
                </div>
                <div>
                  <p className="text-[var(--text-secondary)] text-sm mb-1">Start Time</p>
                  <p className="text-[var(--text-primary)] font-medium">
                    {formatTime(booking.start_time)}
                  </p>
                </div>
              </div>
            </div>

            {/* Vehicle Information */}
            <div className="bg-[var(--surface-secondary)] rounded-lg p-6 border border-[var(--border-secondary)]">
              <h2 className="text-xl font-semibold text-[var(--text-primary)] mb-4 flex items-center gap-2">
                <CarIcon className="w-5 h-5" />
                Vehicle Details
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {booking.vehicle ? (
                  <>
                    <div>
                      <p className="text-[var(--text-secondary)] text-sm mb-1">Make & Model</p>
                      <p className="text-[var(--text-primary)] font-medium">
                        {booking.vehicle.make} {booking.vehicle.model}
                      </p>
                    </div>
                    {booking.vehicle.year && (
                      <div>
                        <p className="text-[var(--text-secondary)] text-sm mb-1">Year</p>
                        <p className="text-[var(--text-primary)] font-medium">{booking.vehicle.year}</p>
                      </div>
                    )}
                    {booking.vehicle.color && (
                      <div>
                        <p className="text-[var(--text-secondary)] text-sm mb-1">Color</p>
                        <p className="text-[var(--text-primary)] font-medium">{booking.vehicle.color}</p>
                      </div>
                    )}
                    {booking.vehicle.license_plate && (
                      <div>
                        <p className="text-[var(--text-secondary)] text-sm mb-1">License Plate</p>
                        <TooltipProvider>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <button
                                type="button"
                                onClick={() => navigator.clipboard.writeText(booking.vehicle.license_plate || '')}
                                className="text-[var(--text-link)] hover:text-[var(--text-link-hover)] font-medium underline-offset-4 hover:underline"
                                aria-label="Copy license plate"
                              >
                                {booking.vehicle.license_plate}
                              </button>
                            </TooltipTrigger>
                            <TooltipContent>Click to copy</TooltipContent>
                          </Tooltip>
                        </TooltipProvider>
                      </div>
                    )}
                  </>
                ) : (
                  <p className="text-[var(--text-secondary)] italic">Vehicle information not available</p>
                )}
              </div>
            </div>

            {/* Service Location */}
            <div className="bg-[var(--surface-secondary)] rounded-lg p-6 border border-[var(--border-secondary)]">
              <h2 className="text-xl font-semibold text-[var(--text-primary)] mb-4 flex items-center gap-2">
                <MapPinIcon className="w-5 h-5" />
                Service Location
              </h2>
              <div className="space-y-2">
                {booking.address ? (
                  <>
                    <p className="text-[var(--text-primary)]">{booking.address.address_line_1}</p>
                    {booking.address.address_line_2 && (
                      <p className="text-[var(--text-primary)]">{booking.address.address_line_2}</p>
                    )}
                    <p className="text-[var(--text-primary)]">
                      {booking.address.city}, {booking.address.postal_code}
                    </p>
                  </>
                ) : (
                  <p className="text-[var(--text-secondary)] italic">Address information not available</p>
                )}
              </div>
            </div>

            {/* Services */}
            <div className="bg-[var(--surface-secondary)] rounded-lg p-6 border border-[var(--border-secondary)]">
              <h2 className="text-xl font-semibold text-[var(--text-primary)] mb-4 flex items-center gap-2">
                <CreditCardIcon className="w-5 h-5" />
                Services & Pricing
              </h2>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="text-left text-[var(--text-secondary)] border-b border-[var(--border-secondary)]">
                      <th className="py-2 pr-4 font-medium">Service</th>
                      <th className="py-2 pr-4 font-medium">Qty</th>
                      <th className="py-2 pr-4 font-medium">Price</th>
                      <th className="py-2 font-medium text-right">Total</th>
                    </tr>
                  </thead>
                  <tbody>
                    {booking.services.map((service, index) => (
                      <tr key={index} className="border-b border-[var(--border-secondary)] last:border-b-0">
                        <td className="py-2 pr-4 text-[var(--text-primary)]">{service.name}</td>
                        <td className="py-2 pr-4 text-[var(--text-primary)]">{service.quantity}</td>
                        <td className="py-2 pr-4 text-[var(--text-primary)]">£{service.base_price}</td>
                        <td className="py-2 text-right text-[var(--text-primary)] font-medium">£{service.total_price}</td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot>
                    <tr>
                      <td className="pt-3 pr-4" colSpan={3}>
                        <span className="text-[var(--text-primary)] font-semibold">Total</span>
                      </td>
                      <td className="pt-3 text-right text-[var(--primary)] font-bold">£{booking.total_price}</td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            </div>

            {/* Special Instructions */}
            {booking.special_instructions && (
              <Alert className="bg-[var(--surface-secondary)] border border-[var(--border-secondary)]">
                <AlertTitle className="flex items-center gap-2 text-[var(--text-primary)]">
                  <MessageSquareIcon className="w-4 h-4" /> Customer Instructions
                </AlertTitle>
                <AlertDescription className="text-[var(--text-primary)]">
                  {booking.special_instructions}
                </AlertDescription>
              </Alert>
            )}

            {/* Reschedule Request */}
            {booking.has_pending_reschedule && booking.reschedule_request && (
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6">
                <h2 className="text-xl font-semibold text-orange-900 mb-4 flex items-center gap-2">
                  <CalendarIcon className="w-5 h-5" />
                  Pending Reschedule Request
                </h2>
                
                <div className="space-y-4">
                  {/* Request Details */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <p className="text-orange-700 text-sm mb-1">Requested Date</p>
                      <p className="text-orange-900 font-medium">
                        {formatDate(booking.reschedule_request.requested_date)}
                      </p>
                    </div>
                    <div>
                      <p className="text-orange-700 text-sm mb-1">Requested Time</p>
                      <p className="text-orange-900 font-medium flex items-center gap-2">
                        <ClockIcon className="w-4 h-4" />
                        {formatTime(booking.reschedule_request.requested_time)}
                      </p>
                    </div>
                  </div>

                  {/* Customer Reason */}
                  <div>
                    <p className="text-orange-700 text-sm mb-1">Customer's Reason</p>
                    <p className="text-orange-900 italic bg-yellow-100 p-3 rounded border border-yellow-200">
                      "{booking.reschedule_request.reason}"
                    </p>
                  </div>

                  {/* Request Date */}
                  <div>
                    <p className="text-orange-700 text-sm">
                      Requested on {new Date(booking.reschedule_request.created_at).toLocaleDateString('en-US', {
                        weekday: 'long',
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric'
                      })}
                    </p>
                  </div>

                  {/* Action Buttons */}
                  <div className="flex gap-3 pt-4 border-t border-yellow-300">
                    <Button
                      onClick={() => setApproveOpen(true)}
                      disabled={isUpdating}
                      className="bg-green-600 hover:bg-green-700 text-white"
                    >
                      Approve Request
                    </Button>
                    <Button
                      onClick={() => setDeclineOpen(true)}
                      disabled={isUpdating}
                      variant="outline"
                      className="text-red-600 border-red-200 hover:bg-red-50"
                    >
                      Decline Request
                    </Button>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Status Actions */}
            <div className="bg-[var(--surface-secondary)] rounded-lg p-6 border border-[var(--border-secondary)]">
              <h3 className="text-lg font-semibold text-[var(--text-primary)] mb-4">Actions</h3>
              {/* Payment status (moved from header to avoid duplicate badges) */}
              <div className="mb-3 text-sm flex items-center justify-between">
                <span className="text-[var(--text-secondary)]">Payment Status</span>
                {renderPaymentBadge()}
              </div>
              <div className="space-y-3">
                {booking.payment_status !== 'paid' && (
                  <Button
                    onClick={() => setMarkPaidOpen(true)}
                    className="w-full"
                  >
                    Mark as Paid
                  </Button>
                )}
                {booking.status === 'pending' && (
                  <>
                    <Button
                      onClick={() => updateBookingStatus('confirmed')}
                      disabled={isUpdating}
                      className="w-full"
                    >
                      Confirm Booking
                    </Button>
                    <Button
                      onClick={async () => {
                        if (!booking) return
                        setIsUpdating(true)
                        try {
                          const res = await fetch(`/api/admin/bookings/${booking.id}/cancel`, {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({ reason: 'Cancelled by admin via booking page' })
                          })
                          const json = await res.json()
                          if (json?.success) {
                            setBooking(prev => prev ? { ...prev, status: 'cancelled' } : prev)
                          }
                        } catch (_) {}
                        setIsUpdating(false)
                      }}
                      disabled={isUpdating}
                      variant="outline"
                      className="w-full"
                    >
                      Cancel Booking
                    </Button>
                  </>
                )}
                
                {booking.status === 'confirmed' && (
                  <Button
                    onClick={() => updateBookingStatus('in_progress')}
                    disabled={isUpdating}
                    className="w-full"
                  >
                    Start Service
                  </Button>
                )}
                
                {booking.status === 'in_progress' && (
                  <Button
                    onClick={() => updateBookingStatus('completed')}
                    disabled={isUpdating}
                    className="w-full"
                  >
                    Complete Service
                  </Button>
                )}
              </div>
            </div>

            {/* Admin Notes */}
            <div className="bg-[var(--surface-secondary)] rounded-lg p-6 border border-[var(--border-secondary)]">
              <h3 className="text-lg font-semibold text-[var(--text-primary)] mb-4 flex items-center gap-2">
                <EditIcon className="w-5 h-5" />
                Admin Notes
              </h3>
              <textarea
                value={adminNotes}
                onChange={(e) => setAdminNotes(e.target.value)}
                placeholder="Add internal notes about this booking..."
                rows={4}
                className="w-full p-3 bg-[var(--input-bg)] border border-[var(--input-border)] rounded-md text-[var(--input-text)] placeholder-[var(--input-placeholder)] focus:border-[var(--input-border-focus)] focus:outline-none transition-colors resize-none"
              />
              <Button
                onClick={updateAdminNotes}
                size="sm"
                className="mt-3 w-full"
                disabled={adminNotes === (booking.admin_notes || '')}
              >
                Save Notes
              </Button>
            </div>

          </div>
          {markPaidOpen && booking && (
            <MarkAsPaidModal
              booking={{
                id: booking.id,
                booking_reference: booking.booking_reference,
                customer_name: booking.customer_name,
                total_price: booking.total_price,
                payment_status: booking.payment_status,
              }}
              open={markPaidOpen}
              onClose={() => setMarkPaidOpen(false)}
              onSuccess={handleMarkPaidSuccess}
            />
          )}

          {booking?.has_pending_reschedule && booking.reschedule_request && (
            <>
              <ConfirmDialog
                open={approveOpen}
                onOpenChange={setApproveOpen}
                title="Approve reschedule?"
                description={`Move to ${formatDate(booking.reschedule_request.requested_date)} at ${formatTime(booking.reschedule_request.requested_time)}.`}
                confirmLabel="Approve"
                onConfirm={() => handleApproveReschedule(booking.reschedule_request!)}
                isLoading={isUpdating}
              />
              <ConfirmDialog
                open={declineOpen}
                onOpenChange={setDeclineOpen}
                title="Decline reschedule?"
                description="You can provide an optional reason after confirming."
                confirmLabel="Decline"
                onConfirm={() => handleDeclineReschedule(booking.reschedule_request!)}
                isLoading={isUpdating}
              />
            </>
          )}
        </div>
      </div>
    </AdminLayout>
  )
}

export default function AdminBookingDetailsPageWithProtection() {
  return (
    <AdminRoute>
      <AdminBookingDetailsPage />
    </AdminRoute>
  )
}