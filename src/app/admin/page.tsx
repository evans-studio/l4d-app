'use client'

import { useEffect, useState, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { useSessionRefresh } from '@/lib/hooks/useSessionRefresh'
import { Button } from '@/components/ui/primitives/Button'
import { AdminLayout } from '@/components/layouts/AdminLayout'
import { AdminRoute } from '@/components/ProtectedRoute'
import { BookingCard } from '@/components/admin/BookingCard'
import { CompactDashboardWidgets } from '@/components/admin/widgets/CompactDashboardWidgets'
import { 
  CalendarIcon, 
  UsersIcon, 
  PlusIcon,
  AlertCircleIcon,
  CheckCircleIcon,
  ClockIcon,
  EditIcon,
  BarChart3Icon
} from 'lucide-react'

interface AdminStats {
  today: {
    booked: number
    capacity: number
    remaining: number
    utilizationPercent: number
    bookings: any[]
  }
  tomorrow: {
    booked: number
    capacity: number
    remaining: number
    fullyBooked: boolean
    utilizationPercent: number
    bookings: any[]
  }
  thisWeek: {
    booked: number
    capacity: number
    utilizationPercent: number
    revenue: number
    bookings: any[]
  }
  requiresAction: {
    total: number
    pending: number
    rescheduleRequests: number
    toConfirm: number
    bookings: any[]
    reschedules: any[]
  }
  // Legacy fields for backward compatibility
  pendingBookings?: number
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



function AdminDashboard() {
  const router = useRouter()
  const { refreshSession } = useSessionRefresh()
  const [stats, setStats] = useState<AdminStats | null>(null)
  const [recentBookings, setRecentBookings] = useState<RecentBooking[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState('')

  // Simple overflow prevention
  useEffect(() => {
    const style = document.createElement('style')
    style.textContent = `
      .scrollbar-hide {
        -ms-overflow-style: none;
        scrollbar-width: none;
      }
      .scrollbar-hide::-webkit-scrollbar {
        display: none;
      }
      body {
        overflow-x: hidden;
      }
    `
    document.head.appendChild(style)
    return () => {
      if (document.head.contains(style)) {
        document.head.removeChild(style)
      }
    }
  }, [])

  useEffect(() => {
    loadDashboardData()
  }, [])

  const loadDashboardData = async () => {
    try {
      setIsLoading(true)
      setError('')

      

      // Load stats first
      
      const statsResponse = await fetch('/api/admin/stats')
      
      
      if (statsResponse.status === 401) {
        
        const refreshSuccess = await refreshSession()
        
        if (refreshSuccess) {
          
          const retryStatsResponse = await fetch('/api/admin/stats')
          
          if (retryStatsResponse.ok) {
            const retryStatsData = await retryStatsResponse.json()
            if (retryStatsData.success) {
              setStats(retryStatsData.data)
              
            }
          } else {
            throw new Error('Stats request failed after retry')
          }
        } else {
          throw new Error('Session refresh failed')
        }
      } else if (statsResponse.ok) {
        const statsData = await statsResponse.json()
        if (statsData.success) {
          setStats(statsData.data)
          
        } else {
          console.error('Stats API returned error:', statsData.error)
        }
      } else {
        throw new Error(`Stats request failed with status: ${statsResponse.status}`)
      }

      // Load recent bookings
      
      const bookingsResponse = await fetch('/api/admin/bookings/recent')
      
      
      if (bookingsResponse.status === 401) {
        
        const refreshSuccess = await refreshSession()
        
        if (refreshSuccess) {
          
          const retryBookingsResponse = await fetch('/api/admin/bookings/recent')
          
          if (retryBookingsResponse.ok) {
            const retryBookingsData = await retryBookingsResponse.json()
            if (retryBookingsData.success) {
              setRecentBookings(retryBookingsData.data.bookings || [])
              
            }
          } else {
            throw new Error('Bookings request failed after retry')
          }
        } else {
          throw new Error('Session refresh failed')
        }
      } else if (bookingsResponse.ok) {
        const bookingsData = await bookingsResponse.json()
        if (bookingsData.success) {
          setRecentBookings(bookingsData.data.bookings || [])
          
        } else {
          console.error('Bookings API returned error:', bookingsData.error)
        }
      } else {
        const errorText = await bookingsResponse.text()
        console.error('Bookings request failed:', errorText)
        throw new Error(`Bookings request failed with status: ${bookingsResponse.status}`)
      }

    } catch (error) {
      console.error('Dashboard data error:', error)
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred'
      setError(`Failed to load dashboard data: ${errorMessage}`)
    } finally {
      setIsLoading(false)
    }
  }

  const handleBookingAction = async (bookingId: string, newStatus: string) => {
    try {
      const response = await fetch(`/api/admin/bookings/${bookingId}/status`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus })
      })

      if (response.ok) {
        // Reload the data to reflect changes
        loadDashboardData()
      }
    } catch (error) {
      console.error('Status update error:', error)
    }
  }

  const handleMarkAsPaid = async (booking: { id: string; booking_reference: string }) => {
    try {
      const response = await fetch(`/api/admin/bookings/${booking.id}/mark-paid`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({})
      })

      if (response.ok) {
        // Reload the data to reflect changes
        loadDashboardData()
      } else {
        console.error('Failed to mark booking as paid')
      }
    } catch (error) {
      console.error('Error marking booking as paid:', error)
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

  // Transform AdminStats into compact widget data
  const getCompactWidgetData = () => {
    if (!stats) return null

    // Find next booking from today's bookings
    const nextBooking = stats.today.bookings?.[0] // Assuming first is next
    
    return {
      todaysSchedule: {
        stats: {
          total: stats.today.booked,
          completed: stats.today.booked - stats.today.remaining,
          remaining: stats.today.remaining
        },
        next: nextBooking ? {
          time: formatTime(nextBooking.start_time || '00:00'),
          customer: nextBooking.customer_name || 'Customer',
          service: nextBooking.services?.[0]?.name || 'Service'
        } : null,
        revenue: stats.thisWeek.revenue
      },
      customerActivity: {
        new: 4, // Mock data - you can enhance this with real API data
        returning: 12,
        latest: {
          name: recentBookings[0]?.customer_name || 'Customer',
          action: `booked ${recentBookings[0]?.services?.[0]?.name || 'service'}`,
          timeAgo: recentBookings[0] ? '2h ago' : 'N/A'
        }
      },
      revenuePulse: {
        today: Math.round(stats.thisWeek.revenue / 7), // Mock today revenue
        week: stats.thisWeek.revenue,
        month: stats.thisWeek.revenue * 4, // Mock month revenue
        trend: 'up' as const
      },
      requiresAction: {
        count: stats.requiresAction.total,
        mostUrgent: {
          type: 'booking',
          message: stats.requiresAction.pending > 0 
            ? `Booking confirmation from ${recentBookings.find(b => b.status === 'pending')?.customer_name || 'customer'}` 
            : 'Review required',
          action: 'Review'
        }
      }
    }
  }

  const compactWidgetData = getCompactWidgetData()

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
      <div className="space-y-6 sm:space-y-8 overflow-x-hidden max-w-full">
        {/* Header - Mobile First Responsive */}
        <div className="flex flex-col space-y-4 sm:flex-row sm:justify-between sm:items-start sm:space-y-0 w-full max-w-full min-w-0">
          <div className="flex-1">
            <h1 className="text-xl sm:text-2xl font-bold text-text-primary">Admin Dashboard</h1>
            <p className="text-text-secondary mt-2 text-sm sm:text-base">
              Overview of your business performance and recent activities
            </p>
          </div>
          <Button 
            onClick={() => router.push('/admin/bookings')}
            className="flex items-center justify-center space-x-2 w-full sm:w-auto"
            size="sm"
          >
            <PlusIcon className="w-4 h-4" />
            <span className="sm:hidden">Bookings</span>
            <span className="hidden sm:inline">Manage Bookings</span>
          </Button>
        </div>

        {error && (
          <div className="p-4 bg-red-50 border border-red-200 rounded-lg text-red-800">
            {error}
          </div>
        )}

        {/* Ultra-Compact Dashboard Widgets */}
        {compactWidgetData && (
          <CompactDashboardWidgets
            todaysSchedule={compactWidgetData.todaysSchedule}
            customerActivity={compactWidgetData.customerActivity}
            revenuePulse={compactWidgetData.revenuePulse}
            requiresAction={compactWidgetData.requiresAction}
            onActionClick={() => router.push('/admin/bookings')}
          />
        )}

        {/* Recent Bookings - Compact Card Stack */}
        <div className="bg-surface-secondary rounded-lg border border-border-primary w-full overflow-hidden">
          <div className="px-4 sm:px-6 py-4 border-b border-border-secondary">
            <div className="flex flex-col space-y-3 sm:flex-row sm:justify-between sm:items-center sm:space-y-0">
              <h2 className="text-lg font-semibold text-text-primary">Recent Bookings</h2>
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => router.push('/admin/bookings')}
                className="w-full sm:w-auto"
              >
                View All
              </Button>
            </div>
          </div>

          <div className="p-4">
            {recentBookings.length === 0 ? (
              <div className="text-center py-8">
                <CalendarIcon className="w-12 h-12 text-text-muted mx-auto mb-3" />
                <p className="text-text-secondary">No recent bookings found</p>
              </div>
            ) : (
              <div className="space-y-3">
                {recentBookings.slice(0, 5).map((booking) => (
                  <BookingCard
                    key={booking.id}
                    booking={booking}
                    variant="dashboard"
                    onStatusUpdate={handleBookingAction}
                    onMarkAsPaid={handleMarkAsPaid}
                    showActions={true}
                  />
                ))}
                
                {recentBookings.length > 5 && (
                  <div className="text-center pt-3">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => router.push('/admin/bookings')}
                      className="text-text-secondary hover:text-text-primary"
                    >
                      Show {recentBookings.length - 5} more booking{recentBookings.length - 5 !== 1 ? 's' : ''}
                    </Button>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Quick Actions - Mobile First Design */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6 w-full max-w-full">
          <div className="bg-surface-secondary rounded-lg border border-border-primary p-4 md:p-6">
            <h3 className="text-base md:text-lg font-semibold text-text-primary mb-4">Quick Actions</h3>
            <div className="grid grid-cols-2 md:grid-cols-1 gap-3">
              <Button
                variant="outline"
                className="w-full justify-center md:justify-start text-sm"
                onClick={() => router.push('/admin/bookings')}
                style={{ minHeight: '44px' }}
              >
                <CalendarIcon className="w-4 h-4 md:mr-2" />
                <span className="hidden md:inline ml-0 md:ml-0">Bookings</span>
              </Button>
              <Button
                variant="outline"
                className="w-full justify-center md:justify-start text-sm"
                onClick={() => router.push('/admin/customers')}
                style={{ minHeight: '44px' }}
              >
                <UsersIcon className="w-4 h-4 md:mr-2" />
                <span className="hidden md:inline">Customers</span>
              </Button>
              <Button
                variant="outline"
                className="w-full justify-center md:justify-start text-sm"
                onClick={() => router.push('/admin/analytics')}
                style={{ minHeight: '44px' }}
              >
                <BarChart3Icon className="w-4 h-4 md:mr-2" />
                <span className="hidden md:inline">Analytics</span>
              </Button>
              <Button
                variant="outline"
                className="w-full justify-center md:justify-start text-sm"
                onClick={() => router.push('/admin/services')}
                style={{ minHeight: '44px' }}
              >
                <EditIcon className="w-4 h-4 md:mr-2" />
                <span className="hidden md:inline">Services</span>
              </Button>
            </div>
          </div>

          <div className="bg-surface-secondary rounded-lg border border-border-primary p-4 sm:p-6">
            <h3 className="text-lg font-semibold text-text-primary mb-4">Alerts</h3>
            <div className="space-y-3">
              {stats && stats.requiresAction.pending > 0 && (
                <div className="flex items-start p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                  <AlertCircleIcon className="w-5 h-5 text-yellow-600 mr-3 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="text-sm font-medium text-yellow-800">
                      {stats.requiresAction.pending} booking{stats.requiresAction.pending > 1 ? 's' : ''} pending confirmation
                    </p>
                  </div>
                </div>
              )}
              {stats && stats.requiresAction.rescheduleRequests > 0 && (
                <div className="flex items-start p-3 bg-purple-50 border border-purple-200 rounded-lg">
                  <ClockIcon className="w-5 h-5 text-purple-600 mr-3 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="text-sm font-medium text-purple-800">
                      {stats.requiresAction.rescheduleRequests} reschedule request{stats.requiresAction.rescheduleRequests > 1 ? 's' : ''} awaiting response
                    </p>
                  </div>
                </div>
              )}
              {(!stats || (stats.requiresAction.pending === 0 && stats.requiresAction.rescheduleRequests === 0)) && (
                <div className="flex items-start p-3 bg-blue-50 border border-blue-200 rounded-lg">
                  <CheckCircleIcon className="w-5 h-5 text-blue-600 mr-3 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="text-sm font-medium text-blue-800">
                      All systems operational
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>

          <div className="bg-surface-secondary rounded-lg border border-border-primary p-4 sm:p-6">
            <h3 className="text-lg font-semibold text-text-primary mb-4">Recent Activity</h3>
            <div className="space-y-3 text-sm">
              <div className="flex items-center text-text-secondary">
                <div className="w-2 h-2 bg-green-500 rounded-full mr-3 flex-shrink-0"></div>
                <span>New booking received</span>
              </div>
              <div className="flex items-center text-text-secondary">
                <div className="w-2 h-2 bg-blue-500 rounded-full mr-3 flex-shrink-0"></div>
                <span>Service completed</span>
              </div>
              <div className="flex items-center text-text-secondary">
                <div className="w-2 h-2 bg-purple-500 rounded-full mr-3 flex-shrink-0"></div>
                <span>Customer registered</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </AdminLayout>
  )
}

export default function AdminPage() {
  return (
    <AdminRoute>
      <AdminDashboard />
    </AdminRoute>
  )
}
