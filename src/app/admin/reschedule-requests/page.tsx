'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { 
  CalendarIcon, 
  ClockIcon,
  CheckCircleIcon,
  XCircleIcon,
  UserIcon,
  PhoneIcon,
  MailIcon,
  CarIcon,
  CalendarCheckIcon,
  CalendarXIcon,
  AlertTriangleIcon,
  RefreshCwIcon
} from 'lucide-react'

import { Button } from '@/components/ui/primitives/Button'
import { Card, CardContent, CardGrid } from '@/components/ui/composites/Card'
import { Badge } from '@/components/ui/badge'
import { AdminLayout } from '@/components/layouts/AdminLayout'
import { AdminRoute } from '@/components/ProtectedRoute'
import { Breadcrumb, BreadcrumbItem, BreadcrumbLink, BreadcrumbList, BreadcrumbPage, BreadcrumbSeparator } from '@/components/ui/breadcrumb'

interface RescheduleRequest {
  id: string
  booking_id: string
  booking_reference: string
  customer_name: string
  customer_email: string
  customer_phone: string
  booking_status: string
  total_price: number
  original_date: string
  original_time: string
  requested_date: string
  requested_time: string
  reason: string
  customer_notes?: string
  status: 'pending' | 'approved' | 'rejected'
  admin_response?: string
  admin_notes?: string
  created_at: string
  updated_at: string
  responded_at?: string
}

interface RescheduleRequestsData {
  reschedule_requests: RescheduleRequest[]
  total_count: number
  pending_count: number
}

function AdminRescheduleRequestsPage() {
  const router = useRouter()
  const [requests, setRequests] = useState<RescheduleRequest[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [filter, setFilter] = useState<'all' | 'pending' | 'approved' | 'rejected'>('all')
  const [actionLoading, setActionLoading] = useState<string | null>(null)

  const fetchRescheduleRequests = async () => {
    try {
      setIsLoading(true)
      const response = await fetch('/api/admin/reschedule-requests')
      const data = await response.json()
      
      if (data.success) {
        setRequests(data.data.reschedule_requests)
        setError(null)
      } else {
        setError(data.error?.message || 'Failed to fetch reschedule requests')
      }
    } catch (error) {
      console.error('Error fetching reschedule requests:', error)
      setError('Failed to load reschedule requests')
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    fetchRescheduleRequests()
  }, [])

  const handleApproveRequest = async (request: RescheduleRequest) => {
    setActionLoading(request.id)
    try {
      const response = await fetch(`/api/admin/bookings/${request.booking_id}/reschedule`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          newDate: request.requested_date,
          newTime: request.requested_time,
          reason: request.reason
        })
      })

      const data = await response.json()
      if (data.success) {
        await fetchRescheduleRequests() // Refresh the list
      } else {
        console.error('Failed to approve reschedule:', data.error)
        alert('Failed to approve reschedule request: ' + (data.error?.message || 'Unknown error'))
      }
    } catch (error) {
      console.error('Failed to approve reschedule:', error)
      alert('Failed to approve reschedule request')
    } finally {
      setActionLoading(null)
    }
  }

  const handleDeclineRequest = async (request: RescheduleRequest) => {
    const declineReason = window.prompt('Optional: Provide a reason for declining this reschedule request:')
    
    setActionLoading(request.id)
    try {
      const response = await fetch(`/api/admin/bookings/${request.booking_id}/reschedule/decline`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          reschedule_request_id: request.id,
          decline_reason: declineReason || undefined
        })
      })

      const data = await response.json()
      if (data.success) {
        await fetchRescheduleRequests() // Refresh the list
      } else {
        console.error('Failed to decline reschedule:', data.error)
        alert('Failed to decline reschedule request: ' + (data.error?.message || 'Unknown error'))
      }
    } catch (error) {
      console.error('Failed to decline reschedule:', error)
      alert('Failed to decline reschedule request')
    } finally {
      setActionLoading(null)
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
    const today = new Date()
    const tomorrow = new Date(today)
    tomorrow.setDate(today.getDate() + 1)
    
    if (date.toDateString() === today.toDateString()) {
      return 'Today'
    } else if (date.toDateString() === tomorrow.toDateString()) {
      return 'Tomorrow'
    } else {
      return date.toLocaleDateString('en-GB', {
        weekday: 'long',
        day: 'numeric',
        month: 'short',
        year: 'numeric'
      })
    }
  }

  const filteredRequests = requests.filter(request => {
    if (filter === 'all') return true
    return request.status === filter
  })

  const pendingCount = requests.filter(r => r.status === 'pending').length
  const approvedCount = requests.filter(r => r.status === 'approved').length
  const rejectedCount = requests.filter(r => r.status === 'rejected').length

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
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="mb-2">
          <Breadcrumb>
            <BreadcrumbList>
              <BreadcrumbItem>
                <BreadcrumbLink href="/admin">Admin</BreadcrumbLink>
              </BreadcrumbItem>
              <BreadcrumbSeparator />
              <BreadcrumbItem>
                <BreadcrumbPage>Reschedule Requests</BreadcrumbPage>
              </BreadcrumbItem>
            </BreadcrumbList>
          </Breadcrumb>
        </div>
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-[var(--text-primary)]">
              Reschedule Requests
            </h1>
            <p className="text-[var(--text-secondary)]">
              Manage customer reschedule requests
            </p>
          </div>
          
          <div className="flex items-center gap-2">
            <Button
              onClick={fetchRescheduleRequests}
              variant="outline"
              size="sm"
              className="flex items-center gap-2"
              disabled={isLoading}
            >
              <RefreshCwIcon className="w-4 h-4" />
              Refresh
            </Button>
            <Button
              onClick={() => router.push('/admin/bookings')}
              variant="outline"
              size="sm"
            >
              Back to Bookings
            </Button>
          </div>
        </div>

        {/* Error Message */}
        {error && (
          <div className="bg-[var(--error-bg)] border border-[var(--error)] rounded-lg p-4">
            <div className="flex items-center gap-2">
              <AlertTriangleIcon className="w-5 h-5 text-[var(--error)]" />
              <p className="text-[var(--error)]">{error}</p>
            </div>
          </div>
        )}

        {/* Filter Tabs */}
        <div className="flex flex-wrap gap-2">
          {[
            { key: 'all' as const, label: 'All', count: requests.length },
            { key: 'pending' as const, label: 'Pending', count: pendingCount },
            { key: 'approved' as const, label: 'Approved', count: approvedCount },
            { key: 'rejected' as const, label: 'Rejected', count: rejectedCount }
          ].map((tab) => (
            <button
              key={tab.key}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                filter === tab.key
                  ? 'bg-[var(--primary)] text-white'
                  : 'bg-[var(--surface-secondary)] text-[var(--text-secondary)] hover:bg-[var(--surface-hover)] hover:text-[var(--text-primary)]'
              }`}
              onClick={() => setFilter(tab.key)}
            >
              {tab.label} ({tab.count})
            </button>
          ))}
        </div>

        {/* Requests List */}
        {filteredRequests.length === 0 ? (
          <Card className="text-center py-12">
            <CardContent>
              <CalendarIcon className="w-12 h-12 text-[var(--text-muted)] mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-[var(--text-primary)] mb-2">
                No Reschedule Requests
              </h3>
              <p className="text-[var(--text-secondary)]">
                {filter === 'all' 
                  ? 'No reschedule requests have been submitted yet.'
                  : `No ${filter} reschedule requests found.`
                }
              </p>
            </CardContent>
          </Card>
        ) : (
          <>
            <div className="flex justify-between items-center">
              <p className="text-sm text-[var(--text-secondary)]">
                {filteredRequests.length} request{filteredRequests.length !== 1 ? 's' : ''} found
                {filter !== 'all' && <span className="ml-2 text-[var(--text-primary)]">• Filtered</span>}
              </p>
            </div>

            <CardGrid columns={{ mobile: 1, tablet: 1, desktop: 1 }} gap="md">
              {filteredRequests.map((request) => (
                <RescheduleRequestCard
                  key={request.id}
                  request={request}
                  onApprove={() => handleApproveRequest(request)}
                  onDecline={() => handleDeclineRequest(request)}
                  onViewBooking={() => router.push(`/admin/bookings/${request.booking_id}`)}
                  formatTime={formatTime}
                  formatDate={formatDate}
                  isActionLoading={actionLoading === request.id}
                />
              ))}
            </CardGrid>
          </>
        )}
      </div>
    </AdminLayout>
  )
}

interface RescheduleRequestCardProps {
  request: RescheduleRequest
  onApprove: () => void
  onDecline: () => void
  onViewBooking: () => void
  formatTime: (time: string) => string
  formatDate: (dateStr: string) => string
  isActionLoading: boolean
}

function RescheduleRequestCard({ 
  request, 
  onApprove, 
  onDecline, 
  onViewBooking, 
  formatTime, 
  formatDate,
  isActionLoading 
}: RescheduleRequestCardProps) {
  const getStatusIcon = () => {
    switch (request.status) {
      case 'pending':
        return <ClockIcon className="w-5 h-5 text-[var(--warning)]" />
      case 'approved':
        return <CheckCircleIcon className="w-5 h-5 text-[var(--success)]" />
      case 'rejected':
        return <XCircleIcon className="w-5 h-5 text-[var(--error)]" />
    }
  }

  const getStatusColor = () => {
    switch (request.status) {
      case 'pending':
        return 'text-[var(--warning)] bg-[var(--warning-bg)] border-[var(--warning)]'
      case 'approved':
        return 'text-[var(--success)] bg-[var(--success-bg)] border-[var(--success)]'
      case 'rejected':
        return 'text-[var(--error)] bg-[var(--error-bg)] border-[var(--error)]'
    }
  }

  return (
    <Card className="hover:shadow-md transition-shadow">
      <CardContent className="p-6">
        {/* Header */}
        <div className="flex items-start justify-between mb-4">
          <div className="flex-1">
            <h3 className="text-lg font-semibold text-[var(--text-primary)] mb-2">
              Booking #{request.booking_reference}
            </h3>
            <div className={`inline-flex items-center gap-2 px-3 py-1 rounded-full border ${getStatusColor()}`}>
              {getStatusIcon()}
              <span className="font-medium capitalize">{request.status}</span>
            </div>
          </div>
          <div className="text-right">
            <p className="text-xl font-bold text-[var(--primary)]">£{request.total_price}</p>
            <Badge variant="outline" className="capitalize">{request.booking_status}</Badge>
          </div>
        </div>

        {/* Customer Info */}
        <div className="bg-[var(--surface-secondary)] rounded-lg p-4 mb-4">
          <div className="flex items-center gap-2 mb-3">
            <UserIcon className="w-4 h-4 text-[var(--text-secondary)]" />
            <span className="text-sm font-medium text-[var(--text-secondary)]">Customer</span>
          </div>
          <div className="space-y-2">
            <p className="font-semibold text-[var(--text-primary)]">{request.customer_name}</p>
            <div className="flex flex-col sm:flex-row sm:items-center gap-2 text-sm text-[var(--text-secondary)]">
              <a 
                href={`mailto:${request.customer_email}`}
                className="flex items-center gap-1 text-[var(--text-link)] hover:text-[var(--text-link-hover)]"
              >
                <MailIcon className="w-3 h-3" />
                {request.customer_email}
              </a>
              {request.customer_phone && (
                <a 
                  href={`tel:${request.customer_phone}`}
                  className="flex items-center gap-1 text-[var(--text-link)] hover:text-[var(--text-link-hover)]"
                >
                  <PhoneIcon className="w-3 h-3" />
                  {request.customer_phone}
                </a>
              )}
            </div>
          </div>
        </div>

        {/* Schedule Changes */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
          {/* Current Schedule */}
          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
            <h4 className="text-sm font-medium text-red-800 mb-2 flex items-center gap-2">
              <CalendarIcon className="w-4 h-4" />
              Current Schedule
            </h4>
            <div className="space-y-1">
              <p className="text-red-900 font-medium">{formatDate(request.original_date)}</p>
              <p className="text-red-700 text-sm">{formatTime(request.original_time)}</p>
            </div>
          </div>

          {/* Requested Schedule */}
          <div className="bg-green-50 border border-green-200 rounded-lg p-4">
            <h4 className="text-sm font-medium text-green-800 mb-2 flex items-center gap-2">
              <CalendarIcon className="w-4 h-4" />
              Requested Schedule
            </h4>
            <div className="space-y-1">
              <p className="text-green-900 font-medium">{formatDate(request.requested_date)}</p>
              <p className="text-green-700 text-sm">{formatTime(request.requested_time)}</p>
            </div>
          </div>
        </div>

        {/* Customer Reason */}
        <div className="bg-[var(--surface-secondary)] rounded-lg p-4 mb-4">
          <h4 className="text-sm font-medium text-[var(--text-secondary)] mb-2">Customer's Reason</h4>
          <p className="text-[var(--text-primary)] italic">"{request.reason}"</p>
          {request.customer_notes && (
            <div className="mt-2 pt-2 border-t border-[var(--border-secondary)]">
              <p className="text-sm text-[var(--text-secondary)]">Additional Notes:</p>
              <p className="text-sm text-[var(--text-primary)]">{request.customer_notes}</p>
            </div>
          )}
        </div>

        {/* Admin Response */}
        {request.admin_response && (
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
            <h4 className="text-sm font-medium text-blue-800 mb-2">Admin Response</h4>
            <p className="text-blue-900">{request.admin_response}</p>
            {request.admin_notes && (
              <div className="mt-2 pt-2 border-t border-blue-300">
                <p className="text-sm text-blue-700">Internal Notes:</p>
                <p className="text-sm text-blue-900">{request.admin_notes}</p>
              </div>
            )}
          </div>
        )}

        {/* Timeline */}
        <div className="text-xs text-[var(--text-muted)] mb-4">
          <p>Requested: {new Date(request.created_at).toLocaleString()}</p>
          {request.responded_at && (
            <p>Responded: {new Date(request.responded_at).toLocaleString()}</p>
          )}
        </div>

        {/* Actions */}
        <div className="space-y-3">
          <Button
            onClick={onViewBooking}
            variant="outline"
            size="sm"
            className="w-full"
          >
            View Full Booking Details
          </Button>
          
          {request.status === 'pending' && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              <Button
                onClick={onApprove}
                disabled={isActionLoading}
                size="sm"
                className="bg-green-600 hover:bg-green-700 text-white flex items-center gap-2"
              >
                <CalendarCheckIcon className="w-4 h-4" />
                Approve Request
              </Button>
              <Button
                onClick={onDecline}
                disabled={isActionLoading}
                variant="outline"
                size="sm"
                className="text-red-600 border-red-200 hover:bg-red-50 flex items-center gap-2"
              >
                <CalendarXIcon className="w-4 h-4" />
                Decline Request
              </Button>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  )
}

export default function AdminRescheduleRequestsPageWithProtection() {
  return (
    <AdminRoute>
      <AdminRescheduleRequestsPage />
    </AdminRoute>
  )
}