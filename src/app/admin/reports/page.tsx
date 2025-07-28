'use client'

import { useState, useEffect, useCallback } from 'react'
import { AdminLayout } from '@/components/layouts/AdminLayout'
import { Card, CardHeader, CardContent } from '@/components/ui/composites/Card'
import { Button } from '@/components/ui/primitives/Button'
import { 
  TrendingUpIcon, 
  DollarSignIcon, 
  UsersIcon,
  CalendarIcon,
  DownloadIcon,
  RefreshCwIcon
} from 'lucide-react'

interface ReportData {
  revenue: {
    total: number
    monthly: number
    weekly: number
    daily: number
    growth: number
  }
  bookings: {
    total: number
    pending: number
    confirmed: number
    completed: number
    cancelled: number
  }
  customers: {
    total: number
    active: number
    new: number
    retention: number
  }
  services: {
    popular: Array<{ name: string; count: number; revenue: number }>
    performance: Array<{ name: string; avgRating: number; totalBookings: number }>
  }
}

export default function ReportsPage() {
  const [reportData, setReportData] = useState<ReportData | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState('')
  const [dateRange, setDateRange] = useState('month') // week, month, quarter, year
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null)

  const loadReportData = useCallback(async () => {
    try {
      setIsLoading(true)
      setError('')

      const response = await fetch(`/api/admin/reports?range=${dateRange}`)
      const data = await response.json()

      if (data.success) {
        setReportData(data.data)
        setLastUpdated(new Date())
      } else {
        setError(data.error?.message || 'Failed to load report data')
      }
    } catch (error) {
      console.error('Report data error:', error)
      setError('Failed to load report data')
    } finally {
      setIsLoading(false)
    }
  }, [dateRange])

  useEffect(() => {
    loadReportData()
  }, [dateRange, loadReportData])

  const exportReport = async (format: 'csv' | 'pdf') => {
    try {
      const response = await fetch(`/api/admin/reports/export?format=${format}&range=${dateRange}`)
      const data = await response.json()

      if (data.success) {
        // Create download link
        const link = document.createElement('a')
        link.href = data.data.downloadUrl
        link.download = `love4detailing-report-${dateRange}-${new Date().toISOString().split('T')[0]}.${format}`
        link.click()
      } else {
        setError(data.error?.message || 'Failed to export report')
      }
    } catch (error) {
      console.error('Export error:', error)
      setError('Failed to export report')
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

  if (isLoading && !reportData) {
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
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-text-primary">Business Reports</h1>
            <p className="text-text-secondary">
              Comprehensive analytics and insights for your detailing business
            </p>
            {lastUpdated && (
              <p className="text-sm text-text-muted mt-1">
                Last updated: {lastUpdated.toLocaleString()}
              </p>
            )}
          </div>
          <div className="flex items-center space-x-3">
            <select
              value={dateRange}
              onChange={(e) => setDateRange(e.target.value)}
              className="px-3 py-2 border border-border-secondary rounded-md text-sm"
            >
              <option value="week">This Week</option>
              <option value="month">This Month</option>
              <option value="quarter">This Quarter</option>
              <option value="year">This Year</option>
            </select>
            <Button
              variant="outline"
              onClick={loadReportData}
              disabled={isLoading}
              leftIcon={<RefreshCwIcon className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />}
            >
              Refresh
            </Button>
            <Button
              variant="outline"
              onClick={() => exportReport('csv')}
              leftIcon={<DownloadIcon className="w-4 h-4" />}
            >
              Export CSV
            </Button>
            <Button
              variant="primary"
              onClick={() => exportReport('pdf')}
              leftIcon={<DownloadIcon className="w-4 h-4" />}
            >
              Export PDF
            </Button>
          </div>
        </div>

        {error && (
          <div className="p-4 bg-red-50 border border-red-200 rounded-lg text-red-800">
            {error}
          </div>
        )}

        {/* Key Metrics */}
        {reportData && (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-text-secondary text-sm font-medium">Total Revenue</p>
                      <p className="text-2xl font-bold text-text-primary">
                        {formatCurrency(reportData.revenue.total)}
                      </p>
                      <p className={`text-sm mt-1 ${reportData.revenue.growth >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                        {formatPercentage(reportData.revenue.growth)} from last period
                      </p>
                    </div>
                    <DollarSignIcon className="w-8 h-8 text-green-600" />
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-text-secondary text-sm font-medium">Total Bookings</p>
                      <p className="text-2xl font-bold text-text-primary">{reportData.bookings.total}</p>
                      <p className="text-sm text-text-secondary mt-1">
                        {reportData.bookings.completed} completed
                      </p>
                    </div>
                    <CalendarIcon className="w-8 h-8 text-brand-purple" />
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-text-secondary text-sm font-medium">Active Customers</p>
                      <p className="text-2xl font-bold text-text-primary">{reportData.customers.active}</p>
                      <p className="text-sm text-text-secondary mt-1">
                        {reportData.customers.new} new this period
                      </p>
                    </div>
                    <UsersIcon className="w-8 h-8 text-blue-600" />
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-text-secondary text-sm font-medium">Customer Retention</p>
                      <p className="text-2xl font-bold text-text-primary">{reportData.customers.retention}%</p>
                      <p className="text-sm text-green-600 mt-1">
                        Strong retention rate
                      </p>
                    </div>
                    <TrendingUpIcon className="w-8 h-8 text-purple-600" />
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Revenue Breakdown */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <h2 className="text-lg font-semibold text-text-primary">Revenue Breakdown</h2>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex justify-between items-center">
                      <span className="text-text-secondary">Daily Average</span>
                      <span className="font-medium text-text-primary">
                        {formatCurrency(reportData.revenue.daily)}
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-text-secondary">Weekly Total</span>
                      <span className="font-medium text-text-primary">
                        {formatCurrency(reportData.revenue.weekly)}
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-text-secondary">Monthly Total</span>
                      <span className="font-medium text-text-primary">
                        {formatCurrency(reportData.revenue.monthly)}
                      </span>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <h2 className="text-lg font-semibold text-text-primary">Booking Status</h2>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex justify-between items-center">
                      <span className="text-text-secondary">Pending</span>
                      <span className="px-2 py-1 bg-yellow-100 text-yellow-800 rounded-full text-sm">
                        {reportData.bookings.pending}
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-text-secondary">Confirmed</span>
                      <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded-full text-sm">
                        {reportData.bookings.confirmed}
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-text-secondary">Completed</span>
                      <span className="px-2 py-1 bg-green-100 text-green-800 rounded-full text-sm">
                        {reportData.bookings.completed}
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-text-secondary">Cancelled</span>
                      <span className="px-2 py-1 bg-red-100 text-red-800 rounded-full text-sm">
                        {reportData.bookings.cancelled}
                      </span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Popular Services */}
            <Card>
              <CardHeader>
                <h2 className="text-lg font-semibold text-text-primary">Popular Services</h2>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b border-border-secondary">
                        <th className="text-left py-3 px-4 font-medium text-text-secondary">Service</th>
                        <th className="text-left py-3 px-4 font-medium text-text-secondary">Bookings</th>
                        <th className="text-left py-3 px-4 font-medium text-text-secondary">Revenue</th>
                        <th className="text-left py-3 px-4 font-medium text-text-secondary">Performance</th>
                      </tr>
                    </thead>
                    <tbody>
                      {reportData.services.popular.map((service, index) => (
                        <tr key={index} className="border-b border-border-secondary">
                          <td className="py-3 px-4 font-medium text-text-primary">{service.name}</td>
                          <td className="py-3 px-4 text-text-secondary">{service.count}</td>
                          <td className="py-3 px-4 text-text-secondary">{formatCurrency(service.revenue)}</td>
                          <td className="py-3 px-4">
                            <div className="w-full bg-gray-200 rounded-full h-2">
                              <div 
                                className="bg-brand-purple h-2 rounded-full" 
                                style={{ width: `${(service.count / (reportData.services.popular[0]?.count || 1)) * 100}%` }}
                              ></div>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>

            {/* Summary Note */}
            <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
              <p className="text-blue-800 text-sm">
                <strong>Note:</strong> This report shows data for the selected {dateRange} period. 
                Export functionality allows you to save detailed reports with additional metrics 
                and customer information for further analysis.
              </p>
            </div>
          </>
        )}
      </div>
    </AdminLayout>
  )
}