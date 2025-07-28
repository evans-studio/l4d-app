'use client'

import React from 'react'
import { Card, CardHeader, CardContent } from '@/components/ui/composites/Card'
import { Button } from '@/components/ui/primitives/Button'
import { 
  CalendarIcon, 
  UserIcon, 
  CheckCircleIcon, 
  XCircleIcon, 
  ClockIcon,
  DollarSignIcon,
  AlertCircleIcon,
  TrendingUpIcon
} from 'lucide-react'

interface ActivityItem {
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
}

interface RecentActivityProps {
  activities: ActivityItem[]
  loading?: boolean
  onViewAll?: () => void
  maxItems?: number
}

export function RecentActivity({
  activities,
  loading = false,
  onViewAll,
  maxItems = 10
}: RecentActivityProps) {
  const getActivityIcon = (type: ActivityItem['type']) => {
    switch (type) {
      case 'booking_created':
        return { icon: CalendarIcon, color: 'text-blue-500 bg-blue-50' }
      case 'booking_confirmed':
        return { icon: CheckCircleIcon, color: 'text-green-500 bg-green-50' }
      case 'booking_cancelled':
        return { icon: XCircleIcon, color: 'text-red-500 bg-red-50' }
      case 'customer_registered':
        return { icon: UserIcon, color: 'text-purple-500 bg-purple-50' }
      case 'payment_received':
        return { icon: DollarSignIcon, color: 'text-green-600 bg-green-50' }
      case 'service_completed':
        return { icon: TrendingUpIcon, color: 'text-brand-purple bg-brand-purple/10' }
      default:
        return { icon: AlertCircleIcon, color: 'text-gray-500 bg-gray-50' }
    }
  }

  const formatTimestamp = (timestamp: string) => {
    const date = new Date(timestamp)
    const now = new Date()
    const diffInMinutes = Math.floor((now.getTime() - date.getTime()) / (1000 * 60))
    
    if (diffInMinutes < 1) return 'Just now'
    if (diffInMinutes < 60) return `${diffInMinutes}m ago`
    
    const diffInHours = Math.floor(diffInMinutes / 60)
    if (diffInHours < 24) return `${diffInHours}h ago`
    
    const diffInDays = Math.floor(diffInHours / 24)
    if (diffInDays < 7) return `${diffInDays}d ago`
    
    return date.toLocaleDateString()
  }

  const displayedActivities = activities.slice(0, maxItems)

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold text-text-primary">Recent Activity</h3>
          {onViewAll && (
            <Button variant="outline" size="sm" onClick={onViewAll}>
              View All
            </Button>
          )}
        </div>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="space-y-4">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="flex items-start space-x-3 animate-pulse">
                <div className="w-10 h-10 bg-gray-200 rounded-full flex-shrink-0" />
                <div className="flex-1 space-y-2">
                  <div className="h-4 bg-gray-200 rounded w-3/4" />
                  <div className="h-3 bg-gray-200 rounded w-1/2" />
                </div>
                <div className="h-3 bg-gray-200 rounded w-16" />
              </div>
            ))}
          </div>
        ) : displayedActivities.length === 0 ? (
          <div className="text-center py-8">
            <ClockIcon className="w-12 h-12 text-text-muted mx-auto mb-4" />
            <p className="text-text-secondary">No recent activity</p>
          </div>
        ) : (
          <div className="space-y-4">
            {displayedActivities.map((activity, index) => {
              const { icon: Icon, color } = getActivityIcon(activity.type)
              
              return (
                <div key={activity.id} className="flex items-start space-x-3">
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 ${color}`}>
                    <Icon className="w-5 h-5" />
                  </div>
                  
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-text-primary">
                      {activity.title}
                    </p>
                    <p className="text-sm text-text-secondary">
                      {activity.description}
                    </p>
                    
                    {/* Metadata */}
                    {activity.metadata && (
                      <div className="mt-1 flex items-center space-x-4 text-xs text-text-muted">
                        {activity.metadata.customerName && (
                          <span>Customer: {activity.metadata.customerName}</span>
                        )}
                        {activity.metadata.bookingReference && (
                          <span>Ref: {activity.metadata.bookingReference}</span>
                        )}
                        {activity.metadata.serviceName && (
                          <span>Service: {activity.metadata.serviceName}</span>
                        )}
                        {activity.metadata.amount && (
                          <span className="text-green-600 font-medium">
                            £{activity.metadata.amount.toFixed(2)}
                          </span>
                        )}
                      </div>
                    )}
                  </div>
                  
                  <div className="flex-shrink-0 text-xs text-text-muted">
                    {formatTimestamp(activity.timestamp)}
                  </div>
                </div>
              )
            })}
            
            {activities.length > maxItems && (
              <div className="pt-4 border-t border-border-secondary">
                <p className="text-sm text-text-secondary text-center">
                  {activities.length - maxItems} more activities
                </p>
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  )
}