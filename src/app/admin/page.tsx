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
  AlertCircleIcon
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
  }
  address: {
    city: string
    postal_code: string
  }
}

const statusConfig = {
  pending: {
    label: 'Pending',
    color: 'text-[var(--warning)]',
    bgColor: 'bg-[var(--warning-bg)]',
    borderColor: 'border-[var(--warning)]'
  },
  confirmed: {
    label: 'Confirmed',
    color: 'text-[var(--success)]',
    bgColor: 'bg-[var(--success-bg)]',
    borderColor: 'border-[var(--success)]'
  },
  in_progress: {
    label: 'In Progress',
    color: 'text-[var(--info)]',
    bgColor: 'bg-[var(--info-bg)]',
    borderColor: 'border-[var(--info)]'
  },
  completed: {
    label: 'Completed',
    color: 'text-[var(--success)]',
    bgColor: 'bg-[var(--success-bg)]',
    borderColor: 'border-[var(--success)]'
  },
  cancelled: {
    label: 'Cancelled',
    color: 'text-[var(--error)]',
    bgColor: 'bg-[var(--error-bg)]',
    borderColor: 'border-[var(--error)]'
  }
}

export default function AdminDashboardPage() {
  const router = useRouter()
  const [stats, setStats] = useState<AdminStats | null>(null)
  const [recentBookings, setRecentBookings] = useState<RecentBooking[]>([])
  const [todaysBookings, setTodaysBookings] = useState<RecentBooking[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const fetchAdminData = async () => {
      try {
        // Fetch admin stats
        const statsResponse = await fetch('/api/admin/stats')
        const statsData = await statsResponse.json()
        
        if (statsData.success) {
          setStats(statsData.data)
        }

        // Fetch recent bookings
        const bookingsResponse = await fetch('/api/admin/bookings/recent')
        const bookingsData = await bookingsResponse.json()
        
        if (bookingsData.success) {
          setRecentBookings(bookingsData.data)
        }

        // Fetch today's bookings
        const todayResponse = await fetch('/api/admin/bookings/today')
        const todayData = await todayResponse.json()
        
        if (todayData.success) {
          setTodaysBookings(todayData.data)
        }
      } catch (error) {
        console.error('Failed to fetch admin data:', error)
      } finally {
        setIsLoading(false)
      }
    }

    fetchAdminData()
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
      day: 'numeric'
    })
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[var(--bg-primary)] flex items-center justify-center">
        <div className="animate-spin w-8 h-8 border-4 border-[var(--primary)] border-t-transparent rounded-full"></div>
      </div>
    )
  }

  return (
    <AdminLayout>
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-[var(--text-primary)]">
              Admin Dashboard
            </h1>
            <p className="text-[var(--text-secondary)]">
              Manage your detailing business
            </p>
          </div>
          
          <div className="flex gap-3">
            <Button
              onClick={() => router.push('/admin/bookings')}
              variant="outline"
              className="flex items-center gap-2"
            >
              <CalendarIcon className="w-4 h-4" />
              Manage Bookings
            </Button>
            <Button
              onClick={() => router.push('/admin/time-slots')}
              className="flex items-center gap-2"
            >
              <PlusIcon className="w-4 h-4" />
              Add Time Slots
            </Button>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {/* Total Bookings */}
          <div className="bg-[var(--surface-secondary)] rounded-lg p-6 border border-[var(--border-secondary)]">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-[var(--text-secondary)] text-sm mb-1">Total Bookings</p>
                <p className="text-2xl font-bold text-[var(--text-primary)]">
                  {stats?.totalBookings || 0}
                </p>
                <p className="text-[var(--text-muted)] text-xs">
                  {stats?.pendingBookings || 0} pending
                </p>
              </div>
              <div className="bg-[var(--surface-tertiary)] rounded-lg p-3">
                <CalendarIcon className="w-6 h-6 text-[var(--primary)]" />
              </div>
            </div>
          </div>

          {/* Monthly Revenue */}
          <div className="bg-[var(--surface-secondary)] rounded-lg p-6 border border-[var(--border-secondary)]">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-[var(--text-secondary)] text-sm mb-1">Monthly Revenue</p>
                <p className="text-2xl font-bold text-[var(--text-primary)]">
                  £{stats?.monthlyRevenue || 0}
                </p>
                <p className="text-[var(--text-muted)] text-xs">
                  £{stats?.totalRevenue || 0} total
                </p>
              </div>
              <div className="bg-[var(--surface-tertiary)] rounded-lg p-3">
                <DollarSignIcon className="w-6 h-6 text-[var(--primary)]" />
              </div>
            </div>
          </div>

          {/* Active Customers */}
          <div className="bg-[var(--surface-secondary)] rounded-lg p-6 border border-[var(--border-secondary)]">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-[var(--text-secondary)] text-sm mb-1">Active Customers</p>
                <p className="text-2xl font-bold text-[var(--text-primary)]">
                  {stats?.activeCustomers || 0}
                </p>
                <p className="text-[var(--text-muted)] text-xs">
                  {stats?.totalCustomers || 0} total
                </p>
              </div>
              <div className="bg-[var(--surface-tertiary)] rounded-lg p-3">
                <UsersIcon className="w-6 h-6 text-[var(--primary)]" />
              </div>
            </div>
          </div>

          {/* Completion Rate */}
          <div className="bg-[var(--surface-secondary)] rounded-lg p-6 border border-[var(--border-secondary)]">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-[var(--text-secondary)] text-sm mb-1">Completion Rate</p>
                <p className="text-2xl font-bold text-[var(--text-primary)]">
                  {stats?.totalBookings ? Math.round((stats.completedBookings / stats.totalBookings) * 100) : 0}%
                </p>
                <p className="text-[var(--text-muted)] text-xs">
                  {stats?.completedBookings || 0} completed
                </p>
              </div>
              <div className="bg-[var(--surface-tertiary)] rounded-lg p-3">
                <TrendingUpIcon className="w-6 h-6 text-[var(--primary)]" />
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Today's Schedule */}
          <div className="bg-[var(--surface-secondary)] rounded-lg border border-[var(--border-secondary)]">
            <div className="p-6 border-b border-[var(--border-secondary)]">
              <h2 className="text-xl font-semibold text-[var(--text-primary)] flex items-center gap-2">
                <ClockIcon className="w-5 h-5 text-[var(--primary)]" />
                Today&apos;s Schedule
              </h2>
            </div>
            
            <div className="p-6">
              {todaysBookings.length === 0 ? (
                <div className="text-center py-8">
                  <CalendarIcon className="w-12 h-12 text-[var(--text-muted)] mx-auto mb-4" />
                  <p className="text-[var(--text-secondary)]">No bookings scheduled for today</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {todaysBookings.map((booking) => {
                    const status = statusConfig[booking.status]
                    
                    return (
                      <div
                        key={booking.id}
                        className="flex items-center justify-between p-4 bg-[var(--surface-tertiary)] rounded-lg"
                      >
                        <div className="flex items-center gap-4">
                          <div className="text-center">
                            <p className="text-lg font-bold text-[var(--text-primary)]">
                              {formatTime(booking.start_time)}
                            </p>
                          </div>
                          
                          <div className="flex-1">
                            <p className="font-medium text-[var(--text-primary)]">
                              {booking.customer_name}
                            </p>
                            <p className="text-[var(--text-secondary)] text-sm">
                              {booking.vehicle.make} {booking.vehicle.model} • {booking.address.city}
                            </p>
                            <div className={`inline-flex items-center gap-1 px-2 py-1 rounded text-xs ${status.bgColor} ${status.color} mt-1`}>
                              {status.label}
                            </div>
                          </div>
                        </div>
                        
                        <div className="text-right">
                          <p className="font-bold text-[var(--primary)]">£{booking.total_price}</p>
                          <Button
                            onClick={() => router.push(`/admin/bookings/${booking.id}`)}
                            variant="outline"
                            size="sm"
                            className="mt-2"
                          >
                            View
                          </Button>
                        </div>
                      </div>
                    )
                  })}
                </div>
              )}
            </div>
          </div>

          {/* Recent Bookings */}
          <div className="bg-[var(--surface-secondary)] rounded-lg border border-[var(--border-secondary)]">
            <div className="p-6 border-b border-[var(--border-secondary)] flex items-center justify-between">
              <h2 className="text-xl font-semibold text-[var(--text-primary)] flex items-center gap-2">
                <CalendarIcon className="w-5 h-5 text-[var(--primary)]" />
                Recent Bookings
              </h2>
              <Button
                onClick={() => router.push('/admin/bookings')}
                variant="outline"
                size="sm"
              >
                View All
              </Button>
            </div>
            
            <div className="p-6">
              {recentBookings.length === 0 ? (
                <div className="text-center py-8">
                  <CalendarIcon className="w-12 h-12 text-[var(--text-muted)] mx-auto mb-4" />
                  <p className="text-[var(--text-secondary)]">No recent bookings</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {recentBookings.slice(0, 5).map((booking) => {
                    const status = statusConfig[booking.status]
                    
                    return (
                      <div
                        key={booking.id}
                        className="flex items-center justify-between p-4 bg-[var(--surface-tertiary)] rounded-lg hover:bg-[var(--surface-hover)] transition-colors cursor-pointer"
                        onClick={() => router.push(`/admin/bookings/${booking.id}`)}
                      >
                        <div className="flex items-center gap-4">
                          <div className="text-center">
                            <p className="text-sm font-medium text-[var(--text-primary)]">
                              {formatDate(booking.scheduled_date)}
                            </p>
                            <p className="text-xs text-[var(--text-secondary)]">
                              {formatTime(booking.start_time)}
                            </p>
                          </div>
                          
                          <div className="flex-1">
                            <p className="font-medium text-[var(--text-primary)]">
                              #{booking.booking_reference}
                            </p>
                            <p className="text-[var(--text-secondary)] text-sm">
                              {booking.customer_name} • {booking.vehicle.make} {booking.vehicle.model}
                            </p>
                            <div className={`inline-flex items-center gap-1 px-2 py-1 rounded text-xs ${status.bgColor} ${status.color} mt-1`}>
                              {status.label}
                            </div>
                          </div>
                        </div>
                        
                        <div className="text-right">
                          <p className="font-bold text-[var(--primary)]">£{booking.total_price}</p>
                          <p className="text-[var(--text-muted)] text-xs">
                            {booking.services.length} service{booking.services.length !== 1 ? 's' : ''}
                          </p>
                        </div>
                      </div>
                    )
                  })}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="mt-8 bg-[var(--surface-secondary)] rounded-lg p-6 border border-[var(--border-secondary)]">
          <h2 className="text-xl font-semibold text-[var(--text-primary)] mb-6">Quick Actions</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <Button
              onClick={() => router.push('/admin/bookings?status=pending')}
              variant="outline"
              className="flex items-center gap-2 p-4 h-auto"
            >
              <AlertCircleIcon className="w-5 h-5 text-[var(--warning)]" />
              <div className="text-left">
                <p className="font-medium">Review Pending</p>
                <p className="text-sm text-[var(--text-secondary)]">
                  {stats?.pendingBookings || 0} bookings
                </p>
              </div>
            </Button>

            <Button
              onClick={() => router.push('/admin/time-slots')}
              variant="outline"
              className="flex items-center gap-2 p-4 h-auto"
            >
              <PlusIcon className="w-5 h-5 text-[var(--primary)]" />
              <div className="text-left">
                <p className="font-medium">Add Slots</p>
                <p className="text-sm text-[var(--text-secondary)]">
                  Manage availability
                </p>
              </div>
            </Button>

            <Button
              onClick={() => router.push('/admin/customers')}
              variant="outline"
              className="flex items-center gap-2 p-4 h-auto"
            >
              <UsersIcon className="w-5 h-5 text-[var(--primary)]" />
              <div className="text-left">
                <p className="font-medium">View Customers</p>
                <p className="text-sm text-[var(--text-secondary)]">
                  {stats?.totalCustomers || 0} total
                </p>
              </div>
            </Button>

            <Button
              onClick={() => router.push('/admin/reports')}
              variant="outline"
              className="flex items-center gap-2 p-4 h-auto"
            >
              <TrendingUpIcon className="w-5 h-5 text-[var(--primary)]" />
              <div className="text-left">
                <p className="font-medium">View Reports</p>
                <p className="text-sm text-[var(--text-secondary)]">
                  Revenue & stats
                </p>
              </div>
            </Button>
          </div>
        </div>
      </div>
    </AdminLayout>
  )
}