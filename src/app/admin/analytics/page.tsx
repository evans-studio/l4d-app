'use client'

import { useState, useEffect, useCallback } from 'react'
import { AdminLayout } from '@/components/layouts/AdminLayout'
import { AdminRoute } from '@/components/ProtectedRoute'
import { Button } from '@/components/ui/primitives/Button'
import { 
  TrendingUpIcon,
  TrendingDownIcon,
  DollarSignIcon,
  CalendarIcon,
  UsersIcon,
  MapPinIcon,
  RefreshCwIcon,
  DownloadIcon
} from 'lucide-react'

interface AnalyticsData {
  revenue: {
    total: number
    this_month: number
    last_month: number
    growth_percentage: number
    daily_average: number
    monthly_trend: Array<{
      month: string
      revenue: number
      bookings: number
    }>
  }
  bookings: {
    total: number
    this_month: number
    completion_rate: number
    cancellation_rate: number
    average_value: number
    status_breakdown: {
      pending: number
      confirmed: number
      completed: number
      cancelled: number
    }
  }
  customers: {
    total: number
    new_this_month: number
    retention_rate: number
    average_lifetime_value: number
    repeat_customer_rate: number
  }
  services: {
    most_popular: Array<{
      name: string
      bookings: number
      revenue: number
    }>
    least_popular: Array<{
      name: string
      bookings: number
      revenue: number
    }>
  }
  locations: {
    top_areas: Array<{
      city: string
      bookings: number
      revenue: number
    }>
  }
  performance: {
    busiest_days: Array<{
      day: string
      bookings: number
    }>
    busiest_hours: Array<{
      hour: string
      bookings: number
    }>
    average_job_duration: number
  }
}

interface DateRange {
  start: string
  end: string
  label: string
}

const dateRanges: DateRange[] = [
  {
    start: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0] || '',
    end: new Date().toISOString().split('T')[0] || '',
    label: 'Last 7 days'
  },
  {
    start: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0] || '',
    end: new Date().toISOString().split('T')[0] || '',
    label: 'Last 30 days'
  },
  {
    start: new Date(Date.now() - 90 * 24 * 60 * 60 * 1000).toISOString().split('T')[0] || '',
    end: new Date().toISOString().split('T')[0] || '',
    label: 'Last 3 months'
  },
  {
    start: new Date(new Date().getFullYear(), 0, 1).toISOString().split('T')[0] || '',
    end: new Date().toISOString().split('T')[0] || '',
    label: 'This year'
  }
]

function AdminAnalyticsPage() {
  const [analyticsData, setAnalyticsData] = useState<AnalyticsData | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [selectedRange, setSelectedRange] = useState<DateRange>(() => dateRanges[1] || dateRanges[0] || { start: '', end: '', label: '' }) // Default to last 30 days

  const loadAnalyticsData = useCallback(async () => {
    try {
      setIsLoading(true)
      const ts = Date.now()
      const response = await fetch(`/api/admin/analytics?start=${selectedRange.start}&end=${selectedRange.end}&_ts=${ts}`, { cache: 'no-store' })
      const data = await response.json()
      
      if (data.success) {
        setAnalyticsData(data.data)
      }
    } catch (error) {
      console.error('Failed to load analytics data:', error)
    } finally {
      setIsLoading(false)
    }
  }, [selectedRange])

  useEffect(() => {
    loadAnalyticsData()
  }, [loadAnalyticsData])

  const exportAnalytics = async () => {
    try {
      const ts = Date.now()
      const response = await fetch(`/api/admin/analytics/export?start=${selectedRange.start}&end=${selectedRange.end}&_ts=${ts}`, { cache: 'no-store' })
      if (response.ok) {
        const blob = await response.blob()
        const url = window.URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = `analytics-${selectedRange.start}-to-${selectedRange.end}.csv`
        document.body.appendChild(a)
        a.click()
        window.URL.revokeObjectURL(url)
        document.body.removeChild(a)
      }
    } catch (error) {
      console.error('Export failed:', error)
    }
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-GB', {
      style: 'currency',
      currency: 'GBP'
    }).format(amount)
  }

  const formatPercentage = (value: number) => {
    return `${value >= 0 ? '+' : ''}${value.toFixed(1)}%`
  }

  const getGrowthIcon = (growth: number) => {
    return growth >= 0 ? (
      <TrendingUpIcon className="w-4 h-4 text-green-600" />
    ) : (
      <TrendingDownIcon className="w-4 h-4 text-red-600" />
    )
  }

  const getGrowthColor = (growth: number) => {
    return growth >= 0 ? 'text-green-600' : 'text-red-600'
  }

  if (isLoading) {
    return (
      <AdminLayout>
        <div className="space-y-6">
          <div className="h-10 w-48 bg-surface-secondary rounded animate-pulse" />
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="bg-surface-secondary rounded-lg border border-border-primary p-6 animate-pulse">
                <div className="h-6 w-24 bg-surface-tertiary rounded mb-4" />
                <div className="h-8 w-32 bg-surface-tertiary rounded" />
              </div>
            ))}
          </div>
          <div className="bg-surface-secondary rounded-lg border border-border-primary p-6 animate-pulse">
            <div className="h-6 w-40 bg-surface-tertiary rounded mb-4" />
            <div className="space-y-2">
              {[...Array(6)].map((_, i) => (
                <div key={i} className="h-4 w-full bg-surface-tertiary rounded" />
              ))}
            </div>
          </div>
        </div>
      </AdminLayout>
    )
  }

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-text-primary">Business Analytics</h1>
            <p className="text-text-secondary mt-2">
              Comprehensive insights into your business performance
            </p>
          </div>
          <div className="flex items-center gap-3 mt-4 sm:mt-0">
            {/* Date Range Selector */}
            <select
              value={dateRanges.findIndex(r => r.start === selectedRange.start && r.end === selectedRange.end)}
              onChange={(e) => {
                const range = dateRanges[parseInt(e.target.value)]
                if (range) setSelectedRange(range)
              }}
              className="min-h-[44px] px-4 py-3 bg-surface-secondary border border-border-secondary rounded-md text-text-primary focus:border-brand-400 focus:outline-none focus:ring-2 focus:ring-brand-600/20 touch-manipulation"
            >
              {dateRanges.map((range, index) => (
                <option key={index} value={index}>{range.label}</option>
              ))}
            </select>
            
            <Button
              variant="outline"
              onClick={exportAnalytics}
              className="flex items-center gap-2"
            >
              <DownloadIcon className="w-4 h-4" />
              Export
            </Button>
            
            <Button
              variant="outline"
              onClick={loadAnalyticsData}
              className="flex items-center gap-2"
            >
              <RefreshCwIcon className="w-4 h-4" />
              Refresh
            </Button>
          </div>
        </div>

        {!analyticsData ? (
          <div className="bg-surface-secondary rounded-lg border border-border-primary p-6 text-center">
            <p className="text-text-secondary">No analytics available for the selected period.</p>
            <Button onClick={loadAnalyticsData} className="mt-4">Reload</Button>
          </div>
        ) : (
          <>
            {/* Key Metrics */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
              {/* Revenue */}
              <div className="bg-surface-secondary rounded-lg border border-border-primary p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-text-secondary text-sm font-medium">Revenue</p>
                    <p className="text-2xl font-bold text-text-primary">
                      {formatCurrency(analyticsData.revenue.this_month)}
                    </p>
                  </div>
                  <DollarSignIcon className="w-8 h-8 text-green-600" />
                </div>
                <div className="mt-4 flex items-center">
                  {getGrowthIcon(analyticsData.revenue.growth_percentage)}
                  <span className={`ml-2 text-sm font-medium ${getGrowthColor(analyticsData.revenue.growth_percentage)}`}>
                    {formatPercentage(analyticsData.revenue.growth_percentage)} from last month
                  </span>
                </div>
              </div>

              {/* Bookings */}
              <div className="bg-surface-secondary rounded-lg border border-border-primary p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-text-secondary text-sm font-medium">Bookings</p>
                    <p className="text-2xl font-bold text-text-primary">
                      {analyticsData.bookings.this_month}
                    </p>
                  </div>
                  <CalendarIcon className="w-8 h-8 text-blue-600" />
                </div>
                <div className="mt-4 flex items-center">
                  <span className="text-text-secondary text-sm">
                    {analyticsData.bookings.completion_rate.toFixed(1)}% completion rate
                  </span>
                </div>
              </div>

              {/* Customers */}
              <div className="bg-surface-secondary rounded-lg border border-border-primary p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-text-secondary text-sm font-medium">New Customers</p>
                    <p className="text-2xl font-bold text-text-primary">
                      {analyticsData.customers.new_this_month}
                    </p>
                  </div>
                  <UsersIcon className="w-8 h-8 text-purple-600" />
                </div>
                <div className="mt-4 flex items-center">
                  <span className="text-text-secondary text-sm">
                    {analyticsData.customers.retention_rate}% retention rate
                  </span>
                </div>
              </div>

              {/* Average Value */}
              <div className="bg-surface-secondary rounded-lg border border-border-primary p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-text-secondary text-sm font-medium">Avg. Booking Value</p>
                    <p className="text-2xl font-bold text-text-primary">
                      {formatCurrency(analyticsData.bookings.average_value)}
                    </p>
                  </div>
                  <TrendingUpIcon className="w-8 h-8 text-brand-purple" />
                </div>
                <div className="mt-4 flex items-center">
                  <span className="text-text-secondary text-sm">
                    {formatCurrency(analyticsData.revenue.daily_average)} daily average
                  </span>
                </div>
              </div>
            </div>

            {/* Revenue Trend */}
            <div className="bg-surface-secondary rounded-lg border border-border-primary p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-lg font-semibold text-text-primary">Revenue Trend</h2>
                <div className="flex items-center gap-4 text-sm">
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 bg-brand-purple rounded-full"></div>
                    <span className="text-text-secondary">Revenue</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
                    <span className="text-text-secondary">Bookings</span>
                  </div>
                </div>
              </div>
              
              {/* Simple chart representation */}
              <div className="space-y-4">
                {analyticsData.revenue.monthly_trend.map((item, index) => (
                  <div key={index} className="flex items-center justify-between py-2">
                    <span className="text-text-primary font-medium">{item.month}</span>
                    <div className="flex items-center gap-4">
                      <span className="text-brand-purple font-semibold">
                        {formatCurrency(item.revenue)}
                      </span>
                      <span className="text-blue-600">
                        {item.bookings} bookings
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Popular Services & Locations */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Popular Services */}
              <div className="bg-surface-secondary rounded-lg border border-border-primary p-6">
                <h2 className="text-lg font-semibold text-text-primary mb-6">Most Popular Services</h2>
                <div className="space-y-4">
                  {analyticsData.services.most_popular.map((service, index) => (
                    <div key={index} className="flex items-center justify-between p-3 bg-surface-primary rounded-lg">
                      <div className="flex items-center gap-3">
                        <div className="flex items-center justify-center w-8 h-8 bg-brand-purple/10 rounded-full text-brand-purple font-bold text-sm">
                          {index + 1}
                        </div>
                        <div>
                          <p className="font-medium text-text-primary">{service.name}</p>
                          <p className="text-text-secondary text-sm">{service.bookings} bookings</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="font-semibold text-text-primary">
                          {formatCurrency(service.revenue)}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Top Locations */}
              <div className="bg-surface-secondary rounded-lg border border-border-primary p-6">
                <h2 className="text-lg font-semibold text-text-primary mb-6">Top Service Areas</h2>
                <div className="space-y-4">
                  {analyticsData.locations.top_areas.map((area, index) => (
                    <div key={index} className="flex items-center justify-between p-3 bg-surface-primary rounded-lg">
                      <div className="flex items-center gap-3">
                        <MapPinIcon className="w-5 h-5 text-text-secondary" />
                        <div>
                          <p className="font-medium text-text-primary">{area.city}</p>
                          <p className="text-text-secondary text-sm">{area.bookings} bookings</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="font-semibold text-text-primary">
                          {formatCurrency(area.revenue)}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Performance Insights */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Booking Status Breakdown */}
              <div className="bg-surface-secondary rounded-lg border border-border-primary p-6">
                <h2 className="text-lg font-semibold text-text-primary mb-6">Booking Status</h2>
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-text-secondary">Completed</span>
                    <span className="font-semibold text-green-600">
                      {analyticsData.bookings.status_breakdown.completed}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-text-secondary">Confirmed</span>
                    <span className="font-semibold text-blue-600">
                      {analyticsData.bookings.status_breakdown.confirmed}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-text-secondary">Pending</span>
                    <span className="font-semibold text-yellow-600">
                      {analyticsData.bookings.status_breakdown.pending}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-text-secondary">Cancelled</span>
                    <span className="font-semibold text-red-600">
                      {analyticsData.bookings.status_breakdown.cancelled}
                    </span>
                  </div>
                </div>
              </div>

              {/* Busiest Days */}
              <div className="bg-surface-secondary rounded-lg border border-border-primary p-6">
                <h2 className="text-lg font-semibold text-text-primary mb-6">Busiest Days</h2>
                <div className="space-y-3">
                  {analyticsData.performance.busiest_days.map((day, index) => (
                    <div key={index} className="flex items-center justify-between">
                      <span className="text-text-secondary">{day.day}</span>
                      <span className="font-semibold text-text-primary">{day.bookings}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Performance Metrics */}
              <div className="bg-surface-secondary rounded-lg border border-border-primary p-6">
                <h2 className="text-lg font-semibold text-text-primary mb-6">Performance</h2>
                <div className="space-y-4">
                  <div>
                    <p className="text-text-secondary text-sm">Avg. Job Duration</p>
                    <p className="text-lg font-semibold text-text-primary">
                      {Math.round(analyticsData.performance.average_job_duration / 60)} hours
                    </p>
                  </div>
                  <div>
                    <p className="text-text-secondary text-sm">Customer Lifetime Value</p>
                    <p className="text-lg font-semibold text-text-primary">
                      {formatCurrency(analyticsData.customers.average_lifetime_value)}
                    </p>
                  </div>
                  <div>
                    <p className="text-text-secondary text-sm">Repeat Customer Rate</p>
                    <p className="text-lg font-semibold text-text-primary">
                      {analyticsData.customers.repeat_customer_rate}%
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </>
        )}
      </div>
    </AdminLayout>
  )
}

export default function AdminAnalyticsPageWithProtection() {
  return (
    <AdminRoute>
      <AdminAnalyticsPage />
    </AdminRoute>
  )
}