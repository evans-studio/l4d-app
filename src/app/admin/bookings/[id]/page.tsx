'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { Button } from '@/components/ui/primitives/Button'
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
  CheckCircleIcon
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
  }
}

function AdminBookingDetailsPage() {
  const params = useParams()
  const router = useRouter()
  const [booking, setBooking] = useState<BookingDetails | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isUpdating, setIsUpdating] = useState(false)
  const [adminNotes, setAdminNotes] = useState('')

  useEffect(() => {
    const fetchBooking = async () => {
      try {
        const response = await fetch(`/api/bookings/${params.id}`)
        const data = await response.json()
        
        if (data.success) {
          setBooking(data.data)
          setAdminNotes(data.data.admin_notes || '')
        } else {
          console.error('Failed to fetch booking:', data.error)
        }
      } catch (error) {
        console.error('Failed to fetch booking:', error)
      } finally {
        setIsLoading(false)
      }
    }

    if (params.id) {
      fetchBooking()
    }
  }, [params.id])

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

  const status = statusConfig[booking.status]
  const StatusIcon = status.icon

  return (
    <AdminLayout>
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-4">
            <Button
              onClick={() => router.push('/admin/bookings')}
              variant="outline"
              size="sm"
              className="flex items-center gap-2"
            >
              <ArrowLeftIcon className="w-4 h-4" />
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
                  <a 
                    href={`mailto:${booking.customer_email}`}
                    className="text-[var(--text-link)] hover:text-[var(--text-link-hover)] flex items-center gap-2"
                  >
                    <MailIcon className="w-4 h-4" />
                    {booking.customer_email}
                  </a>
                </div>
                {booking.customer_phone && (
                  <div>
                    <p className="text-[var(--text-secondary)] text-sm mb-1">Phone</p>
                    <a 
                      href={`tel:${booking.customer_phone}`}
                      className="text-[var(--text-link)] hover:text-[var(--text-link-hover)] flex items-center gap-2"
                    >
                      <PhoneIcon className="w-4 h-4" />
                      {booking.customer_phone}
                    </a>
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
                  <p className="text-[var(--text-primary)] font-medium flex items-center gap-2">
                    <ClockIcon className="w-4 h-4" />
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
                    <p className="text-[var(--text-primary)] font-medium">{booking.vehicle.license_plate}</p>
                  </div>
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
                <p className="text-[var(--text-primary)]">{booking.address.address_line_1}</p>
                {booking.address.address_line_2 && (
                  <p className="text-[var(--text-primary)]">{booking.address.address_line_2}</p>
                )}
                <p className="text-[var(--text-primary)]">
                  {booking.address.city}, {booking.address.postal_code}
                </p>
              </div>
            </div>

            {/* Services */}
            <div className="bg-[var(--surface-secondary)] rounded-lg p-6 border border-[var(--border-secondary)]">
              <h2 className="text-xl font-semibold text-[var(--text-primary)] mb-4 flex items-center gap-2">
                <CreditCardIcon className="w-5 h-5" />
                Services & Pricing
              </h2>
              <div className="space-y-3">
                {booking.services.map((service, index) => (
                  <div key={index} className="flex justify-between items-center py-2 border-b border-[var(--border-secondary)] last:border-b-0">
                    <div>
                      <p className="text-[var(--text-primary)] font-medium">{service.name}</p>
                      {service.quantity > 1 && (
                        <p className="text-[var(--text-secondary)] text-sm">Quantity: {service.quantity}</p>
                      )}
                    </div>
                    <div className="text-right">
                      <p className="text-[var(--text-primary)] font-medium">£{service.total_price}</p>
                      {service.quantity > 1 && (
                        <p className="text-[var(--text-secondary)] text-sm">£{service.base_price} each</p>
                      )}
                    </div>
                  </div>
                ))}
                <div className="flex justify-between items-center pt-3 border-t border-[var(--border-primary)]">
                  <p className="text-lg font-semibold text-[var(--text-primary)]">Total</p>
                  <p className="text-2xl font-bold text-[var(--primary)]">£{booking.total_price}</p>
                </div>
              </div>
            </div>

            {/* Special Instructions */}
            {booking.special_instructions && (
              <div className="bg-[var(--surface-secondary)] rounded-lg p-6 border border-[var(--border-secondary)]">
                <h2 className="text-xl font-semibold text-[var(--text-primary)] mb-4 flex items-center gap-2">
                  <MessageSquareIcon className="w-5 h-5" />
                  Customer Instructions
                </h2>
                <p className="text-[var(--text-primary)]">{booking.special_instructions}</p>
              </div>
            )}
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Status Actions */}
            <div className="bg-[var(--surface-secondary)] rounded-lg p-6 border border-[var(--border-secondary)]">
              <h3 className="text-lg font-semibold text-[var(--text-primary)] mb-4">Actions</h3>
              <div className="space-y-3">
                {booking.status === 'pending' && (
                  <>
                    <Button
                      onClick={() => updateBookingStatus('confirmed')}
                      disabled={isUpdating}
                      className="w-full flex items-center gap-2"
                    >
                      <CheckIcon className="w-4 h-4" />
                      Confirm Booking
                    </Button>
                    <Button
                      onClick={() => updateBookingStatus('cancelled')}
                      disabled={isUpdating}
                      variant="outline"
                      className="w-full flex items-center gap-2"
                    >
                      <XIcon className="w-4 h-4" />
                      Cancel Booking
                    </Button>
                  </>
                )}
                
                {booking.status === 'confirmed' && (
                  <Button
                    onClick={() => updateBookingStatus('in_progress')}
                    disabled={isUpdating}
                    className="w-full flex items-center gap-2"
                  >
                    <ClockIcon className="w-4 h-4" />
                    Start Service
                  </Button>
                )}
                
                {booking.status === 'in_progress' && (
                  <Button
                    onClick={() => updateBookingStatus('completed')}
                    disabled={isUpdating}
                    className="w-full flex items-center gap-2"
                  >
                    <CheckCircleIcon className="w-4 h-4" />
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

            {/* Booking Timeline */}
            <div className="bg-[var(--surface-secondary)] rounded-lg p-6 border border-[var(--border-secondary)]">
              <h3 className="text-lg font-semibold text-[var(--text-primary)] mb-4">Timeline</h3>
              <div className="space-y-3 text-sm">
                <div className="flex justify-between">
                  <span className="text-[var(--text-secondary)]">Created</span>
                  <span className="text-[var(--text-primary)]">
                    {new Date(booking.created_at).toLocaleDateString()}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[var(--text-secondary)]">Last Updated</span>
                  <span className="text-[var(--text-primary)]">
                    {new Date(booking.updated_at).toLocaleDateString()}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[var(--text-secondary)]">Scheduled</span>
                  <span className="text-[var(--text-primary)]">
                    {formatDate(booking.scheduled_date)}
                  </span>
                </div>
              </div>
            </div>
          </div>
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