'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/lib/auth-compat'
import { useBookingFlowStore } from '@/lib/store/bookingFlowStore'
import { Button } from '@/components/ui/primitives/Button'
import { CustomerLayout } from '@/components/layout/templates/CustomerLayout'
import { Container } from '@/components/layout/templates/PageLayout'
import { CustomerRoute } from '@/components/ProtectedRoute'
import { NextBookingWidget } from '@/components/customer/widgets/NextBookingWidget'
import { QuickRebookWidget } from '@/components/customer/widgets/QuickRebookWidget'
import { BookingStatsWidget } from '@/components/customer/widgets/BookingStatsWidget'
import { RecentActivityWidget } from '@/components/customer/widgets/RecentActivityWidget'
import { Plus } from 'lucide-react'

interface DashboardBooking {
  id: string
  booking_reference: string
  scheduled_date: string
  scheduled_start_time: string
  status: 'pending' | 'confirmed' | 'in_progress' | 'completed' | 'cancelled'
  total_price: number
  service: {
    name: string
    short_description?: string
    category?: string
  } | null
  booking_services: Array<{
    service_details: any
    price: number
    estimated_duration: number
  }>
  vehicle: {
    make: string
    model: string
    year?: number
    color?: string
    license_plate?: string
    vehicle_size?: {
      name: string
      price_multiplier: number
    }
  } | null
  address: {
    address_line_1: string
    address_line_2?: string
    city: string
    county?: string
    postal_code: string
    country?: string
    distance_from_business?: number
  } | null
}

interface CustomerStats {
  totalBookings: number
  memberSince: string
  totalSpent: number
  favoriteService?: {
    name: string
    count: number
  }
}

export default function DashboardPage() {
  const router = useRouter()
  const { user, profile, isLoading: authLoading } = useAuth()
  const { initializeRebooking } = useBookingFlowStore()
  
  const [bookings, setBookings] = useState<DashboardBooking[]>([])
  const [customerStats, setCustomerStats] = useState<CustomerStats | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const fetchDashboardData = async () => {
      if (authLoading || !user) {
        return
      }

      try {
        // Fetch bookings with credentials to include cookies
        const bookingsResponse = await fetch('/api/customer/bookings', {
          credentials: 'include',
          headers: {
            'Content-Type': 'application/json',
          }
        })
        
        if (!bookingsResponse.ok) {
          if (bookingsResponse.status === 401) {
            console.warn('User not authenticated, redirecting to login')
            router.push('/auth/login')
            return
          }
          throw new Error(`HTTP error! status: ${bookingsResponse.status}`)
        }
        
        const bookingsData = await bookingsResponse.json()
        
        if (bookingsData.success) {
          const bookingsArray = bookingsData.data || []
          setBookings(bookingsArray)

          // Calculate customer stats
          const totalSpent = bookingsArray.reduce((sum: number, booking: any) => sum + (booking.total_price || 0), 0)
          
          // Find favorite service
          const serviceCount: Record<string, number> = {}
          bookingsArray.forEach((booking: any) => {
            if (booking.service?.name) {
              serviceCount[booking.service.name] = (serviceCount[booking.service.name] || 0) + 1
            }
          })
          
          const favoriteService = Object.entries(serviceCount).length > 0 
            ? Object.entries(serviceCount).reduce((a, b) => a[1] > b[1] ? a : b)
            : null

          setCustomerStats({
            totalBookings: bookingsArray.length,
            memberSince: profile?.created_at || new Date().toISOString(),
            totalSpent,
            favoriteService: favoriteService ? {
              name: favoriteService[0],
              count: favoriteService[1]
            } : undefined
          })
        } else {
          console.warn('Bookings API returned error:', bookingsData.error)
          // Don't treat this as an error if it's just auth - redirect to login
          if (bookingsData.error?.code === 'UNAUTHORIZED') {
            // User is not authenticated, redirect to login
            router.push('/auth/login')
            return
          }
          setBookings([])
          setCustomerStats(null)
        }

      } catch (error) {
        console.error('Dashboard data error:', error)
        setBookings([])
        setCustomerStats(null)
      } finally {
        setIsLoading(false)
      }
    }

    fetchDashboardData()
  }, [user, authLoading, profile])

  // Find next upcoming booking
  const nextBooking = bookings
    .filter(booking => ['pending', 'confirmed', 'in_progress'].includes(booking.status))
    .sort((a, b) => new Date(`${a.scheduled_date}T${a.scheduled_start_time}`).getTime() - new Date(`${b.scheduled_date}T${b.scheduled_start_time}`).getTime())
    [0]

  // Find last completed booking for quick rebook
  const lastCompletedBooking = bookings
    .filter(booking => booking.status === 'completed')
    .sort((a, b) => new Date(b.scheduled_date).getTime() - new Date(a.scheduled_date).getTime())
    [0]

  // Recent bookings for activity widget
  const recentBookings = bookings
    .sort((a, b) => new Date(b.scheduled_date).getTime() - new Date(a.scheduled_date).getTime())
    .slice(0, 5)

  if (authLoading || isLoading) {
    return (
      <CustomerRoute>
        <CustomerLayout>
          <Container>
            <div className="flex items-center justify-center py-20">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-brand-600"></div>
            </div>
          </Container>
        </CustomerLayout>
      </CustomerRoute>
    )
  }

  return (
    <CustomerRoute>
      <CustomerLayout>
        <Container>
          {/* Header - Mobile First Responsive */}
          <div className="flex flex-col space-y-4 sm:flex-row sm:items-center sm:justify-between sm:space-y-0 mb-6 sm:mb-8">
            <div className="flex-1">
              <h1 className="text-2xl sm:text-3xl font-bold text-text-primary mb-1">
                My Dashboard
              </h1>
              {profile && (
                <p className="text-text-secondary text-sm sm:text-base">
                  Welcome back, {profile.first_name || 'Customer'}
                </p>
              )}
            </div>
            
            <Button
              variant="primary"
              onClick={() => router.push('/book')}
              leftIcon={<Plus className="w-4 h-4" />}
              className="w-full sm:w-auto"
            >
              <span className="sm:hidden">Book Service</span>
              <span className="hidden sm:inline">New Booking</span>
            </Button>
          </div>

          {/* Dashboard Widgets Grid - Mobile First Responsive */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
            {/* Top Row - Next Booking & Quick Rebook */}
            <NextBookingWidget booking={nextBooking} />
            <QuickRebookWidget lastBooking={lastCompletedBooking} />
            
            {/* Bottom Row - Stats & Recent Activity */}
            {customerStats && (
              <BookingStatsWidget stats={customerStats} />
            )}
            <RecentActivityWidget recentBookings={recentBookings} />
          </div>

          {/* Quick Navigation - Mobile First */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <Button
              variant="outline"
              onClick={() => router.push('/dashboard/bookings')}
              className="h-16 flex flex-col items-center justify-center gap-1"
            >
              <span className="text-xs font-medium">All Bookings</span>
              <span className="text-lg font-bold text-brand-400">{bookings.length}</span>
            </Button>
            
            <Button
              variant="outline"
              onClick={() => router.push('/dashboard/vehicles')}
              className="h-16 flex flex-col items-center justify-center gap-1"
            >
              <span className="text-xs font-medium">Vehicles</span>
              <span className="text-sm text-text-secondary">Saved</span>
            </Button>
            
            <Button
              variant="outline"
              onClick={() => router.push('/dashboard/addresses')}
              className="h-16 flex flex-col items-center justify-center gap-1"
            >
              <span className="text-xs font-medium">Addresses</span>
              <span className="text-sm text-text-secondary">Saved</span>
            </Button>
            
            <Button
              variant="outline"
              onClick={() => router.push('/dashboard/profile')}
              className="h-16 flex flex-col items-center justify-center gap-1"
            >
              <span className="text-xs font-medium">Profile</span>
              <span className="text-sm text-text-secondary">Settings</span>
            </Button>
          </div>
        </Container>
      </CustomerLayout>
    </CustomerRoute>
  )
}