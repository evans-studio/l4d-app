'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/primitives/Button'
import { AdminLayout } from '@/components/layouts/AdminLayout'
import { 
  CalendarIcon, 
  UsersIcon, 
  DollarSignIcon, 
  TrendingUpIcon,
  ClockIcon,
  PlusIcon,
  AlertCircleIcon,
  CheckCircleIcon,
  XCircleIcon,
  EyeIcon,
  EditIcon,
  MoreHorizontalIcon
} from 'lucide-react'

interface AdminStats {
  totalBookings: number
  pendingBookings: number
  confirmedBookings: number
  completedBookings: number
  totalRevenue: number
  monthlyRevenue: number
  totalCustomers: number
  activeCustomers: number
}

interface RecentBooking {
  id: string
  booking_reference: string
  customer_name: string
  customer_email: string
  scheduled_date: string
  start_time: string
  status: 'pending' | 'confirmed' | 'in_progress' | 'completed' | 'cancelled'
  total_price: number
  services: Array<{
    name: string
  }>
  vehicle: {
    make: string
    model: string
    year?: number
  }
  address: {
    address_line_1: string
    city: string
    postal_code: string
  }
  created_at: string
}

const statusConfig = {
  pending: {
    label: 'Pending',
    color: 'bg-yellow-100 text-yellow-800 border-yellow-200',
    icon: ClockIcon
  },
  confirmed: {
    label: 'Confirmed',
    color: 'bg-blue-100 text-blue-800 border-blue-200',
    icon: CheckCircleIcon
  },
  in_progress: {
    label: 'In Progress',
    color: 'bg-purple-100 text-purple-800 border-purple-200',
    icon: ClockIcon
  },
  completed: {
    label: 'Completed',
    color: 'bg-green-100 text-green-800 border-green-200',
    icon: CheckCircleIcon
  },
  cancelled: {
    label: 'Cancelled',
    color: 'bg-red-100 text-red-800 border-red-200',
    icon: XCircleIcon
  }
}

export default function AdminDashboard() {
  const router = useRouter()
  const [stats, setStats] = useState<AdminStats | null>(null)
  const [recentBookings, setRecentBookings] = useState<RecentBooking[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    loadDashboardData()
  }, [])

  const loadDashboardData = async () => {
    try {
      setIsLoading(true)
      setError('')

      // Load stats and recent bookings in parallel
      const [statsResponse, bookingsResponse] = await Promise.all([
        fetch('/api/admin/stats'),
        fetch('/api/admin/bookings/recent')
      ])

      if (!statsResponse.ok || !bookingsResponse.ok) {
        throw new Error('Failed to load dashboard data')
      }

      const [statsData, bookingsData] = await Promise.all([
        statsResponse.json(),
        bookingsResponse.json()
      ])

      if (statsData.success) {
        setStats(statsData.data)
      }

      if (bookingsData.success) {
        setRecentBookings(bookingsData.data.bookings || [])
      }

    } catch (error) {
      console.error('Dashboard data error:', error)
      setError('Failed to load dashboard data')
    } finally {
      setIsLoading(false)
    }
  }

  const handleBookingAction = async (bookingId: string, action: 'confirm' | 'cancel' | 'complete') => {
    try {
      const response = await fetch(`/api/admin/bookings/${bookingId}/status`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: action === 'confirm' ? 'confirmed' : action === 'cancel' ? 'cancelled' : 'completed' })
      })

      if (response.ok) {
        // Reload the data to reflect changes
        loadDashboardData()
      }
    } catch (error) {
      console.error('Status update error:', error)
    }
  }

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr)
    return date.toLocaleDateString('en-GB', {
      day: 'numeric',
      month: 'short',
      year: 'numeric'
    })
  }

  const formatTime = (timeStr: string) => {
    const [hours, minutes] = timeStr.split(':')
    const hour = parseInt(hours || '0')
    const ampm = hour >= 12 ? 'PM' : 'AM'
    const displayHour = hour % 12 || 12
    return `${displayHour}:${minutes || '00'} ${ampm}`
  }

  if (isLoading) {
    return (
      <AdminLayout>
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-brand-purple"></div>
        </div>
      </AdminLayout>
    )
  }

  return (
    <AdminLayout>
      <div className="space-y-8">
        {/* Header */}
        <div className="flex justify-between items-start">
          <div>
            <h1 className="text-2xl font-bold text-text-primary">Admin Dashboard</h1>
            <p className="text-text-secondary mt-2">
              Overview of your business performance and recent activities
            </p>
          </div>
          <Button 
            onClick={() => router.push('/admin/bookings')}
            className="flex items-center space-x-2"
          >
            <PlusIcon className="w-4 h-4" />
            <span>Manage Bookings</span>
          </Button>
        </div>

        {error && (
          <div className="p-4 bg-red-50 border border-red-200 rounded-lg text-red-800">
            {error}
          </div>
        )}

        {/* Stats Cards */}
        {stats && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="bg-surface-secondary rounded-lg border border-border-primary p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-text-secondary text-sm font-medium">Total Bookings</p>
                  <p className="text-2xl font-bold text-text-primary">{stats.totalBookings}</p>
                </div>
                <CalendarIcon className="w-8 h-8 text-brand-purple" />
              </div>
              <div className="mt-4 flex items-center text-sm">
                <span className="text-yellow-600 font-medium">{stats.pendingBookings} pending</span>
              </div>
            </div>

            <div className="bg-surface-secondary rounded-lg border border-border-primary p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-text-secondary text-sm font-medium">Monthly Revenue</p>
                  <p className="text-2xl font-bold text-text-primary">£{stats.monthlyRevenue.toLocaleString()}</p>
                </div>
                <DollarSignIcon className="w-8 h-8 text-green-600" />
              </div>
              <div className="mt-4 flex items-center text-sm">
                <span className="text-text-secondary">£{stats.totalRevenue.toLocaleString()} total</span>
              </div>
            </div>

            <div className="bg-surface-secondary rounded-lg border border-border-primary p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-text-secondary text-sm font-medium">Active Customers</p>
                  <p className="text-2xl font-bold text-text-primary">{stats.activeCustomers}</p>
                </div>
                <UsersIcon className="w-8 h-8 text-blue-600" />
              </div>
              <div className="mt-4 flex items-center text-sm">
                <span className="text-text-secondary">{stats.totalCustomers} total</span>
              </div>
            </div>

            <div className="bg-surface-secondary rounded-lg border border-border-primary p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-text-secondary text-sm font-medium">Completed</p>
                  <p className="text-2xl font-bold text-text-primary">{stats.completedBookings}</p>
                </div>
                <TrendingUpIcon className="w-8 h-8 text-brand-purple" />
              </div>
              <div className="mt-4 flex items-center text-sm">
                <span className="text-green-600 font-medium">{stats.confirmedBookings} confirmed</span>
              </div>
            </div>
          </div>
        )}

        {/* Recent Bookings */}
        <div className="bg-surface-secondary rounded-lg border border-border-primary">
          <div className="px-6 py-4 border-b border-border-secondary">
            <div className="flex justify-between items-center">
              <h2 className="text-lg font-semibold text-text-primary">Recent Bookings</h2>
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => router.push('/admin/bookings')}
              >
                View All
              </Button>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-surface-primary">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-text-secondary uppercase tracking-wider">
                    Booking
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-text-secondary uppercase tracking-wider">
                    Customer
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-text-secondary uppercase tracking-wider">
                    Date & Time
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-text-secondary uppercase tracking-wider">
                    Vehicle
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-text-secondary uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-text-secondary uppercase tracking-wider">
                    Total
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-text-secondary uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border-secondary">
                {recentBookings.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="px-6 py-8 text-center">
                      <div className="flex flex-col items-center">
                        <CalendarIcon className="w-12 h-12 text-text-muted mb-4" />
                        <p className="text-text-secondary">No recent bookings found</p>
                      </div>
                    </td>
                  </tr>
                ) : (
                  recentBookings.map((booking) => {
                    const statusInfo = statusConfig[booking.status]
                    const StatusIcon = statusInfo.icon

                    return (
                      <tr key={booking.id} className="hover:bg-surface-hover transition-colors">
                        <td className="px-6 py-4">
                          <div>
                            <div className="font-medium text-text-primary">
                              {booking.booking_reference}
                            </div>
                            <div className="text-sm text-text-secondary">
                              {booking.services.map(s => s.name).join(', ')}
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div>
                            <div className="font-medium text-text-primary">
                              {booking.customer_name}
                            </div>
                            <div className="text-sm text-text-secondary">
                              {booking.customer_email}
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div>
                            <div className="font-medium text-text-primary">
                              {formatDate(booking.scheduled_date)}
                            </div>
                            <div className="text-sm text-text-secondary">
                              {formatTime(booking.start_time)}
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="text-sm">
                            <div className="font-medium text-text-primary">
                              {booking.vehicle.year} {booking.vehicle.make} {booking.vehicle.model}
                            </div>
                            <div className="text-text-secondary">
                              {booking.address.city}, {booking.address.postal_code}
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${statusInfo.color}`}>
                            <StatusIcon className="w-3 h-3 mr-1" />
                            {statusInfo.label}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          <div className="font-medium text-text-primary">
                            £{booking.total_price}
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center space-x-2">
                            {booking.status === 'pending' && (
                              <>
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => handleBookingAction(booking.id, 'confirm')}
                                  className="text-green-600 border-green-200 hover:bg-green-50"
                                >
                                  <CheckCircleIcon className="w-3 h-3" />
                                </Button>
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => handleBookingAction(booking.id, 'cancel')}
                                  className="text-red-600 border-red-200 hover:bg-red-50"
                                >
                                  <XCircleIcon className="w-3 h-3" />
                                </Button>
                              </>
                            )}
                            {booking.status === 'confirmed' && (
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => handleBookingAction(booking.id, 'complete')}
                                className="text-blue-600 border-blue-200 hover:bg-blue-50"
                              >
                                Complete
                              </Button>
                            )}
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => router.push(`/admin/bookings/${booking.id}`)}
                            >
                              <EyeIcon className="w-3 h-3" />
                            </Button>
                          </div>
                        </td>
                      </tr>
                    )
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-surface-secondary rounded-lg border border-border-primary p-6">
            <h3 className="text-lg font-semibold text-text-primary mb-4">Quick Actions</h3>
            <div className="space-y-3">
              <Button
                variant="outline"
                className="w-full justify-start"
                onClick={() => router.push('/admin/bookings')}
              >
                <CalendarIcon className="w-4 h-4 mr-2" />
                Manage All Bookings
              </Button>
              <Button
                variant="outline"
                className="w-full justify-start"
                onClick={() => router.push('/admin/customers')}
              >
                <UsersIcon className="w-4 h-4 mr-2" />
                View Customers
              </Button>
              <Button
                variant="outline"
                className="w-full justify-start"
                onClick={() => router.push('/admin/services')}
              >
                <EditIcon className="w-4 h-4 mr-2" />
                Manage Services
              </Button>
            </div>
          </div>

          <div className="bg-surface-secondary rounded-lg border border-border-primary p-6">
            <h3 className="text-lg font-semibold text-text-primary mb-4">Alerts</h3>
            <div className="space-y-3">
              {stats && stats.pendingBookings > 0 && (
                <div className="flex items-center p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                  <AlertCircleIcon className="w-5 h-5 text-yellow-600 mr-3" />
                  <div>
                    <p className="text-sm font-medium text-yellow-800">
                      {stats.pendingBookings} booking{stats.pendingBookings > 1 ? 's' : ''} pending confirmation
                    </p>
                  </div>
                </div>
              )}
              <div className="flex items-center p-3 bg-blue-50 border border-blue-200 rounded-lg">
                <CheckCircleIcon className="w-5 h-5 text-blue-600 mr-3" />
                <div>
                  <p className="text-sm font-medium text-blue-800">
                    All systems operational
                  </p>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-surface-secondary rounded-lg border border-border-primary p-6">
            <h3 className="text-lg font-semibold text-text-primary mb-4">Recent Activity</h3>
            <div className="space-y-3 text-sm">
              <div className="flex items-center text-text-secondary">
                <div className="w-2 h-2 bg-green-500 rounded-full mr-3"></div>
                <span>New booking received</span>
              </div>
              <div className="flex items-center text-text-secondary">
                <div className="w-2 h-2 bg-blue-500 rounded-full mr-3"></div>
                <span>Service completed</span>
              </div>
              <div className="flex items-center text-text-secondary">
                <div className="w-2 h-2 bg-purple-500 rounded-full mr-3"></div>
                <span>Customer registered</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </AdminLayout>
  )
}