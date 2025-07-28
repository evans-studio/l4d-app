'use client'

import React from 'react'
import { Card, CardHeader, CardContent } from '@/components/ui/composites/Card'
import { 
  CalendarIcon, 
  DollarSignIcon, 
  UsersIcon, 
  TrendingUpIcon,
  ClockIcon,
  CheckCircleIcon,
  AlertCircleIcon,
  StarIcon
} from 'lucide-react'

interface QuickStatsProps {
  stats: {
    todayBookings: number
    todayRevenue: number
    activeCustomers: number
    completionRate: number
    pendingBookings: number
    avgRating: number
    totalServices: number
    responseTime: string
  }
  loading?: boolean
}

export function QuickStats({ stats, loading = false }: QuickStatsProps) {
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-GB', {
      style: 'currency',
      currency: 'GBP'
    }).format(amount)
  }

  const statItems = [
    {
      label: "Today's Bookings",
      value: stats.todayBookings,
      icon: CalendarIcon,
      color: 'text-blue-500',
      bgColor: 'bg-blue-50'
    },
    {
      label: "Today's Revenue",
      value: formatCurrency(stats.todayRevenue),
      icon: DollarSignIcon,
      color: 'text-green-500',
      bgColor: 'bg-green-50'
    },
    {
      label: 'Active Customers',
      value: stats.activeCustomers,
      icon: UsersIcon,
      color: 'text-purple-500',
      bgColor: 'bg-purple-50'
    },
    {
      label: 'Completion Rate',
      value: `${stats.completionRate}%`,
      icon: TrendingUpIcon,
      color: 'text-brand-purple',
      bgColor: 'bg-brand-purple/10'
    },
    {
      label: 'Pending Bookings',
      value: stats.pendingBookings,
      icon: ClockIcon,
      color: 'text-yellow-500',
      bgColor: 'bg-yellow-50'
    },
    {
      label: 'Average Rating',
      value: `${stats.avgRating}/5`,
      icon: StarIcon,
      color: 'text-amber-500',
      bgColor: 'bg-amber-50'
    },
    {
      label: 'Total Services',
      value: stats.totalServices,
      icon: CheckCircleIcon,
      color: 'text-emerald-500',
      bgColor: 'bg-emerald-50'
    },
    {
      label: 'Avg Response Time',
      value: stats.responseTime,
      icon: AlertCircleIcon,
      color: 'text-indigo-500',
      bgColor: 'bg-indigo-50'
    }
  ]

  return (
    <Card>
      <CardHeader>
        <h3 className="text-lg font-semibold text-text-primary">Quick Stats</h3>
        <p className="text-sm text-text-secondary">Real-time business metrics overview</p>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="animate-pulse">
                <div className="flex items-center space-x-3 p-3 rounded-lg bg-surface-hover">
                  <div className="w-10 h-10 bg-gray-200 rounded-full" />
                  <div className="flex-1 space-y-2">
                    <div className="h-3 bg-gray-200 rounded w-3/4" />
                    <div className="h-4 bg-gray-200 rounded w-1/2" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {statItems.map((stat, index) => {
              const Icon = stat.icon
              
              return (
                <div
                  key={index}
                  className="flex items-center space-x-3 p-3 rounded-lg bg-surface-hover hover:bg-surface-secondary transition-colors cursor-pointer"
                >
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center ${stat.bgColor}`}>
                    <Icon className={`w-5 h-5 ${stat.color}`} />
                  </div>
                  
                  <div className="flex-1 min-w-0">
                    <p className="text-xs text-text-secondary font-medium">
                      {stat.label}
                    </p>
                    <p className="text-sm font-bold text-text-primary truncate">
                      {stat.value}
                    </p>
                  </div>
                </div>
              )
            })}
          </div>
        )}
        
        {/* Additional insights */}
        <div className="mt-6 pt-4 border-t border-border-secondary">
          <div className="flex items-center justify-between text-sm">
            <span className="text-text-secondary">System Status</span>
            <div className="flex items-center space-x-2">
              <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
              <span className="text-green-600 font-medium">All systems operational</span>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}