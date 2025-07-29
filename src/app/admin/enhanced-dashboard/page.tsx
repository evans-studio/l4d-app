'use client'

import { useEffect, useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { AdminLayout } from '@/components/layouts/AdminLayout'
import { AdminRoute } from '@/components/ProtectedRoute'
import { Button } from '@/components/ui/primitives/Button'
import {
  MetricCard,
  SimpleChart,
  RecentActivity,
  QuickStats,
  BookingCalendar,
  PerformanceTrends
} from '@/components/admin/widgets'
import { 
  CalendarIcon, 
  DollarSignIcon, 
  UsersIcon, 
  TrendingUpIcon,
  PlusIcon,
  SettingsIcon,
  BarChart3Icon,
  ClockIcon
} from 'lucide-react'

interface DashboardData {
  stats: {
    totalBookings: number
    pendingBookings: number
    confirmedBookings: number
    completedBookings: number
    totalRevenue: number
    monthlyRevenue: number
    totalCustomers: number
    activeCustomers: number
    todayBookings: number
    todayRevenue: number
    completionRate: number
    avgRating: number
    totalServices: number
    responseTime: string
  }
  recentActivity: Array<{
    id: string
    type: 'booking_created' | 'booking_confirmed' | 'booking_cancelled' | 'customer_registered' | 'payment_received' | 'service_completed'
    title: string
    description: string
    timestamp: string
    metadata?: {
      amount?: number
      customerName?: string
      serviceName?: string
      bookingReference?: string
    }
  }>
  bookingEvents: Array<{
    id: string
    title: string
    start: string
    end: string
    status: 'pending' | 'confirmed' | 'in_progress' | 'completed' | 'cancelled'
    customerName: string
    serviceName: string
    address?: string
  }>
  performanceTrends: Array<{
    period: string
    revenue: number
    bookings: number
    customers: number
    rating: number
  }>
  chartData: {
    revenue: Array<{ label: string; value: number }>
    services: Array<{ label: string; value: number }>
    customers: Array<{ label: string; value: number }>
  }
}

function EnhancedAdminDashboard() {
  const router = useRouter()
  const [dashboardData, setDashboardData] = useState<DashboardData | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState('')
  const [refreshing, setRefreshing] = useState(false)
  const [selectedPeriod, setSelectedPeriod] = useState<'week' | 'month' | 'quarter' | 'year'>('month')

  const loadDashboardData = useCallback(async () => {
    try {
      const isInitialLoad = !dashboardData
      if (isInitialLoad) {
        setIsLoading(true)
      } else {
        setRefreshing(true)
      }
      setError('')

      // Load multiple data sources in parallel
      const [statsResponse, activitiesResponse, eventsResponse, trendsResponse] = await Promise.all([
        fetch('/api/admin/stats'),
        fetch('/api/admin/recent-activity'),
        fetch('/api/admin/booking-events'),
        fetch(`/api/admin/performance-trends?period=${selectedPeriod}`)
      ])

      // Process responses
      const stats = statsResponse.ok ? (await statsResponse.json()).data : null
      const activities = activitiesResponse.ok ? (await activitiesResponse.json()).data : []
      const events = eventsResponse.ok ? (await eventsResponse.json()).data : []
      const trends = trendsResponse.ok ? (await trendsResponse.json()).data : []

      // Generate some sample chart data (in a real app, this would come from the API)
      const chartData = {
        revenue: [
          { label: 'Jan', value: 12500 },
          { label: 'Feb', value: 15200 },
          { label: 'Mar', value: 18700 },
          { label: 'Apr', value: 16300 },
          { label: 'May', value: 21400 },
          { label: 'Jun', value: 19800 }
        ],
        services: [
          { label: 'Exterior Detail', value: 45 },
          { label: 'Interior Detail', value: 32 },
          { label: 'Full Service', value: 28 },
          { label: 'Paint Correction', value: 15 },
          { label: 'Ceramic Coating', value: 8 }
        ],
        customers: [
          { label: 'New', value: 67 },
          { label: 'Returning', value: 134 },
          { label: 'VIP', value: 23 }
        ]
      }

      setDashboardData({
        stats: stats || {
          totalBookings: 0,
          pendingBookings: 0,
          confirmedBookings: 0,
          completedBookings: 0,
          totalRevenue: 0,
          monthlyRevenue: 0,
          totalCustomers: 0,
          activeCustomers: 0,
          todayBookings: 0,
          todayRevenue: 0,
          completionRate: 0,
          avgRating: 0,
          totalServices: 0,
          responseTime: '0h'
        },
        recentActivity: activities,
        bookingEvents: events,
        performanceTrends: trends,
        chartData
      })

    } catch (error) {
      console.error('Dashboard data error:', error)
      setError('Failed to load dashboard data')
    } finally {
      setIsLoading(false)
      setRefreshing(false)
    }
  }, [selectedPeriod, dashboardData])

  useEffect(() => {
    loadDashboardData()
    
    // Auto-refresh every 5 minutes
    const interval = setInterval(loadDashboardData, 5 * 60 * 1000)
    return () => clearInterval(interval)
  }, [loadDashboardData])

  const handleMetricClick = (metric: string) => {
    // Navigate to detailed view based on metric
    switch (metric) {
      case 'bookings':
        router.push('/admin/bookings')
        break
      case 'revenue':
        router.push('/admin/reports')
        break
      case 'customers':
        router.push('/admin/customers')
        break
      default:
        break
    }
  }

  const handleEventClick = (event: { id: string }) => {
    router.push(`/admin/bookings/${event.id}`)
  }

  const handleDateClick = (date: Date) => {
    router.push(`/admin/schedule/add?date=${date.toISOString().split('T')[0]}`)
  }

  if (isLoading && !dashboardData) {
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
            <h1 className="text-2xl font-bold text-text-primary">Enhanced Dashboard</h1>
            <p className="text-text-secondary mt-2">
              Advanced analytics and real-time business insights
            </p>
            {refreshing && (
              <div className="flex items-center mt-2 text-sm text-brand-purple">
                <div className="animate-spin w-4 h-4 border-2 border-brand-purple border-t-transparent rounded-full mr-2"></div>
                Refreshing data...
              </div>
            )}
          </div>
          <div className="flex space-x-3">
            <Button 
              variant="outline"
              onClick={loadDashboardData}
              disabled={refreshing}
              leftIcon={<ClockIcon className="w-4 h-4" />}
            >
              Refresh
            </Button>
            <Button 
              onClick={() => router.push('/admin/settings')}
              leftIcon={<SettingsIcon className="w-4 h-4" />}
            >
              Settings
            </Button>
          </div>
        </div>

        {error && (
          <div className="p-4 bg-red-50 border border-red-200 rounded-lg text-red-800">
            {error}
          </div>
        )}

        {dashboardData && (
          <>
            {/* Key Metrics Row */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <MetricCard
                title="Total Bookings"
                value={dashboardData.stats.totalBookings}
                change={{
                  value: 12.3,
                  label: 'vs last month',
                  trend: 'up'
                }}
                icon={CalendarIcon}
                iconColor="text-blue-500"
                onClick={() => handleMetricClick('bookings')}
              />
              
              <MetricCard
                title="Monthly Revenue"
                value={`£${dashboardData.stats.monthlyRevenue.toLocaleString()}`}
                change={{
                  value: 8.7,
                  label: 'vs last month',
                  trend: 'up'
                }}
                icon={DollarSignIcon}
                iconColor="text-green-500"
                onClick={() => handleMetricClick('revenue')}
              />
              
              <MetricCard
                title="Active Customers"
                value={dashboardData.stats.activeCustomers}
                change={{
                  value: 5.2,
                  label: 'vs last month',
                  trend: 'up'
                }}
                icon={UsersIcon}
                iconColor="text-purple-500"
                onClick={() => handleMetricClick('customers')}
              />
              
              <MetricCard
                title="Completion Rate"
                value={`${dashboardData.stats.completionRate}%`}
                change={{
                  value: -2.1,
                  label: 'vs last month',
                  trend: 'down'
                }}
                icon={TrendingUpIcon}
                iconColor="text-brand-purple"
              />
            </div>

            {/* Quick Stats Widget */}
            <QuickStats
              stats={dashboardData.stats}
              loading={isLoading}
            />

            {/* Charts and Analytics Row */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <SimpleChart
                title="Monthly Revenue Trend"
                data={dashboardData.chartData.revenue}
                type="area"
                height={300}
                loading={isLoading}
              />
              
              <SimpleChart
                title="Popular Services"
                data={dashboardData.chartData.services}
                type="bar"
                height={300}
                loading={isLoading}
              />
            </div>

            {/* Performance Trends */}
            <PerformanceTrends
              data={dashboardData.performanceTrends}
              period={selectedPeriod}
              onPeriodChange={setSelectedPeriod}
              loading={isLoading}
            />

            {/* Bottom Row - Calendar and Activity */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <BookingCalendar
                events={dashboardData.bookingEvents}
                onEventClick={handleEventClick}
                onDateClick={handleDateClick}
                loading={isLoading}
              />
              
              <RecentActivity
                activities={dashboardData.recentActivity}
                onViewAll={() => router.push('/admin/activity')}
                loading={isLoading}
                maxItems={8}
              />
            </div>

            {/* Customer Distribution Pie Chart */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <SimpleChart
                title="Customer Distribution"
                data={dashboardData.chartData.customers}
                type="pie"
                height={250}
                loading={isLoading}
              />
              
              <div className="lg:col-span-2">
                <SimpleChart
                  title="Revenue vs Bookings"
                  data={dashboardData.chartData.revenue.map((item, index) => ({
                    label: item.label,
                    value: item.value / 100, // Normalize for comparison
                    color: index % 2 === 0 ? 'bg-green-500' : 'bg-blue-500'
                  }))}
                  type="line"
                  height={250}
                  loading={isLoading}
                />
              </div>
            </div>

            {/* Quick Actions */}
            <div className="bg-surface-secondary rounded-lg border border-border-primary p-6">
              <h3 className="text-lg font-semibold text-text-primary mb-4">Quick Actions</h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <Button
                  variant="outline"
                  className="h-20 flex-col"
                  onClick={() => router.push('/admin/schedule/add')}
                >
                  <PlusIcon className="w-6 h-6 mb-2" />
                  Add Time Slots
                </Button>
                <Button
                  variant="outline"
                  className="h-20 flex-col"
                  onClick={() => router.push('/admin/bookings')}
                >
                  <CalendarIcon className="w-6 h-6 mb-2" />
                  Manage Bookings
                </Button>
                <Button
                  variant="outline"
                  className="h-20 flex-col"
                  onClick={() => router.push('/admin/reports')}
                >
                  <BarChart3Icon className="w-6 h-6 mb-2" />
                  View Reports
                </Button>
                <Button
                  variant="outline"
                  className="h-20 flex-col"
                  onClick={() => router.push('/admin/customers')}
                >
                  <UsersIcon className="w-6 h-6 mb-2" />
                  Customer Database
                </Button>
              </div>
            </div>
          </>
        )}
      </div>
    </AdminLayout>
  )
}

export default function EnhancedAdminDashboardWithProtection() {
  return (
    <AdminRoute>
      <EnhancedAdminDashboard />
    </AdminRoute>
  )
}