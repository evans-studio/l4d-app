'use client'

import React, { useState } from 'react'
import { Card, CardHeader, CardContent } from '@/components/ui/composites/Card'
import { Button } from '@/components/ui/primitives/Button'
import { 
  TrendingUpIcon, 
  TrendingDownIcon, 
  DollarSignIcon,
  CalendarIcon,
  UsersIcon,
  StarIcon
} from 'lucide-react'

interface TrendData {
  period: string
  revenue: number
  bookings: number
  customers: number
  rating: number
}

interface PerformanceTrendsProps {
  data: TrendData[]
  loading?: boolean
  period: 'week' | 'month' | 'quarter' | 'year'
  onPeriodChange?: (period: 'week' | 'month' | 'quarter' | 'year') => void
}

export function PerformanceTrends({
  data,
  loading = false,
  period,
  onPeriodChange
}: PerformanceTrendsProps) {
  const [selectedMetric, setSelectedMetric] = useState<'revenue' | 'bookings' | 'customers' | 'rating'>('revenue')

  const getMetricData = () => {
    return data.map(item => ({
      label: item.period,
      value: item[selectedMetric],
      color: selectedMetric === 'revenue' ? 'bg-green-500' : 
             selectedMetric === 'bookings' ? 'bg-blue-500' :
             selectedMetric === 'customers' ? 'bg-purple-500' : 'bg-yellow-500'
    }))
  }

  const calculateTrend = (values: number[]) => {
    if (values.length < 2) return { percentage: 0, direction: 'neutral' as const }
    
    const current = values[values.length - 1] || 0
    const previous = values[values.length - 2] || 0
    
    if (previous === 0) return { percentage: 0, direction: 'neutral' as const }
    
    const percentage = ((current - previous) / previous) * 100
    const direction = percentage > 0 ? 'up' : percentage < 0 ? 'down' : 'neutral'
    
    return { percentage: Math.abs(percentage), direction }
  }

  const formatValue = (value: number, metric: string) => {
    switch (metric) {
      case 'revenue':
        return new Intl.NumberFormat('en-GB', {
          style: 'currency',
          currency: 'GBP'
        }).format(value)
      case 'rating':
        return `${value.toFixed(1)}/5`
      default:
        return value.toLocaleString()
    }
  }

  const metricData = getMetricData()
  const values = data.map(item => item[selectedMetric])
  const trend = calculateTrend(values)
  const maxValue = Math.max(...values)
  const currentValue = values[values.length - 1] || 0

  const metrics = [
    {
      key: 'revenue' as const,
      label: 'Revenue',
      icon: DollarSignIcon,
      color: 'text-green-500',
      bgColor: 'bg-green-50'
    },
    {
      key: 'bookings' as const,
      label: 'Bookings',
      icon: CalendarIcon,
      color: 'text-blue-500',
      bgColor: 'bg-blue-50'
    },
    {
      key: 'customers' as const,
      label: 'Customers',
      icon: UsersIcon,
      color: 'text-purple-500',
      bgColor: 'bg-purple-50'
    },
    {
      key: 'rating' as const,
      label: 'Rating',
      icon: StarIcon,
      color: 'text-yellow-500',
      bgColor: 'bg-yellow-50'
    }
  ]

  const periods = [
    { key: 'week' as const, label: 'Week' },
    { key: 'month' as const, label: 'Month' },
    { key: 'quarter' as const, label: 'Quarter' },
    { key: 'year' as const, label: 'Year' }
  ]

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold text-text-primary">Performance Trends</h3>
          <div className="flex items-center space-x-2">
            {periods.map(p => (
              <Button
                key={p.key}
                variant={period === p.key ? 'primary' : 'outline'}
                size="sm"
                onClick={() => onPeriodChange?.(p.key)}
              >
                {p.label}
              </Button>
            ))}
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="space-y-6">
            <div className="flex space-x-4">
              {Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="flex-1 h-16 bg-gray-200 rounded animate-pulse" />
              ))}
            </div>
            <div className="h-64 bg-gray-200 rounded animate-pulse" />
          </div>
        ) : (
          <div className="space-y-6">
            {/* Metric selector */}
            <div className="grid grid-cols-4 gap-3">
              {metrics.map(metric => {
                const Icon = metric.icon
                const isSelected = selectedMetric === metric.key
                
                return (
                  <button
                    key={metric.key}
                    onClick={() => setSelectedMetric(metric.key)}
                    className={`p-3 rounded-lg border transition-all text-left ${
                      isSelected
                        ? 'border-brand-purple bg-brand-purple/5'
                        : 'border-border-secondary hover:border-border-hover hover:bg-surface-hover'
                    }`}
                  >
                    <div className="flex items-center space-x-2 mb-2">
                      <div className={`p-1 rounded ${metric.bgColor}`}>
                        <Icon className={`w-4 h-4 ${metric.color}`} />
                      </div>
                      <span className="text-sm font-medium text-text-primary">
                        {metric.label}
                      </span>
                    </div>
                    <div className="text-xs text-text-secondary">
                      Current: {formatValue(currentValue, metric.key)}
                    </div>
                  </button>
                )
              })}
            </div>

            {/* Trend indicator */}
            <div className="flex items-center justify-between p-4 bg-surface-hover rounded-lg">
              <div>
                <h4 className="font-semibold text-text-primary">
                  Current {metrics.find(m => m.key === selectedMetric)?.label}
                </h4>
                <p className="text-2xl font-bold text-text-primary mt-1">
                  {formatValue(currentValue, selectedMetric)}
                </p>
              </div>
              
              <div className={`flex items-center space-x-2 ${
                trend.direction === 'up' ? 'text-green-600' :
                trend.direction === 'down' ? 'text-red-600' : 'text-gray-600'
              }`}>
                {trend.direction === 'up' && <TrendingUpIcon className="w-5 h-5" />}
                {trend.direction === 'down' && <TrendingDownIcon className="w-5 h-5" />}
                <span className="font-semibold">
                  {trend.percentage.toFixed(1)}%
                </span>
                <span className="text-text-secondary text-sm">
                  vs last {period}
                </span>
              </div>
            </div>

            {/* Chart */}
            <div className="space-y-4">
              <h4 className="font-medium text-text-primary">
                {metrics.find(m => m.key === selectedMetric)?.label} Over Time
              </h4>
              
              {metricData.length === 0 ? (
                <div className="text-center py-8">
                  <p className="text-text-secondary">No data available</p>
                </div>
              ) : (
                <div className="h-48 flex items-end justify-between gap-2">
                  {metricData.map((item, index) => {
                    const heightPercent = maxValue > 0 ? (item.value / maxValue) * 100 : 0
                    
                    return (
                      <div key={index} className="flex flex-col items-center flex-1">
                        <div className="w-full flex flex-col items-center justify-end h-full">
                          <span className="text-xs text-text-secondary mb-1">
                            {formatValue(item.value, selectedMetric)}
                          </span>
                          <div
                            className={`w-full rounded-t transition-all duration-500 hover:opacity-80 cursor-pointer ${
                              metrics.find(m => m.key === selectedMetric)?.color.replace('text-', 'bg-')
                            }`}
                            style={{ 
                              height: `${heightPercent}%`, 
                              minHeight: item.value > 0 ? '8px' : '0px' 
                            }}
                            title={`${item.label}: ${formatValue(item.value, selectedMetric)}`}
                          />
                        </div>
                        <span className="text-xs text-text-secondary mt-2 truncate w-full text-center">
                          {item.label}
                        </span>
                      </div>
                    )
                  })}
                </div>
              )}
            </div>

            {/* Summary insights */}
            <div className="pt-4 border-t border-border-secondary">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-text-secondary">Best Period:</span>
                  <span className="ml-2 font-medium text-text-primary">
                    {data.reduce((best, current) => 
                      (current[selectedMetric] as number) > (best[selectedMetric] as number) ? current : best, 
                      data[0] || { period: 'N/A', revenue: 0, bookings: 0, customers: 0, rating: 0 }
                    ).period}
                  </span>
                </div>
                <div>
                  <span className="text-text-secondary">Average:</span>
                  <span className="ml-2 font-medium text-text-primary">
                    {formatValue(
                      values.reduce((sum, val) => sum + val, 0) / values.length || 0,
                      selectedMetric
                    )}
                  </span>
                </div>
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}