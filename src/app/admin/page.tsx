'use client'

import { useEffect, useState, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { useSessionRefresh } from '@/lib/hooks/useSessionRefresh'
import { Button } from '@/components/ui/primitives/Button'
import { Card, CardContent, CardGrid } from '@/components/ui/composites/Card'
import { AdminLayout } from '@/components/layouts/AdminLayout'
import { AdminRoute } from '@/components/ProtectedRoute'
import { BookingCard } from '@/components/admin/BookingCard'
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
  AlertTriangleIcon,
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


// Mobile Widget Carousel Component
interface MobileWidgetCarouselProps {
  stats: AdminStats
  router: any
}

function MobileWidgetCarousel({ stats, router }: MobileWidgetCarouselProps) {
  const [currentIndex, setCurrentIndex] = useState(0)
  const [isScrolling, setIsScrolling] = useState(false)
  const scrollRef = useRef<HTMLDivElement>(null)
  const touchStartX = useRef<number>(0)
  const touchEndX = useRef<number>(0)

  // Update current index based on scroll position
  const handleScroll = () => {
    if (!scrollRef.current) return
    
    const container = scrollRef.current
    const scrollLeft = container.scrollLeft
    const slideWidth = container.clientWidth
    const newIndex = Math.round(scrollLeft / slideWidth)
    
    if (newIndex !== currentIndex && newIndex >= 0 && newIndex < totalWidgets) {
      setCurrentIndex(newIndex)
    }
  }

  // Order widgets by priority: Requiring Action (if > 0), Today, Tomorrow, This Week
  const getWidgetOrder = () => {
    const widgets = []
    
    // Priority 1: Requiring Action (only if there are items requiring action)
    if (stats.requiresAction.total > 0) {
      widgets.push('requiresAction')
    }
    
    // Priority 2: Today's Schedule
    widgets.push('today')
    
    // Priority 3: Tomorrow
    widgets.push('tomorrow')
    
    // Priority 4: This Week
    widgets.push('thisWeek')
    
    return widgets
  }

  const widgetOrder = getWidgetOrder()
  const totalWidgets = widgetOrder.length

  const goToSlide = (index: number) => {
    if (isScrolling) return
    setCurrentIndex(index)
    if (scrollRef.current) {
      const container = scrollRef.current
      const slideWidth = container.clientWidth
      container.scrollTo({
        left: slideWidth * index,
        behavior: 'smooth'
      })
    }
  }

  const goToNext = () => {
    const nextIndex = (currentIndex + 1) % totalWidgets
    goToSlide(nextIndex)
  }

  const goToPrev = () => {
    const prevIndex = currentIndex === 0 ? totalWidgets - 1 : currentIndex - 1
    goToSlide(prevIndex)
  }

  // Touch handlers for swipe gestures
  const handleTouchStart = (e: React.TouchEvent) => {
    setIsScrolling(true)
    if (e.touches[0]) {
      touchStartX.current = e.touches[0].clientX
    }
  }

  const handleTouchMove = (e: React.TouchEvent) => {
    if (e.touches[0]) {
      touchEndX.current = e.touches[0].clientX
    }
  }

  const handleTouchEnd = () => {
    setIsScrolling(false)
    const difference = touchStartX.current - touchEndX.current
    const threshold = 50 // minimum swipe distance

    if (Math.abs(difference) > threshold) {
      if (difference > 0) {
        goToNext() // Swipe left - go to next
      } else {
        goToPrev() // Swipe right - go to previous
      }
    }
  }

  const renderWidget = (widgetType: string) => {
    const baseClasses = "bg-surface-secondary rounded-lg border border-border-primary p-4 w-full h-44 flex flex-col justify-between"
    
    switch (widgetType) {
      case 'requiresAction':
        return (
          <div className={baseClasses}>
            <div className="flex items-center justify-between mb-4">
              <div>
                <p className="text-text-secondary text-sm font-medium">Requiring Action</p>
                <p className="text-2xl font-bold text-text-primary">
                  {stats.requiresAction.total}
                </p>
              </div>
              <AlertTriangleIcon className="w-8 h-8 text-orange-500" />
            </div>
            <div className="space-y-2">
              <div className="text-sm">
                <span className="text-orange-600 font-medium">{stats.requiresAction.pending} pending bookings</span>
              </div>
              {stats.requiresAction.rescheduleRequests > 0 && (
                <div className="text-sm">
                  <span className="text-purple-600 font-medium">{stats.requiresAction.rescheduleRequests} reschedule requests</span>
                </div>
              )}
              {stats.requiresAction.toConfirm > 0 && (
                <div className="text-sm">
                  <span className="text-blue-600 font-medium">{stats.requiresAction.toConfirm} to confirm</span>
                </div>
              )}
              <Button 
                onClick={() => router.push('/admin/bookings')}
                variant="primary"
                size="md" 
                className="w-full min-h-[48px] touch-manipulation"
              >
                Take Action
              </Button>
            </div>
          </div>
        )

      case 'today':
        return (
          <div className={baseClasses}>
            <div className="flex items-center justify-between mb-4">
              <div>
                <p className="text-text-secondary text-sm font-medium">Today's Schedule</p>
                <p className="text-2xl font-bold text-text-primary">
                  {stats.today.booked} of {stats.today.capacity}
                </p>
              </div>
              <CalendarIcon className="w-8 h-8 text-brand-purple" />
            </div>
            <div className="space-y-2">
              <div className="text-sm">
                <span className="text-text-primary font-medium">{stats.today.remaining} remaining</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div 
                  className="bg-brand-purple h-2 rounded-full transition-all duration-300" 
                  style={{ width: `${stats.today.utilizationPercent}%` }}
                ></div>
              </div>
              <Button 
                onClick={() => router.push('/admin/schedule')}
                variant="outline" 
                size="md" 
                className="w-full min-h-[48px] touch-manipulation"
              >
                View Schedule
              </Button>
            </div>
          </div>
        )

      case 'tomorrow':
        return (
          <div className={baseClasses}>
            <div className="flex items-center justify-between mb-4">
              <div>
                <p className="text-text-secondary text-sm font-medium">Tomorrow</p>
                <p className="text-2xl font-bold text-text-primary">
                  {stats.tomorrow.booked} of {stats.tomorrow.capacity}
                </p>
              </div>
              <ClockIcon className="w-8 h-8 text-blue-600" />
            </div>
            <div className="space-y-2">
              {stats.tomorrow.fullyBooked ? (
                <div className="text-sm">
                  <span className="text-red-600 font-bold">FULLY BOOKED</span>
                </div>
              ) : (
                <div className="text-sm">
                  <span className="text-text-primary font-medium">{stats.tomorrow.remaining} remaining</span>
                </div>
              )}
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div 
                  className={`h-2 rounded-full transition-all duration-300 ${
                    stats.tomorrow.fullyBooked ? 'bg-red-500' : 'bg-blue-500'
                  }`}
                  style={{ width: `${stats.tomorrow.utilizationPercent}%` }}
                ></div>
              </div>
              <Button 
                onClick={() => router.push('/admin/schedule')}
                variant="outline" 
                size="md" 
                className="w-full min-h-[48px] touch-manipulation"
              >
                View Day
              </Button>
            </div>
          </div>
        )

      case 'thisWeek':
        return (
          <div className={baseClasses}>
            <div className="flex items-center justify-between mb-4">
              <div>
                <p className="text-text-secondary text-sm font-medium">This Week</p>
                <p className="text-2xl font-bold text-text-primary">
                  {stats.thisWeek.booked} of {stats.thisWeek.capacity}
                </p>
              </div>
              <TrendingUpIcon className="w-8 h-8 text-green-600" />
            </div>
            <div className="space-y-2">
              <div className="text-sm">
                <span className="text-green-600 font-medium">£{stats.thisWeek.revenue.toLocaleString()} revenue</span>
              </div>
              <div className="text-sm">
                <span className="text-text-secondary">{stats.thisWeek.utilizationPercent}% utilized</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div 
                  className="bg-green-500 h-2 rounded-full transition-all duration-300" 
                  style={{ width: `${stats.thisWeek.utilizationPercent}%` }}
                ></div>
              </div>
            </div>
          </div>
        )

      default:
        return null
    }
  }

  return (
    <div className="mobile-widget-carousel w-full max-w-full overflow-hidden">
      {/* Swipe hint text */}
      <div className="text-center mb-3">
        <p className="text-text-secondary text-xs font-medium">← Swipe between widgets →</p>
      </div>

      {/* Widget carousel container - Mobile optimized */}
      <div className="w-full overflow-hidden">
        <div 
          className="flex overflow-x-auto scrollbar-hide snap-x snap-mandatory"
          ref={scrollRef}
          onScroll={handleScroll}
          onTouchStart={handleTouchStart}
          onTouchMove={handleTouchMove}
          onTouchEnd={handleTouchEnd}
          style={{ 
            scrollbarWidth: 'none', 
            msOverflowStyle: 'none',
            WebkitOverflowScrolling: 'touch',
            scrollSnapType: 'x mandatory'
          }}
        >
          {widgetOrder.map((widgetType, index) => (
            <div 
              key={widgetType} 
              className="mobile-widget-item snap-center flex-shrink-0 w-full min-w-full max-w-full"
            >
              {renderWidget(widgetType)}
            </div>
          ))}
        </div>
      </div>

      {/* Dot indicators */}
      <div className="flex justify-center mt-4 space-x-2">
        {widgetOrder.map((_, index) => (
          <button
            key={index}
            onClick={() => goToSlide(index)}
            className={`rounded-full transition-all duration-200 touch-manipulation ${
              index === currentIndex 
                ? 'bg-brand-purple w-6 h-2' 
                : 'bg-gray-300 hover:bg-gray-400 w-2 h-2'
            }`}
            style={{ minHeight: '44px', minWidth: '44px' }}
            aria-label={`Go to widget ${index + 1}`}
          />
        ))}
      </div>
    </div>
  )
}

function AdminDashboard() {
  const router = useRouter()
  const { refreshSession, isRefreshing } = useSessionRefresh()
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

      console.log('Loading admin dashboard data...')

      // Load stats first
      console.log('Fetching stats...')
      const statsResponse = await fetch('/api/admin/stats')
      console.log('Stats response status:', statsResponse.status)
      
      if (statsResponse.status === 401) {
        console.log('Got 401 error on stats, attempting session refresh...')
        const refreshSuccess = await refreshSession()
        
        if (refreshSuccess) {
          console.log('Session refreshed, retrying stats request...')
          const retryStatsResponse = await fetch('/api/admin/stats')
          
          if (retryStatsResponse.ok) {
            const retryStatsData = await retryStatsResponse.json()
            if (retryStatsData.success) {
              setStats(retryStatsData.data)
              console.log('Stats loaded successfully after retry')
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
          console.log('Stats loaded successfully')
        } else {
          console.error('Stats API returned error:', statsData.error)
        }
      } else {
        throw new Error(`Stats request failed with status: ${statsResponse.status}`)
      }

      // Load recent bookings
      console.log('Fetching recent bookings...')
      const bookingsResponse = await fetch('/api/admin/bookings/recent')
      console.log('Bookings response status:', bookingsResponse.status)
      
      if (bookingsResponse.status === 401) {
        console.log('Got 401 error on bookings, attempting session refresh...')
        const refreshSuccess = await refreshSession()
        
        if (refreshSuccess) {
          console.log('Session refreshed, retrying bookings request...')
          const retryBookingsResponse = await fetch('/api/admin/bookings/recent')
          
          if (retryBookingsResponse.ok) {
            const retryBookingsData = await retryBookingsResponse.json()
            if (retryBookingsData.success) {
              setRecentBookings(retryBookingsData.data.bookings || [])
              console.log('Bookings loaded successfully after retry:', retryBookingsData.data.bookings?.length || 0)
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
          console.log('Bookings loaded successfully:', bookingsData.data.bookings?.length || 0)
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

        {/* Operational Dashboard Widgets - Using Component Library */}
        {stats && (
          <CardGrid 
            columns={{ mobile: 1, tablet: 2, desktop: 4 }} 
            gap="md"
            className="w-full"
          >
            {/* Requiring Action Widget - Priority #1 */}
            {stats.requiresAction.total > 0 && (
              <Card variant="default" size="md">
                <CardContent>
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <p className="text-text-secondary text-sm font-medium">Requiring Action</p>
                      <p className="text-2xl font-bold text-text-primary">
                        {stats.requiresAction.total}
                      </p>
                    </div>
                    <AlertTriangleIcon className="w-8 h-8 text-orange-500" />
                  </div>
                  <div className="space-y-2">
                    <div className="text-sm">
                      <span className="text-orange-600 font-medium">{stats.requiresAction.pending} pending bookings</span>
                    </div>
                    {stats.requiresAction.rescheduleRequests > 0 && (
                      <div className="text-sm">
                        <span className="text-purple-600 font-medium">{stats.requiresAction.rescheduleRequests} reschedule requests</span>
                      </div>
                    )}
                    {stats.requiresAction.toConfirm > 0 && (
                      <div className="text-sm">
                        <span className="text-blue-600 font-medium">{stats.requiresAction.toConfirm} to confirm</span>
                      </div>
                    )}
                    <div className="space-y-3">
                      <Button 
                        onClick={() => router.push('/admin/bookings')}
                        variant="primary"
                        size="md" 
                        className="w-full min-h-[48px] touch-manipulation"
                      >
                        Manage Bookings
                      </Button>
                      {stats.requiresAction.rescheduleRequests > 0 && (
                        <Button 
                          onClick={() => router.push('/admin/reschedule-requests')}
                          variant="outline"
                          size="md" 
                          className="w-full min-h-[48px] touch-manipulation"
                        >
                          View Reschedule Requests
                        </Button>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Today's Schedule Widget - Priority #2 */}
            <Card variant="default" size="md">
              <CardContent>
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <p className="text-text-secondary text-sm font-medium">Today's Schedule</p>
                    <p className="text-2xl font-bold text-text-primary">
                      {stats.today.booked} of {stats.today.capacity}
                    </p>
                  </div>
                  <CalendarIcon className="w-8 h-8 text-brand-purple" />
                </div>
                <div className="space-y-2">
                  <div className="text-sm">
                    <span className="text-text-primary font-medium">{stats.today.remaining} remaining</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div 
                      className="bg-brand-purple h-2 rounded-full transition-all duration-300" 
                      style={{ width: `${stats.today.utilizationPercent}%` }}
                    ></div>
                  </div>
                  <Button 
                    onClick={() => router.push('/admin/schedule')}
                    variant="outline" 
                    size="md" 
                    className="w-full min-h-[48px] touch-manipulation"
                  >
                    View Schedule
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Tomorrow Widget - Priority #3 */}
            <Card variant="default" size="md">
              <CardContent>
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <p className="text-text-secondary text-sm font-medium">Tomorrow</p>
                    <p className="text-2xl font-bold text-text-primary">
                      {stats.tomorrow.booked} of {stats.tomorrow.capacity}
                    </p>
                  </div>
                  <ClockIcon className="w-8 h-8 text-blue-600" />
                </div>
                <div className="space-y-2">
                  {stats.tomorrow.fullyBooked ? (
                    <div className="text-sm">
                      <span className="text-red-600 font-bold">FULLY BOOKED</span>
                    </div>
                  ) : (
                    <div className="text-sm">
                      <span className="text-text-primary font-medium">{stats.tomorrow.remaining} remaining</span>
                    </div>
                  )}
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div 
                      className={`h-2 rounded-full transition-all duration-300 ${
                        stats.tomorrow.fullyBooked ? 'bg-red-500' : 'bg-blue-500'
                      }`}
                      style={{ width: `${stats.tomorrow.utilizationPercent}%` }}
                    ></div>
                  </div>
                  <Button 
                    onClick={() => router.push('/admin/schedule')}
                    variant="outline" 
                    size="md" 
                    className="w-full min-h-[48px] touch-manipulation"
                  >
                    View Day
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* This Week Widget - Priority #4 */}
            <Card variant="default" size="md">
              <CardContent>
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <p className="text-text-secondary text-sm font-medium">This Week</p>
                    <p className="text-2xl font-bold text-text-primary">
                      {stats.thisWeek.booked} of {stats.thisWeek.capacity}
                    </p>
                  </div>
                  <TrendingUpIcon className="w-8 h-8 text-green-600" />
                </div>
                <div className="space-y-2">
                  <div className="text-sm">
                    <span className="text-green-600 font-medium">£{stats.thisWeek.revenue.toLocaleString()} revenue</span>
                  </div>
                  <div className="text-sm">
                    <span className="text-text-secondary">{stats.thisWeek.utilizationPercent}% utilized</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div 
                      className="bg-green-500 h-2 rounded-full transition-all duration-300" 
                      style={{ width: `${stats.thisWeek.utilizationPercent}%` }}
                    ></div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </CardGrid>
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
