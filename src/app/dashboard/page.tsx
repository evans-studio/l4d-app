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
import { Card, CardContent, CardHeader } from '@/components/ui/composites/Card'
import { ArrowRight, Calendar, Car, MapPin, Star, AlertCircle, RefreshCw } from 'lucide-react'

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
  const [vehicleCount, setVehicleCount] = useState<number>(0)
  const [addressCount, setAddressCount] = useState<number>(0)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchDashboardData = async () => {
      if (authLoading || !user) {
        return
      }

      try {
        setError(null) // Clear any previous errors
        
        // Fetch bookings, vehicles, and addresses in parallel
        const [bookingsResponse, vehiclesResponse, addressesResponse] = await Promise.all([
          fetch('/api/customer/bookings', {
            credentials: 'include',
            headers: {
              'Content-Type': 'application/json',
            }
          }),
          fetch('/api/customer/vehicles', {
            credentials: 'include',
            headers: {
              'Content-Type': 'application/json',
            }
          }),
          fetch('/api/customer/addresses', {
            credentials: 'include',
            headers: {
              'Content-Type': 'application/json',
            }
          })
        ])
        
        // Handle authentication for all requests
        if (!bookingsResponse.ok || !vehiclesResponse.ok || !addressesResponse.ok) {
          if (bookingsResponse.status === 401 || vehiclesResponse.status === 401 || addressesResponse.status === 401) {
            console.warn('User not authenticated, redirecting to login')
            router.push('/auth/login')
            return
          }
          throw new Error(`HTTP error! Bookings: ${bookingsResponse.status}, Vehicles: ${vehiclesResponse.status}, Addresses: ${addressesResponse.status}`)
        }
        
        const [bookingsData, vehiclesData, addressesData] = await Promise.all([
          bookingsResponse.json(),
          vehiclesResponse.json(),
          addressesResponse.json()
        ])
        
        // Process bookings
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

        // Process vehicles
        if (vehiclesData.success) {
          const vehiclesArray = vehiclesData.data || []
          setVehicleCount(vehiclesArray.length)
        } else {
          console.warn('Vehicles API returned error:', vehiclesData.error)
          setVehicleCount(0)
        }

        // Process addresses
        if (addressesData.success) {
          const addressesArray = addressesData.data || []
          setAddressCount(addressesArray.length)
        } else {
          console.warn('Addresses API returned error:', addressesData.error)
          setAddressCount(0)
        }

      } catch (error) {
        console.error('Dashboard data error:', error)
        setError('Unable to load dashboard data. Please try refreshing the page.')
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

  // Error state
  if (error) {
    return (
      <CustomerRoute>
        <CustomerLayout>
          <Container>
            <div className="flex items-center justify-center py-20">
              <Card className="max-w-md w-full">
                <CardContent className="text-center py-8">
                  <AlertCircle className="w-12 h-12 text-error-500 mx-auto mb-4" />
                  <h2 className="text-lg font-semibold text-text-primary mb-2">
                    Unable to Load Dashboard
                  </h2>
                  <p className="text-text-secondary mb-6">
                    {error}
                  </p>
                  <Button
                    onClick={() => window.location.reload()}
                    variant="primary"
                    size="md"
                    className="min-h-[48px] touch-manipulation"
                    leftIcon={<RefreshCw className="w-4 h-4" />}
                    fullWidth
                  >
                    Refresh Page
                  </Button>
                </CardContent>
              </Card>
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
          <div className="mb-6 sm:mb-8">
            <h1 className="text-2xl sm:text-3xl font-bold text-text-primary mb-1">
              My Dashboard
            </h1>
            {profile && (
              <p className="text-text-secondary text-sm sm:text-base">
                {bookings.length === 0 ? `Welcome to Love 4 Detailing, ${profile.first_name || 'Customer'}!` : `Welcome back, ${profile.first_name || 'Customer'}`}
              </p>
            )}
          </div>

          {/* New User Welcome Experience - Show only when no bookings AND no vehicles AND no addresses */}
          {bookings.length === 0 && vehicleCount === 0 && addressCount === 0 && (
            <div className="mb-8">
              <Card className="border-2 border-brand-400/30 bg-gradient-to-br from-brand-600/5 to-brand-400/5">
                <CardHeader>
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 bg-brand-600 rounded-full flex items-center justify-center">
                      <Star className="w-6 h-6 text-white" />
                    </div>
                    <div>
                      <h2 className="text-xl font-bold text-text-primary">
                        Your Account is Ready!
                      </h2>
                      <p className="text-text-secondary">
                        Start your premium car detailing journey
                      </p>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-6">
                    <p className="text-text-secondary">
                      Welcome to Love 4 Detailing! Your account has been successfully created. 
                      Now you can book professional mobile car detailing services, manage your appointments, 
                      and enjoy our premium service experience.
                    </p>
                    
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                      <div className="flex items-start gap-3 p-4 bg-surface-secondary rounded-lg">
                        <Calendar className="w-5 h-5 text-brand-600 mt-0.5" />
                        <div>
                          <h4 className="font-medium text-text-primary text-sm">Easy Booking</h4>
                          <p className="text-xs text-text-muted">Schedule services at your convenience</p>
                        </div>
                      </div>
                      <div className="flex items-start gap-3 p-4 bg-surface-secondary rounded-lg">
                        <Car className="w-5 h-5 text-brand-600 mt-0.5" />
                        <div>
                          <h4 className="font-medium text-text-primary text-sm">Vehicle Management</h4>
                          <p className="text-xs text-text-muted">Save multiple vehicles for quick booking</p>
                        </div>
                      </div>
                      <div className="flex items-start gap-3 p-4 bg-surface-secondary rounded-lg">
                        <MapPin className="w-5 h-5 text-brand-600 mt-0.5" />
                        <div>
                          <h4 className="font-medium text-text-primary text-sm">Mobile Service</h4>
                          <p className="text-xs text-text-muted">We come to your location</p>
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex flex-col gap-3">
                      <Button
                        onClick={() => router.push('/book')}
                        size="lg"
                        className="bg-brand-600 hover:bg-brand-700 min-h-[48px]"
                        rightIcon={<ArrowRight className="w-4 h-4" />}
                        fullWidth
                      >
                        Book Your First Service
                      </Button>
                      <Button
                        onClick={() => router.push('/dashboard/vehicles')}
                        variant="outline"
                        size="lg"
                        className="min-h-[48px]"
                        fullWidth
                      >
                        Add Your Vehicle
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}

          {/* User has vehicles/addresses but no bookings - encourage first booking */}
          {bookings.length === 0 && (vehicleCount > 0 || addressCount > 0) && (
            <div className="mb-8">
              <Card className="border-2 border-brand-400/30 bg-gradient-to-br from-brand-600/5 to-brand-400/5">
                <CardHeader>
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 bg-brand-600 rounded-full flex items-center justify-center">
                      <Calendar className="w-6 h-6 text-white" />
                    </div>
                    <div>
                      <h2 className="text-xl font-bold text-text-primary">
                        Ready for Your First Service!
                      </h2>
                      <p className="text-text-secondary">
                        You've set up your {vehicleCount > 0 && addressCount > 0 ? 'account' : vehicleCount > 0 ? 'vehicle' + (vehicleCount > 1 ? 's' : '') : 'address' + (addressCount > 1 ? 'es' : '')} - time to book your first detail
                      </p>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <p className="text-text-secondary">
                      Great! You have {vehicleCount > 0 ? `${vehicleCount} vehicle${vehicleCount > 1 ? 's' : ''}` : ''}
                      {vehicleCount > 0 && addressCount > 0 ? ' and ' : ''}
                      {addressCount > 0 ? `${addressCount} address${addressCount > 1 ? 'es' : ''}` : ''} saved to your account. 
                      Now you can book our professional mobile car detailing services with just a few clicks.
                    </p>
                    
                    <Button
                      onClick={() => router.push('/book')}
                      size="lg"
                      className="bg-brand-600 hover:bg-brand-700 min-h-[48px]"
                      rightIcon={<ArrowRight className="w-4 h-4" />}
                      fullWidth
                    >
                      Book Your First Service
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}

          {/* Dashboard Widgets Grid - Mobile First Responsive */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 lg:gap-6 mb-8">
            {/* Top Row - Next Booking & Quick Rebook */}
            <NextBookingWidget booking={nextBooking} />
            <QuickRebookWidget lastBooking={lastCompletedBooking} />
            
            {/* Bottom Row - Stats & Recent Activity */}
            {customerStats && (
              <BookingStatsWidget stats={customerStats} />
            )}
            <RecentActivityWidget recentBookings={recentBookings} />
          </div>

        </Container>
      </CustomerLayout>
    </CustomerRoute>
  )
}